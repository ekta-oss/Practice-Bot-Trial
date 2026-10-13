// Makes the INTERIM course audio with Kokoro (open neural TTS, Apache-2.0, runs locally):
//  - the 14 NAR/PIC lines named in the script (Stages 1.1–1.6)
//  - every on-screen instruction and feedback line in src/content/spokenUi.ts
// Output: public/media/audio/*.mp3 + INTERIM_AUDIO.md.  Replace any file with the
// voice artist's recording of the same name.        npx tsx scripts/make-voice.mts
import fs from "node:fs";
import path from "node:path";
import { KokoroTTS } from "kokoro-js";
import { Mp3Encoder } from "@breezystack/lamejs";
import { S1_1, S1_2, S1_3, S1_4, S1_5, S1_6, type Line } from "../src/content/segment1";
import { SPOKEN_UI } from "../src/content/spokenUi";
import { uiLine } from "../src/lib/uiAudio";

const OUT = path.resolve(import.meta.dirname, "..", "public", "media", "audio");

// Person in charge: female, energetic. Narrator: male, energetic yet firm (also reads instructions).
const VOICE: Record<Line["role"], string> = { PIC: "af_heart", NAR: "am_michael", MOD: "af_bella" };
// Speaking rate while talking (pauses come on top). Steady: one speed per voice for every line.
const TARGET_WPM: Record<Line["role"], number> = { PIC: 150, NAR: 140, MOD: 140 };
// Pauses between phrases, in seconds.
const PAUSE = { sentence: 0.45, exclaim: 0.4, question: 0.45, dash: 0.28, colon: 0.25 };

const scriptLines = [S1_1, S1_2, S1_3, S1_4, S1_5, S1_6].flatMap((o) =>
  Object.values(o).filter((v): v is Line => typeof v === "object" && v !== null && "file" in v && "role" in v),
);
const lines: Line[] = [...scriptLines, ...SPOKEN_UI.map(uiLine)];

const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

/** Text as it should be spoken: plain quotes; "Red = …" read as "Red: …". */
const speakable = (t: string) =>
  t
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, "...")
    .replace(/\s=\s/g, ": ");

/**
 * Splits a line into phrases at sentence ends, dashes and colons, each with the
 * pause that should follow it. Voicing phrase by phrase keeps one steady pace
 * and puts the pauses where a speaker would breathe.
 */
function phrases(text: string): { text: string; pause: number }[] {
  const out: { text: string; pause: number }[] = [];
  const re = /([^.!?—:]+(?:[.!?]+|—|:|$))\s*/g;
  for (const m of speakable(text).matchAll(re)) {
    let t = m[1].trim();
    if (!t || /^[\s.,!?:]*$/.test(t)) continue;
    let pause = PAUSE.sentence;
    if (t.endsWith("—")) {
      pause = PAUSE.dash;
      t = t.slice(0, -1).trim() + ",";
    } else if (t.endsWith(":")) pause = PAUSE.colon;
    else if (t.endsWith("!")) pause = PAUSE.exclaim;
    else if (t.endsWith("?")) pause = PAUSE.question;
    out.push({ text: t, pause });
  }
  return out.length ? out : [{ text: speakable(text), pause: 0 }];
}

/** Cuts the silence the voice engine leaves at both ends, keeping `air` seconds. */
function trim(samples: Float32Array, rate: number, air = 0.03): Float32Array {
  const thr = 0.01;
  const a = samples.findIndex((v) => Math.abs(v) > thr);
  let b = samples.length - 1;
  while (b > 0 && Math.abs(samples[b]) <= thr) b--;
  if (a < 0) return samples.slice(0, 0);
  const pad = Math.round(rate * air);
  return samples.slice(Math.max(0, a - pad), Math.min(samples.length, b + pad));
}

/** 0.12 s of air at each end, then even loudness (~-18 dBFS RMS, never clipping). */
function polish(samples: Float32Array, rate: number): Float32Array {
  const inner = trim(samples, rate, 0);
  const pad = Math.round(rate * 0.12);
  const s = new Float32Array(inner.length + 2 * pad);
  s.set(inner, pad);
  let sum = 0;
  let peak = 0;
  for (const v of inner) {
    sum += v * v;
    peak = Math.max(peak, Math.abs(v));
  }
  const rms = Math.sqrt(sum / (inner.length || 1)) || 1;
  const gain = Math.min(0.12 / rms, 0.95 / (peak || 1));
  for (let i = 0; i < s.length; i++) s[i] *= gain;
  return s;
}

function toMp3(samples: Float32Array, rate: number): Buffer {
  const pcm = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) pcm[i] = Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767)));
  const enc = new Mp3Encoder(1, rate, 96);
  const parts: Buffer[] = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const p = enc.encodeBuffer(pcm.subarray(i, i + 1152));
    if (p.length) parts.push(Buffer.from(p.buffer, p.byteOffset, p.length));
  }
  const end = enc.flush();
  if (end.length) parts.push(Buffer.from(end.buffer, end.byteOffset, end.length));
  return Buffer.concat(parts);
}

const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: "q8", device: "cpu" });

// Calibrate each role's voice speed to its speaking rate (measured on speech only, no pauses).
const CAL = "Walk round and get to know your new workplace, and look out for signs on the walls, the doors and the floor.";
const speed = {} as Record<Line["role"], number>;
for (const role of Object.keys(VOICE) as Line["role"][]) {
  const a = await tts.generate(CAL, { voice: VOICE[role] as never, speed: 1 });
  const sec = trim(a.audio, a.sampling_rate, 0).length / a.sampling_rate;
  speed[role] = +(TARGET_WPM[role] / ((words(CAL) / sec) * 60)).toFixed(2);
}
console.log("speeds", speed);

/** Voices a line phrase by phrase at one speed, joined with the planned pauses. */
async function voiceLine(l: Line): Promise<{ samples: Float32Array; rate: number }> {
  const parts: Float32Array[] = [];
  let rate = 24000;
  const ps = phrases(l.text);
  for (const [i, p] of ps.entries()) {
    const a = await tts.generate(p.text, { voice: VOICE[l.role] as never, speed: speed[l.role] });
    rate = a.sampling_rate;
    parts.push(trim(a.audio, rate));
    if (i < ps.length - 1) parts.push(new Float32Array(Math.round(rate * p.pause)));
  }
  const joined = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    joined.set(p, o);
    o += p.length;
  }
  return { samples: joined, rate };
}

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith(".mp3")) fs.rmSync(path.join(OUT, f)); // fresh set

const report: { file: string; role: string; voice: string; seconds: number; wpm: number; text: string }[] = [];
for (const [i, l] of lines.entries()) {
  const v = await voiceLine(l);
  const s = polish(v.samples, v.rate);
  fs.writeFileSync(path.join(OUT, l.file), toMp3(s, v.rate));
  const seconds = s.length / v.rate;
  report.push({ file: l.file, role: l.role, voice: VOICE[l.role], seconds: +seconds.toFixed(1), wpm: Math.round((words(l.text) / seconds) * 60), text: l.text });
  console.log(`${i + 1}/${lines.length} ${l.file} ${seconds.toFixed(1)}s`);
}

fs.writeFileSync(
  path.join(OUT, "INTERIM_AUDIO.md"),
  `# Interim course audio (computer voice)

${report.length} MP3s made with **Kokoro** (open-source neural text-to-speech, Apache-2.0) by \`scripts/make-voice.mts\`:
${scriptLines.length} lines named in the production script, and ${report.length - scriptLines.length} on-screen instructions and feedback lines (\`M2_UI_…\`).

Voices:
- **Person in charge** — \`${VOICE.PIC}\`, female, energetic; about ${TARGET_WPM.PIC} words per minute while speaking.
- **Narrator** — \`${VOICE.NAR}\`, male, energetic yet firm; about ${TARGET_WPM.NAR} words per minute. Also reads the instructions and feedback.

Each line is voiced phrase by phrase at one steady speed and joined with pauses (${PAUSE.sentence} s between sentences, ${PAUSE.dash} s at dashes, ${PAUSE.colon} s at colons). Loudness is evened out. The Pace column includes the pauses.

They are **stand-ins**, not the recordings the script asks for (person in charge: “calm, kind, firm; clear Indian English”).
To replace one, drop the recorded file here with the same name.

| File | Role | Voice | Length | Pace | Text |
|---|---|---|---|---|---|
${report.map((r) => `| ${r.file} | ${r.role} | ${r.voice} | ${r.seconds} s | ${r.wpm} wpm | ${r.text.replace(/\|/g, "\\|")} |`).join("\n")}
`,
);
console.log(`done: ${report.length} files; pace ${Math.min(...report.map((r) => r.wpm))}–${Math.max(...report.map((r) => r.wpm))} wpm`);
