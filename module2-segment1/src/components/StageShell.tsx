"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { UI, type StageMeta } from "@/content/segment1";
import { RuntimeCtx, preloadAudio, setUiBlocked, stopUi } from "@/lib/runtime";
import { ALL_AUDIO_FILES } from "@/content/audioFiles";
import { timeScale } from "@/lib/media";
import { setMusicEnabled, setMusicPaused, useMusicEnabled } from "@/lib/music";
import { Notebook } from "./Notebook";
import { BrandMark, CloseIcon, ListIcon, OutlinePanel } from "./Brand";

/**
 * Task-screen frame, in the Swift AI Academy platform style:
 *  - Header: logo (left); pause, course outline and Close (right). Position in the
 *    course is shown only in the outline drawer (platform rule).
 *  - Eyebrow "<asset type> · About N minutes" (the script's expected-time clock) and the stage title.
 *  - Light theme, or dark for video stages; amber = the one primary action.
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

type Overlay = null | "pause" | "time" | "outline";

export function StageShell({
  meta,
  onRestart,
  onMenu,
  onOpenStage,
  children,
}: {
  meta: StageMeta;
  onRestart: () => void;
  onMenu: () => void;
  onOpenStage: (index: number) => void;
  children: React.ReactNode;
}) {
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [lapsed, setLapsed] = useState(false);
  const [resumeToken, setResumeToken] = useState(0);
  const [restartsOnResume, setRestartsOnResume] = useState(false);
  const [footerRight, setFooterRight] = useState<HTMLElement | null>(null);
  const [footerLeft, setFooterLeft] = useState<HTMLElement | null>(null);

  const paused = overlay !== null;

  // Spoken instructions stop while paused, and when the learner leaves the stage.
  useEffect(() => {
    setUiBlocked(paused);
    setMusicPaused(paused);
  }, [paused]);
  const music = useMusicEnabled();
  useEffect(() => () => stopUi(), []);
  // Load the course audio in the background so every line starts without delay (runs once per page).
  useEffect(() => {
    preloadAudio(ALL_AUDIO_FILES);
  }, []);

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

  // Header buttons say what they do (icon + word; the word hides on narrow phones).
  const headBtn =
    "flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-semibold text-[var(--heading)] transition hover:border-[var(--blue-tonal-border)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[var(--blue)]";

  return (
    <RuntimeCtx.Provider value={runtime}>
      <SlotsCtx.Provider value={slots}>
        <div className={meta.theme === "dark" ? "theme-dark" : ""}>
          <div className="flex min-h-dvh flex-col" style={{ background: "var(--page-grad)" }} data-testid={`stage-${meta.id}`}>
            <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-4 py-3 backdrop-blur sm:px-8" style={{ background: "color-mix(in srgb, var(--page) 82%, transparent)" }}>
              <BrandMark />
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setMusicEnabled(!music)} className={headBtn} aria-pressed={music} data-testid="music-button">
                  <MusicIcon off={!music} />
                  <span className="hidden sm:inline">Music</span>
                  <span className="sr-only sm:hidden">Music</span>
                </button>
                <button type="button" onClick={() => setOverlay("pause")} className={headBtn} data-testid="pause-button">
                  <PauseIcon />
                  <span className="hidden sm:inline">{UI.pause}</span>
                  <span className="sr-only sm:hidden">{UI.pause}</span>
                </button>
                <button type="button" onClick={() => setOverlay("outline")} className={headBtn} data-testid="outline-button">
                  <ListIcon />
                  <span className="hidden sm:inline">All stages</span>
                  <span className="sr-only sm:hidden">All stages</span>
                </button>
                <button
                  type="button"
                  onClick={onMenu}
                  className="hidden h-11 items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--body)] transition hover:border-[var(--blue-tonal-border)] sm:flex"
                  data-testid="close-button"
                >
                  <CloseIcon /> Close
                </button>
              </div>
            </header>

            <main className="relative flex flex-1 flex-col" aria-hidden={paused || undefined} inert={paused || undefined}>
              <div className="mx-auto w-full max-w-6xl px-4 pt-2 sm:px-8">
                <p className="eyebrow flex flex-wrap items-center gap-x-2">
                  <span aria-hidden className="inline-block h-px w-6 bg-current opacity-70" />
                  <span>{meta.kind}</span>
                  <span aria-hidden>·</span>
                  <span data-testid="expected-time" aria-label={`Expected time: ${UI.aboutMinutes(meta.aboutMinutes)}`}>
                    {UI.aboutMinutes(meta.aboutMinutes)}
                  </span>
                </p>
                <h1 className="mt-1 text-2xl font-bold leading-tight text-[var(--heading)] sm:text-3xl" data-testid="stage-title">
                  <span className="sr-only">Stage {meta.number}: </span>
                  <span hidden>{meta.number} </span>
                  {meta.title}
                </h1>
              </div>
              {children}
            </main>

            <footer
              className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] px-4 py-3 sm:px-8"
              style={{ background: "color-mix(in srgb, var(--page) 92%, transparent)" }}
              inert={paused || undefined}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Notebook />
                <div ref={setFooterLeft} className="contents" />
              </div>
              <div ref={setFooterRight} className="ml-auto flex flex-wrap items-center justify-end gap-3" />
            </footer>
          </div>

          {overlay === "outline" && <OutlinePanel currentId={meta.id} onClose={() => setOverlay(null)} onOpenStage={onOpenStage} />}

          {(overlay === "pause" || overlay === "time") && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-[var(--overlay)] p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="overlay-title">
              <div
                className="w-full max-w-md rounded-[24px] border border-[var(--border)] p-7 shadow-2xl"
                style={{ background: meta.theme === "dark" ? "rgba(14,20,48,0.92)" : "#ffffff" }}
                data-testid={overlay === "time" ? "time-card" : "pause-card"}
              >
                {overlay === "time" ? (
                  <>
                    <div className="mb-3 flex items-center gap-2 text-[var(--blue)]">
                      <ClockIcon />
                    </div>
                    <p id="overlay-title" className="mb-6 text-xl text-[var(--heading)]">
                      {UI.timeCard}
                    </p>
                    <div className="flex flex-wrap justify-end gap-3">
                      <button type="button" className="btn-secondary" onClick={() => setOverlay("pause")} data-testid="time-pause">
                        {UI.pause}
                      </button>
                      <button type="button" className="btn-main" onClick={onRestart} data-testid="time-start-again" autoFocus>
                        {UI.startAgain}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="eyebrow mb-1">Paused</p>
                    <h2 id="overlay-title" className="mb-4 text-2xl font-bold text-[var(--heading)]">
                      {meta.title}
                    </h2>
                    {(restartsOnResume || lapsed) && (
                      <p className="mb-4 text-lg text-[var(--body)]" data-testid="resume-note">
                        {UI.resumeNote}
                      </p>
                    )}
                    <div className="flex flex-wrap justify-end gap-3">
                      <button type="button" className="btn-secondary" onClick={onRestart} data-testid="pause-start-again">
                        {UI.startAgain}
                      </button>
                      <button type="button" className="btn-main" onClick={resume} data-testid="pause-resume" autoFocus>
                        {UI.resume}
                      </button>
                    </div>
                    <button type="button" onClick={onMenu} className="mt-6 text-base font-semibold text-[var(--blue)] underline-offset-4 hover:underline" data-testid="pause-menu">
                      Course menu
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
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

/** Music note; crossed through when the music is off. */
function MusicIcon({ off }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
      {off && <path d="M3 3l18 18" />}
    </svg>
  );
}
