// js/tilla.js
import { t } from "./i18n.js";

let container = null;
const SEEN_KEY = "fsm.tilla.seen.v1";

function hasSeen() {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "true");
  } catch {
    // z.B. Safari Private Mode – ignorieren
  }
}

/**
 * Tilla initialisieren – wird aus app.js nach DOMContentLoaded aufgerufen.
 * Sie sitzt immer ganz oben in der Sidebar, direkt vor dem Familien-Kompass.
 */
export function initTilla() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  // Container nur einmal anlegen
  if (!container) {
    container = document.createElement("div");
    container.className = "tilla-hint";
    sidebar.prepend(container);
  }

  const alreadySeen = hasSeen();

  // Erster Besuch: Intro 1, danach Intro 2
  const message = alreadySeen
    ? t(
        "turtle_intro_2",
        "Ich bin da, wenn ihr nicht wisst, wohin – oder es heute einfach langsam angehen wollt. 🐢💛"
      )
    : t(
        "turtle_intro_1",
        "Hallo, ich bin Tilla – eure Schildkröten-Begleiterin für entspannte Familien-Abenteuer!"
      );

  showTillaMessage(message);

  if (!alreadySeen) {
    markSeen();
  }
}

/**
 * Zeigt eine beliebige Nachricht in der Tilla-Bubble an.
 */
export function showTillaMessage(msg) {
  if (!container) return;

  container.innerHTML = `
    <div class="tilla-inner">
      <div class="tilla-emoji" aria-hidden="true">🐢</div>
      <div class="tilla-bubble">${msg}</div>
    </div>
  `;
}

/**
 * Blend Tilla komplett aus (momentan nirgendwo automatisch genutzt).
 */
export function hideTilla() {
  if (!container) return;
  container.style.display = "none";
}