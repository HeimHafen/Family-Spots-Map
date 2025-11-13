const SETTINGS_KEY = "fsm.settings.v1";
const FAV_KEY = "fsm.favorites.v1";

const defaultSettings = {
  language: "de",
  theme: "light"
};

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaultSettings };
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return { ...defaultSettings };
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function getFavorites() {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function setFavorites(ids) {
  const unique = Array.from(new Set(ids));
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(unique));
  } catch {
    // ignore
  }
  return unique;
}

export function toggleFavorite(id) {
  const set = new Set(getFavorites());
  if (set.has(id)) set.delete(id);
  else set.add(id);
  return setFavorites(Array.from(set));
}

export function isFavorite(id) {
  return getFavorites().includes(id);
}