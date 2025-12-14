// service-worker.js

const CACHE_VERSION = "15";
const CACHE_NAME = `family-spots-map-${CACHE_VERSION}`;
const OFFLINE_URL = "offline.html";

// OPTIONAL: Wenn du components/theme nutzt, ergänzen:
// "css/components.css",
// "css/theme.css",

const ASSETS = [
  "./",
  "index.html",
  OFFLINE_URL,
  "css/styles.css",6
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
  "assets/icons/icon-512.png",
];

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

// 📦 Install: Pre-cache App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // addAll bricht beim ersten Fehler ab -> wir machen “best effort”
      await Promise.allSettled(
        ASSETS.map((asset) => cache.add(asset))
      );

      // Stelle sicher, dass offline.html wirklich drin ist
      await cache.add(OFFLINE_URL).catch(() => {});
    })()
  );

  self.skipWaiting();
});

// 🔄 Activate: Clean up old caches + enable navigation preload
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));

      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
    })()
  );
});

// Optional: per postMessage sofort aktivieren
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// 🌐 Fetch handler
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const request = event.request;
  const url = new URL(request.url);

  // Nur gleiche Origin cachen
  if (!isSameOrigin(url)) return;

  // 🧭 Navigation → network first + offline fallback (+ preload)
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preload = await event.preloadResponse;
          if (preload) return preload;

          const res = await fetch(request);
          return res;
        } catch {
          const cachedOffline = await caches.match(OFFLINE_URL);
          return (
            cachedOffline ||
            new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } })
          );
        }
      })()
    );
    return;
  }

  // 🔄 JSON: network first (mit Fallback)
  if (url.pathname.endsWith(".json")) {
    event.respondWith(
      (async () => {
        try {
          // optional: Timeout, damit es sich offline nicht “aufhängt”
          const res = await withTimeout(fetch(request), 3500);

          if (res && res.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, res.clone());
          }
          return res;
        } catch {
          const cached = await caches.match(request);
          return (
            cached ||
            new Response("Offline / JSON not cached", {
              status: 503,
              headers: { "Content-Type": "text/plain" },
            })
          );
        }
      })()
    );
    return;
  }

  // 📁 Andere Assets: stale-while-revalidate (Cache first + Update im Hintergrund)
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);

      const updatePromise = (async () => {
        try {
          const res = await fetch(request);
          if (res && res.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, res.clone());
          }
        } catch {
          // ignore
        }
      })();

      // wichtig: Update darf im Hintergrund fertig laufen
      event.waitUntil(updatePromise);

      // niemals null zurückgeben
      if (cached) return cached;

      // wenn nichts im Cache: versuch network, sonst fallback response
      try {
        const res = await fetch(request);
        if (res && res.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, res.clone());
        }
        return res;
      } catch {
        return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
      }
    })()
  );
});