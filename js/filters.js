// js/filters.js

import { $, $$ } from "./utils.js";
import { getLanguage, t } from "./i18n.js";

const DEFAULT_RADIUS_INDEX = 4;

// Index -> Radius in km (null = kein Limit / alle Spots)
const RADIUS_KM_VALUES = [2, 5, 10, 25, null];

export function getRadiusKmForIndex(index) {
  const safeIndex =
    typeof index === "number" && index >= 0 && index < RADIUS_KM_VALUES.length
      ? index
      : DEFAULT_RADIUS_INDEX;
  return RADIUS_KM_VALUES[safeIndex];
}

/**
 * Initialisiert Filter-UI und verkabelt alle Events.
 * Gibt den aktuellen Filter-State zurück.
 */
export function initFilters({
  categories = [],
  favoritesProvider = () => [],
  onFilterChange,
}) {
  const favoritesInitial = safeFavorites(favoritesProvider);

  const state = {
    searchQuery: "",
    category: "",
    age: "all",
    mood: null,
    travelMode: "everyday",
    radiusIndex: DEFAULT_RADIUS_INDEX,
    bigOnly: false,
    verifiedOnly: false,
    favoritesOnly: false,
    favorites: favoritesInitial,
  };

  // Kategorie-Select befüllen
  refreshCategorySelect(categories);

  const searchInput = $("#filter-search");
  const categorySelect = $("#filter-category");
  const ageSelect = $("#filter-age");
  const radiusInput = $("#filter-radius");
  const bigOnlyCheckbox = $("#filter-big-only");
  const verifiedOnlyCheckbox = $("#filter-verified-only");
  const favoritesOnlyCheckbox = $("#filter-favorites-only");

  const moodButtons = $$("[data-mood]");
  const travelButtons = $$("[data-travel-mode]");

  // Initialwerte aus DOM lesen (falls vom HTML vorgegeben)
  if (searchInput) state.searchQuery = (searchInput.value || "").trim();
  if (categorySelect) state.category = categorySelect.value || "";
  if (ageSelect) state.age = ageSelect.value || "all";
  if (radiusInput) {
    const idx = parseInt(radiusInput.value, 10);
    state.radiusIndex = Number.isFinite(idx) ? idx : DEFAULT_RADIUS_INDEX;
    updateRadiusValueLabel(state.radiusIndex);
  }
  if (bigOnlyCheckbox) state.bigOnly = !!bigOnlyCheckbox.checked;
  if (verifiedOnlyCheckbox) state.verifiedOnly = !!verifiedOnlyCheckbox.checked;
  if (favoritesOnlyCheckbox)
    state.favoritesOnly = !!favoritesOnlyCheckbox.checked;

  const emitChange = () => {
    const latestFavs = safeFavorites(favoritesProvider);
    state.favorites = latestFavs;
    if (typeof onFilterChange === "function") {
      onFilterChange({ ...state });
    }
  };

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      state.searchQuery = (searchInput.value || "").trim();
      emitChange();
    });
  }

  if (categorySelect) {
    categorySelect.addEventListener("change", () => {
      state.category = categorySelect.value || "";
      emitChange();
    });
  }

  if (ageSelect) {
    ageSelect.addEventListener("change", () => {
      state.age = ageSelect.value || "all";
      emitChange();
    });
  }

  if (radiusInput) {
    radiusInput.addEventListener("input", () => {
      const idx = parseInt(radiusInput.value, 10);
      state.radiusIndex = Number.isFinite(idx) ? idx : DEFAULT_RADIUS_INDEX;
      updateRadiusValueLabel(state.radiusIndex);
      emitChange();
    });
  }

  if (bigOnlyCheckbox) {
    bigOnlyCheckbox.addEventListener("change", () => {
      state.bigOnly = !!bigOnlyCheckbox.checked;
      emitChange();
    });
  }

  if (verifiedOnlyCheckbox) {
    verifiedOnlyCheckbox.addEventListener("change", () => {
      state.verifiedOnly = !!verifiedOnlyCheckbox.checked;
      emitChange();
    });
  }

  if (favoritesOnlyCheckbox) {
    favoritesOnlyCheckbox.addEventListener("change", () => {
      state.favoritesOnly = !!favoritesOnlyCheckbox.checked;
      emitChange();
    });
  }

  // Mood-Toggles (z. B. entspannt / Action / Wasser / Tiere)
  if (moodButtons.length > 0) {
    moodButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = btn.dataset.mood || null;
        state.mood = state.mood === value ? null : value;

        moodButtons.forEach((b) =>
          b.classList.toggle(
            "chip--active",
            state.mood && b.dataset.mood === state.mood,
          ),
        );

        emitChange();
      });
    });
  }

  // Reise-Modus-Toggles (Alltag / Unterwegs)
  if (travelButtons.length > 0) {
    travelButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = btn.dataset.travelMode || null;
        state.travelMode = value || "everyday";

        travelButtons.forEach((b) =>
          b.classList.toggle(
            "chip--active",
            b.dataset.travelMode === state.travelMode,
          ),
        );

        emitChange();
      });
    });
  }

  // beim Start einmal initial feuern
  emitChange();

  return state;
}

/**
 * Füllt das Kategorie-Select mit Optionen.
 * Wird von app.js auch nach einem Sprachwechsel aufgerufen.
 */
export function refreshCategorySelect(categories = []) {
  const select = $("#filter-category");
  if (!select) return;

  const prevValue = select.value;
  select.innerHTML = "";

  const lang = getLanguage() || "de";
  const isGerman = lang.toLowerCase().startsWith("de");

  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = t(
    "filter.category_all",
    isGerman ? "Alle Kategorien" : "All categories",
  );
  select.appendChild(allOption);

  categories.forEach((cat) => {
    const option = document.createElement("option");
    option.value = cat.slug || cat.id || cat.value || "";
    const label =
      (isGerman
        ? cat.label_de || cat.name_de
        : cat.label_en || cat.name_en) ||
      cat.label ||
      cat.name ||
      option.value;
    option.textContent = label;
    select.appendChild(option);
  });

  // Vorherige Auswahl wiederherstellen, wenn möglich
  if (
    prevValue &&
    Array.from(select.options).some((opt) => opt.value === prevValue)
  ) {
    select.value = prevValue;
  }
}

/**
 * Filtert Spots anhand des States + MapCenter.
 */
export function applyFilters(spots, options = {}) {
  if (!Array.isArray(spots) || spots.length === 0) return [];

  const {
    searchQuery = "",
    category = "",
    age = "all",
    mood = null,
    travelMode = null,
    radiusIndex = DEFAULT_RADIUS_INDEX,
    bigOnly = false,
    verifiedOnly = false,
    favoritesOnly = false,
    favorites = [],
    mapCenter = null,
  } = options;

  const radiusKm = getRadiusKmForIndex(
    typeof radiusIndex === "number" ? radiusIndex : DEFAULT_RADIUS_INDEX,
  );
  const favSet = new Set(favorites || []);
  const q = (searchQuery || "").trim().toLowerCase();

  const result = [];

  for (const s of spots) {
    let spot = s;
    let distanceKm = null;

    // Distanz berechnen (nur wenn MapCenter + Radius gesetzt)
    if (mapCenter && radiusKm != null) {
      const coords = extractCoords(s);
      if (coords) {
        distanceKm = haversineKm(
          mapCenter.lat,
          mapCenter.lng,
          coords.lat,
          coords.lng,
        );

        if (radiusKm != null && distanceKm > radiusKm) {
          continue; // liegt außerhalb des Radius
        }
      }
    }

    // Such-Text
    if (q) {
      const haystack = [
        s.title,
        s.title_de,
        s.title_en,
        s.name,
        s.name_de,
        s.name_en,
        s.description,
        s.description_de,
        s.description_en,
        s.city,
        s.region,
        ...(s.keywords || []),
        ...(s.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(q)) continue;
    }

    // Kategorie
    if (category && s.category && s.category !== category) {
      continue;
    }

    // Nur Favoriten
    if (favoritesOnly && !favSet.has(s.id)) {
      continue;
    }

    // Nur verifizierte Spots
    if (verifiedOnly && !isSpotVerified(s)) {
      continue;
    }

    // Nur "große" Abenteuer
    if (bigOnly && !isSpotBig(s)) {
      continue;
    }

    // Alters-Filter nur anwenden, wenn Metadaten vorhanden
    if (age && age !== "all" && !matchesAgeFilter(s, age)) {
      continue;
    }

    // Mood / Stimmung nur filtern, wenn Mood-Daten vorhanden
    if (mood && !matchesMoodFilter(s, mood)) {
      continue;
    }

    // Reise-Modus nur filtern, wenn Metadaten vorhanden
    if (travelMode && !matchesTravelModeFilter(s, travelMode)) {
      continue;
    }

    if (distanceKm != null) {
      spot = { ...s, distanceKm };
    }

    result.push(spot);
  }

  // Falls es Distanzen gibt, nach Distanz sortieren
  if (mapCenter && radiusKm != null) {
    result.sort((a, b) => {
      const da =
        typeof a.distanceKm === "number" ? a.distanceKm : Number.POSITIVE_INFINITY;
      const db =
        typeof b.distanceKm === "number" ? b.distanceKm : Number.POSITIVE_INFINITY;
      return da - db;
    });
  }

  return result;
}

// ------------------------------------------------------
// Hilfsfunktionen
// ------------------------------------------------------

function safeFavorites(provider) {
  if (typeof provider === "function") {
    const value = provider();
    return Array.isArray(value) ? value : [];
  }
  return [];
}

function updateRadiusValueLabel(radiusIndex) {
  const labelEl = $("#filter-radius-value-label");
  if (!labelEl) return;

  const radiusKm = getRadiusKmForIndex(radiusIndex);
  const lang = getLanguage() || "de";
  const isGerman = lang.toLowerCase().startsWith("de");

  if (radiusKm == null) {
    labelEl.textContent = t(
      "filter.radius_unlimited",
      isGerman ? "Alle Spots" : "All spots",
    );
  } else {
    const value = Math.round(radiusKm);
    labelEl.textContent = isGerman
      ? `bis ca. ${value} km`
      : `up to approx. ${value} km`;
  }
}

function extractCoords(spot) {
  if (
    typeof spot.lat === "number" &&
    typeof spot.lng === "number"
  ) {
    return { lat: spot.lat, lng: spot.lng };
  }
  if (
    spot.location &&
    typeof spot.location.lat === "number" &&
    typeof spot.location.lng === "number"
  ) {
    return { lat: spot.location.lat, lng: spot.location.lng };
  }
  return null;
}

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

function isSpotVerified(spot) {
  if (spot.verified === true) return true;
  if (spot.flags && spot.flags.verified === true) return true;
  if (Array.isArray(spot.labels) && spot.labels.includes("verified")) return true;
  return false;
}

function isSpotBig(spot) {
  if (spot.big === true) return true;
  if (spot.size === "big") return true;
  if (Array.isArray(spot.tags) && spot.tags.includes("big")) return true;
  return false;
}

function matchesAgeFilter(spot, ageFilter) {
  const groups = spot.ageGroups || spot.ages || [];

  if (!groups.length && spot.minAge == null && spot.maxAge == null) {
    // Keine Altersdaten -> nicht rausfiltern
    return true;
  }

  const normalize = (val) => String(val || "").toLowerCase();

  if (ageFilter === "0-3") {
    if (spot.minAge != null && spot.minAge <= 3) return true;
    if (groups.some((g) => ["0-3", "toddler"].includes(normalize(g)))) {
      return true;
    }
    return false;
  }

  if (ageFilter === "4-9") {
    if (
      (spot.minAge != null && spot.minAge <= 4) ||
      (spot.maxAge != null && spot.maxAge >= 9)
    ) {
      return true;
    }
    if (groups.some((g) => ["4-9", "kids"].includes(normalize(g)))) {
      return true;
    }
    return false;
  }

  if (ageFilter === "10+") {
    if (spot.minAge != null && spot.minAge >= 10) return true;
    if (groups.some((g) => ["10+", "teens"].includes(normalize(g)))) {
      return true;
    }
    return false;
  }

  return true;
}

function matchesMoodFilter(spot, mood) {
  const moods = spot.moods || [];
  if (!moods.length) return true; // keine Daten -> nicht rausfiltern
  const normalized = moods.map((m) => String(m).toLowerCase());
  return normalized.includes(String(mood).toLowerCase());
}

function matchesTravelModeFilter(spot, travelMode) {
  const modes = spot.travelModes || spot.modes || [];
  if (!modes.length) return true;
  const normalized = modes.map((m) => String(m).toLowerCase());
  return normalized.includes(String(travelMode).toLowerCase());
}