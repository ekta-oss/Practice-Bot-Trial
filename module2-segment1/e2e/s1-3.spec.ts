import { expect, test } from "@playwright/test";
import { ALL_SIGNS, startAt } from "./helpers";

test.describe("Stage 1.3 What are the signs for?", () => {
  test("one screen: saved signs strip, one question, a reply, the narrator line, Continue; answer shown in 1.4", async ({ page }) => {
    await startAt(page, 2, { signs: ALL_SIGNS });
    await expect(page.getByTestId("expected-time")).toHaveText("About 2 minutes");
    await expect(page.getByTestId("signs-strip")).toContainText("Your signs: 12");
    await expect(page.getByTestId("signs-strip").locator("li")).toHaveCount(12);
    await expect(page.locator("#q1")).toHaveText("What do you think these signs are for?");
    // No sign grid to pick from, and no "right answer" for tapping a sign
    await expect(page.getByTestId("my-signs-grid")).toHaveCount(0);
    await expect(page.getByTestId("signs-strip").getByRole("button")).toHaveCount(0);
    await page.getByTestId("answer-safe").click();
    await expect(page.getByTestId("feedback-q1")).toHaveText("Yes — that is a big part of it.");
    await expect(page.getByTestId("answer-tell")).toHaveCount(0);
    await page.getByTestId("continue-button").click();
    await expect(page.getByTestId("segment-complete")).toBeVisible();
    await page.getByTestId("next-stage").click();
    await expect(page.getByTestId("stage-title")).toContainText("1.4");
    await expect(page.getByTestId("your-guess")).toHaveText("Your answer in 1.3: “To keep people safe”. Read and check.");
  });

  test("each answer gets its own honest reply", async ({ page }) => {
    for (const [id, reply] of [
      ["tell", "Yes — many signs tell you what to do, or what not to do."],
      ["unsure", "That is fine — you will find out now."],
    ]) {
      await startAt(page, 2, { signs: ALL_SIGNS });
      await page.getByTestId(`answer-${id}`).click();
      await expect(page.getByTestId("feedback-q1")).toHaveText(reply);
    }
  });
});

test("every line heard is kept in the notebook's Audio tab, and survives a reload", async ({ page }) => {
  await startAt(page, 2, { signs: ALL_SIGNS });
  await page.getByTestId("answer-safe").click();
  await expect(page.getByTestId("continue-button")).toBeVisible();
  await page.reload();
  await page.getByTestId("start-button").click(); // back into the course after closing it
  await page.getByTestId("notebook-button").click();
  await page.getByRole("tab", { name: /Audio/ }).click();
  const lib = page.getByTestId("audio-library");
  await expect(lib).toContainText("1.3 What are the signs for?");
  for (const t of [
    "Before you go back — look at the signs you saved on your walk.",
    "What do you think these signs are for?",
    "Yes — that is a big part of it.",
    "Workplaces have lots of signs. Why?",
  ])
    await expect(lib).toContainText(t);
  await expect(lib.getByTestId("heard-play").first()).toBeVisible();
});
