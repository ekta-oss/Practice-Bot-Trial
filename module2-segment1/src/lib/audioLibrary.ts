/*
 * Every voice line the learner has heard (narrator, person in charge, spoken
 * instructions and feedback), kept on this device so they can listen to any of
 * it again from the notebook's "Audio" tab, at any time — even after closing
 * the course. The list lives in localStorage; the audio files themselves are
 * stored in the browser's Cache Storage, so they replay without the network.
 */
import { useSyncExternalStore } from "react";
import { AUDIO_DIR } from "./media";

export interface HeardLine {
  file: string;
  text: string;
  /** NAR / PIC / MOD, or UI for instructions and feedback. */
  role: "NAR" | "PIC" | "MOD" | "UI";
  /** Stage it was first heard in, e.g. "1.3". */
  stage: string;
  at: number;
}

const KEY = "m2s1.heard.v1";
const CACHE = "m2s1-audio-v1";
const EMPTY: HeardLine[] = [];

let list: HeardLine[] | null = null;
let stage = "";
const listeners = new Set<() => void>();

function load(): HeardLine[] {
  if (list) return list;
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
    list = raw ? (JSON.parse(raw) as HeardLine[]) : [];
  } catch {
    list = [];
  }
  return list;
}

function save(next: HeardLine[]) {
  list = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* kept for this visit only */
  }
  listeners.forEach((l) => l());
}

/** The stage the learner is in (set by the stage frame). */
export function setHeardStage(id: string) {
  stage = id;
}

/** Note a line as heard (once per file) and keep its audio on the device. */
export function recordHeard(line: { file: string; text: string; role: HeardLine["role"] }) {
  if (typeof window === "undefined") return;
  const cur = load();
  if (cur.some((h) => h.file === line.file)) return;
  save([...cur, { ...line, stage: stage || "1.1", at: Date.now() }]);
  void (async () => {
    try {
      const c = await window.caches.open(CACHE);
      const url = AUDIO_DIR + line.file;
      if (!(await c.match(url))) await c.add(url);
    } catch {
      /* no Cache Storage (e.g. private window): it plays from the site instead */
    }
  })();
}

export function clearHeard() {
  save([]);
  try {
    void window.caches?.delete(CACHE);
  } catch {
    /* nothing stored */
  }
}

export function useHeard(): HeardLine[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => load(),
    () => EMPTY,
  );
}

/** A playable URL for a heard line: the stored copy if there is one, else the site's file. */
export async function heardUrl(file: string): Promise<{ url: string; revoke?: () => void }> {
  const url = AUDIO_DIR + file;
  try {
    const hit = await (await window.caches.open(CACHE)).match(url);
    if (hit) {
      const obj = URL.createObjectURL(await hit.blob());
      return { url: obj, revoke: () => URL.revokeObjectURL(obj) };
    }
  } catch {
    /* fall through */
  }
  return { url };
}
