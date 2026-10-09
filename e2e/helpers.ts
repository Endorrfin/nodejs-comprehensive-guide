// ADDED: S18 — shared assertion for anchor jumps. `toBeInViewport` alone is too weak:
// some targets (e.g. a chapter's #analogy) are already partly visible at scroll 0.
// "Landed" = in view AND its top edge scrolled up to just under the sticky TopBar.
import { expect, type Page } from "@playwright/test";

export async function expectLandedAt(page: Page, id: string): Promise<void> {
  const el = page.locator(`#${id}`);
  await expect(el).toBeInViewport();
  await expect
    .poll(() => el.evaluate((n) => Math.round(n.getBoundingClientRect().top)), {
      message: `#${id} scrolled to the top of the viewport`,
    })
    .toBeLessThan(160);
  await expect.poll(() => page.evaluate(() => window.scrollY), { message: "page actually scrolled" }).toBeGreaterThan(0);
}
