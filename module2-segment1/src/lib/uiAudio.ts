import type { Line } from "@/content/segment1";

/**
 * Audio for on-screen instructions and feedback that the script does not give
 * a file name for. Each text gets a stable file name from its words, so the app
 * and the voice generator (scripts/make-voice.mts) always agree:
 *   "Say hello, and introduce yourself." → M2_UI_say-hello-and-introduce-yourself_3f2a91c0.mp3
 */
export function uiAudioFile(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  const slug = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
  return `M2_UI_${slug}_${h.toString(16).padStart(8, "0")}.mp3`;
}

/** A spoken UI text as a Line, read by the narrator voice. */
export function uiLine(text: string): Line {
  return { file: uiAudioFile(text), role: "NAR", text, words: text.split(/\s+/).filter(Boolean).length };
}
