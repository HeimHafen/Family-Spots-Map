"use strict";

import "./i18n.js";
import { TillaCompanion } from "./tilla.js";
import { initFilters, applyFilters } from "./filters.js";

// ------------------------------------------------------
// Konstanten
// ------------------------------------------------------
const DEFAULT_MAP_CENTER = [52.4, 9.7];
const DEFAULT_MAP_ZOOM = 7;
const LANG_DE = "de";
const LANG_EN = "en";
const THEME_LIGHT = "light";
const THEME_DARK = "dark";

const CATEGORY_GROUPS = {
  stimmung: ["entspannt", "bewegung", "wasser", "tiertag"],
  reise: ["kurz", "mittel", "lang"],
  extras: ["plus", "verifiziert", "big"]
};

const CATEGORY_LABELS_DE = {
  entspannt: "Entspannt",
  bewegung: "Bewegung",
  wasser: "Wasser & Sand",
  tiertag: "Tier-Tag",
  kurz: "Kurze Tour",
  mittel: "Mittlere Tour",
  lang: "Lange Tour",
  plus: "Family Spots Plus",
  verifiziert: "Verifiziert",
  big: "Großes Abenteuer"
};

const CATEGORY_LABELS_EN = {
  entspannt: "Relaxed",
  bewegung: "Active",
  wasser: "Water & Sand",
  tiertag: "Animal Day",
  kurz: "Short trip",
  mittel: "Medium trip",
  lang: "Long trip",
  plus: "Family Spots Plus",
  verifiziert: "Verified",
  big: "Big Adventure"
};

// ------------------------------------------------------
// Globale Variablen
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

let languageSwitcherEl;
let themeToggleEl;
let spotListEl;
let spotDetailEl;

// ------------------------------------------------------
function getInitialLang() {
  const lang = navigator.language?.toLowerCase();
  return lang?.startsWith("en") ? LANG_EN : LANG_DE;
}

function getInitialTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? THEME_DARK : THEME_LIGHT;
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  currentTheme = theme;
}

function t(key) {
  return key; // Dummy für jetzt
}

// ------------------------------------------------------
function initMap() {
  if (typeof L === "undefined") return;

  map = L.map("map", { center: DEFAULT_MAP_CENTER, zoom: DEFAULT_MAP_ZOOM, zoomControl: false });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
  markersLayer = typeof L.markerClusterGroup === "function" ? L.markerClusterGroup() : L.layerGroup();
  map.addLayer(markersLayer);
}

// ------------------------------------------------------
async function loadSpots() {
  try {
    const res = await fetch("data/spots.json", { cache: "no-cache" });
    const data = await res.json();

    spots = (Array.isArray(data) ? data : data.spots || []).map((spot) => ({
      ...spot,
      _searchText: [spot.name, spot.city, spot.tags?.join(" "), spot.summary_de].join(" ").toLowerCase()
    }));

    applyNewFiltering();
  } catch (err) {
    console.error("Fehler beim Laden der Spots:", err);
  }
}

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

function renderMarkers() {
  if (!map || !markersLayer) return;
  markersLayer.clearLayers();

  filteredSpots.forEach((spot) => {
    if (!spot.lat || !spot.lng) return;
    const marker = L.marker([spot.lat, spot.lng]).bindPopup(spot.name || "Spot");
    markersLayer.addLayer(marker);
  });
}

function renderSpotList() {
  spotListEl.innerHTML = "";

  if (!filteredSpots.length) {
    spotListEl.innerHTML = `<p>Keine Spots gefunden.</p>`;
    return;
  }

  filteredSpots.forEach((spot) => {
    const el = document.createElement("div");
    el.className = "spot-card";
    el.textContent = spot.name || "Unbenannter Spot";
    el.addEventListener("click", () => showSpotDetails(spot));
    spotListEl.appendChild(el);
  });
}

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
}

// ------------------------------------------------------
function init() {
  languageSwitcherEl = document.getElementById("language-switcher");
  themeToggleEl = document.getElementById("theme-toggle");
  spotListEl = document.getElementById("spot-list");
  spotDetailEl = document.getElementById("spot-detail");

  setTheme(getInitialTheme());

  initMap();

  tilla = new TillaCompanion();

  filterState = initFilters({
    categories: Object.entries(CATEGORY_GROUPS).flatMap(([_, slugs]) => slugs).map((slug) => ({
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