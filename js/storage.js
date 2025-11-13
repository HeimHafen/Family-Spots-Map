const FAVORITES_KEY = "familySpots:favorites";

function supportsLocalStorage() {
  try {
    const testKey = "__fs_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (_err) {
    return false;
  }
}

function normaliseIds(ids) {
  if (!Array.isArray(ids)) {
    return [];
  }

  const unique = new Set();

  ids.forEach((id) => {
    if (typeof id === "string" && id.trim() !== "") {
      unique.add(id.trim());
    }
  });

  return Array.from(unique);
}

/**
 * Lädt die Favoriten-Spot-IDs aus localStorage.
 *
 * @returns {string[]} Array mit Spot-IDs.
 */
export function loadFavorites() {
  if (!supportsLocalStorage()) {
    return [];
  }

  const raw = window.localStorage.getItem(FAVORITES_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return normaliseIds(parsed);
    }

    if (parsed && Array.isArray(parsed.favorites)) {
      return normaliseIds(parsed.favorites);
    }

    return [];
  } catch (_err) {
    return [];
  }
}

/**
 * Speichert die Favoriten-Spot-IDs in localStorage.
 *
 * @param {string[]} favorites
 */
export function saveFavorites(favorites) {
  if (!supportsLocalStorage()) {
    return;
  }

  const ids = normaliseIds(favorites);
  const payload = JSON.stringify(ids);

  window.localStorage.setItem(FAVORITES_KEY, payload);
}

/**
 * Erstellt einen teilbaren JSON-String aus einer Favoritenliste.
 *
 * @param {string[]} favorites
 * @returns {string}
 */
export function exportFavoritesToString(favorites) {
  const ids = normaliseIds(favorites);

  const payload = {
    v: 1,
    favorites: ids,
    generatedAt: new Date().toISOString(),
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Liest Favoriten aus einem importierten JSON-String.
 * Akzeptiert entweder ["id1","id2"] oder { "favorites": ["id1","id2"] }.
 *
 * @param {string} input
 * @returns {string[]} Importierte Spot-IDs oder [] bei Fehler.
 */
export function importFavoritesFromString(input) {
  if (typeof input !== "string" || input.trim() === "") {
    return [];
  }

  try {
    const data = JSON.parse(input);

    if (Array.isArray(data)) {
      return normaliseIds(data);
    }

    if (data && Array.isArray(data.favorites)) {
      return normaliseIds(data.favorites);
    }

    return [];
  } catch (_err) {
    return [];
  }
}