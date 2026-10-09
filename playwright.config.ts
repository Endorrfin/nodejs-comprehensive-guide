// ADDED: S18 — browser e2e (Chromium only). Catches what the SSR smoke can't:
// hash routing, cross-page anchor jumps (pendingScroll + rAF), real layout widths,
// localStorage-backed theme, the mobile drawer. Runs against the PRODUCTION build
// (`vite preview` serves dist/ — base './' + hash routing, exactly as on Pages).
// Build first: `npm run build && npm run e2e` (CI does build → e2e as a gate).
import { defineConfig, devices } from "@playwright/test";

const CI = !!process.env.CI;
const PORT = 4173;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${PORT}/`,
    // the app's reduced-motion kill-switch freezes CSS animations → no animation flakes
    reducedMotion: "reduce",
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !CI,
    timeout: 60_000,
  },
});
