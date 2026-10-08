import { expect, test, type Page } from "@playwright/test";
import { freshStart, startAt } from "./helpers";

/**
 * Proves the app really plays delivered media when it is present at the
 * manifest paths (served here by request interception, as if dropped into
 * public/media).
 */

function wav(seconds: number) {
  const rate = 8000;
  const n = rate * seconds;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(rate, 24);
  buf.writeUInt32LE(rate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.sin((i / rate) * 2 * Math.PI * 440) * 3000), 44 + i * 2);
  return buf;
}

async function serve(page: Page, pathPart: string, body: Buffer, contentType: string) {
  await page.route(`**/media/**/${pathPart}`, (route) => route.fulfill({ status: 200, body, contentType }));
}

test("delivered narration audio plays instead of the stand-in", async ({ page }) => {
  await serve(page, "M2_S01_02_NAR_01.mp3", wav(1.5), "audio/wav");
  await startAt(page, 1, { query: "?standin=0" });
  await expect(page.getByTestId("subtitle")).toBeVisible();
  await expect(page.getByTestId("missing-audio")).toHaveCount(0);
  await expect(page.getByTestId("subtitle")).toHaveCount(0, { timeout: 10_000 }); // audio 'ended'
});

test("delivered 1.1 video clips play, pause after line 1, then line 2", async ({ page }) => {
  await freshStart(page);
  // Make a real 1.5 s WebM in the browser (canvas → MediaRecorder).
  const b64 = await page.evaluate(async () => {
    const c = document.createElement("canvas");
    c.width = 320;
    c.height = 180;
    const g = c.getContext("2d")!;
    const stream = c.captureStream(15);
    const rec = new MediaRecorder(stream, { mimeType: "video/webm" });
    const parts: Blob[] = [];
    rec.ondataavailable = (e) => parts.push(e.data);
    let f = 0;
    const id = setInterval(() => {
      g.fillStyle = `hsl(${(f++ * 20) % 360} 60% 60%)`;
      g.fillRect(0, 0, 320, 180);
    }, 60);
    rec.start();
    await new Promise((r) => setTimeout(r, 1500));
    rec.stop();
    await new Promise((r) => (rec.onstop = r));
    clearInterval(id);
    const buf = await new Blob(parts, { type: "video/webm" }).arrayBuffer();
    let s = "";
    new Uint8Array(buf).forEach((b) => (s += String.fromCharCode(b)));
    return btoa(s);
  });
  const video = Buffer.from(b64, "base64");
  await serve(page, "M2_S01_01_VID_01.mp4", video, "video/webm");
  await serve(page, "M2_S01_01_VID_02.mp4", video, "video/webm");
  await page.getByTestId("start-button").click();
  await expect(page.locator("video")).toHaveCount(1);
  await expect(page.getByTestId("missing-asset")).toHaveCount(0);
  await expect(page.getByTestId("prompt")).toHaveText("Say hello, and introduce yourself.", { timeout: 15_000 });
  await expect(page.locator("video")).toHaveCount(0); // still picture while waiting
});

test("delivered scene picture replaces the interim drawing; signs stay tappable", async ({ page }) => {
  await freshStart(page);
  const png = Buffer.from(
    await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 160;
      c.height = 90;
      c.getContext("2d")!.fillRect(0, 0, 160, 90);
      return c.toDataURL("image/png").split(",")[1];
    }),
    "base64",
  );
  await serve(page, "M2_S01_02_IMG_01_entrance.webp", png, "image/png");
  await startAt(page, 1);
  await expect(page.locator('[data-scene="entrance"]')).toHaveAttribute("data-art", "final");
  await page.locator('[data-hotspot="no-smoking"]').click();
  await expect(page.getByTestId("saved-toast")).toBeVisible();
});

test("/assets lists every manifest file with its status", async ({ page }) => {
  await page.goto("/assets");
  await expect(page.getByTestId("asset-summary")).toContainText("0 of 22 files present");
  await expect(page.getByText("media/audio/M2_S01_06_NAR_04.mp3")).toBeVisible();
});
