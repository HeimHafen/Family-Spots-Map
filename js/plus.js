import {
  getPlusStatus as getPlusStatusFromStorage,
  savePlusStatus as savePlusStatusToStorage,
} from "./storage.js";
import { t } from "./i18n.js";

const PARTNERS_URL = "data/partners.json";

// Welche Kategorien später Plus sein sollen
// (kannst du jederzeit anpassen)
const PLUS_CATEGORIES = new Set([
  "rastplatz-spielplatz-dusche",
  "stellplatz-spielplatz-naehe-kostenlos",
  "wohnmobil-service-station",
  "bikepacking-spot",
  "campingplatz-familien",
  "kletterwald-hochseilgarten",
]);

let cachedPartnerCodes = null;

// ---------------------------------------
// Status
// ---------------------------------------

/**
 * Normalisierte Sicht auf den Plus-Status.
 * Nutzt intern den Storage, mappt aber auf { active, plan, validUntil }.
 */
export function getPlusStatus() {
  const stored = getPlusStatusFromStorage();
  if (!stored || !stored.active) {
    return {
      active: false,
      plan: null,
      validUntil: null,
    };
  }
  return {
    active: true,
    plan: stored.plan || null,
    validUntil: stored.expiresAt || stored.validUntil || null,
  };
}

export function isPlusActive() {
  return getPlusStatus().active;
}

export function isPlusCategory(slug) {
  if (!slug) return false;
  return PLUS_CATEGORIES.has(slug);
}

export function formatPlusStatus(status = getPlusStatus()) {
  if (!status.active) {
    return t(
      "plus_status_inactive",
      "Family Spots Plus ist nicht aktiviert.",
    );
  }

  const untilIso = status.validUntil;
  const until = untilIso ? new Date(untilIso) : null;

  const dateStr = until
    ? until.toLocaleDateString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "";

  if (!dateStr) {
    return t(
      "plus_status_active",
      "Family Spots Plus ist aktiv.",
    );
  }

  return t(
    "plus_status_active_until",
    `Family Spots Plus ist aktiv bis ${dateStr}.`,
  );
}

// ---------------------------------------
// Partnercodes
// ---------------------------------------

async function loadPartnerCodes() {
  if (cachedPartnerCodes) return cachedPartnerCodes;

  try {
    const res = await fetch(PARTNERS_URL);
    if (!res.ok) {
      console.warn("Cannot load partners.json");
      cachedPartnerCodes = [];
      return cachedPartnerCodes;
    }
    const json = await res.json();
    cachedPartnerCodes = Array.isArray(json.codes) ? json.codes : [];
    return cachedPartnerCodes;
  } catch (err) {
    console.error("Error loading partner codes", err);
    cachedPartnerCodes = [];
    return cachedPartnerCodes;
  }
}

/**
 * Versucht, einen Partnercode einzulösen.
 * Gibt ein Objekt { ok, reason?, status?, entry? } zurück.
 *
 * reason kann sein:
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
  const entry = codes.find(
    (c) =>
      c.code &&
      String(c.code).toUpperCase() === code &&
      c.enabled !== false,
  );

  if (!entry) {
    return { ok: false, reason: "not_found" };
  }

  const days = Number(entry.days) || 0;
  if (!days || days <= 0) {
    return { ok: false, reason: "invalid_days" };
  }

  const now = Date.now();
  const validUntil = new Date(now + days * 24 * 60 * 60 * 1000);

  // Status so speichern, dass er zum Storage-Schema passt
  const statusForStorage = {
    code,
    plan: entry.plan || "plus",
    partner: entry.partner || null,
    source: entry.source || "partner",
    activatedAt: new Date().toISOString(),
    expiresAt: validUntil.toISOString(),
  };

  savePlusStatusToStorage(statusForStorage);

  // Normalisierte Sicht nach außen
  const statusForReturn = {
    active: true,
    plan: statusForStorage.plan,
    validUntil: statusForStorage.expiresAt,
  };

  return {
    ok: true,
    status: statusForReturn,
    entry,
  };
}