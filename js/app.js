// js/app.js
// =====================================================
// Family Spots Map – Haupt-App
//  - Map-Init & Spots laden
//  - Filter (Suche, Stimmung, Radius, Schnellfilter, Kategorie, Alter, verifiziert)
//  - Sprachwechsel (de/en/da) + About-View
//  - Theme-Toggle
//  - Tilla-Companion
//  - Family Spots Plus UI
//  - Mein Tag (Daylog)
// =====================================================

"use strict";

import {
  FEATURES,
  RADIUS_STEPS_KM,
  FILTERS,
  CATEGORY_GROUPS,
  CATEGORY_GROUP_LABELS,
  CATEGORY_LABELS_DE,
  CATEGORY_LABELS_EN,
  CATEGORY_LABELS_DA
} from "./config.js";

import {
  initI18n,
  setLanguage,
  getLanguage,
  t as tI18n,
  applyTranslations
} from "./i18n.js";

import { initMap, renderMarkers, getRouteUrlsForSpot } from "./map.js";
import { loadData, getSpots } from "./data.js";

import {
  initPlusUI,
  updatePlusLanguage,
  isPlusActive as uiPlusActive
} from "./features/plus-ui.js";

import { isPlusCategory, isPlusActive as corePlusActive } from "./features/plus.js";

import {
  loadStoredTheme,
  saveStoredTheme,
  loadFavoritesFromStorage,
  saveFavoritesToStorage,
  loadDaylog,
  saveDaylog,
  hasSeenCompassPlusHint,
  markCompassPlusHintSeen,
  loadPlusActive
} from "./storage.js";

import { TillaCompanion } from "./tilla.js";

/**
 * @typedef {import("./app.js").Spot} Spot
 * (Hinweis: Spot-Typ wird in anderen Modulen dokumentiert;
 *  hier arbeiten wir strukturell tolerant.)
 */

// ------------------------------------------------------
// App-State
// ------------------------------------------------------

let map = null;
let markersLayer = null;

let allSpots = /** @type {Spot[]} */ ([]);
let filteredSpots = /** @type {Spot[]} */ ([]);

let favorites = loadFavoritesFromStorage(); // Set<string>
let hasShownMarkerLimitToast = false;

let currentLang = /** @type {"de"|"en"|"da"} */ ("de");
let currentTheme = "light";

let currentRadiusStep = 4; // 0–4
let currentMood = /** @type {null | "relaxed" | "action" | "water" | "animals"} */ (null);
let quickFilterIds = new Set(); // Set<string>
let selectedCategorySlug = "";
let selectedAgeFilter = "all";
let verifiedOnly = false;
let travelMode = /** @type {"everyday"|"trip"} */ ("everyday");

let tilla = /** @type {TillaCompanion | null} */ (null);

// DOM-Refs
let toastEl;
let spotListEl;
let spotDetailEl;

// Kompass
let compassSection;
let compassApplyBtn;

// ------------------------------------------------------
// Helper: Sprache, Kategorien, Tags
// ------------------------------------------------------

function getCategoryLabel(slug, lang) {
  if (!slug) return "";

  const s = String(slug);
  if (lang === "en") {
    return CATEGORY_LABELS_EN[s] || CATEGORY_LABELS_DE[s] || s;
  }
  if (lang === "da") {
    return CATEGORY_LABELS_DA[s] || CATEGORY_LABELS_DE[s] || s;
  }
  // default de
  return CATEGORY_LABELS_DE[s] || s;
}

function getCategoryLabelsMap(lang) {
  if (lang === "en") return CATEGORY_LABELS_EN;
  if (lang === "da") return CATEGORY_LABELS_DA;
  return CATEGORY_LABELS_DE;
}

// Simple Mapping: Mood → Tag-Stichworte
const MOOD_TAGS = {
  relaxed: ["relax", "quiet", "park", "nature", "picnic"],
  action: ["sport", "adventure", "climbing", "playground", "bike", "pumptrack"],
  water: ["water", "swimming", "lake", "beach"],
  animals: ["animals", "zoo", "wildlife", "petting-zoo", "farm"]
};

// ------------------------------------------------------
// Toast
// ------------------------------------------------------

/**
 * @param {string} keyOrText
 */
function showToast(keyOrText) {
  if (!toastEl) return;

  let text = keyOrText;

  // ein paar bekannte Schlüssel für Plus-Codes etc.
  switch (keyOrText) {
    case "plus_code_empty":
      text = currentLang === "de"
        ? "Bitte gib einen Partner-Code ein."
        : currentLang === "da"
          ? "Indtast venligst en partnerkode."
          : "Please enter a partner code.";
      break;
    case "plus_code_unknown":
      text = currentLang === "de"
        ? "Dieser Code ist leider nicht bekannt oder nicht mehr gültig."
        : currentLang === "da"
          ? "Koden er desværre ukendt eller ikke længere gyldig."
          : "This code is unknown or no longer valid.";
      break;
    case "plus_code_activated":
      text = currentLang === "de"
        ? "Family Spots Plus wurde aktiviert – viel Freude mit den zusätzlichen Spots!"
        : currentLang === "da"
          ? "Family Spots Plus er aktiveret – god fornøjelse med de ekstra spots!"
          : "Family Spots Plus has been activated – enjoy the additional spots!";
      break;
  }

  toastEl.textContent = text;
  toastEl.classList.remove("toast--hidden");
  toastEl.classList.add("toast--visible");

  window.clearTimeout(/** @type {any} */ (toastEl._hideTimeout));
  toastEl._hideTimeout = window.setTimeout(() => {
    toastEl.classList.remove("toast--visible");
    toastEl.classList.add("toast--hidden");
  }, 3500);
}

// ------------------------------------------------------
// Sprachwechsel + About-View
// ------------------------------------------------------

function updateLanguageFlagAndAbout() {
  const btn = /** @type {HTMLButtonElement | null} */ (
    document.getElementById("language-switcher")
  );
  const flagImg = /** @type {HTMLImageElement | null} */ (
    document.getElementById("language-switcher-flag")
  );

  if (flagImg) {
    if (currentLang === "de") {
      flagImg.src = "assets/flags/flag-de.svg";
    } else if (currentLang === "en") {
      flagImg.src = "assets/flags/flag-uk.svg";
    } else {
      flagImg.src = "assets/flags/flag-dk.svg";
    }
  }

  // About-Seiten umschalten
  const aboutDe = document.getElementById("page-about-de");
  const aboutEn = document.getElementById("page-about-en");
  const aboutDa = document.getElementById("page-about-da");

  if (aboutDe && aboutEn && aboutDa) {
    const setState = (el, active) => {
      if (!el) return;
      if (active) {
        el.classList.remove("hidden");
        el.setAttribute("aria-hidden", "false");
      } else {
        el.classList.add("hidden");
        el.setAttribute("aria-hidden", "true");
      }
    };

    setState(aboutDe, currentLang === "de");
    setState(aboutEn, currentLang === "en");
    setState(aboutDa, currentLang === "da");
  }

  // Tilla & Plus-UI informieren
  if (tilla) tilla.onLanguageChanged();
  updatePlusLanguage(currentLang);
}

/**
 * Sprach-Toggle: de → en → da → de
 */
function setupLanguageSwitcher() {
  const btn = /** @type {HTMLButtonElement | null} */ (
    document.getElementById("language-switcher")
  );
  if (!btn) return;

  btn.addEventListener("click", () => {
    const order = /** @type {("de"|"en"|"da")[]} */ (["de", "en", "da"]);
    const idx = order.indexOf(currentLang);
    const next = order[(idx + 1) % order.length];
    currentLang = next;
    setLanguage(next);
    applyTranslations(document);
    updateLanguageFlagAndAbout();
    // Filter/Listen neu benennen
    populateCategorySelect();
    populateQuickFiltersChips();
    updateRadiusTexts();
    renderSpotsList();
  });
}

// ------------------------------------------------------
// Theme
// ------------------------------------------------------

function applyTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", currentTheme);
  saveStoredTheme(currentTheme);
}

function setupThemeToggle() {
  const btn = /** @type {HTMLButtonElement | null} */ (
    document.getElementById("theme-toggle")
  );
  if (!btn) return;

  btn.addEventListener("click", () => {
    const next = currentTheme === "light" ? "dark" : "light";
    applyTheme(next);
  });
}

// ------------------------------------------------------
// Map + Spots
// ------------------------------------------------------

function focusSpotOnMap(spot) {
  if (!map || !spot) return;
  if (typeof spot.lat === "number" && typeof spot.lng === "number") {
    map.setView([spot.lat, spot.lng], Math.max(map.getZoom(), 14), {
      animate: true
    });
  }
  renderSpotDetail(spot);
}

/**
 * Karte + Marker aktualisieren nach Filter
 */
function updateMapMarkers() {
  if (!map || !markersLayer) return;

  hasShownMarkerLimitToast = renderMarkers({
    map,
    markersLayer,
    spots: filteredSpots,
    currentLang,
    showToast,
    hasShownMarkerLimitToast,
    focusSpotOnMap
  });
}

// ------------------------------------------------------
// Filter-Logik
// ------------------------------------------------------

/**
 * Liefert alle Tags eines Spots (großzügig, tolerant).
 * – nutzt category-Slug + ggf. tags/keywords aus Rohdaten
 * @param {Spot} spot
 */
function getSpotTags(spot) {
  const tags = new Set();

  const slug =
    spot.category ||
    spot.categorySlug ||
    spot.type ||
    spot.spotType ||
    spot.slug;

  if (slug && CATEGORY_GROUPS) {
    // Tags aus CATEGORY_TAGS benutzen – via config importiert
    // (CATEGORY_TAGS ist Default-Export in config.js; um Kreislauf zu vermeiden,
    //  arbeiten wir hier nur mit bereits importierten Infos; falls du CATEGORY_TAGS
    //  direkt brauchst, kannst du es auch explizit importieren.)
  }

  if (Array.isArray(spot.tags)) {
    spot.tags.forEach((t) => tags.add(String(t).toLowerCase()));
  }
  if (typeof spot.keywords === "string") {
    spot.keywords
      .split(/[;,]+/)
      .map((s) => s.trim().toLowerCase())
      .forEach((k) => k && tags.add(k));
  }

  // ein paar heuristische Standard-Stichworte
  if (slug) tags.add(String(slug).toLowerCase());

  return tags;
}

/**
 * Schnellfilter (FILTERS aus config.js) → Tag-Liste
 */
function getActiveQuickFilterTags() {
  const tagSet = new Set();
  FILTERS.forEach((f) => {
    if (quickFilterIds.has(f.id)) {
      f.tags.forEach((tag) => tagSet.add(tag));
    }
  });
  return tagSet;
}

/**
 * Mood → Tags
 */
function getActiveMoodTags() {
  if (!currentMood) return new Set();
  const tags = MOOD_TAGS[currentMood] || [];
  return new Set(tags);
}

/**
 * Alter grob prüfen – Spots können z. B. minAge/maxAge, ageGroup etc. haben.
 * Wir arbeiten sehr tolerant; unbekannt → passt erst einmal.
 */
function matchesAgeFilter(spot) {
  if (selectedAgeFilter === "all") return true;

  const minAge = Number(spot.minAge) || 0;
  const maxAge = Number(spot.maxAge) || 99;

  switch (selectedAgeFilter) {
    case "0-3":
      return minAge <= 3;
    case "4-9":
      return maxAge >= 4 && minAge <= 9;
    case "10+":
      return maxAge >= 10;
    default:
      return true;
  }
}

/**
 * Verifiziert-Flag – erwartet z. B. spot.verified === true oder "true".
 */
function isSpotVerified(spot) {
  if (!verifiedOnly) return true;
  return spot.verified === true || String(spot.verified).toLowerCase() === "true";
}

/**
 * Radius in km aus RADIUS_STEPS_KM (config.js).
 * Wenn Infinity → kein Limit.
 */
function getCurrentRadiusKm() {
  const step = RADIUS_STEPS_KM[currentRadiusStep] ?? Infinity;
  return step;
}

/**
 * Distanz (km) zwischen zwei Koordinaten (Haversine).
 */
function distanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Mittelpunkt für Radius-Berechnung – wir nehmen:
 *  - wenn es eine Geolocation gibt: diese
 *  - sonst aktuelle Kartenmitte
 */
function getRadiusOrigin() {
  if (map) {
    const center = map.getCenter();
    return { lat: center.lat, lng: center.lng };
  }
  // Fallback: erster Spot
  const first = allSpots[0];
  if (first && typeof first.lat === "number" && typeof first.lng === "number") {
    return { lat: first.lat, lng: first.lng };
  }
  return null;
}

/**
 * Filter anwenden → filteredSpots aktualisieren, Map + Liste neu rendern.
 */
function applyFilters() {
  const searchInput = /** @type {HTMLInputElement | null} */ (
    document.getElementById("filter-search")
  );
  const searchQuery = (searchInput?.value || "").trim().toLowerCase();

  const quickTags = getActiveQuickFilterTags();
  const moodTags = getActiveMoodTags();
  const activeRadiusKm = getCurrentRadiusKm();
  const origin = getRadiusOrigin();

  filteredSpots = allSpots.filter((spot) => {
    // 1) Search
    if (searchQuery) {
      const values = [
        spot.title,
        spot.name,
        spot.spotName,
        spot.description,
        spot.city,
        spot.region,
        spot.country
      ]
        .filter(Boolean)
        .map((s) => String(s).toLowerCase());

      const matchesText = values.some((v) => v.includes(searchQuery));
      if (!matchesText) return false;
    }

    // 2) Kategorie
    if (selectedCategorySlug) {
      const slug =
        spot.category ||
        spot.categorySlug ||
        spot.type ||
        spot.spotType ||
        spot.slug;
      if (!slug || String(slug) !== selectedCategorySlug) {
        return false;
      }
    }

    // 3) Verifiziert
    if (!isSpotVerified(spot)) return false;

    // 4) Alter
    if (!matchesAgeFilter(spot)) return false;

    // 5) Radius
    if (
      origin &&
      activeRadiusKm !== Infinity &&
      typeof spot.lat === "number" &&
      typeof spot.lng === "number"
    ) {
      const d = distanceKm(origin.lat, origin.lng, spot.lat, spot.lng);
      if (d > activeRadiusKm) return false;
    }

    // 6) Schnellfilter/Mood tags
    const tags = getSpotTags(spot);

    if (quickTags.size > 0) {
      let matchQuick = false;
      quickTags.forEach((tag) => {
        if (tags.has(tag)) matchQuick = true;
      });
      if (!matchQuick) return false;
    }

    if (moodTags.size > 0) {
      let matchMood = false;
      moodTags.forEach((tag) => {
        if (tags.has(tag)) matchMood = true;
      });
      if (!matchMood) return false;
    }

    return true;
  });

  if (filteredSpots.length === 0 && tilla) {
    tilla.onNoSpotsFound();
  } else if (filteredSpots.length > 0 && tilla) {
    tilla.onSpotsFound();
  }

  renderSpotsList();
  updateMapMarkers();
}

// ------------------------------------------------------
// Filter-UI: Mood, Radius, Schnellfilter, Kategorie, Alter, Verifiziert
// ------------------------------------------------------

function setupMoodChips() {
  const chips = document.querySelectorAll(
    ".mood-chip[data-mood]"
  );

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const value = chip.getAttribute("data-mood");
      /** @type {any} */
      const mood = value === "relaxed" || value === "action" || value === "water" || value === "animals"
        ? value
        : null;

      if (currentMood === mood) {
        currentMood = null;
      } else {
        currentMood = mood;
      }

      chips.forEach((c) => {
        const m = c.getAttribute("data-mood");
        const active = currentMood && currentMood === m;
        c.setAttribute("aria-pressed", active ? "true" : "false");
        c.classList.toggle("mood-chip--active", active);
      });

      applyFilters();
    });
  });
}

function updateRadiusTexts() {
  const radiusInput = /** @type {HTMLInputElement | null} */ (
    document.getElementById("filter-radius")
  );
  const descEl = document.getElementById("filter-radius-description");
  const maxLabel = document.getElementById("filter-radius-max-label");

  if (radiusInput) {
    radiusInput.value = String(currentRadiusStep);
    radiusInput.setAttribute("aria-valuenow", radiusInput.value);
  }

  const stepValue = RADIUS_STEPS_KM[currentRadiusStep];

  if (descEl) {
    let text;
    if (stepValue === Infinity) {
      text =
        currentLang === "de"
          ? "Alle Spots – ohne Radiusbegrenzung. Die Karte gehört euch."
          : currentLang === "da"
            ? "Alle spots – ingen radiusbegrænsning. Kortet er helt jeres."
            : "All spots – no radius limit. The map is all yours.";
    } else {
      const km = stepValue;
      text =
        currentLang === "de"
          ? `Spots im Umkreis von ca. ${km} km.`
          : currentLang === "da"
            ? `Spots i en radius på ca. ${km} km.`
            : `Spots within roughly ${km} km.`;
    }
    descEl.textContent = text;
  }

  if (maxLabel && stepValue === Infinity) {
    maxLabel.textContent =
      currentLang === "de"
        ? "Alle Spots"
        : currentLang === "da"
          ? "Alle spots"
          : "All spots";
  }
}

function setupRadiusSlider() {
  const radiusInput = /** @type {HTMLInputElement | null} */ (
    document.getElementById("filter-radius")
  );
  if (!radiusInput) return;

  radiusInput.addEventListener("input", () => {
    const val = parseInt(radiusInput.value, 10);
    if (!Number.isNaN(val)) {
      currentRadiusStep = Math.min(Math.max(val, 0), RADIUS_STEPS_KM.length - 1);
      updateRadiusTexts();
      applyFilters();
    }
  });

  updateRadiusTexts();
}

function populateQuickFiltersChips() {
  const container = document.getElementById("filter-tags");
  if (!container) return;

  container.innerHTML = "";

  FILTERS.forEach((filterDef) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quick-filter-chip";
    btn.dataset.quickId = filterDef.id;
    btn.setAttribute("aria-pressed", quickFilterIds.has(filterDef.id) ? "true" : "false");

    const label =
      filterDef.label[currentLang] ||
      filterDef.label.de ||
      Object.values(filterDef.label)[0];

    btn.textContent = label;

    btn.addEventListener("click", () => {
      if (quickFilterIds.has(filterDef.id)) {
        quickFilterIds.delete(filterDef.id);
      } else {
        quickFilterIds.add(filterDef.id);
      }
      btn.setAttribute(
        "aria-pressed",
        quickFilterIds.has(filterDef.id) ? "true" : "false"
      );
      applyFilters();
    });

    container.appendChild(btn);
  });
}

function populateCategorySelect() {
  const select = /** @type {HTMLSelectElement | null} */ (
    document.getElementById("filter-category")
  );
  if (!select) return;

  const labelsMap = getCategoryLabelsMap(currentLang);

  const currentValue = select.value;
  select.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent =
    currentLang === "de"
      ? "Alle Kategorien"
      : currentLang === "da"
        ? "Alle kategorier"
        : "All categories";
  select.appendChild(defaultOption);

  // Kategorien sortiert nach Gruppen
  Object.entries(CATEGORY_GROUPS).forEach(([groupName, slugs]) => {
    const groupLabel =
      CATEGORY_GROUP_LABELS[currentLang][groupName] ||
      CATEGORY_GROUP_LABELS.de[groupName] ||
      groupName;

    const optGroup = document.createElement("optgroup");
    optGroup.label = groupLabel;

    slugs.forEach((slug) => {
      const label = labelsMap[slug] || slug;
      const opt = document.createElement("option");
      opt.value = slug;
      opt.textContent = label;
      optGroup.appendChild(opt);
    });

    select.appendChild(optGroup);
  });

  // vorherige Auswahl, falls vorhanden
  if (currentValue) {
    select.value = currentValue;
    selectedCategorySlug = currentValue;
  } else {
    select.value = "";
    selectedCategorySlug = "";
  }
}

function setupFilterControls() {
  // Suche
  const searchInput = /** @type {HTMLInputElement | null} */ (
    document.getElementById("filter-search")
  );
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      applyFilters();
    });
  }

  // Kategorie
  const categorySelect = /** @type {HTMLSelectElement | null} */ (
    document.getElementById("filter-category")
  );
  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      selectedCategorySlug = categorySelect.value || "";
      applyFilters();
    });
  }

  // Alter
  const ageSelect = /** @type {HTMLSelectElement | null} */ (
    document.getElementById("filter-age")
  );
  if (ageSelect) {
    ageSelect.addEventListener("change", () => {
      selectedAgeFilter = ageSelect.value || "all";
      applyFilters();
    });
  }

  // Verifiziert
  const verifiedCheckbox = /** @type {HTMLInputElement | null} */ (
    document.getElementById("filter-verified")
  );
  if (verifiedCheckbox) {
    verifiedCheckbox.addEventListener("change", () => {
      verifiedOnly = verifiedCheckbox.checked;
      applyFilters();
    });
  }

  // Schnellfilter + Mood + Radius
  populateQuickFiltersChips();
  setupMoodChips();
  setupRadiusSlider();
}

// ------------------------------------------------------
// Kompass (Travel Mode)
// ------------------------------------------------------

function setupCompass() {
  compassSection = /** @type {HTMLElement | null} */ (
    document.getElementById("compass-section")
  );
  compassApplyBtn = /** @type {HTMLButtonElement | null} */ (
    document.getElementById("compass-apply")
  );

  const travelChips = document.querySelectorAll(
    ".compass-mode-chip[data-travel-mode]"
  );

  const updateTravelChipState = () => {
    travelChips.forEach((chip) => {
      const mode = chip.getAttribute("data-travel-mode");
      const active =
        (mode === "everyday" && travelMode === "everyday") ||
        (mode === "trip" && travelMode === "trip");
      chip.setAttribute("aria-pressed", active ? "true" : "false");
      chip.classList.toggle("mood-chip--active", active);
    });
  };

  travelChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const mode = chip.getAttribute("data-travel-mode");
      if (mode === "trip" || mode === "everyday") {
        travelMode = mode;
        if (tilla) tilla.setTravelMode(mode);

        // Radius grob voreinstellen
        currentRadiusStep = travelMode === "trip" ? 3 : 1;
        updateRadiusTexts();
        if (compassApplyBtn) {
          compassApplyBtn.classList.remove("hidden");
        }
        updateTravelChipState();
      }
    });
  });

  if (compassApplyBtn) {
    compassApplyBtn.addEventListener("click", () => {
      // Radius übernehmen & filtern
      updateRadiusTexts();
      applyFilters();

      if (tilla) {
        tilla.onCompassApplied({
          travelMode,
          radiusStep: currentRadiusStep
        });
      }
      if (!hasSeenCompassPlusHint()) {
        markCompassPlusHintSeen();
      }
      compassApplyBtn.classList.add("hidden");
    });
  }

  updateTravelChipState();
}

// ------------------------------------------------------
// Spots-Liste & Detail
// ------------------------------------------------------

function isFavorite(spot) {
  if (!spot) return false;
  const id =
    spot.id != null ? String(spot.id) : spot.slug || spot.spotSlug || spot.name;
  if (!id) return false;
  return favorites.has(id);
}

function toggleFavorite(spot) {
  if (!spot) return;

  const id =
    spot.id != null ? String(spot.id) : spot.slug || spot.spotSlug || spot.name;
  if (!id) return;

  const wasFav = favorites.has(id);

  if (wasFav) {
    favorites.delete(id);
    if (tilla) tilla.onFavoriteRemoved();
  } else {
    favorites.add(id);
    if (tilla) tilla.onFavoriteAdded();
  }

  saveFavoritesToStorage(favorites);

  // Liste und Detail aktualisieren
  renderSpotsList();
  renderSpotDetail(spot);
}

/**
 * Erstellt ein Listenelement für einen Spot.
 * @param {Spot} spot
 */
function renderSpotCard(spot) {
  const card = document.createElement("article");
  card.className = "spot-card";

  const title = document.createElement("h3");
  title.className = "spot-card-title";
  title.textContent =
    spot.title || spot.name || spot.spotName || getCategoryLabel(spot.category, currentLang);

  const subtitle = document.createElement("p");
  subtitle.className = "spot-card-subtitle";

  const catSlug =
    spot.category ||
    spot.categorySlug ||
    spot.type ||
    spot.spotType ||
    spot.slug;
  const catLabel = getCategoryLabel(catSlug, currentLang);

  const city = spot.city || spot.town || spot.village || "";
  subtitle.textContent = city ? `${catLabel} · ${city}` : catLabel;

  const metaRow = document.createElement("div");
  metaRow.className = "spot-card-meta";

  if (isPlusCategory(catSlug) || (spot.plusOnly && !corePlusActive())) {
    const badge = document.createElement("span");
    badge.className = "badge badge-plus";
    badge.textContent = currentLang === "de" ? "Plus" :
                        currentLang === "da" ? "Plus" : "Plus";
    metaRow.appendChild(badge);
  }

  if (spot.verified === true || String(spot.verified).toLowerCase() === "true") {
    const badgeV = document.createElement("span");
    badgeV.className = "badge badge-verified";
    badgeV.textContent =
      currentLang === "de"
        ? "Verifiziert"
        : currentLang === "da"
          ? "Verificeret"
          : "Verified";
    metaRow.appendChild(badgeV);
  }

  const favBtn = document.createElement("button");
  favBtn.type = "button";
  favBtn.className = "btn-icon spot-card-fav-btn";
  favBtn.setAttribute("aria-label", "Favorit");

  const favActive = isFavorite(spot);
  favBtn.textContent = favActive ? "★" : "☆";

  favBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleFavorite(spot);
  });

  const footer = document.createElement("div");
  footer.className = "spot-card-footer";

  const btnShow = document.createElement("button");
  btnShow.type = "button";
  btnShow.className = "btn btn-small";
  btnShow.textContent =
    currentLang === "de"
      ? "Auf Karte zeigen"
      : currentLang === "da"
        ? "Vis på kortet"
        : "Show on map";

  btnShow.addEventListener("click", (event) => {
    event.stopPropagation();
    focusSpotOnMap(spot);
  });

  footer.appendChild(btnShow);

  card.addEventListener("click", () => {
    focusSpotOnMap(spot);
  });

  card.appendChild(title);
  card.appendChild(subtitle);
  card.appendChild(metaRow);
  card.appendChild(favBtn);
  card.appendChild(footer);

  return card;
}

function renderSpotsList() {
  if (!spotListEl) return;

  spotListEl.innerHTML = "";

  if (!filteredSpots.length) {
    const p = document.createElement("p");
    p.className = "spot-list-empty";
    p.textContent =
      currentLang === "de"
        ? "Mit dieser Kombination aus Filtern ist die Karte gerade leer. Probiere einen größeren Radius oder eine andere Kategorie."
        : currentLang === "da"
          ? "Med denne kombination af filtre er kortet tomt. Prøv en større radius eller en anden kategori."
          : "With this combination of filters the map is empty. Try a larger radius or different category.";
    spotListEl.appendChild(p);
    return;
  }

  filteredSpots.forEach((spot) => {
    spotListEl.appendChild(renderSpotCard(spot));
  });
}

/**
 * Detailpanel unten rechts
 * @param {Spot | null} spot
 */
function renderSpotDetail(spot) {
  if (!spotDetailEl) return;

  if (!spot) {
    spotDetailEl.classList.add("spot-details--hidden");
    spotDetailEl.innerHTML = "";
    return;
  }

  spotDetailEl.classList.remove("spot-details--hidden");
  spotDetailEl.innerHTML = "";

  const title = document.createElement("h2");
  title.className = "spot-detail-title";
  title.textContent =
    spot.title || spot.name || spot.spotName || getCategoryLabel(spot.category, currentLang);

  const catSlug =
    spot.category ||
    spot.categorySlug ||
    spot.type ||
    spot.spotType ||
    spot.slug;
  const catLabel = getCategoryLabel(catSlug, currentLang);

  const locationLine = document.createElement("p");
  locationLine.className = "spot-detail-location";

  const city = spot.city || spot.town || spot.village || "";
  const region = spot.region || spot.state || "";
  const parts = [city, region].filter(Boolean);

  locationLine.textContent = parts.length ? `${catLabel} · ${parts.join(", ")}` : catLabel;

  const desc = document.createElement("p");
  desc.className = "spot-detail-description";
  desc.textContent = spot.description || spot.shortDescription || "";

  const actions = document.createElement("div");
  actions.className = "spot-detail-actions";

  const routeUrls = getRouteUrlsForSpot(spot);
  if (routeUrls) {
    const btnApple = document.createElement("a");
    btnApple.href = routeUrls.apple;
    btnApple.target = "_blank";
    btnApple.rel = "noopener noreferrer";
    btnApple.className = "btn btn-small";
    btnApple.textContent =
      currentLang === "de"
        ? "Route (Apple Karten)"
        : currentLang === "da"
          ? "Rute (Apple Maps)"
          : "Route (Apple Maps)";

    const btnGoogle = document.createElement("a");
    btnGoogle.href = routeUrls.google;
    btnGoogle.target = "_blank";
    btnGoogle.rel = "noopener noreferrer";
    btnGoogle.className = "btn btn-small";
    btnGoogle.textContent =
      currentLang === "de"
        ? "Route (Google Maps)"
        : currentLang === "da"
          ? "Rute (Google Maps)"
          : "Route (Google Maps)";

    actions.appendChild(btnApple);
    actions.appendChild(btnGoogle);
  }

  const favBtn = document.createElement("button");
  favBtn.type = "button";
  favBtn.className = "btn btn-small";
  const favActive = isFavorite(spot);
  favBtn.textContent =
    favActive
      ? currentLang === "de"
        ? "Favorit entfernen"
        : currentLang === "da"
          ? "Fjern favorit"
          : "Remove favourite"
      : currentLang === "de"
        ? "Als Favorit merken"
        : currentLang === "da"
          ? "Gem som favorit"
          : "Save as favourite";

  favBtn.addEventListener("click", () => {
    toggleFavorite(spot);
  });

  actions.appendChild(favBtn);

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "btn-ghost btn-small spot-detail-close";
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => {
    renderSpotDetail(null);
  });

  spotDetailEl.appendChild(closeBtn);
  spotDetailEl.appendChild(title);
  spotDetailEl.appendChild(locationLine);
  if (desc.textContent) spotDetailEl.appendChild(desc);
  spotDetailEl.appendChild(actions);
}

// ------------------------------------------------------
// Mein Tag (Daylog)
// ------------------------------------------------------

function setupDaylog() {
  const textarea = /** @type {HTMLTextAreaElement | null} */ (
    document.getElementById("daylog-text")
  );
  const btnSave = /** @type {HTMLButtonElement | null} */ (
    document.getElementById("daylog-save")
  );
  if (!textarea || !btnSave) return;

  const stored = loadDaylog();
  if (stored && stored.text) {
    textarea.value = stored.text;
  }

  btnSave.addEventListener("click", () => {
    const text = textarea.value;
    if (!text.trim()) return;
    saveDaylog(text);
    showToast(
      currentLang === "de"
        ? "Dein Tag wurde gespeichert."
        : currentLang === "da"
          ? "Din dag er gemt."
          : "Your day has been saved."
    );
    if (tilla) tilla.onDaylogSaved();
  });
}

// ------------------------------------------------------
// Plus-UI
// ------------------------------------------------------

function setupPlusUI() {
  if (!FEATURES.plus) return;

  const section = document.getElementById("plus-section");
  const toggleButton = document.getElementById("btn-toggle-plus");
  const codeInput = /** @type {HTMLInputElement | null} */ (
    document.getElementById("plus-code-input")
  );
  const codeSubmit = /** @type {HTMLButtonElement | null} */ (
    document.getElementById("plus-code-submit")
  );
  const statusText = document.getElementById("plus-status-text");

  initPlusUI({
    section,
    toggleButton,
    codeInput,
    codeSubmit,
    statusText,
    showToast,
    tilla,
    markHintSeen: markCompassPlusHintSeen,
    onPlusStateChanged: () => {
      // Nach Aktivierung von Plus neu filtern & Liste/Map aktualisieren
      applyFilters();
    },
    initialLang: currentLang
  });
}

// ------------------------------------------------------
// About-View-Switch
// ------------------------------------------------------

function setupAboutViewSwitch() {
  const viewMap = document.getElementById("view-map");
  const viewAbout = document.getElementById("view-about");
  const btnHelp = /** @type {HTMLButtonElement | null} */ (
    document.getElementById("btn-help")
  );

  if (!viewMap || !viewAbout || !btnHelp) return;

  let showingAbout = false;

  function updateView() {
    if (showingAbout) {
      viewMap.classList.remove("view--active");
      viewAbout.classList.add("view--active");
    } else {
      viewAbout.classList.remove("view--active");
      viewMap.classList.add("view--active");
    }
  }

  btnHelp.addEventListener("click", () => {
    showingAbout = !showingAbout;
    updateView();
  });

  updateView();
}

// ------------------------------------------------------
// Locate-Button
// ------------------------------------------------------

function setupLocateButton() {
  const btnLocate = /** @type {HTMLButtonElement | null} */ (
    document.getElementById("btn-locate")
  );
  if (!btnLocate || !map) return;

  btnLocate.addEventListener("click", () => {
    if (!navigator.geolocation) {
      showToast(
        currentLang === "de"
          ? "Geoposition wird von diesem Gerät nicht unterstützt."
          : currentLang === "da"
            ? "Geoposition understøttes ikke på denne enhed."
            : "Geolocation is not supported on this device."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        map.setView([latitude, longitude], 13, { animate: true });

        // Danach Filter (Radius) ggf. neu anwenden
        applyFilters();
      },
      (err) => {
        console.warn("Geolocation error", err);
        showToast(
          currentLang === "de"
            ? "Standort konnte nicht ermittelt werden."
            : currentLang === "da"
              ? "Positionen kunne ikke fastlægges."
              : "Could not determine your location."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000
      }
    );
  });
}

// ------------------------------------------------------
// Init
// ------------------------------------------------------

async function initApp() {
  toastEl = document.getElementById("toast");
  spotListEl = document.getElementById("spot-list");
  spotDetailEl = document.getElementById("spot-detail");

  // Theme
  const storedTheme = loadStoredTheme();
  applyTheme(storedTheme || "light");
  setupThemeToggle();

  // i18n initialisieren
  await initI18n();
  currentLang = getLanguage();
  applyTranslations(document);
  updateLanguageFlagAndAbout();
  setupLanguageSwitcher();

  // About-View
  setupAboutViewSwitch();

  // Karte
  const mapInit = initMap();
  map = mapInit.map;
  markersLayer = mapInit.markersLayer;

  // Tilla
  tilla = new TillaCompanion({
    getText: (key) => tI18n(key)
  });

  // Daten laden
  let data;
  try {
    data = await loadData();
  } catch (err) {
    console.error("Fehler beim Laden der Spots:", err);
    showToast(
      currentLang === "de"
        ? "Spots konnten nicht geladen werden – bitte später erneut versuchen."
        : currentLang === "da"
          ? "Spots kunne ikke indlæses – prøv igen senere."
          : "Could not load spots – please try again later."
    );
    return;
  }

  allSpots = data.spots || getSpots() || [];

  // Filter-UI
  populateCategorySelect();
  setupFilterControls();
  setupCompass();

  // Mein Tag
  setupDaylog();

  // Plus-UI
  setupPlusUI();

  // Locate
  setupLocateButton();

  // Erste Filterung
  filteredSpots = allSpots.slice();
  renderSpotsList();
  updateMapMarkers();
}

// DOM-Ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}