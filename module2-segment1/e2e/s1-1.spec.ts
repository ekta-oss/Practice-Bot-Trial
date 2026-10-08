import { expect, test } from "@playwright/test";
import { freshStart, recordAndKeep, storedRecordings } from "./helpers";

test.describe("Stage 1.1 Greet and get your task", () => {
  test("all boxes ticked: record, play back, re-record, keep, line 2, continue", async ({ page }) => {
    await freshStart(page);
    await page.getByTestId("start-button").click();
    await expect(page.getByTestId("stage-title")).toContainText("1.1 Greet and get your task");
    await expect(page.getByTestId("expected-time")).toHaveText("About 3 minutes");
    // Line 1 subtitle, then the video pauses: mic + prompt
    await expect(page.getByTestId("subtitle")).toContainText("Good morning! Welcome. You must be new here.");
    await expect(page.getByTestId("missing-asset")).toContainText("M2_S01_01_VID_01.mp4");
    await expect(page.getByTestId("prompt")).toHaveText("Say hello, and introduce yourself.");
    await recordAndKeep(page, 1500, { reRecord: true });
    // Self-check
    for (const t of ["I said hello", "I said my name", "I said my job"]) await expect(page.getByText(t)).toBeVisible();
    for (let i = 0; i < 3; i++) await page.getByTestId(`selfcheck-${i}`).check();
    await page.getByTestId("check-button").click();
    await expect(page.getByTestId("feedback-right")).toHaveText("Great start — you greeted and said who you are.");
    await expect(page.getByTestId("missing-asset")).toContainText("M2_S01_01_VID_02.mp4"); // line 2 clip played
    await expect(page.getByTestId("continue-button")).toBeVisible();
    const recs = await storedRecordings(page);
    expect(recs.map((r) => r.key)).toEqual(["1.1:intro-1"]);
    expect(recs[0].size).toBeGreaterThan(1000);
    await page.getByTestId("continue-button").click();
    await expect(page.getByTestId("stage-title")).toContainText("1.2");
  });

  test("a box not ticked: second prompt, record once more, then line 2", async ({ page }) => {
    await freshStart(page);
    await page.getByTestId("start-button").click();
    await recordAndKeep(page);
    await page.getByTestId("selfcheck-0").check();
    await page.getByTestId("check-button").click();
    await expect(page.getByTestId("prompt")).toHaveText("Record again: Say hello. Say your name and your job.");
    await recordAndKeep(page);
    await expect(page.getByTestId("feedback-info")).toHaveText("Good — now the person in charge knows who you are.");
    await expect(page.getByTestId("continue-button")).toBeVisible();
    const keys = (await storedRecordings(page)).map((r) => r.key).sort();
    expect(keys).toEqual(["1.1:intro-1", "1.1:intro-2"]);
  });

  test("pause shows Resume/Start again with the media note; start again restarts", async ({ page }) => {
    await freshStart(page, "?standin=0");
    await page.getByTestId("start-button").click();
    await page.getByTestId("pause-button").click();
    await expect(page.getByTestId("pause-card")).toBeVisible();
    await expect(page.getByTestId("resume-note")).toHaveText("This will start from the beginning.");
    await page.getByTestId("pause-resume").click();
    await expect(page.getByTestId("subtitle")).toContainText("Good morning!");
    await page.getByTestId("pause-button").click();
    await page.getByTestId("pause-start-again").click();
    await expect(page.getByTestId("subtitle")).toContainText("Good morning!");
  });

  test("time card after max time (5 min, scaled) offers Start again / Pause", async ({ page }) => {
    await freshStart(page, "?fastmedia=1&timescale=60");
    await page.getByTestId("start-button").click();
    await expect(page.getByTestId("time-card")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("time-card")).toContainText("Take your time — start this activity again whenever you are ready.");
    await page.getByTestId("time-start-again").click();
    await expect(page.getByTestId("time-card")).toBeHidden();
    await expect(page.getByTestId("stage-title")).toContainText("1.1");
  });
});
