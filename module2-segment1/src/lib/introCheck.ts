/**
 * Stage 1.1 automatic check: did the learner's introduction contain the three
 * things on the self-check — 'I said hello', 'I said my name', 'I said my job'?
 * Works on the browser's transcript, so it is forgiving: it looks for the
 * usual ways a Level 1 learner says each part.
 */

export interface IntroCheck {
  hello: boolean;
  name: boolean;
  job: boolean;
  /** Words that matched, to show the learner why (e.g. "my name is Asha"). */
  evidence: { hello?: string; name?: string; job?: string };
  heard: number; // 0–3
}

const norm = (t: string) =>
  ` ${t
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;

const HELLO = /\b(hello|hi|hey|hiya|good (morning|afternoon|evening|day)|namaste|namaskar|namaskaram|vanakkam|sat sri akal|greetings)\b/;

// "my name is X", "my name's X", "myself X", "this is X", "call me X"
const NAME_PHRASE = /\b(my name is|my name's|name is|myself|this is|call me|i am called|people call me)\s+([a-z][a-z']+)/;
// "I am X" / "I'm X" — only when X is not a common non-name word ("I am new", "I am learning")
const I_AM = /\b(i am|i'm|im)\s+([a-z][a-z']+)/g;
const NOT_A_NAME = new Set(
  "a an the new here from working learning fine good ok okay very so happy glad excited really just going doing joining your from in at on to not also now today trainee intern apprentice student engineer helper assistant technician operator nurse cook driver teacher manager worker staff employee fresher pleased".split(
    " ",
  ),
);

const JOB =
  /\b(i work|i am working|i'm working|im working|work as|working as|my job|my role|my position|i am (a|an) [a-z]+|i'm (a|an) [a-z]+|im (a|an) [a-z]+|as (a|an) [a-z]+|intern|internship|trainee|apprentice|new (joiner|employee|staff|member|recruit)|part time|part-time|first job|joined (as|the|this)|i do [a-z]+ work|helper|assistant|technician|operator|electrician|plumber|cashier|receptionist|accountant|engineer|nurse|cook|chef|driver|teacher|clerk|supervisor|packer|sales|delivery|security guard|cleaner|tailor|mechanic|welder|carpenter|data entry|customer service)\b/;

export function checkIntroduction(transcript: string): IntroCheck {
  const t = norm(transcript);
  const evidence: IntroCheck["evidence"] = {};

  const h = t.match(HELLO);
  if (h) evidence.hello = h[0];

  const n = t.match(NAME_PHRASE);
  if (n && !NOT_A_NAME.has(n[2])) evidence.name = n[0];
  else {
    for (const m of t.matchAll(I_AM)) {
      if (!NOT_A_NAME.has(m[2])) {
        evidence.name = m[0];
        break;
      }
    }
  }

  const j = t.match(JOB);
  if (j) evidence.job = j[0];

  const hello = !!evidence.hello;
  const name = !!evidence.name;
  const job = !!evidence.job;
  return { hello, name, job, evidence, heard: [hello, name, job].filter(Boolean).length };
}
