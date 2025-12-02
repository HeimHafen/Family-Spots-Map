// js/app.js
// ======================================================
// Family Spots Map – Hauptlogik (UI, State, Tilla, Navigation)
// Map- und Filterlogik ist in map.js / filters.js ausgelagert.
// Daten & Plus-Logik sind in data.js / features/plus.js ausgelagert.
// ======================================================

"use strict";

import "./i18n.js"; // Modul führt sich selbst aus und setzt globales I18N
import { TillaCompanion } from "./features/tilla.js";
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  // DAYLOG_STORAGE_KEY  // ❌ entfällt, DayLog kümmert sich jetzt selbst darum
  LANG_DE,
  LANG_EN,
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
  COMPASS_PLUS_HINT_KEY,
  FILTERS,
  CATEGORY_ACCESS
} from "./config.js";

import {
  normalizeSpot,
  filterSpots,
  getSpotName,
  getSpotSubtitle,
  getSpotId
} from "./filters.js";

import {
  initMap,
  renderMarkers,
  getRouteUrlsForSpot,
  hasValidLatLng
} from "./map.js";

import { initRouter } from "./router.js";
import { getInitialTheme, applyTheme } from "./theme.js";
import { initToast, showToast } from "./toast.js";
import { loadData } from "./data.js";
import {
  getPlusStatus,
  // isPlusActive,                // ❌ wurde nicht genutzt
  formatPlusStatus,
  redeemPartnerCode
} from "./features/plus.js";

// 👉 NEU: DayLog-Komponente initialisieren (Pfad ggf. anpassen)
import { initDayLog } from "./components/DayLog.js";

// ------------------------------------------------------
// Typdefinitionen (JSDoc) – für bessere Lesbarkeit & Tooling
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
// I18N / Text-Helfer
// ------------------------------------------------------

/** Übersetzungs-Helper (fällt zur Not auf Key zurück) */
const t = (key) =>
  typeof I18N !== "undefined" && typeof I18N.t === "function"
    ? I18N.t(key)
    : key;

/** Spielideen aus I18N abholen */
function getRandomPlayIdea() {
  if (
    typeof I18N !== "undefined" &&
    typeof I18N.getRandomPlayIdea === "function"
  ) {
    return I18N.getRandomPlayIdea();
  }
  return "";
}

/** Sprache aus LocalStorage / Browser / I18N ableiten */
function getInitialLang() {
  try {
    const stored = localStorage.getItem("fs_lang");
    if (stored === LANG_DE || stored === LANG_EN) return stored;
  } catch {
    // ignore
  }

  if (
    typeof I18N !== "undefined" &&
    typeof I18N.getLanguage === "function"
  ) {
    const fromI18n = I18N.getLanguage();
    if (fromI18n === LANG_DE || fromI18n === LANG_EN) return fromI18n;
  }

  const htmlLang =
    (document.documentElement.lang || navigator.language || LANG_DE)
      .toLowerCase()
      .slice(0, 2);

  return htmlLang === LANG_EN ? LANG_EN : LANG_DE;
}

/**
 * Header-Tagline: bevorzugt aus i18n ("header_tagline"),
 * sonst aus statischem HEADER_TAGLINE_TEXT.
 */
function updateHeaderTagline(lang) {
  const el = document.getElementById("header-tagline");
  if (!el) return;

  let text =
    HEADER_TAGLINE_TEXT[lang] ||
    HEADER_TAGLINE_TEXT.de ||
    el.textContent ||
    "";

  if (typeof I18N !== "undefined" && typeof I18N.t === "function") {
    text = I18N.t("header_tagline", text) || text;
  }

  el.textContent = text;
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

/** Toast-Entprellung für Marker-Limit */
let hasShownMarkerLimitToast = false;

// Filter-States
let plusActive = false;
let moodFilter = null; // "relaxed" | "action" | "water" | "animals" | null
let travelMode = null; // "everyday" | "trip" | null
let radiusStep = 4; // 0–4
let ageFilter = "all"; // "all" | "0-3" | "4-9" | "10+"
let searchTerm = "";
let categoryFilter = "";
let onlyBigAdventures = false;
let onlyVerified = false;
let onlyFavorites = false;
let filtersCollapsed = true;
/** Aktive Tag-Filter (IDs aus FILTERS) */
let activeTagFilters = new Set();

// DOM-Referenzen
let languageSwitcherEl;
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
let tagFilterContainerEl; // Container für Tag-Filter-Chips

// Plus & Mein Tag – Sections + Toggle-Buttons
let plusSectionEl;
let btnTogglePlusEl;
let daylogSectionEl;
let btnToggleDaylogEl;

let plusCodeInputEl;
let plusCodeSubmitEl;
let plusStatusTextEl;
let daylogTextEl;
// let daylogSaveEl; // ❌ entfällt, Save-Handling übernimmt DayLog.js
let toastEl;

// Kompass
let compassSectionEl;
let compassLabelEl;
let compassHelperEl;
let compassApplyLabelEl;
let compassApplyBtnEl;
let btnToggleCompassEl;

// Tilla
let tilla = null;

// Spielideen
let playIdeasBtnEl = null;

// Filter-Body innerhalb der Filter-Section
let filterBodyEls = [];

// Fokus-Merkung für Detail-Panel
let lastSpotTriggerEl = null;

// Onboarding-Hint (Kompass / Plus / Mein Tag)
let compassPlusHintEl = null;

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
    if (
      event.key === "Enter" ||
      event.key === " " ||
      event.key === "Spacebar"
    ) {
      event.preventDefault();
      handler(event);
    }
  };
}

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n-de]").forEach((el) => {
    const keyAttr = currentLang === LANG_DE ? "i18n-de" : "i18n-en";
    const text = el.getAttribute(`data-${keyAttr}`);
    if (text) el.textContent = text;
  });
}

function initLazyLoadImages() {
  if (!("loading" in HTMLImageElement.prototype)) return;
  document.querySelectorAll("img").forEach((img) => {
    if (!img.loading || img.loading === "auto") {
      img.loading = "lazy";
    }
  });
}

/**
 * Meta-Title, Meta-Description, ARIA-Labels & Tilla-Alt aus i18n setzen.
 * Wird bei jedem Sprachwechsel aufgerufen.
 */
function updateMetaAndA11yFromI18n() {
  if (typeof I18N === "undefined" || typeof I18N.t !== "function") return;

  const metaTitle = I18N.t("meta_title", document.title || "");
  if (metaTitle) {
    document.title = metaTitle;
  }

  const metaDescEl = document.querySelector('meta[name="description"]');
  if (metaDescEl) {
    const currentDesc = metaDescEl.getAttribute("content") || "";
    metaDescEl.setAttribute(
      "content",
      I18N.t("meta_description", currentDesc)
    );
  }

  if (themeToggleEl) {
    const fallback = themeToggleEl.getAttribute("aria-label") || "";
    themeToggleEl.setAttribute(
      "aria-label",
      I18N.t("btn_theme_toggle_aria", fallback)
    );
  }

  if (btnLocateEl) {
    const fallback = btnLocateEl.getAttribute("aria-label") || "";
    btnLocateEl.setAttribute(
      "aria-label",
      I18N.t("btn_locate_aria", fallback)
    );
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

// ------------------------------------------------------
// Sprache & Übersetzungen
// ------------------------------------------------------

// ... (ALLE FUNKTIONEN AB HIER UNVERÄNDERT LASSEN)
// setLanguage, populateCategoryOptions, Radius, Tag-Filter,
// applyFiltersAndRender, renderSpotList, Detail-Panel, Favoriten,
// Kompass, Plus etc. bleiben exakt wie in deiner Version oben,
// NUR die DayLog-spezifischen Teile wurden weiter unten geändert.
//
// ✨ WICHTIG: Ab hier nur die Stellen, die sich gegenüber deiner
// geposteten Version geändert haben (DayLog).

// ------------------------------------------------------
// Plus & Mein Tag
// ------------------------------------------------------

function loadPlusStateFromStorage(options = {}) {
  const { reapplyFilters = false } = options;

  if (!FEATURES.plus) {
    plusActive = false;
    updatePlusStatusText({ active: false, plan: null, validUntil: null });
    return;
  }

  try {
    const status = getPlusStatus();
    plusActive = !!status.active;
    updatePlusStatusText(status);
  } catch (err) {
    console.warn("[Family Spots] Konnte Plus-Status nicht laden:", err);
    plusActive = false;
    updatePlusStatusText({ active: false, plan: null, validUntil: null });
  }

  if (reapplyFilters && spots.length) {
    applyFiltersAndRender();
  }
}

async function handlePlusCodeSubmit() {
  if (!FEATURES.plus) return;
  if (!plusCodeInputEl || !plusStatusTextEl) return;

  const raw = plusCodeInputEl.value.trim();

  const result = await redeemPartnerCode(raw);

  if (!result.ok) {
    if (result.reason === "empty") {
      showToast("plus_code_empty");
    } else if (result.reason === "invalid_days") {
      showToast("plus_code_unknown");
    } else {
      showToast("plus_code_unknown");
    }
    return;
  }

  const status = result.status || getPlusStatus();
  plusActive = !!status.active;
  updatePlusStatusText(status);

  showToast("plus_code_activated");

  if (tilla && typeof tilla.onPlusActivated === "function") {
    tilla.onPlusActivated();
  }

  applyFiltersAndRender();
}

// ❌ loadDaylogFromStorage & handleDaylogSave sind entfernt – DayLog.js
// kümmert sich komplett um Speichern/Laden in localStorage.

// ------------------------------------------------------
// Initialisierung
// ------------------------------------------------------

async function init() {
  try {
    languageSwitcherEl =
      document.getElementById("language-switcher") ||
      document.getElementById("language-toggle");
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
    filterSectionEl = filterTitleEl
      ? filterTitleEl.closest(".sidebar-section")
      : null;

    if (filterSectionEl) {
      filterBodyEls = Array.from(filterSectionEl.children).filter(
        (el) => !el.classList.contains("sidebar-section-header")
      );
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
    filterRadiusDescriptionEl = document.getElementById(
      "filter-radius-description"
    );
    filterBigEl = document.getElementById("filter-big-adventures");
    filterVerifiedEl = document.getElementById("filter-verified");
    filterFavoritesEl = document.getElementById("filter-favorites");
    tagFilterContainerEl = document.getElementById("filter-tags");

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
    // daylogSaveEl = document.getElementById("daylog-save"); // ❌ nicht mehr benötigt

    toastEl = document.getElementById("toast");

    compassSectionEl = document.getElementById("compass-section");
    compassLabelEl = document.getElementById("compass-label");
    compassHelperEl = document.getElementById("compass-helper");
    compassApplyLabelEl = document.getElementById("compass-apply-label");
    compassApplyBtnEl = document.getElementById("compass-apply");
    btnToggleCompassEl = document.getElementById("btn-toggle-compass");

    // ... alles Weitere in init() bleibt unverändert BIS zu den DayLog-Stellen ...

    // Plus / Daylog Section-Toggler (unverändert)
    if (daylogSectionEl && btnToggleDaylogEl) {
      daylogSectionEl.id = daylogSectionEl.id || "daylog-section";
      btnToggleDaylogEl.setAttribute("aria-controls", daylogSectionEl.id);

      const toggleDaylogHandler = (event) => {
        event.preventDefault();
        const isOpen = !daylogSectionEl.open;
        daylogSectionEl.open = isOpen;
        updateGenericSectionToggleLabel(btnToggleDaylogEl, isOpen);
        markCompassPlusHintSeenAndRemove();
      };

      btnToggleDaylogEl.addEventListener("click", toggleDaylogHandler);
      btnToggleDaylogEl.addEventListener(
        "keydown",
        activateOnEnterSpace(toggleDaylogHandler)
      );

      daylogSectionEl.addEventListener("toggle", () => {
        updateGenericSectionToggleLabel(
          btnToggleDaylogEl,
          daylogSectionEl.open
        );
      });

      updateGenericSectionToggleLabel(btnToggleDaylogEl, !!daylogSectionEl.open);
    }

    if (FEATURES.plus && plusCodeSubmitEl) {
      plusCodeSubmitEl.addEventListener("click", () => {
        handlePlusCodeSubmit();
      });
    }

    // ❌ DayLog-Speicher-Handler über app.js entfernt:
    // if (FEATURES.daylog && daylogSaveEl) {
    //   daylogSaveEl.addEventListener("click", handleDaylogSave);
    // }

    if (FEATURES.compass && compassApplyBtnEl) {
      compassApplyBtnEl.addEventListener("click", handleCompassApply);
    }

    // 👉 NEU: DayLog-Komponente initialisieren
    if (FEATURES.daylog) {
      initDayLog();
    }

    // ... Rest von init() bleibt wie gehabt ...

    updateCompassUI();
    loadPlusStateFromStorage();
    // loadDaylogFromStorage(); // ❌ DayLog.js kümmert sich darum
    initLazyLoadImages();
    ensureCompassPlusHint();

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" && event.key !== "Esc") return;
      if (!spotDetailEl) return;

      const isOpen = !spotDetailEl.classList.contains("spot-details--hidden");
      if (!isOpen) return;

      event.preventDefault();
      closeSpotDetails({ returnFocus: true });
    });

    loadSpots();
  } catch (err) {
    console.error("[Family Spots] Init-Fehler:", err);
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
    console.warn("[Family Spots] I18N konnte nicht geladen werden:", err);
  }

  await init();
});