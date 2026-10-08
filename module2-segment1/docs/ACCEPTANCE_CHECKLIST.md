# Implementation plan and acceptance checklist — Stages 1.1–1.6

## Plan (as carried out)

1. **Read the script.** Covered the Visual & Context Reference (A–F), Notes for the Team, Stages 1.1–1.6, and the source boxes for the two online articles. All learner-facing text is in `src/content/segment1.ts`. Both article links were checked live on 2026-10-08: Signs.com lists 11 kinds, including Prohibition Signs, and says the business owner must explain the signs; SMI gives the colour and shape meanings and the six “New Signs”.
2. **Built the platform pieces.** Stage frame (top bar, expected-time clock, pause card, time card, bottom bar), line player with subtitles and replay, real recorder, notebook (‘My signs’, ‘My notes’, ‘My recordings’), quiz with the hint rule, drag-and-drop with the hint rule, scene frame that swaps in delivered art, and local progress.
3. **Built and tested each stage in order**, 1.1 to 1.6.
4. **Tested the whole journey** on desktop (1280×800) and on a phone (Pixel 7, touch), with failure and retry paths, then fixed what the tests found:
   - the 1.1 mic button was below the fold;
   - on phones, long narrator lines covered the whole picture (the 20% rule);
   - the phone walk picture did not scroll sideways;
   - floating feedback blocked taps on phones;
   - the bottom bar overflowed sideways on phones;
   - one text colour failed the contrast check.
5. Checked the production build (`npm run build`), lint and types.

## How to read this

✅ = passes an automated test with real browser behaviour (named in brackets). 🟡 = built and working, but depends on a missing asset or an open question (see `OPEN_QUESTIONS.md`). ⛔ = blocked.

## Shared rules (Visual & Context Reference A)

| Requirement | Status |
|---|---|
| Top bar: title left, “About N minutes” centre (teal, no countdown), Pause right | ✅ [every stage spec checks `expected-time`] |
| Time card after max time: “Take your time — start this activity again whenever you are ready.” + Start again / Pause; reattempt, never a fail | ✅ [s1-1 time card; s1-2 lapse; s1-6 lapse] |
| Pause card: Resume / Start again; “This will start from the beginning.” for media and quiz | ✅ [s1-1 pause; s1-4 pause; s1-6 pause] |
| Main button bottom-right, large | ✅ (all flows use it) |
| Right = green tick + soft chime; wrong = shake + amber card; no red, no buzzer, no minus marks | ✅ (chime is made in the browser; visual check in screenshots) |
| Hint rule: no hint first try → lightbulb glows + hint after a wrong try → answer shown after a second wrong try; always moves on | ✅ [s1-4 main; s1-5; s1-6 game1] |
| Recording states: mic → pulsing ring + wave + time counting up → Play / Record again / Keep; Practice badge “Only you can hear this.” | ✅ [s1-1, journey: real fake-mic recording, blob > 1 kB, playback] |
| Assessment badge (orange, “This recording will be submitted.”, Submit) looks different | 🟡 built into `Recorder`, not used in 1.1–1.6 |
| Subtitles on by default, lower part of picture, ≤ 20% | ✅ (chunked to ≤ 12 words; checked in phone screenshot) · 🟡 the “within 1 s” rule needs real audio/VTT |
| Audio controls: replay starts from the beginning; wave line while playing | ✅ (replay button after narration) |
| Typography: Noto Sans, body ≥ 18 px | ✅ |
| Keyboard use, screen readers, contrast | ✅ [axe WCAG 2.1 A/AA on menu + every stage; keyboard tests in s1-2, s1-5] |
| Phone portrait works, no sideways page scroll | ✅ [journey on Pixel 7 with a no-sideways-scroll check] |
| Practice and assessment never look alike | ✅ |

## 1.1 Greet and get your task

| Requirement | Status |
|---|---|
| Video line 1 → pause → still picture of PIC + big mic + “Say hello, and introduce yourself.” | ✅ [s1-1] · 🟡 video missing: still picture + audio fallback is labelled |
| Record max 20 s, play back, record again, keep; stored on device only | ✅ [s1-1: re-record, then one IndexedDB entry `1.1:intro-1`] |
| Self-check with 3 boxes; all ticked → “Great start — you greeted and said who you are.” (NAR) → line 2 | ✅ [s1-1 test 1] |
| A box empty → “Record again: Say hello. Say your name and your job.” + mic → record → “Good — now the person in charge knows who you are.” → line 2 | ✅ [s1-1 test 2: two recordings stored] |
| “Continue” after line 2 | ✅ |
| Max 5 min → restart | ✅ [s1-1 time card] |

## 1.2 Walk round your new workplace

| Requirement | Status |
|---|---|
| 4 pictures in order Entrance → Corridor → Pantry → Meeting room; all signs already in place | ✅ [s1-2: exact count of signs per place] |
| 12 signs at the listed spots (3 per colour) | ✅ positions follow the Visuals box · 🟡 interim art |
| Tap → big → green tick → into notebook → count +1; chime + “Saved to My signs.”; saved as “FIRST AID — Pantry” | ✅ [s1-2 test 1] |
| ‘My signs: 0’ counts up, no target shown; mini map top left; notebook + number bottom left | ✅ |
| ← Back / Next place →; last place “I have looked around” | ✅ [s1-2 tests 1–2] |
| All 12 → “You noticed a lot for your first walk.” | ✅ |
| Fewer → “There are more signs here. Would you like to look again?” Yes / No; No → missed signs added with ‘new’ tag | ✅ [s1-2 test 2] |
| Saved signs kept on reload; lapse restarts walk with signs kept | ✅ [s1-2 tests 3–4] |
| Keyboard: Tab to a sign + Enter | ✅ [s1-2 test 3] |

## 1.3 Did you notice the signs?

| Requirement | Status |
|---|---|
| NAR line 1; ‘Yes’ / ‘Not really’ big at the bottom; the two feedback lines | ✅ [s1-3 both tests] |
| “Which sign did you notice first?” — own signs as small cards in rows of 4, or “I don’t remember” | ✅ |
| NAR line 2 after the taps; nothing stored | ✅ |

## 1.4 Read online

| Requirement | Status |
|---|---|
| Reading Prompt card with the bold prediction question; “Open the article” opens Signs.com in a new tab | ✅ [s1-4: popup URL checked] |
| Come back → 4 questions, one per screen, 3 big buttons, script options | ✅ |
| Right / “Not quite. Look again at …” / answer + where after a second wrong | ✅ · 🟡 reason and location wording is build-filled (OPEN_QUESTIONS #5) |
| Page does not open → backup card, Q3–Q4 skipped | ✅ [s1-4 tests 2–3, including a blocked popup] |

## 1.5 Colour Sort

| Requirement | Status |
|---|---|
| Title ‘Colour Sort’; 12 cards from ‘My signs’ in a loose pile; Red / Yellow / Blue / Green boxes | ✅ [s1-5] |
| Right card stays + chime; wrong slides back “Look at the colour again.”; second → lightbulb “Look at the main colour of the sign, not the words.”; third → moves itself “This one is green.” | ✅ [s1-5] |
| Real mouse drag, tap-to-place and keyboard all work | ✅ [s1-5, journey on phone] |
| All 12 placed → “Three of each colour. Now, what does each colour mean?” | ✅ |

## 1.6 What does each colour mean?

| Requirement | Status |
|---|---|
| 5 guesses (swatch + word buttons), no right/wrong shown | ✅ [s1-6 test 1] |
| Score “[x] / 5”, “You got x of 5 right.”; ≥ 3 → NAR_02, ≤ 2 → NAR_03 | ✅ [s1-6 tests 1–2; journey 2/5] |
| “Open the article” → SMI in a new tab → “Back to the course”; backup card with the 4 colours + 3 drawn example signs each | ✅ [s1-6 tests 1–2] |
| Game 1 Colour Match, Game 2 Shape Match, Game 3 New Signs with the hint rule | ✅ · 🟡 shape feedback wording adapted (OPEN_QUESTIONS #6) |
| Colour key card appears after Game 1, stays, saved to ‘My notes’ | ✅ [s1-6 test 1 checks localStorage] |
| Max 12 min → restart from Step 1 | ✅ [s1-6 test 3] |

## Definition of done

| Check | Status |
|---|---|
| A learner starts at 1.1 from the menu and reaches the end of 1.6 with nothing seeded or skipped: records and plays back, walks, saves signs, answers, plays all drag games | ✅ [journey, desktop + phone] |
| Delivered media are used when dropped in | ✅ [assets.spec: real WAV audio, real WebM video, picture] |

## Blocked or not verified

- ⛔ **All 22 produced media files are missing** (13 audio, 2 video, 2 optional captions, 4 pictures). The app runs on labelled stand-ins. See `ASSET_MANIFEST.md`.
- ⛔ **Supabase sync has not been run against a live project:** no credentials were provided. The script does not need it for 1.1–1.6.
- 🟡 Recording was tested with Chromium's fake microphone, not with a human voice on real hardware. Try it once yourself on your target devices (Safari on iOS especially).
- 🟡 Decisions listed in `OPEN_QUESTIONS.md` (#1–#10) need the team's approval.
