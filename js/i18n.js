// js/i18n.js
// ======================================================
// Sehr schlankes I18N-Modul für Family Spots Map
// Lädt de/en JSON und stellt I18N.init, I18N.setLanguage, I18N.t etc.
// ======================================================

"use strict";

const LANG_DE = "de";
const LANG_EN = "en";

const LANGUAGE_FILES = {
  de: "data/i18n/de.json?v=9",
  en: "data/i18n/en.json?v=9"
};

// Optional – wenn du später Spielideen aus JSON laden willst
const PLAY_IDEAS_FILE = "data/play-ideas.json?v=1";

const state = {
  lang: LANG_DE,
  translations: {
    de: {},
    en: {}
  },
  playIdeas: []
};

/**
 * Sprache normalisieren (immer nur "de" oder "en").
 */
function normalizeLang(lang) {
  const lower = (lang || "").toLowerCase();
  if (lower.startsWith("en")) return LANG_EN;
  return LANG_DE;
}

/**
 * Lade eine Sprachdatei und speichere sie in state.translations.
 */
async function loadLanguage(lang) {
  const normalized = normalizeLang(lang);
  const url = LANGUAGE_FILES[normalized];
  if (!url) return;

  try {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) {
      console.warn("[I18N] Could not load", url, "Status:", res.status);
      return;
    }
    const json = await res.json();
    if (json && typeof json === "object") {
      state.translations[normalized] = json;
    }
  } catch (err) {
    console.warn("[I18N] Error loading language file:", url, err);
  }
}

/**
 * Optional: Spielideen laden (wenn Datei existiert).
 * Struktur kann z.B. sein: [{ de: "...", en: "..." }, ...] oder einfache Strings.
 */
async function loadPlayIdeas() {
  try {
    const res = await fetch(PLAY_IDEAS_FILE, { cache: "no-cache" });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) {
      state.playIdeas = data;
    }
  } catch (err) {
    // Ist optional – kein harter Fehler
    console.warn("[I18N] Could not load play ideas:", err);
  }
}

/**
 * Initialisierung – wird aus app.js bei DOMContentLoaded aufgerufen.
 * Lädt beide Sprachdateien vor, damit Umschalten sofort funktioniert.
 */
async function init() {
  // Sprache aus localStorage / Browser ableiten
  const stored = localStorage.getItem("fs_lang");
  const fallback =
    (document.documentElement.lang || navigator.language || "de").toLowerCase();
  const initialLang = normalizeLang(stored || fallback);

  await Promise.all([
    loadLanguage("de"),
    loadLanguage("en"),
    loadPlayIdeas()
  ]);

  state.lang = initialLang;
}

/**
 * Sprache setzen – app.js ruft das aus setLanguage() heraus auf.
 */
function setLanguage(lang) {
  state.lang = normalizeLang(lang);
}

/**
 * Übersetzung holen.
 * Wenn kein Eintrag vorhanden ist, wird der Key selbst zurückgegeben.
 */
function t(key) {
  const dict = state.translations[state.lang] || {};
  if (Object.prototype.hasOwnProperty.call(dict, key)) {
    return dict[key];
  }
  return key;
}

/**
 * Zufällige Spielidee – wird von app.js über getRandomPlayIdea() genutzt.
 */
function getRandomPlayIdea() {
  if (!state.playIdeas || !state.playIdeas.length) return "";

  const items = state.playIdeas;
  const idx = Math.floor(Math.random() * items.length);
  const item = items[idx];

  if (typeof item === "string") return item;

  // Objekt – erwarte Felder de/en oder text
  const byLang = item[state.lang];
  if (typeof byLang === "string") return byLang;
  if (typeof item.text === "string") return item.text;

  return "";
}

// Globale Fassade, die app.js nutzt
window.I18N = {
  init,
  setLanguage,
  t,
  getRandomPlayIdea
};

// Damit die Datei als ES-Modul behandelt wird
export {};