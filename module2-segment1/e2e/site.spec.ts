import { expect, test } from "@playwright/test";
import { ALL_SIGNS, COLOUR_OF, fakeSpeech, recordAndKeep, tapPlace } from "./helpers";

/**
 * The static website for GitHub + Vercel (../module2-segment1-site, built by
 * scripts/build-site.mjs), served like a static host by scripts/serve-site.mjs.
 * Real recording runs through Chromium's fake microphone; the speech service is
 * the stand-in recognizer (automated browsers cannot reach the real one).
 * Run:  node scripts/serve-site.mjs 3300   then   npx playwright test e2e/site.spec.ts
 */
const SITE = "http://localhost:3300/";

test("static site: full journey with real recording, speech check, playback and download", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await fakeSpeech(page, "Good morning my name is Asha and I work as a trainee");
  await page.goto(SITE + "?fastmedia=1");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page).toHaveTitle("Your First Morning");
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain("Noto");

  // 1.1 — record with the microphone, see what the system heard, rating, kept recording
  await page.getByTestId("start-button").click();
  await expect(page.getByTestId("prompt")).toHaveText("Say hello, and introduce yourself.");
  await recordAndKeep(page, 1500);
  await expect(page.getByTestId("rating-score")).toHaveText("3 of 3 heard");
  for (let i = 0; i < 3; i++) await expect(page.getByTestId(`selfcheck-${i}`)).toBeChecked();
  const played = await page.getByTestId("kept-audio").evaluate(
    (a: HTMLAudioElement) => new Promise<string>((res) => { a.muted = true; a.onended = () => res("ended"); a.onerror = () => res("error"); a.play().catch((e) => res(String(e))); }),
  );
  expect(played).toBe("ended");
  const download = page.waitForEvent("download");
  await page.getByTestId("kept-download").click();
  expect((await download).suggestedFilename()).toMatch(/^my-recording\.(webm|mp4)$/);
  await page.getByTestId("check-button").click();
  await expect(page.getByTestId("feedback-right")).toHaveText("Great start — you greeted and said who you are.");
  await page.getByTestId("continue-button").click();

  // 1.2
  const order = [["no-smoking", "assembly-point"], ["no-entry-staff-only", "wear-gloves", "electrical-hazard", "fire-extinguisher"], ["wash-hands", "hot-water", "wet-floor", "first-aid"], ["fire-exit", "keep-fire-door-shut"]];
  for (const [i, ids] of order.entries()) {
    for (const id of ids) {
      await page.locator(`[data-hotspot="${id}"]`).click();
      await page.getByTestId("big-sign").getByRole("button", { name: "OK" }).click();
    }
    if (i < 3) await page.getByTestId("next-place").click();
  }
  await page.getByTestId("finish-walk").click();
  await expect(page.getByTestId("feedback-right")).toHaveText("You noticed a lot for your first walk.");
  await page.getByTestId("continue-button").click();

  // 1.3
  await page.getByTestId("answer-yes").click();
  await page.getByTestId("my-sign-first-aid").getByRole("button").click();
  await page.getByTestId("continue-button").click();

  // 1.4
  const popup = context.waitForEvent("page");
  await page.getByTestId("open-article").click();
  await (await popup).close();
  await page.bringToFront();
  await page.getByTestId("back-to-course").click();
  for (const right of [1, 1, 1, 0]) {
    await page.getByTestId(`option-${right}`).click();
    await page.getByTestId("continue-button").click();
  }

  // 1.5
  for (const id of ALL_SIGNS) await tapPlace(page, id, COLOUR_OF[id]);
  await expect(page.getByTestId("done-feedback")).toBeVisible();
  await page.getByTestId("continue-button").click();

  // 1.6
  for (const g of ["do not", "be careful", "you must", "safe way", "fire equipment"]) await page.getByTestId(`guess-${g}`).click();
  await expect(page.getByTestId("score-big")).toHaveText("5 / 5");
  await page.getByTestId("article-did-not-open").click();
  await page.getByTestId("continue-button").click();
  for (const [id, c] of [["m-red", "red"], ["m-yellow", "yellow"], ["m-blue", "blue"], ["m-green", "green"]]) await tapPlace(page, id, c);
  await page.getByTestId("continue-button").click();
  for (const s of ["triangle", "circle", "square"]) await tapPlace(page, s, `meaning-${s}`);
  await page.getByTestId("continue-button").click();
  for (const [id, c] of [["eye", "blue"], ["hardhat", "blue"], ["forklift", "yellow"], ["emergency-exit", "green"], ["no-entry", "red"], ["fire-alarm", "red"]]) await tapPlace(page, id, c);
  await page.getByTestId("continue-button").click();
  await expect(page.getByTestId("end-screen")).toBeVisible();

  await page.reload();
  await expect(page.getByTestId("menu-stage-1.6")).toHaveAttribute("data-state", "done");
  expect(errors).toEqual([]);
});

test("static site: asset status page and 404 page are served", async ({ page }) => {
  await page.goto(SITE + "assets");
  await expect(page.getByTestId("asset-summary")).toContainText("0 of 22 files present");
  const res = await page.goto(SITE + "no-such-page");
  expect(res?.status()).toBe(404);
});
