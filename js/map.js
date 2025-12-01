// js/map.js
// ======================================================
// Leaflet-Map + Marker-Rendering + Routing-Helfer
// (keine UI-States, aber DOM für Marker-HTML)
// ======================================================

"use strict";

import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  MAX_MARKERS_RENDER
} from "./config.js";

/**
 * @typedef {import("./app.js").Spot} Spot
 */

/**
 * Koordinaten validieren und bei Bedarf String → Zahl konvertieren.
 * @param {Spot} spot
 * @returns {boolean}
 */
export function hasValidLatLng(spot) {
  if (spot == null) return false;

  let { lat, lng } = spot;

  if (typeof lat === "string") lat = parseFloat(lat);
  if (typeof lng === "string") lng = parseFloat(lng);

  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;

  // zurückschreiben, damit der Spot danach sauber ist
  spot.lat = lat;
  spot.lng = lng;
  return true;
}

/**
 * Initialisiert die Leaflet-Map und gibt Map + Marker-Layer zurück.
 * @returns {{map: any, markersLayer: any}}
 */
export function initMap({ center = DEFAULT_MAP_CENTER, zoom = DEFAULT_MAP_ZOOM } = {}) {
  if (typeof L === "undefined" || typeof L.map !== "function") {
    console.error("[Family Spots] Leaflet (L) ist nicht verfügbar.");
    return { map: null, markersLayer: null };
  }

  const map = L.map("map", {
    center,
    zoom,
    zoomControl: false
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap-Mitwirkende"
  }).addTo(map);

  let markersLayer;
  if (typeof L.markerClusterGroup === "function") {
    markersLayer = L.markerClusterGroup();
  } else {
    console.warn(
      "[Family Spots] markerClusterGroup nicht gefunden – nutze normale LayerGroup."
    );
    markersLayer = L.layerGroup();
  }

  map.addLayer(markersLayer);
  return { map, markersLayer };
}

/**
 * Marker auf der Map rendern.
 * Gibt zurück, ob das Marker-Limit bereits als Toast gezeigt wurde.
 *
 * @param {Object} params
 * @param {any} params.map
 * @param {any} params.markersLayer
 * @param {Spot[]} params.spots
 * @param {number} [params.maxMarkers]
 * @param {string} [params.currentLang]
 * @param {(msg:string)=>void} [params.showToast]
 * @param {boolean} [params.hasShownMarkerLimitToast]
 * @param {(spot:Spot)=>void} [params.focusSpotOnMap]
 * @returns {boolean} neuer hasShownMarkerLimitToast
 */
export function renderMarkers({
  map,
  markersLayer,
  spots,
  maxMarkers = MAX_MARKERS_RENDER,
  currentLang = "de",
  showToast,
  hasShownMarkerLimitToast = false,
  focusSpotOnMap
}) {
  if (!markersLayer) return hasShownMarkerLimitToast;
  markersLayer.clearLayers();

  if (!Array.isArray(spots) || !spots.length) return hasShownMarkerLimitToast;

  const shouldLimit = spots.length > maxMarkers;
  const toRender = shouldLimit ? spots.slice(0, maxMarkers) : spots;

  toRender.forEach((spot) => {
    if (!hasValidLatLng(spot)) return;
    if (typeof L === "undefined" || typeof L.divIcon !== "function") return;

    // Marker-HTML (kleiner Punkt/Pin)
    const el = document.createElement("div");
    el.className = "spot-marker";
    const inner = document.createElement("div");
    inner.className = "spot-marker-inner pin-pop";
    el.appendChild(inner);

    const icon = L.divIcon({
      html: el,
      className: "",
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([spot.lat, spot.lng], { icon });

    // Kein Leaflet-Popup – nur noch der große Info-Kasten unten
    marker.on("click", () => {
      if (typeof focusSpotOnMap === "function") {
        focusSpotOnMap(spot);
      }
    });

    markersLayer.addLayer(marker);
  });

  if (shouldLimit) {
    if (!hasShownMarkerLimitToast && typeof showToast === "function") {
      const msg =
        currentLang === "de"
          ? `Nur die ersten ${maxMarkers} Spots auf der Karte – bitte Filter oder Zoom nutzen.`
          : `Only the first ${maxMarkers} spots are shown on the map – please use filters or zoom in.`;
      showToast(msg);
      hasShownMarkerLimitToast = true;
    }
  } else {
    // Reset, falls Filter/Zoom wieder unter das Limit fallen
    hasShownMarkerLimitToast = false;
  }

  return hasShownMarkerLimitToast;
}

/**
 * Routen-URLs für einen Spot berechnen.
 * @param {Spot} spot
 */
export function getRouteUrlsForSpot(spot) {
  if (!hasValidLatLng(spot)) return null;

  const { lat, lng } = spot;
  const name =
    spot.title ||
    spot.name ||
    spot.spotName ||
    (spot.id != null ? String(spot.id) : "Spot");
  const encodedName = encodeURIComponent(name || "");

  return {
    apple: `https://maps.apple.com/?ll=${lat},${lng}&q=${encodedName}`,
    google: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  };
}