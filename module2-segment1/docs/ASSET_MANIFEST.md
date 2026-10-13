# Asset manifest — Module 2, Segment 1, Stages 1.1–1.6

**Status on delivery: 0 of 22 produced media files exist.** The app runs end to end without them, but every place that uses a missing file is marked on screen in magenta (`Audio missing: …` / `Video missing: …`). Nothing missing is presented as finished.

Live status page: **http://localhost:3100/assets**. It checks each file below.

## How to deliver a file

Put it in `public/media/<folder>/` with **exactly** the name below. Reload the course: the file is used at once, with no code change. Automated tests (`e2e/assets.spec.ts`) show that delivered audio, video and pictures replace the stand-ins.

| Folder | Formats |
|---|---|
| `public/media/audio/` | `.mp3` (as named in the script). Spoken at 105–115 wpm. |
| `public/media/video/` | `.mp4` (H.264/AAC). Optional `.vtt` captions with the same base name. |
| `public/media/images/` | `.webp`, 16:9 (e.g. 1600×900). |

## Audio — interim neural voices in place

All 14 script lines **and** every on-screen instruction and feedback line (files `M2_UI_…mp3`, listed in `src/content/spokenUi.ts`) have **interim** MP3s made with Kokoro, an open-source neural voice (Apache-2.0), by `npx tsx scripts/make-voice.mts`. See `public/media/audio/INTERIM_AUDIO.md` for every file, voice, length and pace. They are stand-ins: replace each by dropping the voice artist's file in with the same name.

| Stage | File | Voice | Words | Line | Named in script? |
|---|---|---|---|---|---|
| 1.1 | `M2_S01_01_PIC_01.mp3` | PIC | 8 | “Good morning! Welcome. You must be new here.” | Yes |
| 1.1 | `M2_S01_01_PIC_02.mp3` | PIC | 28 | “Nice to meet you. Before you start, take a walk round the work area and get to know the place. Come back to me when you are done.” | Yes |
| 1.1 | `M2_S01_01_NAR_FB01.mp3` | NAR | 9 | “Great start — you greeted and said who you are.” | **No — build name** |
| 1.1 | `M2_S01_01_NAR_FB02.mp3` | NAR | 10 | “Record again: Say hello. Say your name and your job.” | **No — build name** |
| 1.1 | `M2_S01_01_NAR_FB03.mp3` | NAR | 10 | “Good — now the person in charge knows who you are.” | **No — build name** |
| 1.2 | `M2_S01_02_NAR_01.mp3` | NAR | 57 | “This is your new workplace. … so you can look at it again later.” | Yes |
| 1.3 | `M2_S01_03_NAR_01.mp3` | NAR | 13 | “Before you go back — did you notice the signs as you walked round?” | Yes |
| 1.3 | `M2_S01_03_NAR_02.mp3` | NAR | 16 | “Workplaces have lots of signs. Why? …” | Yes |
| 1.4 | `M2_S01_04_NAR_01.mp3` | NAR | 19 | “Tap the button to open the article. …” | Yes |
| 1.5 | `M2_S01_05_NAR_01.mp3` | NAR | 24 | “The article sorted signs into kinds — …” | Yes |
| 1.6 | `M2_S01_06_NAR_01.mp3` | NAR | 11 | “What do you think each colour means? Make your best guess.” | Yes |
| 1.6 | `M2_S01_06_NAR_02.mp3` | NAR | 12 | (3 or more right) “Good guessing! …” | Yes |
| 1.6 | `M2_S01_06_NAR_03.mp3` | NAR | 14 | (2 or fewer right) “Colours can be tricky. …” | Yes |
| 1.6 | `M2_S01_06_NAR_04.mp3` | NAR | 21 | “Tap the button to open the article. Read about the four colours and the shapes. …” | Yes |

**While missing:** the subtitle shows for the line's length (110 wpm). A browser voice reads the line, clearly labelled `stand-in voice`; add `?standin=0` to the URL to turn it off. The flow never waits on a missing file.

## Video (2 clips + 2 optional caption files)

The script describes one ~20 s video that “pauses after line 1”. The build plays it as **two clips**, so the pause point is exact and works on every browser:

| File | Content |
|---|---|
| `M2_S01_01_VID_01.mp4` | First person: you walk in through the glass door; the person in charge at reception looks up, smiles, stands; says line 1. Ends at the pause. |
| `M2_S01_01_VID_02.mp4` | Line 2: the person in charge opens one hand and points down the corridor. |
| `M2_S01_01_VID_01.vtt`, `…_02.vtt` | Optional WebVTT English captions (script: within 1 s of the audio). Without them, the app shows its own subtitles spread across the clip. |

The script says “An avatar (based on user profile female/male)”. There is no learner profile in scope. See OPEN_QUESTIONS #1.

**While missing:** the still entrance picture (person in charge standing, then pointing on line 2) plays with the line's audio and subtitles, plus a `Video missing` badge.

## Pictures — illustrator's art in place

Imported from the illustrator's folder “Communication Module 1 Asset” (28 mock-up screens, 1672×941) by `node scripts/import-art.mjs "<folder>"`. The mock-ups have screen furniture painted in (title bars, buttons, subtitles), so the script crops out the clean picture and the app draws its own live controls.

| File | From mock-up | Used in |
|---|---|---|
| `M2_S01_01_IMG_01_arrival.webp` | 13 Morning arrival at the reception | 1.1, first frame: your hand on the glass door |
| `M2_S01_01_IMG_02_welcome.webp` | 14 Welcome at the Reception Entrance (subtitle cropped off) | 1.1, line 1, recording and self-check |
| `M2_S01_01_IMG_03_pointing.webp` | 16 Look Around the Reception Corridor (subtitle cropped off) | 1.1, line 2: points down the corridor |
| `M2_S01_02_IMG_01_entrance.webp` | 19 Flat office map with assembly point | 1.2 Entrance |
| `M2_S01_02_IMG_02_corridor.webp` | 20 Four signs with a corrected office map | 1.2 Corridor; 1.3 background (blurred) |
| `M2_S01_02_IMG_03_pantry.webp` | 21 Pantry vector map and hot water sticker | 1.2 Pantry |
| `M2_S01_02_IMG_04_meeting-room.webp` | 25 Vector Meeting Room Safety Layout | 1.2 Meeting room |
| `M2_S01_SIGN_<sign>.webp` (12) | cut from 19, 20, 21, 25 | the same sign in the notebook, pop-up, 1.3 cards, 1.5 game, 1.6 backup card |

The signs are painted in the scenes; tappable areas sit exactly over them (`ART` in `src/components/scenes.tsx`, in % of each picture). The mock-ups' painted mini-maps and counter are covered by the app's live ones in the same place. Screen colours follow the mock-ups (bar `#0c4559`, action `#1468c4`, finish `#fed835`).

**Not used as pictures:** mock-ups 3, 4, 15, 17, 23 (recording and self-check dialogs), 6 and 18 (top bar and Continue painted in), 11, 12, 22, 26, 28 (notebook in hands with buttons painted in) and 1, 2, 5, 7–10, 24, 27 (duplicates of the above). Their layouts were followed for the app's own screens. A clean version of the notebook-in-hands picture (no buttons) would let 1.3 match mock-up 11 exactly.

**Still missing:** the 1.1 video, and the six “New Signs” in 1.6 Game 3 (still build-drawn).

## Sounds

| Sound | Status |
|---|---|
| Soft chime (right answer, sign saved) | Made in the browser (Web Audio). No file needed; there is no buzzer anywhere. |
| Train horn | Not used in 1.1–1.6 (it belongs to 1.11). |
