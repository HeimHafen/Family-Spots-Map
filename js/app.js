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

function get