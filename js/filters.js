import { $, debounce } from "./utils.js";

export function initFilters({ categories, favoritesProvider, onFilterChange }) {
  const state = {
    query: "",
    category: "",
    verifiedOnly: false,
    favoritesOnly: false,
    favorites: favoritesProvider()
  };

  const searchInput = $("#filter-search");
  const categorySelect = $("#filter-category");
  const verifiedCheckbox = $("#filter-only-verified");
  const favsCheckbox = $("#filter-only-favs");

  // Kategorien ins Select
  if (categorySelect) {
    categorySelect.innerHTML = "";
    const allOpt = document.createElement("option");
    allOpt.value = "";
    allOpt.textContent = "Alle Kategorien";
    categorySelect.appendChild(allOpt);

    categories.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.slug;
      opt.textContent = c.label?.de || c.slug;
      categorySelect.appendChild(opt);
    });
  }

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
        ...(spot.categories || [])
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