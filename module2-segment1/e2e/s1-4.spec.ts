import { expect, test } from "@playwright/test";
import { startAt } from "./helpers";

test.describe("Stage 1.4 Read online", () => {
  test("article opens in a new tab; 4 questions with right / hint / reveal", async ({ page, context }) => {
    await startAt(page, 3);
    await expect(page.getByTestId("expected-time")).toHaveText("About 7 minutes");
    await expect(page.getByTestId("reading-prompt")).toContainText("Prediction question:");
    await expect(page.getByTestId("reading-prompt")).toContainText("Why do workplaces have so many safety signs?");
    await expect(page.getByTestId("reading-prompt")).toContainText("Read the first two paragraphs. Then look quickly at the list.");
    const popupPromise = context.waitForEvent("page");
    await page.getByTestId("open-article").click();
    const popup = await popupPromise;
    await popup.waitForURL(/signs\.com/, { timeout: 30_000 }).catch(() => {});
    expect(popup.url()).toContain("signs.com/blog/common-safety-signs-and-what-they-really-mean");
    await popup.close();
    await page.bringToFront();
    await page.getByTestId("back-to-course").click();

    // Q1 right first time
    await expect(page.getByRole("heading", { name: "Why do workplaces have safety signs?" })).toBeVisible();
    await expect(page.getByTestId("hint-bulb")).toHaveAttribute("data-glowing", "false");
    await page.getByTestId("option-1").click();
    await expect(page.getByTestId("feedback-right")).toHaveText("Right — the article says safety signs help stop accidents and guide what people do.");
    await page.getByTestId("continue-button").click();

    // Q2 wrong once → hint, then right
    await page.getByTestId("option-0").click();
    await expect(page.getByTestId("feedback-wrong")).toHaveText("Not quite. Look again at the second paragraph.");
    await expect(page.getByTestId("hint-bulb")).toHaveAttribute("data-glowing", "true");
    await page.getByTestId("option-1").click();
    await expect(page.getByTestId("feedback-right")).toBeVisible();
    await page.getByTestId("continue-button").click();

    // Q3 wrong twice → answer shown, learner moves on
    await page.getByTestId("option-0").click();
    await page.getByTestId("option-2").click();
    await expect(page.getByTestId("feedback-reveal")).toHaveText("The right answer is: 11. You can find it in the list.");
    await expect(page.getByTestId("option-1")).toHaveAttribute("data-correct", "true");
    await page.getByTestId("continue-button").click();

    // Q4
    await expect(page.getByText("Question 4 of 4")).toBeVisible();
    await page.getByTestId("option-0").click();
    await page.getByTestId("continue-button").click();
    await expect(page.getByTestId("stage-title")).toContainText("1.5");
  });

  test("article does not open → backup card, Q3–Q4 skipped", async ({ page }) => {
    await startAt(page, 3);
    await page.getByTestId("article-did-not-open").click();
    await expect(page.getByTestId("backup-card")).toHaveText("Safety signs help stop accidents and show people what to do. Employers must explain them to workers.");
    await page.getByTestId("continue-button").click();
    await expect(page.getByText("Question 1 of 2")).toBeVisible();
    await page.getByTestId("option-1").click();
    await page.getByTestId("continue-button").click();
    await page.getByTestId("option-1").click();
    await page.getByTestId("continue-button").click();
    await expect(page.getByTestId("stage-title")).toContainText("1.5");
  });

  test("popup blocked by the browser → backup card automatically", async ({ page }) => {
    await page.addInitScript(() => {
      window.open = () => null;
    });
    await startAt(page, 3);
    await page.getByTestId("open-article").click();
    await expect(page.getByTestId("backup-card")).toBeVisible();
  });

  test("pause during a question: note shown, resume restarts the question", async ({ page }) => {
    await startAt(page, 3);
    await page.getByTestId("article-did-not-open").click();
    await page.getByTestId("continue-button").click();
    await page.getByTestId("option-0").click();
    await expect(page.getByTestId("feedback-wrong")).toBeVisible();
    await page.getByTestId("pause-button").click();
    await expect(page.getByTestId("resume-note")).toHaveText("This will start from the beginning.");
    await page.getByTestId("pause-resume").click();
    await expect(page.getByTestId("feedback-wrong")).toHaveCount(0);
    await expect(page.getByTestId("option-0")).toBeEnabled();
  });
});
