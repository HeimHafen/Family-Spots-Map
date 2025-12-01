// js/data.js
// ---------------------------------------
// Zentrale Daten-Schicht:
//  - lädt Index & Spots (über data/dataLoader.js)
//  - optional Offline-Fallback über LocalStorage
//  - verwaltet Favoriten
// ---------------------------------------

"use strict";

import { SPOTS_CACHE_KEY } from "./config.js";
import {
  loadAppData as loadAppDataInternal,
  getSpots as getSpotsInternal,
  getIndex as getIndexInternal,
  getAppData as getAppDataInternal,
  getCategories as getCategoriesInternal,
  findSpotById as findSpotByIdInternal
} from "./data/dataLoader.js";

const FAVORITES_STORAGE_KEY = "fs_favorites";

/**
 * Lädt App-Daten (Index + Spots).
 * Versucht zuerst Netz, optional Fallback auf LocalStorage.
 *
 * @param {{ onOfflineFallback?: () => void }} [options]
 * @returns {Promise<ReturnType<typeof getAppDataInternal>>}
 */
export async function loadData(options = {}) {
  const { onOfflineFallback } = options;

  try {
    const data = await loadAppDataInternal();

    // Gesamtes App-Data-Objekt cachen (Index + Spots)
    try {
      localStorage.setItem(SPOTS_CACHE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn("[Family Spots] Konnte Daten-Cache nicht speichern:", err);
    }

    return data;
  } catch (err) {
    console.error("[Family Spots] Fehler beim Laden der Daten:", err);

    // Offline-Fallback versuchen
    let parsed = null;
    try {
      const stored = localStorage.getItem(SPOTS_CACHE_KEY);
      if (stored) {
        parsed = JSON.parse(stored);
      }
    } catch (err2) {
      console.warn("[Family Spots] Konnte Daten-Cache nicht lesen:", err2);
    }

    if (!parsed || !Array.isArray(parsed.spots)) {
      // Kein benutzbarer Cache → Fehler weiterwerfen
      throw err;
    }

    // dataLoader-AppData referenz aktualisieren,
    // damit getSpots()/getIndex() etc. konsistent sind.
    const appDataRef = getAppDataInternal();
    appDataRef.index = parsed.index || null;
    appDataRef.spots = parsed.spots || [];

    if (typeof onOfflineFallback === "function") {
      onOfflineFallback();
    }

    return appDataRef;
  }
}

// ---------------------------------------
// Getter – re-export aus dataLoader
// ---------------------------------------

export function getSpots() {
  return getSpotsInternal();
}

export function getIndex() {
  return getIndexInternal();
}

/** Direkte Momentaufnahme des AppData-Objekts. */
export function getAppData() {
  return getAppDataInternal();
}

export function getCategories() {
  return getCategoriesInternal();
}

export function findSpotById(id) {
  return findSpotByIdInternal(id);
}

// ---------------------------------------
// Favoriten
// ---------------------------------------

/**
 * Favoriten aus LocalStorage laden.
 * @returns {Set<string>}
 */
export function loadFavorites() {
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!stored) return new Set();

    const arr = JSON.parse(stored);
    if (!Array.isArray(arr)) return new Set();

    return new Set(arr.map((v) => String(v)));
  } catch (err) {
    console.warn("[Family Spots] Konnte Favoriten nicht laden:", err);
    return new Set();
  }
}

/**
 * Favoriten im LocalStorage speichern.
 * @param {Set<string>} favorites
 */
export function saveFavorites(favorites) {
  try {
    const arr = Array.from(favorites || []).map((v) => String(v));
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(arr));
  } catch (err) {
    console.warn("[Family Spots] Konnte Favoriten nicht speichern:", err);
  }
}