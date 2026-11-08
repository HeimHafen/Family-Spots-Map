# Family Spots Map – Freigabecheck Testrelease

**Stand:** 08.11.2026 · 173 Spots · `20261108-qualitaet-plus-2` · *Testbranch, nicht automatisch live*

## Automatische Prüfungen (im Testpaket)

- [x] JSON, Syntax und Modulpfade
- [x] DE/EN/DA mit 232 Sprachschlüsseln
- [x] 2.458 Filter-Vertragsprüfungen
- [x] 173 eindeutige Spots / 40 Bilddateien
- [x] V1/V2/V3-Sicherungen, beschädigte Archive, Kalenderdaten, Importkonflikte
- [x] Plus-Regeln: normale frühere Partnercodes inaktiv, bisheriger Entwicklerzugang bleibt nutzbar
- [x] Service-Worker-Versionskennung, Offline-Liste und Release-Hashes

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

1. Original-ZIP sichern und aus dieser ZIP nur die freigegebenen geänderten Dateien verwenden.
2. In `refs/heads/test/gemeinsam-v88-finish` testen (Quelle `main` unverändert; **Force Push aus**).
3. Alle geänderten Dateien **einschließlich Service Worker** zusammen übertragen.
4. Nach Deploy auf dem Testbranch unbedingt echte mobile Bedienung verifizieren.
5. Erst danach Pull Request nach `main`; keine stillen Änderungen an Originaldaten oder Speicherformaten.

**Leitidee:** Orte entdecken. Menschen verbinden. Erinnerungen schaffen.
