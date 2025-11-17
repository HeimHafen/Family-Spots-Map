// js/plus.js

import { t } from "./i18n.js";
import {
  getPlusStatus as getPlusStatusFromStorage,
  savePlusStatus as savePlusStatusToStorage,
} from "./storage.js";

const PARTNERS_URL = "data/partners.json";

// Kategorien, die typischerweise Plus sind
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
// Status (Wrapper um storage.js)
// ---------------------------------------

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

  if (!status.validUntil) {
    return t(
      "plus_status_active",
      "Family Spots Plus ist aktiv.",
    );
  }

  const until = new Date(status.validUntil);
  const dateStr = until.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

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
 */
export async function redeemPartnerCode(rawCode) {
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) {
    return { ok: false, reason: "empty" };
  }

  const codes = await loadPartnerCodes();
  const entry = codes.find(
    (c) => c.code && c.code.toUpperCase() === code && c.enabled !== false,
  );

  if (!entry) {
    return { ok: false, reason: "not_found" };
  }

  const days = Number(entry.days) || 0;
  if (!days || days <= 0) {
    return {
      ok: false,
      reason: "invalid_days",
    };
  }

  const now = Date.now();
  const validUntil = new Date(now + days * 24 * 60 * 60 * 1000);

  const statusForPlus = {
    plan: entry.plan || "plus",
    validUntil: validUntil.toISOString(),
  };

  // In storage.js-Struktur speichern
  savePlusStatusToStorage({
    code,
    plan: entry.plan || "plus",
    partner: entry.partner || null,
    source: entry.source || "partner",
    activatedAt: new Date(now).toISOString(),
    expiresAt: statusForPlus.validUntil,
  });

  return {
    ok: true,
    status: statusForPlus,
    entry,
  };
}