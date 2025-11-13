// js/data.js
//
// Diese Datei lädt deine echten JSON-Daten (aktuelles Schema)
// und normalisiert sie so, dass der Rest der App damit arbeiten kann.

let indexData = null;
let spotsData = [];

/**
 * Lädt index.json + spots.json und normalisiert:
 * - categories: label_de/label_en -> label.{de,en}
 * - spots: lat/lon -> location.{lat,lng}
 * - spots: usp/usps -> usps
 * - index.defaultLocation / defaultZoom -> berechnet, falls nicht vorhanden
 */
export async function loadAppData() {
  const [indexRes, spotsRes] = await Promise.all([
    fetch("data/index.json"),
    fetch("data/spots.json")
  ]);

  if (!indexRes.ok) {
    throw new Error("Cannot load index.json");
  }
  if (!spotsRes.ok) {
    throw new Error("Cannot load spots.json");
  }

  const rawIndex = await indexRes.json();
  const rawSpots = await spotsRes.json();

  // --- Kategorien normalisieren ---
  const normalizedCategories = (rawIndex.categories || []).map((cat) => {
    const label = cat.label || {
      de: cat.label_de || cat.labelDe || cat.name_de || cat.name,
      en: cat.label_en || cat.labelEn || cat.name_en || cat.name
    };

    return {
      ...cat,
      label
    };
  });

  // --- Spots normalisieren ---
  const normalizedSpots = (rawSpots || []).map((spot) => {
    const lat =
      spot.lat ??
      spot.latitude ??
      spot.location?.lat;

    const lng =
      spot.lon ??
      spot.lng ??
      spot.longitude ??
      spot.location?.lng;

    const usps = spot.usps || spot.usp || [];

    return {
      ...spot,
      location: spot.location || { lat, lng },
      usps
    };
  });

  // --- Default-Location bestimmen ---
  let defaultLocation = rawIndex.defaultLocation;

  if (!defaultLocation) {
    // fallback: Mittelpunkt aller Spots
    const withCoords = normalizedSpots.filter(
      (s) =>
        typeof s.location?.lat === "number" &&
        typeof s.location?.lng === "number"
    );

    if (withCoords.length > 0) {
      const sum = withCoords.reduce(
        (acc, s) => {
          acc.lat += s.location.lat;
          acc.lng += s.location.lng;
          return acc;
        },
        { lat: 0, lng: 0 }
      );
      defaultLocation = {
        lat: sum.lat / withCoords.length,
        lng: sum.lng / withCoords.length,
        zoom: 11
      };
    } else {
      // harter Fallback: Hannover 😊
      defaultLocation = {
        lat: 52.3759,
        lng: 9.732,
        zoom: 11
      };
    }
  }

  const defaultZoom =
    rawIndex.defaultZoom ||
    defaultLocation.zoom ||
    11;

  indexData = {
    ...rawIndex,
    defaultLocation,
    defaultZoom,
    categories: normalizedCategories
  };

  spotsData = normalizedSpots;

  return { index: indexData, spots: spotsData };
}

export function getIndexData() {
  return indexData;
}

export function getSpots() {
  return spotsData;
}

export function findSpotById(id) {
  return spotsData.find((s) => s.id === id) || null;
}

export function getCategories() {
  return indexData?.categories || [];
}