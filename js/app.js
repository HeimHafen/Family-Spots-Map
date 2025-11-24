// js/app.js
// ======================================================
// Family Spots Map – Hauptlogik (Map, Filter, Tilla, UI)
// Senior-Level Refactoring (strukturierter, robuster, dokumentiert)
// ======================================================

"use strict";

import { TillaCompanion } from "./tilla.js";

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
 */

// ------------------------------------------------------
// Konstanten
// ------------------------------------------------------
const DEFAULT_MAP_CENTER = [52.4, 9.7];
const DEFAULT_MAP_ZOOM = 7;

const PLUS_STORAGE_KEY = "fs_plus_active";
const DAYLOG_STORAGE_KEY = "fs_daylog_last";

const LANG_DE = "de";
const LANG_EN = "en";

const THEME_LIGHT = "light";
const THEME_DARK = "dark";

/** 0–4 → Radius in km, Infinity = kein Limit */
const RADIUS_STEPS_KM = [1, 5, 15, 40, Infinity];

// ------------------------------------------------------
// Feature-Toggles – zentrale Schalter für optionale Bereiche
// ------------------------------------------------------
const FEATURES = Object.freeze({
  plus: true,
  moodFilter: true,
  travelMode: true,
  bigAdventureFilter: true,
  verifiedFilter: true,
  favorites: true,
  daylog: true,
  playIdeas: true,
  compass: true
});

// ------------------------------------------------------
// Sprach-Tabelle (DE / EN) – inkl. Tilla, Kompass & Toasts
// ------------------------------------------------------
const UI_STRINGS = {
  de: {
    // Fehler / Status
    error_data_load:
      "Die Daten konnten gerade nicht geladen werden. Versuch es gleich noch einmal.",
    toast_location_ok:
      "Euer Standort ist gesetzt – viel Spaß beim nächsten Abenteuer! 🌍",
    toast_location_error:
      "Euer Standort lässt sich gerade nicht bestimmen. Vielleicht ist die Freigabe gesperrt oder ihr seid offline.",

    // Buttons
    btn_show_list: "Liste zeigen",
    btn_only_map: "Nur Karte",
    btn_show_filters: "Filter anzeigen",
    btn_hide_filters: "Filter ausblenden",
    btn_show_compass: "Kompass anzeigen",
    btn_hide_compass: "Kompass ausblenden",

    // Favoriten
    toast_fav_added: "Zu euren Lieblingsspots gelegt 💛",
    toast_fav_removed: "Aus den Lieblingsspots entfernt.",

    // Filter allgemein
    filter_category_all: "Alle Kategorien",

    // Plus-Code
    plus_code_empty: "Bitte gib zuerst einen Aktions-Code ein.",
    plus_code_unknown: "Dieser Code ist unbekannt oder nicht mehr gültig.",
    plus_code_activated:
      "Family Spots Plus wurde aktiviert – gute Fahrt & viel Freude auf euren Touren!",
    plus_code_failed:
      "Der Code konnte gerade nicht geprüft werden. Versuch es später noch einmal.",

    // Radius
    filter_radius_max_label: "Alle Spots",
    filter_radius_description_step0:
      "Mini-Microabenteuer zu Fuß erreichbar – perfekt für eine kurze Pause.",
    filter_radius_description_step1:
      "Kurze Ausflüge in Fahrrad- oder Autoentfernung – schnell dort, schnell wieder zurück.",
    filter_radius_description_step2:
      "Eine kleine Familientour – genau richtig für einen halben Tag voller Erlebnisse.",
    filter_radius_description_step3:
      "Großer Abenteuer-Radius – hier warten Ziele für ganze Tagesausflüge.",
    filter_radius_description_all:
      "Alle Spots – ohne Radiusbegrenzung. Die Karte gehört euch.",

    // Tilla – Intro & Zustände
    turtle_intro_1:
      "Hallo, ich bin Tilla – eure Schildkröten-Begleiterin für entspannte Familien-Abenteuer!",
    turtle_intro_2:
      "Gerade finde ich keinen passenden Spot. Vielleicht passt heute ein kleiner Spaziergang in eurer Nähe – oder ihr dreht den Radius ein Stück weiter auf. 🐢",
    turtle_after_daylog_save:
      "Schön, dass ihr euren Tag festhaltet. Solche kleinen Notizen werden später zu großen Erinnerungen. 💛",
    turtle_after_fav_added:
      "Diesen Ort merkt ihr euch – eine kleine Perle auf eurer Familienkarte. ⭐",
    turtle_after_fav_removed:
      "Alles gut – manchmal passen Orte nur zu bestimmten Phasen. Ich helfe euch, neue zu finden. 🐢",
    turtle_trip_mode:
      "Ihr seid unterwegs – ich halte Ausschau nach guten Zwischenstopps für euch. 🚐",
    turtle_everyday_mode:
      "Alltag darf auch leicht sein. Lass uns schauen, was in eurer Nähe ein Lächeln zaubert. 🌿",
    turtle_plus_activated:
      "Family Spots Plus ist aktiv – jetzt entdecke ich auch Rastplätze, Stellplätze und Camping-Spots für euch. ✨",

    // Mein Tag
    daylog_saved:
      "Dein Tagesmoment ist gespeichert 💾 – später könnt ihr euch daran erinnern.",

    // Header / Navigation (dynamisch)
    header_tagline: "Heute ist Zeit für Familie.",
    nav_map: "Karte",
    nav_about: "Über",

    // Familien-Kompass
    compass_title: "Familien-Kompass",
    compass_helper:
      "Keine Lust auf lange Planung? Ich helfe euch, den Radius passend zu heute zu wählen – Alltag oder Unterwegs-Modus.",
    compass_apply_label: "Kompass anwenden",

    // Routen-Links
    route_apple: "In Apple Karten öffnen",
    route_google: "In Google Maps öffnen"
  },
  en: {
    error_data_load:
      "Oops – we couldn’t load the data right now. Please try again in a moment.",
    toast_location_ok:
      "Your starting point is set – have fun on your next adventure!",
    toast_location_error:
      "We couldn’t access your location. Please check permissions or zoom into your region manually.",

    btn_show_list: "Show list",
    btn_only_map: "Map only",
    btn_show_filters: "Show filters",
    btn_hide_filters: "Hide filters",
    btn_show_compass: "Show compass",
    btn_hide_compass: "Hide compass",

    toast_fav_added: "Added to your favourite places.",
    toast_fav_removed: "Removed from your favourite places.",

    filter_category_all: "All categories",

    plus_code_empty: "Please enter an action code first.",
    plus_code_unknown: "This code is unknown or no longer valid.",
    plus_code_activated:
      "Family Spots Plus has been activated – enjoy your trips!",
    plus_code_failed:
      "The code could not be verified right now. Please try again later.",

    filter_radius_max_label: "All spots",
    filter_radius_description_step0:
      "Tiny micro adventures within walking distance – perfect for a quick break.",
    filter_radius_description_step1:
      "Short trips for spontaneous outings – hop in the car or on the bike and you’re there.",
    filter_radius_description_step2:
      "A small family tour – just right for a half day full of experiences.",
    filter_radius_description_step3:
      "Big adventure radius – destinations for full-day trips are waiting here.",
    filter_radius_description_all:
      "All spots – no radius limit. The map is all yours.",

    turtle_intro_1:
      "Hi, I’m Tilla – your turtle companion for slow & relaxed family adventures!",
    turtle_intro_2:
      "Right now I can’t find a fitting spot. Maybe a small walk nearby is perfect today – or you widen the radius a little. 🐢",
    turtle_after_daylog_save:
      "Nice that you captured your day. These small notes turn into big memories later. 💛",
    turtle_after_fav_added:
      "You’ve saved this place – a small gem on your family map. ⭐",
    turtle_after_fav_removed:
      "All good – some places only fit certain phases. I’ll help you find new ones. 🐢",
    turtle_trip_mode:
      "You’re on the road – I’ll watch out for good stopovers for you. 🚐",
    turtle_everyday_mode:
      "Everyday life can feel light, too. Let’s see what nearby spot can bring a smile today. 🌿",
    turtle_plus_activated:
      "Family Spots Plus is active – I can now show you rest areas, RV spots and campgrounds as well. ✨",

    daylog_saved:
      "Your day moment has been saved 💾 – you can look back on it later.",

    header_tagline: "Make today a family day.",
    nav_map: "Map",
    nav_about: "About",

    compass_title: "Family Compass",
    compass_helper:
      "Don’t feel like long planning today? I’ll help you pick a fitting radius – everyday mode or travel mode.",
    compass_apply_label: "Apply compass",

    route_apple: "Open in Apple Maps",
    route_google: "Open in Google Maps"
  }
};

// ------------------------------------------------------
// Spielideen für unterwegs – werden in Tilla angezeigt
// ------------------------------------------------------
const PLAY_IDEAS = {
  de: [
    "Spielidee: Wörter-Kette – ein Wort beginnen, das nächste muss mit dem letzten Buchstaben starten. Wie lange schafft ihr die Kette, ohne zu stocken?",
    "Spielidee: Ich sehe was, was du nicht siehst – aber nur Dinge draußen vor dem Fenster.",
    "Spielidee: Sucht nacheinander Dinge in einer Farbe. Wer zuerst drei findet, gewinnt.",
    "Spielidee: Kennzeichen-Bingo – sucht Buchstaben eurer Vornamen auf den Nummernschildern. Wer seinen Namen zuerst voll hat, jubelt laut.",
    "Spielidee: Geräusche-Raten – einer macht leise ein Geräusch (rascheln, tippen, klopfen), die anderen raten, was es war."
  ],
  en: [
    "Game idea: Word chain – start with any word, the next one has to begin with the last letter. How long can you keep the chain going?",
    "Game idea: I spy with my little eye – but only things you can see outside the window.",
    "Game idea: Colour hunt – choose one colour, everyone looks for items in that colour. Whoever finds three first wins.",
    "Game idea: License plate bingo – search for the letters of your names on passing plates. Who completes their name first wins.",
    "Game idea: Sound guessing – one person quietly makes a sound (rustling, tapping, knocking), the others guess what it was."
  ]
};

const LAST_PLAY_IDEAS_INDEX = { de: -1, en: -1 };

// ------------------------------------------------------
// Kategorien
// ------------------------------------------------------
const CATEGORY_LABELS = {
  wildpark: {
    de: "Wildpark & Safaripark",
    en: "Wildlife & safari park"
  },
  zoo: {
    de: "Zoo & Tierpark",
    en: "Zoo & animal park"
  },
  // Ergänzt, damit MASTER_CATEGORY_SLUGS vollständig abgedeckt ist
  tierpark: {
    de: "Tierpark",
    en: "Animal park"
  },
  freizeitpark: {
    de: "Freizeitpark",
    en: "Theme park"
  },
  spielplatz: {
    de: "Spielplatz",
    en: "Playground"
  },
  abenteuerspielplatz: {
    de: "Abenteuerspielplatz",
    en: "Adventure playground"
  },
  waldspielplatz: {
    de: "Waldspielplatz",
    en: "Forest playground"
  },
  multifunktionsfeld: {
    de: "Sport- & Multifunktionsfeld",
    en: "Sports & multi-use court"
  },
  pumptrack: {
    de: "Pumptrack",
    en: "Pump track"
  },
  skatepark: {
    de: "Skatepark",
    en: "Skate park"
  },
  "museum-kinder": {
    de: "Kinder- & Familienmuseum",
    en: "Children’s & family museum"
  },
  "indoor-spielplatz": {
    de: "Indoor-Spielplatz",
    en: "Indoor playground"
  },
  wasserspielplatz: {
    de: "Wasserspielplatz",
    en: "Water playground"
  },
  bauernhof: {
    de: "Bauernhof",
    en: "Farm"
  },
  schwimmbad: {
    de: "Schwimmbad",
    en: "Indoor pool"
  },
  badesee: {
    de: "Badesee",
    en: "Swimming lake"
  },
  "park-garten": {
    de: "Park & Garten",
    en: "Park & garden"
  },
  picknickwiese: {
    de: "Picknickwiese",
    en: "Picnic meadow"
  },
  "wanderweg-kinderwagen": {
    de: "Wanderweg mit Kinderwagen",
    en: "Trail suitable for strollers"
  },
  "radweg-family": {
    de: "Familien-Radweg",
    en: "Family cycle route"
  },
  bibliothek: {
    de: "Kinder- & Familienbibliothek",
    en: "Children’s & family library"
  },
  minigolf: {
    de: "Minigolf",
    en: "Mini golf"
  },
  kletterhalle: {
    de: "Kletterhalle",
    en: "Indoor climbing"
  },
  "kletteranlage-outdoor": {
    de: "Kletteranlage (outdoor)",
    en: "Outdoor climbing area"
  },
  boulderpark: {
    de: "Boulderpark",
    en: "Bouldering park"
  },
  trampolinpark: {
    de: "Trampolinpark",
    en: "Trampoline park"
  },
  bolzplatz: {
    de: "Bolzplatz",
    en: "Kick-about pitch"
  },
  bewegungspark: {
    de: "Bewegungspark",
    en: "Movement park"
  },
  familiencafe: {
    de: "Familiencafé",
    en: "Family café"
  },
  "familien-restaurant": {
    de: "Familien-Restaurant",
    en: "Family restaurant"
  },
  "kinder-familiencafe": {
    de: "Kinder- & Familiencafé",
    en: "Kids & family café"
  },
  eisbahn: {
    de: "Eisbahn",
    en: "Ice rink"
  },
  rodelhuegel: {
    de: "Rodelhügel",
    en: "Sledging hill"
  },
  "oeffentliche-toilette": {
    de: "Öffentliche Toilette",
    en: "Public toilet"
  },
  wickelraum: {
    de: "Wickelraum",
    en: "Baby changing room"
  },
  "familien-event": {
    de: "Familien-Event",
    en: "Family event"
  },
  "rastplatz-spielplatz-dusche": {
    de: "Rastplatz mit Spielplatz & Dusche",
    en: "Rest area with playground & shower"
  },
  "stellplatz-spielplatz-naehe-kostenlos": {
    de: "Stellplatz (kostenlos, nahe Spielplatz)",
    en: "Free RV pitch near playground"
  },
  "wohnmobil-service-station": {
    de: "Wohnmobil-Service-Station",
    en: "RV service station"
  },
  "bikepacking-spot": {
    de: "Bikepacking-Spot",
    en: "Bikepacking spot"
  },
  "toddler-barfuss-motorik": {
    de: "Barfuß- & Motorikpfad (Kleinkind)",
    en: "Barefoot & motor skills trail (toddlers)"
  },
  naturerlebnispfad: {
    de: "Naturerlebnispfad",
    en: "Nature discovery trail"
  },
  walderlebnisroute: {
    de: "Walderlebnisroute",
    en: "Forest adventure route"
  }
};

const MASTER_CATEGORY_SLUGS = [
  "spielplatz",
  "abenteuerspielplatz",
  "indoor-spielplatz",
  "waldspielplatz",
  "wasserspielplatz",
  "zoo",
  "wildpark",
  "tierpark",
  "bauernhof",
  "schwimmbad",
  "badesee",
  "park-garten",
  "picknickwiese",
  "wanderweg-kinderwagen",
  "radweg-family",
  "museum-kinder",
  "bibliothek",
  "freizeitpark",
  "minigolf",
  "kletterhalle",
  "kletteranlage-outdoor",
  "boulderpark",
  "trampolinpark",
  "skatepark",
  "pumptrack",
  "multifunktionsfeld",
  "bolzplatz",
  "bewegungspark",
  "familiencafe",
  "familien-restaurant",
  "kinder-familiencafe",
  "eisbahn",
  "rodelhuegel",
  "oeffentliche-toilette",
  "wickelraum",
  "familien-event",
  "rastplatz-spielplatz-dusche",
  "stellplatz-spielplatz-naehe-kostenlos",
  "wohnmobil-service-station",
  "bikepacking-spot",
  "toddler-barfuss-motorik",
  "naturerlebnispfad",
  "walderlebnisroute"
];

// ------------------------------------------------------
// Globale State-Variablen
// ------------------------------------------------------
let currentLang = LANG_DE;
let currentTheme = THEME_LIGHT;

let map;
let markersLayer;
/** @type {Spot[]} */
let spots = [];
/** @type {Spot[]} */
let filteredSpots = [];
let favorites = new Set();

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
let filtersCollapsed = true; // beim Start: Filter eingeklappt

// DOM-Elemente
let languageSwitcherEl;
let themeToggleEl;
let btnLocateEl;
let btnHelpEl;
let headerTaglineEl;
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

// Button für Spielideen
let playIdeasBtnEl = null;

// Filter-Body innerhalb der Filter-Section
let filterBodyEls = [];

// Fokus-Merkung für Detail-Panel
let lastSpotTriggerEl = null;

// ------------------------------------------------------
// Generische Utilities
// ------------------------------------------------------

/**
 * Debounce-Helfer für Input-Handler
 * @param {Function} fn
 * @param {number} [delay=200]
 * @returns {Function}
 */
function debounce(fn, delay = 200) {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => fn(...args), delay);
  };
}

/**
 * Aktiviert eine Aktion bei Enter oder Space (für Tastaturbedienung).
 * @param {Function} handler
 * @returns {(event: KeyboardEvent) => void}
 */
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
 * Liefert die aktuelle Sprache-Tabelle oder DE-Fallback.
 */
function getCurrentStrings() {
  return UI_STRINGS[currentLang] || UI_STRINGS[LANG_DE];
}

// ------------------------------------------------------
// Utility: Sprache & Übersetzung
// ------------------------------------------------------

function getInitialLang() {
  const stored = localStorage.getItem("fs_lang");
  if (stored === LANG_DE || stored === LANG_EN) return stored;

  const htmlLang =
    (document.documentElement.lang || navigator.language || LANG_DE)
      .toLowerCase()
      .slice(0, 2);

  return htmlLang === LANG_EN ? LANG_EN : LANG_DE;
}

/**
 * Übersetzungs-Funktion
 * @param {string} key
 * @returns {string}
 */
function t(key) {
  const table = getCurrentStrings();
  return table[key] || key;
}

/**
 * @param {string} slug
 * @returns {string}
 */
function getCategoryLabel(slug) {
  if (!slug) return "";
  const entry = CATEGORY_LABELS[slug];
  if (entry) {
    return entry[currentLang] || entry.de || slug;
  }
  return slug.replace(/_/g, " ");
}

function applyStaticI18n() {
  document.querySelectorAll("[data-i18n-de]").forEach((el) => {
    const keyAttr = currentLang === LANG_DE ? "i18n-de" : "i18n-en";
    const text = el.getAttribute(`data-${keyAttr}`);
    if (text) el.textContent = text;
  });
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

function updatePlusStatusText() {
  if (!plusStatusTextEl) return;

  if (!FEATURES.plus || !plusActive) {
    plusStatusTextEl.textContent = "";
    return;
  }

  plusStatusTextEl.textContent =
    currentLang === LANG_DE
      ? "Family Spots Plus ist aktiv – zusätzliche Kategorien sind freigeschaltet."
      : "Family Spots Plus is active – additional categories have been unlocked.";
}

/**
 * Setzt Sprache, aktualisiert UI & speichert in localStorage.
 * @param {"de"|"en"} lang
 * @param {{initial?: boolean}} [options]
 */
function setLanguage(lang, { initial = false } = {}) {
  currentLang = lang === LANG_EN ? LANG_EN : LANG_DE;
  localStorage.setItem("fs_lang", currentLang);
  document.documentElement.lang = currentLang;

  if (headerTaglineEl) headerTaglineEl.textContent = t("header_tagline");
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

  if (!initial && tilla && typeof tilla.onLanguageChanged === "function") {
    tilla.onLanguageChanged();
  }

  updateLanguageSwitcherVisual();
  applyStaticI18n();
  updatePlusStatusText();

  if (!initial) {
    const headerTitle = document.querySelector(".header-title");
    if (headerTitle && typeof headerTitle.focus === "function") {
      headerTitle.focus();
    }
  }
}

// ------------------------------------------------------
// Theme
// ------------------------------------------------------
function getInitialTheme() {
  const stored = localStorage.getItem("fs_theme");
  if (stored === THEME_LIGHT || stored === THEME_DARK) return stored;

  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return THEME_DARK;
  }

  return THEME_LIGHT;
}

function setTheme(theme) {
  currentTheme = theme === THEME_DARK ? THEME_DARK : THEME_LIGHT;
  localStorage.setItem("fs_theme", currentTheme);
  document.documentElement.setAttribute("data-theme", currentTheme);
}

// ------------------------------------------------------
// Toast
// ------------------------------------------------------
let toastTimeoutId = null;

/**
 * Zeigt einen Toast an. Akzeptiert UI-String-Key oder freie Message.
 * @param {string} keyOrMessage
 */
function showToast(keyOrMessage) {
  if (!toastEl) return;

  const strings = getCurrentStrings();
  const message = strings[keyOrMessage] || keyOrMessage || "…";

  toastEl.textContent = message;
  toastEl.classList.add("toast--visible");

  if (toastTimeoutId) clearTimeout(toastTimeoutId);

  toastTimeoutId = window.setTimeout(() => {
    toastEl.classList.remove("toast--visible");
  }, 3200);
}

// ------------------------------------------------------
// Map / Spots – Setup
// ------------------------------------------------------
function initMap() {
  if (typeof L === "undefined" || typeof L.map !== "function") {
    console.error("[Family Spots] Leaflet (L) ist nicht verfügbar.");
    map = null;
    markersLayer = null;
    return;
  }

  map = L.map("map", {
    center: DEFAULT_MAP_CENTER,
    zoom: DEFAULT_MAP_ZOOM,
    zoomControl: false
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap-Mitwirkende"
  }).addTo(map);

  if (typeof L.markerClusterGroup === "function") {
    markersLayer = L.markerClusterGroup();
  } else {
    console.warn(
      "[Family Spots] markerClusterGroup nicht gefunden – nutze normale LayerGroup."
    );
    markersLayer = L.layerGroup();
  }

  map.addLayer(markersLayer);
}

/**
 * Lädt Spots aus data/spots.json, normalisiert Daten & triggert initiales Rendering.
 */
async function loadSpots() {
  try {
    const res = await fetch("data/spots.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    const raw = Array.isArray(data) ? data : data.spots || [];

    spots = raw.map((spot) => {
      /** @type {Spot} */
      const normalized = { ...spot };

      // Normalisierung Koordinaten
      if (normalized.lon != null && normalized.lng == null) {
        normalized.lng = normalized.lon;
      }

      // category vs categories-Fallback
      if (
        !normalized.category &&
        Array.isArray(normalized.categories) &&
        normalized.categories.length
      ) {
        normalized.category = normalized.categories[0];
      }

      // vorberechnete / gecachte Felder
      normalized._searchText = buildSpotSearchText(normalized);
      normalized._ageGroups = getSpotAgeGroups(normalized);
      normalized._moods = getSpotMoods(normalized);
      normalized._travelModes = getSpotTravelModes(normalized);

      return normalized;
    });

    loadFavoritesFromStorage();
    populateCategoryOptions();
    applyFiltersAndRender();
  } catch (err) {
    console.error("[Family Spots] Fehler beim Laden der Spots:", err);
    showToast("error_data_load");
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
// Spots – General Helpers
// ------------------------------------------------------

/**
 * @param {Spot} spot
 */
function getSpotName(spot) {
  return (
    spot.title ||
    spot.name ||
    spot.spotName ||
    (spot.id ? String(spot.id) : "Spot")
  );
}

/**
 * @param {Spot} spot
 */
function getSpotSubtitle(spot) {
  if (spot.city && spot.country) return `${spot.city}, ${spot.country}`;
  if (spot.city) return spot.city;
  if (spot.town && spot.country) return `${spot.town}, ${spot.country}`;
  if (spot.address) return spot.address;
  return spot.subtitle || spot.shortDescription || "";
}

/**
 * @param {Spot} spot
 */
function getSpotId(spot) {
  return String(spot.id || getSpotName(spot));
}

/**
 * @param {Spot} spot
 */
function isSpotPlusOnly(spot) {
  return !!spot.plusOnly || !!spot.plus;
}

/**
 * @param {Spot} spot
 */
function isSpotBigAdventure(spot) {
  return !!spot.bigAdventure || !!spot.isBigAdventure || !!spot.longTrip;
}

/**
 * @param {Spot} spot
 */
function isSpotVerified(spot) {
  return !!spot.verified || !!spot.isVerified;
}

/**
 * Meta-Info zu einem Spot zentral berechnen.
 * @param {Spot} spot
 * @returns {string[]}
 */
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

/**
 * Suchtext aus Spot zusammenbauen.
 * @param {Spot} spot
 * @returns {string}
 */
function buildSpotSearchText(spot) {
  if (spot._searchText) return spot._searchText;

  const parts = [
    getSpotName(spot),
    getSpotSubtitle(spot),
    spot.category,
    ...(Array.isArray(spot.tags) ? spot.tags : [])
  ].filter(Boolean);

  const text = parts.join(" ").toLowerCase();
  spot._searchText = text;
  return text;
}

/**
 * @param {Spot} spot
 * @returns {string[]}
 */
function getSpotAgeGroups(spot) {
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

/**
 * @param {Spot} spot
 * @returns {string[]}
 */
function getSpotMoods(spot) {
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

/**
 * @param {Spot} spot
 * @returns {string[]}
 */
function getSpotTravelModes(spot) {
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
 * Routen-URLs für einen Spot berechnen.
 * @param {Spot} spot
 */
function getRouteUrlsForSpot(spot) {
  if (!spot.lat || !spot.lng) return null;

  const { lat, lng } = spot;
  const name = getSpotName(spot);
  const encodedName = encodeURIComponent(name || "");

  return {
    apple: `https://maps.apple.com/?ll=${lat},${lng}&q=${encodedName}`,
    google: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  };
}

// ------------------------------------------------------
// Spielideen
// ------------------------------------------------------

/**
 * Liefert eine zufällige Spielidee, ohne die letzte zu wiederholen.
 * @returns {string}
 */
function getRandomPlayIdea() {
  const lang = currentLang === LANG_EN ? LANG_EN : LANG_DE;
  const list = PLAY_IDEAS[lang];
  if (!list || !list.length) return "";

  let idx;
  if (list.length === 1) {
    idx = 0;
  } else {
    const last = LAST_PLAY_IDEAS_INDEX[lang];
    do {
      idx = Math.floor(Math.random() * list.length);
    } while (idx === last);
  }
  LAST_PLAY_IDEAS_INDEX[lang] = idx;
  return list[idx];
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

  const catSet = new Set(MASTER_CATEGORY_SLUGS);

  spots.forEach((spot) => {
    if (Array.isArray(spot.categories)) {
      spot.categories.forEach((c) => c && catSet.add(c));
    } else if (spot.category) {
      catSet.add(spot.category);
    }
  });

  const cats = Array.from(catSet);
  cats.sort((a, b) => {
    const la = getCategoryLabel(a).toLowerCase();
    const lb = getCategoryLabel(b).toLowerCase();
    return la.localeCompare(lb, currentLang === LANG_DE ? "de" : "en");
  });

  filterCategoryEl.innerHTML = "";
  filterCategoryEl.appendChild(firstOption);

  cats.forEach((slug) => {
    const opt = document.createElement("option");
    opt.value = slug;
    opt.textContent = getCategoryLabel(slug);
    filterCategoryEl.appendChild(opt);
  });

  filterCategoryEl.value = categoryFilter || "";
}

// ------------------------------------------------------
// Radius / Geodistanz
// ------------------------------------------------------

/**
 * Prüft, ob Spot im Radius liegt. Bei fehlender Map oder ungültigem Center
 * wird kein Radius angewendet (Spot bleibt drin).
 * @param {Spot} spot
 * @param {any} centerLatLng
 * @param {number} radiusKm
 * @returns {boolean}
 */
function isSpotInRadius(spot, centerLatLng, radiusKm) {
  if (
    !map ||
    !spot.lat ||
    !spot.lng ||
    !isFinite(radiusKm) ||
    !centerLatLng ||
    typeof centerLatLng.distanceTo !== "function"
  ) {
    return true;
  }
  if (radiusKm === Infinity) return true;

  const spotLatLng = L.latLng(spot.lat, spot.lng);
  const distanceMeters = centerLatLng.distanceTo(spotLatLng);
  const distanceKm = distanceMeters / 1000;
  return distanceKm <= radiusKm;
}

function updateRadiusTexts() {
  if (!filterRadiusEl || !filterRadiusMaxLabelEl || !filterRadiusDescriptionEl)
    return;

  const value = parseInt(filterRadiusEl.value, 10);
  radiusStep = Number.isNaN(value) ? 4 : value;

  filterRadiusEl.setAttribute("aria-valuenow", String(radiusStep));

  if (radiusStep === 4) {
    filterRadiusMaxLabelEl.textContent = t("filter_radius_max_label");
    filterRadiusDescriptionEl.textContent = t("filter_radius_description_all");
  } else {
    const km = RADIUS_STEPS_KM[radiusStep];
    filterRadiusMaxLabelEl.textContent = `${km} km`;
    const key = `filter_radius_description_step${radiusStep}`;
    filterRadiusDescriptionEl.textContent = t(key);
  }
}

// ------------------------------------------------------
// Filterlogik (zentral)
// ------------------------------------------------------

/**
 * Prüft, ob ein Spot zur aktuellen Filterkonfiguration passt.
 * @param {Spot} spot
 * @param {{center: any, radiusKm: number}} ctx
 */
function doesSpotMatchFilters(spot, { center, radiusKm }) {
  if (FEATURES.plus && isSpotPlusOnly(spot) && !plusActive) {
    return false;
  }

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    const haystack = buildSpotSearchText(spot);
    if (!haystack.includes(term)) return false;
  }

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

  if (ageFilter && ageFilter !== "all") {
    const ages = getSpotAgeGroups(spot);
    if (ages.length && !ages.includes(ageFilter)) {
      return false;
    }
  }

  if (FEATURES.moodFilter && moodFilter) {
    const moods = getSpotMoods(spot);
    if (moods.length && !moods.includes(moodFilter)) {
      return false;
    }
  }

  if (FEATURES.travelMode && travelMode) {
    const modes = getSpotTravelModes(spot);
    if (modes.length && !modes.includes(travelMode)) {
      return false;
    }
  }

  if (
    FEATURES.bigAdventureFilter &&
    onlyBigAdventures &&
    !isSpotBigAdventure(spot)
  ) {
    return false;
  }

  if (FEATURES.verifiedFilter && onlyVerified && !isSpotVerified(spot)) {
    return false;
  }

  if (FEATURES.favorites && onlyFavorites) {
    const id = getSpotId(spot);
    if (!favorites.has(id)) {
      return false;
    }
  }

  if (!isSpotInRadius(spot, center, radiusKm)) return false;

  return true;
}

/**
 * Führt Filterung durch & rendert Liste und Marker.
 */
function applyFiltersAndRender() {
  if (!spots.length) {
    filteredSpots = [];
    renderSpotList();
    renderMarkers();

    if (tilla && typeof tilla.onNoSpotsFound === "function") {
      tilla.onNoSpotsFound();
    }
    return;
  }

  let center = null;
  if (map && typeof map.getCenter === "function") {
    center = map.getCenter();
  } else if (typeof L !== "undefined" && typeof L.latLng === "function") {
    center = L.latLng(DEFAULT_MAP_CENTER[0], DEFAULT_MAP_CENTER[1]);
  }

  const radiusKm = RADIUS_STEPS_KM[radiusStep] ?? Infinity;

  filteredSpots = spots.filter((spot) =>
    doesSpotMatchFilters(spot, { center, radiusKm })
  );

  renderSpotList();
  renderMarkers();

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
// Marker & Liste
// ------------------------------------------------------

function renderMarkers() {
  if (!markersLayer) return;
  markersLayer.clearLayers();

  filteredSpots.forEach((spot) => {
    if (!spot.lat || !spot.lng) return;
    if (typeof L === "undefined" || typeof L.divIcon !== "function") return;

    const el = document.createElement("div");
    el.className = "spot-marker";
    const inner = document.createElement("div");
    inner.className = "spot-marker-inner pin-pop";
    el.appendChild(inner);

    const icon = L.divIcon({
      html: el,
      className: "",
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([spot.lat, spot.lng], { icon });

    const name = getSpotName(spot);
    const subtitle = getSpotSubtitle(spot);

    let routesHtml = "";
    const routeUrls = getRouteUrlsForSpot(spot);

    if (routeUrls) {
      routesHtml = `
        <div class="popup-actions">
          <a class="popup-link" href="${routeUrls.apple}" target="_blank" rel="noopener noreferrer">${t(
            "route_apple"
          )}</a>
          <a class="popup-link" href="${routeUrls.google}" target="_blank" rel="noopener noreferrer">${t(
            "route_google"
          )}</a>
        </div>
      `;
    }

    const popupHtml = `
      <div class="popup">
        <strong>${name}</strong><br/>
        <small>${subtitle || ""}</small>
        ${routesHtml}
      </div>
    `;

    marker.bindPopup(popupHtml);

    marker.on("click", () => {
      focusSpotOnMap(spot);
    });

    markersLayer.addLayer(marker);
  });
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

    // Tastatur-fokussierbar + Button-Rolle
    card.tabIndex = 0;
    card.setAttribute("role", "button");

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

/**
 * Synchronisiert Icon & aria-label eines Favoriten-Buttons mit dem Zustand.
 * @param {HTMLButtonElement} btn
 * @param {string} spotId
 */
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
  if (!map || !spot.lat || !spot.lng) {
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

/**
 * Rendert Detail-Panel für einen Spot.
 * @param {Spot} spot
 */
function showSpotDetails(spot) {
  if (!spotDetailEl) return;

  const spotId = getSpotId(spot);
  const isFav = favorites.has(spotId);

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

  if (subtitle && !addressText) {
    const subtitleEl = document.createElement("p");
    subtitleEl.className = "spot-card-subtitle";
    subtitleEl.textContent = subtitle;
    titleWrapperEl.appendChild(subtitleEl);
  }

  titleWrapperEl.insertBefore(titleEl, titleWrapperEl.firstChild);

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

  spotDetailEl.insertBefore(metaEl, spotDetailEl.firstChild);
  spotDetailEl.insertBefore(headerEl, spotDetailEl.firstChild);
  if (tags.length) {
    spotDetailEl.appendChild(tagsEl);
  }
}

// ------------------------------------------------------
// Favoriten
// ------------------------------------------------------

/**
 * Toggles Favourite-Status & triggert Nebenwirkungen (Toast, Tilla, Liste).
 * @param {Spot} spot
 */
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

  // Liste neu aufbauen, damit Icons & Filter (nur Favoriten) stimmen
  renderSpotList();
}

// ------------------------------------------------------
// Kompass
// ------------------------------------------------------
function updateCompassButtonLabel() {
  if (!FEATURES.compass) return;
  if (!btnToggleCompassEl || !compassSectionEl) return;
  const span = btnToggleCompassEl.querySelector("span");
  if (!span) return;
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

  // einfache Heuristik: Alltag = mittlerer Radius, Reise = großer Radius
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
}

// ------------------------------------------------------
// Plus-Code (mit Persistenz)
// ------------------------------------------------------

function loadPlusStateFromStorage(options = {}) {
  const { reapplyFilters = false } = options;

  if (!FEATURES.plus) {
    plusActive = false;
    updatePlusStatusText();
    return;
  }

  try {
    plusActive = localStorage.getItem(PLUS_STORAGE_KEY) === "1";
  } catch (err) {
    console.warn("[Family Spots] Konnte Plus-Status nicht laden:", err);
    plusActive = false;
  }
  updatePlusStatusText();

  if (reapplyFilters && spots.length) {
    applyFiltersAndRender();
  }
}

function handlePlusCodeSubmit() {
  if (!FEATURES.plus) return;
  if (!plusCodeInputEl || !plusStatusTextEl) return;
  const raw = plusCodeInputEl.value.trim();

  if (!raw) {
    showToast("plus_code_empty");
    return;
  }

  if (raw.length < 4) {
    showToast("plus_code_unknown");
    return;
  }

  // TODO: Später durch echten Backend-Check ersetzen
  plusActive = true;
  try {
    localStorage.setItem(PLUS_STORAGE_KEY, "1");
  } catch (err) {
    console.warn("[Family Spots] Konnte Plus-Status nicht speichern:", err);
  }

  showToast("plus_code_activated");
  updatePlusStatusText();

  if (tilla && typeof tilla.onPlusActivated === "function") {
    tilla.onPlusActivated();
  }

  applyFiltersAndRender();
}

// ------------------------------------------------------
// Mein Tag
// ------------------------------------------------------

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
// Navigation (Karte / Über)
// ------------------------------------------------------
function switchRoute(route) {
  if (!viewMapEl || !viewAboutEl || !bottomNavButtons) return;

  const showMap = route !== "about";

  viewMapEl.classList.toggle("view--active", showMap);
  viewAboutEl.classList.toggle("view--active", !showMap);

  viewMapEl.style.display = showMap ? "block" : "none";
  viewAboutEl.style.display = showMap ? "none" : "block";

  bottomNavButtons.forEach((btn) => {
    const btnRoute = btn.getAttribute("data-route");
    const isActive = btnRoute === route || (showMap && btnRoute === "map");
    btn.classList.toggle("bottom-nav-item--active", isActive);
    btn.setAttribute("aria-current", isActive ? "page" : "false");
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
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

  btnToggleFiltersEl.setAttribute("aria-expanded", isExpanded ? "true" : "false");
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
function init() {
  try {
    // DOM
    languageSwitcherEl = document.getElementById("language-switcher");
    themeToggleEl = document.getElementById("theme-toggle");
    btnLocateEl = document.getElementById("btn-locate");
    btnHelpEl = document.getElementById("btn-help");
    headerTaglineEl = document.getElementById("header-tagline");

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

    spotListEl = document.getElementById("spot-list");
    spotDetailEl = document.getElementById("spot-detail");

    plusCodeInputEl = document.getElementById("plus-code-input");
    plusCodeSubmitEl = document.getElementById("plus-code-submit");
    plusStatusTextEl = document.getElementById("plus-status-text");

    daylogTextEl = document.getElementById("daylog-text");
    daylogSaveEl = document.getElementById("daylog-save");

    toastEl = document.getElementById("toast");

    // Kompass
    compassSectionEl = document.getElementById("compass-section");
    compassLabelEl = document.getElementById("compass-label");
    compassHelperEl = document.getElementById("compass-helper");
    compassApplyLabelEl = document.getElementById("compass-apply-label");
    compassApplyBtnEl = document.getElementById("compass-apply");
    btnToggleCompassEl = document.getElementById("btn-toggle-compass");

    // ARIA-Grundzustand
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
      btnToggleCompassEl.setAttribute("aria-expanded", "false");
    }

    if (compassSectionEl) {
      compassSectionEl.open = false;
    }

    // Sprache / Theme / Map
    const initialLang = getInitialLang();
    setLanguage(initialLang, { initial: true });

    const initialTheme = getInitialTheme();
    setTheme(initialTheme);

    initMap();

    if (map && spotDetailEl) {
      map.on("click", () => {
        closeSpotDetails({ returnFocus: true });
      });
    }

    // Tilla
    tilla = new TillaCompanion({
      getText: (key) => t(key)
    });

    // Events – Sprache
    if (languageSwitcherEl) {
      languageSwitcherEl.addEventListener("click", () => {
        const nextLang = currentLang === LANG_DE ? LANG_EN : LANG_DE;
        setLanguage(nextLang);
      });
    }

    if (themeToggleEl) {
      themeToggleEl.addEventListener("click", () => {
        setTheme(currentTheme === THEME_LIGHT ? THEME_DARK : THEME_LIGHT);
      });
    }

    if (btnLocateEl) {
      btnLocateEl.addEventListener("click", handleLocateClick);
    }

    if (btnHelpEl) {
      btnHelpEl.addEventListener("click", () => {
        switchRoute("about");
      });
    }

    // Bottom-Navigation
    const bottomNavMapBtn = document.querySelector(
      '.bottom-nav-item[data-route="map"]'
    );
    const bottomNavAboutBtn = document.querySelector(
      '.bottom-nav-item[data-route="about"]'
    );

    if (bottomNavMapBtn) {
      bottomNavMapBtn.addEventListener("click", () => {
        switchRoute("map");
      });
    }

    if (bottomNavAboutBtn) {
      bottomNavAboutBtn.addEventListener("click", () => {
        switchRoute("about");
      });
    }

    // Filter-Events
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
      filterRadiusEl.setAttribute("aria-valuemin", "0");
      filterRadiusEl.setAttribute("aria-valuemax", "4");
      filterRadiusEl.setAttribute("aria-valuenow", filterRadiusEl.value || "4");

      filterRadiusEl.addEventListener("input", () => {
        updateRadiusTexts();
        applyFiltersAndRender();
      });
      updateRadiusTexts();
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
      btnToggleCompassEl.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        handleToggleCompass();
      });

      compassSectionEl.addEventListener("toggle", updateCompassButtonLabel);

      updateCompassButtonLabel();
    }

    if (FEATURES.plus && plusCodeSubmitEl) {
      plusCodeSubmitEl.addEventListener("click", handlePlusCodeSubmit);
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
      });
    });

    updateCompassUI();
    loadPlusStateFromStorage();
    loadDaylogFromStorage();

    // ESC schließt Detail-Panel
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" && event.key !== "Esc") return;
      if (!spotDetailEl) return;

      const isOpen = !spotDetailEl.classList.contains("spot-details--hidden");
      if (!isOpen) return;

      event.preventDefault();
      closeSpotDetails({ returnFocus: true });
    });

    switchRoute("map");
    loadSpots();
  } catch (err) {
    console.error("[Family Spots] Init-Fehler:", err);
  }
}

document.addEventListener("DOMContentLoaded", init);