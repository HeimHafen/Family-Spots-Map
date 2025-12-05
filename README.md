# Family Spots Map

Family Spots Map ist eine kuratierte Kartenanwendung für Familienabenteuer – mit handverlesenen Spielplätzen, Wildparks, Wasser-Spots, Museen, Camping- und WoMo-Spots sowie spezialisierten „Plus“-Kategorien.

Dieses Repository enthält das Frontend der Web-App (PWA) auf Basis von Leaflet und einer leichtgewichtigen, komponentenorientierten Architektur.

---

## Inhaltsverzeichnis

1. [Vision & Produktüberblick](#vision--produktüberblick)  
2. [Zielgruppen](#zielgruppen)  
3. [Tech-Stack](#tech-stack)  
4. [Architekturübersicht](#architekturübersicht)  
5. [UI-Komponenten & Designsystem](#ui-komponenten--designsystem)  
6. [Internationalisierung (i18n)](#internationalisierung-i18n)  
7. [Datenmodell & Spots](#datenmodell--spots)  
8. [PWA, Offline & Performance](#pwa-offline--performance)  
9. [Qualitätssicherung](#qualitätssicherung)  
10. [Build, Deployment & Hosting](#build-deployment--hosting)  
11. [Roadmap (Auszug)](#roadmap-auszug)  
12. [Für Kommunen, Destinationen & Partner](#für-kommunen-destinationen--partner)  
13. [Kontakt](#kontakt)

---

## Vision & Produktüberblick

**Kurzfassung (de):**

Family Spots Map hilft Familien, schnell verlässliche Orte für kleine und große Alltagsabenteuer zu finden – mit Fokus auf Qualität, Sicherheit und echte Erfahrungen mit Kindern statt anonymer Massenlisten.

**Short summary (en):**

Family Spots Map is a curated map for family adventures. It focuses on quality, safety and real-world experiences with children – not on being the biggest map, but the most trustworthy one.

Kernprinzipien:

- Kuratierte, verifizierte Spots statt anonymer User-Generierung
- Klarer Fokus auf Familienbedürfnisse (Alter, Stimmung, Radius, Wetter, Budget)
- Leichtgewichtige, performante Web-App mit guter Zugänglichkeit (A11y)
- Erweiterbar durch Plus-Pakete für spezielle Use Cases (Camping, WoMo, Bikepacking etc.)

---

## Zielgruppen

- **Familien / Eltern**  
  Schnell einen passenden Ort für ein paar gute Stunden mit Kindern finden.

- **Kommunen & Tourismus-Regionen**  
  Familienfreundliche Angebote sichtbar machen, Familienstrategie unterstützen.

- **Campingplätze & Ferienanlagen**  
  Gästen kuratierte Familien-Spots in der Region anbieten (Plus-Codes).

---

## Tech-Stack

- **Frontend:**  
  - HTML5, CSS3 (modulare Styles, mobile first, theming über `data-theme`)  
  - JavaScript (ES Modules; optional TypeScript in /js)  
  - [Leaflet](https://leafletjs.com/) für die Kartenansicht  
  - [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) für performantes Clustering

- **PWA / Plattform:**  
  - Web App Manifest (`manifest.webmanifest`)  
  - Service Worker (Offline-Basis, Asset-Caching – Implementierung in `js/app.js` bzw. `js/sw.js`)  
  - Mobile-optimiertes Viewport-Setup, Apple Touch Integration

- **SEO & Sharing:**  
  - Vollständige Meta-Tags (Open Graph, Twitter Cards, hreflang, canonical)  
  - Strukturierte Daten (Schema.org `WebApplication`)

---

## Architekturübersicht

Die App ist bewusst schlank gehalten, aber intern in klar voneinander getrennte Verantwortlichkeiten gegliedert:

- `index.html`  
  - Stellt semantische Struktur, A11y und Grundlayout bereit  
  - Enthält nur minimale Inline-Logik (z. B. Fallback-Skip-Link), keine Businesslogik

- `css/`  
  - `styles.css`: Layout, Typografie, Komponenten-Basestyles  
  - `badges.css`: Badges, Chips, kleine UI-Bausteine

- `js/` _(Beispielstruktur – bitte anpassen, falls anders im Projekt)_  
  - `app.js`: Entry-Point, Initialisierung der Karte und UI  
  - `map.js`: Leaflet-Setup, Marker, Clustering, Interaktion mit Sidebar  
  - `filters.js`: Filterlogik, Mood-Chips, Radius, Quick-Filters  
  - `i18n.js`: Sprachumschaltung und Text-Ausgabe  
  - `storage.js`: Favoriten, Daylog, Offline-Grundfunktionen (localStorage/IndexedDB)  
  - `plus.js`: Family Spots Plus / Partner-Codes  
  - `sw.js`: Service Worker (PWA-Caching-Strategie)

**Architekturziele:**

- Trennung von Daten, Darstellung und Interaktion
- Keine starke Abhängigkeit von Frameworks → einfach in andere Stacks integrierbar
- Lesbare, nachvollziehbare Vanilla-Struktur (ideal für kleine Teams & Partner)

---

## UI-Komponenten & Designsystem

Die Oberfläche ist auf wiederverwendbare Muster aufgebaut. Einige zentrale Komponenten:

- **Layout & Container**
  - `app`, `app-header`, `app-main`, `view`, `sidebar`, `map-section`

- **Sidebar-Section-Komponente**
  - Struktur: `.sidebar-section` + `.sidebar-section-header` + `.sidebar-section-title`
  - Varianten:  
    - Tilla-Begleiterin  
    - Familien-Kompass (`<details>`-basiert)  
    - Filter (Basis + Advanced)  
    - Family Spots Plus  
    - Mein Tag

- **Filter-Komponenten**
  - `filter-group`, `filter-group-label`, `filter-group-helper`
  - `mood-chip`, `quick-filter-chip`, `travel-chip`
  - Spezielle Inputs: Radius-Slider, Selects für Kategorie & Alter, Checkbox „Nur verifizierte Spots“

- **Spot-Komponenten**
  - `spot-list` (Liste von Karten, via JS gerendert)
  - `spot-details` (Detailansicht, `aria-live="polite"`)

- **Feedback & Systemoberfläche**
  - `toast` (Systemnachrichten)
  - `landscape-warning` (Hinweis bei ungünstiger Ausrichtung)

Wenn neue UI-Bausteine hinzukommen, sollten sie sich an diese Patterns anlehnen, um Konsistenz und Wartbarkeit zu sichern.

---

## Internationalisierung (i18n)

Family Spots Map ist mehrsprachig angelegt (DE, EN, DA).

- **Sprachen:**
  - Deutsch (`de`) – Hauptsprache
  - Englisch (`en`)
  - Dänisch (`da`)

- **Mechanismus:**
  - Im HTML: `data-i18n-de`, `data-i18n-en`, `data-i18n-da` für Textelemente  
  - Pro Sprache eigene About-Artikel (`#page-about-de`, `#page-about-en`, `#page-about-da`)  
  - `html lang="…"`, `link rel="alternate" hreflang="…"` für SEO

- **Empfohlene Weiterentwicklung:**
  - Zentraler I18n-Store (z. B. JSON) mit Schlüsseln (`header.tagline`, `filters.mood.relaxedLabel`)  
  - Mapping: Element → `data-i18n-key`  
  - Build-Step oder Laufzeit-Lookup zur besseren Wartbarkeit großer Textmengen

---

## Datenmodell & Spots

**Grundidee:**

- Spots werden kuratiert und ggf. verifiziert, bevor sie in die Karte kommen.
- Die Frontend-App arbeitet mit einem bekannten Schema, z. B.:

```ts
type Spot = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  tags: string[];         // z.B. ["water", "toddlers", "cheap"]
  mood?: string[];        // z.B. ["relaxed", "water"]
  ageRange?: string;      // "0-3" | "4-9" | "10+"
  verified?: boolean;
  description?: string;
  plusPackage?: string;   // z.B. "water-plus", "rv-plus"
};