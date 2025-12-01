// js/features/plus.js
// ---------------------------------------
// Family Spots Plus – Status & Partnercodes
// ---------------------------------------

"use strict";

import { t } from "../i18n.js";

const PARTNERS_URL = "data/partners.json";

// eigener Key für den Plus-Status im localStorage
const PLUS_STATUS_KEY = "fs_plus_status";

// --- interne Storage-Helfer (ersetzen ../storage.js) ------------------------

function getPlusStatusFromStorage() {
  try {
    const raw = localStorage.getItem(PLUS_STATUS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function savePlusStatusToStorage(status) {
  try {
    localStorage.setItem(PLUS_STATUS_KEY, JSON.stringify(status));
  } catch {
    // ignorieren – App funktioniert auch ohne gespeicherten Status
  }
}

// Kategorien, die als Plus-Kategorien gelten
// (kannst du jederzeit anpassen/erweitern)
const PLUS_CATEGORIES = new Set([
  "rastplatz-spielplatz-dusche",
  "stellplatz-spielplatz-naehe-kostenlos",
  "wohnmobil-service-station",
  "bikepacking-spot",
  "campingplatz-familien",
  "kletterwald-hochseilgarten"
]);

let cachedPartnerCodes = null;

// ---------------------------------------
// Status-API
// ---------------------------------------

/**
 * Normalisierte Sicht auf den Plus-Status.
 * Nutzt intern den Storage, gibt aber immer
 * { active, plan, validUntil } zurück.
 */
export function getPlusStatus() {
  const stored = getPlusStatusFromStorage();
  if (!stored || !stored.active) {
    return {
      active: false,
      plan: null,
      validUntil: null
    };
  }

  return {
    active: true,
    plan: stored.plan || null,
    validUntil: stored.expiresAt || stored.validUntil || null
  };
}

/** True, wenn Plus aktuell aktiv ist. */
export function isPlusActive() {
  return getPlusStatus().active;
}

/** True, wenn die Kategorie zu den Plus-Kategorien gehört. */
export function isPlusCategory(slug) {
  if (!slug) return false;
  return PLUS_CATEGORIES.has(slug);
}

/**
 * Formatiert den Status als Text für die UI.
 * Nutzt i18n-Fallbacks.
 */
export function formatPlusStatus(status = getPlusStatus()) {
  if (!status.active) {
    return t(
      "plus_status_inactive",
      "Family Spots Plus ist nicht aktiviert."
    );
  }

  const untilIso = status.validUntil;
  const until = untilIso ? new Date(untilIso) : null;

  const dateStr = until
    ? until.toLocaleDateString(undefined, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      })
    : "";

  if (!dateStr) {
    return t("plus_status_active", "Family Spots Plus ist aktiv.");
  }

  return t(
    "plus_status_active_until",
    `Family Spots Plus ist aktiv bis ${dateStr}.`
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
      console.warn("[Family Spots] Cannot load partners.json");
      cachedPartnerCodes = [];
      return cachedPartnerCodes;
    }

    const json = await res.json();
    cachedPartnerCodes = Array.isArray(json.codes) ? json.codes : [];
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
  const entry = codes.find(
    (c) =>
      c.code &&
      String(c.code).toUpperCase() === code &&
      c.enabled !== false
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

  // Im Storage-Format speichern
  const statusForStorage = {
    code,
    plan: entry.plan || "plus",
    partner: entry.partner || null,
    source: entry.source || "partner",
    activatedAt: new Date().toISOString(),
    expiresAt: validUntil.toISOString(),
    active: true
  };

  savePlusStatusToStorage(statusForStorage);

  // Normalisierte Sicht nach außen
  const statusForReturn = {
    active: true,
    plan: statusForStorage.plan,
    validUntil: statusForStorage.expiresAt
  };

  return {
    ok: true,
    status: statusForReturn,
    entry
  };
}