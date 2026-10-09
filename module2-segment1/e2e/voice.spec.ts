import { expect, test, type Page } from "@playwright/test";
import { ALL_SIGNS, freshStart, startAt, tapPlace } from "./helpers";

/**
 * Real audio files (public/media/audio), no ?fastmedia: lines are voiced, the
 * instruction is spoken after the person in charge has finished (never on top
 * of them), and feedback cards are read aloud.
 */

async function logAudio(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __audio: string[] };
    w.__audio = [];
    const orig = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const el = this;
      const name = el.src.split("/").pop() ?? "";
      w.__audio.push("play " + name);
      el.addEventListener("ended", () => w.__audio.push("end " + name), { once: true });
      return orig.call(el);
    };
  });
}
const audioLog = (page: Page) => page.evaluate(() => (window as unknown as { __audio: string[] }).__audio);

test("1.1: the person in charge speaks, then the instruction 'Say hello, and introduce yourself.' is spoken", async ({ page }) => {
  await logAudio(page);
  await freshStart(page, "?x=1");
  await page.getByTestId("start-button").click();
  await expect(page.getByTestId("prompt")).toBeVisible({ timeout: 20_000 });
  await expect.poll(async () => (await audioLog(page)).join(" | "), { timeout: 15_000 }).toMatch(/play M2_UI_say-hello-and-introduce-yourself_[0-9a-f]{8}\.mp3/);
  const log = await audioLog(page);
  const picEnd = log.indexOf("end M2_S01_01_PIC_01.mp3");
  const sayHello = log.findIndex((l) => l.startsWith("play M2_UI_say-hello"));
  expect(log[0]).toBe("play M2_S01_01_PIC_01.mp3");
  expect(picEnd).toBeGreaterThan(-1);
  expect(sayHello).toBeGreaterThan(picEnd); // never over the top of the person in charge
});

test("1.5: game feedback is read aloud", async ({ page }) => {
  await logAudio(page);
  await startAt(page, 4, { signs: ALL_SIGNS, query: "?x=1" });
  // wait for the narrator's intro to finish so feedback is not dropped
  await expect.poll(async () => (await audioLog(page)).includes("end M2_S01_05_NAR_01.mp3"), { timeout: 30_000 }).toBe(true);
  await tapPlace(page, "first-aid", "red");
  await expect(page.getByTestId("game-feedback-wrong")).toHaveText("Look at the colour again.");
  await expect.poll(async () => (await audioLog(page)).join(" | ")).toMatch(/play M2_UI_look-at-the-colour-again_[0-9a-f]{8}\.mp3/);
});
