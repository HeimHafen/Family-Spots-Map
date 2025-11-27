// js/data/dataLoader.js
// Lädt und verarbeitet die Spot-Daten der App

let appData = {
  index: null,
  spots: [],
};

export async function loadAppData() {
  if (appData.index && appData.spots.length > 0) return appData;

  const [indexRes, spotsRes] = await Promise.all([
    fetch("data/index.json"),
    fetch("data/spots.json"),
  ]);

  if (!indexRes.ok) throw new Error("Konnte data/index.json nicht laden");
  if (!spotsRes.ok) throw new Error("Konnte data/spots.json nicht laden");

  const indexJson = await indexRes.json();
  const spotsJson = await spotsRes.json();

  const rawSpots = Array.isArray(spotsJson.spots) ? spotsJson.spots : [];

  const normalizedSpots = rawSpots
    .filter((raw) => raw?.id)
    .map((raw) => {
      const lat = Number(raw.lat ?? raw.latitude ?? raw.location?.lat ?? NaN);
      const lng = Number(
        raw.lon ??
          raw.lng ??
          raw.longitude ??
          raw.location?.lng ??
          NaN
      );
      const location =
        !isNaN(lat) && !isNaN(lng) ? { lat, lng } : null;

      return {
        id: String(raw.id),
        name: raw.name || raw.title || "",
        title: raw.title || raw.name || "",
        city: raw.city || "",
        country: raw.country || "",
        categories: Array.isArray(raw.categories) ? [...raw.categories] : [],
        tags: Array.isArray(raw.tags) ? [...raw.tags] : [],
        verified: !!raw.verified,
        visit_minutes: Number(
          raw.visit_minutes ?? raw.visitMinutes ?? NaN
        ) || null,
        poetry: raw.poetry || "",
        address: raw.address || "",
        summary_de: raw.summary_de || "",
        summary_en: raw.summary_en || "",
        visitLabel_de: raw.visitLabel_de || "",
        visitLabel_en: raw.visitLabel_en || "",
        plus_only: !!raw.plus_only,
        usps: Array.isArray(raw.usps) ? [...raw.usps] : [],
        location,
        raw,
      };
    });

  appData = {
    index: {
      defaultLocation: indexJson.defaultLocation ?? { lat: 52.0, lng: 10.0 },
      defaultZoom: indexJson.defaultZoom ?? 6,
      ...indexJson,
    },
    spots: normalizedSpots,
  };

  return appData;
}

export function getSpots() {
  return appData.spots;
}

export function getIndex() {
  return appData.index || null;
}

export function getAppData() {
  return appData;
}

export function getCategories() {
  if (Array.isArray(appData.index?.categories)) {
    return appData.index.categories.slice();
  }

  const set = new Set();
  for (const spot of appData.spots) {
    for (const c of spot.categories || []) {
      if (c) set.add(String(c));
    }
  }

  return Array.from(set).sort().map((slug) => ({
    slug,
    label: { de: slug, en: slug },
  }));
}

export function findSpotById(id) {
  return appData.spots.find((s) => s.id === id) || null;
}
