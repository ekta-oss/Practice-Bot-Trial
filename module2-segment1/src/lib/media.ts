"use client";

import type { Line } from "@/content/segment1";

/**
 * Media helpers. All produced media is loaded from /public/media; see
 * docs/ASSET_MANIFEST.md for the full list. When a file is missing the app
 * says so on screen (a "missing" badge) and never pretends it is there.
 */

export const AUDIO_DIR = "/media/audio/";
export const VIDEO_DIR = "/media/video/";
export const IMAGE_DIR = "/media/images/";

const existsCache = new Map<string, Promise<boolean>>();

export function assetExists(path: string): Promise<boolean> {
  let p = existsCache.get(path);
  if (!p) {
    p = fetch(path, { method: "HEAD", cache: "no-store" })
      .then((r) => r.ok && !(r.headers.get("content-type") ?? "").includes("text/html"))
      .catch(() => false);
    existsCache.set(path, p);
  }
  return p;
}

/* ---------------- run-time flags (testing aids, off by default) ---------------- */

function readFlag(name: string): string | null {
  if (typeof window === "undefined") return null;
  const q = new URLSearchParams(window.location.search).get(name);
  if (q !== null) {
    try {
      window.sessionStorage.setItem(`m2s1.${name}`, q);
    } catch {}
    return q;
  }
  try {
    return window.sessionStorage.getItem(`m2s1.${name}`);
  } catch {
    return null;
  }
}

/** `?timescale=60` makes one stage-minute last one second (to test the time card). */
export function timeScale(): number {
  const v = Number(readFlag("timescale"));
  return Number.isFinite(v) && v > 0 ? v : 1;
}

/** `?fastmedia=1` shortens the stand-in for a *missing* audio file (automated tests). */
export function fastMedia(): boolean {
  return readFlag("fastmedia") === "1";
}

/** Stand-in voice for missing audio files. On by default; `?standin=0` turns it off. */
export function standInVoiceEnabled(): boolean {
  if (fastMedia()) return false;
  return readFlag("standin") !== "0";
}

/** Time a line takes at the script's 105–115 wpm (110 wpm). */
export function lineDurationMs(line: Line) {
  return Math.round((line.words / 110) * 60_000) + 600;
}

/* ---------------- UI sounds ---------------- */

let ctx: AudioContext | null = null;
function audioCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** The "soft chime" for a right answer (synthesised; no buzzer exists anywhere). */
export function chime() {
  const c = audioCtx();
  if (!c) return;
  const now = c.currentTime;
  [880, 1318.5].forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, now + i * 0.09);
    g.gain.exponentialRampToValueAtTime(0.12, now + i * 0.09 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.6);
    o.connect(g).connect(c.destination);
    o.start(now + i * 0.09);
    o.stop(now + i * 0.09 + 0.65);
  });
}
