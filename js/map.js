/* global L */

let map = null;
let markerLayer = null;
let onMarkerSelectCallback = null;
const markersById = new Map();

/**
 * Initialisiert die Leaflet-Karte.
 *
 * @param {Object} options
 * @param {{lat: number, lng: number}} options.center
 * @param {number} options.zoom
 * @param {(spotId: string) => void} [options.onMarkerSelect]
 */
export function initMap(options) {
  const { center, zoom, onMarkerSelect } = options;

  onMarkerSelectCallback = onMarkerSelect || null;

  map = L.map("map", {
    center: [center.lat, center.lng],
    zoom,
    zoomControl: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap-Mitwirkende",
  }).addTo(map);
}

/**
 * Liefert die Leaflet-Map-Instanz zurück.
 */
export function getMap() {
  return map;
}

function ensureMarkerLayer() {
  if (!map) {
    return null;
  }

  if (!markerLayer) {
    if (typeof L.markerClusterGroup === "function") {
      // Falls das Clustering-Plugin geladen ist, nutzen wir es
      markerLayer = L.markerClusterGroup();
    } else {
      // Fallback: normale LayerGroup
      markerLayer = L.layerGroup();
    }

    markerLayer.addTo(map);
  }

  return markerLayer;
}

/**
 * Zeichnet alle Spots auf die Karte.
 * Alte Marker werden vorher entfernt.
 *
 * @param {Array<{id: string, location: {lat: number, lng: number}}>} spots
 */
export function setSpotsOnMap(spots) {
  if (!map) {
    return;
  }

  const layer = ensureMarkerLayer();
  if (!layer) {
    return;
  }

  layer.clearLayers();
  markersById.clear();

  spots.forEach((spot) => {
    const { lat, lng } = spot.location;
    const marker = L.marker([lat, lng]);

    // 👉 Klick auf den Pin wählt den Spot aus
    marker.on("click", () => {
      if (onMarkerSelectCallback) {
        onMarkerSelectCallback(spot.id);
      }
    });

    layer.addLayer(marker);
    markersById.set(spot.id, marker);
  });
}

/**
 * Zentriert die Karte auf einen Spot.
 *
 * @param {{id: string, location: {lat: number, lng: number}}} spot
 */
export function focusOnSpot(spot) {
  if (!map || !spot) {
    return;
  }

  const { lat, lng } = spot.location;

  map.setView([lat, lng], 15, {
    animate: true,
  });

  const marker = markersById.get(spot.id);
  if (marker && typeof marker.openPopup === "function") {
    marker.openPopup();
  }
}