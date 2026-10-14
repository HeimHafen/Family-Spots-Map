# 🇩🇪 Family Spots Map 🇩🇰

**Kleine Familienabenteuer entdecken, Ausflüge besser planen und Erinnerungen festhalten.**

Family Spots Map ist eine mehrsprachige Kartenanwendung für Familien: mit Spielplätzen, Tier- und Naturzielen, Wasser-Spots, Museen und Wohnmobil-Stopps. Familienbegleiterin **Tilla** ergänzt die Ortsinformationen um kleine Spiel- und Beobachtungsideen für unterwegs.

> Heute ist ein guter Tag, an dem aus Alltag ein kleines Familienabenteuer werden darf.

**English:** Discover family outings, plan your visit and save small moments to remember.

**Dansk:** Find familieudflugter, planlæg besøget, og gem små øjeblikke, I vil huske.

## App öffnen

| Sprache | Web-App |
| --- | --- |
| Deutsch | [Family Spots Map](https://heimhafen.github.io/Family-Spots-Map/) |
| Englisch | [Family Spots Map · English](https://heimhafen.github.io/Family-Spots-Map/en/) |
| Dänisch | [Family Spots Map · Dansk](https://heimhafen.github.io/Family-Spots-Map/da/) |

Die Anwendung lässt sich im Browser nutzen und über die jeweilige Browserfunktion zum Startbildschirm hinzufügen.

## Aktueller Stand

Stand: **14. Oktober 2026**, Darstellungsrelease **20261014-pin-tilla-43**. Der Datensatz umfasst **114 Spots**. Umfangreiche Besuchsinformationen werden schrittweise ergänzt; nicht alle Spots besitzen bereits denselben Informationsumfang.

Die nächsten inhaltlichen Schwerpunkte sind hochwertige Familienziele rund um **Hannover und Hildesheim**, anschließend ein Praxistest mit **zwei bis drei Familien**. Die bereits vorhandenen dänischen Spots ergänzen den Reisebereich.

## Funktionen

- **Karte und Spot-Liste:** gruppierte Marker, grüne Punktmarker und platzabhängige Namensbeschriftungen. Ein Pin öffnet eine kompakte Vorschau; „Spot ansehen“ führt zu den vollständigen Details. Die Navigation erfolgt über Apple Karten oder Google Maps.
- **Suche und Filter:** Ort oder Stichwort, Stimmung, Radius, Kategorien, Altersgruppen, Favoriten und weitere praktische Schnellfilter.
- **Standort:** optional den eigenen Standort anzeigen. Die App bleibt auch ohne Standortfreigabe bedienbar.
- **Tilla:** gemalte Schildkröten-Begleiterin mit kleinen Spielideen. Ein Zettel erscheint in ihrer Tasche, sobald mindestens eine Erinnerung gespeichert ist; nach dem Löschen der letzten Erinnerung verschwindet er.
- **Favoriten:** interessante Orte auf dem jeweiligen Gerät merken.
- **Mein Tag:** Erinnerungen schreiben, bearbeiten und löschen; auch offline, sobald die App vollständig geladen wurde.
- **Bildergalerien:** passende Ortsbilder mit Bildunterschriften und Alternativtexten in allen drei Sprachen.
- **Besuchsplanung:** strukturierte Informationen zu Eignung, Zeitbedarf, Anreise, Kosten, Öffnungszeiten, Familienkomfort, Essen, Zugänglichkeit und praktischen Tipps.
- **Zwei Designmodi:** warme helle Gestaltung und ein Abendmodus mit olivfarbenem Hintergrund, hellen Karten und optisch abgedunkelten Kartenkacheln.

Favoriten, Erinnerungen, Entwürfe und Freischaltungen werden lokal im jeweiligen Browser gespeichert. Eine geräteübergreifende Kontosynchronisation ist derzeit nicht implementiert.

## Kartenpins und Einstieg

Die geografische Leaflet-/OpenStreetMap-Karte bleibt erhalten. Ab Zoomstufe 13 erscheinen die Namen einzelner sichtbarer Spots, sofern die Beschriftung innerhalb des Kartenbereichs liegt und weder andere Namen noch Pins oder Bedienelemente überdeckt. Auch der ausgewählte Pin kann seinen Namen neben der geöffneten Vorschau zeigen, wenn ausreichend Platz vorhanden ist. Die Vorschau, Cluster und Kartenbedienelemente werden bei der Platzprüfung berücksichtigt. Gruppen und bestehende Filter bestimmen weiterhin, welche Spots verfügbar sind.

Die Vorschau enthält vorhandene übersetzte Daten und genau einen Schließen-Button. „Kostenlos“ wird ausschließlich aus dem vorhandenen `free`-Tag abgeleitet. Enter und Leertaste öffnen die Vorschau, Escape schließt sie. Tillas Zettel zählt nur tatsächlich gespeicherte Erinnerungen. Ein wiederhergestellter Bearbeitungsentwurf nach einer Löschung in einem anderen Tab zählt nicht als gespeicherte Erinnerung; der Entwurf bleibt erhalten. Das bewusste Schließen der Einstiegsanleitung wird unter `fsm_onboarding_hint_dismissed` lokal gespeichert; die App bleibt bei blockiertem Browserspeicher bedienbar.

`js/ui/map-spots.js` und `css/map-spots.css` kapseln die neue Darstellung. Das transparente Maskottchen liegt in `assets/tilla/tilla-watercolor.png`. Sein Erinnerungszettel bleibt ein separates, an den Erinnerungsstand gebundenes Element.

## Sprachen und Gestaltung

Die Oberfläche unterstützt **Deutsch, Englisch und Dänisch**. Zu den Sprachversionen gehören Bedienhinweise, Systemmeldungen, Tilla-Texte, Spielideen, Spot-Zusammenfassungen und ergänzte Besuchsinformationen.

Sprachdateien liegen unter `data/i18n/`. `js/i18n.js` enthält zusätzlich lokale Fallback-Texte und Spielideen, damit der Start nicht von erfolgreichen Nachladeanfragen abhängt. Änderungen an den Sprachdateien und den eingebauten Fallbacks müssen zusammenpassen.

Das Design verwendet gemeinsame Abstände, abgerundete Bedienelemente und kompakte Detailaktionen. `css/evening.css` ergänzt ausschließlich den dunklen Modus. Kartenfilter wirken auf die Rasterkacheln; Marker, Beschriftungen und Kartenbedienelemente werden nicht mitgefiltert.

## Spot-Qualität und Verifizierung

Ortsinformationen sollen Familien eine konkrete Entscheidung erleichtern: Was erwartet uns? Wie kommen wir hin? Gibt es Toiletten? Welche Wege sind geeignet? Was sollten wir mitnehmen?

**„Verifiziert“** kennzeichnet einen ausreichend geprüften Informationsstand innerhalb des dokumentierten Prüfumfangs. Es ist keine Zusage, dass jede Einrichtung jederzeit verfügbar oder jeder Weg barrierefrei ist. Wesentliche offene Punkte werden im jeweiligen Besuchstext klar benannt.

Für die öffentliche Darstellung wird nicht zwischen persönlich besuchten und online geprüften Orten unterschieden. Quellen, Prüfdatum und verbleibende Unsicherheiten werden in den Daten festgehalten. Geeignete Quellenlinks sind unter **„Quellen und Aktualität“** verfügbar.

Historische Meldungen dürfen nicht als aktuelle Ausstattung oder aktuelle Öffnungszeit ausgegeben werden. Entfernungen und Zeitbedarf sind gegebenenfalls als Richtwerte zu kennzeichnen. Altersangaben sollen Orientierung geben und keine unbelegten festen Grenzen setzen.

### Bereits ausgearbeitete Beispiele

- **Wildgatter Hildesheim – Steinberg:** Besuchsplanung mit etwa 90–120 Minuten, Tierbeobachtung, Spielpause, Anreise, öffentlichen Toiletten mit Wickeltisch und Gastronomie. Offene Fragen zu Toilettenzugang und geeigneten Wegen bleiben erkennbar.
- **Wohnmobil-Stopp Vejlby Klit:** eigene Ortsbilder, Strandnähe, Toiletten, Mülltrennung, Picknickbänke und Hinweise auf die Spielplätze Neerlandiavej und Barendsvej. Mejrup ist als separater Versorgungspunkt für die An- oder Weiterreise beschrieben. Eine verbindliche Höchststandzeit wird nicht behauptet.

Die Wildgatter-Galerie enthält derzeit ausdrücklich gekennzeichnete **KI-Testmotive** für den Darstellungstest. Sie dokumentieren keine tatsächlichen Eingänge, Spielgeräte oder Wege. Die Vejlby-Galerie enthält bereitgestellte eigene Ortsfotos.

## Daten und Bilder pflegen

Die Laufzeitdaten liegen in **`data/spots.json`**. Bestehende IDs und Koordinaten sollten nur nach einer gezielten Prüfung geändert werden; an IDs hängen unter anderem Favoriten.

| Feld | Zweck |
| --- | --- |
| `id` | Eindeutige, stabile Spot-ID |
| `title`, `title_de`, `title_en`, `title_da` | Name und sprachbezogene Titel |
| `lat`, `lon`, `country`, `city` | Kartenposition und Ortszuordnung |
| `categories`, `tags`, `moods` | Kategorien und Filtermerkmale |
| `summary_de`, `summary_en`, `summary_da` | Kurze Beschreibung in allen drei Sprachen |
| `visit_minutes`, `visit_range_minutes` | Optionaler Richtwert oder Zeitbereich; bei nicht sinnvoller Dauer weglassen |
| `visit_details` | Strukturierte Besuchsinformationen mit `schema_version: 1` |
| `visit_overview` | Optionaler Überblick in `de`, `en`, `da` |
| `verified`, `verification_scope` | Kennzeichnung und interner Prüfumfang |
| `source_urls`, `source_checked_at`, `source_labels` | Quellen, Prüfdatum und verständliche Linktexte |
| `photos` | Bildpfad, Bildart, Abmessungen, Bildunterschrift und Alternativtext |

Die neun Abschnittsschlüssel in `visit_details.sections` sind `suitability`, `duration`, `arrival`, `admission`, `hours`, `comfort`, `food`, `accessibility` und `tips`. Abschnittseinträge verwenden `items` mit `text.de`, `text.en` und `text.da` sowie Angaben zum Prüfumfang und zu Quellen.

### Neue Bilder

1. Einen klar benannten Ordner unter `assets/spots/` anlegen, beispielsweise `assets/spots/vejlby-klit/`.
2. Ortsbilder mit nachvollziehbaren Rechten als WebP, JPEG oder PNG hochladen. Die bestehenden Galerien verwenden WebP.
3. Unter `photos` den exakten relativen Pfad, `width`, `height`, `caption` und `alt` ergänzen. Bildunterschriften und Alternativtexte müssen in allen drei Sprachen vorliegen.
4. Für tatsächliche Fotos `kind: "photo"` verwenden. Testmotive dürfen nicht als Ortsdokumentation erscheinen; die vorhandene Kennzeichnung ist `kind: "ai_test"`.
5. Für offline verfügbare Bilder den Pfad in `ASSETS` im Service Worker aufnehmen und die Cache-Version erhöhen.

**Ordner- und Dateinamen dürfen keine unbeabsichtigten Leerzeichen enthalten.** `assets/spots/vejlby-klit/` und ein Ordner mit Leerzeichen vor `vejlby-klit` sind unterschiedliche Pfade. Die Groß-/Kleinschreibung muss ebenfalls stimmen.

Auf GitHub kann ein neuer Ordner über eine Platzhalterdatei angelegt werden: In `assets/spots/` eine Datei mit dem Namen `vejlby-klit/.gitkeep` erstellen. `.gitkeep` hat keine Funktion in der Anwendung. Anschließend die Bilder im neuen Ordner über **Add file → Upload files** hochladen.

## Offline und Updates

Der aktive Service Worker liegt im Projektwurzelverzeichnis unter **`service-worker.js`**. Die Registrierung und der Update-Hinweis werden durch **`js/sw-register.js`** gesteuert.

Nach erfolgreicher Erstinstallation sind die App-Oberfläche, Spotdaten, Sprachtexte, Spielideen und ausdrücklich in der Offline-Dateiliste enthaltene Fotos ohne Internet verfügbar. Erinnerungen und Favoriten können weiter genutzt werden.

**Kartenkacheln benötigen Internet.** Der Service Worker lädt keine externen OpenStreetMap-Kacheln als Offline-Kartenpaket herunter. Auch externe Navigation und Quellenwebseiten sind keine Offline-Funktionen dieser App.

Der aktuelle Offline-Umfang beträgt 70 Dateien. Die maßgebliche Liste steht in `ASSETS` innerhalb des Service Workers.

### Ein Update sicher veröffentlichen

1. Neue Bild- oder andere Asset-Dateien zuerst hochladen oder sämtliche zusammengehörigen Änderungen gemeinsam committen.
2. Daten, JavaScript und CSS vollständig aktualisieren.
3. Die Offline-Dateiliste prüfen und bei Änderungen an gecachten App-Dateien die `CACHE_VERSION` erhöhen. Bei getrennten Commits den Service Worker zuletzt ändern.
4. Die erfolgreiche Projektprüfung und das erfolgreiche GitHub-Pages-Deployment abwarten.
5. In der App das angebotene Update bestätigen und anschließend den betroffenen Spot auch offline prüfen.

Eine neue Version wird nur installiert, wenn alle erforderlichen Dateien erreichbar und die vorgesehenen Datenprüfungen erfolgreich sind. Bei einer unvollständigen Aktualisierung bleibt die funktionierende bisherige Version bestehen. Beim Bestätigen eines Updates werden ungespeicherte Erinnerungstexte berücksichtigt.

**Browserdaten nicht zum Erzwingen eines Updates löschen:** Dabei können lokale Erinnerungen, Favoriten, Entwürfe und Freischaltungen verloren gehen. Während einer Online-Nutzung können gültige JSON-Daten im Cache aktualisiert werden; eine reine Bildtextkorrektur benötigt daher nicht zwingend eine neue Service-Worker-Version.

## Family Spots Plus

Kategorie-Zugriffe und Add-ons sind in `js/config.js` definiert. Manche Kategorien gehören zum Basis-Plus-Zugang, andere erfordern zusätzlich das entsprechende Add-on, etwa **WoMo & Vanlife** oder **Wasser & Baden**.

Die aktuelle Freischaltung verwendet Partnercodes aus `data/partners.json`; Status und Ablauf werden lokal gespeichert. **Plus allein schaltet nicht automatisch jedes Add-on frei.** `DEV_FORCE_PLUS` bleibt im veröffentlichten Projekt `false`.

Das derzeitige Verfahren ist eine Frontend-Freischaltung für den vorhandenen Projektstand. Für einen verbindlichen kostenpflichtigen Betrieb sind eine serverseitige Berechtigungsprüfung und eine entsprechende Zahlungs- und Kontoverwaltung noch gesondert umzusetzen.

## Technik und Projektstruktur

Die Anwendung besteht aus statischen HTML-, CSS- und JavaScript-Dateien mit ES-Modulen. Leaflet und Markercluster werden lokal aus `vendor/` geladen. Für die aktuelle Anwendung ist kein Framework-Build erforderlich.

| Pfad | Aufgabe |
| --- | --- |
| `index.html`, `en/index.html`, `da/index.html` | Einstieg in die drei Sprachversionen |
| `css/styles.css`, `css/components.css`, `css/theme.css`, `css/evening.css` | Layout, Komponenten, Farbvariablen und Abendmodus |
| `js/app.js` | Initialisierung und Zusammenspiel der Anwendung |
| `js/ui/spot-details.js` | Spot-Detailansicht, Bildergalerie, Besuchsinfos, Quellen und Kartenbuttons |
| `js/map.js`, `js/filters/` | Karte, Marker und Filterlogik |
| `js/ui/map-spots.js`, `css/map-spots.css` | grüne Punktmarker, Namensbeschriftungen, Spot-Vorschau und Tilla-Darstellung |
| `js/i18n.js`, `data/i18n/`, `data/play-ideas.json` | Sprachen, Fallbacks und Spielideen |
| `js/features/tilla.js` | Familienbegleiterin Tilla |
| `js/features/personal-storage.js`, `js/features/daylog-drafts.js` | Lokale persönliche Daten und Entwürfe |
| `js/features/plus.js`, `js/config.js`, `data/partners.json` | Plus-Zugriff und Konfiguration |
| `js/ui/menu.js`, `js/ui/modal.js` | Menü, Fokusführung und Dialoge |
| `data/spots.json`, `assets/spots/` | Spotinformationen und Ortsbilder |
| `service-worker.js`, `js/sw-register.js`, `offline.html` | Offline-Dateien, Update-Ablauf und Ersatzseite |
| `manifest.webmanifest`, `assets/icons/` | PWA-Metadaten und App-Icons |
| `tools/check-project.mjs` | Maßgebliche Integritätsprüfung für CI und Deployment |

Persönliche Daten werden über IndexedDB und lokale Speichermechanismen verarbeitet; bestehende lokale Daten werden berücksichtigt. Eine globale Browserdaten-Löschung ist keine reguläre Wartungsmaßnahme.

Die Spot-Detailansicht besitzt einen eigenen Controller. Er erhält aktuelle Sprache, DOM-Elemente und Aktionen über klar benannte Schnittstellen. Geöffnete Info- und Bilderbereiche bleiben bei erneutem Rendern erhalten; Speicherung und Standortberechnung bleiben in ihren bisherigen Modulen.

## Lokal starten und prüfen

Im Projektordner einen statischen HTTP-Server starten, beispielsweise mit Python:

```bash
python3 -m http.server 8080
```

Dann `http://localhost:8080/` im Browser öffnen. Für die Integritätsprüfung wird Node.js benötigt:

```bash
node tools/check-project.mjs
```

Die Prüfung kontrolliert außerdem die Release-Versionen, Tilla-Einbindung und gespeicherte Anleitungsschließung aller drei Startseiten sowie beschädigte UTF-8-Zeichen im Vorschau-Modul. Sie kontrolliert JavaScript- und JSON-Syntax, HTML- und Spot-IDs, Koordinaten, Übersetzungsvollständigkeit, eingebundene Fallbacks, Modulabhängigkeiten, Manifest-Icons und vorhandene Offline-Dateien. Sie ersetzt keine Ortsrecherche oder manuelle Bedienprüfung.

Bei Änderungen zusätzlich die drei Sprachen, beide Designmodi, eine schmale mobile Ansicht, Tastaturbedienung, Speicherfunktionen und einen Offline-Neustart prüfen. Bei Änderungen am Service Worker auch die Aktualisierung einer bereits installierten Version testen.

## Deployment

Die statische Web-App wird über **GitHub Pages mit GitHub Actions** veröffentlicht. Die Workflows **Family Spots Map CI** und **Deploy to GitHub Pages** führen die Projektprüfung aus. Fehler, beispielsweise fehlende Offline-Bilder, blockieren die Veröffentlichung.

## Nächste Schritte

- Weitere Spots mit konkreten, aktuellen Familieninformationen ausarbeiten.
- Die Spielplätze Neerlandiavej und Barendsvej ergänzen.
- Eine hochwertige Auswahl rund um Hannover und Hildesheim für den Familientest vorbereiten.
- Rückmeldungen der Testfamilien zu Orientierung, Lesbarkeit, Informationen und Offline-Nutzung aufnehmen.
- Echte Ortsfotos und geeignete Quellen weiter ergänzen.
- Vor einem kostenpflichtigen Regelbetrieb Berechtigungsprüfung und Kontoverwaltung ausarbeiten.

Hinweise und Korrekturen können über die [GitHub-Issues des Projekts](https://github.com/HeimHafen/Family-Spots-Map/issues) eingebracht werden. Bestehende Gestaltung, Bildrechte, stabile Spot-IDs und vollständige Sprachtexte bei Änderungen berücksichtigen.

## Feinschliff in Release 39

Der Kopfbereich nutzt weniger Leerraum bei unveränderter Titelgröße und iPhone-Sicherheitsabstand. Grüne Einzelmarker erhalten kräftigere Farbtöne und einen weicheren Schatten; ihre 44 × 44 Pixel großen Bedienflächen und Koordinaten bleiben erhalten. Im Abendmodus sind ausschließlich die Kartenkacheln heller abgestimmt. Tilla, Vorschau, Speicherfunktionen und Daten bleiben erhalten.

## Gesamtprüfung in Release 40

Die Kategorie für Kleinkinder, Barfußspiel und Motorik ist in den Sprachkatalogen vollständig übersetzt. Die deutsche Kategorieliste verwendet „Kleinkind“. Die Offline-Einstiegsseite nutzt im Abendmodus dieselbe Olive-/Leinenpalette wie die Haupt-App; ihre Hinweise auf die Offline-Vorbereitung sind sprachlich präzisiert. Preise, Plus-Regeln, geografische Daten und persönliche Speicherformate bleiben unverändert.

## Tillas Herz in Release 41

Tilla trägt ein kleines orangefarbenes Aquarellherz mittig auf ihrem Panzer. Das gemeinsame Bildsymbol `assets/tilla/tilla-heart.png` erscheint bei „Mein Tag“, gespeicherten Favoriten und Herz-Hinweisen. Nicht gespeicherte Favoriten behalten ein leeres Umrissherz, damit der Zustand erkennbar bleibt. Der Erinnerungszettel wird weiterhin nur bei gespeicherten Erinnerungen eingeblendet. Für erzwungene Systemfarben gibt es einen SVG-Fallback. Beide PNG-Bilder werden im Offline-Paket gespeichert.

## Sanftes Schaukeln in Release 43

Sobald ihr geladenes Bild sichtbar ist, schaukelt Tilla einmal für 4,8 Sekunden leicht um ihre Standfläche und kommt anschließend zur Ruhe. Bild, Panzerherz und Erinnerungszettel bleiben in einem gemeinsamen Koordinatensystem. Bei aktivierter Einstellung „Bewegung reduzieren“ bleibt die Schaukeldarstellung deaktiviert. Die kurze Animation benötigt keine zusätzliche Bedienfläche und läuft nicht endlos im Hintergrund.


## Reparatur des gemischten Veröffentlichungsstands

Release 43 ersetzt die veraltete Kartengestaltung, stellt grüne Einzelpins mit
expliziter Punktgröße wieder her und vergrößert Tillas linke Bildspalte.
Die neue Cache-Version aktualisiert auch Geräte, die den fehlerhaften Stand 42
bereits gespeichert haben. Die beiden Herz-Bilder aus Release 42 bleiben erhalten.
Alle Ersatzdateien vollständig hochladen, `service-worker.js` zuletzt.
Persönliche Browserdaten nicht löschen.
