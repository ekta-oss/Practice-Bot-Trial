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

// Usage:  npx tsx scripts/make-voice.mts                 all lines
//         npx tsx scripts/make-voice.mts --only=PIC      just the person in charge's lines
//         npx tsx scripts/make-voice.mts --samples       voice samples to choose from (voice-samples/)
//         --pic-voice=af_bella                            pick the person in charge's voice
//         --dtype=q8                                      smaller, faster model (lower quality); default fp32
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const ONLY = arg("only") as Line["role"] | undefined;
const SAMPLES = process.argv.includes("--samples");

// Person in charge: female, energetic and smiley. Narrator: male, energetic yet firm (also reads instructions).
const VOICE: Record<Line["role"], string> = { PIC: arg("pic-voice") ?? "af_heart", NAR: "am_michael", MOD: "af_bella" };
// Speaking rate while talking (pauses come on top). Steady: one speed per voice for every line.
const TARGET_WPM: Record<Line["role"], number> = { PIC: 155, NAR: 140, MOD: 140 };

/**
 * Voice styling. No pitch or EQ processing (it caused jitter); energy comes from pace and delivery:
 *  - wholeLine: voice the line in one natural pass (the person in charge) instead of phrase by phrase;
 *  - direction: greetings voiced as exclamations (audio only; on-screen text is unchanged).
 */
const STYLE: Record<Line["role"], { wholeLine: boolean; direction?: (t: string) => string }> = {
  PIC: {
    wholeLine: true,
    direction: (t) => t.replace(/\bWelcome\./g, "Welcome!").replace(/\bNice to meet you\./g, "Nice to meet you!"),
  },
  NAR: { wholeLine: false },
  MOD: { wholeLine: false },
};

// Pauses between phrases (narrator), in seconds.
const PAUSE = { sentence: 0.45, exclaim: 0.4, question: 0.45, dash: 0.28, colon: 0.25 };

const scriptLines = [S1_1, S1_2, S1_3, S1_4, S1_5, S1_6].flatMap((o) =>
  Object.values(o).filter((v): v is Line => typeof v === "object" && v !== null && "file" in v && "role" in v),
);
const lines: Line[] = [...scriptLines, ...SPOKEN_UI.map(uiLine)];

const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

/** 8 ms fade in/out so joined phrases never click. */
function fade(x: Float32Array, rate: number): Float32Array {
  const n = Math.min(Math.round(rate * 0.008), Math.floor(x.length / 2));
  for (let i = 0; i < n; i++) {
    const g = i / n;
    x[i] *= g;
    x[x.length - 1 - i] *= g;
  }
  return x;
}

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
function trim(samples: Float32Array, rate: number, air = 0.05): Float32Array {
  const thr = 0.005; // low, so soft word onsets and endings are kept
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

const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", { dtype: (arg("dtype") ?? "fp32") as "fp32", device: "cpu" });

// Calibrate each role's voice speed to its speaking rate (measured on speech only, no pauses).
const CAL = "Walk round and get to know your new workplace, and look out for signs on the walls, the doors and the floor.";
const speed = {} as Record<Line["role"], number>;
for (const role of Object.keys(VOICE) as Line["role"][]) {
  const a = await tts.generate(CAL, { voice: VOICE[role] as never, speed: 1 });
  const sec = trim(a.audio, a.sampling_rate, 0).length / a.sampling_rate;
  speed[role] = +(TARGET_WPM[role] / ((words(CAL) / sec) * 60)).toFixed(2);
}
console.log("speeds", speed);

/** Voices a line at one steady speed: whole (person in charge) or phrase by phrase with planned pauses. */
async function voiceLine(l: Line, voice = VOICE[l.role], spd = speed[l.role]): Promise<{ samples: Float32Array; rate: number }> {
  const style = STYLE[l.role];
  const parts: Float32Array[] = [];
  let rate = 24000;
  const text = style.direction ? style.direction(l.text) : l.text;
  // Whole line in one pass (natural flow, no joins), or phrase by phrase with planned pauses.
  const ps = style.wholeLine ? [{ text: speakable(text), pause: 0 }] : phrases(text);
  for (const [i, p] of ps.entries()) {
    const a = await tts.generate(p.text, { voice: voice as never, speed: spd });
    rate = a.sampling_rate;
    parts.push(fade(trim(a.audio, rate), rate));
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

if (SAMPLES) {
  // The person in charge's two lines in several female voices, same styling, to choose from.
  const dir = path.resolve(import.meta.dirname, "..", "voice-samples");
  fs.mkdirSync(dir, { recursive: true });
  const pic = scriptLines.filter((l) => l.role === "PIC");
  for (const v of ["af_heart", "af_bella", "af_nova", "af_sky", "af_jessica"]) {
    const a = await tts.generate(CAL, { voice: v as never, speed: 1 });
    const spd = +(TARGET_WPM.PIC / ((words(CAL) / (trim(a.audio, a.sampling_rate, 0).length / a.sampling_rate)) * 60)).toFixed(2);
    const chunks: Float32Array[] = [];
    let rate = 24000;
    for (const l of pic) {
      const r = await voiceLine(l, v, spd);
      rate = r.rate;
      chunks.push(polish(r.samples, rate), new Float32Array(Math.round(rate * 0.6)));
    }
    const all = new Float32Array(chunks.reduce((n, c) => n + c.length, 0));
    let o = 0;
    for (const c of chunks) {
      all.set(c, o);
      o += c.length;
    }
    fs.writeFileSync(path.join(dir, `person-in-charge_${v}.mp3`), toMp3(all, rate));
    console.log("sample", v);
  }
  process.exit(0);
}

fs.mkdirSync(OUT, { recursive: true });
// Fresh set (or just the chosen role's files with --only).
for (const l of lines) if (!ONLY || l.role === ONLY) fs.rmSync(path.join(OUT, l.file), { force: true });

const prev = new Map<string, { seconds: number; wpm: number }>();
const prevMd = path.join(OUT, "INTERIM_AUDIO.md");
if (ONLY && fs.existsSync(prevMd)) {
  for (const m of fs.readFileSync(prevMd, "utf8").matchAll(/^\| (\S+\.mp3) \| \w+ \| \S+ \| ([\d.]+) s \| (\d+) wpm/gm)) prev.set(m[1], { seconds: +m[2], wpm: +m[3] });
}

const report: { file: string; role: string; voice: string; seconds: number; wpm: number; text: string }[] = [];
for (const [i, l] of lines.entries()) {
  if (ONLY && l.role !== ONLY) {
    const p = prev.get(l.file);
    report.push({ file: l.file, role: l.role, voice: VOICE[l.role], seconds: p?.seconds ?? 0, wpm: p?.wpm ?? 0, text: l.text });
    continue;
  }
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
- **Person in charge** — \`${VOICE.PIC}\`, female, energetic and smiley: each line voiced in one natural pass at a brisk, steady pace, greetings voiced as exclamations (audio only); about ${TARGET_WPM.PIC} words per minute while speaking.
- **Narrator** — \`${VOICE.NAR}\`, male, energetic yet firm; about ${TARGET_WPM.NAR} words per minute. Also reads the instructions and feedback.

Narrator lines are voiced phrase by phrase at one steady speed and joined with pauses (${PAUSE.sentence} s between sentences, ${PAUSE.dash} s at dashes, ${PAUSE.colon} s at colons). Loudness is evened out. The Pace column includes the pauses.

They are **stand-ins**, not the recordings the script asks for (person in charge: “calm, kind, firm; clear Indian English”).
To replace one, drop the recorded file here with the same name.

| File | Role | Voice | Length | Pace | Text |
|---|---|---|---|---|---|
${report.map((r) => `| ${r.file} | ${r.role} | ${r.voice} | ${r.seconds} s | ${r.wpm} wpm | ${r.text.replace(/\|/g, "\\|")} |`).join("\n")}
`,
);
console.log(`done: ${report.length} files; pace ${Math.min(...report.map((r) => r.wpm))}–${Math.max(...report.map((r) => r.wpm))} wpm`);
