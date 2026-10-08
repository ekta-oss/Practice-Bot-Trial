"use client";

import { useEffect, useState } from "react";
import { S1_1, UI } from "@/content/segment1";
import { chime } from "@/lib/media";
import { checkIntroduction, type IntroCheck } from "@/lib/introCheck";
import { useLinePlayer, useRestartsOnResume } from "@/lib/runtime";
import { KeptRecordingPlayer, Recorder, type KeptRecording } from "@/components/Recorder";
import { SceneFrame, useClip } from "@/components/Scene";
import { FeedbackCard, FooterActions, MainButton, Subtitles, TickIcon } from "@/components/ui";

/**
 * 1.1 Greet and get your task.
 * Video plays and pauses after line 1 → learner records (max 20 s; playback;
 * re-record) → ticks 3 boxes → if any box is empty, the second prompt appears
 * and the learner records once more → the video plays line 2 → 'Continue'.
 *
 * The browser's speech recognition listens while the learner records. Its
 * transcript is shown ('What the system heard') and rated against the three
 * self-check cues; the boxes start ticked from that rating and the learner
 * can change them before 'Check'. The script's feedback lines then follow.
 */
type Step = "line1" | "record1" | "check" | "fbAll" | "record2" | "fbSecond" | "line2" | "done";

const CUE_LABEL: Record<"hello" | "name" | "job", string> = { hello: "hello", name: "your name", job: "your job" };

export function Stage1_1({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>("line1");
  const [ticks, setTicks] = useState([false, false, false]);
  const [rec1, setRec1] = useState<KeptRecording | null>(null);
  const [rec2, setRec2] = useState<KeptRecording | null>(null);
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

  const rating1 = rec1?.transcript != null ? checkIntroduction(rec1.transcript) : null;
  const rating2 = rec2?.transcript != null ? checkIntroduction(rec2.transcript) : null;
  const latest = rec2 ?? rec1;

  const now = nar.now ?? clip.now;
  const showStill = step !== "line1" && step !== "line2";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-4 px-3 py-4 sm:px-6">
      <SceneFrame place="entrance" withPic={step === "line2" ? "point" : "stand"} className={`mx-auto w-full rounded-2xl shadow transition-[max-width] duration-500 ${showStill ? "max-w-[calc(24vh*16/9)]" : "max-w-[calc(44vh*16/9)]"}`}>
        {!showStill && clip.video}
        <Subtitles now={now} />
        <div className="absolute left-2 top-2">{clip.missingBadge}</div>
      </SceneFrame>

      {step === "record1" && (
        <section className="flex w-full flex-col items-center gap-4" aria-labelledby="prompt1">
          <p id="prompt1" className="text-center text-2xl font-semibold text-slate-900" data-testid="prompt">
            {S1_1.prompt}
          </p>
          <Recorder
            stageId="1.1"
            slot="intro-1"
            maxSeconds={S1_1.maxRecordSeconds}
            recognize
            onKeep={(r) => {
              setRec1(r);
              if (r.transcript !== null) {
                const c = checkIntroduction(r.transcript);
                setTicks([c.hello, c.name, c.job]);
              }
              setStep("check");
            }}
            label="Start recording: say hello, and introduce yourself"
          />
        </section>
      )}

      {step === "check" && rec1 && (
        <section className="flex w-full max-w-xl flex-col gap-3" aria-label="Self-check">
          <KeptRecordingPlayer rec={rec1} />
          {rating1 && <IntroRating transcript={rec1.transcript!} rating={rating1} />}
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
          {rating1 && <p className="text-base text-slate-600">The boxes are ticked from what the system heard. Change them if they are wrong.</p>}
          <FooterActions>
            <MainButton onClick={check} testId="check-button">
              {UI.check}
            </MainButton>
          </FooterActions>
        </section>
      )}

      {step === "fbAll" && (
        <div className="w-full max-w-xl">
          <FeedbackCard kind="right">{S1_1.allTicked.text}</FeedbackCard>
        </div>
      )}

      {step === "record2" && (
        <section className="flex w-full flex-col items-center gap-4" aria-labelledby="prompt2">
          <p id="prompt2" className="text-center text-2xl font-semibold text-slate-900" data-testid="prompt">
            {S1_1.secondPrompt}
          </p>
          <Recorder
            stageId="1.1"
            slot="intro-2"
            maxSeconds={S1_1.maxRecordSeconds}
            recognize
            onKeep={(r) => {
              setRec2(r);
              setStep("fbSecond");
              void nar.play([S1_1.afterSecond]).then(playLine2);
            }}
            label="Start recording: say hello, your name and your job"
          />
        </section>
      )}

      {step === "fbSecond" && (
        <div className="flex w-full max-w-xl flex-col gap-3">
          <FeedbackCard kind="info">{S1_1.afterSecond.text}</FeedbackCard>
          {rating2 && <IntroRating transcript={rec2!.transcript!} rating={rating2} />}
        </div>
      )}

      {/* The kept recording stays where it was made, for the rest of the stage. */}
      {latest && step !== "check" && step !== "record1" && step !== "record2" && (
        <KeptRecordingPlayer rec={latest} label={rec2 ? "Your second recording" : "Your recording"} />
      )}

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

/** 'What the system heard' + the three cues it found ("2 of 3 heard"). */
function IntroRating({ transcript, rating }: { transcript: string; rating: IntroCheck }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-testid="intro-rating" data-heard={rating.heard}>
      <div>
        <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">What the system heard</p>
        <p className="text-xl text-slate-900" data-testid="heard-text">
          {transcript.trim() || <span className="text-amber-900">No words were heard.</span>}
        </p>
      </div>
      <div>
        <p className="mb-2 text-lg font-semibold text-slate-900" data-testid="rating-score">
          {rating.heard} of 3 heard
        </p>
        <ul className="flex flex-col gap-1.5">
          {(["hello", "name", "job"] as const).map((k) => (
            <li key={k} className="flex items-center gap-2 text-lg" data-testid={`cue-${k}`} data-heard={rating[k]}>
              {rating[k] ? <TickIcon className="h-6 w-6" /> : <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-200 text-sm font-bold text-amber-900" aria-hidden>?</span>}
              <span>
                {rating[k] ? `You said ${CUE_LABEL[k]}` : `The system did not hear ${CUE_LABEL[k]}`}
                {rating.evidence[k] && <span className="text-slate-600"> — “{rating.evidence[k]}”</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
