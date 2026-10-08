import { expect, test, type Page } from "@playwright/test";
import { ALL_SIGNS, dragPlace, startAt, tapPlace } from "./helpers";

const RIGHT = ["do not", "be careful", "you must", "safe way", "fire equipment"];

async function game1(page: Page) {
  await expect(page.getByRole("heading", { name: "Colour Match" })).toBeVisible();
  await expect(page.getByTestId("colour-key-card")).toHaveCount(0);
  await dragPlace(page, "m-red", "red");
  await expect(page.getByTestId("game-feedback-right")).toHaveText("Right — red means stop, do not, fire safety.");
  await tapPlace(page, "m-yellow", "blue");
  await expect(page.getByTestId("game-feedback-wrong")).toHaveText("Look again at the article: what does blue mean?");
  await tapPlace(page, "m-yellow", "green");
  await expect(page.getByTestId("hint-card")).toHaveText("Yellow = caution, watch out");
  await tapPlace(page, "m-yellow", "red");
  await expect(page.getByTestId("box-yellow-items").locator("[data-placed=m-yellow]")).toHaveCount(1);
  await tapPlace(page, "m-blue", "blue");
  await tapPlace(page, "m-green", "green");
  await expect(page.getByTestId("colour-key-card")).toContainText("Red = stop, do not, fire safety");
  await expect(page.getByTestId("colour-key-card")).toContainText("Green = safe way, exits, first aid");
  await page.getByTestId("continue-button").click();
}

test.describe("Stage 1.6 What does each colour mean?", () => {
  test("all right guesses → 5/5 + 'Good guessing'; article; 3 games; colour key saved; end of 1.6", async ({ page, context }) => {
    await startAt(page, 5, { signs: ALL_SIGNS });
    await expect(page.getByTestId("expected-time")).toHaveText("About 10 minutes");
    const prompts = ["Red signs mean…", "Yellow signs mean…", "Blue signs mean…", "Green signs mean…", "The red square sign shows…"];
    for (let i = 0; i < 5; i++) {
      await expect(page.getByRole("heading", { name: prompts[i] })).toBeVisible();
      await expect(page.getByTestId("feedback-right")).toHaveCount(0); // no right/wrong during the guesses
      await page.getByTestId(`guess-${RIGHT[i]}`).click();
    }
    await expect(page.getByTestId("score-big")).toHaveText("5 / 5");
    await expect(page.getByTestId("score-line")).toHaveText("You got 5 of 5 right.");
    await expect(page.getByTestId("segue-line")).toHaveText("Good guessing! Now let’s see what safety experts say about each colour.");
    await expect(page.getByText("Read about the four colours and the shapes.")).toBeVisible();
    const popupPromise = context.waitForEvent("page");
    await page.getByTestId("open-article").click();
    const popup = await popupPromise;
    await popup.waitForURL(/smigroupuk/, { timeout: 30_000 }).catch(() => {});
    expect(popup.url()).toContain("smigroupuk.com/insights/colours-of-safety-signs-and-their-meanings");
    await popup.close();
    await page.bringToFront();
    await page.getByTestId("back-to-course").click();

    await game1(page);

    // Game 2 Shape Match
    await expect(page.getByRole("heading", { name: "Shape Match" })).toBeVisible();
    await expect(page.getByTestId("colour-key-card")).toBeVisible(); // stays
    await tapPlace(page, "triangle", "meaning-circle");
    await expect(page.getByTestId("game-feedback-wrong")).toHaveText("Look again at the article: what does a triangle mean?");
    await dragPlace(page, "triangle", "meaning-triangle");
    await expect(page.getByTestId("game-feedback-right")).toHaveText("Right — a triangle means ‘warns of a hazard’.");
    await tapPlace(page, "circle", "meaning-circle");
    await tapPlace(page, "square", "meaning-square");
    await page.getByTestId("continue-button").click();

    // Game 3 New Signs
    await expect(page.getByRole("heading", { name: "New Signs" })).toBeVisible();
    const g3: [string, string][] = [["eye", "blue"], ["hardhat", "blue"], ["forklift", "yellow"], ["emergency-exit", "green"], ["no-entry", "red"], ["fire-alarm", "red"]];
    await tapPlace(page, "fire-alarm", "green");
    await expect(page.getByTestId("game-feedback-wrong")).toHaveText("Look again at the article: what does green mean?");
    for (const [id, c] of g3) await tapPlace(page, id, c);
    await page.getByTestId("continue-button").click();
    await expect(page.getByTestId("end-screen")).toBeVisible();

    // Colour key saved to My notes; all 6 stages done
    await page.getByRole("button", { name: "Course menu" }).click();
    for (const s of ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6"]) await expect(page.getByTestId(`menu-stage-${s}`)).toHaveAttribute("data-state", "done");
    const notes = await page.evaluate(() => JSON.parse(localStorage.getItem("m2s1.progress.v1")!).myNotes.map((n: { id: string }) => n.id));
    expect(notes).toEqual(["colour-key"]);
  });

  test("low score → 'Colours can be tricky'; backup card with 3 example signs per colour", async ({ page }) => {
    await startAt(page, 5, { signs: ALL_SIGNS });
    for (let i = 0; i < 4; i++) await page.getByTestId(`guess-${RIGHT[(i + 1) % 4]}`).click();
    await page.getByTestId("guess-no entry").click();
    await expect(page.getByTestId("score-big")).toHaveText("0 / 5");
    await expect(page.getByTestId("segue-line")).toHaveText("Colours can be tricky. Let’s find out what each colour means from safety experts.");
    await page.getByTestId("article-did-not-open").click();
    await expect(page.getByTestId("backup-card").locator("[data-sign]")).toHaveCount(12);
    await expect(page.getByTestId("backup-card")).toContainText("Blue = you must");
    await page.getByTestId("continue-button").click();
    await game1(page);
  });

  test("pause during guesses shows the note; resume keeps the same guess; lapse restarts from Step 1", async ({ page }) => {
    await startAt(page, 5, { signs: ALL_SIGNS, query: "?fastmedia=1&timescale=40" });
    await page.getByTestId("guess-do not").click();
    await page.getByTestId("pause-button").click();
    await expect(page.getByTestId("resume-note")).toBeVisible();
    await page.getByTestId("pause-resume").click();
    await expect(page.getByRole("heading", { name: "Yellow signs mean…" })).toBeVisible();
    await page.getByTestId("guess-be careful").click();
    await expect(page.getByTestId("time-card")).toBeVisible({ timeout: 30_000 });
    await page.getByTestId("time-start-again").click();
    await expect(page.getByRole("heading", { name: "Red signs mean…" })).toBeVisible();
  });
});
