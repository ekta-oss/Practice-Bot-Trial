// Makes the light background music loop (original, made here from code: no licence needed).
//   npx tsx scripts/make-music.mts   →  public/media/audio/M2_MUSIC_bed.mp3
// Warm, bright and unhurried: soft pad chords, a gentle marimba-like pattern, a
// round bass note and a very light shaker. 100 bpm, 16 bars (38.4 s), loops seamlessly.
// It is mixed quietly so it never competes with a voice; the course plays it lower still.
import fs from "node:fs";
import path from "node:path";
import { Mp3Encoder } from "@breezystack/lamejs";

const OUT = path.resolve(import.meta.dirname, "..", "public", "media", "audio", "M2_MUSIC_bed.mp3");
const RATE = 44100;
const BPM = 100;
const BEAT = 60 / BPM;
const BARS = 16;
const LOOP = BARS * 4 * BEAT;
const TAIL = 3; // rendered past the end, then folded onto the start so the loop is seamless
const N = Math.round((LOOP + TAIL) * RATE);
const L = new Float32Array(N);
const R = new Float32Array(N);

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
// F major: F – C/E – Dm – B♭ | F – C – B♭ – C  (twice). Notes as MIDI numbers.
const CHORDS: { root: number; tones: number[] }[] = [
  { root: 41, tones: [65, 69, 72] }, // F
  { root: 40, tones: [64, 67, 72] }, // C/E
  { root: 38, tones: [62, 65, 69] }, // Dm
  { root: 46, tones: [62, 65, 70] }, // B♭
  { root: 41, tones: [65, 69, 72] }, // F
  { root: 36, tones: [64, 67, 72] }, // C
  { root: 46, tones: [62, 65, 70] }, // B♭
  { root: 36, tones: [64, 67, 71] }, // C (with B for a lift back to F)
];

function add(start: number, dur: number, fn: (t: number) => number, pan = 0, gain = 1) {
  const s0 = Math.round(start * RATE);
  const n = Math.round(dur * RATE);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n && s0 + i < N; i++) {
    const v = fn(i / RATE);
    L[s0 + i] += v * gl;
    R[s0 + i] += v * gr;
  }
}

/** Soft pad: two slightly detuned voices with a few harmonics, slow swell. */
function pad(start: number, dur: number, midi: number, pan: number) {
  const f = hz(midi);
  add(start, dur + 1.2, (t) => {
    const env = Math.min(1, t / 0.9) * (t > dur ? Math.max(0, 1 - (t - dur) / 1.2) : 1);
    let v = 0;
    for (const d of [-0.0018, 0.0018]) {
      const ff = f * (1 + d);
      v += Math.sin(2 * Math.PI * ff * t) + 0.25 * Math.sin(4 * Math.PI * ff * t) + 0.08 * Math.sin(6 * Math.PI * ff * t);
    }
    return v * env * 0.5;
  }, pan, 0.045);
}

/** Marimba-like note: a round tone with a short bright overtone that fades fast. */
function mallet(start: number, midi: number, vel: number, pan: number) {
  const f = hz(midi);
  add(start, 1.4, (t) => {
    const body = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 4.2);
    const bright = 0.35 * Math.sin(2 * Math.PI * f * 3.95 * t) * Math.exp(-t * 18);
    const attack = Math.min(1, t / 0.004);
    return (body + bright) * attack;
  }, pan, 0.11 * vel);
}

function bass(start: number, dur: number, midi: number) {
  const f = hz(midi);
  add(start, dur + 0.3, (t) => {
    const env = Math.min(1, t / 0.03) * Math.exp(-t * 0.9) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.3) : 1);
    return (Math.sin(2 * Math.PI * f * t) + 0.18 * Math.sin(4 * Math.PI * f * t)) * env;
  }, 0, 0.12);
}

/** A very light shaker: a short breath of filtered noise on the off-beats. */
let seed = 7;
const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
function shaker(start: number, vel: number) {
  let lp = 0;
  let prev = 0;
  add(start, 0.09, (t) => {
    const x = noise();
    lp += 0.35 * (x - lp);
    const hp = lp - prev; // brighten
    prev = lp;
    return hp * Math.exp(-t * 55);
  }, 0.3, 0.05 * vel);
}

// Mallet pattern over each bar (beats), as chord-tone steps: gentle, a little syncopated.
const PATTERN: { beat: number; step: number; vel: number }[] = [
  { beat: 0, step: 0, vel: 1 },
  { beat: 0.5, step: 2, vel: 0.6 },
  { beat: 1.5, step: 1, vel: 0.75 },
  { beat: 2, step: 3, vel: 0.65 },
  { beat: 3, step: 2, vel: 0.7 },
  { beat: 3.5, step: 1, vel: 0.5 },
];

for (let bar = 0; bar < BARS; bar++) {
  const c = CHORDS[bar % CHORDS.length];
  const t0 = bar * 4 * BEAT;
  c.tones.forEach((m, i) => pad(t0, 4 * BEAT, m - 12, [-0.4, 0, 0.4][i]));
  bass(t0, 2 * BEAT, c.root);
  bass(t0 + 2 * BEAT, 2 * BEAT, c.root + (bar % 2 ? 7 : 0));
  const tones = [...c.tones, c.tones[0] + 12];
  // The second half of the loop answers the first a little higher and lighter.
  const lift = bar >= 8 ? 12 : 0;
  for (const p of PATTERN) {
    if (bar >= 8 && p.beat === 3.5) continue;
    mallet(t0 + p.beat * BEAT, tones[p.step] + lift, p.vel * (bar >= 8 ? 0.8 : 1), p.step % 2 ? 0.25 : -0.25);
  }
  for (let b = 0; b < 4; b++) shaker(t0 + (b + 0.5) * BEAT, b % 2 ? 1 : 0.7);
}

// Fold the tail onto the start, so the end flows straight back into the beginning.
const loopN = Math.round(LOOP * RATE);
for (let i = loopN; i < N; i++) {
  L[i - loopN] += L[i];
  R[i - loopN] += R[i];
}

// Gentle level: about -24 dBFS RMS, soft-limited so nothing clicks.
let sum = 0;
for (let i = 0; i < loopN; i++) sum += (L[i] * L[i] + R[i] * R[i]) / 2;
const gain = 0.063 / Math.sqrt(sum / loopN);
const soft = (x: number) => Math.tanh(x * gain * 1.2) / 1.2;
const toPcm = (x: Float32Array) => {
  const out = new Int16Array(loopN);
  for (let i = 0; i < loopN; i++) out[i] = Math.round(soft(x[i]) * 32767);
  return out;
};
const pl = toPcm(L);
const pr = toPcm(R);

const enc = new Mp3Encoder(2, RATE, 112);
const parts: Buffer[] = [];
for (let i = 0; i < loopN; i += 1152) {
  const p = enc.encodeBuffer(pl.subarray(i, i + 1152), pr.subarray(i, i + 1152));
  if (p.length) parts.push(Buffer.from(p.buffer, p.byteOffset, p.length));
}
const end = enc.flush();
if (end.length) parts.push(Buffer.from(end.buffer, end.byteOffset, end.length));
fs.writeFileSync(OUT, Buffer.concat(parts));
console.log(`${path.basename(OUT)}: ${LOOP.toFixed(1)} s loop, ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
