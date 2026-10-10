// js/i18n.js
// --------------------------------------
// Family Spots Map – i18n / Spielideen
// (ABF 2026 nutzt dieselbe i18n-Logik;
//  ABF-spezifische Texte liegen in data/i18n/*.json)
// --------------------------------------

"use strict";

import { fetchJsonWithTimeout } from "./data/dataLoader.js?v=20261010-repair-3";

/**
 * Unterstützte Sprachen & Defaults
 * ---------------------------------- */

/** @type {readonly ["de", "en", "da"]} */
const SUPPORTED_LANGS = ["de", "en", "da"];
/** @type {const} */
const DEFAULT_LANG = "de";
/** @type {const} */
const STORAGE_LANG_KEY = "fs_lang";

/** @typedef {"de" | "en" | "da"} LangCode */

/** @type {LangCode} */
let currentLang = DEFAULT_LANG;

/**
 * messagesByLang[lang] = { key: "Übersetzung" }
 * @type {Record<LangCode, Record<string, string>>}
 */
// Complete bundled translations remain available even if a language request fails.
// tools/check-project.mjs verifies exact agreement with the editable JSON files.
const FALLBACK_MESSAGES = {
  "de": {
    "__meta.locale": "de-DE",
    "__meta.source": "family-spots",
    "__meta.updatedAt": "2026-10-08",
    "ui.meta.title": "Family Spots Map – Die schönste Karte für Familien-Abenteuer",
    "ui.meta.description": "Handverlesene Orte für Familien: Spielplätze, Tiere, Wasser & Wege mit Erinnerungswert.",
    "ui.errors.dataLoad": "Ups – das hat gerade nicht geklappt. Bitte versuch es gleich noch einmal.",
    "ui.aria.help": "Hilfe und Infos anzeigen",
    "ui.aria.themeToggle": "Designmodus wechseln",
    "ui.aria.locate": "Standort zentrieren",
    "ui.labels.languageSwitcher": "Sprache wechseln",
    "ui.alt.tillaImage": "Tilla die Schildkröte – eure Familienbegleiterin",
    "ui.header.tagline": "Heute wird aus Alltag ein kleines Familienabenteuer – ganz nah.",
    "ui.buttons.showFilters": "Filter aufklappen",
    "ui.buttons.hideFilters": "Filter zuklappen",
    "ui.buttons.onlyMap": "Nur Karte",
    "ui.buttons.showList": "Liste zeigen",
    "ui.toast.locationOk": "Standort gesetzt – euer nächster Moment wartet. 🌍",
    "ui.toast.locationError": "Standort gerade nicht verfügbar. Vielleicht offline – ihr findet euren Weg.",
    "ui.toast.locationUnavailableRadiusDisabled": "Standort nicht verfügbar – Radiusfilter ist deaktiviert.",
    "ui.toast.favAdded": "Zu den Favoriten – ein Ort, der bleiben darf. 💚",
    "ui.toast.favRemoved": "Aus Favoriten entfernt – neue Schätze warten. 🌿",
    "ui.filters.categoryAll": "Alle Kategorien",
    "ui.filters.radius.maxLabel": "Alle Spots",
    "ui.filters.radius.description.step0": "Mini-Abenteuer – ganz nah, perfekt für eine kleine Pause.",
    "ui.filters.radius.description.step1": "Kurz raus – schnell da, schnell wieder zurück.",
    "ui.filters.radius.description.step2": "Kleine Tour – ein halber Tag voller Entdeckungen.",
    "ui.filters.radius.description.step3": "Großes Ziel – ein ganzer Tag für magische Momente.",
    "ui.filters.radius.description.all": "Alle Spots – ohne Radius. Die Karte gehört euch.",
    "ui.plus.codeEmpty": "Bitte zuerst euren Partner-Code eingeben.",
    "ui.plus.codeUnknown": "Dieser Code ist unbekannt oder nicht mehr gültig.",
    "ui.plus.activated": "Family Spots Plus ist aktiv – viel Freude auf euren Touren!",
    "ui.plus.failed": "Code gerade nicht prüfbar. Bitte später noch einmal versuchen.",
    "ui.tilla.intro1": "Ich bin Tilla. Ich zeige euch Orte für Nähe, Erinnerungen und kleine Abenteuer. Gehen wir los? 🐢",
    "ui.tilla.intro2": "Heute finde ich keinen passenden Spot. Vielleicht ein Spaziergang – oder Radius etwas aufdrehen. 🐢",
    "ui.tilla.afterDaylogSave": "Euer Tag ist gespeichert – klein erlebt, groß erinnert. 💚",
    "ui.tilla.afterFavAdded": "Dieser Ort hat jetzt ein Herz auf eurer Karte. 💚",
    "ui.tilla.afterFavRemoved": "Alles gut – nicht jeder Ort bleibt. Wir finden neue. 🐢",
    "ui.tilla.tripMode": "Ihr seid unterwegs – ich halte Ausschau nach Herzmomenten. 🚐",
    "ui.tilla.everydayMode": "Alltag darf leuchten. Lass uns Wunder ganz nah finden. 🌿",
    "ui.tilla.plusActivated": "Plus ist aktiv – mehr Wege, mehr Orte, mehr Abenteuer. ✨",
    "ui.daylog.saved": "Gespeichert 💾 – später könnt ihr zurücklächeln.",
    "ui.nav.map": "Karte",
    "ui.nav.about": "Über Family Spots Map",
    "ui.route.apple": "In Apple Karten öffnen",
    "ui.route.google": "In Google Maps öffnen",
    "domain.categories.spielplatz": "Spielplatz",
    "domain.categories.abenteuerspielplatz": "Abenteuerspielplatz",
    "domain.categories.indoor_spielplatz": "Indoor-Spielplatz",
    "domain.categories.waldspielplatz": "Waldspielplatz",
    "domain.categories.wasserspielplatz": "Wasserspielplatz",
    "domain.categories.barrierefreier_spielplatz": "Barrierefreier Spielplatz",
    "domain.categories.bewegungspark": "Bewegungspark",
    "domain.categories.multifunktionsfeld": "Multifunktionsfeld",
    "domain.categories.bolzplatz": "Bolzplatz",
    "domain.categories.pumptrack": "Pumptrack",
    "domain.categories.skatepark": "Skatepark",
    "domain.categories.verkehrsgarten": "Verkehrsgarten",
    "domain.categories.toddler_barfuss_motorik": "Kleinkind / Barfuß & Motorik",
    "domain.categories.zoo": "Zoo",
    "domain.categories.tierpark": "Tierpark",
    "domain.categories.wildpark": "Wildpark & Safari",
    "domain.categories.bauernhof": "Bauernhof",
    "domain.categories.naturerlebnispfad": "Naturerlebnispfad",
    "domain.categories.walderlebnisroute": "Walderlebnisroute",
    "domain.categories.freilichtmuseum": "Freilichtmuseum",
    "domain.categories.schwimmbad": "Schwimmbad",
    "domain.categories.badesee": "Badesee",
    "domain.categories.strand": "Familienstrand",
    "domain.categories.eisbahn": "Eisbahn",
    "domain.categories.rodelhuegel": "Rodelhügel",
    "domain.categories.freizeitpark": "Freizeitpark",
    "domain.categories.trampolinpark": "Trampolinpark",
    "domain.categories.kletterhalle": "Kletterhalle",
    "domain.categories.kletteranlage_outdoor": "Kletteranlage (Outdoor)",
    "domain.categories.kletterwald_hochseilgarten": "Kletterwald / Hochseilgarten",
    "domain.categories.boulderpark": "Boulderpark",
    "domain.categories.minigolf": "Minigolf",
    "domain.categories.hoehle": "Höhle / Felsausflug",
    "domain.categories.felsenwanderung": "Felsenwanderung",
    "domain.categories.aussichtspunkt": "Aussichtspunkt",
    "domain.categories.baumhaus": "Baumhaus / Aussicht",
    "domain.categories.labyrinth": "Labyrinth",
    "domain.categories.klangpfad": "Klangpfad in der Natur",
    "domain.categories.ueberdachter_spielplatz": "Überdachter Spielplatz",
    "domain.categories.dirtbike_track": "Dirtbike-Track",
    "domain.categories.streetball_platz": "Streetball / Basketball",
    "domain.categories.waldbaden_ort": "Waldbaden / Ruheort",
    "domain.categories.natur_aussichtspunkt": "Natürlicher Aussichtspunkt",
    "domain.categories.wanderweg_kinderwagen": "Weg (kinderwagentauglich)",
    "domain.categories.radweg_family": "Familien-Radweg",
    "domain.categories.familiencafe": "Familiencafé",
    "domain.categories.kinder_familiencafe": "Kinder- & Familiencafé",
    "domain.categories.familien_restaurant": "Familienrestaurant",
    "domain.categories.museum_kinder": "Museum (Kinder)",
    "domain.categories.kinder_museum": "Kindermuseum",
    "domain.categories.bibliothek": "Kinder- & Familienbibliothek",
    "domain.categories.oeffentliche_toilette": "Öffentliche Toilette",
    "domain.categories.wickelraum": "Wickelraum",
    "domain.categories.familien_event": "Familien-Event",
    "domain.categories.stellplatz_spielplatz_naehe_kostenlos": "Stellplatz nahe Spielplatz (kostenlos)",
    "domain.categories.wohnmobil_service_station": "Wohnmobil-Service-Station",
    "domain.categories.rastplatz_spielplatz_dusche": "Rastplatz mit Spielplatz/Dusche",
    "domain.categories.bikepacking_spot": "Bikepacking-Spot",
    "domain.categories.campingplatz_familien": "Familienfreundlicher Campingplatz",
    "domain.categories.park_garten": "Park / Garten",
    "domain.categories.picknickwiese": "Picknickwiese",
    "meta_title": "Family Spots Map – Die schönste Karte für Familien-Abenteuer",
    "meta_description": "Handverlesene Orte für Familien: Spielplätze, Tiere, Wasser & Wege mit Erinnerungswert.",
    "error_data_load": "Ups – das hat gerade nicht geklappt. Bitte versuch es gleich noch einmal.",
    "btn_help_aria": "Hilfe und Infos anzeigen",
    "btn_theme_toggle_aria": "Designmodus wechseln",
    "btn_locate_aria": "Standort zentrieren",
    "alt_tilla_image": "Tilla die Schildkröte – eure Familienbegleiterin",
    "header_tagline": "Heute wird aus Alltag ein kleines Familienabenteuer – ganz nah.",
    "btn_show_filters": "Filter aufklappen",
    "btn_hide_filters": "Filter zuklappen",
    "btn_only_map": "Nur Karte",
    "btn_show_list": "Liste zeigen",
    "filter_category_all": "Alle Kategorien",
    "filter_radius_max_label": "Alle Spots",
    "filter_radius_description_all": "Alle Spots – ohne Radius. Die Karte gehört euch.",
    "plus_code_empty": "Bitte zuerst euren Partner-Code eingeben.",
    "plus_code_unknown": "Dieser Code ist unbekannt oder nicht mehr gültig.",
    "plus_code_activated": "Family Spots Plus ist aktiv – viel Freude auf euren Touren!",
    "plus_code_failed": "Code gerade nicht prüfbar. Bitte später noch einmal versuchen.",
    "nav_map": "Karte",
    "nav_about": "Über Family Spots Map",
    "route_apple": "In Apple Karten öffnen",
    "route_google": "In Google Maps öffnen",
    "daylog_saved": "Gespeichert 💾 – später könnt ihr zurücklächeln.",
    "turtle_intro_1": "Ich bin Tilla. Ich zeige euch Orte für Nähe, Erinnerungen und kleine Abenteuer. Gehen wir los? 🐢",
    "turtle_intro_2": "Heute finde ich keinen passenden Spot. Vielleicht ein Spaziergang – oder Radius etwas aufdrehen. 🐢",
    "turtle_after_daylog_save": "Euer Tag ist gespeichert – klein erlebt, groß erinnert. 💚",
    "turtle_after_fav_added": "Dieser Ort hat jetzt ein Herz auf eurer Karte. 💚",
    "turtle_after_fav_removed": "Alles gut – nicht jeder Ort bleibt. Wir finden neue. 🐢",
    "turtle_trip_mode": "Ihr seid unterwegs – ich halte Ausschau nach Herzmomenten. 🚐",
    "turtle_everyday_mode": "Alltag darf leuchten. Lass uns Wunder ganz nah finden. 🌿",
    "turtle_plus_activated": "Plus ist aktiv – mehr Wege, mehr Orte, mehr Abenteuer. ✨",
    "toast_location_ok": "Standort gesetzt – euer nächster Moment wartet. 🌍",
    "toast_location_error": "Standort gerade nicht verfügbar. Vielleicht offline – ihr findet euren Weg.",
    "toast_location_unavailable_radius_disabled": "Standort nicht verfügbar – Radiusfilter ist deaktiviert.",
    "toast_fav_added": "Zu den Favoriten – ein Ort, der bleiben darf. 💚",
    "toast_fav_removed": "Aus Favoriten entfernt – neue Schätze warten. 🌿",
    "filter_radius_description_step0": "Mini-Abenteuer – ganz nah, perfekt für eine kleine Pause.",
    "filter_radius_description_step1": "Kurz raus – schnell da, schnell wieder zurück.",
    "filter_radius_description_step2": "Kleine Tour – ein halber Tag voller Entdeckungen.",
    "filter_radius_description_step3": "Großes Ziel – ein ganzer Tag für magische Momente.",
    "btn_show": "Anzeigen",
    "btn_hide": "Ausblenden",
    "plus_status_inactive": "Family Spots Plus ist nicht aktiviert.",
    "plus_status_active": "Family Spots Plus ist aktiv.",
    "plus_status_active_until": "Family Spots Plus ist aktiv bis {date}.",
    "plus_status_expired": "Family Spots Plus ist am {date} abgelaufen.",
    "menu_title": "Menü",
    "aria_settings": "App-Einstellungen und Schnellzugriffe",
    "aria_map": "Karte",
    "aria_map_spots": "Karte mit Spots",
    "aria_hint": "Kurze Anleitung zur Karte",
    "aria_hint_close": "Anleitung schließen",
    "aria_about": "Über Family Spots Map",
    "aria_navigation": "Navigation",
    "landscape_hint": "Bitte Gerät drehen 📱🔄 – im Hochformat fühlt sich Tilla wohler.",
    "map_zoom_in": "Vergrößern",
    "map_zoom_out": "Verkleinern",
    "map_contributors": "Mitwirkende",
    "spot_fallback": "Ausflugsort",
    "spots_title": "Spots",
    "plus_suffix": " (Plus)",
    "addon_suffix": " (Zusatzpaket)",
    "locked_suffix": " 🔒",
    "toast_marker_limit": "Viele Spots gefunden – zoomt für mehr Übersicht in die Karte.",
    "category_spielplatz": "Spielplatz",
    "category_abenteuerspielplatz": "Abenteuerspielplatz",
    "category_indoor_spielplatz": "Indoor-Spielplatz",
    "category_waldspielplatz": "Waldspielplatz",
    "category_wasserspielplatz": "Wasserspielplatz",
    "category_barrierefreier_spielplatz": "Barrierefreier Spielplatz",
    "category_bewegungspark": "Bewegungspark",
    "category_multifunktionsfeld": "Multifunktionsfeld",
    "category_bolzplatz": "Bolzplatz",
    "category_pumptrack": "Pumptrack",
    "category_skatepark": "Skatepark",
    "category_verkehrsgarten": "Verkehrsgarten",
    "category_toddler_barfuss_motorik": "Kleinkind / Barfuß & Motorik",
    "category_zoo": "Zoo",
    "category_tierpark": "Tierpark",
    "category_wildpark": "Wildpark & Safari",
    "category_bauernhof": "Bauernhof",
    "category_naturerlebnispfad": "Naturerlebnispfad",
    "category_walderlebnisroute": "Walderlebnisroute",
    "category_freilichtmuseum": "Freilichtmuseum",
    "category_schwimmbad": "Schwimmbad",
    "category_badesee": "Badesee",
    "category_strand": "Familienstrand",
    "category_eisbahn": "Eisbahn",
    "category_rodelhuegel": "Rodelhügel",
    "category_freizeitpark": "Freizeitpark",
    "category_trampolinpark": "Trampolinpark",
    "category_kletterhalle": "Kletterhalle",
    "category_kletteranlage_outdoor": "Kletteranlage (Outdoor)",
    "category_kletterwald_hochseilgarten": "Kletterwald / Hochseilgarten",
    "category_boulderpark": "Boulderpark",
    "category_minigolf": "Minigolf",
    "category_hoehle": "Höhle / Felsausflug",
    "category_felsenwanderung": "Felsenwanderung",
    "category_aussichtspunkt": "Aussichtspunkt",
    "category_baumhaus": "Baumhaus / Aussicht",
    "category_labyrinth": "Labyrinth",
    "category_klangpfad": "Klangpfad in der Natur",
    "category_ueberdachter_spielplatz": "Überdachter Spielplatz",
    "category_dirtbike_track": "Dirtbike-Track",
    "category_streetball_platz": "Streetball / Basketball",
    "category_waldbaden_ort": "Waldbaden / Ruheort",
    "category_natur_aussichtspunkt": "Natürlicher Aussichtspunkt",
    "category_wanderweg_kinderwagen": "Weg (kinderwagentauglich)",
    "category_radweg_family": "Familien-Radweg",
    "category_familiencafe": "Familiencafé",
    "category_kinder_familiencafe": "Kinder- & Familiencafé",
    "category_familien_restaurant": "Familienrestaurant",
    "category_museum_kinder": "Museum (Kinder)",
    "category_kinder_museum": "Kindermuseum",
    "category_bibliothek": "Kinder- & Familienbibliothek",
    "category_oeffentliche_toilette": "Öffentliche Toilette",
    "category_wickelraum": "Wickelraum",
    "category_familien_event": "Familien-Event",
    "category_stellplatz_spielplatz_naehe_kostenlos": "Stellplatz nahe Spielplatz (kostenlos)",
    "category_wohnmobil_service_station": "Wohnmobil-Service-Station",
    "category_rastplatz_spielplatz_dusche": "Rastplatz mit Spielplatz/Dusche",
    "category_bikepacking_spot": "Bikepacking-Spot",
    "category_campingplatz_familien": "Familienfreundlicher Campingplatz",
    "category_park_garten": "Park / Garten",
    "category_picknickwiese": "Picknickwiese"
  },
  "en": {
    "__meta.locale": "en",
    "__meta.source": "family-spots",
    "__meta.updatedAt": "2026-10-08",
    "ui.meta.title": "Family Spots Map – Family adventures near you",
    "ui.meta.description": "Handpicked places for families: playgrounds, animals, water play, and short routes that turn into memories.",
    "ui.errors.dataLoad": "Oops – we couldn’t load the data just now. Please try again in a moment.",
    "ui.aria.help": "Show help and information",
    "ui.aria.themeToggle": "Switch theme",
    "ui.aria.locate": "Center on my location",
    "ui.labels.languageSwitcher": "Change language",
    "ui.alt.tillaImage": "Tilla the turtle – your family companion",
    "ui.header.tagline": "Today, turn everyday life into a small family adventure – close to home.",
    "ui.buttons.showFilters": "Expand filters",
    "ui.buttons.hideFilters": "Collapse filters",
    "ui.buttons.onlyMap": "Map only",
    "ui.buttons.showList": "Show list",
    "ui.toast.locationOk": "Location set – your next moment is waiting.",
    "ui.toast.locationError": "We can’t access your location right now. You can still browse the map.",
    "ui.toast.locationUnavailableRadiusDisabled": "Location not available – radius filter has been disabled.",
    "ui.toast.favAdded": "Saved to favorites – a place worth keeping. 💚",
    "ui.toast.favRemoved": "Removed from favorites – new treasures await. 🌿",
    "ui.filters.categoryAll": "All categories",
    "ui.filters.radius.maxLabel": "All spots",
    "ui.filters.radius.description.step0": "Mini adventures – very close by, perfect for a short break.",
    "ui.filters.radius.description.step1": "Quick outing – out and back in no time.",
    "ui.filters.radius.description.step2": "Half-day outing – lots to discover.",
    "ui.filters.radius.description.step3": "A big day out – full of magical moments.",
    "ui.filters.radius.description.all": "All spots – no radius limit. The map is yours.",
    "ui.plus.codeEmpty": "Please enter your partner code.",
    "ui.plus.codeUnknown": "This code is unknown or no longer valid.",
    "ui.plus.activated": "Family Spots Plus is active – happy travels!",
    "ui.plus.failed": "The code couldn’t be checked right now. Please try again later.",
    "ui.tilla.intro1": "I’m Tilla. I’ll guide you to places for togetherness, memories, and small adventures. Shall we go? 🐢",
    "ui.tilla.intro2": "Right now, I can’t find a matching spot. Maybe a short walk – or widen the radius a little. 🐢",
    "ui.tilla.afterDaylogSave": "Your day is saved – small moments, big memories. 💚",
    "ui.tilla.afterFavAdded": "This place now has a heart on your map. 💚",
    "ui.tilla.afterFavRemoved": "No worries – we’ll find new memories. 🐢",
    "ui.tilla.tripMode": "You’re on the move – I’m watching for heartwarming moments. 🚐",
    "ui.tilla.everydayMode": "Everyday life can glow. Let’s find small wonders nearby. 🌿",
    "ui.tilla.plusActivated": "Plus is active – more paths, more places, more adventures. ✨",
    "ui.daylog.saved": "Saved 💾 – you’ll smile back later.",
    "ui.nav.map": "Map",
    "ui.nav.about": "About Family Spots Map",
    "ui.route.apple": "Open in Apple Maps",
    "ui.route.google": "Open in Google Maps",
    "domain.categories.spielplatz": "Playground",
    "domain.categories.abenteuerspielplatz": "Adventure playground",
    "domain.categories.indoor_spielplatz": "Indoor playground",
    "domain.categories.waldspielplatz": "Forest playground",
    "domain.categories.wasserspielplatz": "Water playground",
    "domain.categories.barrierefreier_spielplatz": "Accessible playground",
    "domain.categories.bewegungspark": "Activity park",
    "domain.categories.multifunktionsfeld": "Multi-use court",
    "domain.categories.bolzplatz": "Soccer field",
    "domain.categories.pumptrack": "Pump track",
    "domain.categories.skatepark": "Skatepark",
    "domain.categories.verkehrsgarten": "Road safety park",
    "domain.categories.toddler_barfuss_motorik": "Toddler / motor skills",
    "domain.categories.zoo": "Zoo",
    "domain.categories.tierpark": "Animal park",
    "domain.categories.wildpark": "Wildlife park & safari",
    "domain.categories.bauernhof": "Farm",
    "domain.categories.naturerlebnispfad": "Nature trail",
    "domain.categories.walderlebnisroute": "Forest discovery route",
    "domain.categories.freilichtmuseum": "Open-air museum",
    "domain.categories.schwimmbad": "Swimming pool",
    "domain.categories.badesee": "Bathing lake",
    "domain.categories.strand": "Family beach",
    "domain.categories.eisbahn": "Ice rink",
    "domain.categories.rodelhuegel": "Sledding hill",
    "domain.categories.freizeitpark": "Theme park",
    "domain.categories.trampolinpark": "Trampoline park",
    "domain.categories.kletterhalle": "Climbing gym",
    "domain.categories.kletteranlage_outdoor": "Outdoor climbing area",
    "domain.categories.kletterwald_hochseilgarten": "Ropes course / treetop adventure",
    "domain.categories.boulderpark": "Bouldering area",
    "domain.categories.minigolf": "Mini golf",
    "domain.categories.hoehle": "Cave / rock excursion",
    "domain.categories.felsenwanderung": "Rock hike",
    "domain.categories.aussichtspunkt": "Viewpoint",
    "domain.categories.baumhaus": "Treehouse / lookout",
    "domain.categories.labyrinth": "Labyrinth",
    "domain.categories.klangpfad": "Sound trail in nature",
    "domain.categories.ueberdachter_spielplatz": "Covered playground",
    "domain.categories.dirtbike_track": "Dirt bike track",
    "domain.categories.streetball_platz": "Streetball / basketball",
    "domain.categories.waldbaden_ort": "Forest bathing / quiet spot",
    "domain.categories.natur_aussichtspunkt": "Natural viewpoint",
    "domain.categories.wanderweg_kinderwagen": "Stroller-friendly route",
    "domain.categories.radweg_family": "Family-friendly bike route",
    "domain.categories.familiencafe": "Family café",
    "domain.categories.kinder_familiencafe": "Kids & family café",
    "domain.categories.familien_restaurant": "Family restaurant",
    "domain.categories.museum_kinder": "Kid-friendly museum",
    "domain.categories.kinder_museum": "Children’s museum",
    "domain.categories.bibliothek": "Children’s & family library",
    "domain.categories.oeffentliche_toilette": "Public restroom",
    "domain.categories.wickelraum": "Baby changing room",
    "domain.categories.familien_event": "Family event",
    "domain.categories.stellplatz_spielplatz_naehe_kostenlos": "Free camper pitch near playground",
    "domain.categories.wohnmobil_service_station": "Camper service station",
    "domain.categories.rastplatz_spielplatz_dusche": "Rest area with playground/shower",
    "domain.categories.bikepacking_spot": "Bikepacking spot",
    "domain.categories.campingplatz_familien": "Family-friendly campsite",
    "domain.categories.park_garten": "Park / garden",
    "domain.categories.picknickwiese": "Picnic area",
    "meta_title": "Family Spots Map – Family adventures near you",
    "meta_description": "Handpicked places for families: playgrounds, animals, water play, and short routes that turn into memories.",
    "error_data_load": "Oops – we couldn’t load the data just now. Please try again in a moment.",
    "btn_help_aria": "Show help and information",
    "btn_theme_toggle_aria": "Switch theme",
    "btn_locate_aria": "Center on my location",
    "alt_tilla_image": "Tilla the turtle – your family companion",
    "header_tagline": "Today, turn everyday life into a small family adventure – close to home.",
    "btn_show_filters": "Expand filters",
    "btn_hide_filters": "Collapse filters",
    "btn_only_map": "Map only",
    "btn_show_list": "Show list",
    "filter_category_all": "All categories",
    "filter_radius_max_label": "All spots",
    "filter_radius_description_all": "All spots – no radius limit. The map is yours.",
    "plus_code_empty": "Please enter your partner code.",
    "plus_code_unknown": "This code is unknown or no longer valid.",
    "plus_code_activated": "Family Spots Plus is active – happy travels!",
    "plus_code_failed": "The code couldn’t be checked right now. Please try again later.",
    "nav_map": "Map",
    "nav_about": "About Family Spots Map",
    "route_apple": "Open in Apple Maps",
    "route_google": "Open in Google Maps",
    "daylog_saved": "Saved 💾 – you’ll smile back later.",
    "turtle_intro_1": "I’m Tilla. I’ll guide you to places for togetherness, memories, and small adventures. Shall we go? 🐢",
    "turtle_intro_2": "Right now, I can’t find a matching spot. Maybe a short walk – or widen the radius a little. 🐢",
    "turtle_after_daylog_save": "Your day is saved – small moments, big memories. 💚",
    "turtle_after_fav_added": "This place now has a heart on your map. 💚",
    "turtle_after_fav_removed": "No worries – we’ll find new memories. 🐢",
    "turtle_trip_mode": "You’re on the move – I’m watching for heartwarming moments. 🚐",
    "turtle_everyday_mode": "Everyday life can glow. Let’s find small wonders nearby. 🌿",
    "turtle_plus_activated": "Plus is active – more paths, more places, more adventures. ✨",
    "toast_location_ok": "Location set – your next moment is waiting.",
    "toast_location_error": "We can’t access your location right now. You can still browse the map.",
    "toast_location_unavailable_radius_disabled": "Location not available – radius filter has been disabled.",
    "toast_fav_added": "Saved to favorites – a place worth keeping. 💚",
    "toast_fav_removed": "Removed from favorites – new treasures await. 🌿",
    "filter_radius_description_step0": "Mini adventures – very close by, perfect for a short break.",
    "filter_radius_description_step1": "Quick outing – out and back in no time.",
    "filter_radius_description_step2": "Half-day outing – lots to discover.",
    "filter_radius_description_step3": "A big day out – full of magical moments.",
    "btn_show": "Show",
    "btn_hide": "Hide",
    "plus_status_inactive": "Family Spots Plus is not active.",
    "plus_status_active": "Family Spots Plus is active.",
    "plus_status_active_until": "Family Spots Plus is active until {date}.",
    "plus_status_expired": "Family Spots Plus expired on {date}.",
    "menu_title": "Menu",
    "aria_settings": "App settings and shortcuts",
    "aria_map": "Map",
    "aria_map_spots": "Map of spots",
    "aria_hint": "Quick guide to the map",
    "aria_hint_close": "Close guide",
    "aria_about": "About Family Spots Map",
    "aria_navigation": "Navigation",
    "landscape_hint": "Please rotate your device 📱🔄 – Tilla feels more at home in portrait mode.",
    "map_zoom_in": "Zoom in",
    "map_zoom_out": "Zoom out",
    "map_contributors": "contributors",
    "spot_fallback": "Place to visit",
    "spots_title": "Spots",
    "plus_suffix": " (Plus)",
    "addon_suffix": " (Add-on)",
    "locked_suffix": " 🔒",
    "toast_marker_limit": "Lots of spots found – zoom in to see them more clearly.",
    "category_spielplatz": "Playground",
    "category_abenteuerspielplatz": "Adventure playground",
    "category_indoor_spielplatz": "Indoor playground",
    "category_waldspielplatz": "Forest playground",
    "category_wasserspielplatz": "Water playground",
    "category_barrierefreier_spielplatz": "Accessible playground",
    "category_bewegungspark": "Activity park",
    "category_multifunktionsfeld": "Multi-use court",
    "category_bolzplatz": "Soccer field",
    "category_pumptrack": "Pump track",
    "category_skatepark": "Skatepark",
    "category_verkehrsgarten": "Road safety park",
    "category_toddler_barfuss_motorik": "Toddler / motor skills",
    "category_zoo": "Zoo",
    "category_tierpark": "Animal park",
    "category_wildpark": "Wildlife park & safari",
    "category_bauernhof": "Farm",
    "category_naturerlebnispfad": "Nature trail",
    "category_walderlebnisroute": "Forest discovery route",
    "category_freilichtmuseum": "Open-air museum",
    "category_schwimmbad": "Swimming pool",
    "category_badesee": "Bathing lake",
    "category_strand": "Family beach",
    "category_eisbahn": "Ice rink",
    "category_rodelhuegel": "Sledding hill",
    "category_freizeitpark": "Theme park",
    "category_trampolinpark": "Trampoline park",
    "category_kletterhalle": "Climbing gym",
    "category_kletteranlage_outdoor": "Outdoor climbing area",
    "category_kletterwald_hochseilgarten": "Ropes course / treetop adventure",
    "category_boulderpark": "Bouldering area",
    "category_minigolf": "Mini golf",
    "category_hoehle": "Cave / rock excursion",
    "category_felsenwanderung": "Rock hike",
    "category_aussichtspunkt": "Viewpoint",
    "category_baumhaus": "Treehouse / lookout",
    "category_labyrinth": "Labyrinth",
    "category_klangpfad": "Sound trail in nature",
    "category_ueberdachter_spielplatz": "Covered playground",
    "category_dirtbike_track": "Dirt bike track",
    "category_streetball_platz": "Streetball / basketball",
    "category_waldbaden_ort": "Forest bathing / quiet spot",
    "category_natur_aussichtspunkt": "Natural viewpoint",
    "category_wanderweg_kinderwagen": "Stroller-friendly route",
    "category_radweg_family": "Family-friendly bike route",
    "category_familiencafe": "Family café",
    "category_kinder_familiencafe": "Kids & family café",
    "category_familien_restaurant": "Family restaurant",
    "category_museum_kinder": "Kid-friendly museum",
    "category_kinder_museum": "Children’s museum",
    "category_bibliothek": "Children’s & family library",
    "category_oeffentliche_toilette": "Public restroom",
    "category_wickelraum": "Baby changing room",
    "category_familien_event": "Family event",
    "category_stellplatz_spielplatz_naehe_kostenlos": "Free camper pitch near playground",
    "category_wohnmobil_service_station": "Camper service station",
    "category_rastplatz_spielplatz_dusche": "Rest area with playground/shower",
    "category_bikepacking_spot": "Bikepacking spot",
    "category_campingplatz_familien": "Family-friendly campsite",
    "category_park_garten": "Park / garden",
    "category_picknickwiese": "Picnic area"
  },
  "da": {
    "__meta.locale": "da-DK",
    "__meta.source": "family-spots",
    "__meta.updatedAt": "2026-10-08",
    "ui.meta.title": "Family Spots Map – Det smukkeste kort til familieeventyr",
    "ui.meta.description": "Håndplukkede steder for familier: legepladser, dyr, vand og små ture, der bliver til minder.",
    "ui.errors.dataLoad": "Ups – vi kunne ikke indlæse dataene lige nu. Prøv igen om lidt.",
    "ui.aria.help": "Vis hjælp og info",
    "ui.aria.themeToggle": "Skift tema",
    "ui.aria.locate": "Centrér på jeres position",
    "ui.labels.languageSwitcher": "Skift sprog",
    "ui.alt.tillaImage": "Tilla skildpadden – jeres familieledsager",
    "ui.header.tagline": "I dag kan hverdagen blive til et lille familieeventyr – tæt på hjemmet.",
    "ui.buttons.showFilters": "Fold filtre ud",
    "ui.buttons.hideFilters": "Fold filtre sammen",
    "ui.buttons.onlyMap": "Kun kort",
    "ui.buttons.showList": "Vis liste",
    "ui.toast.locationOk": "Positionen er sat – næste øjeblik venter.",
    "ui.toast.locationError": "Vi kan ikke få adgang til jeres position lige nu. I kan stadig bruge kortet.",
    "ui.toast.locationUnavailableRadiusDisabled": "Position ikke tilgængelig – radiusfilter er deaktiveret.",
    "ui.toast.favAdded": "Gemt som favorit – et sted, der er værd at gemme. 💚",
    "ui.toast.favRemoved": "Fjernet fra favoritter – nye skatte venter. 🌿",
    "ui.filters.categoryAll": "Alle kategorier",
    "ui.filters.radius.maxLabel": "Alle spots",
    "ui.filters.radius.description.step0": "Mini-eventyr – helt tæt på, perfekt til en lille pause.",
    "ui.filters.radius.description.step1": "Kort tur ud – hurtigt afsted, hurtigt hjemme igen.",
    "ui.filters.radius.description.step2": "En lille udflugt – en halv dag fuld af oplevelser.",
    "ui.filters.radius.description.step3": "Store mål – en hel dag med magiske øjeblikke.",
    "ui.filters.radius.description.all": "Alle spots – ingen radius. Kortet er helt jeres.",
    "ui.plus.codeEmpty": "Indtast først jeres partnerkode.",
    "ui.plus.codeUnknown": "Koden er ukendt eller ikke længere gyldig.",
    "ui.plus.activated": "Family Spots Plus er aktiveret – god tur!",
    "ui.plus.failed": "Koden kunne ikke tjekkes nu. Prøv igen senere.",
    "ui.tilla.intro1": "Jeg er Tilla. Jeg viser jer steder med nærhed, minder og små eventyr. Skal vi afsted? 🐢",
    "ui.tilla.intro2": "Lige nu kan jeg ikke finde et passende sted. Måske en gåtur – eller øg radius lidt. 🐢",
    "ui.tilla.afterDaylogSave": "Jeres dag er gemt – små øjeblikke, store minder. 💚",
    "ui.tilla.afterFavAdded": "Stedet har nu et hjerte på jeres kort. 💚",
    "ui.tilla.afterFavRemoved": "Helt i orden – vi finder nye minder. 🐢",
    "ui.tilla.tripMode": "I er på vej – jeg kigger efter hjerteøjeblikke. 🚐",
    "ui.tilla.everydayMode": "Hverdagen må gerne lyse. Lad os finde små mirakler tæt på. 🌿",
    "ui.tilla.plusActivated": "Plus er aktiv – flere veje, flere steder, flere eventyr. ✨",
    "ui.daylog.saved": "Gemt 💾 – senere kan I smile tilbage til det.",
    "ui.nav.map": "Kort",
    "ui.nav.about": "Om Family Spots Map",
    "ui.route.apple": "Åbn i Apple Maps",
    "ui.route.google": "Åbn i Google Maps",
    "domain.categories.spielplatz": "Legeplads",
    "domain.categories.abenteuerspielplatz": "Eventyrlegeplads",
    "domain.categories.indoor_spielplatz": "Indendørs legeplads",
    "domain.categories.waldspielplatz": "Skovlegeplads",
    "domain.categories.wasserspielplatz": "Vandlegeplads",
    "domain.categories.barrierefreier_spielplatz": "Tilgængelig legeplads",
    "domain.categories.bewegungspark": "Aktivitetspark",
    "domain.categories.multifunktionsfeld": "Multibane",
    "domain.categories.bolzplatz": "Boldbane",
    "domain.categories.pumptrack": "Pumptrack",
    "domain.categories.skatepark": "Skatepark",
    "domain.categories.verkehrsgarten": "Trafiklegeplads",
    "domain.categories.toddler_barfuss_motorik": "Tumlinger / motorik",
    "domain.categories.zoo": "Zoo",
    "domain.categories.tierpark": "Dyrepark",
    "domain.categories.wildpark": "Vildtpark & safaripark",
    "domain.categories.bauernhof": "Gård",
    "domain.categories.naturerlebnispfad": "Natursti",
    "domain.categories.walderlebnisroute": "Skovoplevelsesrute",
    "domain.categories.freilichtmuseum": "Frilandsmuseum",
    "domain.categories.schwimmbad": "Svømmehal",
    "domain.categories.badesee": "Badesø",
    "domain.categories.strand": "Familiestrand",
    "domain.categories.eisbahn": "Skøjtebane",
    "domain.categories.rodelhuegel": "Kælkebakke",
    "domain.categories.freizeitpark": "Forlystelsespark",
    "domain.categories.trampolinpark": "Trampolinpark",
    "domain.categories.kletterhalle": "Klatrehal",
    "domain.categories.kletteranlage_outdoor": "Udendørs klatreanlæg",
    "domain.categories.kletterwald_hochseilgarten": "Klatreskov / højdebane",
    "domain.categories.boulderpark": "Boulderpark",
    "domain.categories.minigolf": "Minigolf",
    "domain.categories.hoehle": "Hule / klippetur",
    "domain.categories.felsenwanderung": "Klippevandring",
    "domain.categories.aussichtspunkt": "Udsigtspunkt",
    "domain.categories.baumhaus": "Træhus / udsigt",
    "domain.categories.labyrinth": "Labyrint",
    "domain.categories.klangpfad": "Lydsti i naturen",
    "domain.categories.ueberdachter_spielplatz": "Overdækket legeplads",
    "domain.categories.dirtbike_track": "Dirtbike-bane",
    "domain.categories.streetball_platz": "Streetball / basketball",
    "domain.categories.waldbaden_ort": "Skovbadning / ro",
    "domain.categories.natur_aussichtspunkt": "Naturligt udsigtspunkt",
    "domain.categories.wanderweg_kinderwagen": "Rute (barnevognsvenlig)",
    "domain.categories.radweg_family": "Familie-cykelrute",
    "domain.categories.familiencafe": "Familiecafé",
    "domain.categories.kinder_familiencafe": "Børne- & familiecafé",
    "domain.categories.familien_restaurant": "Familierestaurant",
    "domain.categories.museum_kinder": "Museum (børn)",
    "domain.categories.kinder_museum": "Børnemuseum",
    "domain.categories.bibliothek": "Børne- & familiebibliotek",
    "domain.categories.oeffentliche_toilette": "Offentligt toilet",
    "domain.categories.wickelraum": "Puslerum",
    "domain.categories.familien_event": "Familieevent",
    "domain.categories.stellplatz_spielplatz_naehe_kostenlos": "Gratis autocamperplads nær legeplads",
    "domain.categories.wohnmobil_service_station": "Autocamper-serviceplads",
    "domain.categories.rastplatz_spielplatz_dusche": "Rasteplads med legeplads og bruser",
    "domain.categories.bikepacking_spot": "Bikepacking-spot",
    "domain.categories.campingplatz_familien": "Familievenlig campingplads",
    "domain.categories.park_garten": "Park / have",
    "domain.categories.picknickwiese": "Picnicområde",
    "meta_title": "Family Spots Map – Det smukkeste kort til familieeventyr",
    "meta_description": "Håndplukkede steder for familier: legepladser, dyr, vand og små ture, der bliver til minder.",
    "error_data_load": "Ups – vi kunne ikke indlæse dataene lige nu. Prøv igen om lidt.",
    "btn_help_aria": "Vis hjælp og info",
    "btn_theme_toggle_aria": "Skift tema",
    "btn_locate_aria": "Centrér på jeres position",
    "alt_tilla_image": "Tilla skildpadden – jeres familieledsager",
    "header_tagline": "I dag kan hverdagen blive til et lille familieeventyr – tæt på hjemmet.",
    "btn_show_filters": "Fold filtre ud",
    "btn_hide_filters": "Fold filtre sammen",
    "btn_only_map": "Kun kort",
    "btn_show_list": "Vis liste",
    "filter_category_all": "Alle kategorier",
    "filter_radius_max_label": "Alle spots",
    "filter_radius_description_all": "Alle spots – ingen radius. Kortet er helt jeres.",
    "plus_code_empty": "Indtast først jeres partnerkode.",
    "plus_code_unknown": "Koden er ukendt eller ikke længere gyldig.",
    "plus_code_activated": "Family Spots Plus er aktiveret – god tur!",
    "plus_code_failed": "Koden kunne ikke tjekkes nu. Prøv igen senere.",
    "nav_map": "Kort",
    "nav_about": "Om Family Spots Map",
    "route_apple": "Åbn i Apple Maps",
    "route_google": "Åbn i Google Maps",
    "daylog_saved": "Gemt 💾 – senere kan I smile tilbage til det.",
    "turtle_intro_1": "Jeg er Tilla. Jeg viser jer steder med nærhed, minder og små eventyr. Skal vi afsted? 🐢",
    "turtle_intro_2": "Lige nu kan jeg ikke finde et passende sted. Måske en gåtur – eller øg radius lidt. 🐢",
    "turtle_after_daylog_save": "Jeres dag er gemt – små øjeblikke, store minder. 💚",
    "turtle_after_fav_added": "Stedet har nu et hjerte på jeres kort. 💚",
    "turtle_after_fav_removed": "Helt i orden – vi finder nye minder. 🐢",
    "turtle_trip_mode": "I er på vej – jeg kigger efter hjerteøjeblikke. 🚐",
    "turtle_everyday_mode": "Hverdagen må gerne lyse. Lad os finde små mirakler tæt på. 🌿",
    "turtle_plus_activated": "Plus er aktiv – flere veje, flere steder, flere eventyr. ✨",
    "toast_location_ok": "Positionen er sat – næste øjeblik venter.",
    "toast_location_error": "Vi kan ikke få adgang til jeres position lige nu. I kan stadig bruge kortet.",
    "toast_location_unavailable_radius_disabled": "Position ikke tilgængelig – radiusfilter er deaktiveret.",
    "toast_fav_added": "Gemt som favorit – et sted, der er værd at gemme. 💚",
    "toast_fav_removed": "Fjernet fra favoritter – nye skatte venter. 🌿",
    "filter_radius_description_step0": "Mini-eventyr – helt tæt på, perfekt til en lille pause.",
    "filter_radius_description_step1": "Kort tur ud – hurtigt afsted, hurtigt hjemme igen.",
    "filter_radius_description_step2": "En lille udflugt – en halv dag fuld af oplevelser.",
    "filter_radius_description_step3": "Store mål – en hel dag med magiske øjeblikke.",
    "btn_show": "Vis",
    "btn_hide": "Skjul",
    "plus_status_inactive": "Family Spots Plus er ikke aktiveret.",
    "plus_status_active": "Family Spots Plus er aktiveret.",
    "plus_status_active_until": "Family Spots Plus er aktiv indtil {date}.",
    "plus_status_expired": "Family Spots Plus udløb den {date}.",
    "menu_title": "Menu",
    "aria_settings": "Appindstillinger og genveje",
    "aria_map": "Kort",
    "aria_map_spots": "Kort med spots",
    "aria_hint": "Kort vejledning til kortet",
    "aria_hint_close": "Luk vejledning",
    "aria_about": "Om Family Spots Map",
    "aria_navigation": "Navigation",
    "landscape_hint": "Drej venligst enheden 📱🔄 – Tilla føler sig bedst tilpas i stående format.",
    "map_zoom_in": "Zoom ind",
    "map_zoom_out": "Zoom ud",
    "map_contributors": "bidragydere",
    "spot_fallback": "Udflugtssted",
    "spots_title": "Spots",
    "plus_suffix": " (Plus)",
    "addon_suffix": " (Tilvalg)",
    "locked_suffix": " 🔒",
    "toast_marker_limit": "Mange steder fundet – zoom ind for at få et bedre overblik.",
    "category_spielplatz": "Legeplads",
    "category_abenteuerspielplatz": "Eventyrlegeplads",
    "category_indoor_spielplatz": "Indendørs legeplads",
    "category_waldspielplatz": "Skovlegeplads",
    "category_wasserspielplatz": "Vandlegeplads",
    "category_barrierefreier_spielplatz": "Tilgængelig legeplads",
    "category_bewegungspark": "Aktivitetspark",
    "category_multifunktionsfeld": "Multibane",
    "category_bolzplatz": "Boldbane",
    "category_pumptrack": "Pumptrack",
    "category_skatepark": "Skatepark",
    "category_verkehrsgarten": "Trafiklegeplads",
    "category_toddler_barfuss_motorik": "Tumlinger / motorik",
    "category_zoo": "Zoo",
    "category_tierpark": "Dyrepark",
    "category_wildpark": "Vildtpark & safaripark",
    "category_bauernhof": "Gård",
    "category_naturerlebnispfad": "Natursti",
    "category_walderlebnisroute": "Skovoplevelsesrute",
    "category_freilichtmuseum": "Frilandsmuseum",
    "category_schwimmbad": "Svømmehal",
    "category_badesee": "Badesø",
    "category_strand": "Familiestrand",
    "category_eisbahn": "Skøjtebane",
    "category_rodelhuegel": "Kælkebakke",
    "category_freizeitpark": "Forlystelsespark",
    "category_trampolinpark": "Trampolinpark",
    "category_kletterhalle": "Klatrehal",
    "category_kletteranlage_outdoor": "Udendørs klatreanlæg",
    "category_kletterwald_hochseilgarten": "Klatreskov / højdebane",
    "category_boulderpark": "Boulderpark",
    "category_minigolf": "Minigolf",
    "category_hoehle": "Hule / klippetur",
    "category_felsenwanderung": "Klippevandring",
    "category_aussichtspunkt": "Udsigtspunkt",
    "category_baumhaus": "Træhus / udsigt",
    "category_labyrinth": "Labyrint",
    "category_klangpfad": "Lydsti i naturen",
    "category_ueberdachter_spielplatz": "Overdækket legeplads",
    "category_dirtbike_track": "Dirtbike-bane",
    "category_streetball_platz": "Streetball / basketball",
    "category_waldbaden_ort": "Skovbadning / ro",
    "category_natur_aussichtspunkt": "Naturligt udsigtspunkt",
    "category_wanderweg_kinderwagen": "Rute (barnevognsvenlig)",
    "category_radweg_family": "Familie-cykelrute",
    "category_familiencafe": "Familiecafé",
    "category_kinder_familiencafe": "Børne- & familiecafé",
    "category_familien_restaurant": "Familierestaurant",
    "category_museum_kinder": "Museum (børn)",
    "category_kinder_museum": "Børnemuseum",
    "category_bibliothek": "Børne- & familiebibliotek",
    "category_oeffentliche_toilette": "Offentligt toilet",
    "category_wickelraum": "Puslerum",
    "category_familien_event": "Familieevent",
    "category_stellplatz_spielplatz_naehe_kostenlos": "Gratis autocamperplads nær legeplads",
    "category_wohnmobil_service_station": "Autocamper-serviceplads",
    "category_rastplatz_spielplatz_dusche": "Rasteplads med legeplads og bruser",
    "category_bikepacking_spot": "Bikepacking-spot",
    "category_campingplatz_familien": "Familievenlig campingplads",
    "category_park_garten": "Park / have",
    "category_picknickwiese": "Picnicområde"
  }
};
const loadedLanguages = new Set();
const messagesByLang = Object.fromEntries(
  SUPPORTED_LANGS.map(lang => [lang, { ...FALLBACK_MESSAGES[lang] }])
);

/**
 * Spielideen-Struktur (aus data/play-ideas.json):
 * [
 *   { id: string, texts: { de?: string, en?: string, da?: string }, ... },
 *   ...
 * ]
 * Wir unterstützen sowohl dieses Schema mit `texts` als auch
 * ein älteres flaches Schema ({ de, en, da }).
 * @type {Array<any>}
 */
let playIdeas = [];

/** Index der zuletzt ausgegebenen Spielidee (zur Entdopplung). */
let lastPlayIdeaIndex = -1;

/* --------------------------------------
 * Helpers
 * ----------------------------------- */

/**
 * JSON-Parsing mit Fallback.
 * @template T
 * @param {string|null} raw
 * @param {T} fallback
 * @returns {T}
 */
function safeParseJson(raw, fallback) {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed === "object") {
      return /** @type {T} */ (parsed);
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/**
 * Normalisiert eine Sprache auf "de", "en" oder "da".
 * Alles außer "en" und "da" wird bewusst auf "de" gefaltet.
 * @param {string | null | undefined} lang
 * @returns {LangCode}
 */
function normalizeLang(lang) {
  if (!lang) return "de";

  const v = String(lang).toLowerCase();

  if (v.startsWith("en")) return "en";
  if (v === "da" || v.startsWith("da") || v === "dk" || v.startsWith("dk")) {
    return "da";
  }

  return "de";
}

/**
 * Sprache aus localStorage holen (falls gültig).
 * @returns {LangCode | null}
 */
function getStoredLang() {
  try {
    if (typeof localStorage === "undefined") return null;
    const stored = localStorage.getItem(STORAGE_LANG_KEY);
    if (stored && SUPPORTED_LANGS.includes(stored)) {
      return /** @type {LangCode} */ (stored);
    }
  } catch {
    // Storage ist optional – Fallback greift unten
  }
  return null;
}

/**
 * Sprache aus dem Browser ableiten.
 * Nutzt `navigator.languages` falls vorhanden, sonst `navigator.language`.
 * @returns {LangCode | null}
 */
function detectBrowserLang() {
  if (typeof navigator === "undefined") return null;

  const candidates = [];

  if (Array.isArray(navigator.languages)) {
    candidates.push(...navigator.languages);
  }
  if (navigator.language) {
    candidates.push(navigator.language);
  }

  for (const value of candidates) {
    if (!value) continue;
    const candidate = String(value).toLowerCase().split(/[-_]/)[0];
    if (!["de", "en", "da", "dk"].includes(candidate)) continue;
    const code = normalizeLang(candidate);
    if (SUPPORTED_LANGS.includes(code)) {
      return code;
    }
  }

  return null;
}

/**
 * Interner Setter inkl. Persistenz & lang-Attribut auf <html>.
 * @param {LangCode} lang
 */
function setLangInternal(lang) {
  currentLang = normalizeLang(lang || DEFAULT_LANG);

  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_LANG_KEY, currentLang);
    }
  } catch {
    // Wenn Storage nicht verfügbar ist, ist das kein Beinbruch.
  }

  if (typeof document !== "undefined" && document.documentElement) {
    document.documentElement.setAttribute("lang", currentLang);
  }
}

/* --------------------------------------
 * Laden von Übersetzungen & Spielideen
 * ----------------------------------- */

/**
 * Lädt die JSON-Übersetzungen für eine Sprache (lazy).
 * Erwartet Datei: data/i18n/<lang>.json
 * @param {LangCode} lang
 */
async function loadMessagesForLang(lang) {
  const target = normalizeLang(lang);

  // Bereits geladen?
  if (loadedLanguages.has(target)) return;

  try {
    const json = await fetchJsonWithTimeout(`data/i18n/${target}.json?v=20261010-repair-3`, 8000);
    if (json && typeof json === "object" && !Array.isArray(json)) {
      const flat = {};
      const flatten = (value, prefix = "") => {
        for (const [key, item] of Object.entries(value)) {
          const path = prefix ? `${prefix}.${key}` : key;
          if (typeof item === "string") flat[path] = item;
          else if (item && typeof item === "object" && !Array.isArray(item)) flatten(item, path);
        }
      };
      flatten(json);
      messagesByLang[target] = { ...FALLBACK_MESSAGES[target], ...flat };
      loadedLanguages.add(target);
    } else {
      console.warn(
        "[i18n] Unerwartetes Format für Sprachdatei:",
        target,
        json
      );
      messagesByLang[target] = { ...FALLBACK_MESSAGES[target] };
    }
  } catch (err) {
    console.error("[i18n] Fehler beim Laden der Sprache", target, err);
    // Keep complete bundled translations. Failed requests may be retried by init().
    messagesByLang[target] = { ...FALLBACK_MESSAGES[target] };
  }
}

/**
 * Lädt Spielideen aus data/play-ideas.json.
 * Struktur (aktuell):
 * [{ id, texts: { de, en, da }, ... }, …]
 */
async function loadPlayIdeas() {
  if (playIdeas.length) return;

  try {
    const json = await fetchJsonWithTimeout("data/play-ideas.json", 8000);
    if (Array.isArray(json)) {
      playIdeas = json;
    } else {
      console.warn("[i18n] play-ideas.json ist kein Array.");
      playIdeas = [];
    }
  } catch (err) {
    console.error("[i18n] Fehler beim Laden der Spielideen:", err);
    playIdeas = [];
  }
}

/* --------------------------------------
 * Public API
 * ----------------------------------- */

/**
 * Initialisiert i18n:
 *  - lädt de/en/da Übersetzungen
 *  - lädt Spielideen
 *  - bestimmt Startsprache (lang-Param -> localStorage -> Browser -> de)
 *  - setzt <html lang="…">
 *  - aktualisiert DOM (data-i18n / data-i18n-placeholder)
 *
 * @param {LangCode} [lang] – optionaler Override
 * @returns {Promise<void>}
 */
async function init(lang) {
  const stored = getStoredLang();
  const browser = detectBrowserLang();
  const pathLang = typeof location !== "undefined" ? location.pathname.match(/\/(en|da)\/(?:index\.html)?$/)?.[1] : null;
  const target = normalizeLang(lang || pathLang || stored || browser || DEFAULT_LANG);

  // Übersetzungen + Spielideen parallel laden
  await Promise.all([
    loadMessagesForLang("de"),
    loadMessagesForLang("en"),
    loadMessagesForLang("da"),
    loadPlayIdeas()
  ]);

  setLangInternal(target);
  applyTranslations(typeof document !== "undefined" ? document : undefined);
}

/**
 * Sprache wechseln (de/en/da) und DOM aktualisieren.
 * @param {LangCode} lang
 */
function setLanguage(lang) {
  const normalized = normalizeLang(lang);


  setLangInternal(normalized);
  applyTranslations(typeof document !== "undefined" ? document : undefined);
}

/**
 * Aktuelle Sprache holen.
 * @returns {LangCode}
 */
function getLanguage() {
  return currentLang;
}

/**
 * Übersetzungsfunktion.
 * Nutzt die aktuell gesetzte Sprache.
 *
 * @param {string} key
 * @param {string} [fallback]
 * @returns {string}
 */
function t(key, fallback) {
  const table = messagesByLang[currentLang] || {};
  // nullish coalescing: erlaubt explizit leere Strings
  const value = table[key] ?? fallback ?? key;
  return typeof value === "string" ? value : (fallback ?? key);
}

/**
 * Texte im DOM updaten:
 *  - data-i18n → textContent
 *  - data-i18n-placeholder → placeholder
 *
 * @param {ParentNode} [root=document]
 */
function applyTranslations(root = typeof document !== "undefined" ? document : null) {
  if (!root || typeof root.querySelectorAll !== "function") return;

  // Inhalt (Text)
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    const value = t(key);
    if (value != null && value !== key) el.textContent = value;
  });

  for (const attribute of ["aria-label", "title", "alt", "placeholder"]) {
    root.querySelectorAll(`[data-i18n-${attribute}]`).forEach((el) => {
      const key = el.getAttribute(`data-i18n-${attribute}`);
      const value = t(key, el.getAttribute(attribute) || "");
      el.setAttribute(attribute, value);
    });
  }

  // Placeholder
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (!key) return;
    const value = t(key);
    if (value != null) el.setAttribute("placeholder", value);
  });
}

/**
 * Liefert eine zufällige Spielidee in der aktuellen Sprache.
 * Unterstützt sowohl:
 *   { texts: { de, en, da } }
 * als auch das ältere Schema:
 *   { de, en, da }
 * Versucht, nicht zweimal dieselbe Idee direkt hintereinander zu liefern.
 *
 * @returns {string}
 */
function getRandomPlayIdea() {
  if (!playIdeas.length) return "";

  let idx;
  if (playIdeas.length === 1) {
    idx = 0;
  } else {
    let tries = 0;
    do {
      idx = Math.floor(Math.random() * playIdeas.length);
      tries++;
    } while (idx === lastPlayIdeaIndex && tries < 5);
  }

  lastPlayIdeaIndex = idx;
  const idea = playIdeas[idx];
  if (!idea || typeof idea !== "object") return "";

  // Neues Schema: idea.texts.{de,en,da}, sonst flach {de,en,da}
  const texts =
    (idea.texts && typeof idea.texts === "object" ? idea.texts : null) || idea;

  /** @type {Array<LangCode>} */
  const langOrder = [currentLang, "de", "en", "da"];

  for (const code of langOrder) {
    if (texts[code]) {
      return texts[code];
    }
  }

  return "";
}

/* --------------------------------------
 * Globales Objekt + ES-Module Export
 * ----------------------------------- */

/**
 * @typedef {Object} I18nApi
 * @property {(lang?: LangCode) => Promise<void>} init
 * @property {(lang: LangCode) => void} setLanguage
 * @property {() => LangCode} getLanguage
 * @property {(key: string, fallback?: string) => string} t
 * @property {(root?: ParentNode) => void} applyTranslations
 * @property {() => string} getRandomPlayIdea
 */

/** @type {I18nApi} */
const I18N = {
  init,
  setLanguage,
  getLanguage,
  t,
  applyTranslations,
  getRandomPlayIdea
};

// Für app.js (nutzt window.I18N)
if (typeof window !== "undefined") {
  window.I18N = I18N;
}

// ES-Module-Exports (falls du direkt importieren willst)
export {
  init as initI18n,
  setLanguage,
  getLanguage,
  t,
  applyTranslations,
  getRandomPlayIdea,
  I18N
};

export function getCurrentPlayIdea() {
  const idea = playIdeas[lastPlayIdeaIndex];
  const texts = idea?.texts || idea;
  return texts?.[currentLang] || "";
}

export default I18N;