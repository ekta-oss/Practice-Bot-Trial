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

## Audio (14 files) — interim computer voices in place

All 14 lines now have **interim** MP3s made with built-in Windows voices (`scripts/make-interim-audio.mjs`; see `public/media/audio/INTERIM_AUDIO.md`), so the course plays sound. They are stand-ins, not the recorded voices the script asks for: replace each by dropping the artist's file in with the same name.

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

## Pictures (4 files, plus interim art in code)

| File | Place | Must contain (Settings Sheet + Stage 1.2 Visuals) |
|---|---|---|
| `M2_S01_02_IMG_01_entrance.webp` | Entrance | Glass front door (middle), reception desk + small bell (right), shoe rack (left), notice board. |
| `M2_S01_02_IMG_02_corridor.webp` | Corridor | Long corridor, white wall, grey floor; store-room door (left wall); grey fuse box (right wall); red extinguisher (right wall, far end). |
| `M2_S01_02_IMG_03_pantry.webp` | Pantry | Sink (left), water dispenser with red hot tap (middle), first-aid box (right wall), wet shiny floor in front of the sink, kettle, counter. |
| `M2_S01_02_IMG_04_meeting-room.webp` | Meeting room | Long table and chairs; door in the back wall. |

**Leave the 12 sign areas clear.** The app draws the signs on top as tappable buttons, at the positions in `src/components/scenes.tsx` (`HOTSPOTS`, in % of the picture). If a final picture moves a door or the fuse box, update those numbers.

**Also interim (build-drawn in code, not separate files):**
- The 12 workplace signs and 6 “New Signs” (ISO 7010 shapes and colours, each with its word): `src/components/SignIcon.tsx`.
- The person in charge still for 1.1: `PersonInCharge` in `src/components/scenes.tsx`. The appearance follows the Character Sheet; the gender was the build's choice (see OPEN_QUESTIONS #2).
- The blurred corridor background for 1.3.

## Sounds

| Sound | Status |
|---|---|
| Soft chime (right answer, sign saved) | Made in the browser (Web Audio). No file is needed. There is no buzzer anywhere. |
| Train horn | Not used in 1.1–1.6 (it belongs to 1.11). |
