// js/tilla.js
import { t } from "./i18n.js";

let container = null;

// Version hochgezählt, damit Tilla bei allen Geräten noch mal erscheint
const SEEN_KEY = "fsm.tilla.seen.v2";

function hasSeen() {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "true";
  } catch (e) {
    return false;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "true");
  } catch (e) {
    // absichtlich ignoriert (z.B. Safari Private Mode)
  }
}

export function initTilla() {
  // Nur im Browser
  if (typeof document === "undefined") return;

  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  if (!container) {
    container = document.createElement("div");
    container.className = "tilla-hint";
    // Ganz oben in der Sidebar
    sidebar.prepend(container);
  }

  // Beim ersten Mal automatisch Begrüßung anzeigen
  if (!hasSeen()) {
    showTillaMessage(
      t(
        "turtle_intro_1",
        "Hallo, ich bin Tilla – eure Schildkröten-Begleiterin für entspannte Familien-Abenteuer!"
      )
    );
    markSeen();
  }
}

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

export function hideTilla() {
  if (!container) return;
  container.classList.remove("tilla-hint--visible");
}