// state.js
export const LANG_DE = "de";
export const LANG_EN = "en";
export const THEME_LIGHT = "light";
export const THEME_DARK = "dark";

export let currentLang = LANG_DE;
export let currentTheme = THEME_LIGHT;

export /** @type {Spot[]} */ let spots = [];
export /** @type {Spot[]} */ let filteredSpots = [];
export let favorites = new Set();

export let plusActive = false;
export let moodFilter = null;
export let travelMode = null;
export let radiusStep = 4;
export let ageFilter = "all";
export let searchTerm = "";
export let categoryFilter = "";
export let onlyBigAdventures = false;
export let onlyVerified = false;
export let onlyFavorites = false;
export let filtersCollapsed = true;

// Export RADIUS_STEPS_KM too
export const RADIUS_STEPS_KM = [1, 5, 15, 40, Infinity];