// js/init.js
// ======================================================
// Family Spots Map – Bootstrap (Variante A)
// - Entfernt Inline-Module aus HTML (AppStore-freundlicher)
// - Verdrahtet kleine DOM-only Features (Menu-Bridge, Onboarding, Spots-Liste)
// - Startet die eigentliche App deterministisch (startApp aus app.js)
// ======================================================

"use strict";

import "./ui/details-summary-fix.js";
import { startApp } from "./app.js";

const STORAGE = {
  onboardingDismissed: "fsm_onboarding_dismissed",
  spotsExpanded: "fsm_spots_expanded"
};

function storageGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key, value) {
  try { localStorage.setItem(key, value); return true; } catch { return false; }
}

function wireMenuToggleViewBridge() {
  const menuBtn = document.getElementById("btn-toggle-view-menu");
  const viewBtn = document.getElementById("btn-toggle-view");
  const labelEl = document.getElementById("menu-toggle-view-label");
  const sidebar = document.querySelector(".sidebar");

  if (!menuBtn || !viewBtn) return;

  const updateLabel = () => {
    if (!labelEl || !sidebar) return;
    const hidden = sidebar.classList.contains("hidden");

    labelEl.textContent = hidden ? "Liste anzeigen" : "Nur Karte";
    labelEl.setAttribute("data-i18n-de", hidden ? "Liste anzeigen" : "Nur Karte");
    labelEl.setAttribute("data-i18n-en", hidden ? "Show list" : "Map only");
    labelEl.setAttribute("data-i18n-da", hidden ? "Vis liste" : "Kun kort");
  };

  menuBtn.addEventListener("click", () => {
    viewBtn.click();
    updateLabel();
  });

  updateLabel();
}

function wireOnboardingHint() {
  const hint = document.querySelector("[data-onboarding-hint]");
  if (!hint) return;

  const dismissed = storageGet(STORAGE.onboardingDismissed) === "1";
  if (dismissed) {
    hint.hidden = true;
    hint.setAttribute("aria-hidden", "true");
    return;
  }

  const closeBtn =
    hint.querySelector("[data-onboarding-close]") ||
    hint.querySelector(".fsm-onboarding-hint__close");

  if (!closeBtn) return;

  closeBtn.addEventListener("click", () => {
    storageSet(STORAGE.onboardingDismissed, "1");
    hint.hidden = true;
    hint.setAttribute("aria-hidden", "true");
  });
}

function wireSpotsToggle() {
  const btn = document.getElementById("btn-toggle-spots");
  const list = document.getElementById("spot-list");
  if (!btn || !list) return;

  const spanHide = btn.querySelector('span[data-state="hide"]');
  const spanShow = btn.querySelector('span[data-state="show"]');

  const setExpanded = (expanded) => {
    btn.setAttribute("aria-expanded", expanded ? "true" : "false");
    list.hidden = !expanded;

    if (spanHide && spanShow) {
      spanShow.classList.toggle("hidden", expanded);
      spanHide.classList.toggle("hidden", !expanded);
    }

    storageSet(STORAGE.spotsExpanded, expanded ? "1" : "0");
  };

  const stored = storageGet(STORAGE.spotsExpanded);
  const expanded = stored == null ? true : stored === "1";
  setExpanded(expanded);

  btn.addEventListener("click", () => {
    const isExpanded = btn.getAttribute("aria-expanded") === "true";
    setExpanded(!isExpanded);
  });
}

function assertLeaflet() {
  // Bei Variante A muss Leaflet global verfügbar sein (window.L)
  if (!window.L) {
    const toast = document.getElementById("toast");
    if (toast) toast.textContent = "Kartenfunktion konnte nicht geladen werden (Leaflet fehlt).";
  }
}

async function bootstrap() {
  wireMenuToggleViewBridge();
  wireOnboardingHint();
  wireSpotsToggle();

  assertLeaflet();
  await startApp();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => { bootstrap(); }, { once: true });
} else {
  bootstrap();
}