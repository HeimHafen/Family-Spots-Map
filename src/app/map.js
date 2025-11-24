// map.js
import L from 'leaflet';
import { RADIUS_STEPS_KM } from './state.js';

let map;
let markersLayer;

/**
 * Initialisiert die Karte.
 * @param {string} containerId
 */
export function initMap(containerId = "map") {
  map = L.map(containerId, {
    center: [52.4, 9.7],
    zoom: 7,
    zoomControl: false
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap-Mitwirkende"
  }).addTo(map);

  markersLayer = L.markerClusterGroup ? L.markerClusterGroup() : L.layerGroup();
  map.addLayer(markersLayer);
}

/**
 * Setzt Marker für gegebene Spots.
 * @param {Spot[]} spots
 * @param {function(Spot):void} onSpotClick
 */
export function renderMarkers(spots, onSpotClick) {
  markersLayer.clearLayers();
  spots.forEach(spot => {
    if (!spot.lat || !spot.lng) return;
    const icon = L.divIcon({ html: `<div class="spot-marker"><div class="spot-marker-inner pin-pop"></div></div>`, iconSize:[24,24], iconAnchor:[12,12]});
    const marker = L.marker([spot.lat, spot.lng], { icon });
    marker.on("click", () => onSpotClick(spot));
    markersLayer.addLayer(marker);
  });
}

/**
 * Liefert center der Karte.
 * @returns {any}
 */
export function getMapCenter() {
  return map ? map.getCenter() : null;
}

export function setMapView(lat, lng, zoom) {
  if (map) map.setView([lat, lng], zoom);
}