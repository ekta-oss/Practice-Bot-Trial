import { expect, type Page } from "@playwright/test";

export const Q = "?fastmedia=1";

export async function freshStart(page: Page, query = Q) {
  await page.goto("/" + query);
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise<void>((r) => {
      const req = indexedDB.deleteDatabase("m2s1-practice");
      req.onsuccess = req.onerror = req.onblocked = () => r();
    });
  });
  await page.goto("/" + query);
  await expect(page.getByTestId("home")).toBeVisible();
}

/** Record ~`ms` of (fake) microphone audio, check playback works, then Keep. */
export async function recordAndKeep(page: Page, ms = 1200, opts: { reRecord?: boolean } = {}) {
  const rec = page.getByTestId("recorder").last();
  await expect(rec.getByTestId("practice-badge")).toContainText("Practice");
  await expect(rec.getByTestId("practice-badge")).toContainText("Only you can hear this.");
  await rec.getByRole("button", { name: /start recording/i }).click();
  await expect(rec).toHaveAttribute("data-phase", "recording");
  await page.waitForTimeout(ms);
  await rec.getByRole("button", { name: "Stop recording" }).click();
  await expect(rec).toHaveAttribute("data-phase", "review");
  // Play back the real recorded blob
  await rec.getByTestId("rec-play").click();
  if (opts.reRecord) {
    await rec.getByTestId("rec-again").click();
    await expect(rec).toHaveAttribute("data-phase", "recording");
    await page.waitForTimeout(ms);
    await rec.getByRole("button", { name: "Stop recording" }).click();
    await expect(rec).toHaveAttribute("data-phase", "review");
  }
  await rec.getByTestId("rec-keep").click();
}

export async function storedRecordings(page: Page) {
  return page.evaluate(
    () =>
      new Promise<{ key: string; size: number; type: string }[]>((resolve) => {
        const req = indexedDB.open("m2s1-practice", 1);
        req.onsuccess = () => {
          const db = req.result;
          const all = db.transaction("recordings").objectStore("recordings").getAll();
          all.onsuccess = () => resolve(all.result.map((r: { key: string; blob: Blob; mimeType: string }) => ({ key: r.key, size: r.blob.size, type: r.mimeType })));
        };
      }),
  );
}

export async function cont(page: Page) {
  await page.getByTestId("continue-button").click();
}

export const ALL_SIGNS = [
  "no-smoking", "assembly-point", "no-entry-staff-only", "wear-gloves", "electrical-hazard", "fire-extinguisher",
  "wash-hands", "hot-water", "wet-floor", "first-aid", "fire-exit", "keep-fire-door-shut",
];

/** Opens stage `index` (0-based) with earlier stages completed and the given signs saved. */
export async function startAt(page: Page, index: number, opts: { signs?: string[]; newSigns?: string[]; query?: string } = {}) {
  await freshStart(page, opts.query ?? Q);
  await page.evaluate(
    ({ index, signs, newSigns }) => {
      const ids = ["1.1", "1.2", "1.3", "1.4", "1.5", "1.6"];
      localStorage.setItem(
        "m2s1.progress.v1",
        JSON.stringify({
          version: 1,
          unlocked: index,
          completed: ids.slice(0, index),
          mySigns: [...signs.map((id) => ({ id, savedAt: 1, isNew: false })), ...newSigns.map((id) => ({ id, savedAt: 2, isNew: true }))],
          myNotes: [],
          finished: false,
        }),
      );
    },
    { index, signs: opts.signs ?? [], newSigns: opts.newSigns ?? [] },
  );
  await page.goto("/" + (opts.query ?? Q));
  await page.getByTestId(`menu-stage-1.${index + 1}`).click();
  await expect(page.getByTestId("stage-title")).toContainText(`1.${index + 1}`);
}

export async function tapSign(page: Page, id: string) {
  await page.locator(`[data-hotspot="${id}"]`).click();
  await expect(page.getByTestId("big-sign")).toBeVisible();
  await expect(page.getByTestId("big-sign")).toBeHidden({ timeout: 5000 });
}

/** Tap a card, then tap a box (the keyboard/tap way of playing the drag games). */
export async function tapPlace(page: Page, cardId: string, boxId: string) {
  await page.getByTestId(`card-${cardId}`).click();
  await page.getByTestId(`box-${boxId}`).click();
}

/** Real pointer drag (dnd-kit) from a card onto a box. */
export async function dragPlace(page: Page, cardId: string, boxId: string) {
  const from = (await page.getByTestId(`card-${cardId}`).boundingBox())!;
  const to = (await page.getByTestId(`box-${boxId}`).boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2 + 10, { steps: 3 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();
  // dnd-kit ignores clicks for 50 ms after a drop (so the drop is not also a click); no person is that fast.
  await page.waitForTimeout(100);
}

export const COLOUR_OF: Record<string, string> = {
  "no-smoking": "red", "no-entry-staff-only": "red", "fire-extinguisher": "red",
  "electrical-hazard": "yellow", "wet-floor": "yellow", "hot-water": "yellow",
  "wear-gloves": "blue", "wash-hands": "blue", "keep-fire-door-shut": "blue",
  "assembly-point": "green", "first-aid": "green", "fire-exit": "green",
};
