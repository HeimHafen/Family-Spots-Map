FAMILY SPOTS MAP · V90.2 – GEZIELTER PREMIUM-FEINSCHLIFF
03.11.2026 · FÜR DEINEN V90.1-TESTBRANCH, NICHT UNGEPRÜFT AUF MAIN!

VORAUSSETZUNG
Du benutzt die bereits installierte V90.1-Version (Premium-Kopfbereich,
Fuenfer-Navigation und nach unten verlaengerte Leaflet-Karte).
Alle anderen Dateien aus V90.1 bleiben am selben Ort und unveraendert.

KONKRET NEU
- Kopfbereich um etwa 10–20 CSS-Pixel gestrafft (je nach Bildschirmbreite)
- Tilla-Text ruhiger durch fein abgestimmten Zeilenabstand
- Der echte Spielideen-Button zeigt zuverlässig einen weissen Play-Pfeil
- Buttonfarbe etwas waermer und heller, passend zur pastelligen Farbwelt
- Die bestehende 5er-Navigation sitzt weiterhin tief ueber Safari
- Leaflet-Karte verlaeuft weiterhin hinter der Navigationsleiste
- DE/EN/DA bleiben technisch gleich; Spielideen-Texte koennen wechseln
- Service Worker aktualisiert, neue CSS-Datei mit gecachten Hashes
- Einheitliche Release-Version in HTML, CSS- und JS-Modulverweisen,
  ohne Veraenderung der App-Logik

NICHT GEAENDERT
Weder Spots, Kartenlogik, Marker, Funktionen, Offline-Daten,
Tilla-Bilddatei, Uebersetzungen, Navigation noch Darkmode.

AUSTAUSCH
1) Den aktuellen V90.1-Stand in Working Copy sichern.
2) Branch vom aktuellen V90.1-Testbranch erstellen ODER dort im Test bleiben.
3) Nur die 8 Projektdateien aus dem ZIP an die gleichen Pfade kopieren.
4) Vor dem Commit die Dateiliste kontrollieren: Es duerfen nur
   css/fsm-premium-polish-v902.css, css/styles.css, js/app.js,
   js/map.js, index.html, en/index.html, da/index.html und
   service-worker.js geaendert/neu sein.
5) Commit erstellen; Force Push AUS. Source-Branch nicht aendern.
6) Zu refs/heads/test/main-premium-v902 pushen, sofern der lokale
   Branch auch entsprechend angelegt wurde.
7) In Cloudflare die V90.2-Preview auf iPhone in Safari testen.

ACHTUNG
Das generierte Referenzbild ist kein Screenshot aus der fertigen Web-App.
Die CSS-Datei bringt das bestehende Live-Layout dem Bild naeher; es ist
keine pixelgenaue Garantie. Die Kartenmarker und Tilla-Sprueche sind dynamisch.
Safari bleibt im Browsermodus mit eigener URL-Leiste; kein CSS kann sie entfernen.

ZUSAMMENFASSUNG (Working Copy)
V90.2 – Pastell-Feinschliff, weisser Play-Pfeil und kompakter Tilla-Kopf

DETAILS (Working Copy)
Nur Startseiten-Design leicht gestrafft, Tilla-Typografie verfeinert,
Spielideen-Button mit weissem Play-Dreieck und harmonisiertem Orangeton.
Karte, Navigation, Darkmode, Daten und JS-Funktionen unveraendert;
interne Cache-Versionsverweise synchronisiert.

REMOTE-REFERENZ
refs/heads/test/main-premium-v902
Force Push: AUS
