// js/i18n.js
// ======================================================
// Schlankes I18N-Modul für Family Spots Map
// Lädt de/en JSON und stellt init, setLanguage, getLanguage, t, getRandomPlayIdea bereit.
// ======================================================

"use strict";

const LANG_DE = "de";
const LANG_EN = "en";

const LANGUAGE_FILES = {
  de: "data/i18n/de.json?v=9",
  en: "data/i18n/en.json?v=9"
};

// Optional – Spielideen
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
  // alles andere fällt auf "de" zurück
  return LANG_DE;
}

/**
 * Sprachdatei laden.
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
 * Spielideen laden (optional).
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
    console.warn("[I18N] Could not load play ideas:", err);
  }
}

/**
 * Initialisierung – aus app.js bei DOMContentLoaded.
 */
async function init() {
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
 * Sprache setzen.
 */
function setLanguage(lang) {
  state.lang = normalizeLang(lang);
  // optional: html lang synchronisieren
  // document.documentElement.lang = state.lang;
}

/**
 * Aktuelle Sprache holen.
 */
function getLanguage() {
  return state.lang;
}

/**
 * Übersetzung holen – fällt auf Key zurück, wenn nichts gefunden.
 */
function t(key) {
  const dict = state.translations[state.lang] || {};
  if (Object.prototype.hasOwnProperty.call(dict, key)) {
    return dict[key];
  }
  return key;
}

/**
 * Zufällige Spielidee.
 */
function getRandomPlayIdea() {
  if (!state.playIdeas || !state.playIdeas.length) return "";

  const items = state.playIdeas;
  const idx = Math.floor(Math.random() * items.length);
  const item = items[idx];

  if (typeof item === "string") return item;

  const byLang = item[state.lang];
  if (typeof byLang === "string") return byLang;
  if (typeof item.text === "string") return item.text;

  return "";
}

// Globale Fassade wie bisher (für alten Code)
const I18N = {
  init,
  setLanguage,
  getLanguage,
  t,
  getRandomPlayIdea
};
window.I18N = I18N;

// ES-Module-Exports – für alle Import-Varianten
export { init, setLanguage, getLanguage, t, getRandomPlayIdea };
export default I18N;