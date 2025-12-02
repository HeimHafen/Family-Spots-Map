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
  DAYLOG_STORAGE_KEY,
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
  isPlusActive,
  formatPlusStatus,
  redeemPartnerCode
} from "./features/plus.js";

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
let daylogSaveEl;
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

function getCategoryLabel(slug) {
  if (!slug) return "";
  const langMap =
    currentLang === LANG_EN ? CATEGORY_LABELS_EN : CATEGORY_LABELS_DE;
  const fallbackMap =
    currentLang === LANG_EN ? CATEGORY_LABELS_DE : CATEGORY_LABELS_EN;

  return (
    langMap[slug] ||
    fallbackMap[slug] ||
    slug.replace(/[_-]/g, " ")
  );
}

/**
 * Liefert das Kategorien-Label inkl. Hinweis auf Plus / Add-ons.
 * Basis-Kategorien bleiben unverändert.
 */
function getCategoryLabelWithAccess(slug) {
  const base = getCategoryLabel(slug);
  if (!CATEGORY_ACCESS || !CATEGORY_ACCESS.perCategory) return base;

  const access = CATEGORY_ACCESS.perCategory[slug];
  if (!access) {
    return base;
  }

  if (access.level === "subscription") {
    const suffix = currentLang === LANG_DE ? " · Plus" : " · Plus";
    return base + suffix;
  }

  if (access.level === "addon") {
    let suffix;
    if (access.addonId === "addon_water") {
      suffix =
        currentLang === LANG_DE
          ? " · Wasser-Add-on (Plus)"
          : " · water add-on (Plus)";
    } else if (access.addonId === "addon_rv") {
      suffix =
        currentLang === LANG_DE
          ? " · WoMo-Add-on (Plus)"
          : " · RV add-on (Plus)";
    } else {
      suffix =
        currentLang === LANG_DE ? " · Add-on (Plus)" : " · add-on (Plus)";
    }
    return base + suffix;
  }

  return base;
}

function updateLanguageSwitcherVisual() {
  if (!languageSwitcherEl) return;

  const label = currentLang === LANG_DE ? "DE" : "EN";
  languageSwitcherEl.textContent = label;

  languageSwitcherEl.setAttribute(
    "aria-label",
    currentLang === LANG_DE
      ? "Sprache: Deutsch (Tippen für Englisch)"
      : "Language: English (tap for German)"
  );
}

function updateGenericSectionToggleLabel(btn, isOpen) {
  if (!btn) return;
  const target = btn.querySelector("span") || btn;
  const isDe = currentLang === LANG_DE;
  const showLabel = isDe ? "Anzeigen" : "Show";
  const hideLabel = isDe ? "Ausblenden" : "Hide";
  target.textContent = isOpen ? hideLabel : showLabel;
  btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

function updatePlusStatusText(status) {
  if (!plusStatusTextEl) return;

  if (!FEATURES.plus) {
    plusStatusTextEl.textContent = "";
    return;
  }

  const s = status || getPlusStatus();
  plusStatusTextEl.textContent = formatPlusStatus(s);
}

// ------------------------------------------------------
// Onboarding-Hint (Kompass / Plus / Mein Tag)
// ------------------------------------------------------

function getCompassPlusHintText(lang = currentLang) {
  if (lang === LANG_EN) {
    return "Tip: You can open and collapse Compass, Family Spots Plus and “My day” at any time using the “Show” buttons.";
  }
  return "Tipp: Kompass, Family Spots Plus und „Mein Tag“ kannst du jederzeit über die Buttons „Anzeigen“ öffnen und wieder einklappen.";
}

function hasSeenCompassPlusHint() {
  try {
    return localStorage.getItem(COMPASS_PLUS_HINT_KEY) === "1";
  } catch {
    return false;
  }
}

function markCompassPlusHintSeenAndRemove() {
  try {
    localStorage.setItem(COMPASS_PLUS_HINT_KEY, "1");
  } catch {
    // ignore
  }
  if (compassPlusHintEl && compassPlusHintEl.parentNode) {
    compassPlusHintEl.parentNode.removeChild(compassPlusHintEl);
  }
  compassPlusHintEl = null;
}

function ensureCompassPlusHint() {
  if (!sidebarEl) return;
  if (hasSeenCompassPlusHint()) return;
  if (!plusSectionEl && !daylogSectionEl && !compassSectionEl) return;

  if (!compassPlusHintEl) {
    const hint = document.createElement("p");
    hint.id = "compass-plus-hint";
    hint.className = "filter-group-helper";
    hint.style.marginBottom = "6px";
    hint.textContent = getCompassPlusHintText();

    let anchor =
      plusSectionEl || daylogSectionEl || compassSectionEl || sidebarEl.firstChild;
    if (anchor && anchor.parentNode === sidebarEl) {
      sidebarEl.insertBefore(hint, anchor);
    } else {
      sidebarEl.insertBefore(hint, sidebarEl.firstChild);
    }

    compassPlusHintEl = hint;
  } else {
    compassPlusHintEl.textContent = getCompassPlusHintText();
  }
}

/**
 * Setzt Sprache, aktualisiert UI & speichert in localStorage.
 */
function setLanguage(lang, { initial = false } = {}) {
  currentLang = lang === LANG_EN ? LANG_EN : LANG_DE;

  try {
    localStorage.setItem("fs_lang", currentLang);
  } catch {
    // ignore
  }

  document.documentElement.lang = currentLang;

  try {
    if (
      typeof I18N !== "undefined" &&
      typeof I18N.setLanguage === "function"
    ) {
      I18N.setLanguage(currentLang);
    }
  } catch (err) {
    console.error("[Family Spots] I18N.setLanguage fehlgeschlagen:", err);
  }

  updateMetaAndA11yFromI18n();
  updateHeaderTagline(currentLang);

  if (bottomNavMapLabelEl) bottomNavMapLabelEl.textContent = t("nav_map");
  if (bottomNavAboutLabelEl) bottomNavAboutLabelEl.textContent = t("nav_about");

  if (FEATURES.compass && compassLabelEl) {
    compassLabelEl.textContent = t("compass_title");
  }
  if (FEATURES.compass && compassHelperEl) {
    compassHelperEl.textContent = t("compass_helper");
  }
  if (FEATURES.compass && compassApplyLabelEl) {
    compassApplyLabelEl.textContent = t("compass_apply_label");
  }

  updateCompassButtonLabel();
  updateCompassUI();

  const aboutDe = document.getElementById("page-about-de");
  const aboutEn = document.getElementById("page-about-en");
  if (aboutDe && aboutEn) {
    const showDe = currentLang === LANG_DE;
    aboutDe.classList.toggle("hidden", !showDe);
    aboutDe.setAttribute("aria-hidden", showDe ? "false" : "true");
    aboutEn.classList.toggle("hidden", showDe);
    aboutEn.setAttribute("aria-hidden", showDe ? "true" : "false");
  }

  if (btnToggleFiltersEl) {
    const span = btnToggleFiltersEl.querySelector("span");
    if (span) {
      span.textContent = filtersCollapsed
        ? t("btn_show_filters")
        : t("btn_hide_filters");
    }
  }

  if (btnToggleViewEl && sidebarEl) {
    const sidebarHidden = sidebarEl.classList.contains("hidden");
    const span = btnToggleViewEl.querySelector("span");
    if (span) {
      span.textContent = sidebarHidden ? t("btn_show_list") : t("btn_only_map");
    }
  }

  if (plusSectionEl && btnTogglePlusEl) {
    updateGenericSectionToggleLabel(btnTogglePlusEl, !!plusSectionEl.open);
  }
  if (daylogSectionEl && btnToggleDaylogEl) {
    updateGenericSectionToggleLabel(btnToggleDaylogEl, !!daylogSectionEl.open);
  }

  if (filterSearchEl) {
    filterSearchEl.placeholder =
      currentLang === LANG_DE
        ? "Ort, Spot, Stichwörter …"
        : "Place, spot, keywords …";
  }

  if (daylogTextEl && FEATURES.daylog) {
    daylogTextEl.placeholder =
      currentLang === LANG_DE
        ? "Heute waren wir im Wildpark – die Ziegen waren sooo süß!"
        : "Today we went to the wildlife park – the goats were sooo cute!";
  }

  updateRadiusTexts();

  if (filterCategoryEl) {
    const firstOption = filterCategoryEl.querySelector("option[value='']");
    if (firstOption) firstOption.textContent = t("filter_category_all");
    populateCategoryOptions();
  }

  if (tagFilterContainerEl) {
    renderTagFilterChips();
  }

  if (!initial && tilla && typeof tilla.onLanguageChanged === "function") {
    tilla.onLanguageChanged();
  }

  updateLanguageSwitcherVisual();
  applyStaticI18n();
  updatePlusStatusText();

  document.querySelectorAll(".sidebar-section-close").forEach((btn) => {
    btn.textContent = currentLang === LANG_DE ? "Schließen" : "Close";
  });

  ensureCompassPlusHint();

  if (!initial) {
    const headerTitle = document.querySelector(".header-title");
    if (headerTitle && typeof headerTitle.focus === "function") {
      headerTitle.focus();
    }
  }
}

// ------------------------------------------------------
// Spots – Laden (über data.js)
// ------------------------------------------------------

function showSpotsLoadErrorUI() {
  if (!spotListEl) return;

  spotListEl.innerHTML = "";

  const msg = document.createElement("p");
  msg.className = "filter-group-helper";
  msg.textContent =
    currentLang === LANG_DE
      ? "Die Spots konnten nicht geladen werden. Prüfe deine Verbindung und versuche es erneut."
      : "Spots could not be loaded. Please check your connection and try again.";
  spotListEl.appendChild(msg);

  const retryBtn = document.createElement("button");
  retryBtn.type = "button";
  retryBtn.className = "btn btn-small";
  retryBtn.textContent =
    currentLang === LANG_DE ? "Erneut versuchen" : "Try again";

  retryBtn.addEventListener("click", () => {
    showToast(
      currentLang === LANG_DE
        ? "Lade Spots erneut …"
        : "Reloading spots…"
    );
    loadSpots();
  });

  spotListEl.appendChild(retryBtn);
}

async function loadSpots() {
  try {
    const result = await loadData();
    const rawSpots = Array.isArray(result.spots) ? result.spots : [];

    spots = rawSpots.map(normalizeSpot);

    loadFavoritesFromStorage();
    populateCategoryOptions();

    if (tagFilterContainerEl) {
      renderTagFilterChips();
    }

    if (result.fromCache) {
      showToast(
        currentLang === LANG_DE
          ? "Offline-Daten geladen."
          : "Loaded offline data."
      );
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

    if (tilla && typeof tilla.onNoSpotsFound === "function") {
      tilla.onNoSpotsFound();
    }
  }
}

// ------------------------------------------------------
// Favorites – Persistence
// ------------------------------------------------------

function loadFavoritesFromStorage() {
  if (!FEATURES.favorites) return;

  try {
    const stored = localStorage.getItem("fs_favorites");
    if (!stored) return;
    const arr = JSON.parse(stored);
    if (Array.isArray(arr)) favorites = new Set(arr);
  } catch (err) {
    console.warn("[Family Spots] Konnte Favoriten nicht laden:", err);
  }
}

function saveFavoritesToStorage() {
  if (!FEATURES.favorites) return;

  try {
    localStorage.setItem("fs_favorites", JSON.stringify(Array.from(favorites)));
  } catch (err) {
    console.warn("[Family Spots] Konnte Favoriten nicht speichern:", err);
  }
}

// ------------------------------------------------------
// Kategorien / Filter-Dropdown
// ------------------------------------------------------

function populateCategoryOptions() {
  if (!filterCategoryEl) return;

  const firstOption =
    filterCategoryEl.querySelector("option[value='']") ||
    document.createElement("option");
  firstOption.value = "";
  firstOption.textContent = t("filter_category_all");

  filterCategoryEl.innerHTML = "";
  filterCategoryEl.appendChild(firstOption);

  const groupedSlugs = new Set();

  Object.entries(CATEGORY_GROUPS).forEach(([groupKey, slugs]) => {
    if (!Array.isArray(slugs) || !slugs.length) return;

    const groupLabel =
      (CATEGORY_GROUP_LABELS[currentLang] &&
        CATEGORY_GROUP_LABELS[currentLang][groupKey]) ||
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

    filterCategoryEl.appendChild(optgroup);
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
      currentLang === LANG_DE ? "Weitere Kategorien" : "Other categories";

    Array.from(extraSet)
      .sort((a, b) =>
        getCategoryLabel(a)
          .toLowerCase()
          .localeCompare(
            getCategoryLabel(b).toLowerCase(),
            currentLang === LANG_DE ? "de" : "en"
          )
      )
      .forEach((slug) => {
        const opt = document.createElement("option");
        opt.value = slug;
        opt.textContent = getCategoryLabelWithAccess(slug);
        extraGroup.appendChild(opt);
      });

    filterCategoryEl.appendChild(extraGroup);
  }

  filterCategoryEl.value = categoryFilter || "";
}

// ------------------------------------------------------
// Radius / Geodistanz
// ------------------------------------------------------

function updateRadiusTexts() {
  if (!filterRadiusEl || !filterRadiusMaxLabelEl || !filterRadiusDescriptionEl)
    return;

  let value = parseInt(filterRadiusEl.value, 10);
  if (Number.isNaN(value)) {
    value = 4;
  }
  value = Math.min(Math.max(value, 0), RADIUS_STEPS_KM.length - 1);
  radiusStep = value;

  filterRadiusEl.value = String(radiusStep);
  filterRadiusEl.setAttribute("aria-valuenow", String(radiusStep));

  if (radiusStep === RADIUS_STEPS_KM.length - 1) {
    filterRadiusMaxLabelEl.textContent = t("filter_radius_max_label");
    filterRadiusDescriptionEl.textContent = t("filter_radius_description_all");
  } else {
    const km = RADIUS_STEPS_KM[radiusStep];
    filterRadiusMaxLabelEl.textContent = `${km} km`;
    const key = `filter_radius_description_step${radiusStep}`;
    filterRadiusDescriptionEl.textContent = t(key);
  }
}

function initRadiusSliderA11y() {
  if (!filterRadiusEl) return;

  const min = filterRadiusEl.min || "0";
  const max = filterRadiusEl.max || String(RADIUS_STEPS_KM.length - 1);

  if (!filterRadiusEl.value) {
    filterRadiusEl.value = max;
  }

  filterRadiusEl.setAttribute("aria-valuemin", min);
  filterRadiusEl.setAttribute("aria-valuemax", max);
  filterRadiusEl.setAttribute("aria-valuenow", filterRadiusEl.value);

  filterRadiusEl.addEventListener("input", () => {
    updateRadiusTexts();
    applyFiltersAndRender();
  });

  updateRadiusTexts();
}

/**
 * Distanz-Check für einen Spot relativ zu centerLatLng / radiusKm.
 */
function isSpotInRadius(spot, centerLatLng, radiusKm) {
  if (!centerLatLng || typeof centerLatLng.distanceTo !== "function") {
    return true;
  }
  if (!isFinite(radiusKm) || radiusKm === Infinity) return true;
  if (!hasValidLatLng(spot)) return true;

  if (typeof L === "undefined" || typeof L.latLng !== "function") return true;

  const spotLatLng = L.latLng(spot.lat, spot.lng);
  const distanceMeters = centerLatLng.distanceTo(spotLatLng);
  const distanceKm = distanceMeters / 1000;
  return distanceKm <= radiusKm;
}

// ------------------------------------------------------
// Tag-Filter-Chips (UI)
// ------------------------------------------------------

function renderTagFilterChips() {
  if (!tagFilterContainerEl) return;
  if (!FILTERS || !Array.isArray(FILTERS) || !FILTERS.length) {
    tagFilterContainerEl.innerHTML = "";
    return;
  }

  tagFilterContainerEl.innerHTML = "";

  FILTERS.forEach((filter) => {
    if (!filter || !filter.id) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tag-filter-chip btn-chip";
    btn.dataset.filterId = filter.id;

    const isActive = activeTagFilters.has(filter.id);
    if (isActive) {
      btn.classList.add("tag-filter-chip--active");
      btn.setAttribute("aria-pressed", "true");
    } else {
      btn.setAttribute("aria-pressed", "false");
    }

    const label =
      (filter.label && (filter.label[currentLang] || filter.label.de)) ||
      filter.id;
    btn.textContent = label;

    btn.addEventListener("click", () => {
      const currentlyActive = activeTagFilters.has(filter.id);
      if (currentlyActive) {
        activeTagFilters.delete(filter.id);
      } else {
        activeTagFilters.add(filter.id);
      }
      renderTagFilterChips();
      applyFiltersAndRender();
    });

    tagFilterContainerEl.appendChild(btn);
  });
}

// ------------------------------------------------------
// Filterlogik (verwendet filterSpots aus filters.js)
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

    if (tilla && typeof tilla.onNoSpotsFound === "function") {
      tilla.onNoSpotsFound();
    }
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

  let center = null;
  if (map && typeof map.getCenter === "function") {
    center = map.getCenter();
  } else if (typeof L !== "undefined" && typeof L.latLng === "function") {
    center = L.latLng(DEFAULT_MAP_CENTER[0], DEFAULT_MAP_CENTER[1]);
  }

  const radiusKm =
    RADIUS_STEPS_KM[radiusStep] ?? RADIUS_STEPS_KM[RADIUS_STEPS_KM.length - 1] ?? Infinity;

  filteredSpots = center
    ? nonGeoFiltered.filter((spot) => isSpotInRadius(spot, center, radiusKm))
    : nonGeoFiltered;

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

  if (!tilla) return;

  if (filteredSpots.length === 0) {
    if (typeof tilla.onNoSpotsFound === "function") {
      tilla.onNoSpotsFound();
    }
  } else if (typeof tilla.onSpotsFound === "function") {
    tilla.onSpotsFound();
  }
}

// ------------------------------------------------------
// Marker-Liste & Meta
// ------------------------------------------------------

function isSpotVerified(spot) {
  return !!spot.verified || !!spot.isVerified;
}

function getSpotMetaParts(spot) {
  const parts = [];
  if (spot.category) parts.push(getCategoryLabel(spot.category));
  if (isSpotVerified(spot)) {
    parts.push(currentLang === LANG_DE ? "verifiziert" : "verified");
  }
  if (spot.visit_minutes) {
    parts.push(
      currentLang === LANG_DE
        ? `~${spot.visit_minutes} Min.`
        : `~${spot.visit_minutes} min`
    );
  }
  return parts;
}

function renderSpotList() {
  if (!spotListEl) return;
  spotListEl.innerHTML = "";

  if (!filteredSpots.length) {
    const msg = document.createElement("p");
    msg.className = "filter-group-helper";
    msg.textContent =
      currentLang === LANG_DE
        ? "Aktuell passt kein Spot zu euren Filtern. Probiert einen größeren Radius oder nehmt einen Filter heraus."
        : "Right now no spot matches your filters. Try a wider radius or remove one of the filters.";
    spotListEl.appendChild(msg);
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

    const metaEl = document.createElement("p");
    metaEl.className = "spot-card-meta";

    const metaParts = getSpotMetaParts(spot);
    if (Array.isArray(spot.tags)) {
      metaParts.push(spot.tags.join(", "));
    }
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

    card.addEventListener("click", () => {
      lastSpotTriggerEl = card;
      focusSpotOnMap(spot);
    });

    card.addEventListener(
      "keydown",
      activateOnEnterSpace(() => {
        lastSpotTriggerEl = card;
        focusSpotOnMap(spot);
      })
    );

    spotListEl.appendChild(card);
  });
}

function syncFavButtonState(btn, spotId) {
  const isFav = favorites.has(spotId);
  btn.textContent = isFav ? "★" : "☆";
  btn.setAttribute(
    "aria-label",
    isFav
      ? currentLang === LANG_DE
        ? "Aus Favoriten entfernen"
        : "Remove from favourites"
      : currentLang === LANG_DE
      ? "Zu Favoriten hinzufügen"
      : "Add to favourites"
  );
}

// ------------------------------------------------------
// Detail-Panel
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

function closeSpotDetails(options = {}) {
  const { returnFocus = true } = options;

  if (!spotDetailEl) return;

  spotDetailEl.classList.add("spot-details--hidden");
  spotDetailEl.innerHTML = "";

  if (
    returnFocus &&
    lastSpotTriggerEl &&
    typeof lastSpotTriggerEl.focus === "function"
  ) {
    lastSpotTriggerEl.focus();
  }
}

function showSpotDetails(spot) {
  if (!spotDetailEl) return;

  const spotId = getSpotId(spot);
  const name = getSpotName(spot);
  const subtitle = getSpotSubtitle(spot);
  const metaParts = getSpotMetaParts(spot);
  const tags = Array.isArray(spot.tags) ? spot.tags : [];

  let description = "";
  if (currentLang === LANG_DE) {
    description =
      spot.summary_de || spot.poetry || spot.description || spot.text || "";
  } else {
    description =
      spot.summary_en || spot.poetry || spot.description || spot.text || "";
  }

  const addressParts = [];
  if (spot.address) addressParts.push(spot.address);
  if (spot.postcode) addressParts.push(spot.postcode);
  if (spot.city) addressParts.push(spot.city);
  if (!addressParts.length && subtitle) addressParts.push(subtitle);
  const addressText = addressParts.join(", ");

  spotDetailEl.innerHTML = "";
  spotDetailEl.classList.remove("spot-details--hidden");

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
  closeBtn.textContent = currentLang === LANG_DE ? "Schließen" : "Close";
  closeBtn.addEventListener("click", () => {
    closeSpotDetails({ returnFocus: true });
  });
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

  const tagsEl = document.createElement("div");
  tagsEl.className = "spot-details-tags";
  tags.forEach((tag) => {
    const span = document.createElement("span");
    span.className = "badge";
    span.textContent = tag;
    tagsEl.appendChild(span);
  });

  spotDetailEl.appendChild(headerEl);
  if (metaParts.length) {
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

  const routeUrls = getRouteUrlsForSpot(spot);
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

    spotDetailEl.appendChild(routesEl);
  }

  if (tags.length) {
    spotDetailEl.appendChild(tagsEl);
  }

  if (typeof spotDetailEl.scrollTop === "number") {
    spotDetailEl.scrollTop = 0;
  }
}

// ------------------------------------------------------
// Favoriten
// ------------------------------------------------------

function toggleFavorite(spot) {
  if (!FEATURES.favorites) return;

  const spotId = getSpotId(spot);
  const wasFavorite = favorites.has(spotId);

  if (wasFavorite) {
    favorites.delete(spotId);
  } else {
    favorites.add(spotId);
  }

  saveFavoritesToStorage();

  const toastKey = wasFavorite ? "toast_fav_removed" : "toast_fav_added";
  showToast(toastKey);

  if (tilla) {
    const callbackName = wasFavorite ? "onFavoriteRemoved" : "onFavoriteAdded";
    const callback = tilla[callbackName];
    if (typeof callback === "function") {
      callback.call(tilla);
    }
  }

  renderSpotList();
}

// ------------------------------------------------------
// Kompass
// ------------------------------------------------------

function updateCompassButtonLabel() {
  if (!FEATURES.compass) return;
  if (!btnToggleCompassEl || !compassSectionEl) return;
  const span = btnToggleCompassEl.querySelector("span") || btnToggleCompassEl;
  const isOpen = !!compassSectionEl.open;
  span.textContent = isOpen ? t("btn_hide_compass") : t("btn_show_compass");
  btnToggleCompassEl.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

function updateCompassUI() {
  if (!compassApplyBtnEl) return;

  if (!FEATURES.compass) {
    compassApplyBtnEl.classList.add("hidden");
    return;
  }

  const shouldShow = !!travelMode;
  compassApplyBtnEl.classList.toggle("hidden", !shouldShow);
}

function handleCompassApply() {
  if (!FEATURES.compass) return;
  if (!filterRadiusEl) return;

  radiusStep = travelMode === "everyday" || !travelMode ? 1 : 3;

  filterRadiusEl.value = String(radiusStep);
  updateRadiusTexts();
  applyFiltersAndRender();

  if (tilla && typeof tilla.onCompassApplied === "function") {
    tilla.onCompassApplied({ travelMode, radiusStep });
  }
}

function handleToggleCompass() {
  if (!FEATURES.compass) return;
  if (!compassSectionEl) return;
  compassSectionEl.open = !compassSectionEl.open;
  updateCompassButtonLabel();
  markCompassPlusHintSeenAndRemove();
}

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

function loadDaylogFromStorage() {
  if (!FEATURES.daylog) return;
  if (!daylogTextEl) return;

  try {
    const stored = localStorage.getItem(DAYLOG_STORAGE_KEY);
    if (!stored) return;

    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed.text === "string") {
      daylogTextEl.value = parsed.text;
    }
  } catch (err) {
    console.warn("[Family Spots] Konnte Mein-Tag nicht laden:", err);
  }
}

function handleDaylogSave() {
  if (!FEATURES.daylog) return;
  if (!daylogTextEl) return;
  const text = daylogTextEl.value.trim();
  if (!text) return;

  const payload = {
    text,
    ts: Date.now()
  };

  try {
    localStorage.setItem(DAYLOG_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("[Family Spots] Konnte Mein-Tag nicht speichern:", err);
  }

  showToast("daylog_saved");
  if (tilla && typeof tilla.onDaylogSaved === "function") {
    tilla.onDaylogSaved();
  }
}

// ------------------------------------------------------
// Geolocation
// ------------------------------------------------------

function handleLocateClick() {
  if (!navigator.geolocation || !map) {
    showToast("toast_location_error");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 13);
      showToast("toast_location_ok");
    },
    () => {
      showToast("toast_location_error");
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

// ------------------------------------------------------
// Filter-Umschalter & View-Toggle
// ------------------------------------------------------

function handleToggleFilters() {
  if (!btnToggleFiltersEl || !filterBodyEls.length) return;

  filtersCollapsed = !filtersCollapsed;
  const isExpanded = !filtersCollapsed;

  filterBodyEls.forEach((el) => {
    el.classList.toggle("hidden", filtersCollapsed);
  });

  const span = btnToggleFiltersEl.querySelector("span");
  if (span) {
    span.textContent = filtersCollapsed
      ? t("btn_show_filters")
      : t("btn_hide_filters");
  }

  btnToggleFiltersEl.setAttribute(
    "aria-expanded",
    isExpanded ? "true" : "false"
  );
}

function handleToggleView() {
  if (!sidebarEl || !btnToggleViewEl) return;
  const isHidden = sidebarEl.classList.toggle("hidden");
  const span = btnToggleViewEl.querySelector("span");
  if (span) {
    span.textContent = isHidden ? t("btn_show_list") : t("btn_only_map");
  }

  btnToggleViewEl.setAttribute("aria-pressed", isHidden ? "true" : "false");

  if (map) {
    window.setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }
}

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
    daylogSaveEl = document.getElementById("daylog-save");

    toastEl = document.getElementById("toast");

    compassSectionEl = document.getElementById("compass-section");
    compassLabelEl = document.getElementById("compass-label");
    compassHelperEl = document.getElementById("compass-helper");
    compassApplyLabelEl = document.getElementById("compass-apply-label");
    compassApplyBtnEl = document.getElementById("compass-apply");
    btnToggleCompassEl = document.getElementById("btn-toggle-compass");

    if (btnToggleFiltersEl && filterSectionEl && filterSectionEl.id) {
      btnToggleFiltersEl.setAttribute("aria-controls", filterSectionEl.id);
      btnToggleFiltersEl.setAttribute("aria-expanded", "false");
    }

    if (
      FEATURES.compass &&
      btnToggleCompassEl &&
      compassSectionEl &&
      compassSectionEl.id
    ) {
      btnToggleCompassEl.setAttribute("aria-controls", compassSectionEl.id);
      btnToggleCompassEl.setAttribute(
        "aria-expanded",
        compassSectionEl.open ? "true" : "false"
      );
    }

    const initialLang = getInitialLang();
    setLanguage(initialLang, { initial: true });

    const initialTheme = getInitialTheme();
    currentTheme = applyTheme(initialTheme);

    // Toast-System initialisieren
    initToast({ element: toastEl, t });

    const mapResult = initMap({
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM
    });
    map = mapResult.map;
    markersLayer = mapResult.markersLayer;

    if (map) {
      if (spotDetailEl) {
        map.on("click", () => {
          closeSpotDetails({ returnFocus: true });
        });
      }

      map.on(
        "moveend zoomend",
        debounce(() => {
          applyFiltersAndRender();
        }, 200)
      );

      window.addEventListener(
        "resize",
        debounce(() => {
          map.invalidateSize();
        }, 200)
      );
    }

    tilla = new TillaCompanion({
      getText: (key) => t(key)
    });

    if (languageSwitcherEl) {
      languageSwitcherEl.addEventListener("click", () => {
        const nextLang = currentLang === LANG_DE ? LANG_EN : LANG_DE;
        setLanguage(nextLang);
      });
    }

    if (themeToggleEl) {
      themeToggleEl.addEventListener("click", () => {
        const nextTheme =
          currentTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT;
        currentTheme = applyTheme(nextTheme);
      });
    }

    if (btnLocateEl) {
      btnLocateEl.addEventListener("click", handleLocateClick);
    }

    // Router initialisieren (Map <-> About)
    initRouter({
      viewMapEl,
      viewAboutEl,
      bottomNavButtons,
      btnHelpEl,
      getCurrentLang: () => currentLang
    });

    if (filterSearchEl) {
      const applySearch = debounce((value) => {
        searchTerm = value.trim();
        applyFiltersAndRender();
      }, 200);

      filterSearchEl.addEventListener("input", (e) => {
        applySearch(e.target.value);
      });
    }

    if (filterCategoryEl) {
      filterCategoryEl.addEventListener("change", (e) => {
        categoryFilter = e.target.value;
        applyFiltersAndRender();
      });
    }

    if (filterAgeEl) {
      filterAgeEl.addEventListener("change", (e) => {
        ageFilter = e.target.value;
        applyFiltersAndRender();
      });
    }

    if (filterRadiusEl) {
      initRadiusSliderA11y();
    }

    if (filterBigEl) {
      filterBigEl.addEventListener("change", (e) => {
        onlyBigAdventures = e.target.checked;
        applyFiltersAndRender();
      });
    }

    if (filterVerifiedEl) {
      filterVerifiedEl.addEventListener("change", (e) => {
        onlyVerified = e.target.checked;
        applyFiltersAndRender();
      });
    }

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
            if (tilla && typeof tilla.setTravelMode === "function") {
              tilla.setTravelMode(null);
            }
          } else {
            travelMode = mode;
            document.querySelectorAll(".travel-chip").forEach((c) => {
              const isActive = c === chip;
              c.classList.toggle("travel-chip--active", isActive);
              c.setAttribute("aria-pressed", isActive ? "true" : "false");
            });
            if (tilla && typeof tilla.setTravelMode === "function") {
              tilla.setTravelMode(mode);
            }
          }

          updateCompassUI();
          applyFiltersAndRender();
        });
      });
    }

    if (btnToggleFiltersEl) {
      btnToggleFiltersEl.addEventListener("click", handleToggleFilters);
      const span = btnToggleFiltersEl.querySelector("span");
      if (span) span.textContent = t("btn_show_filters");
    }

    if (btnToggleViewEl) {
      btnToggleViewEl.addEventListener("click", handleToggleView);
      const span = btnToggleViewEl.querySelector("span");
      if (span) span.textContent = t("btn_only_map");
      btnToggleViewEl.setAttribute("aria-pressed", "false");
    }

    if (FEATURES.compass && btnToggleCompassEl && compassSectionEl) {
      const toggleCompassHandler = (event) => {
        event.preventDefault();
        event.stopPropagation();
        handleToggleCompass();
      };

      btnToggleCompassEl.addEventListener("click", toggleCompassHandler);
      btnToggleCompassEl.addEventListener(
        "keydown",
        activateOnEnterSpace(toggleCompassHandler)
      );

      compassSectionEl.addEventListener("toggle", () => {
        updateCompassButtonLabel();
      });

      updateCompassButtonLabel();
    }

    if (plusSectionEl && btnTogglePlusEl) {
      plusSectionEl.id = plusSectionEl.id || "plus-section";
      btnTogglePlusEl.setAttribute("aria-controls", plusSectionEl.id);

      const togglePlusHandler = (event) => {
        event.preventDefault();
        const isOpen = !plusSectionEl.open;
        plusSectionEl.open = isOpen;
        updateGenericSectionToggleLabel(btnTogglePlusEl, isOpen);
        markCompassPlusHintSeenAndRemove();
      };

      btnTogglePlusEl.addEventListener("click", togglePlusHandler);
      btnTogglePlusEl.addEventListener(
        "keydown",
        activateOnEnterSpace(togglePlusHandler)
      );

      plusSectionEl.addEventListener("toggle", () => {
        updateGenericSectionToggleLabel(btnTogglePlusEl, plusSectionEl.open);
      });

      updateGenericSectionToggleLabel(btnTogglePlusEl, !!plusSectionEl.open);
    }

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

    if (FEATURES.daylog && daylogSaveEl) {
      daylogSaveEl.addEventListener("click", handleDaylogSave);
    }

    if (FEATURES.compass && compassApplyBtnEl) {
      compassApplyBtnEl.addEventListener("click", handleCompassApply);
    }

    if (FEATURES.playIdeas && playIdeasBtnEl) {
      playIdeasBtnEl.addEventListener("click", () => {
        const idea = getRandomPlayIdea();
        if (!idea) return;

        if (tilla && typeof tilla.showPlayIdea === "function") {
          tilla.showPlayIdea(idea);

          const tillaCard = document.querySelector(".tilla-sidebar-card");
          if (tillaCard && typeof tillaCard.scrollIntoView === "function") {
            tillaCard.scrollIntoView({
              behavior: "smooth",
              block: "nearest"
            });
          }
        } else {
          showToast(idea);
        }
      });
    }

    document.querySelectorAll(".sidebar-section-close").forEach((btn) => {
      const targetId = btn.getAttribute("data-target");
      let section = null;
      if (targetId) section = document.getElementById(targetId);
      if (!section) section = btn.closest(".sidebar-section");
      if (!section) return;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const tag = section.tagName.toLowerCase();
        if (tag === "details") {
          section.open = false;
        } else {
          section.classList.add("hidden");
        }

        if (section.id === "compass-section" && btnToggleCompassEl) {
          updateCompassButtonLabel();
        }

        if (section.id === "plus-section" && btnTogglePlusEl) {
          updateGenericSectionToggleLabel(btnTogglePlusEl, false);
        }

        if (section.id === "daylog-section" && btnToggleDaylogEl) {
          updateGenericSectionToggleLabel(btnToggleDaylogEl, false);
        }
      });
    });

    updateCompassUI();
    loadPlusStateFromStorage();
    loadDaylogFromStorage();
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