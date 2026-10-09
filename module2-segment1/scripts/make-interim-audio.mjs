// Makes INTERIM narration MP3s for every spoken line in Stages 1.1–1.6 with a
// built-in Windows voice, so the course plays sound before the voice artists'
// recordings arrive. Replace them by dropping the real files (same names) into
// public/media/audio/.  Windows only.   node scripts/make-interim-audio.mjs
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Mp3Encoder } from "@breezystack/lamejs";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "public", "media", "audio");
const content = fs.readFileSync(path.join(root, "src", "content", "segment1.ts"), "utf8");

const lines = [...content.matchAll(/\{ file: "(M2_[^"]+\.mp3)", role: "(\w+)", text: "((?:[^"\\]|\\.)*)", words: (\d+) \}/g)].map((m) => ({
  file: m[1],
  role: m[2],
  text: m[3].replace(/\\"/g, '"'),
  words: Number(m[4]),
}));
if (lines.length === 0) throw new Error("no lines found in segment1.ts");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "m2-audio-"));
const linesPath = path.join(tmp, "lines.json");
fs.writeFileSync(linesPath, "﻿" + JSON.stringify(lines), "utf8");
execFileSync("powershell", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(import.meta.dirname, "make-interim-audio.ps1"), linesPath, tmp, "-4"], { stdio: "inherit" });

fs.mkdirSync(outDir, { recursive: true });
const report = [];
for (const l of lines) {
  const wav = fs.readFileSync(path.join(tmp, l.file.replace(/\.mp3$/, ".wav")));
  const rate = wav.readUInt32LE(24);
  // PCM data starts after the "data" chunk header.
  const dataAt = wav.indexOf("data", 12) + 8;
  const all = new Int16Array(wav.buffer.slice(wav.byteOffset + dataAt, wav.byteOffset + wav.length - ((wav.length - dataAt) % 2)));
  // Trim the voice engine's silence at both ends, keeping 0.15 s of air.
  const loud = (v) => Math.abs(v) > 400;
  let a = all.findIndex(loud);
  let b = all.length - 1;
  while (b > 0 && !loud(all[b])) b--;
  const pad = Math.round(rate * 0.15);
  const samples = a < 0 ? all : all.subarray(Math.max(0, a - pad), Math.min(all.length, b + pad));
  const enc = new Mp3Encoder(1, rate, 64);
  const parts = [];
  for (let i = 0; i < samples.length; i += 1152) parts.push(enc.encodeBuffer(samples.subarray(i, i + 1152)));
  parts.push(enc.flush());
  fs.writeFileSync(path.join(outDir, l.file), Buffer.concat(parts.map((p) => Buffer.from(p.buffer, p.byteOffset, p.length))));
  const seconds = samples.length / rate;
  report.push({ file: l.file, role: l.role, seconds: +seconds.toFixed(1), wpm: Math.round((l.words / seconds) * 60) });
}
fs.rmSync(tmp, { recursive: true, force: true });

fs.writeFileSync(
  path.join(outDir, "INTERIM_AUDIO.md"),
  `# Interim narration (computer voice)

These ${report.length} MP3 files were made with built-in Windows voices by \`scripts/make-interim-audio.mjs\` so the course plays sound now. They are **not** the final recordings. The script asks for recorded voices: the person in charge speaks “calm, kind, firm; clear Indian English”, the narrator is a “warm, calm, encouraging coach”.

To replace one, drop the voice artist's file here with the same name.

| File | Voice role | Length | Pace |
|---|---|---|---|
${report.map((r) => `| ${r.file} | ${r.role} | ${r.seconds} s | ${r.wpm} wpm |`).join("\n")}
`,
);
console.table(report);
