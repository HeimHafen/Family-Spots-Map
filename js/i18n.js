// js/i18n.js
// Zentrale I18N-Logik + globale I18N-Fassade für app.js

let currentLang = "de";
let messages = {};

const FALLBACK_LANG = "de";
const SUPPORTED_LANGS = ["de", "en"];

function normalizeLang(lang) {
  if (!lang) return FALLBACK_LANG;
  const short = String(lang).toLowerCase().slice(0, 2);
  return SUPPORTED_LANGS.includes(short) ? short : FALLBACK_LANG;
}

export function getLanguage() {
  return currentLang;
}

/**
 * Lädt die passende i18n-JSON und setzt currentLang.
 */
export async function initI18n(lang) {
  const target = normalizeLang(lang || currentLang || FALLBACK_LANG);
  try {
    const res = await fetch(`data/i18n/${target}.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error("i18n load failed: " + res.status);
    messages = await res.json();
    currentLang = target;

    // HTML lang-Attribut mitziehen
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.setAttribute("lang", target);
    }
  } catch (err) {
    console.error("[Family Spots] i18n error:", err);
    if (target !== FALLBACK_LANG) {
      // Fallback auf Deutsch
      return initI18n(FALLBACK_LANG);
    }
    // Im absoluten Fehlerfall keine Messages, aber App bleibt nutzbar
    messages = {};
  }
}

/**
 * Übersetzung holen.
 */
export function t(key, fallback) {
  return messages[key] ?? fallback ?? key;
}

/**
 * data-i18n / data-i18n-placeholder im DOM setzen.
 * (Falls du das später nutzen willst.)
 */
export function applyTranslations(root = document) {
  if (!root) return;

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
 * Kleine Convenience-Init, wird von app.js über I18N.init() verwendet.
 * Lädt einfach aktuelle Sprache und wendet ggf. data-i18n an.
 */
export async function init(lang) {
  await initI18n(lang);
  if (typeof document !== "undefined") {
    applyTranslations(document);
  }
}

/**
 * Sprache wechseln – wird von app.js über I18N.setLanguage(lang) aufgerufen.
 */
export async function setLanguage(lang) {
  const target = normalizeLang(lang);
  if (target === currentLang) return;
  await initI18n(target);
  if (typeof document !== "undefined") {
    applyTranslations(document);
  }
}

/**
 * Zufällige Spielidee aus der i18n-Datei holen.
 * Erwartet in data/i18n/*.json z.B.:
 * { "playIdeas": ["Idee 1", "Idee 2", ...] }
 */
export function getRandomPlayIdea() {
  const list = messages.playIdeas || messages.play_ideas;
  if (Array.isArray(list) && list.length) {
    const idx = Math.floor(Math.random() * list.length);
    return list[idx];
  }
  return "";
}

/**
 * Globale Fassade für den bestehenden Code in app.js
 * (app.js importiert i18n.js nur wegen der Side-Effects)
 */
const I18N = {
  init,
  t,
  setLanguage,
  getLanguage,
  getRandomPlayIdea,
  applyTranslations
};

if (typeof window !== "undefined") {
  window.I18N = I18N;
}

export default I18N;