import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ALL_SIGNS, freshStart, startAt } from "./helpers";

async function scan(page: import("@playwright/test").Page, where: string) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  const issues = r.violations.map((v) => `${where}: ${v.id} (${v.impact}) ${v.nodes.length}× — ${v.nodes[0]?.target.join(" ")}`);
  expect(issues, issues.join("\n")).toEqual([]);
}

test("axe: no WCAG A/AA violations on each stage", async ({ page }) => {
  await freshStart(page);
  await scan(page, "menu");
  await page.getByTestId("start-button").click();
  await page.getByTestId("prompt").waitFor();
  await scan(page, "1.1");
  await startAt(page, 1);
  await scan(page, "1.2");
  await startAt(page, 2, { signs: ALL_SIGNS });
  await scan(page, "1.3");
  await startAt(page, 3);
  await scan(page, "1.4");
  await startAt(page, 4, { signs: ALL_SIGNS });
  await scan(page, "1.5");
  await startAt(page, 5, { signs: ALL_SIGNS });
  await scan(page, "1.6");
});
