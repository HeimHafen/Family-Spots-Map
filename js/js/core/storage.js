// js/core/storage.js
// Persistente Speicherung von Einstellungen, Favoriten und Plus-Status

// ------------------------
// LocalStorage Keys & Defaults
// ------------------------

const SETTINGS_KEY = "fsm.settings.v1";
const FAV_KEY = "fsm.favorites.v1";
const PLUS_KEY = "fsm.plus.v1";

const defaultSettings = {
  language: "de",
  theme: "light",
};

const defaultPlusStatus = {
  active: false,
  code: null,
  plan: null,
  partner: null,
  source: null,
  activatedAt: null,
  expiresAt: null,
};

// ------------------------
// Settings (Sprache & Theme)
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
    // kann z. B. im Privacy-Modus fehlschlagen – einfach ignorieren
  }
}

// ------------------------
// Plus-Status
// ------------------------

export function getPlusStatus() {
  try {
    const raw = localStorage.getItem(PLUS_KEY);
    if (!raw) return { ...defaultPlusStatus };

    const parsed = JSON.parse(raw);
    const merged = { ...defaultPlusStatus, ...parsed };

    if (merged.expiresAt) {
      const exp = new Date(merged.expiresAt);
      const now = new Date();
      if (isNaN(exp.getTime()) || exp <= now) {
        return { ...defaultPlusStatus }; // abgelaufen
      }
    }

    return merged;
  } catch {
    return { ...defaultPlusStatus };
  }
}

export function savePlusStatus(status) {
  const merged = { ...defaultPlusStatus, ...status, active: true };
  try {
    localStorage.setItem(PLUS_KEY, JSON.stringify(merged));
  } catch {
    // ignorieren
  }
  return merged;
}

export function clearPlusStatus() {
  try {
    localStorage.removeItem(PLUS_KEY);
  } catch {
    // ignorieren
  }
  return { ...defaultPlusStatus };
}

// Kompatibilitäts-Aliase für ältere Imports
export const getPlusStatusFromStorage = getPlusStatus;
export const savePlusStatusToStorage = savePlusStatus;

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