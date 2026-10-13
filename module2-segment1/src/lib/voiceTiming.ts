/*
 * When each part of a voice line is spoken, measured from the audio itself by
 * scripts/analyze-voice.mts (run it again after any voice file changes).
 *
 * For every file: its length, the start of each text piece (the line split at
 * . ! ? , ; : and dashes), and — for the person in charge — a loudness curve
 * that drives her lips. Subtitles, lip movement and hand gestures all follow
 * these times, so they stay in step with the voice.
 */
import timing from "@/content/voiceTiming.json";

export interface VoiceTiming {
  /** Length in seconds. */
  d: number;
  /** Start (seconds) of each text piece, see textPieces(). */
  p: number[];
  /** Loudness, 30 values a second, one base-36 digit each (0 silent … z loudest). */
  e?: string;
}

const TIMING = timing as Record<string, VoiceTiming>;
export const ENVELOPE_FPS = 30;

export const voiceTiming = (file: string): VoiceTiming | undefined => TIMING[file];

/** A line split where a speaker pauses: after . ! ? , ; : and dashes. */
export function textPieces(text: string): string[] {
  return text.split(/(?<=[.!?,;:—])\s+/).filter(Boolean);
}

/** Subtitle chunks of at most ~12 words, built from whole pieces; each knows its first piece. */
export function subtitleChunks(text: string, maxWords = 12): { text: string; piece: number }[] {
  const out: { text: string; piece: number }[] = [];
  let cur: string[] = [];
  let first = 0;
  textPieces(text).forEach((p, i) => {
    const w = p.split(/\s+/);
    if (cur.length && cur.length + w.length > maxWords) {
      out.push({ text: cur.join(" "), piece: first });
      cur = [];
    }
    if (!cur.length) first = i;
    if (w.length > maxWords) {
      for (let j = 0; j < w.length; j += maxWords) out.push({ text: w.slice(j, j + maxWords).join(" "), piece: i });
    } else cur.push(...w);
  });
  if (cur.length) out.push({ text: cur.join(" "), piece: first });
  return out;
}

/** Seconds into the line when a subtitle chunk starts (undefined: no measured timing). */
export function chunkStart(file: string, chunk: { piece: number }): number | undefined {
  return TIMING[file]?.p[chunk.piece];
}

/**
 * Seconds into the line when a word is spoken: the start of its piece (measured)
 * plus its share of the piece (by letters). Undefined if the word is not in the line.
 */
export function wordTime(file: string, text: string, word: string): number | undefined {
  const t = TIMING[file];
  if (!t) return undefined;
  const pieces = textPieces(text);
  for (const [i, p] of pieces.entries()) {
    const at = p.toLowerCase().indexOf(word.toLowerCase());
    if (at < 0) continue;
    const start = t.p[i] ?? 0;
    const end = t.p[i + 1] ?? t.d;
    return start + (end - start) * 0.85 * (at / Math.max(1, p.length));
  }
  return undefined;
}

/** Mouth opening (0–1) at a time in the line, from the measured loudness. */
export function loudnessAt(file: string, seconds: number): number | undefined {
  const e = TIMING[file]?.e;
  if (!e) return undefined;
  const i = Math.floor(seconds * ENVELOPE_FPS);
  if (i < 0 || i >= e.length) return 0;
  return parseInt(e[i], 36) / 35;
}
