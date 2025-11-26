// js/i18n.js
// --------------------------------------
// Family Spots Map – i18n / Spielideen
// --------------------------------------

"use strict";

/**
 * Unterstützte Sprachen & Defaults
 * ---------------------------------- */

/** @type {const} */
const SUPPORTED_LANGS = ["de", "en"];
/** @type {const} */
const DEFAULT_LANG = "de";
/** @type {const} */
const STORAGE_LANG_KEY = "fs_lang";

/** @typedef {"de" | "en"} LangCode */

/** @type {LangCode} */
let currentLang = DEFAULT_LANG;

/**
 * messagesByLang[lang] = { key: "Übersetzung" }
 * @type {Record<LangCode, Record<string, string>>}
 */
const messagesByLang = {
  de: {},
  en: {}
};

/**
 * Spielideen-Struktur:
 * [{ de: "…", en: "…" }, …]
 * @type {Array<Record<LangCode, string>>}
 */
let playIdeas = [];

/* --------------------------------------
 * Helpers
 * ----------------------------------- */

/**
 * Normalisiert eine Sprache auf "de" oder "en".
 * Alles außer "en" wird bewusst auf "de" gefaltet.
 * @param {string | null | undefined} lang
 * @returns {LangCode}
 */
function normalizeLang(lang) {
  return lang === "en" ? "en" : "de";
}

/**
 * Sprache aus localStorage holen (falls gültig).
 * @returns {LangCode | null}
 */
function getStoredLang() {
  try {
    const stored = localStorage.getItem(STORAGE_LANG_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored)) {
      return /** @type {LangCode} */ (stored);
    }
  } catch {
    // Storage ist optional – Fallback greift unten
  }
  return null;
}

/**
 * Sprache aus dem Browser ableiten.
 * Nutzt `navigator.languages` falls vorhanden, sonst `navigator.language`.
 * @returns {LangCode | null}
 */
function detectBrowserLang() {
  if (typeof navigator === "undefined") return null;

  const candidates = [];

  if (Array.isArray(navigator.languages)) {
    candidates.push(...navigator.languages);
  }
  if (navigator.language) {
    candidates.push(navigator.language);
  }

  for (const value of candidates) {
    if (!value) continue;
    const code = String(value).toLowerCase().slice(0, 2);
    if (SUPPORTED_LANGS.includes(code)) {
      return /** @type {LangCode} */ (code);
    }
  }

  return null;
}

/**
 * Interner Setter inkl. Persistenz & lang-Attribut auf <html>.
 * @param {LangCode} lang
 */
function setLangInternal(lang) {
  currentLang = normalizeLang(lang || DEFAULT_LANG);

  try {
    localStorage.setItem(STORAGE_LANG_KEY, currentLang);
  } catch {
    // Wenn Storage nicht verfügbar ist, ist das kein Beinbruch.
  }

  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.setAttribute("lang", currentLang);
  }
}

/* --------------------------------------
 * Laden von Übersetzungen & Spielideen
 * ----------------------------------- */

/**
 * Lädt die JSON-Übersetzungen für eine Sprache (lazy).
 * Erwartet Datei: data/i18n/<lang>.json
 * @param {LangCode} lang
 */
async function loadMessagesForLang(lang) {
  const target = normalizeLang(lang);

  // Bereits geladen?
  if (Object.keys(messagesByLang[target] || {}).length > 0) return;

  try {
    const res = await fetch(`data/i18n/${target}.json`, {
      cache: "no-cache"
    });

    if (!res.ok) {
      throw new Error(`i18n load failed: ${target} (HTTP ${res.status})`);
    }

    const json = await res.json();
    if (json && typeof json === "object") {
      messagesByLang[target] = /** @type {Record<string, string>} */ (json);
    } else {
      console.warn(
        "[i18n] Unerwartetes Format für Sprachdatei:",
        target,
        json
      );
      messagesByLang[target] = {};
    }
  } catch (err) {
    console.error("[i18n] Fehler beim Laden der Sprache", target, err);
    // Fallback: leere Tabelle, damit t() sauber weiterarbeitet
    messagesByLang[target] = messagesByLang[target] || {};
  }
}

/**
 * Lädt Spielideen aus data/play-ideas.json.
 * Struktur: [{ de: "…", en: "…" }, …]
 */
async function loadPlayIdeas() {
  if (playIdeas.length) return;

  try {
    const res = await fetch("data/play-ideas.json", {
      cache: "no-cache"
    });

    if (!res.ok) {
      throw new Error(`play-ideas load failed (HTTP ${res.status})`);
    }

    const json = await res.json();
    if (Array.isArray(json)) {
      playIdeas = /** @type {Array<Record<LangCode, string>>} */ (json);
    } else {
      console.warn("[i18n] play-ideas.json ist kein Array.");
      playIdeas = [];
    }
  } catch (err) {
    console.error("[i18n] Fehler beim Laden der Spielideen:", err);
    playIdeas = [];
  }
}

/* --------------------------------------
 * Public API
 * ----------------------------------- */

/**
 * Initialisiert i18n:
 *  - lädt de/en Übersetzungen
 *  - lädt Spielideen
 *  - bestimmt Startsprache (lang-Param -> localStorage -> Browser -> de)
 *  - setzt <html lang="…">
 *  - aktualisiert DOM (data-i18n / data-i18n-placeholder)
 *
 * @param {LangCode} [lang] – optionaler Override
 * @returns {Promise<void>}
 */
async function init(lang) {
  const stored = getStoredLang();
  const browser = detectBrowserLang();
  const target = normalizeLang(lang || stored || browser || DEFAULT_LANG);

  // Übersetzungen + Spielideen parallel laden
  await Promise.all([
    loadMessagesForLang("de"),
    loadMessagesForLang("en"),
    loadPlayIdeas()
  ]);

  setLangInternal(target);
  applyTranslations(typeof document !== "undefined" ? document : undefined);
}

/**
 * Sprache wechseln (de/en) und DOM aktualisieren.
 * @param {LangCode} lang
 */
function setLanguage(lang) {
  const normalized = normalizeLang(lang);
  if (normalized === currentLang) return;

  setLangInternal(normalized);
  applyTranslations(typeof document !== "undefined" ? document : undefined);
}

/**
 * Aktuelle Sprache holen.
 * @returns {LangCode}
 */
function getLanguage() {
  return currentLang;
}

/**
 * Übersetzungsfunktion.
 * Nutzt die aktuell gesetzte Sprache.
 *
 * @param {string} key
 * @param {string} [fallback]
 * @returns {string}
 */
function t(key, fallback) {
  const table = messagesByLang[currentLang] || {};
  // nullish coalescing: erlaubt explizit leere Strings
  return table[key] ?? fallback ?? key;
}

/**
 * Texte im DOM updaten:
 *  - data-i18n → textContent
 *  - data-i18n-placeholder → placeholder
 *
 * @param {ParentNode} [root=document]
 */
function applyTranslations(root = document) {
  if (!root || typeof root.querySelectorAll !== "function") return;

  // Inhalt (Text)
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    const value = t(key);
    if (value != null) el.textContent = value;
  });

  // Placeholder
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (!key) return;
    const value = t(key);
    if (value != null) el.setAttribute("placeholder", value);
  });
}

/**
 * Liefert eine zufällige Spielidee in der aktuellen Sprache.
 * @returns {string}
 */
function getRandomPlayIdea() {
  if (!playIdeas.length) return "";
  const idx = Math.floor(Math.random() * playIdeas.length);
  const idea = playIdeas[idx];
  if (!idea || typeof idea !== "object") return "";
  return idea[currentLang] || idea.de || idea.en || "";
}

/* --------------------------------------
 * Globales Objekt + ES-Module Export
 * ----------------------------------- */

/**
 * @typedef {Object} I18nApi
 * @property {(lang?: LangCode) => Promise<void>} init
 * @property {(lang: LangCode) => void} setLanguage
 * @property {() => LangCode} getLanguage
 * @property {(key: string, fallback?: string) => string} t
 * @property {(root?: ParentNode) => void} applyTranslations
 * @property {() => string} getRandomPlayIdea
 */

/** @type {I18nApi} */
const I18N = {
  init,
  setLanguage,
  getLanguage,
  t,
  applyTranslations,
  getRandomPlayIdea
};

// Für app.js (nutzt window.I18N)
if (typeof window !== "undefined") {
  window.I18N = I18N;
}

// ES-Module-Exports (falls du direkt importieren willst)
export {
  init as initI18n,
  setLanguage,
  getLanguage,
  t,
  applyTranslations,
  getRandomPlayIdea,
  I18N
};

export default I18N;