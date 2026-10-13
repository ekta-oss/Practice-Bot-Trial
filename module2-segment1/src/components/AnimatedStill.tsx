"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import { lineAudio } from "@/lib/runtime";
import { loudnessAt, wordTime } from "@/lib/voiceTiming";
import { GESTURES, type Box, type CharacterRig } from "./scenes";

/**
 * Brings a still picture of the person in charge gently to life (no video yet):
 *  - the picture fades in, and the arrival shot slowly pushes in (camera walking in);
 *  - her figure breathes (a tiny rise and fall);
 *  - while she speaks, her lips follow the loudness of her own voice line and her
 *    hands gesture on the words they belong to (see GESTURES), both timed from
 *    the measured voice (lib/voiceTiming) and the audio's own clock.
 * Only parts of her move: copies of the same picture, masked with soft edges,
 * layered over the still. Motion is small on purpose, stops when the stage is
 * paused, and is switched off for people who ask for reduced motion.
 */
export function AnimatedStill({
  src,
  rig,
  pushIn,
  speaking,
  voice,
  paused,
}: {
  src: string;
  rig?: CharacterRig;
  pushIn?: { x: number; y: number };
  speaking?: boolean;
  /** The voice line being spoken, so the lips and hands can follow it. */
  voice?: { file: string; text: string } | null;
  paused?: boolean;
}) {
  const mouthRef = useRef<HTMLDivElement | null>(null);
  const handRefs = useRef<Record<string, HTMLDivElement | null>>({});
  useVoiceMotion(mouthRef, handRefs, !!speaking && !paused, voice ?? null, rig);

  // Longhand animation properties only (mixing them with the "animation" shorthand confuses React on re-render).
  const anim = (name: string, duration: string, timing: string, count: string, fill = "none"): CSSProperties => ({
    animationName: name,
    animationDuration: duration,
    animationTimingFunction: timing,
    animationIterationCount: count,
    animationFillMode: fill,
    animationPlayState: paused ? "paused" : "running",
  });
  return (
    <div key={src} className="absolute inset-0 animate-[still-in_0.7s_ease-out]" data-testid="animated-still" data-speaking={speaking ? "true" : "false"}>
      <div
        className="absolute inset-0"
        style={pushIn ? { ...anim("push-in", "2.4s", "ease-in-out", "1", "forwards"), transformOrigin: `${pushIn.x}% ${pushIn.y}%` } : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        {rig && (
          <div
            className="absolute inset-0"
            style={{ ...anim("breathe", "4.2s", "ease-in-out", "infinite"), transformOrigin: `${rig.hinge.x}% ${rig.figure.top + rig.figure.height}%` }}
            aria-hidden
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" style={mask(rig.figure, 3)} draggable={false} />
            {rig.hands?.map((h) => (
              <div
                key={h.id}
                ref={(el) => {
                  handRefs.current[h.id] = el;
                }}
                className="absolute inset-0"
                data-testid={`hand-${h.id}`}
                style={{ transformOrigin: `${h.pivot.x}% ${h.pivot.y}%` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" style={mask(h.box, 1.5)} draggable={false} />
              </div>
            ))}
            <div ref={mouthRef} className="absolute inset-0" data-testid="mouth" style={{ transformOrigin: `${rig.hinge.x}% ${rig.hinge.y}%` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" style={mask(rig.jaw, 0.7)} draggable={false} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Gesture shape over time (0 → 1 → 0), starting a little before the word, as people do. */
function gestureAmount(kind: "beat" | "sweep", dt: number): number {
  const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const [lead, rise, hold, fall] = kind === "beat" ? [0.18, 0.3, 0.45, 0.6] : [0.2, 0.45, 1.6, 0.8];
  const t = dt + lead;
  if (t < 0) return 0;
  if (t < rise) return ease(t / rise);
  if (t < rise + hold) {
    // A sweep keeps guiding: a slow second push in the middle of the phrase.
    return kind === "sweep" ? 0.85 + 0.15 * Math.cos(((t - rise) / hold) * Math.PI * 2) : 1;
  }
  return 1 - ease((t - rise - hold) / fall);
}

/** A gentle talking rhythm (no measured voice to follow): syllable-like, never metronomic. */
function talkingRhythm(seconds: number): number {
  return Math.max(0, 0.5 + 0.5 * Math.sin(seconds * 2 * Math.PI * 4.3) * (0.6 + 0.4 * Math.sin(seconds * 2 * Math.PI * 0.9)));
}

/**
 * Every frame (no React re-render): opens the mouth layer with the loudness of
 * the voice at the audio's current time, and turns each hand by its gestures.
 * Opening is quick and closing a little slower, as real lips do.
 */
function useVoiceMotion(
  mouthRef: React.RefObject<HTMLDivElement | null>,
  handRefs: React.RefObject<Record<string, HTMLDivElement | null>>,
  active: boolean,
  voice: { file: string; text: string } | null,
  rig?: CharacterRig,
) {
  const file = voice?.file ?? null;
  const text = voice?.text ?? "";
  const cues = useMemo(
    () => (file ? (GESTURES[file] ?? []).map((g) => ({ ...g, at: wordTime(file, text, g.word) })).filter((g) => g.at !== undefined) : []),
    [file, text],
  );
  useEffect(() => {
    const mouth = mouthRef.current;
    if (!mouth || !rig) return;
    const still = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let last = start;
    let open = 0;
    const turn: Record<string, number> = {};
    let raf = 0;
    const tick = () => {
      // Smoothing by elapsed time, so motion is the same on a fast laptop and a slow phone.
      const now = performance.now();
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      const follow = (tau: number) => 1 - Math.exp(-dt / tau);
      const audio = file ? lineAudio(file) : undefined;
      const playing = !!audio && !audio.paused;
      // The voice's own clock when it is playing; otherwise time since the line began.
      const t = playing ? audio!.currentTime : (performance.now() - start) / 1000;
      let target = 0;
      if (active && !still) {
        const measured = playing && file ? loudnessAt(file, t) : undefined;
        target = measured ?? talkingRhythm(t) * 0.8;
      }
      open += (target - open) * follow(target > open ? 0.025 : 0.055);
      if (open < 0.01) open = 0;
      mouth.style.transform = open ? `scaleY(${(1 + 0.22 * open).toFixed(3)})` : "";

      let moving = open > 0;
      for (const h of rig.hands ?? []) {
        let g = 0;
        if (active && !still) for (const c of cues) if (c.hand === h.id) g = Math.max(g, gestureAmount(c.kind, t - c.at!) * (c.strength ?? 1));
        const cur = turn[h.id] ?? 0;
        const next = cur + (g - cur) * follow(0.07);
        turn[h.id] = Math.abs(next) < 0.002 ? 0 : next;
        const el = handRefs.current?.[h.id];
        if (el) el.style.transform = turn[h.id] ? `rotate(${(h.lift * turn[h.id]).toFixed(3)}deg)` : "";
        if (turn[h.id]) moving = true;
      }
      if (active || moving) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mouthRef, handRefs, active, file, cues, rig]);
}

/** Soft-edged rectangular mask (feather in % of the picture). */
function mask(b: Box, feather: number): CSSProperties {
  const l = b.left;
  const r = b.left + b.width;
  const t = b.top;
  const bottom = b.top + b.height;
  const toBottom = bottom >= 99 ? `#000 100%` : `#000 ${bottom - feather}%, transparent ${bottom}%`;
  const img = `linear-gradient(to right, transparent ${l}%, #000 ${l + feather}%, #000 ${r - feather}%, transparent ${r}%), linear-gradient(to bottom, transparent ${t}%, #000 ${t + feather}%, ${toBottom})`;
  return {
    maskImage: img,
    WebkitMaskImage: img,
    maskComposite: "intersect",
    WebkitMaskComposite: "source-in",
  } as CSSProperties;
}
