"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { UI, type StageMeta } from "@/content/segment1";
import { RuntimeCtx } from "@/lib/runtime";
import { timeScale } from "@/lib/media";
import { Notebook } from "./Notebook";

/**
 * Task-screen frame (Visual & Context Reference A):
 *  - Top bar: stage title (left), expected-time clock (centre), pause button (right).
 *  - Main button bottom-right, large (stages portal it in with <FooterActions>).
 *  - Clock: 'About N minutes', soft teal, never counts down, never red, never ticks.
 *    When the maximum time is reached: a gentle card with 'Start again' and 'Pause'.
 *  - Pause card: 'Resume' and 'Start again'; for video, audio and quiz 'Resume'
 *    shows 'This will start from the beginning.'
 */

interface Slots {
  footerRight: HTMLElement | null;
  footerLeft: HTMLElement | null;
}
const SlotsCtx = createContext<Slots>({ footerRight: null, footerLeft: null });
export const useShellSlots = () => useContext(SlotsCtx);

type Overlay = null | "pause" | "time";

export function StageShell({
  meta,
  onRestart,
  onMenu,
  children,
}: {
  meta: StageMeta;
  onRestart: () => void;
  onMenu: () => void;
  children: React.ReactNode;
}) {
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [lapsed, setLapsed] = useState(false);
  const [resumeToken, setResumeToken] = useState(0);
  const [restartsOnResume, setRestartsOnResume] = useState(false);
  const [footerRight, setFooterRight] = useState<HTMLElement | null>(null);
  const [footerLeft, setFooterLeft] = useState<HTMLElement | null>(null);

  const paused = overlay !== null;

  // Elapsed time only runs while the stage is not paused.
  const elapsed = useRef(0);
  useEffect(() => {
    if (paused || lapsed) return;
    const maxMs = (meta.maxMinutes * 60_000) / timeScale();
    let last = performance.now();
    const id = window.setInterval(() => {
      const t = performance.now();
      elapsed.current += t - last;
      last = t;
      if (elapsed.current >= maxMs) {
        setLapsed(true);
        setOverlay("time");
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [paused, lapsed, meta.maxMinutes]);

  const resume = useCallback(() => {
    if (lapsed) {
      // After the time card the activity is a reattempt: it starts again.
      onRestart();
      return;
    }
    setOverlay(null);
    setResumeToken((n) => n + 1);
  }, [lapsed, onRestart]);

  const runtime = useMemo(() => ({ paused, resumeToken, setRestartsOnResume }), [paused, resumeToken]);
  const slots = useMemo(() => ({ footerRight, footerLeft }), [footerRight, footerLeft]);

  // Esc opens the pause card.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && overlay === null) setOverlay("pause");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [overlay]);

  return (
    <RuntimeCtx.Provider value={runtime}>
      <SlotsCtx.Provider value={slots}>
        <div className="flex min-h-dvh flex-col bg-[var(--page)]" data-testid={`stage-${meta.id}`}>
          <header className="sticky top-0 z-30 grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-slate-200 bg-white/95 px-4 py-2 backdrop-blur sm:grid-cols-[1fr_auto_1fr] sm:px-6">
            <h1 className="line-clamp-2 min-w-0 text-base font-semibold leading-tight text-slate-900 sm:text-xl" data-testid="stage-title">
              <span className="text-teal-700">{meta.number}</span> {meta.title}
            </h1>
            <div className="flex items-center gap-2 text-base text-teal-700" data-testid="expected-time" aria-label={`Expected time: ${UI.aboutMinutes(meta.aboutMinutes)}`}>
              <ClockIcon />
              <span>{UI.aboutMinutes(meta.aboutMinutes)}</span>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setOverlay("pause")}
                className="flex h-12 items-center gap-2 rounded-full bg-slate-100 px-4 text-base font-semibold text-slate-800 hover:bg-slate-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-amber-400"
                data-testid="pause-button"
                aria-label={UI.pause}
              >
                <PauseIcon />
                <span className="hidden sm:inline">{UI.pause}</span>
              </button>
            </div>
          </header>

          <main className="relative flex flex-1 flex-col" aria-hidden={paused || undefined} inert={paused || undefined}>
            {children}
          </main>

          <footer className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6" inert={paused || undefined}>
            <div className="flex flex-wrap items-center gap-2">
              <Notebook />
              <div ref={setFooterLeft} className="contents" />
            </div>
            <div ref={setFooterRight} className="ml-auto flex flex-wrap items-center justify-end gap-3" />
          </footer>
        </div>

        {overlay && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="overlay-title">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" data-testid={overlay === "time" ? "time-card" : "pause-card"}>
              {overlay === "time" ? (
                <>
                  <div className="mb-3 flex items-center gap-2 text-teal-700">
                    <ClockIcon />
                  </div>
                  <p id="overlay-title" className="mb-6 text-xl text-slate-900">
                    {UI.timeCard}
                  </p>
                  <div className="flex flex-wrap justify-end gap-3">
                    <button type="button" className="btn-secondary" onClick={() => setOverlay("pause")} data-testid="time-pause">
                      {UI.pause}
                    </button>
                    <button type="button" className="btn-primary" onClick={onRestart} data-testid="time-start-again" autoFocus>
                      {UI.startAgain}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 id="overlay-title" className="mb-4 text-2xl font-semibold text-slate-900">
                    {UI.pause}
                  </h2>
                  {(restartsOnResume || lapsed) && (
                    <p className="mb-4 text-lg text-slate-700" data-testid="resume-note">
                      {UI.resumeNote}
                    </p>
                  )}
                  <div className="flex flex-wrap justify-end gap-3">
                    <button type="button" className="btn-secondary" onClick={onRestart} data-testid="pause-start-again">
                      {UI.startAgain}
                    </button>
                    <button type="button" className="btn-primary" onClick={resume} data-testid="pause-resume" autoFocus>
                      {UI.resume}
                    </button>
                  </div>
                  <button type="button" onClick={onMenu} className="mt-6 text-base text-slate-600 underline underline-offset-4 hover:text-slate-800" data-testid="pause-menu">
                    Course menu
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </SlotsCtx.Provider>
    </RuntimeCtx.Provider>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}
