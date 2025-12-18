// service-worker.js

const CACHE_VERSION = "6";
const CACHE_NAME = `family-spots-map-${CACHE_VERSION}`;
const OFFLINE_URL = "offline.html";

/**
 * Wichtig:
 * - KEINE Tippfehler/losen Zeichen in ASSETS (sonst installiert SW nicht)
 * - CSS/JS behandeln wir "network-first", damit Updates sofort sichtbar werden
 */
const ASSETS = [
  "./",
  "index.html",
  OFFLINE_URL,

  // CSS (Aggregator + imports)
  "css/styles.css",
  "css/theme.css",
  "css/base.css",
  "css/utilities.css",
  "css/components.css",
  "css/badges.css",
  "css/tilla.css",

  // JS
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
  "js/onboarding-hint.js",
  "js/ui/details-summary-fix.js",

  // Data
  "data/index.json",
  "data/spots.json",
  "data/i18n/de.json",
  "data/i18n/en.json",
  "data/i18n/da.json",
  "data/partners.json",
  "data/partner-codes.json",

  // Assets
  "assets/logo.svg",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/tilla/tilla-hero.png",
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

// 📦 Install: Pre-cache App Shell (best effort)
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // "cache: reload" -> um HTTP-Caches zu umgehen, wenn möglich
      await Promise.allSettled(
        ASSETS.map((asset) => {
          const req = new Request(asset, { cache: "reload" });
          return cache.add(req);
        })
      );

      // Stelle sicher, dass offline.html wirklich drin ist
      await cache.add(new Request(OFFLINE_URL, { cache: "reload" })).catch(() => {});
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

  // ✅ CSS/JS: NETWORK FIRST (damit Updates sofort greifen), Cache-Fallback
  if (url.pathname.endsWith(".css") || url.pathname.endsWith(".js")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const res = await withTimeout(fetch(request), 3500);
          if (res && res.ok) {
            await cache.put(request, res.clone());
          }
          return res;
        } catch {
          const cached = await caches.match(request);
          return (
            cached ||
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

  // 📁 Andere Assets: stale-while-revalidate
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

      event.waitUntil(updatePromise);

      if (cached) return cached;

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