/* global L */

import { getLanguage } from "../i18n.js";

let map = null;
let markerLayer = null;
let onMarkerSelectCallback = null;
const markersById = new Map();
let radiusCircle = null;
let currentMarkerRunId = 0;

const spotMarkerIcon = L.divIcon({
  className: "spot-marker",
  html: '<div class="spot-marker-inner"></div>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

function getCurrentLanguage() {
  try {
    const langFromI18n = typeof getLanguage === "function" && getLanguage();
    if (langFromI18n) return langFromI18n;
  } catch {}
  if (document?.documentElement?.lang) return document.documentElement.lang;
  if (navigator?.language) return navigator.language;
  return "de";
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getSpotPopupSummary(spot) {
  const lang = getCurrentLanguage();
  const isEn = lang.toLowerCase().indexOf("en") === 0;

  const poetry = (spot.poetry || "").trim();
  const summaryPrimary = (isEn ? spot.summary_en : spot.summary_de) || "";
  const summarySecondary = (isEn ? spot.summary_de : spot.summary_en) || "";
  const visitLabel = (isEn ? spot.visitLabel_en : spot.visitLabel_de) || "";

  let text = poetry || summaryPrimary || visitLabel || summarySecondary;

  return text.length > 260 ? text.slice(0, 259) + "…" : text;
}

export function initMap(options) {
  const { center, zoom, onMarkerSelect } = options;

  onMarkerSelectCallback = onMarkerSelect || null;

  map = L.map("map", {
    center: [center.lat, center.lng],
    zoom,
    zoomControl: true,
    preferCanvas: false
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap-Mitwirkende",
    updateWhenIdle: true,
    keepBuffer: 2
  }).addTo(map);

  setTimeout(() => map.invalidateSize(), 0);

  map.on("resize", () => map.invalidateSize());
}

export function getMap() {
  return map;
}

function ensureMarkerLayer() {
  if (!map) return null;

  if (!markerLayer) {
    markerLayer = typeof L.markerClusterGroup === "function"
      ? L.markerClusterGroup({
          showCoverageOnHover: false,
          removeOutsideVisibleBounds: true,
          spiderfyOnEveryZoom: false,
          spiderfyOnMaxZoom: true,
          spiderLegPolylineOptions: { weight: 0, opacity: 0 },
          maxClusterRadius: 60,
          chunkedLoading: true
        })
      : L.layerGroup();

    markerLayer.addTo(map);
  }

  return markerLayer;
}

export function setSpotsOnMap(spots) {
  if (!map) return;

  const layer = ensureMarkerLayer();
  if (!layer) return;

  const runId = ++currentMarkerRunId;
  layer.clearLayers();
  markersById.clear();

  const lang = getCurrentLanguage();
  const isEn = lang.toLowerCase().indexOf("en") === 0;
  const googleLabel = isEn ? "Route (Google Maps)" : "Route (Google Maps)";
  const appleLabel = isEn ? "Route (Apple Maps)" : "Route (Apple Karten)";

  const markerQueue = [];

  (spots || []).forEach((spot) => {
    if (!spot?.location) return;

    const { lat, lng } = spot.location;
    if (lat == null || lng == null) return;

    const marker = L.marker([lat, lng], { icon: spotMarkerIcon });
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

    const popupHtml = `
      <div class="popup">
        <strong>${escapeHtml(spot.name || spot.title || "")}</strong>
        ${spot.city ? "<br>" + escapeHtml(spot.city) : ""}
        ${summary ? "<br><small>" + escapeHtml(summary) + "</small>" : ""}
        <div class="popup-actions">
          <a class="popup-link" href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(googleLabel)}</a>
          <a class="popup-link" href="${appleMapsUrl}" target="_blank" rel="noopener noreferrer">${escapeHtml(appleLabel)}</a>
        </div>
      </div>`;

    marker.bindPopup(popupHtml);

    marker.on("click", () => {
      if (onMarkerSelectCallback) onMarkerSelectCallback(spot.id);
    });

    marker.on("add", () => {
      const el = marker.getElement();
      if (!el || el.classList.contains("marker-cluster")) return;
      el.classList.add("pin-pop");
      setTimeout(() => el.classList.remove("pin-pop"), 260);
    });

    markerQueue.push({ spot, marker });
  });

  let delay = 0;
  const step = 18;

  markerQueue.forEach(({ spot, marker }) => {
    setTimeout(() => {
      if (runId !== currentMarkerRunId) return;
      layer.addLayer(marker);
      markersById.set(spot.id, marker);
    }, delay);
    delay += step;
  });
}

export function focusOnSpot(spot) {
  if (!map || !spot?.location) return;

  const { lat, lng } = spot.location;
  if (lat == null || lng == null) return;

  map.setView([lat, lng], 15, { animate: true });

  const marker = markersById.get(spot.id);
  if (marker?.openPopup) marker.openPopup();
}

export function updateRadiusCircle(origin, radiusKm) {
  if (!map) return;

  if (radiusCircle) {
    map.removeLayer(radiusCircle);
    radiusCircle = null;
  }

  if (!origin || !radiusKm || radiusKm <= 0) return;

  radiusCircle = L.circle([origin.lat, origin.lng], {
    radius: radiusKm * 1000,
    className: "radius-circle"
  });

  radiusCircle.addTo(map);
}
