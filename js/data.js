// js/data.js

// Zentrale Struktur für App-Daten
let appData = {
  index: null,
  spots: []
};

/**
 * Lädt die App-Daten (Index + Spots) und normalisiert die Struktur.
 * Es werden ausschließlich folgende Dateien geladen:
 *   - data/index.json
 *   - data/spots.json (mit { "spots": [ ... ] } – deine 109 Spots)
 */
export async function loadAppData() {
  // Falls bereits geladen, nichts doppelt machen
  if (appData.index && appData.spots && appData.spots.length > 0) {
    return appData;
  }

  // index.json laden
  const indexRes = await fetch("data/index.json");
  if (!indexRes.ok) {
    throw new Error("Konnte data/index.json nicht laden");
  }
  const indexJson = await indexRes.json();

  // spots.json laden
  const spotsRes = await fetch("data/spots.json");
  if (!spotsRes.ok) {
    throw new Error("Konnte data/spots.json nicht laden");
  }
  const spotsJson = await spotsRes.json();

  const rawSpots = Array.isArray(spotsJson.spots) ? spotsJson.spots : [];

  const normalizedSpots = rawSpots
    .filter(function (raw) {
      return raw && raw.id;
    })
    .map(function (raw) {
      // Lat/Lon aus deinen Daten (lat / lon)
      let lat = null;
      let lng = null;

      if (raw.lat !== undefined && raw.lat !== null && raw.lat !== "") {
        lat = Number(raw.lat);
      } else if (raw.latitude !== undefined && raw.latitude !== null) {
        lat = Number(raw.latitude);
      } else if (raw.location && raw.location.lat !== undefined && raw.location.lat !== null) {
        lat = Number(raw.location.lat);
      }

      if (raw.lon !== undefined && raw.lon !== null && raw.lon !== "") {
        lng = Number(raw.lon);
      } else if (raw.lng !== undefined && raw.lng !== null && raw.lng !== "") {
        lng = Number(raw.lng);
      } else if (raw.longitude !== undefined && raw.longitude !== null) {
        lng = Number(raw.longitude);
      } else if (raw.location && raw.location.lng !== undefined && raw.location.lng !== null) {
        lng = Number(raw.location.lng);
      }

      var location = null;
      if (!isNaN(lat) && !isNaN(lng)) {
        location = { lat: lat, lng: lng };
      }

      // Normalisierter Spot für Karte, Filter & UI
      return {
        id: String(raw.id),

        // Name / Titel
        name: raw.name ? String(raw.name) : (raw.title ? String(raw.title) : ""),
        title: raw.title ? String(raw.title) : (raw.name ? String(raw.name) : ""),

        // Ort / Land
        city: raw.city ? String(raw.city) : "",
        country: raw.country ? String(raw.country) : "",

        // Kategorien
        categories: Array.isArray(raw.categories) ? raw.categories.slice() : [],

        // Tags
        tags: Array.isArray(raw.tags) ? raw.tags.slice() : [],

        // Verifiziert
        verified: !!raw.verified,

        // Besuchsdauer
        visit_minutes: (function () {
          if (raw.visit_minutes !== undefined && raw.visit_minutes !== null && raw.visit_minutes !== "") {
            return Number(raw.visit_minutes);
          }
          if (raw.visitMinutes !== undefined && raw.visitMinutes !== null && raw.visitMinutes !== "") {
            return Number(raw.visitMinutes);
          }
          return null;
        })(),

        // Freitexte
        poetry: raw.poetry ? String(raw.poetry) : "",
        address: raw.address ? String(raw.address) : "",
        summary_de: raw.summary_de ? String(raw.summary_de) : "",
        summary_en: raw.summary_en ? String(raw.summary_en) : "",
        visitLabel_de: raw.visitLabel_de ? String(raw.visitLabel_de) : "",
        visitLabel_en: raw.visitLabel_en ? String(raw.visitLabel_en) : "",

        // Plus-Flag optional
        plus_only: !!raw.plus_only,

        // Normalisierte Location für Map & Routing
        location: location,

        // Rohdaten für spätere Erweiterungen
        raw: raw
      };
    });

  appData = {
    index: {
      // sinnvolle Defaults, falls in index.json nicht gesetzt
      defaultLocation: indexJson.defaultLocation
        ? indexJson.defaultLocation
        : { lat: 52.0, lng: 10.0 },
      defaultZoom: indexJson.defaultZoom ? indexJson.defaultZoom : 6,
      // restliche Felder aus index.json weiterreichen
      ...indexJson
    },
    spots: normalizedSpots
  };

  // Debug (falls du testen willst): einfach kurz aktivieren
  // console.log("Spots geladen:", normalizedSpots.length);

  return appData;
}

/**
 * Gibt alle normalisierten Spots zurück.
 */
export function getSpots() {
  return appData.spots ? appData.spots : [];
}

/**
 * Liefert alle Kategorien, die in den Spots vorkommen (sortiert).
 */
export function getCategories() {
  const set = new Set();
  const spots = appData.spots ? appData.spots : [];

  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];
    if (spot && Array.isArray(spot.categories)) {
      for (let j = 0; j < spot.categories.length; j++) {
        const c = spot.categories[j];
        if (c) {
          set.add(c);
        }
      }
    }
  }

  return Array.from(set).sort();
}

/**
 * Sucht einen Spot anhand der ID.
 *
 * @param {string} id
 * @returns {Object|null}
 */
export function findSpotById(id) {
  if (!id || !appData.spots) {
    return null;
  }
  const spots = appData.spots;
  for (let i = 0; i < spots.length; i++) {
    const s = spots[i];
    if (s && s.id === id) {
      return s;
    }
  }
  return null;
}