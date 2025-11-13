// js/app.js

import { $, $$, getGeolocation } from "./utils.js";
import {
  getSettings,
  saveSettings,
  getFavorites,
  toggleFavorite
} from "./storage.js";
import {
  initI18n,
  applyTranslations,
  getLanguage,
  t
} from "./i18n.js";
import {
  loadAppData,
  getSpots,
  getCategories,
  findSpotById
} from "./data.js";
import { initFilters, applyFilters } from "./filters.js";
import {
  initMap,
  setSpotsOnMap,
  focusOnSpot,
  getMap
} from "./map.js";
import {
  renderSpotList,
  renderSpotDetails,
  showToast
} from "./ui.js";
import "./sw-register.js";

let currentFilterState = null;
let allSpots = [];
let filteredSpots = [];

// -----------------------------------------------------
// Bootstrap
// -----------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  bootstrapApp().catch((err) => {
    console.error(err);
    showToast("Fehler beim Laden der Daten");
  });
});

async function bootstrapApp() {
  const settings = getSettings();
  applyTheme(settings.theme);

  await initI18n(settings.language);
  applyTranslations();

  const { index } = await loadAppData();
  allSpots = getSpots();
  const categories = getCategories();

  initMap({
    center: index.defaultLocation,
    zoom: index.defaultZoom,
    onMarkerSelect: handleSpotSelect
  });

  currentFilterState = initFilters({
    categories,
    favoritesProvider: getFavorites,
    onFilterChange: handleFilterChange
  });

  filteredSpots = applyFilters(allSpots, {
    ...currentFilterState,
    favorites: getFavorites()
  });

  setSpotsOnMap(filteredSpots);
  renderSpotList(filteredSpots, {
    favorites: getFavorites(),
    onSelect: handleSpotSelect
  });

  initUIEvents();
  updateRoute("map");
}

// -----------------------------------------------------
// UI + Routing
// -----------------------------------------------------

function initUIEvents() {
  // Sprach-Umschalter
  const langSelect = $("#language-switcher");
  if (langSelect) {
    langSelect.value = getLanguage();
    langSelect.addEventListener("change", async () => {
      const settings = getSettings();
      const nextLang = langSelect.value || "de";
      await initI18n(nextLang);
      saveSettings({ ...settings, language: nextLang });
      applyTranslations();

      // Liste neu zeichnen, damit Texte/Textelemente passen
      handleFilterChange({
        ...currentFilterState,
        favorites: getFavorites()
      });
    });
  }

  // Theme-Toggle
  const themeToggle = $("#theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const settings = getSettings();
      const nextTheme = settings.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      saveSettings({ ...settings, theme: nextTheme });
    });
  }

  // Standort finden
  const locateBtn = $("#btn-locate");
  if (locateBtn) {
    locateBtn.addEventListener("click", async () => {
      try {
        const pos = await getGeolocation();
        const map = getMap();
        if (map) {
          map.setView([pos.lat, pos.lng], 14);
        }
        showToast(t("toast_location_ok", "Position gefunden"));
      } catch (err) {
        console.error(err);
        showToast(
          t("toast_location_error", "Standort konnte nicht ermittelt werden")
        );
      }
    });
  }

  // Bottom-Navigation
  $$(".bottom-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const route = btn.dataset.route;
      updateRoute(route);
    });
  });

  // Listen-/Kartenansicht im Sidebar-Panel umschalten
  const toggleViewBtn = $("#btn-toggle-view");
  if (toggleViewBtn) {
    toggleViewBtn.addEventListener("click", () => {
      const list = $(".sidebar-section--grow");
      const labelSpan = $("#btn-toggle-view span");
      if (!list || !labelSpan) return;

      const nowHidden = list.classList.toggle("hidden");
      labelSpan.textContent = nowHidden
        ? t("btn_show_list", "Liste zeigen")
        : t("btn_only_map", "Nur Karte");
    });
  }
}

function updateRoute(route) {
  const viewMap = $("#view-map");
  const viewAbout = $("#view-about");
  if (!viewMap || !viewAbout) return;

  if (route === "about") {
    viewMap.classList.remove("view--active");
    viewAbout.classList.add("view--active");
  } else {
    viewAbout.classList.remove("view--active");
    viewMap.classList.add("view--active");
  }

  document.querySelectorAll(".bottom-nav-item").forEach((btn) => {
    btn.classList.toggle(
      "bottom-nav-item--active",
      btn.dataset.route === route
    );
  });
}

// -----------------------------------------------------
// Filter-Logik
// -----------------------------------------------------

function handleFilterChange(filterState) {
  currentFilterState = filterState;

  filteredSpots = applyFilters(allSpots, filterState);

  setSpotsOnMap(filteredSpots);
  renderSpotList(filteredSpots, {
    favorites: filterState.favorites,
    onSelect: handleSpotSelect
  });
}

// -----------------------------------------------------
// Spot-Auswahl
// -----------------------------------------------------

function handleSpotSelect(id) {
  const spot = findSpotById(id);
  if (!spot) return;

  focusOnSpot(spot);

  const favorites = getFavorites();
  const isFav = favorites.includes(spot.id);

  renderSpotDetails(spot, {
    isFavorite: isFav,
    onToggleFavorite: (spotId) => {
      const updatedFavorites = toggleFavorite(spotId);
      showToast(
        updatedFavorites.includes(spotId)
          ? t("toast_fav_added", "Zu Favoriten hinzugefügt")
          : t("toast_fav_removed", "Aus Favoriten entfernt")
      );

      // Liste aktualisieren
      handleFilterChange({
        ...currentFilterState,
        favorites: updatedFavorites
      });

      // Details nochmals neu zeichnen
      const freshSpot = findSpotById(spotId);
      renderSpotDetails(freshSpot, {
        isFavorite: updatedFavorites.includes(spotId),
        onToggleFavorite: () => handleSpotSelect(spotId)
      });
    }
  });
}

// -----------------------------------------------------
// Theme
// -----------------------------------------------------

function applyTheme(theme) {
  const value = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", value);
} 