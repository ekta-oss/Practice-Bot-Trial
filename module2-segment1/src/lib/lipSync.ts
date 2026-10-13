import { AUDIO_DIR } from "./media";

/*
 * Lip movement for a still picture: how "open" the mouth should be at each
 * moment of a voice line, read from the loudness of the line's own audio.
 * The file is decoded once (it is already cached by the browser) into a
 * small loudness curve, 60 values a second, scaled 0 (silent) to 1 (loudest).
 */
const FPS = 60;
const curves = new Map<string, Promise<Float32Array | null>>();

export function mouthCurve(file: string): Promise<Float32Array | null> {
  let p = curves.get(file);
  if (!p) {
    p = build(AUDIO_DIR + file).catch(() => null);
    curves.set(file, p);
  }
  return p;
}

async function build(src: string): Promise<Float32Array | null> {
  if (typeof window === "undefined") return null;
  const Ctx = window.OfflineAudioContext ?? (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  if (!Ctx) return null;
  const res = await fetch(src);
  if (!res.ok) return null;
  const buf = await new Ctx(1, 1, 44100).decodeAudioData(await res.arrayBuffer());
  const data = buf.getChannelData(0);
  const step = Math.max(1, Math.round(buf.sampleRate / FPS));
  const out = new Float32Array(Math.ceil(data.length / step));
  let peak = 0;
  for (let i = 0; i < out.length; i++) {
    let sum = 0;
    const end = Math.min(data.length, (i + 1) * step);
    for (let j = i * step; j < end; j++) sum += data[j] * data[j];
    out[i] = Math.sqrt(sum / Math.max(1, end - i * step));
    peak = Math.max(peak, out[i]);
  }
  if (peak > 0) for (let i = 0; i < out.length; i++) out[i] = Math.min(1, out[i] / (peak * 0.7));
  return out;
}

/** Mouth opening (0–1) at a time in the line. */
export function mouthAt(curve: Float32Array, seconds: number): number {
  const i = Math.floor(seconds * FPS);
  return i >= 0 && i < curve.length ? curve[i] : 0;
}

/**
 * When there is no audio to follow (a browser voice or a silent stand-in), a
 * gentle talking rhythm: syllable-like opening at ~4–5 a second with small
 * irregular changes, so it never looks like a metronome.
 */
export function mouthRhythm(seconds: number): number {
  const v = 0.5 + 0.5 * Math.sin(seconds * 2 * Math.PI * 4.3) * (0.6 + 0.4 * Math.sin(seconds * 2 * Math.PI * 0.9));
  return Math.max(0, v);
}
