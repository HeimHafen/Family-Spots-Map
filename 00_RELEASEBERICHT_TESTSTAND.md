# Family Spots Map – gemeinsamer Qualitätsstand V4

**Release:** `20261108-fusion-v4-ready` · **Datum:** 08.11.2026 · **Zielbranch:** `test/fsm-v34-details`.

## Vergleich mit der hochgeladenen Live-ZIP

- Live-Archiv: **291** Dateien, alle im äußeren Ordner `Family-Spots-Map-main/`.
- Frühere V3: **309** Dateien auf Wurzelebene; 255 inhaltlich identische, 36 geänderte, 18 neue gegenüber Live.
- V4 führt die notwendigen Änderungen aus V3 zurück auf die Live-Basis; für die spätere Arbeit irrelevante historische TXT-Kopien, alte Backups und früheren Installationsnotizen wurden aus **diesem Importarchiv** entfernt. Die vom Nutzer hochgeladenen Originale wurden nicht verändert.

## Übernommene und tatsächlich geprüfte Verbesserungen

1. **PWA-Verweise:** Hostingneutraler Manifestpfad in DE/EN/DA, auf GitHub Pages und Cloudflare-Root automatisiert kontrolliert.
2. **Plus:** Nur der vorhandene Entwicklerzugang ist in der regulären Benutzeroberfläche freischaltbar. Frühere Test-/Partnercodes funktionieren nicht mehr. Der Entwicklercode liegt nicht als Klartext in der gelieferten `data/partners.json`.
3. **Plus-Texte:** Veraltete Behauptung eines 90-tägigen öffentlichen Familientests aus Code-Eingabe, Status und Über-uns-Erklärungen in allen drei Sprachen entfernt. Neuer automatischer Kopie-/Berechtigungs-Test schützt vor diesem Widerspruch.
4. **Backup:** ZIP-Sicherung V3 für Favoriten, Erinnerungen, lokale Fotos und private Kalenderpläne; ältere JSON-V1- und ZIP-V2-Sicherungen lesbar. Import-/Konfliktregressionen bestanden.
5. **Offline:** 144 Pflichtressourcen, konsistenter Cache und synchronisierte SHA-256-Werte; keine Offlinegarantie für externe OSM-Kartenkacheln. Der Cache kann rund 25 MiB benötigen.
6. **CI:** Testbranch `test/**` wird von GitHub Actions geprüft. Der Live-Deploy bleibt auf `main` beschränkt.
7. **Stabilität:** Die vorhandene Tilla-/Landschaftsoberfläche, das grüne Herz, Navigation, 173 Spot-IDs, Koordinaten, Kategorisierungen und gespeicherte Datenformate bleiben unverändert.
8. **Projektstruktur:** Kein umschließender Ordner im neuen ZIP. Ein einziger aktueller Releasebericht und eine zentrale Importanleitung statt zahlreicher historischer Kopien. Nicht verwendete Leerdateien wurden aus dem Importpaket entfernt.

## Abnahmekriterien – mit Werkzeugen kontrolliert

- `node tools/check-project.mjs`: **bestanden**.
- 173 Spots und 232 Schlüssel je DE/EN/DA; 2.458 Filter-Assertions bestanden.
- 144 Offline-Pflichtressourcen vorhanden; Hosting-Parität (3 Sprachseiten × 2 Hosts, 228 lokale URL-Auflösungen) bestanden.
- Alle registrierten JS-Module, JSON-Daten und Hashwerte geprüft.
- Separate Backup- und Plus-Testreihen bestanden.
- DE/EN/DA-Plus-Kommunikation durch `tools/check-ui-copy.mjs` mit dem echten Rechtezustand abgeglichen.

## Grenzen: Noch keine vollständige Fehlerfreiheit bestätigbar

- Ein lokaler Chromium-Browsertest wurde versucht, war jedoch durch eine Umgebungsrichtlinie (`ERR_BLOCKED_BY_ADMINISTRATOR`) blockiert. Somit **keine** belastbare echte Darstellung, Touchbedienung, Foto-/Kalender-UI- oder E2E-Laufzeitabnahme aus diesem Durchlauf.
- Cloudflare und GitHub wurden nicht geändert. Ein frisch veröffentlichtes Live-V4-Deployment existiert dadurch nicht.
- **4** allgemeine Quellenlinks und **5** Quellendaten bleiben offen, weil kein prüfbarer Beleg hinzugefügt werden konnte. Keine neuen Quellen erfunden; `verified`-Werte nicht geändert.
- Plus ist weiterhin eine **clientseitige Entwicklungsfreischaltung**, keine manipulationssichere kostenpflichtige Autorisierung.
- Für App Store / Google Play 2027 sind native Integration, Datenschutzerklärung, Store-Regeln, Testgeräte und eventuell serverseitige Zugangsprüfung noch separat zu bearbeiten.
- Die Optik wurde **bewahrt, nicht ohne Browsernachweis neu gestaltet**. Ein Anspruch „alle Fehler behoben / pixelperfekt“ wäre unhaltbar.

## Git / Working Copy – wichtige Grenze

Die letzte beobachtete Working-Copy-Arbeitskopie hatte **71 lokale Änderungen** und zwischenzeitlich die Meldung `The index is locked`. Daher **dieses ZIP nicht einfach über dieselbe ungeklärte Arbeitskopie importieren**. Bestehende Änderungen zuerst sichern und einen sauberen Test-Checkout vorbereiten.

Eine vollständige ZIP ist kein Git-Löschkommando: Historische Dateien, die bereits im Repository verfolgt werden, bleiben dort erhalten, bis sie ausdrücklich und nach Kontrolle gelöscht/committed werden.

**Working Copy – Zusammenfassung:** `V4 Qualität: Live-Abgleich, Plus-Texte, sichere Backups, PWA und Projektbereinigung`

**Detaillierte Informationen:** `173 Spots unverändert; Cloudflare/GitHub Pages PWA-Pfade korrigiert; Entwickler-Plus ohne öffentliche 90-Tage-Zusage; persönliches Backup V3 mit Kalender; Projekt-/Hosting-/Plus-Tests; historische Austauschkopien aus Importpaket entfernt. Kein Redesign.`

**Vorhandene oder neue Remote-Referenz:** `refs/heads/test/fsm-v34-details`  
**Source-Referenz:** `refs/heads/test/fsm-v34-details`  
**Force Push:** Aus · `main` unverändert.

**Leitgedanke:** Orte entdecken. Menschen verbinden. Erinnerungen schaffen.
