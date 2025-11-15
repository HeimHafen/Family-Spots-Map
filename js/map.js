/* global L */

// js/map.js

let map = null;
let markerLayer = null;
let onMarkerSelectCallback = null;
const markersById = new Map();

/**
 * Kleiner Helfer zum HTML-Escapen, damit Sonderzeichen in Titeln etc.
 * keine Probleme machen.
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Bestimmt den Text für das Popup.
 *
 * 1. Wenn vorhanden: Poesie-Zeile (poetry)
 * 2. Sonst: Summary in aktueller Sprache (summary_de / summary_en)
 * 3. Sonst: Besuchstipp (visitLabel_*)
 * 4. Sonst: Summary der anderen Sprache
 */
function getSpotPopupSummary(spot) {
  let lang = "de";

  if (typeof document !== "undefined" && document.documentElement) {
    lang = document.documentElement.lang || "de";
  }

  const isEn = lang.toLowerCase().indexOf("en") === 0;

  const poetry = (spot.poetry || "").trim();
  const summaryPrimary = (isEn ? spot.summary_en : spot.summary_de) || "";
  const summarySecondary = (isEn ? spot.summary_de : spot.summary_en) || "";
  const visitLabel = (isEn ? spot.visitLabel_en : spot.visitLabel_de) || "";

  let text = "";

  if (poetry) {
    text = poetry;
  } else if (summaryPrimary) {
    text = summaryPrimary;
  } else if (visitLabel) {
    text = visitLabel;
  } else if (summarySecondary) {
    text = summarySecondary;
  } else {
    text = "";
  }

  const maxLen = 260;
  if (text.length > maxLen) {
    return text.slice(0, maxLen - 1) + "…";
  }
  return text;
}

/**
 * Initialisiert die Leaflet-Karte.
 *
 * @param {Object} options
 * @param {{lat: number, lng: number}} options.center
 * @param {number} options.zoom
 * @param {(spotId: string) => void} [options.onMarkerSelect]
 */
export function initMap(options) {
  const center = options.center;
  const zoom = options.zoom;
  const onMarkerSelect = options.onMarkerSelect;

  onMarkerSelectCallback = onMarkerSelect || null;

  map = L.map("map", {
    center: [center.lat, center.lng],
    zoom: zoom,
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
 * @param {Array<{id: string, name: string, city?: string, location: {lat: number, lng: number}}>} spots
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

  // Sprache für Link-Beschriftungen bestimmen
  let lang = "de";
  if (typeof document !== "undefined" && document.documentElement) {
    lang = document.documentElement.lang || "de";
  }
  const isEn = lang.toLowerCase().indexOf("en") === 0;

  const googleLabel = isEn ? "Directions (Google Maps)" : "Route (Google Maps)";
  const appleLabel = isEn ? "Directions (Apple Maps)" : "Route (Apple Karten)";

  spots.forEach(function (spot) {
    if (!spot.location) return;

    const lat = spot.location.lat;
    const lng = spot.location.lng;
    const marker = L.marker([lat, lng]);

    const summary = getSpotPopupSummary(spot);

    const encodedName = encodeURIComponent(
      (spot.name || "") + (spot.city ? " " + spot.city : ""),
    );

    const googleMapsUrl =
      "https://www.google.com/maps/dir/?api=1&destination=" +
      encodeURIComponent(lat + "," + lng) +
      (encodedName ? "&destination_place_id=&query=" + encodedName : "");

    const appleMapsUrl =
      "https://maps.apple.com/?daddr=" +
      encodeURIComponent(lat + "," + lng);

    // Popup-Inhalt: Name, Stadt, Info-Text + Routen-Links
    const popupHtml =
      '<div class="popup">' +
      "<strong>" +
      escapeHtml(spot.name || "") +
      "</strong>" +
      (spot.city ? "<br>" + escapeHtml(spot.city) : "") +
      (summary ? "<br><small>" + escapeHtml(summary) + "</small>" : "") +
      '<div class="popup-actions">' +
      '<a class="popup-link" href="' +
      googleMapsUrl +
      '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(googleLabel) +
      "</a>" +
      '<a class="popup-link" href="' +
      appleMapsUrl +
      '" target="_blank" rel="noopener noreferrer">' +
      escapeHtml(appleLabel) +
      "</a>" +
      "</div>" +
      "</div>";

    marker.bindPopup(popupHtml);

    // Klick auf den Pin: Popup + Detail-Panel
    marker.on("click", function () {
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
  if (!map || !spot || !spot.location) {
    return;
  }

  const lat = spot.location.lat;
  const lng = spot.location.lng;

  map.setView([lat, lng], 15, {
    animate: true,
  });

  const marker = markersById.get(spot.id);
  if (marker && typeof marker.openPopup === "function") {
    marker.openPopup();
  }
}