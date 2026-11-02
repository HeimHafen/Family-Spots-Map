# Family Spots Map V86 – Gemeinsam erleben

## Leitgedanke
Orte entdecken. Menschen verbinden. Erinnerungen schaffen.

## Nutzerfunktionen dieser Stufe

- Neuer Einstieg **Tilla-Menü → Gemeinsam erleben · Kalender** in DE, EN, DA.
- Kalenderansicht mit Monaten, einzelnen Tagen, Aktivitätsfilter und Spot-Bezug.
- **Jeder der 164 Spots** erhält einen kompakten Bereich „Gemeinsam erleben“ mit „Treffen entdecken“ und „Treffen planen“.
- Lokale private Veranstaltungsentwürfe mit Thema, Spot, Zeit, Einmalig/Jährlich und Kurzbeschreibung. Entwürfe werden ausschließlich im localStorage dieses Browsers gespeichert (maximal 20). Sie werden NICHT veröffentlicht oder synchronisiert.
- Export eines persönlichen Kalendertermins als `.ics` (inklusive jährlicher Wiederholung) und Kopieren einer Beschreibung.
- Ein bestehendes Bolzplatzkonzept aus V85 bleibt unverändert verfügbar.
- Öffentliche Veranstaltungen werden ausschließlich aus `data/events.json` gelesen; **im Lieferzustand ist diese Liste leer**.
- Offline: Modul, CSS und die leere Veranstaltungsdatei sind im Service-Worker-Cache aufgeführt.

## Was ausdrücklich noch NICHT existiert

- Öffentliche Selbstregistrierung, Live-Zusagen oder Teilnehmerzahlen
- Kontakt- oder Gruppenprofile, insbesondere für Minderjährige
- Backend / Synchronisation zwischen Geräten
- Direkte Einreichung oder Moderationsoberfläche für externe Organisatoren
- Push-Benachrichtigungen und automatische Terminbestätigung
- Filter nach Radius bzw. Stadt über mehrere Spots hinweg (derzeit nur Aktivität und konkreter Spot)

**Wichtig:** Lokale Entwürfe erscheinen nicht bei anderen Nutzern. Um einen Termin wirklich zu veröffentlichen, muss er zunächst außerhalb der App mit dem Veranstalter geklärt und nach Prüfung redaktionell aufgenommen werden. Das Veröffentlichen setzt die Einwilligung bzw. Autorisierung des Veranstalters und eine sichere, geeignete Organisation voraus.

## Datenformat `data/events.json`

Die Datei muss ein JSON-Array enthalten. Beispiel für einen **NICHT veröffentlichten Entwurf**:

```json
[
  {
    "id": "familientreffen-beispiel-01",
    "spot_id": "vejby_klit_free_rv_spot",
    "status": "draft",
    "approved": false,
    "organiser_verified": false,
    "category": "camping",
    "recurrence": "yearly",
    "starts_at": "2027-07-15T16:30",
    "title": {
      "de": "Beispiel: Familien-Campingtreffen",
      "en": "Example: Family camping meetup",
      "da": "Eksempel: Familiecampingtræf"
    },
    "organiser": {"name": "Nur ein Beispiel – kein realer Veranstalter"},
    "source_url": "https://example.org"
  }
]
```

Diese Testdaten gehören NICHT in die Live-Datei. Die App zeigt nur Datensätze mit **`status="published"`, `approved=true`, `organiser_verified=true`**, einem vorhandenen `spot_id`, gültigen Zukunftsterminen, einer HTTPS-Quellseite und allen drei Titelfassungen an. Bei `recurrence="yearly"` werden passende zukünftige Jahrestermine erzeugt; der Ursprungstermin darf in der Vergangenheit liegen. Andere Kategorien als `camping`, `sport`, `natur`, `familie`, `andere` werden verworfen.

Freigaben sind **redaktionelle Entscheidungen**, keine automatische Verifikation durch einen Boolean. Bestätige vor der Aufnahme schriftlich den verantwortlichen erwachsenen Veranstalter, Termin, öffentlichen Platz und sicheren Kontaktweg. Veröffentliche keine Kinderlisten, personenbezogenen Daten oder privaten Treffadressen.

## Vor Veröffentlichung prüfen

1. Vorherigen Commit als funktionierenden V85.1-Stand sichern.
2. ZIP vollständig mit identischen Pfaden in Working Copy entpacken; Dateien-Diff prüfen.
3. Lokal: `node tools/check-project.mjs` und `node tools/check-community.mjs` ausführen.
4. Tilla-Menü öffnen, „Gemeinsam erleben · Kalender“ aufrufen; Monate wechseln, Kategorie wechseln.
5. Spot öffnen, „Treffen entdecken“ testen (Spotfilter); „Treffen planen“ öffnen und privaten Entwurf anlegen, `.ics` herunterladen, wieder löschen.
6. Darstellung auf iPhone Safari und Android Chrome, Deutsch, Englisch, Dänisch und Dunkelmodus prüfen.
7. Normalen Push ausführen, nie Force Push.

## Sicherheit und Datenschutz

Kein Veröffentlichungs- oder Nachrichtensystem für Minderjährige. Vor einem öffentlichen Community-Launch sind mindestens eine geeignete Datenspeicherung mit Zugriffsrechten, Moderation, Meldefunktion, Datenschutzinformationen, Löschkonzept und ein Verfahren zur Prüfung von Veranstaltern erforderlich.
