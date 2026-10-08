/**
 * Module 2, Segment 1 ("Your First Morning"), Stages 1.1–1.6.
 *
 * Every learner-facing string in this file is copied word for word from
 * "Module_2_Full_Production_Script (5).docx". Strings that the script implies
 * but does not write out are marked `// BUILD-WORDING` and listed in
 * docs/OPEN_QUESTIONS.md so the content team can approve or replace them.
 */

export type ColourGroup = "red" | "yellow" | "blue" | "green";
export type PlaceId = "entrance" | "corridor" | "pantry" | "meeting";

export const PLACES: { id: PlaceId; name: string }[] = [
  { id: "entrance", name: "Entrance" },
  { id: "corridor", name: "Corridor" },
  { id: "pantry", name: "Pantry" },
  { id: "meeting", name: "Meeting room" },
];

/** A spoken line. `file` is the audio file name defined by the script. */
export interface Line {
  file: string;
  role: "NAR" | "PIC" | "MOD";
  text: string;
  words: number;
}

/* ------------------------------------------------------------------ */
/* Signs                                                               */
/* ------------------------------------------------------------------ */

export type SignShape =
  | "prohibition" // red circle with a bar
  | "warning" // yellow triangle
  | "mandatory" // blue circle
  | "safe" // green square / rectangle
  | "fire" // red square
  | "floorStand"; // yellow folding stand (wet floor)

export type SignSymbol =
  | "cigarette"
  | "assembly"
  | "person"
  | "gloves"
  | "lightning"
  | "extinguisher"
  | "handwash"
  | "hotwater"
  | "slip"
  | "cross"
  | "runExit"
  | "door"
  | "goggles"
  | "hardhat"
  | "forklift"
  | "bar"
  | "alarm"
  | "phone"
  | "mask"
  | "none";

export interface SignDef {
  id: string;
  /** The word(s) printed on the sign. */
  word: string;
  colour: ColourGroup;
  shape: SignShape;
  symbol: SignSymbol;
  /** Optional arrow on the sign. */
  arrow?: "left" | "right";
}

export interface WalkSign extends SignDef {
  number: number;
  place: PlaceId;
  /** Placement note from the Visuals box (used as the accessible description). */
  placement: string;
}

export const WALK_SIGNS: WalkSign[] = [
  { number: 1, id: "no-smoking", word: "NO SMOKING", colour: "red", shape: "prohibition", symbol: "cigarette", place: "entrance", placement: "On the glass door, right half, at eye level." },
  { number: 2, id: "assembly-point", word: "ASSEMBLY POINT", colour: "green", shape: "safe", symbol: "assembly", arrow: "left", place: "entrance", placement: "On the outside wall, seen through the glass door, left side." },
  { number: 3, id: "no-entry-staff-only", word: "NO ENTRY — STAFF ONLY", colour: "red", shape: "prohibition", symbol: "person", place: "corridor", placement: "On the store-room door, top half." },
  { number: 4, id: "wear-gloves", word: "WEAR GLOVES", colour: "blue", shape: "mandatory", symbol: "gloves", place: "corridor", placement: "On the store-room door, just under the NO ENTRY sign." },
  { number: 5, id: "electrical-hazard", word: "CAUTION — ELECTRICAL HAZARD", colour: "yellow", shape: "warning", symbol: "lightning", place: "corridor", placement: "On the fuse box door." },
  { number: 6, id: "fire-extinguisher", word: "FIRE EXTINGUISHER", colour: "red", shape: "fire", symbol: "extinguisher", place: "corridor", placement: "On the wall just above the extinguisher." },
  { number: 7, id: "wash-hands", word: "WASH YOUR HANDS", colour: "blue", shape: "mandatory", symbol: "handwash", place: "pantry", placement: "On the wall above the sink." },
  { number: 8, id: "hot-water", word: "CAUTION — HOT WATER", colour: "yellow", shape: "warning", symbol: "hotwater", place: "pantry", placement: "A small sticker on the dispenser, next to the red (hot) tap." },
  { number: 9, id: "wet-floor", word: "CAUTION — WET FLOOR", colour: "yellow", shape: "floorStand", symbol: "slip", place: "pantry", placement: "A yellow stand on the floor in front of the sink." },
  { number: 10, id: "first-aid", word: "FIRST AID", colour: "green", shape: "safe", symbol: "cross", place: "pantry", placement: "On the front of the first-aid box." },
  { number: 11, id: "fire-exit", word: "FIRE EXIT", colour: "green", shape: "safe", symbol: "runExit", arrow: "right", place: "meeting", placement: "High on the wall, above the back door." },
  { number: 12, id: "keep-fire-door-shut", word: "KEEP FIRE DOOR SHUT", colour: "blue", shape: "mandatory", symbol: "door", place: "meeting", placement: "On the back door itself, at eye level." },
];

export const placeName = (id: PlaceId) => PLACES.find((p) => p.id === id)!.name;
/** e.g. 'FIRST AID — Pantry' (script 1.2). */
export const savedSignLabel = (s: WalkSign) => `${s.word} — ${placeName(s.place)}`;

export const COLOUR_NAMES: Record<ColourGroup, string> = {
  red: "Red",
  yellow: "Yellow",
  blue: "Blue",
  green: "Green",
};

/* ------------------------------------------------------------------ */
/* Stage meta                                                          */
/* ------------------------------------------------------------------ */

export interface StageMeta {
  id: string;
  number: string;
  title: string;
  /** Central time in minutes – shown on the expected-time clock. */
  aboutMinutes: number;
  /** Maximum time in minutes – after this the gentle "time" card appears. */
  maxMinutes: number;
}

export const STAGES: StageMeta[] = [
  { id: "1.1", number: "1.1", title: "Greet and get your task", aboutMinutes: 3, maxMinutes: 5 },
  { id: "1.2", number: "1.2", title: "Walk round your new workplace", aboutMinutes: 7, maxMinutes: 9 },
  { id: "1.3", number: "1.3", title: "Did you notice the signs?", aboutMinutes: 2, maxMinutes: 3 },
  { id: "1.4", number: "1.4", title: "Read online: why workplaces have safety signs", aboutMinutes: 7, maxMinutes: 9 },
  { id: "1.5", number: "1.5", title: "Sort the signs by colour", aboutMinutes: 5, maxMinutes: 7 },
  { id: "1.6", number: "1.6", title: "What does each colour mean?", aboutMinutes: 10, maxMinutes: 12 },
];

/* ------------------------------------------------------------------ */
/* Shared UI strings (Visual & Context Reference A)                    */
/* ------------------------------------------------------------------ */

export const UI = {
  aboutMinutes: (n: number) => `About ${n} minute${n === 1 ? "" : "s"}`,
  timeCard: "Take your time — start this activity again whenever you are ready.",
  startAgain: "Start again",
  pause: "Pause",
  resume: "Resume",
  resumeNote: "This will start from the beginning.",
  practiceBadge: "Practice",
  practiceLine: "Only you can hear this.",
  assessmentBadge: "Assessment",
  assessmentLine: "This recording will be submitted.",
  play: "Play",
  recordAgain: "Record again",
  keep: "Keep",
  submit: "Submit",
  continue: "Continue",
  check: "Check",
};

/* ------------------------------------------------------------------ */
/* Stage 1.1                                                           */
/* ------------------------------------------------------------------ */

export const S1_1 = {
  pic1: { file: "M2_S01_01_PIC_01.mp3", role: "PIC", text: "Good morning! Welcome. You must be new here.", words: 8 } as Line,
  pic2: { file: "M2_S01_01_PIC_02.mp3", role: "PIC", text: "Nice to meet you. Before you start, take a walk round the work area and get to know the place. Come back to me when you are done.", words: 28 } as Line,
  video1: "M2_S01_01_VID_01.mp4", // BUILD-NAMING: video split at the pause after line 1
  video2: "M2_S01_01_VID_02.mp4",
  prompt: "Say hello, and introduce yourself.",
  checks: ["I said hello", "I said my name", "I said my job"],
  secondPrompt: "Record again: Say hello. Say your name and your job.",
  allTicked: { file: "M2_S01_01_NAR_FB01.mp3", role: "NAR", text: "Great start — you greeted and said who you are.", words: 9 } as Line, // BUILD-NAMING (script: "read aloud by NAR", no file name)
  notAllTicked: { file: "M2_S01_01_NAR_FB02.mp3", role: "NAR", text: "Record again: Say hello. Say your name and your job.", words: 10 } as Line,
  afterSecond: { file: "M2_S01_01_NAR_FB03.mp3", role: "NAR", text: "Good — now the person in charge knows who you are.", words: 10 } as Line,
  maxRecordSeconds: 20,
};

/* ------------------------------------------------------------------ */
/* Stage 1.2                                                           */
/* ------------------------------------------------------------------ */

export const S1_2 = {
  nar1: { file: "M2_S01_02_NAR_01.mp3", role: "NAR", text: "This is your new workplace. Walk round and get to know it. Look out for signs on the walls, the doors and the floor — signs tell you a lot about a new place. When you see one, tap it to look closer. It goes into your ‘My signs’ notebook, so you can look at it again later.", words: 57 } as Line,
  counter: (n: number) => `My signs: ${n}`,
  next: "Next place →",
  back: "← Back",
  finish: "I have looked around",
  saved: "Saved to My signs.",
  allFound: "You noticed a lot for your first walk.",
  lookAgain: "There are more signs here. Would you like to look again?",
  yesLookAgain: "Yes, look again",
  noCarryOn: "No, carry on",
  newTag: "new",
};

/* ------------------------------------------------------------------ */
/* Stage 1.3                                                           */
/* ------------------------------------------------------------------ */

export const S1_3 = {
  nar1: { file: "M2_S01_03_NAR_01.mp3", role: "NAR", text: "Before you go back — did you notice the signs as you walked round?", words: 13 } as Line,
  nar2: { file: "M2_S01_03_NAR_02.mp3", role: "NAR", text: "Workplaces have lots of signs. Why? Let’s read what a company that makes safety signs says.", words: 16 } as Line,
  q1: "Did you notice the signs as you walked round?",
  yes: "Yes",
  notReally: "Not really",
  yesFeedback: "Good eyes. Signs are everywhere in a workplace.",
  notReallyFeedback: "That is normal — many people walk past signs without seeing them.",
  q2: "Which sign did you notice first?",
  dontRemember: "I don’t remember",
};

/* ------------------------------------------------------------------ */
/* Stage 1.4                                                           */
/* ------------------------------------------------------------------ */

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  /** Fills "Right — the article says [short reason in course words]." */
  reason: string; // BUILD-WORDING
  /** Fills "Not quite. Look again at [the first paragraph / the second paragraph / the list]." */
  where: string; // BUILD-WORDING (choice of location per question)
}

export const S1_4 = {
  nar1: { file: "M2_S01_04_NAR_01.mp3", role: "NAR", text: "Tap the button to open the article. Read the first part. Then come back here and answer four questions.", words: 19 } as Line,
  predictionLabel: "Prediction question:",
  predictionQuestion: "Why do workplaces have so many safety signs?",
  predictionInstruction: "Read the first two paragraphs. Then look quickly at the list.",
  openArticle: "Open the article",
  backToCourse: "Back to the course",
  articleTitle: "Common Workplace Safety Signs and What They Really Mean",
  articleSource: "Signs.com Blog, 2026",
  articleUrl: "https://www.signs.com/blog/common-safety-signs-and-what-they-really-mean/",
  articleDidNotOpen: "The article did not open", // BUILD-WORDING (trigger for the backup card)
  backupCard: "Safety signs help stop accidents and show people what to do. Employers must explain them to workers.",
  right: (reason: string) => `Right — the article says ${reason}.`,
  wrong: (where: string) => `Not quite. Look again at ${where}.`,
  // BUILD-WORDING: "Second wrong: the right answer is shown with where to find it."
  reveal: (answer: string, where: string) => `The right answer is: ${answer}. You can find it in ${where}.`,
  questions: [
    { id: "q1", question: "Why do workplaces have safety signs?", options: ["To make the walls look nice", "To help stop accidents and guide what people do", "To show the company name"], correct: 1, reason: "safety signs help stop accidents and guide what people do", where: "the first paragraph" },
    { id: "q2", question: "Who must explain the meaning of the signs to workers?", options: ["The workers’ families", "The business owner", "Visitors"], correct: 1, reason: "the business owner must explain the signs to workers", where: "the second paragraph" },
    { id: "q3", question: "How many common kinds of safety signs does the article list?", options: ["4", "11", "20"], correct: 1, reason: "there are 11 common kinds of safety signs", where: "the list" },
    { id: "q4", question: "Which of these is one of the kinds in the list?", options: ["Prohibition signs", "Birthday signs", "Shop signs"], correct: 0, reason: "prohibition signs are one of the kinds", where: "the list" },
  ] as QuizQuestion[],
};

/* ------------------------------------------------------------------ */
/* Stage 1.5                                                           */
/* ------------------------------------------------------------------ */

export const S1_5 = {
  nar1: { file: "M2_S01_05_NAR_01.mp3", role: "NAR", text: "The article sorted signs into kinds — and many kinds have their own colour. Look at your 12 signs. Put them in groups by colour.", words: 24 } as Line,
  title: "Colour Sort",
  wrong1: "Look at the colour again.",
  hint: "Look at the main colour of the sign, not the words.",
  auto: (colour: string) => `This one is ${colour}.`,
  done: "Three of each colour. Now, what does each colour mean?",
};

/* ------------------------------------------------------------------ */
/* Stage 1.6                                                           */
/* ------------------------------------------------------------------ */

export type Meaning = "do not" | "be careful" | "you must" | "safe way";

export const COLOUR_KEY: Record<ColourGroup, string> = {
  red: "stop, do not, fire safety",
  yellow: "caution, watch out",
  blue: "you must",
  green: "safe way, exits, first aid",
};

export const COLOUR_KEY_LINES: { colour: ColourGroup; line: string }[] = [
  { colour: "red", line: "Red = stop, do not, fire safety" },
  { colour: "yellow", line: "Yellow = caution, watch out" },
  { colour: "blue", line: "Blue = you must" },
  { colour: "green", line: "Green = safe way, exits, first aid" },
];

export interface Guess {
  id: string;
  prompt: string;
  swatch: ColourGroup | "redSquare";
  options: string[];
  correct: string;
}

export const S1_6 = {
  nar1: { file: "M2_S01_06_NAR_01.mp3", role: "NAR", text: "What do you think each colour means? Make your best guess.", words: 11 } as Line,
  nar2: { file: "M2_S01_06_NAR_02.mp3", role: "NAR", text: "Good guessing! Now let’s see what safety experts say about each colour.", words: 12 } as Line,
  nar3: { file: "M2_S01_06_NAR_03.mp3", role: "NAR", text: "Colours can be tricky. Let’s find out what each colour means from safety experts.", words: 14 } as Line,
  nar4: { file: "M2_S01_06_NAR_04.mp3", role: "NAR", text: "Tap the button to open the article. Read about the four colours and the shapes. Then come back for three games.", words: 21 } as Line,
  guesses: [
    { id: "g1", prompt: "Red signs mean…", swatch: "red", options: ["do not", "be careful", "you must", "safe way"], correct: "do not" },
    { id: "g2", prompt: "Yellow signs mean…", swatch: "yellow", options: ["do not", "be careful", "you must", "safe way"], correct: "be careful" },
    { id: "g3", prompt: "Blue signs mean…", swatch: "blue", options: ["do not", "be careful", "you must", "safe way"], correct: "you must" },
    { id: "g4", prompt: "Green signs mean…", swatch: "green", options: ["do not", "be careful", "you must", "safe way"], correct: "safe way" },
    { id: "g5", prompt: "The red square sign shows…", swatch: "redSquare", options: ["fire equipment", "no entry", "be careful"], correct: "fire equipment" },
  ] as Guess[],
  score: (x: number) => `You got ${x} of 5 right.`,
  openArticle: "Open the article",
  backToCourse: "Back to the course",
  readPrompt: "Read about the four colours and the shapes.",
  articleTitle: "Colours of Safety Signs and Their Meanings",
  articleSource: "SMI Group",
  articleUrl: "https://www.smigroupuk.com/insights/colours-of-safety-signs-and-their-meanings",
  articleDidNotOpen: "The article did not open", // BUILD-WORDING
  colourKeyTitle: "Colour key", // BUILD-WORDING (card label)
  right: (subject: string, meaning: string) => `Right — ${subject} means ${meaning}.`,
  wrong: (subject: string) => `Look again at the article: what does ${subject} mean?`,
  game1: {
    title: "Colour Match",
    cards: [
      { id: "m-red", text: "stop, danger, do not, fire safety", target: "red" },
      { id: "m-yellow", text: "caution — watch out", target: "yellow" },
      { id: "m-blue", text: "you must do this", target: "blue" },
      { id: "m-green", text: "safe way, exits, first aid", target: "green" },
    ],
  },
  game2: {
    title: "Shape Match",
    shapes: [
      { id: "triangle", name: "triangle", meaning: "warns of a hazard" },
      { id: "circle", name: "circle", meaning: "something you must do, or must not do" },
      { id: "square", name: "square or rectangle", meaning: "safe way or fire safety" },
    ],
  },
  game3: {
    title: "New Signs",
    signs: [
      { id: "eye", word: "WEAR EYE PROTECTION", colour: "blue", shape: "mandatory", symbol: "goggles" },
      { id: "hardhat", word: "HARD HATS MUST BE WORN", colour: "blue", shape: "mandatory", symbol: "hardhat" },
      { id: "forklift", word: "WARNING: FORKLIFT", colour: "yellow", shape: "warning", symbol: "forklift" },
      { id: "emergency-exit", word: "EMERGENCY EXIT", colour: "green", shape: "safe", symbol: "runExit", arrow: "right" },
      { id: "no-entry", word: "NO ENTRY", colour: "red", shape: "prohibition", symbol: "bar" },
      { id: "fire-alarm", word: "FIRE ALARM", colour: "red", shape: "fire", symbol: "alarm" },
    ] as SignDef[],
  },
};

/** End-of-scope (built only to Stage 1.6). */
export const END_OF_SCOPE = {
  title: "End of Stage 1.6", // BUILD-WORDING
  body: "You have finished Stages 1.1 to 1.6 of Segment 1. Stages 1.7 onwards are not part of this build.", // BUILD-WORDING
};

export const MODULE_TITLE = "Everyday Workplace Communication — Module 2: Basic Safety Words, Simple Requests & Reporting a Problem";
export const SEGMENT_TITLE = "Segment 1: Your First Morning";
