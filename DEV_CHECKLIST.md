# Family Spots Map – Dev Checkliste

Diese Checkliste bündelt die wichtigsten technischen, UX- und Qualitäts-Themen rund um Family Spots Map.

---

## 1. HTML & Accessibility

| Status | Aufgabe                                                           | Prio   | Notizen |
|--------|-------------------------------------------------------------------|--------|---------|
| ✔️     | Globaler Skip-Link implementiert                                  | Mittel | Bereits vorhanden; Fokus-Styling noch feinjustieren (gut sichtbar auf Mobile). |
| ⬜     | `lang`-Attribut beim Sprachwechsel dynamisch setzen               | Hoch   | Aktuell `html lang="de"` statisch. Beim Umschalten auf EN/DA per JS `document.documentElement.lang` anpassen. |
| ⬜     | `alt`-Attribute bei Flaggen & Icons prüfen                        | Mittel | Flaggen im Header/Language-Chips: wenn dekorativ → `alt=""`, sonst beschreibend (z. B. „Sprache Deutsch“). |
| ⬜     | `aria-live`, `aria-expanded`, `aria-controls` konsistent nutzen   | Mittel | Für Filter-Panel, Menü, Modals und Spot-Details konsequent durchziehen. |
| ⬜     | Tastatur-Fokus gut sichtbar auf allen interaktiven Elementen      | Hoch   | Besonders: Chips, Filter-Buttons, Bottom-Navigation, Menü, Close-Buttons. |
| ⬜     | Rollen & Attribute für Dialoge/Menüs regelmäßig auditieren        | Mittel | Z. B. Filtermodal: `role="dialog"`, `aria-modal="true"`, Fokustrapping prüfen. |

---

## 2. SEO & Structured Data

| Status | Aufgabe                                                           | Prio   | Notizen |
|--------|-------------------------------------------------------------------|--------|---------|
| ✔️     | `canonical` + `hreflang` gesetzt                                  | Hoch   | DE/EN/DA sauber angelegt. |
| ✔️     | Meta-Tags (Title, Description, OG, Twitter) vorhanden             | Hoch   | Gute Basis für Sharing & Snippets. |
| ⬜     | `application/ld+json` um Preismodell ergänzen                     | Mittel | Z. B. `"priceModel": "Subscription"` oder erklärende Zusatzfelder. |
| ⬜     | `sitemap.xml` und `robots.txt` hinzufügen                         | Mittel | Für GitHub Pages: einfache statische Dateien im Root. |
| ⬜     | Optional: `hreflang="x-default"` ergänzen                         | Niedrig| Für Standard-/Fallback-Version, meist DE. |

---

## 3. Performance & PWA

| Status | Aufgabe                                                           | Prio   | Notizen |
|--------|-------------------------------------------------------------------|--------|---------|
| ✔️     | `manifest.webmanifest` eingebunden                                | Hoch   | PWA-Basis vorhanden. |
| ✔️     | `theme-color`, Apple-Statusbar etc. gesetzt                       | Hoch   | Mobile-Integration gut vorbereitet. |
| ⬜     | Service Worker / Offline-Caching einrichten                        | Hoch   | Kernressourcen cachen (App-JS, Styles, grundlegende Daten, evtl. Basiskarte). |
| ⬜     | Inline-CSS (Skip-Link usw.) in eigenes Stylesheet auslagern       | Mittel | Sauberere Trennung, besseres Caching. |
| ⬜     | Kritische Ressourcen mit `rel="preload"` optimieren               | Mittel | Z. B. wichtigste Font, Tilla-Image oder OG-Hero. |
| ⬜     | Regelmäßige Lighthouse-Audits                                     | Hoch   | Profil: Performance, PWA, Accessibility & SEO. Ergebnisse dokumentieren. |

---

## 4. Internationalisierung (i18n) & JS-Logik

| Status | Aufgabe                                                           | Prio   | Notizen |
|--------|-------------------------------------------------------------------|--------|---------|
| ✔️     | `data-i18n-xx`-Attribute durchgängig gesetzt                      | Hoch   | Übersetzbare Strings klar strukturiert. |
| ⬜     | Sprachwechsel setzt auch `lang`-Attribut des `<html>`-Elements    | Hoch   | Wichtig für Screenreader & SEO. |
| ⬜     | Sprachwahl per URL-Param/LocalStorage steuerbar machen            | Mittel | z. B. `?lang=en` und letzte Sprache beim nächsten Start wiederherstellen. |
| ⬜     | Menü & Language-Chips in klar getrennte JS-Module auslagern       | Mittel | Bessere Wartbarkeit: z. B. `menu.js`, `i18n.js`. |
| ⬜     | ARIA-Attribute (`aria-expanded`, `hidden`, `aria-modal`) konsistent über JS pflegen | Hoch | Besonders bei Menü, Filter-Modal und Spot-Details. |

---

## 5. UX, States & Microcopy

| Status | Aufgabe                                                           | Prio   | Notizen |
|--------|-------------------------------------------------------------------|--------|---------|
| ✔️     | Microcopy & Emojis familientauglich, freundlich                   | Hoch   | Tonalität stimmig, Tilla klar als Begleiterin erkennbar. |
| ⬜     | Loading-Zustände für Map / Spot-Liste / Filter anzeigen           | Mittel | z. B. Skeleton Cards oder „Lade Spots …“ beim ersten Fetch. |
| ⬜     | Zustand „Mein Tag“ (Daylog) persistieren                           | Hoch   | LocalStorage oder IndexedDB, inkl. Zeitstempel & Historie. |
| ⬜     | Filter- und Sprachzustände persistieren                            | Mittel | Nach Reload sollten Auswahl, Sprache und evtl. Mood-Chips erhalten bleiben. |

---

## 6. Qualitätssicherung – Empfohlene Tools

- **Accessibility**
  - axe DevTools (Chrome Extension)
  - WAVE Web Accessibility Evaluation Tool
  - Lighthouse (Chrome DevTools → Reiter „Lighthouse“)

- **Performance**
  - PageSpeed Insights
  - WebPageTest

- **SEO**
  - Ahrefs Webmaster Tools
  - Screaming Frog SEO Spider (kostenlose Variante reicht meist)

- **i18n**
  - Manuell: Sprachwechsel testen, `lang`-Attribut und textliche Konsistenz prüfen
  - Optional: kleine Unit-Tests, die Vorhandensein der `data-i18n-*`-Keys checken

- **PWA**
  - Lighthouse Audit mit Fokus auf:
    - „Installierbar“
    - „Offlinefähig“
    - Icon-Qualität und Manifest-Konfiguration

---

## 7. Nächste sinnvolle Schritte (Empfehlung)

1. **Accessibility-Basics schließen**
   - `lang`-Attribut dynamisch
   - Fokuszustände prüfen
   - ARIA bei Modals/Menüs nachziehen

2. **PWA-Fähigkeit stärken**
   - Einfachen Service Worker einbauen
   - Kernassets und Grundfunktion offline nutzbar machen

3. **State-Persistenz**
   - Sprache, Filter & „Mein Tag“ dauerhaft speichern

4. **Regelmäßige Audits**
   - Lighthouse-/axe-Bericht z. B. 1x pro Monat laufen lassen
   - Ergebnisse kurz im Repo dokumentieren (`/docs/audits/`)