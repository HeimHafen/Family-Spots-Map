// js/features/map.js
// ----------------------------------------------
// Leaflet-Map-Kapselung (Initialisierung & Marker)
// ----------------------------------------------

"use strict";

import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../config.js";

/**
 * @typedef {Object} Spot
 * @property {number} [lat]
 * @property {number} [lng]
 */

// interne Referenzen
let map = null;
let markersLayer = null;
let markerClusterPluginPromise = null;

/**
 * Liefert die aktuelle Leaflet-Map (oder null, wenn nicht initialisiert).
 */
export function getMap() {
  return map;
}

/**
 * Stellt sicher, dass Leaflet.markercluster geladen ist, bevor die Map
 * initialisiert wird.
 */
export function ensureMarkerClusterPlugin() {
  if (typeof L === "undefined") {
    // Leaflet noch nicht verfügbar – dann können wir hier nichts laden.
    return Promise.resolve();
  }

  if (typeof L.markerClusterGroup === "function") {
    // Plugin ist schon eingebunden (z.B. über index.html)
    return Promise.resolve();
  }

  if (markerClusterPluginPromise) {
    return markerClusterPluginPromise;
  }

  markerClusterPluginPromise = new Promise((resolve) => {
    try {
      // CSS für Markercluster nur einmal einhängen
      const existingCss = document.querySelector(
        'link[data-fsm-markercluster="css"]'
      );
      if (!existingCss) {
        const baseUrl =
          "https://unpkg.com/leaflet.markercluster@1.5.3/dist/";
        const css1 = document.createElement("link");
        css1.rel = "stylesheet";
        css1.href = baseUrl + "MarkerCluster.css";
        css1.setAttribute("data-fsm-markercluster", "css");
        document.head.appendChild(css1);

        const css2 = document.createElement("link");
        css2.rel = "stylesheet";
        css2.href = baseUrl + "MarkerCluster.Default.css";
        css2.setAttribute("data-fsm-markercluster", "css");
        document.head.appendChild(css2);
      }

      const script = document.createElement("script");
      script.src =
        "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
      script.async = true;
      script.onload = () => {
        resolve();
      };
      script.onerror = () => {
        console.warn(
          "[Family Spots] Konnte Leaflet.markercluster nicht laden – es werden normale Marker genutzt."
        );
        resolve();
      };
      document.head.appendChild(script);
    } catch (err) {
      console.warn(
        "[Family Spots] Fehler beim Laden von Leaflet.markercluster:",
        err
      );
      resolve();
    }
  });

  return markerClusterPluginPromise;
}

/**
 * Initialisiert die Leaflet-Map und den Marker-Layer.
 * @returns {any} die Map-Instanz oder null
 */
export function initMap() {
  if (typeof L === "undefined" || typeof L.map !== "function") {
    console.error("[Family Spots] Leaflet (L) ist nicht verfügbar.");
    map = null;
    markersLayer = null;
    return null;
  }

  map = L.map("map", {
    center: DEFAULT_MAP_CENTER,
    zoom: DEFAULT_MAP_ZOOM,
    zoomControl: false
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap-Mitwirkende"
  }).addTo(map);

  if (typeof L.markerClusterGroup === "function") {
    markersLayer = L.markerClusterGroup();
  } else {
    console.warn(
      "[Family Spots] markerClusterGroup nicht gefunden – nutze normale LayerGroup."
    );
    markersLayer = L.layerGroup();
  }

  map.addLayer(markersLayer);
  return map;
}

/**
 * Marker neu rendern.
 * Erwartet bereits gefilterte Spots – Limit & Toast macht app.js.
 *
 * @param {Spot[]} spots
 * @param {{ onSpotClick?: (spot: Spot) => void, hasValidLatLng: (spot: Spot) => boolean }} options
 */
export function renderMarkers(spots, { onSpotClick, hasValidLatLng }) {
  if (!markersLayer) return;
  markersLayer.clearLayers();

  if (!spots || !spots.length) return;
  if (typeof L === "undefined" || typeof L.divIcon !== "function") return;

  spots.forEach((spot) => {
    if (!hasValidLatLng(spot)) return;

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

    if (typeof onSpotClick === "function") {
      marker.on("click", () => onSpotClick(spot));
    }

    markersLayer.addLayer(marker);
  });
}