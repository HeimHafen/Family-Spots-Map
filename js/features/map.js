// js/features/map.js
// ======================================================
// Leaflet-Map + Marker-Cluster für Family Spots
// Kapselt die komplette Kartenlogik
// ======================================================

"use strict";

import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "../config.js";

let mapInstance = null;
let markersLayer = null;
let markerClusterPluginPromise = null;

/**
 * Stellt sicher, dass Leaflet.markercluster geladen ist, bevor die Map
 * initialisiert wird. Falls das Plugin bereits vorhanden ist, passiert nichts.
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
 * Initialisiert die Leaflet-Karte im Element #map.
 * Nutzt DEFAULT_MAP_CENTER / DEFAULT_MAP_ZOOM aus config.js.
 */
export function initMap() {
  if (typeof L === "undefined" || typeof L.map !== "function") {
    console.error("[Family Spots] Leaflet (L) ist nicht verfügbar.");
    mapInstance = null;
    markersLayer = null;
    return;
  }

  mapInstance = L.map("map", {
    center: DEFAULT_MAP_CENTER,
    zoom: DEFAULT_MAP_ZOOM,
    zoomControl: false
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap-Mitwirkende"
  }).addTo(mapInstance);

  if (typeof L.markerClusterGroup === "function") {
    markersLayer = L.markerClusterGroup();
  } else {
    console.warn(
      "[Family Spots] markerClusterGroup nicht gefunden – nutze normale LayerGroup."
    );
    markersLayer = L.layerGroup();
  }

  mapInstance.addLayer(markersLayer);
}

/**
 * Liefert die aktuelle Leaflet-Map-Instanz (oder null).
 */
export function getMap() {
  return mapInstance;
}

/**
 * Optional, falls du später mal direkt an den Layer willst.
 */
export function getMarkersLayer() {
  return markersLayer;
}

/**
 * Rendert Marker für eine Spot-Liste auf der Karte.
 * - löscht vorher alle Marker
 * - erzeugt Marker-Cluster (falls Plugin geladen)
 *
 * @param {Array<Object>} spots
 * @param {{
 *   onSpotClick?: (spot: any) => void,
 *   hasValidLatLng?: (spot: any) => boolean
 * }} [options]
 */
export function renderMarkers(spots, options = {}) {
  const { onSpotClick, hasValidLatLng } = options;

  if (!markersLayer) return;
  markersLayer.clearLayers();

  if (!Array.isArray(spots) || !spots.length) return;

  spots.forEach((spot) => {
    if (typeof hasValidLatLng === "function" && !hasValidLatLng(spot)) return;

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

    // Kein Popup – die App zeigt das große Detailpanel, darum Callback nach außen
    if (typeof onSpotClick === "function") {
      marker.on("click", () => {
        onSpotClick(spot);
      });
    }

    markersLayer.addLayer(marker);
  });
}