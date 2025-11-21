// js/tilla.js
// ------------------------------------------------------
// Tilla – eure Schildkröten-Begleiterin für Familien-Abenteuer 🐢
// ------------------------------------------------------
//
// Diese Datei kapselt alle Logiken rund um Tilla:
// - Initialer Begrüßungstext in der Sidebar
// - Reaktionen auf Ereignisse (Favorit, Mein Tag, Reise-Modus, Plus…)
// - Sprachwechsel / Übersetzungen über eine getText-Funktion
//
// Integration:
// In app.js in etwa so verwenden:
//
//   import { TillaCompanion } from './tilla.js';
//
//   const tilla = new TillaCompanion({
//     getText: (key) => i18n.t(key) // oder dein bestehendes Übersetzungs-System
//   });
//
//   // Beispiele später in app.js:
//   // tilla.setTravelMode('trip');
//   // tilla.onFavoriteAdded();
//   // tilla.onDaylogSaved();
//   // tilla.onNoSpotsFound();
//   // tilla.onPlusActivated();
//   // tilla.onLanguageChanged();
//
// ------------------------------------------------------

// Fallback-Texte, falls getText() nichts liefert oder (noch) nicht verkabelt ist.
const FALLBACK_TEXTS = {
  de: {
    turtle_intro_1:
      "Hallo, ich bin Tilla – eure Schildkröten-Begleiterin für entspannte Familien-Abenteuer!",
    turtle_intro_2:
      "Gerade finde ich keinen passenden Spot. Vielleicht passt heute ein kleiner Spaziergang in eurer Nähe – oder ihr dreht den Radius ein Stück weiter auf. 🐢",
    turtle_after_daylog_save:
      "Schön, dass ihr euren Tag festhaltet. Solche kleinen Notizen werden später zu großen Erinnerungen. 💛",
    turtle_after_fav_added:
      "Diesen Ort merkt ihr euch – eine kleine Perle auf eurer Familienkarte. ⭐",
    turtle_after_fav_removed:
      "Alles gut – manchmal passen Orte nur zu bestimmten Phasen. Ich helfe euch, neue zu finden. 🐢",
    turtle_trip_mode:
      "Ihr seid unterwegs – ich halte Ausschau nach guten Zwischenstopps für euch. 🚐",
    turtle_everyday_mode:
      "Alltag darf auch leicht sein. Lass uns schauen, was in eurer Nähe ein Lächeln zaubert. 🌿",
    turtle_plus_activated:
      "Family Spots Plus ist aktiv – jetzt entdecke ich auch Rastplätze, Stellplätze und Camping-Spots für euch. ✨"
  },
  en: {
    turtle_intro_1:
      "Hi, I’m Tilla – your turtle companion for slow & relaxed family adventures!",
    turtle_intro_2:
      "Right now I can’t find a fitting spot. Maybe a small walk nearby is perfect today – or you widen the radius a little. 🐢",
    turtle_after_daylog_save:
      "Nice that you captured your day. These small notes turn into big memories later. 💛",
    turtle_after_fav_added:
      "You’ve saved this place – a small gem on your family map. ⭐",
    turtle_after_fav_removed:
      "All good – some places only fit certain phases. I’ll help you find new ones. 🐢",
    turtle_trip_mode:
      "You’re on the road – I’ll watch out for good stopovers for you. 🚐",
    turtle_everyday_mode:
      "Everyday life can feel light, too. Let’s see what nearby spot can bring a smile today. 🌿",
    turtle_plus_activated:
      "Family Spots Plus is active – I can now show you rest areas, RV spots and campgrounds as well. ✨"
  }
};

// Hilfsfunktion: aktuelle Sprache aus dem <html>-Tag bestimmen
function getCurrentLang() {
  const lang = (document.documentElement.lang || "de").toLowerCase();
  if (lang.startsWith("en")) return "en";
  return "de";
}

/**
 * TillaCompanion
 * --------------------------------------------------
 * Verwaltet den Text in der Sidebar und reagiert auf
 * Events aus der App.
 */
export class TillaCompanion {
  /**
   * @param {Object} options
   * @param {(key: string) => string} [options.getText] - Funktion, um Übersetzungen zu holen (z. B. i18n.t)
   */
  constructor(options = {}) {
    this.getText = typeof options.getText === "function" ? options.getText : null;

    // Sidebar-Text-Element
    this.textEl = document.getElementById("tilla-sidebar-text");
    if (!this.textEl) {
      console.warn(
        "[Tilla] Element mit ID #tilla-sidebar-text wurde nicht gefunden. Tilla bleibt still."
      );
      return;
    }

    // State
    this.state = "intro"; // intro | everyday | trip | plus | daylog | fav-added | fav-removed | no-spots
    this.travelMode = "everyday"; // everyday | trip
    this.lastInteraction = Date.now();

    // Initial: freundliche Begrüßung
    this._renderState();
  }

  // --------------------------------------------------
  // Öffentliche API – wird von app.js aufgerufen
  // --------------------------------------------------

  /**
   * Sprache wurde gewechselt – aktuellen State neu rendern.
   */
  onLanguageChanged() {
    if (!this.textEl) return;
    this._renderState();
  }

  /**
   * Reise-Modus gesetzt (everyday | trip).
   */
  setTravelMode(mode) {
    if (!this.textEl) return;
    if (mode !== "everyday" && mode !== "trip") return;

    this.travelMode = mode;
    this.lastInteraction = Date.now();
    this.state = mode; // "everyday" oder "trip"
    this._renderState();
  }

  /**
   * Family Spots Plus wurde aktiviert.
   */
  onPlusActivated() {
    if (!this.textEl) return;
    this.lastInteraction = Date.now();
    this.state = "plus";
    this._renderState();
  }

  /**
   * Tagesprotokoll wurde gespeichert.
   */
  onDaylogSaved() {
    if (!this.textEl) return;
    this.lastInteraction = Date.now();
    this.state = "daylog";
    this._renderState();
  }

  /**
   * Favorit hinzugefügt.
   */
  onFavoriteAdded() {
    if (!this.textEl) return;
    this.lastInteraction = Date.now();
    this.state = "fav-added";
    this._renderState();
  }

  /**
   * Favorit entfernt.
   */
  onFavoriteRemoved() {
    if (!this.textEl) return;
    this.lastInteraction = Date.now();
    this.state = "fav-removed";
    this._renderState();
  }

  /**
   * Aktuell wurden keine Spots im gewählten Radius / Filtern gefunden.
   */
  onNoSpotsFound() {
    if (!this.textEl) return;
    this.lastInteraction = Date.now();
    this.state = "no-spots";
    this._renderState();
  }

  /**
   * Es gibt wieder Spots (nachdem vorher keine gefunden wurden).
   * Hier gehen wir zurück auf den Reise-Modus (everyday/trip)
   * oder die Intro-Stimmung.
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

  // --------------------------------------------------
  // Interne Helfer
  // --------------------------------------------------

  _t(key) {
    // 1. Versuch: externes getText (z. B. i18n)
    if (this.getText) {
      try {
        const value = this.getText(key);
        if (typeof value === "string" && value.trim() !== "") {
          return value;
        }
      } catch (err) {
        console.warn("[Tilla] Fehler beim getText-Aufruf:", err);
      }
    }

    // 2. Fallback auf interne Texte
    const lang = getCurrentLang();
    const fallbackLang = FALLBACK_TEXTS[lang] ? lang : "de";
    const fromFallback = FALLBACK_TEXTS[fallbackLang][key];
    if (typeof fromFallback === "string") {
      return fromFallback;
    }

    // 3. Letzter Fallback: Key selbst
    return key;
  }

  _renderState() {
    if (!this.textEl) return;

    let text = "";

    switch (this.state) {
      case "intro": {
        // Warmes Willkommen: Intro + je nach Reise-Modus
        const intro = this._t("turtle_intro_1");
        if (this.travelMode === "trip") {
          text = intro + " " + this._t("turtle_trip_mode");
        } else {
          text = intro + " " + this._t("turtle_everyday_mode");
        }
        break;
      }

      case "everyday": {
        // Alltag: Fokus auf Mikro-Abenteuer in der Nähe
        text = this._t("turtle_everyday_mode");
        break;
      }

      case "trip": {
        // Unterwegs: Fokus auf Zwischenstopps
        text = this._t("turtle_trip_mode");
        break;
      }

      case "plus": {
        // Plus aktiv
        text = this._t("turtle_plus_activated");
        break;
      }

      case "daylog": {
        // Mein Tag gespeichert
        text = this._t("turtle_after_daylog_save");
        break;
      }

      case "fav-added": {
        // Favorit gesetzt
        text = this._t("turtle_after_fav_added");
        break;
      }

      case "fav-removed": {
        // Favorit entfernt
        text = this._t("turtle_after_fav_removed");
        break;
      }

      case "no-spots": {
        // Keine Spots im Radius – Einladung zu Spaziergang / Radius anpassen
        text = this._t("turtle_intro_2");
        break;
      }

      default: {
        // Fallback auf Intro
        const intro = this._t("turtle_intro_1");
        if (this.travelMode === "trip") {
          text = intro + " " + this._t("turtle_trip_mode");
        } else {
          text = intro + " " + this._t("turtle_everyday_mode");
        }
      }
    }

    this.textEl.textContent = text;
  }
}