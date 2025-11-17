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
import { getState, setState } from "./state.js";
import { updateCompassMessage } from "./coach.js";
import "./sw-register.js";

// -----------------------------------------------------
// Bootstrap
// -----------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded → bootstrapApp");
  bootstrapApp().catch((err) => {
    console.error("Bootstrap-Fehler:", err);
    try {
      showToast(
        t(
          "error_data_load",
          "Die Daten konnten gerade nicht geladen werden. Versuch es gleich noch einmal."
        )
      );
    } catch {
      alert(
        "Die Daten konnten gerade nicht geladen werden. Versuch es gleich noch einmal."
      );
    }
  });
});

async function bootstrapApp() {
  console.log("bootstrapApp(): start");
  const settings = getSettings();

  // HTML lang + Theme setzen
  const initialLang = settings.language || "de";
  document.documentElement.lang = initialLang;
  applyTheme(settings.theme);

  await initI18n(initialLang);
  applyTranslations();
  updateStaticLanguageTexts(initialLang);

  const { index } = await loadAppData();
  console.log("App data loaded: defaultLocation", index.defaultLocation);

  const allSpots = getSpots();
  const categories = getCategories();

  setState({
    spots: {
      all: allSpots,
      filtered: allSpots,
      currentSelectedId: null,
    },
  });

  const plusStatus = getPlusStatus();
  setState({ plus: { status: plusStatus } });
  updatePlusStatusUI(plusStatus);

  initMap({
    center: index.defaultLocation,
    zoom: index.defaultZoom,
    onMarkerSelect: handleSpotSelect,
  });

  const initialFilterState = initFilters({
    categories,
    favoritesProvider: getFavorites,
    onFilterChange: handleFilterChange,
  });

  setState({ filters: initialFilterState });

  const map = getMap();
  const center = map ? map.getCenter() : null;

  const filteredSpots = applyFilters(allSpots, {
    ...initialFilterState,
    favorites: getFavorites(),
    mapCenter: center,
  });

  setState({
    spots: {
      all: allSpots,
      filtered: filteredSpots,
      currentSelectedId: null,
    },
  });

  setSpotsOnMap(filteredSpots);
  renderSpotList(filteredSpots, {
    favorites: getFavorites(),
    onSelect: handleSpotSelect,
  });

  updateCompassMessage(initialFilterState, {
    filteredCount: filteredSpots.length,
    favoritesCount: getFavorites().length,
  });

  initUIEvents();
  updateRoute("map");

  console.log("bootstrapApp(): done");
}

// -----------------------------------------------------
// UI + Routing
// -----------------------------------------------------

function initUIEvents() {
  console.log("initUIEvents()");
  initCompassUI();
  initPlusUI();
  initHelpAndNavUI();
  initLanguageAndThemeUI();
  initLocationUI();
  initSidebarViewToggle();
  initFilterPanelToggle();
  initResizeHandler();
}

function initCompassUI() {
  console.log("initCompassUI()");
  const compassBtn = $("#compass-apply");
  if (compassBtn) {
    compassBtn.addEventListener("click", () => {
      console.log("Compass apply clicked");
      applyCompass();
    });
  }

  const compassSection = $("#compass-section");
  const compassToggleBtn = $("#btn-toggle-compass");
  if (compassSection && compassToggleBtn) {
    compassToggleBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      console.log("Compass toggle clicked");
      toggleDetailsSection(compassSection, compassToggleBtn);
    });
  }
}

function initPlusUI() {
  console.log("initPlusUI()");
  const plusSection = $("#plus-section");
  const plusToggleBtn = $("#btn-toggle-plus");
  if (plusSection && plusToggleBtn) {
    plusToggleBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      console.log("Plus toggle clicked");
      toggleDetailsSection(plusSection, plusToggleBtn);
    });
  }

  const plusInput = $("#plus-code-input");
  const plusButton = $("#plus-code-submit");
  if (plusInput && plusButton) {
    plusButton.addEventListener("click", () => {
      console.log("Plus code submit clicked: ", plusInput.value);
      handlePlusCodeSubmit();
    });
  }
}

function initHelpAndNavUI() {
  console.log("initHelpAndNavUI()");
  const helpBtn = $("#btn-help");
  if (helpBtn) {
    helpBtn.addEventListener("click", () => {
      console.log("Help button clicked");
      updateRoute("about", 1);
    });
  }

  $$(".bottom-nav-item").forEach((btn, index) => {
    btn.addEventListener("click", () => {
      console.log(
        "Bottom nav clicked: route=",
        btn.dataset.route,
        "index=",
        index
      );
      const routeAttr = btn.dataset.route;
      const route = routeAttr === "about" ? "about" : "map";
      updateRoute(route, index);
    });
  });
}

function initLanguageAndThemeUI() {
  console.log("initLanguageAndThemeUI()");
  const langSelect = $("#language-switcher");
  if (langSelect) {
    langSelect.value = getLanguage() || "de";
    langSelect.addEventListener("change", async () => {
      const settings = getSettings();
      const nextLang = langSelect.value || "de";

      console.log("Language changed to", nextLang);
      document.documentElement.lang = nextLang;

      await initI18n(nextLang);
      saveSettings({ ...settings, language: nextLang });

      applyTranslations();
      updateStaticLanguageTexts(nextLang);

      const categories = getCategories();
      refreshCategorySelect(categories);

      const { filters, plus, spots } = getState();

      const map = getMap();
      const center = map ? map.getCenter() : null;
      const filteredSpots = applyFilters(spots.all, {
        ...filters,
        favorites: getFavorites(),
        mapCenter: center,
      });

      setState({
        spots: {
          ...spots,
          filtered: filteredSpots,
        },
      });

      setSpotsOnMap(filteredSpots);
      renderSpotList(filteredSpots, {
        favorites: getFavorites(),
        onSelect: handleSpotSelect,
      });

      console.log("Re-render after language change done");
      updateCompassMessage(filters, {
        filteredCount: filteredSpots.length,
        favoritesCount: getFavorites().length,
      });

      updatePlusStatusUI(plus.status);
      rerenderCurrentSpotDetails();
    });
  }

  const themeToggle = $("#theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const settings = getSettings();
      const nextTheme = settings.theme === "dark" ? "light" : "dark";
      console.log("Theme toggled to", nextTheme);
      applyTheme(nextTheme);
      saveSettings({ ...settings, theme: nextTheme });
    });
  }
}

function initLocationUI() {
  console.log("initLocationUI()");
  const locateBtn = $("#btn-locate");
  if (locateBtn) {
    locateBtn.addEventListener("click", async () => {
      console.log("Locate button clicked");
      try {
        const pos = await getGeolocation();
        const map = getMap();
        if (map) {
          map.setView([pos.lat, pos.lng], 14);
        }
        showToast(
          t(
            "toast_location_ok",
            "Euer Standort ist gesetzt – viel Spaß beim nächsten Abenteuer! 🌍"
          )
        );
      } catch (err) {
        console.error("Geolocation error:", err);
        showToast(
          t(
            "toast_location_error",
            "Euer Standort lässt sich gerade nicht bestimmen. Vielleicht ist die Freigabe gesperrt oder ihr seid offline."
          )
        );
      }
    });
  }
}

function initSidebarViewToggle() {
  console.log("initSidebarViewToggle()");
  const toggleViewBtn = $("#btn-toggle-view");
  if (!toggleViewBtn) return;

  toggleViewBtn.addEventListener("click", () => {
    console.log("Sidebar view toggle clicked");
    const list = document.querySelector(".sidebar-section--grow");
    const labelSpan = document.querySelector("#btn-toggle-view span");
    if (!list || !labelSpan) return;

    const nowHidden = list.classList.toggle("hidden");
    labelSpan.textContent = nowHidden
      ? t("btn_show_list", "Liste zeigen")
      : t("btn_only_map", "Nur Karte");

    const map = getMap();
    if (map) {
      setTimeout(() => map.invalidateSize(), 0);
    }

    if (window.innerWidth <= 900) {
      const target = nowHidden
        ? document.querySelector(".map-section")
        : document.querySelector(".sidebar");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });
}

function initFilterPanelToggle() {
  console.log("initFilterPanelToggle()");
  const filterToggleBtn = $("#btn-toggle-filters");
  if (!filterToggleBtn) return;

  const filterSection = filterToggleBtn.closest(".sidebar-section");
  const labelSpan = filterToggleBtn.querySelector("span");
  if (!filterSection || !labelSpan) return;

  const filterControls = Array.from(
    filterSection.querySelectorAll(".filter-group, .filter-field-group")
  );

  if (window.innerWidth <= 900 && filterControls.length > 0) {
    filterControls.forEach((el) => el.classList.add("hidden"));
    labelSpan.textContent = t("btn_show_filters", "Filter anzeigen");
    const map = getMap();
    if (map) {
      setTimeout(() => map.invalidateSize(), 0);
    }
  }

  filterToggleBtn.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    console.log("Filter toggle clicked. Controls:", filterControls.length);
    if (filterControls.length === 0) return;
    const currentlyHidden = filterControls[0].classList.contains("hidden");
    const makeVisible = currentlyHidden;

    filterControls.forEach((el) =>
      el.classList.toggle("hidden", !makeVisible)
    );

    labelSpan.textContent = makeVisible
      ? t("btn_hide_filters", "Filter ausblenden")
      : t("btn_show_filters", "Filter anzeigen");

    const map = getMap();
    if (map) {
      setTimeout(() => map.invalidateSize(), 0);
    }
  });
}

function initResizeHandler() {
  console.log("initResizeHandler()");
  window.addEventListener("resize", () => {
    const map = getMap();
    if (map) {
      map.invalidateSize();
    }
  });
}

// -----------------------------------------------------
// Plus-Handling
// -----------------------------------------------------

async function handlePlusCodeSubmit() {
  console.log("handlePlusCodeSubmit()");
  const plusInput = $("#plus-code-input");
  if (!plusInput) return;

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
        String(c.code).toUpperCase() === normalized && (c.enabled ?? true)
    );

    if (!match) {
      showToast(
        t(
          "plus_code_unknown",
          "Code nicht bekannt oder nicht mehr gültig."
        )
      );
      return;
    }

    const days = Number(match.days) || 0;
    const now = new Date();
    const expires =
      days > 0 ? new Date(now.getTime() + days * 24 * 60 * 60 * 1000) : null;

    const plusStatus = savePlusStatus({
      code: normalized,
      plan: match.plan || null,
      partner: match.partner || null,
      source: match.source || "partner",
      activatedAt: now.toISOString(),
      expiresAt: expires ? expires.toISOString() : null,
    });

    setState({ plus: { status: plusStatus } });

    updatePlusStatusUI(plusStatus);
    showToast(
      t(
        "plus_code_activated",
        "Family Spots Plus ist jetzt aktiv – gute Fahrt & viel Freude auf euren Touren!"
      )
    );
  } catch (err) {
    console.error("Plus code submit error:", err);
    showToast(
      t(
        "plus_code_failed",
        "Code konnte nicht geprüft werden. Versuch es später noch einmal."
      )
    );
  }
}

// -----------------------------------------------------
// Familien-Kompass
// -----------------------------------------------------

function applyCompass() {
  console.log("applyCompass()");
  const moodButtons = Array.from(document.querySelectorAll(".mood-chip"));
  const activeMood = moodButtons.find((btn) =>
    btn.classList.contains("mood-chip--active")
  );

  if (!activeMood) {
    const relaxedBtn = document.querySelector(
      '.mood-chip[data-mood="relaxed"]'
    );
    if (relaxedBtn) {
      relaxedBtn.click();
    }
  }

  const radiusSlider = document.querySelector("#filter-radius");
  if (radiusSlider && radiusSlider.value === "4") {
    radiusSlider.value = "2";
    const evt = new Event("input", { bubbles: true });
    radiusSlider.dispatchEvent(evt);
  }

  const listSection = document.querySelector(".sidebar-section--grow");
  if (listSection) {
    listSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const { filters, spots } = getState();
  updateCompassMessage(filters, {
    filteredCount: spots.filtered.length,
    favoritesCount: getFavorites().length,
  });

  showToast(
    t(
      "compass_applied",
      "Der Familien-Kompass ist aktiv – passende Spots werden oben angezeigt. 💫"
    )
  );
}

// -----------------------------------------------------
// Routing
// -----------------------------------------------------

function updateRoute(route, indexFromClick) {
  console.log("updateRoute(): route=", route, "indexFromClick=", indexFromClick);
  const viewMap = document.querySelector("#view-map");
  const viewAbout = document.querySelector("#view-about");
  const navIndicator = document.querySelector("#bottom-nav-indicator");
  const buttons = Array.from(
    document.querySelectorAll(".bottom-nav-item")
  );

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
  console.log("handleFilterChange():", filterState);
  setState({ filters: filterState });

  const { spots } = getState();
  const map = getMap();
  const center = map ? map.getCenter() : null;

  const filteredSpots = applyFilters(spots.all, {
    ...filterState,
    favorites: getFavorites(),
    mapCenter: center,
  });

  setState({
    spots: {
      ...spots,
      filtered: filteredSpots,
    },
  });

  setSpotsOnMap(filteredSpots);
  renderSpotList(filteredSpots, {
    favorites: filterState.favorites,
    onSelect: handleSpotSelect,
  });

  updateCompassMessage(filterState, {
    filteredCount: filteredSpots.length,
    favoritesCount: getFavorites().length,
  });
}

function handleSpotSelect(id) {
  console.log("handleSpotSelect(): id=", id);
  const spot = findSpotById(id);
  if (!spot) {
    console.warn("No spot found for id", id);
    return;
  }

  const prev = getState().spots;

  setState({
    spots: {
      ...prev,
      currentSelectedId: spot.id,
    },
  });

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
          : t("toast_fav_removed", "Aus den Lieblingsspots entfernt.")
      );

      const { filters } = getState();
      handleFilterChange({
        ...filters,
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

function rerenderCurrentSpotDetails() {
  console.log("rerenderCurrentSpotDetails()");
  const { spots } = getState();
  const currentSelectedSpotId = spots.currentSelectedId;
  if (!currentSelectedSpotId) return;
  const spot = findSpotById(currentSelectedSpotId);
  if (!spot) return;

  const favorites = getFavorites();
  const isFav = favorites.includes(spot.id);

  renderSpotDetails(spot, {
    isFavorite: isFav,
    onToggleFavorite: (spotId) => {
      const updatedFavorites = toggleFavorite(spotId);

      showToast(
        updatedFavorites.includes(spotId)
          ? t("toast_fav_added", "Zu euren Lieblingsspots gelegt 💛")
          : t("toast_fav_removed", "Aus den Lieblingsspots entfernt.")
      );

      const { filters } = getState();
      handleFilterChange({
        ...filters,
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
  console.log("applyTheme():", value);
  document.documentElement.setAttribute("data-theme", value);
}

// -----------------------------------------------------
// Plus-Helfer (UI)
// -----------------------------------------------------

function updatePlusStatusUI(status) {
  console.log("updatePlusStatusUI():", status);
  const el = document.getElementById("plus-status-text");
  if (!el) return;

  const lang = getLanguage() || "de";
  const isGerman = lang.startsWith("de");

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

let partnerCodesCache = null;

async function loadPartnerCodes() {
  console.log("loadPartnerCodes()");
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

// -----------------------------------------------------
// Sprache für statische Texte (DE / EN)
// -----------------------------------------------------

function updateStaticLanguageTexts(lang) {
  console.log("updateStaticLanguageTexts():", lang);
  const isDe = !lang || lang.startsWith("de");
  const setElText = (id, de, en) => {
    const el = document.getElementById(id);
    if (el) el.textContent = isDe ? de : en;
  };

  setElText(
    "header-tagline",
    "Die schönste Karte für Familien-Abenteuer. Finde geprüfte Ausflugsziele in deiner Nähe – von Eltern für Eltern.",
    "The most beautiful map for family adventures. Find curated spots near you – by parents for parents."
  );

  setElText("filter-title", "Filter", "Filters");
  setElText("filter-search-label", "Suche", "Search");

  const searchInput = document.getElementById("filter-search");
  if (searchInput) {
    searchInput.placeholder = isDe
      ? "Ort, Spot, Stichwörter …"
      : "Place, spot, keywords …";
  }

  // About-Page Umschalten
  const aboutDe = document.getElementById("page-about-de");
  const aboutEn = document.getElementById("page-about-en");
  if (aboutDe && aboutEn) {
    if (isDe) {
      aboutDe.classList.remove("hidden");
      aboutEn.classList.add("hidden");
    } else {
      aboutEn.classList.remove("hidden");
      aboutDe.classList.add("hidden");
    }
  }
}