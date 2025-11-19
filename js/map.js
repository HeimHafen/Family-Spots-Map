/* global L */

import { getLanguage } from "./i18n.js";

let map = null;
let markerLayer = null;
let onMarkerSelectCallback = null;
const markersById = new Map();
let radiusCircle = null;
let currentMarkerRunId = 0;

/**
 * Einheitliches Marker-Icon (orange Punkt, der zur CSS passt)
 * Wichtig: html mit innerem Kreis, sonst sieht man im Cluster-Spiderfy nur die Linien.
 */
const spotMarkerIcon = L.divIcon({
  className: "spot-marker",
  html: '<div class="spot-marker-inner"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

/**
 * Sichere Sprach-Ermittlung ("de" / "en"), robust gegen Fehler.
 */
function getCurrentLanguage() {
  try {
    const langFromI18n = typeof getLanguage === "function" && getLanguage();
    if (langFromI18n) return langFromI18n;
  } catch {
    // Fallbacks weiter unten
  }

  if (typeof document !== "undefined" && document.documentElement) {
    const htmlLang = document.documentElement.lang;
    if (htmlLang) return htmlLang;
  }

  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }

  return "de";
}

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
 * Bestimmt den Text für das Popup (kurze Zusammenfassung / Poetry).
 */
function getSpotPopupSummary(spot) {
  const lang = getCurrentLanguage();
  const isEn = lang.toLowerCase().indexOf("en") === 0;

  const poetry = (spot.poetry || "").trim();
  const summaryPrimary = (isEn ? spot.summary_en : spot.summary_de) || "";
  const summarySecondary = (isEn ? spot.summary_de : spot.summary_en) || "";
  const visitLabel =
    (isEn ? spot.visitLabel_en || spot.visit_label_en
          : spot.visitLabel_de || spot.visit_label_de) || "";

  let text = "";

  if (poetry) {
    text = poetry;
  } else if (summaryPrimary) {
    text = summaryPrimary;
  } else if (visitLabel) {
    text = visitLabel;
  } else if (summarySecondary) {
    text = summarySecondary;
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
  const { center, zoom, onMarkerSelect } = options;

  onMarkerSelectCallback = typeof onMarkerSelect === "function"
    ? onMarkerSelect
    : null;

  map = L.map("map", {
    center: [center.lat, center.lng],
    zoom,
    zoomControl: true
    // preferCanvas NICHT aktivieren – MarkerCluster + DOM-Icons funktionieren hier gut
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap-Mitwirkende",
    updateWhenIdle: true,
    keepBuffer: 2
  }).addTo(map);

  // Workaround: direkt nach Init einmal invalidateSize,
  // damit die Karte auch in flex-Layouts korrekt berechnet.
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

/**
 * Sorgt dafür, dass eine Marker-LayerGroup (oder Cluster-Gruppe) existiert.
 */
function ensureMarkerLayer() {
  if (!map) return null;

  if (!markerLayer) {
    // Cluster-Gruppe, falls Plugin geladen ist
    if (typeof L.markerClusterGroup === "function") {
      markerLayer = L.markerClusterGroup({
        showCoverageOnHover: false,
        removeOutsideVisibleBounds: true,
        spiderfyOnEveryZoom: true,
        maxClusterRadius: 60
        // zoomToBoundsOnClick: Standard (true) lassen:
        // Klick auf Cluster zoomt erst rein, bei max Zoom spiderfy.
      });
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
 * Erwartet Spots mit:
 *  - id: string
 *  - name/title: string
 *  - city?: string
 *  - location: { lat: number, lng: number }
 */
export function setSpotsOnMap(spots) {
  if (!map) return;

  const layer = ensureMarkerLayer();
  if (!layer) return;

  // neuen Lauf markieren, damit alte Timeouts ignoriert werden
  const runId = ++currentMarkerRunId;

  layer.clearLayers();
  markersById.clear();

  const lang = getCurrentLanguage();
  const isEn = lang.toLowerCase().indexOf("en") === 0;

  const googleLabel = isEn ? "Route (Google Maps)" : "Route (Google Maps)";
  const appleLabel = isEn ? "Route (Apple Maps)" : "Route (Apple Karten)";

  const markers = [];

  (spots || []).forEach((spot) => {
    if (!spot || !spot.location) return;

    const { lat, lng } = spot.location;
    if (lat == null || lng == null) return;

    const marker = L.marker([lat, lng], {
      icon: spotMarkerIcon,
      // eigene ID merken (hilft, falls wir später Cluster-Events brauchen)
      spotId: spot.id
    });

    const summary = getSpotPopupSummary(spot);

    const encodedName = encodeURIComponent(
      (spot.name || spot.title || "") + (spot.city ? " " + spot.city : "")
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
      escapeHtml(spot.name || spot.title || "") +
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

    // Klick auf den Pin: Popup + Detail-Panel in der Sidebar
    marker.on("click", function () {
      if (onMarkerSelectCallback) {
        onMarkerSelectCallback(spot.id);
      }
    });

    // Pin-Pop-Animation, sobald der Marker im DOM ist
    marker.on("add", () => {
      const el = marker.getElement();
      if (!el) return;
      // Cluster-Icons nicht animieren
      if (el.classList.contains("marker-cluster")) return;
      el.classList.add("pin-pop");
      setTimeout(() => el.classList.remove("pin-pop"), 260);
    });

    markers.push({ spot, marker });
  });

  // Marker schubweise hinzufügen (sanftes „Aufpoppen“)
  let delay = 0;
  const step = 18; // ms zwischen den Pins

  markers.forEach(({ spot, marker }) => {
    setTimeout(() => {
      if (runId !== currentMarkerRunId) return; // veralteter Lauf – ignorieren
      layer.addLayer(marker);
      markersById.set(spot.id, marker);
    }, delay);
    delay += step;
  });
}

/**
 * Zentriert die Karte auf einen Spot und öffnet ggf. das Popup.
 *
 * @param {{id: string, location?: {lat: number, lng: number}}} spot
 */
export function focusOnSpot(spot) {
  if (!map || !spot || !spot.location) return;

  const { lat, lng } = spot.location;
  if (lat == null || lng == null) return;

  map.setView([lat, lng], 15, {
    animate: true
  });

  const marker = markersById.get(spot.id);
  if (marker && typeof marker.openPopup === "function") {
    marker.openPopup();
  }
}

/**
 * Aktualisiert/zeichnet den Radius-Kreis für den Micro-Abenteuer-Radius.
 *
 * @param {{lat: number, lng: number} | null} origin
 * @param {number | null} radiusKm
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
    className: "radius-circle"
  });

  radiusCircle.addTo(map);
}