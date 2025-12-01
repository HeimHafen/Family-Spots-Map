// js/filters.js
// ======================================================
// Filter- & Spot-Helfer für Family Spots
// (ohne direkten Zugriff auf DOM oder globale UI-States)
// ======================================================

"use strict";

import { CATEGORY_TAGS, FILTERS, FEATURES } from "./config.js";

/**
 * @typedef {import("./app.js").Spot} Spot
 */

/**
 * Hilfsfunktion: String/Array-Feld in ein String-Array normalisieren.
 * @param {string[]|string|undefined|null} raw
 * @returns {string[]}
 */
function normalizeArrayField(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((v) => (v == null ? "" : String(v).trim()))
      .filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
}

// ------------------------------------------------------
// Spot-Helfer (nur Daten, kein DOM)
// ------------------------------------------------------

export function getSpotName(spot) {
  return (
    spot.title ||
    spot.name ||
    spot.spotName ||
    (spot.id ? String(spot.id) : "Spot")
  );
}

export function getSpotSubtitle(spot) {
  if (spot.city && spot.country) return `${spot.city}, ${spot.country}`;
  if (spot.city) return spot.city;
  if (spot.town && spot.country) return `${spot.town}, ${spot.country}`;
  if (spot.address) return spot.address;
  return spot.subtitle || spot.shortDescription || "";
}

export function getSpotId(spot) {
  return String(spot.id || getSpotName(spot));
}

/**
 * Altersgruppen normalisieren und cachen.
 * @param {Spot} spot
 * @returns {string[]}
 */
function getSpotAgeGroups(spot) {
  if (Array.isArray(spot._ageGroups)) return spot._ageGroups;
  const raw = spot.ageGroups || spot.age || spot.ages;
  const result = normalizeArrayField(raw);
  spot._ageGroups = result;
  return result;
}

/**
 * Stimmungen normalisieren und cachen.
 * @param {Spot} spot
 * @returns {string[]}
 */
function getSpotMoods(spot) {
  if (Array.isArray(spot._moods)) return spot._moods;
  const raw = spot.moods || spot.moodTags || spot.mood;
  const result = normalizeArrayField(raw);
  spot._moods = result;
  return result;
}

/**
 * Reise-Modi normalisieren und cachen.
 * @param {Spot} spot
 * @returns {string[]}
 */
function getSpotTravelModes(spot) {
  if (Array.isArray(spot._travelModes)) return spot._travelModes;
  const raw = spot.travelModes || spot.travel || spot.tripModes;
  const result = normalizeArrayField(raw);
  spot._travelModes = result;
  return result;
}

/**
 * Kombiniert Tags aus den Rohdaten mit Kategorie-basierten Tags (CATEGORY_TAGS).
 * Ergebnis wird gecached in spot._tagsMerged.
 * @param {Spot} spot
 * @returns {string[]}
 */
function getSpotTags(spot) {
  if (Array.isArray(spot._tagsMerged)) return spot._tagsMerged;

  const tagSet = new Set();

  // 1. Tags aus den Rohdaten (falls vorhanden)
  if (Array.isArray(spot.tags)) {
    spot.tags.forEach((tag) => {
      if (tag) tagSet.add(String(tag));
    });
  }

  // 2. Kategorien einsammeln (category + categories[])
  const catSlugs = new Set();

  if (spot.category) {
    catSlugs.add(String(spot.category));
  }

  if (Array.isArray(spot.categories)) {
    spot.categories.forEach((c) => {
      if (c) catSlugs.add(String(c));
    });
  }

  // 3. Kategorie-Tags aus CATEGORY_TAGS hinzumischen
  catSlugs.forEach((slug) => {
    const catTags = CATEGORY_TAGS[slug];
    if (Array.isArray(catTags)) {
      catTags.forEach((tag) => {
        if (tag) tagSet.add(String(tag));
      });
    }
  });

  const merged = Array.from(tagSet);
  spot._tagsMerged = merged;
  return merged;
}

/**
 * Suchtext aus Spot zusammenbauen und cachen.
 * @param {Spot} spot
 * @returns {string}
 */
function buildSpotSearchText(spot) {
  if (spot._searchText) return spot._searchText;

  const parts = [
    getSpotName(spot),
    getSpotSubtitle(spot),
    spot.category,
    ...(Array.isArray(spot.tags) ? spot.tags : []),
    ...getSpotTags(spot)
  ].filter(Boolean);

  const text = parts.join(" ").toLowerCase();
  spot._searchText = text;
  return text;
}

/**
 * Vereinheitlichte Normalisierung für alle Spots.
 * @param {Spot} raw
 * @returns {Spot}
 */
export function normalizeSpot(raw) {
  /** @type {Spot} */
  const spot = { ...raw };

  if (spot.lon != null && spot.lng == null) {
    spot.lng = spot.lon;
  }

  if (
    !spot.category &&
    Array.isArray(spot.categories) &&
    spot.categories.length
  ) {
    spot.category = spot.categories[0];
  }

  spot._searchText = buildSpotSearchText(spot);
  spot._ageGroups = getSpotAgeGroups(spot);
  spot._moods = getSpotMoods(spot);
  spot._travelModes = getSpotTravelModes(spot);

  return spot;
}

// ------------------------------------------------------
// Filterlogik (nur Daten, kein DOM / Leaflet)
// ------------------------------------------------------

function isSpotPlusOnly(spot) {
  return !!spot.plusOnly || !!spot.plus;
}

function isSpotBigAdventure(spot) {
  return !!spot.bigAdventure || !!spot.isBigAdventure || !!spot.longTrip;
}

function isSpotVerified(spot) {
  return !!spot.verified || !!spot.isVerified;
}

/**
 * OR-Liste aller Tags, die durch aktive Tag-Filter (FILTERS + activeTagFilters) gemeint sind.
 *
 * @param {Set<string>} activeTagFilters
 * @returns {string[]}
 */
function getActiveFilterTags(activeTagFilters) {
  if (
    !activeTagFilters ||
    !(activeTagFilters instanceof Set) ||
    !activeTagFilters.size
  ) {
    return [];
  }

  if (!FILTERS || !Array.isArray(FILTERS) || !FILTERS.length) {
    return [];
  }

  const tagSet = new Set();

  FILTERS.forEach((filter) => {
    if (!filter || !filter.id || !Array.isArray(filter.tags)) return;
    if (!activeTagFilters.has(filter.id)) return;
    filter.tags.forEach((tag) => {
      if (tag) tagSet.add(String(tag));
    });
  });

  return Array.from(tagSet);
}

/**
 * Prüft, ob ein Spot alle (nicht-geo) Filter erfüllt.
 *
 * @param {Spot} spot
 * @param {Object} filterState
 * @param {boolean} filterState.plusActive
 * @param {string} filterState.searchTerm
 * @param {string} filterState.categoryFilter
 * @param {string} filterState.ageFilter
 * @param {string|null} filterState.moodFilter
 * @param {string|null} filterState.travelMode
 * @param {boolean} filterState.onlyBigAdventures
 * @param {boolean} filterState.onlyVerified
 * @param {boolean} filterState.onlyFavorites
 * @param {Set<string>} filterState.activeTagFilters
 * @param {Set<string>} filterState.favorites
 * @returns {boolean}
 */
function doesSpotMatchBaseFilters(
  spot,
  {
    plusActive,
    searchTerm,
    categoryFilter,
    ageFilter,
    moodFilter,
    travelMode,
    onlyBigAdventures,
    onlyVerified,
    onlyFavorites,
    activeTagFilters,
    favorites
  }
) {
  // Plus-Filter
  if (FEATURES.plus && isSpotPlusOnly(spot) && !plusActive) {
    return false;
  }

  // Volltext-Suche
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    const haystack = buildSpotSearchText(spot);
    if (!haystack.includes(term)) return false;
  }

  // Kategorie
  if (categoryFilter) {
    const filterSlug = String(categoryFilter);
    const categories = [];

    if (Array.isArray(spot.categories)) {
      categories.push(...spot.categories.map(String));
    } else if (spot.category || spot.type) {
      categories.push(String(spot.category || spot.type));
    }

    if (!categories.some((c) => c === filterSlug)) return false;
  }

  // Alter
  if (ageFilter && ageFilter !== "all") {
    const ages = getSpotAgeGroups(spot);
    if (ages.length && !ages.includes(ageFilter)) {
      return false;
    }
  }

  // Stimmung
  if (FEATURES.moodFilter && moodFilter) {
    const moods = getSpotMoods(spot);
    if (moods.length && !moods.includes(moodFilter)) {
      return false;
    }
  }

  // Travel-Mode
  if (FEATURES.travelMode && travelMode) {
    const modes = getSpotTravelModes(spot);
    if (modes.length && !modes.includes(travelMode)) {
      return false;
    }
  }

  // Große Abenteuer
  if (FEATURES.bigAdventureFilter && onlyBigAdventures && !isSpotBigAdventure(spot)) {
    return false;
  }

  // Verifiziert
  if (FEATURES.verifiedFilter && onlyVerified && !isSpotVerified(spot)) {
    return false;
  }

  // Nur Favoriten
  if (FEATURES.favorites && onlyFavorites) {
    const id =
      spot.id != null
        ? String(spot.id)
        : String(spot.title || spot.name || spot.spotName || "Spot");
    if (!favorites || !(favorites instanceof Set) || !favorites.has(id)) {
      return false;
    }
  }

  // Tag-Filter (FILTERS): OR-Logik – Spot muss mind. einen der aktiven Filter-Tags haben
  const activeTags = getActiveFilterTags(activeTagFilters);
  if (activeTags.length) {
    const spotTags = getSpotTags(spot);
    const hasAny = activeTags.some((tag) => spotTags.includes(tag));
    if (!hasAny) return false;
  }

  return true;
}

/**
 * Wendet alle (nicht-geo) Filter auf die Spots an.
 *
 * @param {Spot[]} spots
 * @param {Object} filterState siehe doesSpotMatchBaseFilters
 * @returns {Spot[]}
 */
export function filterSpots(
  spots,
  {
    plusActive,
    searchTerm,
    categoryFilter,
    ageFilter,
    moodFilter,
    travelMode,
    onlyBigAdventures,
    onlyVerified,
    onlyFavorites,
    favorites,
    activeFilterIds
  }
) {
  const activeTagFilters =
    activeFilterIds instanceof Set ? activeFilterIds : new Set(activeFilterIds || []);

  return spots.filter((spot) =>
    doesSpotMatchBaseFilters(spot, {
      plusActive,
      searchTerm,
      categoryFilter,
      ageFilter,
      moodFilter,
      travelMode,
      onlyBigAdventures,
      onlyVerified,
      onlyFavorites,
      activeTagFilters,
      favorites
    })
  );
}