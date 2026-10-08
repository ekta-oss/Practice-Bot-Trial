"use client";

import { useEffect, useState } from "react";
import { S1_4, UI } from "@/content/segment1";
import { useLinePlayer, useRestartsOnResume, useRuntime } from "@/lib/runtime";
import { OpenArticleButton } from "@/components/ArticleLink";
import { QuizQuestion } from "@/components/QuizQuestion";
import { FeedbackCard, FooterActions, MainButton, NarrationBar } from "@/components/ui";

/**
 * 1.4 Read online: why workplaces have safety signs.
 * SCREEN 1: Reading Prompt card + 'Open the article' (new tab).
 * SCREEN 2 (after coming back): one question per screen, 3 big answer buttons.
 * If the page does not open: a backup card, and Q3–Q4 are skipped.
 * Answers are not stored.
 */
type Step = { kind: "prompt"; opened: boolean } | { kind: "backup" } | { kind: "question"; index: number };

export function Stage1_4({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>({ kind: "prompt", opened: false });
  const [usedBackup, setUsedBackup] = useState(false);
  const nar = useLinePlayer();
  const { resumeToken } = useRuntime();
  useRestartsOnResume(step.kind === "prompt" ? nar.playing : step.kind === "question");

  useEffect(() => {
    void nar.play([S1_4.nar1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const questions = usedBackup ? S1_4.questions.slice(0, 2) : S1_4.questions;

  if (step.kind === "question") {
    const q = questions[step.index];
    const last = step.index === questions.length - 1;
    return (
      <div className="flex flex-1 flex-col px-3 py-6 sm:px-6">
        <QuizQuestion
          key={`${q.id}-${resumeToken}`}
          number={step.index + 1}
          total={questions.length}
          question={q.question}
          options={q.options}
          correct={q.correct}
          rightText={S1_4.right(q.reason)}
          hintText={S1_4.wrong(q.where)}
          revealText={S1_4.reveal(q.options[q.correct], q.where)}
          onNext={() => (last ? onComplete() : setStep({ kind: "question", index: step.index + 1 }))}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-3 py-6 sm:px-6">
      <NarrationBar now={nar.now} onReplay={nar.hasPlayed ? nar.replay : undefined} />

      {step.kind === "prompt" && (
        <>
          <article className="card space-y-4" data-testid="reading-prompt">
            <p className="text-lg text-slate-600">{S1_4.predictionLabel}</p>
            <p className="text-3xl font-bold leading-snug text-slate-900">{S1_4.predictionQuestion}</p>
            <p className="text-xl leading-relaxed text-slate-800">{S1_4.predictionInstruction}</p>
            <p className="text-base text-slate-600">
              {S1_4.articleSource}, ‘{S1_4.articleTitle}’
            </p>
          </article>
          <div className="flex flex-col items-center gap-3">
            <OpenArticleButton
              label={S1_4.openArticle}
              url={S1_4.articleUrl}
              onOpened={() => setStep({ kind: "prompt", opened: true })}
              onBlocked={() => {
                setUsedBackup(true);
                setStep({ kind: "backup" });
              }}
            />
            <button
              type="button"
              className="text-base text-slate-600 underline underline-offset-4 hover:text-slate-900"
              onClick={() => {
                setUsedBackup(true);
                setStep({ kind: "backup" });
              }}
              data-testid="article-did-not-open"
            >
              {S1_4.articleDidNotOpen}
            </button>
          </div>
          {step.opened && (
            <FooterActions>
              <MainButton onClick={() => setStep({ kind: "question", index: 0 })} testId="back-to-course">
                {S1_4.backToCourse}
              </MainButton>
            </FooterActions>
          )}
        </>
      )}

      {step.kind === "backup" && (
        <>
          <FeedbackCard kind="info" testId="backup-card">
            <p className="text-xl leading-relaxed">{S1_4.backupCard}</p>
          </FeedbackCard>
          <FooterActions>
            <MainButton onClick={() => setStep({ kind: "question", index: 0 })} testId="continue-button">
              {UI.continue}
            </MainButton>
          </FooterActions>
        </>
      )}
    </div>
  );
}
