// js/tilla.js

import { t } from "./i18n.js";

let container = null;
let seenKey = "fsm.tilla.seen.v1";

function hasSeen() {
  try {
    return localStorage.getItem(seenKey) === "true";
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    localStorage.setItem(seenKey, "true");
  } catch {}
}

export function initTilla() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  container = document.createElement("div");
  container.className = "tilla-hint";
  sidebar.prepend(container);
  if (!hasSeen()) {
    showTillaMessage(t("turtle_intro_1", "Hallo, ich bin Tilla, eure Schildkröten‑Begleiterin für entspannte Familien‑Abenteuer!"));
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