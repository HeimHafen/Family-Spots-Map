// js/tilla.js
// ------------------------------------------------------
// Tilla – eure Schildkröten-Begleiterin für Familien-Abenteuer 🐢
//
// Integration (in app.js):
//
//   import { TillaCompanion } from './tilla.js';
//
//   const tilla = new TillaCompanion({
//     getText: (key) => t(key)  // optional: UI-Strukturen für Texte
//   });
//
// app.js kann zusätzlich (optional) aufrufen:
//   tilla.showPlayIdea(text)
//   tilla.showExternalMessage(text)  // z.B. für Besuchs- oder Streak-Meldungen
//   tilla.showMessage(text)          // Alias zu showExternalMessage
//
// ------------------------------------------------------

// Fallback-Texte, falls getText() nichts liefert oder (noch) nicht verkabelt ist.
const FALLBACK_TEXTS = {
  de: {
    turtle_intro_1: [
      "Hallo, ich bin Tilla – eure kleine Schildkröten-Begleiterin für Familien-Abenteuer.",
      "Ich bin Tilla. Mit mir wird eure Karte zu einer Schatzkarte voller Familienmomente."
    ],
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
    ],
    turtle_compass_everyday: [
      "Ich habe den Radius auf eure Alltagslaune eingestellt – wir bleiben in eurer Nähe. 🌿",
      "Kompass sagt: Heute reicht ein kleines Abenteuer in eurer Umgebung – schaut mal, was ich gefunden habe."
    ],
    turtle_compass_trip: [
      "Kompass ist gesetzt – ich schaue jetzt in einem größeren Radius nach Zwischenstopps für eure Tour. 🚐",
      "Für euren Unterwegs-Tag habe ich den Radius großzügig gestellt. Wir suchen nach guten Pausenplätzen für euch. 🚐"
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
    ],
    turtle_compass_everyday: [
      "I’ve set the radius to match your everyday mood – we’ll stay close to home. 🌿",
      "Compass says: today a small nearby adventure is enough – let’s see what I’ve found for you."
    ],
    turtle_compass_trip: [
      "Compass set – I’m now looking in a wider radius for good stopovers on your trip. 🚐",
      "For your travel day I’ve opened up the radius. We’ll look for great places to pause and recharge. 🚐"
    ]
  }
};

function getCurrentLang() {
  const lang = (document.documentElement.lang || "de").toLowerCase();
  if (lang.startsWith("en")) return "en";
  return "de";
}

export class TillaCompanion {
  /**
   * @param {{getText?: (key: string) => string}} options
   */
  constructor(options = {}) {
    this.getText =
      typeof options.getText === "function" ? options.getText : null;

    this.textEl = document.getElementById("tilla-sidebar-text");
    if (!this.textEl) {
      console.warn(
        "[Tilla] Element mit ID #tilla-sidebar-text wurde nicht gefunden. Tilla bleibt still."
      );
      return;
    }

    this.state = "intro";        // intro | everyday | trip | plus | daylog | fav-added | fav-removed | no-spots | play-idea | external
    this.travelMode = "everyday";
    this.lastInteraction = Date.now();
    this._lastVariantIndex = {};
    this._manualText = null;     // für play-idea / external

    this._renderState();
  }

  // ------------------------------------------------------
  // Öffentliche API für app.js
  // ------------------------------------------------------

  onLanguageChanged() {
    if (!this.textEl) return;
    this._renderState();
  }

  setTravelMode(mode) {
    if (!this.textEl) return;

    if (mode === null || mode === undefined) {
      this.travelMode = null;
      this.state = "intro";
      this.lastInteraction = Date.now();
      this._manualText = null;
      this._renderState();
      return;
    }

    if (mode !== "everyday" && mode !== "trip") return;

    this.travelMode = mode;
    this.lastInteraction = Date.now();
    this.state = mode;
    this._manualText = null;
    this._renderState();
  }

  onPlusActivated() {
    if (!this.textEl) return;
    this.lastInteraction = Date.now();
    this.state = "plus";
    this._manualText = null;
    this._renderState();
  }

  onDaylogSaved() {
    if (!this.textEl) return;
    this.lastInteraction = Date.now();
    this.state = "daylog";
    this._manualText = null;
    this._renderState();
  }

  onFavoriteAdded() {
    if (!this.textEl) return;
    this.lastInteraction = Date.now();
    this.state = "fav-added";
    this._manualText = null;
    this._renderState();
  }

  onFavoriteRemoved() {
    if (!this.textEl) return;
    this.lastInteraction = Date.now();
    this.state = "fav-removed";
    this._manualText = null;
    this._renderState();
  }

  onNoSpotsFound() {
    if (!this.textEl) return;
    this.lastInteraction = Date.now();
    this.state = "no-spots";
    this._manualText = null;
    this._renderState();
  }

  onSpotsFound() {
    if (!this.textEl) return;

    this.lastInteraction = Date.now();
    this._manualText = null;

    if (this.travelMode === "trip") {
      this.state = "trip";
    } else if (this.travelMode === "everyday") {
      this.state = "everyday";
    } else {
      this.state = "intro";
    }

    this._renderState();
  }

  onCompassApplied(context = {}) {
    if (!this.textEl) return;

    this.lastInteraction = Date.now();
    this._manualText = null;

    const mode = context.travelMode ?? this.travelMode;
    const key =
      mode === "trip" ? "turtle_compass_trip" : "turtle_compass_everyday";

    const text = this._t(key);
    this._setText(text);

    if (mode === "trip") {
      this.state = "trip";
      this.travelMode = "trip";
    } else if (mode === "everyday" || mode == null) {
      this.state = "everyday";
      if (mode) this.travelMode = mode;
    }
  }

  /**
   * Spielideen aus app.js direkt anzeigen
   * @param {string} text
   */
  showPlayIdea(text) {
    if (!this.textEl || !text) return;
    this.lastInteraction = Date.now();
    this.state = "play-idea";
    this._manualText = text;
    this._setText(text);
  }

  /**
   * Externe Nachricht von außen (z. B. Besuchs-Tracking, Streak)
   * – wird NICHT von _renderState überschrieben, bis ein neues Event kommt.
   * @param {string} text
   */
  showExternalMessage(text) {
    if (!this.textEl || !text) return;
    this.lastInteraction = Date.now();
    this.state = "external";
    this._manualText = text;
    this._setText(text);
  }

  /**
   * Alias für showExternalMessage – praktischer Kurzname
   * @param {string} text
   */
  showMessage(text) {
    this.showExternalMessage(text);
  }

  // ------------------------------------------------------
  // Intern: Übersetzungen & Varianten
  // ------------------------------------------------------

  _t(key) {
    // 1) App-Übersetzung versuchen
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

    // 2) Eigene Fallbacks
    const lang = getCurrentLang();
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

  _setText(text) {
    if (!this.textEl) return;
    this.textEl.textContent = text;
  }

  // ------------------------------------------------------
  // Rendering
  // ------------------------------------------------------

  _renderState() {
    if (!this.textEl) return;

    // WICHTIG:
    // Wenn gerade eine Spielidee oder externe Message aktiv ist,
    // soll ein "normales" Re-Render (z.B. durch Sprachwechsel) NICHT überschreiben.
    if (this.state === "play-idea" || this.state === "external") {
      if (this._manualText) {
        this._setText(this._manualText);
      }
      return;
    }

    let text = "";

    switch (this.state) {
      case "intro": {
        const intro = this._t("turtle_intro_1");
        if (this.travelMode === "trip") {
          text = intro + " " + this._t("turtle_trip_mode");
        } else if (this.travelMode === "everyday") {
          text = intro + " " + this._t("turtle_everyday_mode");
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
          text = intro + " " + this._t("turtle_trip_mode");
        } else if (this.travelMode === "everyday") {
          text = intro + " " + this._t("turtle_everyday_mode");
        } else {
          text = intro;
        }
      }
    }

    this._manualText = null;
    this._setText(text);
  }
}