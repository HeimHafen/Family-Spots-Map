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
// Helper: Sprache & Theme
// ------------------------------------------------------
function getInitialLang() {
  const lang = navigator.language?.toLowerCase();
  return lang?.startsWith("en") ? LANG_EN : LANG_DE;
}

function getInitialTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? THEME_DARK
    : THEME_LIGHT;
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  currentTheme = theme;
}

// ------------------------------------------------------
// Helper: Spot-Normalisierung
// ------------------------------------------------------
function getSpotName(raw) {
  return (
    raw.name ||
    raw.title ||
    raw.spotName ||
    raw.spot_title ||
    raw.meta?.name ||
    raw.meta?.title ||
    "Unbenannter Spot"
  );
}

function getSpotCity(raw) {
  return raw.city || raw.ort || raw.town || raw.location_city || "";
}

function getSpotAddress(raw) {
  return (
    raw.address ||
    raw.adresse ||
    raw.location_address ||
    raw.location?.address ||
    ""
  );
}

function getSpotLatLng(raw) {
  const lat =
    raw.lat ??
    raw.latitude ??
    raw.coord_lat ??
    raw.coords?.lat ??
    raw.position?.lat;
  const lng =
    raw.lng ??
    raw.lon ??
    raw.longitude ??
    raw.coord_lng ??
    raw.coords?.lng ??
    raw.coords?.lon ??
    raw.position?.lng ??
    raw.position?.lon;

  return { lat, lng };
}

function buildSearchText(spot) {
  const parts = [
    spot.name,
    spot.city,
    Array.isArray(spot.tags) ? spot.tags.join(" ") : "",
    spot.summary_de || "",
    spot.summary_en || ""
  ].filter(Boolean);

  return parts.join(" ").toLowerCase();
}

function normalizeSpot(raw) {
  const name = getSpotName(raw);
  const city = getSpotCity(raw);
  const address = getSpotAddress(raw);
  const { lat, lng } = getSpotLatLng(raw);

  const tags = raw.tags || raw.usp || raw.badges || [];
  const summary_de = raw.summary_de || raw.description_de || "";
  const summary_en = raw.summary_en || raw.description_en || "";

  const normalized = {
    ...raw,
    name,
    city,
    address,
    lat,
    lng,
    tags,
    summary_de,
    summary_en
  };

  return {
    ...normalized,
    _searchText: buildSearchText(normalized)
  };
}

// ------------------------------------------------------
// Karte
// ------------------------------------------------------
function initMap() {
  if (typeof L === "undefined") {
    console.warn("Leaflet (L) ist nicht definiert – Karte wird nicht initialisiert.");
    return;
  }

  map = L.map("map", {
    center: DEFAULT_MAP_CENTER,
    zoom: DEFAULT_MAP_ZOOM,
    zoomControl: false
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  markersLayer =
    typeof L.markerClusterGroup === "function"
      ? L.markerClusterGroup()
      : L.layerGroup();

  map.addLayer(markersLayer);
}

// ------------------------------------------------------
// Spots laden
// ------------------------------------------------------
async function loadSpots() {
  try {
    // lieber explizit relativ
    const res = await fetch("./data/spots.json", { cache: "no-cache" });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} beim Laden von data/spots.json`);
    }

    const data = await res.json();

    const rawSpots = Array.isArray(data)
      ? data
      : data.spots || data.items || [];

    console.log("📦 Roh-Spots geladen:", rawSpots.length, rawSpots[0]);

    spots = rawSpots.map(normalizeSpot);

    console.log("✅ Normalisierte Spots[0]:", spots[0]);

    applyNewFiltering();
  } catch (err) {
    console.error("❌ Fehler beim Laden der Spots:", err);
  }
}

// ------------------------------------------------------
// Filtering & Rendering
// ------------------------------------------------------
function applyNewFiltering() {
  if (!spots.length || !filterState) return;

  const mapCenter = map?.getCenter();

  filteredSpots = applyFilters(spots, {
    ...filterState,
    mapCenter: mapCenter ? { lat: mapCenter.lat, lng: mapCenter.lng } : null
  });

  console.log("🔍 Gefilterte Spots:", filteredSpots.length);

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
    const { lat, lng } = getSpotLatLng(spot);
    if (lat == null || lng == null) return;

    const marker = L.marker([lat, lng]).bindPopup(spot.name || "Spot");
    markersLayer.addLayer(marker);
  });
}

function renderSpotList() {
  if (!spotListEl) return;

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
// Init
// ------------------------------------------------------
function init() {
  console.log("🚀 Family Spots App startet");

  languageSwitcherEl = document.getElementById("language-switcher");
  themeToggleEl = document.getElementById("theme-toggle");
  spotListEl = document.getElementById("spot-list");
  spotDetailEl = document.getElementById("spot-detail");

  setTheme(getInitialTheme());

  initMap();

  tilla = new TillaCompanion();

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

  console.log("🧭 Filter-Initialisierung fertig:", filterState);

  loadSpots();
}

document.addEventListener("DOMContentLoaded", init);