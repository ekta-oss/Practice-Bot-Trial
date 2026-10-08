"use client";

/**
 * Speech-to-text with the browser's own recognition service (Web Speech API).
 * Chrome and Edge send the audio to their speech service; Safari uses its own.
 * Firefox has none — callers then fall back to the learner's self-check.
 * The *recording* itself never leaves the device (lib/recordings.ts).
 */

interface RecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<RecognitionResultLike>;
}
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionCtor = new () => RecognitionLike;

function ctor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export const speechCheckAvailable = () => ctor() !== null;

export interface Listener {
  /** Stops listening; resolves with the full transcript once the service has sent its last words. */
  stop: () => Promise<string>;
  abort: () => void;
}

/**
 * Starts listening. `onText` gets the transcript so far (final + interim) for
 * the live "Listening to you" line. Chrome ends a session after a pause, so the
 * listener restarts itself until `stop()` is called.
 */
export function listen(onText: (text: string) => void, onUnavailable: (reason: string) => void): Listener | null {
  const C = ctor();
  if (!C) return null;
  let finals: string[] = [];
  let interim = "";
  let stopping = false;
  let ended: (() => void) | null = null;
  let rec: RecognitionLike;

  const text = () => [...finals, interim].join(" ").replace(/\s+/g, " ").trim();

  const begin = () => {
    rec = new C();
    rec.lang = "en-IN";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finals.push(r[0].transcript);
        else interim += " " + r[0].transcript;
      }
      onText(text());
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed" || e.error === "network" || e.error === "language-not-supported") {
        stopping = true;
        onUnavailable(e.error);
      }
    };
    rec.onend = () => {
      if (stopping) {
        // Keep the last interim words: some services never mark them final.
        if (interim.trim()) {
          finals.push(interim);
          interim = "";
        }
        ended?.();
        return;
      }
      try {
        begin(); // restart after the service's own pause timeout
      } catch {
        ended?.();
      }
    };
    rec.start();
  };

  try {
    begin();
  } catch {
    return null;
  }

  return {
    stop: () =>
      new Promise<string>((resolve) => {
        stopping = true;
        const t = window.setTimeout(() => resolve(text()), 2500); // never wait for ever
        ended = () => {
          window.clearTimeout(t);
          resolve(text());
        };
        try {
          rec.stop();
        } catch {
          ended();
        }
      }),
    abort: () => {
      stopping = true;
      finals = [];
      try {
        rec.abort();
      } catch {}
    },
  };
}
