import { S1_1, S1_2, S1_3, S1_4, S1_5, S1_6, type Line } from "./segment1";
import { SCENE_IMAGE } from "@/components/scenes";

/**
 * Every produced media file Stages 1.1–1.6 can load. The app checks for each
 * file at run time; /assets shows which are present. Drop files into
 * public/media/{audio,video,images}/ with exactly these names.
 */
export interface AssetEntry {
  stage: string;
  kind: "audio" | "video" | "image" | "captions";
  file: string;
  dir: "audio" | "video" | "images";
  what: string;
  /** What the app does while the file is missing. */
  fallback: string;
  /** The script names this file; false = name chosen by the build team (see OPEN_QUESTIONS). */
  namedInScript: boolean;
  required: boolean;
}

const line = (stage: string, l: Line, namedInScript = true): AssetEntry => ({
  stage,
  kind: "audio",
  file: l.file,
  dir: "audio",
  what: `${l.role} (${l.words} words): “${l.text}”`,
  fallback: "Subtitle shown for the line's length (110 wpm); browser stand-in voice reads it, marked 'Audio missing'.",
  namedInScript,
  required: true,
});

export const ASSETS: AssetEntry[] = [
  { stage: "1.1", kind: "video", file: S1_1.video1, dir: "video", what: "First-person video, ~20 s total: you walk in through the glass door; PIC at reception looks up, smiles, stands; says line 1. Clip ends where the video pauses.", fallback: "Still entrance picture with PIC + line 1 audio and subtitles; 'Video missing' badge.", namedInScript: false, required: true },
  { stage: "1.1", kind: "video", file: S1_1.video2, dir: "video", what: "Same video, line 2: PIC opens one hand and points down the corridor.", fallback: "Still picture (PIC pointing) + line 2 audio and subtitles; 'Video missing' badge.", namedInScript: false, required: true },
  { stage: "1.1", kind: "captions", file: S1_1.video1.replace(".mp4", ".vtt"), dir: "video", what: "WebVTT English subtitles for clip 1 (within 1 s of the audio).", fallback: "App subtitles timed at 110 wpm.", namedInScript: false, required: false },
  { stage: "1.1", kind: "captions", file: S1_1.video2.replace(".mp4", ".vtt"), dir: "video", what: "WebVTT English subtitles for clip 2.", fallback: "App subtitles timed at 110 wpm.", namedInScript: false, required: false },
  line("1.1", S1_1.pic1),
  line("1.1", S1_1.pic2),
  line("1.1", S1_1.allTicked, false),
  line("1.1", S1_1.notAllTicked, false),
  line("1.1", S1_1.afterSecond, false),
  line("1.2", S1_2.nar1),
  ...(["entrance", "corridor", "pantry", "meeting"] as const).map((p, i) => ({
    stage: "1.2",
    kind: "image" as const,
    file: SCENE_IMAGE[p],
    dir: "images" as const,
    what: `Picture ${i + 1} — ${p} (16:9, first person, flat vector). Must leave the sign areas clear: the 12 signs are drawn by the app at the positions in the script.`,
    fallback: "Interim build-drawn SVG scene.",
    namedInScript: false,
    required: true,
  })),
  line("1.3", S1_3.nar1),
  line("1.3", S1_3.nar2),
  line("1.4", S1_4.nar1),
  line("1.5", S1_5.nar1),
  line("1.6", S1_6.nar1),
  line("1.6", S1_6.nar2),
  line("1.6", S1_6.nar3),
  line("1.6", S1_6.nar4),
];
