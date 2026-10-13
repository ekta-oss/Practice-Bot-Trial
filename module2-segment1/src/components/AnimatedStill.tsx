"use client";

import type { CSSProperties } from "react";
import type { Box, CharacterRig } from "./scenes";

/**
 * Brings a still picture of the person in charge gently to life (no video yet):
 *  - the picture fades in, and the arrival shot slowly pushes in (camera walking in);
 *  - her figure breathes (a tiny rise and fall);
 *  - her head nods and tilts softly while she is speaking.
 * Only her figure moves: it is the same picture, masked to her outline with soft
 * edges, layered over the still background. Motion is very small on purpose
 * ("slow, calm camera"), stops when the stage is paused, and is switched off by
 * the global prefers-reduced-motion rule.
 */
export function AnimatedStill({
  src,
  rig,
  pushIn,
  speaking,
  paused,
}: {
  src: string;
  rig?: CharacterRig;
  pushIn?: { x: number; y: number };
  speaking?: boolean;
  paused?: boolean;
}) {
  const play: CSSProperties = { animationPlayState: paused ? "paused" : "running" };
  return (
    <div key={src} className="absolute inset-0 animate-[still-in_0.7s_ease-out]" data-testid="animated-still" data-speaking={speaking ? "true" : "false"}>
      <div
        className="absolute inset-0"
        style={pushIn ? { ...play, transformOrigin: `${pushIn.x}% ${pushIn.y}%`, animation: "push-in 2.4s ease-in-out forwards" } : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        {rig && (
          <div
            className="absolute inset-0"
            style={{ ...play, transformOrigin: `${rig.pivot.x}% ${rig.figure.top + rig.figure.height}%`, animation: "breathe 4.2s ease-in-out infinite" }}
            aria-hidden
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" style={mask(rig.figure, 3)} draggable={false} />
            <div
              className="absolute inset-0"
              style={{
                ...play,
                transformOrigin: `${rig.pivot.x}% ${rig.pivot.y}%`,
                animation: speaking ? "talk-nod 1.5s ease-in-out infinite" : "idle-tilt 6s ease-in-out infinite",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" style={mask(rig.head, 3)} draggable={false} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
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
