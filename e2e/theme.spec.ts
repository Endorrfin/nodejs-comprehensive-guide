// ADDED: S18 — theme switch persists across a reload (localStorage + the pre-paint
// script in index.html), and the page stays interactive in light mode.
import { expect, test } from "@playwright/test";

test("Light theme survives a reload; a sim still steps in light mode", async ({ page }) => {
  await page.goto("#/chapter/event-loop");
  const html = page.locator("html");

  await page.getByRole("radio", { name: "Light theme" }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("radio", { name: "Light theme" })).toHaveAttribute("aria-checked", "true");

  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("radio", { name: "Light theme" })).toHaveAttribute("aria-checked", "true");

  // the event-loop hero sim responds to Step in light mode
  const sim = page.getByLabel("Event loop simulator");
  await sim.scrollIntoViewIfNeeded();
  const counter = page.locator(".el-step");
  await expect(counter).toHaveText(/^1\/\d+$/);
  await page.getByRole("button", { name: "Step ▶" }).click();
  await expect(counter).toHaveText(/^2\/\d+$/);
  await expect(page.getByRole("button", { name: "◀ Back" })).toBeEnabled();

  // and back to dark, also persisted
  await page.getByRole("radio", { name: "Dark theme" }).click();
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "dark");
});
