// js/features/plus.js
// ------------------------------------------------------
// Family Spots / ABF 2026 – Plus & Add-ons (lokale Logik)
// ------------------------------------------------------

"use strict";

import {
  PLUS_STORAGE_KEY,
  DEV_FORCE_PLUS,
  SUBSCRIPTIONS,
  ADDONS,
  CATEGORY_ACCESS
} from "../config.js";

/**
 * @typedef {import("../config.js").LangCode} LangCode
 */

/**
 * @typedef {Object} PlusStatus
 * @property {boolean} active
 * @property {string|null} plan            // z. B. "family_plus"
 * @property {string[]|null} addons        // z. B. ["addon_abf"]
 * @property {string|null} validUntil      // optionales ISO-Datum als String
 * @property {string|null} partner         // z. B. "abf"
 * @property {string|null} source          // z. B. "partner_code" | "dev"
 */

// ------------------------------------------------------
// Default-Status
// ------------------------------------------------------

/** @type {PlusStatus} */
const DEFAULT_STATUS = Object.freeze({
  active: false,
  plan: null,
  addons: [],
  validUntil: null,
  partner: null,
  source: null
});

// ------------------------------------------------------
// Kleine Helfer
// ------------------------------------------------------

/**
 * Aktuelle Sprache aus globalem I18N (fallback: "de").
 * @returns {LangCode}
 */
function getCurrentLang() {
  try {
    if (typeof I18N !== "undefined" && typeof I18N.getLanguage === "function") {
      const lang = I18N.getLanguage();
      if (lang === "en" || lang === "da") return lang;
    }
  } catch {
    // ignore
  }
  return "de";
}

/**
 * Status aus localStorage lesen.
 * @returns {PlusStatus}
 */
function readStatusFromStorage() {
  try {
    if (typeof localStorage === "undefined") return DEFAULT_STATUS;
    const raw = localStorage.getItem(PLUS_STORAGE_KEY);
    if (!raw) return DEFAULT_STATUS;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return DEFAULT_STATUS;

    /** @type {PlusStatus} */
    const status = {
      active: !!parsed.active,
      plan: typeof parsed.plan === "string" ? parsed.plan : null,
      addons: Array.isArray(parsed.addons) ? parsed.addons : [],
      validUntil: typeof parsed.validUntil === "string" ? parsed.validUntil : null,
      partner: typeof parsed.partner === "string" ? parsed.partner : null,
      source: typeof parsed.source === "string" ? parsed.source : null
    };

    return status;
  } catch {
    return DEFAULT_STATUS;
  }
}

/**
 * Status in localStorage schreiben.
 * @param {PlusStatus} status
 */
function writeStatusToStorage(status) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(PLUS_STORAGE_KEY, JSON.stringify(status));
  } catch {
    // Storage optional – bei Fehler einfach weiterlaufen
  }
}

/**
 * Dev-Status, wenn DEV_FORCE_PLUS aktiv ist.
 * Schaltet Plus + alle Add-ons frei.
 * @returns {PlusStatus}
 */
function createDevStatus() {
  const allAddonIds = Object.keys(ADDONS || {});
  return {
    active: true,
    plan: "family_plus",
    addons: allAddonIds,
    validUntil: null,
    partner: "dev",
    source: "dev"
  };
}

// ------------------------------------------------------
// Public API
// ------------------------------------------------------

/**
 * Liefert den aktuellen Plus-Status.
 * Berücksichtigt DEV_FORCE_PLUS.
 * @returns {PlusStatus}
 */
export function getPlusStatus() {
  if (DEV_FORCE_PLUS) {
    return createDevStatus();
  }

  const status = readStatusFromStorage();

  // Optional: einfache Ablaufprüfung (falls du später ein Datum hinterlegen willst)
  if (status.validUntil) {
    const now = Date.now();
    const until = Date.parse(status.validUntil);
    if (!Number.isNaN(until) && now > until) {
      // Abgelaufen → zurücksetzen
      return DEFAULT_STATUS;
    }
  }

  return status;
}

/**
 * Convenience-Flag.
 * @returns {boolean}
 */
export function isPlusActive() {
  return !!getPlusStatus().active;
}

/**
 * Formatiert eine kurze Status-Zeile für die UI (Plus-Box).
 * @param {PlusStatus} [status]
 * @returns {string}
 */
export function formatPlusStatus(status) {
  const s = status || getPlusStatus();
  const lang = getCurrentLang();

  if (!s.active) {
    if (lang === "en") return "Plus not active";
    if (lang === "da") return "Plus er ikke aktiv";
    return "Plus ist nicht aktiv";
  }

  // Plan-Label
  let planLabel = "Family Spots Plus";
  if (s.plan && SUBSCRIPTIONS && SUBSCRIPTIONS[s.plan]) {
    const cfg = SUBSCRIPTIONS[s.plan];
    planLabel = cfg.label[lang] || cfg.label.de || planLabel;
  }

  // Add-on-Labels (z. B. ABF-Messe)
  let addonPart = "";
  if (Array.isArray(s.addons) && s.addons.length && ADDONS) {
    const addonLabels = s.addons
      .map((id) => {
        const cfg = ADDONS[id];
        if (!cfg) return null;
        return cfg.label[lang] || cfg.label.de || null;
      })
      .filter(Boolean);

    if (addonLabels.length) {
      if (lang === "en") {
        addonPart = " · Add-ons: " + addonLabels.join(", ");
      } else if (lang === "da") {
        addonPart = " · Add-ons: " + addonLabels.join(", ");
      } else {
        addonPart = " · Add-ons: " + addonLabels.join(", ");
      }
    }
  }

  if (lang === "en") {
    return `${planLabel} – active${addonPart}`;
  }
  if (lang === "da") {
    return `${planLabel} – aktiv${addonPart}`;
  }
  return `${planLabel} – aktiv${addonPart}`;
}

/**
 * Prüft, ob eine Kategorie eine Plus-/Add-on-Kategorie ist.
 * @param {string} slug
 * @returns {boolean}
 */
export function isPlusCategory(slug) {
  if (!slug || !CATEGORY_ACCESS || !CATEGORY_ACCESS.perCategory) return false;
  const rule = CATEGORY_ACCESS.perCategory[slug];
  if (!rule) return false;
  return rule.level === "subscription" || rule.level === "addon";
}

/**
 * Partner-Code einlösen.
 *
 * Erwartet einen String, der in der UI eingegeben wird.
 * Rückgabe:
 *  - { ok: true, status } bei Erfolg
 *  - { ok: false, reason: "empty" | "invalid_days" | "error" }
 *
 * Hinweis: app.js zeigt die passenden Toasts anhand von `reason` an.
 *
 * @param {string} rawCode
 * @returns {Promise<{ok: true, status: PlusStatus} | {ok: false, reason: string}>}
 */
export async function redeemPartnerCode(rawCode) {
  const code = (rawCode || "").trim().toUpperCase();

  if (!code) {
    return { ok: false, reason: "empty" };
  }

  // --------------------------------------------------
  // HIER: gültige Partner-Codes definieren
  // Du kannst diese Liste jederzeit erweitern.
  // --------------------------------------------------
  const PARTNER_CODES = {
    // ABF 2026: schaltet Plus + ABF-Messe-Add-on frei
    // → Diesen Code kannst du direkt nutzen / drucken.
    "ABF2026FAMILY": {
      plan: "family_plus",
      addons: ["addon_abf"],
      partner: "abf"
    }

    // Beispiel: weitere Codes möglich
    // "ABF2026WATER": {
    //   plan: "family_plus",
    //   addons: ["addon_water"],
    //   partner: "abf"
    // }
  };

  const match = PARTNER_CODES[code];

  if (!match) {
    // app.js behandelt "invalid_days" als "unbekannt / ungültig"
    return { ok: false, reason: "invalid_days" };
  }

  /** @type {PlusStatus} */
  const newStatus = {
    active: true,
    plan: match.plan,
    addons: Array.isArray(match.addons) ? match.addons.slice() : [],
    validUntil: null, // optional: später z. B. "2026-12-31T23:59:59Z"
    partner: match.partner || "abf",
    source: "partner_code"
  };

  // In Storage persistieren
  writeStatusToStorage(newStatus);

  return { ok: true, status: newStatus };
}