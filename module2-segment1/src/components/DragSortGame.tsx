"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { chime } from "@/lib/media";
import { useRestartsOnResume } from "@/lib/runtime";
import { FeedbackCard, HintBulb } from "./ui";

/**
 * Drag-and-drop sorting game (Stages 1.5 and 1.6).
 * - A card in the right box stays (soft chime); a wrong one slides back.
 * - Per card: 1st wrong → slide back + `wrong1`; the lightbulb glows.
 *             2nd wrong → the lightbulb card opens with `hint`.
 *             3rd wrong → the card moves to the right box by itself (`auto`).
 * - Works with mouse, touch, and keyboard/tap: select a card, then a box.
 */

export interface GameItem {
  id: string;
  label: string; // accessible name
  target: string;
  render: (size: "pile" | "placed" | "drag") => React.ReactNode;
}
export interface GameTarget {
  id: string;
  label: string;
  render?: () => React.ReactNode;
  className?: string;
}

export interface GameFeedback {
  right?: (item: GameItem, target: GameTarget) => string | null;
  wrong1: (item: GameItem, attempted: GameTarget) => string;
  hint: (item: GameItem) => string;
  auto?: (item: GameItem, target: GameTarget) => string | null;
}

type Msg = { kind: "right" | "wrong" | "hint" | "info"; text: string } | null;

export function DragSortGame({
  title,
  items,
  targets,
  feedback,
  onDone,
  layout = "pileTop",
}: {
  title?: string;
  items: GameItem[];
  targets: GameTarget[];
  feedback: GameFeedback;
  onDone: () => void;
  layout?: "pileTop" | "sideBySide";
}) {
  useRestartsOnResume(false);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [wrongs, setWrongs] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [bouncing, setBouncing] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg>(null);
  const [bulb, setBulb] = useState<{ glowing: boolean; text: string | null; open: boolean }>({ glowing: false, text: null, open: false });
  const doneRef = useRef(false);
  const [stamp, setStamp] = useState(0);

  // Feedback floats above the game; it fades after a few seconds so it never hides the boxes for long.
  // The lightbulb stays lit, so the hint can be opened again.
  useEffect(() => {
    if (stamp === 0) return;
    const t = window.setTimeout(() => {
      setMsg(null);
      setBulb((b) => ({ ...b, open: false }));
    }, 6000);
    return () => window.clearTimeout(t);
  }, [stamp]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }));

  const remaining = items.filter((i) => !placed[i.id]);

  useEffect(() => {
    if (!doneRef.current && items.length > 0 && remaining.length === 0) {
      doneRef.current = true;
      onDone();
    }
  }, [remaining.length, items.length, onDone]);

  const attempt = (itemId: string, targetId: string) => {
    const item = items.find((i) => i.id === itemId)!;
    const target = targets.find((t) => t.id === targetId)!;
    setSelected(null);
    if (placed[itemId]) return;
    setStamp((n) => n + 1);
    if (item.target === targetId) {
      chime();
      setPlaced((p) => ({ ...p, [itemId]: targetId }));
      const t = feedback.right?.(item, target) ?? null;
      setMsg(t ? { kind: "right", text: t } : null);
      setBulb((b) => ({ ...b, open: false }));
      return;
    }
    const n = (wrongs[itemId] ?? 0) + 1;
    setWrongs((w) => ({ ...w, [itemId]: n }));
    setBouncing(itemId);
    window.setTimeout(() => setBouncing((b) => (b === itemId ? null : b)), 500);
    if (n === 1) {
      setMsg({ kind: "wrong", text: feedback.wrong1(item, target) });
      setBulb({ glowing: true, text: feedback.hint(item), open: false });
    } else if (n === 2) {
      setMsg(null);
      setBulb({ glowing: true, text: feedback.hint(item), open: true });
    } else {
      const right = targets.find((t) => t.id === item.target)!;
      setPlaced((p) => ({ ...p, [itemId]: item.target }));
      const t = feedback.auto?.(item, right) ?? null;
      setMsg(t ? { kind: "info", text: t } : null);
      setBulb((b) => ({ ...b, open: false }));
    }
  };

  const onDragStart = (e: DragStartEvent) => {
    setDragging(String(e.active.id));
    setSelected(null);
  };
  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null);
    if (e.over) attempt(String(e.active.id), String(e.over.id));
  };

  const draggingItem = dragging ? items.find((i) => i.id === dragging) : null;

  const pile = (
    <div className={`flex flex-wrap content-start justify-center gap-3 ${layout === "sideBySide" ? "flex-col items-center" : ""}`} role="list" aria-label="Cards to sort" data-testid="pile">
      {remaining.map((item, i) => (
        <PileCard
          key={item.id}
          item={item}
          tilt={layout === "pileTop" ? ((i * 37) % 9) - 4 : 0}
          selected={selected === item.id}
          bouncing={bouncing === item.id}
          hidden={dragging === item.id}
          onSelect={() => setSelected((s) => (s === item.id ? null : item.id))}
        />
      ))}
    </div>
  );

  const boxes = (
    <div className={layout === "sideBySide" ? "flex flex-col gap-3" : "grid grid-cols-2 gap-3 md:grid-cols-4"} data-testid="boxes">
      {targets.map((t) => (
        <DropBox
          key={t.id}
          target={t}
          selecting={selected !== null}
          onChoose={() => selected && attempt(selected, t.id)}
          placedItems={items.filter((i) => placed[i.id] === t.id)}
        />
      ))}
    </div>
  );

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragging(null)}>
      <div className="flex flex-col gap-4" data-testid="drag-game">
        <div className="flex items-center justify-between gap-3">
          {title ? <h2 className="text-2xl font-bold text-slate-900">{title}</h2> : <span />}
          <HintBulb glowing={bulb.glowing} open={bulb.open} onClick={() => {
            setBulb((b) => ({ ...b, open: !b.open }));
            setStamp((n) => n + 1);
          }} />
        </div>

        {layout === "sideBySide" ? (
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-4">
            {pile}
            {boxes}
          </div>
        ) : (
          <>
            {pile}
            {boxes}
          </>
        )}

        <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-30 mx-auto flex max-w-xl flex-col px-4 [&>*]:shadow-lg">
          {bulb.open && bulb.text && (
            <FeedbackCard kind="hint" testId="hint-card">
              {bulb.text}
            </FeedbackCard>
          )}
          {msg && !bulb.open && (
            <FeedbackCard key={`${msg.kind}-${msg.text}-${Object.keys(placed).length}-${JSON.stringify(wrongs)}`} kind={msg.kind} testId={`game-feedback-${msg.kind}`}>
              {msg.text}
            </FeedbackCard>
          )}
        </div>
      </div>
      <DragOverlay>{draggingItem ? <div className="cursor-grabbing drop-shadow-2xl">{draggingItem.render("drag")}</div> : null}</DragOverlay>
    </DndContext>
  );
}

function PileCard({ item, tilt, selected, bouncing, hidden, onSelect }: { item: GameItem; tilt: number; selected: boolean; bouncing: boolean; hidden: boolean; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: item.id });
  // Keyboard/tap selection is handled by onClick; dnd-kit only handles pointer/touch drags.
  const { role: _role, tabIndex: _tab, ...restAttrs } = attributes;
  void _role;
  void _tab;
  return (
    <div role="listitem" style={{ transform: `rotate(${tilt}deg)` }} className={hidden ? "opacity-30" : ""}>
      <button
        ref={setNodeRef}
        type="button"
        {...restAttrs}
        {...listeners}
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`${item.label}${selected ? " (selected — now choose a box)" : ""}`}
        data-testid={`card-${item.id}`}
        className={`touch-none select-none rounded-xl transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
          selected ? "ring-4 ring-teal-600" : ""
        } ${bouncing ? "animate-[slide-back_0.45s_ease-out]" : ""} cursor-grab`}
      >
        {item.render("pile")}
      </button>
    </div>
  );
}

function DropBox({ target, selecting, onChoose, placedItems }: { target: GameTarget; selecting: boolean; onChoose: () => void; placedItems: GameItem[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: target.id });
  return (
    <div ref={setNodeRef} className={`rounded-2xl ${isOver ? "ring-4 ring-teal-500" : ""}`}>
      <button
        type="button"
        onClick={onChoose}
        aria-disabled={!selecting}
        data-testid={`box-${target.id}`}
        aria-label={`${target.label} box${placedItems.length ? `, has ${placedItems.map((p) => p.label).join(", ")}` : ""}`}
        className={`flex min-h-36 w-full flex-col items-center gap-2 rounded-2xl p-3 text-left transition focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${target.className ?? "bg-white ring-2 ring-slate-300"} ${
          selecting ? "cursor-pointer hover:brightness-95" : "cursor-default"
        }`}
      >
        {target.render ? target.render() : <span className="text-xl font-bold">{target.label}</span>}
        <span className="flex flex-wrap justify-center gap-2" data-testid={`box-${target.id}-items`}>
          {placedItems.map((p) => (
            <span key={p.id} data-placed={p.id}>
              {p.render("placed")}
            </span>
          ))}
        </span>
      </button>
    </div>
  );
}
