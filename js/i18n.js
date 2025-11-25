// js/i18n.js

// Unterstützte Sprachen
const SUPPORTED_LANGS = ["de", "en"];
const STORAGE_LANG_KEY = "fs_lang";

let currentLang = "de";
// messagesByLang[lang] = { key: "Übersetzung" }
const messagesByLang = {
  de: {},
  en: {}
};

// [{ de: "…", en: "…" }, …]
let playIdeas = [];

/* --------------------------------------
 * Helpers
 * ----------------------------------- */

function normalizeLang(lang) {
  return lang === "en" ? "en" : "de";
}

function getStoredLang() {
  try {
    const stored = localStorage.getItem(STORAGE_LANG_KEY);
    if (SUPPORTED_LANGS.includes(stored)) return stored;
  } catch (_) {}
  return null;
}

function detectBrowserLang() {
  if (typeof navigator === "undefined") return null;
  const nav = (navigator.language || "").toLowerCase().slice(0, 2);
  return SUPPORTED_LANGS.includes(nav) ? nav : null;
}

function setLangInternal(lang) {
  currentLang = normalizeLang(lang || "de");
  try {
    localStorage.setItem(STORAGE_LANG_KEY, currentLang);
  } catch (_) {}
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.setAttribute("lang", currentLang);
  }
}

/* --------------------------------------
 * Laden von Übersetzungen & Spielideen
 * ----------------------------------- */

async function loadMessagesForLang(lang) {
  const target = normalizeLang(lang);
  if (Object.keys(messagesByLang[target] || {}).length > 0) return;

  try {
    const res = await fetch(`data/i18n/${target}.json`);
    if (!res.ok) throw new Error(`i18n load failed: ${target}`);
    const json = await res.json();
    messagesByLang[target] = json || {};
  } catch (err) {
    console.error("[i18n] Fehler beim Laden der Sprache", target, err);
    messagesByLang[target] = messagesByLang[target] || {};
  }
}

async function loadPlayIdeas() {
  if (playIdeas.length) return;
  try {
    const res = await fetch("data/play-ideas.json");
    if (!res.ok) throw new Error("play-ideas load failed");
    const json = await res.json();
    if (Array.isArray(json)) {
      playIdeas = json;
    } else {
      console.warn("[i18n] play-ideas.json ist kein Array.");
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
 *  - setzt Startsprache (localStorage -> Browser -> de)
 */
async function init(lang) {
  const stored = getStoredLang();
  const browser = detectBrowserLang();
  const target = normalizeLang(lang || stored || browser || "de");

  await Promise.all([
    loadMessagesForLang("de"),
    loadMessagesForLang("en"),
    loadPlayIdeas()
  ]);

  setLangInternal(target);
  applyTranslations(document);
}

/**
 * Sprache wechseln (de/en)
 */
function setLanguage(lang) {
  setLangInternal(lang);
  applyTranslations(document);
}

/**
 * Aktuelle Sprache holen
 */
function getLanguage() {
  return currentLang;
}

/**
 * Übersetzungsfunktion
 */
function t(key, fallback) {
  const table = messagesByLang[currentLang] || {};
  return table[key] ?? fallback ?? key;
}

/**
 * Texte im DOM updaten
 *  - data-i18n  → innerText
 *  - data-i18n-placeholder → placeholder
 */
function applyTranslations(root = document) {
  if (!root || !root.querySelectorAll) return;

  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const value = t(key);
    if (value != null) el.textContent = value;
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const value = t(key);
    if (value != null) el.setAttribute("placeholder", value);
  });
}

/**
 * Liefert eine zufällige Spielidee in der aktuellen Sprache
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

const I18N = {
  init,
  setLanguage,
  getLanguage,
  t,
  applyTranslations,
  getRandomPlayIdea
};

// Für dein aktuelles app.js (nutzt window.I18N)
if (typeof window !== "undefined") {
  window.I18N = I18N;
}

// ES-Module-Exports (falls du später direkt importieren willst)
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