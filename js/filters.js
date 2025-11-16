// js/filters.js

import { $, debounce } from "./utils.js";
import { getLanguage, t } from "./i18n.js";

// -----------------------------------------------------
// Mood-Konfiguration
// -----------------------------------------------------

const MOOD_CONFIG = {
  chill: {
    // 🌿 Entspannt im Grünen
    categoryBoost: [
      "waldspielplatz",
      "park-garten",
      "picknickwiese",
      "naturerlebnispfad",
      "walderlebnisroute",
      "wanderweg-kinderwagen",
      "badesee",
    ],
    tagBoost: [
      "wald",
      "natur",
      "ruhig",
      "spaziergang",
      "picknick",
      "land",
      "see",
      "park",
    ],
  },
  active: {
    // 🧗 Bewegung & Klettern
    categoryBoost: [
      "abenteuerspielplatz",
      "multifunktionsfeld",
      "bewegungspark",
      "skatepark",
      "pumptrack",
      "kletterhalle",
      "kletteranlage-outdoor",
      "boulderpark",
      "trampolinpark",
    ],
    tagBoost: [
      "klettern",
      "pump",
      "skate",
      "sport",
      "bewegung",
      "zipline",
      "riesenrutschen",
      "rutschen",
      "hüttenbau",
    ],
  },
  water: {
    // 💧 Wasser & Sand
    categoryBoost: ["wasserspielplatz", "badesee", "schwimmbad", "park-garten"],
    tagBoost: [
      "wasser",
      "wasserspiel",
      "strand",
      "see",
      "fluss",
      "sommer",
      "planschen",
    ],
  },
  animals: {
    // 🐾 Tier-Tag
    categoryBoost: ["zoo", "wildpark", "tierpark", "bauernhof"],
    tagBoost: ["tiere", "streichel", "safari", "pony", "tierpark"],
  },
};

// Radius-Stufen: Index → Minuten
const RADIUS_MINUTES = [null, 15, 30, 45, 60, 90];

// -----------------------------------------------------
// Hilfsfunktionen
// -----------------------------------------------------

function buildCategoryOptions(categorySelect, categories) {
  const lang = getLanguage();
  const currentValue = categorySelect.value || "";

  categorySelect.innerHTML = "";

  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = t(
    "filter_category_all",
    lang === "de" ? "Alle Kategorien" : "All categories",
  );
  categorySelect.appendChild(allOpt);

  categories.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.slug;
    opt.textContent = c.label?.[lang] || c.label?.de || c.slug;
    categorySelect.appendChild(opt);
  });

  categorySelect.value = currentValue;
}

function computeMoodScore(spot, moodKey) {
  if (!moodKey || !MOOD_CONFIG[moodKey]) return 0;
  const cfg = MOOD_CONFIG[moodKey];

  let score = 0;

  const categories = Array.isArray(spot.categories) ? spot.categories : [];
  categories.forEach((cat) => {
    if (cfg.categoryBoost.includes(cat)) {
      score += 2;
    }
  });

  const tags = Array.isArray(spot.tags) ? spot.tags : [];
  tags.forEach((tag) => {
    const tLower = String(tag).toLowerCase();
    if (cfg.tagBoost.some((needle) => tLower.includes(needle))) {
      score += 1;
    }
  });

  return score;
}

function computeDistanceKm(origin, location) {
  if (!origin || !location) return null;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // km

  const dLat = toRad(location.lat - origin.lat);
  const dLng = toRad(location.lng - origin.lng);
  const lat1 = toRad(origin.lat);
  const lat2 = toRad(location.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isBigAdventureSpot(spot) {
  const categories = Array.isArray(spot.categories) ? spot.categories : [];
  const tags = Array.isArray(spot.tags) ? spot.tags : [];
  const visitMinutes = Number(
    spot.visitMinutes != null ? spot.visitMinutes : spot.visit_minutes,
  );

  if (categories.includes("freizeitpark")) return true;
  if (!Number.isNaN(visitMinutes) && visitMinutes >= 240) return true;

  const tagMatch = tags.some((tag) => {
    const tLower = String(tag).toLowerCase();
    return (
      tLower.includes("safari") ||
      tLower.includes("riesige") ||
      tLower.includes("riesen") ||
      tLower.includes("highlight")
    );
  });

  return tagMatch;
}

function updateRadiusLabel(stepValue, labelEl) {
  if (!labelEl) return;
  const lang = getLanguage();
  const step = Number(stepValue);
  const minutes =
    step >= 0 && step < RADIUS_MINUTES.length ? RADIUS_MINUTES[step] : null;

  if (!minutes) {
    const fallback = lang && lang.startsWith("en")
      ? "All spots"
      : "Alle Spots";
    labelEl.textContent = t("filter_radius_all", fallback);
    return;
  }

  let fallback;
  if (lang && lang.startsWith("en")) {
    fallback =
      minutes <= 45
        ? `Spots in approx. ${minutes} min travel time`
        : `Spots in approx. ${minutes} min – family day trip`;
  } else {
    fallback =
      minutes <= 45
        ? `Spots in ca. ${minutes} Minuten Fahrzeit`
        : `Spots in ca. ${minutes} Minuten – der Familienausflug`;
  }

  labelEl.textContent = t(`filter_radius_${minutes}`, fallback);
}

// -----------------------------------------------------
// Init
// -----------------------------------------------------

export function initFilters({ categories, favoritesProvider, onFilterChange }) {
  const state = {
    query: "",
    category: "",
    verifiedOnly: false,
    favoritesOnly: false,
    favorites: favoritesProvider(),
    mood: "",
    radiusStep: 0,
    radiusMinutes: null,
    bigAdventureOnly: false,
  };

  const searchInput = $("#filter-search");
  const categorySelect = $("#filter-category");
  const verifiedCheckbox = $("#filter-verified");
  const favsCheckbox = $("#filter-favorites");
  const bigAdventureCheckbox = $("#filter-big-adventure");

  const radiusInput = $("#radius-range");
  const radiusLabel = $("#radius-label");

  const moodChips = Array.from(
    document.querySelectorAll(".mood-chip[data-mood]"),
  );

  if (categorySelect) {
    buildCategoryOptions(categorySelect, categories);
  }

  const notify = () => onFilterChange({ ...state });

  // Suche
  if (searchInput) {
    searchInput.addEventListener(
      "input",
      debounce((e) => {
        state.query = e.target.value || "";
        notify();
      }, 200),
    );
  }

  // Kategorie
  if (categorySelect) {
    categorySelect.addEventListener("change", (e) => {
      state.category = e.target.value || "";
      notify();
    });
  }

  // Verifiziert
  if (verifiedCheckbox) {
    verifiedCheckbox.addEventListener("change", (e) => {
      state.verifiedOnly = e.target.checked;
      notify();
    });
  }

  // Favoriten
  if (favsCheckbox) {
    favsCheckbox.addEventListener("change", (e) => {
      state.favoritesOnly = e.target.checked;
      notify();
    });
  }

  // Nur große Abenteuer
  if (bigAdventureCheckbox) {
    bigAdventureCheckbox.addEventListener("change", (e) => {
      state.bigAdventureOnly = e.target.checked;
      notify();
    });
  }

  // Mood-Chips
  if (moodChips.length > 0) {
    moodChips.forEach((chip) => {
      chip.addEventListener("click", () => {
        const moodKey = chip.dataset.mood || "";
        if (state.mood === moodKey) {
          // Mood wieder deaktivieren
          state.mood = "";
        } else {
          state.mood = moodKey;
        }

        moodChips.forEach((c) => {
          const key = c.dataset.mood || "";
          c.classList.toggle("mood-chip--active", key === state.mood);
        });

        notify();
      });
    });
  }

  // Radius
  if (radiusInput) {
    // Initial setzen
    radiusInput.value = String(state.radiusStep);
    updateRadiusLabel(state.radiusStep, radiusLabel);

    radiusInput.addEventListener("input", (e) => {
      const step = Number(e.target.value || 0);
      state.radiusStep = step;
      const minutes =
        step >= 0 && step < RADIUS_MINUTES.length
          ? RADIUS_MINUTES[step]
          : null;
      state.radiusMinutes =
        typeof minutes === "number" && minutes > 0 ? minutes : null;

      updateRadiusLabel(step, radiusLabel);
      notify();
    });
  } else {
    // Fallback: kein Radius-Slider vorhanden
    state.radiusStep = 0;
    state.radiusMinutes = null;
  }

  return state;
}

// Wird aus app.js aufgerufen, wenn sich die Sprache ändert
export function refreshCategorySelect(categories) {
  const categorySelect = $("#filter-category");
  if (!categorySelect) return;
  buildCategoryOptions(categorySelect, categories);

  // Radius-Label bei Sprachwechsel aktualisieren
  const radiusInput = $("#radius-range");
  const radiusLabel = $("#radius-label");
  if (radiusInput && radiusLabel) {
    updateRadiusLabel(radiusInput.value, radiusLabel);
  }
}

// -----------------------------------------------------
// Filter-Anwendung inkl. Mood & Radius & Sortierung
// -----------------------------------------------------

export function applyFilters(spots, state) {
  const query = (state.query || "").trim().toLowerCase();
  const category = state.category || "";
  const favoritesSet = new Set(state.favorites || []);
  const mood = state.mood || "";
  const verifiedOnly = !!state.verifiedOnly;
  const favoritesOnly = !!state.favoritesOnly;
  const bigAdventureOnly = !!state.bigAdventureOnly;

  const origin = state.origin || null;
  const radiusMinutes =
    typeof state.radiusMinutes === "number" && state.radiusMinutes > 0
      ? state.radiusMinutes
      : null;
  const radiusKm = radiusMinutes ? radiusMinutes * 1.0 : null; // aktuell: 1 Min ≈ 1 km

  const itemsWithMeta = (spots || [])
    .map((spot) => {
      if (!spot) return null;

      const moodScore = computeMoodScore(spot, mood);
      const distanceKm =
        origin && spot.location ? computeDistanceKm(origin, spot.location) : null;

      return {
        spot,
        moodScore,
        distanceKm,
      };
    })
    .filter(Boolean)
    .filter(({ spot, moodScore, distanceKm }) => {
      if (!spot) return false;

      // Kategorie-Filter
      if (category && !(spot.categories || []).includes(category)) {
        return false;
      }

      // Verifiziert
      if (verifiedOnly && !spot.verified) {
        return false;
      }

      // Favoriten
      if (favoritesOnly && !favoritesSet.has(spot.id)) {
        return false;
      }

      // "Nur große Abenteuer"
      if (bigAdventureOnly && !isBigAdventureSpot(spot)) {
        return false;
      }

      // Such-Query
      if (query) {
        const parts = [
          spot.name,
          spot.city,
          spot.address,
          spot.poetry,
          ...(spot.tags || []),
          ...(spot.usps || []),
          ...(spot.categories || []),
        ]
          .filter(Boolean)
          .map((x) => String(x).toLowerCase());

        if (!parts.join(" ").includes(query)) {
          return false;
        }
      }

      // Mood: bei aktivem Mood nur Spots mit Score > 0
      if (mood && moodScore <= 0) {
        return false;
      }

      // Radius
      if (radiusKm && distanceKm != null && distanceKm > radiusKm) {
        return false;
      }

      return true;
    });

  // Sortierung: erst Mood-Score, dann Entfernung, dann Name
  itemsWithMeta.sort((a, b) => {
    // Mood zuerst, wenn aktiv
    if (mood) {
      if (b.moodScore !== a.moodScore) {
        return b.moodScore - a.moodScore;
      }
    }

    // Dann Entfernung, wenn Radius aktiv und Distanz vorhanden
    if (radiusKm && a.distanceKm != null && b.distanceKm != null) {
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
    }

    const nameA = (a.spot.name || "").toString();
    const nameB = (b.spot.name || "").toString();
    return nameA.localeCompare(nameB, "de-DE");
  });

  return itemsWithMeta.map((item) => item.spot);
}