// js/config.js
// ------------------------------------------------------
// Family Spots Map – zentrale Konfiguration & Labels
// ------------------------------------------------------

"use strict";

// ------------------------------------------------------
// Map & Storage Keys
// ------------------------------------------------------

export const DEFAULT_MAP_CENTER = [52.4, 9.7];
export const DEFAULT_MAP_ZOOM = 7;

export const PLUS_STORAGE_KEY = "fs_plus_active";
export const DAYLOG_STORAGE_KEY = "fs_daylog_last";
export const SPOTS_CACHE_KEY = "fs_spots_cache_v1";

// ------------------------------------------------------
// Sprachen & Theme
// ------------------------------------------------------

/** @typedef {"de" | "en"} LangCode */

export const LANG_DE = "de";
export const LANG_EN = "en";

export const THEME_LIGHT = "light";
export const THEME_DARK = "dark";

// ------------------------------------------------------
// Radius / Marker-Limit
// ------------------------------------------------------

/**
 * Slider-Stufen für den Micro-Abenteuer-Radius.
 * Index 0–3 = fester Radius in km, 4 = Infinity (kein Limit).
 */
export const RADIUS_STEPS_KM = [1, 5, 15, 40, Infinity];

/** Maximale Marker-Anzahl für gute Performance */
export const MAX_MARKERS_RENDER = 500;

// ------------------------------------------------------
// Feature-Flags
// ------------------------------------------------------

/**
 * Feature-Flags zentral, damit man Funktionen gezielt deaktivieren kann.
 * Wichtig: Flags werden von app.js nur gelesen, nicht beschrieben.
 */
export const FEATURES = Object.freeze({
  plus: true,
  moodFilter: true,
  travelMode: true,
  bigAdventureFilter: true,
  verifiedFilter: true,
  favorites: true,
  daylog: true,
  playIdeas: true,
  compass: true
});

// ------------------------------------------------------
// Kategorien & Gruppen
// ------------------------------------------------------

export const CATEGORY_GROUPS = {
  "Spiel & Bewegung": [
    "spielplatz",
    "abenteuerspielplatz",
    "indoor-spielplatz",
    "waldspielplatz",
    "wasserspielplatz",
    "barrierefreier-spielplatz",
    "bewegungspark",
    "multifunktionsfeld",
    "bolzplatz",
    "pumptrack",
    "skatepark",
    "verkehrsgarten",
    "toddler-barfuss-motorik"
  ],
  "Tiere & Natur": [
    "zoo",
    "tierpark",
    "wildpark",
    "bauernhof",
    "naturerlebnispfad",
    "walderlebnisroute",
    "freilichtmuseum"
  ],
  "Wasser & Schwimmen": [
    "schwimmbad",
    "badesee",
    "strand",
    "eisbahn",
    "rodelhuegel"
  ],
  "Erlebnis & Freizeit": [
    "freizeitpark",
    "trampolinpark",
    "kletterhalle",
    "kletteranlage-outdoor",
    "kletterwald-hochseilgarten",
    "boulderpark",
    "minigolf",

    // ➕ NEU
    "hoehle",
    "felsenwanderung",
    "aussichtspunkt",
    "baumhaus",
    "labyrinth",
    "klangpfad",
    "ueberdachter-spielplatz",
    "dirtbike-track",
    "streetball-platz"
  ],
  "Wandern & Radfahren": ["wanderweg-kinderwagen", "radweg-family"],
  "Essen & Trinken": [
    "familiencafe",
    "kinder-familiencafe",
    "familien-restaurant"
  ],
  "Lernen & Kultur": ["museum-kinder", "kinder-museum", "bibliothek"],
  "Praktisches": ["oeffentliche-toilette", "wickelraum"],
  "Events & Erlebnisse": ["familien-event"],
  "Unterwegs mit WoMo & Rad": [
    "stellplatz-spielplatz-naehe-kostenlos",
    "wohnmobil-service-station",
    "rastplatz-spielplatz-dusche",
    "bikepacking-spot",
    "campingplatz-familien"
  ],
  "Entspannung & Naturorte": [
    "park-garten",
    "picknickwiese",

    // ➕ NEU
    "waldbaden-ort",
    "natur-aussichtspunkt"
  ]
};

export const CATEGORY_GROUP_LABELS = {
  de: {
    "Spiel & Bewegung": "Spiel & Bewegung",
    "Tiere & Natur": "Tiere & Natur",
    "Wasser & Schwimmen": "Wasser & Schwimmen",
    "Erlebnis & Freizeit": "Erlebnis & Freizeit",
    "Wandern & Radfahren": "Wandern & Radfahren",
    "Essen & Trinken": "Essen & Trinken",
    "Lernen & Kultur": "Lernen & Kultur",
    "Praktisches": "Praktisches",
    "Events & Erlebnisse": "Events & Erlebnisse",
    "Unterwegs mit WoMo & Rad": "Unterwegs mit WoMo & Rad",
    "Entspannung & Naturorte": "Entspannung & Naturorte"
  },
  en: {
    "Spiel & Bewegung": "Play & movement",
    "Tiere & Natur": "Animals & nature",
    "Wasser & Schwimmen": "Water & swimming",
    "Erlebnis & Freizeit": "Adventure & leisure",
    "Wandern & Radfahren": "Hiking & cycling",
    "Essen & Trinken": "Food & drinks",
    "Lernen & Kultur": "Learning & culture",
    "Praktisches": "Useful on the way",
    "Events & Erlebnisse": "Events & experiences",
    "Unterwegs mit WoMo & Rad": "On the road (RV & bike)",
    "Entspannung & Naturorte": "Relax & nature"
  }
};

export const CATEGORY_LABELS_DE = {
  spielplatz: "Spielplatz",
  abenteuerspielplatz: "Abenteuerspielplatz",
  "indoor-spielplatz": "Indoor-Spielplatz",
  waldspielplatz: "Waldspielplatz",
  wasserspielplatz: "Wasserspielplatz",
  "barrierefreier-spielplatz": "Barrierefreier Spielplatz",
  bewegungspark: "Bewegungspark",
  multifunktionsfeld: "Multifunktionsfeld",
  bolzplatz: "Bolzplatz",
  pumptrack: "Pumptrack",
  skatepark: "Skatepark",
  verkehrsgarten: "Verkehrsgarten",
  "toddler-barfuss-motorik": "Toddler / Barfuß / Motorik",

  zoo: "Zoo",
  tierpark: "Tierpark",
  wildpark: "Wildpark & Safaris",
  bauernhof: "Bauernhof",
  naturerlebnispfad: "Naturerlebnispfad",
  walderlebnisroute: "Walderlebnisroute",
  freilichtmuseum: "Freilichtmuseum",

  schwimmbad: "Schwimmbad",
  badesee: "Badesee",
  strand: "Familien-Strand",
  eisbahn: "Eisbahn",
  rodelhuegel: "Rodelhügel",

  freizeitpark: "Freizeitpark",
  trampolinpark: "Trampolinpark",
  kletterhalle: "Kletterhalle",
  "kletteranlage-outdoor": "Kletteranlage (Outdoor)",
  "kletterwald-hochseilgarten": "Kletterwald / Hochseilgarten",
  boulderpark: "Boulderpark",
  minigolf: "Minigolf",

  // ➕ NEU Erlebnis & Natur
  hoehle: "Höhle / Felsenwanderung",
  felsenwanderung: "Felsenwanderung",
  aussichtspunkt: "Aussichtspunkt / Panorama",
  baumhaus: "Baumhaus / Hütte",
  labyrinth: "Labyrinth / Irrgarten",
  klangpfad: "Natur-Klangpfad",
  "ueberdachter-spielplatz": "Überdachter Spielplatz",
  "dirtbike-track": "Dirtbike / Jugend-Bike Track",
  "streetball-platz": "Streetball / Basketball-Platz",
  "waldbaden-ort": "Waldbaden / Naturruheplatz",
  "natur-aussichtspunkt": "Natur-Aussichtspunkt",

  "wanderweg-kinderwagen": "Wanderweg (kinderwagenfreundlich)",
  "radweg-family": "Familien-Radweg",

  familiencafe: "Familiencafé",
  "kinder-familiencafe": "Kinder- & Familiencafé",
  "familien-restaurant": "Familien-Restaurant",

  "museum-kinder": "Museum (Kinder)",
  "kinder-museum": "Kinder-Museum",
  kinder_museum: "Kinder-Museum",
  bibliothek: "Bibliothek",

  "oeffentliche-toilette": "Öffentliche Toilette",
  wickelraum: "Wickelraum",

  "familien-event": "Familien-Event",

  "stellplatz-spielplatz-naehe-kostenlos":
    "Kostenloser Stellplatz (Spielplatznähe)",
  "wohnmobil-service-station": "Wohnmobil Service-Station",
  "rastplatz-spielplatz-dusche": "Rastplatz (Spielplatz + Dusche)",
  "bikepacking-spot": "Bikepacking-Spot",
  "campingplatz-familien": "Familien-Campingplatz",

  "park-garten": "Park / Garten",
  picknickwiese: "Picknickwiese"
};

export const CATEGORY_LABELS_EN = {
  spielplatz: "Playground",
  abenteuerspielplatz: "Adventure playground",
  "indoor-spielplatz": "Indoor playground",
  waldspielplatz: "Forest playground",
  wasserspielplatz: "Water playground",
  "barrierefreier-spielplatz": "Accessible playground",
  bewegungspark: "Movement park",
  multifunktionsfeld: "Multi-sport court",
  bolzplatz: "Soccer court",
  pumptrack: "Pumptrack",
  skatepark: "Skate park",
  verkehrsgarten: "Traffic training park",
  "toddler-barfuss-motorik": "Toddler / barefoot / motor skills",

  zoo: "Zoo",
  tierpark: "Animal park",
  wildpark: "Wildlife park & safaris",
  bauernhof: "Farm",
  naturerlebnispfad: "Nature discovery trail",
  walderlebnisroute: "Forest experience route",
  freilichtmuseum: "Open-air museum",

  schwimmbad: "Swimming pool",
  badesee: "Swimming lake",
  strand: "Family beach",
  eisbahn: "Ice rink",
  rodelhuegel: "Sledding hill",

  freizeitpark: "Theme park",
  trampolinpark: "Trampoline park",
  kletterhalle: "Climbing gym",
  "kletteranlage-outdoor": "Outdoor climbing area",
  "kletterwald-hochseilgarten": "Rope course / climbing forest",
  boulderpark: "Bouldering park",
  minigolf: "Mini golf",

  // ➕ NEU Erlebnis & Natur
  hoehle: "Cave / rock hike",
  felsenwanderung: "Rock hike",
  aussichtspunkt: "Scenic viewpoint / panorama",
  baumhaus: "Treehouse / lookout hut",
  labyrinth: "Maze / labyrinth",
  klangpfad: "Nature sound trail",
  "ueberdachter-spielplatz": "Covered playground / rain-safe playground",
  "dirtbike-track": "Dirtbike / youth bike track",
  "streetball-platz": "Streetball / basketball court",
  "waldbaden-ort": "Forest bathing / nature chill spot",
  "natur-aussichtspunkt": "Nature viewpoint",

  "wanderweg-kinderwagen": "Stroller-friendly trail",
  "radweg-family": "Family bike route",

  familiencafe: "Family café",
  "kinder-familiencafe": "Kids & family café",
  "familien-restaurant": "Family restaurant",

  "museum-kinder": "Museum (kids)",
  "kinder-museum": "Children's museum",
  kinder_museum: "Children's museum",
  bibliothek: "Library",

  "oeffentliche-toilette": "Public toilet",
  wickelraum: "Baby changing room",

  "familien-event": "Family event",

  "stellplatz-spielplatz-naehe-kostenlos":
    "Free RV spot (near playground)",
  "wohnmobil-service-station": "RV service station",
  "rastplatz-spielplatz-dusche": "Rest area (playground + shower)",
  "bikepacking-spot": "Bikepacking spot",
  "campingplatz-familien": "Family campground",

  "park-garten": "Park / garden",
  picknickwiese: "Picnic meadow"
};

// ------------------------------------------------------
// Texte & Onboarding-Keys
// ------------------------------------------------------

export const HEADER_TAGLINE_TEXT = {
  de: "Heute ist Zeit für Familie.",
  en: "Make today a family day."
};

// Onboarding-Hint (Kompass / Plus / Mein Tag)
export const COMPASS_PLUS_HINT_KEY = "fs_hint_compass_plus_v1";