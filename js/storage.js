// js/storage.js

// ------------------------
// Keys & Default-Settings
// ------------------------

const SETTINGS_KEY = "fsm.settings.v1";
const FAV_KEY = "fsm.favorites.v1";
const PLUS_KEY = "fsm.plus.v1";

// Neu: Moments-Key
const MOMENTS_KEY = "fsm.moments.v1";

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
        // Abgelaufen oder ungültig -> zurück auf Default
        return { ...defaultPlusStatus };
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
    (id) => typeof id === "string" && id.trim() !== "",
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

// ------------------------
// Familien-Momente
// ------------------------

function getAllMoments() {
  try {
    const raw = localStorage.getItem(MOMENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAllMoments(list) {
  const safe = Array.isArray(list) ? list : [];
  try {
    localStorage.setItem(MOMENTS_KEY, JSON.stringify(safe));
  } catch {
    // ignorieren – Privacy-Mode / Speicher voll
  }
}

/**
 * Liefert alle gespeicherten Momente für einen Spot.
 *
 * @param {string} spotId
 * @returns {Array<{id:string,spotId:string,note:string,createdAt:string}>}
 */
export function getMomentsForSpot(spotId) {
  if (!spotId) return [];
  const all = getAllMoments();
  return all.filter((m) => m && m.spotId === String(spotId));
}

/**
 * Fügt einen neuen Moment für einen Spot hinzu.
 * Gibt die aktualisierte Liste der Momente für diesen Spot zurück.
 *
 * @param {string} spotId
 * @param {string} note
 * @returns {Array}
 */
export function addMomentForSpot(spotId, note) {
  if (!spotId || !note || !note.trim()) {
    return getMomentsForSpot(spotId);
  }

  const all = getAllMoments();
  const entry = {
    id: String(Date.now()) + "-" + Math.random().toString(36).slice(2),
    spotId: String(spotId),
    note: String(note).trim(),
    createdAt: new Date().toISOString(),
  };

  all.push(entry);
  saveAllMoments(all);

  return all.filter((m) => m && m.spotId === String(spotId));
}