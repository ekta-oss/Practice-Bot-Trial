"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Line } from "@/content/segment1";
import { AUDIO_DIR, assetExists, fastMedia, lineDurationMs, standInVoiceEnabled } from "./media";

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

async function playOne(line: Line, signal: AbortSignal, onInfo: (n: NowPlaying) => void): Promise<void> {
  const src = AUDIO_DIR + line.file;
  const exists = await assetExists(src);
  if (signal.aborted) throw new Aborted();

  if (exists) {
    onInfo({ line, missing: false, standIn: false });
    const audio = new Audio(src);
    await new Promise<void>((resolve, reject) => {
      const stop = () => {
        audio.pause();
        audio.src = "";
        reject(new Aborted());
      };
      signal.addEventListener("abort", stop, { once: true });
      audio.addEventListener("ended", () => {
        signal.removeEventListener("abort", stop);
        resolve();
      });
      audio.addEventListener("error", () => {
        signal.removeEventListener("abort", stop);
        resolve();
      });
      audio.play().catch(() => {
        // Autoplay was refused: fall back to showing the subtitle for the line's length.
        setTimeout(resolve, lineDurationMs(line));
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
