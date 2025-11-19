// js/tilla.js
import { t } from "./i18n.js";

let container = null;
const SEEN_KEY = "fsm.tilla.seen.v1";
let initialized = false;

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
    // z.B. Safari Private Mode – ignorieren
  }
}

export function initTilla() {
  // WICHTIG: nur einmal initialisieren, sonst flackert sie
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