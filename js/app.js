// ======================================================
// Family Spots Map – Hauptlogik (Refactored for filters.js)
// ======================================================

"use strict";

import "./i18n.js";
import { TillaCompanion } from "./tilla.js";
import { initFilters, applyFilters, refreshCategorySelect } from "./filters.js";

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
// Globale State-Variablen
// ------------------------------------------------------
let currentLang = LANG_DE;
let currentTheme = THEME_LIGHT;

let map;
let markersLayer;
let spots = [];
let filteredSpots = [];
let favorites = new Set();
let filterState = null;  // <-- NEU: zentraler Filterzustand

// Tilla
let tilla = null;

// DOM-Elemente
let languageSwitcherEl;
let themeToggleEl;
let btnLocateEl;
let btnHelpEl;
let spotListEl;
let spotDetailEl;

// ------------------------------------------------------
// Sprache, Theme, Toasts (unverändert)
// ------------------------------------------------------
function getInitialLang() { /* ... bleibt wie gehabt ... */ }
function setTheme(theme) { /* ... bleibt wie gehabt ... */ }
function showToast(msg) { /* ... bleibt wie gehabt ... */ }
function t(key) { /* ... bleibt wie gehabt ... */ }

// ------------------------------------------------------
// Leaflet Map Initialisierung
// ------------------------------------------------------
function initMap() {
  if (typeof L === "undefined") return;
  map = L.map("map", { center: DEFAULT_MAP_CENTER, zoom: DEFAULT_MAP_ZOOM, zoomControl: false });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
  markersLayer = typeof L.markerClusterGroup === "function" 
    ? L.markerClusterGroup() 
    : L.layerGroup();
  map.addLayer(markersLayer);
}

// ------------------------------------------------------
// Spots laden (WICHTIG: jetzt mit applyFilters())
// ------------------------------------------------------
async function loadSpots() {
  try {
    const res = await fetch("data/spots.json", { cache: "no-cache" });
    const data = await res.json();
    spots = (Array.isArray(data) ? data : data.spots || []).map((spot) => ({
      ...spot,
      _searchText: buildSpotSearchText(spot),
    }));

    loadFavoritesFromStorage();
    applyNewFiltering(); // <--- ZENTRAL
  } catch (err) {
    console.error("Fehler beim Laden der Spots:", err);
  }
}

// ------------------------------------------------------
// Neues Filtersystem anwenden  🔥
// ------------------------------------------------------
function applyNewFiltering() {
  if (!spots.length || !filterState) return;

  const mapCenter = map?.getCenter();
  filteredSpots = applyFilters(spots, {
    ...filterState,
    mapCenter: mapCenter ? { lat: mapCenter.lat, lng: mapCenter.lng } : null
  });

  renderSpotList();
  renderMarkers();

  if (tilla) {
    if (!filteredSpots.length) tilla.onNoSpotsFound?.();
    else tilla.onSpotsFound?.();
  }
}

// ------------------------------------------------------
// Spot-Liste & Marker (UNVERÄNDERT)
// ------------------------------------------------------
function renderMarkers() { /* ... bleibt so wie du es schon hattest ... */ }
function renderSpotList()   { /* ... bleibt ebenfalls fast unverändert ... */ }
function showSpotDetails()  { /* ... bleibt komplett erhalten ... */ }

// ------------------------------------------------------
// Favoriten & Speicher (UNVERÄNDERT)
// ------------------------------------------------------
function loadFavoritesFromStorage() { /* ... */ }
function saveFavoritesToStorage() { /* ... */ }
function toggleFavorite(spot) { /* ... */ }

// ------------------------------------------------------
// INIT – AB HIER passiert die Magie
// ------------------------------------------------------
function init() {
  // DOM Element-Referenzen
  languageSwitcherEl = document.getElementById("language-switcher");
  themeToggleEl = document.getElementById("theme-toggle");
  spotListEl = document.getElementById("spot-list");
  spotDetailEl = document.getElementById("spot-detail");

  // Sprache / Theme Config
  setLanguage(getInitialLang(), { initial: true });
  setTheme(getInitialTheme());

  // MAP
  initMap();

  // FILTERS – **NEUES SYSTEM**
  filterState = initFilters({
    categories: Object.entries(CATEGORY_GROUPS)
      .flatMap(([_, slugs]) => slugs) // Array aller Kategorien
      .map((slug) => ({
        slug,
        label: {
          de: CATEGORY_LABELS_DE[slug] || slug,
          en: CATEGORY_LABELS_EN[slug] || slug
        }
      })),
    favoritesProvider: () => Array.from(favorites),
    onFilterChange: () => applyNewFiltering()
  });

  // SPOTS LADEN
  loadSpots();
}

// Start der App
document.addEventListener("DOMContentLoaded", init);