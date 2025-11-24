// storage.js
import { favorites, currentLang, currentTheme, plusActive } from './state.js';
import { LANG_DE, LANG_EN, THEME_LIGHT, THEME_DARK } from './state.js';

const FAVORITES_KEY = "fs_favorites";
const LANG_KEY = "fs_lang";
const THEME_KEY = "fs_theme";
const PLUS_STORAGE_KEY = "fs_plus_active";

export function loadFavoritesFromStorage() {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (!stored) return;
    const arr = JSON.parse(stored);
    if (Array.isArray(arr)) { 
      favorites.clear();
      arr.forEach(id => favorites.add(id));
    }
  } catch (err) {
    console.warn("[Family Spots] Could not load favorites:", err);
  }
}

export function saveFavoritesToStorage() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
  } catch (err) {
    console.warn("[Family Spots] Could not save favorites:", err);
  }
}

export function loadLangFromStorage() {
  const stored = localStorage.getItem(LANG_KEY);
  if (stored === LANG_DE || stored === LANG_EN) {
    return stored;
  }
  return null;
}

export function saveLangToStorage(lang) {
  localStorage.setItem(LANG_KEY, lang);
}

export function loadThemeFromStorage() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === THEME_LIGHT || stored === THEME_DARK) {
    return stored;
  }
  return null;
}

export function saveThemeToStorage(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

export function loadPlusStateFromStorage() {
  try {
    return localStorage.getItem(PLUS_STORAGE_KEY) === "1";
  } catch (err) {
    console.warn("[Family Spots] Could not load plus state:", err);
    return false;
  }
}

export function savePlusStateToStorage(active) {
  try {
    localStorage.setItem(PLUS_STORAGE_KEY, active ? "1" : "0");
  } catch (err) {
    console.warn("[Family Spots] Could not save plus state:", err);
  }
}