// js/app.js

import { $, $$, getGeolocation } from "./utils.js";
import {
  getSettings,
  saveSettings,
  getFavorites,
  toggleFavorite,
  getPlusStatus,
  savePlusStatus
} from "./storage.js";
import { initI18n, applyTranslations, getLanguage, t } from "./i18n.js";
import {
  loadAppData,
  getSpots,
  getCategories,
  findSpotById
} from "./data.js";
import {
  initFilters,
  applyFilters,
  refreshCategorySelect
} from "./filters.js";
import {
  initMap,
  setSpotsOnMap,
  focusOnSpot,
  getMap
} from "./map.js";
import { renderSpotList, renderSpotDetails, showToast } from "./ui.js";
import { initTilla } from "./tilla.js";

let currentFilterState = null;
let allSpots = [];
let filteredSpots = [];
let plusStatus = null;
let partnerCodesCache = null;
let currentSelectedSpotId = null;

// -----------------------------------------------------
// Partner-Codes laden (lokale Helper-Funktion)
// -----------------------------------------------------

async function loadPartnerCodes() {
  if (partnerCodesCache) return partnerCodesCache;

  const res = await fetch("data/partner-codes.json", {
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error("Failed to load partner codes");
  }

  const json = await res.json();
  const codes = Array.isArray(json) ? json : json.codes || [];
  partnerCodesCache = codes;
  return codes;
}

// -----------------------------------------------------
// Mein Tag – Daylog
// -----------------------------------------------------

function initDayLog() {
  const textArea = document.getElementById("daylog-text");
  const saveBtn = document.getElementById("daylog-save");

  if (!textArea || !saveBtn) return;

  // Laden beim Start
  const saved = localStorage.getItem("fsm.daylog");
  if (saved) {
    textArea.value = saved;
  }

  // Speichern bei Klick
  saveBtn.addEventListener("click", () => {
    localStorage.setItem("fsm.daylog", textArea.value || "");
    showToast(
      t(
        "daylog_saved",
        "Dein Tagesmoment ist gespeichert 💾 – später könnt ihr euch daran erinnern."
      )
    );
  });
}

// -----------------------------------------------------
// Bootstrap
// -----------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  bootstrapApp().catch((err) => {
    console.error(err);
    showToast(
      t(
        "error_data_load",
        "Die Daten konnten gerade nicht geladen werden. Versuch es gleich noch einmal."
      )
    );
  });

  // Mein Tag Modul initialisieren
  initDayLog();

  // Tilla initialisieren
  initTilla();
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
    onMarkerSelect: handleSpotSelect
  });

  // Filter
  currentFilterState = initFilters({
    categories,
    favoritesProvider: getFavorites,
    onFilterChange: handleFilterChange
  });

  const map = getMap();
  const center = map ? map.getCenter() : null;

  filteredSpots = applyFilters(allSpots, {
    ...currentFilterState,
    favorites: getFavorites(),
    mapCenter: center
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
        favorites: getFavorites()
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
            "Euer Standort ist gesetzt – viel Spaß beim nächsten Abenteuer! 🌍"
          )
        );
      } catch (err) {
        console.error(err);
        showToast(
          t(
            "toast_location_error",
            "Euer Standort lässt sich gerade nicht bestimmen. Vielleicht ist die Freigabe gesperrt oder ihr seid offline."
          )
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
      const labelSpan = toggleViewBtn.querySelector("span");
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

  // ---------------------------------------------------
  // Filter ein-/ausblenden
  // ---------------------------------------------------
  const filterToggleBtn = $("#btn-toggle-filters");
  if (filterToggleBtn) {
    const filterSection = filterToggleBtn.closest(".sidebar-section");
    const labelSpan = filterToggleBtn.querySelector("span");

    if (filterSection && labelSpan) {
      const filterControls = Array.from(
        filterSection.querySelectorAll(".filter-group")
      );

      let filtersVisible = true;

      const setFiltersVisible = (visible) => {
        filtersVisible = visible;
        filterControls.forEach((el) =>
          el.classList.toggle("hidden", !visible)
        );
        labelSpan.textContent = visible
          ? t("btn_hide_filters", "Filter ausblenden")
          : t("btn_show_filters", "Filter anzeigen");

        const map = getMap();
        if (map) {
          setTimeout(() => map.invalidateSize(), 0);
        }
      };

      // Mobile: initial einklappen
      if (window.innerWidth <= 900 && filterControls.length > 0) {
        setFiltersVisible(false);
      } else {
        setFiltersVisible(true);
      }

      filterToggleBtn.addEventListener("click", () => {
        setFiltersVisible(!filtersVisible);
      });
    }
  }

  // Close-Buttons in den Sidebar-Sections
  $$(".sidebar-section-close").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      const targetId = btn.dataset.target;
      if (!targetId) return;
      const details = document.getElementById(targetId);
      if (details && details.tagName.toLowerCase() === "details") {
        details.open = false;
      }
    });
  });

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
            (c.enabled ?? true)
        );
        if (!match) {
          showToast(
            t("plus_code_unknown", "Code nicht bekannt oder nicht mehr gültig.")
          );
          return;
        }
        const days = Number(match.days) || 0;
        const now = new Date();
        const expires =
          days > 0 ? new Date(now.getTime() + days * 24 * 60 * 60 * 1000) : null;

        plusStatus = savePlusStatus({
          code: normalized,
          plan: match.plan || null,
          partner: match.partner || null,
          source: match.source || "partner",
          activatedAt: now.toISOString(),
          expiresAt: expires ? expires.toISOString() : null
        });
        updatePlusStatusUI(plusStatus);
        showToast(
          t(
            "plus_code_activated",
            "Family Spots Plus ist jetzt aktiv – gute Fahrt & viel Freude auf euren Touren!"
          )
        );
      } catch (err) {
        console.error(err);
        showToast(
          t(
            "plus_code_failed",
            "Code konnte nicht geprüft werden. Versuch es später noch einmal."
          )
        );
      }
    });
  }
}

// -----------------------------------------------------
// Routing / Filter / Auswahl
// -----------------------------------------------------

function updateRoute(route, indexFromClick) {
  const viewMap = document.getElementById("view-map");
  const viewAbout = document.getElementById("view-about");
  const navIndicator = document.getElementById("bottom-nav-indicator");
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

function handleFilterChange(filterState) {
  currentFilterState = filterState;
  const map = getMap();
  const center = map ? map.getCenter() : null;

  filteredSpots = applyFilters(allSpots, {
    ...filterState,
    favorites: getFavorites(),
    mapCenter: center
  });

  setSpotsOnMap(filteredSpots);
  renderSpotList(filteredSpots, {
    favorites: filterState.favorites,
    onSelect: handleSpotSelect
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
          : t("toast_fav_removed", "Aus den Lieblingsspots entfernt.")
      );
      handleFilterChange({
        ...currentFilterState,
        favorites: updatedFavorites
      });
      const freshSpot = findSpotById(spotId);
      renderSpotDetails(freshSpot, {
        isFavorite: updatedFavorites.includes(spotId),
        onToggleFavorite: () => handleSpotSelect(spotId)
      });
    }
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
    onToggleFavorite: () => handleSpotSelect(spot.id)
  });
}

// -----------------------------------------------------
// Theme / Plus-Status
// -----------------------------------------------------

function applyTheme(theme) {
  const value = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", value);

  // Browser-UI (Adressleiste etc.) anpassen
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute(
      "content",
      value === "dark" ? "#020617" : "#fb8c00"
    );
  }
}

function updatePlusStatusUI(status) {
  const el = document.getElementById("plus-status-text");
  if (!el) return;
  const lang = getLanguage() || "de";
  const isDe = lang.startsWith("de");
  if (!status || !status.active) {
    el.textContent = isDe
      ? "Family Spots Plus ist nicht aktiviert."
      : "Family Spots Plus is not activated.";
    return;
  }
  let baseText = isDe
    ? "Family Spots Plus ist aktiv"
    : "Family Spots Plus is active";
  if (status.expiresAt) {
    const d = new Date(status.expiresAt);
    const dateStr = d.toLocaleDateString(isDe ? "de-DE" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    baseText += isDe ? ` (bis ${dateStr})` : ` (until ${dateStr})`;
  }
  if (status.partner) {
    baseText += isDe
      ? ` – Partner: ${status.partner}`
      : ` – partner: ${status.partner}`;
  }
  el.textContent = baseText;
}

// -----------------------------------------------------
// Statische Texte für DE / EN
// -----------------------------------------------------

function updateStaticLanguageTexts(lang) {
  const isDe = (lang || "de").startsWith("de");

  // Header-Tagline
  const headerTagline = $("#header-tagline");
  if (headerTagline) {
    headerTagline.textContent = isDe
      ? "Die schönste Karte für Familien-Abenteuer. Finde geprüfte Ausflugsziele in deiner Nähe – von Eltern für Eltern."
      : "The most beautiful map for family adventures. Find curated family spots near you – by parents for parents.";
  }

  // Familien-Kompass
  const compassLabel = $("#compass-label");
  if (compassLabel) {
    compassLabel.textContent = isDe ? "Familien-Kompass" : "Family Compass";
  }
  const compassHelper = $("#compass-helper");
  if (compassHelper) {
    compassHelper.textContent = isDe
      ? "Der Familien-Kompass hilft euch mit einem Klick Spots zu finden, die zu eurer Zeit, eurem Alter und eurer Energie passen."
      : "The family compass helps you find spots that match your time, your kids' age and your energy today – with just one tap.";
  }
  const compassApplyLabel = $("#compass-apply-label");
  if (compassApplyLabel) {
    compassApplyLabel.textContent = isDe ? "Kompass anwenden" : "Apply compass";
  }

  // Mein Tag
  const daylogTitle = document.querySelector(
    "#daylog-section .sidebar-section-title"
  );
  if (daylogTitle) {
    daylogTitle.textContent = isDe ? "Mein Tag 💛" : "My day 💛";
  }
  const daylogLabel = document.querySelector('label[for="daylog-text"]');
  if (daylogLabel) {
    daylogLabel.textContent = isDe ? "Wie war euer Tag?" : "How was your day?";
  }
  const daylogTextarea = $("#daylog-text");
  if (daylogTextarea) {
    daylogTextarea.placeholder = isDe
      ? "Heute waren wir im Wildpark – die Ziegen waren sooo süß!"
      : "Today we went to the wildlife park – the goats were sooo cute!";
  }
  const daylogSaveBtn = $("#daylog-save");
  if (daylogSaveBtn) {
    daylogSaveBtn.textContent = isDe ? "Speichern 💾" : "Save 💾";
  }

  // Filter-Titel
  const filterTitle = $("#filter-title");
  if (filterTitle) {
    filterTitle.textContent = isDe ? "Filter" : "Filters";
  }

  // Suchfeld
  const searchLabel = $("#filter-search-label");
  if (searchLabel) {
    searchLabel.textContent = isDe ? "Suche" : "Search";
  }
  const searchInput = $("#filter-search");
  if (searchInput) {
    searchInput.placeholder = isDe
      ? "Ort, Spot, Stichwörter …"
      : "Place, spot, keywords …";
  }

  // Kategorie
  const catLabel = $("#filter-category-label");
  if (catLabel) {
    catLabel.textContent = isDe ? "Kategorie" : "Category";
  }
  const catAllOption = document.querySelector(
    "#filter-category option[value='']"
  );
  if (catAllOption) {
    catAllOption.textContent = isDe ? "Alle Kategorien" : "All categories";
  }

  // Stimmung
  const moodLabel = $("#filter-mood-label");
  if (moodLabel) {
    moodLabel.textContent = isDe ? "Stimmung" : "Mood";
  }
  const moodHelper = $("#filter-mood-helper");
  if (moodHelper) {
    moodHelper.textContent = isDe
      ? "Wonach fühlt es sich heute an?"
      : "What does today feel like?";
  }
  const moodRelaxed = $("#mood-relaxed-label");
  if (moodRelaxed) {
    moodRelaxed.textContent = isDe ? "Entspannt" : "Relaxed";
  }
  const moodAction = $("#mood-action-label");
  if (moodAction) {
    moodAction.textContent = isDe ? "Bewegung" : "Active";
  }
  const moodWater = $("#mood-water-label");
  if (moodWater) {
    moodWater.textContent = isDe ? "Wasser & Sand" : "Water & sand";
  }
  const moodAnimals = $("#mood-animals-label");
  if (moodAnimals) {
    moodAnimals.textContent = isDe ? "Tier-Tag" : "Animal day";
  }

  // Reise-Modus
  const travelLabel = $("#filter-travel-label");
  if (travelLabel) {
    travelLabel.textContent = isDe ? "Reise-Modus" : "Travel mode";
  }
  const travelHelper = $("#filter-travel-helper");
  if (travelHelper) {
    travelHelper.textContent = isDe
      ? "Seid ihr heute im Alltag unterwegs oder auf Tour mit WoMo, Auto oder Bahn?"
      : "Are you out and about in everyday life or on a trip with RV, car or train today?";
  }
  const travelEveryday = $("#travel-everyday-label");
  if (travelEveryday) {
    travelEveryday.textContent = isDe ? "Alltag" : "Everyday";
  }
  const travelTrip = $("#travel-trip-label");
  if (travelTrip) {
    travelTrip.textContent = isDe ? "Unterwegs" : "On the road";
  }

  // Alter der Kinder
  const ageLabel = $("#filter-age-label");
  if (ageLabel) {
    ageLabel.textContent = isDe ? "Alter der Kinder" : "Children's age";
  }
  const ageAll = $("#filter-age-all");
  if (ageAll) {
    ageAll.textContent = isDe ? "Alle Altersstufen" : "All age groups";
  }
  const age03 = $("#filter-age-0-3");
  if (age03) {
    age03.textContent = isDe ? "0–3 Jahre" : "0–3 years";
  }
  const age49 = $("#filter-age-4-9");
  if (age49) {
    age49.textContent = isDe ? "4–9 Jahre" : "4–9 years";
  }
  const age10 = $("#filter-age-10-plus");
  if (age10) {
    age10.textContent = isDe ? "10+ Jahre" : "10+ years";
  }

  // Radius
  const radiusLabel = $("#filter-radius-label");
  if (radiusLabel) {
    radiusLabel.textContent = isDe
      ? "Micro-Abenteuer-Radius"
      : "Micro-adventure radius";
  }
  const radiusHelper = $("#filter-radius-helper");
  if (radiusHelper) {
    radiusHelper.textContent = isDe
      ? "Wie weit darf euer Abenteuer heute gehen? Der Radius bezieht sich auf die Kartenmitte (Zuhause, Ferienwohnung, Hotel …)."
      : "How far may your adventure go today? The radius is based on the map centre (home, holiday flat, hotel …).";
  }
  const radiusMaxLabel = $("#filter-radius-max-label");
  if (radiusMaxLabel) {
    radiusMaxLabel.textContent = isDe ? "Alle Spots" : "All spots";
  }
  const radiusDesc = $("#filter-radius-description");
  if (radiusDesc) {
    radiusDesc.textContent = isDe
      ? "Alle Spots – ohne Radiusbegrenzung. Die Karte gehört euch."
      : "All spots – no radius limit. The map is yours.";
  }

  // Checkboxen
  const bigLabel = $("#filter-big-label span");
  if (bigLabel) {
    bigLabel.textContent = isDe ? "Nur große Abenteuer" : "Big adventures only";
  }
  const verifiedLabel = $("#filter-verified-label span");
  if (verifiedLabel) {
    verifiedLabel.textContent = isDe
      ? "Nur verifizierte Spots"
      : "Verified spots only";
  }
  const favsLabel = $("#filter-favs-label span");
  if (favsLabel) {
    favsLabel.textContent = isDe ? "Nur Favoriten" : "Favourites only";
  }

  // Spots-Sektion
  const spotsTitle = $("#spots-title");
  if (spotsTitle) {
    spotsTitle.textContent = isDe ? "Spots" : "Spots";
  }

  // Bottom-Navigation
  const bottomMap = $("#bottom-nav-map-label");
  if (bottomMap) {
    bottomMap.textContent = isDe ? "Karte" : "Map";
  }
  const bottomAbout = $("#bottom-nav-about-label");
  if (bottomAbout) {
    bottomAbout.textContent = isDe ? "Über" : "About";
  }

  // Filter-Toggle-Button (Starttext)
  const filterToggleLabel = $("#btn-toggle-filters span");
  if (filterToggleLabel) {
    filterToggleLabel.textContent = isDe
      ? "Filter ausblenden"
      : "Hide filters";
  }

  // Nur Karte / Map only
  const toggleViewLabel = $("#btn-toggle-view span");
  if (toggleViewLabel) {
    toggleViewLabel.textContent = isDe ? "Nur Karte" : "Map only";
  }

  // Plus-Formular (Label + Button + Hinweis)
  const plusLabel = document.querySelector('label[for="plus-code-input"]');
  if (plusLabel) {
    plusLabel.textContent = isDe
      ? "Partner-Code eingeben (z. B. von Campingplatz, Kommune oder Sponsor):"
      : "Enter partner code (e.g. from campsite, municipality or sponsor):";
  }
  const plusBtn = $("#plus-code-submit");
  if (plusBtn) {
    plusBtn.textContent = isDe ? "Code aktivieren" : "Activate code";
  }
  const plusNote = $(".plus-note");
  if (plusNote) {
    plusNote.textContent = isDe
      ? "Family Spots Plus schaltet zusätzliche Filter & Spots frei – ganz ohne Abo-Falle."
      : "Family Spots Plus unlocks extra filters & spots – with no subscription trap.";
  }

  // ---------------------------------------------------
  // About-Seite: DE/EN umschalten
  // ---------------------------------------------------
  const aboutDe = document.getElementById("page-about-de");
  const aboutEn = document.getElementById("page-about-en");
  if (aboutDe && aboutEn) {
    aboutDe.classList.toggle("hidden", !isDe);
    aboutEn.classList.toggle("hidden", isDe);
  }
}