"use client";

import { useEffect, useState } from "react";
import { S1_1, UI } from "@/content/segment1";
import { chime } from "@/lib/media";
import { useLinePlayer, useRestartsOnResume } from "@/lib/runtime";
import { Recorder } from "@/components/Recorder";
import { SceneFrame, useClip } from "@/components/Scene";
import { FeedbackCard, FooterActions, MainButton, Subtitles } from "@/components/ui";

/**
 * 1.1 Greet and get your task.
 * Video plays and pauses after line 1 → learner records (max 20 s; playback;
 * re-record) → ticks 3 boxes → if any box is empty, the second prompt appears
 * and the learner records once more → the video plays line 2 → 'Continue'.
 */
type Step = "line1" | "record1" | "check" | "fbAll" | "record2" | "fbSecond" | "line2" | "done";

export function Stage1_1({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>("line1");
  const [ticks, setTicks] = useState([false, false, false]);
  const clip = useClip();
  const nar = useLinePlayer();

  useRestartsOnResume(step === "line1" || step === "line2" || step === "fbAll" || step === "fbSecond");

  useEffect(() => {
    let live = true;
    void clip.play(S1_1.video1, [S1_1.pic1]).then(() => live && setStep("record1"));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playLine2 = () => {
    setStep("line2");
    void clip.play(S1_1.video2, [S1_1.pic2]).then(() => setStep("done"));
  };

  const check = () => {
    if (ticks.every(Boolean)) {
      chime();
      setStep("fbAll");
      void nar.play([S1_1.allTicked]).then(playLine2);
    } else {
      setStep("record2");
      void nar.play([S1_1.notAllTicked]);
    }
  };

  const now = nar.now ?? clip.now;
  const showStill = step !== "line1" && step !== "line2";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-3 py-4 sm:px-6">
      <SceneFrame place="entrance" withPic={step === "line2" ? "point" : "stand"} className="mx-auto w-full max-w-[calc(44vh*16/9)] rounded-2xl shadow">
        {!showStill && clip.video}
        <Subtitles now={now} />
        <div className="absolute left-2 top-2">{clip.missingBadge}</div>
      </SceneFrame>

      {step === "record1" && (
        <section className="flex flex-col items-center gap-4" aria-labelledby="prompt1">
          <p id="prompt1" className="text-center text-2xl font-semibold text-slate-900" data-testid="prompt">
            {S1_1.prompt}
          </p>
          <Recorder stageId="1.1" slot="intro-1" maxSeconds={S1_1.maxRecordSeconds} onKeep={() => setStep("check")} label="Start recording: say hello, and introduce yourself" />
        </section>
      )}

      {step === "check" && (
        <section className="mx-auto flex w-full max-w-xl flex-col gap-3" aria-label="Self-check">
          {S1_1.checks.map((label, i) => (
            <label key={label} className="flex min-h-14 cursor-pointer items-center gap-4 rounded-2xl bg-white px-5 text-xl ring-2 ring-slate-200 has-[:checked]:ring-teal-600 has-[:focus-visible]:outline has-[:focus-visible]:outline-4 has-[:focus-visible]:outline-amber-400">
              <input
                type="checkbox"
                className="h-7 w-7 accent-teal-700"
                checked={ticks[i]}
                onChange={(e) => setTicks((t) => t.map((v, j) => (j === i ? e.target.checked : v)))}
                data-testid={`selfcheck-${i}`}
              />
              {label}
            </label>
          ))}
          <FooterActions>
            <MainButton onClick={check} testId="check-button">
              {UI.check}
            </MainButton>
          </FooterActions>
        </section>
      )}

      {step === "fbAll" && <FeedbackCard kind="right">{S1_1.allTicked.text}</FeedbackCard>}

      {step === "record2" && (
        <section className="flex flex-col items-center gap-4" aria-labelledby="prompt2">
          <p id="prompt2" className="text-center text-2xl font-semibold text-slate-900" data-testid="prompt">
            {S1_1.secondPrompt}
          </p>
          <Recorder
            stageId="1.1"
            slot="intro-2"
            maxSeconds={S1_1.maxRecordSeconds}
            onKeep={() => {
              setStep("fbSecond");
              void nar.play([S1_1.afterSecond]).then(playLine2);
            }}
            label="Start recording: say hello, your name and your job"
          />
        </section>
      )}

      {step === "fbSecond" && <FeedbackCard kind="info">{S1_1.afterSecond.text}</FeedbackCard>}

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
