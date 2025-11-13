// js/storage.js

// ------------------------
// Keys & Default-Settings
// ------------------------

const SETTINGS_KEY = "fsm.settings.v1";
const FAV_KEY = "fsm.favorites.v1";

const defaultSettings = {
  language: "de",
  theme: "light"
};

// ------------------------
// Settings (Sprache/Theme)
// ------------------------

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignorieren – z. B. Privacy-Mode
  }
}

// ------------------------
// Favoriten
// ------------------------

export function getFavorites() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setFavorites(ids) {
  const unique = Array.from(new Set(ids)).filter(
    (id) => typeof id === "string" && id.trim() !== ""
  );
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(unique));
  } catch {
    // ignorieren
  }
  return unique;
}

export function toggleFavorite(id) {
  const current = new Set(getFavorites());
  if (current.has(id)) {
    current.delete(id);
  } else {
    current.add(id);
  }
  return setFavorites(Array.from(current));
}