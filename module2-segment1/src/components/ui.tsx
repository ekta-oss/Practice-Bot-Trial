"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { lineDurationMs } from "@/lib/media";
import { createPortal } from "react-dom";
import { useShellSlots } from "./StageShell";
import type { NowPlaying } from "@/lib/runtime";
import { ReplayIcon, WaveLine } from "./Recorder";

/** Circular-arrow replay button. Replay always starts from the beginning. */
function ReplayButton({ onReplay, overlay }: { onReplay: () => void; overlay?: boolean }) {
  return (
    <button
      type="button"
      onClick={onReplay}
      aria-label="Replay from the beginning"
      data-testid="replay"
      className={`grid h-11 w-11 place-items-center rounded-full bg-white text-teal-800 shadow ring-1 ring-teal-200 hover:bg-teal-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-amber-400 ${overlay ? "pointer-events-auto absolute bottom-2 right-2 z-10" : ""}`}
    >
      <ReplayIcon />
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
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  testId?: string;
}) {
  return (
    <button type="button" className="btn-main" onClick={onClick} disabled={disabled} data-testid={testId ?? "main-button"}>
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
export function FeedbackCard({ kind, children, testId }: { kind: FeedbackKind; children: React.ReactNode; testId?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const styles: Record<FeedbackKind, string> = {
    right: "bg-emerald-50 text-emerald-900 ring-emerald-300",
    wrong: "bg-amber-50 text-amber-950 ring-amber-300 animate-[shake_0.4s_ease-in-out]",
    hint: "bg-yellow-50 text-yellow-950 ring-yellow-300",
    info: "bg-teal-50 text-teal-950 ring-teal-200",
    reveal: "bg-sky-50 text-sky-950 ring-sky-300",
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
      className={`flex items-start gap-3 rounded-2xl px-5 py-4 text-lg ring-2 outline-none ${styles[kind]}`}
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
      className={`grid h-12 w-12 place-items-center rounded-full transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-amber-400 ${
        glowing ? "bg-yellow-200 text-yellow-700 shadow-[0_0_18px_4px_rgba(250,204,21,0.7)]" : "bg-slate-100 text-slate-400"
      }`}
    >
      <BulbIcon glowing={glowing} />
    </button>
  );
}

export function TickIcon({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0 text-emerald-600`} aria-hidden>
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

/** Splits a line into subtitle chunks of at most ~12 words, breaking at sentence and clause ends. */
export function subtitleChunks(text: string, maxWords = 12): string[] {
  const pieces = text.split(/(?<=[.!?,;:—])\s+/);
  const out: string[] = [];
  let cur: string[] = [];
  for (const p of pieces) {
    const w = p.split(/\s+/);
    if (cur.length && cur.length + w.length > maxWords) {
      out.push(cur.join(" "));
      cur = [];
    }
    if (w.length > maxWords) {
      for (let i = 0; i < w.length; i += maxWords) out.push(w.slice(i, i + maxWords).join(" "));
    } else cur.push(...w);
  }
  if (cur.length) out.push(cur.join(" "));
  return out;
}

/** Shows the chunk of the current line that matches the time spoken so far (105–115 wpm). */
function useChunk(now: NowPlaying | null) {
  // The index belongs to one `now`; a new line starts again at chunk 0.
  const [pos, setPos] = useState<{ of: NowPlaying | null; idx: number }>({ of: null, idx: 0 });
  const chunks = useMemo(() => (now ? subtitleChunks(now.line.text) : []), [now]);
  useEffect(() => {
    if (!now || chunks.length < 2) return;
    const total = lineDurationMs(now.line);
    const words = chunks.map((c) => c.split(/\s+/).length);
    const sum = words.reduce((a, b) => a + b, 0);
    const timers: number[] = [];
    let t = 0;
    for (let i = 0; i < chunks.length - 1; i++) {
      t += (words[i] / sum) * total;
      timers.push(window.setTimeout(() => setPos({ of: now, idx: i + 1 }), t));
    }
    return () => timers.forEach((x) => window.clearTimeout(x));
  }, [now, chunks]);
  return chunks[pos.of === now ? pos.idx : 0] ?? "";
}

function MissingAudio({ now }: { now: NowPlaying }) {
  if (!now.missing) return null;
  return (
    <span className="rounded bg-fuchsia-700 px-2 py-0.5 text-xs font-semibold text-white" data-testid="missing-audio" title="This audio file has not been delivered yet.">
      Audio missing: {now.line.file}
      {now.standIn ? " · stand-in voice" : ""}
    </span>
  );
}

/** Subtitles over a picture: lower part of the picture, at most 20% of its height. */
export function Subtitles({ now, onReplay }: { now: NowPlaying | null; onReplay?: () => void }) {
  const chunk = useChunk(now);
  if (!now) return onReplay ? <ReplayButton onReplay={onReplay} overlay /> : null;
  return (
    <>
      <div className="pointer-events-none absolute right-2 top-2 z-10">
        <MissingAudio now={now} />
      </div>
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
          <MissingAudio now={now} />
        </>
      )}
    </div>
  );
}

export function MissingAssetBadge({ what }: { what: string }) {
  return (
    <span className="rounded bg-fuchsia-700 px-2 py-0.5 text-xs font-semibold text-white" data-testid="missing-asset">
      {what}
    </span>
  );
}
