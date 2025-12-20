// service-worker.js

/**
 * Fix: CSS/JS-Updates kommen "sofort" an (network-first),
 * während Offline weiterhin funktioniert (Fallback auf Cache).
 *
 * WICHTIG:
 * - CACHE_VERSION bei Deploys hochzählen (mindestens wenn CSS/JS geändert wurden),
 *   damit iOS/PWA sicher ein Update zieht.
 */

const CACHE_VERSION = "14";
const CACHE_NAME = `family-spots-map-${CACHE_VERSION}`;
const OFFLINE_URL = "offline.html";

const ASSETS = [
  "./",
  "index.html",
  OFFLINE_URL,

  // CSS (Aggregator + Imports)
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

  // Module-Skripte, die in index.html geladen werden
  "js/onboarding-hint.js",
  "js/ui/details-summary-fix.js",

  // Data
  "data/index.json",
  "data/spots.json",
  "data/i18n/de.json",
  "data/i18n/en.json",
  "data/partners.json",
  "data/partner-codes.json",

  // Assets
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

/**
 * Fetch helper: erzwingt Netz-Request ohne HTTP-Cache,
 * damit Updates (gerade CSS) nicht "kleben".
 */
function fetchNoStore(request) {
  return fetch(request, { cache: "no-store" });
}

/**
 * Install: Pre-cache App Shell (mit cache: "reload" um HTTP-Caches zu umgehen)
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Best effort: nicht beim ersten Fehler abbrechen
      await Promise.allSettled(
        ASSETS.map((asset) => cache.add(new Request(asset, { cache: "reload" })))
      );

      // Stelle sicher, dass offline.html wirklich drin ist
      await cache.add(new Request(OFFLINE_URL, { cache: "reload" })).catch(() => {});
    })()
  );

  self.skipWaiting();
});

/**
 * Activate: alte Caches löschen + navigation preload
 */
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

/**
 * Fetch handler
 */
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

          // Für HTML bewusst normal fetch (no-store kann hier Side-Effects haben)
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

  /**
   * 🔥 WICHTIGER FIX:
   * CSS & JS (und auch "document"-ähnliche Module) online network-first,
   * damit Änderungen sofort sichtbar werden.
   */
  const isCSS = request.destination === "style" || url.pathname.endsWith(".css");
  const isJS = request.destination === "script" || url.pathname.endsWith(".js");

  if (isCSS || isJS) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        try {
          const res = await withTimeout(fetchNoStore(request), 4500);
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

  // 🔄 JSON: network first (mit Fallback) + no-store gegen klebenden HTTP-Cache
  if (url.pathname.endsWith(".json")) {
    event.respondWith(
      (async () => {
        try {
          const res = await withTimeout(fetchNoStore(request), 3500);

          if (res && res.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, res.clone());
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

  // 📁 Andere Assets: stale-while-revalidate (ok für Images, Icons, etc.)
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);

      const updatePromise = (async () => {
        try {
          const res = await fetchNoStore(request);
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
        const res = await fetchNoStore(request);
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