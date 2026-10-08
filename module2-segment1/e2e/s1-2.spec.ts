import { expect, test } from "@playwright/test";
import { ALL_SIGNS, startAt, tapSign } from "./helpers";

const BY_PLACE: [string, string[]][] = [
  ["Entrance", ["no-smoking", "assembly-point"]],
  ["Corridor", ["no-entry-staff-only", "wear-gloves", "electrical-hazard", "fire-extinguisher"]],
  ["Pantry", ["wash-hands", "hot-water", "wet-floor", "first-aid"]],
  ["Meeting room", ["fire-exit", "keep-fire-door-shut"]],
];

test.describe("Stage 1.2 Walk round your new workplace", () => {
  test("4 places in order, 12 signs saved with place names, all-found feedback", async ({ page }) => {
    await startAt(page, 1);
    await expect(page.getByTestId("expected-time")).toHaveText("About 7 minutes");
    await expect(page.getByTestId("my-signs-counter")).toHaveText("My signs: 0");
    await expect(page.getByTestId("subtitle")).toContainText("This is your new workplace.");
    let n = 0;
    for (const [i, [place, ids]] of BY_PLACE.entries()) {
      await expect(page.getByTestId("mini-map").locator("[aria-current=location]")).toHaveText(place);
      // all signs of the place are there when it opens; no others
      await expect(page.locator("[data-hotspot]")).toHaveCount(ids.length);
      for (const id of ids) {
        await page.locator(`[data-hotspot="${id}"]`).click();
        await expect(page.getByTestId("saved-toast")).toHaveText("Saved to My signs.");
        await expect(page.getByTestId("saved-tick")).toBeVisible();
        await expect(page.getByTestId("big-sign")).toBeHidden({ timeout: 5000 });
        n++;
        await expect(page.getByTestId("my-signs-counter")).toHaveText(`My signs: ${n}`);
        await expect(page.getByTestId("notebook-count")).toHaveText(String(n));
      }
      // tapping a saved sign again does not count twice
      await page.locator(`[data-hotspot="${ids[0]}"]`).click();
      await page.getByTestId("big-sign").getByRole("button", { name: "OK" }).click();
      await expect(page.getByTestId("my-signs-counter")).toHaveText(`My signs: ${n}`);
      if (i < 3) await page.getByTestId("next-place").click();
    }
    await expect(page.getByTestId("next-place")).toHaveCount(0);
    await expect(page.getByTestId("finish-walk")).toHaveText("I have looked around");
    await page.getByTestId("finish-walk").click();
    await expect(page.getByTestId("feedback-right")).toHaveText("You noticed a lot for your first walk.");
    // notebook shows the place names
    await page.getByTestId("notebook-button").click();
    await expect(page.getByTestId("my-sign-first-aid")).toContainText("FIRST AID — Pantry");
    await expect(page.getByTestId("my-signs-grid").locator("li")).toHaveCount(12);
    await page.getByRole("button", { name: "Close notebook" }).click();
    await page.getByTestId("continue-button").click();
    await expect(page.getByTestId("stage-title")).toContainText("1.3");
  });

  test("Back works; fewer than 12 → look-again card; 'No, carry on' adds missed signs with 'new' tag", async ({ page }) => {
    await startAt(page, 1);
    await expect(page.getByTestId("back-place")).toHaveCount(0);
    await tapSign(page, "no-smoking");
    await page.getByTestId("next-place").click();
    await page.getByTestId("back-place").click();
    await expect(page.getByTestId("mini-map").locator("[aria-current=location]")).toHaveText("Entrance");
    for (let i = 0; i < 3; i++) await page.getByTestId("next-place").click();
    await page.getByTestId("finish-walk").click();
    await expect(page.getByTestId("look-again-card")).toContainText("There are more signs here. Would you like to look again?");
    await page.getByTestId("look-again-yes").click();
    await tapSign(page, "fire-exit");
    await page.getByTestId("finish-walk").click();
    await page.getByTestId("look-again-no").click();
    await expect(page.getByTestId("my-signs-counter")).toHaveText("My signs: 12");
    await page.getByTestId("notebook-button").click();
    await expect(page.getByTestId("my-sign-no-smoking")).toHaveAttribute("data-new", "false");
    await expect(page.getByTestId("my-sign-wet-floor")).toHaveAttribute("data-new", "true");
    await expect(page.getByTestId("my-sign-wet-floor")).toContainText("new");
  });

  test("keyboard: Tab to a sign and press Enter saves it; signs persist after reload", async ({ page }) => {
    await startAt(page, 1);
    await page.locator('[data-hotspot="assembly-point"]').focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("saved-toast")).toBeVisible();
    await page.keyboard.press("Enter"); // OK button has focus
    await expect(page.getByTestId("my-signs-counter")).toHaveText("My signs: 1");
    await page.reload();
    await page.getByTestId("menu-stage-1.2").click();
    await expect(page.getByTestId("my-signs-counter")).toHaveText("My signs: 1");
  });

  test("time lapse restarts the walk with saved signs kept", async ({ page }) => {
    await startAt(page, 1, { query: "?fastmedia=1&timescale=60" });
    await tapSign(page, "no-smoking");
    await page.getByTestId("next-place").click();
    await expect(page.getByTestId("time-card")).toBeVisible({ timeout: 15_000 });
    await page.getByTestId("time-start-again").click();
    await expect(page.getByTestId("mini-map").locator("[aria-current=location]")).toHaveText("Entrance");
    await expect(page.getByTestId("my-signs-counter")).toHaveText("My signs: 1");
  });
});
void ALL_SIGNS;
