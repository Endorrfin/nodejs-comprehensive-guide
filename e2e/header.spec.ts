// ADDED: S18 — header layout at real widths (the S15/S17 compaction cascade):
// the 8 tabs stay on ONE row, nothing is clipped, the page never scrolls sideways.
// On phones the hamburger opens the chapters drawer and Esc closes it.
import { expect, test } from "@playwright/test";

for (const width of [1920, 1300, 1100, 950, 901]) {
  test(`header @${width}px: tabs on one row, no horizontal page scroll`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("#/chapter/event-loop");
    const tabs = page.getByRole("navigation", { name: "Primary" }).getByRole("link");
    await expect(tabs).toHaveCount(8);

    const m = await page.evaluate(() => {
      const nav = document.querySelector("nav.nav")!;
      const links = [...nav.querySelectorAll("a")].map((a) => a.getBoundingClientRect());
      const inner = document.querySelector(".topbar-inner")!.getBoundingClientRect();
      return {
        tops: links.map((r) => Math.round(r.top)),
        heights: links.map((r) => Math.round(r.height)),
        maxRight: Math.max(...links.map((r) => r.right)),
        innerRight: inner.right,
        navOverflow: nav.scrollWidth - nav.clientWidth,
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    expect(new Set(m.tops).size, `tab tops ${m.tops}`).toBe(1); // one row
    expect(Math.max(...m.heights) - Math.min(...m.heights), `tab heights ${m.heights}`).toBeLessThanOrEqual(1); // no tab wraps inside
    expect(m.maxRight, "last tab inside the header").toBeLessThanOrEqual(m.innerRight + 0.5);
    expect(m.navOverflow, "nav not clipped").toBeLessThanOrEqual(0);
    expect(m.pageOverflow, "no horizontal page scroll").toBeLessThanOrEqual(0);
  });
}

test("mobile 400px: hamburger opens the drawer, Esc closes it", async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 800 });
  await page.goto("#/chapter/event-loop");
  const drawer = page.getByRole("dialog", { name: "Chapters" });
  await expect(drawer).toHaveCount(0);

  await page.getByRole("button", { name: "Open chapters menu" }).click();
  await expect(drawer).toBeVisible();
  // the drawer reuses the Sidebar: chapter buttons, the current one marked
  await expect(drawer.locator('[aria-current="page"]')).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(pageOverflow, "no horizontal page scroll on mobile").toBeLessThanOrEqual(0);
});
