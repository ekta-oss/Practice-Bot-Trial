// Measures every course voice file and writes src/content/voiceTiming.json:
//  - where each text piece starts (the line split at . ! ? , ; : and dashes), found from the
//    pauses in the audio and matched to the words, so subtitles change when the words are said;
//  - for the person in charge, a loudness curve (30 a second) that moves her lips.
// Run after any voice file changes:   npx tsx scripts/analyze-voice.mts
// The audio is decoded by a headless browser (the same decoder the course uses).
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { S1_1, S1_2, S1_3, S1_4, S1_5, S1_6, type Line } from "../src/content/segment1";
import { SPOKEN_UI } from "../src/content/spokenUi";
import { uiLine } from "../src/lib/uiAudio";
import { textPieces, type VoiceTiming } from "../src/lib/voiceTiming";

const ROOT = path.resolve(import.meta.dirname, "..");
const AUDIO = path.join(ROOT, "public", "media", "audio");
const OUT = path.join(ROOT, "src", "content", "voiceTiming.json");
const FPS = 100; // analysis frames a second
const VERBOSE = process.argv.includes("--report");

const scriptLines = [S1_1, S1_2, S1_3, S1_4, S1_5, S1_6].flatMap((o) =>
  Object.values(o).filter((v): v is Line => typeof v === "object" && v !== null && "file" in v && "role" in v),
);
const lines: Line[] = [...scriptLines, ...SPOKEN_UI.map(uiLine)];

const browser = await chromium.launch();
const page = await browser.newPage();

/** Loudness (RMS) of each 10 ms frame, and the length in seconds. */
async function measure(file: string): Promise<{ env: number[]; d: number }> {
  const b64 = fs.readFileSync(path.join(AUDIO, file)).toString("base64");
  return page.evaluate(
    async ({ b64, fps }) => {
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      const buf = await new OfflineAudioContext(1, 1, 44100).decodeAudioData(bytes.buffer);
      const x = buf.getChannelData(0);
      const step = Math.round(buf.sampleRate / fps);
      const env: number[] = [];
      for (let i = 0; i < x.length; i += step) {
        let s = 0;
        const end = Math.min(x.length, i + step);
        for (let j = i; j < end; j++) s += x[j] * x[j];
        env.push(Math.sqrt(s / (end - i)));
      }
      return { env, d: buf.duration };
    },
    { b64, fps: FPS },
  );
}

/** Rough syllable count: how long a piece of text takes to say. */
const syllables = (t: string) =>
  t
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .reduce((n, w) => n + (/^\d+$/.test(w) ? 2 : Math.max(1, (w.replace(/e$/, "").match(/[aeiouy]+/g) ?? []).length)), 0);

function align(env: number[], text: string): { starts: number[]; speech: boolean[] } {
  const sorted = [...env].sort((a, b) => a - b);
  const loud = sorted[Math.floor(sorted.length * 0.95)] || 1;
  const thr = loud * 0.08;
  const speech = env.map((v) => v > thr);
  // Close tiny holes (< 60 ms) inside words; drop tiny blips (< 40 ms).
  const runs = (want: boolean, max: number) => {
    let i = 0;
    while (i < speech.length) {
      if (speech[i] !== want) {
        i++;
        continue;
      }
      let j = i;
      while (j < speech.length && speech[j] === want) j++;
      if (j - i < max && i > 0 && j < speech.length) for (let k = i; k < j; k++) speech[k] = !want;
      i = j;
    }
  };
  runs(false, 6);
  runs(true, 4);
  const onset = speech.indexOf(true);
  const end = speech.lastIndexOf(true);
  const pieces = textPieces(text);
  if (onset < 0) return { starts: pieces.map(() => 0), speech };

  // Pauses (>= 70 ms) inside the speech, as candidate piece boundaries.
  const gaps: { at: number; len: number; spoken: number }[] = [];
  let spoken = 0;
  for (let i = onset; i <= end; ) {
    if (speech[i]) {
      spoken++;
      i++;
      continue;
    }
    let j = i;
    while (j <= end && !speech[j]) j++;
    if (j - i >= 7) gaps.push({ at: j, len: (j - i) / FPS, spoken });
    i = j;
  }
  const totalSpoken = spoken;

  // Where each boundary should fall, by the share of syllables spoken before it.
  const w = pieces.map(syllables);
  const W = w.reduce((a, b) => a + b, 0);
  const expect: number[] = [];
  let acc = 0;
  for (let k = 0; k < pieces.length - 1; k++) {
    acc += w[k];
    expect.push((acc / W) * totalSpoken);
  }

  // Choose one pause per boundary, in order: close to where it should be, longer pauses preferred.
  // A boundary with no pause near enough is placed at its expected point.
  type Cand = { at: number; spoken: number; len: number; virtual: boolean };
  const atSpoken = (target: number) => {
    let n = 0;
    for (let i = onset; i <= end; i++) if (speech[i] && ++n >= target) return i;
    return end;
  };
  const cands: Cand[] = [...gaps.map((g) => ({ ...g, virtual: false })), ...expect.map((e) => ({ at: atSpoken(e), spoken: e, len: 0, virtual: true }))].sort((a, b) => a.at - b.at);
  const cost = (k: number, c: Cand) => Math.abs(c.spoken - expect[k]) / FPS - Math.min(c.len, 0.45) * 0.8 + (c.virtual ? 0.35 : 0);
  const K = expect.length;
  const best: number[][] = Array.from({ length: K }, () => cands.map(() => Infinity));
  const from: number[][] = Array.from({ length: K }, () => cands.map(() => -1));
  for (let k = 0; k < K; k++)
    for (let j = 0; j < cands.length; j++) {
      const c = cost(k, cands[j]);
      if (k === 0) best[0][j] = c;
      else
        for (let i = 0; i < j; i++)
          if (cands[i].at < cands[j].at && best[k - 1][i] + c < best[k][j]) {
            best[k][j] = best[k - 1][i] + c;
            from[k][j] = i;
          }
    }
  const starts = [Math.max(0, onset - 2) / FPS];
  if (K) {
    let j = best[K - 1].indexOf(Math.min(...best[K - 1]));
    const picks: number[] = [];
    for (let k = K - 1; k >= 0; k--) {
      picks.unshift(cands[j].at);
      j = from[k][j];
    }
    for (const p of picks) starts.push(Math.max(0, p - 2) / FPS);
  }
  return { starts, speech };
}

/** Loudness curve for the lips: 30 a second, 0–35, quiet frames 0. */
function envelope(env: number[]): string {
  const step = FPS / 30;
  const out: number[] = [];
  for (let i = 0; i < env.length; i += step) out.push(Math.max(...env.slice(Math.floor(i), Math.floor(i + step))));
  const sorted = [...out].sort((a, b) => a - b);
  const loud = sorted[Math.floor(sorted.length * 0.95)] || 1;
  return out.map((v) => Math.round(Math.min(1, Math.max(0, (v / loud - 0.08) / 0.92)) * 35).toString(36)).join("");
}

const result: Record<string, VoiceTiming> = {};
for (const l of lines) {
  if (!fs.existsSync(path.join(AUDIO, l.file))) continue;
  const { env, d } = await measure(l.file);
  const { starts } = align(env, l.text);
  const t: VoiceTiming = { d: +d.toFixed(2), p: starts.map((s) => +s.toFixed(2)) };
  if (l.role === "PIC") t.e = envelope(env);
  result[l.file] = t;
  if (VERBOSE || l.role === "PIC") {
    console.log(`\n${l.file} (${t.d}s)`);
    textPieces(l.text).forEach((p, i) => console.log(`  ${t.p[i].toFixed(2).padStart(5)}s  ${p}`));
  }
}
await browser.close();
fs.writeFileSync(OUT, JSON.stringify(result) + "\n");
console.log(`\n${Object.keys(result).length} voice files measured → src/content/voiceTiming.json`);
