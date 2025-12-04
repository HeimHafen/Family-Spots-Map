// js/app.js
// ======================================================
// Zentrales App-Modul der Family Spots Map
//  - lädt Spots & Index
//  - initialisiert Leaflet-Map
//  - steuert Filter, Tilla, Plus, Daylog, Sprache & Theme
// ======================================================

"use strict";

import { loadData, getIndexData } from "./data.js";
import { initMap, renderMarkers, getRouteUrlsForSpot } from "./map.js";
import { TillaCompanion } from "./features/tilla.js";

/** @typedef {import("./app.js").Spot} Spot */ // nur für Editor-Hilfe, keine Laufzeitwirkung

// ------------------------------------------------------
// Konstante Keys für localStorage
// ------------------------------------------------------

const STORAGE_KEYS = {
  THEME: "familyspots.theme.v1",
  LANGUAGE: "familyspots.language.v1",
  TRAVEL_MODE: "familyspots.travelMode.v1",
  FAVORITES: "familyspots.favorites.v1",
  DAYLOG: "familyspots.daylog.v1",
  PLUS_CODE: "familyspots.plusCode.v1"
};

// Radius-Stufen (Index entspricht Slider-Wert 0–4)
const RADIUS_STEPS_KM = [5, 15, 30, 60, Infinity];

// Kleine Spielideen für den Tilla-Button
const PLAY_IDEAS = {
  de: [
    "Macht eine Mini-Schatzsuche: Jedes Kind denkt sich eine Sache aus, die alle finden sollen.",
    "Sammelt drei Dinge in der Natur mit derselben Farbe und baut daraus ein kleines Kunstwerk.",
    "Findet zusammen fünf runde und fünf eckige Dinge und legt daraus ein Bild auf dem Boden."
  ],
  en: [
    "Do a tiny treasure hunt: each child thinks of one thing everyone has to find.",
    "Collect three things in nature with the same colour and build a tiny artwork.",
    "Look for five round and five square objects and arrange them as a little picture."
  ],
  da: [
    "Lav en mini-skattejagt: Hvert barn finder på én ting, som alle skal finde.",
    "Saml tre ting i naturen med samme farve og lav et lille kunstværk sammen.",
    "Find fem runde og fem kantede ting og læg dem som et lille billede på jorden."
  ]
};

// ------------------------------------------------------
// globaler App-State (modulintern)
// ------------------------------------------------------

const appState = {
  map: null,
  markersLayer: null,
  allSpots: [],
  filteredSpots: [],
  hasShownMarkerLimitToast: false,
  currentLang: "de",
  travelMode: "everyday", // "everyday" | "trip"
  tilla: null,
  favorites: new Set(),
  plusActive: false,
  toastTimeoutId: null,
  defaultCenter: null // {lat,lng,zoom}? aus Index
};

const filters = {
  search: "",
  mood: null, // "relaxed" | "action" | "water" | "animals"
  radiusStep: 4, // 0..4 (4 = alle)
  category: "",
  age: "all", // "all" | "0-3" | "4-9" | "10+"
  verifiedOnly: false,
  quickFilters: new Set()
};

// ------------------------------------------------------
// Bootstrap
// ------------------------------------------------------

(async function bootstrap() {
  // Sprache aus Storage oder HTML ableiten
  appState.currentLang = loadStoredLanguage() || detectInitialLang();
  applyLanguage(appState.currentLang);

  // Theme wiederherstellen
  restoreTheme();

  // Map initialisieren
  const { map, markersLayer } = initMap();
  appState.map = map;
  appState.markersLayer = markersLayer;

  // Favoriten & Plus/Daylog laden (vor UI-Bindings sinnvoll)
  appState.favorites = loadFavoritesFromStorage();
  appState.plusActive = !!loadPlusCodeFromStorage();

  // Tilla initialisieren
  appState.tilla = new TillaCompanion({
    getText: (key) => {
      try {
        if (
          typeof window !== "undefined" &&
          window.I18N &&
          typeof window.I18N.t === "function"
        ) {
          return window.I18N.t(key);
        }
      } catch {
        // ignore
      }
      return key;
    }
  });

  // Reisemodus aus Storage
  const storedMode = loadTravelModeFromStorage();
  if (storedMode === "trip" || storedMode === "everyday") {
    appState.travelMode = storedMode;
    if (appState.tilla) {
      appState.tilla.setTravelMode(storedMode);
    }
  }

  // UI-Handler setzen
  setupLanguageSwitcher();
  setupThemeToggle();
  setupLocateButton();
  setupAboutViewToggle();
  setupViewToggle();
  setupPlayIdeaButton();
  setupFilters();
  setupCompass();
  setupPlusSection();
  setupDaylogSection();
  setupSpotListInteractions();

  // Plus-Status-Text initial anzeigen
  updatePlusStatusText();

  // Daylog-Text aus Storage in Textarea
  restoreDaylogText();

  // Daten laden & erste Darstellung
  await loadAndRenderSpots();
})();

// ------------------------------------------------------
// Sprach-Handling
// ------------------------------------------------------

function detectInitialLang() {
  try {
    const htmlLang = (document.documentElement.lang || "").toLowerCase();
    if (htmlLang.startsWith("en")) return "en";
    if (htmlLang.startsWith("da")) return "da";
  } catch {
    // ignore
  }

  if (typeof navigator !== "undefined" && navigator.language) {
    const nav = navigator.language.toLowerCase();
    if (nav.startsWith("en")) return "en";
    if (nav.startsWith("da")) return "da";
  }

  return "de";
}

function loadStoredLanguage() {
  try {
    const lang = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    if (!lang) return null;
    if (lang === "de" || lang === "en" || lang === "da") return lang;
  } catch {
    // ignore
  }
  return null;
}

function saveLanguage(lang) {
  try {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
  } catch {
    // ignore
  }
}

function applyLanguage(lang) {
  const docEl = document.documentElement;
  if (docEl) docEl.lang = lang;

  // generische data-i18n-* Attribute
  const attrName = `data-i18n-${lang}`;
  const elements = document.querySelectorAll(`[${attrName}]`);

  elements.forEach((el) => {
    const value = el.getAttribute(attrName);
    if (!value) return;

    const tag = el.tagName.toLowerCase();

    if (tag === "input" || tag === "textarea") {
      const type = /** @type {HTMLInputElement} */ (el).type;
      if (type === "text" || type === "search" || tag === "textarea") {
        /** @type {HTMLInputElement|HTMLTextAreaElement} */ (el).placeholder =
          value;
      }
    } else {
      el.textContent = value;
    }
  });

  updateAboutLanguage(lang);
  updateLanguageSwitcherUI(lang);

  // Tilla informieren
  if (appState.tilla) {
    appState.tilla.onLanguageChanged();
  }
}

function updateAboutLanguage(lang) {
  const de = document.getElementById("page-about-de");
  const en = document.getElementById("page-about-en");
  const da = document.getElementById("page-about-da");
  if (!de || !en || !da) return;

  [de, en, da].forEach((article) => {
    article.classList.add("hidden");
    article.setAttribute("aria-hidden", "true");
  });

  let active = de;
  if (lang === "en") active = en;
  else if (lang === "da") active = da;

  active.classList.remove("hidden");
  active.setAttribute("aria-hidden", "false");
}

function updateLanguageSwitcherUI(lang) {
  const flagEl = document.getElementById("language-switcher-flag");
  if (!flagEl) return;

  const symbol = lang === "en" ? "🇬🇧" : lang === "da" ? "🇩🇰" : "🇩🇪";
  const label = lang === "en" ? "English" : lang === "da" ? "Dansk" : "Deutsch";

  // Variante 1: <img id="language-switcher-flag">
  if (flagEl.tagName.toLowerCase() === "img") {
    const img = /** @type {HTMLImageElement} */ (flagEl);
    let src = "assets/flags/flag-de.svg";
    if (lang === "en") src = "assets/flags/flag-en.svg";
    else if (lang === "da") src = "assets/flags/flag-da.svg";
    img.src = src;
    img.alt = label;
    return;
  }

  // Variante 2: <span id="language-switcher-flag"> (Emoji)
  flagEl.textContent = symbol;
  flagEl.setAttribute("aria-label", label);
}

function setupLanguageSwitcher() {
  const btn = document.getElementById("language-switcher");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const order = ["de", "en", "da"];
    const currentIndex = order.indexOf(appState.currentLang);
    const next = order[(currentIndex + 1) % order.length];
    appState.currentLang = next;
    saveLanguage(next);
    applyLanguage(next);
  });
}

// ------------------------------------------------------
// Theme (light/dark)
// ------------------------------------------------------

function restoreTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.THEME);
    if (stored === "dark" || stored === "light") {
      document.documentElement.setAttribute("data-theme", stored);
    }
  } catch {
    // ignore
  }
}

function setupThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const current =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, next);
    } catch {
      // ignore
    }
  });
}

// ------------------------------------------------------
// Map: Locate-Button
// ------------------------------------------------------

function setupLocateButton() {
  const btn = document.getElementById("btn-locate");
  if (!btn || !appState.map) return;

  btn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      showToast(
        "Standortbestimmung wird von diesem Gerät/Browser nicht unterstützt."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (appState.map) {
          appState.map.setView([latitude, longitude], 12);
          showToast("Karte auf deinen Standort zentriert.");
        }
      },
      () => {
        showToast("Standort konnte nicht ermittelt werden.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

// ------------------------------------------------------
// Views: Karte / About
// ------------------------------------------------------

function setupAboutViewToggle() {
  const btnHelp = document.getElementById("btn-help");
  const viewMap = document.getElementById("view-map");
  const viewAbout = document.getElementById("view-about");
  if (!btnHelp || !viewMap || !viewAbout) return;

  btnHelp.addEventListener("click", () => {
    const mapActive = viewMap.classList.contains("view--active");
    if (mapActive) {
      viewMap.classList.remove("view--active");
      viewAbout.classList.add("view--active");
    } else {
      viewAbout.classList.remove("view--active");
      viewMap.classList.add("view--active");
    }
  });
}

// Sidebar ein-/ausblenden (Nur Karte)
function setupViewToggle() {
  const btn = document.getElementById("btn-toggle-view");
  const sidebar = document.getElementById("sidebar");
  if (!btn || !sidebar) return;

  btn.addEventListener("click", () => {
    const collapsed = sidebar.classList.toggle("sidebar--collapsed");
    btn.setAttribute("aria-pressed", collapsed ? "true" : "false");
    // der Text selbst wird über data-i18n gesteuert – hier kein Wechsel nötig
  });
}

// „Spielideen für unterwegs“ mit Tilla verbinden
function setupPlayIdeaButton() {
  const btn = document.getElementById("btn-play-idea");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const lang = appState.currentLang === "en" || appState.currentLang === "da"
      ? appState.currentLang
      : "de";
    const ideas = PLAY_IDEAS[lang] || PLAY_IDEAS.de;
    if (!ideas || ideas.length === 0) return;

    const idx = Math.floor(Math.random() * ideas.length);
    const idea = ideas[idx];

    if (appState.tilla) {
      appState.tilla.showPlayIdea(idea);
    }
  });
}

// ------------------------------------------------------
// Toast
// ------------------------------------------------------

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("toast--visible");

  if (appState.toastTimeoutId != null) {
    clearTimeout(appState.toastTimeoutId);
  }

  appState.toastTimeoutId = window.setTimeout(() => {
    toast.classList.remove("toast--visible");
  }, 3500);
}

// ------------------------------------------------------
// Daten laden & initiales Rendern
// ------------------------------------------------------

async function loadAndRenderSpots() {
  try {
    const { spots, index, fromCache } = await loadData();
    appState.allSpots = Array.isArray(spots) ? spots : [];

    const idx = index || getIndexData() || null;
    if (idx && idx.defaultLocation && appState.map) {
      const lat = Number(idx.defaultLocation.lat);
      const lng = Number(idx.defaultLocation.lng);
      const zoom =
        typeof idx.defaultLocation.zoom === "number"
          ? idx.defaultLocation.zoom
          : appState.map.getZoom();
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        appState.defaultCenter = { lat, lng, zoom };
        appState.map.setView([lat, lng], zoom);
      }
    }

    // Kategorie-Dropdown basierend auf Index (falls vorhanden) oder Spots befüllen
    populateCategoryOptions(appState.allSpots, idx);

    // Filter anwenden & UI rendern
    appState.filteredSpots = applyFilters();
    renderSpotsAndMap();

    if (fromCache) {
      showToast("Spots wurden aus dem Cache geladen (Offline-Modus).");
    }
  } catch (err) {
    console.error("[Family Spots] Fehler beim Laden der Daten:", err);
    showToast("Beim Laden der Spots ist ein Fehler aufgetreten.");
    appState.filteredSpots = [];
    renderSpotsAndMap();
    if (appState.tilla) {
      appState.tilla.onNoSpotsFound();
    }
  }
}

// ------------------------------------------------------
// Filter-Logik
// ------------------------------------------------------

function setupFilters() {
  const searchInput = /** @type {HTMLInputElement|null} */ (
    document.getElementById("filter-search")
  );
  const radiusInput = /** @type {HTMLInputElement|null} */ (
    document.getElementById("filter-radius")
  );
  const radiusDesc = document.getElementById("filter-radius-description");
  const radiusMaxLabel = document.getElementById("filter-radius-max-label");
  const categorySelect = /** @type {HTMLSelectElement|null} */ (
    document.getElementById("filter-category")
  );
  const ageSelect = /** @type {HTMLSelectElement|null} */ (
    document.getElementById("filter-age")
  );
  const verifiedCheckbox = /** @type {HTMLInputElement|null} */ (
    document.getElementById("filter-verified")
  );
  const filterToggleBtn = document.getElementById("btn-toggle-filters");
  const filterSection = document.getElementById("filter-section");

  // Suche
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      filters.search = searchInput.value.trim();
      updateFilteredSpots();
    });
  }

  // Radius
  if (radiusInput) {
    const updateRadiusTexts = () => {
      const step = Number(radiusInput.value || "4");
      filters.radiusStep = step;

      if (radiusMaxLabel) {
        if (step >= RADIUS_STEPS_KM.length - 1) {
          radiusMaxLabel.textContent = getRadiusLabelAll();
        } else {
          const km = RADIUS_STEPS_KM[step];
          radiusMaxLabel.textContent = `${km} km`;
        }
      }

      if (radiusDesc) {
        if (step >= RADIUS_STEPS_KM.length - 1) {
          radiusDesc.textContent =
            "Alle Spots – ohne Radiusbegrenzung. Die Karte gehört euch.";
        } else {
          const km = RADIUS_STEPS_KM[step];
          radiusDesc.textContent = `Spots im Umkreis von ca. ${km} km.`;
        }
      }

      radiusInput.setAttribute("aria-valuenow", String(step));
    };

    radiusInput.addEventListener("input", () => {
      updateRadiusTexts();
      updateFilteredSpots();
    });

    updateRadiusTexts();
  }

  // Kategorie
  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      filters.category = categorySelect.value || "";
      updateFilteredSpots();
    });
  }

  // Alter
  if (ageSelect) {
    ageSelect.addEventListener("change", () => {
      filters.age = ageSelect.value || "all";
      updateFilteredSpots();
    });
  }

  // Verifiziert
  if (verifiedCheckbox) {
    verifiedCheckbox.addEventListener("change", () => {
      filters.verifiedOnly = verifiedCheckbox.checked;
      updateFilteredSpots();
    });
  }

  // Schnellfilter (Quick-Filter-Chips)
  const quickFilterRow = document.getElementById("filter-tags");
  if (quickFilterRow) {
    quickFilterRow.addEventListener("click", (event) => {
      const btn = /** @type {HTMLElement|null} */ (
        event.target instanceof HTMLElement
          ? event.target.closest(".quick-filter-chip")
          : null
      );
      if (!btn) return;

      const id = btn.getAttribute("data-quick-id");
      if (!id) return;

      const isActive = btn.getAttribute("aria-pressed") === "true";
      const nextActive = !isActive;
      btn.setAttribute("aria-pressed", nextActive ? "true" : "false");
      btn.classList.toggle("quick-filter-chip--active", nextActive);

      if (nextActive) {
        filters.quickFilters.add(id);
      } else {
        filters.quickFilters.delete(id);
      }

      updateFilteredSpots();
    });
  }

  // Stimmung (Mood-Chips)
  const moodRow = document.querySelector(".mood-row");
  if (moodRow) {
    moodRow.addEventListener("click", (event) => {
      const btn = /** @type {HTMLElement|null} */ (
        event.target instanceof HTMLElement
          ? event.target.closest(".mood-chip")
          : null
      );
      if (!btn) return;

      const moodId = btn.getAttribute("data-mood");
      if (!moodId) return;

      const isActive = btn.getAttribute("aria-pressed") === "true";
      const willActivate = !isActive;

      // Alle Mood-Chips zurücksetzen
      const allChips = moodRow.querySelectorAll(".mood-chip");
      allChips.forEach((chip) => {
        chip.setAttribute("aria-pressed", "false");
        chip.classList.remove("mood-chip--active");
      });

      if (willActivate) {
        btn.setAttribute("aria-pressed", "true");
        btn.classList.add("mood-chip--active");
        filters.mood = moodId;
      } else {
        filters.mood = null;
      }

      updateFilteredSpots();
    });
  }

  // Filter anzeigen/ausblenden (Button im Header)
  if (filterToggleBtn && filterSection) {
    filterToggleBtn.addEventListener("click", () => {
      const expanded = filterToggleBtn.getAttribute("aria-expanded") === "true";
      const nextExpanded = !expanded;
      filterToggleBtn.setAttribute(
        "aria-expanded",
        nextExpanded ? "true" : "false"
      );
      filterSection.classList.toggle("filter-section--collapsed", !nextExpanded);
    });
  }
}

function getRadiusLabelAll() {
  // einfache i18n-Anmutung über aktuelle Sprache
  if (appState.currentLang === "en") return "All spots";
  if (appState.currentLang === "da") return "Alle spots";
  return "Alle Spots";
}

function updateFilteredSpots() {
  appState.filteredSpots = applyFilters();
  renderSpotsAndMap();

  if (appState.filteredSpots.length === 0) {
    if (appState.tilla) {
      appState.tilla.onNoSpotsFound();
    }
  } else {
    if (appState.tilla) {
      appState.tilla.onSpotsFound();
    }
  }
}

function applyFilters() {
  const spots = appState.allSpots;
  if (!Array.isArray(spots) || spots.length === 0) {
    return [];
  }

  const search = filters.search.toLowerCase();

  const hasRadiusLimit = filters.radiusStep < RADIUS_STEPS_KM.length - 1;
  const maxDistanceKm = hasRadiusLimit
    ? RADIUS_STEPS_KM[filters.radiusStep]
    : Infinity;

  const center =
    appState.defaultCenter && typeof appState.defaultCenter.lat === "number"
      ? appState.defaultCenter
      : null;

  return spots.filter((spot) => {
    if (!spot) return false;

    // Suchtext
    if (search) {
      const haystack = [
        spot.title,
        spot.name,
        spot.spotName,
        spot.description,
        spot.city,
        spot.region,
        spot.country,
        Array.isArray(spot.tags) ? spot.tags.join(" ") : "",
        Array.isArray(spot.categories) ? spot.categories.join(" ") : ""
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(search)) {
        return false;
      }
    }

    // Stimmung (Mood)
    if (filters.mood) {
      const moodField = spot.mood || spot.moods;
      let moodsArr = [];

      if (Array.isArray(moodField)) {
        moodsArr = moodField.map((m) => String(m));
      } else if (typeof moodField === "string") {
        moodsArr = moodField.split(",").map((m) => m.trim());
      }

      if (moodsArr.length && !moodsArr.includes(filters.mood)) {
        return false;
      }
    }

    // Kategorie
    if (filters.category) {
      const cat = String(filters.category);
      const spotCats = [];
      if (spot.category) spotCats.push(String(spot.category));
      if (Array.isArray(spot.categories)) {
        spotCats.push(...spot.categories.map((c) => String(c)));
      }
      if (!spotCats.some((c) => c === cat)) {
        return false;
      }
    }

    // Alter
    if (filters.age && filters.age !== "all") {
      let rangeMin = 0;
      let rangeMax = 99;

      if (filters.age === "0-3") {
        rangeMin = 0;
        rangeMax = 3;
      } else if (filters.age === "4-9") {
        rangeMin = 4;
        rangeMax = 9;
      } else if (filters.age === "10+") {
        rangeMin = 10;
        rangeMax = 99;
      }

      const sMin =
        typeof spot.ageMin === "number" && !Number.isNaN(spot.ageMin)
          ? spot.ageMin
          : 0;
      const sMax =
        typeof spot.ageMax === "number" && !Number.isNaN(spot.ageMax)
          ? spot.ageMax
          : 99;

      if (sMax < rangeMin || sMin > rangeMax) {
        return false;
      }
    }

    // Verifiziert
    if (filters.verifiedOnly) {
      const isVerified =
        !!spot.verified || !!spot.isVerified || spot.quality === "verified";
      if (!isVerified) return false;
    }

    // Quick-Filter (gegen Tags)
    if (filters.quickFilters.size > 0) {
      const tagSet = new Set();
      if (Array.isArray(spot.tags)) {
        spot.tags.forEach((t) => tagSet.add(String(t)));
      }
      if (Array.isArray(spot.quickTags)) {
        spot.quickTags.forEach((t) => tagSet.add(String(t)));
      }

      // alle Quick-Filter müssen erfüllt sein
      for (const q of filters.quickFilters) {
        if (!tagSet.has(q)) return false;
      }
    }

    // Radiusfilter (falls Default-Center vorhanden)
    if (center && hasRadiusLimit && Number.isFinite(maxDistanceKm)) {
      const lat = Number(spot.lat);
      const lng = Number(spot.lng);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
        const dist = haversineKm(center.lat, center.lng, lat, lng);
        if (dist > maxDistanceKm) return false;
      }
    }

    return true;
  });
}

// einfache Haversine-Berechnung in km
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Kategorie-Select: bevorzugt Index, sonst Spots
function populateCategoryOptions(spots, index) {
  const select = /** @type {HTMLSelectElement|null} */ (
    document.getElementById("filter-category")
  );
  if (!select) return;

  // erste Option („Alle Kategorien …“) merken
  const firstOption = select.options[0] || null;
  select.innerHTML = "";
  if (firstOption) {
    select.appendChild(firstOption);
  }

  const seen = new Set();
  const ids = [];

  // 1. Versuch: Kategorien aus dem Index lesen (falls vorhanden)
  if (index && Array.isArray(index.categories) && index.categories.length) {
    index.categories.forEach((c) => {
      let id = null;
      if (typeof c === "string") {
        id = c;
      } else if (c && typeof c === "object") {
        id = c.id || c.key || c.slug || c.value || null;
      }
      if (!id) return;
      const key = String(id);
      if (seen.has(key)) return;
      seen.add(key);
      ids.push(key);
    });
  } else {
    // Fallback: Kategorien aus den Spots ableiten
    spots.forEach((spot) => {
      if (!spot) return;
      const cat =
        spot.category ||
        (Array.isArray(spot.categories) ? spot.categories[0] : null);
      if (!cat) return;
      const key = String(cat);
      if (seen.has(key)) return;
      seen.add(key);
      ids.push(key);
    });
  }

  ids.sort((a, b) => a.localeCompare(b, "de"));

  ids.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

// ------------------------------------------------------
// Familien-Kompass / Reisemodus
// ------------------------------------------------------

function setupCompass() {
  const compassModeRow = document.querySelector(".compass-mode-row");
  const compassApplyBtn = document.getElementById("compass-apply");

  if (compassModeRow) {
    compassModeRow.addEventListener("click", (event) => {
      const btn = /** @type {HTMLElement|null} */ (
        event.target instanceof HTMLElement
          ? event.target.closest(".compass-mode-chip")
          : null
      );
      if (!btn) return;

      const mode = btn.getAttribute("data-travel-mode");
      if (mode !== "everyday" && mode !== "trip") return;

      const isActive = btn.getAttribute("aria-pressed") === "true";
      const willActivate = !isActive;

      // alle Chips zurücksetzen
      const allChips = compassModeRow.querySelectorAll(".compass-mode-chip");
      allChips.forEach((chip) => {
        chip.setAttribute("aria-pressed", "false");
        chip.classList.remove("compass-mode-chip--active");
      });

      if (willActivate) {
        btn.setAttribute("aria-pressed", "true");
        btn.classList.add("compass-mode-chip--active");
        appState.travelMode = mode;
        saveTravelModeToStorage(mode);
      } else {
        appState.travelMode = "everyday";
        saveTravelModeToStorage("everyday");
      }

      if (compassApplyBtn) {
        compassApplyBtn.classList.remove("hidden");
      }
    });
  }

  if (compassApplyBtn) {
    compassApplyBtn.addEventListener("click", () => {
      // hier könnte man Radius je nach Modus verändern – wir lassen den aktuellen Wert
      if (appState.tilla) {
        appState.tilla.onCompassApplied({
          travelMode: appState.travelMode,
          radiusStep: filters.radiusStep
        });
      }
      showToast("Kompass wurde angewendet.");
      updateFilteredSpots();
    });
  }
}

// ------------------------------------------------------
// Plus-Bereich
// ------------------------------------------------------

function setupPlusSection() {
  const input = /** @type {HTMLInputElement|null} */ (
    document.getElementById("plus-code-input")
  );
  const submit = document.getElementById("plus-code-submit");
  if (!input || !submit) return;

  submit.addEventListener("click", () => {
    const code = input.value.trim();
    if (!code) {
      appState.plusActive = false;
      savePlusCodeToStorage("");
      updatePlusStatusText();
      showToast("Family Spots Plus wurde deaktiviert.");
      return;
    }

    // aktuell: jeder nicht-leere Code aktiviert Plus
    appState.plusActive = true;
    savePlusCodeToStorage(code);
    updatePlusStatusText();
    if (appState.tilla) {
      appState.tilla.onPlusActivated();
    }
    showToast("Family Spots Plus ist jetzt aktiv.");
  });

  // falls bereits ein Code gespeichert: ins Input übernehmen
  const stored = loadPlusCodeFromStorage();
  if (stored && input.value.trim() === "") {
    input.value = stored;
  }
}

function updatePlusStatusText() {
  const el = document.getElementById("plus-status-text");
  if (!el) return;

  if (appState.plusActive) {
    el.textContent =
      appState.currentLang === "en"
        ? "Family Spots Plus is activated."
        : appState.currentLang === "da"
        ? "Family Spots Plus er aktiveret."
        : "Family Spots Plus ist aktiviert.";
  } else {
    // der Default-Text ist bereits im HTML/i18n hinterlegt
    // wir lassen ihn, falls Plus nicht aktiv ist
  }
}

// ------------------------------------------------------
// Daylog („Mein Tag“)
// ------------------------------------------------------

function setupDaylogSection() {
  const textarea = /** @type {HTMLTextAreaElement|null} */ (
    document.getElementById("daylog-text")
  );
  const btnSave = document.getElementById("daylog-save");
  if (!textarea || !btnSave) return;

  btnSave.addEventListener("click", () => {
    const value = textarea.value.trim();
    try {
      localStorage.setItem(STORAGE_KEYS.DAYLOG, value);
    } catch {
      // ignore
    }
    showToast("Dein Tag wurde gespeichert.");
    if (appState.tilla) {
      appState.tilla.onDaylogSaved();
    }
  });
}

function restoreDaylogText() {
  const textarea = /** @type {HTMLTextAreaElement|null} */ (
    document.getElementById("daylog-text")
  );
  if (!textarea) return;

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DAYLOG);
    if (stored != null) {
      textarea.value = stored;
    }
  } catch {
    // ignore
  }
}

// ------------------------------------------------------
// Favoriten
// ------------------------------------------------------

function loadFavoritesFromStorage() {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (!stored) return new Set();
    const arr = JSON.parse(stored);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.map((s) => String(s)));
  } catch {
    return new Set();
  }
}

function saveFavoritesToStorage() {
  try {
    const arr = Array.from(appState.favorites);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

function getSpotKey(spot, fallbackIndex) {
  if (spot && spot.id != null) {
    return `id:${String(spot.id)}`;
  }
  const name = (spot && (spot.title || spot.name || spot.spotName)) || "";
  const lat =
    spot && typeof spot.lat === "number" && !Number.isNaN(spot.lat)
      ? String(spot.lat)
      : "?";
  const lng =
    spot && typeof spot.lng === "number" && !Number.isNaN(spot.lng)
      ? String(spot.lng)
      : "?";
  return `${fallbackIndex}:${name}:${lat},${lng}`;
}

// ------------------------------------------------------
// Reisen / Travel-Mode in Storage
// ------------------------------------------------------

function loadTravelModeFromStorage() {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.TRAVEL_MODE);
    if (val === "trip" || val === "everyday") return val;
  } catch {
    // ignore
  }
  return null;
}

function saveTravelModeToStorage(mode) {
  try {
    localStorage.setItem(STORAGE_KEYS.TRAVEL_MODE, mode);
  } catch {
    // ignore
  }
}

// ------------------------------------------------------
// Plus-Code Storage
// ------------------------------------------------------

function loadPlusCodeFromStorage() {
  try {
    return localStorage.getItem(STORAGE_KEYS.PLUS_CODE) || "";
  } catch {
    return "";
  }
}

function savePlusCodeToStorage(code) {
  try {
    if (!code) {
      localStorage.removeItem(STORAGE_KEYS.PLUS_CODE);
    } else {
      localStorage.setItem(STORAGE_KEYS.PLUS_CODE, code);
    }
  } catch {
    // ignore
  }
}

// ------------------------------------------------------
// Spots + Map rendern
// ------------------------------------------------------

function renderSpotsAndMap() {
  const spots = appState.filteredSpots || [];

  renderSpotList(spots);
  appState.hasShownMarkerLimitToast = renderMarkers({
    map: appState.map,
    markersLayer: appState.markersLayer,
    spots,
    currentLang: appState.currentLang,
    showToast,
    hasShownMarkerLimitToast: appState.hasShownMarkerLimitToast,
    focusSpotOnMap
  });
}

// Spot-Liste
function renderSpotList(spots) {
  const listEl = document.getElementById("spot-list");
  if (!listEl) return;

  if (!Array.isArray(spots) || spots.length === 0) {
    listEl.innerHTML =
      '<p class="spot-list-empty">Keine Spots mit diesen Filtern gefunden.</p>';
    return;
  }

  let html = "";

  spots.forEach((spot, index) => {
    if (!spot) return;
    const title =
      spot.title || spot.name || spot.spotName || `Spot #${index + 1}`;
    const locationParts = [];
    if (spot.city) locationParts.push(String(spot.city));
    if (spot.region) locationParts.push(String(spot.region));
    if (spot.country) locationParts.push(String(spot.country));
    const locationText = locationParts.join(" · ");

    const key = getSpotKey(spot, index);
    const isFav = appState.favorites.has(key);

    html += `
      <article class="spot-card" data-spot-index="${index}">
        <header class="spot-card-header">
          <h3 class="spot-card-title">${escapeHtml(title)}</h3>
          <button
            type="button"
            class="spot-card-fav"
            aria-pressed="${isFav ? "true" : "false"}"
            aria-label="${isFav ? "Favorit entfernen" : "Zu Favoriten hinzufügen"}">
            ${isFav ? "★" : "☆"}
          </button>
        </header>
        ${
          locationText
            ? `<p class="spot-card-location">${escapeHtml(locationText)}</p>`
            : ""
        }
      </article>
    `;
  });

  listEl.innerHTML = html;
}

// Spot-Details
function renderSpotDetail(spot) {
  const detailEl = document.getElementById("spot-detail");
  if (!detailEl) return;

  if (!spot) {
    detailEl.classList.add("spot-details--hidden");
    detailEl.innerHTML = "";
    return;
  }

  const title =
    spot.title || spot.name || spot.spotName || String(spot.id || "Spot");
  const description = spot.description || "";
  const locationParts = [];
  if (spot.city) locationParts.push(String(spot.city));
  if (spot.region) locationParts.push(String(spot.region));
  if (spot.country) locationParts.push(String(spot.country));
  const locationText = locationParts.join(" · ");

  const routeUrls = getRouteUrlsForSpot(spot);

  let html = `
    <div class="spot-details-card">
      <header class="spot-details-header">
        <h3 class="spot-details-title">${escapeHtml(title)}</h3>
        ${
          locationText
            ? `<p class="spot-details-location">${escapeHtml(
                locationText
              )}</p>`
            : ""
        }
      </header>
  `;

  if (description) {
    html += `<p class="spot-details-description">${escapeHtml(
      description
    )}</p>`;
  }

  if (routeUrls) {
    html += `
      <div class="spot-details-actions">
        <a href="${routeUrls.apple}" target="_blank" rel="noopener" class="btn btn-small">
          Apple Maps
        </a>
        <a href="${routeUrls.google}" target="_blank" rel="noopener" class="btn btn-small">
          Google Maps
        </a>
      </div>
    `;
  }

  html += `</div>`;

  detailEl.innerHTML = html;
  detailEl.classList.remove("spot-details--hidden");
}

// ------------------------------------------------------
// Spot-Liste: Interaktionen (Karte fokussieren, Favoriten)
// ------------------------------------------------------

function setupSpotListInteractions() {
  const listEl = document.getElementById("spot-list");
  if (!listEl) return;

  listEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    // Favoriten-Button?
    const favBtn = target.closest(".spot-card-fav");
    if (favBtn) {
      handleFavoriteClick(favBtn);
      return;
    }

    // Karte fokussieren / Details öffnen
    const card = target.closest(".spot-card");
    if (!card) return;
    const indexStr = card.getAttribute("data-spot-index");
    if (!indexStr) return;
    const index = Number(indexStr);
    const spot = appState.filteredSpots[index];
    if (!spot) return;

    focusSpotOnMap(spot);
  });
}

function handleFavoriteClick(buttonEl) {
  const card = buttonEl.closest(".spot-card");
  if (!card) return;
  const indexStr = card.getAttribute("data-spot-index");
  if (!indexStr) return;
  const index = Number(indexStr);
  const spot = appState.filteredSpots[index];
  if (!spot) return;

  const key = getSpotKey(spot, index);
  const isFav = appState.favorites.has(key);
  const willBeFav = !isFav;

  if (willBeFav) {
    appState.favorites.add(key);
    buttonEl.textContent = "★";
    buttonEl.setAttribute("aria-pressed", "true");
    if (appState.tilla) {
      appState.tilla.onFavoriteAdded();
    }
  } else {
    appState.favorites.delete(key);
    buttonEl.textContent = "☆";
    buttonEl.setAttribute("aria-pressed", "false");
    if (appState.tilla) {
      appState.tilla.onFavoriteRemoved();
    }
  }

  saveFavoritesToStorage();
}

// Von Karte auf Spot fokussieren
function focusSpotOnMap(spot) {
  if (
    appState.map &&
    spot &&
    typeof spot.lat === "number" &&
    typeof spot.lng === "number"
  ) {
    appState.map.setView([spot.lat, spot.lng], appState.map.getZoom() || 12);
  }
  renderSpotDetail(spot);
}

// ------------------------------------------------------
// Hilfsfunktionen
// ------------------------------------------------------

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}