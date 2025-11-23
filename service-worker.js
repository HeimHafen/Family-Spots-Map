// service-worker.js

// Version des Caches – bei Änderungen an Assets INKREMENTIEREN
const CACHE_NAME = "family-spots-map-51";
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

// INSTALL: App-Shell & Daten cachen (robust, auch wenn einzelne Assets fehlen)
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await Promise.all(
        ASSETS.map(async (asset) => {
          try {
            await cache.add(asset);
          } catch (err) {
            // Falls ein Asset fehlt, verhindern wir trotzdem nicht die Installation.
            console.warn("[SW] Asset konnte nicht gecacht werden:", asset, err);
          }
        })
      );
    })()
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
          .map((key) => caches.delete(key))
      );
    })()
  );
  self.clients.claim();
});

// FETCH: JSON (Daten) network-first, Rest cache-first mit Offline-Fallback
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);

  // Nur gleiche Origin abfangen (GitHub Pages etc.)
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    (async () => {
      const isJsonRequest = requestUrl.pathname.endsWith(".json");

      // Daten (index.json, spots.json, i18n etc.): network-first
      if (isJsonRequest) {
        try {
          const networkResponse = await fetch(event.request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        } catch (err) {
          console.warn("[SW] JSON-Fetch fehlgeschlagen, versuche Cache:", err);
          const cachedJson = await caches.match(event.request);
          if (cachedJson) {
            return cachedJson;
          }

          return new Response("", {
            status: 503,
            statusText: "Offline"
          });
        }
      }

      // Alle anderen Requests: cache-first
      const cached = await caches.match(event.request);
      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(event.request);
        return response;
      } catch (err) {
        // Offline-Fallback für Navigation
        if (event.request.mode === "navigate") {
          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) return offlinePage;
        }

        // Für Nicht-Navigations-Requests im Offline-Fall
        return new Response("", {
          status: 503,
          statusText: "Offline"
        });
      }
    })()
  );
});