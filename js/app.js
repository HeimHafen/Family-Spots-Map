// app.js
import { initMap, getMap, setSpotsOnMap } from "./map.js";
import { loadAppData, getSpots } from "./data.js";
import { initFilters, applyFilters } from "./filters.js";
import { getSettings, saveSettings } from "./storage.js";
import { initI18n, applyTranslations, getLanguage } from "./i18n.js";
import { showToast } from "./ui.js";

let allSpots = [];
let filteredSpots = [];
let currentFilterState = null;

document.addEventListener("DOMContentLoaded", () => {
  bootstrapApp().catch((err) => {
    console.error(err);
    showToast("Die Daten konnten gerade nicht geladen werden. Versuch es gleich noch einmal.");
  });
});

async function bootstrapApp() {
  const settings = getSettings();
  const lang = settings.language || "de";
  document.documentElement.lang = lang;

  await initI18n(lang);
  applyTranslations();

  const { index } = await loadAppData();
  allSpots = getSpots();

  initMap({
    center: index.defaultLocation,
    zoom: index.defaultZoom,
    onMarkerSelect: handleSpotSelect,
  });

  const map = getMap();
  const center = map ? map.getCenter() : null;

  currentFilterState = initFilters({
    categories: index.categories,
    favoritesProvider: () => [],
    onFilterChange: handleFilterChange,
  });

  filteredSpots = applyFilters(allSpots, {
    ...currentFilterState,
    favorites: [],
    mapCenter: center,
  });

  setSpotsOnMap(filteredSpots);

  initUIEvents();
  updateRoute("map");
}

function handleFilterChange(filterState) {
  currentFilterState = filterState;
  const map = getMap();
  const center = map ? map.getCenter() : null;

  filteredSpots = applyFilters(allSpots, {
    ...filterState,
    favorites: [],
    mapCenter: center,
  });

  setSpotsOnMap(filteredSpots);
}

function handleSpotSelect(id) {
  console.log("Spot ausgewählt:", id);
  // hier Spot‑Details anzeigen etc.
}

function initUIEvents() {
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    saveSettings({ ...getSettings(), theme: next });
  });

  document.getElementById("language-switcher").addEventListener("change", async (ev) => {
    const lang = ev.target.value;
    document.documentElement.lang = lang;
    await initI18n(lang);
    applyTranslations();
    saveSettings({ ...getSettings(), language: lang });
  });

  document.querySelectorAll(".bottom-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const route = btn.dataset.route;
      updateRoute(route);
    });
  });
}

function updateRoute(route) {
  const viewMap = document.getElementById("view-map");
  const viewAbout = document.getElementById("view-about");

  if (route === "about") {
    viewMap.classList.remove("view--active");
    viewAbout.classList.add("view--active");
  } else {
    viewAbout.classList.remove("view--active");
    viewMap.classList.add("view--active");
    const map = getMap();
    if (map) {
      setTimeout(() => map.invalidateSize(), 0);
    }
  }

  document.querySelectorAll(".bottom-nav-item").forEach((btn) => {
    btn.classList.toggle("bottom-nav-item--active", btn.dataset.route === route);
  });

  const navIndicator = document.getElementById("bottom-nav-indicator");
  if (navIndicator) {
    const idx = route === "about" ? 1 : 0;
    navIndicator.style.transform = `translateX(${idx * 100}%)`;
  }
}