"use client";

import { useState } from "react";
import { UI } from "@/content/segment1";
import { chime } from "@/lib/media";
import { useRestartsOnResume } from "@/lib/runtime";
import { FeedbackCard, FooterActions, HintBulb, MainButton } from "./ui";

/**
 * One question per screen, 3 big answer buttons.
 * Hint rule (all practice): First try: no hint. After a wrong first try: the
 * lightbulb glows and a hint card opens. After a wrong second try: the right
 * answer is shown with the reason. The learner always moves on.
 */
export function QuizQuestion({
  number,
  total,
  question,
  options,
  correct,
  rightText,
  hintText,
  revealText,
  onNext,
  nextLabel = UI.continue,
}: {
  number: number;
  total: number;
  question: string;
  options: string[];
  correct: number;
  rightText: string;
  hintText: string;
  revealText: string;
  onNext: () => void;
  nextLabel?: string;
}) {
  useRestartsOnResume(true);
  const [wrong, setWrong] = useState<number[]>([]);
  const [state, setState] = useState<"ask" | "hint" | "right" | "reveal">("ask");
  const [hintOpen, setHintOpen] = useState(false);
  const letters = ["a", "b", "c", "d"];

  const pick = (i: number) => {
    if (state === "right" || state === "reveal") return;
    if (i === correct) {
      chime();
      setState("right");
      return;
    }
    const w = [...wrong, i];
    setWrong(w);
    if (w.length === 1) {
      setState("hint");
      setHintOpen(true);
    } else {
      setState("reveal");
      setHintOpen(false);
    }
  };

  const finished = state === "right" || state === "reveal";

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-5" aria-labelledby={`q-${number}`} data-testid="quiz-question" data-state={state}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base text-slate-600">
            Question {number} of {total}
          </p>
          <h2 id={`q-${number}`} className="text-2xl font-semibold text-slate-900">
            {question}
          </h2>
        </div>
        <HintBulb glowing={state !== "ask"} open={hintOpen} onClick={() => setHintOpen((o) => !o)} />
      </div>

      <div className="flex flex-col gap-3" role="group" aria-label="Answers">
        {options.map((opt, i) => {
          const isWrong = wrong.includes(i);
          const showRight = finished && i === correct;
          return (
            <button
              key={i}
              type="button"
              onClick={() => pick(i)}
              disabled={finished || isWrong}
              className={`btn-answer ${showRight ? "!ring-4 !ring-emerald-500 bg-emerald-50" : ""} ${isWrong ? "bg-amber-50 !ring-amber-300 opacity-70" : ""}`}
              data-testid={`option-${i}`}
              data-correct={showRight || undefined}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-lg font-semibold text-slate-700">{letters[i]}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {state === "hint" && hintOpen && (
        <FeedbackCard kind="wrong" testId="feedback-wrong">
          {hintText}
        </FeedbackCard>
      )}
      {state === "right" && <FeedbackCard kind="right">{rightText}</FeedbackCard>}
      {state === "reveal" && <FeedbackCard kind="reveal">{revealText}</FeedbackCard>}

      {finished && (
        <FooterActions>
          <MainButton onClick={onNext} testId="continue-button">
            {nextLabel}
          </MainButton>
        </FooterActions>
      )}
    </section>
  );
}
