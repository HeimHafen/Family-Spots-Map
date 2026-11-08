# Family Spots Map – Änderungs- und Übergabebericht

**Stand:** 08.11.2026  
**Neue Testversion:** `20261108-qualitaet-plus-2`  
**Basis:** hochgeladenes `Family-Spots-Map-main 2(1).zip` (`20261108-wasserfilter-quellen-1`)  
**GitHub/Live:** **NICHT verändert.**  
**Umfang:** 20 geänderte bzw. neue aktive Projektdateien; 29 aktualisierte TXT-Quelldateikopien im Testarchiv.

## 1. Plus: ausschließlich Entwicklerfreischaltung

- **Ohne Code:** Plus bleibt in der normalen Bedienung inaktiv. Die globale Entwicklungs-Zwangsfreischaltung steht auf `false`.
- **Eigener bisheriger Entwicklercode:** bleibt gültig; er wird weiterhin im vorhandenen Plus-Dialog eingegeben. Der exakte Code wird nicht in diesem Bericht veröffentlicht.
- **Andere bisherige Partner-, Familien-, Test- und Aktionscodes:** nicht mehr einlösbar. Schon auf demselben Gerät gespeicherte gewöhnliche Plus-Testberechtigungen werden nicht mehr als aktiv akzeptiert.
- **Klartextcodes:** aus `data/partners.json` und dem zusätzlich gefundenen `data/codes.json` entfernt. Der aktive Prüfeintrag in `partners.json` enthält lediglich den SHA-256-Abdruck des Entwicklercodes.
- **Einschränkung, ausdrücklich:** Diese Maßnahme ist eine **normale UI-Freischaltung für den Prototyp**, keine sichere Authentifizierung. Benutzer können den öffentlich geladenen JavaScript-Code verändern. Außerdem ist der ursprünglich veröffentlichte Entwicklercode möglicherweise über alte GitHub-Commits/Archive weiterhin rekonstruierbar. Vor einem Bezahlsystem müssen die Entwicklerkennung erneuert, Berechtigungen serverseitig geprüft und exklusive Inhalte passend geschützt werden. Der Code ist nicht gerätegebunden; wer den Entwicklercode kennt, kann ihn ebenfalls verwenden.

## 2. Datensicherung und privater Kalender

- Persönliche ZIP-Sicherungen haben nun **Version 3**: Favoriten, Erinnerungen, zugehörige Fotos und **gespeicherte private Ausflugspläne**.
- Vorhandene **V1-JSON- und V2-ZIP-Sicherungen** bleiben importierbar. Alte Dateien ändern die privaten Kalenderpläne nicht.
- Import führt Zusammenführungen statt Überschreiben aus. Echte Dubletten werden ausgelassen; Einträge mit gleicher ID, aber anderem Inhalt erhalten eine neue ID.
- Ein ungültiger Import bricht ohne beabsichtigte Datenänderung ab. Sicherungen enthalten **keine** Entwürfe und keine Plus-Berechtigungen. ZIP-Sicherungen sind **nicht verschlüsselt** und müssen privat aufbewahrt werden.
- Wichtig: Das Browserprofil bleibt Speicherort der privaten Daten. Keine Cloud-Synchronisation. Vor jedem Gerätewechsel oder Löschen der Browserdaten eine vollständige ZIP-Sicherung exportieren.

## 3. Spotquellen nachgearbeitet

- Fehlende allgemeine Quellenlinks: **7 → 4**.
- Fehlende Quellenprüfdaten: **10 → 5**.
- Zusätzliche Quellen-/Prüfmetadaten an Barendsvej, Windheimstraße, Grundschule Rethen, Heidfeld und Harkenblecker Straße.
- Für die Rethener Schule wird der öffentliche Zugang nicht mehr ungeprüft behauptet; Hinweistext DE/EN/DA entsprechend vorsichtig gefasst.
- Ältere Belege und Quellen über **benachbarte** Orte sind ausdrücklich als nur eingeschränkt aussagekräftig gekennzeichnet. Keine ungeprüfte Hochstufung von `verified`.
- Die verbleibenden 4 bzw. 5 Lücken sind absichtlich sichtbar geblieben: keine erfundenen Quellen, Prüfdaten oder Vor-Ort-Bestätigungen.

## 4. Stabilität, Offline und Dokumentation

- `tools/check-plus-owner.mjs` als zusätzliche automatische Veröffentlichungsprüfung neu integriert.
- Kalender-Import-/Backupregressionen zum vorhandenen `tools/check-backups.mjs` ergänzt.
- Service Worker, HTML (DE/EN/DA), CSS, zentrale JavaScript-Dateien und Prüfsummen auf denselben Release `20261108-qualitaet-plus-2` abgestimmt.
- 144 Offline-Pflichtdateien, der vorhandene Bildbestand und die Offline-Strategie bewahrt. Die ca. **25 MiB** Erstinstallationslast ist aus Stabilitätsgründen **noch nicht** verkleinert worden. Kartentiles externer Anbieter sind nicht generell offline nutzbar.
- `README.md`, `DEV_CHECKLIST.md` und die TXT-Austauschkopien an den neuen Teststand angepasst.
- Kein neues visuelles Design: Tilla, das aktuelle grüne Herz, Navigationsgestaltung, Spot-IDs, Koordinaten und die vorhandenen 173 Spotdatensätze bleiben grundsätzlich erhalten.

## 5. Automatische Abnahme – bestanden

Ausgeführt: `node tools/check-project.mjs` nach dem abschließenden Releaseaufbau.

- 173 Spots, 232 Übersetzungsschlüssel **je** Sprache, DE/EN/DA.
- 144 Offline-Pflichtdateien, gültige Release-Hashes, keine fehlenden Moduldateien.
- 2.458 Filter-Assertions bestanden.
- V1/V2/V3 Backupprüfungen, private Kalender und beschädigte Archive bestanden.
- Plus: default OFF; alte Partnerfreischaltung OFF; Entwicklerzustand ON; Klartextdatei leer.
- Kategorien, Filterverträge, Datenstruktur und Eintragsinformationen bestanden.
- Projektprüfung meldet **0 Fehler**.

**Nicht als getestet ausgeben:** Echte Touch- und Laufzeittests in iPhone-Safari und Android-Chrome. Ein verfügbarer Chromium-Aufruf in der eingeschränkten Umgebung lieferte keinen nutzbaren DOM; deshalb wird keine Browser-Freigabe behauptet. Auch echte Vor-Ort-Prüfungen, Live-Routing und ein vollständiger Test der Service-Worker-Updates unter schlechter Verbindung fehlen. Der CSS- und UI-Aufbau wurde nicht neu gestaltet.

## 6. Sichere Installation mit Working Copy

1. **Vorher sichern:** Aktuellen Working-Copy-Stand und den aktuellen Live-Stand als ZIP sichern. Nutzer, die persönliche Daten im Browser gespeichert haben, sollen vorher in der App einen persönlichen Datenexport anlegen.
2. **Test statt Main:** Von unverändertem `main` einen separaten Arbeits- bzw. Testbranch benutzen; bevorzugte Zielreferenz: `refs/heads/test/gemeinsam-v88-finish`. Bestehende dortige Änderungen **nicht überschreiben**: vorher Pull/Fetch und Konflikte überprüfen. **Force Push: Aus.**
3. **Eine Variante wählen:** Entweder das **vollständige Testprojekt-ZIP** für einen sauberen Testimport nutzen oder die **20 Austauschdateien** aus dem separaten TXT-Paket in **genau gleichen Unterordnern** übernehmen (Dateiendung `.txt` beim Austauschen entfernen). Keine historischen Dateien aus anderen Austauschpaketen mischen.
4. Besonders wichtig: `data/partners.json`, `data/codes.json`, `js/features/plus.js`, `js/storage.js`, `js/features/calendar-backup.js`, `js/features/personal-storage.js`, `js/features/personal-backup.js`, `service-worker.js` sowie die drei HTML-Sprachseiten **zusammen** veröffentlichen.
5. Vor Push auf einem Rechner mit Node.js `node tools/check-project.mjs` ausführen; 0 Fehler verlangen. Working Copy auf dem iPhone kann die Node-Prüfung nicht unmittelbar ausführen.
6. **Branch-Publishing:** GitHub Pages wird im vorhandenen Repository gewöhnlich aus `main` ausgerollt. **Nur ein Push auf den Testbranch macht die geänderte App nicht automatisch als separate GitHub-Pages-Seite sichtbar.** Für einen echten getrennten Browsertest eine eigene Preview-Veröffentlichung konfigurieren oder die Testdateien lokal via HTTP bereitstellen.
7. In der Vorschau nacheinander testen: neuer Nutzer ohne Code, Entwicklercode, alte Testcodes, Karte und Filter, DE/EN/DA, alle Buttons bei den fünf Bolzplätzen, Backup-Export/Import auf einem **separaten Testprofil**, Offline-Neuinstallation und Update nach Rückkehr aus dem Flugmodus.
8. Erst nach Abnahme per Pull Request nach `main` übernehmen und live auf mehreren Geräten prüfen. Browserdaten **nicht** zum Erzwingen eines Updates löschen.

**Working Copy – Zusammenfassung:** `Plus nur für Entwickler; Kalender-Backup V3, Quellen & Qualitätssicherung`

**Working Copy – detaillierte Informationen:** `173 Spots beibehalten. Partner/Testcodes deaktiviert, Entwicklercode per SHA-256 geprüft, kein Plus-Zwangsmodus. Persönliche ZIP-Sicherung um private Kalenderpläne erweitert (V3; V1/V2 kompatibel). 5 Spotquellen nachgeprüft, verbleibende Lücken gekennzeichnet. Offline-Manifest/Release-Hashes und DE/EN/DA angeglichen; Tests 0 Fehler.`

**Working Copy – Vorhandene oder neue Remote-Referenz:**

```text
refs/heads/test/gemeinsam-v88-finish
```

**Source-Branch:** `main` unverändert. **Force Push:** `Aus`.

## 7. Alle 20 tatsächlich betroffenen aktiven Dateien

- `DEV_CHECKLIST.md`
- `README.md`
- `css/styles.css`
- `da/index.html`
- `data/codes.json`
- `data/partners.json`
- `data/spots.json`
- `en/index.html`
- `index.html`
- `js/app.js`
- `js/features/calendar-backup.js` **(neu)**
- `js/features/personal-backup.js`
- `js/features/personal-storage.js`
- `js/features/plus.js`
- `js/map.js`
- `js/storage.js`
- `service-worker.js`
- `tools/check-backups.mjs`
- `tools/check-plus-owner.mjs` **(neu)**
- `tools/check-project.mjs`

**Leitmotiv:** Orte entdecken. Menschen verbinden. Erinnerungen schaffen.
