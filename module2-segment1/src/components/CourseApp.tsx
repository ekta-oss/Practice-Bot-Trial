"use client";

import { useEffect, useState } from "react";
import { END_OF_SCOPE, MODULE_TITLE, SEGMENT_TITLE, STAGES } from "@/content/segment1";
import { ProgressProvider, useProgress } from "@/lib/progress";
import { clearRecordings } from "@/lib/recordings";
import { setMusicWanted } from "@/lib/music";
import { StageShell } from "./StageShell";
import { BrandMark, CheckIcon, ListIcon, OutlinePanel } from "./Brand";
import { Stage1_1 } from "@/stages/Stage1_1";
import { Stage1_2 } from "@/stages/Stage1_2";
import { Stage1_3 } from "@/stages/Stage1_3";
import { Stage1_4 } from "@/stages/Stage1_4";
import { Stage1_5 } from "@/stages/Stage1_5";
import { Stage1_6 } from "@/stages/Stage1_6";

const COMPONENTS = [Stage1_1, Stage1_2, Stage1_3, Stage1_4, Stage1_5, Stage1_6];
const SEGMENT_MINUTES = STAGES.reduce((n, s) => n + s.aboutMinutes, 0);
const [MODULE_NAME, MODULE_SUBTITLE] = MODULE_TITLE.split(" — ");

type View = { kind: "home" } | { kind: "stage"; index: number } | { kind: "done"; index: number } | { kind: "end" };

export function CourseApp() {
  return (
    <ProgressProvider>
      <Course />
    </ProgressProvider>
  );
}

function Course() {
  const { state, ready, completeStage, reset } = useProgress();
  const [view, setView] = useState<View>({ kind: "home" });
  // Light music plays under the stages (not on the opening screen).
  useEffect(() => setMusicWanted(view.kind !== "home"), [view.kind]);
  const [runKey, setRunKey] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const [outline, setOutline] = useState(false);

  if (!ready) return null;

  const openStage = (index: number) => {
    setOutline(false);
    setRunKey((k) => k + 1);
    setView({ kind: "stage", index });
  };

  if (view.kind === "stage") {
    const meta = STAGES[view.index];
    const Comp = COMPONENTS[view.index];
    return (
      <StageShell key={`${meta.id}-${runKey}`} meta={meta} onRestart={() => setRunKey((k) => k + 1)} onMenu={() => setView({ kind: "home" })} onOpenStage={openStage}>
        <Comp
          onComplete={() => {
            completeStage(meta.id);
            setRunKey((k) => k + 1);
            setView(view.index + 1 < STAGES.length ? { kind: "done", index: view.index } : { kind: "end" });
          }}
        />
      </StageShell>
    );
  }

  // Platform "Segment Complete — Generic": quiet, small badge, up-next card.
  if (view.kind === "done") {
    const meta = STAGES[view.index];
    const next = STAGES[view.index + 1];
    return (
      <DarkFrame>
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center" data-testid="segment-complete">
          <span className="grid h-14 w-14 place-items-center rounded-full border border-[var(--success-tonal-border)] p-1.5">
            <span className="grid h-full w-full place-items-center rounded-full border border-[var(--success-tonal-border)] bg-[var(--success-tonal-bg)] text-[var(--success)]">
              <CheckIcon className="h-5 w-5" />
            </span>
          </span>
          <div>
            <p className="text-base text-[var(--muted)]">
              Stage {meta.number} of {STAGES[STAGES.length - 1].number} complete
            </p>
            <h1 className="mt-1 text-3xl font-bold text-[var(--heading)]">{meta.title}</h1>
          </div>
          <StageRail current={view.index} />
          <div className="mt-6 flex w-full flex-wrap items-center justify-between gap-4 rounded-[20px] border border-[var(--border)] bg-[var(--card)] px-6 py-5 text-left">
            <div>
              <p className="eyebrow">Up next · {next.kind}</p>
              <p className="mt-1 text-xl font-semibold text-[var(--heading)]">{next.title}</p>
              <p className="text-base text-[var(--muted)]">About {next.aboutMinutes} minutes</p>
            </div>
            <button type="button" className="btn-main" onClick={() => openStage(view.index + 1)} data-testid="next-stage" autoFocus>
              Continue <Arrow />
            </button>
          </div>
        </main>
      </DarkFrame>
    );
  }

  // Platform "Section Complete — Milestone": the bigger celebration, at the end of 1.6.
  if (view.kind === "end") {
    return (
      <DarkFrame>
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-6 px-4 py-10 text-center" data-testid="end-screen">
          <span className="relative grid h-24 w-24 place-items-center rounded-full border border-[var(--success-tonal-border)]">
            <span className="grid h-16 w-16 place-items-center rounded-full text-[#062b1d] shadow-[0_0_40px_rgba(79,224,168,0.45)]" style={{ background: "linear-gradient(135deg, #4fe0a8, #1c9a6b)" }}>
              <CheckIcon className="h-8 w-8" />
            </span>
            <span aria-hidden className="absolute -right-1 top-2 h-2 w-2 rounded-full bg-[var(--amber)]" />
          </span>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--muted)]">Segment complete</p>
          <h1 className="text-4xl font-bold text-[var(--heading)]">{END_OF_SCOPE.title}</h1>
          <p className="max-w-xl text-lg text-[var(--body)]">{END_OF_SCOPE.body}</p>
          <StageRail current={STAGES.length} />
          <button type="button" className="btn-main mt-4" onClick={() => setView({ kind: "home" })}>
            Course menu <Arrow />
          </button>
        </main>
      </DarkFrame>
    );
  }

  // Platform "Module Opening — Premium".
  const nextIndex = state.finished ? 0 : state.unlocked;
  return (
    <DarkFrame onOutline={() => setOutline(true)}>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 pb-12 pt-6 text-center" data-testid="home">
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.24em] text-[var(--muted)]">Module two</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-[var(--heading)] sm:text-6xl">{MODULE_NAME}</h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--body)]">{MODULE_SUBTITLE}</p>
        <p className="mt-6 text-xl font-semibold text-[var(--heading)]">{SEGMENT_TITLE}</p>
        <button
          type="button"
          className="btn-main mt-8"
          onClick={() => openStage(nextIndex)}
          data-testid="start-button"
        >
          {state.completed.length === 0 ? "Start" : state.finished ? "Start again" : `Continue: ${STAGES[nextIndex].number}`} <Arrow />
        </button>
        <p className="mt-3 text-base text-[var(--muted)]">About {SEGMENT_MINUTES} minutes · Stages 1.1–1.6</p>

        <section className="mt-12 w-full max-w-2xl text-left" aria-labelledby="in-segment">
          <p id="in-segment" className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
            In this segment
          </p>
          <ol className="flex flex-col gap-2">
            {STAGES.map((s, i) => {
              const done = state.completed.includes(s.id);
              const open = i <= state.unlocked;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={!open}
                    onClick={() => openStage(i)}
                    className="flex min-h-14 w-full items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-left transition enabled:hover:border-[var(--blue-tonal-border)] disabled:opacity-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[var(--blue)]"
                    data-testid={`menu-stage-${s.id}`}
                    data-state={done ? "done" : open ? "open" : "locked"}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${
                        done
                          ? "border-[var(--success-tonal-border)] bg-[var(--success-tonal-bg)] text-[var(--success)]"
                          : open
                            ? "border-[var(--blue-tonal-border)] bg-[var(--blue-tonal-bg)] text-[var(--blue)]"
                            : "border-[var(--border)] text-[var(--muted)]"
                      }`}
                    >
                      {done ? <CheckIcon /> : !open ? <LockIcon /> : <span className="h-2 w-2 rounded-full bg-current" />}
                    </span>
                    <span className="flex-1 text-lg text-[var(--heading)]">
                      <span className="text-[var(--muted)]">{s.number}</span> {s.title}
                    </span>
                    <span className="hidden text-sm text-[var(--muted)] sm:inline">{s.kind} · {s.aboutMinutes} min</span>
                  </button>
                </li>
              );
            })}
          </ol>
          {confirmReset ? (
            <div className="mt-6 rounded-[20px] border border-[var(--amber-tonal-border)] bg-[var(--amber-tonal-bg)] p-5" role="alertdialog" aria-labelledby="reset-q" data-testid="reset-confirm">
              <p id="reset-q" className="mb-4 text-lg text-[var(--heading)]">
                Start the segment from the beginning? Your signs, notes and practice recordings on this device will be removed.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn-primary"
                  data-testid="reset-yes"
                  onClick={async () => {
                    reset();
                    await clearRecordings().catch(() => {});
                    setConfirmReset(false);
                  }}
                >
                  Yes, start over
                </button>
                <button type="button" className="btn-secondary" onClick={() => setConfirmReset(false)} autoFocus>
                  Keep my progress
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="mt-6 text-base font-semibold text-[var(--blue)] hover:underline" onClick={() => setConfirmReset(true)} data-testid="reset-progress">
              Start over
            </button>
          )}
        </section>
      </main>
      {outline && <OutlinePanel onClose={() => setOutline(false)} onOpenStage={openStage} />}
    </DarkFrame>
  );
}

/** Dark platform frame (Module Opening, Segment/Section Complete): navy gradient, logo header. */
function DarkFrame({ children, onOutline }: { children: React.ReactNode; onOutline?: () => void }) {
  return (
    <div className="theme-dark flex min-h-dvh flex-col" style={{ background: "radial-gradient(1200px 600px at 50% 110%, rgba(243,171,49,0.10), transparent 60%), var(--page-grad)" }}>
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <BrandMark />
        {onOutline && (
          <button
            type="button"
            onClick={onOutline}
            className="grid h-11 w-11 place-items-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--heading)] hover:border-[var(--blue-tonal-border)]"
            aria-label="Course outline"
            data-testid="outline-button"
          >
            <ListIcon />
          </button>
        )}
      </header>
      {children}
    </div>
  );
}

/** Rail of stage markers (platform segment rail): done, current and next. */
function StageRail({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Stages in this segment">
      {STAGES.map((s, i) => (
        <li
          key={s.id}
          className={`grid h-8 w-8 place-items-center rounded-full border text-xs font-semibold ${
            i <= current
              ? "border-[var(--blue-tonal-border)] bg-[var(--blue-tonal-bg)] text-[var(--heading)]"
              : "border-[var(--border)] bg-white/5 text-[var(--muted)]"
          }`}
          aria-label={`${s.number} ${s.title}${i <= current ? ", complete" : ""}`}
        >
          {i <= current ? <CheckIcon /> : s.number.split(".")[1]}
        </li>
      ))}
    </ol>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Locked">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
