# Family Spots Map 🐢

**Die schönste Karte für Familien-Abenteuer**  
**Orte entdecken. Menschen verbinden. Erinnerungen schaffen.**

Family Spots Map ist eine dreisprachige, kartenbasierte Web-App für gemeinsame Familienerlebnisse. Sie hilft beim Entdecken von Ausflugsorten, beim privaten Planen von Unternehmungen und beim Bewahren von Erinnerungen – ohne eine öffentliche Social-Media-Plattform für Kinder zu sein.

**Sprachen:** Deutsch · English · Dansk  
**Produktivseite:** https://heimhafen.github.io/Family-Spots-Map/  
**Projekt:** https://github.com/HeimHafen/Family-Spots-Map

## Teststand – 8. November 2026

**Basis:** hochgeladene Live-ZIP `Family-Spots-Map-main 3.zip` mit 291 Dateien; technische Verbesserungsvorlage `20261108-qualitaet-plus-3`.
**Dieses Archiv:** bereinigtes Testrelease `20261108-fusion-v4-ready` (nicht automatisch veröffentlicht).
**Ausgangs-Testbranch:** `test/fsm-v34-details`, zuletzt bestätigter Cloudflare-Deploy vor diesem Update: `fac5320` (`20261108-qualitaet-plus-2`).
Der aktuelle GitHub-`main` und der Stand auf einem konkreten Endgerät müssen vor einer Übernahme gesondert abgeglichen werden. Alte Austausch-TXT-Dateien, historische Backups und frühere Installationsanleitungen sind aus diesem bereinigten Importarchiv entfernt. Die originalen Sicherungen wurden nicht verändert.

| Prüffeld | Teststand |
| --- | --- |
| Spots | 173 unveränderte Spot-IDs |
| Sprachen | DE, EN, DA; 232 Schlüssel je Sprache |
| Filter | 2.458 automatisierte Vertragsprüfungen |
| Offline-Cache | 144 Ressourcen nach Einbindung des Kalender-Sicherungsmoduls |
| Galerien | 15 Spots, 40 vorhandene Bilder |
| Fehlende allgemeine Quellenlinks | 4 Spots (zuvor 7) |
| Fehlende Quellenprüfdaten | 5 Spots (zuvor 10) |
| Plus-Testmodus | Nur bestehender Entwicklercode; öffentliche Klartext-Codeliste entfernt |
| Persönliche ZIP-Sicherung | V3 mit Erinnerungen, Fotos, Favoriten **und privaten Kalenderplänen** |

Die Quellenprüfungen bestätigen **nur den belegten Informationsumfang**, keine umfassende Vor-Ort-Freigabe. Alle bestehenden Daten, Bilder, Spot-IDs, Koordinaten, die Tilla-Oberfläche und die Gestaltung wurden ansonsten bewahrt.

**Technischer Prüfbericht:** [`00_RELEASEBERICHT_TESTSTAND.md`](00_RELEASEBERICHT_TESTSTAND.md).  **Startanleitung:** [`00_START_HIER.md`](00_START_HIER.md).

**Hosting-Korrektur:** PWA-Manifest und Service-Worker-Pfade werden nun auf Cloudflare (Root) **und** GitHub Pages (`/Family-Spots-Map/`) automatisch geprüft.
**Ziel 2027:** Verfügbarkeit im Apple App Store und bei Google Play. Technischer Fahrplan: [`APP_STORE_ROADMAP_2027.md`](APP_STORE_ROADMAP_2027.md).

## Die Anwendung

- **Karte:** geografische Leaflet-/OpenStreetMap-Karte mit Markern, Spot-Vorschauen, Vollbild und optionalem Standort. Externe Navigation wird in Apple Karten oder Google Maps geöffnet.
- **Entdecken:** Suche, Stimmung, Themen, genauere Ortsarten, nachgewiesene Ausstattungsmerkmale, Radius, Favoriten und weitere Filter. Die Trefferzahl nutzt den tatsächlich gefilterten Bestand.
- **Spot-Details:** kurze dreisprachige Informationen, Anreise und – wo verfügbar – Besuchsplanung, Fotos sowie Quellen und Aktualität.
- **Spots Plus:** im Teststand ausschließlich Entwicklerzugang. Texte in DE/EN/DA nennen keine nicht verfügbaren 90-Tage-Familientests mehr. Andere früher gespeicherte Probe-, Familien- und Partnercodes schalten keine Plus-Funktionen mehr frei. Der Code steht nicht als Klartext im Archiv; seine SHA-256-Prüfsumme ist öffentlich. Dieser Testmodus ist **keine** manipulationssichere Authentifizierung.
- **Tilla:** Familienbegleiterin und Spielideen für unterwegs.
- **Mein Tag:** private Erinnerungen mit Text und Fotos, Bearbeiten, Löschen und Datensicherung.
- **Private Planung:** Ausflugskalender mit lokal gespeicherten Terminen und ICS-Export. **Gespeicherte private Ausflugspläne sind jetzt Teil der ZIP-Sicherung V3.** Unfertige Entwürfe und Plus-Zugangsrechte werden weiterhin nicht mitgesichert; alle persönlichen Daten bleiben lokal.
- **Treffen & Spiele:** getrennt von der privaten Planung; öffentliche Termine erscheinen nur bei entsprechend bestätigtem Inhalt. Es gibt keine öffentlichen Kinderprofile oder direkten Nachrichten zwischen Minderjährigen.

### Verbindliche Gestaltung

Die vorhandene warme, ruhige Tilla-/Landschaftsoberfläche ist die Referenz. **Das aktuell verwendete grüne Herz bei „Mein Tag“ bleibt exakt erhalten.** Das neue Testpaket ändert es nicht. Keine eigenständige Neugestaltung des Headers, der Farbfamilie, der Navigation oder von Spots Plus.

## Filter: Wasser eindeutig benennen

Die Schnellauswahl und das ausführliche Thema nutzen im Feinschliff **dieselbe Auswahl und dieselbe Bezeichnung**:

| Deutsch | English | Dansk |
| --- | --- | --- |
| Baden & Wasserspiel | Swimming & water play | Badning og vandleg |

Ein Klick auf die Schnellwahl wählt das Thema `water` im ausführlichen Filter; der umgekehrte Weg zeigt die Schnellwahl ebenfalls als aktiv. Enthalten sind zugehörige Ortsarten, einschließlich öffentlich zugänglicher Wasserspielplätze und – sofern zugangsberechtigt – Schwimmbäder, Badeseen oder Strände.

**Davon ausdrücklich zu unterscheiden:** Der separate Stichwortfilter `water-fun` sucht nach Wasser-Tags und kann andere Treffer liefern. Er heißt deshalb *Wasserbezug / Water-related / Med vand*. Das kostenpflichtig denkbare Zusatzpaket **„Wasser & Baden“** ist wiederum eine Zugangsregel, kein synonymes Suchergebnis. Seine Berechtigungslogik bleibt unverändert.

Alle drei Sprachvarianten verwenden die gleichen Filterregeln; die Übersetzungen verändern weder Spot-Datensätze noch Zugänge.

## Daten, Quellen und Prüfumfang

Laufzeitdaten: `data/spots.json`. Die unveränderlichen Spot-IDs und geografischen Koordinaten sind wichtige Bezugspunkte für Favoriten und Navigation. Änderungen daran dürfen nur nach unabhängiger Ortsprüfung erfolgen.

- `source_urls` dokumentiert nachvollziehbare externe Fundstellen.
- `source_checked_at` nennt das Datum, an dem diese Quellen tatsächlich konsultiert wurden, **nicht** ein persönliches Besuchsdatum.
- `source_labels` erklärt Quellenlinks in DE/EN/DA.
- `verified`, `verification_scope`, `visitor_information` und einzelne Visit-Details steuern, was wirklich als bestätigt gilt.

Bereits im Ausgangsarchiv enthaltene ergänzte Quellenbezüge betreffen **Bauer Lipp**, **Ritterspielplatz Dünnwald**, **Spielplatz am Naturzentrum/Urftstraße Nettersheim** sowie **Rathauspark Bergedorf**. Es wurden nur nachvollziehbare Quellen für Ort/grundsätzliche Existenz ergänzt, nicht für alle Besuchsdetails. Bei diesen vier Spots bleibt `verified: false`; Öffnungszeiten, Preise, aktuelle Spielgeräte und Barrierefreiheit werden nicht ohne Beleg bestätigt.

**Ergänzungen in diesem Teststand:** Externe Quellen wurden für Barendsvej, den Bereich Windheimstraße und die Grundschule Rethen dokumentiert. Die Standorte Heidfeld und Harkenblecker Straße erhielten überprüfte Quellendatumsangaben. Ältere Quellen und Quellen zu benachbarten Orten wurden im jeweiligen `verification_scope` ausdrücklich als **begrenzte Hinweise** markiert. Insbesondere ist die öffentliche Schulhof-Nutzung nicht unabhängig bestätigt; der dreisprachige Hinweis ist jetzt vorsichtiger formuliert. Keiner dieser fünf Spots wurde pauschal auf `verified: true` gesetzt.

**Offene Fälle:** Vier Spots ohne belastbare allgemeine Quellenlinks und fünf ohne Quellenprüfdatum bleiben bewusst offen. Ein Link auf eine nahegelegene Einrichtung belegt weder die genaue Lage noch die Öffnungsregeln eines Spots. Park- oder Übernachtungserlaubnis bei *Strandvejen/Vrist* bleibt unbestätigt.

Die Angaben in der App können sich vor Ort ändern. Wetter, Badebedingungen, Beschilderung, Baustellen, Öffnungszeiten, Eintritt, Wege und Zugangsrechte sind vor dem Besuch zusätzlich zu prüfen.

## Bereinigte Arbeitsdateien

Dieses Archiv enthält den aktuellen App-Code und die benötigten Daten ohne alte TXT-Exporte, doppelte Sicherungsordner und überholte Installationsanleitungen. Die Dateien liegen **direkt im ZIP-Hauptverzeichnis**, nicht in einem zusätzlichen Ordner `Family-Spots-Map-main`. Alte Git-Branch-Dateien werden durch das Entpacken einer ZIP **nicht automatisch gelöscht**.

## Technik und Projektstruktur

Die Web-App läuft ohne Framework-Build als statische HTML-/CSS-/ES-Modul-Anwendung. Die drei HTML-Einstiege liegen in `index.html`, `en/index.html`, `da/index.html`; JavaScript in `js/`, CSS in `css/`, JSON-Daten in `data/`, Bilder und Grafiken in `assets/`, lokal mitgelieferte Kartensoftware in `vendor/`.

| Datei/Modul | Zweck |
| --- | --- |
| `js/app.js` | Initialisierung, globaler Filter- und Darstellungszustand |
| `js/filter-model.js`, `js/categories.js` | gemeinsame Themen- und Filterauswahl |
| `js/config.js` | Kategorien, Zusatzfilter, Zugangsregeln |
| `js/ui/category-explorer.js` | ausführlicher Themen- und Ortsartenfilter |
| `js/features/gemeinsam-erleben-rc.js` | privater Kalender |
| `js/features/community-play.js` | Treffen & Spiele |
| `js/features/diary-view.js` | Mein Tag |
| `js/features/personal-backup.js`, `js/features/calendar-backup.js` | ZIP-Sicherung V3 und validierte private Kalenderpläne |
| `js/features/plus.js`, `data/partners.json` | Lokaler Entwickler-Testzugang, keine serverseitige Kontrolle |
| `data/i18n/*.json`, `js/i18n.js` | DE/EN/DA und Fallback-Texte |
| `service-worker.js`, `js/sw-register.js` | Offline-Cache und kontrollierte Updates |
| `tools/check-project.mjs` | Integritäts- und Regressionstests |

### Persönliche Daten

Erinnerungen, Favoriten, Entwürfe, private Termine und Freischaltungen werden lokal im Browser gespeichert. Es existiert keine allgemeine geräteübergreifende Synchronisation. **Browserdaten zum Erzwingen eines Updates nicht löschen**: dadurch können persönliche Daten verloren gehen. Vor Änderungen oder Gerätewechsel verfügbare Exporte/Sicherungen verwenden.

### Offline

Die App-Oberfläche, 173 Spotdaten, Übersetzungen und bestimmte lokale Bilder sind nach vollständig erfolgreicher Erstinstallation offline nutzbar. **Externe OpenStreetMap-Kacheln, Kartennavigation und Quellenwebseiten erfordern Internet.** Offline-Cache und personenbezogene Browserdaten sind voneinander zu unterscheiden.

## Qualitätssicherung

Im neuen Testarchiv wurden `node tools/check-project.mjs`, Backup- und Kalenderregressionen sowie gesonderte Plus-Zugangsprüfungen ausgeführt. Automatisierte Prüfungen allein bestätigen weder eine exakte iPhone-Safari-Darstellung noch Öffnungszeiten oder Zugangsbedingungen der Orte.

```bash
node tools/check-project.mjs
```

Für einen Entwicklungsstart einen lokalen HTTP-Server verwenden, z. B. `python3 -m http.server 8080`. Die drei Sprachseiten, das Filterverhalten und mobile Layoutbreiten vor Veröffentlichung im Browser prüfen. **Main bleibt während der Abnahme unangetastet.**

### Veröffentlichung

GitHub Actions veröffentlicht die App per `.github/workflows/deploy.yml` bei Änderungen auf `main`. Ein Feinschliff gehört zuerst in den **Testbranch `test/fsm-v34-details`** und wird erst nach erfolgreicher Prüfung per Pull Request übernommen. Der Service Worker enthält eine Versionskennung und Hashes für erforderliche Dateien. Bei einem zusammengehörigen Release müssen Cache-Kennung und Hashes aktualisiert werden.

**Dieses Testpaket wurde nicht automatisch in GitHub eingebaut oder live veröffentlicht.** Der echte Test erfolgt zuerst in einer getrennten Testbranch. Öffentliche Spotdaten und clientseitiger UI-Zugangsschutz sind technisch kein manipulationssicherer Bezahlschutz.

## Offene nächste Schritte

1. Die verbleibenden Quellen- und Prüflücken einzeln anhand ortsgenauer, möglichst offizieller Quellen schließen.
2. Öffentliche Zugänglichkeit und lokale Regeln von Schulhöfen, Bade- und Parkflächen ausdrücklich klären.
3. Familien testen Karte, Orientierung, Suchverhalten, Textverständlichkeit und echte Ausflüge auf iPhone/Android.
4. Bei jedem Spot vorhandene Besuchshinweise, Bildrechte und Fotoqualität gezielt weiterentwickeln.
5. Vor einem kostenpflichtigen Plus-Regelbetrieb eine echte serverseitige Zugangsprüfung und ggf. nichtöffentliche Auslieferung kostenpflichtiger Datensätze vorsehen.
6. Release-Update unter schlechter Verbindung und das ca. 25-MiB-Offline-Paket auf echten Smartphones vermessen. Die Cache-Pflichtdateien wurden bewusst **nicht** aus der Offline-Funktion entfernt, damit Fotos und Daten nicht ungeplant verloren gehen.

**Grundsatz:** Orte entdecken. Menschen verbinden. Erinnerungen schaffen. Möglichst wenig Bildschirmzeit, dafür echte gemeinsame Erlebnisse.
