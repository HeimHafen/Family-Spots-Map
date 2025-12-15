// js/app.js
// ======================================================
// Family Spots Map – Hauptlogik (UI, State, Tilla, Navigation)
// Map- und Filterlogik ist in map.js / filters.js ausgelagert.
// Daten & Plus-Logik sind in data.js / features/plus.js ausgelagert.
// ======================================================

"use strict";

import "./i18n.js";

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

import {
  normalizeSpot,
  filterSpots,
  getSpotName,
  getSpotSubtitle,
  getSpotId
} from "./filters.js";

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

// Menu init (closeMenu wird für Skip-Link benötigt)
const { closeMenu } = initMenu();
initLanguageSwitcher();
initSkipToSpots(closeMenu);

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
// I18N helpers
// ------------------------------------------------------

/** Übersetzungs-Helper (fällt zur Not auf Key zurück) */
const t = (key, fallback) =>
  typeof I18N !== "undefined" && typeof I18N.t === "function"
    ? I18N.t(key, fallback ?? key)
    : (fallback ?? key);

// ------------------------------------------------------
// Global state
// ------------------------------------------------------

let currentLang = LANG_DE;
let currentTheme = THEME_LIGHT;

// Map / Data
/** @type {any} */ let map = null;
/** @type {any} */ let markersLayer = null;
/** @type {Spot[]} */ let spots = [];
/** @type {Spot[]} */ let filteredSpots = [];
let favorites = new Set();
let daylogEntries = [];
let hasShownMarkerLimitToast = false;

// Filters
let plusActive = false;
let moodFilter = null;          // "relaxed" | "action" | "water" | "animals" | null
let travelMode = null;          // "everyday" | "trip" | null
let radiusStep = 4;             // 0–4
let ageFilter = "all";          // "all" | "0-3" | "4-9" | "10+"
let searchTerm = "";
let categoryFilter = "";
let onlyBigAdventures = false;
let onlyVerified = false;
let onlyFavorites = false;
let filtersCollapsed = true;
let activeTagFilters = new Set();

// Real location
/** @type {{lat:number,lng:number,accuracy?:number,ts?:number}|null} */
let userLocation = null;
/** @type {number|null} */
let geoWatchId = null;

// DOM refs
const DOM = {
  languageSwitcherEl: null,
  languageSwitcherFlagEl: null,
  themeToggleEl: null,
  btnLocateEl: null,
  btnHelpEl: null,

  viewMapEl: null,
  viewAboutEl: null,

  bottomNavButtons: null,
  bottomNavMapLabelEl: null,
  bottomNavAboutLabelEl: null,

  sidebarEl: null,
  filterSectionEl: null,
  btnToggleFiltersEl: null,
  btnToggleViewEl: null,

  playIdeasBtnEl: null,

  filterSearchEl: null,
  filterCategoryEl: null,
  filterAgeEl: null,
  filterRadiusEl: null,
  filterRadiusMaxLabelEl: null,
  filterRadiusDescriptionEl: null,
  filterBigEl: null,
  filterVerifiedEl: null,
  filterFavoritesEl: null,
  tagFilterContainerEl: null,
  filterSummaryEl: null,

  btnOpenFilterModalEl: null,
  filterModalEl: null,
  filterModalCloseEl: null,
  filterModalApplyEl: null,
  filterModalResetEl: null,

  spotListEl: null,
  spotDetailEl: null,
  spotsSectionEl: null,

  plusSectionEl: null,
  btnTogglePlusEl: null,
  daylogSectionEl: null,
  btnToggleDaylogEl: null,

  plusCodeInputEl: null,
  plusCodeSubmitEl: null,
  plusStatusTextEl: null,

  daylogTextEl: null,
  daylogSaveEl: null,
  daylogLastSavedEl: null,
  daylogClearEl: null,
  daylogListEl: null,

  toastEl: null,
  skipLinkEl: null
};

// Filter body elements in filter section (collapsed/expanded)
let filterBodyEls = [];

// focus restore for detail panel
let lastSpotTriggerEl = null;

// Filter modal state + focus trap
let isFilterModalOpen = false;
let lastFocusBeforeFilterModal = null;
let modalFocusTrapHandler = null;

// Tilla
let tilla = null;

// ------------------------------------------------------
// Utilities
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
    const k = event.key;
    if (k === "Enter" || k === " " || k === "Spacebar") {
      event.preventDefault();
      handler(event);
    }
  };
}

function setAriaPressed(el, pressed) {
  if (!el) return;
  el.setAttribute("aria-pressed", pressed ? "true" : "false");
}

function setAriaExpanded(el, expanded) {
  if (!el) return;
  el.setAttribute("aria-expanded", expanded ? "true" : "false");
}

function qs(sel, root = document) {
  return root.querySelector(sel);
}

function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function initLazyLoadImages() {
  if (!("loading" in HTMLImageElement.prototype)) return;
  document.querySelectorAll("img").forEach((img) => {
    if (!img.loading || img.loading === "auto") img.loading = "lazy";
  });
}

function applyStaticI18n() {
  qsa("[data-i18n-de]").forEach((el) => {
    const attrName =
      currentLang === LANG_EN ? "data-i18n-en" :
      currentLang === LANG_DA ? "data-i18n-da" : "data-i18n-de";

    let text = el.getAttribute(attrName);
    if (!text) text = el.getAttribute("data-i18n-de") || el.getAttribute("data-i18n-en");
    if (text) el.textContent = text;
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

  if (DOM.themeToggleEl) {
    const fallback = DOM.themeToggleEl.getAttribute("aria-label") || "";
    DOM.themeToggleEl.setAttribute("aria-label", I18N.t("btn_theme_toggle_aria", fallback));
  }

  if (DOM.btnLocateEl) {
    const fallback = DOM.btnLocateEl.getAttribute("aria-label") || "";
    DOM.btnLocateEl.setAttribute("aria-label", I18N.t("btn_locate_aria", fallback));
  }

  if (DOM.btnHelpEl) {
    const fallback = DOM.btnHelpEl.getAttribute("aria-label") || "";
    DOM.btnHelpEl.setAttribute("aria-label", I18N.t("btn_help_aria", fallback));
  }

  const tillaImg = qs("#tilla-section img");
  if (tillaImg) {
    const fallback = tillaImg.alt || "";
    tillaImg.alt = I18N.t("alt_tilla_image", fallback);
  }
}

// ------------------------------------------------------
// Header tagline
// ------------------------------------------------------

function updateHeaderTagline(lang) {
  const el = document.getElementById("header-tagline");
  if (!el) return;

  let text = HEADER_TAGLINE_TEXT[lang] || HEADER_TAGLINE_TEXT.de || el.textContent || "";
  if (typeof I18N !== "undefined" && typeof I18N.t === "function") {
    text = I18N.t("header_tagline", text) || text;
  }
  el.textContent = text;
}

// ------------------------------------------------------
// Play ideas
// ------------------------------------------------------

function getRandomPlayIdea() {
  if (typeof I18N !== "undefined" && typeof I18N.getRandomPlayIdea === "function") {
    const idea = I18N.getRandomPlayIdea();
    if (idea) return idea;
  }

  const FALLBACK_PLAY_IDEAS = {
    de: [
      "Macht eine Mini-Schatzsuche: Jedes Kind denkt sich eine Sache aus, die alle finden sollen.",
      "Sammelt drei Dinge in der Natur mit derselben Farbe und baut daraus ein kleines Kunstwerk.",
      "Findet fünf runde und fünf eckige Dinge und legt daraus ein Bild auf dem Boden.",
      "Spielt „Ich sehe was, was du nicht siehst“ nur mit Dingen in einer bestimmten Farbe.",
      "Erfindet gemeinsam eine kleine Geschichte zu einem Baum, Stein oder Haus, an dem ihr gerade vorbeikommt."
    ],
    en: [
      "Do a tiny treasure hunt: each child thinks of one thing everyone has to find.",
      "Collect three things in nature with the same colour and build a tiny artwork from them.",
      "Look for five round and five square objects and arrange them as a little picture on the ground.",
      "Play “I spy with my little eye” but only with things of one colour.",
      "Make up a short story together about a tree, rock or house you can see right now."
    ],
    da: [
      "Lav en mini-skattejagt: Hvert barn finder på én ting, som alle skal finde.",
      "Saml tre ting i naturen med samme farve og lav et lille kunstværk ud af dem.",
      "Find fem runde og fem kantede ting og læg dem som et lille billede på jorden.",
      "Leg „Jeg ser noget, som du ikke ser“ – men kun med ting i én bestemt farve.",
      "Find på en lille historie sammen om et træ, en sten eller et hus, som I kan se lige nu."
    ]
  };

  const langKey = currentLang === LANG_EN ? "en" : currentLang === LANG_DA ? "da" : "de";
  const list = FALLBACK_PLAY_IDEAS[langKey] || FALLBACK_PLAY_IDEAS.de;
  if (!Array.isArray(list) || !list.length) return "";
  return list[Math.floor(Math.random() * list.length)];
}

// ------------------------------------------------------
// Language / Theme init
// ------------------------------------------------------

function getInitialLang() {
  try {
    const stored = localStorage.getItem("fs_lang");
    if (stored === LANG_DE || stored === LANG_EN || stored === LANG_DA) return stored;
  } catch { /* ignore */ }

  if (typeof I18N !== "undefined" && typeof I18N.getLanguage === "function") {
    const fromI18n = I18N.getLanguage();
    if (fromI18n === LANG_DE || fromI18n === LANG_EN || fromI18n === LANG_DA) return fromI18n;
  }

  const htmlLang = (document.documentElement.lang || navigator.language || LANG_DE)
    .toLowerCase()
    .slice(0, 2);

  if (htmlLang === "en") return LANG_EN;
  if (htmlLang === "da" || htmlLang === "dk") return LANG_DA;
  return LANG_DE;
}

function updateLanguageSwitcherVisual() {
  if (!DOM.languageSwitcherEl) return;

  if (DOM.languageSwitcherFlagEl) {
    let src = "assets/flags/flag-de.svg";
    let alt = "Deutsch";

    if (currentLang === LANG_EN) {
      src = "assets/flags/flag-gb.svg";
      alt = "English";
    } else if (currentLang === LANG_DA) {
      src = "assets/flags/flag-dk.svg";
      alt = "Dansk";
    }

    DOM.languageSwitcherFlagEl.src = src;
    DOM.languageSwitcherFlagEl.alt = alt;
  } else {
    DOM.languageSwitcherEl.textContent =
      currentLang === LANG_EN ? "EN" : currentLang === LANG_DA ? "DA" : "DE";
  }

  const ariaLabel =
    currentLang === LANG_DE
      ? "Sprache: Deutsch (Tippen für Dansk)"
      : currentLang === LANG_DA
      ? "Sprog: Dansk (tryk for English)"
      : "Language: English (tap for Deutsch)";

  DOM.languageSwitcherEl.setAttribute("aria-label", ariaLabel);
}

function updateGenericSectionToggleLabel(btn, isOpen) {
  if (!btn) return;
  const target = btn.querySelector("span") || btn;
  const isDeLike = currentLang === LANG_DE || currentLang === LANG_DA;
  const showLabel = isDeLike ? "Anzeigen" : "Show";
  const hideLabel = isDeLike ? "Ausblenden" : "Hide";
  target.textContent = isOpen ? hideLabel : showLabel;
  setAriaExpanded(btn, isOpen);
}

function setLanguage(lang, { initial = false } = {}) {
  currentLang = lang === LANG_EN ? LANG_EN : lang === LANG_DA ? LANG_DA : LANG_DE;

  try {
    localStorage.setItem("fs_lang", currentLang);
  } catch { /* ignore */ }

  document.documentElement.lang = currentLang;

  try {
    if (typeof I18N !== "undefined" && typeof I18N.setLanguage === "function") {
      let i18nLang = LANG_DE;
      if (currentLang === LANG_EN) i18nLang = LANG_EN;
      else if (currentLang === LANG_DA) i18nLang = "da";
      I18N.setLanguage(i18nLang);
    }
  } catch (err) {
    console.error("[Family Spots] I18N.setLanguage failed:", err);
  }

  updateMetaAndA11yFromI18n();
  updateHeaderTagline(currentLang);

  if (DOM.bottomNavMapLabelEl) DOM.bottomNavMapLabelEl.textContent = t("nav_map");
  if (DOM.bottomNavAboutLabelEl) DOM.bottomNavAboutLabelEl.textContent = t("nav_about");

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

  if (DOM.btnToggleFiltersEl) {
    const span = DOM.btnToggleFiltersEl.querySelector("span");
    if (span) span.textContent = filtersCollapsed ? t("btn_show_filters") : t("btn_hide_filters");
  }

  if (DOM.btnToggleViewEl && DOM.sidebarEl) {
    const sidebarHidden = DOM.sidebarEl.classList.contains("hidden");
    const span = DOM.btnToggleViewEl.querySelector("span");
    if (span) span.textContent = sidebarHidden ? t("btn_show_list") : t("btn_only_map");
  }

  if (DOM.plusSectionEl && DOM.btnTogglePlusEl) {
    updateGenericSectionToggleLabel(DOM.btnTogglePlusEl, !!DOM.plusSectionEl.open);
  }
  if (DOM.daylogSectionEl && DOM.btnToggleDaylogEl) {
    updateGenericSectionToggleLabel(DOM.btnToggleDaylogEl, !!DOM.daylogSectionEl.open);
  }

  if (DOM.filterSearchEl) {
    DOM.filterSearchEl.placeholder =
      currentLang === LANG_EN
        ? "Place, spot, keywords …"
        : currentLang === LANG_DA
        ? "Sted, spot, søgeord …"
        : "Ort, Spot, Stichwörter …";
  }

  if (DOM.daylogTextEl && FEATURES.daylog) {
    DOM.daylogTextEl.placeholder =
      currentLang === LANG_EN
        ? "Today we went to the wildlife park – the goats were sooo cute!"
        : currentLang === LANG_DA
        ? "I dag var vi i dyreparken – gederne var såå søde!"
        : "Heute waren wir im Wildpark – die Ziegen waren sooo süß!";
  }

  if (FEATURES.daylog) updateDaylogUI();
  updateRadiusTexts();

  if (DOM.filterCategoryEl) {
    const firstOption = DOM.filterCategoryEl.querySelector("option[value='']");
    if (firstOption) firstOption.textContent = t("filter_category_all");
    populateCategoryOptions();
  }

  if (DOM.tagFilterContainerEl) renderTagFilterChips();
  if (!initial && tilla && typeof tilla.onLanguageChanged === "function") tilla.onLanguageChanged();

  updateLanguageSwitcherVisual();
  applyStaticI18n();
  updatePlusStatusText();
  updateFilterSummary();

  qsa(".sidebar-section-close").forEach((btn) => {
    btn.textContent =
      currentLang === LANG_EN ? "Close" : currentLang === LANG_DA ? "Luk" : "Schließen";
  });

  if (!initial) {
    const headerTitle = qs(".header-title");
    if (headerTitle && typeof headerTitle.focus === "function") headerTitle.focus();
  }
}

// ------------------------------------------------------
// Categories / Labels
// ------------------------------------------------------

function getCategoryLabel(slug) {
  if (!slug) return "";

  let langMap;
  let fallbackMap;

  if (currentLang === LANG_EN) {
    langMap = CATEGORY_LABELS_EN;
    fallbackMap = CATEGORY_LABELS_DE;
  } else if (currentLang === LANG_DA) {
    langMap = CATEGORY_LABELS_DA;
    fallbackMap = CATEGORY_LABELS_DE;
  } else {
    langMap = CATEGORY_LABELS_DE;
    fallbackMap = CATEGORY_LABELS_EN;
  }

  return (
    (langMap && langMap[slug]) ||
    (fallbackMap && fallbackMap[slug]) ||
    slug.replace(/[_-]/g, " ")
  );
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
      suffix =
        currentLang === LANG_EN
          ? " · water add-on (Plus)"
          : currentLang === LANG_DA
          ? " · vand-add-on (Plus)"
          : " · Wasser-Add-on (Plus)";
    } else if (access.addonId === "addon_rv") {
      suffix =
        currentLang === LANG_EN
          ? " · RV add-on (Plus)"
          : currentLang === LANG_DA
          ? " · autocamper-add-on (Plus)"
          : " · WoMo-Add-on (Plus)";
    } else {
      suffix =
        currentLang === LANG_EN
          ? " · add-on (Plus)"
          : currentLang === LANG_DA
          ? " · add-on (Plus)"
          : " · Add-on (Plus)";
    }
    return base + suffix;
  }

  return base;
}

// ------------------------------------------------------
// Favorites – persistence
// ------------------------------------------------------

function loadFavoritesFromStorage() {
  if (!FEATURES.favorites) return;
  try {
    const stored = localStorage.getItem("fs_favorites");
    if (!stored) return;
    const arr = JSON.parse(stored);
    if (Array.isArray(arr)) favorites = new Set(arr);
  } catch (err) {
    console.warn("[Family Spots] Favorites load failed:", err);
  }
}

function saveFavoritesToStorage() {
  if (!FEATURES.favorites) return;
  try {
    localStorage.setItem("fs_favorites", JSON.stringify(Array.from(favorites)));
  } catch (err) {
    console.warn("[Family Spots] Favorites save failed:", err);
  }
}

// ------------------------------------------------------
// Geolocation helpers
// ------------------------------------------------------

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

const applyFiltersAndRenderDebounced = debounce(() => applyFiltersAndRender(), 180);

function startLocationWatch() {
  if (!navigator.geolocation) return;
  if (geoWatchId != null) return;

  try {
    geoWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords || {};
        setUserLocation(latitude, longitude, accuracy);
        applyFiltersAndRenderDebounced();
      },
      () => { /* ignore */ },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );
  } catch {
    geoWatchId = null;
  }
}

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
// Radius / distance
// ------------------------------------------------------

function updateRadiusTexts() {
  if (!DOM.filterRadiusEl || !DOM.filterRadiusMaxLabelEl || !DOM.filterRadiusDescriptionEl) return;

  let value = parseInt(DOM.filterRadiusEl.value, 10);
  if (Number.isNaN(value)) value = RADIUS_STEPS_KM.length - 1;

  value = Math.min(Math.max(value, 0), RADIUS_STEPS_KM.length - 1);
  radiusStep = value;

  DOM.filterRadiusEl.value = String(radiusStep);
  DOM.filterRadiusEl.setAttribute("aria-valuenow", String(radiusStep));

  const maxIndex = RADIUS_STEPS_KM.length - 1;

  if (radiusStep === maxIndex) {
    DOM.filterRadiusMaxLabelEl.textContent = t("filter_radius_max_label");
    DOM.filterRadiusDescriptionEl.textContent = t("filter_radius_description_all");
  } else {
    const km = RADIUS_STEPS_KM[radiusStep];
    DOM.filterRadiusMaxLabelEl.textContent = `${km} km`;
    DOM.filterRadiusDescriptionEl.textContent = t(`filter_radius_description_step${radiusStep}`);
  }
}

function initRadiusSliderA11y() {
  if (!DOM.filterRadiusEl) return;

  const min = DOM.filterRadiusEl.min || "0";
  const max = DOM.filterRadiusEl.max || String(RADIUS_STEPS_KM.length - 1);

  if (!DOM.filterRadiusEl.value) DOM.filterRadiusEl.value = max;

  DOM.filterRadiusEl.setAttribute("aria-valuemin", min);
  DOM.filterRadiusEl.setAttribute("aria-valuemax", max);
  DOM.filterRadiusEl.setAttribute("aria-valuenow", DOM.filterRadiusEl.value);

  DOM.filterRadiusEl.addEventListener("input", async () => {
    updateRadiusTexts();

    const maxIndex = RADIUS_STEPS_KM.length - 1;
    if (radiusStep !== maxIndex && !userLocation && navigator.geolocation) {
      try {
        await requestUserLocationOnce({ enableHighAccuracy: true, timeout: 9000 });
        startLocationWatch();
      } catch {
        // bewusst: kein Pseudo-Radius um Map-Center
      }
    }

    applyFiltersAndRender();
  });

  updateRadiusTexts();
}

function isSpotInRadius(spot, originLatLng, radiusKm) {
  if (!originLatLng || typeof originLatLng.distanceTo !== "function") return true;
  if (!isFinite(radiusKm) || radiusKm === Infinity) return true;
  if (!hasValidLatLng(spot)) return true;
  if (typeof L === "undefined" || typeof L.latLng !== "function") return true;

  const spotLatLng = L.latLng(spot.lat, spot.lng);
  const km = originLatLng.distanceTo(spotLatLng) / 1000;
  return km <= radiusKm;
}

// ------------------------------------------------------
// Tag filter chips
// ------------------------------------------------------

function renderTagFilterChips() {
  if (!DOM.tagFilterContainerEl) return;

  if (!FILTERS || !Array.isArray(FILTERS) || !FILTERS.length) {
    DOM.tagFilterContainerEl.innerHTML = "";
    return;
  }

  DOM.tagFilterContainerEl.innerHTML = "";

  FILTERS.forEach((filter) => {
    if (!filter || !filter.id) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tag-filter-chip btn-chip";
    btn.dataset.filterId = filter.id;

    const isActive = activeTagFilters.has(filter.id);
    btn.classList.toggle("tag-filter-chip--active", isActive);
    setAriaPressed(btn, isActive);

    const label = (filter.label && (filter.label[currentLang] || filter.label.de)) || filter.id;
    btn.textContent = label;

    DOM.tagFilterContainerEl.appendChild(btn);
  });
}

// Delegated click handler (keine Re-Binds bei Re-Render)
function handleTagChipClick(event) {
  const btn = event.target && event.target.closest
    ? event.target.closest("button[data-filter-id]")
    : null;
  if (!btn) return;

  const id = btn.dataset.filterId;
  if (!id) return;

  if (activeTagFilters.has(id)) activeTagFilters.delete(id);
  else activeTagFilters.add(id);

  // Update only this chip (ohne kompletten Re-Render)
  const isActive = activeTagFilters.has(id);
  btn.classList.toggle("tag-filter-chip--active", isActive);
  setAriaPressed(btn, isActive);

  applyFiltersAndRender();
}

// ------------------------------------------------------
// Filter summary
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
  if (!DOM.filterSummaryEl) return;

  const parts = [];
  const maxRadiusIndex = RADIUS_STEPS_KM.length - 1;

  if (searchTerm) {
    parts.push(
      currentLang === LANG_EN ? `Search: “${searchTerm}”`
      : currentLang === LANG_DA ? `Søgning: “${searchTerm}”`
      : `Suche: „${searchTerm}“`
    );
  }

  if (moodFilter) {
    const label = getMoodLabel(moodFilter);
    if (label) {
      parts.push(
        currentLang === LANG_EN ? `Mood: ${label}`
        : currentLang === LANG_DA ? `Stemning: ${label}`
        : `Stimmung: ${label}`
      );
    }
  }

  if (radiusStep !== maxRadiusIndex) {
    const km = RADIUS_STEPS_KM[radiusStep];
    parts.push(`Radius: ${km} km`);
  }

  if (categoryFilter && DOM.filterCategoryEl) {
    const selected = DOM.filterCategoryEl.selectedOptions[0];
    const label = (selected && selected.textContent.trim()) || getCategoryLabel(categoryFilter);
    if (label) {
      parts.push(
        currentLang === LANG_EN ? `Category: ${label}`
        : currentLang === LANG_DA ? `Kategori: ${label}`
        : `Kategorie: ${label}`
      );
    }
  }

  if (ageFilter !== "all" && DOM.filterAgeEl) {
    const selected = DOM.filterAgeEl.selectedOptions[0];
    const label = selected ? selected.textContent.trim() : ageFilter;
    parts.push(
      currentLang === LANG_EN ? `Age: ${label}`
      : currentLang === LANG_DA ? `Alder: ${label}`
      : `Alter: ${label}`
    );
  }

  if (activeTagFilters.size > 0) {
    const c = activeTagFilters.size;
    parts.push(
      currentLang === LANG_EN ? `Quick filters (${c})`
      : currentLang === LANG_DA ? `Hurtigfiltre (${c})`
      : `Schnellfilter (${c})`
    );
  }

  if (onlyVerified) {
    parts.push(
      currentLang === LANG_EN ? "Only verified spots"
      : currentLang === LANG_DA ? "Kun verificerede spots"
      : "Nur verifizierte Spots"
    );
  }

  if (onlyFavorites) {
    parts.push(
      currentLang === LANG_EN ? "Favourites only"
      : currentLang === LANG_DA ? "Kun favoritter"
      : "Nur Favoriten"
    );
  }

  if (onlyBigAdventures) {
    parts.push(
      currentLang === LANG_EN ? "Big adventures"
      : currentLang === LANG_DA ? "Store eventyr"
      : "Große Abenteuer"
    );
  }

  const text = parts.length
    ? (currentLang === LANG_EN ? "Active filters: "
      : currentLang === LANG_DA ? "Aktive filtre: " : "Aktive Filter: ") + parts.join(" · ")
    : (currentLang === LANG_EN ? "Active filters: basic filters"
      : currentLang === LANG_DA ? "Aktive filtre: basisfiltre" : "Aktive Filter: Basisfilter");

  DOM.filterSummaryEl.textContent = text;
}

function getFilterContext() {
  const maxIndex = RADIUS_STEPS_KM.length - 1;
  const radiusKm =
    radiusStep >= 0 && radiusStep <= maxIndex
      ? RADIUS_STEPS_KM[radiusStep]
      : RADIUS_STEPS_KM[maxIndex];

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
    origin: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null
  };
}

// ------------------------------------------------------
// Modal (Filter) – open/close + focus trap
// ------------------------------------------------------

function trapFocusWithin(container) {
  return (event) => {
    if (event.key !== "Tab") return;
    if (!container) return;

    const focusables = container.querySelectorAll(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );

    const list = Array.from(focusables).filter((el) => !el.hasAttribute("disabled"));
    if (!list.length) return;

    const first = list[0];
    const last = list[list.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };
}

function openFilterModal() {
  if (!DOM.filterModalEl) return;

  isFilterModalOpen = true;
  lastFocusBeforeFilterModal = document.activeElement;

  DOM.filterModalEl.hidden = false;
  document.body?.setAttribute("data-filter-modal-open", "1");

  modalFocusTrapHandler = trapFocusWithin(DOM.filterModalEl);
  DOM.filterModalEl.addEventListener("keydown", modalFocusTrapHandler);

  const focusable = DOM.filterModalEl.querySelector(
    "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
  );
  focusable?.focus?.();
}

function closeFilterModal({ returnFocus = true } = {}) {
  if (!DOM.filterModalEl) return;
  if (!isFilterModalOpen) return;

  isFilterModalOpen = false;
  DOM.filterModalEl.hidden = true;
  document.body?.removeAttribute("data-filter-modal-open");

  if (modalFocusTrapHandler) {
    DOM.filterModalEl.removeEventListener("keydown", modalFocusTrapHandler);
    modalFocusTrapHandler = null;
  }

  if (returnFocus && lastFocusBeforeFilterModal?.focus) {
    lastFocusBeforeFilterModal.focus();
  }
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

  radiusStep = RADIUS_STEPS_KM.length - 1;

  if (DOM.filterSearchEl) DOM.filterSearchEl.value = "";
  if (DOM.filterAgeEl) DOM.filterAgeEl.value = "all";
  if (DOM.filterCategoryEl) DOM.filterCategoryEl.value = "";

  if (DOM.filterRadiusEl) {
    DOM.filterRadiusEl.value = String(radiusStep);
    updateRadiusTexts();
  }

  if (DOM.filterBigEl) DOM.filterBigEl.checked = false;
  if (DOM.filterVerifiedEl) DOM.filterVerifiedEl.checked = false;
  if (DOM.filterFavoritesEl) DOM.filterFavoritesEl.checked = false;

  qsa(".mood-chip").forEach((chip) => {
    chip.classList.remove("mood-chip--active");
    setAriaPressed(chip, false);
  });

  qsa(".travel-chip").forEach((chip) => {
    chip.classList.remove("travel-chip--active");
    setAriaPressed(chip, false);
  });

  if (tilla?.setTravelMode) tilla.setTravelMode(null);

  renderTagFilterChips();
  applyFiltersAndRender();
}

// ------------------------------------------------------
// Visibility rules (validFrom/validTo + Plus/add-ons)
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

  const slugs = Array.isArray(spot.categories)
    ? spot.categories
    : spot.category
    ? [spot.category]
    : [];

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

    if (rule.level === "subscription") {
      return plan === rule.subscriptionId;
    }

    if (rule.level === "addon") {
      const hasBase = plan === rule.subscriptionId;
      const hasAddon = Array.isArray(addons) && rule.addonId ? addons.includes(rule.addonId) : false;
      return hasBase && hasAddon;
    }

    return true;
  });
}

// ------------------------------------------------------
// Plus status UI
// ------------------------------------------------------

function updatePlusStatusText(status) {
  if (!DOM.plusStatusTextEl) return;

  if (!FEATURES.plus) {
    DOM.plusStatusTextEl.textContent = "";
    return;
  }

  const s = status || getPlusStatus();
  DOM.plusStatusTextEl.textContent = formatPlusStatus(s);
}

// ------------------------------------------------------
// Load spots
// ------------------------------------------------------

function showSpotsLoadErrorUI() {
  if (!DOM.spotListEl) return;

  DOM.spotListEl.innerHTML = "";

  const msg = document.createElement("p");
  msg.className = "filter-group-helper";
  msg.textContent =
    currentLang === LANG_EN
      ? "Spots could not be loaded. Please check your connection and try again."
      : currentLang === LANG_DA
      ? "Spots kunne ikke indlæses. Tjek venligst forbindelsen og prøv igen."
      : "Die Spots konnten nicht geladen werden. Prüfe deine Verbindung und versuche es erneut.";
  DOM.spotListEl.appendChild(msg);

  const retryBtn = document.createElement("button");
  retryBtn.type = "button";
  retryBtn.className = "btn btn-small";
  retryBtn.textContent =
    currentLang === LANG_EN ? "Try again" : currentLang === LANG_DA ? "Prøv igen" : "Erneut versuchen";

  retryBtn.addEventListener("click", () => {
    showToast(
      currentLang === LANG_EN
        ? "Reloading spots…"
        : currentLang === LANG_DA
        ? "Indlæser spots igen …"
        : "Lade Spots erneut …"
    );
    loadSpots();
  });

  DOM.spotListEl.appendChild(retryBtn);
}

async function loadSpots() {
  try {
    const result = await loadData();
    const rawSpots = Array.isArray(result.spots) ? result.spots : [];

    spots = rawSpots.map(normalizeSpot);

    console.log("[Family Spots] loadSpots:", { total: spots.length });

    loadFavoritesFromStorage();
    populateCategoryOptions();
    renderTagFilterChips();

    if (result.fromCache) {
      showToast(
        currentLang === LANG_EN ? "Loaded offline data."
        : currentLang === LANG_DA ? "Indlæste offline-data."
        : "Offline-Daten geladen."
      );
    }

    applyFiltersAndRender();
  } catch (err) {
    console.error("[Family Spots] loadSpots failed:", err);

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

    tilla?.onNoSpotsFound?.();
  }
}

// ------------------------------------------------------
// Category dropdown
// ------------------------------------------------------

function populateCategoryOptions() {
  if (!DOM.filterCategoryEl) return;

  const firstOption =
    DOM.filterCategoryEl.querySelector("option[value='']") || document.createElement("option");
  firstOption.value = "";
  firstOption.textContent = t("filter_category_all");

  DOM.filterCategoryEl.innerHTML = "";
  DOM.filterCategoryEl.appendChild(firstOption);

  const groupedSlugs = new Set();

  Object.entries(CATEGORY_GROUPS).forEach(([groupKey, slugs]) => {
    if (!Array.isArray(slugs) || !slugs.length) return;

    const groupLabel =
      (CATEGORY_GROUP_LABELS[currentLang] && CATEGORY_GROUP_LABELS[currentLang][groupKey]) ||
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

    DOM.filterCategoryEl.appendChild(optgroup);
  });

  const extraSet = new Set();

  spots.forEach((spot) => {
    if (Array.isArray(spot.categories)) {
      spot.categories.forEach((c) => {
        if (!c) return;
        if (!groupedSlugs.has(c)) extraSet.add(c);
      });
    } else if (spot.category && !groupedSlugs.has(spot.category)) {
      extraSet.add(spot.category);
    }
  });

  if (extraSet.size > 0) {
    const extraGroup = document.createElement("optgroup");
    extraGroup.label =
      currentLang === LANG_EN
        ? "Other categories"
        : currentLang === LANG_DA
        ? "Andre kategorier"
        : "Weitere Kategorien";

    Array.from(extraSet)
      .sort((a, b) =>
        getCategoryLabel(a)
          .toLowerCase()
          .localeCompare(
            getCategoryLabel(b).toLowerCase(),
            currentLang === LANG_DE ? "de" : currentLang === LANG_DA ? "da" : "en"
          )
      )
      .forEach((slug) => {
        const opt = document.createElement("option");
        opt.value = slug;
        opt.textContent = getCategoryLabelWithAccess(slug);
        extraGroup.appendChild(opt);
      });

    DOM.filterCategoryEl.appendChild(extraGroup);
  }

  DOM.filterCategoryEl.value = categoryFilter || "";
}

// ------------------------------------------------------
// Core filtering + rendering
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

    tilla?.onNoSpotsFound?.();
    updateFilterSummary();

    tilla?.onFiltersUpdated?.({
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

  const radiusKm =
    RADIUS_STEPS_KM[radiusStep] ??
    RADIUS_STEPS_KM[RADIUS_STEPS_KM.length - 1] ??
    Infinity;

  filteredSpots = originLatLng
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

  tilla?.onFiltersUpdated?.({
    totalSpots: spots.length,
    filteredSpotsCount: filteredSpots.length,
    filters: getFilterContext()
  });
}

// ------------------------------------------------------
// Badges / meta
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

  const slugs = Array.isArray(spot.categories)
    ? spot.categories
    : spot.category
    ? [spot.category]
    : [];

  if (!slugs.length) return false;
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

  if (minutes < 60) {
    return (currentLang === LANG_DE) ? `~${minutes} Min.` : `~${minutes} min`;
  }

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
      type: "distance",
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
  if (timeLabel) badges.push({ type: "time", className: "badge badge--time", icon: "⏱️", label: timeLabel });

  const ageLabel = getSpotAgeLabel(spot);
  if (ageLabel) badges.push({ type: "age", className: "badge badge--age", icon: "👶", label: ageLabel });

  const moodKey = getSpotPrimaryMoodKey(spot);
  const moodLabel = getMoodLabel(moodKey);
  if (moodLabel) badges.push({ type: "mood", className: "badge badge--soft", icon: "🎈", label: moodLabel });

  if (isSpotVerified(spot)) {
    badges.push({
      type: "verified",
      className: "badge badge--verified",
      icon: "✔︎",
      label: currentLang === LANG_EN ? "Verified" : currentLang === LANG_DA ? "Verificeret" : "Verifiziert"
    });
  }

  if (isPlusSpot(spot)) badges.push({ type: "plus", className: "badge badge--plus", icon: "⭐", label: "Plus" });

  if (isBigAdventureSpot(spot)) {
    badges.push({
      type: "big",
      className: "badge badge--big",
      icon: "🎒",
      label: currentLang === LANG_EN ? "Big adventure" : currentLang === LANG_DA ? "Stort eventyr" : "Großes Abenteuer"
    });
  }

  return badges;
}

// ------------------------------------------------------
// Spot list rendering
// ------------------------------------------------------

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

function renderSpotList() {
  if (!DOM.spotListEl) return;
  DOM.spotListEl.innerHTML = "";

  if (!filteredSpots.length) {
    const wrapper = document.createElement("div");
    wrapper.className = "empty-state";

    const titleEl = document.createElement("h3");
    titleEl.className = "empty-state-title";

    const textEl = document.createElement("p");
    textEl.className = "empty-state-text";

    const actionsEl = document.createElement("div");
    actionsEl.className = "empty-state-actions";

    if (currentLang === LANG_EN) {
      titleEl.textContent = "No spots for your selection right now";
      textEl.textContent = "Your radius might be too small or there are many filters active. Try one of these options:";
    } else if (currentLang === LANG_DA) {
      titleEl.textContent = "Ingen spots til jeres valg lige nu";
      textEl.textContent = "Måske er radius for lille, eller der er mange filtre slået til. Prøv en af disse muligheder:";
    } else {
      titleEl.textContent = "Gerade keine Spots für eure Auswahl";
      textEl.textContent = "Vielleicht ist euer Radius zu klein oder es sind viele Filter aktiv. Ihr könnt es so versuchen:";
    }

    const btnRadius = document.createElement("button");
    btnRadius.type = "button";
    btnRadius.className = "btn btn-small";
    btnRadius.textContent =
      currentLang === LANG_EN ? "Increase radius" : currentLang === LANG_DA ? "Større radius" : "Radius vergrößern";

    btnRadius.addEventListener("click", () => {
      if (!DOM.filterRadiusEl) return;
      const maxIndex = RADIUS_STEPS_KM.length - 1;
      let value = parseInt(DOM.filterRadiusEl.value, 10);
      if (Number.isNaN(value)) value = radiusStep;
      if (value < maxIndex) {
        radiusStep = value + 1;
        DOM.filterRadiusEl.value = String(radiusStep);
        updateRadiusTexts();
        applyFiltersAndRender();
      }
    });

    const btnReset = document.createElement("button");
    btnReset.type = "button";
    btnReset.className = "btn btn-small btn-secondary";
    btnReset.textContent =
      currentLang === LANG_EN ? "Reset all filters" : currentLang === LANG_DA ? "Nulstil alle filtre" : "Alle Filter zurücksetzen";
    btnReset.addEventListener("click", resetAllFilters);

    actionsEl.appendChild(btnRadius);
    actionsEl.appendChild(btnReset);

    wrapper.appendChild(titleEl);
    wrapper.appendChild(textEl);
    wrapper.appendChild(actionsEl);

    DOM.spotListEl.appendChild(wrapper);
    return;
  }

  filteredSpots.forEach((spot) => {
    const card = document.createElement("article");
    card.className = "spot-card";
    const spotId = getSpotId(spot);
    card.dataset.spotId = spotId;

    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", getSpotName(spot));

    const titleEl = document.createElement("h3");
    titleEl.className = "spot-card-title";
    titleEl.textContent = getSpotName(spot);

    const subtitleText = getSpotSubtitle(spot);
    const subtitleEl = document.createElement("p");
    subtitleEl.className = "spot-card-subtitle";
    subtitleEl.textContent = subtitleText;

    const metaParts = getSpotMetaParts(spot);
    const metaEl = document.createElement("p");
    metaEl.className = "spot-card-meta";
    metaEl.textContent = metaParts.join(" · ");

    const headerRow = document.createElement("div");
    headerRow.style.display = "flex";
    headerRow.style.alignItems = "center";
    headerRow.style.justifyContent = "space-between";
    headerRow.style.gap = "8px";

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
    if (subtitleText) card.appendChild(subtitleEl);
    if (metaParts.length) card.appendChild(metaEl);

    const badgesRow = document.createElement("div");
    badgesRow.className = "spot-card-badges";

    const badges = buildSpotBadges(spot);
    badges.forEach((badge) => {
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

    DOM.spotListEl.appendChild(card);
  });
}

// ------------------------------------------------------
// Spot details
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
  if (!DOM.spotDetailEl) return;

  DOM.spotDetailEl.classList.add("spot-details--hidden");
  DOM.spotDetailEl.innerHTML = "";

  if (returnFocus && lastSpotTriggerEl?.focus) {
    lastSpotTriggerEl.focus();
  }
}

function showSpotDetails(spot) {
  if (!DOM.spotDetailEl) return;

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

  DOM.spotDetailEl.innerHTML = "";
  DOM.spotDetailEl.classList.remove("spot-details--hidden");

  const headerEl = document.createElement("div");
  headerEl.className = "spot-details-header";

  const titleWrapperEl = document.createElement("div");

  const titleEl = document.createElement("h3");
  titleEl.className = "spot-details-title";
  titleEl.textContent = name;
  titleWrapperEl.appendChild(titleEl);

  if (subtitle && !addressText) {
    const subtitleEl = document.createElement("p");
    subtitleEl.className = "spot-card-subtitle";
    subtitleEl.textContent = subtitle;
    titleWrapperEl.appendChild(subtitleEl);
  }

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

  const metaEl = document.createElement("div");
  metaEl.className = "spot-details-meta";
  metaParts.forEach((p) => {
    const span = document.createElement("span");
    span.textContent = p;
    metaEl.appendChild(span);
  });

  DOM.spotDetailEl.appendChild(headerEl);
  if (metaParts.length) DOM.spotDetailEl.appendChild(metaEl);

  if (description) {
    const descEl = document.createElement("p");
    descEl.className = "spot-details-description";
    descEl.textContent = description;
    DOM.spotDetailEl.appendChild(descEl);
  }

  if (addressText) {
    const addrEl = document.createElement("p");
    addrEl.className = "spot-details-address";
    addrEl.textContent = addressText;
    DOM.spotDetailEl.appendChild(addrEl);
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

    DOM.spotDetailEl.appendChild(detailBadgesContainer);
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
    appleLink.textContent = t("route_apple");

    const googleLink = document.createElement("a");
    googleLink.href = routeUrls.google;
    googleLink.target = "_blank";
    googleLink.rel = "noopener noreferrer";
    googleLink.className = "spot-details-route-link";
    googleLink.textContent = t("route_google");

    routesEl.appendChild(appleLink);
    routesEl.appendChild(googleLink);

    DOM.spotDetailEl.appendChild(routesEl);
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
    DOM.spotDetailEl.appendChild(tagsEl);
  }

  if (typeof DOM.spotDetailEl.scrollTop === "number") DOM.spotDetailEl.scrollTop = 0;
}

// ------------------------------------------------------
// Favorites
// ------------------------------------------------------

function toggleFavorite(spot) {
  if (!FEATURES.favorites) return;

  const spotId = getSpotId(spot);
  const wasFavorite = favorites.has(spotId);

  if (wasFavorite) favorites.delete(spotId);
  else favorites.add(spotId);

  saveFavoritesToStorage();

  showToast(wasFavorite ? "toast_fav_removed" : "toast_fav_added");

  if (tilla) {
    const cb = wasFavorite ? tilla.onFavoriteRemoved : tilla.onFavoriteAdded;
    if (typeof cb === "function") cb.call(tilla);
  }

  renderSpotList();
}

// ------------------------------------------------------
// Plus & Daylog
// ------------------------------------------------------

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

  console.log("[Family Spots] Plus status loaded:", { plusActive, status });

  if (reapplyFilters && spots.length) applyFiltersAndRender();
}

async function handlePlusCodeSubmit() {
  if (!FEATURES.plus) return;
  if (!DOM.plusCodeInputEl || !DOM.plusStatusTextEl) return;

  const raw = DOM.plusCodeInputEl.value.trim();
  const result = await redeemPartnerCode(raw);

  if (!result.ok) {
    showToast(result.reason === "empty" ? "plus_code_empty" : "plus_code_unknown");
    return;
  }

  const status = result.status || getPlusStatus();
  plusActive = !!status.active;
  updatePlusStatusText(status);

  showToast("plus_code_activated");
  tilla?.onPlusActivated?.();

  applyFiltersAndRender();
}

function formatDaylogTimestamp(ts) {
  try {
    const date = new Date(ts);
    const locale = currentLang === LANG_EN ? "en-GB" : currentLang === LANG_DA ? "da-DK" : "de-DE";
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  } catch {
    return "";
  }
}

function updateDaylogUI() {
  if (!FEATURES.daylog) return;
  if (!DOM.daylogTextEl) return;

  if (DOM.daylogListEl) DOM.daylogListEl.innerHTML = "";

  if (!daylogEntries.length) {
    if (DOM.daylogLastSavedEl) {
      DOM.daylogLastSavedEl.textContent =
        currentLang === LANG_EN ? "Nothing saved yet."
        : currentLang === LANG_DA ? "Ingen gemte endnu."
        : "Noch nichts gespeichert.";
    }
    DOM.daylogClearEl?.classList.add("hidden");
    DOM.daylogTextEl.value = "";
    return;
  }

  daylogEntries.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const latest = daylogEntries[0];

  if (DOM.daylogLastSavedEl) {
    const formatted = formatDaylogTimestamp(latest.ts || Date.now());
    DOM.daylogLastSavedEl.textContent =
      currentLang === LANG_EN ? (formatted ? `Last saved: ${formatted}` : "Last saved.")
      : currentLang === LANG_DA ? (formatted ? `Sidst gemt: ${formatted}` : "Sidst gemt.")
      : (formatted ? `Zuletzt gespeichert: ${formatted}` : "Zuletzt gespeichert.");
  }

  DOM.daylogClearEl?.classList.toggle("hidden", daylogEntries.length === 0);
  DOM.daylogTextEl.value = "";

  if (!DOM.daylogListEl) return;

  daylogEntries.forEach((entry) => {
    if (!entry || !entry.text) return;

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

    DOM.daylogListEl.appendChild(item);
  });
}

function loadDaylogFromStorage() {
  if (!FEATURES.daylog) return;

  daylogEntries = [];

  try {
    const stored = localStorage.getItem(DAYLOG_STORAGE_KEY);
    if (!stored) {
      updateDaylogUI();
      return;
    }

    const parsed = JSON.parse(stored);

    if (parsed && Array.isArray(parsed.entries)) {
      daylogEntries = parsed.entries
        .filter((e) => e && typeof e.text === "string")
        .map((e) => ({
          id: e.id || e.ts || Date.now(),
          text: e.text.trim(),
          ts: typeof e.ts === "number" ? e.ts : Date.now()
        }))
        .filter((e) => e.text);
    } else if (parsed && typeof parsed.text === "string") {
      const ts = typeof parsed.ts === "number" ? parsed.ts : Date.now();
      daylogEntries = [{ id: ts, text: parsed.text.trim(), ts }].filter((e) => e.text);
    }
  } catch (err) {
    console.warn("[Family Spots] Daylog load failed:", err);
  }

  updateDaylogUI();
}

function handleDaylogSave() {
  if (!FEATURES.daylog) return;
  if (!DOM.daylogTextEl) return;

  const text = DOM.daylogTextEl.value.trim();
  if (!text) return;

  const now = Date.now();
  daylogEntries.push({ id: now, text, ts: now });

  try {
    localStorage.setItem(DAYLOG_STORAGE_KEY, JSON.stringify({ entries: daylogEntries }));
  } catch (err) {
    console.warn("[Family Spots] Daylog save failed:", err);
  }

  DOM.daylogTextEl.value = "";
  showToast("daylog_saved");
  tilla?.onDaylogSaved?.();
  updateDaylogUI();
}

function handleDaylogClear() {
  if (!FEATURES.daylog) return;

  daylogEntries = [];
  try {
    localStorage.removeItem(DAYLOG_STORAGE_KEY);
  } catch (err) {
    console.warn("[Family Spots] Daylog clear failed:", err);
  }

  updateDaylogUI();

  showToast(
    currentLang === LANG_EN ? "Entry deleted."
    : currentLang === LANG_DA ? "Notat slettet."
    : "Eintrag gelöscht."
  );
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
// UI toggles
// ------------------------------------------------------

function handleToggleFilters() {
  if (!DOM.btnToggleFiltersEl || !filterBodyEls.length) return;

  filtersCollapsed = !filtersCollapsed;
  const isExpanded = !filtersCollapsed;

  filterBodyEls.forEach((el) => el.classList.toggle("hidden", filtersCollapsed));

  const span = DOM.btnToggleFiltersEl.querySelector("span");
  if (span) span.textContent = filtersCollapsed ? t("btn_show_filters") : t("btn_hide_filters");

  setAriaExpanded(DOM.btnToggleFiltersEl, isExpanded);
}

function handleToggleView() {
  if (!DOM.sidebarEl || !DOM.btnToggleViewEl) return;
  const isHidden = DOM.sidebarEl.classList.toggle("hidden");

  const span = DOM.btnToggleViewEl.querySelector("span");
  if (span) span.textContent = isHidden ? t("btn_show_list") : t("btn_only_map");

  setAriaPressed(DOM.btnToggleViewEl, isHidden);

  if (map) window.setTimeout(() => map.invalidateSize(), 300);
}

// ------------------------------------------------------
// Mood/travel chips (delegated)
// ------------------------------------------------------

function handleMoodChipClick(event) {
  const chip = event.target?.closest?.(".mood-chip");
  if (!chip) return;

  const value = chip.getAttribute("data-mood");
  if (moodFilter === value) {
    moodFilter = null;
    chip.classList.remove("mood-chip--active");
    setAriaPressed(chip, false);
  } else {
    moodFilter = value;
    qsa(".mood-chip").forEach((c) => {
      c.classList.remove("mood-chip--active");
      setAriaPressed(c, false);
    });
    chip.classList.add("mood-chip--active");
    setAriaPressed(chip, true);
  }
  applyFiltersAndRender();
}

function handleTravelChipClick(event) {
  const chip = event.target?.closest?.(".travel-chip");
  if (!chip) return;

  const mode = chip.getAttribute("data-travel-mode") || "everyday";

  if (travelMode === mode) {
    travelMode = null;
    chip.classList.remove("travel-chip--active");
    setAriaPressed(chip, false);
    tilla?.setTravelMode?.(null);
  } else {
    travelMode = mode;
    qsa(".travel-chip").forEach((c) => {
      const active = c === chip;
      c.classList.toggle("travel-chip--active", active);
      setAriaPressed(c, active);
    });
    tilla?.setTravelMode?.(mode);
  }

  applyFiltersAndRender();
}

// ------------------------------------------------------
// Init
// ------------------------------------------------------

async function init() {
  try {
    DOM.languageSwitcherEl = document.getElementById("language-switcher") || document.getElementById("language-toggle");
    DOM.languageSwitcherFlagEl = document.getElementById("language-switcher-flag");
    DOM.themeToggleEl = document.getElementById("theme-toggle");
    DOM.btnLocateEl = document.getElementById("btn-locate");
    DOM.btnHelpEl = document.getElementById("btn-help");

    DOM.viewMapEl = document.getElementById("view-map");
    DOM.viewAboutEl = document.getElementById("view-about");

    DOM.bottomNavButtons = document.querySelectorAll(".bottom-nav-item");
    DOM.bottomNavMapLabelEl = document.getElementById("bottom-nav-map-label");
    DOM.bottomNavAboutLabelEl = document.getElementById("bottom-nav-about-label");

    DOM.sidebarEl = document.querySelector(".sidebar");
    const filterTitleEl = document.getElementById("filter-title");
    DOM.filterSectionEl = filterTitleEl ? filterTitleEl.closest(".sidebar-section") : null;

    if (DOM.filterSectionEl) {
      filterBodyEls = Array.from(DOM.filterSectionEl.children).filter(
        (el) => !el.classList.contains("sidebar-section-header")
      );
      filtersCollapsed = true;
      filterBodyEls.forEach((el) => el.classList.add("hidden"));
    }

    DOM.btnToggleFiltersEl = document.getElementById("btn-toggle-filters");
    DOM.btnToggleViewEl = document.getElementById("btn-toggle-view");

    DOM.playIdeasBtnEl = document.getElementById("btn-play-idea");

    DOM.filterSearchEl = document.getElementById("filter-search");
    DOM.filterCategoryEl = document.getElementById("filter-category");
    DOM.filterAgeEl = document.getElementById("filter-age");
    DOM.filterRadiusEl = document.getElementById("filter-radius");
    DOM.filterRadiusMaxLabelEl = document.getElementById("filter-radius-max-label");
    DOM.filterRadiusDescriptionEl = document.getElementById("filter-radius-description");
    DOM.filterBigEl = document.getElementById("filter-big-adventures");
    DOM.filterVerifiedEl = document.getElementById("filter-verified");
    DOM.filterFavoritesEl = document.getElementById("filter-favorites");
    DOM.tagFilterContainerEl = document.getElementById("filter-tags");

    DOM.filterSummaryEl = document.getElementById("filter-summary");

    DOM.btnOpenFilterModalEl = document.getElementById("btn-open-filter-modal");
    DOM.filterModalEl = document.getElementById("filter-modal");
    DOM.filterModalCloseEl = document.getElementById("filter-modal-close");
    DOM.filterModalApplyEl = document.getElementById("filter-modal-apply");
    DOM.filterModalResetEl = document.getElementById("filter-modal-reset");

    DOM.spotListEl = document.getElementById("spot-list");
    DOM.spotDetailEl = document.getElementById("spot-detail");
    DOM.spotsSectionEl = DOM.spotListEl ? DOM.spotListEl.closest(".sidebar-section--grow") : null;

    DOM.plusSectionEl = document.getElementById("plus-section");
    DOM.btnTogglePlusEl = document.getElementById("btn-toggle-plus");
    DOM.daylogSectionEl = document.getElementById("daylog-section");
    DOM.btnToggleDaylogEl = document.getElementById("btn-toggle-daylog");

    DOM.plusCodeInputEl = document.getElementById("plus-code-input");
    DOM.plusCodeSubmitEl = document.getElementById("plus-code-submit");
    DOM.plusStatusTextEl = document.getElementById("plus-status-text");

    DOM.daylogTextEl = document.getElementById("daylog-text");
    DOM.daylogSaveEl = document.getElementById("daylog-save");
    DOM.daylogLastSavedEl = document.getElementById("daylog-last-saved");
    DOM.daylogClearEl = document.getElementById("daylog-clear");
    DOM.daylogListEl = document.getElementById("daylog-list");

    DOM.toastEl = document.getElementById("toast");
    DOM.skipLinkEl = document.querySelector(".skip-link");

    if (DOM.btnToggleFiltersEl && DOM.filterSectionEl?.id) {
      DOM.btnToggleFiltersEl.setAttribute("aria-controls", DOM.filterSectionEl.id);
      setAriaExpanded(DOM.btnToggleFiltersEl, false);
    }

    const initialLang = getInitialLang();
    setLanguage(initialLang, { initial: true });

    const initialTheme = getInitialTheme();
    currentTheme = applyTheme(initialTheme);

    initToast({ element: DOM.toastEl, t });

    const mapResult = initMap({ center: DEFAULT_MAP_CENTER, zoom: DEFAULT_MAP_ZOOM });
    map = mapResult.map;
    markersLayer = mapResult.markersLayer;

    if (map) {
      if (DOM.spotDetailEl) {
        map.on("click", () => closeSpotDetails({ returnFocus: true }));
      }

      map.on(
        "moveend zoomend",
        debounce(() => applyFiltersAndRender(), 200)
      );

      window.addEventListener(
        "resize",
        debounce(() => map.invalidateSize(), 200),
        { passive: true }
      );
    }

    tilla = new TillaCompanion({ getText: (key) => t(key) });

    // Language switch
    if (DOM.languageSwitcherEl) {
      DOM.languageSwitcherEl.addEventListener("click", () => {
        const next = currentLang === LANG_DE ? LANG_DA : currentLang === LANG_DA ? LANG_EN : LANG_DE;
        setLanguage(next);
      });
      updateLanguageSwitcherVisual();
    }

    // Theme toggle
    if (DOM.themeToggleEl) {
      DOM.themeToggleEl.addEventListener("click", () => {
        const nextTheme = currentTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
        currentTheme = applyTheme(nextTheme);
      });
    }

    // Locate
    DOM.btnLocateEl?.addEventListener("click", handleLocateClick);

    // Router
    initRouter({
      viewMapEl: DOM.viewMapEl,
      viewAboutEl: DOM.viewAboutEl,
      bottomNavButtons: DOM.bottomNavButtons,
      btnHelpEl: DOM.btnHelpEl,
      getCurrentLang: () => currentLang
    });

    // Search
    if (DOM.filterSearchEl) {
      const applySearch = debounce((value) => {
        searchTerm = value.trim();
        applyFiltersAndRender();
      }, 200);

      DOM.filterSearchEl.addEventListener("input", (e) => applySearch(e.target.value));
    }

    // Category / Age
    DOM.filterCategoryEl?.addEventListener("change", (e) => {
      categoryFilter = e.target.value;
      applyFiltersAndRender();
    });

    DOM.filterAgeEl?.addEventListener("change", (e) => {
      ageFilter = e.target.value;
      applyFiltersAndRender();
    });

    // Radius
    if (DOM.filterRadiusEl) initRadiusSliderA11y();

    // Checkboxes
    DOM.filterBigEl?.addEventListener("change", (e) => {
      onlyBigAdventures = e.target.checked;
      applyFiltersAndRender();
    });

    DOM.filterVerifiedEl?.addEventListener("change", (e) => {
      onlyVerified = e.target.checked;
      applyFiltersAndRender();
    });

    if (FEATURES.favorites && DOM.filterFavoritesEl) {
      DOM.filterFavoritesEl.addEventListener("change", (e) => {
        onlyFavorites = e.target.checked;
        applyFiltersAndRender();
      });
    }

    // Mood + Travel: delegated handler on document (robust gegen dynamische DOM-Updates)
    if (FEATURES.moodFilter) document.addEventListener("click", handleMoodChipClick);
    if (FEATURES.travelMode) document.addEventListener("click", handleTravelChipClick);

    // Tag chips: delegated (Container)
    if (DOM.tagFilterContainerEl) {
      DOM.tagFilterContainerEl.addEventListener("click", handleTagChipClick);
    }

    // Filter toggle
    if (DOM.btnToggleFiltersEl) {
      DOM.btnToggleFiltersEl.addEventListener("click", handleToggleFilters);
      const span = DOM.btnToggleFiltersEl.querySelector("span");
      if (span) span.textContent = t("btn_show_filters");
    }

    // View toggle
    if (DOM.btnToggleViewEl) {
  DOM.btnToggleViewEl.addEventListener("click", handleToggleView);
  const span = DOM.btnToggleViewEl.querySelector("span");
  if (span && !span.textContent.trim()) {
    span.textContent = t("btn_only_map");
  }
  setAriaPressed(DOM.btnToggleViewEl, false);
}
    // Plus / Daylog section toggles
    if (DOM.plusSectionEl && DOM.btnTogglePlusEl) {
      DOM.plusSectionEl.id = DOM.plusSectionEl.id || "plus-section";
      DOM.btnTogglePlusEl.setAttribute("aria-controls", DOM.plusSectionEl.id);

      const toggle = (event) => {
        event.preventDefault();
        const isOpen = !DOM.plusSectionEl.open;
        DOM.plusSectionEl.open = isOpen;
        updateGenericSectionToggleLabel(DOM.btnTogglePlusEl, isOpen);
      };

      DOM.btnTogglePlusEl.addEventListener("click", toggle);
      DOM.btnTogglePlusEl.addEventListener("keydown", activateOnEnterSpace(toggle));
      DOM.plusSectionEl.addEventListener("toggle", () => updateGenericSectionToggleLabel(DOM.btnTogglePlusEl, DOM.plusSectionEl.open));
      updateGenericSectionToggleLabel(DOM.btnTogglePlusEl, !!DOM.plusSectionEl.open);
    }

    if (DOM.daylogSectionEl && DOM.btnToggleDaylogEl) {
      DOM.daylogSectionEl.id = DOM.daylogSectionEl.id || "daylog-section";
      DOM.btnToggleDaylogEl.setAttribute("aria-controls", DOM.daylogSectionEl.id);

      const toggle = (event) => {
        event.preventDefault();
        const isOpen = !DOM.daylogSectionEl.open;
        DOM.daylogSectionEl.open = isOpen;
        updateGenericSectionToggleLabel(DOM.btnToggleDaylogEl, isOpen);
      };

      DOM.btnToggleDaylogEl.addEventListener("click", toggle);
      DOM.btnToggleDaylogEl.addEventListener("keydown", activateOnEnterSpace(toggle));
      DOM.daylogSectionEl.addEventListener("toggle", () => updateGenericSectionToggleLabel(DOM.btnToggleDaylogEl, DOM.daylogSectionEl.open));
      updateGenericSectionToggleLabel(DOM.btnToggleDaylogEl, !!DOM.daylogSectionEl.open);
    }

    // Plus code
    if (FEATURES.plus && DOM.plusCodeSubmitEl) {
      DOM.plusCodeSubmitEl.addEventListener("click", handlePlusCodeSubmit);
    }

    // Daylog
    if (FEATURES.daylog) {
      DOM.daylogSaveEl?.addEventListener("click", handleDaylogSave);
      DOM.daylogClearEl?.addEventListener("click", handleDaylogClear);
    }

    // Play ideas
    if (FEATURES.playIdeas && DOM.playIdeasBtnEl) {
      DOM.playIdeasBtnEl.addEventListener("click", () => {
        const idea = getRandomPlayIdea();
        if (!idea) return;

        if (tilla?.showPlayIdea) {
          tilla.showPlayIdea(idea);
          const tillaCard = qs(".tilla-sidebar-card");
          tillaCard?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
        } else {
          showToast(idea);
        }
      });
    }

    // Filter modal
    DOM.btnOpenFilterModalEl?.addEventListener("click", openFilterModal);

    DOM.filterModalCloseEl?.addEventListener("click", () => closeFilterModal({ returnFocus: true }));

    DOM.filterModalApplyEl?.addEventListener("click", () => {
      applyFiltersAndRender();
      closeFilterModal({ returnFocus: true });
    });

    DOM.filterModalResetEl?.addEventListener("click", resetAllFilters);

    if (DOM.filterModalEl) {
      DOM.filterModalEl.addEventListener("click", (event) => {
        if (event.target === DOM.filterModalEl) closeFilterModal({ returnFocus: true });
      });
    }

    // Skip link
    if (DOM.skipLinkEl) {
      DOM.skipLinkEl.addEventListener("click", (event) => {
        const href = DOM.skipLinkEl.getAttribute("href") || "";
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

    // Close buttons in sections
    qsa(".sidebar-section-close").forEach((btn) => {
      const targetId = btn.getAttribute("data-target");
      let section = targetId ? document.getElementById(targetId) : null;
      if (!section) section = btn.closest(".sidebar-section");
      if (!section) return;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (section.tagName.toLowerCase() === "details") section.open = false;
        else section.classList.add("hidden");

        if (section.id === "plus-section" && DOM.btnTogglePlusEl) updateGenericSectionToggleLabel(DOM.btnTogglePlusEl, false);
        if (section.id === "daylog-section" && DOM.btnToggleDaylogEl) updateGenericSectionToggleLabel(DOM.btnToggleDaylogEl, false);
      });
    });

    // Escape handling
    document.addEventListener("keydown", (event) => {
      const key = event.key;
      if (key !== "Escape" && key !== "Esc") return;

      if (isFilterModalOpen && DOM.filterModalEl && !DOM.filterModalEl.hidden) {
        event.preventDefault();
        closeFilterModal({ returnFocus: true });
        return;
      }

      if (!DOM.spotDetailEl) return;
      const isOpen = !DOM.spotDetailEl.classList.contains("spot-details--hidden");
      if (!isOpen) return;

      event.preventDefault();
      closeSpotDetails({ returnFocus: true });
    });

    // Initial state
    loadPlusStateFromStorage();
    loadDaylogFromStorage();
    initLazyLoadImages();
    updateFilterSummary();

    // Initial tag chips
    renderTagFilterChips();

    // Load data
    loadSpots();
  } catch (err) {
    console.error("[Family Spots] Init error:", err);
  }
}

// ------------------------------------------------------
// DOMContentLoaded – I18N.init() + App-Init
// ------------------------------------------------------

document.addEventListener("DOMContentLoaded", async () => {
  try {
    if (typeof I18N !== "undefined" && typeof I18N.init === "function") {
      await I18N.init();
    }
  } catch (err) {
    console.warn("[Family Spots] I18N init failed:", err);
  }

  await init();
});

// =====================================================
// Spots <details>: Zustand merken + Reset Hook + iOS Fix
// =====================================================
(() => {
  const details = document.getElementById("spots-section");
  const label = document.getElementById("spots-toggle-label");
  if (!details || !label) return;

  const STORAGE_KEY = "fsm-spots-open"; // "1" | "0"

  const labels = {
    de: { open: "Ausblenden", closed: "Anzeigen" },
    en: { open: "Hide",      closed: "Show" },
    da: { open: "Skjul",     closed: "Vis" },
  };

  const getLang = () => {
    const l = (document.documentElement.lang || "de").toLowerCase();
    return l.startsWith("da") ? "da" : l.startsWith("en") ? "en" : "de";
  };

  const toast = (msg) => {
    const el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("toast--visible");
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(() => el.classList.remove("toast--visible"), 2200);
  };

  const syncLabel = () => {
    const dict = labels[getLang()] || labels.de;
    const isOpen = details.hasAttribute("open");
    label.textContent = isOpen ? dict.open : dict.closed;
  };

  const setOpen = (open) => {
    if (open) details.setAttribute("open", "");
    else details.removeAttribute("open");
    syncLabel();
  };

  // 1) Restore (falls gespeichert), sonst Default: ZU
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "1") setOpen(true);
    else if (saved === "0") setOpen(false);
    else setOpen(false);
  } catch {
    setOpen(false);
  }

  // 2) Toggle => speichern + Label updaten
  details.addEventListener("toggle", () => {
    const isOpen = details.hasAttribute("open");
    syncLabel();
    try {
      localStorage.setItem(STORAGE_KEY, isOpen ? "1" : "0");
    } catch {}
  });

  // 3) Wenn Sprache per JS umgestellt wird -> Label nachziehen
  const mo = new MutationObserver(syncLabel);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  // 4) Reset Button im Menü
  const btnReset = document.getElementById("btn-reset-ui");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setOpen(false);
      const l = getLang();
      toast(l === "en" ? "UI reset (Spots)." : l === "da" ? "UI nulstillet (Spots)." : "UI zurückgesetzt (Spots).");
    });
  }

  // 5) iOS/Safari: Klick auf "Nur Karte" im <summary> soll NICHT <details> togglen
  const btnMapOnly = document.getElementById("btn-toggle-view");
  if (btnMapOnly) {
    const stop = (e) => e.stopPropagation();
    btnMapOnly.addEventListener("pointerdown", stop, { passive: true });
    btnMapOnly.addEventListener("click", stop);
  }
})();