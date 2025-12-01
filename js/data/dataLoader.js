// js/data/dataLoader.js
"use strict";

// Wird von js/data.js importiert
export async function loadAppData() {
  // Pfad anpassen: hier Beispiel mit data/spots.json
  const response = await fetch("./data/spots.json"); // relativ zu index.html

  if (!response.ok) {
    throw new Error(`Konnte Spots nicht laden: ${response.status}`);
  }

  const json = await response.json();

  // json kann z.B. ein Array sein oder { spots: [...], index: {...} }
  const spots = Array.isArray(json) ? json : json.spots || [];
  const index = json.index || null;

  return { spots, index };
}