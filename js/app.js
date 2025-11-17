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
let currentSelectedSpotId = null;

// -----------------------------------------------------
// Bootstrap
// -----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  bootstrapApp().catch((err) => {
    console.error(err);
    showToast(
      t(
        "error_data_load",
        "Die Daten konnten gerade nicht geladen werden. Versuch es gleich noch einmal.",
      ),
    );
  });
});

async function bootstrapApp() {
  const settings = getSettings();

  // HTML lang + Theme setzen
  const initialLang = settings.language || "de";
  document.documentElement.lang = initialLang;
  applyTheme(settings.theme);

  await initI18n(initialLang);
  applyTranslations();
  updateStaticLanguageTexts(initialLang);

  const { index } = await loadAppData();
  allSpots = getSpots();
  const categories = getCategories();

  // Plus‑Status laden
  plusStatus = getPlusStatus();
  updatePlusStatusUI(plusStatus);

  // Karte initialisieren
  initMap({
    center: index.defaultLocation,
    zoom: index.defaultZoom,
    onMarkerSelect: handleSpotSelect,
  });

  // Filter initialisieren
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

// UI + Routing
function initUIEvents() {
  const compassBtn = $("#compass-apply");
  if (compassBtn) {
    compassBtn.addEventListener("click", () => {
      applyCompass();
    });
  }

  function initCollapser(sectionId, buttonId) {
    const section = $(sectionId);
    const toggleBtn = $(buttonId);
    if (!section || !toggleBtn) return;

    const isDetails = section.tagName === "DETAILS";

    toggleBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();

      let nowOpen;

      if (isDetails) {
        nowOpen = !section.open;
        section.open = nowOpen;
      } else {
        const currentlyCollapsed =
          section.dataset.collapsed === "true" ||
          section.classList.contains("sidebar-section--collapsed");

        nowOpen = currentlyCollapsed ? false : true;
        section.dataset.collapsed = nowOpen ? "false" : "true";
        section.classList.toggle("sidebar-section--collapsed", !nowOpen);
      }

      const span = toggleBtn.querySelector("span");
      if (span) {
        const lang = getLanguage() || "de";
        const isDe = lang.startsWith("de");
        span.textContent = nowOpen
          ? isDe
            ? "Schließen"
            : "Hide"
          : isDe
            ? "Öffnen"
            : "Show";
      }
    });
  }

  initCollapser("#compass-section", "#btn-toggle-compass");
  initCollapser("#plus-section", "#btn-toggle-plus");

  const helpBtn = $("#btn-help");
  if (helpBtn) {
    helpBtn.addEventListener("click", () => {
      updateRoute("about", 1);
    });
  }

  const langSelect = $("#language-switcher");
  if (langSelect) {
    langSelect.value = getLanguage() || "de";
    langSelect.addEventListener("change", async () => {
      const settings = getSettings();
      const nextLang = langSelect.value || "de";
      document.documentElement.lang = nextLang;

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

      updatePlusStatusUI(plusStatus);
      rerenderCurrentSpotDetails();
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
        const map = getMap();
        if (map) {
          map.setView([pos.lat, pos.lng], 14);
        }
        showToast(
          t(
            "toast_location_ok",
            "Euer Standort ist gesetzt – viel Spaß beim nächsten Abenteuer! 🌍",
          ),
        );
      } catch (err) {
        console.error(err);
        showToast(
          t(
            "toast_location_error",
            "Euer Standort lässt sich gerade nicht bestimmen. Vielleicht ist die Freigabe gesperrt oder ihr seid offline.",
          ),
        );
      }
    });
  }

  $$(".bottom-nav-item").forEach((btn, index) => {
    btn.addEventListener("click", () => {
      const routeAttr = btn.dataset.route;
      const route = routeAttr === "about" ? "about" : "map";
      updateRoute(route, index);
    });
  });

  const toggleViewBtn = $("#btn-toggle-view");
  if (toggleViewBtn) {
    toggleViewBtn.addEventListener("click", () => {
      const list = document.querySelector(".sidebar-section--grow");
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

      if (window.innerWidth <= 900) {
        const target = nowHidden
          ? document.querySelector(".map-section")
          : document.querySelector(".sidebar");
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }
    });
  }

  const filterToggleBtn = $("#btn-toggle-filters");
  if (filterToggleBtn) {
    const filterSection = filterToggleBtn.closest(".sidebar-section");
    const labelSpan = filterToggleBtn.querySelector("span");
    if (filterSection && labelSpan) {
      const filterControls = Array.from(
        filterSection.querySelectorAll(".filter-group"),
      );

      if (window.innerWidth <= 900 && filterControls.length > 0) {
        filterControls.forEach((el) => el.classList.add("hidden"));
        labelSpan.textContent = t("btn_show_filters", "Filter anzeigen");
        const map = getMap();
        if (map) {
          setTimeout(() => map.invalidateSize(), 0);
        }
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

  window.addEventListener("resize", () => {
    const map = getMap();
    if (map) {
      map.invalidateSize();
    }
  });

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
            "Family Spots Plus ist jetzt aktiv – gute Fahrt & viel Freude auf euren Touren!",
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

// Familien‑Kompass
function applyCompass() {
  const moodButtons = $$(".mood-chip");
  const activeMood = Array.from(moodButtons).find((btn) =>
    btn.classList.contains("mood-chip--active"),
  );

  if (!activeMood) {
    const relaxedBtn = document.querySelector(
      '.mood-chip[data-mood="relaxed"]',
    );
    if (relaxedBtn) {
      relaxedBtn.click();
    }
  }

  const radiusSlider = $("#filter‑radius");
  if (radiusSlider && radiusSlider.value === "4") {
    radiusSlider.value = "2";
    const evt = new Event("input", { bubbles: true });
    radiusSlider.dispatchEvent(evt);
  }

  const listSection = document.querySelector(".sidebar-section--grow");
  if (listSection) {
    listSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  showToast(
    t(
      "compass_applied",
      "Der Familien‑Kompass ist aktiv – passende Spots werden oben angezeigt. 💫",
    ),
  );
}

function updateRoute(route, indexFromClick) {
  const viewMap = $("#view‑map");
  const viewAbout = $("#view‑about");
  const navIndicator = $("#bottom‑nav‑indicator");
  const buttons = Array.from(document.querySelectorAll(".bottom‑nav‑item"));

  if (!viewMap || !viewAbout || buttons.length === 0) return;

  const targetRoute = route === "about" ? "about" : "map";

  if (targetRoute === "about") {
    viewMap.classList.remove("view‑‑active");
    viewAbout.classList.add("view‑‑active");
  } else {
    viewAbout.classList.remove("view‑‑active");
    viewMap.classList.add("view‑‑active");

    const map = getMap();
    if (map) {
      setTimeout(() => map.invalidateSize(), 0);
    }
  }

  buttons.forEach((btn, index) => {
    const isActive = btn.dataset.route === targetRoute;
    btn.classList.toggle("bottom‑nav‑item‑‑active", isActive);

    if (isActive && navIndicator) {
      const idx = indexFromClick != null ? indexFromClick : index;
      navIndicator.style.transform = `translateX(${idx * 100}%)`;
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

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

function handleSpotSelect(id) {
  const spot = findSpotById(id);
  if (!spot) return;

  currentSelectedSpotId = spot.id;
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

function rerenderCurrentSpotDetails() {
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

function applyTheme(theme) {
  const value = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data‑theme", value);
}

function updatePlusStatusUI(status) {
  const el = document.getElementById("plus‑status‑text");
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
    const dateStr = d.toLocaleDateString(isGerman ? "de‑DE" : "en‑US", {
      year: "numeric",
      month: "2‑digit",
      day: "2‑digit",
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
    const res = await fetch("./data/partners.json");
    if (!res.ok) throw new Error("Cannot load partners.json");

    const data = await res.json();
    partnerCodesCache = Array.isArray(data.codes) ? data.codes : [];
  } catch (err) {
    console.error("Partnercodes konnten nicht geladen werden:", err);
    partnerCodesCache = [];
  }

  return partnerCodesCache;
}