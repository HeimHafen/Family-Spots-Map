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

// zusätzliche Sprache (nicht aus config.js importiert)
const LANG_DA = "da";

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
 */

// ------------------------------------------------------
// I18N / Text-Helfer
// ------------------------------------------------------

/** Übersetzungs-Helper (fällt zur Not auf Key zurück) */
const t = (key) =>
  typeof I18N !== "undefined" && typeof I18N.t === "function"
    ? I18N.t(key)
    : key;

/** Spielideen aus I18N abholen – mit statischem Fallback */
function getRandomPlayIdea() {
  // 1. Wenn I18N eigene Ideen liefert, diese bevorzugen
  if (
    typeof I18N !== "undefined" &&
    typeof I18N.getRandomPlayIdea === "function"
  ) {
    const ideaFromI18n = I18N.getRandomPlayIdea();
    if (ideaFromI18n) return ideaFromI18n;
  }

  // 2. Statische Fallback-Ideen je Sprache
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

  const langKey =
    currentLang === LANG_EN ? "en" : currentLang === LANG_DA ? "da" : "de";
  const list = FALLBACK_PLAY_IDEAS[langKey] || FALLBACK_PLAY_IDEAS.de;

  if (!Array.isArray(list) || list.length === 0) {
    return "";
  }

  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

/** Sprache aus LocalStorage / Browser / I18N ableiten */
function getInitialLang() {
  try {
    const stored = localStorage.getItem("fs_lang");
    if (
      stored === LANG_DE ||
      stored === LANG_EN ||
      stored === LANG_DA
    ) {
      return stored;
    }
  } catch {
    // ignore
  }

  if (
    typeof I18N !== "undefined" &&
    typeof I18N.getLanguage === "function"
  ) {
    const fromI18n = I18N.getLanguage();
    if (
      fromI18n === LANG_DE ||
      fromI18n === LANG_EN ||
      fromI18n === LANG_DA
    ) {
      return fromI18n;
    }
  }

  const htmlLang =
    (document.documentElement.lang || navigator.language || LANG_DE)
      .toLowerCase()
      .slice(0, 2);

  if (htmlLang === "en") return LANG_EN;
  if (htmlLang === "da" || htmlLang === "dk") return LANG_DA;
  return LANG_DE;
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
/** Mein Tag – gespeicherte Einträge */
let daylogEntries = [];

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
let spotsSectionEl;
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
let daylogLastSavedEl;
let daylogClearEl;
let daylogListEl;
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

// Filtermodal
let btnOpenFilterModalEl;
let filterModalEl;
let filterModalCloseEl;
let filterModalApplyEl;
let filterModalResetEl;
let filterSummaryEl;

// State für Filtermodal
let isFilterModalOpen = false;
let lastFocusBeforeFilterModal = null;

// Skip-Link (Zum Hauptinhalt springen)
let skipLinkEl;

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

/**
 * Statisches Fallback-i18n über data-i18n-de / -en / -da
 * (z. B. für Tilla-Text im HTML)
 */
function applyStaticI18n() {
  document.querySelectorAll("[data-i18n-de]").forEach((el) => {
    let attrName;
    if (currentLang === LANG_EN) {
      attrName = "data-i18n-en";
    } else if (currentLang === LANG_DA) {
      attrName = "data-i18n-da";
    } else {
      attrName = "data-i18n-de";
    }

    let text = el.getAttribute(attrName);
    if (!text) {
      // Fallback: erst de, dann en
      text = el.getAttribute("data-i18n-de") || el.getAttribute("data-i18n-en");
    }
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

  let langMap;
  let fallbackMap;

  if (currentLang === LANG_EN) {
    langMap = CATEGORY_LABELS_EN;
    fallbackMap = CATEGORY_LABELS_DE;
  } else if (currentLang === LANG_DA) {
    langMap = CATEGORY_LABELS_DA;
    fallbackMap = CATEGORY_LABELS_DE;
  } else {
    // Standard: Deutsch
    langMap = CATEGORY_LABELS_DE;
    fallbackMap = CATEGORY_LABELS_EN;
  }

  return (
    (langMap && langMap[slug]) ||
    (fallbackMap && fallbackMap[slug]) ||
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
    const suffix = " · Plus";
    return base + suffix;
  }

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

/**
 * Sprach-Badge (Flagge) aktualisieren
 */
function updateLanguageSwitcherVisual() {
  if (!languageSwitcherEl) return;

  if (languageSwitcherFlagEl) {
    let src = "assets/flags/flag-de.svg";
    let alt = "Deutsch";

    if (currentLang === LANG_EN) {
      src = "assets/flags/flag-gb.svg";
      alt = "English";
    } else if (currentLang === LANG_DA) {
      src = "assets/flags/flag-dk.svg";
      alt = "Dansk";
    }

    languageSwitcherFlagEl.src = src;
    languageSwitcherFlagEl.alt = alt;
  } else {
    // Fallback: falls das Bild fehlt, zeige Kürzel als Text
    let label = "DE";
    if (currentLang === LANG_EN) label = "EN";
    else if (currentLang === LANG_DA) label = "DA";
    languageSwitcherEl.textContent = label;
  }

  // Aria-Label aktualisieren
  let ariaLabel;
  if (currentLang === LANG_DE) {
    ariaLabel = "Sprache: Deutsch (Tippen für Dansk)";
  } else if (currentLang === LANG_DA) {
    ariaLabel = "Sprog: Dansk (tryk for English)";
  } else {
    ariaLabel = "Language: English (tap for Deutsch)";
  }
  languageSwitcherEl.setAttribute("aria-label", ariaLabel);
}

function updateGenericSectionToggleLabel(btn, isOpen) {
  if (!btn) return;
  const target = btn.querySelector("span") || btn;
  const isDeLike = currentLang === LANG_DE || currentLang === LANG_DA;
  const showLabel = isDeLike ? "Anzeigen" : "Show";
  const hideLabel = isDeLike ? "Ausblenden" : "Hide";
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
// Onboarding-Hint (Kompass / Plus / Spots)
// ------------------------------------------------------

// Gemeinsame Textquelle für Titel + Schritte
function getCompassPlusHintParts(lang = currentLang) {
  if (lang === LANG_EN) {
    return {
      title: "How to find today’s spot",
      steps: [
        "Share your location or zoom into your region",
        "Pick a mood",
        "Tap a spot – off you go."
      ]
    };
  }
  if (lang === LANG_DA) {
    return {
      title: "Sådan finder I dagens spot",
      steps: [
        "Del jeres placering eller zoom ind på jeres område",
        "Vælg stemning",
        "Tryk på et spot – så er I i gang."
      ]
    };
  }
  // Standard: Deutsch
  return {
    title: "So holt ihr euch euren Spot für heute",
    steps: [
      "Standort freigeben oder in eure Region zoomen",
      "Stimmung wählen",
      "Auf einen Spot tippen – los geht’s."
    ]
  };
}

// Text-Helper im Einzeilen-Format (wird sonst nicht angezeigt, bleibt aber verfügbar)
function getCompassPlusHintText(lang = currentLang) {
  const { title, steps } = getCompassPlusHintParts(lang);
  return `${title}: ${steps.join(" · ")}`;
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

  const { title, steps } = getCompassPlusHintParts();

  if (!compassPlusHintEl) {
    const wrapper = document.createElement("div");
    wrapper.id = "compass-plus-hint";
    wrapper.className = "fsm-onboarding-hint";

    // Titel
    const titleEl = document.createElement("p");
    titleEl.className = "fsm-onboarding-hint__title";
    titleEl.textContent = title;

    // nummerierte Liste 1./2./3. untereinander
    const listEl = document.createElement("ol");
    listEl.className = "fsm-onboarding-hint__list";
    steps.forEach((stepText) => {
      const li = document.createElement("li");
      li.textContent = stepText;
      listEl.appendChild(li);
    });

    // Close-Button (x)
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "fsm-onboarding-hint__close";

    let ariaLabel;
    if (currentLang === LANG_EN) {
      ariaLabel = "Hide hint";
    } else if (currentLang === LANG_DA) {
      ariaLabel = "Luk tip";
    } else {
      ariaLabel = "Hinweis schließen";
    }
    closeBtn.setAttribute("aria-label", ariaLabel);
    closeBtn.textContent = "×";

    closeBtn.addEventListener("click", () => {
      markCompassPlusHintSeenAndRemove();
    });

    wrapper.appendChild(titleEl);
    wrapper.appendChild(listEl);
    wrapper.appendChild(closeBtn);

    // Zwischen Filter-Section und Spots-Section platzieren
    let anchor = null;
    if (spotsSectionEl && spotsSectionEl.parentNode === sidebarEl) {
      anchor = spotsSectionEl;
    } else if (plusSectionEl && plusSectionEl.parentNode === sidebarEl) {
      anchor = plusSectionEl;
    } else if (daylogSectionEl && daylogSectionEl.parentNode === sidebarEl) {
      anchor = daylogSectionEl;
    } else if (compassSectionEl && compassSectionEl.parentNode === sidebarEl) {
      anchor = compassSectionEl;
    } else {
      anchor = sidebarEl.firstChild;
    }

    if (anchor) {
      sidebarEl.insertBefore(wrapper, anchor);
    } else {
      sidebarEl.appendChild(wrapper);
    }

    compassPlusHintEl = wrapper;
  } else {
    // Sprache hat sich geändert → Texte aktualisieren
    const updated = getCompassPlusHintParts();
    const titleEl = compassPlusHintEl.querySelector(
      ".fsm-onboarding-hint__title"
    );
    const listEl = compassPlusHintEl.querySelector(
      ".fsm-onboarding-hint__list"
    );

    if (titleEl) {
      titleEl.textContent = updated.title;
    }
    if (listEl) {
      while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
      updated.steps.forEach((stepText) => {
        const li = document.createElement("li");
        li.textContent = stepText;
        listEl.appendChild(li);
      });
    }

    const closeBtn = compassPlusHintEl.querySelector(
      ".fsm-onboarding-hint__close"
    );
    if (closeBtn) {
      let ariaLabel;
      if (currentLang === LANG_EN) {
        ariaLabel = "Hide hint";
      } else if (currentLang === LANG_DA) {
        ariaLabel = "Luk tip";
      } else {
        ariaLabel = "Hinweis schließen";
      }
      closeBtn.setAttribute("aria-label", ariaLabel);
    }
  }
}

/**
 * Setzt Sprache, aktualisiert UI & speichert in localStorage.
 */
function setLanguage(lang, { initial = false } = {}) {
  currentLang =
    lang === LANG_EN ? LANG_EN : lang === LANG_DA ? LANG_DA : LANG_DE;

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
      let i18nLang = LANG_DE;
      if (currentLang === LANG_EN) i18nLang = LANG_EN;
      else if (currentLang === LANG_DA) i18nLang = "da";
      I18N.setLanguage(i18nLang);
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
  const aboutDa = document.getElementById("page-about-da");
  const aboutEn = document.getElementById("page-about-en");

  if (aboutDe && aboutEn && aboutDa) {
    const langCode = currentLang;

    const showDe = langCode === LANG_DE;
    const showDa = langCode === LANG_DA;
    const showEn = langCode === LANG_EN;

    aboutDe.classList.toggle("hidden", !showDe);
    aboutDe.setAttribute("aria-hidden", showDe ? "false" : "true");

    aboutDa.classList.toggle("hidden", !showDa);
    aboutDa.setAttribute("aria-hidden", showDa ? "false" : "true");

    aboutEn.classList.toggle("hidden", !showEn);
    aboutEn.setAttribute("aria-hidden", showEn ? "false" : "true");
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
      currentLang === LANG_EN
        ? "Place, spot, keywords …"
        : currentLang === LANG_DA
        ? "Sted, spot, søgeord …"
        : "Ort, Spot, Stichwörter …";
  }

  if (daylogTextEl && FEATURES.daylog) {
    daylogTextEl.placeholder =
      currentLang === LANG_EN
        ? "Today we went to the wildlife park – the goats were sooo cute!"
        : currentLang === LANG_DA
        ? "I dag var vi i dyreparken – gederne var såå søde!"
        : "Heute waren wir im Wildpark – die Ziegen waren sooo süß!";
  }

  if (FEATURES.daylog) {
    updateDaylogUI();
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
  updateFilterSummary();

  document.querySelectorAll(".sidebar-section-close").forEach((btn) => {
    btn.textContent =
      currentLang === LANG_EN
        ? "Close"
        : currentLang === LANG_DA
        ? "Luk"
        : "Schließen";
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
    currentLang === LANG_EN
      ? "Spots could not be loaded. Please check your connection and try again."
      : currentLang === LANG_DA
      ? "Spots kunne ikke indlæses. Tjek venligst forbindelsen og prøv igen."
      : "Die Spots konnten nicht geladen werden. Prüfe deine Verbindung und versuche es erneut.";
  spotListEl.appendChild(msg);

  const retryBtn = document.createElement("button");
  retryBtn.type = "button";
  retryBtn.className = "btn btn-small";
  retryBtn.textContent =
    currentLang === LANG_EN
      ? "Try again"
      : currentLang === LANG_DA
      ? "Prøv igen"
      : "Erneut versuchen";

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

  spotListEl.appendChild(retryBtn);
}

async function loadSpots() {
  try {
    const result = await loadData();
    const rawSpots = Array.isArray(result.spots) ? result.spots : [];

    spots = rawSpots.map(normalizeSpot);

    console.log("[Family Spots] loadSpots:", { total: spots.length });

    loadFavoritesFromStorage();
    populateCategoryOptions();

    if (tagFilterContainerEl) {
      renderTagFilterChips();
    }

    if (result.fromCache) {
      showToast(
        currentLang === LANG_EN
          ? "Loaded offline data."
          : currentLang === LANG_DA
          ? "Indlæste offline-data."
          : "Offline-Daten geladen."
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
            currentLang === LANG_DE
              ? "de"
              : currentLang === LANG_DA
              ? "da"
              : "en"
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
// Kompakte Filter-Zusammenfassung (unter Basis-Filtern)
// ------------------------------------------------------

function getMoodLabelForSummary() {
  if (!moodFilter) return "";

  if (currentLang === LANG_EN) {
    if (moodFilter === "relaxed") return "Relaxed";
    if (moodFilter === "action") return "Active";
    if (moodFilter === "water") return "Water & sand";
    if (moodFilter === "animals") return "Animal day";
  } else if (currentLang === LANG_DA) {
    if (moodFilter === "relaxed") return "Afslappet";
    if (moodFilter === "action") return "Aktiv";
    if (moodFilter === "water") return "Vand & sand";
    if (moodFilter === "animals") return "Dyredag";
  } else {
    if (moodFilter === "relaxed") return "Entspannt";
    if (moodFilter === "action") return "Bewegung";
    if (moodFilter === "water") return "Wasser & Sand";
    if (moodFilter === "animals") return "Tier-Tag";
  }
  return "";
}

function updateFilterSummary() {
  if (!filterSummaryEl) return;

  const parts = [];
  const maxRadiusIndex = RADIUS_STEPS_KM.length - 1;

  // Suche
  if (searchTerm) {
    if (currentLang === LANG_EN) {
      parts.push(`Search: “${searchTerm}”`);
    } else if (currentLang === LANG_DA) {
      parts.push(`Søgning: “${searchTerm}”`);
    } else {
      parts.push(`Suche: „${searchTerm}“`);
    }
  }

  // Stimmung
  const moodLabel = getMoodLabelForSummary();
  if (moodLabel) {
    if (currentLang === LANG_EN) {
      parts.push(`Mood: ${moodLabel}`);
    } else if (currentLang === LANG_DA) {
      parts.push(`Stemning: ${moodLabel}`);
    } else {
      parts.push(`Stimmung: ${moodLabel}`);
    }
  }

  // Radius
  if (radiusStep !== maxRadiusIndex) {
    const km = RADIUS_STEPS_KM[radiusStep];
    if (currentLang === LANG_EN) {
      parts.push(`Radius: ${km} km`);
    } else if (currentLang === LANG_DA) {
      parts.push(`Radius: ${km} km`);
    } else {
      parts.push(`Radius: ${km} km`);
    }
  }

  // Kategorie
  if (categoryFilter && filterCategoryEl) {
    const selected = filterCategoryEl.selectedOptions[0];
    const label =
      (selected && selected.textContent.trim()) ||
      getCategoryLabel(categoryFilter);
    if (label) {
      if (currentLang === LANG_EN) {
        parts.push(`Category: ${label}`);
      } else if (currentLang === LANG_DA) {
        parts.push(`Kategori: ${label}`);
      } else {
        parts.push(`Kategorie: ${label}`);
      }
    }
  }

  // Alter
  if (ageFilter !== "all" && filterAgeEl) {
    const selected = filterAgeEl.selectedOptions[0];
    const label = selected ? selected.textContent.trim() : ageFilter;
    if (currentLang === LANG_EN) {
      parts.push(`Age: ${label}`);
    } else if (currentLang === LANG_DA) {
      parts.push(`Alder: ${label}`);
    } else {
      parts.push(`Alter: ${label}`);
    }
  }

  // Schnellfilter (Tag-Filter)
  if (activeTagFilters && activeTagFilters.size > 0) {
    const count = activeTagFilters.size;
    if (currentLang === LANG_EN) {
      parts.push(`Quick filters (${count})`);
    } else if (currentLang === LANG_DA) {
      parts.push(`Hurtigfiltre (${count})`);
    } else {
      parts.push(`Schnellfilter (${count})`);
    }
  }

  // Nur verifizierte
  if (onlyVerified) {
    if (currentLang === LANG_EN) {
      parts.push("Only verified spots");
    } else if (currentLang === LANG_DA) {
      parts.push("Kun verificerede spots");
    } else {
      parts.push("Nur verifizierte Spots");
    }
  }

  // Nur Favoriten
  if (onlyFavorites) {
    if (currentLang === LANG_EN) {
      parts.push("Favourites only");
    } else if (currentLang === LANG_DA) {
      parts.push("Kun favoritter");
    } else {
      parts.push("Nur Favoriten");
    }
  }

  // Große Abenteuer
  if (onlyBigAdventures) {
    if (currentLang === LANG_EN) {
      parts.push("Big adventures");
    } else if (currentLang === LANG_DA) {
      parts.push("Store eventyr");
    } else {
      parts.push("Große Abenteuer");
    }
  }

  let text;
  if (!parts.length) {
    if (currentLang === LANG_EN) {
      text = "Active filters: basic filters";
    } else if (currentLang === LANG_DA) {
      text = "Aktive filtre: basisfiltre";
    } else {
      text = "Aktive Filter: Basisfilter";
    }
  } else {
    const prefix =
      currentLang === LANG_EN
        ? "Active filters: "
        : currentLang === LANG_DA
        ? "Aktive filtre: "
        : "Aktive Filter: ";
    text = prefix + parts.join(" · ");
  }

  filterSummaryEl.textContent = text;
}

// ------------------------------------------------------
// Strukturierter Filter-Kontext (für Tilla / AI-Hooks)
// ------------------------------------------------------

function getFilterContext() {
  // aktuelle Radius-Kilometer (oder Infinity)
  const maxIndex = RADIUS_STEPS_KM.length - 1;
  const radiusKm =
    radiusStep >= 0 && radiusStep <= maxIndex
      ? RADIUS_STEPS_KM[radiusStep]
      : RADIUS_STEPS_KM[maxIndex];

  // Map-Center, falls vorhanden
  let centerLat = null;
  let centerLng = null;
  if (map && typeof map.getCenter === "function") {
    const center = map.getCenter();
    centerLat = center.lat;
    centerLng = center.lng;
  }

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
    center: centerLat != null && centerLng != null
      ? { lat: centerLat, lng: centerLng }
      : null
  };
}

// ------------------------------------------------------
// Filter-Modal öffnen / schließen / zurücksetzen
// ------------------------------------------------------

function openFilterModal() {
  if (!filterModalEl) return;
  isFilterModalOpen = true;
  lastFocusBeforeFilterModal = document.activeElement;
  filterModalEl.hidden = false;

  // Body-Scroll sperren, solange das Modal geöffnet ist
  if (document && document.body) {
    document.body.setAttribute("data-filter-modal-open", "1");
  }

  const focusable = filterModalEl.querySelector(
    "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
  );
  if (focusable && typeof focusable.focus === "function") {
    focusable.focus();
  }
}

function closeFilterModal(options = {}) {
  if (!filterModalEl) return;
  if (!isFilterModalOpen) return;

  const { returnFocus = true } = options;

  isFilterModalOpen = false;
  filterModalEl.hidden = true;

  // Body-Scroll wieder freigeben
  if (document && document.body) {
    document.body.removeAttribute("data-filter-modal-open");
  }

  if (
    returnFocus &&
    lastFocusBeforeFilterModal &&
    typeof lastFocusBeforeFilterModal.focus === "function"
  ) {
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

  // Radius auf Maximum (alle Spots)
  radiusStep = RADIUS_STEPS_KM.length - 1;

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

  // Mood-Chips zurücksetzen
  document.querySelectorAll(".mood-chip").forEach((chip) => {
    chip.classList.remove("mood-chip--active");
    chip.setAttribute("aria-pressed", "false");
  });

  // Travel-Mode-Chips zurücksetzen
  document.querySelectorAll(".travel-chip").forEach((chip) => {
    chip.classList.remove("travel-chip--active");
    chip.setAttribute("aria-pressed", "false");
  });

  if (tilla && typeof tilla.setTravelMode === "function") {
    tilla.setTravelMode(null);
  }

  // Tag-Filter-Chips neu zeichnen
  if (tagFilterContainerEl) {
    renderTagFilterChips();
  }

  updateCompassUI();
  applyFiltersAndRender();
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

    updateFilterSummary();

    // Kontext auch im "keine Spots"-Fall für Tilla bereitstellen
    if (tilla && typeof tilla.onFiltersUpdated === "function") {
      tilla.onFiltersUpdated({
        totalSpots: spots.length,
        filteredSpotsCount: filteredSpots.length,
        filters: getFilterContext()
      });
    }

    return;
  }

  console.log("[Family Spots] applyFiltersAndRender BEFORE radius:", {
    plusActive,
    radiusStep,
    searchTerm,
    categoryFilter,
    ageFilter,
    moodFilter,
    travelMode,
    onlyBigAdventures,
    onlyVerified,
    onlyFavorites,
    activeTagFilters: Array.from(activeTagFilters)
  });

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
    RADIUS_STEPS_KM[radiusStep] ??
    RADIUS_STEPS_KM[RADIUS_STEPS_KM.length - 1] ??
    Infinity;

  filteredSpots = center
    ? nonGeoFiltered.filter((spot) => isSpotInRadius(spot, center, radiusKm))
    : nonGeoFiltered;

  console.log("[Family Spots] applyFiltersAndRender AFTER radius:", {
    totalSpots: spots.length,
    afterNonGeo: nonGeoFiltered.length,
    afterRadius: filteredSpots.length
  });

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

  if (!tilla) return;

  if (filteredSpots.length === 0) {
    if (typeof tilla.onNoSpotsFound === "function") {
      tilla.onNoSpotsFound();
    }
  } else if (typeof tilla.onSpotsFound === "function") {
    tilla.onSpotsFound();
  }

  // NEU: Tilla bekommt immer den aktuellen Filter-/Kartenkontext
  if (typeof tilla.onFiltersUpdated === "function") {
    tilla.onFiltersUpdated({
      totalSpots: spots.length,
      filteredSpotsCount: filteredSpots.length,
      filters: getFilterContext()
    });
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
    parts.push(
      currentLang === LANG_EN
        ? "verified"
        : currentLang === LANG_DA
        ? "verificeret"
        : "verifiziert"
    );
  }
  if (spot.visit_minutes) {
    parts.push(
      currentLang === LANG_EN
        ? `~${spot.visit_minutes} min`
        : currentLang === LANG_DA
        ? `~${spot.visit_minutes} min`
        : `~${spot.visit_minutes} Min.`
    );
  }
  return parts;
}

function renderSpotList() {
  if (!spotListEl) return;
  spotListEl.innerHTML = "";

  // Neuer, reichhaltiger Empty State
  if (!filteredSpots.length) {
    const wrapper = document.createElement("div");
    wrapper.className = "empty-state";

    const titleEl = document.createElement("h3");
    titleEl.className = "empty-state-title";

    const textEl = document.createElement("p");
    textEl.className = "empty-state-text";

    const actionsEl = document.createElement("div");
    actionsEl.className = "empty-state-actions";

    // Texte nach Sprache
    if (currentLang === LANG_EN) {
      titleEl.textContent = "No spots for your selection right now";
      textEl.textContent =
        "Your radius might be too small or there are many filters active. Try one of these options:";
    } else if (currentLang === LANG_DA) {
      titleEl.textContent = "Ingen spots til jeres valg lige nu";
      textEl.textContent =
        "Måske er radius for lille, eller der er mange filtre slået til. Prøv en af disse muligheder:";
    } else {
      titleEl.textContent = "Gerade keine Spots für eure Auswahl";
      textEl.textContent =
        "Vielleicht ist euer Radius zu klein oder es sind viele Filter aktiv. Ihr könnt es so versuchen:";
    }

    // Button: Radius vergrößern
    const btnRadius = document.createElement("button");
    btnRadius.type = "button";
    btnRadius.className = "btn btn-small";

    if (currentLang === LANG_EN) {
      btnRadius.textContent = "Increase radius";
    } else if (currentLang === LANG_DA) {
      btnRadius.textContent = "Større radius";
    } else {
      btnRadius.textContent = "Radius vergrößern";
    }

    btnRadius.addEventListener("click", () => {
      if (!filterRadiusEl) return;

      const maxIndex = RADIUS_STEPS_KM.length - 1;
      let value = parseInt(filterRadiusEl.value, 10);
      if (Number.isNaN(value)) value = radiusStep;

      if (value < maxIndex) {
        radiusStep = value + 1;
        filterRadiusEl.value = String(radiusStep);
        updateRadiusTexts();
        applyFiltersAndRender();
      }
    });

    // Button: Filter zurücksetzen
    const btnReset = document.createElement("button");
    btnReset.type = "button";
    btnReset.className = "btn btn-small btn-secondary";

    if (currentLang === LANG_EN) {
      btnReset.textContent = "Reset all filters";
    } else if (currentLang === LANG_DA) {
      btnReset.textContent = "Nulstil alle filtre";
    } else {
      btnReset.textContent = "Alle Filter zurücksetzen";
    }

    btnReset.addEventListener("click", () => {
      resetAllFilters();
    });

    actionsEl.appendChild(btnRadius);
    actionsEl.appendChild(btnReset);

    wrapper.appendChild(titleEl);
    wrapper.appendChild(textEl);
    wrapper.appendChild(actionsEl);

    spotListEl.appendChild(wrapper);
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
  if (currentLang === LANG_EN) {
    description =
      spot.summary_en || spot.poetry || spot.description || spot.text || "";
  } else if (currentLang === LANG_DA) {
    description =
      spot.summary_da ||
      spot.summary_de ||
      spot.poetry ||
      spot.description ||
      spot.text ||
      "";
  } else {
    description =
      spot.summary_de || spot.poetry || spot.description || spot.text || "";
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
  closeBtn.textContent =
    currentLang === LANG_EN
      ? "Close"
      : currentLang === LANG_DA
      ? "Luk"
      : "Schließen";
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

/**
 * Lädt den aktuellen Plus-Status aus dem Storage (bzw. aus features/plus)
 * und synchronisiert ihn mit dem lokalen State (plusActive) und der UI.
 *
 * Der Dev-Override (DEV_FORCE_PLUS) wird im Modul features/plus.js
 * berücksichtigt und spiegelt sich in getPlusStatus() wider.
 */
function loadPlusStateFromStorage(options = {}) {
  const { reapplyFilters = false } = options;

  if (!FEATURES.plus) {
    plusActive = false;

    updatePlusStatusText({
      active: false,
      plan: null,
      validUntil: null,
      addons: null,
      partner: null,
      source: null
    });

    if (reapplyFilters && spots.length) {
      applyFiltersAndRender();
    }
    return;
  }

  const status = getPlusStatus();
  plusActive = !!status.active;

  updatePlusStatusText(status);

  console.log("[Family Spots] Plus status loaded:", {
    plusActive,
    status
  });

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

/**
 * Formatiert einen Zeitstempel für Mein Tag abhängig von der aktuellen Sprache.
 * @param {number} ts
 * @returns {string}
 */
function formatDaylogTimestamp(ts) {
  try {
    const date = new Date(ts);
    const locale =
      currentLang === LANG_EN
        ? "en-GB"
        : currentLang === LANG_DA
        ? "da-DK"
        : "de-DE";
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    };
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch {
    return "";
  }
}

/**
 * Aktualisiert Statuszeile, Löschen-Button und Liste der Einträge
 * auf Basis von daylogEntries und aktueller Sprache.
 */
function updateDaylogUI() {
  if (!FEATURES.daylog) return;
  if (!daylogTextEl) return;

  if (daylogListEl) {
    daylogListEl.innerHTML = "";
  }

  if (!daylogEntries || daylogEntries.length === 0) {
    if (daylogLastSavedEl) {
      const txt =
        currentLang === LANG_EN
          ? "Nothing saved yet."
          : currentLang === LANG_DA
          ? "Ingen gemte endnu."
          : "Noch nichts gespeichert.";
      daylogLastSavedEl.textContent = txt;
    }
    if (daylogClearEl) {
      daylogClearEl.classList.add("hidden");
    }
    daylogTextEl.value = "";
    return;
  }

  // Neuere zuerst
  daylogEntries.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  const latest = daylogEntries[0];

  if (daylogLastSavedEl) {
    const formatted = formatDaylogTimestamp(latest.ts || Date.now());
    let label;
    if (currentLang === LANG_EN) {
      label = formatted ? `Last saved: ${formatted}` : "Last saved.";
    } else if (currentLang === LANG_DA) {
      label = formatted ? `Sidst gemt: ${formatted}` : "Sidst gemt.";
    } else {
      label = formatted
        ? `Zuletzt gespeichert: ${formatted}`
        : "Zuletzt gespeichert.";
    }
    daylogLastSavedEl.textContent = label;
  }

  if (daylogClearEl) {
    daylogClearEl.classList.toggle("hidden", daylogEntries.length === 0);
  }

  // Textarea leer lassen, damit immer ein neuer Moment eingetragen werden kann
  daylogTextEl.value = "";

  if (!daylogListEl) return;

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

    daylogListEl.appendChild(item);
  });
}

/**
 * Lädt „Mein Tag“-Einträge aus localStorage.
 * Unterstützt altes Einzel-Format ({text, ts}) und neues Array-Format.
 */
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
      // Legacy-Format in ein neues Array-Format überführen
      const ts = typeof parsed.ts === "number" ? parsed.ts : Date.now();
      daylogEntries = [
        {
          id: ts,
          text: parsed.text.trim(),
          ts
        }
      ];
    }
  } catch (err) {
    console.warn("[Family Spots] Konnte Mein-Tag nicht laden:", err);
  }

  updateDaylogUI();
}

/**
 * Speichert einen neuen „Mein Tag“-Eintrag.
 * Jeder Klick auf Speichern erzeugt einen zusätzlichen Moment in der Liste.
 */
function handleDaylogSave() {
  if (!FEATURES.daylog) return;
  if (!daylogTextEl) return;

  const text = daylogTextEl.value.trim();
  if (!text) return;

  const now = Date.now();
  const entry = {
    id: now,
    text,
    ts: now
  };

  daylogEntries.push(entry);

  try {
    const payload = {
      entries: daylogEntries
    };
    localStorage.setItem(DAYLOG_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("[Family Spots] Konnte Mein-Tag nicht speichern:", err);
  }

  daylogTextEl.value = "";

  showToast("daylog_saved");
  if (tilla && typeof tilla.onDaylogSaved === "function") {
    tilla.onDaylogSaved();
  }

  updateDaylogUI();
}

/**
 * Löscht alle „Mein Tag“-Einträge und leert UI + Storage.
 */
function handleDaylogClear() {
  if (!FEATURES.daylog) return;

  daylogEntries = [];
  try {
    localStorage.removeItem(DAYLOG_STORAGE_KEY);
  } catch (err) {
    console.warn("[Family Spots] Konnte Mein-Tag nicht löschen:", err);
  }

  updateDaylogUI();

  const msg =
    currentLang === LANG_EN
      ? "Entry deleted."
      : currentLang === LANG_DA
      ? "Notat slettet."
      : "Eintrag gelöscht.";
  showToast(msg);
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

    filterSummaryEl = document.getElementById("filter-summary");

    btnOpenFilterModalEl = document.getElementById("btn-open-filter-modal");
    filterModalEl = document.getElementById("filter-modal");
    filterModalCloseEl = document.getElementById("filter-modal-close");
    filterModalApplyEl = document.getElementById("filter-modal-apply");
    filterModalResetEl = document.getElementById("filter-modal-reset");

    spotListEl = document.getElementById("spot-list");
    spotDetailEl = document.getElementById("spot-detail");
    spotsSectionEl = spotListEl
      ? spotListEl.closest(".sidebar-section--grow")
      : null;

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

    compassSectionEl = document.getElementById("compass-section");
    compassLabelEl = document.getElementById("compass-label");
    compassHelperEl = document.getElementById("compass-helper");
    compassApplyLabelEl = document.getElementById("compass-apply-label");
    compassApplyBtnEl = document.getElementById("compass-apply");
    btnToggleCompassEl = document.getElementById("btn-toggle-compass");

    skipLinkEl = document.querySelector(".skip-link");

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
        const nextLang =
          currentLang === LANG_DE
            ? LANG_DA
            : currentLang === LANG_DA
            ? LANG_EN
            : LANG_DE;
        setLanguage(nextLang);
      });
      updateLanguageSwitcherVisual();
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
        updateGenericSectionToggleLabel(btnToggleDaylogEl, daylogSectionEl.open);
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

    if (FEATURES.daylog && daylogClearEl) {
      daylogClearEl.addEventListener("click", handleDaylogClear);
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

    // Filter-Modal öffnen / schließen / anwenden / zurücksetzen
    if (btnOpenFilterModalEl && filterModalEl) {
      btnOpenFilterModalEl.addEventListener("click", () => {
        openFilterModal();
      });
    }

    if (filterModalCloseEl) {
      filterModalCloseEl.addEventListener("click", () => {
        closeFilterModal({ returnFocus: true });
      });
    }

    if (filterModalApplyEl) {
      filterModalApplyEl.addEventListener("click", () => {
        applyFiltersAndRender();
        closeFilterModal({ returnFocus: true });
      });
    }

    if (filterModalResetEl) {
      filterModalResetEl.addEventListener("click", () => {
        resetAllFilters();
      });
    }

    // Klick auf den Overlay-Hintergrund schließt das Modal
    if (filterModalEl) {
      filterModalEl.addEventListener("click", (event) => {
        if (event.target === filterModalEl) {
          closeFilterModal({ returnFocus: true });
        }
      });
    }

    // Skip-Link „Zum Hauptinhalt springen“
    if (skipLinkEl) {
      skipLinkEl.addEventListener("click", (event) => {
        const href = skipLinkEl.getAttribute("href") || "";
        if (!href.startsWith("#")) return;
        event.preventDefault();
        const id = href.slice(1);
        const target = document.getElementById(id);
        if (!target) return;

        if (!target.hasAttribute("tabindex")) {
          target.setAttribute("tabindex", "-1");
        }

        target.scrollIntoView();
        if (typeof target.focus === "function") {
          target.focus();
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

      // 1. Erst das Filter-Modal schließen, falls offen
      if (isFilterModalOpen && filterModalEl && !filterModalEl.hidden) {
        event.preventDefault();
        closeFilterModal({ returnFocus: true });
        return;
      }

      // 2. Dann ggf. das Spot-Detail
      if (!spotDetailEl) return;

      const isOpen =
        !spotDetailEl.classList.contains("spot-details--hidden");
      if (!isOpen) return;

      event.preventDefault();
      closeSpotDetails({ returnFocus: true });
    });

    updateFilterSummary();
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