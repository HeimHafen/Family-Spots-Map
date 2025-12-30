// js/app.js
// ======================================================
// Family Spots Map – Hauptlogik (UI, State, Tilla, Navigation)
// Map- und Filterlogik ist in map.js / filters.js ausgelagert.
// Daten & Plus-Logik sind in data.js / features/plus.js ausgelagert.
// ======================================================

"use strict";

import "./i18n.js"; // setzt window.I18N

import { initMenu } from "./ui/menu.js";
import { initLanguageSwitcher } from "./ui/language.js";
import { initSkipToSpots } from "./ui/skip-to-spots.js";

import { TillaCompanion } from "./features/tilla.js";

import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  DAYLOG_STORAGE_KEY,
  LANG_DE,
  LANG_EN,
  LANG_DA,
  THEME_LIGHT,
  THEME_DARK,
  RADIUS_STEPS_KM,
  MAX_MARKERS_RENDER,
  FEATURES,
  CATEGORY_GROUPS,
  CATEGORY_GROUP_LABELS,
  CATEGORY_LABELS_DE,
  CATEGORY_LABELS_EN,
  HEADER_TAGLINE_TEXT,
  FILTERS,
  CATEGORY_ACCESS,
  CATEGORY_LABELS_DA
} from "./config.js";

import { normalizeSpot, filterSpots, getSpotName, getSpotSubtitle, getSpotId } from "./filters.js";
import { initMap, renderMarkers, hasValidLatLng } from "./map.js";

import { initRouter } from "./router.js";
import { getInitialTheme, applyTheme } from "./theme.js";
import { initToast, showToast } from "./toast.js";
import { loadData } from "./data.js";

import {
  getPlusStatus,
  formatPlusStatus,
  redeemPartnerCode,
  isPlusCategory
} from "./features/plus.js";

// ------------------------------------------------------
// Debug
// ------------------------------------------------------
const DEBUG = false;
const log = (...args) => { if (DEBUG) console.log(...args); };
const warn = (...args) => { if (DEBUG) console.warn(...args); };

// ------------------------------------------------------
// Typdefinitionen (JSDoc)
// ------------------------------------------------------

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
 * @property {string} [categorySlug]
 * @property {string[]} [categories]
 * @property {string[]} [tags]
 * @property {string} [subtitle]
 * @property {string} [shortDescription]
 * @property {string} [summary_de]
 * @property {string} [summary_en]
 * @property {string} [summary_da]
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
 * @property {string} [validFrom]
 * @property {string} [validTo]
 * @property {string} [valid_from]
 * @property {string} [valid_to]
 */

// ------------------------------------------------------
// i18n helper
// ------------------------------------------------------
const t = (key, fallback) =>
  (typeof I18N !== "undefined" && typeof I18N.t === "function")
    ? I18N.t(key, fallback)
    : (fallback ?? key);

/**
 * Toast helper:
 * - Wenn key in i18n existiert → showToast(key)
 * - sonst optional fallbackText als Literal
 */
function toastKey(key, fallbackText) {
  const translated = t(key, null);
  if (translated && translated !== key) {
    showToast(key);
  } else if (fallbackText) {
    showToast(fallbackText);
  } else {
    showToast(key);
  }
}

// ------------------------------------------------------
// Small utilities
// ------------------------------------------------------
function debounce(fn, delay = 200) {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), delay);
  };
}

function activateOnEnterSpace(handler) {
  return (event) => {
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      handler(event);
    }
  };
}

function safeJsonParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}
function storageRemove(key) {
  try { localStorage.removeItem(key); return true; } catch { return false; }
}

// ------------------------------------------------------
// Tilla helper
// ------------------------------------------------------
function safeTillaCall(method, ...args) {
  try {
    if (tilla && typeof tilla[method] === "function") {
      tilla[method](...args);
    }
  } catch (err) {
    // Tilla darf nie die App killen
    warn("[Family Spots] Tilla call failed:", method, err);
  }
}

// ------------------------------------------------------
// Globaler UI-State
// ------------------------------------------------------

let currentLang = LANG_DE;
let currentTheme = THEME_LIGHT;

// Map / Daten
/** @type {any} */
let map = null;
/** @type {any} */
let markersLayer = null;
/** @type {Spot[]} */
let spots = [];
/** @type {Spot[]} */
let filteredSpots = [];
let favorites = new Set();
/** Mein Tag – gespeicherte Einträge */
let daylogEntries = [];

// Toast-Entprellung
let hasShownMarkerLimitToast = false;

// Filter-States
let plusActive = false;
let moodFilter = null; // "relaxed" | "action" | "water" | "animals" | null
let travelMode = null; // "everyday" | "trip" | null
let radiusStep = 4; // 0–4 (Default: max)
let ageFilter = "all"; // "all" | "0-3" | "4-9" | "10+"
let searchTerm = "";
let categoryFilter = "";
let onlyBigAdventures = false;
let onlyVerified = false;
let onlyFavorites = false;
let filtersCollapsed = true;
/** Aktive Tag-Filter (IDs aus FILTERS) */
let activeTagFilters = new Set();

// ------------------------------------------------------
// Geolocation / Real Location State
// ------------------------------------------------------

/**
 * @type {{lat:number,lng:number,accuracy?:number,ts?:number}|null}
 */
let userLocation = null;

/** @type {number|null} */
let geoWatchId = null;

/** show radius-disabled toast only once per session */
let hasShownRadiusDisabledToast = false;

function setUserLocation(lat, lng, accuracy) {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  userLocation = {
    lat,
    lng,
    accuracy: Number.isFinite(accuracy) ? accuracy : undefined,
    ts: Date.now()
  };
}

function getUserOriginLatLng() {
  if (!userLocation) return null;
  if (typeof L === "undefined" || typeof L.latLng !== "function") return null;
  return L.latLng(userLocation.lat, userLocation.lng);
}

function requestUserLocationOnce(options = {}) {
  const { enableHighAccuracy = true, timeout = 8000, maximumAge = 0 } = options;

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("geolocation_unavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords || {};
        setUserLocation(latitude, longitude, accuracy);
        resolve(userLocation);
      },
      (err) => reject(err),
      { enableHighAccuracy, timeout, maximumAge }
    );
  });
}

function startLocationWatch() {
  if (!navigator.geolocation) return;
  if (geoWatchId != null) return;

  try {
    geoWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords || {};
        setUserLocation(latitude, longitude, accuracy);
        // Update list/markers/distances without forcing map movement
        applyFiltersAndRender();
      },
      () => {
        // Ignorieren – User kann erneut "Locate" drücken
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );
  } catch {
    geoWatchId = null;
  }
}

function stopLocationWatch() {
  if (!navigator.geolocation) return;
  if (geoWatchId == null) return;
  try {
    navigator.geolocation.clearWatch(geoWatchId);
  } catch {}
  geoWatchId = null;
}

// ------------------------------------------------------
// Routing URLs: always from real location if present
// ------------------------------------------------------
function getRouteUrlsForSpotFromUserLocation(spot) {
  if (!hasValidLatLng(spot)) return null;

  const destLat = spot.lat;
  const destLng = spot.lng;

  const origin = userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null;

  const apple = origin
    ? `https://maps.apple.com/?saddr=${encodeURIComponent(origin.lat + "," + origin.lng)}&daddr=${encodeURIComponent(destLat + "," + destLng)}`
    : `https://maps.apple.com/?daddr=${encodeURIComponent(destLat + "," + destLng)}`;

  const google = origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin.lat + "," + origin.lng)}&destination=${encodeURIComponent(destLat + "," + destLng)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destLat + "," + destLng)}`;

  return { apple, google };
}

// ------------------------------------------------------
// DOM refs
// ------------------------------------------------------
let languageSwitcherEl;
let languageSwitcherFlagEl;
let themeToggleEl;
let btnLocateEl;
let btnHelpEl;
let viewMapEl;
let viewAboutEl;
let bottomNavButtons;
let bottomNavMapLabelEl;
let bottomNavAboutLabelEl;
let sidebarEl;
let filterSectionEl;
let btnToggleFiltersEl;
let btnToggleViewEl;
let filterSearchEl;
let filterCategoryEl;
let filterAgeEl;
let filterRadiusEl;
let filterRadiusMaxLabelEl;
let filterRadiusDescriptionEl;
let filterBigEl;
let filterVerifiedEl;
let filterFavoritesEl;
let spotListEl;
let spotDetailEl;
let tagFilterContainerEl;

// Plus & Mein Tag
let plusSectionEl;
let btnTogglePlusEl;
let daylogSectionEl;
let btnToggleDaylogEl;

let plusCodeInputEl;
let plusCodeSubmitEl;
let plusStatusTextEl;
let daylogTextEl;
let daylogSaveEl;
let daylogLastSavedEl;
let daylogClearEl;
let daylogListEl;
let toastEl;

// Tilla
let tilla = null;

// Spielideen
let playIdeasBtnEl = null;

// Filter-Body in Filter-Section
let filterBodyEls = [];

// Fokus-Merkung
let lastSpotTriggerEl = null;

// Filtermodal
let btnOpenFilterModalEl;
let filterModalEl;
let filterModalCloseEl;
let filterModalApplyEl;
let filterModalResetEl;
let filterSummaryEl;

let isFilterModalOpen = false;
let lastFocusBeforeFilterModal = null;

// Skip link
let skipLinkEl;

// ------------------------------------------------------
// Static i18n (data-i18n-de/en/da) – kompatibel mit deinem HTML
// ------------------------------------------------------
function applyStaticI18n() {
  document.querySelectorAll("[data-i18n-de]").forEach((el) => {
    let attrName;
    if (currentLang === LANG_EN) attrName = "data-i18n-en";
    else if (currentLang === LANG_DA) attrName = "data-i18n-da";
    else attrName = "data-i18n-de";

    let text = el.getAttribute(attrName);
    if (!text) text = el.getAttribute("data-i18n-de") || el.getAttribute("data-i18n-en");
    if (text) el.textContent = text;
  });
}

function initLazyLoadImages() {
  if (!("loading" in HTMLImageElement.prototype)) return;
  document.querySelectorAll("img").forEach((img) => {
    if (!img.loading || img.loading === "auto") img.loading = "lazy";
  });
}

function updateMetaAndA11yFromI18n() {
  if (typeof I18N === "undefined" || typeof I18N.t !== "function") return;

  const metaTitle = I18N.t("meta_title", document.title || "");
  if (metaTitle) document.title = metaTitle;

  const metaDescEl = document.querySelector('meta[name="description"]');
  if (metaDescEl) {
    const currentDesc = metaDescEl.getAttribute("content") || "";
    metaDescEl.setAttribute("content", I18N.t("meta_description", currentDesc));
  }

  if (themeToggleEl) {
    const fallback = themeToggleEl.getAttribute("aria-label") || "";
    themeToggleEl.setAttribute("aria-label", I18N.t("btn_theme_toggle_aria", fallback));
  }

  if (btnLocateEl) {
    const fallback = btnLocateEl.getAttribute("aria-label") || "";
    btnLocateEl.setAttribute("aria-label", I18N.t("btn_locate_aria", fallback));
  }

  if (btnHelpEl) {
    const fallback = btnHelpEl.getAttribute("aria-label") || "";
    btnHelpEl.setAttribute("aria-label", I18N.t("btn_help_aria", fallback));
  }

  const tillaImg = document.querySelector("#tilla-section img");
  if (tillaImg) {
    const fallback = tillaImg.alt || "";
    tillaImg.alt = I18N.t("alt_tilla_image", fallback);
  }
}

function updateHeaderTagline(lang) {
  const el = document.getElementById("header-tagline");
  if (!el) return;

  let text =
    (HEADER_TAGLINE_TEXT && HEADER_TAGLINE_TEXT[lang]) ||
    (HEADER_TAGLINE_TEXT && HEADER_TAGLINE_TEXT.de) ||
    el.textContent ||
    "";

  if (typeof I18N !== "undefined" && typeof I18N.t === "function") {
    text = I18N.t("header_tagline", text) || text;
  }

  el.textContent = text;
}

// ------------------------------------------------------
// Sprache
// ------------------------------------------------------
function getInitialLang() {
  const stored = storageGet("fs_lang");
  if (stored === LANG_DE || stored === LANG_EN || stored === LANG_DA) return stored;

  if (typeof I18N !== "undefined" && typeof I18N.getLanguage === "function") {
    const fromI18n = I18N.getLanguage();
    if (fromI18n === LANG_DE || fromI18n === LANG_EN || fromI18n === LANG_DA) return fromI18n;
  }

  const htmlLang = (document.documentElement.lang || navigator.language || LANG_DE).toLowerCase().slice(0, 2);
  if (htmlLang === "en") return LANG_EN;
  if (htmlLang === "da" || htmlLang === "dk") return LANG_DA;
  return LANG_DE;
}

function updateLanguageSwitcherVisual() {
  if (!languageSwitcherEl) return;

  if (languageSwitcherFlagEl) {
    let src = "assets/flags/flag-de.svg";
    let alt = "Deutsch";
    if (currentLang === LANG_EN) { src = "assets/flags/flag-gb.svg"; alt = "English"; }
    else if (currentLang === LANG_DA) { src = "assets/flags/flag-dk.svg"; alt = "Dansk"; }
    languageSwitcherFlagEl.src = src;
    languageSwitcherFlagEl.alt = alt;
  } else {
    let label = "DE";
    if (currentLang === LANG_EN) label = "EN";
    else if (currentLang === LANG_DA) label = "DA";
    languageSwitcherEl.textContent = label;
  }

  const ariaLabel =
    currentLang === LANG_DE
      ? "Sprache: Deutsch (Tippen für Dansk)"
      : currentLang === LANG_DA
      ? "Sprog: Dansk (tryk for English)"
      : "Language: English (tap for Deutsch)";
  languageSwitcherEl.setAttribute("aria-label", ariaLabel);
}

function setLanguage(lang, { initial = false } = {}) {
  currentLang = (lang === LANG_EN) ? LANG_EN : (lang === LANG_DA) ? LANG_DA : LANG_DE;

  storageSet("fs_lang", currentLang);
  document.documentElement.lang = currentLang;

  // I18N modul parallel halten (falls genutzt)
  try {
    if (typeof I18N !== "undefined" && typeof I18N.setLanguage === "function") {
      I18N.setLanguage(currentLang);
    }
  } catch (err) {
    console.error("[Family Spots] I18N.setLanguage fehlgeschlagen:", err);
  }

  updateMetaAndA11yFromI18n();
  updateHeaderTagline(currentLang);

  if (bottomNavMapLabelEl) bottomNavMapLabelEl.textContent = t("nav_map", bottomNavMapLabelEl.textContent || "Karte");
  if (bottomNavAboutLabelEl) bottomNavAboutLabelEl.textContent = t("nav_about", bottomNavAboutLabelEl.textContent || "Über");

  const aboutDe = document.getElementById("page-about-de");
  const aboutDa = document.getElementById("page-about-da");
  const aboutEn = document.getElementById("page-about-en");

  if (aboutDe && aboutEn && aboutDa) {
    const showDe = currentLang === LANG_DE;
    const showDa = currentLang === LANG_DA;
    const showEn = currentLang === LANG_EN;

    aboutDe.classList.toggle("hidden", !showDe);
    aboutDe.setAttribute("aria-hidden", showDe ? "false" : "true");

    aboutDa.classList.toggle("hidden", !showDa);
    aboutDa.setAttribute("aria-hidden", showDa ? "false" : "true");

    aboutEn.classList.toggle("hidden", !showEn);
    aboutEn.setAttribute("aria-hidden", showEn ? "false" : "true");
  }

  // Button labels
  if (btnToggleFiltersEl) {
    const span = btnToggleFiltersEl.querySelector("span");
    if (span) span.textContent = filtersCollapsed ? t("btn_show_filters", "Filter anzeigen") : t("btn_hide_filters", "Filter ausblenden");
  }

  if (btnToggleViewEl && sidebarEl) {
    const sidebarHidden = sidebarEl.classList.contains("hidden");
    const span = btnToggleViewEl.querySelector("span");
    if (span) span.textContent = sidebarHidden ? t("btn_show_list", "Liste anzeigen") : t("btn_only_map", "Nur Karte");
  }

  if (filterSearchEl) {
    filterSearchEl.placeholder =
      currentLang === LANG_EN ? "Place, spot, keywords …"
      : currentLang === LANG_DA ? "Sted, spot, søgeord …"
      : "Ort, Spot, Stichwort …";
  }

  if (daylogTextEl && FEATURES.daylog) {
    daylogTextEl.placeholder =
      currentLang === LANG_EN
        ? "Today we found a place where time slowed down a little."
        : currentLang === LANG_DA
        ? "I dag fandt vi et sted, hvor tiden blev lidt langsommere."
        : "Heute haben wir einen Ort gefunden, an dem die Zeit kurz langsamer wurde.";
  }

  updateRadiusTexts();

  if (filterCategoryEl) {
    populateCategoryOptions();
  }

  if (tagFilterContainerEl) renderTagFilterChips();
  updateLanguageSwitcherVisual();
  applyStaticI18n();
  updatePlusStatusText();
  updateFilterSummary();

  safeTillaCall("onLanguageChanged");

  if (!initial) {
    const headerTitle = document.querySelector(".header-title");
    if (headerTitle && typeof headerTitle.focus === "function") headerTitle.focus();
  }
}

// ------------------------------------------------------
// Kategorien
// ------------------------------------------------------
function getCategoryLabel(slug) {
  if (!slug) return "";

  let langMap, fallbackMap;
  if (currentLang === LANG_EN) { langMap = CATEGORY_LABELS_EN; fallbackMap = CATEGORY_LABELS_DE; }
  else if (currentLang === LANG_DA) { langMap = CATEGORY_LABELS_DA; fallbackMap = CATEGORY_LABELS_DE; }
  else { langMap = CATEGORY_LABELS_DE; fallbackMap = CATEGORY_LABELS_EN; }

  return (langMap && langMap[slug]) || (fallbackMap && fallbackMap[slug]) || slug.replace(/[_-]/g, " ");
}

function getCategoryLabelWithAccess(slug) {
  const base = getCategoryLabel(slug);
  if (!CATEGORY_ACCESS || !CATEGORY_ACCESS.perCategory) return base;

  const access = CATEGORY_ACCESS.perCategory[slug];
  if (!access) return base;

  if (access.level === "subscription") return base + " · Plus";

  if (access.level === "addon") {
    let suffix;
    if (access.addonId === "addon_water") {
      suffix = currentLang === LANG_EN ? " · water add-on (Plus)" : currentLang === LANG_DA ? " · vand-add-on (Plus)" : " · Wasser-Add-on (Plus)";
    } else if (access.addonId === "addon_rv") {
      suffix = currentLang === LANG_EN ? " · RV add-on (Plus)" : currentLang === LANG_DA ? " · autocamper-add-on (Plus)" : " · WoMo-Add-on (Plus)";
    } else {
      suffix = currentLang === LANG_EN ? " · add-on (Plus)" : currentLang === LANG_DA ? " · add-on (Plus)" : " · Add-on (Plus)";
    }
    return base + suffix;
  }

  return base;
}

function populateCategoryOptions() {
  if (!filterCategoryEl) return;

  const frag = document.createDocumentFragment();

  const firstOption = document.createElement("option");
  firstOption.value = "";
  firstOption.textContent = t("filter_category_all", "Alle Kategorien");
  frag.appendChild(firstOption);

  const groupedSlugs = new Set();

  Object.entries(CATEGORY_GROUPS || {}).forEach(([groupKey, slugs]) => {
    if (!Array.isArray(slugs) || !slugs.length) return;

    const groupLabel =
      (CATEGORY_GROUP_LABELS && CATEGORY_GROUP_LABELS[currentLang] && CATEGORY_GROUP_LABELS[currentLang][groupKey]) ||
      groupKey;

    const optgroup = document.createElement("optgroup");
    optgroup.label = groupLabel;

    slugs.forEach((slug) => {
      if (!slug) return;
      groupedSlugs.add(slug);
      const opt = document.createElement("option");
      opt.value = slug;
      opt.textContent = getCategoryLabelWithAccess(slug);
      optgroup.appendChild(opt);
    });

    frag.appendChild(optgroup);
  });

  // additional categories discovered from data
  const extraSet = new Set();
  spots.forEach((spot) => {
    if (Array.isArray(spot.categories)) {
      spot.categories.forEach((c) => { if (c && !groupedSlugs.has(c)) extraSet.add(c); });
    } else if (spot.category && !groupedSlugs.has(spot.category)) {
      extraSet.add(spot.category);
    }
  });

  if (extraSet.size > 0) {
    const extraGroup = document.createElement("optgroup");
    extraGroup.label =
      currentLang === LANG_EN ? "Other categories"
      : currentLang === LANG_DA ? "Andre kategorier"
      : "Weitere Kategorien";

    Array.from(extraSet)
      .sort((a, b) => getCategoryLabel(a).toLowerCase().localeCompare(
        getCategoryLabel(b).toLowerCase(),
        currentLang === LANG_DE ? "de" : currentLang === LANG_DA ? "da" : "en"
      ))
      .forEach((slug) => {
        const opt = document.createElement("option");
        opt.value = slug;
        opt.textContent = getCategoryLabelWithAccess(slug);
        extraGroup.appendChild(opt);
      });

    frag.appendChild(extraGroup);
  }

  // preserve selection
  const selected = categoryFilter || "";
  filterCategoryEl.replaceChildren(frag);
  filterCategoryEl.value = selected;
}

// ------------------------------------------------------
// Radius / Geodistanz
// ------------------------------------------------------
function getMaxRadiusIndex() {
  return Math.max(0, (RADIUS_STEPS_KM?.length || 1) - 1);
}

function updateRadiusTexts() {
  if (!filterRadiusEl || !filterRadiusMaxLabelEl || !filterRadiusDescriptionEl) return;

  let value = parseInt(filterRadiusEl.value, 10);
  if (Number.isNaN(value)) value = getMaxRadiusIndex();
  value = Math.min(Math.max(value, 0), getMaxRadiusIndex());

  radiusStep = value;
  filterRadiusEl.value = String(radiusStep);
  filterRadiusEl.setAttribute("aria-valuenow", String(radiusStep));

  const maxIndex = getMaxRadiusIndex();
  if (radiusStep === maxIndex) {
    filterRadiusMaxLabelEl.textContent = t("filter_radius_max_label", "Alle Spots");
    filterRadiusDescriptionEl.textContent = t("filter_radius_description_all", "Alle Spots – ohne Radiusbegrenzung.");
  } else {
    const km = RADIUS_STEPS_KM[radiusStep];
    filterRadiusMaxLabelEl.textContent = `${km} km`;
    const key = `filter_radius_description_step${radiusStep}`;
    filterRadiusDescriptionEl.textContent = t(key, `${km} km – begrenzt um deinen Standort.`);
  }
}

/**
 * Effective radius:
 * - If slider is limited but userLocation missing -> treat as Infinity (disable radius)
 *   and show a toast once to explain.
 */
function getEffectiveRadiusKm() {
  const maxIndex = getMaxRadiusIndex();
  const requested = RADIUS_STEPS_KM[radiusStep] ?? RADIUS_STEPS_KM[maxIndex] ?? Infinity;

  if (radiusStep === maxIndex) return requested; // all spots
  if (userLocation) return requested;

  // location missing but limited radius chosen -> disable radius for trust
  if (!hasShownRadiusDisabledToast) {
    hasShownRadiusDisabledToast = true;
    toastKey(
      "toast_location_unavailable_radius_disabled",
      currentLang === LANG_EN
        ? "Location not available – radius filter is disabled."
        : currentLang === LANG_DA
        ? "Placering ikke tilgængelig – radiusfilter er slået fra."
        : "Standort nicht verfügbar – Radiusfilter ist deaktiviert."
    );
  }
  return Infinity;
}

function initRadiusSliderA11y() {
  if (!filterRadiusEl) return;

  const min = filterRadiusEl.min || "0";
  const max = filterRadiusEl.max || String(getMaxRadiusIndex());

  if (!filterRadiusEl.value) filterRadiusEl.value = max;

  filterRadiusEl.setAttribute("aria-valuemin", min);
  filterRadiusEl.setAttribute("aria-valuemax", max);
  filterRadiusEl.setAttribute("aria-valuenow", filterRadiusEl.value);

  const onRadiusInput = debounce(async () => {
    updateRadiusTexts();

    // If radius limited, try to obtain location once (user-initiated interaction)
    const maxIndex = getMaxRadiusIndex();
    if (radiusStep !== maxIndex && !userLocation && navigator.geolocation) {
      try {
        await requestUserLocationOnce({ enableHighAccuracy: true, timeout: 9000 });
        startLocationWatch();
      } catch {
        // user denied -> handled by getEffectiveRadiusKm()
      }
    }

    applyFiltersAndRender();
  }, 120);

  filterRadiusEl.addEventListener("input", () => onRadiusInput());
  updateRadiusTexts();
}

function isSpotInRadius(spot, originLatLng, radiusKm) {
  if (!originLatLng || typeof originLatLng.distanceTo !== "function") return true;
  if (!isFinite(radiusKm) || radiusKm === Infinity) return true;
  if (!hasValidLatLng(spot)) return true;
  if (typeof L === "undefined" || typeof L.latLng !== "function") return true;

  const spotLatLng = L.latLng(spot.lat, spot.lng);
  const distanceKm = originLatLng.distanceTo(spotLatLng) / 1000;
  return distanceKm <= radiusKm;
}

// ------------------------------------------------------
// Tag Filter Chips
// ------------------------------------------------------
function renderTagFilterChips() {
  if (!tagFilterContainerEl) return;

  if (!FILTERS || !Array.isArray(FILTERS) || !FILTERS.length) {
    tagFilterContainerEl.replaceChildren();
    return;
  }

  const frag = document.createDocumentFragment();

  FILTERS.forEach((filter) => {
    if (!filter || !filter.id) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tag-filter-chip btn-chip";
    btn.dataset.filterId = filter.id;

    const isActive = activeTagFilters.has(filter.id);
    btn.classList.toggle("tag-filter-chip--active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");

    const label = (filter.label && (filter.label[currentLang] || filter.label.de)) || filter.id;
    btn.textContent = label;

    btn.addEventListener("click", () => {
      if (activeTagFilters.has(filter.id)) activeTagFilters.delete(filter.id);
      else activeTagFilters.add(filter.id);

      renderTagFilterChips();
      applyFiltersAndRender();
    });

    frag.appendChild(btn);
  });

  tagFilterContainerEl.replaceChildren(frag);
}

// ------------------------------------------------------
// Filter Summary
// ------------------------------------------------------
function getMoodLabel(moodKey) {
  if (!moodKey) return "";
  if (currentLang === LANG_EN) {
    if (moodKey === "relaxed") return "Relaxed";
    if (moodKey === "action") return "Active";
    if (moodKey === "water") return "Water & sand";
    if (moodKey === "animals") return "Animal day";
  } else if (currentLang === LANG_DA) {
    if (moodKey === "relaxed") return "Afslappet";
    if (moodKey === "action") return "Aktiv";
    if (moodKey === "water") return "Vand & sand";
    if (moodKey === "animals") return "Dyredag";
  } else {
    if (moodKey === "relaxed") return "Entspannt";
    if (moodKey === "action") return "Bewegung";
    if (moodKey === "water") return "Wasser & Sand";
    if (moodKey === "animals") return "Tier-Tag";
  }
  return "";
}

function updateFilterSummary() {
  if (!filterSummaryEl) return;

  const parts = [];
  const maxIndex = getMaxRadiusIndex();

  if (searchTerm) {
    parts.push(
      currentLang === LANG_EN ? `Search: “${searchTerm}”`
      : currentLang === LANG_DA ? `Søgning: “${searchTerm}”`
      : `Suche: „${searchTerm}“`
    );
  }

  if (moodFilter) {
    const moodLabel = getMoodLabel(moodFilter);
    if (moodLabel) {
      parts.push(
        currentLang === LANG_EN ? `Mood: ${moodLabel}`
        : currentLang === LANG_DA ? `Stemning: ${moodLabel}`
        : `Stimmung: ${moodLabel}`
      );
    }
  }

  if (radiusStep !== maxIndex) {
    const km = RADIUS_STEPS_KM[radiusStep];
    parts.push(`Radius: ${km} km`);
  }

  if (categoryFilter && filterCategoryEl) {
    const selected = filterCategoryEl.selectedOptions?.[0];
    const label = (selected && selected.textContent.trim()) || getCategoryLabel(categoryFilter);
    if (label) {
      parts.push(
        currentLang === LANG_EN ? `Category: ${label}`
        : currentLang === LANG_DA ? `Kategori: ${label}`
        : `Kategorie: ${label}`
      );
    }
  }

  if (ageFilter !== "all" && filterAgeEl) {
    const selected = filterAgeEl.selectedOptions?.[0];
    const label = selected ? selected.textContent.trim() : ageFilter;
    parts.push(
      currentLang === LANG_EN ? `Age: ${label}`
      : currentLang === LANG_DA ? `Alder: ${label}`
      : `Alter: ${label}`
    );
  }

  if (activeTagFilters.size > 0) {
    const count = activeTagFilters.size;
    parts.push(
      currentLang === LANG_EN ? `Quick filters (${count})`
      : currentLang === LANG_DA ? `Hurtigfiltre (${count})`
      : `Schnellfilter (${count})`
    );
  }

  if (onlyVerified) parts.push(currentLang === LANG_EN ? "Only verified spots" : currentLang === LANG_DA ? "Kun verificerede spots" : "Nur verifizierte Spots");
  if (onlyFavorites) parts.push(currentLang === LANG_EN ? "Favourites only" : currentLang === LANG_DA ? "Kun favoritter" : "Nur Favoriten");
  if (onlyBigAdventures) parts.push(currentLang === LANG_EN ? "Big adventures" : currentLang === LANG_DA ? "Store eventyr" : "Große Abenteuer");

  if (!parts.length) {
    filterSummaryEl.textContent =
      currentLang === LANG_EN ? "Active filters: basic filters"
      : currentLang === LANG_DA ? "Aktive filtre: basisfiltre"
      : "Aktive Filter: Basisfilter";
  } else {
    const prefix = currentLang === LANG_EN ? "Active filters: " : currentLang === LANG_DA ? "Aktive filtre: " : "Aktive Filter: ";
    filterSummaryEl.textContent = prefix + parts.join(" · ");
  }
}

function getFilterContext() {
  const maxIndex = getMaxRadiusIndex();
  const radiusKm = (radiusStep >= 0 && radiusStep <= maxIndex)
    ? (RADIUS_STEPS_KM[radiusStep] ?? Infinity)
    : (RADIUS_STEPS_KM[maxIndex] ?? Infinity);

  const origin = userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null;

  return {
    lang: currentLang,
    plusActive,
    searchTerm,
    moodFilter,
    travelMode,
    radiusStep,
    radiusKm,
    ageFilter,
    categoryFilter,
    onlyBigAdventures,
    onlyVerified,
    onlyFavorites,
    activeTagFilters: Array.from(activeTagFilters),
    origin
  };
}

// ------------------------------------------------------
// Filter Modal
// ------------------------------------------------------
function openFilterModal() {
  if (!filterModalEl) return;
  isFilterModalOpen = true;
  lastFocusBeforeFilterModal = document.activeElement;
  filterModalEl.hidden = false;
  document.body?.setAttribute("data-filter-modal-open", "1");

  const focusable = filterModalEl.querySelector("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
  focusable?.focus?.();
}

function closeFilterModal({ returnFocus = true } = {}) {
  if (!filterModalEl || !isFilterModalOpen) return;
  isFilterModalOpen = false;
  filterModalEl.hidden = true;
  document.body?.removeAttribute("data-filter-modal-open");

  if (returnFocus && lastFocusBeforeFilterModal?.focus) lastFocusBeforeFilterModal.focus();
}

function resetAllFilters() {
  searchTerm = "";
  moodFilter = null;
  travelMode = null;
  ageFilter = "all";
  categoryFilter = "";
  onlyBigAdventures = false;
  onlyVerified = false;
  onlyFavorites = false;
  activeTagFilters.clear();

  radiusStep = getMaxRadiusIndex();
  hasShownRadiusDisabledToast = false;

  if (filterSearchEl) filterSearchEl.value = "";
  if (filterAgeEl) filterAgeEl.value = "all";
  if (filterCategoryEl) filterCategoryEl.value = "";

  if (filterRadiusEl) {
    filterRadiusEl.value = String(radiusStep);
    updateRadiusTexts();
  }

  if (filterBigEl) filterBigEl.checked = false;
  if (filterVerifiedEl) filterVerifiedEl.checked = false;
  if (filterFavoritesEl) filterFavoritesEl.checked = false;

  document.querySelectorAll(".mood-chip").forEach((chip) => {
    chip.classList.remove("mood-chip--active");
    chip.setAttribute("aria-pressed", "false");
  });

  document.querySelectorAll(".travel-chip").forEach((chip) => {
    chip.classList.remove("travel-chip--active");
    chip.setAttribute("aria-pressed", "false");
  });

  safeTillaCall("setTravelMode", null);

  renderTagFilterChips();
  applyFiltersAndRender();
}

// ------------------------------------------------------
// Sichtbarkeit: Datum + Plus/Add-ons
// ------------------------------------------------------
function isSpotCurrentlyValid(spot, now = new Date()) {
  const fromStr = spot.validFrom || spot.valid_from;
  const toStr = spot.validTo || spot.valid_to;

  if (fromStr) {
    const from = new Date(fromStr);
    if (!Number.isNaN(from.getTime()) && now < from) return false;
  }
  if (toStr) {
    const to = new Date(toStr);
    if (!Number.isNaN(to.getTime()) && now > to) return false;
  }
  return true;
}

function userCanSeeSpot(spot) {
  if (!isSpotCurrentlyValid(spot)) return false;

  const slugs = Array.isArray(spot.categories) ? spot.categories : spot.category ? [spot.category] : [];
  if (!slugs.length) return true;

  const status = getPlusStatus();
  const plan = status.plan || null;
  const addons = status.addons || [];

  return slugs.every((slug) => {
    if (!isPlusCategory(slug)) return true;
    if (!CATEGORY_ACCESS?.perCategory) return true;

    const rule = CATEGORY_ACCESS.perCategory[slug];
    if (!rule) return true;

    if (!status.active) return false;

    if (rule.level === "subscription") return plan === rule.subscriptionId;

    if (rule.level === "addon") {
      const hasBase = plan === rule.subscriptionId;
      const hasAddon = Array.isArray(addons) && rule.addonId ? addons.includes(rule.addonId) : false;
      return hasBase && hasAddon;
    }

    return true;
  });
}

// ------------------------------------------------------
// Favorites
// ------------------------------------------------------
function loadFavoritesFromStorage() {
  if (!FEATURES.favorites) return;
  const stored = storageGet("fs_favorites");
  if (!stored) return;
  const arr = safeJsonParse(stored, null);
  if (Array.isArray(arr)) favorites = new Set(arr);
}

function saveFavoritesToStorage() {
  if (!FEATURES.favorites) return;
  storageSet("fs_favorites", JSON.stringify(Array.from(favorites)));
}

function syncFavButtonState(btn, spotId) {
  const isFav = favorites.has(spotId);
  btn.textContent = isFav ? "★" : "☆";
  btn.setAttribute(
    "aria-label",
    isFav
      ? currentLang === LANG_EN
        ? "Remove from favourites"
        : currentLang === LANG_DA
        ? "Fjern fra favoritter"
        : "Aus Favoriten entfernen"
      : currentLang === LANG_EN
      ? "Add to favourites"
      : currentLang === LANG_DA
      ? "Tilføj til favoritter"
      : "Zu Favoriten hinzufügen"
  );
}

function toggleFavorite(spot) {
  if (!FEATURES.favorites) return;

  const spotId = getSpotId(spot);
  const wasFavorite = favorites.has(spotId);

  if (wasFavorite) favorites.delete(spotId);
  else favorites.add(spotId);

  saveFavoritesToStorage();

  showToast(wasFavorite ? "toast_fav_removed" : "toast_fav_added");
  safeTillaCall(wasFavorite ? "onFavoriteRemoved" : "onFavoriteAdded");

  renderSpotList();
}

// ------------------------------------------------------
// Plus & Daylog
// ------------------------------------------------------
function updatePlusStatusText(status) {
  if (!plusStatusTextEl) return;
  if (!FEATURES.plus) { plusStatusTextEl.textContent = ""; return; }
  const s = status || getPlusStatus();
  plusStatusTextEl.textContent = formatPlusStatus(s);
}

function loadPlusStateFromStorage({ reapplyFilters = false } = {}) {
  if (!FEATURES.plus) {
    plusActive = false;
    updatePlusStatusText({ active: false, plan: null, validUntil: null, addons: null, partner: null, source: null });
    if (reapplyFilters && spots.length) applyFiltersAndRender();
    return;
  }

  const status = getPlusStatus();
  plusActive = !!status.active;
  updatePlusStatusText(status);
  log("[Family Spots] Plus status:", { plusActive, status });

  if (reapplyFilters && spots.length) applyFiltersAndRender();
}

async function handlePlusCodeSubmit() {
  if (!FEATURES.plus) return;
  if (!plusCodeInputEl || !plusStatusTextEl) return;

  const raw = plusCodeInputEl.value.trim();
  const result = await redeemPartnerCode(raw);

  if (!result.ok) {
    showToast(result.reason === "empty" ? "plus_code_empty" : "plus_code_unknown");
    return;
  }

  const status = result.status || getPlusStatus();
  plusActive = !!status.active;
  updatePlusStatusText(status);

  showToast("plus_code_activated");
  safeTillaCall("onPlusActivated");
  applyFiltersAndRender();
}

function formatDaylogTimestamp(ts) {
  try {
    const date = new Date(ts);
    const locale = currentLang === LANG_EN ? "en-GB" : currentLang === LANG_DA ? "da-DK" : "de-DE";
    return new Intl.DateTimeFormat(locale, {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
    }).format(date);
  } catch {
    return "";
  }
}

function updateDaylogUI() {
  if (!FEATURES.daylog || !daylogTextEl) return;

  if (daylogListEl) daylogListEl.replaceChildren();

  if (!daylogEntries?.length) {
    if (daylogLastSavedEl) {
      daylogLastSavedEl.textContent =
        currentLang === LANG_EN ? "Nothing saved yet."
        : currentLang === LANG_DA ? "Ingen gemte endnu."
        : "Noch nichts gespeichert.";
    }
    daylogClearEl?.classList.add("hidden");
    daylogTextEl.value = "";
    return;
  }

  daylogEntries.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const latest = daylogEntries[0];

  if (daylogLastSavedEl) {
    const formatted = formatDaylogTimestamp(latest.ts || Date.now());
    daylogLastSavedEl.textContent =
      currentLang === LANG_EN ? (formatted ? `Last saved: ${formatted}` : "Last saved.")
      : currentLang === LANG_DA ? (formatted ? `Sidst gemt: ${formatted}` : "Sidst gemt.")
      : (formatted ? `Zuletzt gespeichert: ${formatted}` : "Zuletzt gespeichert.");
  }

  daylogClearEl?.classList.toggle("hidden", daylogEntries.length === 0);
  daylogTextEl.value = "";

  if (!daylogListEl) return;

  const frag = document.createDocumentFragment();

  daylogEntries.forEach((entry) => {
    if (!entry?.text) return;

    const item = document.createElement("article");
    item.className = "daylog-entry";

    const header = document.createElement("header");
    header.className = "daylog-entry-header";

    const dateEl = document.createElement("p");
    dateEl.className = "daylog-entry-date";
    dateEl.textContent = formatDaylogTimestamp(entry.ts || Date.now());
    header.appendChild(dateEl);

    const textEl = document.createElement("p");
    textEl.className = "daylog-entry-text";
    textEl.textContent = entry.text;

    item.appendChild(header);
    item.appendChild(textEl);

    frag.appendChild(item);
  });

  daylogListEl.appendChild(frag);
}

function loadDaylogFromStorage() {
  if (!FEATURES.daylog) return;

  daylogEntries = [];
  const stored = storageGet(DAYLOG_STORAGE_KEY);
  if (!stored) { updateDaylogUI(); return; }

  const parsed = safeJsonParse(stored, null);

  if (parsed?.entries && Array.isArray(parsed.entries)) {
    daylogEntries = parsed.entries
      .filter((e) => e && typeof e.text === "string")
      .map((e) => ({
        id: e.id || e.ts || Date.now(),
        text: String(e.text).trim(),
        ts: typeof e.ts === "number" ? e.ts : Date.now()
      }))
      .filter((e) => e.text);
  } else if (parsed && typeof parsed.text === "string") {
    const ts = typeof parsed.ts === "number" ? parsed.ts : Date.now();
    daylogEntries = [{ id: ts, text: parsed.text.trim(), ts }].filter((e) => e.text);
  }

  updateDaylogUI();
}

function handleDaylogSave() {
  if (!FEATURES.daylog || !daylogTextEl) return;

  const text = daylogTextEl.value.trim();
  if (!text) return;

  const now = Date.now();
  daylogEntries.push({ id: now, text, ts: now });

  storageSet(DAYLOG_STORAGE_KEY, JSON.stringify({ entries: daylogEntries }));

  daylogTextEl.value = "";
  showToast("daylog_saved");
  safeTillaCall("onDaylogSaved");
  updateDaylogUI();
}

function handleDaylogClear() {
  if (!FEATURES.daylog) return;

  daylogEntries = [];
  storageRemove(DAYLOG_STORAGE_KEY);
  updateDaylogUI();

  showToast(
    currentLang === LANG_EN ? "Entry deleted."
    : currentLang === LANG_DA ? "Notat slettet."
    : "Eintrag gelöscht."
  );
}

// ------------------------------------------------------
// Spots – Laden
// ------------------------------------------------------
function showSpotsLoadErrorUI() {
  if (!spotListEl) return;

  spotListEl.replaceChildren();

  const msg = document.createElement("p");
  msg.className = "filter-group-helper";
  msg.textContent =
    currentLang === LANG_EN
      ? "Spots could not be loaded. Please check your connection and try again."
      : currentLang === LANG_DA
      ? "Spots kunne ikke indlæses. Tjek venligst forbindelsen og prøv igen."
      : "Die Spots konnten nicht geladen werden. Prüfe deine Verbindung und versuche es erneut.";
  spotListEl.appendChild(msg);

  const retryBtn = document.createElement("button");
  retryBtn.type = "button";
  retryBtn.className = "btn btn-small";
  retryBtn.textContent = currentLang === LANG_EN ? "Try again" : currentLang === LANG_DA ? "Prøv igen" : "Erneut versuchen";
  retryBtn.addEventListener("click", () => {
    showToast(currentLang === LANG_EN ? "Reloading spots…" : currentLang === LANG_DA ? "Indlæser spots igen …" : "Lade Spots erneut …");
    loadSpots();
  });

  spotListEl.appendChild(retryBtn);
}

async function loadSpots() {
  try {
    const result = await loadData();
    const rawSpots = Array.isArray(result?.spots) ? result.spots : [];

    spots = rawSpots.map(normalizeSpot);
    log("[Family Spots] loadSpots:", { total: spots.length });

    loadFavoritesFromStorage();
    populateCategoryOptions();
    renderTagFilterChips();

    if (result?.fromCache) {
      showToast(currentLang === LANG_EN ? "Loaded offline data." : currentLang === LANG_DA ? "Indlæste offline-data." : "Offline-Daten geladen.");
    }

    applyFiltersAndRender();
  } catch (err) {
    console.error("[Family Spots] Fehler beim Laden der Spots:", err);

    showToast("error_data_load");
    showSpotsLoadErrorUI();

    spots = [];
    filteredSpots = [];

    if (map && markersLayer) {
      hasShownMarkerLimitToast = renderMarkers({
        map,
        markersLayer,
        spots: [],
        maxMarkers: MAX_MARKERS_RENDER,
        currentLang,
        showToast,
        hasShownMarkerLimitToast,
        focusSpotOnMap
      });
    }

    safeTillaCall("onNoSpotsFound");
  }
}

// ------------------------------------------------------
// Filterlogik
// ------------------------------------------------------
function applyFiltersAndRender() {
  if (!spots.length) {
    filteredSpots = [];
    renderSpotList();

    if (map && markersLayer) {
      hasShownMarkerLimitToast = renderMarkers({
        map,
        markersLayer,
        spots: [],
        maxMarkers: MAX_MARKERS_RENDER,
        currentLang,
        showToast,
        hasShownMarkerLimitToast,
        focusSpotOnMap
      });
    }

    updateFilterSummary();
    safeTillaCall("onNoSpotsFound");
    safeTillaCall("onFiltersUpdated", {
      totalSpots: spots.length,
      filteredSpotsCount: filteredSpots.length,
      filters: getFilterContext()
    });
    return;
  }

  const nonGeoFiltered = filterSpots(spots, {
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
    activeFilterIds: activeTagFilters
  });

  const visibilityFiltered = nonGeoFiltered.filter((spot) => userCanSeeSpot(spot));

  const originLatLng = getUserOriginLatLng();
  const radiusKm = getEffectiveRadiusKm();

  filteredSpots = (originLatLng && isFinite(radiusKm) && radiusKm !== Infinity)
    ? visibilityFiltered.filter((spot) => isSpotInRadius(spot, originLatLng, radiusKm))
    : visibilityFiltered;

  renderSpotList();

  if (map && markersLayer) {
    hasShownMarkerLimitToast = renderMarkers({
      map,
      markersLayer,
      spots: filteredSpots,
      maxMarkers: MAX_MARKERS_RENDER,
      currentLang,
      showToast,
      hasShownMarkerLimitToast,
      focusSpotOnMap
    });
  }

  updateFilterSummary();

  safeTillaCall("onFiltersUpdated", {
    totalSpots: spots.length,
    filteredSpotsCount: filteredSpots.length,
    filters: getFilterContext()
  });
}

// ------------------------------------------------------
// Badges / Meta
// ------------------------------------------------------
function isSpotVerified(spot) {
  return !!spot.verified || !!spot.isVerified;
}
function isBigAdventureSpot(spot) {
  return !!spot.bigAdventure || !!spot.isBigAdventure || !!spot.longTrip;
}
function isPlusSpot(spot) {
  if (!FEATURES.plus) return false;
  if (spot.plusOnly || spot.plus) return true;

  const slugs = Array.isArray(spot.categories) ? spot.categories : spot.category ? [spot.category] : [];
  return slugs.some((slug) => slug && typeof isPlusCategory === "function" && isPlusCategory(slug));
}

function getSpotPrimaryMoodKey(spot) {
  const src = spot._moods || spot.moods || spot.moodTags || spot.mood;
  let arr = [];
  if (Array.isArray(src)) arr = src;
  else if (typeof src === "string" && src.trim()) arr = src.split(",").map((s) => s.trim()).filter(Boolean);
  return arr.length ? arr[0] : null;
}

function getSpotAgeLabel(spot) {
  const src = spot._ageGroups || spot.ageGroups || spot.age || spot.ages;
  let arr = [];
  if (Array.isArray(src)) arr = src;
  else if (typeof src === "string" && src.trim()) arr = src.split(",").map((s) => s.trim()).filter(Boolean);
  const key = arr.length ? arr[0] : null;
  if (!key) return "";

  if (currentLang === LANG_EN) {
    if (key === "0-3") return "0–3 yrs";
    if (key === "4-9") return "4–9 yrs";
    if (key === "10+") return "10+ yrs";
    return key;
  }
  if (currentLang === LANG_DA) {
    if (key === "0-3") return "0–3 år";
    if (key === "4-9") return "4–9 år";
    if (key === "10+") return "10+ år";
    return key;
  }
  if (key === "0-3") return "0–3 Jahre";
  if (key === "4-9") return "4–9 Jahre";
  if (key === "10+") return "10+ Jahre";
  return key;
}

function getSpotVisitTimeLabel(spot) {
  const minutes = spot.visit_minutes;
  if (!minutes || !Number.isFinite(minutes)) return "";
  if (minutes < 60) return (currentLang === LANG_DE) ? `~${minutes} Min.` : `~${minutes} min`;

  const hours = minutes / 60;
  const rounded = Math.round(hours * 10) / 10;
  const formatter = new Intl.NumberFormat(
    currentLang === LANG_DA ? "da-DK" : currentLang === LANG_EN ? "en-GB" : "de-DE",
    { maximumFractionDigits: 1 }
  );

  const hoursLabel = formatter.format(rounded);
  if (currentLang === LANG_EN) return `~${hoursLabel} h`;
  if (currentLang === LANG_DA) return `~${hoursLabel} t`;
  return `~${hoursLabel} Std.`;
}

function getSpotDistanceKm(spot) {
  try {
    if (typeof L === "undefined" || typeof L.latLng !== "function") return null;
    if (!hasValidLatLng(spot)) return null;
    const originLatLng = getUserOriginLatLng();
    if (!originLatLng) return null;

    const spotLatLng = L.latLng(spot.lat, spot.lng);
    const km = originLatLng.distanceTo(spotLatLng) / 1000;
    if (!Number.isFinite(km)) return null;
    return Math.max(0.1, Math.round(km * 10) / 10);
  } catch {
    return null;
  }
}

function formatKmBadgeLabel(km) {
  if (!km || !Number.isFinite(km)) return "";
  const formatter = new Intl.NumberFormat(
    currentLang === LANG_DA ? "da-DK" : currentLang === LANG_EN ? "en-GB" : "de-DE",
    { maximumFractionDigits: 1 }
  );
  return `≈ ${formatter.format(km)} km`;
}

function getSpotMetaParts(spot) {
  const parts = [];
  if (spot.category) parts.push(getCategoryLabel(spot.category));
  if (spot.city) parts.push(spot.city);
  const timeLabel = getSpotVisitTimeLabel(spot);
  if (timeLabel) parts.push(timeLabel);
  return parts;
}

function buildSpotBadges(spot) {
  const badges = [];

  const distanceKm = getSpotDistanceKm(spot);
  if (distanceKm != null) {
    badges.push({
      className: "badge badge--distance",
      icon: "📍",
      label: formatKmBadgeLabel(distanceKm),
      title:
        currentLang === LANG_EN
          ? "Approx. straight-line distance from your location"
          : currentLang === LANG_DA
          ? "Ca. luftlinje-afstand fra din placering"
          : "Ca. Luftlinie ab deinem Standort"
    });
  }

  const timeLabel = getSpotVisitTimeLabel(spot);
  if (timeLabel) badges.push({ className: "badge badge--time", icon: "⏱️", label: timeLabel });

  const ageLabel = getSpotAgeLabel(spot);
  if (ageLabel) badges.push({ className: "badge badge--age", icon: "👶", label: ageLabel });

  const moodKey = getSpotPrimaryMoodKey(spot);
  const moodLabel = getMoodLabel(moodKey);
  if (moodLabel) badges.push({ className: "badge badge--soft", icon: "🎈", label: moodLabel });

  if (isSpotVerified(spot)) {
    badges.push({
      className: "badge badge--verified",
      icon: "✔︎",
      label: currentLang === LANG_EN ? "Verified" : currentLang === LANG_DA ? "Verificeret" : "Verifiziert"
    });
  }

  if (isPlusSpot(spot)) badges.push({ className: "badge badge--plus", icon: "⭐", label: "Plus" });

  if (isBigAdventureSpot(spot)) {
    badges.push({
      className: "badge badge--big",
      icon: "🎒",
      label: currentLang === LANG_EN ? "Big adventure" : currentLang === LANG_DA ? "Stort eventyr" : "Großes Abenteuer"
    });
  }

  return badges;
}

// ------------------------------------------------------
// Spot List
// ------------------------------------------------------
function renderSpotList() {
  if (!spotListEl) return;
  spotListEl.replaceChildren();

  if (!filteredSpots.length) {
    const wrapper = document.createElement("div");
    wrapper.className = "empty-state";

    const titleEl = document.createElement("h3");
    titleEl.className = "empty-state-title";
    titleEl.textContent =
      currentLang === LANG_EN ? "No spots for your selection right now"
      : currentLang === LANG_DA ? "Ingen spots til jeres valg lige nu"
      : "Gerade keine Spots für eure Auswahl";

    const textEl = document.createElement("p");
    textEl.className = "empty-state-text";
    textEl.textContent =
      currentLang === LANG_EN
        ? "Your radius might be too small or there are many filters active. Try one of these options:"
        : currentLang === LANG_DA
        ? "Måske er radius for lille, eller der er mange filtre slået til. Prøv en af disse muligheder:"
        : "Vielleicht ist euer Radius zu klein oder es sind viele Filter aktiv. Ihr könnt es so versuchen:";

    const actionsEl = document.createElement("div");
    actionsEl.className = "empty-state-actions";

    const btnRadius = document.createElement("button");
    btnRadius.type = "button";
    btnRadius.className = "btn btn-small";
    btnRadius.textContent = currentLang === LANG_EN ? "Increase radius" : currentLang === LANG_DA ? "Større radius" : "Radius vergrößern";
    btnRadius.addEventListener("click", () => {
      if (!filterRadiusEl) return;
      const maxIndex = getMaxRadiusIndex();
      const value = parseInt(filterRadiusEl.value, 10);
      const v = Number.isNaN(value) ? radiusStep : value;
      if (v < maxIndex) {
        radiusStep = v + 1;
        filterRadiusEl.value = String(radiusStep);
        updateRadiusTexts();
        applyFiltersAndRender();
      }
    });

    const btnReset = document.createElement("button");
    btnReset.type = "button";
    btnReset.className = "btn btn-small btn-secondary";
    btnReset.textContent = currentLang === LANG_EN ? "Reset all filters" : currentLang === LANG_DA ? "Nulstil alle filtre" : "Alle Filter zurücksetzen";
    btnReset.addEventListener("click", resetAllFilters);

    actionsEl.appendChild(btnRadius);
    actionsEl.appendChild(btnReset);

    wrapper.appendChild(titleEl);
    wrapper.appendChild(textEl);
    wrapper.appendChild(actionsEl);
    spotListEl.appendChild(wrapper);
    return;
  }

  const frag = document.createDocumentFragment();

  filteredSpots.forEach((spot) => {
    const card = document.createElement("article");
    card.className = "spot-card";

    const spotId = getSpotId(spot);
    card.dataset.spotId = spotId;

    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", getSpotName(spot));

    const headerRow = document.createElement("div");
    headerRow.style.display = "flex";
    headerRow.style.alignItems = "center";
    headerRow.style.justifyContent = "space-between";
    headerRow.style.gap = "8px";

    const titleEl = document.createElement("h3");
    titleEl.className = "spot-card-title";
    titleEl.textContent = getSpotName(spot);
    headerRow.appendChild(titleEl);

    if (FEATURES.favorites) {
      const favBtn = document.createElement("button");
      favBtn.type = "button";
      favBtn.className = "btn-ghost btn-small";
      syncFavButtonState(favBtn, spotId);

      favBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        toggleFavorite(spot);
        syncFavButtonState(favBtn, spotId);
      });

      headerRow.appendChild(favBtn);
    }

    card.appendChild(headerRow);

    const subtitleText = getSpotSubtitle(spot);
    if (subtitleText) {
      const subtitleEl = document.createElement("p");
      subtitleEl.className = "spot-card-subtitle";
      subtitleEl.textContent = subtitleText;
      card.appendChild(subtitleEl);
    }

    const metaParts = getSpotMetaParts(spot);
    if (metaParts.length) {
      const metaEl = document.createElement("p");
      metaEl.className = "spot-card-meta";
      metaEl.textContent = metaParts.join(" · ");
      card.appendChild(metaEl);
    }

    const badgesRow = document.createElement("div");
    badgesRow.className = "spot-card-badges";

    buildSpotBadges(spot).forEach((badge) => {
      const badgeEl = document.createElement("span");
      badgeEl.className = badge.className;
      if (badge.title) badgeEl.title = badge.title;

      if (badge.icon) {
        const iconEl = document.createElement("span");
        iconEl.className = "badge__icon";
        iconEl.textContent = badge.icon;
        badgeEl.appendChild(iconEl);
      }

      const labelEl = document.createElement("span");
      labelEl.textContent = badge.label;
      badgeEl.appendChild(labelEl);

      badgesRow.appendChild(badgeEl);
    });

    if (Array.isArray(spot.tags) && spot.tags.length) {
      spot.tags.forEach((tag) => {
        const tagEl = document.createElement("span");
        tagEl.className = "badge badge--soft";
        tagEl.textContent = tag;
        badgesRow.appendChild(tagEl);
      });
    }

    if (badgesRow.children.length) card.appendChild(badgesRow);

    const open = () => {
      lastSpotTriggerEl = card;
      focusSpotOnMap(spot);
    };

    card.addEventListener("click", open);
    card.addEventListener("keydown", activateOnEnterSpace(open));

    frag.appendChild(card);
  });

  spotListEl.appendChild(frag);
}

// ------------------------------------------------------
// Spot Details
// ------------------------------------------------------
function focusSpotOnMap(spot) {
  if (!map || !hasValidLatLng(spot)) {
    showSpotDetails(spot);
    return;
  }
  const zoom = Math.max(map.getZoom ? map.getZoom() : DEFAULT_MAP_ZOOM, 13);
  map.setView([spot.lat, spot.lng], zoom);
  showSpotDetails(spot);
}

function closeSpotDetails({ returnFocus = true } = {}) {
  if (!spotDetailEl) return;
  spotDetailEl.classList.add("spot-details--hidden");
  spotDetailEl.replaceChildren();

  if (returnFocus && lastSpotTriggerEl?.focus) lastSpotTriggerEl.focus();
}

function showSpotDetails(spot) {
  if (!spotDetailEl) return;

  const spotId = getSpotId(spot);
  const name = getSpotName(spot);
  const subtitle = getSpotSubtitle(spot);
  const metaParts = getSpotMetaParts(spot);
  const tags = Array.isArray(spot.tags) ? spot.tags : [];

  let description = "";
  if (currentLang === LANG_EN) description = spot.summary_en || spot.poetry || spot.description || spot.text || "";
  else if (currentLang === LANG_DA) description = spot.summary_da || spot.summary_de || spot.poetry || spot.description || spot.text || "";
  else description = spot.summary_de || spot.poetry || spot.description || spot.text || "";

  const addressParts = [];
  if (spot.address) addressParts.push(spot.address);
  if (spot.postcode) addressParts.push(spot.postcode);
  if (spot.city) addressParts.push(spot.city);
  if (!addressParts.length && subtitle) addressParts.push(subtitle);
  const addressText = addressParts.join(", ");

  spotDetailEl.replaceChildren();
  spotDetailEl.classList.remove("spot-details--hidden");

  const headerEl = document.createElement("div");
  headerEl.className = "spot-details-header";

  const titleWrapperEl = document.createElement("div");

  const titleEl = document.createElement("h3");
  titleEl.className = "spot-details-title";
  titleEl.textContent = name;
  titleWrapperEl.appendChild(titleEl);

  const actionsEl = document.createElement("div");
  actionsEl.className = "spot-details-actions";

  if (FEATURES.favorites) {
    const favBtn = document.createElement("button");
    favBtn.type = "button";
    favBtn.className = "btn-ghost btn-small";
    syncFavButtonState(favBtn, spotId);
    favBtn.addEventListener("click", () => {
      toggleFavorite(spot);
      syncFavButtonState(favBtn, spotId);
    });
    actionsEl.appendChild(favBtn);
  }

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "btn-ghost btn-small";
  closeBtn.textContent = currentLang === LANG_EN ? "Close" : currentLang === LANG_DA ? "Luk" : "Schließen";
  closeBtn.addEventListener("click", () => closeSpotDetails({ returnFocus: true }));
  actionsEl.appendChild(closeBtn);

  headerEl.appendChild(titleWrapperEl);
  headerEl.appendChild(actionsEl);

  spotDetailEl.appendChild(headerEl);

  if (metaParts.length) {
    const metaEl = document.createElement("div");
    metaEl.className = "spot-details-meta";
    metaParts.forEach((p) => {
      const span = document.createElement("span");
      span.textContent = p;
      metaEl.appendChild(span);
    });
    spotDetailEl.appendChild(metaEl);
  }

  if (description) {
    const descEl = document.createElement("p");
    descEl.className = "spot-details-description";
    descEl.textContent = description;
    spotDetailEl.appendChild(descEl);
  }

  if (addressText) {
    const addrEl = document.createElement("p");
    addrEl.className = "spot-details-address";
    addrEl.textContent = addressText;
    spotDetailEl.appendChild(addrEl);
  }

  const detailBadges = buildSpotBadges(spot);
  if (detailBadges.length) {
    const detailBadgesContainer = document.createElement("div");
    detailBadgesContainer.className = "spot-details-scores";

    detailBadges.forEach((badge) => {
      const badgeEl = document.createElement("span");
      badgeEl.className = badge.className;
      if (badge.title) badgeEl.title = badge.title;

      if (badge.icon) {
        const iconEl = document.createElement("span");
        iconEl.className = "badge__icon";
        iconEl.textContent = badge.icon;
        badgeEl.appendChild(iconEl);
      }

      const labelEl = document.createElement("span");
      labelEl.textContent = badge.label;
      badgeEl.appendChild(labelEl);

      detailBadgesContainer.appendChild(badgeEl);
    });

    spotDetailEl.appendChild(detailBadgesContainer);
  }

  const routeUrls = getRouteUrlsForSpotFromUserLocation(spot);
  if (routeUrls) {
    const routesEl = document.createElement("div");
    routesEl.className = "spot-details-routes";

    const appleLink = document.createElement("a");
    appleLink.href = routeUrls.apple;
    appleLink.target = "_blank";
    appleLink.rel = "noopener noreferrer";
    appleLink.className = "spot-details-route-link";
    appleLink.textContent = t("route_apple", "Apple Maps");

    const googleLink = document.createElement("a");
    googleLink.href = routeUrls.google;
    googleLink.target = "_blank";
    googleLink.rel = "noopener noreferrer";
    googleLink.className = "spot-details-route-link";
    googleLink.textContent = t("route_google", "Google Maps");

    routesEl.appendChild(appleLink);
    routesEl.appendChild(googleLink);
    spotDetailEl.appendChild(routesEl);
  }

  if (tags.length) {
    const tagsEl = document.createElement("div");
    tagsEl.className = "spot-details-tags";
    tags.forEach((tag) => {
      const span = document.createElement("span");
      span.className = "badge badge--soft";
      span.textContent = tag;
      tagsEl.appendChild(span);
    });
    spotDetailEl.appendChild(tagsEl);
  }

  if (typeof spotDetailEl.scrollTop === "number") spotDetailEl.scrollTop = 0;
}

// ------------------------------------------------------
// Locate
// ------------------------------------------------------
async function handleLocateClick() {
  if (!navigator.geolocation || !map) {
    showToast("toast_location_error");
    return;
  }

  try {
    const loc = await requestUserLocationOnce({ enableHighAccuracy: true, timeout: 9000, maximumAge: 0 });

    if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
      map.setView([loc.lat, loc.lng], 13);
      showToast("toast_location_ok");
      applyFiltersAndRender();
      startLocationWatch();
    }
  } catch {
    showToast("toast_location_error");
  }
}

// ------------------------------------------------------
// Filter toggles / view toggle
// ------------------------------------------------------
function handleToggleFilters() {
  if (!btnToggleFiltersEl || !filterBodyEls.length) return;

  filtersCollapsed = !filtersCollapsed;
  const isExpanded = !filtersCollapsed;

  filterBodyEls.forEach((el) => el.classList.toggle("hidden", filtersCollapsed));

  const span = btnToggleFiltersEl.querySelector("span");
  if (span) span.textContent = filtersCollapsed ? t("btn_show_filters", "Filter anzeigen") : t("btn_hide_filters", "Filter ausblenden");

  btnToggleFiltersEl.setAttribute("aria-expanded", isExpanded ? "true" : "false");
}

function handleToggleView() {
  if (!sidebarEl || !btnToggleViewEl) return;

  const isHidden = sidebarEl.classList.toggle("hidden");
  const span = btnToggleViewEl.querySelector("span");
  if (span) span.textContent = isHidden ? t("btn_show_list", "Liste anzeigen") : t("btn_only_map", "Nur Karte");

  btnToggleViewEl.setAttribute("aria-pressed", isHidden ? "true" : "false");

  if (map) window.setTimeout(() => map.invalidateSize(), 300);
}

// ------------------------------------------------------
// Spielideen
// ------------------------------------------------------
function getRandomPlayIdea() {
  if (typeof I18N !== "undefined" && typeof I18N.getRandomPlayIdea === "function") {
    const idea = I18N.getRandomPlayIdea();
    if (idea) return idea;
  }
  return "";
}

// ------------------------------------------------------
// Init
// ------------------------------------------------------
async function init() {
  try {
    // Menu / Language / Skip (moved inside init for zero import side-effects)
    const menuApi = initMenu() || {};
    const closeMenu = typeof menuApi.closeMenu === "function" ? menuApi.closeMenu : (() => {});
    initLanguageSwitcher();
    initSkipToSpots(closeMenu);

    languageSwitcherEl = document.getElementById("language-switcher") || document.getElementById("language-toggle");
    languageSwitcherFlagEl = document.getElementById("language-switcher-flag");

    themeToggleEl = document.getElementById("theme-toggle");
    btnLocateEl = document.getElementById("btn-locate");
    btnHelpEl = document.getElementById("btn-help");

    viewMapEl = document.getElementById("view-map");
    viewAboutEl = document.getElementById("view-about");

    bottomNavButtons = document.querySelectorAll(".bottom-nav-item");
    bottomNavMapLabelEl = document.getElementById("bottom-nav-map-label");
    bottomNavAboutLabelEl = document.getElementById("bottom-nav-about-label");

    sidebarEl = document.querySelector(".sidebar");

    const filterTitleEl = document.getElementById("filter-title");
    filterSectionEl = filterTitleEl ? filterTitleEl.closest(".sidebar-section") : null;

    if (filterSectionEl) {
      filterBodyEls = Array.from(filterSectionEl.children).filter((el) => !el.classList.contains("sidebar-section-header"));
      filtersCollapsed = true;
      filterBodyEls.forEach((el) => el.classList.add("hidden"));
    }

    btnToggleFiltersEl = document.getElementById("btn-toggle-filters");
    btnToggleViewEl = document.getElementById("btn-toggle-view");

    playIdeasBtnEl = document.getElementById("btn-play-idea");

    filterSearchEl = document.getElementById("filter-search");
    filterCategoryEl = document.getElementById("filter-category");
    filterAgeEl = document.getElementById("filter-age");
    filterRadiusEl = document.getElementById("filter-radius");
    filterRadiusMaxLabelEl = document.getElementById("filter-radius-max-label");
    filterRadiusDescriptionEl = document.getElementById("filter-radius-description");
    filterBigEl = document.getElementById("filter-big-adventures");
    filterVerifiedEl = document.getElementById("filter-verified");
    filterFavoritesEl = document.getElementById("filter-favorites");
    tagFilterContainerEl = document.getElementById("filter-tags");

    filterSummaryEl = document.getElementById("filter-summary");

    btnOpenFilterModalEl = document.getElementById("btn-open-filter-modal");
    filterModalEl = document.getElementById("filter-modal");
    filterModalCloseEl = document.getElementById("filter-modal-close");
    filterModalApplyEl = document.getElementById("filter-modal-apply");
    filterModalResetEl = document.getElementById("filter-modal-reset");

    spotListEl = document.getElementById("spot-list");
    spotDetailEl = document.getElementById("spot-detail");

    plusSectionEl = document.getElementById("plus-section");
    btnTogglePlusEl = document.getElementById("btn-toggle-plus");
    daylogSectionEl = document.getElementById("daylog-section");
    btnToggleDaylogEl = document.getElementById("btn-toggle-daylog");

    plusCodeInputEl = document.getElementById("plus-code-input");
    plusCodeSubmitEl = document.getElementById("plus-code-submit");
    plusStatusTextEl = document.getElementById("plus-status-text");

    daylogTextEl = document.getElementById("daylog-text");
    daylogSaveEl = document.getElementById("daylog-save");
    daylogLastSavedEl = document.getElementById("daylog-last-saved");
    daylogClearEl = document.getElementById("daylog-clear");
    daylogListEl = document.getElementById("daylog-list");

    toastEl = document.getElementById("toast");
    skipLinkEl = document.querySelector(".skip-link");

    const initialLang = getInitialLang();
    setLanguage(initialLang, { initial: true });

    const initialTheme = getInitialTheme();
    currentTheme = applyTheme(initialTheme);

    initToast({ element: toastEl, t });

    const mapResult = initMap({ center: DEFAULT_MAP_CENTER, zoom: DEFAULT_MAP_ZOOM });
    map = mapResult.map;
    markersLayer = mapResult.markersLayer;

    const debouncedApply = debounce(() => applyFiltersAndRender(), 180);
    const debouncedResize = debounce(() => map?.invalidateSize?.(), 200);

    if (map) {
      map.on("click", () => closeSpotDetails({ returnFocus: true }));
      map.on("moveend zoomend", debouncedApply);
      window.addEventListener("resize", debouncedResize);
    }

    tilla = new TillaCompanion({ getText: (key) => t(key) });

    // Language switcher button (sr-only in your HTML)
    if (languageSwitcherEl) {
      languageSwitcherEl.addEventListener("click", () => {
        const nextLang = currentLang === LANG_DE ? LANG_DA : currentLang === LANG_DA ? LANG_EN : LANG_DE;
        setLanguage(nextLang);
      });
      updateLanguageSwitcherVisual();
    }

    if (themeToggleEl) {
      themeToggleEl.addEventListener("click", () => {
        const nextTheme = currentTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
        currentTheme = applyTheme(nextTheme);
      });
    }

    btnLocateEl?.addEventListener("click", handleLocateClick);

    initRouter({
      viewMapEl,
      viewAboutEl,
      bottomNavButtons,
      btnHelpEl,
      getCurrentLang: () => currentLang
    });

    // Search (debounced)
    if (filterSearchEl) {
      const applySearch = debounce((value) => {
        searchTerm = String(value || "").trim();
        applyFiltersAndRender();
      }, 180);

      filterSearchEl.addEventListener("input", (e) => applySearch(e.target.value));
    }

    filterCategoryEl?.addEventListener("change", (e) => {
      categoryFilter = e.target.value;
      applyFiltersAndRender();
    });

    filterAgeEl?.addEventListener("change", (e) => {
      ageFilter = e.target.value;
      applyFiltersAndRender();
    });

    if (filterRadiusEl) initRadiusSliderA11y();

    filterBigEl?.addEventListener("change", (e) => {
      onlyBigAdventures = e.target.checked;
      applyFiltersAndRender();
    });

    filterVerifiedEl?.addEventListener("change", (e) => {
      onlyVerified = e.target.checked;
      applyFiltersAndRender();
    });

    if (FEATURES.favorites && filterFavoritesEl) {
      filterFavoritesEl.addEventListener("change", (e) => {
        onlyFavorites = e.target.checked;
        applyFiltersAndRender();
      });
    }

    if (FEATURES.moodFilter) {
      document.querySelectorAll(".mood-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          const value = chip.getAttribute("data-mood");
          if (moodFilter === value) {
            moodFilter = null;
            chip.classList.remove("mood-chip--active");
            chip.setAttribute("aria-pressed", "false");
          } else {
            moodFilter = value;
            document.querySelectorAll(".mood-chip").forEach((c) => {
              c.classList.remove("mood-chip--active");
              c.setAttribute("aria-pressed", "false");
            });
            chip.classList.add("mood-chip--active");
            chip.setAttribute("aria-pressed", "true");
          }
          applyFiltersAndRender();
        });
      });
    }

    if (FEATURES.travelMode) {
      document.querySelectorAll(".travel-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          const mode = chip.getAttribute("data-travel-mode") || "everyday";
          if (travelMode === mode) {
            travelMode = null;
            chip.classList.remove("travel-chip--active");
            chip.setAttribute("aria-pressed", "false");
            safeTillaCall("setTravelMode", null);
          } else {
            travelMode = mode;
            document.querySelectorAll(".travel-chip").forEach((c) => {
              const isActive = c === chip;
              c.classList.toggle("travel-chip--active", isActive);
              c.setAttribute("aria-pressed", isActive ? "true" : "false");
            });
            safeTillaCall("setTravelMode", mode);
          }
          applyFiltersAndRender();
        });
      });
    }

    if (btnToggleFiltersEl) {
      btnToggleFiltersEl.addEventListener("click", handleToggleFilters);
      const span = btnToggleFiltersEl.querySelector("span");
      if (span) span.textContent = t("btn_show_filters", "Filter anzeigen");
      btnToggleFiltersEl.setAttribute("aria-expanded", "false");
    }

    if (btnToggleViewEl) {
      btnToggleViewEl.addEventListener("click", handleToggleView);
      const span = btnToggleViewEl.querySelector("span");
      if (span) span.textContent = t("btn_only_map", "Nur Karte");
      btnToggleViewEl.setAttribute("aria-pressed", "false");
    }

    // Details toggles (Plus / Daylog) – keep conservative: only adjust label text
    function updateGenericSectionToggleLabel(btn, isOpen) {
      if (!btn) return;
      const target = btn.querySelector("span") || btn;
      const isDeLike = currentLang === LANG_DE || currentLang === LANG_DA;
      target.textContent = isOpen ? (isDeLike ? "Ausblenden" : "Hide") : (isDeLike ? "Anzeigen" : "Show");
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }

    if (plusSectionEl && btnTogglePlusEl) {
      btnTogglePlusEl.addEventListener("click", (event) => {
        event.preventDefault();
        plusSectionEl.open = !plusSectionEl.open;
        updateGenericSectionToggleLabel(btnTogglePlusEl, !!plusSectionEl.open);
      });
      plusSectionEl.addEventListener("toggle", () => updateGenericSectionToggleLabel(btnTogglePlusEl, !!plusSectionEl.open));
      updateGenericSectionToggleLabel(btnTogglePlusEl, !!plusSectionEl.open);
    }

    if (daylogSectionEl && btnToggleDaylogEl) {
      btnToggleDaylogEl.addEventListener("click", (event) => {
        event.preventDefault();
        daylogSectionEl.open = !daylogSectionEl.open;
        updateGenericSectionToggleLabel(btnToggleDaylogEl, !!daylogSectionEl.open);
      });
      daylogSectionEl.addEventListener("toggle", () => updateGenericSectionToggleLabel(btnToggleDaylogEl, !!daylogSectionEl.open));
      updateGenericSectionToggleLabel(btnToggleDaylogEl, !!daylogSectionEl.open);
    }

    if (FEATURES.plus && plusCodeSubmitEl) plusCodeSubmitEl.addEventListener("click", handlePlusCodeSubmit);
    if (FEATURES.daylog && daylogSaveEl) daylogSaveEl.addEventListener("click", handleDaylogSave);
    if (FEATURES.daylog && daylogClearEl) daylogClearEl.addEventListener("click", handleDaylogClear);

    if (FEATURES.playIdeas && playIdeasBtnEl) {
      playIdeasBtnEl.addEventListener("click", () => {
        const idea = getRandomPlayIdea();
        if (!idea) return;

        if (tilla && typeof tilla.showPlayIdea === "function") {
          safeTillaCall("showPlayIdea", idea);
          document.querySelector(".tilla-sidebar-card")?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
        } else {
          showToast(idea);
        }
      });
    }

    // Filter modal wiring
    btnOpenFilterModalEl?.addEventListener("click", openFilterModal);
    filterModalCloseEl?.addEventListener("click", () => closeFilterModal({ returnFocus: true }));
    filterModalApplyEl?.addEventListener("click", () => { applyFiltersAndRender(); closeFilterModal({ returnFocus: true }); });
    filterModalResetEl?.addEventListener("click", resetAllFilters);
    filterModalEl?.addEventListener("click", (event) => { if (event.target === filterModalEl) closeFilterModal({ returnFocus: true }); });

    // Skip link focus
    if (skipLinkEl) {
      skipLinkEl.addEventListener("click", (event) => {
        const href = skipLinkEl.getAttribute("href") || "";
        if (!href.startsWith("#")) return;
        event.preventDefault();
        const id = href.slice(1);
        const target = document.getElementById(id);
        if (!target) return;

        if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.scrollIntoView();
        target.focus?.();
      });
    }

    // ESC handling
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" && event.key !== "Esc") return;

      if (isFilterModalOpen && filterModalEl && !filterModalEl.hidden) {
        event.preventDefault();
        closeFilterModal({ returnFocus: true });
        return;
      }

      const isOpen = spotDetailEl && !spotDetailEl.classList.contains("spot-details--hidden");
      if (isOpen) {
        event.preventDefault();
        closeSpotDetails({ returnFocus: true });
      }
    });

    // Clean up watch on unload
    window.addEventListener("beforeunload", () => stopLocationWatch());

    // Init states
    loadPlusStateFromStorage();
    loadDaylogFromStorage();
    initLazyLoadImages();

    updateFilterSummary();
    loadSpots();
  } catch (err) {
    console.error("[Family Spots] Init-Fehler:", err);
  }
}

// ------------------------------------------------------
// Exported deterministic start (called by init.js)
// ------------------------------------------------------
let __started = false;

export async function startApp() {
  if (__started) return;
  __started = true;

  try {
    if (typeof I18N !== "undefined" && typeof I18N.init === "function") {
      await I18N.init();
    }
  } catch (err) {
    console.warn("[Family Spots] I18N konnte nicht geladen werden:", err);
  }

  await init();
}