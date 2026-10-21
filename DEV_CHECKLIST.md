# Family Spots Map – Freigabeprüfung

Stand: 21. Oktober 2026 · 130 Spots · Release 20261021-spots-crown-41

Diese Liste beschreibt den überprüften aktuellen Stand. Sie ersetzt die historische
Checkliste von Dezember 2025, deren offene Punkte teilweise bereits umgesetzt waren.

## Automatische Prüfung vor Veröffentlichung

- [x] JavaScript und Inline-Skripte auf Syntax geprüft.
- [x] JSON, Sprachschlüssel und gebündelte Sprach-Fallbacks abgeglichen.
- [x] Eindeutige Spot-IDs, gültige Koordinaten und dreisprachige Zusammenfassungen geprüft.
- [x] Modulverweise, Einstiegspunkte, lokale Bilder und Offline-Abhängigkeiten geprüft.
- [x] Bestehende Backup-Regressionen einschließlich beschädigter Archive geprüft.
- [x] Release-Prüfsummen mit den Austauschdateien abgeglichen.

Befehl: `node tools/check-project.mjs`

## Browserprüfung dieser Ausgabe

- [x] Deutsche, englische und dänische Einstiegsseiten und neue Spot-Details bedient.
- [x] Neue Kategorien über die sichtbare mobile Kategorieauswahl ausgewählt.
- [x] Vier Stimmungsfilter mit vorhandenen Kategorie- und Merkmalsdaten bedient.
- [x] Altersauswahl bis zum Vorliegen gepflegter Altersprofile inaktiv und erklärt.
- [x] Plus-Krone mit einheitlicher Form und Goldton in beiden Designmodi geprüft.
- [x] Favoriten im Menü, Favoritenansicht und Rückkehr zu allen Spots geprüft.
- [x] Kompakte Tagebuch-Buttons geprüft.
- [x] Update von der vorherigen Version einschließlich Schutz offener Eingaben geprüft.
- [x] Gespeicherte Test-Favoriten und Test-Erinnerung nach dem Update erhalten.
- [x] Offline-Neuladen und vorhandene Galerie-Dateien geprüft.

Prüfumgebung: Chromium mit mobilen Ansichten. Tatsächliches iOS Safari und die
Installation auf einem physischen iPhone sind separat in der Praxis zu prüfen.

## Inhaltliche Regeln

- Kategorien und Filter dürfen keine unbestätigte Übernachtungserlaubnis versprechen.
- Eigene Erlebnisse bleiben von aktuellen Betreiberangaben getrennt.
- Zeitplanung als redaktionelle Empfehlung kennzeichnen, sofern keine belastbare
  Tourenangabe vorliegt.
- Fehlende Angaben zu Ausstattung und Zugänglichkeit transparent benennen.
- Karten-Screenshots und fremde Vorschaufotos nicht als eigene Galerie-Fotos verwenden.
- Tatsächliche Ortsfotos und KI-Testbilder eindeutig unterscheiden.

## Bestehende Grenzen

- Datenrecherche und Familienerfahrungen ersetzen keine aktuelle Kontrolle vor Ort.
- Nicht alle 130 Spots haben denselben Umfang an ergänzten Informationen und Fotos.
- Persönliche Daten liegen im Browser; keine geräteübergreifende Kontosynchronisation.
- Plus-Freischaltungen werden lokal verarbeitet; keine serverseitige Zahlungsprüfung.
- Kartenkacheln werden über das Internet geladen und nicht offline vorgehalten.
