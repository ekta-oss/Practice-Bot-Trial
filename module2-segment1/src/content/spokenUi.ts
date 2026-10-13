/**
 * Every on-screen instruction and feedback line that is read aloud (in
 * addition to the script's own NAR/PIC lines). The voice generator makes one
 * MP3 per entry (file name from lib/uiAudio.ts). Quiz questions and answer
 * options in 1.4 are not read aloud: they check reading.
 */
import { COLOUR_NAMES, S1_1, S1_2, S1_3, S1_4, S1_5, S1_6 } from "./segment1";
import { COLOURS, SHAPES, colourLine, newSignRight, newSignWrong, shapeKey, shapeRight, shapeWrong } from "./feedbackText";

export const SPOKEN_UI: string[] = Array.from(
  new Set([
    // 1.1
    S1_1.prompt,
    S1_1.checkNote,
    // 1.2
    S1_2.saved,
    S1_2.lookAgain,
    S1_2.allFound,
    // 1.3
    S1_3.q1,
    ...S1_3.answers.map((a) => a.feedback),
    // 1.4
    S1_4.predictionQuestion,
    S1_4.predictionInstruction,
    S1_4.backupCard,
    ...S1_4.questions.flatMap((q) => [S1_4.right(q.reason), S1_4.wrong(q.where), S1_4.reveal(q.options[q.correct], q.where)]),
    // 1.5
    S1_5.howTo,
    S1_5.wrong1,
    S1_5.hint,
    ...COLOURS.map((c) => S1_5.auto(COLOUR_NAMES[c].toLowerCase())),
    S1_5.done,
    // 1.6
    ...S1_6.guesses.map((g) => g.prompt),
    ...[0, 1, 2, 3, 4, 5].map((n) => S1_6.score(n)),
    ...COLOURS.map((c) => colourLine(c)),
    S1_6.game2.howTo,
    ...SHAPES.flatMap((s) => [shapeRight(s), shapeWrong(s), shapeKey(s)]),
    S1_6.game3.howTo,
    ...S1_6.game3.signs.flatMap((s) => [newSignRight(s), newSignWrong(s)]),
  ]),
);
