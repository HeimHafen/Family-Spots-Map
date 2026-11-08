# Family Spots Map – Freigabecheck Testrelease

**Stand:** 08.11.2026 · 173 Spots · `20261108-qualitaet-plus-3` · *Testbranch, nicht automatisch live*

## Automatische Prüfungen (im Testpaket)

- [x] JSON, Syntax und Modulpfade
- [x] DE/EN/DA mit 232 Sprachschlüsseln
- [x] 2.458 Filter-Vertragsprüfungen
- [x] 173 eindeutige Spots / 40 Bilddateien
- [x] V1/V2/V3-Sicherungen, beschädigte Archive, Kalenderdaten, Importkonflikte
- [x] Plus-Regeln: normale frühere Partnercodes inaktiv, bisheriger Entwicklerzugang bleibt nutzbar
- [x] Service-Worker-Versionskennung, Offline-Liste und Release-Hashes

- [x] Hosting-Pfadprüfung: Manifest, App-Ressourcen und Service Worker auf Cloudflare + GitHub Pages
- [x] CI-Prüfung auch bei Push auf `test/**` (statt nur `main`/PR)

## Echte Gerätetests (NICHT vorgetäuscht)

- [ ] iPhone-Safari: Header, Tilla, grünes Herz, Navigation, Filter und Spot-Detailansichten
- [ ] Chrome/Android: entsprechende Klick- und Scrollabläufe
- [ ] Alle fünf Bolzplätze: „Treffen & Spiele“ und „Ausflug planen“ öffnen/schließen
- [ ] Neuer Nutzer ohne Code: Plus-Filter/Plus-Spots bleiben gesperrt
- [ ] Entwicklergerät: Entwicklercode eingeben, Plus öffnen, Browser neustarten
- [ ] Frühere normale Test-/Partnercodes aktiv: nach Upgrade Plus nicht mehr aktiv
- [ ] Mein Tag/Favoriten/private Termine sichern und auf einem **separaten Testprofil** wiederherstellen
- [ ] Ältere ZIP-V2- und JSON-V1-Sicherung importieren, bestehende Kalenderpläne beibehalten
- [ ] Flugmodus nach vollständiger Offline-Installation: Hauptseite DE/EN/DA, Spots und Bilder
- [ ] Schlechtes Netz: vollständige Erstinstallation/Update und Fehlermeldungen testen
- [ ] Kein Verlust offener Erinnerungsentwürfe bei SW-Update

## Daten und Offenpunkte

- 4 Spots ohne belastbare allgemeine Quellenlinks und 5 ohne Quellenprüfdatum: **nicht erfinden**.
- Rethener Schulhof ist durch die Schulwebsite belegt; **öffentlicher Zugang** nicht unabhängig bestätigt.
- Windheimstraße: städtische Quelle belegt angrenzenden Skatepark, **nicht** die zwei Bolzplätze selbst.
- Barendsvej: historische Vereinsquelle (2021), **keine** aktuelle Geräte-/Sicherheitsbestätigung.
- Heidfeld: historische Quelle (2011); Harkenblecker Straße: 2026 aktualisierter Eintrag.
- Plus: Lokal/Browser nur als Entwickler-Testmodus, keine harte Zugriffskontrolle auf öffentlich verteilte Daten.
- 144 Offline-Pflichtressourcen (ca. 25 MiB), kein Offline-OSM-Kartenkachelversprechen.

## Veröffentlichung

1. Original-ZIP und den aktuellen Working-Copy-Stand sichern. Bei 71 uncommitteten lokalen Änderungen **noch keine weitere ZIP über dieselbe Arbeitskopie importieren**.
2. Eine saubere Arbeitskopie von `refs/heads/test/fsm-v34-details` verwenden und die **Inhalte** der bereinigten ZIP auf Repository-Wurzelebene importieren. Kein zusätzlicher `Family-Spots-Map-main`-Ordner.
3. Den Git-Diff prüfen; Änderungen **einschließlich Service Worker** als einen Commit übertragen. Historische Dateien in einer bestehenden Arbeitskopie nur nach Sicherung gezielt entfernen.
4. Nach Deploy auf dem Testbranch unbedingt echte mobile Bedienung verifizieren.
5. Erst danach Pull Request nach `main`; keine stillen Änderungen an Originaldaten oder Speicherformaten.

**Leitidee:** Orte entdecken. Menschen verbinden. Erinnerungen schaffen.

- [ ] Apple-/Google-Store-Vorbereitung: `APP_STORE_ROADMAP_2027.md` abarbeiten (kein App-Store-Build in diesem Release).
