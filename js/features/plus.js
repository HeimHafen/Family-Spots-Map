// js/features/plus.js
// --------------------------------------
// Family Spots Plus & Add-ons – ABF 2026 Edition
//
// Stellt bereit:
//  - getPlusStatus()
//  - isPlusActive()
//  - formatPlusStatus(status)
//  - redeemPartnerCode(code)
//  - isPlusCategory(slug)
//
// Nutzt:
//  - SUBSCRIPTIONS, ADDONS, CATEGORY_ACCESS, DEV_FORCE_PLUS, PLUS_STORAGE_KEY
//    aus config.js
// --------------------------------------

"use strict";

import {
  DEV_FORCE_PLUS,
  CATEGORY_ACCESS,
  SUBSCRIPTIONS,
  ADDONS,
  PLUS_STORAGE_KEY
} from "../config.js";

/**
 * Internes Storage-Format:
 * {
 *   active: boolean,
 *   plan: string | null,
 *   validUntil: string | null, // ISO-String
 *   addons: string[],
 *   partner: string | null,
 *   source: "partner_code" | "dev" | null,
 *   code?: string
 * }
 */

/** @typedef {import("../config.js").LangCode} LangCode */

/** @typedef {Object} PlusStatus
 *  @property {boolean} active
 *  @property {string|null} plan
 *  @property {string|null} validUntil
 *  @property {string[]|null} addons
 *  @property {string|null} partner
 *  @property {string|null} source
 *  @property {string|undefined} code
 */

/**
 * Partnercodes für Promotions / Messen (inkl. ABF).
 * Key: normalisierte Eingabe (Großbuchstaben, ohne Leerzeichen).
 *
 * days: Gültigkeitsdauer ab Einlösung (in Tagen)
 */
const PARTNER_CODES = {
  // ABF 2026: Family Spots Plus + ABF-Messe-Add-on
  // Dies ist der Code, den du auf der ABF kommunizieren kannst:
  // → ABF2026FAMILY
  ABF2026FAMILY: {
    planId: "family_plus",
    addons: ["addon_abf"],
    days: 60,
    partner: "abf2026"
  },

  // Optionale Testcodes für dich (kannst du löschen oder anpassen):
  WATER2026: {
    planId: "family_plus",
    addons: ["addon_water"],
    days: 30,
    partner: "water-test"
  },
  RV2026: {
    planId: "family_plus",
    addons: ["addon_rv"],
    days: 30,
    partner: "rv-test"
  }
};

// ------------------------------------------------------
// Helpers – Sprache & Datum
// ------------------------------------------------------

/**
 * Ermittelt die aktuell verwendete UI-Sprache.
 * Fällt auf "de" zurück, wenn I18N nicht verfügbar ist.
 * @returns {LangCode}
 */
function getCurrentUiLang() {
  try {
    if (typeof I18N !== "undefined" && typeof I18N.getLanguage === "function") {
      return /** @type {LangCode} */ (I18N.getLanguage());
    }
  } catch {
    // ignore
  }
  return /** @type {LangCode} */ ("de");
}

/**
 * Formatiert ein Datum für die Anzeige.
 * @param {string} isoString
 * @param {LangCode} lang
 */
function formatDateForLang(isoString, lang) {
  try {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "";
    const locale =
      lang === "en" ? "en-GB" : lang === "da" ? "da-DK" : "de-DE";
    const opts = { year: "numeric", month: "2-digit", day: "2-digit" };
    return new Intl.DateTimeFormat(locale, opts).format(d);
  } catch {
    return "";
  }
}

// ------------------------------------------------------
// Helpers – Storage
// ------------------------------------------------------

/**
 * Liefert einen "leeren" Status.
 * @returns {PlusStatus}
 */
function createEmptyStatus() {
  return {
    active: false,
    plan: null,
    validUntil: null,
    addons: [],
    partner: null,
    source: null,
    code: undefined
  };
}

/**
 * Interner Lesezugriff auf localStorage.
 * Achtet darauf, auch alte boolesche Werte (true/false) zu unterstützen.
 * @returns {PlusStatus}
 */
function loadStatusFromStorage() {
  const base = createEmptyStatus();

  if (typeof localStorage === "undefined") {
    return base;
  }

  try {
    const raw = localStorage.getItem(PLUS_STORAGE_KEY);
    if (!raw) return base;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Wenn es kein valides JSON war, z. B. "true"/"false"
      if (raw === "true" || raw === "1") {
        return {
          ...base,
          active: true,
          plan: "family_plus",
          source: "legacy"
        };
      }
      return base;
    }

    if (typeof parsed === "boolean") {
      if (parsed) {
        return {
          ...base,
          active: true,
          plan: "family_plus",
          source: "legacy"
        };
      }
      return base;
    }

    if (!parsed || typeof parsed !== "object") {
      return base;
    }

    return {
      active: !!parsed.active,
      plan: typeof parsed.plan === "string" ? parsed.plan : null,
      validUntil:
        typeof parsed.validUntil === "string" ? parsed.validUntil : null,
      addons: Array.isArray(parsed.addons) ? parsed.addons : [],
      partner: typeof parsed.partner === "string" ? parsed.partner : null,
      source: typeof parsed.source === "string" ? parsed.source : null,
      code: typeof parsed.code === "string" ? parsed.code : undefined
    };
  } catch {
    return base;
  }
}

/**
 * Speichert Status in localStorage.
 * @param {PlusStatus} status
 */
function saveStatusToStorage(status) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PLUS_STORAGE_KEY, JSON.stringify(status));
  } catch {
    // Storage voll o. ä. => ignorieren, Plus bleibt dann nur für die Session
  }
}

// ------------------------------------------------------
// Public: getPlusStatus / isPlusActive
// ------------------------------------------------------

/**
 * Liefert den effektiven Plus-Status.
 * Berücksichtigt:
 *  - DEV_FORCE_PLUS aus config.js
 *  - abgelaufene Laufzeiten (validUntil)
 *
 * @returns {PlusStatus}
 */
export function getPlusStatus() {
  // Dev-Override: immer alles aktiv
  if (DEV_FORCE_PLUS) {
    return {
      active: true,
      plan: "family_plus",
      validUntil: null,
      addons: Object.keys(ADDONS),
      partner: "dev",
      source: "dev",
      code: undefined
    };
  }

  const stored = loadStatusFromStorage();
  if (!stored.active) {
    return stored;
  }

  // Prüfen, ob Abo abgelaufen ist
  if (stored.validUntil) {
    try {
      const now = Date.now();
      const until = new Date(stored.validUntil).getTime();
      if (!Number.isNaN(until) && now > until) {
        // Abgelaufen → deaktivieren, aber Info behalten
        const expired = {
          ...stored,
          active: false
        };
        saveStatusToStorage(expired);
        return expired;
      }
    } catch {
      // Ignorieren, falls Datum unlesbar
    }
  }

  return stored;
}

/**
 * Convenience: Gibt true zurück, wenn Plus aktiv ist.
 */
export function isPlusActive() {
  const s = getPlusStatus();
  return !!s.active;
}

// ------------------------------------------------------
// Public: isPlusCategory
// ------------------------------------------------------

/**
 * Prüft, ob eine Kategorie (z. B. "abf_exhibitor") prinzipiell
 * Plus/Add-on-pflichtig ist.
 *
 * @param {string} slug
 * @returns {boolean}
 */
export function isPlusCategory(slug) {
  if (!slug || !CATEGORY_ACCESS || !CATEGORY_ACCESS.perCategory) return false;
  const rule = CATEGORY_ACCESS.perCategory[slug];
  if (!rule) return false;
  return rule.level === "subscription" || rule.level === "addon";
}

// ------------------------------------------------------
// Public: formatPlusStatus
// ------------------------------------------------------

/**
 * Formatiert den Plus-Status für die UI (Plus-Box in der Sidebar).
 *
 * Nutzt Sprache aus I18N, falls verfügbar.
 * @param {PlusStatus} status
 * @returns {string}
 */
export function formatPlusStatus(status) {
  const s = status || getPlusStatus();
  const lang = getCurrentUiLang();

  const hasAbf =
    Array.isArray(s.addons) && s.addons.includes("addon_abf");

  const addonLabels = [];
  if (Array.isArray(s.addons) && s.addons.length) {
    for (const id of s.addons) {
      const addon = ADDONS[id];
      if (!addon) continue;
      const lbl = addon.label?.[lang] || addon.label?.de || id;
      addonLabels.push(lbl);
    }
  }

  if (!s.active) {
    if (lang === "en") {
      return "Enter your ABF or promo code here to unlock Family Spots Plus and the ABF fair map.";
    }
    if (lang === "da") {
      return "Indtast din ABF- eller kampagnekode her for at låse Family Spots Plus og ABF-messekortet op.";
    }
    return "Gib hier deinen ABF- oder Promo-Code ein, um Family Spots Plus und die ABF-Messekarte freizuschalten.";
  }

  const dateStr = s.validUntil
    ? formatDateForLang(s.validUntil, lang)
    : "";

  let base;
  if (lang === "en") {
    base = "Family Spots Plus is active";
    if (dateStr) base += ` until ${dateStr}`;
    if (addonLabels.length) {
      base += ` · Add-ons: ${addonLabels.join(", ")}`;
    }
    if (hasAbf && !addonLabels.length) {
      base += " · ABF fair add-on unlocked";
    }
    return base;
  }

  if (lang === "da") {
    base = "Family Spots Plus er aktivt";
    if (dateStr) base += ` indtil ${dateStr}`;
    if (addonLabels.length) {
      base += ` · Add-ons: ${addonLabels.join(", ")}`;
    }
    if (hasAbf && !addonLabels.length) {
      base += " · ABF-messe-add-on låst op";
    }
    return base;
  }

  // Deutsch
  base = "Family Spots Plus ist aktiv";
  if (dateStr) base += ` bis ${dateStr}`;
  if (addonLabels.length) {
    base += ` · Add-ons: ${addonLabels.join(", ")}`;
  }
  if (hasAbf && !addonLabels.length) {
    base += " · ABF Messe-Add-on freigeschaltet";
  }
  return base;
}

// ------------------------------------------------------
// Public: redeemPartnerCode
// ------------------------------------------------------

/**
 * Löst einen Partner-/Promo-Code ein.
 *
 * Rückgabe:
 *  - { ok: true, status }
 *  - { ok: false, reason: "empty" | "unknown" | "invalid_days" }
 *
 * @param {string} rawCode
 * @returns {Promise<{ok: boolean, status?: PlusStatus, reason?: string}>}
 */
export async function redeemPartnerCode(rawCode) {
  const code = (rawCode || "").trim();
  if (!code) {
    return { ok: false, reason: "empty" };
  }

  // Normalisieren: Großbuchstaben, Leerzeichen raus
  const normalized = code.toUpperCase().replace(/\s+/g, "");
  const def = PARTNER_CODES[normalized];

  if (!def) {
    return { ok: false, reason: "unknown" };
  }

  const days = typeof def.days === "number" ? def.days : 0;
  if (!Number.isFinite(days) || days <= 0) {
    return { ok: false, reason: "invalid_days" };
  }

  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  const validUntilDate = new Date(now + days * msPerDay);

  /** @type {PlusStatus} */
  const newStatus = {
    active: true,
    plan: def.planId || "family_plus",
    validUntil: validUntilDate.toISOString(),
    addons: Array.isArray(def.addons) ? def.addons.slice() : [],
    partner: def.partner || null,
    source: "partner_code",
    code: normalized
  };

  saveStatusToStorage(newStatus);

  return { ok: true, status: newStatus };
}

// ------------------------------------------------------
// Default-Export (optional)
// ------------------------------------------------------

const PlusApi = {
  getPlusStatus,
  isPlusActive,
  formatPlusStatus,
  redeemPartnerCode,
  isPlusCategory
};

export default PlusApi;