// js/app.js

import { $, $$, getGeolocation } from "./utils.js";
import {
  getSettings,
  saveSettings,
  getFavorites,
  toggleFavorite,
  getPlusStatus,
  savePlusStatus,
} from "./storage.js";
import { initI18n, applyTranslations, getLanguage, t } from "./i18n.js";
import {
  loadAppData,
  getSpots,
  getCategories,
  findSpotById,
} from "./data.js";
import {
  initFilters,
  applyFilters,
  refreshCategorySelect,
} from "./filters.js";
import { initMap, setSpotsOnMap, focusOnSpot, getMap } from "./map.js";
import { renderSpotList, renderSpotDetails, showToast } from "./ui.js";
import "./sw-register.js";

let currentFilterState = null;
let allSpots = [];
let filteredSpots = [];
let plusStatus = null;
let partnerCodesCache = null;

// -----------------------------------------------------
// Bootstrap
// -----------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  bootstrapApp().catch((err) => {
    console.error(err);
    showToast(
      t(
        "error_data_load",
        "Ups – die Daten konnten gerade nicht geladen werden. Bitte versuch es gleich noch einmal.",
      ),
    );
  });
});

async function bootstrapApp() {
  const settings = getSettings();
  applyTheme(settings.theme);

  await initI18n(settings.language);
  applyTranslations();
  updateStaticLanguageTexts(getLanguage());

  const { index } = await loadAppData();
  allSpots = getSpots();
  const categories = getCategories();

  // Plus-Status laden
  plusStatus = getPlusStatus();
  updatePlusStatusUI(plusStatus);

  // Karte
  initMap({
    center: index.defaultLocation,
    zoom: index.defaultZoom,
    onMarkerSelect: handleSpotSelect,
  });

  // Filter
  currentFilterState = initFilters({
    categories,
    favoritesProvider: getFavorites,
    onFilterChange: handleFilterChange,
  });

  const map = getMap();
  const center = map ? map.getCenter() : null;

  filteredSpots = applyFilters(allSpots, {
    ...currentFilterState,
    favorites: getFavorites(),
    mapCenter: center,
  });

  setSpotsOnMap(filteredSpots);

  renderSpotList(filteredSpots, {
    favorites: getFavorites(),
    onSelect: handleSpotSelect,
  });

  initUIEvents();
  updateRoute("map");
}

// -----------------------------------------------------
// UI + Routing
// -----------------------------------------------------

function initUIEvents() {
  // Sprache
  const langSelect = $("#language-switcher");
  if (langSelect) {
    langSelect.value = getLanguage();
    langSelect.addEventListener("change", async () => {
      const settings = getSettings();
      const nextLang = langSelect.value || "de";

      await initI18n(nextLang);
      saveSettings({ ...settings, language: nextLang });

      applyTranslations();
      updateStaticLanguageTexts(nextLang);

      const categories = getCategories();
      refreshCategorySelect(categories);

      handleFilterChange({
        ...currentFilterState,
        favorites: getFavorites(),
      });
    });
  }

  // Theme
  const themeToggle = $("#theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const settings = getSettings();
      const nextTheme = settings.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      saveSettings({ ...settings, theme: nextTheme });
    });
  }

  // Standort
  const locateBtn = $("#btn-locate");
  if (locateBtn) {
    locateBtn.addEventListener("click", async () => {
      try {
        const pos = await getGeolocation();
        const map = getMap();
        if (map) {
          map.setView([pos.lat, pos.lng], 14);
        }
        showToast(
          t(
            "toast_location_ok",
            "Dein Startpunkt ist gesetzt – viel Spaß beim nächsten Abenteuer!",
          ),
        );
      } catch (err) {
        console.error(err);
        showToast(
          t(
            "toast_location_error",
            "Standort konnte nicht ermittelt werden. Bitte prüfe die Freigabe oder zoom manuell in deine Region.",
          ),
        );
      }
    });
  }

  // Bottom-Navigation
  $$(".bottom-nav-item").forEach((btn, index) => {
    btn.addEventListener("click", () => {
      const routeAttr = btn.dataset.route;
      const route = routeAttr === "about" ? "about" : "map";
      updateRoute(route, index);
    });
  });

  // Listen-/Kartenansicht im Sidebar-Panel
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

      const map = getMap();
      if (map) {
        setTimeout(() => map.invalidateSize(), 0);
      }
    });
  }

  // Filter-Panel ein-/ausblenden
  const filterToggleBtn = $("#btn-toggle-filters");
  if (filterToggleBtn) {
    const filterSection = filterToggleBtn.closest(".sidebar-section");
    const labelSpan = filterToggleBtn.querySelector("span");
    if (filterSection && labelSpan) {
      const filterControls = Array.from(
        filterSection.querySelectorAll(".filter-group"),
      );

      // auf kleinen Screens: Filter anfangs einklappen
      if (window.innerWidth <= 900 && filterControls.length > 0) {
        filterControls.forEach((el) => el.classList.add("hidden"));
        labelSpan.textContent = t("btn_show_filters", "Filter anzeigen");
      }

      filterToggleBtn.addEventListener("click", () => {
        if (filterControls.length === 0) return;
        const currentlyHidden =
          filterControls[0].classList.contains("hidden");
        const makeVisible = currentlyHidden;

        filterControls.forEach((el) => {
          if (makeVisible) el.classList.remove("hidden");
          else el.classList.add("hidden");
        });

        labelSpan.textContent = makeVisible
          ? t("btn_hide_filters", "Filter ausblenden")
          : t("btn_show_filters", "Filter anzeigen");

        const map = getMap();
        if (map) {
          setTimeout(() => map.invalidateSize(), 0);
        }
      });
    }
  }

  // Fenster-/Orientierungswechsel: Map-Größe aktualisieren
  window.addEventListener("resize", () => {
    const map = getMap();
    if (map) {
      map.invalidateSize();
    }
  });

  // Plus-Code-Formular
  const plusInput = $("#plus-code-input");
  const plusButton = $("#plus-code-submit");
  if (plusInput && plusButton) {
    plusButton.addEventListener("click", async () => {
      const rawCode = plusInput.value.trim();
      if (!rawCode) {
        showToast(t("plus_code_empty", "Bitte Code eingeben."));
        return;
      }

      const normalized = rawCode.toUpperCase();

      try {
        const codes = await loadPartnerCodes();
        const match = codes.find(
          (c) =>
            String(c.code).toUpperCase() === normalized &&
            (c.enabled ?? true),
        );

        if (!match) {
          showToast(
            t(
              "plus_code_unknown",
              "Code nicht bekannt oder nicht mehr gültig.",
            ),
          );
          return;
        }

        const days = Number(match.days) || 0;
        const now = new Date();
        const expires =
          days > 0
            ? new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
            : null;

        plusStatus = savePlusStatus({
          code: normalized,
          plan: match.plan || null,
          partner: match.partner || null,
          source: match.source || "partner",
          activatedAt: now.toISOString(),
          expiresAt: expires ? expires.toISOString() : null,
        });

        updatePlusStatusUI(plusStatus);
        showToast(
          t(
            "plus_code_activated",
            "Family Spots Plus ist jetzt aktiv – viel Freude auf euren Touren!",
          ),
        );
      } catch (err) {
        console.error(err);
        showToast(
          t(
            "plus_code_failed",
            "Code konnte nicht geprüft werden. Versuch es später noch einmal.",
          ),
        );
      }
    });
  }
}

function updateRoute(route, indexFromClick) {
  const viewMap = $("#view-map");
  const viewAbout = $("#view-about");
  const navIndicator = $("#bottom-nav-indicator");
  const buttons = Array.from(document.querySelectorAll(".bottom-nav-item"));

  if (!viewMap || !viewAbout || buttons.length === 0) return;

  const targetRoute = route === "about" ? "about" : "map";

  if (targetRoute === "about") {
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

  buttons.forEach((btn, index) => {
    const isActive = btn.dataset.route === targetRoute;
    btn.classList.toggle("bottom-nav-item--active", isActive);

    if (isActive && navIndicator) {
      const idx = indexFromClick != null ? indexFromClick : index;
      navIndicator.style.transform = `translateX(${idx * 100}%)`;
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// -----------------------------------------------------
// Filter-Logik
// -----------------------------------------------------

function handleFilterChange(filterState) {
  currentFilterState = filterState;

  const map = getMap();
  const center = map ? map.getCenter() : null;

  filteredSpots = applyFilters(allSpots, {
    ...filterState,
    mapCenter: center,
  });

  setSpotsOnMap(filteredSpots);
  renderSpotList(filteredSpots, {
    favorites: filterState.favorites,
    onSelect: handleSpotSelect,
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
          ? t("toast_fav_added", "Zu euren Lieblingsspots gelegt 💛")
          : t("toast_fav_removed", "Aus den Lieblingsspots entfernt."),
      );

      handleFilterChange({
        ...currentFilterState,
        favorites: updatedFavorites,
      });

      const freshSpot = findSpotById(spotId);
      renderSpotDetails(freshSpot, {
        isFavorite: updatedFavorites.includes(spotId),
        onToggleFavorite: () => handleSpotSelect(spotId),
      });
    },
  });
}

// -----------------------------------------------------
// Theme
// -----------------------------------------------------

function applyTheme(theme) {
  const value = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", value);
}

// -----------------------------------------------------
// Texte / Sprache
// -----------------------------------------------------

function updateStaticLanguageTexts(lang) {
  const isGerman = !lang || lang.toLowerCase().startsWith("de");

  const txt = (de, en) => (isGerman ? de : en);

  const setText = (id, de, en) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt(de, en);
  };

  // Filterüberschrift
  setText("filter-title", "Filter", "Filters");

  // Kompass
  setText("compass-title", "Familien-Kompass", "Family compass");
  setText(
    "compass-helper",
    "Mit einem Klick passende Spots nach Zeit, Alter und Energie finden.",
    "With one tap, find spots that match your time, kids’ age and everyone’s energy.",
  );
  setText("btn-compass-label", "Kompass anwenden", "Apply compass");

  // Suche, Kategorie
  setText("label-search", "Suche", "Search");
  const searchInput = $("#filter-search");
  if (searchInput) {
    searchInput.placeholder = txt(
      "Ort, Spot, Stichwörter …",
      "Place, spot, keywords …",
    );
  }
  setText("label-category", "Kategorie", "Category");

  // Stimmung
  setText("label-mood", "Stimmung", "Mood");
  setText(
    "helper-mood",
    "Wonach fühlt es sich heute an?",
    "What does today feel like?",
  );
  setText("mood-label-relaxed", "Entspannt", "Relaxed");
  setText("mood-label-action", "Bewegung", "Action & movement");
  setText("mood-label-water", "Wasser & Sand", "Water & sand");
  setText("mood-label-animals", "Tier-Tag", "Animal day");

  // Reise-Modus
  setText("label-travel-mode", "Reise-Modus", "Travel mode");
  setText(
    "helper-travel-mode",
    "Seid ihr heute im Alltag unterwegs oder auf Tour mit WoMo, Auto oder Bahn?",
    "Are you out and about at home today or travelling with RV, car or train?",
  );
  setText("travel-label-everyday", "Alltag", "Everyday");
  setText("travel-label-trip", "Unterwegs", "On the road");

  // Alter
  setText("label-age", "Alter der Kinder", "Kids’ age");
  const ageSelect = document.getElementById("filter-age");
  if (ageSelect && ageSelect.options.length >= 4) {
    ageSelect.options[0].textContent = txt(
      "Alle Altersstufen",
      "All age groups",
    );
    ageSelect.options[1].textContent = txt("0–3 Jahre", "0–3 years");
    ageSelect.options[2].textContent = txt("4–9 Jahre", "4–9 years");
    ageSelect.options[3].textContent = txt("10+ Jahre", "10+ years");
  }

  // Radius
  setText(
    "label-radius",
    "Micro-Abenteuer-Radius",
    "Micro-adventure radius",
  );
  setText(
    "helper-radius",
    "Wie weit darf euer Abenteuer heute gehen? Der Radius bezieht sich auf die Kartenmitte (Zuhause, Ferienwohnung, Hotel …).",
    "How far may your adventure go today? The radius is measured from the map centre (home, holiday flat, hotel …).",
  );

  // Checkboxen
  setText(
    "label-big-only",
    "Nur große Abenteuer",
    "Only big adventures",
  );
  setText(
    "label-verified-only",
    "Nur verifizierte Spots",
    "Only verified spots",
  );
  setText(
    "label-favorites-only",
    "Nur Favoriten",
    "Only favourites",
  );

  // Bottom-Navigation
  setText("bottom-label-map", "Karte", "Map");
  setText("bottom-label-about", "Über", "About");
}

// -----------------------------------------------------
// Plus-Helfer
// -----------------------------------------------------

function updatePlusStatusUI(status) {
  const el = document.getElementById("plus-status-text");
  if (!el) return;

  const lang = getLanguage();
  const isGerman = !lang || lang.startsWith("de");

  if (!status || !status.active) {
    el.textContent = isGerman
      ? "Family Spots Plus ist nicht aktiviert."
      : "Family Spots Plus is not activated.";
    return;
  }

  let baseText = isGerman
    ? "Family Spots Plus ist aktiv"
    : "Family Spots Plus is active";

  if (status.expiresAt) {
    const d = new Date(status.expiresAt);
    const dateStr = d.toLocaleDateString(isGerman ? "de-DE" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    baseText += isGerman ? ` (bis ${dateStr})` : ` (until ${dateStr})`;
  }

  if (status.partner) {
    baseText += isGerman
      ? ` – Partner: ${status.partner}`
      : ` – partner: ${status.partner}`;
  }

  el.textContent = baseText;
}

async function loadPartnerCodes() {
  if (partnerCodesCache) return partnerCodesCache;

  try {
    const res = await fetch("data/partners.json");
    if (!res.ok) throw new Error("Cannot load partners.json");

    const data = await res.json();
    partnerCodesCache = Array.isArray(data.codes) ? data.codes : [];
  } catch (err) {
    console.error("Partnercodes konnten nicht geladen werden:", err);
    partnerCodesCache = [];
  }

  return partnerCodesCache;
}