// js/filters.js

import { $, debounce } from "./utils.js";
import { getLanguage, t } from "./i18n.js";

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

  // vorher ausgewählte Kategorie beibehalten (falls vorhanden)
  categorySelect.value = currentValue;
}

export function initFilters({ categories, favoritesProvider, onFilterChange }) {
  const state = {
    query: "",
    category: "",
    verifiedOnly: false,
    favoritesOnly: false,
    favorites: favoritesProvider(),
  };

  const searchInput = $("#filter-search");
  const categorySelect = $("#filter-category");
  const verifiedCheckbox = $("#filter-only-verified");
  const favsCheckbox = $("#filter-only-favs");

  // Kategorien ins Select (mit Mehrsprachigkeit)
  if (categorySelect) {
    buildCategoryOptions(categorySelect, categories);
  }

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
      state.verifiedOnly = e.target.checked;
      notify();
    });
  }

  if (favsCheckbox) {
    favsCheckbox.addEventListener("change", (e) => {
      state.favoritesOnly = e.target.checked;
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

  return spots.filter((spot) => {
    if (!spot) return false;

    if (category && !(spot.categories || []).includes(category)) {
      return false;
    }

    if (state.verifiedOnly && !spot.verified) {
      return false;
    }

    if (state.favoritesOnly && !favoritesSet.has(spot.id)) {
      return false;
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

      if (!parts.join(" ").includes(query)) {
        return false;
      }
    }

    return true;
  });
}