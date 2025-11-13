import { getLanguage } from "./i18n.js";

let indexData = null;
let spotsData = [];

export async function loadAppData() {
  const [indexRes, spotsRes] = await Promise.all([
    fetch("data/index.json"),
    fetch("data/spots.json")
  ]);

  if (!indexRes.ok) throw new Error("Cannot load index.json");
  if (!spotsRes.ok) throw new Error("Cannot load spots.json");

  const rawIndex = await indexRes.json();
  const rawSpotsRoot = await spotsRes.json();

  const categories = (rawIndex.categories || []).map((cat) => {
    const label =
      cat.label ||
      {
        de: cat.label_de || cat.name_de || cat.name || cat.slug,
        en: cat.label_en || cat.name_en || cat.name || cat.slug
      };
    return {
      slug: cat.slug,
      icon: cat.icon || "",
      label
    };
  });

  const rawSpots = Array.isArray(rawSpotsRoot.spots)
    ? rawSpotsRoot.spots
    : Array.isArray(rawSpotsRoot)
    ? rawSpotsRoot
    : [];

  const normalizedSpots = rawSpots.map((spot) => {
    const lat =
      spot.lat ?? spot.latitude ?? spot.location?.lat ?? null;
    const lng =
      spot.lon ?? spot.lng ?? spot.longitude ?? spot.location?.lng ?? null;

    const categories =
      Array.isArray(spot.categories) && spot.categories.length
        ? spot.categories
        : spot.category
        ? [spot.category]
        : [];

    return {
      id: spot.id,
      name: spot.title || spot.name || "",
      city: spot.city || "",
      country: spot.country || "",
      address: spot.address || "",
      categories,
      primaryCategory: categories[0] || null,
      location:
        lat != null && lng != null
          ? { lat: Number(lat), lng: Number(lng) }
          : null,
      verified: Boolean(spot.verified),
      visitMinutes: spot.visit_minutes || spot.visitMinutes || null,
      poetry: spot.poetry || "",
      tags: Array.isArray(spot.tags) ? spot.tags : [],
      usps: Array.isArray(spot.usps)
        ? spot.usps
        : Array.isArray(spot.usp)
        ? spot.usp
        : []
    };
  });

  const defaultLocation =
    rawIndex.defaultLocation || {
      lat: 51.0,
      lng: 10.0,
      zoom: 6
    };

  indexData = {
    ...rawIndex,
    categories,
    defaultLocation,
    defaultZoom: rawIndex.defaultZoom || defaultLocation.zoom || 6
  };

  spotsData = normalizedSpots;

  return { index: indexData, spots: spotsData };
}

export function getIndex() {
  return indexData;
}

export function getSpots() {
  return spotsData;
}

export function getCategories() {
  return indexData?.categories || [];
}

export function findSpotById(id) {
  return spotsData.find((s) => s.id === id) || null;
}

export function getCategoryLabel(slug, lang = getLanguage()) {
  const cat = (indexData?.categories || []).find((c) => c.slug === slug);
  if (!cat) return slug;
  return cat.label?.[lang] || Object.values(cat.label)[0] || slug;
}