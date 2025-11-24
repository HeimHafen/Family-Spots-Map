// ui.js
import { t } from './i18n.js';
import { applyFilters } from './filters.js';
import { renderMarkers } from './map.js';
import { loadFavoritesFromStorage, saveFavoritesToStorage } from './storage.js';
import * as state from './state.js';

export function initUI() {
  // DOM‑Elemente, EventBindung, etc.
  document.getElementById("language-switcher").addEventListener("click", () => {
    const nextLang = state.currentLang === state.LANG_DE ? state.LANG_EN : state.LANG_DE;
    state.currentLang = nextLang;
    // … update UI texts …
  });
  // … weitere Events …
}

export function renderSpotList(spots) {
  const spotListEl = document.getElementById("spot-list");
  spotListEl.innerHTML = "";
  spots.forEach(spot => {
    const card = document.createElement("article");
    card.className = "spot-card";
    card.textContent = spot.title || spot.name;
    card.addEventListener("click", () => {
      // … show details …
    });
    spotListEl.appendChild(card);
  });
}