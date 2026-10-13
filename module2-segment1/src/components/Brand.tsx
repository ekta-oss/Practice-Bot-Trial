"use client";

import { createPortal } from "react-dom";
import { MODULE_TITLE, SEGMENT_TITLE, STAGES } from "@/content/segment1";
import { useProgress } from "@/lib/progress";

/** Swift AI Academy logo mark + wordmark (platform header). */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="brand/logo-mark.png" alt="" className="h-5 w-auto" />
      <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--heading)]">Swift AI Academy</span>
    </span>
  );
}

export function ListIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 6h16M4 12h10M4 18h7" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function CheckIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/**
 * Course outline drawer (platform "Course-Outline-Panel"): the only place that
 * shows where the learner is in the course. Opened from the list icon.
 */
export function OutlinePanel({ currentId, onClose, onOpenStage }: { currentId?: string; onClose: () => void; onOpenStage: (index: number) => void }) {
  const { state } = useProgress();
  const done = state.completed.length;
  return createPortal(
    <div className="theme-dark fixed inset-0 z-50 flex justify-end bg-[rgba(4,7,22,0.55)]" role="dialog" aria-modal="true" aria-label="Course outline" onClick={onClose} data-testid="outline-panel">
      <div className="flex h-full w-full max-w-md flex-col bg-[#0b1440] text-[var(--body)] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--muted)]">Module 2</p>
            <p className="mt-1 text-lg font-semibold leading-snug text-[var(--heading)]">{MODULE_TITLE.split("—")[0].trim()}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[var(--border)] text-[var(--heading)] hover:bg-white/10" aria-label="Close outline" autoFocus>
            <CloseIcon />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="px-2 pb-2 text-base font-semibold text-[var(--heading)]">{SEGMENT_TITLE}</p>
          <ol className="flex flex-col gap-1">
            {STAGES.map((s, i) => {
              const isDone = state.completed.includes(s.id);
              const isOpen = i <= state.unlocked;
              const isCurrent = s.id === currentId;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    disabled={!isOpen}
                    onClick={() => onOpenStage(i)}
                    aria-current={isCurrent ? "step" : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-base transition disabled:cursor-not-allowed ${
                      isCurrent ? "bg-[var(--blue-tonal-bg)] ring-1 ring-[var(--blue-tonal-border)]" : "hover:bg-white/5"
                    } ${isOpen ? "text-[var(--heading)]" : "text-[var(--muted)]"}`}
                    data-testid={`outline-stage-${s.id}`}
                  >
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs ${
                        isDone
                          ? "border-[var(--success-tonal-border)] bg-[var(--success-tonal-bg)] text-[var(--success)]"
                          : isCurrent
                            ? "border-[var(--blue)] bg-[var(--blue)] text-white"
                            : "border-[var(--border)]"
                      }`}
                    >
                      {isDone ? <CheckIcon /> : isCurrent ? "•" : ""}
                    </span>
                    <span className="flex-1">
                      {s.number} {s.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <p className="border-t border-[var(--border)] px-6 py-4 text-sm text-[var(--muted)]">
          Segment 1 · {done} of {STAGES.length} stages complete
        </p>
      </div>
    </div>,
    document.body,
  );
}
