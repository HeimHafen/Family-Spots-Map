// js/app.js
// ======================================================
// Family Spots Map – Hauptlogik (Map, Filter, Tilla, UI)
// ======================================================

import { TillaCompanion } from "./tilla.js";

// ------------------------------------------------------
// Sprach-Tabelle (DE / EN) – inkl. Tilla & Toasts
// ------------------------------------------------------
const UI_STRINGS = {
  de: {
    // Fehler / Status
    error_data_load:
      "Die Daten konnten gerade nicht geladen werden. Versuch es gleich noch einmal.",
    toast_location_ok:
      "Euer Standort ist gesetzt – viel Spaß beim nächsten Abenteuer! 🌍",
    toast_location_error:
      "Euer Standort lässt sich gerade nicht bestimmen. Vielleicht ist die Freigabe gesperrt oder ihr seid offline.",

    // Buttons
    btn_show_list: "Liste zeigen",
    btn_only_map: "Nur Karte",
    btn_show_filters: "Filter anzeigen",
    btn_hide_filters: "Filter ausblenden",

    // Favoriten
    toast_fav_added: "Zu euren Lieblingsspots gelegt 💛",
    toast_fav_removed: "Aus den Lieblingsspots entfernt.",

    // Filter allgemein
    filter_category_all: "Alle Kategorien",

    // Plus-Code
    plus_code_empty: "Bitte gib zuerst einen Aktions-Code ein.",
    plus_code_unknown: "Dieser Code ist unbekannt oder nicht mehr gültig.",
    plus_code_activated:
      "Family Spots Plus wurde aktiviert – gute Fahrt & viel Freude auf euren Touren!",
    plus_code_failed:
      "Der Code konnte gerade nicht geprüft werden. Versuch es später noch einmal.",

    // Radius
    filter_radius_max_label: "Alle Spots",
    filter_radius_description_step0:
      "Mini-Microabenteuer zu Fuß erreichbar – perfekt für eine kurze Pause.",
    filter_radius_description_step1:
      "Kurze Ausflüge in Fahrrad- oder Autoentfernung – schnell dort, schnell wieder zurück.",
    filter_radius_description_step2:
      "Eine kleine Familientour – genau richtig für einen halben Tag voller Erlebnisse.",
    filter_radius_description_step3:
      "Großer Abenteuer-Radius – hier warten Ziele für ganze Tagesausflüge.",
    filter_radius_description_all:
      "Alle Spots – ohne Radiusbegrenzung. Die Karte gehört euch.",

    // Tilla – Intro & Zustände
    turtle_intro_1:
      "Hallo, ich bin Tilla – eure Schildkröten-Begleiterin für entspannte Familien-Abenteuer!",
    turtle_intro_2:
      "Gerade finde ich keinen passenden Spot. Vielleicht passt heute ein kleiner Spaziergang in eurer Nähe – oder ihr dreht den Radius ein Stück weiter auf. 🐢",
    turtle_after_daylog_save:
      "Schön, dass ihr euren Tag festhaltet. Solche kleinen Notizen werden später zu großen Erinnerungen. 💛",
    turtle_after_fav_added:
      "Diesen Ort merkt ihr euch – eine kleine Perle auf eurer Familienkarte. ⭐",
    turtle_after_fav_removed:
      "Alles gut – manchmal passen Orte nur zu bestimmten Phasen. Ich helfe euch, neue zu finden. 🐢",
    turtle_trip_mode:
      "Ihr seid unterwegs – ich halte Ausschau nach guten Zwischenstopps für euch. 🚐",
    turtle_everyday_mode:
      "Alltag darf auch leicht sein. Lass uns schauen, was in eurer Nähe ein Lächeln zaubert. 🌿",
    turtle_plus_activated:
      "Family Spots Plus ist aktiv – jetzt entdecke ich auch Rastplätze, Stellplätze und Camping-Spots für euch. ✨",

    // Mein Tag
    daylog_saved:
      "Dein Tagesmoment ist gespeichert 💾 – später könnt ihr euch daran erinnern.",

    // Header / Navigation (dynamisch)
    header_tagline: "Heute ist Familientag.",
    nav_map: "Karte",
    nav_about: "Über"
  },
  en: {
    error_data_load:
      "Oops – we couldn’t load the data right now. Please try again in a moment.",
    toast_location_ok:
      "Your starting point is set – have fun on your next adventure!",
    toast_location_error:
      "We couldn’t access your location. Please check permissions or zoom into your region manually.",

    btn_show_list: "Show list",
    btn_only_map: "Map only",
    btn_show_filters: "Show filters",
    btn_hide_filters: "Hide filters",

    toast_fav_added: "Added to your favourite places.",
    toast_fav_removed: "Removed from your favourite places.",

    filter_category_all: "All categories",

    plus_code_empty: "Please enter an action code first.",
    plus_code_unknown: "This code is unknown or no longer valid.",
    plus_code_activated:
      "Family Spots Plus has been activated – enjoy your trips!",
    plus_code_failed:
      "The code could not be verified right now. Please try again later.",

    filter_radius_max_label: "All spots",
    filter_radius_description_step0:
      "Tiny micro adventures within walking distance – perfect for a quick break.",
    filter_radius_description_step1:
      "Short trips for spontaneous outings – hop in the car or on the bike and you’re there.",
    filter_radius_description_step2:
      "A small family tour – just right for a half day full of experiences.",
    filter_radius_description_step3:
      "Big adventure radius – destinations for full-day trips are waiting here.",
    filter_radius_description_all:
      "All spots – no radius limit. The map is all yours.",

    turtle_intro_1:
      "Hi, I’m Tilla – your turtle companion for slow & relaxed family adventures!",
    turtle_intro_2:
      "Right now I can’t find a fitting spot. Maybe a small walk nearby is perfect today – or you widen the radius a little. 🐢",
    turtle_after_daylog_save:
      "Nice that you captured your day. These small notes turn into big memories later. 💛",
    turtle_after_fav_added:
      "You’ve saved this place – a small gem on your family map. ⭐",
    turtle_after_fav_removed:
      "All good – some places only fit certain phases. I’ll help you find new ones. 🐢",
    turtle_trip_mode:
      "You’re on the road – I’ll watch out for good stopovers for you. 🚐",
    turtle_everyday_mode:
      "Everyday life can feel light, too. Let’s see what nearby spot can bring a smile today. 🌿",
    turtle_plus_activated:
      "Family Spots Plus is active – I can now show you rest areas, RV spots and campgrounds as well. ✨",

    daylog_saved:
      "Your day moment has been saved 💾 – you can look back on it later.",

    header_tagline: "Make today a family day.",
    nav_map: "Map",
    nav_about: "About"
  }
};

// ------------------------------------------------------
// Kategorie-Labels für das Dropdown
// (Keys = Slugs aus data/spots.json)
// ------------------------------------------------------
const CATEGORY_LABELS = {
  wildpark: {
    de: "Wildpark & Safaripark",
    en: "Wildlife park / safari"
  },
  zoo: {
    de: "Zoo",
    en: "Zoo"
  },
  freizeitpark: {
    de: "Freizeitpark",
    en: "Theme park"
  },
  spielplatz: {
    de: "Spielplatz",
    en: "Playground"
  },
  abenteuerspielplatz: {
    de: "Abenteuerspielplatz",
    en: "Adventure playground"
  },
  multifunktionsfeld: {
    de: "Sport- & Multifunktionsfeld",
    en: "Sports & multi court"
  },
  waldspielplatz: {
    de: "Waldspielplatz",
    en: "Forest playground"
  },
  kinder_museum: {
    de: "Kinder- & Familienmuseum",
    en: "Children’s & family museum"
  },
  pumptrack: {
    de: "Pumptrack",
    en: "Pump track"
  },
  skatepark: {
    de: "Skatepark",
    en: "Skate park"
  }
};

// ------------------------------------------------------
// Globale State-Variablen
// ------------------------------------------------------
let currentLang = "de";
let currentTheme = "light";

let map;
let markersLayer;
let spots = [];
let filteredSpots = [];
let favorites = new Set();

let plusActive = false;
let moodFilter = null; // "relaxed" | "action" | "water" | "animals" | null
let travelMode = "everyday"; // "everyday" | "trip" | null
let radiusStep = 4; // 0–4
let ageFilter = "all"; // "all" | "0-3" | "4-9" | "10+"
let searchTerm = "";
let categoryFilter = "";
let onlyBigAdventures = false;
let onlyVerified = false;
let onlyFavorites = false;

// DOM-Elemente (werden in init() gesetzt)
let languageSwitcherEl;
let themeToggleEl;
let btnLocateEl;
let btnHelpEl;
let headerTaglineEl;
let viewMapEl;
let viewAboutEl;
let bottomNavButtons;
let bottomNavMapLabelEl;
let bottomNavAboutLabelEl;
let sidebarEl;
let filterSectionEl;
let btnToggleFiltersEl;
let btnToggleViewEl;
let filterSearchEl;
let filterCategoryEl;
let filterAgeEl;
let filterRadiusEl;
let filterRadiusMaxLabelEl;
let filterRadiusDescriptionEl;
let filterBigEl;
let filterVerifiedEl;
let filterFavoritesEl;
let spotListEl;
let spotDetailEl;
let plusCodeInputEl;
let plusCodeSubmitEl;
let plusStatusTextEl;
let daylogTextEl;
let daylogSaveEl;
let toastEl;

// Tilla
let tilla = null;

// Radius-Stufen (km)
const RADIUS_STEPS_KM = [1, 5, 15, 40, Infinity];

// ------------------------------------------------------
// Utility: Sprache & Übersetzung
// ------------------------------------------------------
function getInitialLang() {
  const stored = localStorage.getItem("fs_lang");
  if (stored === "de" || stored === "en") {
    return stored;
  }

  const htmlLang =
    (document.documentElement.lang || navigator.language || "de")
      .toLowerCase()
      .slice(0, 2);

  return htmlLang === "en" ? "en" : "de";
}

function t(key) {
  const table = UI_STRINGS[currentLang] || UI_STRINGS.de;
  return table[key] || key;
}

function populateCategoryFilter() {
  if (!filterCategoryEl) return;

  const previous = categoryFilter || filterCategoryEl.value || "";

  filterCategoryEl.innerHTML = "";

  const optAll = document.createElement("option");
  optAll.value = "";
  optAll.textContent = t("filter_category_all");
  filterCategoryEl.appendChild(optAll);

  const slugs = Object.keys(CATEGORY_LABELS);
  slugs.sort((a, b) => {
    const labelA =
      CATEGORY_LABELS[a][currentLang] || CATEGORY_LABELS[a].de || a;
    const labelB =
      CATEGORY_LABELS[b][currentLang] || CATEGORY_LABELS[b].de || b;
    return labelA.localeCompare(
      labelB,
      currentLang === "de" ? "de-DE" : "en-GB"
    );
  });

  slugs.forEach((slug) => {
    const labels = CATEGORY_LABELS[slug] || {};
    const label = labels[currentLang] || labels.de || slug;
    const opt = document.createElement("option");
    opt.value = slug;
    opt.textContent = label;
    filterCategoryEl.appendChild(opt);
  });

  filterCategoryEl.value = previous;
}

function setLanguage(lang, { initial = false } = {}) {
  currentLang = lang === "en" ? "en" : "de";
  localStorage.setItem("fs_lang", currentLang);
  document.documentElement.lang = currentLang;
  if (languageSwitcherEl) {
    languageSwitcherEl.value = currentLang;
  }

  // Header-Slogan
  if (headerTaglineEl) {
    headerTaglineEl.textContent = t("header_tagline");
  }

  // Bottom-Nav Texte
  if (bottomNavMapLabelEl) {
    bottomNavMapLabelEl.textContent = t("nav_map");
  }
  if (bottomNavAboutLabelEl) {
    bottomNavAboutLabelEl.textContent = t("nav_about");
  }

  // Filter-Buttons (abhängig vom Zustand)
  if (btnToggleFiltersEl && filterSectionEl) {
    const isCollapsed = filterSectionEl.dataset.collapsed === "true";
    btnToggleFiltersEl.querySelector("span").textContent = isCollapsed
      ? t("btn_show_filters")
      : t("btn_hide_filters");
  }
  if (btnToggleViewEl && sidebarEl) {
    const sidebarHidden = sidebarEl.classList.contains("hidden");
    btnToggleViewEl.querySelector("span").textContent = sidebarHidden
      ? t("btn_show_list")
      : t("btn_only_map");
  }

  // Kategorien neu aufbauen (Labels)
  if (filterCategoryEl) {
    populateCategoryFilter();
  }

  // Radius-Texte
  updateRadiusTexts();

  // Tilla informieren (aber nicht beim allerersten Konstruktor-Aufruf doppelt)
  if (!initial && tilla && typeof tilla.onLanguageChanged === "function") {
    tilla.onLanguageChanged();
  }
}

// ------------------------------------------------------
// Utility: Theme
// ------------------------------------------------------
function getInitialTheme() {
  const stored = localStorage.getItem("fs_theme");
  if (stored === "light" || stored === "dark") return stored;
  return "light";
}

function setTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";
  localStorage.setItem("fs_theme", currentTheme);
  document.documentElement.setAttribute("data-theme", currentTheme);
}

// ------------------------------------------------------
// Utility: Toast
// ------------------------------------------------------
let toastTimeoutId = null;

function showToast(keyOrMessage) {
  if (!toastEl) return;

  const message =
    UI_STRINGS[currentLang][keyOrMessage] || keyOrMessage || "…";

  toastEl.textContent = message;
  toastEl.classList.add("toast--visible");

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }

  toastTimeoutId = setTimeout(() => {
    toastEl.classList.remove("toast--visible");
  }, 3200);
}

// ------------------------------------------------------
// Map / Spots
// ------------------------------------------------------
function initMap() {
  map = L.map("map", {
    center: [52.4, 9.7], // grob Region Hannover
    zoom: 7,
    zoomControl: false
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap-Mitwirkende"
  }).addTo(map);

  markersLayer = L.markerClusterGroup();
  map.addLayer(markersLayer);
}

async function loadSpots() {
  try {
    const res = await fetch("data/spots.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    spots = Array.isArray(data) ? data : data.spots || [];

    // Favoriten aus localStorage laden
    loadFavoritesFromStorage();

    applyFiltersAndRender();
  } catch (err) {
    console.error("[Family Spots] Fehler beim Laden der Spots:", err);
    showToast("error_data_load");
  }
}

function loadFavoritesFromStorage() {
  try {
    const stored = localStorage.getItem("fs_favorites");
    if (!stored) return;
    const arr = JSON.parse(stored);
    if (Array.isArray(arr)) {
      favorites = new Set(arr);
    }
  } catch (err) {
    console.warn("[Family Spots] Konnte Favoriten nicht laden:", err);
  }
}

function saveFavoritesToStorage() {
  try {
    localStorage.setItem("fs_favorites", JSON.stringify(Array.from(favorites)));
  } catch (err) {
    console.warn("[Family Spots] Konnte Favoriten nicht speichern:", err);
  }
}

function getSpotName(spot) {
  return (
    spot.title ||
    spot.name ||
    spot.spotName ||
    (spot.id ? String(spot.id) : "Spot")
  );
}

function getSpotSubtitle(spot) {
  return (
    spot.subtitle ||
    spot.shortDescription ||
    spot.town ||
    spot.location ||
    ""
  );
}

// Hilfsfunktion: Entfernungsfilter (Radius)
function isSpotInRadius(spot, centerLatLng, radiusKm) {
  if (!map || !spot.lat || !spot.lng || !isFinite(radiusKm)) return true;
  if (radiusKm === Infinity) return true;

  const spotLatLng = L.latLng(spot.lat, spot.lng);
  const distanceMeters = centerLatLng.distanceTo(spotLatLng);
  const distanceKm = distanceMeters / 1000;
  return distanceKm <= radiusKm;
}

// Haupt-Filterfunktion
function applyFiltersAndRender() {
  if (!spots.length) {
    filteredSpots = [];
    renderSpotList();
    renderMarkers();
    if (tilla && typeof tilla.onNoSpotsFound === "function") {
      tilla.onNoSpotsFound();
    }
    return;
  }

  const center = map ? map.getCenter() : L.latLng(52.4, 9.7);
  const radiusKm = RADIUS_STEPS_KM[radiusStep] ?? Infinity;

  filteredSpots = spots.filter((spot) => {
    // Plus-Spots nur anzeigen, wenn Plus aktiv ODER Spot nicht explizit plus-only ist
    const plusOnly = !!spot.plusOnly || !!spot.plus;
    if (plusOnly && !plusActive) return false;

    // Suche (Name, Untertitel, Kategorie, Tags)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const haystack = [
        getSpotName(spot),
        getSpotSubtitle(spot),
        spot.category,
        ...(Array.isArray(spot.tags) ? spot.tags : [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    // Kategorie
    if (categoryFilter) {
      const filterSlug = String(categoryFilter);
      const categories = [];

      if (Array.isArray(spot.categories)) {
        categories.push(...spot.categories.map(String));
      } else if (spot.category || spot.type) {
        categories.push(String(spot.category || spot.type));
      }

      if (
        !categories.some((c) => {
          return c === filterSlug;
        })
      ) {
        return false;
      }
    }

    // Alter (wenn der Spot Angaben hat – ansonsten nicht filtern)
    if (ageFilter && ageFilter !== "all") {
      const ages = spot.ageGroups || spot.age || spot.ages;
      if (Array.isArray(ages)) {
        if (!ages.includes(ageFilter)) return false;
      } else if (typeof ages === "string" && ages.trim()) {
        if (!ages.split(",").map((a) => a.trim()).includes(ageFilter)) {
          return false;
        }
      }
    }

    // Stimmung
    if (moodFilter) {
      const moods = spot.moods || spot.moodTags || [];
      if (Array.isArray(moods) && moods.length > 0) {
        if (!moods.includes(moodFilter)) return false;
      }
    }

    // Reise-Modus
    if (travelMode) {
      const modes = spot.travelModes || spot.travel || [];
      if (Array.isArray(modes) && modes.length > 0) {
        if (!modes.includes(travelMode)) return false;
      }
    }

    // Nur große Abenteuer
    if (onlyBigAdventures) {
      const big =
        !!spot.bigAdventure ||
        !!spot.isBigAdventure ||
        !!spot.longTrip;
      if (!big) return false;
    }

    // Nur verifizierte
    if (onlyVerified) {
      const verified = !!spot.verified || !!spot.isVerified;
      if (!verified) return false;
    }

    // Nur Favoriten
    if (onlyFavorites) {
      const id = spot.id || getSpotName(spot);
      if (!favorites.has(String(id))) return false;
    }

    // Radius
    if (!isSpotInRadius(spot, center, radiusKm)) return false;

    return true;
  });

  renderSpotList();
  renderMarkers();

  if (tilla) {
    if (filteredSpots.length === 0) {
      if (typeof tilla.onNoSpotsFound === "function") tilla.onNoSpotsFound();
    } else if (typeof tilla.onSpotsFound === "function") {
      tilla.onSpotsFound();
    }
  }
}

function renderMarkers() {
  if (!markersLayer) return;
  markersLayer.clearLayers();

  filteredSpots.forEach((spot) => {
    if (!spot.lat || !spot.lng) return;

    const el = document.createElement("div");
    el.className = "spot-marker";
    const inner = document.createElement("div");
    inner.className = "spot-marker-inner pin-pop";
    el.appendChild(inner);

    const icon = L.divIcon({
      html: el,
      className: "",
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([spot.lat, spot.lng], { icon });

    const name = getSpotName(spot);
    const subtitle = getSpotSubtitle(spot);

    const popupHtml = `
      <div class="popup">
        <strong>${name}</strong><br/>
        <small>${subtitle || ""}</small>
      </div>
    `;

    marker.bindPopup(popupHtml);

    marker.on("click", () => {
      showSpotDetails(spot);
    });

    markersLayer.addLayer(marker);
  });
}

function renderSpotList() {
  if (!spotListEl) return;
  spotListEl.innerHTML = "";

  if (!filteredSpots.length) {
    const msg = document.createElement("p");
    msg.className = "filter-group-helper";
    msg.textContent =
      currentLang === "de"
        ? "Aktuell passt kein Spot zu euren Filtern. Probiert einen größeren Radius oder nehmt einen Filter heraus."
        : "Right now no spot matches your filters. Try a wider radius or remove one of the filters.";
    spotListEl.appendChild(msg);
    return;
  }

  filteredSpots.forEach((spot) => {
    const card = document.createElement("article");
    card.className = "spot-card";
    const spotId = String(spot.id || getSpotName(spot));
    card.dataset.spotId = spotId;

    const titleEl = document.createElement("h3");
    titleEl.className = "spot-card-title";
    titleEl.textContent = getSpotName(spot);

    const subtitleText = getSpotSubtitle(spot);
    const subtitleEl = document.createElement("p");
    subtitleEl.className = "spot-card-subtitle";
    subtitleEl.textContent = subtitleText;

    const metaEl = document.createElement("p");
    metaEl.className = "spot-card-meta";
    const parts = [];

    if (spot.category) {
      parts.push(spot.category);
    }
    if (Array.isArray(spot.tags)) {
      parts.push(spot.tags.join(", "));
    }
    if (spot.verified) {
      parts.push(currentLang === "de" ? "verifiziert" : "verified");
    }

    metaEl.textContent = parts.join(" · ");

    const headerRow = document.createElement("div");
    headerRow.style.display = "flex";
    headerRow.style.alignItems = "center";
    headerRow.style.justifyContent = "space-between";
    headerRow.style.gap = "8px";

    const favBtn = document.createElement("button");
    favBtn.type = "button";
    favBtn.className = "btn-ghost btn-small";
    favBtn.textContent = favorites.has(spotId) ? "★" : "☆";
    favBtn.setAttribute(
      "aria-label",
      favorites.has(spotId)
        ? currentLang === "de"
          ? "Aus Favoriten entfernen"
          : "Remove from favourites"
        : currentLang === "de"
        ? "Zu Favoriten hinzufügen"
        : "Add to favourites"
    );

    favBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      toggleFavorite(spot);
      // Button-Label aktualisieren
      favBtn.textContent = favorites.has(spotId) ? "★" : "☆";
    });

    headerRow.appendChild(titleEl);
    headerRow.appendChild(favBtn);

    card.appendChild(headerRow);
    if (subtitleText) card.appendChild(subtitleEl);
    if (parts.length) card.appendChild(metaEl);

    card.addEventListener("click", () => {
      focusSpotOnMap(spot);
    });

    spotListEl.appendChild(card);
  });
}

function focusSpotOnMap(spot) {
  if (!map || !spot.lat || !spot.lng) return;
  map.setView([spot.lat, spot.lng], Math.max(map.getZoom(), 13));
  showSpotDetails(spot);
}

function showSpotDetails(spot) {
  if (!spotDetailEl) return;

  const spotId = String(spot.id || getSpotName(spot));
  const isFav = favorites.has(spotId);

  const name = getSpotName(spot);
  const subtitle = getSpotSubtitle(spot);

  const metaParts = [];
  if (spot.category) metaParts.push(spot.category);
  if (spot.verified)
    metaParts.push(currentLang === "de" ? "verifiziert" : "verified");
  if (Array.isArray(spot.tags) && spot.tags.length)
    metaParts.push(spot.tags.join(", "));

  const description = spot.description || spot.text || "";

  spotDetailEl.innerHTML = "";

  const titleEl = document.createElement("h3");
  titleEl.className = "spot-card-title";
  titleEl.textContent = name;

  const subtitleEl = document.createElement("p");
  subtitleEl.className = "spot-card-subtitle";
  subtitleEl.textContent = subtitle;

  const metaEl = document.createElement("p");
  metaEl.className = "spot-card-meta";
  metaEl.textContent = metaParts.join(" · ");

  const descEl = document.createElement("p");
  descEl.className = "spot-card-meta";
  descEl.textContent = description;

  const actionsRow = document.createElement("div");
  actionsRow.className = "popup-actions";

  const favBtn = document.createElement("button");
  favBtn.type = "button";
  favBtn.className = "btn-ghost btn-small";
  favBtn.textContent = isFav ? "★" : "☆";
  favBtn.addEventListener("click", () => {
    toggleFavorite(spot);
    favBtn.textContent = favorites.has(spotId) ? "★" : "☆";
  });

  actionsRow.appendChild(favBtn);

  spotDetailEl.appendChild(titleEl);
  if (subtitle) spotDetailEl.appendChild(subtitleEl);
  if (metaParts.length) spotDetailEl.appendChild(metaEl);
  if (description) spotDetailEl.appendChild(descEl);
  spotDetailEl.appendChild(actionsRow);
}

// ------------------------------------------------------
// Favoriten
// ------------------------------------------------------
function toggleFavorite(spot) {
  const spotId = String(spot.id || getSpotName(spot));

  if (favorites.has(spotId)) {
    favorites.delete(spotId);
    saveFavoritesToStorage();
    showToast("toast_fav_removed");
    if (tilla && typeof tilla.onFavoriteRemoved === "function") {
      tilla.onFavoriteRemoved();
    }
  } else {
    favorites.add(spotId);
    saveFavoritesToStorage();
    showToast("toast_fav_added");
    if (tilla && typeof tilla.onFavoriteAdded === "function") {
      tilla.onFavoriteAdded();
    }
  }

  // Liste neu malen, damit Sternchen überall stimmt
  renderSpotList();
}

// ------------------------------------------------------
// Radius-Helfer
// ------------------------------------------------------
function updateRadiusTexts() {
  if (!filterRadiusEl || !filterRadiusMaxLabelEl || !filterRadiusDescriptionEl)
    return;

  const value = parseInt(filterRadiusEl.value, 10);
  radiusStep = isNaN(value) ? 4 : value;

  if (radiusStep === 4) {
    filterRadiusMaxLabelEl.textContent = t("filter_radius_max_label");
    filterRadiusDescriptionEl.textContent = t("filter_radius_description_all");
  } else {
    const km = RADIUS_STEPS_KM[radiusStep];
    filterRadiusMaxLabelEl.textContent = `${km} km`;
    const key = `filter_radius_description_step${radiusStep}`;
    filterRadiusDescriptionEl.textContent = t(key);
  }
}

// ------------------------------------------------------
// Plus-Code (ohne Backend – Demo-Logik)
// ------------------------------------------------------
function handlePlusCodeSubmit() {
  if (!plusCodeInputEl || !plusStatusTextEl) return;
  const raw = plusCodeInputEl.value.trim();

  if (!raw) {
    showToast("plus_code_empty");
    return;
  }

  // Demo-Logik: alles mit mind. 4 Zeichen wird akzeptiert
  if (raw.length < 4) {
    showToast("plus_code_unknown");
    return;
  }

  plusActive = true;
  showToast("plus_code_activated");

  plusStatusTextEl.textContent =
    currentLang === "de"
      ? "Family Spots Plus ist aktiv – zusätzliche Kategorien sind freigeschaltet."
      : "Family Spots Plus is active – additional categories have been unlocked.";

  if (tilla && typeof tilla.onPlusActivated === "function") {
    tilla.onPlusActivated();
  }

  applyFiltersAndRender();
}

// ------------------------------------------------------
// Mein Tag
// ------------------------------------------------------
function handleDaylogSave() {
  if (!daylogTextEl) return;
  const text = daylogTextEl.value.trim();
  if (!text) {
    // Kein Fehler, einfach nichts tun
    return;
  }

  const payload = {
    text,
    ts: Date.now()
  };

  try {
    localStorage.setItem("fs_daylog_last", JSON.stringify(payload));
  } catch (err) {
    console.warn("[Family Spots] Konnte Mein-Tag nicht speichern:", err);
  }

  showToast("daylog_saved");
  if (tilla && typeof tilla.onDaylogSaved === "function") {
    tilla.onDaylogSaved();
  }
}

// ------------------------------------------------------
// Geolocation
// ------------------------------------------------------
function handleLocateClick() {
  if (!navigator.geolocation || !map) {
    showToast("toast_location_error");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 13);
      showToast("toast_location_ok");
    },
    () => {
      showToast("toast_location_error");
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
}

// ------------------------------------------------------
// Navigation (Karte / Über)
// ------------------------------------------------------
function switchRoute(route) {
  if (!viewMapEl || !viewAboutEl || !bottomNavButtons) return;

  if (route === "about") {
    viewMapEl.classList.remove("view--active");
    viewAboutEl.classList.add("view--active");
  } else {
    viewAboutEl.classList.remove("view--active");
    viewMapEl.classList.add("view--active");
  }

  bottomNavButtons.forEach((btn) => {
    const btnRoute = btn.getAttribute("data-route");
    if (btnRoute === route) {
      btn.classList.add("bottom-nav-item--active");
    } else {
      btn.classList.remove("bottom-nav-item--active");
    }
  });
}

// ------------------------------------------------------
// Filter-Umschalter
// ------------------------------------------------------
function handleToggleFilters() {
  if (!filterSectionEl || !btnToggleFiltersEl) return;

  const currentlyCollapsed = filterSectionEl.dataset.collapsed === "true";
  const newCollapsed = !currentlyCollapsed;
  filterSectionEl.dataset.collapsed = newCollapsed ? "true" : "false";

  // alle Kinder außer Header zeigen/verstecken
  Array.from(filterSectionEl.children).forEach((child) => {
    if (child.classList.contains("sidebar-section-header")) return;
    child.style.display = newCollapsed ? "none" : "";
  });

  btnToggleFiltersEl
    .querySelector("span")
    .textContent = newCollapsed
      ? t("btn_show_filters")
      : t("btn_hide_filters");
}

function handleToggleView() {
  if (!sidebarEl || !btnToggleViewEl) return;
  const isHidden = sidebarEl.classList.toggle("hidden");
  btnToggleViewEl
    .querySelector("span")
    .textContent = isHidden
      ? t("btn_show_list")
      : t("btn_only_map");

  if (map) {
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }
}

// ------------------------------------------------------
// Initialisierung
// ------------------------------------------------------
function init() {
  // DOM-Elemente einsammeln
  languageSwitcherEl = document.getElementById("language-switcher");
  themeToggleEl = document.getElementById("theme-toggle");
  btnLocateEl = document.getElementById("btn-locate");
  btnHelpEl = document.getElementById("btn-help");
  headerTaglineEl = document.getElementById("header-tagline");

  viewMapEl = document.getElementById("view-map");
  viewAboutEl = document.getElementById("view-about");

  bottomNavButtons = document.querySelectorAll(".bottom-nav-item");
  bottomNavMapLabelEl = document.getElementById("bottom-nav-map-label");
  bottomNavAboutLabelEl = document.getElementById("bottom-nav-about-label");

  sidebarEl = document.querySelector(".sidebar");
  // Filter-Section über die Überschrift finden
  const filterTitleEl = document.getElementById("filter-title");
  filterSectionEl = filterTitleEl
    ? filterTitleEl.closest(".sidebar-section")
    : null;

  btnToggleFiltersEl = document.getElementById("btn-toggle-filters");
  btnToggleViewEl = document.getElementById("btn-toggle-view");

  filterSearchEl = document.getElementById("filter-search");
  filterCategoryEl = document.getElementById("filter-category");
  filterAgeEl = document.getElementById("filter-age");
  filterRadiusEl = document.getElementById("filter-radius");
  filterRadiusMaxLabelEl = document.getElementById("filter-radius-max-label");
  filterRadiusDescriptionEl = document.getElementById(
    "filter-radius-description"
  );
  filterBigEl = document.getElementById("filter-big-adventures");
  filterVerifiedEl = document.getElementById("filter-verified");
  filterFavoritesEl = document.getElementById("filter-favorites");

  spotListEl = document.getElementById("spot-list");
  spotDetailEl = document.getElementById("spot-detail");

  plusCodeInputEl = document.getElementById("plus-code-input");
  plusCodeSubmitEl = document.getElementById("plus-code-submit");
  plusStatusTextEl = document.getElementById("plus-status-text");

  daylogTextEl = document.getElementById("daylog-text");
  daylogSaveEl = document.getElementById("daylog-save");

  toastEl = document.getElementById("toast");

  // Sprache
  const initialLang = getInitialLang();
  setLanguage(initialLang, { initial: true });

  // Theme
  const initialTheme = getInitialTheme();
  setTheme(initialTheme);

  // Map initialisieren
  initMap();

  // Tilla initialisieren (nachdem DOM da ist)
  tilla = new TillaCompanion({
    getText: (key) => t(key)
  });

  // Events – Sprache
  if (languageSwitcherEl) {
    languageSwitcherEl.addEventListener("change", (e) => {
      setLanguage(e.target.value);
    });
  }

  // Theme-Toggle
  if (themeToggleEl) {
    themeToggleEl.addEventListener("click", () => {
      setTheme(currentTheme === "light" ? "dark" : "light");
    });
  }

  // Locate
  if (btnLocateEl) {
    btnLocateEl.addEventListener("click", handleLocateClick);
  }

  // Help → zur About-View springen
  if (btnHelpEl) {
    btnHelpEl.addEventListener("click", () => {
      switchRoute("about");
    });
  }

  // Bottom-Nav
  if (bottomNavButtons && bottomNavButtons.length) {
    bottomNavButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const route = btn.getAttribute("data-route") || "map";
        switchRoute(route);
      });
    });
  }

  // Filter – Suche
  if (filterSearchEl) {
    filterSearchEl.addEventListener("input", (e) => {
      searchTerm = e.target.value.trim();
      applyFiltersAndRender();
    });
  }

  // Filter – Kategorie
  if (filterCategoryEl) {
    filterCategoryEl.addEventListener("change", (e) => {
      categoryFilter = e.target.value;
      applyFiltersAndRender();
    });
  }

  // Filter – Alter
  if (filterAgeEl) {
    filterAgeEl.addEventListener("change", (e) => {
      ageFilter = e.target.value;
      applyFiltersAndRender();
    });
  }

  // Filter – Radius
  if (filterRadiusEl) {
    filterRadiusEl.addEventListener("input", () => {
      updateRadiusTexts();
      applyFiltersAndRender();
    });
    // initial
    updateRadiusTexts();
  }

  // Filter – Checkboxen
  if (filterBigEl) {
    filterBigEl.addEventListener("change", (e) => {
      onlyBigAdventures = e.target.checked;
      applyFiltersAndRender();
    });
  }
  if (filterVerifiedEl) {
    filterVerifiedEl.addEventListener("change", (e) => {
      onlyVerified = e.target.checked;
      applyFiltersAndRender();
    });
  }
  if (filterFavoritesEl) {
    filterFavoritesEl.addEventListener("change", (e) => {
      onlyFavorites = e.target.checked;
      applyFiltersAndRender();
    });
  }

  // Stimmung-Chips
  document.querySelectorAll(".mood-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const value = chip.getAttribute("data-mood");
      const isActive = chip.classList.contains("mood-chip--active");

      if (isActive) {
        moodFilter = null;
        chip.classList.remove("mood-chip--active");
      } else {
        moodFilter = value;
        document
          .querySelectorAll(".mood-chip")
          .forEach((c) => c.classList.remove("mood-chip--active"));
        chip.classList.add("mood-chip--active");
      }

      applyFiltersAndRender();
    });
  });

  // Reise-Modus-Chips
  document.querySelectorAll(".travel-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const mode = chip.getAttribute("data-travel-mode") || "everyday";
      const isAlreadyActive = chip.classList.contains("travel-chip--active");

      if (isAlreadyActive) {
        // ausschalten
        travelMode = null;
        document
          .querySelectorAll(".travel-chip")
          .forEach((c) => c.classList.remove("travel-chip--active"));
      } else {
        travelMode = mode;
        document
          .querySelectorAll(".travel-chip")
          .forEach((c) => c.classList.remove("travel-chip--active"));
        chip.classList.add("travel-chip--active");
      }

      if (tilla && typeof tilla.setTravelMode === "function") {
        tilla.setTravelMode(travelMode);
      }

      applyFiltersAndRender();
    });
  });

  // Standard-Reisemodus optisch (Alltag) aktiv setzen
  const defaultTravelChip = document.querySelector(
    ".travel-chip[data-travel-mode='everyday']"
  );
  if (defaultTravelChip) {
    defaultTravelChip.classList.add("travel-chip--active");
  }

  // Filter-Umschalter
  if (btnToggleFiltersEl && filterSectionEl) {
    btnToggleFiltersEl.addEventListener("click", handleToggleFilters);
    // Text initial setzen (Filter sichtbar)
    btnToggleFiltersEl.querySelector("span").textContent = t("btn_hide_filters");
    filterSectionEl.dataset.collapsed = "false";
  }

  // View-Umschalter (Liste/Karte)
  if (btnToggleViewEl) {
    btnToggleViewEl.addEventListener("click", handleToggleView);
    btnToggleViewEl.querySelector("span").textContent = t("btn_only_map");
  }

  // Plus-Code
  if (plusCodeSubmitEl) {
    plusCodeSubmitEl.addEventListener("click", handlePlusCodeSubmit);
  }

  // Mein Tag
  if (daylogSaveEl) {
    daylogSaveEl.addEventListener("click", handleDaylogSave);
  }

  // Sektionen schließen (X-Button)
  document.querySelectorAll(".sidebar-section-close").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      if (!targetId) return;
      const section = document.getElementById(targetId);
      if (!section) return;

      if (section.tagName && section.tagName.toLowerCase() === "details") {
        section.open = false;
      } else {
        section.classList.add("hidden");
      }
    });
  });

  // Initiales Route
  switchRoute("map");

  // Daten laden
  loadSpots();
}

// Start
document.addEventListener("DOMContentLoaded", init);