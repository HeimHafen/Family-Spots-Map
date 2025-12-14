# ✅ Family Spots Map – Dev Checkliste

Diese Checkliste enthält alle technischen, UX- und Qualitäts-Tasks rund um die Weiterentwicklung der App. Sie ist iterativ gepflegt und kann bei Releases als Referenz genutzt werden.

---

## 1. HTML & Accessibility

| Status | Aufgabe                                                                 | Prio    | Notizen |
|--------|-------------------------------------------------------------------------|---------|---------|
| [x]    | Skip-Link eingebaut und sichtbar auf mobilen Geräten                    | Mittel  | Fokus-Styling ist gut sichtbar und A11y-konform |
| [ ]    | Dynamisches Setzen von `lang` beim Sprachwechsel (`document.documentElement.lang`) | Hoch | Aktuell nur statisch `de` gesetzt |
| [ ]    | Alle `img`/SVG-Elemente: `alt` korrekt ("" für dekorativ, sonst beschreibend) | Mittel | z. B. Flaggen & Icons im Header |
| [ ]    | `aria-live`, `aria-expanded`, `aria-controls` semantisch korrekt nutzen | Mittel | Für Filterpanel, Menü, Modals, etc. |
| [ ]    | Fokuszustände auf Buttons, Chips, Nav-Elementen gut sichtbar            | Hoch    | Auch bei Tastatursteuerung testbar |
| [ ]    | Dialoge korrekt ausgezeichnet (`role="dialog"`, `aria-modal="true"`)   | Mittel  | inkl. Fokustrapping & Escape |

---

## 2. SEO & Structured Data

| Status | Aufgabe                                                        | Prio   | Notizen |
|--------|----------------------------------------------------------------|--------|---------|
| [x]    | Canonical-URL + `hreflang` korrekt gesetzt                     | Hoch   | DE/EN/DA vorhanden |
| [x]    | Title + Meta-Description, OG-Tags, Twitter Cards                | Hoch   | Titelstruktur + Sharing funktioniert |
| [ ]    | Strukturierte Daten: `application/ld+json` mit App/Produkt-Infos | Mittel | Ggf. `"priceModel"` ergänzen |
| [ ]    | Sitemap.xml & robots.txt bereitgestellt                        | Mittel | Im Root statisch verfügbar |
| [ ]    | Optional: `hreflang="x-default"` für Fallback hinzufügen       | Niedrig| Verlinkt meist DE-Version |

---

## 3. PWA & Performance

| Status | Aufgabe                                                             | Prio   | Notizen |
|--------|---------------------------------------------------------------------|--------|---------|
| [x]    | Manifest implementiert + gültig                                     | Hoch   | Icons, Shortcuts, Theme-Color korrekt |
| [x]    | Apple-Statusbar & Theme-Color für iOS gesetzt                       | Hoch   | Meta-Viewport + Icons ready |
| [ ]    | Service Worker integriert & testbar                                 | Hoch   | JS/CSS/Daten offlinefähig |
| [ ]    | Inline-Styles (Skip-Link etc.) in `css/styles.css` auslagern        | Mittel | Caching optimiert |
| [ ]    | `rel="preload"` für wichtige Assets (Fonts, Hero, Logos)            | Mittel | Optional bei Performance-Need |
| [ ]    | Regelmäßiger Lighthouse-Audit (1x pro Monat, dokumentiert)          | Hoch   | `/docs/audits/` als Speicherort |

---

## 4. Internationalisierung (i18n)

| Status | Aufgabe                                                            | Prio   | Notizen |
|--------|--------------------------------------------------------------------|--------|---------|
| [x]    | `data-i18n-*` Attribute für UI-Texte vorhanden                     | Hoch   | Alle Core-Komponenten abgedeckt |
| [ ]    | `html[lang]` dynamisch beim Umschalten setzen                      | Hoch   | wichtig für SEO & Screenreader |
| [ ]    | Sprachwahl via LocalStorage + URL (`?lang=`) steuern               | Mittel | Wiederherstellung bei Neustart |
| [ ]    | i18n-Logik in `i18n.js`, Sprachchips in eigenes Modul (`menu.js`)  | Mittel | Struktur verbessern |
| [ ]    | ARIA-Attribute über JS setzen (Menü/Modal)                         | Hoch   | z. B. `aria-expanded` oder `aria-hidden` |

---

## 5. UX, States & Microcopy

| Status | Aufgabe                                                        | Prio   | Notizen |
|--------|----------------------------------------------------------------|--------|---------|
| [x]    | Microcopy kindgerecht + Tilla-Ansprache konsistent             | Hoch   | Emojis & Ton passen gut |
| [ ]    | Ladezustände für Karte, Filter & Liste (Skeleton oder Spinner) | Mittel | Feedback beim Datenfetch |
| [ ]    | „Mein Tag“ (Daylog) wird gespeichert                           | Hoch   | Lokale Persistenz mit Zeitstempel |
| [ ]    | Filterzustand, Sprache & Mood-Chips werden gespeichert         | Mittel | Optional: Export als JSON |

---

## 6. Tooling & QS

| Task                                        | Empfehlung |
|--------------------------------------------|------------|
| Accessibility Audit                        | axe DevTools, WAVE, Lighthouse |
| SEO Audit                                  | Ahrefs, Screaming Frog, Lighthouse |
| Performance & PWA                          | PageSpeed Insights, Lighthouse |
| Automatisierte Checks                      | GitHub Actions, monthly Lighthouse CI |
| i18n Testbarkeit                           | manuell oder Unit-Test auf fehlende Keys |

---

## 🔜 Nächste Schritte (Sprint-Ziele)

1. **A11y-Lücken schließen** → Fokus, ARIA, lang  
2. **Offlinefähigkeit mit Service Worker starten**  
3. **State & LocalStorage persistieren** (Sprache, Filter, Daylog)  
4. **Toolchain aufsetzen** → CI für Audits & i18n-Checks

---

📁 Datei: `CHECKLISTE.md`  
🕒 Letztes Update: 2025-12-14  
✍️ Bearbeiten: via Pull Request oder im `main`-Branch direkt  