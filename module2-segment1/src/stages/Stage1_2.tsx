"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PLACES, S1_2, UI, WALK_SIGNS, savedSignLabel, type WalkSign } from "@/content/segment1";
import { chime } from "@/lib/media";
import { useProgress } from "@/lib/progress";
import { useLinePlayer, useRestartsOnResume } from "@/lib/runtime";
import { SceneFrame } from "@/components/Scene";
import { HOTSPOTS } from "@/components/scenes";
import { SignIcon } from "@/components/SignIcon";
import { FeedbackCard, FooterActions, MainButton, Subtitles, TickIcon } from "@/components/ui";

/**
 * 1.2 Walk round your new workplace.
 * 4 pictures, always in this order: Entrance → Corridor → Pantry → Meeting room.
 * All signs are already in place when a picture opens (nothing pops up).
 * Tap a sign → it opens big → a small green tick → it moves into the notebook
 * → the number goes up by 1. Saved with the place name ('FIRST AID — Pantry').
 */
type Step = "walk" | "lookAgain" | "allFound" | "carriedOn";

export function Stage1_2({ onComplete }: { onComplete: () => void }) {
  const { state, saveSign, addMissedSigns } = useProgress();
  const [placeIdx, setPlaceIdx] = useState(0);
  const [step, setStep] = useState<Step>("walk");
  const [big, setBig] = useState<{ sign: WalkSign; isNewSave: boolean; flying: boolean; fly?: { x: number; y: number } } | null>(null);
  const nar = useLinePlayer();
  const timers = useRef<number[]>([]);
  useRestartsOnResume(false);

  useEffect(() => {
    void nar.play([S1_2.nar1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const savedIds = new Set(state.mySigns.map((s) => s.id));
  const place = PLACES[placeIdx];
  const isLast = placeIdx === PLACES.length - 1;
  const signsHere = WALK_SIGNS.filter((s) => s.place === place.id);

  const finishBig = useCallback(
    (sign: WalkSign, isNewSave: boolean) => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      if (isNewSave) saveSign(sign.id);
      setBig(null);
      document.querySelector<HTMLElement>(`[data-hotspot="${sign.id}"]`)?.focus();
    },
    [saveSign],
  );

  const tapSign = (sign: WalkSign) => {
    const isNewSave = !savedIds.has(sign.id);
    setBig({ sign, isNewSave, flying: false });
    if (!isNewSave) return;
    chime();
    // 1. big in the middle; 2. green tick; 3. moves into the notebook; 4. number goes up.
    timers.current.push(
      window.setTimeout(() => {
        const target = document.getElementById("notebook-target")?.getBoundingClientRect();
        const fly = target ? { x: target.left + target.width / 2 - window.innerWidth / 2, y: target.top + target.height / 2 - window.innerHeight / 2 } : { x: -400, y: 300 };
        setBig((b) => (b ? { ...b, flying: true, fly } : b));
      }, 1100),
      window.setTimeout(() => finishBig(sign, true), 1750),
    );
  };

  const onFinishWalk = () => {
    if (state.mySigns.length >= WALK_SIGNS.length) setStep("allFound");
    else setStep("lookAgain");
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-3 py-3 sm:px-6">
      {/* Top: 'My signs: 0' (counts up; no target number is shown). */}
      <div className="flex items-center justify-between gap-3">
        <MiniMap current={placeIdx} />
        <p className="rounded-full bg-amber-100 px-4 py-1.5 text-lg font-semibold text-amber-950 ring-1 ring-amber-300" data-testid="my-signs-counter" aria-live="polite">
          {S1_2.counter(state.mySigns.length)}
        </p>
      </div>

      {/* On narrow screens the picture is wider than the screen: swipe to look round. */}
      <div className="relative">
      <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:overflow-visible sm:px-0" data-testid="scene-scroller">
        <SceneFrame place={place.id} className="mx-auto w-[210%] rounded-2xl shadow sm:w-full sm:max-w-[calc(60vh*16/9)]">
          <h2 className="sr-only">{place.name}</h2>
          {signsHere.map((s) => {
            const pos = HOTSPOTS[s.id];
            const saved = savedIds.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                data-hotspot={s.id}
                data-saved={saved}
                onClick={() => tapSign(s)}
                aria-label={`${s.word} sign. ${s.placement}${saved ? " Saved." : ""}`}
                className="absolute flex min-h-11 min-w-11 items-center justify-center rounded-md transition hover:scale-105 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
                style={{ left: `${pos.left}%`, top: `${pos.top}%`, width: `${pos.width}%` }}
              >
                <SignIcon sign={s} size="fill" />
              </button>
            );
          })}
        </SceneFrame>
      </div>
      <Subtitles now={nar.now} onReplay={nar.hasPlayed ? nar.replay : undefined} />
      </div>

      {big && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-slate-900/30"
          onClick={() => finishBig(big.sign, big.isNewSave)}
          data-testid="big-sign"
          role="dialog"
          aria-modal="true"
          aria-label={savedSignLabel(big.sign)}
        >
          <div
            className="flex flex-col items-center gap-3 rounded-3xl bg-white p-6 shadow-2xl"
            style={
              big.flying && big.fly
                ? ({ "--fly-x": `${big.fly.x}px`, "--fly-y": `${big.fly.y}px`, animation: "fly-to-notebook 0.65s ease-in forwards" } as React.CSSProperties)
                : { animation: "pop-in 0.3s ease-out" }
            }
          >
            <div className="relative">
              <SignIcon sign={big.sign} size={240} />
              {big.isNewSave && (
                <span className="absolute -right-4 -top-4 rounded-full bg-white p-1 shadow" data-testid="saved-tick">
                  <TickIcon className="h-10 w-10" />
                </span>
              )}
            </div>
            <p className="text-xl font-semibold text-slate-800">{savedSignLabel(big.sign)}</p>
            {big.isNewSave && (
              <p className="text-lg text-emerald-800" role="status" data-testid="saved-toast">
                {S1_2.saved}
              </p>
            )}
            <button type="button" className="btn-secondary" onClick={() => finishBig(big.sign, big.isNewSave)} autoFocus>
              OK
            </button>
          </div>
        </div>
      )}

      {step === "lookAgain" && (
        <div className="mx-auto w-full max-w-xl" data-testid="look-again-card">
          <FeedbackCard kind="info">
            <p className="mb-4">{S1_2.lookAgain}</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" className="btn-primary" onClick={() => setStep("walk")} data-testid="look-again-yes">
                {S1_2.yesLookAgain}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  addMissedSigns();
                  setStep("carriedOn");
                }}
                data-testid="look-again-no"
              >
                {S1_2.noCarryOn}
              </button>
            </div>
          </FeedbackCard>
        </div>
      )}

      {step === "allFound" && (
        <div className="mx-auto w-full max-w-xl">
          <FeedbackCard kind="right">{S1_2.allFound}</FeedbackCard>
        </div>
      )}

      <FooterActions
        left={
          step === "walk" && placeIdx > 0 ? (
            <button type="button" className="btn-secondary" onClick={() => setPlaceIdx((i) => i - 1)} data-testid="back-place">
              {S1_2.back}
            </button>
          ) : null
        }
      >
        {step === "walk" &&
          (isLast ? (
            <MainButton onClick={onFinishWalk} testId="finish-walk">
              {S1_2.finish}
            </MainButton>
          ) : (
            <MainButton onClick={() => setPlaceIdx((i) => i + 1)} testId="next-place">
              {S1_2.next}
            </MainButton>
          ))}
        {(step === "allFound" || step === "carriedOn") && (
          <MainButton onClick={onComplete} testId="continue-button">
            {UI.continue}
          </MainButton>
        )}
      </FooterActions>
    </div>
  );
}

/** Top left — a small map of the 4 places, the current place coloured. */
function MiniMap({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1" aria-label="Map of the work area" data-testid="mini-map">
      {PLACES.map((p, i) => (
        <li key={p.id} className="flex items-center gap-1">
          <span
            className={`rounded-md px-2 py-1 text-sm sm:text-base ${i === current ? "bg-teal-700 font-semibold text-white" : "bg-white text-slate-600 ring-1 ring-slate-300"}`}
            aria-current={i === current ? "location" : undefined}
          >
            {p.name}
          </span>
          {i < PLACES.length - 1 && <span className="text-slate-400" aria-hidden>→</span>}
        </li>
      ))}
    </ol>
  );
}
