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
 * @property {boolean} active          // ist Plus aktuell aktiv (unter Berücksichtigung von Ablaufdatum)?
 * @property {string|null} plan        // z. B. "plus" oder "family_plus"
 * @property {string|null} validUntil  // ISO-String (Ende der Laufzeit)
 * @property {string[]|null} addons    // optionale Add-ons (IDs, z. B. ["addon_rv"])
 * @property {string|null} partner     // z. B. "Campingplatz XY"
 * @property {string|null} source      // z. B. "partner", "store"
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
 *
 * WICHTIG:
 *  - Berücksichtigt Ablaufdatum (validUntil / expiresAt)
 *  - Wenn abgelaufen → active = false
 */
export function getPlusStatus() {
  const stored = getPlusStatusFromStorage() || {};

  const validUntilIso = stored.expiresAt || stored.validUntil || null;
  let active = !!stored.active;

  // Add-ons optional unterstützen
  let addons = null;
  if (Array.isArray(stored.addons)) {
    addons = stored.addons.map(String);
  } else if (stored.addonId) {
    addons = [String(stored.addonId)];
  }

  // Ablauf prüfen – ein abgelaufener Code soll nicht mehr als aktiv gelten
  if (validUntilIso) {
    const d = new Date(validUntilIso);
    if (!Number.isNaN(d.getTime())) {
      if (Date.now() > d.getTime()) {
        active = false;
      }
    }
  }

  /** @type {NormalizedPlusStatus} */
  const normalized = {
    active,
    plan: stored.plan || "plus",
    validUntil: validUntilIso,
    addons,
    partner: stored.partner || null,
    source: stored.source || null
  };

  // Falls überhaupt kein sinnvoller Status vorliegt, standardisieren:
  if (!stored || Object.keys(stored).length === 0) {
    return {
      active: false,
      plan: null,
      validUntil: null,
      addons: null,
      partner: null,
      source: null
    };
  }

  return normalized;
}

/** True, wenn Plus aktuell aktiv ist (inkl. Ablaufprüfung). */
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
  if (!status) {
    return t(
      "plus_status_inactive",
      "Family Spots Plus ist nicht aktiviert."
    );
  }

  const untilIso = status.validUntil;
  const until = untilIso ? new Date(untilIso) : null;
  const hasValidDate = until && !Number.isNaN(until.getTime());

  // Inaktiv (nie aktiviert oder abgelaufen)
  if (!status.active) {
    if (hasValidDate) {
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
 *       "plan": "plus",
 *       "partner": "Dev",
 *       "source": "partner",
 *       "addons": ["addon_rv", "addon_water"], // optional
 *       "validUntil": "2026-12-31T23:59:59.000Z" // optional
 *     }
 *   ]
 * }
 *
 * Alternativ:
 *  - direkt ein Array von Einträgen.
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

  // (Optional) Hier könnten wir zukünftig noch prüfen,
  // ob plan/addons zu SUBSCRIPTIONS/ADDONS passen.
  void SUBSCRIPTIONS;
  void ADDONS;

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