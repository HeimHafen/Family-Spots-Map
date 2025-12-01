// js/theme.js
// =======================================
// Theme-Handling (hell / dunkel)
// =======================================

"use strict";

import { THEME_LIGHT, THEME_DARK } from "./config.js";

/**
 * Liefert das initiale Theme:
 *  - gespeicherter Wert in localStorage
 *  - sonst prefers-color-scheme
 *  - sonst light
 */
export function getInitialTheme() {
  try {
    const stored = localStorage.getItem("fs_theme");
    if (stored === THEME_LIGHT || stored === THEME_DARK) return stored;
  } catch {
    // ignore
  }

  if (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return THEME_DARK;
  }

  return THEME_LIGHT;
}

/**
 * Wendet ein Theme an und speichert es.
 * Gibt das tatsächlich gesetzte Theme zurück.
 * @param {"light"|"dark"} theme
 */
export function applyTheme(theme) {
  const next =
    theme === THEME_DARK
      ? THEME_DARK
      : THEME_LIGHT;

  try {
    localStorage.setItem("fs_theme", next);
  } catch {
    // ignore
  }

  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", next);
  }

  return next;
}