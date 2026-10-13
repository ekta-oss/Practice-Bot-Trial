"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Line } from "@/content/segment1";
import { AUDIO_DIR, assetExists, fastMedia, lineDurationMs, standInVoiceEnabled } from "./media";
import { uiAudioFile } from "./uiAudio";

/**
 * Per-stage runtime: pause state shared by every media element in a stage.
 * Script: "For video, audio and quiz, 'Resume' shows the note 'This will
 * start from the beginning.' because these cannot continue from the middle."
 * So on resume, the line/video that was playing starts again from its start.
 */
export interface StageRuntime {
  paused: boolean;
  resumeToken: number;
  /** Stages call this to say whether the current step is media/quiz (shows the resume note). */
  setRestartsOnResume: (v: boolean) => void;
}

export const RuntimeCtx = createContext<StageRuntime>({ paused: false, resumeToken: 0, setRestartsOnResume: () => {} });
export const useRuntime = () => useContext(RuntimeCtx);

/** Marks the current step as media/quiz (true) or interactive (false) while mounted. */
export function useRestartsOnResume(v: boolean) {
  const { setRestartsOnResume } = useRuntime();
  useEffect(() => {
    setRestartsOnResume(v);
  }, [v, setRestartsOnResume]);
}

/* ------------------------------------------------------------------ */

export interface NowPlaying {
  line: Line;
  /** The audio file is not in /public/media/audio. */
  missing: boolean;
  /** A browser voice is reading the line instead (only when missing). */
  standIn: boolean;
}

class Aborted extends Error {}

/*
 * Audio is loaded ahead of time and the same element is reused, so a line
 * starts the moment it is needed (no file check or download in between).
 */
const audioCache = new Map<string, HTMLAudioElement>();

function takeAudio(src: string): HTMLAudioElement {
  let a = audioCache.get(src);
  if (!a) {
    a = new Audio(src);
    a.preload = "auto";
    audioCache.set(src, a);
  }
  return a;
}

/** Starts loading these audio files in the background (files that do not exist are skipped). */
export function preloadAudio(files: string[]) {
  if (typeof window === "undefined" || fastMedia()) return;
  for (const f of files) {
    const src = AUDIO_DIR + f;
    if (audioCache.has(src)) continue;
    void assetExists(src).then((ok) => {
      if (ok && !audioCache.has(src)) takeAudio(src).load();
    });
  }
}

async function playOne(line: Line, signal: AbortSignal, onInfo: (n: NowPlaying) => void): Promise<void> {
  const src = AUDIO_DIR + line.file;
  const exists = await assetExists(src);
  if (signal.aborted) throw new Aborted();

  // ?fastmedia=1 (automated tests) skips real audio so runs stay quick.
  if (exists && !fastMedia()) {
    onInfo({ line, missing: false, standIn: false });
    const audio = takeAudio(src);
    audio.currentTime = 0;
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        audio.removeEventListener("ended", done);
        audio.removeEventListener("error", done);
        signal.removeEventListener("abort", stop);
      };
      const done = () => {
        cleanup();
        resolve();
      };
      const stop = () => {
        cleanup();
        audio.pause();
        audio.currentTime = 0;
        reject(new Aborted());
      };
      signal.addEventListener("abort", stop, { once: true });
      audio.addEventListener("ended", done);
      audio.addEventListener("error", done);
      audio.play().catch(() => {
        // Autoplay was refused: fall back to showing the subtitle for the line's length.
        setTimeout(done, lineDurationMs(line));
      });
    });
    return;
  }

  const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
  const useVoice = standInVoiceEnabled() && !!synth && typeof SpeechSynthesisUtterance !== "undefined";
  onInfo({ line, missing: true, standIn: useVoice });
  const budget = fastMedia() ? 250 : lineDurationMs(line);

  await new Promise<void>((resolve, reject) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", stop);
      resolve();
    };
    const stop = () => {
      done = true;
      clearTimeout(timer);
      if (useVoice) synth!.cancel();
      reject(new Aborted());
    };
    signal.addEventListener("abort", stop, { once: true });
    // Safety net: never wait much longer than the line should take.
    const timer = setTimeout(finish, useVoice ? budget * 2 + 2000 : budget);
    if (useVoice) {
      synth!.cancel();
      const u = new SpeechSynthesisUtterance(line.text);
      u.lang = "en-IN";
      u.rate = 0.9;
      u.onend = finish;
      u.onerror = finish;
      synth!.speak(u);
    }
  });
}

/**
 * Plays spoken lines in order, showing each as a subtitle.
 * `play()` resolves when every line has finished (it never resolves if the
 * sequence is stopped). Pausing the stage stops the line; resuming plays the
 * same line again from its beginning.
 */
export function useLinePlayer() {
  const { paused, resumeToken } = useRuntime();
  const [now, setNow] = useState<NowPlaying | null>(null);
  const [lastLines, setLastLines] = useState<Line[] | null>(null);
  const run = useRef<{ lines: Line[]; idx: number; resolve: () => void; ctrl: AbortController | null } | null>(null);
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const runFrom = useCallback(async () => {
    const r = run.current;
    if (!r) return;
    flowBegin();
    try {
      while (r.idx < r.lines.length) {
        if (run.current !== r || pausedRef.current) return;
        const ctrl = new AbortController();
        r.ctrl = ctrl;
        try {
          await playOne(r.lines[r.idx], ctrl.signal, setNow);
        } catch {
          return; // aborted (pause or stop)
        }
        if (run.current !== r) return;
        r.idx++;
      }
      run.current = null;
      setNow(null);
      r.resolve();
    } finally {
      flowEnd();
    }
  }, []);

  const stop = useCallback(() => {
    run.current?.ctrl?.abort();
    run.current = null;
    setNow(null);
  }, []);

  const play = useCallback(
    (lines: Line[]) => {
      stop();
      setLastLines(lines);
      return new Promise<void>((resolve) => {
        run.current = { lines, idx: 0, resolve, ctrl: null };
        void runFrom();
      });
    },
    [runFrom, stop],
  );

  /** Replay always starts from the beginning of the last lines. */
  const replay = useCallback(() => {
    if (!lastLines) return Promise.resolve();
    return play(lastLines);
  }, [lastLines, play]);

  useEffect(() => {
    if (paused) run.current?.ctrl?.abort();
  }, [paused]);

  useEffect(() => {
    if (resumeToken > 0 && run.current) void runFrom();
  }, [resumeToken, runFrom]);

  useEffect(() => stop, [stop]);

  return { now, playing: now !== null, play, stop, replay, hasPlayed: lastLines !== null };
}

/* ------------------------------------------------------------------ */
/* Instruction and feedback audio                                      */
/* ------------------------------------------------------------------ */
/*
 * One channel for spoken instructions and feedback cards. It never talks over
 * the narrator or a character: while a line player is speaking, a new
 * instruction is dropped, or (afterFlow) waits until the speaking ends.
 * Missing files are silent; the text is always on screen.
 */

let flowCount = 0;
let uiAudio: HTMLAudioElement | null = null;
let uiQueue: string[] = [];
let uiPending: string[] | null = null;
let uiBlocked = false;

function flowBegin() {
  flowCount++;
  stopUi();
}

function flowEnd() {
  flowCount = Math.max(0, flowCount - 1);
  if (flowCount === 0 && uiPending) {
    const q = uiPending;
    uiPending = null;
    playUiQueue(q);
  }
}

export function stopUi() {
  uiQueue = [];
  if (uiAudio) {
    uiAudio.pause();
    uiAudio.currentTime = 0;
    uiAudio = null;
  }
}

/** Pausing a stage, or leaving it, silences instructions and drops any waiting ones. */
export function setUiBlocked(blocked: boolean) {
  uiBlocked = blocked;
  if (blocked) {
    uiPending = null;
    stopUi();
  }
}

function playUiQueue(texts: string[]) {
  stopUi();
  if (uiBlocked || fastMedia()) return;
  uiQueue = [...texts];
  playNextUi();
}

function playNextUi() {
  const text = uiQueue.shift();
  if (!text) return;
  const a = takeAudio(AUDIO_DIR + uiAudioFile(text));
  a.currentTime = 0;
  uiAudio = a;
  const next = () => {
    a.removeEventListener("ended", next);
    a.removeEventListener("error", next);
    if (uiAudio !== a) return;
    uiAudio = null;
    playNextUi();
  };
  a.addEventListener("ended", next);
  a.addEventListener("error", next);
  a.play().catch(next);
}

/** Speak instruction or feedback texts in order (replacing what the channel was saying). */
export function sayUi(texts: string[], opts: { afterFlow?: boolean } = {}) {
  if (texts.length === 0 || uiBlocked) return;
  if (flowCount > 0) {
    if (opts.afterFlow) uiPending = texts;
    return;
  }
  playUiQueue(texts);
}

/** Speaks the texts when the component appears (and again if they change). */
export function useSay(texts: (string | null | undefined | false)[], opts: { afterFlow?: boolean; when?: boolean } = {}) {
  const list = texts.filter((t): t is string => typeof t === "string" && t.length > 0);
  const key = list.join("\u0000");
  const when = opts.when ?? true;
  const afterFlow = opts.afterFlow ?? false;
  useEffect(() => {
    if (when && key) sayUi(key.split("\u0000"), { afterFlow });
  }, [key, when, afterFlow]);
}
