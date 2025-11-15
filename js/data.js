// js/data.js

import { getLanguage } from "./i18n.js";

let indexData = null;
let spotsData = [];

/**
 * Lädt Index- und Spot-Daten und normalisiert die Struktur.
 */
export async function loadAppData() {
  const indexRes = await fetch("data/index.json");
  const spotsRes = await fetch("data/spots.json");

  if (!indexRes.ok) {
    throw new Error("Cannot load index.json");
  }
  if (!spotsRes.ok) {
    throw new Error("Cannot load spots.json");
  }

  const rawIndex = await indexRes.json();
  const rawSpotsRoot = await spotsRes.json();

  // Kategorien normalisieren
  const categories = (rawIndex.categories || []).map(function (cat) {
    const label =
      cat.label ||
      {
        de: cat.label_de || cat.name_de || cat.name || cat.slug,
        en: cat.label_en || cat.name_en || cat.name || cat.slug,
      };

    return {
      slug: cat.slug,
      icon: cat.icon || "",
      label: label,
    };
  });

  // Spots-Array zuverlässig ermitteln
  let rawSpots;
  if (Array.isArray(rawSpotsRoot.spots)) {
    rawSpots = rawSpotsRoot.spots;
  } else if (Array.isArray(rawSpotsRoot)) {
    rawSpots = rawSpotsRoot;
  } else {
    rawSpots = [];
  }

  const normalizedSpots = rawSpots.map(function (spot) {
    // Latitude bestimmen
    let lat = null;
    if (spot.lat != null) {
      lat = spot.lat;
    } else if (spot.latitude != null) {
      lat = spot.latitude;
    } else if (spot.location && spot.location.lat != null) {
      lat = spot.location.lat;
    }

    // Longitude bestimmen
    let lng = null;
    if (spot.lon != null) {
      lng = spot.lon;
    } else if (spot.lng != null) {
      lng = spot.lng;
    } else if (spot.longitude != null) {
      lng = spot.longitude;
    } else if (spot.location && spot.location.lng != null) {
      lng = spot.location.lng;
    }

    // Kategorien bestimmen
    let categories;
    if (Array.isArray(spot.categories) && spot.categories.length > 0) {
      categories = spot.categories;
    } else if (spot.category) {
      categories = [spot.category];
    } else {
      categories = [];
    }

    // Tags & USPs
    const tags = Array.isArray(spot.tags) ? spot.tags : [];
    let usps = [];
    if (Array.isArray(spot.usps)) {
      usps = spot.usps;
    } else if (Array.isArray(spot.usp)) {
      usps = spot.usp;
    }

    return {
      id: spot.id,
      name: spot.title || spot.name || "",
      city: spot.city || "",
      country: spot.country || "",
      address: spot.address || "",
      categories: categories,
      primaryCategory: categories.length > 0 ? categories[0] : null,
      location:
        lat != null && lng != null
          ? { lat: Number(lat), lng: Number(lng) }
          : null,
      verified: !!spot.verified,
      visitMinutes: spot.visit_minutes || spot.visitMinutes || null,

      // Poesie-Zeile für Liste
      poetry: spot.poetry || "",

      // Beschreibungstexte
      summary_de: spot.summary_de || null,
      summary_en: spot.summary_en || null,

      // Details für das Info-Fenster
      visitLabel_de: spot.visit_label_de || null,
      visitLabel_en: spot.visit_label_en || null,
      suitability_de: spot.suitability_de || null,
      suitability_en: spot.suitability_en || null,
      season_de: spot.season_de || null,
      season_en: spot.season_en || null,
      infrastructure_de: spot.infrastructure_de || null,
      infrastructure_en: spot.infrastructure_en || null,
      whyWeLike_de: spot.why_we_like_de || null,
      whyWeLike_en: spot.why_we_like_en || null,

      tags: tags,
      usps: usps,
    };
  });

  const defaultLocation =
    rawIndex.defaultLocation || {
      lat: 51.0,
      lng: 10.0,
      zoom: 6,
    };

  indexData = {
    appName: rawIndex.appName,
    tagline: rawIndex.tagline,
    languages: rawIndex.languages,
    meta: rawIndex.meta,
    defaultLocation: defaultLocation,
    defaultZoom: rawIndex.defaultZoom || defaultLocation.zoom || 6,
    features: rawIndex.features,
    plans: rawIndex.plans,
    plus: rawIndex.plus,
    packs: rawIndex.packs,
    categories: categories,
    version: rawIndex.version,
  };

  // Nur Spots mit gültiger Location berücksichtigen
  spotsData = normalizedSpots.filter(function (s) {
    return s.location;
  });

  return { index: indexData, spots: spotsData };
}

export function getIndex() {
  return indexData;
}

export function getSpots() {
  return spotsData;
}

export function getCategories() {
  return indexData && indexData.categories ? indexData.categories : [];
}

export function findSpotById(id) {
  if (!spotsData || !spotsData.length) return null;
  for (let i = 0; i < spotsData.length; i++) {
    if (spotsData[i].id === id) return spotsData[i];
  }
  return null;
}

export function getCategoryLabel(slug, lang) {
  const language = lang || getLanguage();
  const cats = getCategories();
  const cat = cats.find(function (c) {
    return c.slug === slug;
  });
  if (!cat) return slug;

  if (cat.label && cat.label[language]) {
    return cat.label[language];
  }
  if (cat.label) {
    const values = Object.keys(cat.label).map(function (k) {
      return cat.label[k];
    });
    return values[0] || slug;
  }
  return slug;
}