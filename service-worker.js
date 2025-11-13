/* Family Spots Map – ABF2026 Service Worker (v3) */
const CACHE = "fsm-abf2026-v3";
const FILES = [
  "index.html","offline.html",
  "css/styles.css","css/badges.css",
  "js/app.js","js/router.js","js/map.js","js/ui.js","js/data.js",
  "js/filters.js","js/storage.js","js/i18n.js","js/utils.js","js/sw-register.js",
  "assets/logo.svg",
  "assets/icons/icon-192.png","assets/icons/icon-512.png","assets/icons/apple-touch-icon.png","assets/icons/favicon.svg",
  "data/index.json","data/spots.json","data/i18n/de.json","data/i18n/en.json",
  "manifest.webmanifest"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (/tile\.openstreetmap\.org|tiles/.test(url.host)) return; // don't cache tiles
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(() => caches.match("offline.html"))); return;
  }
  if (url.pathname.endsWith(".json")) {
    e.respondWith((async () => {
      try {
        const net = await fetch(e.request);
        const cache = await caches.open(CACHE); cache.put(e.request, net.clone());
        return net;
      } catch {
        const cached = await caches.match(e.request);
        if (cached) return cached;
        return new Response(JSON.stringify({ error:"offline" }), { headers:{ "Content-Type":"application/json" }});
      }
    })());
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});