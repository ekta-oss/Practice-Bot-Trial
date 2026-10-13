"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { lineAudio } from "@/lib/runtime";
import { mouthAt, mouthCurve, mouthRhythm } from "@/lib/lipSync";
import type { Box, CharacterRig } from "./scenes";

/**
 * Brings a still picture of the person in charge gently to life (no video yet):
 *  - the picture fades in, and the arrival shot slowly pushes in (camera walking in);
 *  - her figure breathes (a tiny rise and fall);
 *  - her lips move with her voice while she is speaking: the mouth opens as
 *    the line gets louder and closes in the pauses (read from the line's own
 *    audio; a gentle talking rhythm when there is no audio file).
 * Only her figure moves: it is the same picture, masked with soft edges and
 * layered over the still background. Motion is very small on purpose
 * ("slow, calm camera"), stops when the stage is paused, and is switched off by
 * the global prefers-reduced-motion rule.
 */
export function AnimatedStill({
  src,
  rig,
  pushIn,
  speaking,
  voiceFile,
  paused,
}: {
  src: string;
  rig?: CharacterRig;
  pushIn?: { x: number; y: number };
  speaking?: boolean;
  /** The voice line being spoken, so the lips can follow its audio. */
  voiceFile?: string | null;
  paused?: boolean;
}) {
  const mouthRef = useRef<HTMLDivElement | null>(null);
  useLipSync(mouthRef, !!speaking && !paused, voiceFile ?? null, rig);

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
            <div
              ref={mouthRef}
              className="absolute inset-0"
              data-testid="mouth"
              style={{ transformOrigin: `${rig.hinge.x}% ${rig.hinge.y}%` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" style={mask(rig.jaw, 0.7)} draggable={false} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Opens and closes the mouth layer every frame (no React re-render): a small
 * downward stretch from where the teeth meet, like the jaw dropping. Opening is quick
 * and closing a little slower, as real lips do.
 */
function useLipSync(ref: React.RefObject<HTMLDivElement | null>, active: boolean, file: string | null, rig?: CharacterRig) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !rig) return;
    const still = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let curve: Float32Array | null = null;
    let cancelled = false;
    if (active && file) void mouthCurve(file).then((c) => { if (!cancelled) curve = c; });
    const start = performance.now();
    let open = 0;
    let raf = 0;
    const tick = () => {
      let target = 0;
      if (active && !still) {
        const audio = file ? lineAudio(file) : undefined;
        if (audio && !audio.paused) target = curve ? mouthAt(curve, audio.currentTime) : mouthRhythm(audio.currentTime);
        // No audio playing (no file, or the browser blocked it): talk along with the subtitle.
        else target = mouthRhythm((performance.now() - start) / 1000) * 0.8;
      }
      open += (target - open) * (target > open ? 0.55 : 0.3);
      if (open < 0.01) open = 0;
      el.style.transform = open ? `scaleY(${(1 + 0.22 * open).toFixed(3)})` : "";
      if (active || open > 0) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [ref, active, file, rig]);
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
