// js/filters.js
// ======================================================
// Filter- & Spot-Helfer für Family Spots
// (ohne direkten Zugriff auf DOM oder globale State-Variablen)
// ======================================================

"use strict";

import { RADIUS_STEPS_KM, CATEGORY_TAGS, FILTERS } from "./config.js";

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

/**
 * Altersgruppen normalisieren und cachen.
 * @param {import("./app.js").Spot} spot
 * @returns {string[]}
 */
export function getSpotAgeGroups(spot) {
  if (Array.isArray(spot._ageGroups)) return spot._ageGroups;

  const raw = spot.ageGroups || spot.age || spot.ages;
  const result = normalizeArrayField(raw);

  spot._ageGroups = result;
  return result;
}

/**
 * Stimmungen normalisieren und cachen.
 * @param {import("./app.js").Spot} spot
 * @returns {string[]}
 */
export function getSpotMoods(spot) {
  if (Array.isArray(spot._moods)) return spot._moods;

  const raw = spot.moods || spot.moodTags || spot.mood;
  const result = normalizeArrayField(raw);

  spot._moods = result;
  return result;
}

/**
 * Reise-Modi normalisieren und cachen.
 * @param {import("./app.js").Spot} spot
 * @returns {string[]}
 */
export function getSpotTravelModes(spot) {
  if (Array.isArray(spot._travelModes)) return spot._travelModes;

  const raw = spot.travelModes || spot.travel || spot.tripModes;
  const result = normalizeArrayField(raw);

  spot._travelModes = result;
  return result;
}

/**
 * Kombiniert Tags aus den Rohdaten mit Kategorie-basierten Tags (CATEGORY_TAGS).
 * Ergebnis wird gecached in spot._tagsMerged.
 * @param {import("./app.js").Spot} spot
 * @returns {string[]}
 */
export function getSpotTags(spot) {
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
 * Optional können Name/Subtitle-Funktionen übergeben werden (aus app.js),
 * damit der gleiche Text wie in der UI verwendet wird.
 *
 * @param {import("./app.js").Spot} spot
 * @param {(spot:any) => string} [getSpotName]
 * @param {(spot:any) => string} [getSpotSubtitle]
 * @returns {string}
 */
export function buildSpotSearchText(spot, getSpotName, getSpotSubtitle) {
  if (spot._searchText) return spot._searchText;

  const name =
    typeof getSpotName === "function"
      ? getSpotName(spot)
      : spot.title || spot.name || spot.spotName || "";
  const subtitle =
    typeof getSpotSubtitle === "function"
      ? getSpotSubtitle(spot)
      : spot.subtitle || spot.shortDescription || "";

  const parts = [
    name,
    subtitle,
    spot.category,
    ...(Array.isArray(spot.tags) ? spot.tags : []),
    ...getSpotTags(spot)
  ].filter(Boolean);

  const text = parts.join(" ").toLowerCase();
  spot._searchText = text;
  return text;
}

/**
 * Liefert zu einer Radius-Stufe den Radius in km,
 * oder Infinity, falls kein Limit.
 * @param {number} radiusStep
 * @returns {number}
 */
export function getRadiusKm(radiusStep) {
  let idx = Number.isInteger(radiusStep) ? radiusStep : RADIUS_STEPS_KM.length - 1;
  if (idx < 0) idx = 0;
  if (idx >= RADIUS_STEPS_KM.length) idx = RADIUS_STEPS_KM.length - 1;
  const km = RADIUS_STEPS_KM[idx];
  return typeof km === "number" ? km : Infinity;
}

/**
 * Slider-A11y initialisieren und Änderungen per Callback nach außen melden.
 *
 * @param {HTMLInputElement} rangeEl
 * @param {(newStep:number) => void} onChange
 * @returns {number} initialer radiusStep
 */
export function initRadiusSliderA11y(rangeEl, onChange) {
  if (!rangeEl) return RADIUS_STEPS_KM.length - 1;

  const min = 0;
  const max = RADIUS_STEPS_KM.length - 1;

  let currentStep = parseInt(rangeEl.value, 10);
  if (Number.isNaN(currentStep)) currentStep = max;

  if (currentStep < min) currentStep = min;
  if (currentStep > max) currentStep = max;

  rangeEl.min = String(min);
  rangeEl.max = String(max);
  rangeEl.value = String(currentStep);

  rangeEl.setAttribute("aria-valuemin", String(min));
  rangeEl.setAttribute("aria-valuemax", String(max));
  rangeEl.setAttribute("aria-valuenow", String(currentStep));

  rangeEl.addEventListener("input", () => {
    let step = parseInt(rangeEl.value, 10);
    if (Number.isNaN(step)) step = max;
    if (step < min) step = min;
    if (step > max) step = max;

    rangeEl.value = String(step);
    rangeEl.setAttribute("aria-valuenow", String(step));

    if (typeof onChange === "function") {
      onChange(step);
    }
  });

  return currentStep;
}

/**
 * Aktualisiert die Radius-Texte (Label + Beschreibung) anhand radiusStep.
 *
 * @param {Object} params
 * @param {HTMLInputElement} params.filterRadiusEl
 * @param {HTMLElement} params.filterRadiusMaxLabelEl
 * @param {HTMLElement} params.filterRadiusDescriptionEl
 * @param {number} params.radiusStep
 * @param {(key:string) => string} params.t  Übersetzungsfunktion
 */
export function updateRadiusTexts({
  filterRadiusEl,
  filterRadiusMaxLabelEl,
  filterRadiusDescriptionEl,
  radiusStep,
  t
}) {
  if (!filterRadiusEl || !filterRadiusMaxLabelEl || !filterRadiusDescriptionEl)
    return;

  const min = 0;
  const max = RADIUS_STEPS_KM.length - 1;

  let step = Number.isInteger(radiusStep) ? radiusStep : max;
  if (step < min) step = min;
  if (step > max) step = max;

  filterRadiusEl.value = String(step);
  filterRadiusEl.setAttribute("aria-valuenow", String(step));

  if (step === max) {
    filterRadiusMaxLabelEl.textContent = t("filter_radius_max_label");
    filterRadiusDescriptionEl.textContent = t("filter_radius_description_all");
  } else {
    const km = RADIUS_STEPS_KM[step];
    filterRadiusMaxLabelEl.textContent = `${km} km`;
    const key = `filter_radius_description_step${step}`;
    filterRadiusDescriptionEl.textContent = t(key);
  }
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
 * Distanz-Check für einen Spot.
 *
 * @param {import("./app.js").Spot} spot
 * @param {any} centerLatLng    Leaflet LatLng
 * @param {number} radiusKm
 * @param {(spot:any) => boolean} hasValidLatLng
 * @param {any} L               Leaflet-Objekt (für L.latLng)
 * @returns {boolean}
 */
function isSpotInRadius(spot, centerLatLng, radiusKm, hasValidLatLng, L) {
  if (!L || !centerLatLng || typeof centerLatLng.distanceTo !== "function") {
    return true;
  }
  if (!isFinite(radiusKm) || radiusKm === Infinity) return true;
  if (!hasValidLatLng(spot)) return true;

  const spotLatLng = L.latLng(spot.lat, spot.lng);
  const distanceMeters = centerLatLng.distanceTo(spotLatLng);
  const distanceKm = distanceMeters / 1000;
  return distanceKm <= radiusKm;
}

/**
 * Prüft, ob ein Spot alle aktiven Filter erfüllt.
 *
 * @param {import("./app.js").Spot} spot
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
 * @param {Object} filterState.FEATURES
 * @param {Object} helpers
 * @param {any} helpers.centerLatLng
 * @param {number} helpers.radiusKm
 * @param {(spot:any) => boolean} helpers.hasValidLatLng
 * @param {(spot:any) => boolean} helpers.isSpotPlusOnly
 * @param {(spot:any) => boolean} helpers.isSpotBigAdventure
 * @param {(spot:any) => boolean} helpers.isSpotVerified
 * @param {Set<string>} helpers.favorites
 * @param {(spot:any) => string} helpers.getSearchTextForSpot
 * @param {any} helpers.L
 *
 * @returns {boolean}
 */
export function doesSpotMatchFilters(
  spot,
  filterState,
  {
    centerLatLng,
    radiusKm,
    hasValidLatLng,
    isSpotPlusOnly,
    isSpotBigAdventure,
    isSpotVerified,
    favorites,
    getSearchTextForSpot,
    L
  }
) {
  const {
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
    FEATURES
  } = filterState;

  // Plus-Filter
  if (FEATURES.plus && isSpotPlusOnly && isSpotPlusOnly(spot) && !plusActive) {
    return false;
  }

  // Volltext-Suche
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    let haystack = "";

    if (typeof getSearchTextForSpot === "function") {
      haystack = getSearchTextForSpot(spot) || "";
    } else if (typeof spot._searchText === "string") {
      haystack = spot._searchText;
    } else {
      haystack = buildSpotSearchText(spot);
    }

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
  if (
    FEATURES.bigAdventureFilter &&
    onlyBigAdventures &&
    isSpotBigAdventure &&
    !isSpotBigAdventure(spot)
  ) {
    return false;
  }

  // Verifiziert
  if (
    FEATURES.verifiedFilter &&
    onlyVerified &&
    isSpotVerified &&
    !isSpotVerified(spot)
  ) {
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

  // Radius
  if (
    !isSpotInRadius(
      spot,
      centerLatLng,
      radiusKm,
      hasValidLatLng,
      L
    )
  ) {
    return false;
  }

  return true;
}