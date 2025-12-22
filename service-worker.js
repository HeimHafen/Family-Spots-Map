// service-worker.js

const CACHE_VERSION = "41"; // <— IMPORTANT: bump on any release
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

function isJSON(url) {
  return url.pathname.endsWith(".json");
}

function isStaticAsset(url) {
  return (
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".ttf") ||
    url.pathname.endsWith(".otf")
  );
}

// 📦 Install: Pre-cache App Shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // addAll bricht beim ersten Fehler ab -> best effort
      await Promise.allSettled(ASSETS.map((asset) => cache.add(asset)));

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

          // Always try network for HTML
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

  // 🔄 JSON: network first (mit Fallback) — force fresh to avoid 304 traps
  if (isJSON(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
          const res = await withTimeout(fetch(request, { cache: "no-store" }), 3500);

          if (res && res.status === 200) {
            await cache.put(request, res.clone());
          }

          // If server ever returns 304 here, fall back to cache
          if (res && res.status === 304) {
            const cached = await cache.match(request);
            if (cached) return cached;
          }

          return res;
        } catch {
          const cached = await cache.match(request);
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

  // 📁 Static assets (CSS/JS/Images/Fonts): cache-first + background refresh (no-store)
  if (isStaticAsset(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);

        const updatePromise = (async () => {
          try {
            const res = await fetch(request, { cache: "no-store" });
            if (res && res.status === 200) {
              await cache.put(request, res.clone());
            }
          } catch {
            // ignore
          }
        })();

        event.waitUntil(updatePromise);

        if (cached) return cached;

        try {
          const res = await fetch(request, { cache: "no-store" });
          if (res && res.status === 200) {
            await cache.put(request, res.clone());
          }
          return res;
        } catch {
          return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
        }
      })()
    );
    return;
  }

  // 📁 Andere Requests: stale-while-revalidate (best effort)
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);

      const updatePromise = (async () => {
        try {
          const res = await fetch(request, { cache: "no-store" });
          if (res && res.status === 200) {
            await cache.put(request, res.clone());
          }
        } catch {
          // ignore
        }
      })();

      event.waitUntil(updatePromise);

      if (cached) return cached;

      try {
        const res = await fetch(request, { cache: "no-store" });
        if (res && res.status === 200) {
          await cache.put(request, res.clone());
        }
        return res;
      } catch {
        return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
      }
    })()
  );
});