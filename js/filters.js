// js/filters.js

import { $, debounce } from "./utils.js";
import { getLanguage, t } from "./i18n.js";
import { updateRadiusCircle } from "./map.js";

const RADIUS_LEVELS_KM = [5, 15, 30, 60, null];

const MOOD_CATEGORY_MAP = {
  relaxed: [
    "spielplatz",
    "waldspielplatz",
    "park-garten",
    "badesee",
    "wanderweg-kinderwagen",
    "radweg-family",
  ],
  action: [
    "abenteuerspielplatz",
    "freizeitpark",
    "pumptrack",
    "skatepark",
    "multifunktionsfeld",
    "bewegungspark",
    "kletterhalle",
    "kletteranlage-outdoor",
    "boulderpark",
    "trampolinpark",
  ],
  water: ["abenteuerspielplatz", "wasserspielplatz", "badesee", "schwimmbad"],
  animals: ["zoo", "wildpark", "tierpark", "bauernhof"],
};

const MOOD_KEYWORDS = {
  relaxed: ["ruhig", "entspannt", "schatten", "wiese", "park", "wald"],
  action: [
    "abenteuer",
    "klettern",
    "trampolin",
    "seil",
    "rutschen",
    "bike",
    "pumptrack",
    "skate",
    "sport",
    "action",
  ],
  water: [
    "wasser",
    "see",
    "strand",
    "fluss",
    "bach",
    "nass",
    "planschen",
    "wasserspiel",
  ],
  animals: ["zoo", "tierpark", "wildpark", "tiere", "safari", "giraffe", "bauernhof"],
};

// Reise-Modus: welche Kategorien passen typischerweise?
const TRAVEL_CATEGORY_MAP = {
  everyday: [
    "spielplatz",
    "abenteuerspielplatz",
    "indoor-spielplatz",
    "waldspielplatz",
    "wasserspielplatz",
    "park-garten",
    "picknickwiese",
    "toddler-barfuss-motorik",
    "verkehrsgarten",
    "schwimmbad",
    "badesee",
  ],
  trip: [
    "zoo",
    "wildpark",
    "tierpark",
    "freizeitpark",
    "campingplatz-familien",
    "rastplatz-spielplatz-dusche",
    "stellplatz-spielplatz-naehe-kostenlos",
    "wohnmobil-service-station",
    "bikepacking-spot",
    "familien-restaurant",
    "familiencafe",
    "kinder-familiencafe",
  ],
};

// Alters-„Profile“ über Kategorien
const AGE_CATEGORY_MAP = {
  "0-3": [
    "spielplatz",
    "waldspielplatz",
    "indoor-spielplatz",
    "toddler-barfuss-motorik",
    "verkehrsgarten",
    "picknickwiese",
    "park-garten",
    "badesee",
    "schwimmbad",
  ],
  "4-9": [
    "spielplatz",
    "abenteuerspielplatz",
    "waldspielplatz",
    "wasserspielplatz",
    "zoo",
    "wildpark",
    "tierpark",
    "freizeitpark",
    "verkehrsgarten",
    "naturerlebnispfad",
    "walderlebnisroute",
    "minigolf",
    "kletterhalle",
    "kletteranlage-outdoor",
    "boulderpark",
    "trampolinpark",
  ],
  "10+": [
    "freizeitpark",
    "pumptrack",
    "skatepark",
    "multifunktionsfeld",
    "bewegungspark",
    "kletterhalle",
    "kletteranlage-outdoor",
    "boulderpark",
    "radweg-family",
  ],
};

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
    opt.textContent = (c.label && c.label[lang]) || c.label?.de || c.slug;
    categorySelect.appendChild(opt);
  });

  categorySelect.value = currentValue;
}

function distanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const toRad = (v) => (v * Math.PI) / 180;
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

function getMoodScore(spot, mood) {
  if (!mood) return 0;

  const categories = Array.isArray(spot.categories) ? spot.categories : [];
  const tags = Array.isArray(spot.tags) ? spot.tags : [];

  const moodCats = MOOD_CATEGORY_MAP[mood] || [];
  const moodKeywords = MOOD_KEYWORDS[mood] || [];

  let score = 0;

  // Kategorien
  for (let i = 0; i < categories.length; i++) {
    if (moodCats.indexOf(categories[i]) !== -1) {
      score += 2;
    }
  }

  // Tags und Texte
  const lowerTags = tags.map((t) => String(t).toLowerCase());
  const textParts = [
    spot.poetry,
    spot.summary_de,
    spot.summary_en,
    spot.visitLabel_de,
    spot.visitLabel_en,
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  const allText = lowerTags.join(" ") + " " + textParts.join(" ");

  for (let i = 0; i < moodKeywords.length; i++) {
    const kw = moodKeywords[i];
    if (allText.indexOf(kw) !== -1) {
      score += 1;
    }
  }

  return score;
}

function getTravelScore(spot, travelMode) {
  if (!travelMode) return 0;

  const categories = Array.isArray(spot.categories) ? spot.categories : [];
  const travelCats = TRAVEL_CATEGORY_MAP[travelMode] || [];
  if (travelCats.length === 0 || categories.length === 0) return 0;

  let score = 0;
  for (let i = 0; i < categories.length; i++) {
    if (travelCats.indexOf(categories[i]) !== -1) {
      score += 2;
    }
  }
  return score;
}

function getAgeScore(spot, ageRange) {
  if (!ageRange || ageRange === "all") return 0;

  const categories = Array.isArray(spot.categories) ? spot.categories : [];
  const tags = Array.isArray(spot.tags) ? spot.tags : [];
  const ageCats = AGE_CATEGORY_MAP[ageRange] || [];

  let score = 0;

  for (let i = 0; i < categories.length; i++) {
    if (ageCats.indexOf(categories[i]) !== -1) {
      score += 2;
    }
  }

  // Grobe Stichwortsuche
  const lowerText =
    [
      spot.summary_de,
      spot.summary_en,
      spot.visitLabel_de,
      spot.visitLabel_en,
      spot.poetry,
    ]
      .filter(Boolean)
      .map((s) => String(s).toLowerCase())
      .join(" ") +
    " " +
    tags.map((t) => String(t).toLowerCase()).join(" ");

  if (ageRange === "0-3") {
    if (
      lowerText.includes("kleinkind") ||
      lowerText.includes("toddler") ||
      lowerText.includes("baby") ||
      lowerText.includes("kinderwagen")
    ) {
      score += 1;
    }
  } else if (ageRange === "4-9") {
    if (
      lowerText.includes("grundschule") ||
      lowerText.includes("4–9") ||
      lowerText.includes("4-9")
    ) {
      score += 1;
    }
  } else if (ageRange === "10+") {
    if (
      lowerText.includes("jugendliche") ||
      lowerText.includes("teen") ||
      lowerText.includes("10+")
    ) {
      score += 1;
    }
  }

  return score;
}

function isBigAdventure(spot) {
  const categories = Array.isArray(spot.categories) ? spot.categories : [];
  const bigCats = {
    freizeitpark: true,
    zoo: true,
    wildpark: true,
    tierpark: true,
  };

  for (let i = 0; i < categories.length; i++) {
    if (bigCats[categories[i]]) {
      return true;
    }
  }

  const visitMinutes = Number(
    spot.visitMinutes != null ? spot.visitMinutes : spot.visit_minutes,
  );
  if (!Number.isNaN(visitMinutes) && visitMinutes >= 240) {
    return true;
  }

  const tags = Array.isArray(spot.tags) ? spot.tags : [];
  const lowerTags = tags.map((t) => String(t).toLowerCase());
  for (let i = 0; i < lowerTags.length; i++) {
    const t = lowerTags[i];
    if (
      t.indexOf("ganzer tag") !== -1 ||
      t.indexOf("riesig") !== -1 ||
      t.indexOf("groß") !== -1
    ) {
      return true;
    }
  }

  return false;
}

function updateRadiusUI(index) {
  const slider = $("#filter-radius");
  const descEl = $("#filter-radius-description");
  const maxLabelEl = $("#filter-radius-max-label");

  if (slider && String(slider.value) !== String(index)) {
    slider.value = String(index);
  }

  const radiusKm = RADIUS_LEVELS_KM[index] ?? null;

  if (maxLabelEl) {
    maxLabelEl.textContent = t("filter_radius_max_label", "Alle Spots");
  }

  if (!descEl) return;

  let key;
  switch (index) {
    case 0:
      key = "filter_radius_description_step0";
      break;
    case 1:
      key = "filter_radius_description_step1";
      break;
    case 2:
      key = "filter_radius_description_step2";
      break;
    case 3:
      key = "filter_radius_description_step3";
      break;
    default:
      key = "filter_radius_description_all";
      break;
  }

  const lang = getLanguage();
  const isGerman = !lang || lang.indexOf("de") === 0;

  let fallback;
  if (radiusKm == null) {
    fallback = isGerman
      ? "Alle Spots – ohne Radiusbegrenzung."
      : "All spots – no radius limit.";
  } else {
    fallback = isGerman
      ? "Im Umkreis von ca. " + radiusKm + " km ab Kartenmitte."
      : "Within ~" + radiusKm + " km from map center.";
  }

  descEl.textContent = t(key, fallback);
}

export function initFilters({ categories, favoritesProvider, onFilterChange }) {
  const state = {
    query: "",
    category: "",
    verifiedOnly: false,
    favoritesOnly: false,
    bigOnly: false,
    favorites: favoritesProvider(),
    mood: null,
    radiusIndex: 4, // 4 => Alle Spots
    travelMode: null, // "everyday" | "trip" | null
    ageRange: "all", // "all" | "0-3" | "4-9" | "10+"
  };

  const searchInput = $("#filter-search");
  const categorySelect = $("#filter-category");
  const verifiedCheckbox = $("#filter-verified");
  const favsCheckbox = $("#filter-favorites");
  const bigCheckbox = $("#filter-big-adventures");
  const radiusSlider = $("#filter-radius");
  const moodButtons = Array.from(document.querySelectorAll(".mood-chip"));
  const travelButtons = Array.from(document.querySelectorAll(".travel-chip"));
  const ageSelect = $("#filter-age");

  if (categorySelect) {
    buildCategoryOptions(categorySelect, categories);
  }

  updateRadiusUI(state.radiusIndex);

  const notify = () => onFilterChange({ ...state });

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      debounce((e) => {
        state.query = e.target.value || "";
        notify();
      }, 200),
    );
  }

  if (categorySelect) {
    categorySelect.addEventListener("change", (e) => {
      state.category = e.target.value || "";
      notify();
    });
  }

  if (verifiedCheckbox) {
    verifiedCheckbox.addEventListener("change", (e) => {
      state.verifiedOnly = !!e.target.checked;
      notify();
    });
  }

  if (favsCheckbox) {
    favsCheckbox.addEventListener("change", (e) => {
      state.favoritesOnly = !!e.target.checked;
      state.favorites = favoritesProvider();
      notify();
    });
  }

  if (bigCheckbox) {
    bigCheckbox.addEventListener("change", (e) => {
      state.bigOnly = !!e.target.checked;
      notify();
    });
  }

  if (radiusSlider) {
    radiusSlider.addEventListener("input", (e) => {
      const idx = parseInt(e.target.value, 10);
      if (!Number.isNaN(idx)) {
        state.radiusIndex = idx;
        updateRadiusUI(idx);
        notify();
      }
    });
  }

  if (moodButtons.length > 0) {
    moodButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mood = btn.dataset.mood || null;

        if (state.mood === mood) {
          state.mood = null;
        } else {
          state.mood = mood;
        }

        moodButtons.forEach((b) => {
          const m = b.dataset.mood || null;
          b.classList.toggle("mood-chip--active", state.mood === m);
        });

        notify();
      });
    });
  }

  if (travelButtons.length > 0) {
    travelButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.travelMode || null;

        if (state.travelMode === mode) {
          state.travelMode = null;
        } else {
          state.travelMode = mode;
        }

        travelButtons.forEach((b) => {
          const m = b.dataset.travelMode || null;
          b.classList.toggle("travel-chip--active", state.travelMode === m);
        });

        notify();
      });
    });
  }

  if (ageSelect) {
    ageSelect.value = state.ageRange;
    ageSelect.addEventListener("change", (e) => {
      const val = e.target.value || "all";
      state.ageRange = val;
      notify();
    });
  }

  return state;
}

// Wird aus app.js aufgerufen, wenn sich die Sprache ändert
export function refreshCategorySelect(categories) {
  const categorySelect = $("#filter-category");
  if (!categorySelect) return;
  buildCategoryOptions(categorySelect, categories);
}

export function applyFilters(spots, state) {
  const query = (state.query || "").trim().toLowerCase();
  const category = state.category || "";
  const favoritesSet = new Set(state.favorites || []);
  const verifiedOnly = !!state.verifiedOnly;
  const favoritesOnly = !!state.favoritesOnly;
  const bigOnly = !!state.bigOnly;
  const mood = state.mood || null;
  const travelMode = state.travelMode || null;
  const ageRange = state.ageRange || "all";

  let centerLat = null;
  let centerLng = null;
  if (state.mapCenter) {
    const c = state.mapCenter;
    if (typeof c.lat === "number" && typeof c.lng === "number") {
      centerLat = c.lat;
      centerLng = c.lng;
    } else if (typeof c.lat === "function" && typeof c.lng === "function") {
      centerLat = c.lat();
      centerLng = c.lng();
    }
  }

  const radiusIndex =
    typeof state.radiusIndex === "number" ? state.radiusIndex : 4;
  const radiusKm =
    radiusIndex >= 0 && radiusIndex < RADIUS_LEVELS_KM.length
      ? RADIUS_LEVELS_KM[radiusIndex]
      : null;

  // Kreis auf der Karte aktualisieren (oder entfernen)
  if (radiusKm != null && centerLat != null && centerLng != null) {
    updateRadiusCircle({ lat: centerLat, lng: centerLng }, radiusKm);
  } else {
    updateRadiusCircle(null, null);
  }

  const results = [];

  for (let i = 0; i < spots.length; i++) {
    const spot = spots[i];
    if (!spot) continue;

    const cats = Array.isArray(spot.categories) ? spot.categories : [];

    if (category && cats.indexOf(category) === -1) {
      continue;
    }

    if (verifiedOnly && !spot.verified) {
      continue;
    }

    if (favoritesOnly && !favoritesSet.has(spot.id)) {
      continue;
    }

    if (bigOnly && !isBigAdventure(spot)) {
      continue;
    }

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

      if (parts.join(" ").indexOf(query) === -1) {
        continue;
      }
    }

    let distanceKm = null;
    if (
      radiusKm != null &&
      centerLat != null &&
      centerLng != null &&
      spot.location
    ) {
      distanceKm = distanceInKm(
        centerLat,
        centerLng,
        spot.location.lat,
        spot.location.lng,
      );
      if (distanceKm > radiusKm) {
        continue;
      }
    }

    const moodScore = getMoodScore(spot, mood);
    if (mood && moodScore <= 0) {
      continue;
    }

    const travelScore = getTravelScore(spot, travelMode);
    const ageScore = getAgeScore(spot, ageRange);

    results.push({
      spot,
      moodScore,
      distanceKm,
      travelScore,
      ageScore,
    });
  }

  results.sort((a, b) => {
    const wA =
      (a.moodScore || 0) * 2 + (a.travelScore || 0) + (a.ageScore || 0);
    const wB =
      (b.moodScore || 0) * 2 + (b.travelScore || 0) + (b.ageScore || 0);

    if (wA !== wB) {
      return wB - wA; // höhere Scores zuerst
    }

    const dA = a.distanceKm != null ? a.distanceKm : Infinity;
    const dB = b.distanceKm != null ? b.distanceKm : Infinity;
    if (dA !== dB) {
      return dA - dB;
    }

    // Verifizierte Spots leicht bevorzugen
    const vA = a.spot.verified ? 1 : 0;
    const vB = b.spot.verified ? 1 : 0;
    if (vA !== vB) {
      return vB - vA;
    }

    const nameA = a.spot.name || "";
    const nameB = b.spot.name || "";
    return nameA.localeCompare(nameB, "de");
  });

  return results.map((r) => {
    r.spot._moodScore = r.moodScore;
    r.spot._distanceKm = r.distanceKm;
    r.spot._travelScore = r.travelScore;
    r.spot._ageScore = r.ageScore;
    return r.spot;
  });
}