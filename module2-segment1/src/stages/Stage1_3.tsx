"use client";

import { useEffect, useState } from "react";
import { S1_3, UI } from "@/content/segment1";
import { useLinePlayer, useRestartsOnResume } from "@/lib/runtime";
import { SceneFrame } from "@/components/Scene";
import { MySignsGrid } from "@/components/Notebook";
import { FeedbackCard, FooterActions, MainButton, NarrationBar } from "@/components/ui";

/**
 * 1.3 Did you notice the signs?
 * Two taps. Ungraded; nothing is right or wrong; not stored.
 * The second NAR line plays after the taps.
 */
type Step = "q1" | "q2" | "nar2" | "done";

export function Stage1_3({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>("q1");
  const [answer1, setAnswer1] = useState<"yes" | "notReally" | null>(null);
  const nar = useLinePlayer();
  useRestartsOnResume(nar.playing);

  useEffect(() => {
    void nar.play([S1_3.nar1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickFirst = () => {
    // Not stored (script: "not stored").
    setStep("nar2");
    void nar.play([S1_3.nar2]).then(() => setStep("done"));
  };

  return (
    <div className="relative flex flex-1 flex-col">
      {/* BACKGROUND: the corridor, soft and blurred. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <SceneFrame place="corridor" blur className="h-full !aspect-auto opacity-70" />
      </div>

      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 px-3 py-4 sm:px-6">
        <NarrationBar now={nar.now} onReplay={nar.hasPlayed ? nar.replay : undefined} />

        {step === "q1" && (
          <section className="flex flex-col items-center gap-4" aria-labelledby="q1">
            <p id="q1" className="text-center text-2xl font-semibold text-slate-900">
              {S1_3.q1}
            </p>
            <FooterActions>
            <div className="flex gap-3">
              <button
                type="button"
                className="btn-main"
                onClick={() => {
                  setAnswer1("yes");
                  setStep("q2");
                }}
                data-testid="answer-yes"
              >
                {S1_3.yes}
              </button>
              <button
                type="button"
                className="btn-main"
                onClick={() => {
                  setAnswer1("notReally");
                  setStep("q2");
                }}
                data-testid="answer-not-really"
              >
                {S1_3.notReally}
              </button>
            </div>
            </FooterActions>
          </section>
        )}

        {step !== "q1" && answer1 && (
          <FeedbackCard kind="info" testId="feedback-q1">
            {answer1 === "yes" ? S1_3.yesFeedback : S1_3.notReallyFeedback}
          </FeedbackCard>
        )}

        {step === "q2" && (
          <section className="flex flex-col items-center gap-3" aria-labelledby="q2">
            <p id="q2" className="text-center text-2xl font-semibold text-slate-900">
              {S1_3.q2}
            </p>
            <button type="button" className="btn-secondary" onClick={pickFirst} data-testid="dont-remember">
              {S1_3.dontRemember}
            </button>
          </section>
        )}
        {/* SCREEN: the 'My signs' notebook, open. */}
        <section className="rounded-3xl bg-amber-50/95 p-4 shadow-lg ring-1 ring-amber-200 sm:p-6" aria-label="My signs notebook">
          <h2 className="mb-3 text-lg font-semibold text-amber-950">My signs</h2>
          <MySignsGrid compact onPick={step === "q2" ? pickFirst : undefined} />
        </section>

      </div>

      {step === "done" && (
        <FooterActions>
          <MainButton onClick={onComplete} testId="continue-button">
            {UI.continue}
          </MainButton>
        </FooterActions>
      )}
    </div>
  );
}
