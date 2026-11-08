# Family Spots Map – Ziel 2027: Apple App Store und Google Play

**Planungsstand 08.11.2026.** Dies ist eine technische Vorbereitungsübersicht, **keine** erteilte App-Store-Freigabe. Änderungen erfolgen weiterhin zuerst in `test/fsm-v34-details` und nur nach Abnahme in `main`.

## Grundsatz

Die aktuelle HTML-/CSS-/JavaScript-App soll möglichst als gemeinsame Codebasis erhalten bleiben. Ein späterer nativer Container (z. B. Capacitor) kann die bestehende Web-Anwendung einbetten und bei Bedarf native Funktionen ergänzen. Die Web-App bleibt bis dahin eigenständig nutzbar. Ein App-Store-Build ist **noch nicht** enthalten.

## Was wir bereits für 2027 schützen

- Stabile Spot-IDs, geografische Koordinaten und Datenformate: wichtig für Favoriten, Erinnerungen und spätere Migration.
- Einheitliche DE/EN/DA-Logik und unveränderte visuelle Referenz.
- Eigenständige lokale Bibliotheken (`vendor/leaflet` etc.) statt laufzeitabhängiger CDN-Skripte.
- Export/Import persönlicher Daten als ZIP V3, ohne Cloudzwang.
- Keine neue verpflichtende Anmeldung oder Community-Profile.
- Hosting-unabhängige Pfade (Cloudflare-Root und GitHub-Pages-Unterverzeichnis), automatisiert getestet durch `tools/check-hosting.mjs`.

## Noch vor dem nativen Prototyp erledigen

1. **Gerätetests:** echtes iPhone/iPad und Android, inklusive Touch, Tastatur, Dialogen, Fotos, Kamera-/Dateiauswahl, Geo-Standort, Kalenderdatei und externen Karten-Links.
2. **Offline:** klare Erststart-/Update-Führung und kontrolliertes Verhalten ohne Internet. Externe OSM-Kartenkacheln sind nicht allgemein offline zugesagt.
3. **Persistenz und Gerätewechsel:** Dateisicherung (V3) ist ein erster Schritt. Native Speicherorte und Migration aus Browser-/PWA-Speicher müssen getrennt getestet werden. Keine stillen Datenverluste beim Wechsel der Installationsart.
4. **Natives Projekt:** Vorab einen unveränderlichen Stand einfrieren, Build-/Asset-Verzeichnis und `package.json` vorbereiten; dann einen **getrennten** Capacitor-Prototyp für iOS/Android erzeugen. Nicht die laufende Webversion durch einen ungetesteten Native-Umbau ersetzen.
5. **Rechtliches und Inhalte:** vollständige und korrekt erreichbare Datenschutzhinweise, Impressum, Rechte an Fotos/Karten/Grafiken, offizielle Kontaktadresse, Altersfreigabe, Lizenzen und Einwilligungen klären. Besonders Bilder mit identifizierbaren Kindern prüfen.
6. **Plus:** den heutigen lokalen Entwicklercode **nicht** als kostenpflichtige Zugriffskontrolle übernehmen. Sichere Berechtigungen und ggf. Apple-/Google-In-App-Käufe/Entitlements nach den dann gültigen Regeln planen.
7. **Store-Freigabe:** native App muss eigenständigen Nutzwert bieten, nicht bloß eine umverpackte Website; vollständige technische Tests und Store-Metadaten vor Einreichung.
8. **Verantwortliche Konten:** Apple Developer und Google Play Console mit passenden Angaben und ggf. Alters-/Zugriffsregeln einrichten.

## Verlässliche Referenzen für die spätere Planung

- Capacitor: https://capacitorjs.com/docs/getting-started
- Apple App Review: https://developer.apple.com/app-store/review/guidelines/
- Google Play Developer Policy: https://play.google.com/about/developer-content-policy/

**Verbindliches Produktziel:** „Orte entdecken. Menschen verbinden. Erinnerungen schaffen.“ Die Karte bleibt Mittelpunkt; es entsteht keine überladene soziale App.
