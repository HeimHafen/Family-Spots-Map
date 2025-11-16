// js/filters.js

import { $, debounce } from "./utils.js";
import { getLanguage, t } from "./i18n.js";

// Zwei Radius-Skalen: Alltag vs. Reise
const RADIUS_LEVELS_KM_EVERYDAY = [5, 15, 30, 60, null];
const RADIUS_LEVELS_KM_TRIP = [25, 50, 100, 200, null];

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
  water: [
    "abenteuerspielplatz",
    "wasserspielplatz",
    "badesee",
    "schwimmbad",
  ],
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

function getRadiusKm(index, travelMode) {
  const arr =
    travelMode === "trip"
      ? RADIUS_LEVELS_KM_TRIP
      : RADIUS_LEVELS_KM_EVERYDAY;
  if (index < 0 || index >= arr.length) return null;
  const v = arr[index];
  return v == null ? null : v;
}

function updateRadiusUI(index, travelMode) {
  const slider = $("#filter-radius");
  const descEl = $("#filter-radius-description");
  const maxLabelEl = $("#filter-radius-max-label");

  const mode = travelMode === "trip" ? "trip" : "everyday";

  if (slider && String(slider.value) !== String(index)) {
    slider.value = String(index);
  }

  const lang = getLanguage();
  const isGerman = !lang || lang.indexOf("de") === 0;

  const radiusKm = getRadiusKm(index, mode);

  if (maxLabelEl) {
    if (radiusKm == null) {
      maxLabelEl.textContent = isGerman ? "Alle Spots" : "All spots";
    } else {
      maxLabelEl.textContent = isGerman
        ? "Radius aktiv"
        : "Radius active";
    }
  }

  if (!descEl) return;

  if (radiusKm == null) {
    descEl.textContent = isGerman
      ? "Alle Spots – ohne Radiusbegrenzung."
      : "All spots – no radius limit.";
    return;
  }

  // Emotionalere Texte je nach Reise-Modus und Stufe
  let text = "";
  if (isGerman) {
    if (mode === "everyday") {
      if (index === 0) {
        text =
          "Zu Fuß oder mit dem Rad – Mikro-Abenteuer fast vor der Haustür (ca. " +
          radiusKm +
          " km).";
      } else if (index === 1) {
        text =
          "Kurzer Ausflug in die Nachbarschaft (ca. " +
          radiusKm +
          " km ab Kartenmitte).";
      } else if (index === 2) {
        text =
          "Ausflug in eurer Region – eine kleine Fahrt wert (ca. " +
          radiusKm +
          " km).";
      } else if (index === 3) {
        text =
          "Großer Tagesausflug in eurem Bundesland (ca. " +
          radiusKm +
          " km).";
      } else {
        text =
          "Alle Spots – ohne Radiusbegrenzung. Perfekt für große Planungen.";
      }
    } else {
      // Reise-Modus
      if (index === 0) {
        text =
          "Kurzer Stopp auf der Strecke – ideal für eine Pause (ca. " +
          radiusKm +
          " km um die Kartenmitte).";
      } else if (index === 1) {
        text =
          "Abstecher in die Umgebung eurer Route (ca. " +
          radiusKm +
          " km).";
      } else if (index === 2) {
        text =
          "Abenteuer-Spot für euren Reisetag (ca. " +
          radiusKm +
          " km).";
      } else if (index === 3) {
        text =
          "Weite Tour – die besten Spots entlang eurer Route (ca. " +
          radiusKm +
          " km).";
      } else {
        text =
          "Alle Spots – perfekt, um neue Regionen für eure Reisen zu entdecken.";
      }
    }
  } else {
    // EN (etwas knapper, aber auch freundlich)
    if (mode === "everyday") {
      if (index === 0) {
        text =
          "Walk or short bike ride – micro adventure near home (~" +
          radiusKm +
          " km).";
      } else if (index === 1) {
        text =
          "Short trip in your neighbourhood (~" +
          radiusKm +
          " km from map centre).";
      } else if (index === 2) {
        text =
          "Regional day out – a short drive (~" +
          radiusKm +
          " km).";
      } else if (index === 3) {
        text =
          "Big day trip in your region (~" +
          radiusKm +
          " km).";
      } else {
        text =
          "All spots – no radius limit. Perfect for planning bigger adventures.";
      }
    } else {
      if (index === 0) {
        text =
          "Quick stop along your route (~" +
          radiusKm +
          " km around map centre).";
      } else if (index === 1) {
        text =
          "Small detour from your travel route (~" +
          radiusKm +
          " km).";
      } else if (index === 2) {
        text =
          "Adventure spot for today’s travel day (~" +
          radiusKm +
          " km).";
      } else if (index === 3) {
        text =
          "Wide tour – the best family spots along your route (~" +
          radiusKm +
          " km).";
      } else {
        text =
          "All spots – great for discovering new areas for future trips.";
      }
    }
  }

  descEl.textContent = text;
}

function matchesAgeGroup(spot, ageGroup) {
  if (!ageGroup || ageGroup === "all") return true;

  let groupMin = 0;
  let groupMax = 99;

  if (ageGroup === "0-3") {
    groupMin = 0;
    groupMax = 3;
  } else if (ageGroup === "4-9") {
    groupMin = 4;
    groupMax = 9;
  } else if (ageGroup === "10-17") {
    groupMin = 10;
    groupMax = 17;
  }

  const spotMin =
    typeof spot.ageMin === "number"
      ? spot.ageMin
      : typeof spot.age_min === "number"
      ? spot.age_min
      : 0;
  const spotMax =
    typeof spot.ageMax === "number"
      ? spot.ageMax
      : typeof spot.age_max === "number"
      ? spot.age_max
      : 99;

  // Wenn keine sinnvollen Angaben vorhanden sind, lieber nicht hart filtern
  if (spotMin === 0 && spotMax === 99) return true;

  // Kein Überschnitt → passt nicht
  if (spotMax < groupMin || spotMin > groupMax) {
    return false;
  }
  return true;
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
    ageGroup: "",
    travelMode: "everyday",
  };

  const searchInput = $("#filter-search");
  const categorySelect = $("#filter-category");
  const verifiedCheckbox = $("#filter-verified");
  const favsCheckbox = $("#filter-favorites");
  const bigCheckbox = $("#filter-big-adventures");
  const radiusSlider = $("#filter-radius");
  const moodButtons = Array.from(
    document.querySelectorAll(".mood-chip"),
  );
  const ageSelect = $("#filter-age");
  const travelModeButtons = Array.from(
    document.querySelectorAll(".travel-mode-chip"),
  );

  if (categorySelect) {
    buildCategoryOptions(categorySelect, categories);
  }

  updateRadiusUI(state.radiusIndex, state.travelMode);

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
        updateRadiusUI(idx, state.travelMode);
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
          b.classList.toggle(
            "mood-chip--active",
            state.mood === m,
          );
        });

        notify();
      });
    });
  }

  if (ageSelect) {
    ageSelect.addEventListener("change", (e) => {
      state.ageGroup = e.target.value || "";
      notify();
    });
  }

  if (travelModeButtons.length > 0) {
    travelModeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mode === "trip" ? "trip" : "everyday";
        state.travelMode = mode;

        travelModeButtons.forEach((b) => {
          const m = b.dataset.mode === "trip" ? "trip" : "everyday";
          b.classList.toggle(
            "travel-mode-chip--active",
            m === state.travelMode,
          );
        });

        updateRadiusUI(state.radiusIndex, state.travelMode);
        notify();
      });
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
  const ageGroup = state.ageGroup || "";
  const travelMode = state.travelMode || "everyday";

  let centerLat = null;
  let centerLng = null;
  if (state.mapCenter) {
    const c = state.mapCenter;
    if (typeof c.lat === "number" && typeof c.lng === "number") {
      centerLat = c.lat;
      centerLng = c.lng;
    } else if (
      typeof c.lat === "function" &&
      typeof c.lng === "function"
    ) {
      centerLat = c.lat();
      centerLng = c.lng();
    }
  }

  const radiusIndex =
    typeof state.radiusIndex === "number" ? state.radiusIndex : 4;
  const radiusKm = getRadiusKm(radiusIndex, travelMode);

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

    if (ageGroup && !matchesAgeGroup(spot, ageGroup)) {
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

    results.push({
      spot,
      moodScore,
      distanceKm,
    });
  }

  results.sort((a, b) => {
    const msA = a.moodScore || 0;
    const msB = b.moodScore || 0;
    if (msA !== msB) {
      return msB - msA;
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
    return r.spot;
  });
}