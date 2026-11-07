  // Family Spots Map: vollständige Offline-Grundfunktion, ohne Kartenkachel-Downloads.
const CACHE_VERSION = "20261107-cohesion-v34d";
const CACHE_PREFIX = "family-spots-map-";
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION + "-173-spots-v34-cohesion";
const ROOT = new URL("./", self.location.href);
const ASSETS = [
  "js/ui/stroebeck-track.js",
  "js/ui/filsoe-tour.js",
  "assets/spots/filsoe/ellipse.webp",
  "js/ui/cycle-tours.js",
  "css/cycle-tours.css",
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
  "css/fsm-design-system-83.css",
  "js/features/gemeinsam-erleben-rc.js",
  "js/ui/evening-mode.js",
  "js/theme.js",
  "css/gemeinsam-erleben-rc.css",
  "css/fsm-cohesion-v34.css",
  "css/evening.css",
  "assets/spots/grundschule-rethen/IMG_0412.jpeg",
  "assets/spots/grundschule-rethen/IMG_0414.jpeg",
  "assets/spots/schachplatz-stroebeck/schachplatz.webp",
  "assets/spots/windheimstrasse/0769.webp",
  "assets/spots/windheimstrasse/0776.webp",
  "assets/spots/windheimstrasse/0777.webp",
  "assets/spots/windheimstrasse/pagalino-milpa.webp",
  "assets/spots/zinnober/IMG_0716.jpeg",
  "assets/spots/zinnober/IMG_0717.jpeg",
  "assets/spots/zinnober/IMG_0721.jpeg",
  "assets/spots/zinnober/IMG_0727.jpeg",
  "assets/spots/zinnober/IMG_0750.jpeg"
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
  "js/ui/stroebeck-track.js": "1745660b3a7bc8c09fdb711ba0f0d3b015cf4d03094cc82f06ba5e84c0888a30",
  "js/ui/cycle-tours.js": "cab928265986127d54c5ea4224f67d5b83e7759955d8c4fdd7bc83eee8c21c56",
  "css/cycle-tours.css": "77e68cb68032dd0ba00df4728c7baee3e307cca19bf4b2e9b78b4114b9ad4cf4",
  "css/fsm-design-system-83.css": "7d7c21c75a85ee14990749fdcf7428b9f52fe0b81a5651acb13f6045a0192b71",
  "js/ui/category-icons.js": "0349ce3a8f0350afaef0102b428ea05b5b5d8dfa1e0cf3617e713e89f7866c7d",
  "css/fsm-ui-consistency.css": "d61d241858bb534acb07a5b17c9225eed32a79f37b98740dff963a3779a42b1d",
  "css/filter-showcase-78.css": "b81f3217fd6a866091e10ecfc61cbf002d60fe6f2b559acfdd28a08b640732ea",
  "css/fsm-ui-finish-70.css": "6e27e7c25496601ee805fa193610174078bfde74ead948ca744e9130c3b9e774",
  "js/ui/filter-summary.js": "b7e0155c909fc50a9124ddff2efde40d4ea91f59038d0afd211642053a0699ff",
  "js/ui/map-toolbar.js": "f81903283ad93cc5c434bb08fb2b9343eac28636a96e19e348c7daee39672557",
  "css/theme.css": "a159a063aab5d84600a4991ab56bcbb6a81585abf2c2bba32736231c40d35389",
  "js/filter-model.js": "14e8339fcdfee92c86277572d6256a7770157025f2f904d3ecab165ef6ee4053",
  "css/map-spots.css": "3f922129f541dd3aaa616032b811c5c4edd40153d890bc4b4b5581f1ea6564da",
  "da/index.html": "8c9f8bac98687aa2638dda631a8b7e68147e397d1acb8fb991499fbd27caae4b",
  "data/i18n/da.json": "e004e9d9f4810b00e64b8e5a6ddeed1c52d9028c3585a89338722221d7a39c63",
  "data/i18n/de.json": "09e6451868bd1b95e2fdb623ea1fdd46509e8c8f595d2c83254e8c5d03ffa413",
  "data/i18n/en.json": "a05e8a3b33c3082cc357d4b77bee69b7708e21e662626fc4feb4641d1a17ab87",
  "data/play-ideas.json": "c18f791a6f9bc6490e5414f7ea4ba3e5735ef597d70235e93530f0ee1ba7dc07",
  "data/spots.json": "ee5a2f7c3003bd1dba5007a09553efcaa18a82eb5d2e7d68598f904b7d68d369",
  "en/index.html": "63118654d7d38519be7cb645b1a910358ffdcfd5729f04fc7f802af04f42e66e",
  "index.html": "b4382c9d9d70034dc4019e477705b888a3c2651ce1b06bd6e366f4715c64ffa4",
  "js/app.js": "9f7fcb03d7ba37b31fcaba93b418b7e804053f8315b89ad3ed7f8c16f1a1e4b2",
  "js/config.js": "57183afe5d20929a53b0336308bf91f15002dad8c410d527510cec2760f49b3b",
  "js/features/personal-backup.js": "e71292d506be6b2642ba1fc2c907c27bb58e7b77aede61301bc4bcd304eacf36",
  "js/features/personal-storage.js": "ee17691463c8d6c8fa25060c1f0441d342e7900877f3376d9ddc7c5f093da18d",
  "js/features/tilla.js": "3e1e5271a7a51aec56016a81043509790d31161f7ebd882e6252d69849282820",
  "js/i18n.js": "d45b9a843735c91be3c6cc375c8aac0b99c268fa57018c4e51d731014af629eb",
  "js/map.js": "b58fb4179a4e1c6658179a3a912328d69399478f4ad3d1788ce8fecea3f4b334",
  "js/ui/menu.js": "87a9bd34bd2cd9a2e4510629c69932541e911522df89c322544aae0bb46e7311",
  "js/ui/spot-details.js": "ba4da327d5f769b64a66f34b566581e66fca7a98a3816ba8ede00b0be9ac4af8",
  "offline.html": "e3b8b124835d55406742d8fcf922f5e76d4ee2d6dac9577430fa716b83c08b6f",
  "assets/spots/bovbjerg-fyr/leuchtturm-pony.jpeg": "dedd90020fb6c6d61fbf7106f5fc5fbe0841b0e8e5fe48492dbc7261010b84aa",
  "assets/spots/bovbjerg-fyr/strandtreppe.jpeg": "1996690336f41ac45960ed55918c8df95984912a839acbe0a289d80ec3626390",
  "assets/spots/bovbjerg-fyr/holzspiel.jpeg": "bc2d6e5273ea77bdcb138d40f77e594050e72075b0c59480617599f7ce141428",
  "assets/spots/bovbjerg-fyr/pony-nahaufnahme.jpeg": "c4e824f10705788a727e2606f64f5b3bc18b2c851092cf2ce9470bf79f7ac937",
  "assets/spots/bovbjerg-fyr/steilkueste.jpeg": "e46330a1c3a585251620171acf2cedff3b85ba786cbd5158de909590ddc76cfa",
  "js/features/plus.js": "46d633534ee2c8c569304568d2a547f613ad88e77c8068c4e9b6be631cc28a66",
  "js/storage.js": "a0e9f78406f8c373ab097d94d66ea5a106e133fc7263f781412307189e0c8ac9",
  "js/features/daylog-photos.js": "a50fe7c7a6b2f0abcbb7ec234e3df643fa2d67a0a9bb99d9424484f628fdc1e7",
  "js/features/memory-images.js": "f986395cca434c008b3363e8ae076948ddcbecea952c94cc311a40f02f312143",
  "js/features/backup-zip.js": "c9ece03d64d8a27e9ae534cd86c3e4e5028a71e815e702d50524b44ae8bbafbe",
  "js/sw-register.js": "306d25dd00638a8ad2606cc0affa49f402043d99ed28081a2a189bb1cf037d42",
  "css/components.css": "7fd5b08aec145a357916f41a13dca9ac975cb0a9f20ce38e3267365d183e3631",
  "css/diary.css": "7014ce6ae8934e09b58fc8d0c7906dffd1fa85a67698368e5d8b4c0842790d9f",
  "js/features/diary-view.js": "caa3f074a171135743f7876a2c3e5bf7c4b16cc7959ede0555538131423502b6",
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
  "css/badges.css": "368e7f67b004d7ee8a5f030312260aba6aad2a1e93d8c4235bc0cacca808f15b",
  "js/filters/tags.js": "fbea5599ad6503ccb8a2bb1da9a7d46a3d1bf5ce27afe46c8f1f280ac2ada923",
  "js/filters/logic.js": "775816b277bf8e393bc942f5782e335f038ccbaa5f01514f6e9410db085fc50f",
  "css/styles.css": "364c4fe8201daeeb1ba3fb7c1fe53d39fd8da17b5d672208ef53dbcaf84215e8",
  "js/ui/map-fullscreen.js": "58218777034e262f8cee4b3fc9ded0c94516a836140a78199d3d23a7066618ac",
  "js/categories.js": "04f41a946d27d2a49b84465e91c96c427f7e18a503a731adb332d1cc24602e64",
  "js/ui/category-explorer.js": "bd30833878af0ee06336a5a154d2b0668ddd55ceaf18850b0ba121ce55b82e8d",
  "css/categories.css": "07ca5cfa691f69421f55668be6969bb7520451867aea2e94aeab5b68894d164e",
  "js/ui/filter-results.js": "c93fa5155dce5dff2d42f73fdb6ba3c6012136549ecd355884ca1d252dddafae",
  "css/interface.css": "5ca2e67b8b477d9fcaafe53784d63443d91dd79d9ac202db3d888958f704776f",
  "css/fsm-ui-finish-71.css": "5f786de619f9719981fcad413dcb5f405799491a58c8bf445a57d9b9202ecb8a",
  "css/fsm-home-navigation-84.css": "eef73ed91f779493c40e789dec62ad8f6a78c48a335e949541ef8cccbcb356f6",
  "js/ui/home-navigation.js": "35ef01f92692b62f6f24d3b7a9b9e170d48d9259b8613ea60769aa83ff479856",
  "css/main-header-v90.css": "55de47df1a0ddd7350d0a692a63b37a6a4484b4ebb8476f57184593a3fb40c4f",
  "css/fsm-map-dock-v901.css": "8ff732e2a99f9cb9137d3a82351bf1a48baafaa0f5ed5a7cb2dc9538fdea6385",
  "css/fsm-premium-polish-v902.css": "29d371dde4feb6b2e604a340c01d228babfdb2f7951fcdb270ea3ac040d0bb9a",
  "css/fsm-header-final-v907.css": "ed501f98547656a3515170daa73e873be48c6b9e67161ff70920775332f5f52e",
  "css/fsm-proportion-target-v917.css": "27be709373439c80440694ddc6becc1cbf15846b0007294ee10e122e38bb9593",
  "css/fsm-landscape-space-v918.css": "02b7ca66c78cb357c6dac545ec0cd711d575f10707e757118fc6b2de41750f96",
  "assets/design/main-header-leaves-v90.webp": "fe0eb90577732eb6049673816dfdf6c76d6f1290b5f6f247cf916a3fb00c7f36",
  "assets/design/main-header-leaves-bottom-v90.webp": "03fc3b10f71d83ae49bc9f9d0f690117d8b51d7d49f80d363ab452f82746f097",
  "assets/design/main-header-landscape-v90.webp": "005ea07d4960c6d02af287ae33e5ce3adecc61fd2f07bd66127c0a322a8f2a6e",
  "assets/design/main-header-landscape-reference-v909.webp": "fbbf163b76db5abe6a7a11384af5658d9546c8ae5533cd421d4070b923c0d561",
  "css/community-play.css": "7838c36d085285ceae7a9f0d85e6eb32b43af950aae5e89af07694664c2f5681",
  "js/ui/filsoe-tour.js": "172e29ad77325a8c4cfa8e0548c99a91106f8669c3ae83dbd27d073406bb5c91",
  "assets/spots/filsoe/ellipse.webp": "5c362b84cd83558748f5417a71b91aac39935a028a85d57470f890d1d179ea46",
  "js/features/gemeinsam-erleben-rc.js": "8af89b2c703aa4c60c064af9fd7b48a339eaf7f4f577ccc73d00e31e7ec3a033",
  "js/ui/evening-mode.js": "e09c29790e89e15c21ef887b4364f511c95fbf23bd2d29a3daa13976595f78ac",
  "js/theme.js": "9f193b8082c3b28dcc3dec753dedf7301ce8c13b688bd17cfff2dd7dd58131c3",
  "js/features/community-play.js": "594880fde127b94ad781b63fc08d234776a0eb63d1b9f1f5e2d5835b14b16a2e",
  "css/gemeinsam-erleben-rc.css": "cfeb0c3f67412dee9d3a287df3001e83eac7ccde6b0694f12697d5f40c2f5d35",
  "css/evening.css": "c5e55b9d887f8296fc02cb2d55c4739543e3ee642b3bffb656b077afa9c09d8c",
  "css/fsm-cohesion-v34.css": "ad9a86a1895764e2117d8cb09801375b0fa7da953eaf47acbafe451bc2e76812"
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
