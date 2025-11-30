// service-worker.js

const CACHE_VERSION = "8";
const CACHE_NAME = `family-spots-map-${CACHE_VERSION}`;
const OFFLINE_URL = "offline.html";

const ASSETS = [
  "./",
  "index.html",
  OFFLINE_URL,
  "css/styles.css",
  "css/badges.css",
  "css/tilla.css",
  "js/app.js",
  "js/utils.js",
  "js/storage.js",
  "js/i18n.js",
  "js/data.js",
  "js/filters.js",
  "js/map.js",
  "js/ui.js",
  "js/sw-register.js",
  "js/header-tagline.js",
  "js/nav.js",
  "data/index.json",
  "data/spots.json",
  "data/i18n/de.json",
  "data/i18n/en.json",
  "data/partners.json",
  "data/partner-codes.json",
  "assets/logo.svg",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png"
];

// Installation – App Shell cachen
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        ASSETS.map((asset) =>
          cache.add(asset).catch((err) =>
            console.warn("[SW] Asset konnte nicht geladen werden:", asset)
          )
        )
      )
    )
  );
  self.skipWaiting();
});

// Aktivierung – alte Caches löschen
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch-Strategien: JSON = network-first / Rest = cache-first mit SWR
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const { request } = event;
  const url = new URL(request.url);

  // Nur gleiche Origin
  if (url.origin !== location.origin) return;

  // JSON: Network First
  if (url.pathname.endsWith(".json")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Navigations-Request → offline.html als Fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Andere Assets: Cache First + Background Update
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchAndUpdate = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone());
            });
          }
          return response;
        })
        .catch(() => null); // Silently fail

      return cached || fetchAndUpdate;
    })
  );
});