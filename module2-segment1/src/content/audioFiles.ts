/** Every audio file the course can play (script lines + spoken instructions), for preloading. */
import { S1_1, S1_2, S1_3, S1_4, S1_5, S1_6, type Line } from "./segment1";
import { SPOKEN_UI } from "./spokenUi";
import { uiAudioFile } from "@/lib/uiAudio";

const scriptLines = [S1_1, S1_2, S1_3, S1_4, S1_5, S1_6].flatMap((o) =>
  Object.values(o).filter((v): v is Line => typeof v === "object" && v !== null && "file" in v && "role" in v),
);

export const ALL_AUDIO_FILES: string[] = [...scriptLines.map((l) => l.file), ...SPOKEN_UI.map(uiAudioFile)];
