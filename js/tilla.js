// js/tilla.js
// Tilla – eure kleine Begleiterin in der App.
//
// Neu:
// - Reagiert auf Reise-Modus (Alltag / Unterwegs) über das Event "fsm:travelModeChanged"
// - Nutzt die aktuelle Sprache (DE / EN)
// - showTillaMessage bleibt als API erhalten (für app.js & ui.js)

import { getLanguage, t } from "./i18n.js";

let hasInit = false;
let lastRenderedText = null;

/**
 * Initialisiert Tilla:
 * - registriert Listener für Reise-Modus-Wechsel
 */
export function initTilla() {
  if (hasInit) return;
  hasInit = true;

  document.addEventListener("fsm:travelModeChanged", (event) => {
    const mode = event && event.detail ? event.detail.mode : null;
    handleTravelModeChange(mode);
  });
}

/**
 * Wird aufgerufen, wenn der Reise-Modus geändert wird.
 * mode: "everyday" | "trip" | null
 */
function handleTravelModeChange(mode) {
  const lang = getLanguage() || "de";
  const isDe = lang.toLowerCase().startsWith("de");

  let text = "";

  if (!mode) {
    // Reise-Modus wieder ausgeschaltet -> sanft zurück zur Grund-Einladung
    text = t(
      "turtle_intro_1",
      isDe
        ? "Hallo, ich bin Tilla – eure Schildkröten-Begleiterin für entspannte Familien-Abenteuer!"
        : "Hi, I’m Tilla – your turtle companion for slow & relaxed family adventures!"
    );
  } else if (mode === "everyday") {
    // Alltag
    text = isDe
      ? "Heute seid ihr im Alltags-Modus unterwegs – ich schaue nach Spots, die gut in euren Tag passen."
      : "Today you’re in everyday mode – I’ll look for spots that fit smoothly into your day.";
  } else if (mode === "trip") {
    // Unterwegs / Tour
    text = isDe
      ? "Unterwegs-Modus aktiviert – ich denke jetzt größer und suche gute Orte für eure Strecke."
      : "On-the-road mode activated – I’ll think bigger and look for great places along your route.";
  }

  if (text) {
    showTillaMessage(text);
  }
}

/**
 * Öffentliche Funktion:
 * Setzt Tillas Text im Sidebar-Kärtchen.
 * Wird z. B. von app.js (Sprachwechsel) und ui.js (wenn keine Spots passen) genutzt.
 */
export function showTillaMessage(text) {
  if (!text) return;

  const el = document.getElementById("tilla-sidebar-text");
  if (!el) return;

  // Verhindert unnötiges Flackern, wenn der gleiche Text nochmal gesetzt würde
  if (lastRenderedText === text) return;

  el.textContent = text;
  lastRenderedText = text;
}