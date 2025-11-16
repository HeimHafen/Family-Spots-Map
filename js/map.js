/* global L */

// js/map.js

let map = null;
let markerLayer = null;
let onMarkerSelectCallback = null;
const markersById = new Map();
let radiusCircle = null;

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
    preferCanvas: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap-Mitwirkende",
    updateWhenIdle: true,
    keepBuffer: 2,
  }).addTo(map);

  // Direkt nach dem Init sicherstellen, dass Leaflet die Containergröße kennt
  setTimeout(() => {
    map.invalidateSize();
  }, 0);

  map.on("resize", () => {
    map.invalidateSize();
  });
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
      markerLayer = L.markerClusterGroup({
        chunkedLoading: true,
        showCoverageOnHover: false,
        removeOutsideVisibleBounds: true,
        spiderfyOnEveryZoom: true,
        animate: true,
        animateAddingMarkers: true,
        maxClusterRadius: 60,
      });
    } else {
      markerLayer = L.layerGroup();
    }

    markerLayer.addTo(map);
  }

  return markerLayer;
}

/**
 * Zeichnet alle Spots auf die Karte.
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

  const googleLabel = isEn ? "Route (Google Maps)" : "Route (Google Maps)";
  const appleLabel = isEn ? "Route (Apple Maps)" : "Route (Apple Karten)";

  const markerObjs = [];

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
      "https://maps.apple.com/?daddr=" + encodeURIComponent(lat + "," + lng);

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

    // Marker-Pop-Animation, wenn der Marker zur Karte hinzugefügt wird
    marker.on("add", () => {
      const el = marker.getElement();
      if (!el) return;
      el.classList.add("pin-pop");
      setTimeout(() => {
        if (el) el.classList.remove("pin-pop");
      }, 260);
    });

    marker.on("click", function () {
      if (onMarkerSelectCallback) {
        onMarkerSelectCallback(spot.id);
      }
    });

    markersById.set(spot.id, marker);
    markerObjs.push(marker);
  });

  // Marker in kleinen Batches hinzufügen, damit sie "nacheinander" auftauchen
  const BATCH_SIZE = 20;
  let index = 0;

  function addNextBatch() {
    const end = Math.min(index + BATCH_SIZE, markerObjs.length);
    for (let i = index; i < end; i++) {
      layer.addLayer(markerObjs[i]);
    }
    index = end;
    if (index < markerObjs.length) {
      setTimeout(addNextBatch, 30);
    }
  }

  addNextBatch();
}

/**
 * Zentriert die Karte auf einen Spot.
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

/**
 * Aktualisiert/zeichnet den Radius-Kreis für den Micro-Abenteuer-Radius.
 */
export function updateRadiusCircle(origin, radiusKm) {
  if (!map) return;

  if (radiusCircle) {
    map.removeLayer(radiusCircle);
    radiusCircle = null;
  }

  if (!origin || !radiusKm || radiusKm <= 0) {
    return;
  }

  radiusCircle = L.circle([origin.lat, origin.lng], {
    radius: radiusKm * 1000,
    className: "radius-circle",
  });

  radiusCircle.addTo(map);
}
