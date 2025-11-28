// js/app.js
// Family Spots Map – schlankes, PWA-freundliches Frontend
// --------------------------------------------------------
// Ziele:
// - Gute Lighthouse-Performance trotz Leaflet + MarkerCluster
// - Robuste Filter & UI für jetzt ~100 und später 5.000+ Spots
// - Minimaler Block auf dem Main Thread beim Initial-Load

/* =========================================================================
   Globale State-Objekte
   ========================================================================= */

const state = {
  spots: [],
  // Map von id -> Spot
  spotsById: new Map(),
  // id -> Leaflet Marker
  markersById: new Map(),
  filteredSpotIds: [],
  favorites: new Set(),
  userLocation: null, // { lat, lng }

  // Filter-Status
  filters: {
    search: "",
    category: "",
    mood: null,          // relaxed | action | water | animals
    age: "all",          // all | 0-3 | 4-9 | 10+
    radiusStep: 4,       // 0..4 (4 = alle)
    onlyBig: false,
    onlyVerified: false,
    onlyFavorites: false,
    travelMode: null,    // everyday | trip
  },

  // UI
  lang: "de",            // de | en
  isSidebarCollapsed: false,
  plus: {
    active: false,
    code: null
  }
};

let map;
let markerClusterGroup;
let radiusConfig; // wird nach DOM geladen gesetzt

/* =========================================================================
   Utility: DOM Helfer
   ========================================================================= */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));

function safeJSONParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/* =========================================================================
   THEME (Hell / Dunkel)
   ========================================================================= */

function initTheme() {
  const root = document.documentElement;
  const toggle = $("#theme-toggle");
  const stored = localStorage.getItem("fsm_theme");

  if (stored === "dark" || stored === "light") {
    root.dataset.theme = stored;
  } else {
    // System-Theme als Start
    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = prefersDark ? "dark" : "light";
  }

  toggle?.addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    localStorage.setItem("fsm_theme", next);
  });
}

/* =========================================================================
   SPRACHE / I18N (einfach, rein mit data-i18n-Attributen)
   ========================================================================= */

function applyStaticI18n(lang) {
  const other = lang === "de" ? "en" : "de";

  // Alle Elemente mit data-i18n-Attributen umschalten
  $$(`[data-i18n-${lang}]`).forEach((el) => {
    const text = el.getAttribute(`data-i18n-${lang}`);
    if (text != null) {
      // input/textarea placeholder?
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    }
  });

  // About-Seiten umschalten
  const pageDe = $("#page-about-de");
  const pageEn = $("#page-about-en");
  if (pageDe && pageEn) {
    const isDe = lang === "de";
    pageDe.classList.toggle("hidden", !isDe);
    pageDe.setAttribute("aria-hidden", String(!isDe));
    pageEn.classList.toggle("hidden", isDe);
    pageEn.setAttribute("aria-hidden", String(isDe));
  }

  // html lang-Attribut
  document.documentElement.lang = lang;

  // Language-Switcher Label
  const switcher = $("#language-switcher");
  if (switcher) {
    switcher.textContent = lang.toUpperCase();
    switcher.setAttribute(
      "aria-label",
      lang === "de" ? "Sprache: Deutsch" : "Language: English"
    );
  }
}

function initLanguage() {
  const storedLang = localStorage.getItem("fsm_lang");
  const initial =
    storedLang === "de" || storedLang === "en"
      ? storedLang
      : (navigator.language || "de").startsWith("de")
        ? "de"
        : "en";

  state.lang = initial;
  applyStaticI18n(initial);

  const switcher = $("#language-switcher");
  switcher?.addEventListener("click", () => {
    state.lang = state.lang === "de" ? "en" : "de";
    localStorage.setItem("fsm_lang", state.lang);
    applyStaticI18n(state.lang);
  });
}

/* =========================================================================
   NAVIGATION (Bottom Nav, Views)
   ========================================================================= */

function initNavigation() {
  const buttons = $$(".bottom-nav-item");
  const viewMap = $("#view-map");
  const viewAbout = $("#view-about");

  function setRoute(route) {
    buttons.forEach((btn) => {
      const isActive = btn.dataset.route === route;
      btn.classList.toggle("bottom-nav-item--active", isActive);
      btn.setAttribute("aria-current", isActive ? "page" : "false");
    });

    const showMap = route === "map";
    viewMap?.classList.toggle("view--active", showMap);
    viewAbout?.classList.toggle("view--active", !showMap);
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const route = btn.dataset.route || "map";
      setRoute(route);
    });
  });

  // Standard: Karte
  setRoute("map");
}

/* =========================================================================
   LANDSCAPE-WARNUNG (Mobile)
   ========================================================================= */

function initLandscapeWarning() {
  const warning = $(".landscape-warning");
  if (!warning) return;

  function update() {
    const isLandscape = window.innerWidth > window.innerHeight;
    const isMobile = window.innerWidth < 900;
    const show = isMobile && isLandscape;
    warning.setAttribute("aria-hidden", String(!show));
    warning.style.display = show ? "block" : "none";
  }

  window.addEventListener("resize", update);
  update();
}

/* =========================================================================
   FAVORITEN (localStorage)
   ========================================================================= */

function loadFavorites() {
  const ids = safeJSONParse(localStorage.getItem("fsm_favorites"), []);
  state.favorites = new Set(ids);
}

function saveFavorites() {
  localStorage.setItem(
    "fsm_favorites",
    JSON.stringify(Array.from(state.favorites))
  );
}

function toggleFavorite(spotId) {
  if (!spotId) return;
  if (state.favorites.has(spotId)) {
    state.favorites.delete(spotId);
  } else {
    state.favorites.add(spotId);
  }
  saveFavorites();
  renderSpotList(); // Sterne aktualisieren
}

/* =========================================================================
   DAYLOG („Mein Tag 💛“ – localStorage)
   ========================================================================= */

function initDaylog() {
  const textarea = $("#daylog-text");
  const btnSave = $("#daylog-save");
  if (!textarea || !btnSave) return;

  const key = "fsm_daylog";

  const saved = localStorage.getItem(key);
  if (saved != null) textarea.value = saved;

  btnSave.addEventListener("click", () => {
    localStorage.setItem(key, textarea.value);
    showToast(
      state.lang === "de"
        ? "Notiz gespeichert 💾"
        : "Note saved 💾"
    );
  });
}

/* =========================================================================
   FAMILY SPOTS PLUS (nur lokaler Status, kein Server)
   ========================================================================= */

function initPlus() {
  const input = $("#plus-code-input");
  const button = $("#plus-code-submit");
  const label = $("#plus-status-text");

  if (!input || !button || !label) return;

  const stored = safeJSONParse(localStorage.getItem("fsm_plus"), null);
  if (stored && stored.active && stored.code) {
    state.plus = stored;
    updatePlusStatusLabel(label);
  }

  button.addEventListener("click", () => {
    const code = input.value.trim();
    if (!code) return;

    // Aktuell: jeder beliebige Code aktiviert Plus lokal
    state.plus = { active: true, code };
    localStorage.setItem("fsm_plus", JSON.stringify(state.plus));
    updatePlusStatusLabel(label);
    showToast(
      state.lang === "de"
        ? "Family Spots Plus aktiviert ✨"
        : "Family Spots Plus activated ✨"
    );
  });
}

function updatePlusStatusLabel(labelEl) {
  if (!state.plus.active) {
    labelEl.textContent =
      state.lang === "de"
        ? "Family Spots Plus ist nicht aktiviert."
        : "Family Spots Plus is not activated.";
  } else {
    labelEl.textContent =
      state.lang === "de"
        ? `Family Spots Plus aktiv (Code: ${state.plus.code}).`
        : `Family Spots Plus active (code: ${state.plus.code}).`;
  }
}

/* =========================================================================
   TOST-NACHRICHTEN
   ========================================================================= */

let toastTimeout;

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("toast--visible");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("toast--visible");
  }, 2600);
}

/* =========================================================================
   TILLA – Spielideen für unterwegs (lazy JSON-Load)
   ========================================================================= */

async function loadPlayIdeas() {
  try {
    const res = await fetch("data/play-ideas.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn("[PlayIdeas] Fehler beim Laden:", err);
    // Fallback ein paar Ideen hardcoded
    return {
      de: [
        "Sucht drei Dinge in eurer Umgebung, die es zu Hause nicht gibt.",
        "Lasst euch gegenseitig Tiere ausdenken und nachmachen.",
        "Zählt, wie viele verschiedene Baumarten ihr auf dem Weg findet."
      ],
      en: [
        "Find three things around you that you don’t have at home.",
        "Invent funny animals and imitate them.",
        "Count how many different trees you can spot."
      ]
    };
  }
}

function initTilla() {
  const btn = $("#btn-play-idea");
  if (!btn) return;

  let ideasCache = null;

  btn.addEventListener("click", async () => {
    if (!ideasCache) {
      ideasCache = await loadPlayIdeas();
    }
    const list =
      state.lang === "de" ? ideasCache.de || [] : ideasCache.en || [];
    if (!list.length) return;

    const idea = list[Math.floor(Math.random() * list.length)];
    const textEl = $("#tilla-sidebar-text");
    if (textEl) textEl.textContent = idea;
  });
}

/* =========================================================================
   FILTER & UI-Interaktion
   ========================================================================= */

function initFilterUI() {
  const searchInput = $("#filter-search");
  const categorySelect = $("#filter-category");
  const ageSelect = $("#filter-age");
  const radiusInput = $("#filter-radius");
  const bigCheckbox = $("#filter-big-adventures");
  const verifiedCheckbox = $("#filter-verified");
  const favsCheckbox = $("#filter-favorites");

  const moodButtons = $$(".mood-chip");
  const travelChips = $$(".compass-mode-chip.travel-chip");
  const compassApplyBtn = $("#compass-apply");
  const compassApplyHelper = $("#compass-apply-helper");

  // Filter anzeigen / ausblenden
  const btnToggleFilters = $("#btn-toggle-filters");
  const filterSection = $("#filter-section");
  btnToggleFilters?.addEventListener("click", () => {
    const expanded =
      btnToggleFilters.getAttribute("aria-expanded") === "true";
    const next = !expanded;
    btnToggleFilters.setAttribute("aria-expanded", String(next));
    filterSection?.classList.toggle("sidebar-section--collapsed", !next);
    btnToggleFilters.textContent =
      state.lang === "de"
        ? next
          ? "Filter ausblenden"
          : "Filter anzeigen"
        : next
          ? "Hide filters"
          : "Show filters";
  });

  // Suchfeld
  searchInput?.addEventListener("input", () => {
    state.filters.search = searchInput.value.trim().toLowerCase();
    applyFiltersAndRender();
  });

  // Kategorie
  categorySelect?.addEventListener("change", () => {
    state.filters.category = categorySelect.value || "";
    applyFiltersAndRender();
  });

  // Alter
  ageSelect?.addEventListener("change", () => {
    state.filters.age = ageSelect.value || "all";
    applyFiltersAndRender();
  });

  // Mood Chips
  moodButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const mood = btn.dataset.mood || null;
      const isActive = state.filters.mood === mood;
      state.filters.mood = isActive ? null : mood;

      moodButtons.forEach((b) =>
        b.setAttribute(
          "aria-pressed",
          String(!isActive && b.dataset.mood === mood)
        )
      );

      applyFiltersAndRender();
    });
  });

  // Compass Travel Mode
  travelChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const mode = chip.dataset.travelMode || null;
      const isActive = state.filters.travelMode === mode;
      state.filters.travelMode = isActive ? null : mode;

      travelChips.forEach((c) =>
        c.setAttribute(
          "aria-pressed",
          String(!isActive && c.dataset.travelMode === mode)
        )
      );

      // Apply-Button sichtbar machen, wenn etwas gewählt
      const hasMode = !!state.filters.travelMode;
      compassApplyBtn?.classList.toggle("hidden", !hasMode);

      if (compassApplyHelper) {
        if (!hasMode) {
          compassApplyHelper.textContent =
            state.lang === "de"
              ? "Klick auf „Kompass anwenden“, dann passen wir den Umkreis automatisch an eure Wahl an."
              : 'Tap "Apply compass" and we’ll automatically adjust the radius.';
        } else {
          compassApplyHelper.textContent =
            state.lang === "de"
              ? "Du hast einen Modus gewählt – jetzt unten auf „Kompass anwenden“ tippen."
              : "You chose a mode – now tap “Apply compass”.";
        }
      }
    });
  });

  compassApplyBtn?.addEventListener("click", () => {
    // einfache Logik: Alltag = kleiner Radius, Tagestour = größer
    const mode = state.filters.travelMode;
    const radiusInput = $("#filter-radius");
    if (!radiusInput) return;

    if (mode === "everyday") {
      radiusInput.value = "1"; // z. B. 5 km
    } else if (mode === "trip") {
      radiusInput.value = "3"; // z. B. 40 km
    }
    state.filters.radiusStep = Number(radiusInput.value) || 4;
    updateRadiusDescription();
    applyFiltersAndRender();
  });

  // Radius
  radiusInput?.addEventListener("input", () => {
    state.filters.radiusStep = Number(radiusInput.value) || 4;
    updateRadiusDescription();
    applyFiltersAndRender();
  });
  updateRadiusDescription();

  // Checkboxen
  bigCheckbox?.addEventListener("change", () => {
    state.filters.onlyBig = bigCheckbox.checked;
    applyFiltersAndRender();
  });
  verifiedCheckbox?.addEventListener("change", () => {
    state.filters.onlyVerified = verifiedCheckbox.checked;
    applyFiltersAndRender();
  });
  favsCheckbox?.addEventListener("change", () => {
    state.filters.onlyFavorites = favsCheckbox.checked;
    applyFiltersAndRender();
  });

  // Sidebar vs „Nur Karte“
  const btnToggleView = $("#btn-toggle-view");
  const sidebar = $("#sidebar");
  btnToggleView?.addEventListener("click", () => {
    state.isSidebarCollapsed = !state.isSidebarCollapsed;
    sidebar?.classList.toggle("sidebar--collapsed", state.isSidebarCollapsed);
    btnToggleView.setAttribute("aria-pressed", String(state.isSidebarCollapsed));
    btnToggleView.textContent =
      state.lang === "de"
        ? state.isSidebarCollapsed
          ? "Liste anzeigen"
          : "Nur Karte"
        : state.isSidebarCollapsed
          ? "Show list"
          : "Map only";
  });
}

/* =========================================================================
   RADIUS-BERECHNUNG
   ========================================================================= */

function initRadiusConfig() {
  // 0..4 -> Konfiguration (km + Texte für de/en)
  radiusConfig = [
    {
      km: 2,
      labelDe: "Um die Ecke",
      labelEn: "Just around the corner",
      descDe: "Bis ca. 2 km – perfekt für kleine Alltags-Abenteuer.",
      descEn: "Up to ~2 km – perfect for tiny everyday adventures."
    },
    {
      km: 5,
      labelDe: "Kurz raus",
      labelEn: "Short trip",
      descDe: "Bis ca. 5 km – eine kleine Runde nach Feierabend.",
      descEn: "Up to ~5 km – a little after-work trip."
    },
    {
      km: 15,
      labelDe: "Ausflug in der Region",
      labelEn: "Regional outing",
      descDe: "Bis ca. 15 km – ideal für den halben Tag.",
      descEn: "Up to ~15 km – nice for a half-day trip."
    },
    {
      km: 40,
      labelDe: "Tagestour",
      labelEn: "Day trip",
      descDe: "Bis ca. 40 km – ein voller Familien-Abenteuer-Tag.",
      descEn: "Up to ~40 km – a full family adventure day."
    },
    {
      km: null,
      labelDe: "Alle Spots",
      labelEn: "All spots",
      descDe: "Alle Spots – ohne Radiusbegrenzung. Die Karte gehört euch.",
      descEn: "All spots – no radius limit. The map is all yours."
    }
  ];
}

function updateRadiusDescription() {
  const radiusInput = $("#filter-radius");
  const labelEl = $("#filter-radius-max-label");
  const descEl = $("#filter-radius-description");
  if (!radiusInput || !labelEl || !descEl || !radiusConfig) return;

  const idx = Number(radiusInput.value) || 4;
  const conf = radiusConfig[idx] || radiusConfig[radiusConfig.length - 1];

  labelEl.textContent = state.lang === "de" ? conf.labelDe : conf.labelEn;
  descEl.textContent = state.lang === "de" ? conf.descDe : conf.descEn;
}

function getActiveRadiusKm() {
  const step = state.filters.radiusStep ?? 4;
  const conf = radiusConfig[step] || radiusConfig[radiusConfig.length - 1];
  return conf.km; // null = kein Limit
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
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

/* =========================================================================
   MAP & SPOTS – Lazy Map-Init + chunked MarkerCluster
   ========================================================================= */

function deferMapInit() {
  // Map erst nach window.load initialisieren, damit HTML/CSS zuerst gerendert wird
  if (document.readyState === "complete") {
    initMap();
  } else {
    window.addEventListener("load", initMap, { once: true });
  }
}

function initMap() {
  if (!window.L) {
    console.warn("[Map] Leaflet nicht geladen.");
    return;
  }

  const mapContainer = $("#map");
  if (!mapContainer) return;

  map = L.map(mapContainer, {
    preferCanvas: true,
    worldCopyJump: true
  }).setView([51.16, 10.45], 6); // Mitte DE als Start

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  markerClusterGroup = L.markerClusterGroup({
    chunkedLoading: true,
    chunkDelay: 50,
    chunkInterval: 200,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    maxClusterRadius: 60
  });

  map.addLayer(markerClusterGroup);

  initGeolocationButton();
  scheduleSpotsLoading();
}

function initGeolocationButton() {
  const btn = $("#btn-locate");
  if (!btn || !map) return;

  btn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      showToast(
        state.lang === "de"
          ? "Standort wird von deinem Browser nicht unterstützt."
          : "Geolocation is not supported by your browser."
      );
      return;
    }

    btn.disabled = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        btn.disabled = false;
        const { latitude, longitude } = pos.coords;
        state.userLocation = { lat: latitude, lng: longitude };
        map.setView([latitude, longitude], 11, { animate: true });
        applyFiltersAndRender();
      },
      (err) => {
        btn.disabled = false;
        console.warn("[Geolocation] Fehler:", err);
        showToast(
          state.lang === "de"
            ? "Standort konnte nicht ermittelt werden."
            : "Could not determine your location."
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  });
}

function scheduleSpotsLoading() {
  // Spots lazy laden – zuerst UI, dann Daten & Marker
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(loadSpots, { timeout: 3000 });
  } else {
    setTimeout(loadSpots, 800);
  }
}

async function loadSpots() {
  if (state.spots.length) return; // schon geladen

  try {
    const res = await fetch("data/spots.json", { cache: "no-store" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    const list = Array.isArray(json) ? json : json.spots || [];

    state.spots = list.map((raw, index) => prepareSpot(raw, index));
    state.spotsById = new Map(
      state.spots.map((s) => [String(s.id), s])
    );

    buildCategoryOptionsFromSpots();
    createAllMarkersOnce();
    applyFiltersAndRender();
  } catch (err) {
    console.error("[Spots] Fehler beim Laden:", err);
    showToast(
      state.lang === "de"
        ? "Spots konnten nicht geladen werden."
        : "Spots could not be loaded."
    );
  }
}

function prepareSpot(raw, index) {
  const id = raw.id != null ? raw.id : `spot-${index}`;

  // Koordinaten robust auslesen
  const lat =
    raw.lat ??
    raw.latitude ??
    (raw.location && raw.location.lat);
  const lng =
    raw.lng ??
    raw.longitude ??
    (raw.location && raw.location.lng);

  const name = raw.name || raw.title || "Spot";
  const city = raw.city || raw.town || raw.place || "";
  const category = raw.category || raw.type || "";

  const tags = Array.isArray(raw.tags) ? raw.tags : [];
  const verified =
    !!raw.verified ||
    !!raw.isVerified ||
    (Array.isArray(raw.flags) && raw.flags.includes("verified"));

  const bigAdventure =
    !!raw.bigAdventure ||
    tags.some((t) => String(t).toLowerCase().includes("big"));

  // Alter als einfacher String (z. B. "0-3", "4-9", "10+")
  const age =
    raw.age ||
    raw.ageGroup ||
    (raw.meta && raw.meta.age) ||
    "";

  const searchBlob = [
    name,
    city,
    category,
    tags.join(" "),
    raw.description || ""
  ]
    .join(" ")
    .toLowerCase();

  // optionaler Mood (aus Tags ableiten)
  let mood = raw.mood || null;
  if (!mood && tags.length) {
    const lower = tags.join(" ").toLowerCase();
    if (lower.includes("wasser") || lower.includes("strand")) mood = "water";
    else if (lower.includes("tier") || lower.includes("zoo")) mood = "animals";
    else if (lower.includes("klettern") || lower.includes("pumptrack"))
      mood = "action";
    else mood = "relaxed";
  }

  return {
    ...raw,
    id,
    lat,
    lng,
    name,
    city,
    category,
    tags,
    verified,
    bigAdventure,
    age,
    mood,
    _search: searchBlob
  };
}

function createAllMarkersOnce() {
  if (!map || !markerClusterGroup) return;

  state.markersById.clear();
  markerClusterGroup.clearLayers();

  state.spots.forEach((spot) => {
    if (typeof spot.lat !== "number" || typeof spot.lng !== "number") {
      return;
    }
    const marker = L.marker([spot.lat, spot.lng], {
      title: spot.name
    });

    marker.on("click", () => {
      openSpotDetail(spot.id);
    });

    state.markersById.set(String(spot.id), marker);
    markerClusterGroup.addLayer(marker);
  });
}

/* =========================================================================
   FILTERLOGIK
   ========================================================================= */

function applyFiltersAndRender() {
  if (!state.spots.length) return;

  const {
    search,
    category,
    mood,
    age,
    radiusStep,
    onlyBig,
    onlyVerified,
    onlyFavorites
  } = state.filters;

  const searchTerm = search.trim();
  const radiusKm = getActiveRadiusKm();
  const hasRadiusFilter = radiusKm != null && state.userLocation;

  const filteredIds = [];

  for (const spot of state.spots) {
    // Favoriten
    if (onlyFavorites && !state.favorites.has(String(spot.id))) continue;

    // Kategorie
    if (category && spot.category !== category) continue;

    // Mood
    if (mood && spot.mood && spot.mood !== mood) continue;

    // Age
    if (age && age !== "all") {
      const ageStr = String(spot.age || "").toLowerCase();
      if (!ageStr.includes(age)) continue;
    }

    // Big Adventures
    if (onlyBig && !spot.bigAdventure) continue;

    // Verified
    if (onlyVerified && !spot.verified) continue;

    // Search
    if (searchTerm && !spot._search.includes(searchTerm)) continue;

    // Radius (wenn wir User-Location kennen)
    if (hasRadiusFilter && typeof spot.lat === "number" && typeof spot.lng === "number") {
      const d = haversineKm(
        state.userLocation.lat,
        state.userLocation.lng,
        spot.lat,
        spot.lng
      );
      if (d > radiusKm) continue;
    }

    filteredIds.push(String(spot.id));
  }

  state.filteredSpotIds = filteredIds;
  renderSpotList();
  renderMapMarkers();
}

/* =========================================================================
   MAP MARKER RENDERING (nur ein-/ausblenden, nicht neu bauen)
   ========================================================================= */

function renderMapMarkers() {
  if (!markerClusterGroup) return;

  // einfache Strategie:
  // - Alle Marker entfernen
  // - Gefilterte Marker wieder hinzufügen
  markerClusterGroup.clearLayers();

  const MAX_MARKERS = 1200; // Sicherheitslimit für Performance

  let limitedList = state.filteredSpotIds;
  if (state.filteredSpotIds.length > MAX_MARKERS) {
    limitedList = state.filteredSpotIds.slice(0, MAX_MARKERS);
    showToast(
      state.lang === "de"
        ? `Es werden ${MAX_MARKERS} von ${state.filteredSpotIds.length} Spots angezeigt (Filter weiter eingrenzen für mehr Überblick).`
        : `Showing ${MAX_MARKERS} of ${state.filteredSpotIds.length} spots (use filters to narrow further).`
    );
  }

  limitedList.forEach((id) => {
    const marker = state.markersById.get(id);
    if (marker) markerClusterGroup.addLayer(marker);
  });
}

/* =========================================================================
   SPOT-LISTE & DETAIL
   ========================================================================= */

function renderSpotList() {
  const listEl = $("#spot-list");
  if (!listEl) return;

  if (!state.filteredSpotIds.length) {
    listEl.innerHTML =
      state.lang === "de"
        ? "<p>Keine Spots gefunden. Bitte Filter anpassen.</p>"
        : "<p>No spots found. Try changing the filters.</p>";
    return;
  }

  const parts = [];

  state.filteredSpotIds.forEach((id) => {
    const spot = state.spotsById.get(id);
    if (!spot) return;

    const isFav = state.favorites.has(id);
    const favClass = isFav ? "spot-card__fav spot-card__fav--active" : "spot-card__fav";
    const verifiedBadge = spot.verified
      ? '<span class="spot-badge spot-badge--verified">✔</span>'
      : "";

    const bigBadge = spot.bigAdventure
      ? '<span class="spot-badge spot-badge--big">⭐</span>'
      : "";

    const city = spot.city ? ` – ${spot.city}` : "";

    parts.push(`
      <article class="spot-card" data-spot-id="${id}">
        <header class="spot-card__header">
          <h3 class="spot-card__title">${escapeHTML(spot.name)}${city}</h3>
          <button
            type="button"
            class="${favClass}"
            aria-label="${isFav ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}">
            ★
          </button>
        </header>
        <p class="spot-card__meta">
          ${escapeHTML(spot.category || "")}
          ${verifiedBadge}
          ${bigBadge}
        </p>
        <button type="button" class="spot-card__open-map">
          ${state.lang === "de" ? "Auf Karte anzeigen" : "Show on map"}
        </button>
      </article>
    `);
  });

  listEl.innerHTML = parts.join("");

  // Events für Karten
  listEl.querySelectorAll(".spot-card__fav").forEach((btn) => {
    const card = btn.closest(".spot-card");
    const id = card?.dataset.spotId;
    if (!id) return;
    btn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      toggleFavorite(id);
    });
  });

  listEl.querySelectorAll(".spot-card__open-map").forEach((btn) => {
    const card = btn.closest(".spot-card");
    const id = card?.dataset.spotId;
    if (!id) return;
    btn.addEventListener("click", () => openSpotDetail(id));
  });
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function openSpotDetail(id) {
  const detail = $("#spot-detail");
  const spot = state.spotsById.get(String(id));
  if (!detail || !spot) return;

  const city = spot.city ? `, ${escapeHTML(spot.city)}` : "";
  const category = escapeHTML(spot.category || "");
  const verified = spot.verified
    ? state.lang === "de"
      ? "Verifizierter Spot"
      : "Verified spot"
    : "";

  detail.innerHTML = `
    <div class="spot-details__inner">
      <header class="spot-details__header">
        <h2 class="spot-details__title">${escapeHTML(spot.name)}${city}</h2>
        <button type="button" class="spot-details__close" aria-label="Detail schließen">×</button>
      </header>
      <p class="spot-details__meta">
        ${category}
        ${verified ? ` • ${verified}` : ""}
      </p>
      ${
        spot.description
          ? `<p class="spot-details__description">${escapeHTML(
              spot.description
            )}</p>`
          : ""
      }
    </div>
  `;
  detail.classList.remove("spot-details--hidden");

  detail
    .querySelector(".spot-details__close")
    ?.addEventListener("click", () => {
      detail.classList.add("spot-details--hidden");
    });

  if (map && typeof spot.lat === "number" && typeof spot.lng === "number") {
    map.setView([spot.lat, spot.lng], 13, { animate: true });
  }
}

/* =========================================================================
   Kategorien-Select dynamisch aus den Spots
   ========================================================================= */

function buildCategoryOptionsFromSpots() {
  const select = $("#filter-category");
  if (!select || !state.spots.length) return;

  const categories = new Set();
  state.spots.forEach((s) => {
    if (s.category) categories.add(s.category);
  });

  const currentValue = select.value;

  const options = [
    `<option value="">${
      state.lang === "de" ? "Alle Kategorien" : "All categories"
    }</option>`
  ];

  Array.from(categories)
    .sort((a, b) => a.localeCompare(b, "de"))
    .forEach((cat) => {
      options.push(
        `<option value="${escapeHTML(cat)}">${escapeHTML(cat)}</option>`
      );
    });

  select.innerHTML = options.join("");
  select.value = currentValue || "";
}

/* =========================================================================
   APP INITIALISIEREN
   ========================================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initLanguage();
  initNavigation();
  initLandscapeWarning();
  initDaylog();
  initPlus();
  initTilla();
  initRadiusConfig();
  initFilterUI();
  loadFavorites();
  deferMapInit();
});