// filters.js
import { 
  RADIUS_STEPS_KM,
  favorites,
  plusActive,
  moodFilter,
  travelMode,
  onlyBigAdventures,
  onlyVerified,
  onlyFavorites,
  searchTerm,
  categoryFilter,
  ageFilter
} from './state.js';

import { isSpotPlusOnly, isSpotBigAdventure, isSpotVerified,
         buildSpotSearchText, getSpotAgeGroups, getSpotMoods,
         getSpotTravelModes, getSpotId } from './spotHelpers.js'; // you might create this helper module

/**
 * Prüft ob ein Spot zu den aktiven Filtern passt.
 * @param {Spot} spot
 * @param {{center: any, radiusKm:number}} ctx
 * @returns {boolean}
 */
export function doesSpotMatchFilters(spot, { center, radiusKm }) {
  if (isSpotPlusOnly(spot) && !plusActive) return false;

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    const haystack = buildSpotSearchText(spot);
    if (!haystack.includes(term)) return false;
  }

  if (categoryFilter) {
    // … implement logic …
  }

  // … age, mood, travelMode, bigAdventure, verified, favorites, radius …
  return true;
}

export function applyFilters(spots, center, radiusKm) {
  return spots.filter(spot => doesSpotMatchFilters(spot, { center, radiusKm }));
}