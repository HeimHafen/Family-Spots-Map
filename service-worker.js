  // Family Spots Map: vollständige Offline-Grundfunktion, ohne Kartenkachel-Downloads.
const CACHE_VERSION = "20261014-pin-tilla-40";
const CACHE_PREFIX = "family-spots-map-";
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION + "-filter-ui-20261016-1";
const ROOT = new URL("./", self.location.href);
const ASSETS = [
  "js/app.js",
  "js/ui/filter-select.js",
  "js/config.js",
  "js/data.js",
  "js/data/dataLoader.js",
  "js/features/plus.js",
  "js/features/personal-storage.js",
  "js/features/personal-backup.js",
  "js/features/daylog-drafts.js",
  "js/features/daylog-photos.js",
  "js/features/memory-images.js",
  "js/features/backup-zip.js",
  "js/features/tilla.js",
  "js/filters.js",
  "js/filters/apply.js",
  "js/filters/index.js",
  "js/filters/logic.js",
  "js/filters/normalize.js",
  "js/filters/tags.js",
  "js/i18n.js",
  "js/map.js",
  "js/ui/map-spots.js",
  "js/router.js",
  "js/storage.js",
  "js/sw-register.js",
  "js/theme.js",
  "js/toast.js",
  "js/ui/language.js",
  "js/ui/menu.js",
  "js/ui/modal.js",
  "js/ui/spot-details.js",
  "js/ui/skip-to-spots.js",
  "js/utils/dom.js",
  "./",
  "index.html",
  "en/index.html",
  "da/index.html",
  "offline.html",
  "manifest.webmanifest",
  "css/styles.css",
  "css/map-spots.css",
  "css/evening.css",
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
  "assets/tilla/tilla-watercolor.png",
  "assets/spots/wildgatter-hildesheim/eingang-test.webp",
  "assets/spots/wildgatter-hildesheim/spielplatz-test.webp",
  "assets/spots/wildgatter-hildesheim/wege-test.webp",
  "assets/spots/vejlby-klit/uebersicht.webp",
  "assets/spots/vejlby-klit/toiletten.webp",
  "assets/spots/vejlby-klit/muell-picknick.webp",
  "assets/spots/vejlby-klit/strandzugang.webp",
  "assets/spots/vejlby-klit/abendstimmung.webp",
  "data/spots.json",
  "data/i18n/de.json",
  "data/i18n/en.json",
  "data/i18n/da.json",
  "data/play-ideas.json",
  "data/partners.json",
  "assets/spots/bovbjerg-fyr/leuchtturm-pony.jpeg",
  "assets/spots/bovbjerg-fyr/strandtreppe.jpeg",
  "assets/spots/bovbjerg-fyr/holzspiel.jpeg",
  "assets/spots/bovbjerg-fyr/steilkueste.jpeg",
  "assets/spots/bovbjerg-fyr/pony-nahaufnahme.jpeg",
  "css/diary.css",
  "js/features/diary-view.js"
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
  try {
    const response = await fetch(request, {cache: "no-store", signal: controller.signal});
    // Reading a clone keeps the original Response/URL while covering the entire transfer.
    await response.clone().arrayBuffer();
    return response;
  }
  finally { clearTimeout(timer); }
}
function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
async function validateData(response, url) {
  const data = await response.clone().json();
  const relative = new URL(url, ROOT).pathname.slice(ROOT.pathname.length);
  if (relative === "data/spots.json") {
    const spots = Array.isArray(data) ? data : data?.spots;
    if (!Array.isArray(spots) || spots.some(spot => !isRecord(spot))) throw new Error("Invalid spot data");
  } else if (relative === "data/partners.json") {
    const codes = Array.isArray(data) ? data : data?.codes;
    if (!Array.isArray(codes) || codes.some(code => !isRecord(code))) throw new Error("Invalid partner data");
  } else if (relative === "data/play-ideas.json") {
    if (!Array.isArray(data) || data.some(idea => !isRecord(idea))) throw new Error("Invalid play ideas");
  } else if (relative.startsWith("data/i18n/")) {
    if (!isRecord(data) || Object.keys(data).length === 0) throw new Error("Invalid translation data");
  }
}
async function validateImage(response, url) {
  const relative = new URL(url, ROOT).pathname.slice(ROOT.pathname.length);
  const size = {"assets/icons/icon-192.png": 192, "assets/icons/icon-512.png": 512, "assets/icons/apple-touch-icon.png": 180}[relative];
  if (!size) return;
  const bytes = new Uint8Array(await response.clone().arrayBuffer());
  const signature = [137,80,78,71,13,10,26,10];
  if (bytes.length < 33 || signature.some((byte, index) => bytes[index] !== byte)) throw new Error(`Invalid app icon: ${relative}`);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(8) !== 13 || view.getUint32(12) !== 0x49484452 || view.getUint32(16) !== size || view.getUint32(20) !== size) throw new Error(`Invalid app icon dimensions: ${relative}`);
}
const RELEASE_HASHES = {
  "css/map-spots.css": "9292e7042db3ff747bd95fef66e89c5db1d2c0c038afb1cd2c6cf6a1c4c4c8b2",
  "da/index.html": "6de93eaaa8e533269a3dd0d5a01fbd993f2d7f6d23c51c7d4816c6e7943c4065",
  "data/i18n/da.json": "f85373e9ba4d1f955176956c4ece9cdbda16074ef4df0691dc18462bba1289b6",
  "data/i18n/de.json": "4cf4603fe87577abd95a59738aee1333d34c86dac26bdbfca5db41961bbfd79c",
  "data/i18n/en.json": "698aaa21787456b065d24165016326728236f8a421019bd18baa61161e209c5b",
  "data/play-ideas.json": "c18f791a6f9bc6490e5414f7ea4ba3e5735ef597d70235e93530f0ee1ba7dc07",
  "data/spots.json": "c777753984be7376d1ab190f8652e0952c85a641488cacc30b371b6f8ecaf8f8",
  "en/index.html": "bfff2dab25015603de4b5285dd77c54f5c646a06cadf331947d493c93c3c39f9",
  "index.html": "f176a4423643461dd1f79580ecb5fee565d11679ac96e91ee8ecd469239aa116",
  "js/app.js": "d14b12be12f8a4fd9dac42e432629fc27feb98314f10050e8e30a17e18f25529",
  "js/config.js": "15ec00d8248de55999423fe768c3022f751476b6a55f94007290fdac96aa943c",
  "js/features/personal-backup.js": "8163fb48c3bcb36cb8afcfc24a68c78407642bd78e107528a16cba1c6b3ecf04",
  "js/features/personal-storage.js": "122b893a06146c84f4e65b6ebccca8821230ef027c287a5768c6516fcc838de3",
  "js/features/tilla.js": "3e1e5271a7a51aec56016a81043509790d31161f7ebd882e6252d69849282820",
  "js/i18n.js": "b339dbab2001148183850bc0ec18d778c4189e7f3a923d40766ef5368472c11c",
  "js/map.js": "ae174db6cb55a4f9f2b9519c76bc25b456c24a1d0fbb2ca52b3bd48ea7453316",
  "js/ui/menu.js": "78cd724aa5f446bb9e62ccc9293af9b18e5a53974c1b7edeef847caeb9a35370",
  "js/ui/spot-details.js": "91108400c12fa6f50edf87f66fc9c4fec3f20c8149cabd35c859677c06a8974a",
  "offline.html": "ab84afa963f01f0dc9401444da5e17bb01855b8d1a0482398409e43dac3f1c3c",
  "assets/spots/bovbjerg-fyr/leuchtturm-pony.jpeg": "dedd90020fb6c6d61fbf7106f5fc5fbe0841b0e8e5fe48492dbc7261010b84aa",
  "assets/spots/bovbjerg-fyr/strandtreppe.jpeg": "1996690336f41ac45960ed55918c8df95984912a839acbe0a289d80ec3626390",
  "assets/spots/bovbjerg-fyr/holzspiel.jpeg": "bc2d6e5273ea77bdcb138d40f77e594050e72075b0c59480617599f7ce141428",
  "assets/spots/bovbjerg-fyr/pony-nahaufnahme.jpeg": "c4e824f10705788a727e2606f64f5b3bc18b2c851092cf2ce9470bf79f7ac937",
  "assets/spots/bovbjerg-fyr/steilkueste.jpeg": "e46330a1c3a585251620171acf2cedff3b85ba786cbd5158de909590ddc76cfa",
  "js/features/plus.js": "72ba72f995ff79aa9a19b9f38371fd1129ccec9bbff4d65a2727ecc3a5d6475f",
  "js/storage.js": "a094c5be5f607c9a65f4b6ba654d837b9e0361bccf9cc5769384830c4bbce4ea",
  "js/features/daylog-photos.js": "572e80e51a1ff2eb1445ed6ff600a89832890fd1f6651fc7e068001fe0e359c0",
  "js/features/memory-images.js": "cff8360540e1f9f59df71f9b1f471519d8417a4224a29224efcd42e6a15bde4d",
  "js/features/backup-zip.js": "50e5f298fe2342be538238a9c62e52d268eb6c20816d56d32d7315c3a4a86ef1",
  "js/sw-register.js": "6a1411fec45b1f139abb9e86bbb72275d71a3333ecf6ca5c90ccafc5978a3257",
  "css/components.css": "1cbd80e28526a7ddee8babc6fd92e59c505ecf5bace68adb209fc557134d96f0",
  "css/diary.css": "d7c9309c8addb0355e4a0b7fe85c2d69f17add5ed12986b48b980673d210bec3",
  "js/features/diary-view.js": "2b543c94895fbb80180f1948653f98631c008724e495d25009b49f4189183176",
  "js/router.js": "83fc99bdeacaa904549b54b1ef96c9b9b38e5c165c7490a192fae18a7e4c1ca2",
  "js/ui/filter-select.js": "1ba89b80f82077b65a5ba7c6d8fad257d44e6dd24f788fa0ada6938538b5d865"
};
async function validateMapPresentation(response, url) {
  const relative = new URL(url, ROOT).pathname.slice(ROOT.pathname.length);
  const expected = RELEASE_HASHES[relative];
  if (!expected) return;
  const digest = await crypto.subtle.digest("SHA-256", await response.clone().arrayBuffer());
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  if (hash !== expected) throw new Error(`File does not match this update: ${relative}`);
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
          if (new URL(url).pathname.endsWith(".json")) await validateData(response, url);
          if (new URL(url).pathname.endsWith(".png")) await validateImage(response, url);
          await validateMapPresentation(response, url);
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
    const entry = url.pathname === ROOT.pathname ? "index.html"
      : ["index.html", "en/index.html", "da/index.html"].find(path => url.pathname === new URL(path, ROOT).pathname || (path !== "index.html" && url.pathname === new URL(path.replace("index.html", ""), ROOT).pathname));
    const isApp = !!entry;
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      if (isApp) {
        const shell = await cache.match(new URL(entry, ROOT).href);
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
        if (response.ok) { await validateData(response, key); await cache.put(key, response.clone()); return response; }
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
