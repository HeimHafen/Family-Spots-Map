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
 * Liefert einen sinnvollen a11y-Label-Text für Marker (ohne externe Imports).
 */
function getSpotA11yLabel(spot) {
  return String(
    spot?.title ||
      spot?.name ||
      spot?.spotName ||
      (spot?.id != null ? spot.id : "Spot")
  );
}

/**
 * Macht einen Marker per Tastatur erreichbar und bindet Click/Keyboard-Action.
 * - setzt tabindex, role, aria-label sobald das DOM-Element existiert
 * - Enter/Space triggert focusSpotOnMap(spot)
 */
function makeMarkerAccessible(marker, spot, focusSpotOnMap) {
  // Click bleibt auf Leaflet-Ebene (funktioniert mit Cluster/LayerGroup sauber)
  if (typeof focusSpotOnMap === "function") {
    marker.on("click", () => focusSpotOnMap(spot));
  }

  marker.on("add", () => {
    const el = marker.getElement?.();
    if (!el) return;

    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", getSpotA11yLabel(spot));

    // Keydown direkt am DOM-Element (robuster als Leaflet-"keypress")
    if (typeof focusSpotOnMap === "function") {
      const onKeyDown = (e) => {
        const key = e?.key;
        if (key === "Enter" || key === " " || key === "Space" || key === "Spacebar") {
          // Space würde sonst bei vielen Browsern scrollen
          e.preventDefault?.();
          focusSpotOnMap(spot);
        }
      };

      // Handler merken, damit wir ihn beim Entfernen wieder lösen können
      marker._a11yKeyDownHandler = onKeyDown;
      el.addEventListener("keydown", onKeyDown);
    }
  });

  marker.on("remove", () => {
    const el = marker.getElement?.();
    const h = marker._a11yKeyDownHandler;
    if (el && h) {
      el.removeEventListener("keydown", h);
    }
    marker._a11yKeyDownHandler = null;
  });
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
 * - maxMarkers dient nur noch als Schwellenwert für einen Hinweis-Toast,
 *   es werden aber trotzdem alle Spots gerendert
 * - ruft bei Klick/Enter/Space focusSpotOnMap(spot) auf
 * - gibt zurück, ob der Marker-Limit-Toast bereits gezeigt wurde
 */
export function renderMarkers({
  map,
  markersLayer,
  spots,
  maxMarkers,
  currentLang, // aktuell nur für evtl. spätere Toast-Texte
  showToast,
  hasShownMarkerLimitToast,
  focusSpotOnMap
}) {
  if (!map || !markersLayer) return hasShownMarkerLimitToast;

  markersLayer.clearLayers();

  if (!Array.isArray(spots) || spots.length === 0) {
    return hasShownMarkerLimitToast;
  }

  // NEU: wir begrenzen die Liste nicht mehr hart, sondern nutzen maxMarkers
  // nur als Schwellwert für einen Hinweis.
  const list = spots;
  const tooManyMarkers =
    maxMarkers && Number.isFinite(maxMarkers) && spots.length > maxMarkers;

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

    // NEU: a11y + Interaktion kapseln
    makeMarkerAccessible(marker, spot, focusSpotOnMap);

    markersLayer.addLayer(marker);
  });

  // Hinweis-Toast, wenn sehr viele Marker gerendert werden
  if (
    tooManyMarkers &&
    !hasShownMarkerLimitToast &&
    typeof showToast === "function"
  ) {
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