// js/features/plus.js
// ---------------------------------------
// Family Spots Plus – Status & Partnercodes
// ---------------------------------------

"use strict";

import {
  getPlusStatus as getPlusStatusFromStorage,
  savePlusStatus as savePlusStatusToStorage
} from "../storage.js";
import { t } from "../i18n.js";
import {
  SUBSCRIPTIONS,
  ADDONS,
  CATEGORY_ACCESS,
  DEV_FORCE_PLUS
} from "../config.js";

const PARTNERS_URL = "data/partners.json";

// damit der Import nicht als "unused" gewertet wird (z. B. Bundler)
void SUBSCRIPTIONS;

// ---------------------------------------
// Typen (JSDoc – nur für Tooling/Lesbarkeit)
// ---------------------------------------

/**
 * @typedef {Object} NormalizedPlusStatus
 * @property {boolean} active          - Ist Plus aktuell aktiv (unter Berücksichtigung Ablauf)?
 * @property {string|null} plan        - z. B. "family_plus"
 * @property {string|null} validUntil  - ISO-String (Ende der Laufzeit)
 * @property {string[]|null} addons    - optionale Add-ons (IDs, z. B. ["addon_rv", "addon_abf"])
 * @property {string|null} partner     - z. B. "Campingplatz XY"
 * @property {string|null} source      - z. B. "partner", "store", "dev"
 */

/**
 * @typedef {Object} PartnerCodeEntry
 * @property {string} code
 * @property {number} [days]          - Laufzeit in Tagen (Alternative zu validUntil)
 * @property {string} [plan]          - z. B. "family_plus" – falls leer, wird auf Standard gesetzt
 * @property {string} [partner]
 * @property {string} [source]
 * @property {boolean} [enabled]
 * @property {string[]} [addons]      - z. B. ["addon_rv", "addon_abf"]
 * @property {string} [addonId]       - Single-Add-on-ID, z. B. "addon_abf"
 * @property {string} [validUntil]    - ISO-String (falls feste Laufzeit)
 */

/**
 * @typedef {Object} PartnerCodeResult
 * @property {boolean} ok
 * @property {"empty"|"not_found"|"invalid_days"|undefined} [reason]
 * @property {NormalizedPlusStatus} [status]
 * @property {PartnerCodeEntry} [entry]
 */

// ---------------------------------------
// Plus-Kategorien aus Config ableiten
// ---------------------------------------

/**
 * Erzeugt ein Set aller Kategorien, die gemäß CATEGORY_ACCESS Plus/Add-on erfordern.
 * @returns {Set<string>}
 */
function buildPlusCategorySet() {
  const result = new Set();

  if (!CATEGORY_ACCESS || !CATEGORY_ACCESS.perCategory) return result;

  Object.entries(CATEGORY_ACCESS.perCategory).forEach(([slug, rule]) => {
    if (!rule) return;
    const level = rule.level || CATEGORY_ACCESS.defaultLevel || "free";
    // alles, was nicht free ist, gilt als Plus-/Add-on-Kategorie
    if (level !== "free") {
      result.add(String(slug));
    }
  });

  return result;
}

/**
 * Set aller Kategorien, die nur mit Plus/Add-on sichtbar sein sollen.
 * Basis ist config.js → CATEGORY_ACCESS.
 * Wird einmalig beim Modul-Load berechnet.
 * @type {Set<string>}
 */
const PLUS_CATEGORIES = buildPlusCategorySet();

/**
 * Cache für Partnercodes (wird lazy befüllt).
 * @type {PartnerCodeEntry[]|null}
 */
let cachedPartnerCodes = null;

// ---------------------------------------
// Hilfsfunktionen
// ---------------------------------------

/**
 * Prüft, ob ein Date-Objekt gültig ist.
 * @param {Date|null} date
 * @returns {boolean}
 */
function isValidDate(date) {
  return !!(date && !Number.isNaN(date.getTime()));
}

/**
 * Normalisiert Add-ons aus beliebigen Feldern auf ein String-Array oder null.
 * @param {any} raw
 * @param {any} [fallbackRaw]
 * @returns {string[]|null}
 */
function normalizeAddons(raw, fallbackRaw) {
  let source = raw;

  if (!Array.isArray(source) && fallbackRaw) {
    source = fallbackRaw;
  }

  if (Array.isArray(source)) {
    const list = source
      .map((v) => (v == null ? "" : String(v).trim()))
      .filter(Boolean);
    return list.length ? list : null;
  }

  if (source) {
    const single = String(source).trim();
    return single ? [single] : null;
  }

  return null;
}

/**
 * Filtert Add-ons auf bekannte IDs aus config.js (ADDONS),
 * um Tippfehler oder veraltete Partner-Codes abzufangen.
 *
 * @param {any} raw
 * @param {any} [fallbackRaw]
 * @returns {string[]|null}
 */
function normalizeAndFilterAddons(raw, fallbackRaw) {
  const list = normalizeAddons(raw, fallbackRaw);
  if (!list || !ADDONS) return list;

  const knownIds = new Set(Object.keys(ADDONS));
  const filtered = list.filter((id) => knownIds.has(id));
  return filtered.length ? filtered : null;
}

/**
 * Prüft, ob ein gespeicherter Status im Wesentlichen "leer" ist.
 * @param {any} raw
 * @returns {boolean}
 */
function isEmptyStoredStatus(raw) {
  if (!raw || typeof raw !== "object") return true;
  return Object.keys(raw).length === 0;
}

// ---------------------------------------
// Status-API
// ---------------------------------------

/**
 * Normalisierte Sicht auf den Plus-Status.
 * Nutzt intern den Storage, gibt aber immer ein konsistentes Objekt zurück:
 *
 * {
 *   active: boolean,
 *   plan: string|null,
 *   validUntil: string|null,
 *   addons: string[]|null,
 *   partner: string|null,
 *   source: string|null
 * }
 *
 * WICHTIG:
 *  - Berücksichtigt Ablaufdatum (validUntil / expiresAt)
 *  - Wenn abgelaufen → active = false
 *  - DEV_FORCE_PLUS kann den Status ausschließlich zur Laufzeit überschreiben
 *
 * @returns {NormalizedPlusStatus}
 */
export function getPlusStatus() {
  const stored = getPlusStatusFromStorage() || {};

  // Falls überhaupt kein sinnvoller Status vorliegt, standardisieren:
  if (isEmptyStoredStatus(stored)) {
    /** @type {NormalizedPlusStatus} */
    const base = {
      active: false,
      plan: null,
      validUntil: null,
      addons: null,
      partner: null,
      source: null
    };

    // Dev-Override: Plus für Demos erzwingen, ohne Storage zu verändern
    if (DEV_FORCE_PLUS) {
      return {
        ...base,
        active: true,
        plan: "family_plus",
        source: "dev"
      };
    }

    return base;
  }

  const validUntilIso = stored.expiresAt || stored.validUntil || null;
  let active = !!stored.active;

  // Add-ons optional unterstützen (alter + neuer Storage-Stil)
  const addons = normalizeAndFilterAddons(stored.addons, stored.addonId);

  // Ablauf prüfen – ein abgelaufener Code soll nicht mehr als aktiv gelten
  if (validUntilIso) {
    const d = new Date(validUntilIso);
    if (isValidDate(d) && Date.now() > d.getTime()) {
      active = false;
    }
  }

  /** @type {NormalizedPlusStatus} */
  const normalized = {
    active,
    // Fallback-Plan auf das neue Abo in config.js
    plan: stored.plan || "family_plus",
    validUntil: validUntilIso,
    addons,
    partner: stored.partner || null,
    source: stored.source || null
  };

  // Dev-Override: aktiven Status für Demos erzwingen
  if (DEV_FORCE_PLUS) {
    return {
      ...normalized,
      active: true,
      // falls kein Plan gesetzt wurde, auf "family_plus" fallen
      plan: normalized.plan || "family_plus",
      source: normalized.source || "dev"
    };
  }

  return normalized;
}

/**
 * True, wenn Plus aktuell aktiv ist (inkl. Ablaufprüfung & Dev-Override).
 * @returns {boolean}
 */
export function isPlusActive() {
  return getPlusStatus().active;
}

/**
 * True, wenn die Kategorie in eine Plus-/Add-on-Kategorie fällt.
 * Basis: CATEGORY_ACCESS in config.js
 *
 * @param {string} slug
 * @returns {boolean}
 */
export function isPlusCategory(slug) {
  if (!slug) return false;
  return PLUS_CATEGORIES.has(String(slug));
}

/**
 * Prüft, ob ein bestimmtes Add-on beim aktuellen Nutzer aktiv ist,
 * z. B. "addon_abf" für dein Messe-Add-on.
 *
 * @param {string} addonId
 * @param {NormalizedPlusStatus} [status]
 * @returns {boolean}
 */
export function hasAddon(addonId, status = getPlusStatus()) {
  if (!addonId) return false;
  const s = status || getPlusStatus();
  if (!s.active || !Array.isArray(s.addons)) return false;
  return s.addons.includes(addonId);
}

/**
 * Prüft, ob für eine bestimmte Kategorie das zugehörige Add-on aktiv ist.
 * Nutzt CATEGORY_ACCESS (level === "addon" & addonId).
 *
 * @param {string} slug
 * @param {NormalizedPlusStatus} [status]
 * @returns {boolean}
 */
export function hasAddonForCategory(slug, status = getPlusStatus()) {
  if (
    !slug ||
    !CATEGORY_ACCESS ||
    !CATEGORY_ACCESS.perCategory ||
    !CATEGORY_ACCESS.perCategory[slug]
  ) {
    return false;
  }

  const rule = CATEGORY_ACCESS.perCategory[slug];
  if (!rule || rule.level !== "addon" || !rule.addonId) return false;
  return hasAddon(rule.addonId, status);
}

/**
 * Formatiert den Status als Text für die UI.
 * Nutzt i18n-Fallbacks.
 *
 * @param {NormalizedPlusStatus} [status]
 * @returns {string}
 */
export function formatPlusStatus(status = getPlusStatus()) {
  if (!status) {
    return t(
      "plus_status_inactive",
      "Family Spots Plus ist nicht aktiviert."
    );
  }

  const untilIso = status.validUntil;
  const until = untilIso ? new Date(untilIso) : null;
  const hasValidDate = isValidDate(until);

  // Inaktiv (nie aktiviert oder abgelaufen)
  if (!status.active) {
    if (hasValidDate && until) {
      const dateStr = until.toLocaleDateString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });

      return t(
        "plus_status_expired",
        `Family Spots Plus ist abgelaufen am ${dateStr}.`
      );
    }

    return t(
      "plus_status_inactive",
      "Family Spots Plus ist nicht aktiviert."
    );
  }

  // Aktiv, aber ohne sinnvolles Datum
  if (!hasValidDate) {
    return t("plus_status_active", "Family Spots Plus ist aktiv.");
  }

  // Aktiv bis konkretes Datum
  const dateStr = until.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return t(
    "plus_status_active_until",
    `Family Spots Plus ist aktiv bis ${dateStr}.`
  );
}

// ---------------------------------------
// Partnercodes
// ---------------------------------------

/**
 * Lädt Partnercodes aus data/partners.json.
 *
 * Erwartetes Format:
 * {
 *   "codes": [
 *     {
 *       "code": "TESTPLUS",
 *       "days": 365,
 *       "plan": "family_plus",
 *       "partner": "Dev",
 *       "source": "partner",
 *       "addons": ["addon_rv", "addon_water", "addon_abf"], // optional
 *       "validUntil": "2026-12-31T23:59:59.000Z",           // optional
 *       "enabled": true                                     // optional
 *     }
 *   ]
 * }
 *
 * Alternativ:
 *  - direkt ein Array von Einträgen.
 *
 * @returns {Promise<PartnerCodeEntry[]>}
 */
async function loadPartnerCodes() {
  if (cachedPartnerCodes) return cachedPartnerCodes;

  try {
    const res = await fetch(PARTNERS_URL);
    if (!res.ok) {
      console.warn("[Family Spots] Cannot load partners.json");
      cachedPartnerCodes = [];
      return cachedPartnerCodes;
    }

    const json = await res.json();
    if (Array.isArray(json)) {
      // Fallback, falls direkt ein Array gespeichert wurde
      cachedPartnerCodes = json;
    } else if (Array.isArray(json.codes)) {
      cachedPartnerCodes = json.codes;
    } else {
      cachedPartnerCodes = [];
    }

    return cachedPartnerCodes;
  } catch (err) {
    console.error("[Family Spots] Error loading partner codes:", err);
    cachedPartnerCodes = [];
    return cachedPartnerCodes;
  }
}

/**
 * Versucht, einen Partnercode einzulösen.
 *
 * Rückgabe:
 *  { ok, reason?, status?, entry? }
 *
 * reason:
 *  - "empty"        → kein Code eingegeben
 *  - "not_found"    → Code unbekannt oder deaktiviert
 *  - "invalid_days" → Weder gültiges validUntil noch gültige days
 *
 * Typische Beispiele:
 *  - Voller Plus-Zeitraum:
 *      { code: "ABF2025", days: 14, plan: "family_plus" }
 *  - Nur Messe-Add-on (ABF):
 *      { code: "ABFHALLE25", days: 7, addons: ["addon_abf"] }
 *
 * @param {string} rawCode
 * @returns {Promise<PartnerCodeResult>}
 */
export async function redeemPartnerCode(rawCode) {
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) {
    return { ok: false, reason: "empty" };
  }

  const codes = await loadPartnerCodes();
  if (!Array.isArray(codes) || !codes.length) {
    return { ok: false, reason: "not_found" };
  }

  // passenden Code-Eintrag finden (case-insensitive)
  const entry = codes.find((c) => {
    if (!c || !c.code) return false;
    return String(c.code).trim().toUpperCase() === code && c.enabled !== false;
  });

  if (!entry) {
    return { ok: false, reason: "not_found" };
  }

  // Ablaufdatum: entweder über days oder direkt über validUntil
  /** @type {Date|null} */
  let validUntilDate = null;

  if (entry.validUntil) {
    const d = new Date(entry.validUntil);
    if (isValidDate(d)) {
      validUntilDate = d;
    }
  }

  if (!validUntilDate) {
    const days = Number(entry.days) || 0;
    if (!days || days <= 0) {
      return { ok: false, reason: "invalid_days" };
    }
    const now = Date.now();
    validUntilDate = new Date(now + days * 24 * 60 * 60 * 1000);
  }

  const validUntilIso = validUntilDate.toISOString();

  // optionale Add-ons aus dem Code übernehmen (inkl. Filterung auf bekannte IDs)
  const normalizedAddons = normalizeAndFilterAddons(
    entry.addons,
    entry.addonId
  );

  // Im Storage-Format speichern
  const statusForStorage = {
    code,
    // Fallback-Plan an das Abo aus config.js anlehnen
    plan: entry.plan || "family_plus",
    partner: entry.partner || null,
    source: entry.source || "partner",
    activatedAt: new Date().toISOString(),
    expiresAt: validUntilIso,
    active: true
  };

  if (normalizedAddons) {
    statusForStorage.addons = normalizedAddons;
  }

  // in localStorage ablegen
  savePlusStatusToStorage(statusForStorage);

  // Normalisierte Sicht nach außen
  /** @type {NormalizedPlusStatus} */
  const statusForReturn = {
    active: true,
    plan: statusForStorage.plan,
    validUntil: statusForStorage.expiresAt,
    addons: statusForStorage.addons || null,
    partner: statusForStorage.partner,
    source: statusForStorage.source
  };

  return {
    ok: true,
    status: statusForReturn,
    entry
  };
}