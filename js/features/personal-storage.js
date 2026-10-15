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
export function photoIds(entry) {
  const photos = entry?.photos ?? [];
  if (!Array.isArray(photos) || photos.length > 3 || new Set(photos).size !== photos.length || photos.some(id => typeof id !== "string" || !/^[a-f0-9]{64}$/.test(id))) throw new Error("invalid_memory_photos");
  return photos;
}
function daylogFrom(value) {
  const entries = value === null ? [] : Array.isArray(value) ? value
    : Array.isArray(value?.entries) ? value.entries : typeof value?.text === "string" ? [value] : null;
  if (!entries) throw new Error("invalid_daylog");
  const ids = new Set();
  return entries.filter(entry => entry && typeof entry.text === "string" && (entry.text.trim() || photoIds(entry).length)).map((entry, index) => {
    const ts = Number.isFinite(entry.ts) && Number.isFinite(new Date(entry.ts).getTime()) ? entry.ts : Date.now();
    const base = String(entry.id ?? (Number.isFinite(entry.ts) ? entry.ts : `legacy-entry-${index}`));
    let id = base, suffix = 0;
    while (ids.has(id)) id = `${base}-legacy-${index}-${++suffix}`;
    ids.add(id);
    return { id, text: entry.text.trim(), ts,
      ...(photoIds(entry).length ? { photos: photoIds(entry).slice() } : {}),
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
        const next = transform(value, store);
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
  return transaction(DAYLOG_STORAGE_KEY, (value, store) => {
    if (!["add", "edit", "delete"].includes(operation.type) || typeof operation.id !== "string" || !operation.id.trim()) throw new Error("invalid_daylog_operation");
    if (operation.type === "add" && (!operation.entry || operation.entry.id !== operation.id || typeof operation.entry.text !== "string" || (!operation.entry.text.trim() && !photoIds(operation.entry).length) || !Number.isFinite(operation.entry.ts) || !Number.isFinite(new Date(operation.entry.ts).getTime()))) throw new Error("invalid_daylog_entry");
    if (operation.type === "edit" && (typeof operation.text !== "string" || (!operation.text.trim() && !photoIds(operation).length))) throw new Error("invalid_daylog_text");
    const entries = daylogFrom(value), index = entries.findIndex(entry => entry.id === operation.id);
    const oldPhotos = index < 0 ? [] : photoIds(entries[index]);
    if (operation.type === "add") {
      if (index >= 0) throw conflict();
      entries.push({ ...operation.entry, text: operation.entry.text.trim() });
    } else if (index < 0) {
      if (operation.type !== "delete") throw conflict();
    } else {
      const current = entries[index], expected = operation.expected;
      if (!expected || current.text !== expected.text || current.updatedTs !== expected.updatedTs || JSON.stringify(photoIds(current)) !== JSON.stringify(photoIds(expected))) throw conflict();
      if (operation.type === "delete") entries.splice(index, 1);
      else if (operation.type === "edit") entries[index] = { ...current, text: operation.text.trim(), photos: photoIds(operation).slice(), updatedTs: Math.max(Date.now(), (current.updatedTs || 0) + 1) };
      else throw new Error("invalid_daylog_operation");
    }
    const selected = operation.type === "delete" ? [] : photoIds(entries.find(entry => entry.id === operation.id));
    for (const id of selected) {
      const media = operation.media?.find(item => item.id === id);
      if (!media || !(media.blob instanceof Blob) || media.blob.type !== "image/jpeg" || media.blob.size > 1024 * 1024 || !media.blob.size) throw new Error("missing_memory_photo");
      store.put(media.blob, `photo:${id}`);
    }
    const retained = new Set(entries.flatMap(photoIds));
    for (const id of oldPhotos) if (!retained.has(id)) store.delete(`photo:${id}`);
    // Clear the committed photo draft in the same transaction as the memory.
    if (operation.photoDraftKey && operation.photoDraftSlot) {
      const request = store.get(operation.photoDraftKey);
      request.onsuccess = () => {
        try {
          const draft = request.result;
          if (draft?.slots) { delete draft.slots[operation.photoDraftSlot]; store.put(draft, operation.photoDraftKey); }
        } catch { store.transaction.abort(); }
      };
    }
    return { value: { entries }, result: entries };
  });
}

// A backup/import reads both stores under the same gate transaction. Imports
// merge both datasets in one commit, including rollback of the legacy mirrors.
export async function personalSnapshot(imported = null) {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("gate", imported ? "readwrite" : "readonly");
    const store = tx.objectStore("gate");
    const keys = [FAVORITES_KEY, DAYLOG_STORAGE_KEY];
    const values = [], mirrors = [];
    let remaining = keys.length, result, error;
    keys.forEach((key, index) => {
      const request = store.get(key);
      request.onsuccess = () => {
        try {
          values[index] = request.result === undefined ? legacyPayload(key) : request.result;
          if (--remaining) return;
          const favorites = favoritesFrom(values[0]);
          const entries = daylogFrom(values[1]);
          const counts = { favorites: 0, entries: 0, conflicts: 0 };
          if (imported) {
            for (const id of imported.favorites) if (!favorites.has(id)) { favorites.add(id); counts.favorites++; }
            const ids = new Set(entries.map(entry => entry.id));
            const signature = entry => JSON.stringify([entry.ts, entry.text, photoIds(entry)]);
            const seen = new Set(entries.map(signature));
            for (const entry of imported.entries) {
              if (seen.has(signature(entry))) continue;
              let id = entry.id, suffix = 0;
              if (ids.has(id)) {
                counts.conflicts++;
                do { id = `${entry.id.slice(0, 480)}-import-${++suffix}`; } while (ids.has(id));
              }
              entries.push({ ...entry, id }); ids.add(id); seen.add(signature(entry)); counts.entries++;
            }
            const next = [[...favorites], { entries }];
            // All writes are synchronous inside the transaction callback. No
            // other gate writer can change either dataset until commit/abort.
            keys.forEach((key, i) => {
              const previous = localStorage.getItem(key), written = JSON.stringify(next[i]);
              localStorage.setItem(key, written);
              mirrors.push({ key, previous, written });
              store.put(next[i], key);
            });
          }
          const photos = {};
          const used = new Set(entries.flatMap(photoIds));
          if (imported) {
            for (const id of imported.entries.flatMap(photoIds)) {
              const blob = imported.photos?.[id];
              if (!(blob instanceof Blob) || blob.type !== "image/jpeg" || !blob.size || blob.size > 1024 * 1024) throw new Error("missing_memory_photo");
              store.put(blob, `photo:${id}`);
            }
          }
          result = { favorites: [...favorites], entries, counts, photos };
          for (const id of used) {
            const request = store.get(`photo:${id}`);
            request.onsuccess = () => {
              if (!(request.result instanceof Blob)) { error = new Error("missing_memory_photo"); tx.abort(); }
              else photos[id] = request.result;
            };
          }
        } catch (caught) { error = caught; tx.abort(); }
      };
    });
    tx.oncomplete = () => resolve(result);
    tx.onabort = tx.onerror = () => {
      for (const mirror of mirrors.reverse()) {
        try {
          if (localStorage.getItem(mirror.key) === mirror.written) {
            if (mirror.previous === null) localStorage.removeItem(mirror.key);
            else localStorage.setItem(mirror.key, mirror.previous);
          }
        } catch { /* Committed IndexedDB data is still retained. */ }
      }
      reject(error || tx.error || new Error("personal_storage_failed"));
    };
  });
}

// Photo blobs and per-tab photo drafts share the existing transaction gate.
// Only compact photo IDs enter the localStorage mirror, never image bytes.
export async function readPhoto(id) {
  if (!/^[a-f0-9]{64}$/.test(id)) throw new Error("invalid_memory_photo");
  const blob = await transaction(`photo:${id}`);
  if (!(blob instanceof Blob)) throw new Error("missing_memory_photo");
  return blob;
}
export async function readPhotoDraft(key) {
  if (!key.startsWith("photo-draft:")) throw new Error("invalid_photo_draft");
  return transaction(key);
}
export async function writePhotoDraft(key, value) {
  if (!key.startsWith("photo-draft:")) throw new Error("invalid_photo_draft");
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("gate", "readwrite");
    tx.objectStore("gate").put(value, key);
    tx.oncomplete = () => resolve();
    tx.onabort = tx.onerror = () => reject(tx.error || new Error("photo_draft_failed"));
  });
}
