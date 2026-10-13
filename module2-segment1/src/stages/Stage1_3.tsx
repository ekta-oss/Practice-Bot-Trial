"use client";

import { useEffect, useState } from "react";
import { S1_3, UI, WALK_SIGNS } from "@/content/segment1";
import { useProgress } from "@/lib/progress";
import { saveReflection } from "@/lib/reflection";
import { uiLine } from "@/lib/uiAudio";
import { useLinePlayer, useRestartsOnResume } from "@/lib/runtime";
import { SceneFrame } from "@/components/Scene";
import { SignIcon } from "@/components/SignIcon";
import { FeedbackCard, FooterActions, MainButton, NarrationBar } from "@/components/ui";

/**
 * 1.3 Reflection — one calm screen.
 * The signs the learner saved (a small strip, for context) and one question that
 * leads into the reading: "What do you think these signs are for?" Ungraded:
 * every answer gets a kind, honest reply, then the narrator line that opens 1.4.
 * The answer is shown back in 1.4 ("Your answer in 1.3 …. Read and check.").
 */
export function Stage1_3({ onComplete }: { onComplete: () => void }) {
  const { state } = useProgress();
  const [answer, setAnswer] = useState<(typeof S1_3.answers)[number] | null>(null);
  const [done, setDone] = useState(false);
  const nar = useLinePlayer();
  useRestartsOnResume(nar.playing);

  useEffect(() => {
    void nar.play([S1_3.nar1, uiLine(S1_3.q1)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (a: (typeof S1_3.answers)[number]) => {
    setAnswer(a);
    saveReflection(a.text);
    // The reply is read aloud, then the narrator leads straight into the reading.
    void nar.play([uiLine(a.feedback), S1_3.nar2]).then(() => setDone(true));
  };

  const signs = state.mySigns.map((s) => WALK_SIGNS.find((w) => w.id === s.id)).filter((s) => s !== undefined);

  return (
    <div className="relative flex flex-1 flex-col">
      {/* BACKGROUND: the corridor, soft and blurred. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <SceneFrame place="corridor" blur className="h-full !aspect-auto opacity-70" />
      </div>

      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-3 py-4 sm:px-6">
        <NarrationBar now={nar.now} onReplay={nar.hasPlayed ? nar.replay : undefined} />

        <section className="card mx-auto flex w-full flex-col items-center gap-5 py-8" aria-labelledby="q1" data-testid="reflection">
          {signs.length > 0 && (
            <div className="flex w-full flex-col items-center gap-2" data-testid="signs-strip">
              <p className="text-base font-semibold text-[var(--body)]">{S1_3.signsLabel(signs.length)}</p>
              <ul className="flex max-w-full flex-wrap justify-center gap-1.5" aria-label="Signs you saved">
                {signs.map((s) => (
                  <li key={s.id}>
                    <SignIcon sign={s} size={44} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <h2 id="q1" className="text-center text-3xl font-semibold text-[var(--heading)]">
            {S1_3.q1}
          </h2>

          {!answer ? (
            <div className="flex w-full max-w-md flex-col gap-3">
              {S1_3.answers.map((a) => (
                <button key={a.id} type="button" className="btn-answer justify-center text-xl" onClick={() => pick(a)} data-testid={`answer-${a.id}`}>
                  {a.text}
                </button>
              ))}
            </div>
          ) : (
            <div className="w-full max-w-md">
              <FeedbackCard kind="info" testId="feedback-q1">
                {answer.feedback}
              </FeedbackCard>
            </div>
          )}
        </section>
      </div>

      {done && (
        <FooterActions>
          <MainButton onClick={onComplete} testId="continue-button">
            {UI.continue}
          </MainButton>
        </FooterActions>
      )}
    </div>
  );
}
