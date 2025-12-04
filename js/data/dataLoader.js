// js/data/dataLoader.js
// ------------------------------------------------------
// Lädt Rohdaten für Family Spots Map aus data/spots.json
//  - Wird von js/data.js verwendet
//  - Liefert immer ein Objekt { spots, index }
// ------------------------------------------------------

"use strict";

/**
 * @typedef {Object<string, any>} AppIndex
 */

/**
 * @typedef {Object} AppDataPayload
 * @property {any[]} spots
 * @property {AppIndex|null} index
 */

/** Pfad zur Datenquelle relativ zu index.html */
const SPOTS_DATA_URL = "./data/spots.json";

/**
 * Normalisiert den JSON-Response in ein konsistentes
 * AppData-Format { spots, index }.
 *
 * Unterstützte Formate von data/spots.json:
 *  - [ { ...Spot... }, ... ]
 *  - { spots: [ ... ], index: { ... } }
 *
 * Bei unerwarteter Struktur:
 *  - spots: []
 *  - index: null
 *
 * @param {any} json
 * @returns {AppDataPayload}
 */
function normalizeAppData(json) {
  /** @type {any[]} */
  let spots = [];
  /** @type {AppIndex|null} */
  let index = null;

  if (Array.isArray(json)) {
    // Altes / einfaches Format: reines Array von Spots
    spots = json;
  } else if (json && typeof json === "object") {
    // Objekt-Format: { spots: [...], index: {...} }
    if (Array.isArray(json.spots)) {
      spots = json.spots;
    }

    if (json.index && typeof json.index === "object") {
      index = json.index;
    }
  } else {
    // Vollkommen unerwartete Struktur → entwickeln freundlich loggen
    console.warn(
      "[Family Spots] Unerwartetes Format in spots.json – erwarte Array oder Objekt mit { spots, index }."
    );
  }

  return { spots, index };
}

/**
 * Lädt die App-Daten (Spots + optionale Index-Metadaten) aus JSON.
 *
 * Erwartete Formate von data/spots.json:
 *  - [ { ...Spot... }, ... ]
 *  - { spots: [ ... ], index: { ... } }
 *
 * Fehlerfälle:
 *  - Netzwerkproblem       → Error mit Hinweis "Netzwerkfehler"
 *  - HTTP-Status != 2xx    → Error mit HTTP-Code
 *  - Ungültiges JSON       → Error mit Hinweis "Ungültiges JSON-Format"
 *
 * @returns {Promise<AppDataPayload>}
 * @throws {Error} wenn Fetch oder JSON-Parsing fehlschlägt
 */
export async function loadAppData() {
  let response;

  // 1) Netzwerk/HTTP
  try {
    response = await fetch(SPOTS_DATA_URL);
  } catch (err) {
    throw new Error(
      `[Family Spots] Konnte Spots nicht laden (Netzwerkfehler): ${String(
        err
      )}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `[Family Spots] Konnte Spots nicht laden: HTTP ${response.status}`
    );
  }

  // 2) JSON-Parsing
  let json;
  try {
    json = await response.json();
  } catch (err) {
    throw new Error(
      `[Family Spots] Ungültiges JSON-Format in ${SPOTS_DATA_URL}: ${String(
        err
      )}`
    );
  }

  // 3) Struktur normalisieren
  return normalizeAppData(json);
}