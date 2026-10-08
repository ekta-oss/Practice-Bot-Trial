"use client";

import { useState } from "react";
import { END_OF_SCOPE, MODULE_TITLE, SEGMENT_TITLE, STAGES, UI } from "@/content/segment1";
import { ProgressProvider, useProgress } from "@/lib/progress";
import { clearRecordings } from "@/lib/recordings";
import { StageShell } from "./StageShell";
import { TickIcon } from "./ui";
import { Stage1_1 } from "@/stages/Stage1_1";
import { Stage1_2 } from "@/stages/Stage1_2";
import { Stage1_3 } from "@/stages/Stage1_3";
import { Stage1_4 } from "@/stages/Stage1_4";
import { Stage1_5 } from "@/stages/Stage1_5";
import { Stage1_6 } from "@/stages/Stage1_6";

const COMPONENTS = [Stage1_1, Stage1_2, Stage1_3, Stage1_4, Stage1_5, Stage1_6];

type View = { kind: "home" } | { kind: "stage"; index: number } | { kind: "end" };

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
  const [runKey, setRunKey] = useState(0);

  if (!ready) return null;

  if (view.kind === "stage") {
    const meta = STAGES[view.index];
    const Comp = COMPONENTS[view.index];
    return (
      <StageShell key={`${meta.id}-${runKey}`} meta={meta} onRestart={() => setRunKey((k) => k + 1)} onMenu={() => setView({ kind: "home" })}>
        <Comp
          onComplete={() => {
            completeStage(meta.id);
            setRunKey((k) => k + 1);
            if (view.index + 1 < STAGES.length) setView({ kind: "stage", index: view.index + 1 });
            else setView({ kind: "end" });
          }}
        />
      </StageShell>
    );
  }

  if (view.kind === "end") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center" data-testid="end-screen">
        <TickIcon className="h-16 w-16" />
        <h1 className="text-3xl font-bold">{END_OF_SCOPE.title}</h1>
        <p className="text-xl text-slate-700">{END_OF_SCOPE.body}</p>
        <button type="button" className="btn-main" onClick={() => setView({ kind: "home" })}>
          Course menu
        </button>
      </main>
    );
  }

  const nextIndex = state.finished ? 0 : state.unlocked;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 py-8" data-testid="home">
      <header className="space-y-2">
        <p className="text-base text-teal-700">{MODULE_TITLE}</p>
        <h1 className="text-3xl font-bold text-slate-900">{SEGMENT_TITLE}</h1>
      </header>
      <ol className="space-y-2">
        {STAGES.map((s, i) => {
          const done = state.completed.includes(s.id);
          const open = i <= state.unlocked;
          return (
            <li key={s.id}>
              <button
                type="button"
                disabled={!open}
                onClick={() => {
                  setRunKey((k) => k + 1);
                  setView({ kind: "stage", index: i });
                }}
                className="flex min-h-16 w-full items-center gap-4 rounded-2xl bg-white px-5 py-3 text-left ring-1 ring-slate-200 transition enabled:hover:ring-teal-600 disabled:opacity-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-amber-400"
                data-testid={`menu-stage-${s.id}`}
                data-state={done ? "done" : open ? "open" : "locked"}
              >
                <span className="w-10 text-lg font-semibold text-teal-700">{s.number}</span>
                <span className="flex-1 text-lg">{s.title}</span>
                <span className="text-sm text-teal-700">{UI.aboutMinutes(s.aboutMinutes)}</span>
                {done ? <TickIcon className="h-6 w-6" /> : !open ? <LockIcon /> : <span className="h-6 w-6" />}
              </button>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          className="text-base text-slate-600 underline underline-offset-4 hover:text-slate-800"
          onClick={async () => {
            if (!window.confirm("Start the segment from the beginning? Your signs, notes and practice recordings on this device will be removed.")) return;
            reset();
            await clearRecordings().catch(() => {});
          }}
          data-testid="reset-progress"
        >
          Start over
        </button>
        <button
          type="button"
          className="btn-main"
          onClick={() => {
            setRunKey((k) => k + 1);
            setView({ kind: "stage", index: nextIndex });
          }}
          data-testid="start-button"
        >
          {state.completed.length === 0 ? "Start" : state.finished ? "Start again" : `Continue: ${STAGES[nextIndex].number}`}
        </button>
      </div>
    </main>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Locked">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
