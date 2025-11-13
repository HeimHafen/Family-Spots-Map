# Family Spots Map – ABF 2026 Edition (v2.1)

**Mission:** Familien finden kinderfreundliche Orte schnell, schön und offline-tauglich.

**Features**
- 🌈 Light-Theme • 🇩🇪/🇬🇧 Sprachumschalter • 🗺️ Leaflet + Clustering
- 🔎 Suche + Kategorie + „Nur verifiziert“ + Favoriten (Import/Export)
- 🔗 Deep-Links (#query, #category, #favoritesOnly, #verifiedOnly, #spotId)
- ➕ Add-Spot JSON-Generator
- ⚡ PWA (Service Worker, Offline-Seite)
- 🔒 0 Tracker

## Live stellen (GitHub Pages)
1. Neues Repo → Dateien hochladen.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Die Action `Deploy to GitHub Pages` veröffentlicht die App.

## Lokal testen
```bash
python3 -m http.server 8080
# http://localhost:8080