// js/data.js

// Hier werden alle App-Daten geladen und normalisiert.
// WICHTIG: Es wird ausschließlich aus data/index.json und data/spots.json geladen.
// Keine Demo-Spots, keine zweite Quelle.

let appData = {
  index: null,
  spots: [],
};

/**
 * Lädt die App-Daten (Index + Spots) und normalisiert die Struktur.
 * Erwartet:
 *  - data/index.json  (mit u.a. defaultLocation, defaultZoom)
 *  - data/spots.json  (mit { spots: [ { ... } ] } – so wie du sie geschickt hast)
 */
export async function loadAppData() {
  // Wenn bereits geladen: direkt zurückgeben
  if (appData.index && appData.spots && appData.spots.length > 0) {
    return appData;
  }

  const [indexRes, spotsRes] = await Promise.all([
    fetch("data/index.json"),
    fetch("data/spots.json"),
  ]);

  if (!indexRes.ok) {
    throw new Error("Konnte data/index.json nicht laden");
  }
  if (!spotsRes.ok) {
    throw new Error("Konnte data/spots.json nicht laden");
  }

  const indexJson = await indexRes.json();
  const spotsJson = await spotsRes.json();

  const rawSpots = Array.isArray(spotsJson.spots) ? spotsJson.spots : [];

  // 🔴 Hier werden deine Roh-Spots (lat/lon, title, …) in das Format
  // gebracht, das die Karte & UI verwenden.
  const normalizedSpots = rawSpots
    .filter((raw) => !!raw && !!raw.id)
    .map((raw) => {
      const lat =
        raw.lat ??
        raw.latitude ??
        (raw.location && raw.location.lat != null
          ? raw.location.lat
          : null);
      const lon =
        raw.lon ??
        raw.lng ??
        raw.longitude ??
        (raw.location && raw.location.lng != null
          ? raw.location.lng
          : null);

      const location =
        lat != null && lon != null ? { lat: Number(lat), lng: Number(lon) } : null;

      return {
        id: String(raw.id),
        // Name/Titel
        name: raw.name || raw.title || "",
        title: raw.title || raw.name || "",
        // Ort / Land
        city: raw.city || "",
        country: raw.country || "",
        // Kategorien/TAGS
        categories: Array.isArray(raw.categories) ? raw.categories : [],
        tags: Array.isArray(raw.tags) ? raw.tags : [],
        // Verifiziert
        verified: Boolean(raw.verified),
        // Besuchsdauer
        visit_minutes:
          raw.visit_minutes != null
            ? Number(raw.visit_minutes)
            : raw.visitMinutes != null
            ? Number(raw.visitMinutes)
            : null,
        // Freitexte
        poetry: raw.poetry || "",
        address: raw.address || "",
        summary_de: raw.summary_de || "",
        summary_en: raw.summary_en || "",
        visitLabel_de: raw.visitLabel_de || "",
        visitLabel_en: raw.visitLabel_en || "",
        // Plus-Flag optional
        plus_only: Boolean(raw.plus_only),
        // Normalisierte Location für Map & Routenlinks
        location,
        // Falls wir später noch mehr brauchen:
        raw,
      };
    });

  appData = {
    index: {
      defaultLocation:
        indexJson.defaultLocation || { lat: 52.0, lng: 10.0 },
      defaultZoom: indexJson.defaultZoom || 6,
      ...indexJson,
    },
    spots: normalizedSpots,
  };

  // Debug-Hilfe in der Konsole:
  // console.log("Anzahl Spots aus data/spots.json:", normalizedSpots.length);

  return appData;
}

/**
 * Gibt alle normalisierten Spots zurück.
 */
export function getSpots() {
  return appData.spots || [];
}

/**
 * Liefert alle Kategorien, die in den Spots vorkommen,
 * optional sortiert.
 */
export function getCategories() {
  const set = new Set();
  for (const spot of appData.spots || []) {
    if (Array.isArray(spot.categories)) {
      for (const c of spot.categories) {
        if (c) set.add(c);
      }
    }
  }
  return Array.from(set).sort();
}

/**
 * Sucht einen Spot anhand der ID.
 */
export function findSpotById(id) {
  if (!id || !appData.spots) return null;
  return appData.spots.find((s) => s.id === id) || null;
}