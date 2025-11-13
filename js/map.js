import { findSpotById } from "./data.js";

let map = null;
const markersById = new Map();
let onMarkerSelectCb = null;

export function initMap({ center, zoom, onMarkerSelect }) {
  onMarkerSelectCb = onMarkerSelect;

  map = L.map("map", {
    center: [center.lat, center.lng],
    zoom,
    zoomControl: true
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);
}

export function getMap() {
  return map;
}

export function setSpots(spots) {
  markersById.forEach((m) => m.remove());
  markersById.clear();

  if (!map) return;

  spots.forEach((spot) => {
    const marker = L.marker([spot.location.lat, spot.location.lng]).addTo(map);
    marker.on("click", () => {
      const fullSpot = findSpotById(spot.id);
      if (onMarkerSelectCb && fullSpot) {
        onMarkerSelectCb(fullSpot.id);
      }
    });
    markersById.set(spot.id, marker);
  });
}

export function focusOnSpot(spot) {
  if (!spot || !map) return;
  map.setView([spot.location.lat, spot.location.lng], 15, {
    animate: true
  });
}