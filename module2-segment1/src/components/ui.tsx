"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { lineDurationMs } from "@/lib/media";
import { createPortal } from "react-dom";
import { useShellSlots } from "./StageShell";
import { lineAudio, useSay, type NowPlaying } from "@/lib/runtime";
import { chunkStart, subtitleChunks } from "@/lib/voiceTiming";
import { ReplayIcon, WaveLine } from "./Recorder";

/** "Listen again" button (replay always starts from the beginning). Labelled, so a first-time learner knows what it does. */
function ReplayButton({ onReplay, overlay }: { onReplay: () => void; overlay?: boolean }) {
  return (
    <button
      type="button"
      onClick={onReplay}
      aria-label="Listen again from the beginning"
      data-testid="replay"
      className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-[var(--card)] px-4 text-base font-semibold text-[var(--blue)] shadow ring-1 ring-[var(--blue-tonal-border)] hover:bg-[var(--blue-tonal-bg)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[var(--blue)] ${overlay ? "pointer-events-auto absolute bottom-2 right-2 z-10" : ""}`}
    >
      <ReplayIcon />
      <span aria-hidden>Listen again</span>
    </button>
  );
}

/* ---------------- Footer portal (main button bottom-right) ---------------- */

export function FooterActions({ children, left }: { children?: React.ReactNode; left?: React.ReactNode }) {
  const { footerRight, footerLeft } = useShellSlots();
  return (
    <>
      {footerRight && children ? createPortal(children, footerRight) : null}
      {footerLeft && left ? createPortal(left, footerLeft) : null}
    </>
  );
}

export function MainButton({
  children,
  onClick,
  disabled,
  testId,
  finish,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  testId?: string;
  /** The yellow end-of-activity button from the mock-ups. */
  finish?: boolean;
}) {
  return (
    <button type="button" className={finish ? "btn-main btn-finish" : "btn-main"} onClick={onClick} disabled={disabled} data-testid={testId ?? "main-button"}>
      {children}
    </button>
  );
}

/* ---------------- Feedback ---------------- */

export type FeedbackKind = "right" | "wrong" | "hint" | "info" | "reveal";

/**
 * Right: green tick (the chime is played by the caller).
 * Wrong: a gentle shake and an amber card (never red, never a buzzer).
 * Hint: lightbulb help card.
 */
export function FeedbackCard({ kind, children, testId, speak }: { kind: FeedbackKind; children: React.ReactNode; testId?: string; speak?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  // Read the card aloud (narrator voice) when it appears.
  useSay([speak && typeof children === "string" ? children : null]);
  const styles: Record<FeedbackKind, string> = {
    right: "bg-[var(--success-tonal-bg)] text-[var(--heading)] ring-[var(--success-tonal-border)]",
    wrong: "bg-[var(--amber-tonal-bg)] text-[var(--heading)] ring-[var(--amber-tonal-border)] animate-[shake_0.4s_ease-in-out]",
    hint: "bg-[var(--blue-tonal-bg)] text-[var(--heading)] ring-[var(--blue-tonal-border)]",
    info: "bg-[var(--card)] text-[var(--heading)] ring-[var(--border)]",
    reveal: "bg-[var(--blue-tonal-bg)] text-[var(--heading)] ring-[var(--blue-tonal-border)]",
  };
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      data-testid={testId ?? `feedback-${kind}`}
      data-kind={kind}
      className={`flex items-start gap-3 rounded-[16px] px-5 py-4 text-lg ring-1 outline-none ${styles[kind]}`}
    >
      {kind === "right" && <TickIcon />}
      {kind === "hint" && <BulbIcon glowing />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function HintBulb({ glowing, onClick, open }: { glowing: boolean; onClick: () => void; open?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!glowing}
      aria-label="Hint"
      aria-expanded={open}
      data-testid="hint-bulb"
      data-glowing={glowing}
      className={`grid h-12 w-12 place-items-center rounded-full transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-[var(--blue)] ${
        glowing ? "border border-[var(--blue-tonal-border)] bg-[var(--blue-tonal-bg)] text-[var(--blue)] shadow-[0_0_18px_4px_rgba(255,193,104,0.55)]" : "border border-[var(--border)] bg-[var(--card)] text-[var(--muted)]"
      }`}
    >
      <BulbIcon glowing={glowing} />
    </button>
  );
}

export function TickIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0 text-[var(--success)]`} aria-hidden>
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BulbIcon({ glowing }: { glowing?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 shrink-0" aria-hidden>
      <path d="M9 18h6M10 21h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" fill={glowing ? "#facc15" : "currentColor"} stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

/* ---------------- Subtitles (lower 15% of the picture) ---------------- */

const ROLE_NAME: Record<string, string> = { NAR: "Narrator", PIC: "Person in charge", MOD: "Model voice" };

/**
 * Shows the chunk of the current line that is being spoken. With a measured
 * voice file the chunk follows the audio's own clock (see lib/voiceTiming);
 * otherwise it is paced by the line's estimated length.
 */
function useChunk(now: NowPlaying | null) {
  // The index belongs to one `now`; a new line starts again at chunk 0.
  const [pos, setPos] = useState<{ of: NowPlaying | null; idx: number }>({ of: null, idx: 0 });
  const chunks = useMemo(() => (now ? subtitleChunks(now.line.text) : []), [now]);
  useEffect(() => {
    if (!now || chunks.length < 2) return;
    const starts = chunks.map((c) => chunkStart(now.line.file, c));
    const audio = !now.missing ? lineAudio(now.line.file) : undefined;
    if (audio && starts.every((s) => s !== undefined)) {
      // Follow the audio: the last chunk whose start has been reached.
      const tick = window.setInterval(() => {
        const t = audio.currentTime;
        let idx = 0;
        starts.forEach((s, i) => {
          if (t >= s! - 0.05) idx = i;
        });
        setPos((p) => (p.of === now && p.idx === idx ? p : { of: now, idx }));
      }, 60);
      return () => window.clearInterval(tick);
    }
    const total = lineDurationMs(now.line);
    const words = chunks.map((c) => c.text.split(/\s+/).length);
    const sum = words.reduce((a, b) => a + b, 0);
    const timers: number[] = [];
    let t = 0;
    for (let i = 0; i < chunks.length - 1; i++) {
      t += (words[i] / sum) * total;
      timers.push(window.setTimeout(() => setPos({ of: now, idx: i + 1 }), t));
    }
    return () => timers.forEach((x) => window.clearTimeout(x));
  }, [now, chunks]);
  return chunks[pos.of === now ? pos.idx : 0]?.text ?? "";
}

/** Subtitles over a picture: lower part of the picture, at most 20% of its height. */
export function Subtitles({ now, onReplay }: { now: NowPlaying | null; onReplay?: () => void }) {
  const chunk = useChunk(now);
  if (!now) return onReplay ? <ReplayButton onReplay={onReplay} overlay /> : null;
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex max-h-[20%] items-end justify-center px-3 pb-[2%]">
        <p className="max-w-[92%] rounded-md bg-black/75 px-3 py-1 text-center text-sm leading-snug text-white sm:text-lg" lang="en" data-testid="subtitle" aria-hidden>
          {chunk}
        </p>
        <span className="sr-only" aria-live="polite">
          {ROLE_NAME[now.line.role]}: {now.line.text}
        </span>
      </div>
    </>
  );
}

/** Subtitle strip used where there is no picture (quizzes, games). */
export function NarrationBar({ now, onReplay }: { now: NowPlaying | null; onReplay?: () => void }) {
  const chunk = useChunk(now);
  return (
    <div className="flex min-h-12 flex-col items-center gap-1">
      {!now && onReplay && <ReplayButton onReplay={onReplay} />}
      {now && (
        <>
          <WaveLine />
          <p className="max-w-3xl rounded-md bg-black/75 px-3 py-1 text-center text-base text-white sm:text-lg" data-testid="subtitle" aria-hidden>
            {chunk}
          </p>
          <span className="sr-only" aria-live="polite">
            {ROLE_NAME[now.line.role]}: {now.line.text}
          </span>
        </>
      )}
    </div>
  );
}
