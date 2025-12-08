// js/map.js
// =========================================
// Leaflet-Map + Marker / Cluster
// =========================================

"use strict";

/**
 * Prüft, ob ein Spot brauchbare Koordinaten hat.
 * Normalisiert ggf. lon -> lng.
 */
export function hasValidLatLng(spot) {
  if (!spot) return false;

  let lat = Number(spot.lat);
  let lng = spot.lng != null ? Number(spot.lng) : Number(spot.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return false;
  }

  spot.lat = lat;
  spot.lng = lng;
  return true;
}

/**
 * Initialisiert die Leaflet-Karte und den Marker-Layer.
 * Wenn das MarkerCluster-Plugin verfügbar ist, wird ein Cluster-Layer genutzt,
 * sonst fällt die Funktion auf ein einfaches LayerGroup zurück.
 */
export function initMap({ center, zoom }) {
  if (typeof L === "undefined") {
    throw new Error("Leaflet (L) ist nicht geladen.");
  }

  const map = L.map("map", {
    center,
    zoom,
    zoomControl: true,
    attributionControl: true
  });

  // Basis-Tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-Mitwirkende'
  }).addTo(map);

  // Marker-Layer: Cluster, wenn möglich
  let markersLayer;
  if (typeof L.markerClusterGroup === "function") {
    markersLayer = L.markerClusterGroup({
      chunkedLoading: true,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: false,
      disableClusteringAtZoom: 13
    });
  } else {
    console.warn(
      "[Family Spots] Leaflet.markercluster nicht verfügbar – verwende einfache Marker-Ebene."
    );
    markersLayer = L.layerGroup();
  }

  markersLayer.addTo(map);

  return { map, markersLayer };
}

/**
 * Rendert Marker für eine Spot-Liste.
 * - nutzt den übergebenen markersLayer (Cluster oder LayerGroup)
 * - begrenzt die Anzahl Marker (maxMarkers)
 * - ruft bei Klick/Enter focusSpotOnMap(spot) auf
 * - gibt zurück, ob der Marker-Limit-Toast bereits gezeigt wurde
 */
export function renderMarkers({
  map,
  markersLayer,
  spots,
  maxMarkers,
  currentLang, // wird hier nur für Toast-Text genutzt, falls du das später brauchst
  showToast,
  hasShownMarkerLimitToast,
  focusSpotOnMap
}) {
  if (!map || !markersLayer) return hasShownMarkerLimitToast;

  markersLayer.clearLayers();

  if (!Array.isArray(spots) || spots.length === 0) {
    return hasShownMarkerLimitToast;
  }

  let list = spots;
  let tooManyMarkers = false;

  if (maxMarkers && spots.length > maxMarkers) {
    list = spots.slice(0, maxMarkers);
    tooManyMarkers = true;
  }

  list.forEach((spot) => {
    if (!hasValidLatLng(spot)) return;

    // HTML für unseren runden Punkt-Marker
    const html = '<div class="spot-marker-inner"></div>';

    const icon = L.divIcon({
      className: "spot-marker pin-pop", // pin-pop sorgt für das kurze Aufpoppen
      html,
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });

    const marker = L.marker([spot.lat, spot.lng], { icon });

    if (typeof focusSpotOnMap === "function") {
      marker.on("click", () => focusSpotOnMap(spot));
      marker.on("keypress", (ev) => {
        const key = ev.originalEvent && ev.originalEvent.key;
        if (key === "Enter" || key === " " || key === "Spacebar") {
          focusSpotOnMap(spot);
        }
      });
    }

    markersLayer.addLayer(marker);
  });

  if (tooManyMarkers && !hasShownMarkerLimitToast && typeof showToast === "function") {
    showToast("toast_marker_limit");
    hasShownMarkerLimitToast = true;
  }

  return hasShownMarkerLimitToast;
}

/**
 * Baut Routing-URLs für Apple Maps und Google Maps.
 */
export function getRouteUrlsForSpot(spot) {
  if (!hasValidLatLng(spot)) return null;

  const { lat, lng } = spot;

  return {
    apple: `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(
      `${lat},${lng}`
    )}`,
    google: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
  };
}