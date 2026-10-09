// ADDED: S18 — cross-page anchor jumps (lib/pendingScroll): the click sets a pending
// id, the hash route changes, the target page scrolls to it after mount. SSR smoke
// can't see any of this (needs a real router + rAF + layout).
import { expect, test } from "@playwright/test";
import { expectLandedAt } from "./helpers";

test("chapter → principle circle → #/principles lands on that card", async ({ page }) => {
  await page.goto("#/chapter/streams");
  const line = page.locator(".ch-principles");
  await expect(line).toBeVisible();
  const first = line.getByRole("link").first();
  const label = (await first.getAttribute("aria-label")) ?? "";
  const n = /Principle (\d+)/.exec(label)?.[1];
  expect(n, "circle carries 'Principle N' in its aria-label").toBeTruthy();

  await first.click();
  await expect(page).toHaveURL(/#\/principles$/);
  await expectLandedAt(page, `principle-${n}`);
});

test("glossary → '◎ Analogy' of a term → chapter with #analogy in view", async ({ page }) => {
  await page.goto("#/glossary");
  const entry = page.locator("#term-highwatermark");
  await entry.scrollIntoViewIfNeeded();
  await entry.getByRole("link", { name: "◎ Analogy" }).click();

  await expect(page).toHaveURL(/#\/chapter\/streams$/);
  await expectLandedAt(page, "analogy");
});
