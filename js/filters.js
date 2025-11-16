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

// Travel-Heuristiken: welche Kategorien sind eher „Alltag“, welche „Unterwegs“
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
  "verkehrsgarten",
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
  "badesee",
]);

// Alters-Heuristiken
const AGE_CATS_TODDLER = new Set([
  "toddler-barfuss-motorik",
  "spielplatz",
  "indoor-spielplatz",
  "waldspielplatz",
  "wasserspielplatz",
  "verkehrsgarten",
]);

const AGE_CATS_ACTION = new Set([
  "pumptrack",
  "skatepark",
  "boulderpark",
  "kletteranlage-outdoor",
  "kletterhalle",
  "freizeitpark",
]);

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
    const slug = typeof c === "string" ? c : c.slug;
    const labelObj = typeof c === "string" ? null : c.label;

    opt.value = slug;
    opt.textContent =
      (labelObj && (labelObj[lang] || labelObj.de)) || slug;
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

// Alters-Score (weich, nur fürs Ranking)
function getAgeScore(spot, ageGroup) {
  if (!ageGroup || ageGroup === "all") return 0;

  const categories = Array.isArray(spot.categories) ? spot.categories : [];
  let score = 0;

  const hasToddler = categories.some((c) => AGE_CATS_TODDLER.has(c));
  const hasAction = categories.some((c) => AGE_CATS_ACTION.has(c));

  if (ageGroup === "0-3") {
    if (hasToddler) score += 2;
    if (hasAction) score -= 2;
  } else if (ageGroup === "4-9") {
    if (hasToddler) score += 1;
    if (hasAction) score += 1;
  } else if (ageGroup === "10+") {
    if (hasAction) score += 2;
    if (hasToddler) score -= 1;
  }

  return score;
}

// Travel-Score (Alltag vs. Unterwegs)
function getTravelScore(spot, travelMode) {
  if (!travelMode) return 0;

  const categories = Array.isArray(spot.categories) ? spot.categories : [];
  let score = 0;

  const hasEveryday = categories.some((c) => TRAVEL_CATS_EVERYDAY.has(c));
  const hasTrip = categories.some((c) => TRAVEL_CATS_TRIP.has(c));

  if (travelMode === "trip") {
    if (spot.plus_only) score += 2;
    if (hasTrip) score += 2;
    if (hasEveryday) score += 0; // neutral
  } else if (travelMode === "everyday") {
    if (spot.plus_only) score -= 1;
    if (hasEveryday) score += 1;
    if (hasTrip) score += 0; // neutral
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
    ageGroup: "all",  // "all" | "0-3" | "4-9" | "10+"
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

  // Travel-Mode (Alltag / Unterwegs)
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

  // Alters-Select
  if (ageSelect) {
    ageSelect.value = state.ageGroup;
    ageSelect.addEventListener("change", (e) => {
      state.ageGroup = e.target.value || "all";
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
  const ageGroup = state.ageGroup || "all";

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

  // Neu: Kreis auf der Karte aktualisieren (oder entfernen)
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
    const ageScore = getAgeScore(spot, ageGroup);

    results.push({
      spot,
      moodScore,
      travelScore,
      ageScore,
      distanceKm,
    });
  }

  // NextGen-Ranking:
  // 1. Mood (stark gewichtet)
  // 2. Travel-Mode + Alters-Match
  // 3. Distanz
  // 4. Name
  results.sort((a, b) => {
    const scoreA =
      (a.moodScore || 0) * 10 +
      (a.travelScore || 0) * 3 +
      (a.ageScore || 0);
    const scoreB =
      (b.moodScore || 0) * 10 +
      (b.travelScore || 0) * 3 +
      (b.ageScore || 0);

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    const dA = a.distanceKm != null ? a.distanceKm : Infinity;
    const dB = b.distanceKm != null ? b.distanceKm : Infinity;
    if (dA !== dB) {
      return dA - dB;
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