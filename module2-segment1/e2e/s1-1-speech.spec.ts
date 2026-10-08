import { expect, test } from "@playwright/test";
import { fakeSpeech, freshStart, recordAndKeep } from "./helpers";

test.describe("Stage 1.1 — speech check, rating and kept recording", () => {
  test("full introduction: live words, what the system heard, 3 of 3, boxes pre-ticked, recording playable in place", async ({ page }) => {
    await fakeSpeech(page, "Good morning my name is Asha and I work as a trainee");
    await freshStart(page);
    await page.getByTestId("start-button").click();
    await expect(page.getByTestId("speech-note")).toContainText("Your recording stays on this device.");
    const rec = page.getByTestId("recorder");
    await rec.getByRole("button", { name: /start recording/i }).click();
    await expect(page.getByTestId("rec-time")).toContainText("/ 0:20");
    await expect(page.getByTestId("live-transcript")).toContainText("my name is Asha", { timeout: 5000 });
    await page.waitForTimeout(600);
    await rec.getByRole("button", { name: "Stop recording" }).click();
    await expect(page.getByTestId("heard-box")).toContainText("Good morning my name is Asha and I work as a trainee");
    await rec.getByTestId("rec-keep").click();

    // Rating + pre-ticked self-check
    await expect(page.getByTestId("rating-score")).toHaveText("3 of 3 heard");
    await expect(page.getByTestId("cue-name")).toContainText("my name is asha");
    for (let i = 0; i < 3; i++) await expect(page.getByTestId(`selfcheck-${i}`)).toBeChecked();

    // The recording is on screen and really plays to the end
    const played = await page.getByTestId("kept-audio").evaluate(
      (a: HTMLAudioElement) => new Promise<string>((res) => { a.muted = true; a.onended = () => res("ended"); a.onerror = () => res("error"); a.play().catch((e) => res(String(e))); }),
    );
    expect(played).toBe("ended");
    await expect(page.getByTestId("kept-recording").getByRole("link", { name: "Download" })).toHaveAttribute("download", /my-recording\./);

    // Script cue follows
    await page.getByTestId("check-button").click();
    await expect(page.getByTestId("feedback-right")).toHaveText("Great start — you greeted and said who you are.");
    await expect(page.getByTestId("continue-button")).toBeVisible();
    await expect(page.getByTestId("kept-recording")).toBeVisible(); // still there
  });

  test("job missing → 2 of 3, job box empty → script's second prompt → second recording rated", async ({ page }) => {
    await fakeSpeech(page, "Hello my name is Ravi");
    await freshStart(page);
    await page.getByTestId("start-button").click();
    await recordAndKeep(page, 900);
    await expect(page.getByTestId("rating-score")).toHaveText("2 of 3 heard");
    await expect(page.getByTestId("cue-job")).toHaveAttribute("data-heard", "false");
    await expect(page.getByTestId("cue-job")).toContainText("The system did not hear your job");
    await expect(page.getByTestId("selfcheck-2")).not.toBeChecked();
    await page.getByTestId("check-button").click();
    await expect(page.getByTestId("prompt")).toHaveText("Record again: Say hello. Say your name and your job.");

    await page.evaluate(() => ((window as unknown as Record<string, unknown>).__fakeSpeech = "Hello my name is Ravi and I am a new intern"));
    await recordAndKeep(page, 900);
    await expect(page.getByTestId("feedback-info")).toHaveText("Good — now the person in charge knows who you are.");
    await expect(page.getByTestId("rating-score")).toHaveText("3 of 3 heard");
    await expect(page.getByTestId("kept-recording")).toContainText("Your second recording");
  });

  test("the learner can untick a box the system got wrong", async ({ page }) => {
    await fakeSpeech(page, "Hi I am Meena I am a cashier");
    await freshStart(page);
    await page.getByTestId("start-button").click();
    await recordAndKeep(page, 900);
    await expect(page.getByTestId("rating-score")).toHaveText("3 of 3 heard");
    await page.getByTestId("selfcheck-2").uncheck();
    await page.getByTestId("check-button").click();
    await expect(page.getByTestId("prompt")).toHaveText("Record again: Say hello. Say your name and your job.");
  });

  test("browser without speech recognition: recording works, learner ticks the boxes", async ({ page }) => {
    await fakeSpeech(page, null);
    await freshStart(page);
    await page.getByTestId("start-button").click();
    await expect(page.getByTestId("speech-note")).toContainText("The automatic check does not work in this browser.");
    await recordAndKeep(page, 900);
    await expect(page.getByTestId("intro-rating")).toHaveCount(0);
    await expect(page.getByTestId("kept-recording")).toBeVisible();
    for (let i = 0; i < 3; i++) await expect(page.getByTestId(`selfcheck-${i}`)).not.toBeChecked();
  });
});
