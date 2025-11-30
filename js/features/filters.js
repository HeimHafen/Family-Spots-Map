// js/features/filters.js
// ------------------------------------------------------
// Zentrale Spot-/Filter-Helfer – ohne DOM/Map-Abhängigkeiten
// ------------------------------------------------------

"use strict";

import {
  CATEGORY_TAGS,
  FILTERS,
  FEATURES
} from "../config.js";

/**
 * @typedef {Object} Spot
 * @property {number} [lat]
 * @property {number} [lng]
 * @property {number} [lon]
 * @property {string|number} [id]
 * @property {string} [title]
 * @property {string} [name]
 * @property {string} [spotName]
 * @property {string} [city]
 * @property {string} [town]
 * @property {string} [country]
 * @property {string} [category]
 * @property {string[]} [categories]
 * @property {string[]} [tags]
 * @property {string} [subtitle]
 * @property {string} [shortDescription]
 * @property {string} [summary_de]
 * @property {string} [summary_en]
 * @property {string} [poetry]
 * @property {string} [description]
 * @property {string} [text]
 * @property {string} [address]
 * @property {string} [postcode]
 * @property {number} [visit_minutes]
 * @property {boolean} [plusOnly]
 * @property {boolean} [plus]
 * @property {boolean} [bigAdventure]
 * @property {boolean} [isBigAdventure]
 * @property {boolean} [longTrip]
 * @property {boolean} [verified]
 * @property {boolean} [isVerified]
 * @property {string[]|string} [ageGroups]
 * @property {string[]|string} [age]
 * @property {string[]|string} [ages]
 * @property {string[]|string} [moods]
 * @property {string[]|string} [moodTags]
 * @property {string[]|string} [mood]
 * @property {string[]|string} [travelModes]
 * @property {string[]|string} [travel]
 * @property {string[]|string} [tripModes]
 * @property {string} [_searchText]
 * @property {string[]} [_ageGroups]
 * @property {string[]} [_moods]
 * @property {string[]} [_travelModes]
 * @property {string[]} [_tagsMerged]
 */

// ------------------------------------------------------
// Basis-Helfer für Spots
// ------------------------------------------------------

export function getSpotName(spot) {
  if (!spot) return "Spot";
  return (
    spot.title ||
    spot.name ||
    spot.spotName ||
    (spot.id ? String(spot.id) : "Spot")
  );
}

export function getSpotSubtitle(spot) {
  if (!spot) return "";
  if (spot.city && spot.country) return `${spot.city}, ${spot.country}`;
  if (spot.city) return spot.city;
  if (spot.town && spot.country) return `${spot.town}, ${spot.country}`;
  if (spot.address) return spot.address;
  return spot.subtitle || spot.shortDescription || "";
}

export function getSpotId(spot) {
  return String(spot.id || getSpotName(spot));
}

export function isSpotPlusOnly(spot) {
  return !!spot.plusOnly || !!spot.plus;
}

export function isSpotBigAdventure(spot) {
  return !!spot.bigAdventure || !!spot.isBigAdventure || !!spot.longTrip;
}

export function isSpotVerified(spot) {
  return !!spot.verified || !!spot.isVerified;
}

// ------------------------------------------------------
// Normalisierte Felder (Age/Mood/Travel/Tags/Search-Text)
// ------------------------------------------------------

export function getSpotAgeGroups(spot) {
  if (!spot) return [];
  if (Array.isArray(spot._ageGroups)) return spot._ageGroups;

  const raw = spot.ageGroups || spot.age || spot.ages;
  let result = [];

  if (!raw) {
    result = [];
  } else if (Array.isArray(raw)) {
    result = raw;
  } else if (typeof raw === "string") {
    result = raw
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);
  }

  spot._ageGroups = result;
  return result;
}

export function getSpotMoods(spot) {
  if (!spot) return [];
  if (Array.isArray(spot._moods)) return spot._moods;

  const raw = spot.moods || spot.moodTags || spot.mood;
  let result = [];

  if (!raw) {
    result = [];
  } else if (Array.isArray(raw)) {
    result = raw;
  } else if (typeof raw === "string") {
    result = raw
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
  }

  spot._moods = result;
  return result;
}

export function getSpotTravelModes(spot) {
  if (!spot) return [];
  if (Array.isArray(spot._travelModes)) return spot._travelModes;

  const raw = spot.travelModes || spot.travel || spot.tripModes;
  let result = [];

  if (!raw) {
    result = [];
  } else if (Array.isArray(raw)) {
    result = raw;
  } else if (typeof raw === "string") {
    result = raw
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
  }

  spot._travelModes = result;
  return result;
}

/**
 * Kombiniert Tags aus Spot-Daten + Kategorie-Tags (CATEGORY_TAGS).
 */
export function getSpotTags(spot) {
  if (!spot) return [];
  if (Array.isArray(spot._tagsMerged)) return spot._tagsMerged;

  const tagSet = new Set();

  // Originale Spot-Tags
  if (Array.isArray(spot.tags)) {
    spot.tags.forEach((tag) => {
      if (tag) tagSet.add(String(tag));
    });
  }

  // Kategorien einsammeln
  const catSlugs = new Set();
  if (spot.category) catSlugs.add(String(spot.category));
  if (Array.isArray(spot.categories)) {
    spot.categories.forEach((c) => {
      if (c) catSlugs.add(String(c));
    });
  }

  // Kategorie-Tags aus config
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
 * Suchtext für Volltextsuche.
 */
export function buildSpotSearchText(spot) {
  if (!spot) return "";
  if (spot._searchText) return spot._searchText;

  const parts = [
    getSpotName(spot),
    getSpotSubtitle(spot),
    spot.category,
    ...getSpotTags(spot)
  ].filter(Boolean);

  const text = parts.join(" ").toLowerCase();
  spot._searchText = text;
  return text;
}

/**
 * Vereinheitlichte Normalisierung für alle Spots.
 * (Koordinaten, Kategorie, vorberechnete Felder)
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

  buildSpotSearchText(spot);
  getSpotAgeGroups(spot);
  getSpotMoods(spot);
  getSpotTravelModes(spot);

  return spot;
}

// ------------------------------------------------------
// Tag-Filter & Haupt-Filterfunktion
// ------------------------------------------------------

/**
 * Aggregiert alle Tags aus den aktuell aktiven Filter-IDs.
 * @param {Set<string>} activeFilterIds
 * @returns {string[]}
 */
export function getActiveFilterTags(activeFilterIds) {
  if (!FILTERS || !Array.isArray(FILTERS) || !FILTERS.length) return [];
  if (!activeFilterIds || !activeFilterIds.size) return [];

  const tagSet = new Set();
  FILTERS.forEach((filter) => {
    if (!filter || !filter.id || !Array.isArray(filter.tags)) return;
    if (!activeFilterIds.has(filter.id)) return;
    filter.tags.forEach((tag) => {
      if (tag) tagSet.add(String(tag));
    });
  });

  return Array.from(tagSet);
}

/**
 * Prüft, ob ein Spot alle *nicht-geografischen* Filter erfüllt.
 * (Radius/Map wird in app.js zusätzlich geprüft.)
 *
 * @param {Spot} spot
 * @param {{
 *   searchTerm?: string,
 *   categoryFilter?: string,
 *   ageFilter?: string,
 *   moodFilter?: string|null,
 *   travelMode?: string|null,
 *   onlyBigAdventures?: boolean,
 *   onlyVerified?: boolean,
 *   onlyFavorites?: boolean,
 *   favoritesSet?: Set<string>,
 *   plusActive?: boolean,
 *   activeTagFilterIds?: Set<string>
 * }} options
 * @returns {boolean}
 */
export function doesSpotMatchFilters(spot, options) {
  const {
    searchTerm = "",
    categoryFilter = "",
    ageFilter = "all",
    moodFilter = null,
    travelMode = null,
    onlyBigAdventures = false,
    onlyVerified = false,
    onlyFavorites = false,
    favoritesSet,
    plusActive = false,
    activeTagFilterIds
  } = options || {};

  if (!spot) return false;

  // Plus-Gate
  if (FEATURES.plus && isSpotPlusOnly(spot) && !plusActive) {
    return false;
  }

  // Volltextsuche
  if (searchTerm) {
    const term = String(searchTerm).toLowerCase();
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

  // Altersgruppen
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

  // Reise-Modus
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

  // Favoriten
  if (FEATURES.favorites && onlyFavorites) {
    const id = getSpotId(spot);
    if (!favoritesSet || !favoritesSet.has(id)) return false;
  }

  // Tag-Filter (FILTERS): OR-Logik – Spot muss mind. einen der aktiven Tags haben
  if (activeTagFilterIds && activeTagFilterIds.size) {
    const activeTags = getActiveFilterTags(activeTagFilterIds);
    if (activeTags.length) {
      const spotTags = getSpotTags(spot);
      const hasAny = activeTags.some((tag) => spotTags.includes(tag));
      if (!hasAny) return false;
    }
  }

  return true;
}