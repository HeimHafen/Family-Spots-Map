// js/filters/index.js
export {
  normalizeSpot,
  normalizeArrayField,
  getSpotAgeGroups,
  getSpotMoods,
  getSpotTravelModes
} from "./normalize.js";

export {
  getSpotName,
  getSpotSubtitle,
  getSpotId,
  getSpotTags,
  getSpotCategorySlugs,
  buildSpotSearchText
} from "./tags.js";

export { doesSpotMatchBaseFilters, isSpotVerified } from "./logic.js";
export { filterSpots } from "./apply.js";