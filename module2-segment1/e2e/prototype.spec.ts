import { expect, test } from "@playwright/test";
import { ALL_SIGNS, COLOUR_OF, tapPlace } from "./helpers";

/**
 * The Claude-hosted prototype (./prototype, built by scripts/build-prototype.mjs),
 * served the way Claude serves it (scripts/serve-prototype.mjs: wrapped in the
 * publish skeleton, under a sub-path, strict CSP), with the hosted page's limits
 * switched on: the microphone is refused without a prompt, window.open returns
 * null and confirm() returns false.
 * Run:  node scripts/serve-prototype.mjs 3200   then   npx playwright test e2e/prototype.spec.ts
 */
const URL = "http://localhost:3200/artifact/demo/";

function wav(seconds: number) {
  const rate = 8000, n = rate * seconds, buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * 2, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(rate, 24); buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.sin((i / rate) * 2 * Math.PI * 330) * 3000), 44 + i * 2);
  return buf;
}

test.skip(({ browserName }) => browserName !== "chromium");

test("hosted prototype: full journey 1.1 → 1.6 with the hosted page's limits", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException("refused", "NotAllowedError"));
    window.open = () => null;
    window.confirm = () => false;
  });
  await page.goto(URL + "?fastmedia=1");
  await expect(page).toHaveTitle("Your First Morning");
  await expect(page.getByTestId("home")).toBeVisible();
  // Styles and the course font loaded from the page's own files
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain("Noto");
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(247, 244, 238)");

  // Start over asks on the page itself (confirm() is unavailable)
  await page.getByTestId("reset-progress").click();
  await expect(page.getByTestId("reset-confirm")).toBeVisible();
  await page.getByTestId("reset-yes").click();
  await expect(page.getByTestId("reset-confirm")).toHaveCount(0);

  // 1.1 — mic refused → upload a recording → it plays back, is kept and stays on screen
  await page.getByTestId("start-button").click();
  await expect(page.getByTestId("prompt")).toHaveText("Say hello, and introduce yourself.");
  await page.getByRole("button", { name: /start recording/i }).click();
  await expect(page.getByTestId("recorder").getByRole("alert")).toContainText("or upload a recording instead");
  await page.getByTestId("upload-input").setInputFiles({ name: "my-intro.wav", mimeType: "audio/wav", buffer: wav(2) });
  await expect(page.getByTestId("uploaded-note")).toBeVisible();
  await page.getByTestId("rec-keep").click();
  await expect(page.getByTestId("kept-recording")).toContainText("0:02");
  const played = await page.getByTestId("kept-audio").evaluate(
    (a: HTMLAudioElement) => new Promise<string>((res) => { a.muted = true; a.onended = () => res("ended"); a.onerror = () => res("error"); a.play().catch((e) => res(String(e))); }),
  );
  expect(played).toBe("ended");
  for (let i = 0; i < 3; i++) await page.getByTestId(`selfcheck-${i}`).check();
  await page.getByTestId("check-button").click();
  await expect(page.getByTestId("feedback-right")).toHaveText("Great start — you greeted and said who you are.");
  await page.getByTestId("continue-button").click();

  // 1.2
  const order = [["no-smoking", "assembly-point"], ["no-entry-staff-only", "wear-gloves", "electrical-hazard", "fire-extinguisher"], ["wash-hands", "hot-water", "wet-floor", "first-aid"], ["fire-exit", "keep-fire-door-shut"]];
  for (const [i, ids] of order.entries()) {
    for (const id of ids) {
      await page.locator(`[data-hotspot="${id}"]`).click();
      await page.getByTestId("big-sign").getByRole("button", { name: "OK" }).click();
    }
    if (i < 3) await page.getByTestId("next-place").click();
  }
  await page.getByTestId("finish-walk").click();
  await page.getByTestId("continue-button").click();

  // 1.3
  await page.getByTestId("answer-yes").click();
  await page.getByTestId("dont-remember").click();
  await page.getByTestId("continue-button").click();

  // 1.4 — the article button is a real link to the article in a new tab
  await expect(page.getByTestId("open-article")).toHaveAttribute("href", "https://www.signs.com/blog/common-safety-signs-and-what-they-really-mean/");
  await expect(page.getByTestId("open-article")).toHaveAttribute("target", "_blank");
  const popup = context.waitForEvent("page");
  await page.getByTestId("open-article").click();
  await (await popup).close();
  await page.bringToFront();
  await page.getByTestId("back-to-course").click();
  for (const right of [1, 1, 1, 0]) {
    await page.getByTestId(`option-${right}`).click();
    await page.getByTestId("continue-button").click();
  }

  // 1.5
  for (const id of ALL_SIGNS) await tapPlace(page, id, COLOUR_OF[id]);
  await page.getByTestId("continue-button").click();

  // 1.6 (backup card path)
  for (const g of ["do not", "be careful", "you must", "safe way", "fire equipment"]) await page.getByTestId(`guess-${g}`).click();
  await page.getByTestId("article-did-not-open").click();
  await page.getByTestId("continue-button").click();
  for (const [id, c] of [["m-red", "red"], ["m-yellow", "yellow"], ["m-blue", "blue"], ["m-green", "green"]]) await tapPlace(page, id, c);
  await page.getByTestId("continue-button").click();
  for (const s of ["triangle", "circle", "square"]) await tapPlace(page, s, `meaning-${s}`);
  await page.getByTestId("continue-button").click();
  for (const [id, c] of [["eye", "blue"], ["hardhat", "blue"], ["forklift", "yellow"], ["emergency-exit", "green"], ["no-entry", "red"], ["fire-alarm", "red"]]) await tapPlace(page, id, c);
  await page.getByTestId("continue-button").click();
  await expect(page.getByTestId("end-screen")).toBeVisible();

  // Progress survives a reload of the hosted page
  await page.reload();
  await expect(page.getByTestId("menu-stage-1.6")).toHaveAttribute("data-state", "done");
  // React #418: the hosted wrapper adds its own <head>/<body>, so React rebuilds the page on load
  // instead of reusing the pre-rendered HTML. It recovers by itself; any other error fails the test.
  expect(errors.filter((e) => !e.includes("React error #418"))).toEqual([]);
});
