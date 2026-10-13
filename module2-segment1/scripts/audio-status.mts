// Lists course audio that is missing, and MP3s no longer used by the course.  npx tsx scripts/audio-status.mts
import fs from "node:fs";
import path from "node:path";
import { ALL_AUDIO_FILES } from "../src/content/audioFiles";

const DIR = path.resolve(import.meta.dirname, "..", "public", "media", "audio");
const have = fs.readdirSync(DIR).filter((f) => f.endsWith(".mp3"));
const want = new Set(ALL_AUDIO_FILES);
console.log("unused:", have.filter((f) => !want.has(f) && !f.startsWith("M2_MUSIC")));
console.log("missing:", ALL_AUDIO_FILES.filter((f) => !have.includes(f)));
