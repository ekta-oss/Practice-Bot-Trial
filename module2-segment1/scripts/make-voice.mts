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
const TARGET_WPM = 140; // lively but easy to follow for Level 1 learners
const VOICE: Record<Line["role"], string> = { NAR: "af_heart", PIC: "af_bella", MOD: "af_nicole" };

const scriptLines = [S1_1, S1_2, S1_3, S1_4, S1_5, S1_6].flatMap((o) =>
  Object.values(o).filter((v): v is Line => typeof v === "object" && v !== null && "file" in v && "role" in v),
);
const lines: Line[] = [...scriptLines, ...SPOKEN_UI.map(uiLine)];

/** Text as it should be spoken: no curly quotes, dashes read as pauses, "Red = …" read as "Red: …". */
const speakable = (t: string) =>
  t
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s*—\s*/g, ", ")
    .replace(/…/g, "...")
    .replace(/\s=\s/g, ": ");

const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

function polish(samples: Float32Array, rate: number): Float32Array {
  // Trim silence at both ends (keep 0.12 s of air), then even out loudness.
  const thr = 0.01;
  let a = samples.findIndex((v) => Math.abs(v) > thr);
  let b = samples.length - 1;
  while (b > 0 && Math.abs(samples[b]) <= thr) b--;
  if (a < 0) a = 0;
  const pad = Math.round(rate * 0.12);
  const s = samples.slice(Math.max(0, a - pad), Math.min(samples.length, b + pad));
  let sum = 0;
  let peak = 0;
  for (const v of s) {
    sum += v * v;
    peak = Math.max(peak, Math.abs(v));
  }
  const rms = Math.sqrt(sum / s.length) || 1;
  const gain = Math.min(0.12 / rms, 0.95 / (peak || 1)); // ~-18 dBFS RMS, never clipping
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

// Calibrate each voice's speed to TARGET_WPM.
const CAL = "Walk round and get to know your new workplace. Look out for signs on the walls, the doors and the floor.";
const speed: Record<string, number> = {};
for (const v of new Set(Object.values(VOICE))) {
  const a = await tts.generate(CAL, { voice: v as never, speed: 1 });
  const sec = polish(a.audio, a.sampling_rate).length / a.sampling_rate;
  speed[v] = +((TARGET_WPM / ((words(CAL) / sec) * 60))).toFixed(2);
}
console.log("speeds", speed);

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith(".mp3")) fs.rmSync(path.join(OUT, f)); // fresh set

const report: { file: string; role: string; voice: string; seconds: number; wpm: number; text: string }[] = [];
for (const [i, l] of lines.entries()) {
  const voice = VOICE[l.role];
  const a = await tts.generate(speakable(l.text), { voice: voice as never, speed: speed[voice] });
  const s = polish(a.audio, a.sampling_rate);
  fs.writeFileSync(path.join(OUT, l.file), toMp3(s, a.sampling_rate));
  const seconds = s.length / a.sampling_rate;
  report.push({ file: l.file, role: l.role, voice, seconds: +seconds.toFixed(1), wpm: Math.round((words(l.text) / seconds) * 60), text: l.text });
  console.log(`${i + 1}/${lines.length} ${l.file} ${seconds.toFixed(1)}s`);
}

fs.writeFileSync(
  path.join(OUT, "INTERIM_AUDIO.md"),
  `# Interim course audio (computer voice)

${report.length} MP3s made with **Kokoro** (open-source neural text-to-speech, Apache-2.0) by \`scripts/make-voice.ts\`:
${scriptLines.length} lines named in the production script, and ${report.length - scriptLines.length} on-screen instructions and feedback lines (\`M2_UI_…\`).
Voices: narrator \`${VOICE.NAR}\`, person in charge \`${VOICE.PIC}\`. Pace about ${TARGET_WPM} words per minute; loudness evened out.

They are **stand-ins**, not the recordings the script asks for (person in charge: “calm, kind, firm; clear Indian English”).
To replace one, drop the recorded file here with the same name.

| File | Role | Voice | Length | Pace | Text |
|---|---|---|---|---|---|
${report.map((r) => `| ${r.file} | ${r.role} | ${r.voice} | ${r.seconds} s | ${r.wpm} wpm | ${r.text.replace(/\|/g, "\\|")} |`).join("\n")}
`,
);
console.log(`done: ${report.length} files; pace ${Math.min(...report.map((r) => r.wpm))}–${Math.max(...report.map((r) => r.wpm))} wpm`);
