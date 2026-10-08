import { describe, expect, it } from "vitest";
import { checkIntroduction } from "./introCheck";

describe("checkIntroduction (Stage 1.1 self-check cues)", () => {
  const cases: [string, [boolean, boolean, boolean]][] = [
    ["Good morning. My name is Asha. I work as a trainee here.", [true, true, true]],
    ["hello I am Ravi I am a new intern", [true, true, true]],
    ["Hi, I'm Priya, I'm a part-time cashier", [true, true, true]],
    ["namaste myself Arjun and I am working as a helper", [true, true, true]],
    ["Hello, my name is Ravi.", [true, true, false]],
    ["good morning I am new here", [true, false, false]],
    ["I am learning new skills", [false, false, false]],
    ["My name is Sunita and this is my first job", [false, true, true]],
    ["", [false, false, false]],
  ];
  it.each(cases)("%s", (text, [hello, name, job]) => {
    const r = checkIntroduction(text);
    expect([r.hello, r.name, r.job]).toEqual([hello, name, job]);
    expect(r.heard).toBe([hello, name, job].filter(Boolean).length);
  });

  it("shows the words that matched", () => {
    const r = checkIntroduction("Good morning, my name is Asha, I work as a trainee");
    expect(r.evidence.name).toBe("my name is asha");
    expect(r.evidence.hello).toBe("good morning");
  });
});
