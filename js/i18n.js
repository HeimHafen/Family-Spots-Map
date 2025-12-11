// js/i18n.js
// --------------------------------------
// Family Spots Map – i18n / Spielideen
// ABF 2026 Edition:
//  - gleiche i18n-Logik wie die Basis-App
//  - ABF-spezifische Texte in data/i18n/*.json
//  - ABF-spezifische Spielideen optional in
//    data/play-ideas-abf.json (Fallback: play-ideas.json)
// --------------------------------------

"use strict";

/**
 * Unterstützte Sprachen & Defaults
 * ---------------------------------- */

/** @type {readonly ["de", "en", "da"]} */
const SUPPORTED_LANGS = ["de", "en", "da"];
/** @type {const} */
const DEFAULT_LANG = "de";
/** @type {const} */
const STORAGE_LANG_KEY = "fs_lang";

/** @typedef {"de" | "en" | "da"} LangCode */

/** @type {LangCode} */
let currentLang = DEFAULT_LANG;

/**
 * messagesByLang[lang] = { key: "Übersetzung" }
 * @type {Record<LangCode, Record<string, string>>}
 */
const messagesByLang = {
  de: {},
  en: {},
  da: {}
};

/**
 * Spielideen-Struktur (aus data/play-ideas-abf.json oder data/play-ideas.json):
 * [
 *   { id: string, texts: { de?: string, en?: string, da?: string }, ... },
 *   ...
 * ]
 * Wir unterstützen sowohl dieses Schema mit `texts` als auch
 * ein älteres flaches Schema ({ de, en, da }).
 * @type {Array<any>}
 */
let playIdeas = [];

/** Index der zuletzt ausgegebenen Spielidee (zur Entdopplung). */
let lastPlayIdeaIndex = -1;

/* --------------------------------------
 * Helpers
 * ----------------------------------- */

/**
 * JSON-Parsing mit Fallback.
 * @template T
 * @param {string|null} raw
 * @param {T} fallback
 * @returns {T}
 */
function safeParseJson(raw, fallback) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed === "object") {
      return /** @type {T} */ (parsed);
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Normalisiert eine Sprache auf "de", "en" oder "da".
 * Alles außer "en" und "da" wird bewusst auf "de" gefaltet.
 * @param {string | null | undefined} lang
 * @returns {LangCode}
 */
function normalizeLang(lang) {
  if (!lang) return "de";

  const v = String(lang).toLowerCase();

  if (v.startsWith("en")) return "en";
  if (v === "da" || v.startsWith("da") || v === "dk" || v.startsWith("dk")) {
    return "da";
  }

  return "de";
}

/**
 * Sprache aus localStorage holen (falls gültig).
 * @returns {LangCode | null}
 */
function getStoredLang() {
  try {
    if (typeof localStorage === "undefined") return null;
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
    const code = normalizeLang(String(value));
    if (SUPPORTED_LANGS.includes(code)) {
      return code;
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
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_LANG_KEY, currentLang);
    }
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
 * Lädt Spielideen.
 * ABF 2026:
 *  - bevorzugt data/play-ideas-abf.json (messe-/abf-bezogen)
 *  - Fallback auf data/play-ideas.json (generische Ideen)
 */
async function loadPlayIdeas() {
  if (playIdeas.length) return;

  async function loadFrom(url) {
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) {
      throw new Error(`play-ideas load failed (${url}, HTTP ${res.status})`);
    }
    const json = await res.json();
    if (!Array.isArray(json)) {
      throw new Error("play-ideas file is not an array");
    }
    return json;
  }

  try {
    // 1. ABF-spezifische Datei
    playIdeas = await loadFrom("data/play-ideas-abf.json");
    console.info("[i18n] Spielideen aus data/play-ideas-abf.json geladen.");
  } catch (errAbf) {
    console.warn(
      "[i18n] Konnte ABF-Spielideen nicht laden, versuche Fallback:",
      errAbf
    );
    try {
      // 2. Fallback auf generische Datei
      playIdeas = await loadFrom("data/play-ideas.json");
      console.info("[i18n] Spielideen aus data/play-ideas.json geladen.");
    } catch (errGeneric) {
      console.error(
        "[i18n] Fehler beim Laden der Spielideen (Fallback):",
        errGeneric
      );
      playIdeas = [];
    }
  }
}

/* --------------------------------------
 * Public API
 * ----------------------------------- */

/**
 * Initialisiert i18n:
 *  - lädt de/en/da Übersetzungen
 *  - lädt Spielideen (ABF-spezifische, sonst generische)
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
    loadMessagesForLang("da"),
    loadPlayIdeas()
  ]);

  setLangInternal(target);
  applyTranslations(typeof document !== "undefined" ? document : undefined);
}

/**
 * Sprache wechseln (de/en/da) und DOM aktualisieren.
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
 * Unterstützt sowohl:
 *   { texts: { de, en, da } }
 * als auch das ältere Schema:
 *   { de, en, da }
 * Versucht, nicht zweimal dieselbe Idee direkt hintereinander zu liefern.
 *
 * @returns {string}
 */
function getRandomPlayIdea() {
  if (!playIdeas.length) return "";

  let idx;
  if (playIdeas.length === 1) {
    idx = 0;
  } else {
    let tries = 0;
    do {
      idx = Math.floor(Math.random() * playIdeas.length);
      tries++;
    } while (idx === lastPlayIdeaIndex && tries < 5);
  }

  lastPlayIdeaIndex = idx;
  const idea = playIdeas[idx];
  if (!idea || typeof idea !== "object") return "";

  // Neues Schema: idea.texts.{de,en,da}, sonst flach {de,en,da}
  const texts =
    (idea.texts && typeof idea.texts === "object" ? idea.texts : null) || idea;

  /** @type {Array<LangCode>} */
  const langOrder = [currentLang, "de", "en", "da"];

  for (const code of langOrder) {
    if (texts[code]) {
      return texts[code];
    }
  }

  return "";
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