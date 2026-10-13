import { test } from "@playwright/test";
import { ALL_SIGNS, freshStart, startAt, tapPlace } from "./helpers";

// Visual review only (not an acceptance test). Run with: SHOTS_DIR=... npx playwright test e2e/shots.spec.ts
const DIR = process.env.SHOTS_DIR;
test.skip(!DIR, "set SHOTS_DIR to capture screenshots");

test("screens", async ({ page }, info) => {
  const p = (n: string) => `${DIR}/${info.project.name}-${n}.png`;
  await freshStart(page, "?standin=0");
  await page.screenshot({ path: p("0-home") });
  await page.getByTestId("start-button").click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: p("1-1-arrival") });
  await page.getByTestId("prompt").waitFor();
  await page.screenshot({ path: p("1-1-record") });

  await startAt(page, 1);
  await page.screenshot({ path: p("1-2-entrance") });
  await page.getByTestId("next-place").click();
  await page.screenshot({ path: p("1-2-corridor") });

  await startAt(page, 2, { signs: ALL_SIGNS });
  await page.screenshot({ path: p("1-3") });
  await page.getByTestId("answer-safe").click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: p("1-3-reply") });
  await page.getByTestId("notebook-button").click();
  await page.getByRole("tab", { name: /Audio/ }).click();
  await page.screenshot({ path: p("1-3-audio-tab") });

  await startAt(page, 3);
  await page.screenshot({ path: p("1-4-prompt") });

  await startAt(page, 4, { signs: ALL_SIGNS });
  await page.screenshot({ path: p("1-5-start"), fullPage: true });
  await tapPlace(page, "first-aid", "red");
  await page.screenshot({ path: p("1-5-wrong"), fullPage: true });

  await startAt(page, 5, { signs: ALL_SIGNS });
  await page.screenshot({ path: p("1-6-guess") });
  for (const g of ["do not", "be careful", "you must", "safe way", "fire equipment"]) await page.getByTestId(`guess-${g}`).click();
  await page.screenshot({ path: p("1-6-results"), fullPage: true });
  await page.getByTestId("to-article").click();
  await page.screenshot({ path: p("1-6-article") });
  await page.getByTestId("article-did-not-open").click();
  await page.getByTestId("continue-button").click();
  await tapPlace(page, "triangle", "meaning-circle");
  await page.screenshot({ path: p("1-6-game2"), fullPage: true });
  for (const [id, c] of [["circle", "meaning-circle"], ["square", "meaning-square"]]) await tapPlace(page, id, c);
  await tapPlace(page, "triangle", "meaning-triangle");
  await page.getByTestId("continue-button").click();
  await page.screenshot({ path: p("1-6-game3"), fullPage: true });
  await tapPlace(page, "eye", "means-red");
  await page.screenshot({ path: p("1-6-game3-wrong") });
});
