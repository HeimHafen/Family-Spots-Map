# Family Spots Map 🐢

**Die schönste Karte für Familien-Abenteuer**  
**Orte entdecken. Menschen verbinden. Erinnerungen schaffen.**

Family Spots Map ist eine dreisprachige, kartenbasierte Web-App für gemeinsame Familienerlebnisse. Sie hilft beim Entdecken von Ausflugsorten, beim privaten Planen von Unternehmungen und beim Bewahren von Erinnerungen – ohne eine öffentliche Social-Media-Plattform für Kinder zu sein.

**Sprachen:** Deutsch · English · Dansk  
**Produktivseite:** https://heimhafen.github.io/Family-Spots-Map/  
**Projekt:** https://github.com/HeimHafen/Family-Spots-Map

## Projektstand – 8. November 2026

**Ausgangsversion in `main`: V34, Appkennung `20261107-gestaltung-v34-details`.** V34 ist auf GitHub Pages veröffentlicht und kein nur lokaler Teststand mehr. Die vorliegende README begleitet einen **vorbereiteten, noch nicht veröffentlichten Feinschliff** für Wasserfilter-Bezeichnungen, Quellentransparenz und Dokumentation. Erst nach Test, Commit und erfolgreichem Deployment ist dieser Feinschliff produktiv. Die verbindliche Live-App darf nicht durch einen ungetesteten Branch überschrieben werden.

| Prüffeld | Stand |
| --- | --- |
| Datensatz | 173 Spots |
| Sprachen | DE, EN, DA; 232 Übersetzungsschlüssel je Sprache |
| Strukturierte Besuchshinweise | 787 dreisprachige Informationseinträge |
| Filter-Vertragsprüfungen | 2.458 automatisierte Aussagen bestanden |
| Installationscache | 143 Ressourcen, einschließlich `./` |
| Spotgalerien | 15 Spots mit zusammen 40 Bildern |
| Quelle fehlt (geplanter Feinschliff) | 7 Spots; Ausgangsstand: 11 |
| Datum der Quellenprüfung fehlt (geplanter Feinschliff) | 10 Spots; Ausgangsstand: 14 |

Die Datenzahlen sind Struktur- und Bestandskennzahlen. Die technische Projektprüfung **bestätigt nicht** die aktuelle Zugänglichkeit, Sicherheitslage oder Ausstattung sämtlicher Orte. Weitere Einzelprüfungen und echte Gerätetests bleiben notwendig.

## Die Anwendung

- **Karte:** geografische Leaflet-/OpenStreetMap-Karte mit Markern, Spot-Vorschauen, Vollbild und optionalem Standort. Externe Navigation wird in Apple Karten oder Google Maps geöffnet.
- **Entdecken:** Suche, Stimmung, Themen, genauere Ortsarten, nachgewiesene Ausstattungsmerkmale, Radius, Favoriten und weitere Filter. Die Trefferzahl nutzt den tatsächlich gefilterten Bestand.
- **Spot-Details:** kurze dreisprachige Informationen, Anreise und – wo verfügbar – Besuchsplanung, Fotos sowie Quellen und Aktualität.
- **Spots Plus:** bestehende Freischaltcodes, Plus-Regeln und Add-ons. Sie werden durch die hier beschriebenen Änderungen nicht angefasst.
- **Tilla:** Familienbegleiterin und Spielideen für unterwegs.
- **Mein Tag:** private Erinnerungen mit Text und Fotos, Bearbeiten, Löschen und Datensicherung.
- **Private Planung:** Ausflugskalender mit lokal gespeicherten Terminen und ICS-Export. **Private Kalendereinträge sind nicht Teil der allgemeinen Erinnerungssicherung.** Sie müssen bei Bedarf gesondert exportiert werden.
- **Treffen & Spiele:** getrennt von der privaten Planung; öffentliche Termine erscheinen nur bei entsprechend bestätigtem Inhalt. Es gibt keine öffentlichen Kinderprofile oder direkten Nachrichten zwischen Minderjährigen.

### Verbindliche Gestaltung

Die vorhandene warme, ruhige Tilla-/Landschaftsoberfläche ist die Referenz. **Das aktuell verwendete grüne Herz bei „Mein Tag“ bleibt exakt erhalten.** Der Feinschliff ändert es nicht. Keine eigenständige Neugestaltung des Headers, der Farbfamilie, der Navigation oder von Spots Plus.

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

Die vier im Feinschliff vorsichtig ergänzten Quellenbezüge betreffen **Bauer Lipp**, **Ritterspielplatz Dünnwald**, **Spielplatz am Naturzentrum/Urftstraße Nettersheim** sowie **Rathauspark Bergedorf**. Es wurden nur nachvollziehbare Quellen für Ort/grundsätzliche Existenz ergänzt, nicht für alle Besuchsdetails. Bei diesen vier Spots bleibt `verified: false`; Öffnungszeiten, Preise, aktuelle Spielgeräte und Barrierefreiheit werden nicht ohne Beleg bestätigt.

**Offene Fälle:** Die verbleibenden sieben Spots ohne Quellenlinks und zehn ohne Prüfdaten sind bewusst nicht automatisch aufgefüllt. Besonders der Parkplatz *Strandvejen/Vrist*, Schulhofzugänglichkeit in Rethen und einige ältere Spielplatzeinträge benötigen eine präzisere Orts- bzw. Zugangsprüfung. Ein Link auf eine nahegelegene Einrichtung belegt noch nicht den genauen Spot.

Die Angaben in der App können sich vor Ort ändern. Wetter, Badebedingungen, Beschilderung, Baustellen, Öffnungszeiten, Eintritt, Wege und Zugangsrechte sind vor dem Besuch zusätzlich zu prüfen.

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
| `data/i18n/*.json`, `js/i18n.js` | DE/EN/DA und Fallback-Texte |
| `service-worker.js`, `js/sw-register.js` | Offline-Cache und kontrollierte Updates |
| `tools/check-project.mjs` | Integritäts- und Regressionstests |

### Persönliche Daten

Erinnerungen, Favoriten, Entwürfe, private Termine und Freischaltungen werden lokal im Browser gespeichert. Es existiert keine allgemeine geräteübergreifende Synchronisation. **Browserdaten zum Erzwingen eines Updates nicht löschen**: dadurch können persönliche Daten verloren gehen. Vor Änderungen oder Gerätewechsel verfügbare Exporte/Sicherungen verwenden.

### Offline

Die App-Oberfläche, 173 Spotdaten, Übersetzungen und bestimmte lokale Bilder sind nach vollständig erfolgreicher Erstinstallation offline nutzbar. **Externe OpenStreetMap-Kacheln, Kartennavigation und Quellenwebseiten erfordern Internet.** Offline-Cache und personenbezogene Browserdaten sind voneinander zu unterscheiden.

## Qualitätssicherung

Im überprüften Ausgangsarchiv liefen `node tools/check-project.mjs` und die 2.458 Filter-Vertragsprüfungen erfolgreich. Der vorgeschlagene Feinschliff wird separat getestet; automatisierte Prüfungen allein bestätigen keine exakte iPhone-Safari-Darstellung, Screenreader-Nutzung oder Ortsangaben vor Ort.

```bash
node tools/check-project.mjs
```

Für einen Entwicklungsstart einen lokalen HTTP-Server verwenden, z. B. `python3 -m http.server 8080`. Die drei Sprachseiten, das Filterverhalten und mobile Layoutbreiten vor Veröffentlichung im Browser prüfen. **Main bleibt während der Abnahme unangetastet.**

### Veröffentlichung

GitHub Actions veröffentlicht die App per `.github/workflows/deploy.yml` bei Änderungen auf `main`. Ein Feinschliff gehört zuerst in einen **eigenen Testbranch** und wird erst nach erfolgreicher Prüfung per Pull Request übernommen. Der Service Worker enthält eine Versionskennung und Hashes für erforderliche Dateien. Bei einem zusammengehörigen Release müssen Cache-Kennung und Hashes aktualisiert werden.

**Der Feinschliff wurde nicht automatisch in GitHub eingebaut oder live veröffentlicht.** Übernommene Source-Links begründen keinen automatisch geprüften oder geöffneten Spot.

## Offene nächste Schritte

1. Die verbleibenden Quellen- und Prüflücken einzeln anhand ortsgenauer, möglichst offizieller Quellen schließen.
2. Öffentliche Zugänglichkeit und lokale Regeln von Schulhöfen, Bade- und Parkflächen ausdrücklich klären.
3. Familien testen Karte, Orientierung, Suchverhalten, Textverständlichkeit und echte Ausflüge auf iPhone/Android.
4. Bei jedem Spot vorhandene Besuchshinweise, Bildrechte und Fotoqualität gezielt weiterentwickeln.
5. Vor einem kostenpflichtigen Plus-Regelbetrieb eine echte serverseitige Zugangsprüfung vorsehen.

**Grundsatz:** Orte entdecken. Menschen verbinden. Erinnerungen schaffen. Möglichst wenig Bildschirmzeit, dafür echte gemeinsame Erlebnisse.
