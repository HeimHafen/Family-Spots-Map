// js/i18n.js
// Zentraler I18N-Layer für Family Spots Map
// - lädt data/i18n/<lang>.json
// - stellt sowohl ES-Module-Exports als auch das globale I18N-Objekt bereit
//   (für das bestehende app.js)

let currentLang = "de";
let messages = {};
const DEFAULT_LANG = "de";
const SUPPORTED_LANGS = ["de", "en"];

/**
 * Aktuelle Sprache zurückgeben.
 */
export function getLanguage() {
  return currentLang;
}

/**
 * Interne Hilfsfunktion: ermittelt sinnvolle Startsprache aus Browser.
 */
function detectBrowserLang() {
  if (typeof navigator === "undefined") return DEFAULT_LANG;
  const navLang =
    (navigator.language || navigator.userLanguage || DEFAULT_LANG)
      .toLowerCase()
      .slice(0, 2);

  return SUPPORTED_LANGS.includes(navLang) ? navLang : DEFAULT_LANG;
}

/**
 * Lädt das JSON für eine Sprache und aktualisiert `messages`.
 * Wird von initI18n / setLanguage verwendet.
 */
async function loadMessages(lang) {
  const target = lang || DEFAULT_LANG;

  const response = await fetch(`data/i18n/${target}.json`, {
    cache: "no-cache"
  });

  if (!response.ok) {
    throw new Error(`i18n load failed for ${target} (${response.status})`);
  }

  const json = await response.json();
  messages = json || {};
  currentLang = target;

  // <html lang="…"> mitziehen
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.setAttribute("lang", currentLang);
  }
}

/**
 * Initiales I18N-Setup (direkt aus App aufrufbar).
 * Nutzt entweder die gewünschte Sprache oder Browser-Default.
 */
export async function initI18n(lang) {
  const target = lang || currentLang || detectBrowserLang();
  try {
    await loadMessages(target);
  } catch (err) {
    console.error("[I18N] init failed:", err);
    if (target !== DEFAULT_LANG) {
      // Fallback auf Deutsch
      try {
        await loadMessages(DEFAULT_LANG);
      } catch (err2) {
        console.error("[I18N] fallback to de failed:", err2);
      }
    }
  }
}

/**
 * Übersetzungsfunktion – analog zum alten I18N.t(key).
 */
export function t(key, fallback) {
  if (!key) return "";
  return messages[key] ?? fallback ?? key;
}

/**
 * Wendet Übersetzungen auf DOM-Elemente mit data-i18n / data-i18n-placeholder an.
 * (Kann zusätzlich zu deinen data-i18n-de / data-i18n-en Attributen existieren.)
 */
export function applyTranslations(root = document) {
  if (!root || typeof root.querySelectorAll !== "function") return;

  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const value = t(key);
    if (value) el.textContent = value;
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const value = t(key);
    if (value) el.setAttribute("placeholder", value);
  });
}

/**
 * Optional: Zufällige Spielidee zurückgeben.
 * Erwartet im JSON z.B.:
 * {
 *   "playIdeas": ["Idee 1", "Idee 2", ...]
 * }
 */
export function getRandomPlayIdea() {
  const pool =
    messages.playIdeas ||
    messages.play_ideas ||
    messages["play_ideas_de"] ||
    null;

  if (!Array.isArray(pool) || pool.length === 0) return "";
  const idx = Math.floor(Math.random() * pool.length);
  return String(pool[idx] ?? "");
}

/* ============================================================
   Globale I18N-Fassade für bestehendes app.js
   ============================================================ */

const I18NGlobal = {
  /**
   * App.js ruft I18N.init() beim DOMContentLoaded auf.
   * Wir nehmen hier Browser-Sprache oder den aktuell gesetzten Wert.
   */
  async init(lang) {
    const startLang = lang || currentLang || detectBrowserLang();
    await initI18n(startLang);
    // Optionale DOM-Übersetzung – app.js setzt vieles selbst,
    // aber so können data-i18n-Attribute auch genutzt werden.
    if (typeof document !== "undefined") {
      applyTranslations(document);
    }
  },

  /**
   * Sprache ändern (wird aus app.js:setLanguage aufgerufen).
   */
  async setLanguage(lang) {
    const target = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
    await initI18n(target);
    if (typeof document !== "undefined") {
      applyTranslations(document);
    }
  },

  /**
   * Übersetzung (app.js nutzt eine Wrapper-Funktion t(key) darum herum).
   */
  t,

  /**
   * Aktuelle Sprache für alle, die es brauchen.
   */
  getLanguage,

  /**
   * Wird in app.js für den Spielideen-Button verwendet.
   */
  getRandomPlayIdea
};

// Im Browser als globales I18N verfügbar machen,
// damit dein existierendes app.js problemlos weiterläuft.
if (typeof window !== "undefined") {
  window.I18N = I18NGlobal;
}