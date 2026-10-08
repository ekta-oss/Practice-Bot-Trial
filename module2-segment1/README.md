# Module 2 · Segment 1 “Your First Morning” — Stages 1.1–1.6

Browser learning platform for *Everyday Workplace Communication, Module 2*. It is built from `Module_2_Full_Production_Script (5).docx` and covers Segment 1, Stages 1.1 to 1.6, in order.

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · dnd-kit · MediaRecorder / Web Audio / IndexedDB · Supabase (optional) · Playwright + axe.

## Run it

```bash
cd module2-segment1
npm install
npm run dev -- -p 3100
```

Open **http://localhost:3100**, press **Start**, and allow the microphone when the browser asks. The microphone works on `localhost` or over HTTPS.

| URL | What |
|---|---|
| `/` | Course menu → stages 1.1–1.6 (later stages unlock as you finish earlier ones) |
| `/assets` | Which produced media files are present (see `docs/ASSET_MANIFEST.md`) |
| `/?standin=0` | Turn off the labelled stand-in voice for missing audio |
| `/?timescale=60` | Test aid: one stage-minute lasts one second (to see the time card) |

“Start over” on the menu clears this device's progress, signs, notes and practice recordings.

## Tests

```bash
npx playwright test
```

The tests use Chromium's fake microphone, so the real recording path runs (getUserMedia → MediaRecorder → IndexedDB → playback). They cover every stage, the full journey on desktop and on a phone, failure and retry paths, pause/restart, time lapse, a blocked microphone, delivered media, and an axe WCAG 2.1 AA scan. The HTML report is written to `e2e-report/`.

## Where things are

| Path | What |
|---|---|
| `src/content/segment1.ts` | Every learner-facing line, word for word from the script. Build wording is marked `BUILD-WORDING`. |
| `src/stages/Stage1_1.tsx … Stage1_6.tsx` | One file per stage. |
| `src/components/StageShell.tsx` | Top bar (title · “About N minutes” · Pause), pause card, time card, bottom bar. |
| `src/components/Recorder.tsx` | Mic states, Practice/Assessment badges, Play / Record again / Keep. |
| `src/components/DragSortGame.tsx` | Drag-and-drop with the hint rule (mouse, touch, keyboard/tap). |
| `src/components/QuizQuestion.tsx` | One question per screen with the hint rule. |
| `src/components/scenes.tsx`, `SignIcon.tsx` | Interim scene art, sign positions, ISO-style signs. |
| `src/lib/progress.tsx`, `recordings.ts`, `sync.ts` | Device storage, plus optional Supabase stage sync. |
| `docs/` | Plan and acceptance checklist, asset manifest, open questions. |

## Optional Supabase

Copy `.env.example` to `.env.local` and fill it in. Enable anonymous sign-ins in Supabase, then run `supabase/migrations/0001_stage_progress.sql`. Only stage completion is sent: the script keeps recordings, ‘My signs’ and answers on the device.
