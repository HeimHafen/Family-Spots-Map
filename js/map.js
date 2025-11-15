/* global L */

// js/map.js

let map = null;
let markerLayer = null;
let onMarkerSelectCallback = null;
const markersById = new Map();

/**
 * Bestimmt den Text für das Popup:
 * 1. passende summary_* (DE/EN), wenn sie "gut" ist
 * 2. sonst Besuchstipp (visitLabel_*)
 * 3. sonst Summary der anderen Sprache
 * 4. sonst Poesie
 */
function getSpotPopupSummary(spot) {
  let lang = "de";

  if (typeof document !== "undefined" && document.documentElement) {
    lang = document.documentElement.lang || "de";
  }

  const isEn = lang.toLowerCase().indexOf("en") === 0;

  const poetry = spot.poetry || "";

  const summaryPrimary = isEn
    ? spot.summary_en || ""
    : spot.summary_de || "";

  const summarySecondary = isEn
    ? spot.summary_de || ""
    : spot.summary_en || "";

  const visitLabel = isEn
    ? spot.visitLabel_en || ""
    : spot.visitLabel_de || "";

  function isUsefulSummary(str) {
    if (!str) return false;

    // Wenn Summary exakt die Poesie-Zeile ist → für Popup nicht so spannend
    if (poetry && str === poetry) return false;

    // Wenn sehr kurz und es einen deutlich längeren Besuchstipp gibt,
    // nehmen wir lieber den Besuchstipp
    if (str.length < 80 && visitLabel && visitLabel.length > str.length + 40) {
      return false;
    }

    return true;
  }

  let text = "";

  if (isUsefulSummary(summaryPrimary)) {
    text = summaryPrimary;
  } else if (visitLabel) {
    text = visitLabel;
  } else if (summarySecondary) {
    text = summarySecondary;
  } else if (poetry) {
    text = poetry;
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

  spots.forEach(function (spot) {
    if (!spot.location) return;

    const lat = spot.location.lat;
    const lng = spot.location.lng;
    const marker = L.marker([lat, lng]);

    const summary = getSpotPopupSummary(spot);

    // Popup-Inhalt: Name, Stadt, Info-Text
    const popupHtml =
      '<div>' +
      "<strong>" +
      spot.name +
      "</strong>" +
      (spot.city ? "<br>" + spot.city : "") +
      (summary ? "<br><small>" + summary + "</small>" : "") +
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