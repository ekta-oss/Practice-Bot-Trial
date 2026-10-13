/*
 * The learner's answer to the 1.3 reflection ("What do you think these signs are for?"),
 * shown back in 1.4 so they read the article to check it. Kept for this browser session only
 * (the script stores no answers).
 */
const KEY = "m2s1.reflection";

export function saveReflection(answer: string) {
  try {
    window.sessionStorage.setItem(KEY, answer);
  } catch {
    /* not kept: 1.4 simply shows no "Your answer" line */
  }
}

export function readReflection(): string | null {
  try {
    return window.sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
}
