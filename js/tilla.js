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
    // z. B. Safari Private Mode – ignorieren
  }
}

export function initTilla() {
  // nur einmal initialisieren
  if (initialized) return;
  initialized = true;

  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  // vorhandenen Container wiederverwenden oder neu anlegen
  const existing = sidebar.querySelector(".tilla-hint");
  if (existing) {
    container = existing;
  } else {
    container = document.createElement("div");
    container.className = "tilla-hint";
    // ganz oben in der Sidebar
    sidebar.prepend(container);
  }

  const firstTime = !hasSeen();

  // Tilla-Standardbotschaft (immer sichtbar, nicht nur beim ersten Mal)
  showTillaMessage(
    t(
      "turtle_intro_1",
      "Hallo, ich bin Tilla – eure Schildkröten-Begleiterin für entspannte Familien-Abenteuer!"
    )
  );

  if (firstTime) {
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