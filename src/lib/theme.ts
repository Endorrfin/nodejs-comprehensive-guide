/* CHANGED: S15 — light/dark/system theme, cross-ported from the database guide
   (its S22). `mode` is the user's choice (persisted in localStorage); the
   effective 'dark'|'light' is resolved against prefers-color-scheme and set as
   [data-theme] on <html> — the light token overrides live in theme/tokens.css.
   index.html carries a tiny pre-paint copy of this resolution to avoid a flash.
   SSR-safe: storage/matchMedia access is guarded, DOM writes happen in effects. */
import { useEffect, useState } from "react";

export type ThemeMode = "system" | "dark" | "light";
export type EffectiveTheme = "dark" | "light";

export const THEME_KEY = "nodeguide.theme";
const META_COLOR: Record<EffectiveTheme, string> = { dark: "#0A0C0A", light: "#f4f7f3" };

export function loadThemeMode(): ThemeMode {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "dark" || v === "light" || v === "system") return v;
  } catch {
    /* SSR or storage blocked — fall through to the default */
  }
  return "system";
}

export function resolveTheme(mode: ThemeMode): EffectiveTheme {
  if (mode !== "system") return mode;
  try {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
  } catch {
    /* no matchMedia — keep the brand default */
  }
  return "dark"; // dark is the brand default
}

function applyTheme(eff: EffectiveTheme): void {
  document.documentElement.setAttribute("data-theme", eff);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META_COLOR[eff]);
}

/** Theme state for the TopBar segmented switch. */
export function useThemeMode(): { mode: ThemeMode; setMode: (m: ThemeMode) => void } {
  const [mode, setMode] = useState<ThemeMode>(loadThemeMode);

  // apply + persist on every choice
  useEffect(() => {
    applyTheme(resolveTheme(mode));
    try {
      localStorage.setItem(THEME_KEY, mode);
    } catch {
      /* private mode — the choice just won't persist */
    }
  }, [mode]);

  // while in "system", follow live OS changes
  useEffect(() => {
    if (mode !== "system" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (): void => applyTheme(resolveTheme("system"));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  return { mode, setMode };
}
