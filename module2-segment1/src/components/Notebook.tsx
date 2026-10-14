"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { COLOUR_KEY_LINES, S1_2, STAGES, WALK_SIGNS, savedSignLabel } from "@/content/segment1";
import { heardUrl, useHeard, type HeardLine } from "@/lib/audioLibrary";
import { stopUi } from "@/lib/runtime";
import { holdMusic } from "@/lib/music";
import { useProgress } from "@/lib/progress";
import { listRecordings, type StoredRecording } from "@/lib/recordings";
import { SignIcon, SIGN_COLOURS } from "./SignIcon";
import { SpeakerIcon } from "./Recorder";

/**
 * Notebook icon 'My signs' with a number (bottom left on every screen) and the
 * learner's notebook: 'My signs', 'My notes' (the colour key card from 1.6),
 * their practice recordings, and 'Audio': every line they have heard, to play
 * again at any time (all stored on this device only).
 */
export function Notebook() {
  const { state } = useProgress();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"signs" | "notes" | "recordings" | "audio">("signs");
  const heard = useHeard();
  const count = state.mySigns.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative flex h-12 items-center gap-2 rounded-full border border-[var(--blue-tonal-border)] bg-[var(--blue-tonal-bg)] px-4 text-base font-semibold text-[var(--blue)] transition hover:brightness-105 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[var(--blue)]"
        data-testid="notebook-button"
        aria-label={`My signs: ${count}. Open notebook`}
      >
        <NotebookIcon />
        <span className="hidden sm:inline">My signs</span>
        <span className="grid h-8 min-w-8 place-items-center rounded-full bg-[#cfe3fb] px-1.5 text-base font-bold text-[var(--heading)]" data-testid="notebook-count" id="notebook-target">
          {count}
        </span>
      </button>

      {open &&
        createPortal(
        <div className="fixed inset-0 z-50 flex justify-start bg-[var(--overlay)]" role="dialog" aria-modal="true" aria-label="My notebook" onClick={() => setOpen(false)}>
          <div className="flex h-full w-full max-w-xl flex-col bg-[#fbfbfe] text-[#5c6690] shadow-2xl" onClick={(e) => e.stopPropagation()} data-testid="notebook-panel">
            <div className="flex items-center justify-between border-b border-[#e4e8f5] px-5 py-3">
              <div role="tablist" className="flex flex-wrap gap-1">
                {(
                  [
                    ["signs", `My signs (${count})`],
                    ["notes", `My notes (${state.myNotes.length})`],
                    ["recordings", "My recordings"],
                    ["audio", `Audio (${heard.length})`],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={tab === id}
                    onClick={() => setTab(id)}
                    className={`rounded-full px-3 py-2 text-base ${tab === id ? "bg-[#3c59f6] text-white" : "text-[#0e1a4f] hover:bg-[rgba(60,89,246,0.08)]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-full text-2xl text-[#0e1a4f] hover:bg-[rgba(60,89,246,0.08)]" aria-label="Close notebook" autoFocus>
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {tab === "signs" && <MySignsGrid />}
              {tab === "notes" && <MyNotes />}
              {tab === "recordings" && <MyRecordings />}
              {tab === "audio" && <MyAudio />}
            </div>
          </div>
        </div>,
          document.body,
        )}
    </>
  );
}

export function MySignsGrid({ onPick, compact }: { onPick?: (id: string) => void; compact?: boolean }) {
  const { state } = useProgress();
  if (state.mySigns.length === 0) return <p className="text-lg text-[var(--body)]">No signs saved yet.</p>;
  return (
    <ul className={`grid ${compact ? "gap-2" : "gap-3"} ${compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-3"}`} data-testid="my-signs-grid">
      {state.mySigns.map((s) => {
        const sign = WALK_SIGNS.find((w) => w.id === s.id)!;
        const inner = (
          <>
            <SignIcon sign={sign} size="fill" className={compact ? "max-w-[64px]" : "max-w-[110px]"} />
            <span className={`text-center leading-tight text-[var(--heading)] ${compact ? "text-xs sm:text-sm" : "text-sm"}`}>{savedSignLabel(sign)}</span>
            {s.isNew && <span className="absolute right-1 top-1 rounded-full bg-[var(--blue)] px-2 py-0.5 text-xs font-semibold text-white">{S1_2.newTag}</span>}
          </>
        );
        return (
          <li key={s.id} data-testid={`my-sign-${s.id}`} data-new={s.isNew}>
            {onPick ? (
              <button type="button" onClick={() => onPick(s.id)} className="relative flex w-full flex-col items-center gap-2 rounded-xl bg-[var(--card)] p-2 ring-1 ring-[var(--border)] hover:ring-[var(--blue-tonal-border)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[var(--blue)]">
                {inner}
              </button>
            ) : (
              <div className="relative flex flex-col items-center gap-2 rounded-xl bg-[var(--card)] p-2 ring-1 ring-[var(--border)]">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function ColourKeyCard({ compact, inline }: { compact?: boolean; inline?: boolean }) {
  return (
    <div className={`rounded-xl bg-[var(--card)] ring-1 ring-[var(--border)] ${compact ? "p-2 text-sm" : "p-4 text-lg"} ${inline ? "px-4 text-base" : ""}`} data-testid="colour-key-card" aria-label="Colour key">
      <ul className={inline ? "flex flex-wrap justify-center gap-x-5 gap-y-1" : "space-y-1"}>
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
  if (state.myNotes.length === 0) return <p className="text-lg text-[var(--body)]">No notes yet.</p>;
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
      <p className="flex items-center gap-2 text-base text-[var(--body)]">
        <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold text-white">Practice</span> Only you can hear this.
      </p>
      {recs.length === 0 && <p className="text-lg text-[var(--body)]">No recordings yet.</p>}
      {recs.length > 0 && <p className="text-base text-[var(--body)]">Every take is kept here, so you can listen again and compare.</p>}
      {recs.map((r) => (
        <RecordingRow key={r.key} rec={r} take={recs.filter((x) => x.stageId === r.stageId).indexOf(r) + 1} />
      ))}
    </div>
  );
}

function RecordingRow({ rec, take }: { rec: StoredRecording; take: number }) {
  const [url] = useState(() => URL.createObjectURL(rec.blob));
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <div className="flex items-center gap-3 rounded-xl bg-[var(--card)] p-3 ring-1 ring-[var(--border)]" data-testid="saved-recording" data-kept={rec.kept}>
      <SpeakerIcon />
      <span className="flex-1 text-base">
        Stage {rec.stageId} · Take {take} · {Math.max(1, Math.round(rec.durationMs / 1000))} s
        {rec.kept && <span className="ml-2 rounded-full bg-[var(--success-tonal-bg)] px-2 py-0.5 text-sm font-semibold text-[var(--heading)] ring-1 ring-[var(--success-tonal-border)]">Kept</span>}
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

const ROLE_LABEL: Record<HeardLine["role"], string> = { NAR: "Narrator", PIC: "Person in charge", MOD: "Model voice", UI: "Instruction" };

/** Every line the learner has heard, by stage, each with a play button. */
function MyAudio() {
  const heard = useHeard();
  const [playing, setPlaying] = useState<string | null>(null);
  const player = useRef<{ audio: HTMLAudioElement; revoke?: () => void } | null>(null);

  const stop = () => {
    player.current?.audio.pause();
    player.current?.revoke?.();
    player.current = null;
    setPlaying(null);
    holdMusic("audio-library", false);
  };
  useEffect(() => stop, []);

  const play = async (file: string) => {
    const again = playing === file;
    stop();
    if (again) return;
    stopUi();
    const { url, revoke } = await heardUrl(file);
    const audio = new Audio(url);
    player.current = { audio, revoke };
    audio.onended = stop;
    setPlaying(file);
    holdMusic("audio-library", true);
    void audio.play().catch(stop);
  };

  if (heard.length === 0) return <p className="text-lg text-[var(--body)]">Nothing yet. Every line you hear is kept here, so you can listen again.</p>;
  return (
    <div className="space-y-6" data-testid="audio-library">
      {STAGES.filter((st) => heard.some((h) => h.stage === st.id)).map((st) => (
        <section key={st.id}>
          <h3 className="mb-2 text-base font-semibold text-[#0e1a4f]">
            {st.number} {st.title}
          </h3>
          <ul className="space-y-2">
            {heard
              .filter((h) => h.stage === st.id)
              .map((h) => (
                <li key={h.file} className="flex items-start gap-3 rounded-xl bg-white p-3 ring-1 ring-[#e4e8f5]" data-testid={`heard-${h.file}`}>
                  <button
                    type="button"
                    onClick={() => void play(h.file)}
                    aria-label={`${playing === h.file ? "Stop" : "Play"}: ${h.text}`}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--blue-tonal-bg)] text-[var(--blue)] ring-1 ring-[var(--blue-tonal-border)] hover:brightness-105 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[var(--blue)]"
                    data-testid="heard-play"
                  >
                    {playing === h.file ? <StopGlyph /> : <PlayGlyph />}
                  </button>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#5c6690]">{ROLE_LABEL[h.role]}</p>
                    <p className="text-base text-[#0e1a4f]">{h.text}</p>
                  </div>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PlayGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M8 5.5v13l10.5-6.5z" />
    </svg>
  );
}

function StopGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <rect x="7" y="7" width="10" height="10" rx="1.5" />
    </svg>
  );
}
