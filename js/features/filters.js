// js/features/filters.js

import { $, debounce } from "../utils/utils.js";
import { getLanguage, t } from "../i18n.js";
import { updateRadiusCircle } from "./map.js";

const RADIUS_LEVELS_KM = [5, 15, 30, 60, null];

const MOOD_CATEGORY_MAP = {
  relaxed: [
    "spielplatz",
    "waldspielplatz",
    "park-garten",
    "badesee",
    "wanderweg-kinderwagen",
    "radweg-family"
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
    "trampolinpark"
  ],
  water: ["abenteuerspielplatz", "wasserspielplatz", "badesee", "schwimmbad"],
  animals: ["zoo", "wildpark", "tierpark", "bauernhof"]
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
    "action"
  ],
  water: [
    "wasser",
    "see",
    "strand",
    "fluss",
    "bach",
    "nass",
    "planschen",
    "wasserspiel"
  ],
  animals: [
    "zoo",
    "tierpark",
    "wildpark",
    "tiere",
    "safari",
    "giraffe",
    "bauernhof"
  ]
};

const TRAVEL_CATS_EVERYDAY = new Set([
  "spielplatz",
  "abenteuerspielplatz",
  "waldspielplatz",
  "indoor-spielplatz",
  "wasserspielplatz",
  "park-garten",
  "picknickwiese",
  "badesee",
  "toddler-barfuss-motorik",
  "bewegungspark",
  "multifunktionsfeld",
  "bolzplatz",
  "verkehrsgarten"
]);

const TRAVEL_CATS_TRIP = new Set([
  "rastplatz-spielplatz-dusche",
  "stellplatz-spielplatz-naehe-kostenlos",
  "wohnmobil-service-station",
  "campingplatz-familien",
  "bikepacking-spot",
  "freizeitpark",
  "zoo",
  "wildpark",
  "tierpark",
  "strand",
  "badesee"
]);

const AGE_CATS_TODDLER = new Set([
  "toddler-barfuss-motorik",
  "spielplatz",
  "indoor-spielplatz",
  "waldspielplatz",
  "wasserspielplatz",
  "verkehrsgarten"
]);

const AGE_CATS_ACTION = new Set([
  "pumptrack",
  "skatepark",
  "boulderpark",
  "kletteranlage-outdoor",
  "kletterhalle",
  "freizeitpark"
]);

function buildCategoryOptions(categorySelect, categories) {
  const langRaw = getLanguage() || "de";
  const baseLang = langRaw.split("-")[0];
  const currentValue = categorySelect.value || "";

  categorySelect.innerHTML = "";

  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = t(
    "filter_category_all",
    baseLang === "de" ? "Alle Kategorien" : "All categories"
  );
  categorySelect.appendChild(allOpt);

  categories.forEach((c) => {
    const opt = document.createElement("option");
    const slug = typeof c === "string" ? c : c.slug;
    const labelObj = typeof c === "string" ? null : c.label;

    let label = slug;
    if (labelObj && typeof labelObj === "object") {
      label =
        labelObj[baseLang] ||
        labelObj[langRaw] ||
        labelObj.de ||
        label;
    }

    opt.value = slug;
    opt.textContent = label;
    categorySelect.appendChild(opt);
  });

  categorySelect.value = currentValue;
}

function distanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
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

  for (const c of categories) {
    if (moodCats.includes(c)) {
      score += 2;
    }
  }

  const lowerTags = tags.map((t) => String(t).toLowerCase());
  const textParts = [
    spot.poetry,
    spot.summary_de,
    spot.summary_en,
    spot.visitLabel_de,
    spot.visitLabel_en
  ]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());

  const allText = lowerTags.join(" ") + " " + textParts.join(" ");

  for (const kw of moodKeywords) {
    if (allText.includes(kw)) {
      score += 1;
    }
  }

  return score;
}

function getAgeScore(spot, ageGroup) {
  if (!ageGroup || ageGroup === "all") return 0;
  const categories = Array.isArray(spot.categories) ? spot.categories : [];
  let score = 0;

  const hasToddler = categories.some((c) => AGE_CATS_TODDLER.has(c));
  const hasAction = categories.some((c) => AGE_CATS_ACTION.has(c));

  if (ageGroup === "0‑3") {
    if (hasToddler) score += 2;
    if (hasAction) score -= 2;
  } else if (ageGroup === "4‑9") {
    if (hasToddler) score += 1;
    if (hasAction) score += 1;
  } else if (ageGroup === "10+") {
    if (hasAction) score += 2;
    if (hasToddler) score -= 1;
  }

  return score;
}

function getTravelScore(spot, travelMode) {
  if (!travelMode) return 0;

  const categories = Array.isArray(spot.categories) ? spot.categories : [];
  let score = 0;

  const hasEveryday = categories.some((c) => TRAVEL_CATS_EVERYDAY.has(c));
  const hasTrip = categories.some((c) => TRAVEL_CATS_TRIP.has(c));

  if (travelMode === "trip") {
    if (spot.plus_only) score += 2;
    if (hasTrip) score += 2;
  } else if (travelMode === "everyday") {
    if (spot.plus_only) score -= 1;
    if (hasEveryday) score += 1;
  }
  return score;
}

function isBigAdventure(spot) {
  const categories = Array.isArray(spot.categories) ? spot.categories : [];
  const bigCats = new Set(["freizeitpark", "zoo", "wildpark", "tierpark"]);

  for (const c of categories) {
    if (bigCats.has(c)) return true;
  }

  const visitMinutes = Number(spot.visitMinutes ?? spot.visit_minutes);
  if (!Number.isNaN(visitMinutes) && visitMinutes >= 240) {
    return true;
  }

  const tags = Array.isArray(spot.tags) ? spot.tags : [];
  const lowerTags = tags.map((t) => String(t).toLowerCase());
  for (const t of lowerTags) {
    if (t.includes("ganzer tag") || t.includes("riesig") || t.includes("groß")) {
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
  }

  const lang = getLanguage();
  const isGerman = !lang || lang.startsWith("de");

  const fallback = radiusKm == null
    ? (isGerman ? "Alle Spots – ohne Radiusbegrenzung." : "All spots – no radius limit.")
    : (isGerman ? `Im Umkreis von ca. ${radiusKm} km ab Kartenmitte.` : `Within ~${radiusKm} km from map center.`);

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
    radiusIndex: 4,
    travelMode: null,
    ageGroup: "all"
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

  if (categorySelect) buildCategoryOptions(categorySelect, categories);

  updateRadiusUI(state.radiusIndex);

  const notify = () => onFilterChange({ ...state });

  if (searchInput) {
    searchInput.addEventListener(
      "input",
      debounce((e) => {
        state.query = e.target.value || "";
        notify();
      }, 200)
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

  if (moodButtons.length) {
    moodButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mood = btn.dataset.mood || null;
        state.mood = state.mood === mood ? null : mood;
        moodButtons.forEach((b) => b.classList.toggle("mood-chip--active", b.dataset.mood === state.mood));
        notify();
      });
    });
  }

  if (travelButtons.length) {
    travelButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.travelMode || null;
        state.travelMode = state.travelMode === mode ? null : mode;
        travelButtons.forEach((b) => b.classList.toggle("travel-chip--active", b.dataset.travelMode === state.travelMode));

        const event = new CustomEvent("fsm:travelModeChanged", { detail: { mode: state.travelMode } });
        document.dispatchEvent(event);

        notify();
      });
    });
  }

  if (ageSelect) {
    ageSelect.value = state.ageGroup;
    ageSelect.addEventListener("change", (e) => {
      state.ageGroup = e.target.value || "all";
      notify();
    });
  }

  return state;
}

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
  const ageGroup = state.ageGroup || "all";

  const center = state.mapCenter;
  const centerLat = center?.lat ?? (typeof center?.lat === "function" ? center.lat() : null);
  const centerLng = center?.lng ?? (typeof center?.lng === "function" ? center.lng() : null);

  const radiusIndex = (typeof state.radiusIndex === "number" ? state.radiusIndex : 4);
  const radiusKm = RADIUS_LEVELS_KM[radiusIndex] ?? null;

  if (radiusKm != null && centerLat != null && centerLng != null) {
    updateRadiusCircle({ lat: centerLat, lng: centerLng }, radiusKm);
  } else {
    updateRadiusCircle(null, null);
  }

  const results = [];

  for (const spot of spots) {
    if (!spot) continue;
    const cats = Array.isArray(spot.categories) ? spot.categories : [];

    if (category && !cats.includes(category)) continue;
    if (verifiedOnly && !spot.verified) continue;
    if (favoritesOnly && !favoritesSet.has(spot.id)) continue;
    if (bigOnly && !isBigAdventure(spot)) continue;

    if (query) {
      const parts = [
        spot.name,
        spot.city,
        spot.address,
        spot.poetry,
        ...(spot.tags || []),
        ...(spot.usps || []),
        ...(spot.categories || [])
      ]
        .filter(Boolean)
        .map((x) => String(x).toLowerCase());

      if (!parts.join(" ").includes(query)) continue;
    }

    let distanceKm = null;
    if (radiusKm != null && centerLat != null && centerLng != null && spot.location) {
      distanceKm = distanceInKm(centerLat, centerLng, spot.location.lat, spot.location.lng);
      if (distanceKm > radiusKm) continue;
    }

    const moodScore = getMoodScore(spot, mood);
    if (mood && moodScore <= 0) continue;
    const travelScore = getTravelScore(spot, travelMode);
    const ageScore = getAgeScore(spot, ageGroup);

    results.push({ spot, moodScore, travelScore, ageScore, distanceKm });
  }

  results.sort((a, b) => {
    const scoreA = (a.moodScore || 0) * 10 + (a.travelScore || 0) * 3 + (a.ageScore || 0);
    const scoreB = (b.moodScore || 0) * 10 + (b.travelScore || 0) * 3 + (b.ageScore || 0);
    if (scoreA !== scoreB) return scoreB - scoreA;

    const dA = a.distanceKm != null ? a.distanceKm : Infinity;
    const dB = b.distanceKm != null ? b.distanceKm : Infinity;
    if (dA !== dB) return dA - dB;

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
