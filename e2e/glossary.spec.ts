// ADDED: S18 — glossary interactions: a see-also target that the current filter
// hides must reset the filter, then jump; the A–Z rail jumps to letter sections.
import { expect, test } from "@playwright/test";
import { expectLandedAt } from "./helpers";

test("filter → see-also resets the filter and jumps; A–Z rail jumps to a letter", async ({ page }) => {
  await page.goto("#/glossary");
  const filter = page.getByRole("searchbox", { name: "Filter glossary terms" });
  await filter.fill("highwater");

  const hwm = page.locator("#term-highwatermark");
  await expect(hwm).toBeVisible();
  // the filter hides Backpressure itself…
  await expect(page.locator("#term-backpressure")).toHaveCount(0);

  // …so its see-also button must clear the filter first, then land on it
  await hwm.getByRole("button", { name: "Backpressure", exact: true }).click();
  await expect(filter).toHaveValue("");
  await expectLandedAt(page, "term-backpressure");

  // A–Z rail
  await page.getByRole("navigation", { name: "Jump to letter" }).getByRole("button", { name: "S", exact: true }).click();
  await expectLandedAt(page, "letter-S");
});
