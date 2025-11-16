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

  // Neu: Auf kleinen Screens Kompass + Plus beim Start einklappen,
  // damit die Karte mehr Platz bekommt
  if (window.innerWidth <= 900) {
    const compassDetails = document.getElementById("compass-section");
    const plusDetails = document.getElementById("plus-section");
    if (compassDetails) compassDetails.removeAttribute("open");
    if (plusDetails) plusDetails.removeAttribute("open");
  }
}

// -----------------------------------------------------
// UI + Routing
// -----------------------------------------------------

function initUIEvents() {
  // Hilfe-Button (öffnet die Über-Ansicht)
  const helpBtn = $("#btn-help");
  if (helpBtn) {
    helpBtn.addEventListener("click", () => {
      // Index 1, weil in der Bottom-Navigation der zweite Button "Über" ist
      updateRoute("about", 1);
    });
  }

  // Sprache
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

      // Filter neu anwenden (Liste + Marker)
      handleFilterChange({
        ...currentFilterState,
        favorites: getFavorites(),
      });

      // Plus-Status in neuer Sprache
      updatePlusStatusUI(plusStatus);

      // Offene Spot-Details in neuer Sprache neu rendern
      rerenderCurrentSpotDetails();
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

      // Auf kleinen Screens automatisch zu Karte/Liste scrollen
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

  // Fenster-/Orientierungswechsel: Map-Größe aktualisieren
  window.addEventListener("resize", () => {
    const map = getMap();
    if (map) {
      map.invalidateSize();
    }
  });

  // Plus-Code-Formular (UI-Elemente optional, brechen nichts wenn nicht vorhanden)
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

// -----------------------------------------------------
// Theme
// -----------------------------------------------------

function applyTheme(theme) {
  const value = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", value);
}

// -----------------------------------------------------
// Plus-Helfer
// -----------------------------------------------------

function updatePlusStatusUI(status) {
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

// -----------------------------------------------------
// Sprache für statische Texte (DE / EN)
// -----------------------------------------------------

function updateStaticLanguageTexts(lang) {
  const isDe = !lang || lang.startsWith("de");
  const setElText = (id, de, en) => {
    const el = $("#" + id);
    if (el) el.textContent = isDe ? de : en;
  };

  // Header-Tagline
  setElText(
    "header-tagline",
    "Die schönste Karte für Familien-Abenteuer. Finde geprüfte Ausflugsziele in deiner Nähe – von Eltern für Eltern.",
    "The most beautiful map for family adventures. Find curated spots near you – by parents for parents.",
  );

  // Filter + Labels
  setElText("filter-title", "Filter", "Filters");
  setElText("filter-search-label", "Suche", "Search");

  const searchInput = $("#filter-search");
  if (searchInput) {
    searchInput.placeholder = isDe
      ? "Ort, Spot, Stichwörter …"
      : "Place, spot, keywords …";
  }

  setElText("filter-category-label", "Kategorie", "Category");
  setElText("filter-mood-label", "Stimmung", "Mood");
  setElText(
    "filter-mood-helper",
    "Wonach fühlt es sich heute an?",
    "What does today feel like?",
  );
  setElText("mood-relaxed-label", "Entspannt", "Relaxed");
  setElText("mood-action-label", "Bewegung", "Action & movement");
  setElText("mood-water-label", "Wasser & Sand", "Water & sand");
  setElText("mood-animals-label", "Tier-Tag", "Animal day");

  // Reise-Modus
  setElText("filter-travel-label", "Reise-Modus", "Travel mode");
  setElText(
    "filter-travel-helper",
    "Seid ihr heute im Alltag unterwegs oder auf Tour mit WoMo, Auto oder Bahn?",
    "Are you out and about at home today or travelling with RV, car or train?",
  );
  setElText("travel-everyday-label", "Alltag", "Everyday");
  setElText("travel-trip-label", "Unterwegs", "On the road");

  // Alter
  setElText("filter-age-label", "Alter der Kinder", "Kids’ age");
  setElText("filter-age-all", "Alle Altersstufen", "All age groups");
  setElText("filter-age-0-3", "0–3 Jahre", "0–3 years");
  setElText("filter-age-4-9", "4–9 Jahre", "4–9 years");
  setElText("filter-age-10-plus", "10+ Jahre", "10+ years");

  // Micro-Abenteuer-Radius
  setElText(
    "filter-radius-label",
    "Micro-Abenteuer-Radius",
    "Micro-adventure radius",
  );
  setElText(
    "filter-radius-helper",
    "Wie weit darf euer Abenteuer heute gehen? Der Radius bezieht sich auf die Kartenmitte (Zuhause, Ferienwohnung, Hotel …).",
    "How far may today’s adventure go? The radius is measured from the map centre (home, holiday flat, hotel …).",
  );
  setElText("filter-radius-max-label", "Alle Spots", "All spots");

  // Checkboxen
  const bigLabelSpan = $("#filter-big-label span:last-child");
  if (bigLabelSpan) {
    bigLabelSpan.textContent = isDe
      ? "Nur große Abenteuer (z. B. Zoos, Wildparks, Freizeitparks)"
      : "Only big adventures (e.g. zoos, wildlife parks, theme parks)";
  }

  const verifiedLabelSpan = $("#filter-verified-label span:last-child");
  if (verifiedLabelSpan) {
    verifiedLabelSpan.textContent = isDe
      ? "Nur verifizierte Spots (von uns geprüft)"
      : "Only verified spots (checked by us)";
  }

  const favsLabelSpan = $("#filter-favs-label span:last-child");
  if (favsLabelSpan) {
    favsLabelSpan.textContent = isDe
      ? "Nur Favoriten"
      : "Only favourite spots";
  }

  // Kompass (Titel/Helper – der eigentliche Inhalt ist im Kompass-Section)
  setElText("compass-label", "Familien-Kompass", "Family compass");
  setElText(
    "compass-helper",
    "Der Familien-Kompass hilft euch mit einem Klick Spots zu finden, die zu eurer Zeit, eurem Alter und eurer Energie passen.",
    "The family compass helps you find spots that match your time, your kids’ age and everyone’s energy today.",
  );
  setElText("compass-apply-label", "Kompass anwenden", "Start compass");

  // Spot-Liste Titel
  setElText("spots-title", "Spots", "Spots");

  // Bottom-Navigation
  setElText("bottom-nav-map-label", "Karte", "Map");
  setElText("bottom-nav-about-label", "Über", "About");

  // About DE/EN sichtbar schalten
  const aboutDe = $("#page-about-de");
  const aboutEn = $("#page-about-en");
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