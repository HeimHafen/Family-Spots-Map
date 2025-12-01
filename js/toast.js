// js/toast.js
// =======================================
// Toast-Benachrichtigungen
// =======================================

"use strict";

let toastEl = null;
let toastTimeoutId = null;
let translateFn = null;

/**
 * Initialisiert das Toast-System.
 * @param {Object} options
 * @param {HTMLElement} options.element   – das #toast-Element
 * @param {(key:string)=>string} [options.t] – Übersetzungsfunktion (optional)
 */
export function initToast({ element, t } = {}) {
  toastEl = element || toastEl;
  translateFn = typeof t === "function" ? t : null;
}

/**
 * Zeigt eine Toast-Nachricht an.
 * @param {string} keyOrMessage – Entweder fertiger Text oder i18n-Key
 */
export function showToast(keyOrMessage) {
  if (!toastEl) return;

  let message = keyOrMessage || "…";

  if (translateFn) {
    const translated = translateFn(keyOrMessage);
    if (translated) {
      message = translated;
    }
  }

  toastEl.textContent = message;
  toastEl.classList.add("toast--visible");

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }

  toastTimeoutId = window.setTimeout(() => {
    toastEl.classList.remove("toast--visible");
  }, 3200);
}