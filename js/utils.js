// js/utils.js

export const $ = (selector, root = document) => root.querySelector(selector);

export const $$ = (selector, root = document) =>
  Array.from(root.querySelectorAll(selector));

export function debounce(fn, delay = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
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