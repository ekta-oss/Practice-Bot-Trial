"use client";

import { useEffect, useState } from "react";
import { COLOUR_KEY_LINES, S1_2, WALK_SIGNS, savedSignLabel } from "@/content/segment1";
import { useProgress } from "@/lib/progress";
import { listRecordings, type StoredRecording } from "@/lib/recordings";
import { SignIcon, SIGN_COLOURS } from "./SignIcon";
import { SpeakerIcon } from "./Recorder";

/**
 * Notebook icon 'My signs' with a number (bottom left on every screen) and the
 * learner's notebook: 'My signs', 'My notes' (the colour key card from 1.6)
 * and their practice recordings (stored on this device only).
 */
export function Notebook() {
  const { state } = useProgress();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"signs" | "notes" | "recordings">("signs");
  const count = state.mySigns.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex h-12 items-center gap-2 rounded-full bg-amber-100 px-4 text-base font-semibold text-amber-950 ring-1 ring-amber-300 hover:bg-amber-200 focus-visible:outline focus-visible:outline-4 focus-visible:outline-amber-400"
        data-testid="notebook-button"
        aria-label={`My signs: ${count}. Open notebook`}
      >
        <NotebookIcon />
        <span className="hidden sm:inline">My signs</span>
        <span className="grid h-7 min-w-7 place-items-center rounded-full bg-amber-700 px-1.5 text-sm text-white" data-testid="notebook-count" id="notebook-target">
          {count}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-start bg-slate-900/40" role="dialog" aria-modal="true" aria-label="My notebook" onClick={() => setOpen(false)}>
          <div className="flex h-full w-full max-w-xl flex-col bg-amber-50 shadow-2xl" onClick={(e) => e.stopPropagation()} data-testid="notebook-panel">
            <div className="flex items-center justify-between border-b border-amber-200 px-5 py-3">
              <div role="tablist" className="flex gap-1">
                {(
                  [
                    ["signs", `My signs (${count})`],
                    ["notes", `My notes (${state.myNotes.length})`],
                    ["recordings", "My recordings"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={tab === id}
                    onClick={() => setTab(id)}
                    className={`rounded-full px-3 py-2 text-base ${tab === id ? "bg-amber-700 text-white" : "text-amber-950 hover:bg-amber-100"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-full text-2xl hover:bg-amber-100" aria-label="Close notebook" autoFocus>
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {tab === "signs" && <MySignsGrid />}
              {tab === "notes" && <MyNotes />}
              {tab === "recordings" && <MyRecordings />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function MySignsGrid({ onPick, compact }: { onPick?: (id: string) => void; compact?: boolean }) {
  const { state } = useProgress();
  if (state.mySigns.length === 0) return <p className="text-lg text-slate-600">No signs saved yet.</p>;
  return (
    <ul className={`grid ${compact ? "gap-2" : "gap-3"} ${compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`} data-testid="my-signs-grid">
      {state.mySigns.map((s) => {
        const sign = WALK_SIGNS.find((w) => w.id === s.id)!;
        const inner = (
          <>
            <SignIcon sign={sign} size="fill" className={compact ? "max-w-[64px]" : "max-w-[110px]"} />
            <span className={`text-center leading-tight text-slate-800 ${compact ? "text-xs sm:text-sm" : "text-sm"}`}>{savedSignLabel(sign)}</span>
            {s.isNew && <span className="absolute right-1 top-1 rounded-full bg-sky-600 px-2 py-0.5 text-xs font-semibold text-white">{S1_2.newTag}</span>}
          </>
        );
        return (
          <li key={s.id} data-testid={`my-sign-${s.id}`} data-new={s.isNew}>
            {onPick ? (
              <button type="button" onClick={() => onPick(s.id)} className="relative flex w-full flex-col items-center gap-2 rounded-xl bg-white p-2 ring-1 ring-slate-200 hover:ring-teal-500 focus-visible:outline focus-visible:outline-4 focus-visible:outline-amber-400">
                {inner}
              </button>
            ) : (
              <div className="relative flex flex-col items-center gap-2 rounded-xl bg-white p-2 ring-1 ring-slate-200">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ColourKeyCard({ compact }: { compact?: boolean }) {
  return (
    <div className={`rounded-xl bg-white ring-1 ring-slate-300 ${compact ? "p-2 text-sm" : "p-4 text-lg"}`} data-testid="colour-key-card" aria-label="Colour key">
      <ul className="space-y-1">
        {COLOUR_KEY_LINES.map((l) => (
          <li key={l.colour} className="flex items-center gap-2">
            <span className="h-3 w-6 shrink-0 rounded-sm" style={{ background: SIGN_COLOURS[l.colour] }} aria-hidden />
            <span>{l.line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MyNotes() {
  const { state } = useProgress();
  if (state.myNotes.length === 0) return <p className="text-lg text-slate-600">No notes yet.</p>;
  return (
    <div className="space-y-4">
      {state.myNotes.map((n) => (n.id === "colour-key" ? <ColourKeyCard key={n.id} /> : null))}
    </div>
  );
}

function MyRecordings() {
  const [recs, setRecs] = useState<StoredRecording[] | null>(null);
  useEffect(() => {
    const load = () => listRecordings().then(setRecs).catch(() => setRecs([]));
    load();
    window.addEventListener("m2s1-recordings-changed", load);
    return () => window.removeEventListener("m2s1-recordings-changed", load);
  }, []);
  if (!recs) return null;
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-base text-slate-700">
        <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold text-white">Practice</span> Only you can hear this.
      </p>
      {recs.length === 0 && <p className="text-lg text-slate-600">No recordings kept yet.</p>}
      {recs
        .sort((a, b) => a.savedAt - b.savedAt)
        .map((r) => (
          <RecordingRow key={r.key} rec={r} />
        ))}
    </div>
  );
}

function RecordingRow({ rec }: { rec: StoredRecording }) {
  const [url] = useState(() => URL.createObjectURL(rec.blob));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200" data-testid="saved-recording">
      <SpeakerIcon />
      <span className="flex-1 text-base">
        Stage {rec.stageId} · {Math.round(rec.durationMs / 1000)} s
      </span>
      <audio controls src={url} className="h-10 max-w-[60%]" />
    </div>
  );
}

function NotebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 3v18M12 8h4M12 12h4" />
    </svg>
  );
}
