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
let filterState = null;

let tilla = null;

// DOM-Elemente
let languageSwitcherEl;
let themeToggleEl;
let btnLocateEl;
let btnHelpEl;
let spotListEl;
let spotDetailEl;

// ------------------------------------------------------
function getInitialLang() { /* bleibt wie gehabt */ }
function setTheme(theme) { /* bleibt wie gehabt */ }
function showToast(msg) { /* bleibt wie gehabt */ }
function t(key) { /* bleibt wie gehabt */ }

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
async function loadSpots() {
  try {
    const res = await fetch("data/spots.json", { cache: "no-cache" });
    const data = await res.json();
    spots = (Array.isArray(data) ? data : data.spots || []).map((spot) => ({
      ...spot,
      _searchText: buildSpotSearchText(spot),
    }));

    loadFavoritesFromStorage();
    applyNewFiltering();
  } catch (err) {
    console.error("Fehler beim Laden der Spots:", err);
  }
}

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
function renderMarkers() { /* bleibt wie gehabt */ }
function renderSpotList() { /* bleibt wie gehabt */ }

// ------------------------------------------------------
function showSpotDetails(spot) {
  if (!spot || !spotDetailEl) return;

  spotDetailEl.innerHTML = "";

  const titleEl = document.createElement("h2");
  titleEl.textContent = spot.name || "Unbenannter Spot";
  spotDetailEl.appendChild(titleEl);

  const metaEl = document.createElement("p");
  metaEl.className = "spot-meta";
  metaEl.textContent = [spot.city, spot.address].filter(Boolean).join(", ");
  spotDetailEl.appendChild(metaEl);

  const scoreContainerEl = document.createElement("div");
  scoreContainerEl.className = "spot-details-scores";

  if (typeof spot._moodScore === "number") {
    const el = document.createElement("span");
    el.className = "badge badge--mood";
    el.textContent = `Stimmung: ${spot._moodScore}`;
    scoreContainerEl.appendChild(el);
  }

  if (typeof spot._travelScore === "number") {
    const el = document.createElement("span");
    el.className = "badge badge--travel";
    el.textContent = `Reise: ${spot._travelScore}`;
    scoreContainerEl.appendChild(el);
  }

  if (typeof spot._ageScore === "number") {
    const el = document.createElement("span");
    el.className = "badge badge--age";
    el.textContent = `Alter: ${spot._ageScore}`;
    scoreContainerEl.appendChild(el);
  }

  if (typeof spot._distanceKm === "number" && isFinite(spot._distanceKm)) {
    const el = document.createElement("span");
    el.className = "badge badge--distance";
    el.textContent = `Entfernung: ~${spot._distanceKm.toFixed(1)} km`;
    scoreContainerEl.appendChild(el);
  }

  spotDetailEl.appendChild(scoreContainerEl);

  const desc = spot.poetry || spot.summary_de || spot.summary_en || "";
  if (desc) {
    const descEl = document.createElement("p");
    descEl.className = "spot-description";
    descEl.textContent = desc;
    spotDetailEl.appendChild(descEl);
  }

  if (Array.isArray(spot.categories) && spot.categories.length) {
    const catEl = document.createElement("div");
    catEl.className = "spot-categories";
    catEl.textContent = "Kategorien: " + spot.categories.join(", ");
    spotDetailEl.appendChild(catEl);
  }

  const favBtn = document.createElement("button");
  favBtn.className = "favorite-toggle";
  favBtn.textContent = favorites.has(spot.id) ? "★ Favorit entfernen" : "☆ Zu Favoriten";
  favBtn.addEventListener("click", () => {
    toggleFavorite(spot);
    showSpotDetails(spot);
  });
  spotDetailEl.appendChild(favBtn);
}

// ------------------------------------------------------
function loadFavoritesFromStorage() { /* bleibt wie gehabt */ }
function saveFavoritesToStorage() { /* bleibt wie gehabt */ }
function toggleFavorite(spot) { /* bleibt wie gehabt */ }

// ------------------------------------------------------
function init() {
  languageSwitcherEl = document.getElementById("language-switcher");
  themeToggleEl = document.getElementById("theme-toggle");
  spotListEl = document.getElementById("spot-list");
  spotDetailEl = document.getElementById("spot-detail");

  setLanguage(getInitialLang(), { initial: true });
  setTheme(getInitialTheme());

  initMap();

  filterState = initFilters({
    categories: Object.entries(CATEGORY_GROUPS)
      .flatMap(([_, slugs]) => slugs)
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

  loadSpots();
}

document.addEventListener("DOMContentLoaded", init);