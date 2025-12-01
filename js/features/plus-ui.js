// js/features/plus-ui.js
// ---------------------------------------------
// Family Spots Plus – UI + Status-Handling
// ---------------------------------------------

"use strict";

import { FEATURES, LANG_DE, LANG_EN } from "../config.js";
import { getPlusStatus, formatPlusStatus, redeemPartnerCode } from "./plus.js";

let sectionEl = null;
let toggleBtnEl = null;
let codeInputEl = null;
let codeSubmitEl = null;
let statusTextEl = null;

let currentLang = LANG_DE;
let plusActive = false;

let showToastFn = null;
let tillaInstance = null;
let markHintSeenFn = null;
let onPlusStateChangedFn = null;

function updateToggleLabel() {
  if (!toggleBtnEl || !sectionEl) return;

  const target = toggleBtnEl.querySelector("span") || toggleBtnEl;
  const isOpen = !!sectionEl.open;
  const isDe = currentLang === LANG_DE;

  const showLabel = isDe ? "Anzeigen" : "Show";
  const hideLabel = isDe ? "Ausblenden" : "Hide";

  target.textContent = isOpen ? hideLabel : showLabel;
  toggleBtnEl.setAttribute("aria-expanded", isOpen ? "true" : "false");
}

function updatePlusStatusText(status) {
  if (!statusTextEl) return;

  if (!FEATURES.plus) {
    statusTextEl.textContent = "";
    return;
  }

  const s = status || getPlusStatus();
  statusTextEl.textContent = formatPlusStatus(s);
}

function loadPlusStateFromStorage() {
  if (!FEATURES.plus) {
    plusActive = false;
    updatePlusStatusText({ active: false, plan: null, validUntil: null });
    return;
  }

  try {
    const status = getPlusStatus();
    plusActive = !!status.active;
    updatePlusStatusText(status);
  } catch (err) {
    console.warn("[Family Spots] Konnte Plus-Status nicht laden:", err);
    plusActive = false;
    updatePlusStatusText({ active: false, plan: null, validUntil: null });
  }

  if (typeof onPlusStateChangedFn === "function") {
    onPlusStateChangedFn(plusActive);
  }
}

async function handlePlusCodeSubmit() {
  if (!FEATURES.plus) return;
  if (!codeInputEl || !statusTextEl) return;

  const raw = codeInputEl.value.trim();
  const result = await redeemPartnerCode(raw);

  if (!result.ok) {
    if (typeof showToastFn === "function") {
      if (result.reason === "empty") {
        showToastFn("plus_code_empty");
      } else if (result.reason === "invalid_days") {
        showToastFn("plus_code_unknown");
      } else {
        showToastFn("plus_code_unknown");
      }
    }
    return;
  }

  const status = result.status || getPlusStatus();
  plusActive = !!status.active;
  updatePlusStatusText(status);

  if (typeof showToastFn === "function") {
    showToastFn("plus_code_activated");
  }

  if (
    tillaInstance &&
    typeof tillaInstance.onPlusActivated === "function"
  ) {
    tillaInstance.onPlusActivated();
  }

  if (typeof onPlusStateChangedFn === "function") {
    onPlusStateChangedFn(plusActive);
  }
}

export function updatePlusLanguage(lang) {
  currentLang = lang === LANG_EN ? LANG_EN : LANG_DE;
  updatePlusStatusText();
  updateToggleLabel();
}

export function isPlusActive() {
  return !!plusActive;
}

export function initPlusUI({
  section,
  toggleButton,
  codeInput,
  codeSubmit,
  statusText,
  showToast,
  tilla,
  markHintSeen,
  onPlusStateChanged,
  initialLang
} = {}) {
  if (!FEATURES.plus) return;

  sectionEl = section || null;
  toggleBtnEl = toggleButton || null;
  codeInputEl = codeInput || null;
  codeSubmitEl = codeSubmit || null;
  statusTextEl = statusText || null;

  showToastFn = showToast || null;
  tillaInstance = tilla || null;
  markHintSeenFn = markHintSeen || null;
  onPlusStateChangedFn = onPlusStateChanged || null;

  currentLang = initialLang || LANG_DE;

  if (sectionEl && toggleBtnEl) {
    sectionEl.id = sectionEl.id || "plus-section";
    toggleBtnEl.setAttribute("aria-controls", sectionEl.id);

    const toggleHandler = (event) => {
      event.preventDefault();
      const isOpen = !sectionEl.open;
      sectionEl.open = isOpen;
      updateToggleLabel();

      if (typeof markHintSeenFn === "function") {
        markHintSeenFn();
      }
    };

    toggleBtnEl.addEventListener("click", toggleHandler);
    toggleBtnEl.addEventListener("keydown", (event) => {
      if (
        event.key === "Enter" ||
        event.key === " " ||
        event.key === "Spacebar"
      ) {
        event.preventDefault();
        toggleHandler(event);
      }
    });

    sectionEl.addEventListener("toggle", () => {
      updateToggleLabel();
    });
  }

  if (codeSubmitEl) {
    codeSubmitEl.addEventListener("click", () => {
      handlePlusCodeSubmit();
    });
  }

  updatePlusLanguage(currentLang);
  loadPlusStateFromStorage();
}