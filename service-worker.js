// Family Spots Map: vollständige Offline-Grundfunktion, ohne Kartenkachel-Downloads.
const CACHE_VERSION = "20261009-offline-1";
const CACHE_PREFIX = "family-spots-map-";
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const ROOT = new URL("./", self.location.href);
const ASSETS = [
  "js/app.js",
  "js/config.js",
  "js/data.js",
  "js/data/dataLoader.js",
  "js/features/plus.js",
  "js/features/tilla.js",
  "js/filters.js",
  "js/filters/apply.js",
  "js/filters/index.js",
  "js/filters/logic.js",
  "js/filters/normalize.js",
  "js/filters/tags.js",
  "js/i18n.js",
  "js/map.js",
  "js/router.js",
  "js/storage.js",
  "js/sw-register.js",
  "js/theme.js",
  "js/toast.js",
  "js/ui/details-summary-fix.js",
  "js/ui/language.js",
  "js/ui/menu.js",
  "js/ui/skip-to-spots.js",
  "js/utils/dom.js",
  "./",
  "index.html",
  "offline.html",
  "manifest.webmanifest",
  "css/styles.css",
  "css/theme.css",
  "css/base.css",
  "css/utilities.css",
  "css/components.css",
  "css/badges.css",
  "vendor/leaflet/leaflet.css",
  "vendor/leaflet/leaflet.js",
  "vendor/markercluster/MarkerCluster.Default.css",
  "vendor/markercluster/MarkerCluster.css",
  "vendor/markercluster/leaflet.markercluster.js",
  "assets/flags/flag-de.svg",
  "assets/flags/flag-gb.svg",
  "assets/flags/flag-dk.svg",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/apple-touch-icon.png",
  "assets/tilla/tilla-hero.png",
  "data/spots.json",
  "data/i18n/de.json",
  "data/i18n/en.json",
  "data/i18n/da.json",
  "data/play-ideas.json"
];
const REQUIRED = new Set(ASSETS.map(path => new URL(path, ROOT).href));
function cacheKey(value) {
  const url = new URL(typeof value === "string" ? value : value.url, ROOT);
  url.search = "";
  url.hash = "";
  return url.href;
}
async function fetchFresh(request, timeout = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try { return await fetch(request, {cache: "no-store", signal: controller.signal}); }
  finally { clearTimeout(timer); }
}
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      // A release is only installed if every necessary file was stored successfully.
      for (let i = 0; i < ASSETS.length; i += 8) {
        await Promise.all(ASSETS.slice(i, i + 8).map(async path => {
          const url = new URL(path, ROOT).href;
          const response = await fetchFresh(url, 20000);
          if (!response.ok) throw new Error(`Offline asset unavailable: ${path}`);
          await cache.put(url, response);
        }));
      }
    } catch (error) { await caches.delete(CACHE_NAME); throw error; }
    // Updates wait for explicit activation; first installation activates normally.
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // External links and the OSM tile server are never cached by this worker.
  if (url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  const key = cacheKey(request);
  if (request.mode === "navigate") {
    const isApp = url.pathname === ROOT.pathname || url.pathname === new URL("index.html", ROOT).pathname;
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      if (isApp) {
        const shell = await cache.match(new URL("index.html", ROOT).href);
        if (shell) return shell;
      }
      try { const response = await fetchFresh(request); if (response.ok) return response; }
      catch { /* use offline page below */ }
      return await cache.match(new URL("offline.html", ROOT).href) || new Response("Offline", {status:503});
    })());
    return;
  }
  const isData = url.pathname.endsWith(".json") && (REQUIRED.has(key) || url.pathname === new URL("data/partners.json", ROOT).pathname);
  if (isData) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetchFresh(request, 3500);
        if (response.ok) { await cache.put(key, response.clone()); return response; }
        const cached = await cache.match(key);
        return cached || response;
      } catch {
        return await cache.match(key) || new Response(JSON.stringify({error:"offline_not_cached"}), {status:503,headers:{"Content-Type":"application/json"}});
      }
    })());
    return;
  }
  if (!REQUIRED.has(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Scripts and styles remain consistent for the entire installed release.
    return await cache.match(key) || fetch(request);
  })());
});
