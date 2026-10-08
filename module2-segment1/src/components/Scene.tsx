"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Line, PlaceId } from "@/content/segment1";
import { IMAGE_DIR, VIDEO_DIR, assetExists } from "@/lib/media";
import { useLinePlayer, useRuntime, type NowPlaying } from "@/lib/runtime";
import { SCENE_IMAGE, SceneArt } from "./scenes";
import { MissingAssetBadge } from "./ui";

/** A 16:9 picture. Uses the illustrator's file when it exists, else the interim drawing. */
export function SceneFrame({
  place,
  withPic,
  children,
  className = "",
  imageOverride,
  blur,
}: {
  place: PlaceId;
  withPic?: "stand" | "point" | false;
  children?: React.ReactNode;
  className?: string;
  imageOverride?: string;
  blur?: boolean;
}) {
  const file = imageOverride ?? SCENE_IMAGE[place];
  const [img, setImg] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void assetExists(IMAGE_DIR + file).then((ok) => live && setImg(ok ? IMAGE_DIR + file : null));
    return () => {
      live = false;
    };
  }, [file]);
  return (
    <div className={`relative aspect-video ${/(^|\s)w-/.test(className) ? "" : "w-full"} overflow-hidden bg-[#efe6d6] ${className}`} data-scene={place} data-art={img ? "final" : "interim"}>
      <div className={`absolute inset-0 ${blur ? "scale-105 blur-md" : ""}`}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <SceneArt place={place} withPic={withPic} />
        )}
      </div>
      {children}
    </div>
  );
}

/**
 * Plays one video clip; if the file is missing, plays its spoken lines over the
 * still picture instead and shows a "missing" badge. Resolves when finished.
 * Pausing stops the clip; 'Resume' plays it again from the beginning.
 */
export function useClip() {
  const { paused, resumeToken } = useRuntime();
  const lines = useLinePlayer();
  const [clip, setClip] = useState<{ file: string; lines: Line[]; present: boolean } | null>(null);
  const [now, setNow] = useState<NowPlaying | null>(null);
  const resolver = useRef<(() => void) | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const play = useCallback(
    async (file: string, clipLines: Line[]) => {
      const present = await assetExists(VIDEO_DIR + file);
      return new Promise<void>((resolve) => {
        resolver.current = resolve;
        setClip({ file, lines: clipLines, present });
        if (!present) {
          void lines.play(clipLines).then(() => {
            resolver.current = null;
            resolve();
          });
        }
      });
    },
    [lines],
  );

  // Real video: subtitles follow the clip's lines.
  const onVideoEnded = useCallback(() => {
    setNow(null);
    const r = resolver.current;
    resolver.current = null;
    r?.();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !clip?.present) return;
    if (paused) v.pause();
  }, [paused, clip]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !clip?.present || resumeToken === 0 || !resolver.current) return;
    v.currentTime = 0;
    void v.play().catch(() => {});
  }, [resumeToken, clip]);

  const video =
    clip?.present ? (
      <video
        key={clip.file}
        ref={videoRef}
        src={VIDEO_DIR + clip.file}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        playsInline
        onPlay={() => setNow({ line: clip.lines[0], missing: false, standIn: false })}
        onTimeUpdate={(e) => {
          // Spread the subtitle lines across the clip.
          const v = e.currentTarget;
          if (!v.duration || clip.lines.length < 2) return;
          const idx = Math.min(clip.lines.length - 1, Math.floor((v.currentTime / v.duration) * clip.lines.length));
          setNow({ line: clip.lines[idx], missing: false, standIn: false });
        }}
        onEnded={onVideoEnded}
      >
        <track kind="captions" src={VIDEO_DIR + clip.file.replace(/\.mp4$/, ".vtt")} srcLang="en" label="English" />
      </video>
    ) : null;

  const missingBadge = clip && !clip.present ? <MissingAssetBadge what={`Video missing: ${clip.file} — still picture + audio shown`} /> : null;

  return { play, video, now: clip?.present ? now : lines.now, missingBadge };
}
