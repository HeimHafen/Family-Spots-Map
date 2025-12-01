// js/data.js
// ------------------------------------------------------
// Daten-Layer für Spots & Index
//  - nutzt data/dataLoader.js zum Einlesen
//  - kümmert sich um Offline-Cache in localStorage
// ------------------------------------------------------

"use strict";

import { SPOTS_CACHE_KEY } from "./config.js";
import { loadAppData } from "./data/dataLoader.js";

/** @typedef {import("./app.js").Spot} Spot */

// Modulinterner Zustand
/** @type {Spot[]} */
let spots = [];
let indexData = null;

/**
 * Cache aus localStorage lesen.
 * Akzeptiert sowohl ein reines Array als auch { spots: [...] }.
 */
function loadSpotsFromCache() {
  try {
    const stored = localStorage.getItem(SPOTS_CACHE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.spots)) return parsed.spots;

    return null;
  } catch {
    return null;
  }
}

/** Spots im Cache speichern */
function saveSpotsToCache(spotsToSave) {
  try {
    localStorage.setItem(SPOTS_CACHE_KEY, JSON.stringify(spotsToSave));
  } catch {
    // egal – App funktioniert auch ohne Cache
  }
}

/**
 * Hilfsfunktion: Position aus verschiedenen Feldern lesen
 */
function extractLatLng(source) {
  if (!source) return { lat: undefined, lng: undefined };

  let { lat, lng, lon } = source;

  if (lat == null) lat = source.latitude;
  if (lng == null) lng = source.longitude;
  if (lng == null && lon != null) lng = lon;

  if (typeof lat === "string") lat = parseFloat(lat);
  if (typeof lng === "string") lng = parseFloat(lng);

  if (typeof lat !== "number" || Number.isNaN(lat)) lat = undefined;
  if (typeof lng !== "number" || Number.isNaN(lng)) lng = undefined;

  return { lat, lng };
}

/**
 * Lädt die App-Daten (Index + Spots).
 *  - bevorzugt Netzwerk (dataLoader)
 *  - bei Fehlern: Fallback auf localStorage-Cache
 *
 * Rückgabe: { spots, index, fromCache, error? }
 */
export async function loadData() {
  // Bereits geladen? Dann direkt liefern.
  if (spots.length && indexData) {
    return { spots, index: indexData, fromCache: false };
  }

  try {
    const appData = await loadAppData();
    indexData = appData.index || null;

    const rawSpots = Array.isArray(appData.spots) ? appData.spots : [];

    // In ein Format bringen, das zu map.js / filters.js passt
    spots = rawSpots.map((s) => {
      const raw = s.raw || s;

      // Position aus s.location, s selbst oder raw auslesen
      const fromLocation = extractLatLng(s.location || raw.location || {});
      const fromSelf = extractLatLng(s);
      const fromRaw = extractLatLng(raw);

      const lat = fromLocation.lat ?? fromSelf.lat ?? fromRaw.lat;
      const lng = fromLocation.lng ?? fromSelf.lng ?? fromRaw.lng;

      return {
        ...raw,
        ...s,
        lat,
        lng
      };
    });

    saveSpotsToCache(spots);

    return { spots, index: indexData, fromCache: false };
  } catch (err) {
    // Fallback: Cache
    const cached = loadSpotsFromCache();
    if (cached && cached.length) {
      spots = cached;
      return { spots, index: indexData, fromCache: true, error: err };
    }

    // Kein Cache → Fehler nach oben durchreichen
    throw err;
  }
}

/** Aktuell geladene Spots zurückgeben */
export function getSpots() {
  return spots;
}

/** Index-Daten (z.B. defaultLocation), falls du sie später brauchst */
export function getIndexData() {
  return indexData;
}