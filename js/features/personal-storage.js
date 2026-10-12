// Transactional personal data for tabs sharing the same browser storage.
// Existing localStorage data is imported on first write and mirrored after
// changes, retaining the previous data format for export and rollback.
import { DAYLOG_STORAGE_KEY } from "../config.js";
const FAVORITES_KEY = "fs_favorites";
let databasePromise = null;

function database() {
  if (!databasePromise) databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open("family-spots-personal-coordination", 1);
    let cancelled = false;
    const timer = setTimeout(() => { cancelled = true; reject(new Error("personal_storage_timeout")); }, 5000);
    request.onupgradeneeded = () => request.result.createObjectStore("gate");
    request.onerror = () => { clearTimeout(timer); reject(request.error); };
    request.onblocked = () => { cancelled = true; clearTimeout(timer); reject(new Error("personal_storage_blocked")); };
    request.onsuccess = () => {
      clearTimeout(timer);
      const db = request.result;
      if (cancelled) { db.close(); return; }
      db.onversionchange = () => { db.close(); databasePromise = null; };
      resolve(db);
    };
  }).catch(error => { databasePromise = null; throw error; });
  return databasePromise;
}

function legacyPayload(key) {
  const raw = localStorage.getItem(key);
  return raw === null ? null : JSON.parse(raw);
}
function favoritesFrom(value) {
  if (value !== null && !Array.isArray(value)) throw new Error("invalid_favorites");
  return new Set((value || []).filter(id =>
    (typeof id === "string" && id.trim()) || (typeof id === "number" && Number.isFinite(id))
  ).map(String));
}
function daylogFrom(value) {
  const entries = value === null ? [] : Array.isArray(value) ? value
    : Array.isArray(value?.entries) ? value.entries : typeof value?.text === "string" ? [value] : null;
  if (!entries) throw new Error("invalid_daylog");
  const ids = new Set();
  return entries.filter(entry => entry && typeof entry.text === "string" && entry.text.trim()).map((entry, index) => {
    const ts = Number.isFinite(entry.ts) && Number.isFinite(new Date(entry.ts).getTime()) ? entry.ts : Date.now();
    const base = String(entry.id ?? (Number.isFinite(entry.ts) ? entry.ts : `legacy-entry-${index}`));
    let id = base, suffix = 0;
    while (ids.has(id)) id = `${base}-legacy-${index}-${++suffix}`;
    ids.add(id);
    return { id, text: entry.text.trim(), ts,
      ...(Number.isFinite(entry.updatedTs) && Number.isFinite(new Date(entry.updatedTs).getTime()) ? { updatedTs: entry.updatedTs } : {}) };
  });
}

async function transaction(key, transform) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("gate", transform ? "readwrite" : "readonly");
    const store = tx.objectStore("gate"), request = store.get(key);
    let result, error, previousRaw, writtenRaw, mirrored = false;
    request.onsuccess = () => {
      try {
        const value = request.result === undefined ? legacyPayload(key) : request.result;
        if (!transform) { result = value; return; }
        const next = transform(value);
        result = next.result;
        previousRaw = localStorage.getItem(key);
        writtenRaw = JSON.stringify(next.value);
        // If the old storage cannot be updated, report failure and keep the DB
        // unchanged too. Never silently erase a corrupt legacy payload.
        localStorage.setItem(key, writtenRaw);
        mirrored = true;
        store.put(next.value, key);
      } catch (caught) { error = caught; tx.abort(); }
    };
    tx.oncomplete = () => resolve(result);
    tx.onabort = tx.onerror = () => {
      if (mirrored) {
        try {
          if (localStorage.getItem(key) === writtenRaw) {
            if (previousRaw === null) localStorage.removeItem(key);
            else localStorage.setItem(key, previousRaw);
          }
        } catch { /* The database still retains the last committed data. */ }
      }
      reject(error || tx.error || new Error("personal_storage_failed"));
    };
  });
}

export async function readFavorites() {
  let value;
  try { value = await transaction(FAVORITES_KEY); }
  catch { value = legacyPayload(FAVORITES_KEY); } // Viewing remains possible if IndexedDB is unavailable.
  return favoritesFrom(value);
}
export async function readDaylogEntries() {
  let value;
  try { value = await transaction(DAYLOG_STORAGE_KEY); }
  catch { value = legacyPayload(DAYLOG_STORAGE_KEY); }
  return daylogFrom(value);
}
export function changeFavorite(id, selected) {
  return transaction(FAVORITES_KEY, value => {
    if (typeof selected !== "boolean" || !((typeof id === "string" && id.trim()) || (typeof id === "number" && Number.isFinite(id)))) throw new Error("invalid_favorite_operation");
    const next = favoritesFrom(value);
    if (selected) next.add(String(id)); else next.delete(String(id));
    return { value: [...next], result: next };
  });
}
function conflict() { const error = new Error("personal_conflict"); error.code = "personal_conflict"; return error; }
export function changeDaylog(operation) {
  return transaction(DAYLOG_STORAGE_KEY, value => {
    if (!["add", "edit", "delete"].includes(operation.type) || typeof operation.id !== "string" || !operation.id.trim()) throw new Error("invalid_daylog_operation");
    if (operation.type === "add" && (!operation.entry || operation.entry.id !== operation.id || typeof operation.entry.text !== "string" || !operation.entry.text.trim() || !Number.isFinite(operation.entry.ts) || !Number.isFinite(new Date(operation.entry.ts).getTime()))) throw new Error("invalid_daylog_entry");
    if (operation.type === "edit" && (typeof operation.text !== "string" || !operation.text.trim())) throw new Error("invalid_daylog_text");
    const entries = daylogFrom(value), index = entries.findIndex(entry => entry.id === operation.id);
    if (operation.type === "add") {
      if (index >= 0) throw conflict();
      entries.push(operation.entry);
    } else if (index < 0) {
      if (operation.type !== "delete") throw conflict();
    } else {
      const current = entries[index], expected = operation.expected;
      if (!expected || current.text !== expected.text || current.updatedTs !== expected.updatedTs) throw conflict();
      if (operation.type === "delete") entries.splice(index, 1);
      else if (operation.type === "edit") entries[index] = { ...current, text: operation.text, updatedTs: Math.max(Date.now(), (current.updatedTs || 0) + 1) };
      else throw new Error("invalid_daylog_operation");
    }
    return { value: { entries }, result: entries };
  });
}
