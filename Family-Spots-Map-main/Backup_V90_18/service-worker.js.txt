  // Family Spots Map: vollständige Offline-Grundfunktion, ohne Kartenkachel-Downloads.
const CACHE_VERSION = "20261103-test-main31-v918-1";
const CACHE_PREFIX = "family-spots-map-";
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION + "-164-spots-v82-1-unique-themes-v84-home-navigation";
const ROOT = new URL("./", self.location.href);
const ASSETS = [
  "js/filter-model.js",
  "js/ui/filter-results.js",
  "js/ui/filter-summary.js",
  "js/categories.js",
  "js/ui/category-explorer.js",
  "js/ui/category-icons.js",
  "css/categories.css",
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
  "js/ui/map-fullscreen.js",
  "js/ui/map-toolbar.js",
  "js/ui/home-navigation.js",
  "js/router.js",
  "js/storage.js",
  "js/sw-register.js",
  "js/theme.js",
  "js/toast.js",
  "js/ui/language.js",
  "js/ui/menu.js",
  "js/ui/modal.js",
  "js/ui/spot-details.js",
  "js/features/community-play.js",
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
  "css/fsm-home-navigation-84.css",
  "css/main-header-v90.css",
  "css/fsm-map-dock-v901.css",
  "css/fsm-premium-polish-v902.css",
  "css/fsm-header-final-v907.css",
  "css/fsm-proportion-target-v917.css",
  "css/fsm-landscape-space-v918.css",
  "assets/design/main-header-leaves-v90.webp",
  "assets/design/main-header-leaves-bottom-v90.webp",
  "assets/design/main-header-landscape-v90.webp",
  "assets/design/main-header-landscape-reference-v909.webp",
  "css/community-play.css",
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
  "assets/icons/fsm-home-v845-192.png",
  "assets/icons/fsm-home-v845-512.png",
  "assets/icons/fsm-home-v845-apple-180.png",
  "assets/tilla/tilla-hero.png",
  "assets/tilla/tilla-watercolor.png",
  "assets/spots/community/bolzplatz-vorschau.webp",
  "assets/spots/vejlby-klit/uebersicht.webp",
  "assets/spots/vejlby-klit/toiletten.webp",
  "assets/spots/vejlby-klit/muell-picknick.webp",
  "assets/spots/vejlby-klit/strandzugang.webp",
  "assets/spots/vejlby-klit/abendstimmung.webp",
  "data/spots.json",
  "data/community-play.json",
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
  "js/features/diary-view.js",
  "assets/spots/neerlandiavej/kletterturm-rutsche.jpeg",
  "assets/spots/neerlandiavej/spielplatz-ueberblick.jpeg",
  "assets/spots/barendsvej/klettergeruest-schaukeln.jpeg",
  "assets/spots/felto-filzwelt-soltau/backsteinfassade-eingang.jpeg",
  "assets/spots/skatepark-lemvig/rampen-am-hafen.jpeg",
  "assets/spots/skatepark-lemvig/kurven-blick-aufs-wasser.jpeg",
  "assets/spots/skatepark-lemvig/basketballflaeche.jpeg",
  "assets/spots/skatepark-lemvig/rampe-gegenlicht.jpeg",
  "assets/spots/skatepark-springe/anlage-ueberblick.jpeg",
  "assets/spots/skatepark-springe/rampen-zweite-perspektive.jpeg",
  "assets/spots/strandvejen-vrist/bahnuebergang-abendsonne.jpeg",
  "assets/spots/strandvejen-vrist/wohnmobil-abendsonne.jpeg",
  "assets/spots/felto-filzwelt-soltau/fassade-sitzplaetze.jpeg",
  "assets/spots/wow-park-skjern/fotorahmen-baumhaeuser.jpeg",
  "assets/spots/wow-park-skjern/haengebruecke.jpeg",
  "assets/spots/wow-park-skjern/baumhaus-rutsche.jpeg",
  "assets/spots/wow-park-skjern/baumhaus-netzbruecken.jpeg",
  "assets/spots/wow-park-skjern/kletterwand.jpeg",
  "css/interface.css",
  "css/fsm-ui-finish-70.css",
  "css/fsm-ui-finish-71.css",
  "css/filter-showcase-78.css",
  "css/fsm-ui-consistency.css",
  "css/fsm-design-system-83.css"
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
  const size = {"assets/icons/fsm-home-v845-192.png": 192, "assets/icons/fsm-home-v845-512.png": 512, "assets/icons/fsm-home-v845-apple-180.png": 180}[relative];
  if (!size) return;
  const bytes = new Uint8Array(await response.clone().arrayBuffer());
  const signature = [137,80,78,71,13,10,26,10];
  if (bytes.length < 33 || signature.some((byte, index) => bytes[index] !== byte)) throw new Error(`Invalid app icon: ${relative}`);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(8) !== 13 || view.getUint32(12) !== 0x49484452 || view.getUint32(16) !== size || view.getUint32(20) !== size) throw new Error(`Invalid app icon dimensions: ${relative}`);
}
const RELEASE_HASHES = {
  "css/fsm-design-system-83.css": "a2d950694642080f4bc6fd6e83831b3dd29e4760b6f18f23db92c1997c32e27d",
  "js/ui/category-icons.js": "ef1e35c9586943111131a7c16aa7c3a0f021b0aa8bee8a8574eaec5ac3c1b6eb",
  "css/fsm-ui-consistency.css": "abdad1434b900537f45705ad9903ef8819935bb74d05d823e9c0bc7c9fa3c96b",
  "css/filter-showcase-78.css": "61bf7a00b912d8b036ade3eafc375fdbeef7f1cbc4024451375268d95167f095",
  "css/fsm-ui-finish-70.css": "e3b5e8220c6a1d1da3e2c76de9edf63f09e912c5003cfd319d1c72c38921781c",
  "js/ui/filter-summary.js": "b7e0155c909fc50a9124ddff2efde40d4ea91f59038d0afd211642053a0699ff",
  "js/ui/map-toolbar.js": "167b74926b2998486de5f5381b7b1b70e2b612c526808df6d1e183bc32541bf8",
  "css/theme.css": "489b478c87918fa0178298907b37a41dcde9028902a19691312d58c7bfecb80a",
  "css/evening.css": "c5e55b9d887f8296fc02cb2d55c4739543e3ee642b3bffb656b077afa9c09d8c",
  "js/filter-model.js": "bf7b48e984aa50a1cb7717ab8bb0c87bff3daad8b4026b1b75238109d608a8dc",
  "css/map-spots.css": "9b2382e1ff161ec3f19044861841dd54b8939e08c0eb52a7a88a75cf4a2de352",
  "da/index.html": "e33f06c8a1adfb849fa15eecfced091b48aee51fb0b324548f6f2eecfb544e8e",
  "data/i18n/da.json": "25b9b8679e15931d4296ae6e09bd3f6f5f288bf30cd3b16f3cfa4b156ed53c4c",
  "data/i18n/de.json": "66ef957fde23defb718f448c9cb4d608bcabbdedb4e90101215b419014229add",
  "data/i18n/en.json": "80397d8943adfa772df6ba7299b872a5d70e726f16df6f5a253c07561328c9e3",
  "data/play-ideas.json": "c18f791a6f9bc6490e5414f7ea4ba3e5735ef597d70235e93530f0ee1ba7dc07",
  "data/spots.json": "b1ba4012af759e431a9d27c6e7c5a022c822858c2a481619a492710da326d56f",
  "en/index.html": "fdbd975bcef1390e6950b5cec47d2483236fe46be1c19d7ad9903502ad53f98c",
  "index.html": "b772020b329832cd284940bedbd98a6026ce86c2751af57b97ebcdcd4ddbc7f9",
  "js/app.js": "d61d7c54932a21b915b19212d8c835505b3419c536491d98b2eed1d1ba6a3b4e",
  "js/config.js": "6bf8119a67f96baf8634cfd3bbb1ae18a438d1bed26390b9bf9db9bd46397038",
  "js/features/personal-backup.js": "637f3d1387ad2ede0c716ab44b2f9994b5d2db0d700acd656718b1ce22a179cb",
  "js/features/personal-storage.js": "e398f18e7a246b3ff32148d05ccf387752272e6e5cb11bc125fa91ded4968dec",
  "js/features/tilla.js": "3e1e5271a7a51aec56016a81043509790d31161f7ebd882e6252d69849282820",
  "js/i18n.js": "5e399e51b52046f7babb7dccac73675de26d7557b553c838160630d6bf798584",
  "js/map.js": "8b65a46ebc04be1a8bd87e4431bf65683ddbb12fa2352e3741fc7f34db990289",
  "js/ui/menu.js": "78cd724aa5f446bb9e62ccc9293af9b18e5a53974c1b7edeef847caeb9a35370",
  "js/ui/spot-details.js": "979a9ef59041f9caacab46de883198004b913b1312abbfe9a71fb17a5c58bdf1",
  "offline.html": "3abeb27b2196a79a73f2bfc84d4137a6519f9ded69e0f7de8e7c11a57cd06177",
  "assets/spots/bovbjerg-fyr/leuchtturm-pony.jpeg": "dedd90020fb6c6d61fbf7106f5fc5fbe0841b0e8e5fe48492dbc7261010b84aa",
  "assets/spots/bovbjerg-fyr/strandtreppe.jpeg": "1996690336f41ac45960ed55918c8df95984912a839acbe0a289d80ec3626390",
  "assets/spots/bovbjerg-fyr/holzspiel.jpeg": "bc2d6e5273ea77bdcb138d40f77e594050e72075b0c59480617599f7ce141428",
  "assets/spots/bovbjerg-fyr/pony-nahaufnahme.jpeg": "c4e824f10705788a727e2606f64f5b3bc18b2c851092cf2ce9470bf79f7ac937",
  "assets/spots/bovbjerg-fyr/steilkueste.jpeg": "e46330a1c3a585251620171acf2cedff3b85ba786cbd5158de909590ddc76cfa",
  "js/features/plus.js": "9a80f7479a40be6b988045e8c760273ac14bea24e72273271f961108baa1c465",
  "js/storage.js": "fb1c9dbcb0b578355e90a4f48285758179b1069a9ac6b3f4f12f7f9228adc017",
  "js/features/daylog-photos.js": "6562f6861dbd3450e876bfe7021123a42a2c833083fed63e3379f7b09a86411b",
  "js/features/memory-images.js": "cff8360540e1f9f59df71f9b1f471519d8417a4224a29224efcd42e6a15bde4d",
  "js/features/backup-zip.js": "c9ece03d64d8a27e9ae534cd86c3e4e5028a71e815e702d50524b44ae8bbafbe",
  "js/sw-register.js": "6a1411fec45b1f139abb9e86bbb72275d71a3333ecf6ca5c90ccafc5978a3257",
  "css/components.css": "54e095203bce3c48f27e4f04a16d66963c9fd32cb74218416da904f5039f7432",
  "css/diary.css": "f929360aff9e35d8d804746a0f7c2eaccc56ee21441d16e015e577378cf8f30d",
  "js/features/diary-view.js": "2b543c94895fbb80180f1948653f98631c008724e495d25009b49f4189183176",
  "js/router.js": "1063d84d4a762687b5e41262ad7ba5becce1dcdf4208e32d0defd345c2f67df2",
  "js/ui/filter-select.js": "3710bbcfbd3ca6a6b6095bec6e526df17eb0dac98695211477047fdc1e29e2c1",
  "assets/spots/neerlandiavej/kletterturm-rutsche.jpeg": "099193f4efe8bb7e84dab69524d9b985db7b8556b4b7fc32cd93b0f10e8c9a14",
  "assets/spots/neerlandiavej/spielplatz-ueberblick.jpeg": "c880caa15b73ecaea4225bc691d19f8457fe0fcea691631cb4682c602fe82346",
  "assets/spots/barendsvej/klettergeruest-schaukeln.jpeg": "07764f48e966b7669ad278f0988717819d73f22694f746469513ca5dea994021",
  "assets/spots/felto-filzwelt-soltau/backsteinfassade-eingang.jpeg": "90a3575cc19b3b0d39444b5dbadec6593b58c5ca82a9cc5e26bab60a8da58262",
  "assets/spots/skatepark-lemvig/rampen-am-hafen.jpeg": "6aa1f834749ddc387525ce8bed3fe4af1c6dcaa1e3eb647d0c2ef0a1d58c7d2d",
  "assets/spots/skatepark-lemvig/kurven-blick-aufs-wasser.jpeg": "1daf9603aeaa2db59679813b0c40880c0bec727e6f513c980ed5454f65408cf7",
  "assets/spots/skatepark-lemvig/basketballflaeche.jpeg": "de6f37750d5424e333cc0cf10509ab436a175a6c86b00e552961866f2f6b45e8",
  "assets/spots/skatepark-lemvig/rampe-gegenlicht.jpeg": "890cbbe86c7a9906de4b6b16192a09907328dafea5daba84bbe422aa49d55603",
  "assets/spots/skatepark-springe/anlage-ueberblick.jpeg": "c1054e6f29c680e206e4db94fee98a5fc9ed3bb04ca78c66f333847eea9549c8",
  "assets/spots/skatepark-springe/rampen-zweite-perspektive.jpeg": "778c7426daed76365f05d8ec2056ba7a53adc3c262d5ddd6eafb83e6b14f8c18",
  "js/utils/dom.js": "246bc8a844710c41935deb1e9c4ef1ff5083af3bc9b2952983526d6ae0cd4432",
  "css/badges.css": "93512e7a68293f4cb09eda3ac0c0a59509e8eb1d836e4fa51a4e6c3c14a19923",
  "js/filters/tags.js": "3b8386ba863d390884eee9c6c8c7892959a4b8079155736e6d5f5df3f501af76",
  "js/filters/logic.js": "775816b277bf8e393bc942f5782e335f038ccbaa5f01514f6e9410db085fc50f",
  "css/styles.css": "5ad69c54b73703d908aa6e987261c68b9fe466018bea3537c2c6e2d3446c751d",
  "js/ui/map-fullscreen.js": "58218777034e262f8cee4b3fc9ded0c94516a836140a78199d3d23a7066618ac",
  "js/categories.js": "399b984aee4d1508cc905805859c56206a396b6a81b23438983ed9b92b97ede7",
  "js/ui/category-explorer.js": "45a407e69a4204ffc95964e5d761b8b729da7fbb41a39927e7d98e7a713f7af9",
  "css/categories.css": "07ca5cfa691f69421f55668be6969bb7520451867aea2e94aeab5b68894d164e",
  "js/ui/filter-results.js": "c93fa5155dce5dff2d42f73fdb6ba3c6012136549ecd355884ca1d252dddafae",
  "css/interface.css": "c4a6ea58ef8af12716c71af48b1a746351456268cd2d2731aab543214e52a8fa",
  "css/fsm-ui-finish-71.css": "0af65a5df778b74eb503045dca5765d180a18f80649f5680c29fc2b7a75f922e",
  "css/fsm-home-navigation-84.css": "3916cecf58f53593d0b94b24c2a504b86302edbdbfd551c4cded340bf73b91e7",
  "js/ui/home-navigation.js": "3b6abcf19e6aee41093f10486ecae1b8b975005ac0b03e08de3710b838ec78a5",
  "css/main-header-v90.css": "55de47df1a0ddd7350d0a692a63b37a6a4484b4ebb8476f57184593a3fb40c4f",
  "css/fsm-map-dock-v901.css": "8ff732e2a99f9cb9137d3a82351bf1a48baafaa0f5ed5a7cb2dc9538fdea6385",
  "css/fsm-premium-polish-v902.css": "29d371dde4feb6b2e604a340c01d228babfdb2f7951fcdb270ea3ac040d0bb9a",
  "css/fsm-header-final-v907.css": "ed501f98547656a3515170daa73e873be48c6b9e67161ff70920775332f5f52e",
  "css/fsm-proportion-target-v917.css": "27be709373439c80440694ddc6becc1cbf15846b0007294ee10e122e38bb9593",
  "css/fsm-landscape-space-v918.css": "ff258e3116772ffde4075ceeef86c6b313b6afc9ab0e8b5128c41a6ce5997d3d",
  "assets/design/main-header-leaves-v90.webp": "fe0eb90577732eb6049673816dfdf6c76d6f1290b5f6f247cf916a3fb00c7f36",
  "assets/design/main-header-leaves-bottom-v90.webp": "03fc3b10f71d83ae49bc9f9d0f690117d8b51d7d49f80d363ab452f82746f097",
  "assets/design/main-header-landscape-v90.webp": "005ea07d4960c6d02af287ae33e5ce3adecc61fd2f07bd66127c0a322a8f2a6e",
  "assets/design/main-header-landscape-reference-v909.webp": "fbbf163b76db5abe6a7a11384af5658d9546c8ae5533cd421d4070b923c0d561"
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
        if (response.ok) {
          await validateData(response, key);
          // Hashed release data must match the installed scripts and categories.
          // Dynamic, unhashed partner data can still refresh independently.
          await validateMapPresentation(response, key);
          await cache.put(key, response.clone());
          return response;
        }
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
