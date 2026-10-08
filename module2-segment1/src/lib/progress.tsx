"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { STAGES, WALK_SIGNS } from "@/content/segment1";
import { syncStageComplete } from "./sync";

/**
 * Learner progress for this module, kept in localStorage.
 * The script says 'My signs' is "Stored locally for this module only",
 * so nothing here leaves the browser except (optionally) stage completion
 * — see lib/sync.ts.
 */

export interface SavedSign {
  id: string;
  savedAt: number;
  /** True when the sign was added for the learner after "No, carry on". */
  isNew: boolean;
}

export interface Note {
  id: string;
  savedAt: number;
}

export interface ProgressState {
  version: 1;
  /** Index into STAGES of the furthest stage unlocked. */
  unlocked: number;
  completed: string[];
  mySigns: SavedSign[];
  myNotes: Note[];
  finished: boolean;
}

const KEY = "m2s1.progress.v1";

const initial: ProgressState = {
  version: 1,
  unlocked: 0,
  completed: [],
  mySigns: [],
  myNotes: [],
  finished: false,
};

function load(): ProgressState {
  if (typeof window === "undefined") return initial;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return initial;
    const parsed = JSON.parse(raw) as ProgressState;
    if (parsed.version !== 1) return initial;
    return { ...initial, ...parsed };
  } catch {
    return initial;
  }
}

interface ProgressApi {
  state: ProgressState;
  ready: boolean;
  saveSign: (id: string) => boolean;
  addMissedSigns: () => void;
  saveNote: (id: string) => void;
  completeStage: (id: string) => void;
  reset: () => void;
}

const Ctx = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>(initial);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // localStorage only exists in the browser, so progress is read after hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked: progress lives for this session only */
    }
  }, [state, ready]);

  const saveSign = useCallback((id: string) => {
    if (stateRef.current.mySigns.some((s) => s.id === id)) return false;
    setState((s) =>
      s.mySigns.some((x) => x.id === id) ? s : { ...s, mySigns: [...s.mySigns, { id, savedAt: Date.now(), isNew: false }] },
    );
    return true;
  }, []);

  const addMissedSigns = useCallback(() => {
    setState((s) => {
      const have = new Set(s.mySigns.map((x) => x.id));
      const missed = WALK_SIGNS.filter((w) => !have.has(w.id)).map((w) => ({ id: w.id, savedAt: Date.now(), isNew: true }));
      return { ...s, mySigns: [...s.mySigns, ...missed] };
    });
  }, []);

  const saveNote = useCallback((id: string) => {
    setState((s) => (s.myNotes.some((n) => n.id === id) ? s : { ...s, myNotes: [...s.myNotes, { id, savedAt: Date.now() }] }));
  }, []);

  const completeStage = useCallback((id: string) => {
    setState((s) => {
      const idx = STAGES.findIndex((st) => st.id === id);
      const completed = s.completed.includes(id) ? s.completed : [...s.completed, id];
      const unlocked = Math.max(s.unlocked, Math.min(idx + 1, STAGES.length - 1));
      const finished = s.finished || idx === STAGES.length - 1;
      return { ...s, completed, unlocked, finished };
    });
    void syncStageComplete(id);
  }, []);

  const reset = useCallback(() => {
    setState(initial);
  }, []);

  const api = useMemo(
    () => ({ state, ready, saveSign, addMissedSigns, saveNote, completeStage, reset }),
    [state, ready, saveSign, addMissedSigns, saveNote, completeStage, reset],
  );
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProgress outside ProgressProvider");
  return v;
}
