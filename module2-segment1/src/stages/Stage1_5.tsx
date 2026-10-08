"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { COLOUR_NAMES, S1_5, UI, WALK_SIGNS, type ColourGroup } from "@/content/segment1";
import { useProgress } from "@/lib/progress";
import { useLinePlayer } from "@/lib/runtime";
import { DragSortGame, type GameItem, type GameTarget } from "@/components/DragSortGame";
import { SignIcon } from "@/components/SignIcon";
import { FeedbackCard, FooterActions, MainButton, NarrationBar } from "@/components/ui";

/**
 * 1.5 Sort the signs by colour — 'Colour Sort'.
 * TOP: the 12 sign cards (from 'My signs') in a loose pile.
 * BOTTOM: 4 big boxes in a row — red, yellow, blue, green, each with its colour name.
 * Ungraded game; moving on: all 12 placed. Not stored.
 */
export const COLOUR_BOX_CLASS: Record<ColourGroup, string> = {
  red: "bg-[#fde8eb] ring-4 ring-[#C8102E]",
  yellow: "bg-[#fff8d6] ring-4 ring-[#F6C700]",
  blue: "bg-[#e3eefa] ring-4 ring-[#0057A8]",
  green: "bg-[#e1f3e8] ring-4 ring-[#00843D]",
};
export const COLOUR_TEXT_CLASS: Record<ColourGroup, string> = {
  red: "text-[#a00d25]",
  yellow: "text-[#7a6200]",
  blue: "text-[#0057A8]",
  green: "text-[#00703a]",
};

export function colourTargets(): GameTarget[] {
  return (["red", "yellow", "blue", "green"] as ColourGroup[]).map((c) => ({
    id: c,
    label: COLOUR_NAMES[c],
    className: COLOUR_BOX_CLASS[c],
    render: () => <span className={`text-2xl font-extrabold ${COLOUR_TEXT_CLASS[c]}`}>{COLOUR_NAMES[c]}</span>,
  }));
}

export function Stage1_5({ onComplete }: { onComplete: () => void }) {
  const { state } = useProgress();
  const [done, setDone] = useState(false);
  const nar = useLinePlayer();

  useEffect(() => {
    void nar.play([S1_5.nar1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The 12 sign cards from 'My signs' (after 1.2 the notebook always has all 12).
  const items: GameItem[] = useMemo(() => {
    const mine = state.mySigns.map((s) => WALK_SIGNS.find((w) => w.id === s.id)!).filter(Boolean);
    const list = mine.length === WALK_SIGNS.length ? mine : WALK_SIGNS;
    return list.map((s) => ({
      id: s.id,
      label: s.word,
      target: s.colour,
      render: (size) => <SignIcon sign={s} size={size === "placed" ? 64 : 96} />,
    }));
    // Only on first render: the pile does not change during the game.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const targets = useMemo(() => colourTargets(), []);
  const onDone = useCallback(() => setDone(true), []);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-3 py-4 sm:px-6">
      <NarrationBar now={nar.now} onReplay={nar.hasPlayed ? nar.replay : undefined} />
      <DragSortGame
        title={S1_5.title}
        items={items}
        targets={targets}
        onDone={onDone}
        feedback={{
          wrong1: () => S1_5.wrong1,
          hint: () => S1_5.hint,
          auto: (_item, t) => S1_5.auto(t.label.toLowerCase()),
        }}
      />
      {done && (
        <>
          <FeedbackCard kind="right" testId="done-feedback">
            {S1_5.done}
          </FeedbackCard>
          <FooterActions>
            <MainButton onClick={onComplete} testId="continue-button">
              {UI.continue}
            </MainButton>
          </FooterActions>
        </>
      )}
    </div>
  );
}
