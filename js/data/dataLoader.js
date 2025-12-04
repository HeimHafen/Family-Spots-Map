// js/data/dataLoader.js
// ------------------------------------------------------
// Lädt Rohdaten für Family Spots Map aus data/spots.json
//  - Wird von js/data.js verwendet
//  - Liefert immer ein Objekt { spots, index }
// ------------------------------------------------------

"use strict";

/**
 * Lädt die App-Daten (Spots + optionale Index-Metadaten) aus JSON.
 *
 * Erwartete Formate von data/spots.json:
 *  - [ { ...Spot... }, ... ]
 *  - { spots: [ ... ], index: { ... } }
 *
 * @returns {Promise<{spots: any[], index: any}>}
 * @throws {Error} wenn Fetch oder JSON-Parsing fehlschlägt
 */
export async function loadAppData() {
  // Pfad relativ zu index.html
  const url = "./data/spots.json";

  let response;
  try {
    response = await fetch(url);
  } catch (err) {
    throw new Error(`Konnte Spots nicht laden (Netzwerkfehler): ${err}`);
  }

  if (!response.ok) {
    throw new Error(`Konnte Spots nicht laden: HTTP ${response.status}`);
  }

  let json;
  try {
    json = await response.json();
  } catch (err) {
    throw new Error(`Ungültiges JSON-Format in ${url}: ${err}`);
  }

  // json kann z.B. ein Array sein oder { spots: [...], index: {...} }
  let spots;
  let index = null;

  if (Array.isArray(json)) {
    spots = json;
  } else if (json && typeof json === "object") {
    spots = Array.isArray(json.spots) ? json.spots : [];
    index = json.index || null;
  } else {
    // Fallback bei völlig unerwarteter Struktur
    spots = [];
  }

  return { spots, index };
}