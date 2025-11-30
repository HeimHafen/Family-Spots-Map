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

/** 0–4 → Radius in km, Infinity = kein Limit */
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
    "walderlebnisroute"
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
    "familien-event",

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
  "Lernen & Kultur": [
    "museum-kinder",
    "kinder-museum",
    "freilichtmuseum",
    "bibliothek"
  ],
  "Praktisches": ["oeffentliche-toilette", "wickelraum"],
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

  // ➕ NEU
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

  trampolinpark: "Trampolinpark",
  kletterhalle: "Kletterhalle",
  "kletteranlage-outdoor": "Kletteranlage (Outdoor)",
  "kletterwald-hochseilgarten": "Kletterwald / Hochseilgarten",
  boulderpark: "Boulderpark",
  minigolf: "Minigolf",
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
  "wohnmobil-service-station": "Wohnmobil-Service-Station",
  "rastplatz-spielplatz-dusche": "Rastplatz (Spielplatz & Dusche)",
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
  bewegungspark: "Activity park",
  multifunktionsfeld: "Multi-sport court",
  bolzplatz: "Soccer pitch",
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

  // ➕ NEU
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

  trampolinpark: "Trampoline park",
  kletterhalle: "Climbing gym",
  "kletteranlage-outdoor": "Outdoor climbing area",
  "kletterwald-hochseilgarten": "Rope course / climbing forest",
  boulderpark: "Bouldering park",
  minigolf: "Mini golf",
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
  "rastplatz-spielplatz-dusche": "Rest area (playground & shower)",
  "bikepacking-spot": "Bikepacking spot",
  "campingplatz-familien": "Family campground",
  "park-garten": "Park / garden",
  picknickwiese: "Picnic meadow"
};

// ------------------------------------------------------
// Kategorie-Tags (für Filter-Logik)
// ------------------------------------------------------

export const CATEGORY_TAGS = {
  spielplatz: ["playground", "outdoor", "all-ages", "family-friendly"],
  abenteuerspielplatz: [
    "playground",
    "adventure",
    "outdoor",
    "older-kids",
    "family-friendly"
  ],
  "indoor-spielplatz": [
    "playground",
    "indoor",
    "bad-weather",
    "younger-kids",
    "family-friendly"
  ],
  waldspielplatz: [
    "playground",
    "outdoor",
    "forest",
    "nature",
    "family-friendly"
  ],
  wasserspielplatz: [
    "playground",
    "water",
    "outdoor",
    "summer",
    "family-friendly"
  ],
  "barrierefreier-spielplatz": [
    "playground",
    "accessible",
    "wheelchair",
    "outdoor",
    "family-friendly"
  ],
  bewegungspark: [
    "playground",
    "sport",
    "fitness",
    "outdoor",
    "family-friendly"
  ],
  multifunktionsfeld: ["sport", "ball-sports", "outdoor", "family-friendly"],
  bolzplatz: ["sport", "soccer", "outdoor", "family-friendly"],
  pumptrack: ["sport", "bike", "pumptrack", "outdoor", "family-friendly"],
  skatepark: ["sport", "skate", "bikes", "outdoor", "teen-friendly"],
  verkehrsgarten: [
    "playground",
    "traffic-training",
    "bikes",
    "learning",
    "outdoor",
    "family-friendly"
  ],
  "toddler-barfuss-motorik": [
    "playground",
    "toddler-friendly",
    "sensory",
    "barefoot",
    "family-friendly"
  ],

  zoo: [
    "animals",
    "zoo",
    "full-day",
    "paid",
    "stroller-friendly",
    "family-friendly"
  ],
  tierpark: ["animals", "petting-zoo", "outdoor", "family-friendly"],
  wildpark: ["animals", "wildlife", "nature", "outdoor", "family-friendly"],
  bauernhof: [
    "animals",
    "farm",
    "petting-zoo",
    "nature",
    "outdoor",
    "family-friendly"
  ],
  naturerlebnispfad: [
    "hiking",
    "learning",
    "nature",
    "outdoor",
    "kids-friendly",
    "family-friendly"
  ],
  walderlebnisroute: [
    "hiking",
    "forest",
    "nature",
    "learning",
    "outdoor",
    "family-friendly"
  ],

  freilichtmuseum: [
    "museum",
    "outdoor",
    "history",
    "culture",
    "learning",
    "family-friendly"
  ],

  schwimmbad: [
    "water",
    "swimming",
    "sport",
    "indoor-or-outdoor",
    "family-friendly"
  ],
  badesee: [
    "water",
    "swimming",
    "lake",
    "outdoor",
    "summer",
    "nature",
    "family-friendly"
  ],
  strand: [
    "water",
    "beach",
    "outdoor",
    "summer",
    "family-friendly"
  ],
  eisbahn: [
    "ice-skating",
    "winter",
    "sport",
    "seasonal",
    "family-friendly"
  ],
  rodelhuegel: [
    "sledding",
    "winter",
    "snow",
    "outdoor",
    "family-friendly"
  ],

  freizeitpark: [
    "theme-park",
    "rides",
    "full-day",
    "paid",
    "family-friendly"
  ],
  trampolinpark: [
    "trampoline",
    "sport",
    "indoor",
    "bad-weather",
    "family-friendly"
  ],
  kletterhalle: [
    "climbing",
    "indoor",
    "sport",
    "bad-weather",
    "family-friendly"
  ],
  "kletteranlage-outdoor": [
    "climbing",
    "outdoor",
    "sport",
    "family-friendly"
  ],
  "kletterwald-hochseilgarten": [
    "climbing",
    "rope-course",
    "adventure",
    "outdoor",
    "family-friendly"
  ],
  boulderpark: ["climbing", "bouldering", "sport", "family-friendly"],
  minigolf: ["sport", "mini-golf", "game", "family-friendly"],

  hoehle: [
    "hiking",
    "adventure",
    "nature",
    "outdoor",
    "older-kids",
    "family-friendly"
  ],
  felsenwanderung: [
    "hiking",
    "adventure",
    "nature",
    "outdoor",
    "family-friendly"
  ],
  aussichtspunkt: [
    "nature",
    "viewpoint",
    "outdoor",
    "relax",
    "family-friendly"
  ],
  baumhaus: [
    "playground",
    "viewpoint",
    "adventure",
    "outdoor",
    "family-friendly"
  ],
  labyrinth: ["game", "maze", "adventure", "family-friendly"],
  klangpfad: [
    "nature",
    "learning",
    "sensory",
    "outdoor",
    "family-friendly"
  ],
  "ueberdachter-spielplatz": [
    "playground",
    "outdoor",
    "covered",
    "rain-safe",
    "family-friendly"
  ],
  "dirtbike-track": [
    "sport",
    "bike",
    "dirtbike",
    "outdoor",
    "teen-friendly"
  ],
  "streetball-platz": [
    "sport",
    "basketball",
    "streetball",
    "outdoor",
    "teen-friendly"
  ],
  "waldbaden-ort": [
    "nature",
    "forest",
    "relax",
    "quiet",
    "outdoor",
    "family-friendly"
  ],
  "natur-aussichtspunkt": [
    "nature",
    "viewpoint",
    "outdoor",
    "family-friendly"
  ],

  "wanderweg-kinderwagen": [
    "hiking",
    "stroller-friendly",
    "outdoor",
    "nature",
    "family-friendly"
  ],
  "radweg-family": [
    "cycling",
    "family-route",
    "outdoor",
    "family-friendly"
  ],

  familiencafe: ["food", "cafe", "indoor", "family-friendly"],
  "kinder-familiencafe": [
    "food",
    "cafe",
    "indoor",
    "kids-area",
    "family-friendly"
  ],
  "familien-restaurant": ["food", "restaurant", "indoor", "family-friendly"],

  "museum-kinder": [
    "museum",
    "indoor",
    "learning",
    "kids-friendly",
    "bad-weather",
    "family-friendly"
  ],
  "kinder-museum": [
    "museum",
    "indoor",
    "learning",
    "kids-friendly",
    "bad-weather",
    "family-friendly"
  ],
  bibliothek: [
    "library",
    "indoor",
    "quiet",
    "books",
    "learning",
    "bad-weather",
    "family-friendly"
  ],

  "oeffentliche-toilette": ["infrastructure", "toilet"],
  wickelraum: ["infrastructure", "baby-changing", "indoor"],

  "familien-event": ["event", "temporary", "family-friendly"],

  "stellplatz-spielplatz-naehe-kostenlos": [
    "rv",
    "free",
    "playground-nearby",
    "overnight",
    "infrastructure",
    "travel"
  ],
  "wohnmobil-service-station": [
    "rv",
    "service",
    "dump-station",
    "water",
    "infrastructure",
    "travel"
  ],
  "rastplatz-spielplatz-dusche": [
    "rest-area",
    "highway",
    "playground",
    "toilet",
    "shower",
    "infrastructure",
    "travel",
    "family-friendly"
  ],
  "bikepacking-spot": [
    "bikepacking",
    "overnight",
    "minimal-infrastructure",
    "nature",
    "outdoor",
    "travel"
  ],
  "campingplatz-familien": [
    "camping",
    "overnight",
    "nature",
    "travel",
    "family-friendly"
  ],

  "park-garten": [
    "park",
    "nature",
    "relax",
    "outdoor",
    "picnic-possible",
    "family-friendly"
  ],
  picknickwiese: [
    "picnic",
    "nature",
    "relax",
    "outdoor",
    "family-friendly"
  ]
};

// ------------------------------------------------------
// Filter-Chips (Mapping Filter → Tags)
// ------------------------------------------------------

export const FILTERS = [
  {
    id: "bad-weather",
    tags: ["indoor", "bad-weather"],
    label: {
      de: "Schlechtwetter",
      en: "Bad weather"
    }
  },
  {
    id: "toddlers",
    tags: ["toddler-friendly", "younger-kids", "sensory", "barefoot"],
    label: {
      de: "Kleinkinder",
      en: "Toddlers"
    }
  },
  {
    id: "older-kids-teens",
    tags: ["older-kids", "teen-friendly", "skate", "pumptrack", "climbing", "bouldering"],
    label: {
      de: "Größere Kinder & Teens",
      en: "Older kids & teens"
    }
  },
  {
    id: "accessible",
    tags: ["accessible", "wheelchair"],
    label: {
      de: "Barrierefrei",
      en: "Accessible"
    }
  },
  {
    id: "stroller-friendly",
    tags: ["stroller-friendly"],
    label: {
      de: "Kinderwagen-tauglich",
      en: "Stroller-friendly"
    }
  },
  {
    id: "animals",
    tags: ["animals", "zoo", "wildlife", "petting-zoo", "farm"],
    label: {
      de: "Tiere",
      en: "Animals"
    }
  },
  {
    id: "water-fun",
    tags: ["water", "swimming", "lake", "beach"],
    label: {
      de: "Wasser & Baden",
      en: "Water & swimming"
    }
  },
  {
    id: "winter-fun",
    tags: ["winter", "snow", "ice-skating", "sledding"],
    label: {
      de: "Winter & Schnee",
      en: "Winter & snow"
    }
  },
  {
    id: "rv-vanlife",
    tags: ["rv", "rest-area", "dump-station", "service", "travel"],
    label: {
      de: "WoMo & Vanlife",
      en: "RV & vanlife"
    }
  },
  {
    id: "overnight-outdoor",
    tags: ["camping", "bikepacking", "overnight"],
    label: {
      de: "Mit Übernachtung",
      en: "With overnight stay"
    }
  },
  {
    id: "full-day",
    tags: ["full-day", "theme-park"],
    label: {
      de: "Ganztages-Ausflug",
      en: "Full-day trip"
    }
  },
  {
    id: "low-budget",
    tags: ["free"],
    label: {
      de: "Günstig / kostenlos",
      en: "Low budget / free"
    }
  }
];

// ------------------------------------------------------
// Texte & Onboarding-Keys
// ------------------------------------------------------

export const HEADER_TAGLINE_TEXT = {
  de: "Heute ist Zeit für Familie.",
  en: "Make today a family day."
};

// Onboarding-Hint (Kompass / Plus / Mein Tag)
export const COMPASS_PLUS_HINT_KEY = "fs_hint_compass_plus_v1";

// ------------------------------------------------------
// Abos & Add-ons (Subscription-Modell)
// ------------------------------------------------------

/**
 * Basis-Abos (z. B. 19,90 €/Jahr)
 * – aktuell 1 Abo: "Family Spots Plus"
 */
export const SUBSCRIPTIONS = Object.freeze({
  family_plus: {
    id: "family_plus",
    type: "subscription",
    pricePerYear: 19.9,
    currency: "EUR",
    label: {
      de: "Family Spots Plus",
      en: "Family Spots Plus"
    },
    shortLabel: {
      de: "Plus",
      en: "Plus"
    },
    description: {
      de: "Schaltet zusätzliche Spots, Kategorien und Komfort-Funktionen für Familien frei.",
      en: "Unlocks additional spots, categories and comfort features for families."
    },
    benefits: [
      {
        id: "more_spots",
        label: {
          de: "Mehr sorgfältig kuratierte Spots & Regionen",
          en: "More carefully curated spots & regions"
        }
      },
      {
        id: "special_categories",
        label: {
          de: "Spezielle Kategorien wie WoMo-Spots, Bikepacking & Routen",
          en: "Special categories such as RV spots, bikepacking & routes"
        }
      },
      {
        id: "support_project",
        label: {
          de: "Unterstützt die Weiterentwicklung von Family Spots Map",
          en: "Supports the ongoing development of Family Spots Map"
        }
      }
    ]
  }
});

/**
 * Add-ons (z. B. 2,99 €/Jahr) – an ein Basis-Abo gebunden.
 */
export const ADDONS = Object.freeze({
  addon_water: {
    id: "addon_water",
    type: "addon",
    requiresSubscriptionId: "family_plus",
    pricePerYear: 2.99,
    currency: "EUR",
    label: {
      de: "Wasser & Baden Add-on",
      en: "Water & swimming add-on"
    },
    description: {
      de: "Besondere Wasser-Spots, Badeseen & familienfreundliche Badeplätze.",
      en: "Special water spots, swimming lakes and family-friendly bathing places."
    },
    categories: [
      "badesee",
      "strand",
      "wasserspielplatz",
      "schwimmbad"
    ]
  },

  addon_rv: {
    id: "addon_rv",
    type: "addon",
    requiresSubscriptionId: "family_plus",
    pricePerYear: 2.99,
    currency: "EUR",
    label: {
      de: "WoMo & Vanlife Add-on",
      en: "RV & vanlife add-on"
    },
    description: {
      de: "Extra-Spots für Reisen mit Wohnmobil, Camper & Rad.",
      en: "Extra spots for travelling with RV, camper and bike."
    },
    categories: [
      "stellplatz-spielplatz-naehe-kostenlos",
      "wohnmobil-service-station",
      "rastplatz-spielplatz-dusche",
      "bikepacking-spot",
      "campingplatz-familien"
    ]
  }
});

/**
 * Zugriffsregeln pro Kategorie:
 *
 *  - level: "free" | "subscription" | "addon"
 *  - subscriptionId: wenn "subscription" oder "addon"
 *  - addonId: wenn level === "addon"
 *
 * Default ist "free", falls Kategorie hier nicht eingetragen ist.
 */
export const CATEGORY_ACCESS = Object.freeze({
  defaultLevel: "free",
  perCategory: {
    // ---------- Nur mit Basis-Abo (Family Spots Plus) ----------
    freizeitpark: {
      level: "subscription",
      subscriptionId: "family_plus"
    },
    trampolinpark: {
      level: "subscription",
      subscriptionId: "family_plus"
    },
    "kletterwald-hochseilgarten": {
      level: "subscription",
      subscriptionId: "family_plus"
    },

    // ---------- Add-on: Wasser & Baden ----------
    badesee: {
      level: "addon",
      subscriptionId: "family_plus",
      addonId: "addon_water"
    },
    strand: {
      level: "addon",
      subscriptionId: "family_plus",
      addonId: "addon_water"
    },
    wasserspielplatz: {
      level: "addon",
      subscriptionId: "family_plus",
      addonId: "addon_water"
    },
    schwimmbad: {
      level: "addon",
      subscriptionId: "family_plus",
      addonId: "addon_water"
    },

    // ---------- Add-on: WoMo & Vanlife ----------
    "stellplatz-spielplatz-naehe-kostenlos": {
      level: "addon",
      subscriptionId: "family_plus",
      addonId: "addon_rv"
    },
    "wohnmobil-service-station": {
      level: "addon",
      subscriptionId: "family_plus",
      addonId: "addon_rv"
    },
    "rastplatz-spielplatz-dusche": {
      level: "addon",
      subscriptionId: "family_plus",
      addonId: "addon_rv"
    },
    "bikepacking-spot": {
      level: "addon",
      subscriptionId: "family_plus",
      addonId: "addon_rv"
    },
    "campingplatz-familien": {
      level: "addon",
      subscriptionId: "family_plus",
      addonId: "addon_rv"
    }

    // ➕ weitere Kategorien kannst du hier jederzeit ergänzen
  }
});