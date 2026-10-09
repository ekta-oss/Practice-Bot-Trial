# Functional structure — Module 2 · Segment 1 · Stages 1.1–1.6

## 1. Layers

| Layer | What it does | Code |
|---|---|---|
| **Course menu** | Lists 1.1–1.6. A stage unlocks when the one before it is finished. Start / Continue / Start over. | `components/CourseApp.tsx` |
| **Stage shell** | The same frame on every stage: title, “About N minutes” clock, Pause (Resume / Start again), the time card after the maximum time, the ‘My signs’ notebook, and the main button bottom-right. | `components/StageShell.tsx`, `Notebook.tsx` |
| **Stages** | The six activities, in the script's order. | `stages/Stage1_1.tsx … Stage1_6.tsx` |
| **Shared engines** | Recorder (mic, playback, speech check) · Line player (voice + subtitles) · Quiz (hint rule) · Drag game (hint rule). | `components/Recorder.tsx`, `lib/runtime.tsx`, `components/QuizQuestion.tsx`, `components/DragSortGame.tsx` |
| **Data** | Progress, ‘My signs’ and ‘My notes’ in local storage · kept recordings in IndexedDB · produced media in `public/media` · optional Supabase (stage completion only). | `lib/progress.tsx`, `lib/recordings.ts`, `lib/media.ts`, `lib/sync.ts` |

## 2. Rules every stage follows

| Rule | Behaviour |
|---|---|
| Time | The clock never counts down. At the maximum time, the card “Take your time — start this activity again whenever you are ready.” appears, and the stage restarts. |
| Pause | Resume / Start again. For video, audio and quizzes, “This will start from the beginning.” |
| Hint rule | 1st try: no hint. Wrong once: the lightbulb glows and the hint opens. Wrong twice: the answer is shown (games: the card moves itself on the 3rd wrong). The learner always moves on. |
| Feedback | Right: green tick + chime. Wrong: amber card + gentle shake. Never red, no minus marks. |
| Recording | Mic → pulsing ring, live words, time “0:04 / 0:20” → Play / Record again / Keep. Practice badge: “Only you can hear this.” |
| Missing media | Shown with a magenta “missing” badge and a labelled stand-in. Never shown as finished. |

## 3. Stage flows

### 1.1 Greet and get your task — max 5 min
1. Video line 1 (PIC: “Good morning! Welcome…”) plays, then pauses.
2. Prompt “Say hello, and introduce yourself.” → **record** (max 20 s). Speech recognition shows the words live.
3. Review: what the system heard → Play / Record again / Keep. Kept → saved on the device; the player and Download stay on screen.
4. **Rating:** hello / name / job → “x of 3 heard”; the three self-check boxes are pre-ticked and the learner can change them → **Check**.
5. All ticked → “Great start — you greeted and said who you are.” (NAR) → video line 2 → **Continue**.
6. A box empty → “Record again: Say hello. Say your name and your job.” → record again (rated) → “Good — now the person in charge knows who you are.” → line 2 → **Continue**.

*Stored:* recordings (on the device). *Not graded.*

### 1.2 Walk round your new workplace — max 9 min
1. NAR intro. Four pictures in a fixed order: Entrance → Corridor → Pantry → Meeting room (map top-left, ← Back / Next place →).
2. Tap a sign → it opens big → green tick + chime → “Saved to My signs.” → it flies into the notebook → the count goes up. Saved as “SIGN — Place”.
3. Last place: “I have looked around”.
   - 12 found → “You noticed a lot for your first walk.”
   - Fewer → “There are more signs here…”. **Yes** returns to the walk. **No** adds the missed signs with a ‘new’ tag.
4. **Continue.**

*Stored:* ‘My signs’ (on the device). A restart keeps saved signs.

### 1.3 Did you notice the signs? — max 3 min
1. NAR line 1. ‘Yes’ / ‘Not really’ → that answer's feedback line.
2. “Which sign did you notice first?” → tap one of your sign cards, or “I don't remember”.
3. NAR line 2 → **Continue.**

*Nothing stored.*

### 1.4 Read online — max 9 min
1. Reading Prompt card → **Open the article** (new tab) → **Back to the course**.
2. Q1–Q4, one per screen, with the hint rule.
3. Article does not open (or the browser blocks the tab) → backup card → only Q1–Q2.
4. **Continue.**

*Answers not stored.*

### 1.5 Colour Sort — max 7 min
1. NAR line. 12 sign cards (from ‘My signs’) → Red / Yellow / Blue / Green boxes, by drag or tap.
2. For each card:
   - right → it stays + chime;
   - wrong 1 → slides back, “Look at the colour again.”;
   - wrong 2 → lightbulb: “Look at the main colour of the sign, not the words.”;
   - wrong 3 → it moves itself: “This one is [colour].”
3. All 12 placed → “Three of each colour. Now, what does each colour mean?” → **Continue.**

### 1.6 What does each colour mean? — max 12 min
1. **Guess** five times (no right or wrong shown).
2. **Score** “x / 5”. 3 or more → “Good guessing!…”; 2 or fewer → “Colours can be tricky…”.
3. **Read** the SMI article (new tab) → Back to the course. If it does not open → backup card (4 colours, 3 signs each).
4. **Games**, with the hint rule:
   - Colour Match: 4 meanings → 4 colours. The **colour key card** then appears, stays, and is saved to ‘My notes’.
   - Shape Match: 3 shapes → their meanings.
   - New Signs: 6 signs → colours.
5. **Continue** → end of Stage 1.6.

*Stored:* the colour key in ‘My notes’. A lapse restarts at Step 1.

## 4. Data map

| Data | Where | Leaves the device? |
|---|---|---|
| Progress (stages done, unlocked) | localStorage | Only if Supabase sync is turned on (stage completion only) |
| ‘My signs’, ‘My notes’ | localStorage | No |
| Practice recordings | IndexedDB | No |
| Speech used for the 1.1 check | Browser speech service (Chrome / Edge) | Yes, to the browser's speech service — see OPEN_QUESTIONS #27 |
| Quiz answers, guesses, game moves | Memory only | No |
