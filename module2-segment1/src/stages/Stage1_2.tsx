"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PLACES, S1_2, UI, WALK_SIGNS, savedSignLabel, type WalkSign } from "@/content/segment1";
import { chime } from "@/lib/media";
import { useProgress } from "@/lib/progress";
import { sayUi, useLinePlayer, useRestartsOnResume, useSay } from "@/lib/runtime";
import { SceneFrame, useArt } from "@/components/Scene";
import { ART, HOTSPOTS, SCENE_IMAGE, type Box } from "@/components/scenes";
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

  useSay([S1_2.lookAgain], { when: step === "lookAgain" });
  const savedIds = new Set(state.mySigns.map((s) => s.id));
  const place = PLACES[placeIdx];
  const isLast = placeIdx === PLACES.length - 1;
  const signsHere = WALK_SIGNS.filter((s) => s.place === place.id);
  // With the illustrator's picture, the signs are painted in it: the hotspots sit on top of them.
  const artSrc = useArt(SCENE_IMAGE[place.id]);
  const art = artSrc ? ART[place.id] : null;
  const at = (b: Box) => ({ left: `${b.left}%`, top: `${b.top}%`, width: `${b.width}%`, height: `${b.height}%` });

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
    sayUi([S1_2.saved]);
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
        {art ? (
          <p className="flex items-center gap-2 text-lg font-medium text-[var(--heading)]" data-testid="walk-tip">
            <TapIcon />
            {S1_2.tip}
          </p>
        ) : (
          <MiniMap current={placeIdx} />
        )}
        <p className="rounded-full bg-[var(--card)] px-4 py-1.5 text-lg font-semibold text-[var(--heading)] shadow-sm ring-1 ring-[var(--border)]" data-testid="my-signs-counter" aria-live="polite">
          {S1_2.counter(state.mySigns.length)}
        </p>
      </div>

      {/* On narrow screens the picture is wider than the screen: swipe to look round. */}
      <div className="relative" style={art ? ({ "--mw": `calc(60vh * ${art.aspect})` } as React.CSSProperties) : undefined}>
      <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:overflow-visible sm:px-0" data-testid="scene-scroller">
        <SceneFrame
          place={place.id}
          artAspect={art?.aspect}
          className={`mx-auto w-[210%] rounded-2xl shadow sm:w-full ${art ? "sm:max-w-[var(--mw)]" : "sm:max-w-[calc(60vh*16/9)]"}`}
        >
          <h2 className="sr-only">{place.name}</h2>
          {art && (
            <>
              {/* The map and counter painted in the mock-up, replaced by the live ones. */}
              <div className="absolute" style={at(art.map)}>
                <MiniMap current={placeIdx} card />
              </div>
              {art.counter && (
                <div className="absolute grid place-items-center rounded-full bg-[var(--card)] text-[clamp(9px,1.2vw,18px)] font-semibold text-[var(--heading)] ring-1 ring-[var(--border)]" style={at(art.counter)} aria-hidden>
                  {S1_2.counter(state.mySigns.length)}
                </div>
              )}
            </>
          )}
          {art &&
            signsHere.map((s) => {
              const saved = savedIds.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  data-hotspot={s.id}
                  data-saved={saved}
                  onClick={() => tapSign(s)}
                  aria-label={`${s.word} sign. ${s.placement}${saved ? " Saved." : ""}`}
                  className="absolute min-h-11 min-w-11 rounded-lg transition hover:bg-white/15 hover:ring-4 hover:ring-[var(--blue-tonal-border)] focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
                  style={at(art.signs[s.id])}
                >
                  {saved && (
                    <span className="absolute -right-2 -top-2 rounded-full bg-[var(--card)] shadow" aria-hidden>
                      <TickIcon className="h-6 w-6" />
                    </span>
                  )}
                </button>
              );
            })}
          {!art && signsHere.map((s) => {
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
                className="absolute flex min-h-11 min-w-11 items-center justify-center rounded-md transition hover:scale-105 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[var(--blue)]"
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
          className="fixed inset-0 z-40 grid place-items-center bg-[var(--overlay)]"
          onClick={() => finishBig(big.sign, big.isNewSave)}
          data-testid="big-sign"
          role="dialog"
          aria-modal="true"
          aria-label={savedSignLabel(big.sign)}
        >
          <div
            className="flex flex-col items-center gap-3 rounded-3xl bg-[var(--card)] p-6 shadow-2xl"
            style={
              big.flying && big.fly
                ? ({ "--fly-x": `${big.fly.x}px`, "--fly-y": `${big.fly.y}px`, animation: "fly-to-notebook 0.65s ease-in forwards" } as React.CSSProperties)
                : { animation: "pop-in 0.3s ease-out" }
            }
          >
            <div className="relative">
              <SignIcon sign={big.sign} size={240} />
              {big.isNewSave && (
                <span className="absolute -right-4 -top-4 rounded-full bg-[var(--card)] p-1 shadow" data-testid="saved-tick">
                  <TickIcon className="h-10 w-10" />
                </span>
              )}
            </div>
            <p className="text-xl font-semibold text-[var(--heading)]">{savedSignLabel(big.sign)}</p>
            {big.isNewSave && (
              <p className="text-lg text-[var(--success)]" role="status" data-testid="saved-toast">
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
          <FeedbackCard kind="right" speak>{S1_2.allFound}</FeedbackCard>
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
            <MainButton onClick={onFinishWalk} testId="finish-walk" finish>
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
function MiniMap({ current, card }: { current: number; card?: boolean }) {
  if (card) {
    // 2 × 2 map card, like the illustrator's: the current place in yellow with a pin.
    return (
      <ol className="grid h-full w-full grid-cols-2 gap-[4%] rounded-lg bg-[var(--card)] p-[3%] text-[clamp(8px,1vw,15px)] shadow ring-1 ring-[var(--border)]" aria-label="Map of the work area" data-testid="mini-map">
        {PLACES.map((p, i) => (
          <li
            key={p.id}
            aria-current={i === current ? "location" : undefined}
            className={`flex items-center justify-center rounded-md text-center font-semibold leading-tight ring-1 ${i === current ? "bg-[var(--blue-tonal-bg)] text-[var(--blue)] ring-[var(--blue)]" : "bg-[var(--card)] text-[var(--body)] ring-[var(--border)]"}`}
          >
            {i === current && (
              <svg viewBox="0 0 24 24" className="mr-[0.3em] h-[1.3em] w-[1.3em] shrink-0" aria-hidden>
                <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z" fill="#3c59f6" />
                <circle cx="12" cy="9" r="2.6" fill="white" />
              </svg>
            )}
            {p.name}
          </li>
        ))}
      </ol>
    );
  }
  return (
    <ol className="flex items-center gap-1" aria-label="Map of the work area" data-testid="mini-map">
      {PLACES.map((p, i) => (
        <li key={p.id} className="flex items-center gap-1">
          <span
            className={`rounded-md px-2 py-1 text-sm sm:text-base ${i === current ? "bg-[var(--blue)] font-semibold text-white" : "bg-[var(--card)] text-[var(--body)] ring-1 ring-[var(--border)]"}`}
            aria-current={i === current ? "location" : undefined}
          >
            {p.name}
          </span>
          {i < PLACES.length - 1 && <span className="text-[var(--muted)]" aria-hidden>→</span>}
        </li>
      ))}
    </ol>
  );
}

/** A pointing finger tapping: "tap here". */
function TapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-[var(--blue)]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L4.5 16a1.6 1.6 0 0 1 2.4-2.1L9 15.5" />
      <path d="M5 4.5 3.5 3M15.5 4.5 17 3M10.5 1.5v-1" />
    </svg>
  );
}
