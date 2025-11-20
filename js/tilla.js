// js/tilla.js
// Tilla – eure kleine Begleiterin in der App.
//
// Aktuell:
// - Kein Hero mehr auf der „Über“-Seite.
// - Nur noch Text-Steuerung für das Tilla-Kärtchen
//   oben in der Sidebar der Kartenansicht.

export function initTilla() {
  // Momentan keine zusätzliche Initialisierung nötig.
  // Der Basis-Text für Tilla wird in app.js
  // über updateStaticLanguageTexts gesetzt.
}

/**
 * Aktualisiert den Text in Tillas Sidebar-Karte.
 * Wird z. B. beim Sprachwechsel aufgerufen.
 *
 * @param {string} text – Der Text, den Tilla sagen soll.
 */
export function showTillaMessage(text) {
  if (!text) return;

  const el = document.getElementById("tilla-sidebar-text");
  if (el) {
    el.textContent = text;
  }
}