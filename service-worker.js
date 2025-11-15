// service-worker.js

// Version des Caches – bei Änderungen an Assets INKREMENTIEREN
const CACHE_NAME = "family-spots-map-65";
const OFFLINE_URL = "offline.html";

const ASSETS = [
  "./",
  "index.html",
  OFFLINE_URL,
  "css/styles.css",
  "css/badges.css",
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
  "assets/logo.svg",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
];

// INSTALL: App-Shell & Daten cachen
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(ASSETS);
    })(),
  );
  self.skipWaiting();
});

// ACTIVATE: Alte Caches aufräumen
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
    })(),
  );
  self.clients.claim();
});

// FETCH: Cache-first mit Offline-Fallback für Navigation
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  // Nur gleiche Origin abfangen (GitHub Pages etc.)
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    (async () => {
      // 1. Versuche Cache
      const cached = await caches.match(event.request);
      if (cached) {
        return cached;
      }

      // 2. Versuch Netz
      try {
        const response = await fetch(event.request);
        return response;
      } catch (err) {
        // 3. Offline-Fallback
        if (event.request.mode === "navigate") {
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) return offlinePage;
        }

        // Für Nicht-Navigations-Requests im Offline-Fall
        return new Response("", {
          status: 503,
          statusText: "Offline",
        });
      }
    })(),
  );
});