import { personalSnapshot } from "./personal-storage.js";

const FORMAT = "family-spots-personal-backup";
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
const stamp = n => Number.isSafeInteger(n) && n >= 0 && Number.isFinite(new Date(n).getTime());
const invalid = () => { const e = new Error("invalid_backup"); e.code = "invalid_backup"; return e; };

export function parseBackup(text) {
  if (typeof text !== "string" || new Blob([text]).size > MAX_BACKUP_BYTES) throw invalid();
  let data;
  try { data = JSON.parse(text); } catch { throw invalid(); }
  if (!data || data.format !== FORMAT || data.version !== 1 ||
      !Array.isArray(data.favorites) || !Array.isArray(data.entries) ||
      data.favorites.length > 20000 || data.entries.length > 20000) throw invalid();
  if (data.favorites.some(id => typeof id !== "string" || !id.trim() || id.length > 512)) throw invalid();
  const entries = data.entries.map(entry => {
    if (!entry || typeof entry.id !== "string" || !entry.id.trim() || entry.id.length > 512 ||
        typeof entry.text !== "string" || !entry.text.trim() || entry.text.length > 100000 ||
        !stamp(entry.ts) || (entry.updatedTs !== undefined && !stamp(entry.updatedTs))) throw invalid();
    return { id: entry.id, text: entry.text.trim(), ts: entry.ts,
      ...(entry.updatedTs !== undefined ? { updatedTs: entry.updatedTs } : {}) };
  });
  return { favorites: [...new Set(data.favorites)], entries };
}

export async function exportPersonalBackup() {
  const { favorites, entries } = await personalSnapshot();
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

const copy = {
  de: {
    title: "Erinnerungen & Favoriten sichern", export: "Daten exportieren", import: "Daten importieren",
    hint: "Sichere gespeicherte Erinnerungen und Favoriten als Datei. Beim Import bleiben vorhandene Daten erhalten. Entwürfe und Plus-Zugänge sind nicht enthalten. Bewahre die Datei privat auf.",
    exported: "Die Sicherungsdatei wurde zum Download bereitgestellt. Bitte bewahre sie sicher auf.",
    exportLarge: "Die Sicherung ist für dieses Dateiformat zu groß oder enthält nicht unterstützte Daten. Deine gespeicherten Daten bleiben erhalten.",
    invalid: "Diese Datei ist keine unterstützte Sicherung oder größer als 5 MB. Es wurde nichts importiert.",
    failed: "Die Sicherung konnte nicht verarbeitet werden. Bitte prüfe den verfügbaren Speicher und versuche es erneut.",
    draft: "Bitte speichere oder schließe deine offenen Erinnerungstexte vor dem Import.",
    imported: (e, f, c) => `Import abgeschlossen: ${e} Erinnerungen und ${f} Favoriten hinzugefügt.${c ? " Abweichende Versionen wurden als zusätzliche Erinnerungen erhalten." : ""}`
  },
  en: {
    title: "Back up memories & favourites", export: "Export data", import: "Import data",
    hint: "Save your stored memories and favourites to a file. Importing keeps existing data. Drafts and Plus access are not included. Keep the file private.",
    exported: "The backup file is ready to download. Please keep it somewhere safe.",
    exportLarge: "The backup is too large for this file format or contains unsupported data. Your stored data has been kept.",
    invalid: "This file is not a supported backup or exceeds 5 MB. Nothing was imported.",
    failed: "The backup could not be processed. Please check available storage and try again.",
    draft: "Please save or close your unfinished memory texts before importing.",
    imported: (e, f, c) => `Import complete: ${e} memories and ${f} favourites added.${c ? " Different versions were kept as additional memories." : ""}`
  },
  da: {
    title: "Sikkerhedskopi af minder og favoritter", export: "Eksportér data", import: "Importér data",
    hint: "Gem dine gemte minder og favoritter i en fil. Ved import bevares eksisterende data. Kladder og Plus-adgang er ikke inkluderet. Opbevar filen privat.",
    exported: "Sikkerhedskopien er klar til download. Opbevar den et sikkert sted.",
    exportLarge: "Sikkerhedskopien er for stor til dette filformat eller indeholder data, som ikke understøttes. Dine gemte data er bevaret.",
    invalid: "Filen er ikke en understøttet sikkerhedskopi eller er større end 5 MB. Intet blev importeret.",
    failed: "Sikkerhedskopien kunne ikke behandles. Kontrollér den ledige lagerplads, og prøv igen.",
    draft: "Gem eller luk dine ufærdige mindetekster før import.",
    imported: (e, f, c) => `Import afsluttet: ${e} minder og ${f} favoritter tilføjet.${c ? " Forskellige versioner blev bevaret som ekstra minder." : ""}`
  }
};

export function initPersonalBackup({ afterImport, hasDraft }) {
  const host = document.querySelector("#daylog-section .filter-group");
  if (!host || document.getElementById("personal-backup")) return;
  const section = document.createElement("div"); section.id = "personal-backup";
  section.style.cssText = "margin-top:18px;display:grid;gap:10px;min-width:0";
  const heading = document.createElement("h3"); heading.style.cssText = "margin:0;font:inherit;font-weight:600";
  const hint = document.createElement("p"); hint.className = "filter-group-helper"; hint.id = "personal-backup-hint"; hint.style.margin = "0";
  const row = document.createElement("div"); row.style.cssText = "display:flex;flex-wrap:wrap;gap:8px";
  const exportButton = document.createElement("button"), importButton = document.createElement("button");
  for (const button of [exportButton, importButton]) {
    button.type = "button"; button.className = "btn-ghost btn-small";
    button.style.cssText = "min-height:44px;max-width:100%;white-space:normal";
    button.setAttribute("aria-describedby", hint.id);
  }
  exportButton.id = "personal-backup-export"; importButton.id = "personal-backup-import";
  const input = document.createElement("input"); input.type = "file"; input.accept = ".json,application/json"; input.hidden = true;
  const status = document.createElement("p"); status.id = "personal-backup-status"; status.setAttribute("role", "status"); status.setAttribute("aria-atomic", "true"); status.className = "filter-group-helper"; status.style.margin = "0";
  status.hidden = true;
  row.append(exportButton, importButton); section.append(heading, hint, row, input, status); host.append(section);
  const language = () => copy[document.documentElement.lang] || copy.de;
  let statusKey = null, counts = null;
  const translate = () => {
    const t = language(); heading.textContent = t.title; hint.textContent = t.hint;
    exportButton.textContent = t.export; importButton.textContent = t.import;
    if (statusKey) status.textContent = statusKey === "imported" ? t.imported(counts.entries, counts.favorites, counts.conflicts) : t[statusKey];
  };
  const announce = key => { statusKey = key; status.hidden = false; translate(); };
  const busy = value => { exportButton.disabled = importButton.disabled = value; section.setAttribute("aria-busy", String(value)); };
  translate(); new MutationObserver(translate).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  exportButton.addEventListener("click", async () => {
    busy(true);
    try {
      const text = await exportPersonalBackup();
      const url = URL.createObjectURL(new Blob([text], { type: "application/json;charset=utf-8" }));
      const link = document.createElement("a"); link.href = url;
      link.download = `family-spots-sicherung-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      announce("exported");
    } catch (error) { announce(error.code === "invalid_backup" ? "exportLarge" : "failed"); }
    finally { busy(false); }
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
      if (file.size > MAX_BACKUP_BYTES) throw invalid();
      const text = await file.text();
      if (hasDraft()) { announce("draft"); return; }
      const result = await importPersonalBackup(text);
      counts = result.counts; announce("imported");
      await afterImport();
    } catch (error) { announce(error.code === "invalid_backup" ? "invalid" : "failed"); }
    finally { input.value = ""; busy(false); importButton.focus(); }
  });
}
