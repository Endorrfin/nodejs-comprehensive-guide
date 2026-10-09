// ADDED: S18 — global search (TopBar combobox): Term / Principle hits carry an
// anchor and go through goToAnchor → the target entry must actually be in view.
import { expect, test, type Page } from "@playwright/test";
import { expectLandedAt } from "./helpers";

async function searchAndPick(page: Page, query: string, kind: string, title: string | RegExp): Promise<void> {
  const box = page.getByRole("combobox", { name: "Search the guide" });
  await box.fill(query);
  const hit = page
    .getByRole("listbox")
    .getByRole("option")
    .filter({ hasText: kind })
    .filter({ hasText: title })
    .first();
  await expect(hit).toBeVisible();
  // results choose on mousedown (so the input's blur can't close the list first)
  await hit.getByRole("button").click();
}

test("search 'highWaterMark' → Term hit → glossary entry in view", async ({ page }) => {
  await page.goto("#/map");
  await searchAndPick(page, "highWaterMark", "Term", /^Term\s*highWaterMark/);
  await expect(page).toHaveURL(/#\/glossary$/);
  await expectLandedAt(page, "term-highwatermark");
});

test("search a principle → Principle hit → its card in view", async ({ page }) => {
  await page.goto("#/chapter/event-loop");
  await searchAndPick(page, "data flows", "Principle", "Memory stays bounded only if data flows.");
  await expect(page).toHaveURL(/#\/principles$/);
  await expectLandedAt(page, "principle-5");
});
