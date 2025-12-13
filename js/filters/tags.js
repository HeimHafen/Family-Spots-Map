// js/filters/tags.js
"use strict";

import { CATEGORY_TAGS } from "../config.js";

/**
 * @typedef {import("../app.js").Spot} Spot
 */

/**
 * Liefert den primären Anzeigenamen eines Spots.
 * @param {Spot} spot
 * @returns {string}
 */
export function getSpotName(spot) {
  return (
    spot.title ||
    spot.name ||
    spot.spotName ||
    (spot.id ? String(spot.id) : "Spot")
  );
}

/**
 * Liefert eine Unterzeile (Ort / Adresse / Kurzbeschreibung).
 * @param {Spot} spot
 * @returns {string}
 */
export function getSpotSubtitle(spot) {
  if (spot.city && spot.country) return `${spot.city}, ${spot.country}`;
  if (spot.city) return spot.city;
  if (spot.town && spot.country) return `${spot.town}, ${spot.country}`;
  if (spot.address) return spot.address;
  return spot.subtitle || spot.shortDescription || "";
}

/**
 * Liefert eine stabile ID für den Spot (für Favoriten etc.).
 * @param {Spot} spot
 * @returns {string}
 */
export function getSpotId(spot) {
  return String(spot.id || getSpotName(spot));
}

/**
 * Liefert alle Kategorie-Slugs eines Spots.
 * @param {Spot} spot
 * @returns {string[]}
 */
export function getSpotCategorySlugs(spot) {
  const slugs = new Set();
  if (spot.category) slugs.add(String(spot.category));
  if (Array.isArray(spot.categories)) {
    spot.categories.forEach((c) => {
      if (c) slugs.add(String(c));
    });
  }
  if (spot.categorySlug) {
    slugs.add(String(spot.categorySlug));
  }
  return Array.from(slugs);
}

/**
 * Kombiniert Tags aus den Rohdaten mit Kategorie-basierten Tags (CATEGORY_TAGS).
 * Ergebnis wird gecached in spot._tagsMerged.
 * @param {Spot} spot
 * @returns {string[]}
 */
export function getSpotTags(spot) {
  if (Array.isArray(spot._tagsMerged)) return spot._tagsMerged;

  const tagSet = new Set();

  // 1. Tags aus den Rohdaten (falls vorhanden)
  if (Array.isArray(spot.tags)) {
    spot.tags.forEach((tag) => {
      if (tag) tagSet.add(String(tag));
    });
  }

  // 2. Kategorien einsammeln (category + categories[])
  const catSlugs = new Set();

  if (spot.category) {
    catSlugs.add(String(spot.category));
  }

  if (Array.isArray(spot.categories)) {
    spot.categories.forEach((c) => {
      if (c) catSlugs.add(String(c));
    });
  }

  // Optional: falls du categorySlug verwendest, diesen auch berücksichtigen
  if (spot.categorySlug) {
    catSlugs.add(String(spot.categorySlug));
  }

  // 3. Kategorie-Tags aus CATEGORY_TAGS hinzumischen
  catSlugs.forEach((slug) => {
    const catTags = CATEGORY_TAGS[slug];
    if (Array.isArray(catTags)) {
      catTags.forEach((tag) => {
        if (tag) tagSet.add(String(tag));
      });
    }
  });

  const merged = Array.from(tagSet);
  spot._tagsMerged = merged;
  return merged;
}

/**
 * Suchtext aus Spot zusammenbauen und cachen.
 * @param {Spot} spot
 * @returns {string}
 */
export function buildSpotSearchText(spot) {
  if (spot._searchText) return spot._searchText;

  const parts = [
    getSpotName(spot),
    getSpotSubtitle(spot),
    spot.category,
    ...(Array.isArray(spot.tags) ? spot.tags : []),
    ...getSpotTags(spot),
  ].filter(Boolean);

  const text = parts.join(" ").toLowerCase();
  spot._searchText = text;
  return text;
}