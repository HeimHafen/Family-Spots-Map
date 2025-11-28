// service-worker.js

// Version hochzählen, wenn du etwas am SW änderst
const CACHE_VERSION = "42";
const CACHE_NAME = `family-spots-map-v${CACHE_VERSION}`;
const OFFLINE_URL = "offline.html";

// Minimale App-Shell, die für den Start wichtig ist
const APP_SHELL = [
  "./",
  "index.html",
  OFFLINE_URL,
  "css/styles.css",
  "css/badges.css",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/apple-touch-icon.png",
  "data/index.json",
  "data/spots.json",
  "data/i18n/de.json",
  "data/i18n/en.json"
];

// Dateiendungen, die wir als statische Assets behandeln
const STATIC_EXTENSIONS = [
  ".css",
  ".js",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".webp",
  ".ico"
];

function isStaticAsset(url) {
  const pathname = typeof url === "string" ? url : url.pathname;
  return STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

// Installation – App Shell cachen
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(APP_SHELL).catch((err) => {
          console.warn("[SW] Fehler beim Vor-Cachen der App-Shell:", err);
        })
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

// Fetch-Strategien
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Nur GET abfangen
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Nur gleiche Origin (GitHub-Pages: gleicher Host)
  if (url.origin !== self.location.origin) return;

  const acceptHeader = request.headers.get("accept") || "";

  const isHtmlRequest =
    request.mode === "navigate" ||
    acceptHeader.includes("text/html");

  // 1) Navigations-/HTML-Requests → Network first + Offline-Fallback
  if (isHtmlRequest) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // erfolgreiche Antwort zusätzlich cachen
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          // Fallback auf Offline-Seite
          const offline = await caches.match(OFFLINE_URL);
          return offline || new Response("Offline", { status: 503 });
        })
    );
    return;
  }

  // 2) JSON (v. a. unter /data/) → Network first + Cache-Update
  if (url.pathname.endsWith(".json")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 3) Statische Assets (CSS/JS/Bilder) → Cache first + Background Update
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchAndUpdate = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => null);

        // Sofort aus dem Cache antworten, wenn vorhanden
        return cached || fetchAndUpdate;
      })
    );
    return;
  }

  // 4) Fallback: einfach ans Netz durchreichen
  // (z. B. für andere API-Calls)
});