// js/i18n.js
// --------------------------------------
// Family Spots Map – i18n / Spielideen
// --------------------------------------

// Unterstützte Sprachen
const SUPPORTED_LANGS = ["de", "en"];
const STORAGE_LANG_KEY = "fs_lang";

// Aktuelle Sprache
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

/**
 * Normalisiert die Sprache auf "de" oder "en".
 * @param {string} lang
 * @returns {"de"|"en"}
 */
function normalizeLang(lang) {
  return lang === "en" ? "en" : "de";
}

/**
 * Sprache aus localStorage holen (falls gültig).
 * @returns {"de"|"en"|null}
 */
function getStoredLang() {
  try {
    const stored = localStorage.getItem(STORAGE_LANG_KEY);
    if (SUPPORTED_LANGS.includes(stored)) return stored;
  } catch (_) {
    // Ignorieren – Fallback greift unten
  }
  return null;
}

/**
 * Sprache aus dem Browser ableiten.
 * @returns {"de"|"en"|null}
 */
function detectBrowserLang() {
  if (typeof navigator === "undefined") return null;
  const nav = (navigator.language || "").toLowerCase().slice(0, 2);
  return SUPPORTED_LANGS.includes(nav) ? nav : null;
}

/**
 * Interne Setter-Logik, inkl. Persistenz & lang-Attribut auf <html>.
 * @param {string} lang
 */
function setLangInternal(lang) {
  currentLang = normalizeLang(lang || "de");
  try {
    localStorage.setItem(STORAGE_LANG_KEY, currentLang);
  } catch (_) {
    // Storage ist optional – App funktioniert trotzdem
  }
  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.setAttribute("lang", currentLang);
  }
}

/* --------------------------------------
 * Laden von Übersetzungen & Spielideen
 * ----------------------------------- */

/**
 * Lädt die JSON-Übersetzungen für eine Sprache (falls noch nicht geladen).
 * Erwartet Datei: data/i18n/<lang>.json
 * @param {"de"|"en"} lang
 */
async function loadMessagesForLang(lang) {
  const target = normalizeLang(lang);

  // Bereits geladen?
  if (Object.keys(messagesByLang[target] || {}).length > 0) return;

  try {
    const res = await fetch(`data/i18n/${target}.json`);
    if (!res.ok) {
      throw new Error(`i18n load failed: ${target} (${res.status})`);
    }
    const json = await res.json();
    messagesByLang[target] = json || {};
  } catch (err) {
    console.error("[i18n] Fehler beim Laden der Sprache", target, err);
    // Fallback: leere Tabelle (damit t() weiter nutzbar bleibt)
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
    const res = await fetch("data/play-ideas.json");
    if (!res.ok) throw new Error(`play-ideas load failed (${res.status})`);
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
 *  - aktualisiert DOM (data-i18n / data-i18n-placeholder)
 *
 * @param {"de"|"en"} [lang] – optionaler Override
 */
async function init(lang) {
  const stored = getStoredLang();
  const browser = detectBrowserLang();
  const target = normalizeLang(lang || stored || browser || "de");

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
 * Sprache wechseln (de/en) + DOM aktualisieren.
 * @param {"de"|"en"} lang
 */
function setLanguage(lang) {
  setLangInternal(lang);
  applyTranslations(typeof document !== "undefined" ? document : undefined);
}

/**
 * Aktuelle Sprache holen.
 * @returns {"de"|"en"}
 */
function getLanguage() {
  return currentLang;
}

/**
 * Übersetzungsfunktion.
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
 * Texte im DOM updaten
 *  - data-i18n → textContent
 *  - data-i18n-placeholder → placeholder
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