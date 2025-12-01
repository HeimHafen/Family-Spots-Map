// js/storage.js
// ===============================================
// Zentrale Storage-Helfer für Family Spots Map
// – alles rund um localStorage
// ===============================================

"use strict";

import {
  PLUS_STORAGE_KEY,
  DAYLOG_STORAGE_KEY,
  SPOTS_CACHE_KEY,
  COMPASS_PLUS_HINT_KEY
} from "./config.js";

const LANG_STORAGE_KEY = "fs_lang";
const THEME_STORAGE_KEY = "fs_theme";
const FAVORITES_STORAGE_KEY = "fs_favorites";

const LEGACY_PLUS_TRUE = "1";
const LEGACY_PLUS_FALSE = "0";

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.warn("[Family Spots] Konnte localStorage lesen:", err);
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    console.warn("[Family Spots] Konnte localStorage schreiben:", err);
  }
}

// ------------------------------------------------------
// Sprache
// ------------------------------------------------------

export function loadStoredLang() {
  return safeGet(LANG_STORAGE_KEY);
}

export function saveStoredLang(lang) {
  if (!lang) return;
  safeSet(LANG_STORAGE_KEY, lang);
}

// ------------------------------------------------------
// Theme
// ------------------------------------------------------

export function loadStoredTheme() {
  return safeGet(THEME_STORAGE_KEY);
}

export function saveStoredTheme(theme) {
  if (!theme) return;
  safeSet(THEME_STORAGE_KEY, theme);
}

// ------------------------------------------------------
// Spots-Cache
// ------------------------------------------------------

export function loadSpotsFromCache() {
  const stored = safeGet(SPOTS_CACHE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.spots)) return parsed.spots;
    return null;
  } catch (err) {
    console.warn("[Family Spots] Konnte Spots-Cache nicht lesen:", err);
    return null;
  }
}

export function saveSpotsToCache(spots) {
  if (!spots) return;
  try {
    safeSet(SPOTS_CACHE_KEY, JSON.stringify(spots));
  } catch (err) {
    console.warn("[Family Spots] Konnte Spots-Cache nicht speichern:", err);
  }
}

// ------------------------------------------------------
// Favoriten
// ------------------------------------------------------

export function loadFavoritesFromStorage() {
  const stored = safeGet(FAVORITES_STORAGE_KEY);
  if (!stored) return new Set();
  try {
    const arr = JSON.parse(stored);
    if (Array.isArray(arr)) return new Set(arr);
  } catch (err) {
    console.warn("[Family Spots] Konnte Favoriten nicht laden:", err);
  }
  return new Set();
}

export function saveFavoritesToStorage(favoritesSet) {
  if (!(favoritesSet instanceof Set)) return;
  try {
    const arr = Array.from(favoritesSet);
    safeSet(FAVORITES_STORAGE_KEY, JSON.stringify(arr));
  } catch (err) {
    console.warn("[Family Spots] Konnte Favoriten nicht speichern:", err);
  }
}

// ------------------------------------------------------
// Plus-Status (neues Modell)
// ------------------------------------------------------

/**
 * Lies den vollständigen Plus-Status aus dem Storage.
 *
 * Mögliche Rückgabe:
 *  - null          → kein Eintrag
 *  - { active, plan?, code?, partner?, source?, activatedAt?, expiresAt? }
 *
 *  - ist abwärtskompatibel zu altem "1"/"0"-Format
 *  - setzt bei abgelaufenen Codes active=false und speichert das zurück
 */
export function getPlusStatus() {
  const stored = safeGet(PLUS_STORAGE_KEY);
  if (!stored) return null;

  // Legacy-Format: nur "1" / "0"
  if (stored === LEGACY_PLUS_TRUE) {
    return {
      active: true,
      plan: "legacy",
      code: null,
      partner: null,
      source: "legacy",
      activatedAt: null,
      expiresAt: null
    };
  }
  if (stored === LEGACY_PLUS_FALSE) {
    return {
      active: false,
      plan: null,
      code: null,
      partner: null,
      source: "legacy",
      activatedAt: null,
      expiresAt: null
    };
  }

  // Neues JSON-Format
  try {
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") return null;

    const status = { ...parsed };

    // Fallback: validUntil → expiresAt
    if (!status.expiresAt && status.validUntil) {
      status.expiresAt = status.validUntil;
    }

    // Ablauf prüfen
    if (status.expiresAt) {
      const ts = Date.parse(status.expiresAt);
      if (!Number.isNaN(ts) && ts < Date.now()) {
        // Abgelaufen → als inaktiv markieren
        if (status.active !== false) {
          status.active = false;
          try {
            safeSet(PLUS_STORAGE_KEY, JSON.stringify(status));
          } catch (err) {
            console.warn("[Family Spots] Konnte abgelaufenen Plus-Status nicht aktualisieren:", err);
          }
        }
      }
    }

    if (typeof status.active !== "boolean") {
      status.active = !!status.active;
    }

    return status;
  } catch (err) {
    console.warn("[Family Spots] Konnte Plus-Status nicht lesen:", err);
    return null;
  }
}

/**
 * Speichert den vollständigen Plus-Status im neuen JSON-Format.
 * Wird z. B. von plus.js (redeemPartnerCode) verwendet.
 */
export function savePlusStatus(status) {
  if (!status || typeof status !== "object") return;

  const normalized = {
    code: status.code || null,
    plan: status.plan || "plus",
    partner: status.partner || null,
    source: status.source || "manual",
    activatedAt: status.activatedAt || new Date().toISOString(),
    expiresAt: status.expiresAt || status.validUntil || null,
    active: status.active !== undefined ? !!status.active : true
  };

  try {
    safeSet(PLUS_STORAGE_KEY, JSON.stringify(normalized));
  } catch (err) {
    console.warn("[Family Spots] Konnte Plus-Status nicht speichern:", err);
  }
}

/**
 * Kompatibilitäts-Helfer:
 * Gibt nur true/false zurück, ob Plus aktuell aktiv ist.
 * Nutzt intern getPlusStatus().
 */
export function loadPlusActive() {
  const status = getPlusStatus();
  if (!status || !status.active) return false;

  const expires = status.expiresAt || status.validUntil;
  if (!expires) return true;

  const ts = Date.parse(expires);
  if (Number.isNaN(ts)) return true;

  return ts >= Date.now();
}

/**
 * Kompatibilitäts-Helfer:
 * Setzt nur das active-Flag, lässt alle anderen Felder unverändert.
 */
export function savePlusActive(isActive) {
  const current = getPlusStatus() || {};
  const next = {
    ...current,
    active: !!isActive
  };

  if (!next.plan) next.plan = "manual";
  if (!next.source) next.source = "manual_toggle";

  savePlusStatus(next);
}

// ------------------------------------------------------
// Mein Tag (Daylog)
// ------------------------------------------------------

export function loadDaylog() {
  const stored = safeGet(DAYLOG_STORAGE_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (parsed && typeof parsed.text === "string") {
      return parsed;
    }
  } catch (err) {
    console.warn("[Family Spots] Konnte Mein-Tag nicht laden:", err);
  }
  return null;
}

export function saveDaylog(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) return;
  const payload = { text: trimmed, ts: Date.now() };
  try {
    safeSet(DAYLOG_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("[Family Spots] Konnte Mein-Tag nicht speichern:", err);
  }
}

// ------------------------------------------------------
// Kompass/Plus-Onboarding-Hint
// ------------------------------------------------------

export function hasSeenCompassPlusHint() {
  return safeGet(COMPASS_PLUS_HINT_KEY) === "1";
}

export function markCompassPlusHintSeen() {
  safeSet(COMPASS_PLUS_HINT_KEY, "1");
}