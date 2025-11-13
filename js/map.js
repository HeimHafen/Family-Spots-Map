let mapInstance = null;
let markersById = new Map();
let onMarkerSelectCallback = null;

export function initMap({ center, zoom, onMarkerSelect }) {
  onMarkerSelectCallback = onMarkerSelect;

  mapInstance = L.map("map", {
    center: [center.lat, center.lng],
    zoom: zoom || center.zoom || 6,
    zoomControl: true
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap-Mitwirkende"
  }).addTo(mapInstance);
}

export function getMap() {
  return mapInstance;
}

export function setSpotsOnMap(spots) {
  if (!mapInstance) return;

  markersById.forEach((marker) => marker.remove());
  markersById.clear();

  if (!spots || !spots.length) return;

  const bounds = [];

  spots.forEach((spot) => {
    if (!spot.location) return;

    const marker = L.marker([spot.location.lat, spot.location.lng]);
    marker.addTo(mapInstance);
    marker.on("click", () => {
      if (onMarkerSelectCallback) {
        onMarkerSelectCallback(spot.id);
      }
    });
    markersById.set(spot.id, marker);
    bounds.push([spot.location.lat, spot.location.lng]);
  });

  if (bounds.length > 1) {
    mapInstance.fitBounds(bounds, { padding: [40, 40] });
  }
}

export function focusOnSpot(spot) {
  if (!mapInstance || !spot?.location) return;

  const target = [spot.location.lat, spot.location.lng];
  const currentZoom = mapInstance.getZoom();
  const targetZoom = Math.max(currentZoom, 14);

  mapInstance.setView(target, targetZoom, { animate: true });
}