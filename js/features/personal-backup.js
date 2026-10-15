import { photoIds, personalSnapshot } from "./personal-storage.js";

import { writeZip, readZip, MAX_ARCHIVE_BYTES } from "./backup-zip.js";
import { validatePhoto } from "./memory-images.js";

const FORMAT = "family-spots-personal-backup";
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
const stamp = n => Number.isSafeInteger(n) && n >= 0 && Number.isFinite(new Date(n).getTime());
const invalid = () => { const e = new Error("invalid_backup"); e.code = "invalid_backup"; return e; };

export function parseBackup(text, version = 1) {
  if (![1, 2].includes(version) || typeof text !== "string" || new Blob([text]).size > MAX_BACKUP_BYTES) throw invalid();
  let data;
  try { data = JSON.parse(text); } catch { throw invalid(); }
  if (!data || data.format !== FORMAT || data.version !== version ||
      !Array.isArray(data.favorites) || !Array.isArray(data.entries) ||
      data.favorites.length > 20000 || data.entries.length > 20000) throw invalid();
  if (data.favorites.some(id => typeof id !== "string" || !id.trim() || id.length > 512)) throw invalid();
  const safePhotos = entry => { try { return photoIds(entry); } catch { throw invalid(); } };
  const entries = data.entries.map(entry => {
    if (version === 1 && entry?.photos?.length) throw invalid();
    if (!entry || typeof entry.id !== "string" || !entry.id.trim() || entry.id.length > 512 ||
        typeof entry.text !== "string" || (!entry.text.trim() && !(version === 2 && safePhotos(entry).length)) || entry.text.length > 100000 ||
        !stamp(entry.ts) || (entry.updatedTs !== undefined && !stamp(entry.updatedTs))) throw invalid();
    return { id: entry.id, text: entry.text.trim(), ts: entry.ts,
      ...(version === 2 && safePhotos(entry).length ? { photos: safePhotos(entry).slice() } : {}),
      ...(entry.updatedTs !== undefined ? { updatedTs: entry.updatedTs } : {}) };
  });
  return { favorites: [...new Set(data.favorites)], entries };
}

export async function exportPersonalBackup() {
  const { favorites, entries } = await personalSnapshot();
  if (entries.some(entry => photoIds(entry).length)) throw invalid(); // Use the complete archive API for photos.
  const data = { format: FORMAT, version: 1, exportedAt: new Date().toISOString(), favorites, entries };
  const text = JSON.stringify(data, null, 2);
  // Never offer a backup which this version cannot restore.
  parseBackup(text);
  return text;
}
export async function importPersonalBackup(text) {
  const data = parseBackup(text); // Validate the complete file before any writes.
  return personalSnapshot(data);
}

// A single consistent snapshot includes both memory metadata and all image blobs.
export async function exportPersonalArchive() {
  const { favorites, entries, photos } = await personalSnapshot();
  const manifest = JSON.stringify({ format: FORMAT, version: 2, exportedAt: new Date().toISOString(), favorites, entries }, null, 2);
  parseBackup(manifest, 2);
  const files = [{ name: "manifest.json", blob: new Blob([manifest], { type: "application/json" }) }];
  for (const id of Object.keys(photos).sort()) {
    await validatePhoto(photos[id], id);
    files.push({ name: `photos/${id}.jpg`, blob: photos[id] });
  }
  return writeZip(files);
}
export async function importPersonalFile(file, mayImport = () => true) {
  if (!(file instanceof Blob) || file.size > MAX_ARCHIVE_BYTES) throw invalid();
  const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  let data;
  if (signature[0] === 80 && signature[1] === 75) {
    const files = await readZip(file);
    data = parseBackup(await files.get("manifest.json").text(), 2);
    const ids = new Set(data.entries.flatMap(photoIds));
    if (files.size !== ids.size + 1) throw invalid();
    data.photos = {};
    for (const id of ids) {
      const blob = files.get(`photos/${id}.jpg`);
      try { await validatePhoto(blob, id); } catch { throw invalid(); }
      data.photos[id] = blob;
    }
  } else {
    if (file.size > MAX_BACKUP_BYTES) throw invalid();
    data = parseBackup(await file.text());
  }
  // Recheck after asynchronous image validation; never import over a new draft.
  if (!mayImport()) { const error = new Error("draft"); error.code = "draft"; throw error; }
  return personalSnapshot(data);
}

const copy = {
  de: {
    title: "Erinnerungen & Favoriten sichern", brief: "Erinnerungen, Fotos und Favoriten gemeinsam als Datei sichern.", info: "Hinweise zur Sicherung", export: "Daten exportieren", import: "Daten importieren",
    hint: "Beim Import bleiben vorhandene Daten erhalten. Die ZIP-Datei enthält auch gespeicherte Fotos. Bisherige JSON-Sicherungen lassen sich weiterhin importieren. Entwürfe und Plus-Zugänge sind nicht enthalten. Bewahre die Datei privat auf.",
    exported: "Die Sicherungsdatei wurde zum Download bereitgestellt. Bitte bewahre sie sicher auf.",
    exportLarge: "Die Sicherung ist für dieses Dateiformat zu groß oder enthält nicht unterstützte Daten. Deine gespeicherten Daten bleiben erhalten.",
    invalid: "Diese Datei ist keine unterstützte Sicherung oder zu groß (ZIP: höchstens 100 MB, JSON: 5 MB). Es wurde nichts importiert.",
    failed: "Die Sicherung konnte nicht verarbeitet werden. Bitte prüfe den verfügbaren Speicher und versuche es erneut.",
    draft: "Bitte speichere deine offenen Erinnerungen samt Fotos vor dem Import oder brich die Bearbeitung ab.",
    imported: (e, f, c) => e === 0 && f === 0 ? "Die Sicherung ist bereits vollständig vorhanden. Es wurden keine doppelten Einträge hinzugefügt." : `Import abgeschlossen: ${e} ${e === 1 ? "Erinnerung" : "Erinnerungen"} und ${f} ${f === 1 ? "Favorit" : "Favoriten"} hinzugefügt.${c ? " Abweichende Versionen wurden als zusätzliche Erinnerungen erhalten." : ""}`
  },
  en: {
    title: "Back up memories & favourites", brief: "Back up memories, photos and favourites together in one file.", info: "Backup information", export: "Export data", import: "Import data",
    hint: "Importing keeps existing data. The ZIP file also includes saved photos. Previous JSON backups can still be imported. Drafts and Plus access are not included. Keep the file private.",
    exported: "The backup file is ready to download. Please keep it somewhere safe.",
    exportLarge: "The backup is too large for this file format or contains unsupported data. Your stored data has been kept.",
    invalid: "This file is not a supported backup or is too large (ZIP: up to 100 MB, JSON: 5 MB). Nothing was imported.",
    failed: "The backup could not be processed. Please check available storage and try again.",
    draft: "Please save unfinished memories, including selected photos, or cancel editing before importing.",
    imported: (e, f, c) => e === 0 && f === 0 ? "Everything in this backup is already present. No duplicate entries were added." : `Import complete: ${e} ${e === 1 ? "memory" : "memories"} and ${f} ${f === 1 ? "favourite" : "favourites"} added.${c ? " Different versions were kept as additional memories." : ""}`
  },
  da: {
    title: "Sikkerhedskopi af minder og favoritter", brief: "Gem minder, billeder og favoritter sammen i én fil.", info: "Om sikkerhedskopiering", export: "Eksportér data", import: "Importér data",
    hint: "Eksisterende data bevares ved import. ZIP-filen indeholder også gemte billeder. Tidligere JSON-sikkerhedskopier kan stadig importeres. Kladder og Plus-adgang er ikke med. Opbevar filen privat.",
    exported: "Sikkerhedskopien er klar til download. Opbevar den et sikkert sted.",
    exportLarge: "Sikkerhedskopien er for stor til dette filformat eller indeholder data, som ikke understøttes. Dine gemte data er bevaret.",
    invalid: "Filen er ikke en understøttet sikkerhedskopi eller er for stor (ZIP: højst 100 MB, JSON: 5 MB). Intet blev importeret.",
    failed: "Sikkerhedskopien kunne ikke behandles. Kontrollér den ledige lagerplads, og prøv igen.",
    draft: "Gem ufærdige minder med de valgte billeder, eller annuller redigeringen før import.",
    imported: (e, f, c) => e === 0 && f === 0 ? "Alt i sikkerhedskopien findes allerede. Ingen dubletter blev tilføjet." : `Import afsluttet: ${e} ${e === 1 ? "minde" : "minder"} og ${f} ${f === 1 ? "favorit" : "favoritter"} tilføjet.${c ? " Forskellige versioner blev bevaret som ekstra minder." : ""}`
  }
};

export function initPersonalBackup({ afterImport, hasDraft, setBusy = () => {} }) {
  const host = document.querySelector("#daylog-section .filter-group");
  if (!host || document.getElementById("personal-backup")) return;
  const section = document.createElement("details"); section.id = "personal-backup"; section.className = "memory-backup";
  const summary = document.createElement("summary");
  const heading = document.createElement("span"); summary.append(heading);
  const body = document.createElement("div"); body.className = "memory-backup-body";
  const brief = document.createElement("p"); brief.className = "filter-group-helper"; brief.id = "personal-backup-hint";
  const help = document.createElement("details"); help.className = "memory-help";
  const helpTitle = document.createElement("summary");
  const hint = document.createElement("p"); hint.className = "filter-group-helper";
  help.append(helpTitle, hint);
  const row = document.createElement("div"); row.className = "memory-backup-actions";
  const exportButton = document.createElement("button"), importButton = document.createElement("button");
  for (const button of [exportButton, importButton]) {
    button.type = "button"; button.className = "btn-ghost btn-small";
    button.style.cssText = "min-height:44px;max-width:100%;white-space:normal";
    button.setAttribute("aria-describedby", brief.id);
  }
  exportButton.id = "personal-backup-export"; importButton.id = "personal-backup-import";
  const input = document.createElement("input"); input.type = "file"; input.accept = ".zip,.json,application/zip,application/json"; input.hidden = true;
  const status = document.createElement("p"); status.id = "personal-backup-status"; status.setAttribute("role", "status"); status.setAttribute("aria-atomic", "true"); status.className = "filter-group-helper"; status.style.margin = "0";
  status.hidden = true;
  row.append(exportButton, importButton); body.append(brief, row, help, input, status); section.append(summary, body); host.append(section);
  const language = () => copy[document.documentElement.lang] || copy.de;
  let statusKey = null, counts = null;
  const translate = () => {
    const t = language(); heading.textContent = t.title; brief.textContent = t.brief; hint.textContent = t.hint; helpTitle.textContent = t.info;
    exportButton.textContent = t.export; importButton.textContent = t.import;
    if (statusKey) status.textContent = statusKey === "imported" ? t.imported(counts.entries, counts.favorites, counts.conflicts) : t[statusKey];
  };
  const announce = key => { section.open = true; statusKey = key; status.hidden = false; translate(); };
  const busy = value => { setBusy(value); exportButton.disabled = importButton.disabled = value; section.setAttribute("aria-busy", String(value)); };
  const restoreFocus = button => {
    if (document.activeElement === document.body || document.activeElement === input) button.focus({ preventScroll: true });
  };
  input.addEventListener("cancel", () => restoreFocus(importButton));
  translate(); new MutationObserver(translate).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  exportButton.addEventListener("click", async () => {
    busy(true);
    try {
      const archive = await exportPersonalArchive();
      const url = URL.createObjectURL(archive);
      const link = document.createElement("a"); link.href = url;
      link.download = `family-spots-sicherung-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      announce("exported");
    } catch (error) { announce(error.code === "invalid_backup" ? "exportLarge" : "failed"); }
    finally { busy(false); restoreFocus(exportButton); }
  });
  importButton.addEventListener("click", () => {
    if (hasDraft()) { announce("draft"); return; }
    input.value = ""; input.click();
  });
  input.addEventListener("change", async () => {
    const file = input.files?.[0]; if (!file) return;
    if (hasDraft()) { announce("draft"); input.value = ""; return; }
    busy(true);
    try {
      const result = await importPersonalFile(file, () => !hasDraft());
      counts = result.counts; announce("imported");
      await afterImport();
    } catch (error) { announce(error.code === "draft" ? "draft" : error.code === "invalid_backup" ? "invalid" : "failed"); }
    finally { input.value = ""; busy(false); restoreFocus(importButton); }
  });
}
