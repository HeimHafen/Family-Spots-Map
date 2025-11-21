// js/app.js
// ======================================================
// Family Spots Map – Hauptlogik (Map, Filter, Tilla, UI)
// ======================================================

import { TillaCompanion } from "./tilla.js";

// ------------------------------------------------------
// Sprach-Tabelle (DE / EN) – inkl. Kompass & Toasts
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

    // Mein Tag
    daylog_saved:
      "Dein Tagesmoment ist gespeichert 💾 – später könnt ihr euch daran erinnern.",

    // Header / Navigation (dynamisch)
    header_tagline: "Heute ist Familientag.",
    nav_map: "Karte",
    nav_about: "Über",

    // Familien-Kompass
    compass_title: "Familien-Kompass",
    compass_helper:
      "Keine Lust auf lange Planung? Ich helfe euch, den Radius passend zu heute zu wählen – Alltag oder Unterwegs-Modus.",
    compass_apply_label: "Kompass anwenden"
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

    daylog_saved:
      "Your day moment has been saved 💾 – you can look back on it later.",

    header_tagline: "Make today a family day.",
    nav_map: "Map",
    nav_about: "About",

    compass_title: "Family Compass",
    compass_helper:
      "Don’t feel like long planning today? I’ll help you pick a fitting radius – everyday mode or travel mode.",
    compass_apply_label: "Apply compass"
  }
};

// Kategorien lesbarer machen
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

// Master-Liste aller Kategorien (auch wenn noch 0 Spots)
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
let filtersCollapsed = false;

// DOM-Elemente (werden in init() gesetzt)
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
let compassLabelEl;
let compassHelperEl;
let compassApplyLabelEl;
let compassApplyBtnEl;

// Tilla
let tilla = null;

// Filter-Body innerhalb der Filter-Section (alles außer Header)
let filterBodyEls = [];

// Radius-Stufen (km)
const RADIUS_STEPS_KM = [1, 5, 15, 40, Infinity];

// ------------------------------------------------------
// Utility: Sprache & Übersetzung
// ------------------------------------------------------
function getInitialLang() {
  const stored = localStorage.getItem("fs_lang");
  if (stored === "de" || stored === "en") {
    return stored;
  }

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
  // Fallback: _ → Leerzeichen
  return slug.replace(/_/g, " ");
}

// statische Texte im HTML über data-i18n-* setzen
function applyStaticI18n() {
  document.querySelectorAll("[data-i18n-de]").forEach((el) => {
    const key = currentLang === "de" ? "i18n-de" : "i18n-en";
    const text = el.getAttribute(`data-${key}`);
    if (text) {
      el.textContent = text;
    }
  });
}

function setLanguage(lang, { initial = false } = {}) {
  currentLang = lang === "en" ? "en" : "de";
  localStorage.setItem("fs_lang", currentLang);
  document.documentElement.lang = currentLang;
  if (languageSwitcherEl) {
    languageSwitcherEl.value = currentLang;
  }

  // Header-Slogan
  if (headerTaglineEl) {
    headerTaglineEl.textContent = t("header_tagline");
  }

  // Bottom-Nav Texte
  if (bottomNavMapLabelEl) {
    bottomNavMapLabelEl.textContent = t("nav_map");
  }
  if (bottomNavAboutLabelEl) {
    bottomNavAboutLabelEl.textContent = t("nav_about");
  }

  // Kompass-Texte
  if (compassLabelEl) {
    compassLabelEl.textContent = t("compass_title");
  }
  if (compassHelperEl) {
    compassHelperEl.textContent = t("compass_helper");
  }
  if (compassApplyLabelEl) {
    compassApplyLabelEl.textContent = t("compass_apply_label");
  }

  // Filter-Buttons
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

  // Such-Placeholder dynamisch setzen
  if (filterSearchEl) {
    filterSearchEl.placeholder =
      currentLang === "de"
        ? "Ort, Spot, Stichwörter …"
        : "Place, spot, keywords …";
  }

  // Radius-Texte
  updateRadiusTexts();

  // Kategorie-Placeholder
  if (filterCategoryEl) {
    const firstOption = filterCategoryEl.querySelector("option[value='']");
    if (firstOption) {
      firstOption.textContent = t("filter_category_all");
    }
  }

  // Kategorien-Optionen neu mit lokalisierter Beschriftung befüllen
  if (filterCategoryEl) {
    populateCategoryOptions();
  }

  // Tilla informieren
  if (!initial && tilla && typeof tilla.onLanguageChanged === "function") {
    tilla.onLanguageChanged();
  }

  // statische Texte im HTML aktualisieren
  applyStaticI18n();
}

// ------------------------------------------------------
// Utility: Theme
// ------------------------------------------------------
function getInitialTheme() {
  const stored = localStorage.getItem("fs_theme");
  if (stored === "light" || stored === "dark") return stored;
  return "light";
}

function setTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";
  localStorage.setItem("fs_theme", currentTheme);
  document.documentElement.setAttribute("data-theme", currentTheme);
}

// ------------------------------------------------------
// Utility: Toast
// ------------------------------------------------------
let toastTimeoutId = null;

function showToast(keyOrMessage) {
  if (!toastEl) return;

  const message =
    UI_STRINGS[currentLang][keyOrMessage] || keyOrMessage || "…";

  toastEl.textContent = message;
  toastEl.classList.add("toast--visible");

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }

  toastTimeoutId = setTimeout(() => {
    toastEl.classList.remove("toast--visible");
  }, 3200);
}

// ------------------------------------------------------
// Map / Spots
// ------------------------------------------------------
function initMap() {
  map = L.map("map", {
    center: [52.4, 9.7], // grob Region Hannover
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

    // Normalisieren: lon -> lng, erste Kategorie als category
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

    // Favoriten aus localStorage laden
    loadFavoritesFromStorage();

    // Kategorien-Dropdown befüllen
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
    if (Array.isArray(arr)) {
      favorites = new Set(arr);
    }
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
  // Stadt + Land bevorzugen, sonst Adresse, sonst Kurztexte
  if (spot.city && spot.country) return `${spot.city}, ${spot.country}`;
  if (spot.city) return spot.city;
  if (spot.town && spot.country) return `${spot.town}, ${spot.country}`;
  if (spot.address) return spot.address;

  return spot.subtitle || spot.shortDescription || "";
}

// Kategorien ins Dropdown schreiben (Master-Liste + tatsächlich vorkommende)
function populateCategoryOptions() {
  if (!filterCategoryEl) return;

  const firstOption =
    filterCategoryEl.querySelector("option[value='']") ||
    document.createElement("option");
  firstOption.value = "";
  firstOption.textContent = t("filter_category_all");

  const catSet = new Set(MASTER_CATEGORY_SLUGS);

  // zusätzlich alles, was in den Spots vorkommt
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

  // aktuellen Filterwert erhalten
  filterCategoryEl.value = categoryFilter || "";
}

// Hilfsfunktion: Entfernungsfilter (Radius)
function isSpotInRadius(spot, centerLatLng, radiusKm) {
  if (!map || !spot.lat || !spot.lng || !isFinite(radiusKm)) return true;
  if (radiusKm === Infinity) return true;

  const spotLatLng = L.latLng(spot.lat, spot.lng);
  const distanceMeters = centerLatLng.distanceTo(spotLatLng);
  const distanceKm = distanceMeters / 1000;
  return distanceKm <= radiusKm;
}

// Haupt-Filterfunktion
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
    // Plus-Spots nur anzeigen, wenn Plus aktiv ODER Spot nicht explizit plus-only ist
    const plusOnly = !!spot.plusOnly || !!spot.plus;
    if (plusOnly && !plusActive) return false;

    // Suche (Name, Untertitel, Kategorie, Tags)
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

    // Kategorie
    if (categoryFilter) {
      const filterSlug = String(categoryFilter);
      const categories = [];

      if (Array.isArray(spot.categories)) {
        categories.push(...spot.categories.map(String));
      } else if (spot.category || spot.type) {
        categories.push(String(spot.category || spot.type));
      }

      if (
        !categories.some((c) => {
          return c === filterSlug;
        })
      ) {
        return false;
      }
    }

    // Alter (wenn der Spot Angaben hat – ansonsten nicht filtern)
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

    // Stimmung
    if (moodFilter) {
      const moods = spot.moods || spot.moodTags || [];
      if (Array.isArray(moods) && moods.length > 0) {
        if (!moods.includes(moodFilter)) return false;
      }
    }

    // Reise-Modus
    if (travelMode) {
      const modes = spot.travelModes || spot.travel || [];
      if (Array.isArray(modes) && modes.length > 0) {
        if (!modes.includes(travelMode)) return false;
      }
    }

    // Nur große Abenteuer
    if (onlyBigAdventures) {
      const big =
        !!spot.bigAdventure || !!spot.isBigAdventure || !!spot.longTrip;
      if (!big) return false;
    }

    // Nur verifizierte
    if (onlyVerified) {
      const verified = !!spot.verified || !!spot.isVerified;
      if (!verified) return false;
    }

    // Nur Favoriten
    if (onlyFavorites) {
      const id = spot.id || getSpotName(spot);
      if (!favorites.has(String(id))) return false;
    }

    // Radius
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

    const popupHtml = `
      <div class="popup">
        <strong>${name}</strong><br/>
        <small>${subtitle || ""}</small>
      </div>
    `;

    marker.bindPopup(popupHtml);

    marker.on("click", () => {
      showSpotDetails(spot);
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

    if (spot.category) {
      parts.push(getCategoryLabel(spot.category));
    }
    if (Array.isArray(spot.tags)) {
      parts.push(spot.tags.join(", "));
    }
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
  const categoryLabel = spot.category ? getCategoryLabel(spot.category) : "";

  // Meta-Chips (Dauer, Alter, verifiziert …)
  const metaChips = [];

  // Besuchsdauer
  if (spot.visit_minutes) {
    const durationText =
      currentLang === "de"
        ? `⏱ ~${spot.visit_minutes} Min.`
        : `⏱ ~${spot.visit_minutes} min`;
    metaChips.push(durationText);
  }

  // Altersgruppen (falls vorhanden)
  const agesRaw = spot.ageGroups || spot.age || spot.ages;
  let ageCodes = [];
  if (Array.isArray(agesRaw)) {
    ageCodes = agesRaw;
  } else if (typeof agesRaw === "string" && agesRaw.trim()) {
    ageCodes = agesRaw.split(",").map((a) => a.trim());
  }

  if (ageCodes.length) {
    const ageText = ageCodes
      .map((code) => {
        if (currentLang === "de") {
          if (code === "0-3") return "0–3 Jahre";
          if (code === "4-9") return "4–9 Jahre";
          if (code === "10+") return "10+ Jahre";
          return code;
        } else {
          if (code === "0-3") return "0–3 yrs";
          if (code === "4-9") return "4–9 yrs";
          if (code === "10+") return "10+ yrs";
          return code;
        }
      })
      .join(", ");

    metaChips.push(
      (currentLang === "de" ? "👶 Alter: " : "👶 Age: ") + ageText
    );
  }

  // Verifiziert
  if (spot.verified) {
    metaChips.push(currentLang === "de" ? "✅ verifiziert" : "✅ verified");
  }

  // Tags / USPs
  const tagChips = [];
  if (Array.isArray(spot.tags)) {
    spot.tags.forEach((tag) => {
      if (tag && tagChips.length < 8) {
        tagChips.push(tag);
      }
    });
  }
  if (Array.isArray(spot.usps)) {
    spot.usps.forEach((u) => {
      if (u && tagChips.length < 12 && !tagChips.includes(u)) {
        tagChips.push(u);
      }
    });
  }

  // Beschreibung aus summary_* oder poetry ziehen
  let description = "";
  if (currentLang === "de") {
    description =
      spot.summary_de || spot.poetry || spot.description || spot.text || "";
  } else {
    description =
      spot.summary_en || spot.poetry || spot.description || spot.text || "";
  }

  // Maps-Link
  let mapsUrl = "";
  if (spot.lat && spot.lng) {
    const lat = String(spot.lat);
    const lng = String(spot.lng);
    mapsUrl =
      "https://www.google.com/maps?q=" +
      encodeURIComponent(lat + "," + lng);
  }

  const mapsLabel =
    currentLang === "de" ? "In Karten-App öffnen" : "Open in maps";
  const closeLabel =
    currentLang === "de" ? "Details schließen" : "Close details";

  const metaHtml = metaChips
    .map(
      (chip) =>
        `<span class="spot-detail-meta-chip">${chip}</span>`
    )
    .join("");

  const tagsHtml = tagChips.length
    ? `<div class="spot-detail-tags">
         ${tagChips
           .map(
             (tag) => `<span class="spot-detail-tag">${tag}</span>`
           )
           .join("")}
       </div>`
    : "";

  const mapsButtonHtml = mapsUrl
    ? `<a class="btn btn-small spot-detail-maplink" href="${mapsUrl}" target="_blank" rel="noopener noreferrer">${mapsLabel}</a>`
    : "";

  spotDetailEl.innerHTML = `
    <article class="spot-detail-card">
      <header class="spot-detail-header">
        <div class="spot-detail-title-block">
          ${
            categoryLabel
              ? `<p class="spot-detail-category">${categoryLabel}</p>`
              : ""
          }
          <h3 class="spot-detail-title">${name}</h3>
          ${
            subtitle
              ? `<p class="spot-detail-location">${subtitle}</p>`
              : ""
          }
        </div>
        <div class="spot-detail-header-actions">
          <button
            type="button"
            class="spot-detail-fav-btn"
            aria-label="${
              isFav
                ? currentLang === "de"
                  ? "Aus Favoriten entfernen"
                  : "Remove from favourites"
                : currentLang === "de"
                ? "Zu Favoriten hinzufügen"
                : "Add to favourites"
            }"
          >
            ${isFav ? "★" : "☆"}
          </button>
          <button
            type="button"
            class="spot-detail-close"
            aria-label="${closeLabel}"
          >
            ×
          </button>
        </div>
      </header>

      ${
        metaChips.length
          ? `<div class="spot-detail-meta-row">${metaHtml}</div>`
          : ""
      }

      ${tagsHtml}

      ${
        description
          ? `<p class="spot-detail-description">${description}</p>`
          : ""
      }

      ${
        mapsButtonHtml
          ? `<footer class="spot-detail-footer">${mapsButtonHtml}</footer>`
          : ""
      }
    </article>
  `;

  spotDetailEl.classList.remove("spot-details--hidden");

  const favBtn = spotDetailEl.querySelector(".spot-detail-fav-btn");
  if (favBtn) {
    favBtn.addEventListener("click", () => {
      toggleFavorite(spot);
      const nowFav = favorites.has(spotId);
      favBtn.textContent = nowFav ? "★" : "☆";
      favBtn.setAttribute(
        "aria-label",
        nowFav
          ? currentLang === "de"
            ? "Aus Favoriten entfernen"
            : "Remove from favourites"
          : currentLang === "de"
          ? "Zu Favoriten hinzufügen"
          : "Add to favourites"
      );
    });
  }

  const closeBtn = spotDetailEl.querySelector(".spot-detail-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      spotDetailEl.classList.add("spot-details--hidden");
    });
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

  // Liste neu malen, damit Sternchen überall stimmt
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
function handleCompassApply() {
  if (!filterRadiusEl) return;

  // Basis: aktueller Reise-Modus oder Alltag
  const mode = travelMode || "everyday";
  const mood = moodFilter || null;

  let newRadiusStep;

  if (mode === "trip") {
    // Unterwegs-Tag
    if (mood === "relaxed") {
      // Unterwegs, aber entspannt → mittlerer Radius
      newRadiusStep = 2; // ~15 km
    } else if (mood === "water" || mood === "animals" || mood === "action") {
      // Auf Tour + Abenteuerlust → großer Radius
      newRadiusStep = 3; // ~40 km
    } else {
      // Neutral unterwegs → groß
      newRadiusStep = 3;
    }
  } else {
    // Alltag / kein Modus
    if (mood === "relaxed") {
      // Ganz bewusst klein & nah
      newRadiusStep = 0; // ~1 km
    } else if (mood === "water" || mood === "animals") {
      // Für Wasser & Tiere darf es ein bisschen weiter sein
      newRadiusStep = 2; // ~15 km
    } else if (mood === "action") {
      // Action, aber trotzdem Alltag → mittlerer Radius
      newRadiusStep = 2; // ~15 km
    } else {
      // Standard-Alltag → in der Nähe, aber nicht ultra-klein
      newRadiusStep = 1; // ~5 km
    }
  }

  radiusStep = newRadiusStep;
  filterRadiusEl.value = String(radiusStep);
  updateRadiusTexts();
  applyFiltersAndRender();

  // Tilla kommentiert die Kompass-Wahl
  if (tilla && typeof tilla.onCompassApplied === "function") {
    tilla.onCompassApplied({ travelMode, mood: moodFilter, radiusStep });
  }
}

// ------------------------------------------------------
// Plus-Code (ohne Backend – Demo-Logik)
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
  if (!text) {
    return;
  }

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

  if (route === "about") {
    viewMapEl.classList.remove("view--active");
    viewAboutEl.classList.add("view--active");
  } else {
    viewAboutEl.classList.remove("view--active");
    viewMapEl.classList.add("view--active");
  }

  bottomNavButtons.forEach((btn) => {
    const btnRoute = btn.getAttribute("data-route");
    if (btnRoute === route) {
      btn.classList.add("bottom-nav-item--active");
    } else {
      btn.classList.remove("bottom-nav-item--active");
    }
  });
}

// ------------------------------------------------------
// Filter-Umschalter
// ------------------------------------------------------
function handleToggleFilters() {
  if (!btnToggleFiltersEl || !filterBodyEls.length) return;

  filtersCollapsed = !filtersCollapsed;

  filterBodyEls.forEach((el) => {
    el.classList.toggle("hidden", filtersCollapsed);
  });

  btnToggleFiltersEl
    .querySelector("span")
    .textContent = filtersCollapsed
      ? t("btn_show_filters")
      : t("btn_hide_filters");
}

function handleToggleView() {
  if (!sidebarEl || !btnToggleViewEl) return;
  const isHidden = sidebarEl.classList.toggle("hidden");
  btnToggleViewEl
    .querySelector("span")
    .textContent = isHidden
      ? t("btn_show_list")
      : t("btn_only_map");

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
  // DOM-Elemente einsammeln
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
  }

  btnToggleFiltersEl = document.getElementById("btn-toggle-filters");
  btnToggleViewEl = document.getElementById("btn-toggle-view");

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
  compassLabelEl = document.getElementById("compass-label");
  compassHelperEl = document.getElementById("compass-helper");
  compassApplyLabelEl = document.getElementById("compass-apply-label");
  compassApplyBtnEl = document.getElementById("compass-apply");

  // Sprache
  const initialLang = getInitialLang();
  setLanguage(initialLang, { initial: true });

  // Theme
  const initialTheme = getInitialTheme();
  setTheme(initialTheme);

  // Map initialisieren
  initMap();

  // Tilla initialisieren
  tilla = new TillaCompanion({
    getText: (key) => t(key)
  });

  // Events – Sprache
  if (languageSwitcherEl) {
    languageSwitcherEl.addEventListener("change", (e) => {
      setLanguage(e.target.value);
    });
  }

  // Theme-Toggle
  if (themeToggleEl) {
    themeToggleEl.addEventListener("click", () => {
      setTheme(currentTheme === "light" ? "dark" : "light");
    });
  }

  // Locate
  if (btnLocateEl) {
    btnLocateEl.addEventListener("click", handleLocateClick);
  }

  // Help → zur About-View springen
  if (btnHelpEl) {
    btnHelpEl.addEventListener("click", () => {
      switchRoute("about");
    });
  }

  // Bottom-Nav
  if (bottomNavButtons && bottomNavButtons.length) {
    bottomNavButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const route = btn.getAttribute("data-route") || "map";
        switchRoute(route);
      });
    });
  }

  // Filter – Suche
  if (filterSearchEl) {
    filterSearchEl.addEventListener("input", (e) => {
      searchTerm = e.target.value.trim();
      applyFiltersAndRender();
    });
  }

  // Filter – Kategorie
  if (filterCategoryEl) {
    filterCategoryEl.addEventListener("change", (e) => {
      categoryFilter = e.target.value;
      applyFiltersAndRender();
    });
  }

  // Filter – Alter
  if (filterAgeEl) {
    filterAgeEl.addEventListener("change", (e) => {
      ageFilter = e.target.value;
      applyFiltersAndRender();
    });
  }

  // Filter – Radius
  if (filterRadiusEl) {
    filterRadiusEl.addEventListener("input", () => {
      updateRadiusTexts();
      applyFiltersAndRender();
    });
    updateRadiusTexts();
  }

  // Filter – Checkboxen
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

  // Stimmung-Chips
  document.querySelectorAll(".mood-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const value = chip.getAttribute("data-mood");
      if (moodFilter === value) {
        moodFilter = null;
        chip.classList.remove("mood-chip--active");
      } else {
        moodFilter = value;
        document
          .querySelectorAll(".mood-chip")
          .forEach((c) => c.classList.remove("mood-chip--active"));
        chip.classList.add("mood-chip--active");
      }
      applyFiltersAndRender();
    });
  });

  // Reise-Modus-Chips (mit "alles aus"-Möglichkeit)
  document.querySelectorAll(".travel-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const mode = chip.getAttribute("data-travel-mode") || "everyday";

      if (travelMode === mode) {
        // ausschalten
        travelMode = null;
        chip.classList.remove("travel-chip--active");
        if (tilla && typeof tilla.setTravelMode === "function") {
          tilla.setTravelMode(null);
        }
      } else {
        travelMode = mode;
        document.querySelectorAll(".travel-chip").forEach((c) => {
          c.classList.toggle("travel-chip--active", c === chip);
        });
        if (tilla && typeof tilla.setTravelMode === "function") {
          tilla.setTravelMode(mode);
        }
      }

      applyFiltersAndRender();
    });
  });

  // Filter-Umschalter
  if (btnToggleFiltersEl) {
    btnToggleFiltersEl.addEventListener("click", handleToggleFilters);
    btnToggleFiltersEl.querySelector("span").textContent = t("btn_hide_filters");
  }

  // View-Umschalter (Liste/Karte)
  if (btnToggleViewEl) {
    btnToggleViewEl.addEventListener("click", handleToggleView);
    btnToggleViewEl.querySelector("span").textContent = t("btn_only_map");
  }

  // Plus-Code
  if (plusCodeSubmitEl) {
    plusCodeSubmitEl.addEventListener("click", handlePlusCodeSubmit);
  }

  // Mein Tag
  if (daylogSaveEl) {
    daylogSaveEl.addEventListener("click", handleDaylogSave);
  }

  // Kompass
  if (compassApplyBtnEl) {
    compassApplyBtnEl.addEventListener("click", handleCompassApply);
  }

  // Close-Buttons (X) in Sidebar-Sections, z.B. Kompass, Plus, Mein Tag
  document.querySelectorAll(".sidebar-section-close").forEach((btn) => {
    const targetId = btn.getAttribute("data-target");
    let section = null;
    if (targetId) {
      section = document.getElementById(targetId);
    }
    if (!section) {
      section = btn.closest(".sidebar-section");
    }
    if (!section) return;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const tag = section.tagName.toLowerCase();
      if (tag === "details") {
        section.open = false;
      } else {
        section.classList.add("hidden");
      }
    });
  });

  // Initiales Route
  switchRoute("map");

  // Daten laden
  loadSpots();
}

// Start
document.addEventListener("DOMContentLoaded", init);