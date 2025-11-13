import { $, $$, getGeolocation } from "./utils.js";
import {
  getSettings,
  saveSettings,
  getFavorites,
  toggleFavorite,
  isFavorite
} from "./storage.js";
import {
  initI18n,
  setLanguage,
  applyTranslations
} from "./i18n.js";
import {
  loadAppData,
  getCategories,
  getSpots,
  findSpotById
} from "./data.js";
import { initFilters, applyFilters } from "./filters.js";
import { renderSpotList, renderSpotDetails, showToast } from "./ui.js";
import { initMap, setSpots, focusOnSpot, getMap } from "./map.js";
import "./sw-register.js";

let currentFilterState = null;
let currentSpots = [];
let filteredSpots = [];

// Einstiegspunkt
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

  const { index } = await loadAppData();
  currentSpots = getSpots();

  const categories = getCategories();
  const catMap = new Map(categories.map((c) => [c.slug, c]));

  // Kategorienlabels an Spots hängen
  currentSpots.forEach((s) => {
    const cat = catMap.get(s.category);
    if (cat && !s.categoryLabel) {
      s.categoryLabel = cat.label;
    }
  });

  initMap({
    center: index.defaultLocation,
    zoom: index.defaultZoom || 11,
    onMarkerSelect: handleSpotSelect
  });

  currentFilterState = initFilters({
    categories,
    favoritesProvider: getFavorites,
    onFilterChange: handleFilterChange
  });

  filteredSpots = applyFilters(currentSpots, {
    ...currentFilterState,
    favorites: getFavorites()
  });

  setSpots(filteredSpots);
  renderSpotList(filteredSpots, {
    favorites: getFavorites(),
    onSelect: handleSpotSelect
  });

  initUIEvents();
}

function initUIEvents() {
  const langSelect = $("#language-switcher");
  if (langSelect) {
    langSelect.value = getSettings().language || "de";

    langSelect.addEventListener("change", async () => {
      await setLanguage(langSelect.value);
      applyTranslations();
    });
  }

  const themeToggle = $("#theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const settings = getSettings();
      const nextTheme = settings.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      saveSettings({ ...settings, theme: nextTheme });
    });
  }

  const locateBtn = $("#btn-locate");
  if (locateBtn) {
    locateBtn.addEventListener("click", async () => {
      try {
        const pos = await getGeolocation();
        showToast("Position gefunden");
        const map = getMap();
        if (map) {
          map.setView([pos.lat, pos.lng], 14);
        }
      } catch (err) {
        console.error(err);
        showToast("Standort konnte nicht ermittelt werden");
      }
    });
  }

  // Bottom-Navigation
  $$(".bottom-nav-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const route = btn.dataset.route;
      window.location.hash = route;
      updateRoute(route);
    });
  });

  // Listen-/Kartenansicht
  const toggleViewBtn = $("#btn-toggle-view");
  if (toggleViewBtn) {
    toggleViewBtn.addEventListener("click", () => {
      const list = $(".sidebar-section--grow");
      const btnLabel = $("#btn-toggle-view span");
      if (!list || !btnLabel) return;

      list.classList.toggle("hidden");
      btnLabel.textContent = list.classList.contains("hidden")
        ? "Liste zeigen"
        : "Nur Karte";
    });
  }

  // Route beim ersten Laden anwenden
  const initialRoute = window.location.hash.slice(1) || "map";
  updateRoute(initialRoute);

  window.addEventListener("hashchange", () => {
    const route = window.location.hash.slice(1) || "map";
    updateRoute(route);
  });
}

// Filter anwenden
function handleFilterChange(filterState) {
  currentFilterState = filterState;
  filteredSpots = applyFilters(currentSpots, filterState);
  setSpots(filteredSpots);
  renderSpotList(filteredSpots, {
    favorites: filterState.favorites,
    onSelect: handleSpotSelect
  });
}

// Spot auswählen (aus Liste oder Marker)
function handleSpotSelect(id) {
  const spot = findSpotById(id);
  if (!spot) return;

  focusOnSpot(spot);
  const favorites = getFavorites();

  renderSpotDetails(spot, {
    isFavorite: favorites.includes(spot.id),
    onToggleFavorite: (spotId) => {
      const updatedFavorites = toggleFavorite(spotId);
      showToast(
        updatedFavorites.includes(spotId)
          ? "Zu Favoriten hinzugefügt"
          : "Aus Favoriten entfernt"
      );
      handleFilterChange({
        ...currentFilterState,
        favorites: updatedFavorites
      });
      renderSpotDetails(findSpotById(spotId), {
        isFavorite: updatedFavorites.includes(spotId),
        onToggleFavorite: () => handleSpotSelect(spotId)
      });
    }
  });
}

// Routen-Ansicht umschalten
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

// Theme anwenden
function applyTheme(theme) {
  const value = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", value);
}