// js/tilla.js
// ------------------------------------------------------
// Tilla – eure Schildkröten-Begleiterin auf der ABF 🐢
//
// Integration (in app.js):
//
//   import { TillaCompanion } from "./tilla.js";
//
//   const tilla = new TillaCompanion({
//     getText: (key) => t(key) // optional: i18n-Funktion, z. B. aus I18N.t
//   });
//
// Öffentliche API (von app.js genutzt):
//  - onLanguageChanged()
//  - setTravelMode(mode)
//  - onPlusActivated()        // ABF Partner-Spots (ehemals Plus)
//  - onDaylogSaved()
//  - onFavoriteAdded()
//  - onFavoriteRemoved()
//  - onNoSpotsFound()
//  - onSpotsFound()
//  - onCompassApplied(context)
//  - showPlayIdea(text)
//
// ------------------------------------------------------

"use strict";

/**
 * Fallback-Texte, falls getText() (z. B. I18N.t) nichts liefert
 * oder (noch) nicht verkabelt ist.
 *
 * Struktur:
 * FALLBACK_TEXTS[lang][key] = string | string[]
 *
 * ABF-Edition:
 *  - Fokus liegt auf dem Messegelände Hannover & der ABF 2026
 *  - "everyday" ≈ eher in der Nähe / in der eigenen Halle bleiben
 *  - "trip"     ≈ große Runde über das gesamte Messegelände
 */
const FALLBACK_TEXTS = Object.freeze({
  de: {
    turtle_intro_1: [
      "Hallo, ich bin Tilla – eure kleine Schildkröten-Begleiterin auf der ABF.",
      "Ich bin Tilla. Zusammen machen wir aus dem Messegelände eure Familienkarte."
    ],
    turtle_intro_2: [
      "Mit diesen Filtern finde ich gerade keinen passenden Spot auf der ABF. Vielleicht hilft ein anderer Radius oder eine andere Stimmung. 🐢",
      "Im Moment bleibt die Karte leer. Probiert eine andere Kategorie oder dreht den Radius ein Stück weiter – irgendwo auf der Messe wartet ein guter Ort auf euch. 🐢"
    ],
    turtle_after_daylog_save: [
      "Schön, dass ihr euren ABF-Tag festhaltet. Solche kleinen Notizen werden später zu großen Erinnerungen. 💛",
      "Ein paar Zeilen zu eurem Messebesuch – viele Erinnerungen morgen. Danke, dass ihr euren ABF-Tag teilt. 💛"
    ],
    turtle_after_fav_added: [
      "Diesen Ort merkt ihr euch – eine kleine Perle auf eurer ABF-Familienkarte. ⭐",
      "Gut gewählt! Dieser Spot ist jetzt Teil eurer persönlichen ABF-Schatzkarte. ⭐"
    ],
    turtle_after_fav_removed: [
      "Alles gut – manche Orte passen nur zu bestimmten Momenten auf der Messe. Ich helfe euch, neue zu finden. 🐢",
      "Manche Spots dürfen gehen, damit Platz für neue ABF-Highlights ist. Wir finden gemeinsam frische Lieblingsorte. 🐢"
    ],
    turtle_trip_mode: [
      "Ihr seid auf Entdeckungstour über die ABF – ich halte Ausschau nach guten Pausen-Spots auf dem ganzen Messegelände. 🗺️",
      "Große Runde über die Messe? Dann suchen wir jetzt nach Orten zum Toben, Auftanken und Durchatmen auf dem Gelände. 🗺️"
    ],
    turtle_everyday_mode: [
      "Heute bleibt ihr eher in eurer Halle oder ganz in der Nähe – ich schaue nach kleinen Pausen-Spots rund um euch. 🌿",
      "Vielleicht reicht heute eine kurze Auszeit in eurer Nähe. Ich zeige euch, welche ABF-Spots sich dafür anbieten. 🌿"
    ],
    turtle_plus_activated: [
      "ABF Partner-Spots sind aktiviert – ich blende euch jetzt zusätzliche familienfreundliche Angebote dieses Partners auf dem Messegelände ein. ✨",
      "Partner-Modus an! Ab jetzt achte ich extra auf die ABF-Spots dieses Partners, die euch mit Kindern helfen können. ✨"
    ],
    turtle_compass_everyday: [
      "Ich habe den Radius auf „nah dran“ gestellt – wir bleiben in eurer Hallen-Nachbarschaft. 🌿",
      "Kompass sagt: Heute reicht ein kleines Abenteuer in eurer Ecke der Messe – schaut mal, was ich gefunden habe."
    ],
    turtle_compass_trip: [
      "Kompass gesetzt – ich suche jetzt in einem größeren Radius über das Messegelände nach passenden Spots für euch. 🗺️",
      "Für eure ABF-Erkundung habe ich den Radius weit geöffnet. Wir suchen nach guten Orten für Pausen und Spiel auf dem gesamten Gelände. 🗺️"
    ]
  },
  en: {
    turtle_intro_1: [
      "Hi, I’m Tilla – your little turtle companion at ABF.",
      "I’m Tilla. Together we’ll turn the fairground into your family map."
    ],
    turtle_intro_2: [
      "With these filters I can’t find a matching spot on the ABF map right now. Maybe try a different radius or mood. 🐢",
      "Right now the map stays empty. Try another category or widen the radius a bit – somewhere on the fairground a good place is waiting for you. 🐢"
    ],
    turtle_after_daylog_save: [
      "Nice that you captured your ABF day. These small notes turn into big memories later. 💛",
      "A few lines about your day at the fair – many memories tomorrow. Thanks for sharing your ABF day. 💛"
    ],
    turtle_after_fav_added: [
      "You’ve saved this place – a small gem on your ABF family map. ⭐",
      "Great choice! This spot is now part of your personal ABF treasure map. ⭐"
    ],
    turtle_after_fav_removed: [
      "All good – some places only fit certain moments at the fair. I’ll help you find new ones. 🐢",
      "Some spots leave so new ABF highlights can arrive. We’ll find fresh favourites together. 🐢"
    ],
    turtle_trip_mode: [
      "You’re exploring the whole ABF – I’ll watch out for good pause spots all across the fairground. 🗺️",
      "Big tour across the fair today? Let’s look for places to play, recharge and catch your breath around the site. 🗺️"
    ],
    turtle_everyday_mode: [
      "Today you’re staying mostly around your hall – I’ll look for small break spots close by. 🌿",
      "Maybe a short break near your current hall is just right today. I’ll show you which ABF spots work well for that. 🌿"
    ],
    turtle_plus_activated: [
      "ABF partner spots are active – I can now highlight additional family offers from this partner on the fairground. ✨",
      "Partner mode on! From now on I’ll pay extra attention to this partner’s ABF spots that can help you with kids. ✨"
    ],
    turtle_compass_everyday: [
      "I’ve set the compass to ‘nearby’ – we’ll stay close to your current area of the fair. 🌿",
      "Compass says: today a small adventure in your corner of the fair is enough – here’s what I’ve found for you."
    ],
    turtle_compass_trip: [
      "Compass set – I’m now looking in a wider radius across the fairground for good spots for you. 🗺️",
      "For your ABF exploration I’ve opened up the radius. We’ll look for great places to pause and play all across the site. 🗺️"
    ]
  }
});

/**
 * Ermittelt die aktive Sprache.
 *  - bevorzugt I18N.getLanguage(), falls vorhanden
 *  - fällt auf <html lang="…"> zurück
 *  - alles außer "en" → "de" (inkl. "da")
 *
 * @returns {"de"|"en"}
 */
function getActiveLang() {
  try {
    if (
      typeof window !== "undefined" &&
      window.I18N &&
      typeof window.I18N.getLanguage === "function"
    ) {
      const lang = String(window.I18N.getLanguage() || "").toLowerCase();
      if (lang.startsWith("en")) return "en";
      return "de";
    }
  } catch {
    // ignore
  }

  if (typeof document !== "undefined" && document.documentElement) {
    const langAttr = (document.documentElement.lang || "de").toLowerCase();
    if (langAttr.startsWith("en")) return "en";
  }

  return "de";
}

/**
 * @typedef {"intro"
 *         |"everyday"
 *         |"trip"
 *         |"plus"
 *         |"daylog"
 *         |"fav-added"
 *         |"fav-removed"
 *         |"no-spots"
 *         |"play-idea"} TillaState
 *
 * @typedef {"everyday"|"trip"} TravelMode
 *   // ABF-Edition:
 *   //  - "everyday": eher in der Nähe / in der eigenen Halle
 *   //  - "trip":     größere Runde über das Messegelände
 */

/**
 * TillaCompanion
 *
 * Steuert die Texte im Tilla-Sidebar-Widget (#tilla-sidebar-text) abhängig von
 * App-Zuständen (Reisemodus, Filter, Partner-Spots, Favoriten, Daylog, Kompass, etc.).
 *
 * Optionen:
 *  - getText(key): optionaler Übersetzer, z. B. (key) => I18N.t(key)
 */
export class TillaCompanion {
  /**
   * @param {{ getText?: (key: string) => string }} [options]
   */
  constructor(options = {}) {
    /**
     * Optionaler Übersetzungs-Callback (z. B. I18N.t)
     * @type {(key: string) => string | null}
     */
    this.getText =
      typeof options.getText === "function" ? options.getText : null;

    /**
     * Ziel-Element für Tilla-Text
     * @type {HTMLElement | null}
     */
    this.textEl =
      typeof document !== "undefined"
        ? document.getElementById("tilla-sidebar-text")
        : null;

    /** @type {TillaState} */
    this.state = "intro";

    /** @type {TravelMode | null} */
    this.travelMode = "everyday";

    /** @type {number} – Timestamp der letzten Interaktion */
    this.lastInteraction = Date.now();

    /**
     * Merkt sich letzte Textvariante pro Key, um Wiederholungen zu vermeiden
     * @type {Record<string, number>}
     * @private
     */
    this._lastVariantIndex = {};

    if (!this.textEl) {
      console.warn(
        "[Tilla] Element mit ID #tilla-sidebar-text wurde nicht gefunden. Tilla bleibt still."
      );
      return;
    }

    this._renderState();
  }

  /**
   * Wird von außen gerufen, wenn die Sprache gewechselt wurde.
   * Rendert den aktuellen Zustand mit neuer Sprache neu.
   */
  onLanguageChanged() {
    if (!this.textEl) return;
    this._renderState();
  }

  /**
   * Setzt den „Erkundungsmodus“ auf der ABF:
   *  - "everyday"  → eher nah an eurer Halle
   *  - "trip"      → große Runde über das Messegelände
   *  - null/undef  → zurück zum Intro
   * @param {TravelMode | null | undefined} mode
   */
  setTravelMode(mode) {
    if (!this.textEl) return;

    if (mode == null) {
      this.travelMode = null;
      this.state = "intro";
      this.lastInteraction = Date.now();
      this._renderState();
      return;
    }

    if (mode !== "everyday" && mode !== "trip") {
      return;
    }

    this.travelMode = mode;
    this.lastInteraction = Date.now();
    this.state = mode;
    this._renderState();
  }

  /**
   * Wird aufgerufen, wenn ABF Partner-Spots (Plus) aktiviert wurden.
   */
  onPlusActivated() {
    if (!this.textEl) return;
    this.lastInteraction = Date.now();
    this.state = "plus";
    this._renderState();
  }

  /**
   * Wird aufgerufen, wenn der Daylog gespeichert wurde.
   */
  onDaylogSaved() {
    if (!this.textEl) return;
    this.lastInteraction = Date.now();
    this.state = "daylog";
    this._renderState();
  }

  /**
   * Wird aufgerufen, wenn ein Spot als Favorit markiert wurde.
   */
  onFavoriteAdded() {
    if (!this.textEl) return;
    this.lastInteraction = Date.now();
    this.state = "fav-added";
    this._renderState();
  }

  /**
   * Wird aufgerufen, wenn ein Spot aus den Favoriten entfernt wurde.
   */
  onFavoriteRemoved() {
    if (!this.textEl) return;
    this.lastInteraction = Date.now();
    this.state = "fav-removed";
    this._renderState();
  }

  /**
   * Wird aufgerufen, wenn mit den aktuellen Filtern keine Spots gefunden werden.
   */
  onNoSpotsFound() {
    if (!this.textEl) return;
    this.lastInteraction = Date.now();
    this.state = "no-spots";
    this._renderState();
  }

  /**
   * Wird aufgerufen, wenn (wieder) Spots gefunden werden.
   * Tilla wechselt dann je nach Reisemodus in "trip"/"everyday"/"intro".
   */
  onSpotsFound() {
    if (!this.textEl) return;

    this.lastInteraction = Date.now();

    if (this.travelMode === "trip") {
      this.state = "trip";
    } else if (this.travelMode === "everyday") {
      this.state = "everyday";
    } else {
      this.state = "intro";
    }

    this._renderState();
  }

  /**
   * Wird aufgerufen, wenn der Kompass angewendet wurde.
   * Zeigt einen speziellen Kompass-Text und aktualisiert ggf. den Reisemodus.
   * @param {{ travelMode?: TravelMode | null, radiusStep?: number }} [context]
   */
  onCompassApplied(context = {}) {
    if (!this.textEl) return;

    this.lastInteraction = Date.now();

    const mode = context.travelMode ?? this.travelMode;
    const key =
      mode === "trip" ? "turtle_compass_trip" : "turtle_compass_everyday";

    const text = this._t(key);
    this.textEl.textContent = text;

    if (mode === "trip") {
      this.state = "trip";
      this.travelMode = "trip";
    } else if (mode === "everyday" || mode == null) {
      this.state = "everyday";
      if (mode) this.travelMode = mode;
    }
  }

  /**
   * Zeigt eine Spielidee direkt im Tilla-Panel an.
   * Diese State bleibt, bis etwas anderes Tilla überschreibt.
   * @param {string} text
   */
  showPlayIdea(text) {
    if (!this.textEl) return;
    this.lastInteraction = Date.now();
    this.state = "play-idea";
    this.textEl.textContent = text;
  }

  /**
   * Interne Übersetzungsfunktion:
   *  1. versucht getText(key) (z. B. I18N.t)
   *  2. nutzt Fallback-Texte aus FALLBACK_TEXTS
   * @param {string} key
   * @returns {string}
   * @private
   */
  _t(key) {
    // i18n-Callback (I18N.t etc.)
    if (this.getText) {
      try {
        const value = this.getText(key);
        if (
          typeof value === "string" &&
          value.trim() !== "" &&
          value !== key
        ) {
          return value;
        }
      } catch (err) {
        console.warn("[Tilla] Fehler beim getText-Aufruf:", err);
      }
    }

    // Fallback: statische Texte
    const lang = getActiveLang();
    const bundle = FALLBACK_TEXTS[lang] || FALLBACK_TEXTS.de;
    const entry = bundle[key];

    if (Array.isArray(entry) && entry.length > 0) {
      return this._pickVariant(key, entry);
    }

    if (typeof entry === "string") {
      return entry;
    }

    return key;
  }

  /**
   * Wählt eine Textvariante aus einem Array so aus,
   * dass nach Möglichkeit nicht zweimal hintereinander dieselbe Variante kommt.
   *
   * @param {string} key
   * @param {string[]} variants
   * @returns {string}
   * @private
   */
  _pickVariant(key, variants) {
    if (!Array.isArray(variants) || variants.length === 0) return "";

    const lastIndex = this._lastVariantIndex[key];
    let index;

    if (variants.length === 1) {
      index = 0;
    } else {
      do {
        index = Math.floor(Math.random() * variants.length);
      } while (index === lastIndex);
    }

    this._lastVariantIndex[key] = index;
    return variants[index];
  }

  /**
   * Rendert den aktuellen State in das Tilla-Panel.
   * Achtung: Wenn state === "play-idea", wird nicht automatisch überschrieben.
   * @private
   */
  _renderState() {
    if (!this.textEl) return;

    // Wenn eine Spielidee aktiv ist, nicht automatisch überschreiben
    if (this.state === "play-idea") {
      return;
    }

    let text = "";

    switch (this.state) {
      case "intro": {
        const intro = this._t("turtle_intro_1");
        if (this.travelMode === "trip") {
          text = `${intro} ${this._t("turtle_trip_mode")}`;
        } else if (this.travelMode === "everyday") {
          text = `${intro} ${this._t("turtle_everyday_mode")}`;
        } else {
          text = intro;
        }
        break;
      }

      case "everyday": {
        text = this._t("turtle_everyday_mode");
        break;
      }

      case "trip": {
        text = this._t("turtle_trip_mode");
        break;
      }

      case "plus": {
        text = this._t("turtle_plus_activated");
        break;
      }

      case "daylog": {
        text = this._t("turtle_after_daylog_save");
        break;
      }

      case "fav-added": {
        text = this._t("turtle_after_fav_added");
        break;
      }

      case "fav-removed": {
        text = this._t("turtle_after_fav_removed");
        break;
      }

      case "no-spots": {
        text = this._t("turtle_intro_2");
        break;
      }

      default: {
        const intro = this._t("turtle_intro_1");
        if (this.travelMode === "trip") {
          text = `${intro} ${this._t("turtle_trip_mode")}`;
        } else if (this.travelMode === "everyday") {
          text = `${intro} ${this._t("turtle_everyday_mode")}`;
        } else {
          text = intro;
        }
      }
    }

    this.textEl.textContent = text;
  }
}