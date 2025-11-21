// js/tilla.js
// ------------------------------------------------------
// Tilla – eure Schildkröten-Begleiterin für Familien-Abenteuer 🐢
//
// Idee:
// Tilla ist kein reiner Infokasten, sondern ein kleiner, freundlicher
// Begleiter. Sie reagiert auf Ereignisse in der App (Reise-Modus,
// Plus-Aktivierung, Favoriten, Mein Tag, leere Ergebnisse) und spricht
// in kurzen, warmen Sätzen – auf Deutsch oder Englisch.
//
// Highlights dieser Version:
// - Mehrere Textvarianten pro Zustand (Intro, Alltag, Trip, Plus, …)
// - Sprache automatisch über <html lang="…"> oder eigenes i18n
// - Sanfter Fallback, wenn getText() nichts liefert
// - Kein „Spam“: pro Key wird nicht ständig derselbe Satz wiederholt
//
// Integration (in app.js):
//
//   import { TillaCompanion } from './tilla.js';
//
//   const tilla = new TillaCompanion({
//     getText: (key) => i18n.t?.(key)  // optional
//   });
//
//   // Beispiele:
//   // tilla.setTravelMode('trip');
//   // tilla.onFavoriteAdded();
//   // tilla.onDaylogSaved();
//   // tilla.onNoSpotsFound();
//   // tilla.onPlusActivated();
//   // tilla.onLanguageChanged();
//
// ------------------------------------------------------

// Fallback-Texte, falls getText() nichts liefert oder (noch) nicht verkabelt ist.
// Jeder Key kann ein String ODER ein Array von Strings sein.
// Bei Arrays wählt Tilla automatisch eine passende Variante aus.
const FALLBACK_TEXTS = {
  de: {
    // Intro: kombiniert sich mit Alltag- oder Trip-Sätzen
    turtle_intro_1: [
      "Hallo, ich bin Tilla – eure kleine Schildkröten-Begleiterin für Familien-Abenteuer.",
      "Ich bin Tilla. Mit mir wird eure Karte zu einer Schatzkarte voller Familienmomente."
    ],
    // Wenn keine Spots im Radius / mit Filtern gefunden werden
    turtle_intro_2: [
      "Gerade finde ich keinen passenden Spot. Vielleicht passt heute ein Spaziergang ganz in der Nähe – oder ihr dreht den Radius ein Stück weiter auf. 🐢",
      "Mit diesen Filtern ist die Karte gerade leer. Probiert einen größeren Radius oder eine andere Kategorie – irgendwo wartet ein guter Ort auf euch. 🐢"
    ],
    turtle_after_daylog_save: [
      "Schön, dass ihr euren Tag festhaltet. Solche kleinen Notizen werden später zu großen Erinnerungen. 💛",
      "Ein paar Zeilen heute – viele Erinnerungen morgen. Danke, dass ihr euren Tag teilt. 💛"
    ],
    turtle_after_fav_added: [
      "Diesen Ort merkt ihr euch – eine kleine Perle auf eurer Familienkarte. ⭐",
      "Gut gewählt! Dieser Spot ist jetzt Teil eurer persönlichen Schatzkarte. ⭐"
    ],
    turtle_after_fav_removed: [
      "Alles gut – manchmal passen Orte nur zu bestimmten Phasen. Ich helfe euch, neue zu finden. 🐢",
      "Manche Spots dürfen gehen, damit Platz für neue Highlights ist. Wir finden gemeinsam frische Lieblingsorte. 🐢"
    ],
    turtle_trip_mode: [
      "Ihr seid unterwegs – ich halte Ausschau nach guten Zwischenstopps für euch. 🚐",
      "Roadtrip-Tag? Dann suchen wir jetzt nach Orten zum Toben, Auftanken und Durchatmen. 🚐"
    ],
    turtle_everyday_mode: [
      "Alltag darf auch leicht sein. Lass uns schauen, was in eurer Nähe ein Lächeln zaubert. 🌿",
      "Vielleicht reicht heute ein kleiner Ausflug um die Ecke. Ich zeige euch, was nah dran gut tut. 🌿"
    ],
    turtle_plus_activated: [
      "Family Spots Plus ist aktiv – jetzt entdecke ich auch Rastplätze, Stellplätze und Camping-Spots für euch. ✨",
      "Plus ist an Bord! Ab jetzt achte ich extra auf Spots für WoMo, Camping und große Abenteuer. ✨"
    ]
  },
  en: {
    turtle_intro_1: [
      "Hi, I’m Tilla – your little turtle companion for family adventures.",
      "I’m Tilla. Together we’ll turn this map into a treasure map of family moments."
    ],
    turtle_intro_2: [
      "Right now I can’t find a fitting spot. Maybe a small walk nearby is perfect today – or you widen the radius a little. 🐢",
      "With these filters the map is empty. Try a wider radius or a different category – somewhere a good place is waiting for you. 🐢"
    ],
    turtle_after_daylog_save: [
      "Nice that you captured your day. These small notes turn into big memories later. 💛",
      "A few lines today – many memories tomorrow. Thanks for sharing your day. 💛"
    ],
    turtle_after_fav_added: [
      "You’ve saved this place – a small gem on your family map. ⭐",
      "Great choice! This spot is now part of your personal treasure map. ⭐"
    ],
    turtle_after_fav_removed: [
      "All good – some places only fit certain phases. I’ll help you find new ones. 🐢",
      "Some spots leave so new highlights can arrive. We’ll find fresh favourites together. 🐢"
    ],
    turtle_trip_mode: [
      "You’re on the road – I’ll watch out for good stopovers for you. 🚐",
      "Roadtrip day? Let’s look for places to play, recharge and breathe deeply. 🚐"
    ],
    turtle_everyday_mode: [
      "Everyday life can feel light, too. Let’s see what nearby spot can bring a smile today. 🌿",
      "Maybe today a small trip around the corner is just right. I’ll show you what feels good nearby. 🌿"
    ],
    turtle_plus_activated: [
      "Family Spots Plus is active – I can now highlight rest areas, RV spots and campgrounds for you. ✨",
      "Plus is on board! From now on I’ll pay special attention to RV, camping and big adventure spots. ✨"
    ]
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
    this.getText =
      typeof options.getText === "function" ? options.getText : null;

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

    // Merkt sich, welcher Variant-Index zuletzt für einen Key genutzt wurde,
    // damit nicht permanent derselbe Satz wiederholt wird.
    this._lastVariantIndex = {};

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

  /**
   * Übersetzungs-/Text-Funktion:
   * 1. versucht getText(key)
   * 2. nutzt FALLBACK_TEXTS[lang][key] (String oder Array)
   * 3. fällt ansonsten auf den Key zurück
   */
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
    const bundle = FALLBACK_TEXTS[lang] || FALLBACK_TEXTS.de;
    const entry = bundle[key];

    if (Array.isArray(entry) && entry.length > 0) {
      return this._pickVariant(key, entry);
    }

    if (typeof entry === "string") {
      return entry;
    }

    // 3. Letzter Fallback: Key selbst
    return key;
  }

  /**
   * Wählt eine Variante aus einem Array von Texten aus.
   * Versucht, nicht zweimal hintereinander denselben Index zu verwenden.
   */
  _pickVariant(key, variants) {
    if (!Array.isArray(variants) || variants.length === 0) return "";

    const lastIndex = this._lastVariantIndex[key];
    let index;

    if (variants.length === 1) {
      index = 0;
    } else {
      // so lange würfeln, bis ein anderer Index als zuletzt getroffen wurde
      do {
        index = Math.floor(Math.random() * variants.length);
      } while (index === lastIndex);
    }

    this._lastVariantIndex[key] = index;
    return variants[index];
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