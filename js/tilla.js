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
    // Safari Private Mode o.ä. – ignorieren
  }
}

// Öffentliche API
export function initTilla() {
  // Schutz: nur einmal initialisieren,
  // sonst flackert sie, wenn initTilla doppelt aufgerufen wird.
  if (initialized) return;
  initialized = true;

  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  // Falls es schon ein .tilla-hint Element gibt (z.B. aus altem HTML),
  // wiederverwenden.
  const existing = sidebar.querySelector(".tilla-hint");
  if (existing) {
    container = existing;
  } else {
    container = document.createElement("div");
    container.className = "tilla-hint";
    // Tilla ganz oben in der Sidebar vor den Kompass
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