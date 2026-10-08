import { expect, test } from "@playwright/test";
import { ALL_SIGNS, startAt } from "./helpers";

test.describe("Stage 1.3 Did you notice the signs?", () => {
  test("'Yes' → feedback → pick a sign card → NAR line 2 → Continue", async ({ page }) => {
    await startAt(page, 2, { signs: ALL_SIGNS });
    await expect(page.getByTestId("expected-time")).toHaveText("About 2 minutes");
    await expect(page.locator("#q1")).toHaveText("Did you notice the signs as you walked round?");
    await expect(page.getByTestId("my-signs-grid").locator("li")).toHaveCount(12);
    await page.getByTestId("answer-yes").click();
    await expect(page.getByTestId("feedback-q1")).toHaveText("Good eyes. Signs are everywhere in a workplace.");
    await expect(page.locator("#q2")).toHaveText("Which sign did you notice first?");
    await page.getByTestId("my-sign-first-aid").getByRole("button").click();
    await expect(page.getByTestId("continue-button")).toBeVisible();
    await page.getByTestId("continue-button").click();
    await expect(page.getByTestId("stage-title")).toContainText("1.4");
  });

  test("'Not really' → normal feedback → 'I don't remember'", async ({ page }) => {
    await startAt(page, 2, { signs: ALL_SIGNS.slice(0, 5), newSigns: ALL_SIGNS.slice(5) });
    await page.getByTestId("answer-not-really").click();
    await expect(page.getByTestId("feedback-q1")).toHaveText("That is normal — many people walk past signs without seeing them.");
    await page.getByTestId("dont-remember").click();
    await expect(page.getByTestId("continue-button")).toBeVisible();
  });
});
