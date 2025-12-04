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
 *
 * Schreibt gültige Werte zurück auf den Spot, damit nachfolgende
 * Aufrufe von Leaflet immer konsistente Zahlen vorfinden.
 *
 * @param {Spot | null | undefined} spot
 * @returns {boolean} true, wenn lat/lng gültig sind
 */
export function hasValidLatLng(spot) {
  if (!spot) return false;

  let { lat, lng } = spot;

  if (typeof lat === "string") lat = parseFloat(lat);
  if (typeof lng === "string") lng = parseFloat(lng);

  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;

  spot.lat = lat;
  spot.lng = lng;
  return true;
}

/**
 * Initialisiert die Leaflet-Map und gibt Map + Marker-Layer zurück.
 *
 * Falls Leaflet (L) nicht verfügbar ist oder der Map-Container fehlt,
 * wird ein Fallback-Objekt mit { map: null, markersLayer: null } geliefert.
 *
 * @param {Object} [options]
 * @param {number[]} [options.center]
 * @param {number} [options.zoom]
 * @returns {{map: any, markersLayer: any}}
 */
export function initMap({
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM
} = {}) {
  if (typeof L === "undefined" || typeof L.map !== "function") {
    console.error("[Family Spots] Leaflet (L) ist nicht verfügbar.");
    return { map: null, markersLayer: null };
  }

  const containerId = "map";
  const containerEl = document.getElementById(containerId);
  if (!containerEl) {
    console.error(
      `[Family Spots] Map-Container mit id="${containerId}" wurde nicht im DOM gefunden.`
    );
    return { map: null, markersLayer: null };
  }

  let map;
  try {
    map = L.map(containerEl, {
      center,
      zoom,
      zoomControl: false
    });
  } catch (err) {
    console.error("[Family Spots] Fehler beim Initialisieren der Karte:", err);
    return { map: null, markersLayer: null };
  }

  // Basis-OSM-Tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap-Mitwirkende"
  }).addTo(map);

  // Marker-Layer (Cluster, falls verfügbar)
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
 *
 * Wird bei jedem Filter-/Zoom-Update aufgerufen. Entfernt alle
 * bestehenden Marker und rendert die übergebenen Spots neu.
 *
 * @param {Object} params
 * @param {any} params.map
 * @param {any} params.markersLayer
 * @param {Spot[]} params.spots
 * @param {number} [params.maxMarkers]
 * @param {string} [params.currentLang] ISO-Sprache ("de" | "en" | "da")
 * @param {(msg:string)=>void} [params.showToast]
 * @param {boolean} [params.hasShownMarkerLimitToast]
 * @param {(spot:Spot)=>void} [params.focusSpotOnMap]
 * @returns {boolean} neuer Wert für hasShownMarkerLimitToast
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
  // Wenn Map oder Layer fehlen, keine Fehler werfen – einfach nichts tun.
  if (!map || !markersLayer) return hasShownMarkerLimitToast;

  // Leaflet-Schutz – falls L unerwartet nicht verfügbar ist.
  if (typeof L === "undefined" || typeof L.divIcon !== "function") {
    console.error(
      "[Family Spots] Leaflet ist nicht verfügbar – Marker können nicht gerendert werden."
    );
    return hasShownMarkerLimitToast;
  }

  markersLayer.clearLayers();

  if (!Array.isArray(spots) || spots.length === 0) {
    return hasShownMarkerLimitToast;
  }

  // Sicherheitsnetz für maxMarkers
  const effectiveMaxMarkers =
    typeof maxMarkers === "number" && maxMarkers > 0
      ? maxMarkers
      : MAX_MARKERS_RENDER;

  const shouldLimit = spots.length > effectiveMaxMarkers;
  const toRender = shouldLimit
    ? spots.slice(0, effectiveMaxMarkers)
    : spots;

  // DivIcon-HTML als String (nicht als DOM-Element) – kompatibel mit Leaflet
  const iconHtml =
    '<div class="spot-marker"><div class="spot-marker-inner pin-pop"></div></div>';

  // Icon einmalig erzeugen und für alle Marker wiederverwenden
  const baseIcon = L.divIcon({
    html: iconHtml,
    className: "",
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  toRender.forEach((spot) => {
    if (!hasValidLatLng(spot)) return;

    const marker = L.marker([spot.lat, spot.lng], { icon: baseIcon });

    // Kein Leaflet-Popup – nur der große Info-Kasten unten in der UI
    if (typeof focusSpotOnMap === "function") {
      marker.on("click", () => {
        focusSpotOnMap(spot);
      });
    }

    markersLayer.addLayer(marker);
  });

  if (shouldLimit) {
    // Nur einmal pro Session anzeigen
    if (!hasShownMarkerLimitToast && typeof showToast === "function") {
      let msg;
      if (currentLang === "de") {
        msg = `Nur die ersten ${effectiveMaxMarkers} Spots auf der Karte – bitte Filter oder Zoom nutzen.`;
      } else if (currentLang === "da" || currentLang === "dk") {
        msg = `Kun de første ${effectiveMaxMarkers} spots vises på kortet – brug gerne filtre eller zoom ind.`;
      } else {
        msg = `Only the first ${effectiveMaxMarkers} spots are shown on the map – please use filters or zoom in.`;
      }
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
 *
 * Nutzt Apple Maps und Google Maps. Wenn keine gültigen Koordinaten
 * vorhanden sind, wird null zurückgegeben.
 *
 * @param {Spot} spot
 * @returns {{apple: string, google: string} | null}
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