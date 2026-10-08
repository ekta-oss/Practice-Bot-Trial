import { expect, test } from "@playwright/test";
import { ALL_SIGNS, COLOUR_OF, dragPlace, startAt, tapPlace } from "./helpers";

test.describe("Stage 1.5 Colour Sort", () => {
  test("drag, wrong ×3 with hint rule, tap-to-place, keyboard; done after 12", async ({ page }) => {
    await startAt(page, 4, { signs: ALL_SIGNS });
    await expect(page.getByTestId("expected-time")).toHaveText("About 5 minutes");
    await expect(page.getByRole("heading", { name: "Colour Sort" })).toBeVisible();
    for (const c of ["Red", "Yellow", "Blue", "Green"]) await expect(page.getByTestId(`box-${c.toLowerCase()}`)).toContainText(c);
    await expect(page.getByTestId("pile").getByRole("listitem")).toHaveCount(12);

    // Real mouse drag into the right box: the card stays
    await dragPlace(page, "no-smoking", "red");
    await expect(page.getByTestId("box-red-items").locator("[data-placed=no-smoking]")).toHaveCount(1);
    await expect(page.getByTestId("hint-bulb")).toHaveAttribute("data-glowing", "false");

    // Wrong drag: slides back
    await dragPlace(page, "first-aid", "red");
    await expect(page.getByTestId("game-feedback-wrong")).toHaveText("Look at the colour again.");
    await expect(page.getByTestId("card-first-aid")).toBeVisible();
    await expect(page.getByTestId("hint-bulb")).toHaveAttribute("data-glowing", "true");
    // second wrong → lightbulb card
    await tapPlace(page, "first-aid", "blue");
    await expect(page.getByTestId("hint-card")).toHaveText("Look at the main colour of the sign, not the words.");
    // third wrong → moves by itself
    await tapPlace(page, "first-aid", "yellow");
    await expect(page.getByTestId("game-feedback-info")).toHaveText("This one is green.");
    await expect(page.getByTestId("box-green-items").locator("[data-placed=first-aid]")).toHaveCount(1);

    // Keyboard: focus card, Enter, focus box, Enter
    await page.getByTestId("card-wet-floor").focus();
    await page.keyboard.press("Enter");
    await page.getByTestId("box-yellow").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("box-yellow-items").locator("[data-placed=wet-floor]")).toHaveCount(1);

    for (const id of ALL_SIGNS) {
      if (["no-smoking", "first-aid", "wet-floor"].includes(id)) continue;
      await tapPlace(page, id, COLOUR_OF[id]);
    }
    await expect(page.getByTestId("done-feedback")).toHaveText("Three of each colour. Now, what does each colour mean?");
    for (const c of ["red", "yellow", "blue", "green"]) await expect(page.getByTestId(`box-${c}-items`).locator("[data-placed]")).toHaveCount(3);
    await page.getByTestId("continue-button").click();
    await expect(page.getByTestId("stage-title")).toContainText("1.6");
  });
});
