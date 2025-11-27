// modules/utils.js

export const $ = (selector, root = document) => root.querySelector(selector);

export const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));

export function debounce(fn, delay = 250) {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

export function formatVisitMinutes(minutes, lang = "de") {
  if (!minutes || typeof minutes !== "number") return "";
  if (minutes < 60) {
    return lang === "de" ? `${minutes} Min` : `${minutes} min`;
  }
  const hours = Math.round(minutes / 60);
  if (lang === "de") {
    return hours === 1 ? "ca. 1 Std" : `ca. ${hours} Std`;
  }
  return hours === 1 ? "approx. 1 h" : `approx. ${hours} h`;
}

export function getGeolocation(options = { enableHighAccuracy: true, timeout: 10000 }) {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("geolocation_unavailable"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => reject(err),
      options
    );
  });
}

export function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')      // Leerzeichen → -
    .replace(/[^\w\-]+/g, '')  // Sonderzeichen entfernen
    .replace(/\-\-+/g, '-');   // Mehrere - zu einem -
}

export function distanceInKm(pos1, pos2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(pos2.lat - pos1.lat);
  const dLng = toRad(pos2.lng - pos1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(pos1.lat)) *
    Math.cos(toRad(pos2.lat)) *
    Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function normalizeSpot(raw) {
  const lat = parseFloat(raw.lat);
  const lng = parseFloat(raw.lng);
  return {
    ...raw,
    lat: isNaN(lat) ? 0 : lat,
    lng: isNaN(lng) ? 0 : lng,
    tags: raw.tags || [],
    type: raw.type || 'unknown',
  };
}

export function getMetaInfoForSpot(spot) {
  return [
    spot.category || 'Unbekannt',
    spot.duration ? `~${spot.duration} Min.` : null,
    spot.tags?.join(', ') || null,
  ]
    .filter(Boolean)
    .join(' · ');
}