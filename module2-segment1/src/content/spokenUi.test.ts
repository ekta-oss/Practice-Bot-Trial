import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SPOKEN_UI } from "./spokenUi";
import { S1_1, S1_2, S1_3, S1_4, S1_5, S1_6, type Line } from "./segment1";
import { uiAudioFile } from "@/lib/uiAudio";

const audioDir = path.resolve(__dirname, "..", "..", "public", "media", "audio");
const scriptLines = [S1_1, S1_2, S1_3, S1_4, S1_5, S1_6].flatMap((o) =>
  Object.values(o).filter((v): v is Line => typeof v === "object" && v !== null && "file" in v && "role" in v),
);

describe("spoken audio files", () => {
  it("file names are stable and readable", () => {
    expect(uiAudioFile("Say hello, and introduce yourself.")).toMatch(/^M2_UI_say-hello-and-introduce-yourself_[0-9a-f]{8}\.mp3$/);
    expect(uiAudioFile("Say hello, and introduce yourself.")).toBe(uiAudioFile("Say hello, and introduce yourself."));
    expect(new Set(SPOKEN_UI.map(uiAudioFile)).size).toBe(SPOKEN_UI.length);
  });

  it("every script line has an MP3", () => {
    expect(scriptLines.length).toBe(14);
    for (const l of scriptLines) expect(fs.existsSync(path.join(audioDir, l.file)), l.file).toBe(true);
  });

  it("every spoken instruction and feedback line has an MP3", () => {
    expect(SPOKEN_UI).toContain("Say hello, and introduce yourself.");
    for (const t of SPOKEN_UI) expect(fs.existsSync(path.join(audioDir, uiAudioFile(t))), t).toBe(true);
  });
});
