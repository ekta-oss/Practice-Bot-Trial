"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { S1_6, UI, WALK_SIGNS, type ColourGroup } from "@/content/segment1";
import { colourLine, newSignHint, newSignRight, newSignWrong, shapeKey, shapeRight, shapeWrong, type ShapeId } from "@/content/feedbackText";
import { uiLine } from "@/lib/uiAudio";
import { useProgress } from "@/lib/progress";
import { useLinePlayer, useRestartsOnResume, useRuntime, useSay } from "@/lib/runtime";
import { OpenArticleButton } from "@/components/ArticleLink";
import { DragSortGame, type GameItem, type GameTarget } from "@/components/DragSortGame";
import { ColourKeyCard } from "@/components/Notebook";
import { ShapeGlyph, SignIcon, Swatch } from "@/components/SignIcon";
import { FooterActions, MainButton, NarrationBar } from "@/components/ui";

/**
 * 1.6 What does each colour mean?
 * Step 1 guess (5 taps, no right/wrong shown) → Step 2 score + segue line →
 * Step 3 read the SMI article (new tab; 'Back to the course') → Step 4 two
 * drag-and-drop games: Shape Match, then New Signs (each new sign to what it
 * means, using the guessing words). The colour key card shows above the games
 * and is saved to 'My notes'. Lapse → restart from Step 1.
 */
type Step =
  | { kind: "guess"; index: number }
  | { kind: "score"; opened: boolean }
  | { kind: "backup" }
  | { kind: "game"; n: 1 | 2; done: boolean };

export function Stage1_6({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<Step>({ kind: "guess", index: 0 });
  const [guesses, setGuesses] = useState<string[]>([]);
  const { saveNote } = useProgress();
  const nar = useLinePlayer();
  const { resumeToken } = useRuntime();
  useRestartsOnResume(step.kind === "guess" || nar.playing);

  useEffect(() => {
    void nar.play([S1_6.nar1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const score = guesses.filter((g, i) => g === S1_6.guesses[i].correct).length;

  const guess = (answer: string) => {
    if (step.kind !== "guess") return;
    const next = [...guesses.slice(0, step.index), answer];
    setGuesses(next); // shown as a score only; not stored
    if (step.index < S1_6.guesses.length - 1) {
      setStep({ kind: "guess", index: step.index + 1 });
    } else {
      setStep({ kind: "score", opened: false });
      const right = next.filter((g, i) => g === S1_6.guesses[i].correct).length;
      void nar.play([uiLine(S1_6.score(right)), right >= 3 ? S1_6.nar2 : S1_6.nar3, S1_6.nar4]);
    }
  };

  const gameDone = useCallback(() => {
    setStep((s) => (s.kind === "game" ? { ...s, done: true } : s));
  }, []);

  useEffect(() => {
    if (step.kind === "game") saveNote("colour-key");
  }, [step, saveNote]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-4 sm:px-6">
      <NarrationBar now={nar.now} onReplay={nar.hasPlayed ? nar.replay : undefined} />

      {step.kind === "guess" && <GuessScreen key={`${step.index}-${resumeToken}`} index={step.index} onPick={guess} />}

      {step.kind === "score" && (
        <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5 text-center" data-testid="score-screen">
          <p className="text-4xl font-bold text-[var(--heading)]" data-testid="score-line">
            {S1_6.score(score)}
          </p>
          <p className="text-xl text-[var(--body)]" data-testid="segue-line">
            {score >= 3 ? S1_6.nar2.text : S1_6.nar3.text}
          </p>
          <p className="text-xl font-semibold text-[var(--heading)]">{S1_6.readPrompt}</p>
          <OpenArticleButton primary={!step.opened} label={S1_6.openArticle} url={S1_6.articleUrl} onOpened={() => setStep({ kind: "score", opened: true })} />
          <p className="text-base text-[var(--body)]">
            {S1_6.articleSource}, ‘{S1_6.articleTitle}’
          </p>
          <button type="button" className="text-base text-[var(--body)] underline underline-offset-4 hover:text-[var(--heading)]" onClick={() => setStep({ kind: "backup" })} data-testid="article-did-not-open">
            {S1_6.articleDidNotOpen}
          </button>
          {step.opened && (
            <FooterActions>
              <MainButton onClick={() => setStep({ kind: "game", n: 1, done: false })} testId="back-to-course">
                {S1_6.backToCourse}
              </MainButton>
            </FooterActions>
          )}
        </section>
      )}

      {step.kind === "backup" && (
        <section className="flex flex-col gap-4" data-testid="backup-card">
          <div className="grid gap-4 sm:grid-cols-2">
            {(["red", "yellow", "blue", "green"] as ColourGroup[]).map((c) => (
              <div key={c} className="card flex flex-col gap-3">
                <p className="text-xl font-semibold">{colourLine(c)}</p>
                <div className="flex flex-wrap gap-3">
                  {WALK_SIGNS.filter((s) => s.colour === c).map((s) => (
                    <SignIcon key={s.id} sign={s} size={88} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <FooterActions>
            <MainButton onClick={() => setStep({ kind: "game", n: 1, done: false })} testId="continue-button">
              {UI.continue}
            </MainButton>
          </FooterActions>
        </section>
      )}

      {/* COLOUR KEY CARD: what they just read, kept in view (never over the boxes) for both games. */}
      {step.kind === "game" && (
        <div className="self-center">
          <ColourKeyCard compact inline />
        </div>
      )}

      {step.kind === "game" && step.n === 1 && <ShapeGame onDone={gameDone} />}
      {step.kind === "game" && step.n === 2 && <NewSignsGame onDone={gameDone} />}

      {step.kind === "game" && step.done && (
        <FooterActions>
          <MainButton onClick={() => (step.n === 1 ? setStep({ kind: "game", n: 2, done: false }) : onComplete())} testId="continue-button">
            {UI.continue}
          </MainButton>
        </FooterActions>
      )}
    </div>
  );
}

function GuessScreen({ index, onPick }: { index: number; onPick: (answer: string) => void }) {
  const g = S1_6.guesses[index];
  useSay([g.prompt], { afterFlow: true });
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6" aria-labelledby="guess-q" data-testid="guess-screen" data-guess={g.id}>
      <p className="text-base text-[var(--body)]">
        {index + 1} / {S1_6.guesses.length}
      </p>
      <Swatch kind={g.swatch} className="h-40 w-40 sm:h-52 sm:w-52" />
      <h2 id="guess-q" className="text-3xl font-semibold text-[var(--heading)]">
        {g.prompt}
      </h2>
      <div className={`grid w-full gap-3 ${g.options.length === 4 ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
        {g.options.map((o) => (
          <button key={o} type="button" className="btn-answer justify-center text-2xl" onClick={() => onPick(o)} data-testid={`guess-${o}`}>
            {o}
          </button>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Game 1 'Shape Match' ---------------- */

function ShapeGame({ onDone }: { onDone: () => void }) {
  const items: GameItem[] = useMemo(
    () =>
      S1_6.game2.shapes.map((s) => ({
        id: s.id,
        label: s.name,
        target: `meaning-${s.id}`,
        render: (size) => <ShapeGlyph shape={s.id as "triangle" | "circle" | "square"} className={size === "placed" ? "h-10 w-10" : "h-24 w-24"} />,
      })),
    [],
  );
  const targets: GameTarget[] = useMemo(
    () =>
      S1_6.game2.shapes.map((s) => ({
        id: `meaning-${s.id}`,
        label: s.meaning,
        className: "bg-[var(--card)] ring-2 ring-[var(--border)]",
        render: () => <span className="text-xl font-semibold text-[var(--heading)]">{s.meaning}</span>,
      })),
    [],
  );
  const shapeOf = (targetId: string) => targetId.replace("meaning-", "") as ShapeId;
  return (
    <DragSortGame
      title={S1_6.game2.title}
      howTo={S1_6.game2.howTo}
      layout="row3"
      items={items}
      targets={targets}
      onDone={onDone}
      feedback={{
        right: (i) => shapeRight(i.id as ShapeId),
        wrong1: (i) => shapeWrong(i.id as ShapeId),
        hint: (i) => shapeKey(shapeOf(i.target)),
      }}
    />
  );
}

/* ---------------- Game 2 'New Signs': what does each new sign tell you? ---------------- */

const MEANING_ID = (m: string) => `means-${m.replace(/\s+/g, "-")}`;

function NewSignsGame({ onDone }: { onDone: () => void }) {
  const items: GameItem[] = useMemo(
    () =>
      S1_6.game3.signs.map((s) => ({
        id: s.id,
        label: s.word,
        target: MEANING_ID(s.meaning),
        render: (size) => <SignIcon sign={s} size={size === "placed" ? 56 : 96} />,
      })),
    [],
  );
  const targets: GameTarget[] = useMemo(
    () =>
      S1_6.game3.meanings.map((m) => ({
        id: MEANING_ID(m),
        label: m,
        className: "bg-[var(--card)] ring-2 ring-[var(--border)]",
        render: () => <span className="text-xl font-bold text-[var(--heading)]">{m}</span>,
      })),
    [],
  );
  const sign = (i: GameItem) => S1_6.game3.signs.find((s) => s.id === i.id)!;
  return (
    <DragSortGame
      title={S1_6.game3.title}
      howTo={S1_6.game3.howTo}
      layout="row5"
      items={items}
      targets={targets}
      onDone={onDone}
      feedback={{
        right: (i) => newSignRight(sign(i)),
        wrong1: (i) => newSignWrong(sign(i)),
        hint: (i) => newSignHint(sign(i)),
      }}
    />
  );
}
