// i18n.js
import { LANG_DE, LANG_EN } from './state.js';

// UI_STRINGS and other constants would live here
export const UI_STRINGS = {
  de: { /* your German strings */ },
  en: { /* your English strings */ }
};

export function t(currentLang, key) {
  const table = UI_STRINGS[currentLang] || UI_STRINGS[LANG_DE];
  return table[key] || key;
}

export function getInitialLang() {
  const stored = localStorage.getItem("fs_lang");
  if (stored === LANG_DE || stored === LANG_EN) return stored;

  const htmlLang = (document.documentElement.lang || navigator.language || LANG_DE)
                      .toLowerCase()
                      .slice(0, 2);
  return htmlLang === LANG_EN ? LANG_EN : LANG_DE;
}