import { test } from "@playwright/test";
import { ALL_SIGNS, freshStart, startAt, tapPlace } from "./helpers";

// Visual review only (not an acceptance test). Run with: SHOTS_DIR=... npx playwright test e2e/shots.spec.ts
const DIR = process.env.SHOTS_DIR;
test.skip(!DIR, "set SHOTS_DIR to capture screenshots");

test("screens", async ({ page }, info) => {
  const p = (n: string) => `${DIR}/${info.project.name}-${n}.png`;
  await freshStart(page, "?standin=0");
  await page.getByTestId("start-button").click();
  await page.getByTestId("prompt").waitFor();
  await page.screenshot({ path: p("1-1-record") });

  await startAt(page, 1);
  await page.getByTestId("next-place").click();
  await page.screenshot({ path: p("1-2-corridor") });

  await startAt(page, 2, { signs: ALL_SIGNS });
  await page.screenshot({ path: p("1-3") });

  await startAt(page, 3);
  await page.screenshot({ path: p("1-4-prompt") });

  await startAt(page, 4, { signs: ALL_SIGNS });
  await tapPlace(page, "first-aid", "red");
  await page.screenshot({ path: p("1-5-wrong"), fullPage: true });

  await startAt(page, 5, { signs: ALL_SIGNS });
  await page.screenshot({ path: p("1-6-guess") });
  for (const g of ["do not", "be careful", "you must", "safe way", "fire equipment"]) await page.getByTestId(`guess-${g}`).click();
  await page.screenshot({ path: p("1-6-score") });
  await page.getByTestId("article-did-not-open").click();
  await page.getByTestId("continue-button").click();
  for (const [id, c] of [["m-red", "red"], ["m-yellow", "yellow"], ["m-blue", "blue"], ["m-green", "green"]]) await tapPlace(page, id, c);
  await page.getByTestId("continue-button").click();
  await tapPlace(page, "triangle", "meaning-circle");
  await page.screenshot({ path: p("1-6-game2"), fullPage: true });
});
