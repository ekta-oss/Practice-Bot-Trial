import { expect, test } from "@playwright/test";
import { ALL_SIGNS, COLOUR_OF, freshStart, recordAndKeep, storedRecordings, tapPlace } from "./helpers";

/**
 * Definition of done: a learner starts at 1.1 from the course menu and
 * reaches the end of 1.6, with no seeded state and no skipped interaction.
 */
test("full learner journey 1.1 → 1.6 (with retries along the way)", async ({ page, context }) => {
  await freshStart(page);
  await expect(page.getByTestId("menu-stage-1.2")).toHaveAttribute("data-state", "locked");
  await page.getByTestId("start-button").click();

  // 1.1 — one box left empty, so the second prompt + second recording
  await expect(page.getByTestId("prompt")).toHaveText("Say hello, and introduce yourself.");
  await recordAndKeep(page, 1000, { reRecord: true });
  await page.getByTestId("selfcheck-0").check();
  await page.getByTestId("selfcheck-1").check();
  await page.getByTestId("check-button").click();
  await expect(page.getByTestId("prompt")).toHaveText("Record again: Say hello. Say your name and your job.");
  await recordAndKeep(page, 1000);
  await page.getByTestId("continue-button").click();

  // 1.2 — walk all four places, tap every sign (on a phone the picture scrolls sideways)
  const order = [["no-smoking", "assembly-point"], ["no-entry-staff-only", "wear-gloves", "electrical-hazard", "fire-extinguisher"], ["wash-hands", "hot-water", "wet-floor", "first-aid"], ["fire-exit", "keep-fire-door-shut"]];
  for (const [i, ids] of order.entries()) {
    for (const id of ids) {
      await page.locator(`[data-hotspot="${id}"]`).scrollIntoViewIfNeeded();
      await page.locator(`[data-hotspot="${id}"]`).click();
      await page.getByTestId("big-sign").getByRole("button", { name: "OK" }).click();
    }
    if (i < 3) await page.getByTestId("next-place").click();
  }
  await expect(page.getByTestId("my-signs-counter")).toHaveText("My signs: 12");
  await page.getByTestId("finish-walk").click();
  await expect(page.getByTestId("feedback-right")).toHaveText("You noticed a lot for your first walk.");
  await page.getByTestId("continue-button").click();

  const noSideScroll = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await noSideScroll();
  // 1.3
  await page.getByTestId("answer-not-really").click();
  await page.getByTestId("my-sign-no-smoking").getByRole("button").click();
  await page.getByTestId("continue-button").click();

  await noSideScroll();
  // 1.4 — open the article, come back, answer with one wrong try
  const popupPromise = context.waitForEvent("page");
  await page.getByTestId("open-article").click();
  await (await popupPromise).close();
  await page.bringToFront();
  await page.getByTestId("back-to-course").click();
  for (const [wrong, right] of [[0, 1], [null, 1], [null, 1], [2, 0]] as const) {
    if (wrong !== null) {
      await page.getByTestId(`option-${wrong}`).click();
      await expect(page.getByTestId("feedback-wrong")).toBeVisible();
    }
    await page.getByTestId(`option-${right}`).click();
    await page.getByTestId("continue-button").click();
  }

  // 1.5
  await expect(page.getByRole("heading", { name: "Colour Sort" })).toBeVisible();
  await tapPlace(page, "assembly-point", "red");
  await expect(page.getByTestId("game-feedback-wrong")).toHaveText("Look at the colour again.");
  for (const id of ALL_SIGNS) await tapPlace(page, id, COLOUR_OF[id]);
  await expect(page.getByTestId("done-feedback")).toBeVisible();
  await page.getByTestId("continue-button").click();

  await noSideScroll();
  // 1.6
  for (const g of ["do not", "be careful", "safe way", "do not", "no entry"]) await page.getByTestId(`guess-${g}`).click();
  await expect(page.getByTestId("score-big")).toHaveText("2 / 5");
  await expect(page.getByTestId("segue-line")).toHaveText("Colours can be tricky. Let’s find out what each colour means from safety experts.");
  const popup2 = context.waitForEvent("page");
  await page.getByTestId("open-article").click();
  await (await popup2).close();
  await page.bringToFront();
  await page.getByTestId("back-to-course").click();
  for (const [id, c] of [["m-red", "red"], ["m-yellow", "yellow"], ["m-blue", "blue"], ["m-green", "green"]]) await tapPlace(page, id, c);
  await page.getByTestId("continue-button").click();
  for (const s of ["triangle", "circle", "square"]) await tapPlace(page, s, `meaning-${s}`);
  await page.getByTestId("continue-button").click();
  for (const [id, c] of [["eye", "blue"], ["hardhat", "blue"], ["forklift", "yellow"], ["emergency-exit", "green"], ["no-entry", "red"], ["fire-alarm", "red"]]) await tapPlace(page, id, c);
  await page.getByTestId("continue-button").click();
  await expect(page.getByTestId("end-screen")).toBeVisible();
  await noSideScroll();

  // Practice recordings kept on this device, and playable from the notebook
  const recs = await storedRecordings(page);
  expect(recs.map((r) => r.key).sort()).toEqual(["1.1:intro-1", "1.1:intro-2"]);
  for (const r of recs) expect(r.size).toBeGreaterThan(1000);
});

test("microphone blocked → clear message, mic can be tried again", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("denied", "NotAllowedError"));
  });
  await freshStart(page);
  await page.getByTestId("start-button").click();
  await page.getByRole("button", { name: /start recording/i }).click();
  await expect(page.getByTestId("recorder").getByRole("alert")).toContainText("The microphone is blocked.");
  await expect(page.getByRole("button", { name: /start recording/i })).toBeEnabled();
});

test("notebook: kept recordings can be played back from 'My recordings'", async ({ page }) => {
  await freshStart(page);
  await page.getByTestId("start-button").click();
  await recordAndKeep(page, 1200);
  await page.getByTestId("notebook-button").click();
  await page.getByRole("tab", { name: "My recordings" }).click();
  await expect(page.getByTestId("saved-recording")).toHaveCount(1);
  const duration = await page.getByTestId("saved-recording").locator("audio").evaluate(
    (a: HTMLAudioElement) =>
      new Promise<number>((resolve) => {
        a.muted = true;
        a.onended = () => resolve(1);
        a.onerror = () => resolve(-1);
        void a.play().catch(() => resolve(-2));
      }),
  );
  expect(duration).toBe(1); // the stored blob decodes and plays to the end
});
