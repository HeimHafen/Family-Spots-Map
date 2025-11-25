// js/i18n.js
// ----------------------------------------------------------
// Zentrales I18N-Modul für Family Spots Map
// - liefert ein globales I18N-Objekt, das app.js erwartet
// - lädt data/i18n/de.json und data/i18n/en.json
// - Methoden: init(), setLanguage(lang), t(key), getRandomPlayIdea()
// ----------------------------------------------------------

const SUPPORTED_LANGS = ["de", "en"];
const DEFAULT_LANG = "de";

const state = {
  currentLang: DEFAULT_LANG,
  /** @type {Record<string, any>} */
  messagesByLang: {}
};

/**
 * Interne Hilfsfunktion: lädt eine Sprachdatei, falls noch nicht geladen.
 * @param {"de"|"en"} lang
 */
async function loadLanguage(lang) {
  const target = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;

  if (state.messagesByLang[target]) {
    // schon geladen
    return;
  }

  try {
    const res = await fetch(`data/i18n/${target}.json`, { cache: "no-cache" });
    if (!res.ok) {
      throw new Error(`i18n: HTTP ${res.status} für Sprache ${target}`);
    }
    const json = await res.json();
    state.messagesByLang[target] = json || {};
  } catch (err) {
    console.error("[I18N] Konnte Sprachdatei nicht laden:", err);
    // Fallback: leeres Objekt, damit t() nicht crasht
    state.messagesByLang[target] = state.messagesByLang[target] || {};
  }
}

/**
 * Initialisierung: lädt alle unterstützten Sprachen vor.
 * app.js ruft danach noch einmal setLanguage() mit der gewünschten
 * Startsprache auf – d. h. die eigentliche Sprachauswahl
 * findet im restlichen Code statt.
 */
async function init() {
  await Promise.all(SUPPORTED_LANGS.map((lang) => loadLanguage(lang)));
}

/**
 * Setzt die aktuelle Sprache für t() & Co.
 * @param {"de"|"en"} lang
 */
function setLanguage(lang) {
  const target = SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
  state.currentLang = target;

  // HTML-lang-Attribut mitziehen (zusätzlich zu app.js)
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.setAttribute("lang", target);
  }
}

/**
 * Liefert die aktuelle Sprache.
 * @returns {"de"|"en"}
 */
function getLanguage() {
  return state.currentLang;
}

/**
 * Übersetzung eines Keys holen.
 * @param {string} key
 * @param {string} [fallback]
 * @returns {string}
 */
function t(key, fallback) {
  const dict = state.messagesByLang[state.currentLang] || {};
  const value = dict[key];
  if (value == null) {
    return fallback != null ? fallback : key;
  }
  return String(value);
}

/**
 * Optional: wendet [data-i18n] / [data-i18n-placeholder] an.
 * (app.js benutzt zusätzlich eigene data-i18n-de/en-Logik – das stört nicht.)
 * @param {Document|HTMLElement} [root]
 */
function applyTranslations(root = document) {
  if (!root) return;

  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    const value = t(key);
    if (value) el.textContent = value;
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (!key) return;
    const value = t(key);
    if (value) el.setAttribute("placeholder", value);
  });
}

/**
 * Liefert eine zufällige Spielidee auf Basis der aktuell geladenen Texte.
 * Erwartet im i18n-JSON ein Array unter dem Key "playIdeas".
 * @returns {string}
 */
function getRandomPlayIdea() {
  const dict = state.messagesByLang[state.currentLang] || {};
  const ideas = dict.playIdeas;

  if (!Array.isArray(ideas) || ideas.length === 0) {
    return "";
  }

  const idx = Math.floor(Math.random() * ideas.length);
  const idea = ideas[idx];
  return typeof idea === "string" ? idea : String(idea);
}

// ----------------------------------------------------------
// Globales I18N-Objekt bauen & exportieren
// ----------------------------------------------------------

const I18N = {
  init,
  setLanguage,
  getLanguage,
  t,
  applyTranslations,
  getRandomPlayIdea
};

// als ES-Module-Default-Export (falls man es direkt importieren will)
export default I18N;

// und zusätzlich als globale Variable, wie app.js es erwartet
if (typeof window !== "undefined") {
  window.I18N = I18N;
}
if (typeof globalThis !== "undefined") {
  globalThis.I18N = I18N;
}