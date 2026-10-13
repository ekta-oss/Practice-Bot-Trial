/*
 * Light background music under the course (stages only, never on the opening screen).
 * - Quiet to begin with, and turned down further whenever a voice is speaking.
 * - Stops while the stage is paused and while the learner records or listens back.
 * - The learner can switch it off (header button); the choice is remembered on this device.
 * Played through Web Audio so the loop repeats without a gap. Skipped in automated
 * tests (?fastmedia=1). The file is made by scripts/make-music.mts.
 */
import { useSyncExternalStore } from "react";
import { AUDIO_DIR, fastMedia } from "./media";
import { voicePlaying } from "./runtime";

const FILE = AUDIO_DIR + "M2_MUSIC_bed.mp3";
// The loop inside the decoded file: the encoder's few silent samples at the start are skipped.
const LOOP_START = 239 / 44100;
const LOOP_LENGTH = 38.4;
// Volume on top of the file's own quiet level: about 30 dB under the voices when nobody
// is speaking, and about 20 dB under them (barely there) while someone speaks.
const LEVEL = { clear: 0.55, underVoice: 0.2 };
const PREF_KEY = "m2s1.music";

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let source: AudioBufferSourceNode | null = null;
let buffer: Promise<AudioBuffer | null> | null = null;
let wanted = false; // a stage is open
let paused = false; // stage paused
const held = new Set<string>(); // recording / listening back
let ducker = 0;

let enabled = readPref();
const listeners = new Set<() => void>();

function readPref(): boolean {
  try {
    return typeof window === "undefined" || window.localStorage.getItem(PREF_KEY) !== "off";
  } catch {
    return true;
  }
}

function shouldPlay() {
  return enabled && wanted && !paused && held.size === 0 && !fastMedia();
}

async function load(): Promise<AudioBuffer | null> {
  if (!ctx) return null;
  try {
    const res = await fetch(FILE);
    if (!res.ok) return null;
    return await ctx.decodeAudioData(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function update() {
  if (typeof window === "undefined") return;
  if (!shouldPlay()) {
    if (gain && ctx) gain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    window.clearInterval(ducker);
    ducker = 0;
    return;
  }
  if (!ctx) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    ctx = new Ctx();
    gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") {
    // Browsers only allow sound after a tap: try now, and again on the next tap.
    void ctx.resume().catch(() => {});
    window.addEventListener("pointerdown", () => void ctx?.resume().catch(() => {}), { once: true });
  }
  buffer ??= load();
  const buf = await buffer;
  if (!buf || !ctx || !gain || !shouldPlay()) return;
  if (!source) {
    source = ctx.createBufferSource();
    source.buffer = buf;
    source.loop = true;
    source.loopStart = LOOP_START;
    source.loopEnd = Math.min(buf.duration, LOOP_START + LOOP_LENGTH);
    source.connect(gain);
    source.start(0, LOOP_START);
  }
  if (!ducker) {
    const duck = () => {
      if (!ctx || !gain) return;
      gain.gain.setTargetAtTime(voicePlaying() ? LEVEL.underVoice : LEVEL.clear, ctx.currentTime, 0.3);
    };
    duck();
    ducker = window.setInterval(duck, 150);
  }
}

/** A stage is open (music on) or the learner is back on the opening screen (off). */
export function setMusicWanted(on: boolean) {
  wanted = on;
  void update();
}

export function setMusicPaused(on: boolean) {
  paused = on;
  void update();
}

/** Silence the music while something needs quiet (recording, listening back); `who` names it. */
export function holdMusic(who: string, on: boolean) {
  if (on) held.add(who);
  else held.delete(who);
  void update();
}

export function setMusicEnabled(on: boolean) {
  enabled = on;
  try {
    window.localStorage.setItem(PREF_KEY, on ? "on" : "off");
  } catch {
    /* the choice just isn't remembered */
  }
  listeners.forEach((l) => l());
  void update();
}

export function useMusicEnabled(): boolean {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => enabled,
    () => true,
  );
}
