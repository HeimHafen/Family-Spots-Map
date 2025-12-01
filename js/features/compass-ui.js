// js/features/compass-ui.js
// ---------------------------------------------
// Kompass + Travel-Mode – UI & Interaktion
// ---------------------------------------------

"use strict";

import { FEATURES, LANG_DE, LANG_EN } from "../config.js";

let compassSectionEl = null;
let btnToggleCompassEl = null;
let compassLabelEl = null;
let compassHelperEl = null;
let compassApplyLabelEl = null;
let compassApplyBtnEl = null;

let currentLang = LANG_DE;

// vom App-Shell übergebene Funktionen
let tFn = (key) => key;
let getTravelModeFn = null;
let setTravelModeFn = null;
let onCompassApplyFn = null;
let markHintSeenFn = null;

function activateOnEnterSpace(handler) {
  return (event) => {
    if (
      event.key === "Enter" ||
      event.key === " " ||
      event.key === "Spacebar"
    ) {
      event.preventDefault();
      handler(event);
    }
  };
}

function getTravelMode() {
  return typeof getTravelModeFn === "function"
    ? getTravelModeFn()
    : null;
}

function updateCompassButtonLabel() {
  if (!FEATURES.compass) return;
  if (!btnToggleCompassEl || !compassSectionEl) return;

  const span =
    btnToggleCompassEl.querySelector("span") || btnToggleCompassEl;
  const isOpen = !!compassSectionEl.open;
  const isDe = currentLang === LANG_DE;

  const showLabel = isDe ? "Kompass anzeigen" : "Show compass";
  const hideLabel = isDe ? "Kompass ausblenden" : "Hide compass";

  span.textContent = isOpen ? hideLabel : showLabel;
  btnToggleCompassEl.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

function updateCompassUI() {
  if (!FEATURES.compass) return;
  if (!compassApplyBtnEl) return;

  const mode = getTravelMode();
  const shouldShow = !!mode;

  compassApplyBtnEl.classList.toggle("hidden", !shouldShow);
}

export function updateCompassLanguage(lang) {
  currentLang = lang === LANG_EN ? LANG_EN : LANG_DE;

  if (!FEATURES.compass) return;

  if (compassLabelEl) {
    compassLabelEl.textContent = tFn("compass_title");
  }
  if (compassHelperEl) {
    compassHelperEl.textContent = tFn("compass_helper");
  }
  if (compassApplyLabelEl) {
    compassApplyLabelEl.textContent = tFn("compass_apply_label");
  }

  updateCompassButtonLabel();
  updateCompassUI();
}

function initTravelChips() {
  if (!FEATURES.travelMode) return;

  const chips = document.querySelectorAll(".travel-chip");
  if (!chips.length) return;

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const mode = chip.getAttribute("data-travel-mode") || "everyday";
      const current = getTravelMode();
      const willActivate = current !== mode;

      if (typeof setTravelModeFn === "function") {
        setTravelModeFn(willActivate ? mode : null);
      }

      chips.forEach((c) => {
        const isActive = willActivate && c === chip;
        c.classList.toggle("travel-chip--active", isActive);
        c.setAttribute("aria-pressed", isActive ? "true" : "false");
      });

      updateCompassUI();
    });
  });
}

export function initCompassUI({
  section,
  toggleButton,
  labelEl,
  helperEl,
  applyLabelEl,
  applyButton,
  t,
  initialLang,
  getTravelMode,
  setTravelMode,
  onCompassApply,
  markHintSeen
} = {}) {
  if (!FEATURES.compass) return;

  compassSectionEl = section || null;
  btnToggleCompassEl = toggleButton || null;
  compassLabelEl = labelEl || null;
  compassHelperEl = helperEl || null;
  compassApplyLabelEl = applyLabelEl || null;
  compassApplyBtnEl = applyButton || null;

  tFn = typeof t === "function" ? t : tFn;
  getTravelModeFn = getTravelMode || null;
  setTravelModeFn = setTravelMode || null;
  onCompassApplyFn = onCompassApply || null;
  markHintSeenFn = markHintSeen || null;

  currentLang = initialLang || LANG_DE;

  if (compassSectionEl && btnToggleCompassEl) {
    compassSectionEl.id = compassSectionEl.id || "compass-section";
    btnToggleCompassEl.setAttribute("aria-controls", compassSectionEl.id);
    btnToggleCompassEl.setAttribute(
      "aria-expanded",
      compassSectionEl.open ? "true" : "false"
    );

    const toggleCompassHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      compassSectionEl.open = !compassSectionEl.open;
      updateCompassButtonLabel();

      if (typeof markHintSeenFn === "function") {
        markHintSeenFn();
      }
    };

    btnToggleCompassEl.addEventListener("click", toggleCompassHandler);
    btnToggleCompassEl.addEventListener(
      "keydown",
      activateOnEnterSpace(toggleCompassHandler)
    );

    compassSectionEl.addEventListener("toggle", () => {
      updateCompassButtonLabel();
    });
  }

  if (compassApplyBtnEl && typeof onCompassApplyFn === "function") {
    compassApplyBtnEl.addEventListener("click", (ev) => {
      ev.preventDefault();
      onCompassApplyFn();
    });
  }

  initTravelChips();
  updateCompassLanguage(currentLang);
}