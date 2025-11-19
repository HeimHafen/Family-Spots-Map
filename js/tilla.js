// js/tilla.js
import { t } from "./i18n.js";

let container = null;
let initialized = false;

/**
 * Initialisiert Tilla einmalig und setzt sie fest oben in die Sidebar.
 * Sie soll eure Familie dauerhaft begleiten – nicht nur kurz aufpoppen.
 */
export function initTilla() {
  // nur einmal initialisieren, sonst flackert sie
  if (initialized) return;
  initialized = true;

  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  // Falls Tilla schon existiert (alte Version o.ä.), wiederverwenden
  const existing = sidebar.querySelector(".tilla-hint");
  if (existing) {
    container = existing;
  } else {
    container = document.createElement("div");
    container.className = "tilla-hint";
    // direkt ganz oben in der Sidebar
    sidebar.prepend(container);
  }

  // Standard-Text: Tilla ist immer als Begleiterin sichtbar
  showTillaMessage(
    t(
      "turtle_intro_1",
      "Hallo, ich bin Tilla – eure Schildkröten-Begleiterin für entspannte Familien-Abenteuer!"
    )
  );
}

/**
 * Zeigt eine Sprechblase für Tilla an.
 */
export function showTillaMessage(msg) {
  if (!container) return;

  container.innerHTML = `
    <div class="tilla-inner">
      <div class="tilla-emoji" aria-hidden="true">🐢</div>
      <div class="tilla-bubble">${msg}</div>
    </div>
  `;
  container.classList.add("tilla-hint--visible");
}

/**
 * Früher wurde Tilla hier ausgeblendet.
 * Jetzt bleibt sie bewusst sichtbar – damit sie immer mit euch unterwegs ist. 🐢
 * Die Funktion bleibt als No-Op erhalten, damit alte Aufrufe nichts kaputt machen.
 */
export function hideTilla() {
  // Kleine No-Op, damit ESLint keinen "leere Funktion"-Fehler wirft
  if (!container) return;
  // Früher: container.classList.remove("tilla-hint--visible");
  // Jetzt: Tilla bleibt sichtbar.
}