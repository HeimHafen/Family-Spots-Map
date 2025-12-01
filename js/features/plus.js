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
import { SUBSCRIPTIONS, ADDONS, CATEGORY_ACCESS } from "../config.js";

const PARTNERS_URL = "data/partners.json";

// ---------------------------------------
// Plus-Kategorien aus Config ableiten
// ---------------------------------------

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
 */
const PLUS_CATEGORIES = buildPlusCategorySet();

// Cache für Partnercodes
let cachedPartnerCodes = null;

// ---------------------------------------
// Typ-Hinweis (nur zur Orientierung)
// ---------------------------------------
/**
 * @typedef {Object} NormalizedPlusStatus
 * @property {boolean} active
 * @property {string|null} plan          // z. B. "plus" oder "family_plus"
 * @property {string|null} validUntil    // ISO-String
 * @property {string[]|null} addons      // optionale Add-ons (IDs)
 * @property {string|null} partner       // z. B. "Camping XY"
 * @property {string|null} source        // z. B. "partner"
 */

// ---------------------------------------
// Status-API
// ---------------------------------------

/**
 * Normalisierte Sicht auf den Plus-Status.
 * Nutzt intern den Storage, gibt aber immer
 * ein konsistentes Objekt zurück:
 *
 * {
 *   active: boolean,
 *   plan: string|null,
 *   validUntil: string|null,
 *   addons: string[]|null,
 *   partner: string|null,
 *   source: string|null
 * }
 */
export function getPlusStatus() {
  const stored = getPlusStatusFromStorage();

  if (!stored || !stored.active) {
    /** @type {NormalizedPlusStatus} */
    const inactiveStatus = {
      active: false,
      plan: null,
      validUntil: null,
      addons: null,
      partner: null,
      source: null
    };
    return inactiveStatus;
  }

  const validUntil = stored.expiresAt || stored.validUntil || null;
  const plan = stored.plan || "plus";

  // Add-ons optional unterstützen (falls du das später nutzen willst)
  let addons = null;
  if (Array.isArray(stored.addons)) {
    addons = stored.addons.map(String);
  } else if (stored.addonId) {
    addons = [String(stored.addonId)];
  }

  /** @type {NormalizedPlusStatus} */
  const normalized = {
    active: true,
    plan,
    validUntil,
    addons,
    partner: stored.partner || null,
    source: stored.source || null
  };

  return normalized;
}

/** True, wenn Plus aktuell aktiv ist. */
export function isPlusActive() {
  return getPlusStatus().active;
}

/**
 * True, wenn die Kategorie in eine Plus-/Add-on-Kategorie fällt.
 * Basis: CATEGORY_ACCESS in config.js
 */
export function isPlusCategory(slug) {
  if (!slug) return false;
  return PLUS_CATEGORIES.has(String(slug));
}

/**
 * Formatiert den Status als Text für die UI.
 * Nutzt i18n-Fallbacks.
 */
export function formatPlusStatus(status = getPlusStatus()) {
  if (!status || !status.active) {
    return t(
      "plus_status_inactive",
      "Family Spots Plus ist nicht aktiviert."
    );
  }

  const untilIso = status.validUntil;
  const until = untilIso ? new Date(untilIso) : null;
  const hasValidDate = until && !Number.isNaN(until.getTime());

  if (!hasValidDate) {
    return t("plus_status_active", "Family Spots Plus ist aktiv.");
  }

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
 *       "plan": "plus",
 *       "partner": "Dev",
 *       "source": "partner",
 *       "addons": ["addon_rv", "addon_water"] // optional
 *     }
 *   ]
 * }
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
 *  - "empty"
 *  - "not_found"
 *  - "invalid_days"
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
  let validUntilDate = null;

  if (entry.validUntil) {
    const d = new Date(entry.validUntil);
    if (!Number.isNaN(d.getTime())) {
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

  // Im Storage-Format speichern
  const statusForStorage = {
    code,
    plan: entry.plan || "plus",
    partner: entry.partner || null,
    source: entry.source || "partner",
    activatedAt: new Date().toISOString(),
    expiresAt: validUntilIso,
    active: true
  };

  // optionale Add-ons aus dem Code übernehmen
  if (Array.isArray(entry.addons)) {
    statusForStorage.addons = entry.addons.map(String);
  } else if (entry.addonId) {
    statusForStorage.addons = [String(entry.addonId)];
  }

  // in localStorage ablegen
  savePlusStatusToStorage(statusForStorage);

  // Normalisierte Sicht nach außen
  const statusForReturn = {
    active: true,
    plan: statusForStorage.plan,
    validUntil: statusForStorage.expiresAt,
    addons: statusForStorage.addons || null
  };

  return {
    ok: true,
    status: statusForReturn,
    entry
  };
}