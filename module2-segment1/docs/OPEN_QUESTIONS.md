# Open questions and build decisions — Stages 1.1–1.6

Places where the script is silent or ambiguous. The build made the smallest reasonable choice, and each one is listed here for the content and design team to confirm. Strings marked `// BUILD-WORDING` in `src/content/segment1.ts` are not from the script.

## Needs a decision

1. **Avatar by profile (1.1 video).** “An avatar (based on user profile female/male) walk in”. No learner profile exists in this build, and one video variant is expected. If two variants are needed, the team must decide where the profile comes from; the loader can pick `…_f.mp4` / `…_m.mp4`.
2. **Person in charge's gender.** The Character Sheet leaves this to the designer. The interim still is drawn as a woman (low bun, dark-green collared shirt, lanyard ID, reading glasses pushed up on her head, notebook in her pocket). The final art may differ; keep it the same everywhere.
3. **Platform audio capture.** Notes for the Team #8 says audio capture is “not yet confirmed” on the platform. This build records with the browser's own MediaRecorder (Chrome, Edge, Firefox, Safari). Please confirm this is acceptable.
4. **No microphone.** The script gives no route for a learner who cannot record. The build shows a clear message (“The microphone is blocked. Allow the microphone…”) and lets them try again. There is **no skip**, so a learner without a microphone cannot finish 1.1. Decide whether a “Continue without recording” option should exist.
5. **1.4 feedback wording.** The script gives templates only: “Right — the article says [short reason in course words].” / “Not quite. Look again at [the first paragraph / the second paragraph / the list].” / “Second wrong: the right answer is shown with where to find it.” The build filled them in, after checking the live article on 2026-10-08:
   - Q1: reason “safety signs help stop accidents and guide what people do” · location “the first paragraph”
   - Q2: “the business owner must explain the signs to workers” · “the second paragraph”
   - Q3: “there are 11 common kinds of safety signs” · “the list”
   - Q4: “prohibition signs are one of the kinds” · “the list”
   - Reveal: “The right answer is: [answer]. You can find it in [location].”
6. **1.6 Game 2 (shapes) feedback.** The standard lines are written for colours. The build adapted them:
   - Right: “Right — a triangle means ‘warns of a hazard’.”
   - First wrong: “Look again at the article: what does a triangle mean?”
   - Lightbulb: “Triangle = warns of a hazard” (written in the same style as the colour key).
7. **1.6 first-wrong `[colour]`.** “Look again at the article: what does [colour] mean?” The build uses the colour of the box the learner dropped on, so they check what that colour means.
8. **1.6 colour key: the US note.** The Signs.com source box says “the course notes this [orange WARNING / red DANGER] on the colour key card in 1.6”, but gives no text. No note is shown until the wording is supplied.
9. **Detecting “the article did not open”.** A browser cannot tell whether an outside page loaded in another tab. The backup card appears (a) automatically if the browser blocks the new tab, or (b) when the learner taps the build-worded link “The article did not open”.
10. **Stand-in voice.** While NAR/PIC audio is missing, a browser voice reads the line. It is labelled on screen and can be turned off with `?standin=0`. Decide whether it may stay on for pilot users.

## Build decisions (low risk; confirm)

11. 1.1's video is played as two clips (see ASSET_MANIFEST). The NAR feedback audio files are named `M2_S01_01_NAR_FB01–03.mp3`, because the script says “read aloud by NAR” but gives no file names.
12. 1.1: after the all-ticked feedback, or after the second recording, line 2 plays automatically when the narrator line ends. The script says “Then the video plays line 2”.
13. 1.1: the second recording has no second self-check. The script goes straight to “Good — now the person in charge knows who you are.”
14. Pausing during a recording stops it and goes to review (Play / Record again / Keep).
15. After the time card, both “Start again” and “Pause → Resume” restart the stage. The script says “if it lapses, the stage restarts”, and the resume card shows “This will start from the beginning.” Stage time only counts while not paused. It keeps counting while the learner reads an outside article.
16. Restart rules: 1.2 restarts at the Entrance with saved signs kept; 1.6 restarts at Step 1 (guess 1). The colour key, once saved to My notes, stays saved.
17. 1.2: tapping a sign already saved opens it big again but does not count twice. The big sign has an “OK” button (build wording) so keyboard and screen-reader users can close it; it also closes by itself after the fly-to-notebook animation.
18. 1.2 on phones: the picture is about twice the screen width and scrolls sideways (“look round”). The map, counter and buttons stay fixed.
19. 1.3: “Yes” / “Not really” sit in the bottom bar (“big, at the bottom”). Neither answer is stored.
20. Drag games: each card's three-wrong count is tracked separately. The feedback card floats just above the bottom bar and fades after 6 s; the lightbulb stays lit so the hint can be reopened. On the third wrong in 1.6 (no line in the script), the card simply moves to the right box.
21. Between the three games in 1.6, and after each backup card, there is a “Continue” button.
22. Build wording not in the script: “Question N of M”, “OK”, “Course menu”, “Start over”, “Continue: 1.x”, the notebook tabs “My notes (n)” and “My recordings”, the microphone error messages, and the end-of-scope screen (“End of Stage 1.6”).
23. App-drawn subtitles are split into lines of at most 12 words and timed at 110 wpm, so they stay in the lower part of the picture and cover no more than 20% of it. For real video, deliver `.vtt` captions to meet the “within 1 second” rule exactly.

## Speech check in 1.1 (added after the demo review)

26. **Automatic rating is an addition to the script.** The script makes 1.1 an ungraded self-check. The build now also listens with the browser's speech recognition and shows: “What the system heard”, a rating of the three self-check cues (“2 of 3 heard”, each cue ✓ or ?), and the boxes **pre-ticked** from that rating. The learner can still change any box before “Check”, and the script's feedback lines and second-prompt rule are unchanged. It stays a practice: nothing is scored or stored. All of this wording is build wording.
27. **Privacy.** In Chrome and Edge, the speech used for the check is sent to the browser maker's speech service; the recording itself stays on the device. This sits uneasily with the Practice badge line “Only you can hear this.” The build adds a line under the badge saying so. Decide whether that is acceptable, or whether the check should run on our own server instead (needs an approved speech-to-text service and credentials).
28. **Where the check cannot run.** Firefox has no speech recognition, and Chrome/Edge refuse it to automated browsers. In those cases the app says “The automatic check does not work in this browser…” and the learner ticks the boxes themselves, exactly as the script describes. **The real service has not been verified with a human voice;** please try it once in normal Chrome and Edge, and on a phone.
29. The cue detection (`src/lib/introCheck.ts`) is forgiving and English-only: greetings such as hello / hi / good morning / namaste; names via “my name is”, “I'm X”, “myself X”; jobs via “I work as”, “I am a…”, common job words, intern / trainee. Unit tests cover typical Level 1 answers. Tell us about phrasings your learners use that it misses.

## Backend (Supabase)

24. The script keeps everything on the device: recordings (“stored locally for self-review only”), ‘My signs’ (“Stored locally for this module only”), and answers (“not stored”). So Stages 1.1–1.6 need **no** server storage. The build:
   - keeps progress, ‘My signs’ and ‘My notes’ in `localStorage`, and practice recordings in IndexedDB;
   - can **optionally** sync *stage completion only* to Supabase (anonymous sign-in, RLS). This is off until `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set and `supabase/migrations/0001_stage_progress.sql` is run. **No credentials were provided, so this path has not been run against a live project.**
25. Assessment recordings (orange “Assessment” badge, “Submit”) are built into the recorder. No stage in 1.1–1.6 uses them, and their upload target is not built. That belongs with the module assessment (Segment 12).
