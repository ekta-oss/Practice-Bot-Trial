"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { S1_6, UI, WALK_SIGNS, type ColourGroup } from "@/content/segment1";
import { colourLine, colourRight, colourWrong, shapeKey, shapeRight, shapeWrong, type ShapeId } from "@/content/feedbackText";
import { uiLine } from "@/lib/uiAudio";
import { useProgress } from "@/lib/progress";
import { useLinePlayer, useRestartsOnResume, useRuntime, useSay } from "@/lib/runtime";
import { OpenArticleButton } from "@/components/ArticleLink";
import { DragSortGame, type GameItem, type GameTarget } from "@/components/DragSortGame";
import { ColourKeyCard } from "@/components/Notebook";
import { ShapeGlyph, SignIcon, Swatch } from "@/components/SignIcon";
import { FooterActions, MainButton, NarrationBar } from "@/components/ui";
import { colourTargets } from "./Stage1_5";

/**
 * 1.6 What does each colour mean?
 * Step 1 guess (5 taps, no right/wrong shown) → Step 2 score + segue line →
 * Step 3 read the SMI article (new tab; 'Back to the course') → Step 4 three
 * drag-and-drop games. The colour key card appears after Game 1, stays, and
 * is saved to 'My notes'. Lapse → restart from Step 1.
 */
type Step =
  | { kind: "guess"; index: number }
  | { kind: "score"; opened: boolean }
  | { kind: "backup" }
  | { kind: "game"; n: 1 | 2 | 3; done: boolean };

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
    if (step.kind === "game" && step.n === 1 && step.done) saveNote("colour-key");
  }, [step, saveNote]);

  const showKey = step.kind === "game" && (step.n > 1 || step.done);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-4 sm:px-6">
      <NarrationBar now={nar.now} onReplay={nar.hasPlayed ? nar.replay : undefined} />

      {step.kind === "guess" && <GuessScreen key={`${step.index}-${resumeToken}`} index={step.index} onPick={guess} />}

      {step.kind === "score" && (
        <section className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5 text-center" data-testid="score-screen">
          <p className="text-7xl font-extrabold text-[var(--blue)]" data-testid="score-big">
            {score} / 5
          </p>
          <p className="text-2xl text-[var(--heading)]" data-testid="score-line">
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

      {step.kind === "game" && step.n === 1 && <Game1 onDone={gameDone} />}
      {step.kind === "game" && step.n === 2 && <Game2 onDone={gameDone} />}
      {step.kind === "game" && step.n === 3 && <Game3 onDone={gameDone} />}

      {step.kind === "game" && step.done && (
        <FooterActions>
          <MainButton
            onClick={() => (step.n < 3 ? setStep({ kind: "game", n: (step.n + 1) as 2 | 3, done: false }) : onComplete())}
            testId="continue-button"
          >
            {UI.continue}
          </MainButton>
        </FooterActions>
      )}

      {/* COLOUR KEY CARD: small card at the bottom of the screen, 4 coloured lines. Appears after Game 1 and stays. */}
      {showKey && (
        <div className="mt-2 self-start lg:fixed lg:bottom-24 lg:left-4 lg:z-20 lg:mt-0">
          <ColourKeyCard compact />
        </div>
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

/* ---------------- Game 1 'Colour Match' ---------------- */

function Game1({ onDone }: { onDone: () => void }) {
  const items: GameItem[] = useMemo(
    () =>
      S1_6.game1.cards.map((c) => ({
        id: c.id,
        label: c.text,
        target: c.target,
        render: (size) => (
          <span className={`block rounded-xl bg-[var(--card)] text-center font-semibold text-[var(--heading)] shadow ring-1 ring-[var(--border)] ${size === "placed" ? "px-2 py-1 text-sm" : "px-4 py-3 text-lg"}`}>{c.text}</span>
        ),
      })),
    [],
  );
  const targets = useMemo(() => colourTargets(), []);
  return (
    <DragSortGame
      title={S1_6.game1.title}
      items={items}
      targets={targets}
      onDone={onDone}
      feedback={{
        right: (_i, t) => colourRight(t.id as ColourGroup),
        wrong1: (_i, attempted) => colourWrong(attempted.id as ColourGroup),
        hint: (i) => colourLine(i.target as ColourGroup),
      }}
    />
  );
}

/* ---------------- Game 2 'Shape Match' ---------------- */

function Game2({ onDone }: { onDone: () => void }) {
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
        className: "bg-[var(--card)] ring-2 ring-[var(--border)] !flex-row justify-between",
        render: () => <span className="text-xl font-semibold text-[var(--heading)]">{s.meaning}</span>,
      })),
    [],
  );
  const shapeOf = (targetId: string) => targetId.replace("meaning-", "") as ShapeId;
  return (
    <DragSortGame
      title={S1_6.game2.title}
      layout="sideBySide"
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

/* ---------------- Game 3 'New Signs' ---------------- */

function Game3({ onDone }: { onDone: () => void }) {
  const items: GameItem[] = useMemo(
    () =>
      S1_6.game3.signs.map((s) => ({
        id: s.id,
        label: s.word,
        target: s.colour,
        render: (size) => <SignIcon sign={s} size={size === "placed" ? 64 : 96} />,
      })),
    [],
  );
  const targets = useMemo(() => colourTargets(), []);
  return (
    <DragSortGame
      title={S1_6.game3.title}
      items={items}
      targets={targets}
      onDone={onDone}
      feedback={{
        right: (_i, t) => colourRight(t.id as ColourGroup),
        wrong1: (_i, attempted) => colourWrong(attempted.id as ColourGroup),
        hint: (i) => colourLine(i.target as ColourGroup),
      }}
    />
  );
}
