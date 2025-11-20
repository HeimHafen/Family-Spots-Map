// js/tilla.js
// Minimal-Version von Tilla, damit die App stabil läuft.
// Wir können sie später optisch im "Über"-Tab schön einbauen.

let currentMessage = null;

/**
 * Wird beim App-Start nach der Sprachinitialisierung aufgerufen.
 * Im Moment nur ein kleiner Log, damit nichts kaputt geht.
 */
export function initTilla() {
  const lang = (document.documentElement.lang || "de").toLowerCase();
  const isDe = lang.startsWith("de");

  const defaultText = isDe
    ? "Hallo, ich bin Tilla – eure Schildkröten-Begleiterin für entspannte Familien-Abenteuer!"
    : "Hi, I’m Tilla – your turtle companion for relaxed family adventures!";

  showTillaMessage(defaultText);
}

/**
 * Kann von außen aufgerufen werden, z. B. wenn die Sprache gewechselt wird.
 * Aktuell: nur im Hintergrund merken + in der Konsole loggen,
 * damit kein DOM-Element erforderlich ist.
 */
export function showTillaMessage(text) {
  currentMessage = text || "";
  // Für späteres Debuggen
  console.log("[Tilla]", currentMessage);
}

/**
 * Kleine Helper-Funktion, falls wir später irgendwo
 * den aktuell gesetzten Text brauchen.
 */
export function getCurrentTillaMessage() {
  return currentMessage;
}