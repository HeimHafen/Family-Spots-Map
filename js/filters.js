// js/filters.js

import { $, debounce } from "./utils.js";
import { getLanguage, t } from "./i18n.js";
import { updateRadiusCircle } from "./map.js";

const RADIUS_LEVELS_KM = [5, 15, 30, 60, null];

// Feste Labels für Kategorien (DE/EN)
const CATEGORY_LABELS = {
  "spielplatz": { de: "Spielplatz", en: "Playground" },
  "abenteuerspielplatz": {
    de: "Abenteuerspielplatz",
    en: "Adventure playground",
  },
  "indoor-spielplatz": {
    de: "Indoor-Spielplatz",
    en: "Indoor playground",
  },
  "waldspielplatz": { de: "Waldspielplatz", en: "Forest playground" },
  "wasserspielplatz": {
    de: "Wasserspielplatz",
    en: "Water playground",
  },
  zoo: { de: "Zoo", en: "Zoo" },
  wildpark: {
    de: "Wildpark & Safaris",
    en: "Wildlife park & safaris",
  },
  tierpark: { de: "Tierpark", en: "Animal park" },
  bauernhof: { de: "Bauernhof", en: "Farm" },
  schwimmbad: { de: "Schwimmbad", en: "Swimming pool" },
  badesee: { de: "Badesee", en: "Lake for swimming" },
  "park-garten": { de: "Park / Garten", en: "Park / garden" },
  picknickwiese: { de: "Picknickwiese", en: "Picnic meadow" },
  "wanderweg-kinderwagen": {
    de: "Wanderweg (kinderwagenfreundlich)",
    en: "Hiking trail (stroller-friendly)",
  },
  "radweg-family": {
    de: "Familien-Radweg",
    en: "Family cycle route",
  },
  "museum-kinder": { de: "Museum (Kinder)", en: "Museum (kids)" },
  bibliothek: { de: "Bibliothek (Kinder)", en: "Library (kids)" },
  freizeitpark: { de: "Freizeitpark", en: "Theme park" },
  minigolf: { de: "Minigolf", en: "Mini golf" },
  kletterhalle: { de: "Kletterhalle", en: "Climbing hall" },
  "kletteranlage-outdoor": {
    de: "Kletteranlage / Boulder (draußen)",
    en: "Outdoor climbing / bouldering",
  },
  boulderpark: { de: "Boulderpark", en: "Bouldering park" },
  trampolinpark: { de: "Trampolinpark", en: "Trampoline park" },
  skatepark: { de: "Skatepark", en: "Skate park" },
  pumptrack: { de: "Pumptrack", en: "Pump track" },
  multifunktionsfeld: {
    de: "Multifunktionsfeld",
    en: "Multi-sport field",
  },
  bolzplatz: { de: "Bolzplatz", en: "Soccer court" },
  bewegungspark: { de: "Bewegungspark", en: "Movement park" },
  familiencafe: { de: "Familien-Café", en: "Family café" },
  "kinder-familiencafe": {
    de: "Kinder- & Familien-Café",
    en: "Kids & family café",
  },
  "familien-restaurant": {
    de: "Familien-Restaurant",
    en: "Family restaurant",
  },
  eisbahn: { de: "Eisbahn", en: "Ice rink" },
  rodelhuegel: { de: "Rodelhügel", en: "Sledding hill" },
  "oeffentliche-toilette": {
    de: "Öffentliche Toilette",
    en: "Public toilet",
  },
  wickelraum: { de: "Wickelraum", en: "Baby changing room" },
  "familien-event": { de: "Familien-Event", en: "Family event" },
  "rastplatz-spielplatz-dusche": {
    de: "Rastplatz mit Spielplatz & Duschen",
    en: "Rest area with playground & showers",
  },
  "stellplatz-spielplatz-naehe-kostenlos": {
    de: "Kostenloser Stellplatz in Spielplatznähe",
    en: "Free RV spot near playground",
  },
  "wohnmobil-service-station": {
    de: "Wohnmobil-Service-Station",
    en: "RV service station",
  },
  "bikepacking-spot": { de: "Bikepacking-Spot", en: "Bikepacking spot" },
  "toddler-barfuss-motorik": {
    de: "Barfuß- & Motorikpfad (Kleinkinder)",
    en: "Barefoot & motor skills trail (toddlers)",
  },
  naturerlebnispfad: {
    de: "Natur-Erlebnispfad",
    en: "Nature discovery trail",
  },
  walderlebnisroute: {
    de: "Walderlebnisroute",
    en: "Forest discovery route",
  },
  verkehrsgarten: { de: "Verkehrsgarten", en: "Traffic training park" },
  strand: { de: "Familien-Strand", en: "Family beach" },
  "campingplatz-familien": {
    de: "Campingplatz (Familien)",
    en: "Family campground",
  },
};

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
  animals: [
    "zoo",
    "tierpark",
    "wildpark",
    "tiere",
    "safari",
    "giraffe",
    "bauernhof",
  ],
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
  // Sprache möglichst sicher bestimmen
  const lang =
    getLanguage() ||
    document.documentElement.lang ||
    navigator.language ||
    "de";
  const isDe = lang.toLowerCase().startsWith("de");

  const currentValue = categorySelect.value || "";

  categorySelect.innerHTML = "";

  const allOpt = document.createElement("option");
  allOpt.value = "";
  allOpt.textContent = t(
    "filter_category_all",
    isDe ? "Alle Kategorien" : "All categories",
  );
  categorySelect.appendChild(allOpt);

  categories.forEach((c) => {
    const opt = document.createElement("option");
    const slug = typeof c === "string" ? c : c.slug;
    const labelObj = typeof c === "string" ? null : c.label;

    const mapLabel = CATEGORY_LABELS[slug];
    let text;

    if (mapLabel) {
      text = isDe ? mapLabel.de : mapLabel.en;
    } else if (labelObj) {
      text = (labelObj[lang] || labelObj.de || slug).trim();
    } else {
      text = slug;
    }

    opt.value = slug;
    opt.textContent = text;
    categorySelect.appendChild(opt);
  });

  // Falls der aktuelle Wert noch existiert, wieder auswählen
  const hasCurrent = Array.from(categorySelect.options).some(
    (o) => o.value === currentValue,
  );
  categorySelect.value = hasCurrent ? currentValue : "";
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
    const tt = lowerTags[i];
    if (
      tt.indexOf("ganzer tag") !== -1 ||
      tt.indexOf("riesig") !== -1 ||
      tt.indexOf("groß") !== -1
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
    ageGroup: "all", // "all" | "0-3" | "4-9" | "10+"
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
          const m = b.dataset.travelMode || null