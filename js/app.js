// js/app.js
// ======================================================
// Family Spots Map – Hauptlogik (Map, Filter, Tilla, UI)
// ======================================================

import { TillaCompanion } from "./tilla.js";

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

const LAST_PLAY_IDEA_INDEX = { de: -1, en: -1 };

function getRandomPlayIdea() {
  const lang = currentLang === "en" ? "en" : "de";
  const list = PLAY_IDEAS[lang];
  if (!list || !list.length) return "";

  let idx;
  if (list.length === 1) {
    idx = 0;
  } else {
    const last = LAST_PLAY_IDEA_INDEX[lang];
    do {
      idx = Math.floor(Math.random() * list.length);
    } while (idx === last);
  }
  LAST_PLAY_IDEA_INDEX[lang] = idx;
  return list[idx];
}

// (Kategorie-Label-Tabelle & MASTER_CATEGORY_SLUGS bleiben unverändert)
const CATEGORY_LABELS = {
  wildpark: {
    de: "Wildpark & Safaripark",
    en: "Wildlife & safari park"
  },
  zoo: {
    de: "Zoo & Tierpark",
    en: "Zoo & animal park"
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
  kinder_museum: {
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
let currentLang = "de";
let currentTheme = "light";

let map;
let markersLayer;
let spots = [];
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

const RADIUS_STEPS_KM = [1, 5, 15, 40, Infinity];

// ------------------------------------------------------
// Utility: Sprache & Übersetzung
// ------------------------------------------------------
function getInitialLang() {
  const stored = localStorage.getItem("fs_lang");
  if (stored === "de" || stored === "en") return stored;

  const htmlLang =
    (document.documentElement.lang || navigator.language || "de")
      .toLowerCase()
      .slice(0, 2);

  return htmlLang === "en" ? "en" : "de";
}

function t(key) {
  const table = UI_STRINGS[currentLang] || UI_STRINGS.de;
  return table[key] || key;
}

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
    const key = currentLang === "de" ? "i18n-de" : "i18n-en";
    const text = el.getAttribute(`data-${key}`);
    if (text) el.textContent = text;
  });
}

// Button-Beschriftung & ARIA aktualisieren
function updateLanguageSwitcherVisual() {
  if (!languageSwitcherEl) return;

  const label = currentLang === "de" ? "DE" : "EN";
  languageSwitcherEl.textContent = label;

  languageSwitcherEl.setAttribute(
    "aria-label",
    currentLang === "de"
      ? "Sprache: Deutsch (Tippen für Englisch)"
      : "Language: English (tap for German)"
  );
}

function setLanguage(lang, { initial = false } = {}) {
  currentLang = lang === "en" ? "en" : "de";
  localStorage.setItem("fs_lang", currentLang);
  document.documentElement.lang = currentLang;

  if (headerTaglineEl) {
    headerTaglineEl.textContent = t("header_tagline");
  }
  if (bottomNavMapLabelEl) bottomNavMapLabelEl.textContent = t("nav_map");
  if (bottomNavAboutLabelEl)
    bottomNavAboutLabelEl.textContent = t("nav_about");

  if (compassLabelEl) compassLabelEl.textContent = t("compass_title");
  if (compassHelperEl) compassHelperEl.textContent = t("compass_helper");
  if (compassApplyLabelEl)
    compassApplyLabelEl.textContent = t("compass_apply_label");

  // Kompass-Toggle-Button + Sichtbarkeit von "Kompass anwenden"
  updateCompassButtonLabel();
  updateCompassUI();

  // About-Seite DE/EN umschalten + aria-hidden korrekt setzen
  const aboutDe = document.getElementById("page-about-de");
  const aboutEn = document.getElementById("page-about-en");
  if (aboutDe && aboutEn) {
    if (currentLang === "de") {
      aboutDe.classList.remove("hidden");
      aboutDe.setAttribute("aria-hidden", "false");
      aboutEn.classList.add("hidden");
      aboutEn.setAttribute("aria-hidden", "true");
    } else {
      aboutEn.classList.remove("hidden");
      aboutEn.setAttribute("aria-hidden", "false");
      aboutDe.classList.add("hidden");
      aboutDe.setAttribute("aria-hidden", "true");
    }
  }

  if (btnToggleFiltersEl) {
    btnToggleFiltersEl.querySelector("span").textContent = filtersCollapsed
      ? t("btn_show_filters")
      : t("btn_hide_filters");
  }
  if (btnToggleViewEl && sidebarEl) {
    const sidebarHidden = sidebarEl.classList.contains("hidden");
    btnToggleViewEl.querySelector("span").textContent = sidebarHidden
      ? t("btn_show_list")
      : t("btn_only_map");
  }

  if (filterSearchEl) {
    filterSearchEl.placeholder =
      currentLang === "de"
        ? "Ort, Spot, Stichwörter …"
        : "Place, spot, keywords …";
  }

  if (daylogTextEl) {
    daylogTextEl.placeholder =
      currentLang === "de"
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

  // Nach Sprachwechsel Fokus auf Haupttitel setzen (Screenreader)
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
  if (stored === "light" || stored === "dark") return stored;

  // Systempräferenz respektieren, falls kein eigener Wert gesetzt ist
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

function setTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";
  localStorage.setItem("fs_theme", currentTheme);
  document.documentElement.setAttribute("data-theme", currentTheme);
}

// ------------------------------------------------------
// Toast
// ------------------------------------------------------
let toastTimeoutId = null;

function showToast(keyOrMessage) {
  if (!toastEl) return;

  const message =
    UI_STRINGS[currentLang][keyOrMessage] || keyOrMessage || "…";

  toastEl.textContent = message;
  toastEl.classList.add("toast--visible");

  if (toastTimeoutId) clearTimeout(toastTimeoutId);

  toastTimeoutId = setTimeout(() => {
    toastEl.classList.remove("toast--visible");
  }, 3200);
}

// ------------------------------------------------------
// Map / Spots
// ------------------------------------------------------
function initMap() {
  map = L.map("map", {
    center: [52.4, 9.7],
    zoom: 7,
    zoomControl: false
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap-Mitwirkende"
  }).addTo(map);

  markersLayer = L.markerClusterGroup();
  map.addLayer(markersLayer);
}

async function loadSpots() {
  try {
    const res = await fetch("data/spots.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    const raw = Array.isArray(data) ? data : data.spots || [];

    spots = raw.map((spot) => {
      const normalized = { ...spot };

      if (normalized.lon != null && normalized.lng == null) {
        normalized.lng = normalized.lon;
      }
      if (
        !normalized.category &&
        Array.isArray(normalized.categories) &&
        normalized.categories.length
      ) {
        normalized.category = normalized.categories[0];
      }

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

function loadFavoritesFromStorage() {
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
  try {
    localStorage.setItem("fs_favorites", JSON.stringify(Array.from(favorites)));
  } catch (err) {
    console.warn("[Family Spots] Konnte Favoriten nicht speichern:", err);
  }
}

function getSpotName(spot) {
  return (
    spot.title ||
    spot.name ||
    spot.spotName ||
    (spot.id ? String(spot.id) : "Spot")
  );
}

function getSpotSubtitle(spot) {
  if (spot.city && spot.country) return `${spot.city}, ${spot.country}`;
  if (spot.city) return spot.city;
  if (spot.town && spot.country) return `${spot.town}, ${spot.country}`;
  if (spot.address) return spot.address;
  return spot.subtitle || spot.shortDescription || "";
}

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
    return la.localeCompare(lb, currentLang === "de" ? "de" : "en");
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

function isSpotInRadius(spot, centerLatLng, radiusKm) {
  if (!map || !spot.lat || !spot.lng || !isFinite(radiusKm)) return true;
  if (radiusKm === Infinity) return true;

  const spotLatLng = L.latLng(spot.lat, spot.lng);
  const distanceMeters = centerLatLng.distanceTo(spotLatLng);
  const distanceKm = distanceMeters / 1000;
  return distanceKm <= radiusKm;
}

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

  const center = map ? map.getCenter() : L.latLng(52.4, 9.7);
  const radiusKm = RADIUS_STEPS_KM[radiusStep] ?? Infinity;

  filteredSpots = spots.filter((spot) => {
    const plusOnly = !!spot.plusOnly || !!spot.plus;
    if (plusOnly && !plusActive) return false;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const haystack = [
        getSpotName(spot),
        getSpotSubtitle(spot),
        spot.category,
        ...(Array.isArray(spot.tags) ? spot.tags : [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
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
      const ages = spot.ageGroups || spot.age || spot.ages;
      if (Array.isArray(ages)) {
        if (!ages.includes(ageFilter)) return false;
      } else if (typeof ages === "string" && ages.trim()) {
        if (!ages.split(",").map((a) => a.trim()).includes(ageFilter)) {
          return false;
        }
      }
    }

    if (moodFilter) {
      const moods = spot.moods || spot.moodTags || [];
      if (Array.isArray(moods) && moods.length > 0) {
        if (!moods.includes(moodFilter)) return false;
      }
    }

    if (travelMode) {
      const modes = spot.travelModes || spot.travel || [];
      if (Array.isArray(modes) && modes.length > 0) {
        if (!modes.includes(travelMode)) return false;
      }
    }

    if (onlyBigAdventures) {
      const big =
        !!spot.bigAdventure || !!spot.isBigAdventure || !!spot.longTrip;
      if (!big) return false;
    }

    if (onlyVerified) {
      const verified = !!spot.verified || !!spot.isVerified;
      if (!verified) return false;
    }

    if (onlyFavorites) {
      const id = spot.id || getSpotName(spot);
      if (!favorites.has(String(id))) return false;
    }

    if (!isSpotInRadius(spot, center, radiusKm)) return false;

    return true;
  });

  renderSpotList();
  renderMarkers();

  if (tilla) {
    if (filteredSpots.length === 0) {
      if (typeof tilla.onNoSpotsFound === "function") tilla.onNoSpotsFound();
    } else if (typeof tilla.onSpotsFound === "function") {
      tilla.onSpotsFound();
    }
  }
}

function renderMarkers() {
  if (!markersLayer) return;
  markersLayer.clearLayers();

  filteredSpots.forEach((spot) => {
    if (!spot.lat || !spot.lng) return;

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

    // Routing-Links für Popup (Google & Apple)
    let routesHtml = "";
    if (spot.lat && spot.lng) {
      const lat = spot.lat;
      const lng = spot.lng;
      const encodedName = encodeURIComponent(name || "");
      const appleUrl = `https://maps.apple.com/?ll=${lat},${lng}&q=${encodedName}`;
      const googleUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

      const appleLabel =
        currentLang === "de" ? "Apple Karten" : "Apple Maps";
      const googleLabel =
        currentLang === "de" ? "Google Maps" : "Google Maps";

      routesHtml = `
        <div class="popup-actions">
          <a class="popup-link" href="${appleUrl}" target="_blank" rel="noopener noreferrer">${appleLabel}</a>
          <a class="popup-link" href="${googleUrl}" target="_blank" rel="noopener noreferrer">${googleLabel}</a>
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
      currentLang === "de"
        ? "Aktuell passt kein Spot zu euren Filtern. Probiert einen größeren Radius oder nehmt einen Filter heraus."
        : "Right now no spot matches your filters. Try a wider radius or remove one of the filters.";
    spotListEl.appendChild(msg);
    return;
  }

  filteredSpots.forEach((spot) => {
    const card = document.createElement("article");
    card.className = "spot-card";
    const spotId = String(spot.id || getSpotName(spot));
    card.dataset.spotId = spotId;

    const titleEl = document.createElement("h3");
    titleEl.className = "spot-card-title";
    titleEl.textContent = getSpotName(spot);

    const subtitleText = getSpotSubtitle(spot);
    const subtitleEl = document.createElement("p");
    subtitleEl.className = "spot-card-subtitle";
    subtitleEl.textContent = subtitleText;

    const metaEl = document.createElement("p");
    metaEl.className = "spot-card-meta";
    const parts = [];

    if (spot.category) parts.push(getCategoryLabel(spot.category));
    if (Array.isArray(spot.tags)) parts.push(spot.tags.join(", "));
    if (spot.verified) {
      parts.push(currentLang === "de" ? "verifiziert" : "verified");
    }
    if (spot.visit_minutes) {
      parts.push(
        currentLang === "de"
          ? `~${spot.visit_minutes} Min.`
          : `~${spot.visit_minutes} min`
      );
    }

    metaEl.textContent = parts.join(" · ");

    const headerRow = document.createElement("div");
    headerRow.style.display = "flex";
    headerRow.style.alignItems = "center";
    headerRow.style.justifyContent = "space-between";
    headerRow.style.gap = "8px";

    const favBtn = document.createElement("button");
    favBtn.type = "button";
    favBtn.className = "btn-ghost btn-small";
    favBtn.textContent = favorites.has(spotId) ? "★" : "☆";
    favBtn.setAttribute(
      "aria-label",
      favorites.has(spotId)
        ? currentLang === "de"
          ? "Aus Favoriten entfernen"
          : "Remove from favourites"
        : currentLang === "de"
        ? "Zu Favoriten hinzufügen"
        : "Add to favourites"
    );

    favBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      toggleFavorite(spot);
      favBtn.textContent = favorites.has(spotId) ? "★" : "☆";
    });

    headerRow.appendChild(titleEl);
    headerRow.appendChild(favBtn);

    card.appendChild(headerRow);
    if (subtitleText) card.appendChild(subtitleEl);
    if (parts.length) card.appendChild(metaEl);

    card.addEventListener("click", () => {
      focusSpotOnMap(spot);
    });

    spotListEl.appendChild(card);
  });
}

function focusSpotOnMap(spot) {
  if (!map || !spot.lat || !spot.lng) return;
  map.setView([spot.lat, spot.lng], Math.max(map.getZoom(), 13));
  showSpotDetails(spot);
}

function showSpotDetails(spot) {
  if (!spotDetailEl) return;

  const spotId = String(spot.id || getSpotName(spot));
  const isFav = favorites.has(spotId);

  const name = getSpotName(spot);
  const subtitle = getSpotSubtitle(spot);

  const metaParts = [];
  if (spot.category) metaParts.push(getCategoryLabel(spot.category));
  if (spot.verified)
    metaParts.push(currentLang === "de" ? "verifiziert" : "verified");
  if (spot.visit_minutes) {
    metaParts.push(
      currentLang === "de"
        ? `~${spot.visit_minutes} Min.`
        : `~${spot.visit_minutes} min`
    );
  }

  const tags = Array.isArray(spot.tags) ? spot.tags : [];

  let description = "";
  if (currentLang === "de") {
    description =
      spot.summary_de || spot.poetry || spot.description || spot.text || "";
  } else {
    description =
      spot.summary_en || spot.poetry || spot.description || spot.text || "";
  }

  // Adresse möglichst freundlich zusammenbauen
  const addressParts = [];
  if (spot.address) addressParts.push(spot.address);
  if (spot.postcode) addressParts.push(spot.postcode);
  if (spot.city) addressParts.push(spot.city);
  if (!addressParts.length && subtitle) addressParts.push(subtitle);
  const addressText = addressParts.join(", ");

  spotDetailEl.innerHTML = "";
  spotDetailEl.classList.remove("spot-details--hidden");

  // Header: Titel + Aktionen
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

  const favBtn = document.createElement("button");
  favBtn.type = "button";
  favBtn.className = "btn-ghost btn-small";
  favBtn.textContent = isFav ? "★" : "☆";
  favBtn.addEventListener("click", () => {
    toggleFavorite(spot);
    favBtn.textContent = favorites.has(spotId) ? "★" : "☆";
  });

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "btn-ghost btn-small";
  closeBtn.textContent = currentLang === "de" ? "Schließen" : "Close";
  closeBtn.addEventListener("click", () => {
    spotDetailEl.classList.add("spot-details--hidden");
    spotDetailEl.innerHTML = "";
  });

  actionsEl.appendChild(favBtn);
  actionsEl.appendChild(closeBtn);

  headerEl.appendChild(titleWrapperEl);
  headerEl.appendChild(actionsEl);

  // Meta-Badges
  const metaEl = document.createElement("div");
  metaEl.className = "spot-details-meta";
  metaParts.forEach((p) => {
    const span = document.createElement("span");
    span.textContent = p;
    metaEl.appendChild(span);
  });

  // Tags
  const tagsEl = document.createElement("div");
  tagsEl.className = "spot-details-tags";
  tags.forEach((tag) => {
    const span = document.createElement("span");
    span.className = "badge";
    span.textContent = tag;
    tagsEl.appendChild(span);
  });

  // Beschreibung
  if (description) {
    const descEl = document.createElement("p");
    descEl.className = "spot-details-description";
    descEl.textContent = description;
    spotDetailEl.appendChild(descEl);
  }

  // Adresse
  if (addressText) {
    const addrEl = document.createElement("p");
    addrEl.className = "spot-details-address";
    addrEl.textContent = addressText;
    spotDetailEl.appendChild(addrEl);
  }

  // Routen-Buttons (Apple / Google)
  if (spot.lat && spot.lng) {
    const routesEl = document.createElement("div");
    routesEl.className = "spot-details-routes";

    const lat = spot.lat;
    const lng = spot.lng;
    const encodedName = encodeURIComponent(name || "");

    const appleUrl = `https://maps.apple.com/?ll=${lat},${lng}&q=${encodedName}`;
    const googleUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    const appleLink = document.createElement("a");
    appleLink.href = appleUrl;
    appleLink.target = "_blank";
    appleLink.rel = "noopener noreferrer";
    appleLink.className = "spot-details-route-link";
    appleLink.textContent = t("route_apple");

    const googleLink = document.createElement("a");
    googleLink.href = googleUrl;
    googleLink.target = "_blank";
    googleLink.rel = "noopener noreferrer";
    googleLink.className = "spot-details-route-link";
    googleLink.textContent = t("route_google");

    routesEl.appendChild(appleLink);
    routesEl.appendChild(googleLink);

    spotDetailEl.appendChild(routesEl);
  }

  // Jetzt Header / Meta / Tags ganz nach oben einfügen
  spotDetailEl.insertBefore(metaEl, spotDetailEl.firstChild);
  spotDetailEl.insertBefore(headerEl, spotDetailEl.firstChild);
  if (tags.length) {
    spotDetailEl.appendChild(tagsEl);
  }
}

// ------------------------------------------------------
// Favoriten
// ------------------------------------------------------
function toggleFavorite(spot) {
  const spotId = String(spot.id || getSpotName(spot));

  if (favorites.has(spotId)) {
    favorites.delete(spotId);
    saveFavoritesToStorage();
    showToast("toast_fav_removed");
    if (tilla && typeof tilla.onFavoriteRemoved === "function") {
      tilla.onFavoriteRemoved();
    }
  } else {
    favorites.add(spotId);
    saveFavoritesToStorage();
    showToast("toast_fav_added");
    if (tilla && typeof tilla.onFavoriteAdded === "function") {
      tilla.onFavoriteAdded();
    }
  }

  renderSpotList();
}

// ------------------------------------------------------
// Radius-Helfer
// ------------------------------------------------------
function updateRadiusTexts() {
  if (!filterRadiusEl || !filterRadiusMaxLabelEl || !filterRadiusDescriptionEl)
    return;

  const value = parseInt(filterRadiusEl.value, 10);
  radiusStep = isNaN(value) ? 4 : value;

  // ARIA für Screenreader aktuell halten
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
// Kompass
// ------------------------------------------------------

// Button-Label des Kompasses an den aktuellen Zustand anpassen
function updateCompassButtonLabel() {
  if (!btnToggleCompassEl || !compassSectionEl) return;
  const span = btnToggleCompassEl.querySelector("span");
  if (!span) return;
  const isOpen = !!compassSectionEl.open;
  span.textContent = isOpen
    ? t("btn_hide_compass")
    : t("btn_show_compass");

  // A11y: expanded-Status pflegen
  btnToggleCompassEl.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

// Sichtbarkeit des "Kompass anwenden"-Buttons an den Reise-Modus koppeln
function updateCompassUI() {
  if (!compassApplyBtnEl) return;
  const shouldShow = !!travelMode;
  compassApplyBtnEl.classList.toggle("hidden", !shouldShow);
}

function handleCompassApply() {
  if (!filterRadiusEl) return;

  // Logik: Alltag = kleiner Radius, Unterwegs = großer Radius
  if (travelMode === "everyday" || !travelMode) {
    radiusStep = 1;
  } else {
    radiusStep = 3;
  }

  filterRadiusEl.value = String(radiusStep);
  updateRadiusTexts();
  applyFiltersAndRender();

  if (tilla && typeof tilla.onCompassApplied === "function") {
    tilla.onCompassApplied({ travelMode, radiusStep });
  }
}

function handleToggleCompass() {
  if (!compassSectionEl) return;
  const isOpen = !!compassSectionEl.open;
  compassSectionEl.open = !isOpen;
  updateCompassButtonLabel();
}

// ------------------------------------------------------
// Plus-Code
// ------------------------------------------------------
function handlePlusCodeSubmit() {
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

  plusActive = true;
  showToast("plus_code_activated");

  plusStatusTextEl.textContent =
    currentLang === "de"
      ? "Family Spots Plus ist aktiv – zusätzliche Kategorien sind freigeschaltet."
      : "Family Spots Plus is active – additional categories have been unlocked.";

  if (tilla && typeof tilla.onPlusActivated === "function") {
    tilla.onPlusActivated();
  }

  applyFiltersAndRender();
}

// ------------------------------------------------------
// Mein Tag
// ------------------------------------------------------
function handleDaylogSave() {
  if (!daylogTextEl) return;
  const text = daylogTextEl.value.trim();
  if (!text) return;

  const payload = {
    text,
    ts: Date.now()
  };

  try {
    localStorage.setItem("fs_daylog_last", JSON.stringify(payload));
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

  // Sichtbarkeit hart über display steuern
  viewMapEl.classList.toggle("view--active", showMap);
  viewAboutEl.classList.toggle("view--active", !showMap);

  // Fallback: zusätzlich direkt display setzen (unabhängig von CSS)
  viewMapEl.style.display = showMap ? "block" : "none";
  viewAboutEl.style.display = showMap ? "none" : "block";

  // A11y & aktiver Button
  bottomNavButtons.forEach((btn) => {
    const btnRoute = btn.getAttribute("data-route");
    const isActive = btnRoute === route || (showMap && btnRoute === "map");
    btn.classList.toggle("bottom-nav-item--active", isActive);
    btn.setAttribute("aria-current", isActive ? "page" : "false");
  });

  // Beim Wechsel an den Anfang scrollen, damit der neue View wirklich im Sichtfeld ist
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ------------------------------------------------------
// Filter-Umschalter
// ------------------------------------------------------
function handleToggleFilters() {
  if (!btnToggleFiltersEl || !filterBodyEls.length) return;

  filtersCollapsed = !filtersCollapsed;
  const isExpanded = !filtersCollapsed;

  filterBodyEls.forEach((el) => {
    el.classList.toggle("hidden", filtersCollapsed);
  });

  btnToggleFiltersEl
    .querySelector("span")
    .textContent = filtersCollapsed
      ? t("btn_show_filters")
      : t("btn_hide_filters");

  // A11y: expanded-Status pflegen
  btnToggleFiltersEl.setAttribute("aria-expanded", isExpanded ? "true" : "false");
}

function handleToggleView() {
  if (!sidebarEl || !btnToggleViewEl) return;
  const isHidden = sidebarEl.classList.toggle("hidden");
  btnToggleViewEl
    .querySelector("span")
    .textContent = isHidden ? t("btn_show_list") : t("btn_only_map");

  // A11y: Toggle-Button als gedrückt markieren, wenn Sidebar versteckt ist
  btnToggleViewEl.setAttribute("aria-pressed", isHidden ? "true" : "false");

  if (map) {
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }
}

// ------------------------------------------------------
// Initialisierung
// ------------------------------------------------------
function init() {
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
    // Start: Filter eingeklappt
    filtersCollapsed = true;
    filterBodyEls.forEach((el) => el.classList.add("hidden"));
  }

  btnToggleFiltersEl = document.getElementById("btn-toggle-filters");
  btnToggleViewEl = document.getElementById("btn-toggle-view");

  // Spielideen-Button (🎲)
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

  // ARIA-Grundzustand der Filter/Kompass-Toggles
  if (btnToggleFiltersEl && filterSectionEl && filterSectionEl.id) {
    btnToggleFiltersEl.setAttribute("aria-controls", filterSectionEl.id);
    btnToggleFiltersEl.setAttribute("aria-expanded", "false");
  }
  if (btnToggleCompassEl && compassSectionEl && compassSectionEl.id) {
    btnToggleCompassEl.setAttribute("aria-controls", compassSectionEl.id);
    btnToggleCompassEl.setAttribute("aria-expanded", "false");
  }

  // Kompass beim Start einklappen
  if (compassSectionEl) {
    compassSectionEl.open = false;
  }

  // Sprache / Theme / Map
  const initialLang = getInitialLang();
  setLanguage(initialLang, { initial: true });

  const initialTheme = getInitialTheme();
  setTheme(initialTheme);

  initMap();

  // Map-Klick schließt unser Detail-Panel
  if (map && spotDetailEl) {
    map.on("click", () => {
      spotDetailEl.classList.add("spot-details--hidden");
      spotDetailEl.innerHTML = "";
    });
  }

  // Tilla
  tilla = new TillaCompanion({
    getText: (key) => t(key)
  });

  // Events – Sprache (Toggle via Button)
  if (languageSwitcherEl) {
    languageSwitcherEl.addEventListener("click", () => {
      const nextLang = currentLang === "de" ? "en" : "de";
      setLanguage(nextLang);
    });
  }

  if (themeToggleEl) {
    themeToggleEl.addEventListener("click", () => {
      setTheme(currentTheme === "light" ? "dark" : "light");
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

  if (bottomNavButtons && bottomNavButtons.length) {
    bottomNavButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const route = btn.getAttribute("data-route") || "map";
        switchRoute(route);
      });
    });
  }

  if (filterSearchEl) {
    filterSearchEl.addEventListener("input", (e) => {
      searchTerm = e.target.value.trim();
      applyFiltersAndRender();
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
    // ARIA-Basiswerte setzen
    filterRadiusEl.setAttribute("aria-valuemin", "0");
    filterRadiusEl.setAttribute("aria-valuemax", "4");
    filterRadiusEl.setAttribute(
      "aria-valuenow",
      filterRadiusEl.value || "4"
    );

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
  if (filterFavoritesEl) {
    filterFavoritesEl.addEventListener("change", (e) => {
      onlyFavorites = e.target.checked;
      applyFiltersAndRender();
    });
  }

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

      // Kompass-UI aktualisieren (Button ein/ausblenden)
      updateCompassUI();
      applyFiltersAndRender();
    });
  });

  if (btnToggleFiltersEl) {
    btnToggleFiltersEl.addEventListener("click", handleToggleFilters);
    btnToggleFiltersEl.querySelector("span").textContent = t("btn_show_filters");
  }

  if (btnToggleViewEl) {
    btnToggleViewEl.addEventListener("click", handleToggleView);
    btnToggleViewEl.querySelector("span").textContent = t("btn_only_map");
    // Initialer ARIA-Zustand
    btnToggleViewEl.setAttribute("aria-pressed", "false");
  }

  if (btnToggleCompassEl && compassSectionEl) {
    // Klick direkt auf dem Button, ohne das native Summary-Verhalten doppelt auszulösen
    btnToggleCompassEl.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleToggleCompass();
    });

    // Wenn per Klick auf den Summary-Bereich getoggelt wird, Label aktualisieren
    compassSectionEl.addEventListener("toggle", updateCompassButtonLabel);

    updateCompassButtonLabel();
  }

  if (plusCodeSubmitEl) {
    plusCodeSubmitEl.addEventListener("click", handlePlusCodeSubmit);
  }

  if (daylogSaveEl) {
    daylogSaveEl.addEventListener("click", handleDaylogSave);
  }

  if (compassApplyBtnEl) {
    compassApplyBtnEl.addEventListener("click", handleCompassApply);
  }

  // 🎲 Spielideen-Button -> Text in Tilla anzeigen
  if (playIdeasBtnEl) {
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
        // Fallback, falls Tilla aus irgendeinem Grund nicht aktiv ist
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

      // Wenn der Kompass geschlossen wird, Button-Label anpassen
      if (section.id === "compass-section" && btnToggleCompassEl) {
        updateCompassButtonLabel();
      }
    });
  });

  // Startzustand des Kompass-UI (Button ausgeblendet, bis Modus gewählt)
  updateCompassUI();

  switchRoute("map");
  loadSpots();
}

document.addEventListener("DOMContentLoaded", init);