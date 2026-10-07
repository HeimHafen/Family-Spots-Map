// js/features/tilla.js
// ------------------------------------------------------
// Tilla – eure Schildkröten-Begleiterin für Familien-Abenteuer 🐢
//
// Integration (in app.js):
//
//   import { TillaCompanion } from "./features/tilla.js";
//
//   const tilla = new TillaCompanion({
//     getText: (key) => t(key)
//   });
//
// Öffentliche API:
//  - onLanguageChanged()
//  - setTravelMode(mode)
//  - onPlusActivated()
//  - onDaylogSaved(memoryCount)
//  - setMemoryCount(memoryCount)
//  - onFavoriteAdded()
//  - onFavoriteRemoved()
//  - onNoSpotsFound()
//  - onSpotsFound()
//  - onCompassApplied(context)
//  - showPlayIdea(text)
//  - destroy()
//
// Erinnerungszettel:
//  - Beim Speichern wird die kurze Animation ausgelöst.
//  - Solange Erinnerungen vorhanden sind, bleibt er sichtbar.
//  - Beim Laden setzt app.js die vorhandene Erinnerungsanzahl.
//  - Nach dem Löschen setzt app.js die verbleibende Anzahl.
// ------------------------------------------------------

"use strict";

/**
 * Fallback-Texte, falls getText() nichts liefert
 * oder noch nicht verbunden ist.
 *
 * Struktur:
 * FALLBACK_TEXTS[lang][key] = string | string[]
 */
const FALLBACK_TEXTS = Object.freeze({
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
      "Schön, dass ihr euren Tag festhaltet. Solche kleinen Notizen werden später zu großen Erinnerungen. 💚",
      "Ein paar Zeilen heute – viele Erinnerungen morgen. Danke, dass ihr euren Tag teilt. 💚"
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
      "Nice that you captured your day. These small notes turn into big memories later. 💚",
      "A few lines today – many memories tomorrow. Thanks for sharing your day. 💚"
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
});

/**
 * Ermittelt die aktive Sprache.
 * - bevorzugt I18N.getLanguage()
 * - fällt auf <html lang="…"> zurück
 * - bestehender Fallback: alles außer "en" → "de"
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
      const lang = String(
        window.I18N.getLanguage() || ""
      ).toLowerCase();

      if (lang.startsWith("en")) return "en";
      return "de";
    }
  } catch {
    // ignore
  }

  if (
    typeof document !== "undefined" &&
    document.documentElement
  ) {
    const langAttr = (
      document.documentElement.lang || "de"
    ).toLowerCase();

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
 */

/**
 * TillaCompanion
 *
 * Steuert die Texte im Tilla-Sidebar-Widget
 * und den Erinnerungszettel am Brustbeutel.
 *
 * Optionen:
 * - getText(key): optionaler Übersetzer
 */
export class TillaCompanion {
  /**
   * @param {{ getText?: (key: string) => string }} [options]
   */
  constructor(options = {}) {
    /**
     * Optionaler Übersetzungs-Callback.
     * @type {((key: string) => string) | null}
     */
    this.getText =
      typeof options.getText === "function"
        ? options.getText
        : null;

    /**
     * Ziel-Element für Tilla-Text.
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

    /** Timestamp der letzten Interaktion. */
    this.lastInteraction = Date.now();

    /**
     * Letzte Textvariante pro Key.
     * @type {Record<string, number>}
     * @private
     */
    this._lastVariantIndex = {};

    /**
     * Dekorativer Erinnerungszettel.
     * @type {HTMLElement | null}
     */
    this.memoryNoteEl =
      typeof document !== "undefined"
        ? document.getElementById("tilla-memory-note")
        : null;

    /**
     * Anzahl der vorhandenen Erinnerungen.
     * app.js hält diesen Wert aktuell.
     */
    this.memoryCount = 0;

    /** @private */
    this._memoryAnimationTimer = null;

    /** @private */
    this._onMemoryAnimationEnd = (event) => {
      if (
        event.target === this.memoryNoteEl &&
        event.animationName === "tilla-store-memory"
      ) {
        this._stopMemoryAnimation();
      }
    };

    this.memoryNoteEl?.addEventListener(
      "animationend",
      this._onMemoryAnimationEnd
    );

    // Bis app.js die gespeicherte Anzahl übergibt, bleibt er verborgen.
    this.setMemoryCount(0);

    if (!this.textEl) {
      console.warn(
        "[Tilla] Element mit ID #tilla-sidebar-text wurde nicht gefunden. Tilla bleibt still."
      );
      return;
    }

    this._renderState();
  }

  /**
   * Rendert den aktuellen Zustand nach einem Sprachwechsel neu.
   */
  onLanguageChanged() {
    if (!this.textEl) return;
    this._renderState();
  }

  /**
   * Setzt den Reisemodus.
   * - "everyday": Alltagsmodus
   * - "trip": Unterwegs / Roadtrip
   * - null/undefined: zurück zum Intro
   *
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
   * Wird aufgerufen, wenn Plus aktiviert wurde.
   */
  onPlusActivated() {
    if (!this.textEl) return;

    this.lastInteraction = Date.now();
    this.state = "plus";
    this._renderState();
  }

  /**
   * Wird nach dem Speichern einer Erinnerung aufgerufen.
   *
   * Optional übergibt app.js die aktuelle Gesamtanzahl.
   * Der bisherige Aufruf ohne Argument bleibt kompatibel.
   *
   * @param {number} [memoryCount]
   */
  onDaylogSaved(memoryCount) {
    const count = Number.isFinite(memoryCount)
      ? memoryCount
      : Math.max(1, this.memoryCount);

    this.setMemoryCount(count);
    this._animateMemoryNote();

    if (!this.textEl) return;

    this.lastInteraction = Date.now();
    this.state = "daylog";
    this._renderState();
  }

  /**
   * Aktualisiert die Sichtbarkeit des Zettels.
   *
   * Diese Methode startet keine Animation und ändert
   * Tillas Text nicht.
   *
   * app.js ruft sie beim Laden und nach dem Löschen auf.
   *
   * @param {number} memoryCount
   */
  setMemoryCount(memoryCount) {
    this.memoryCount = Number.isFinite(memoryCount)
      ? Math.max(0, Math.floor(memoryCount))
      : 0;

    if (!this.memoryNoteEl) return;

    const hasMemories = this.memoryCount > 0;

    if (!hasMemories) {
      this._stopMemoryAnimation();
    }

    this.memoryNoteEl.hidden = !hasMemories;
  }

  /**
   * Startet die kurze Speicherbewegung.
   *
   * Bei reduzierter Bewegung erscheint nur der ruhige Zettel.
   *
   * @private
   */
  _animateMemoryNote() {
    const note = this.memoryNoteEl;

    if (!note || this.memoryCount === 0) return;

    this._stopMemoryAnimation();
    note.hidden = false;

    try {
      if (
        typeof window !== "undefined" &&
        typeof window.matchMedia === "function" &&
        window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches
      ) {
        return;
      }
    } catch {
      // Ohne matchMedia funktioniert die normale Animation weiterhin.
    }

    // Neustart auch bei unmittelbar aufeinanderfolgenden Speicherungen.
    void note.offsetWidth;
    note.classList.add("is-storing");

    // Fallback, falls animationend ausbleibt.
    this._memoryAnimationTimer = setTimeout(() => {
      this._stopMemoryAnimation();
    }, 1500);
  }

  /**
   * Entfernt den Animationszustand.
   *
   * Der Zettel bleibt bei vorhandenen Erinnerungen
   * über seinen normalen CSS-Zustand sichtbar.
   *
   * @private
   */
  _stopMemoryAnimation() {
    if (this._memoryAnimationTimer !== null) {
      clearTimeout(this._memoryAnimationTimer);
      this._memoryAnimationTimer = null;
    }

    this.memoryNoteEl?.classList.remove("is-storing");
  }

  /**
   * Entfernt Listener und Timer, falls die Instanz ersetzt wird.
   */
  destroy() {
    this._stopMemoryAnimation();

    this.memoryNoteEl?.removeEventListener(
      "animationend",
      this._onMemoryAnimationEnd
    );
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
   * Wird aufgerufen, wenn keine passenden Spots gefunden werden.
   */
  onNoSpotsFound() {
    if (!this.textEl) return;

    this.lastInteraction = Date.now();
    this.state = "no-spots";
    this._renderState();
  }

  /**
   * Wird aufgerufen, wenn wieder Spots gefunden werden.
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
   *
   * @param {{
   *   travelMode?: TravelMode | null,
   *   radiusStep?: number
   * }} [context]
   */
  onCompassApplied(context = {}) {
    if (!this.textEl) return;

    this.lastInteraction = Date.now();

    const mode = context.travelMode ?? this.travelMode;

    const key =
      mode === "trip"
        ? "turtle_compass_trip"
        : "turtle_compass_everyday";

    const text = this._t(key);
    this.textEl.textContent = text;

    if (mode === "trip") {
      this.state = "trip";
      this.travelMode = "trip";
    } else if (mode === "everyday" || mode == null) {
      this.state = "everyday";

      if (mode) {
        this.travelMode = mode;
      }
    }
  }

  /**
   * Zeigt eine Spielidee direkt im Tilla-Panel.
   *
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
   * 1. Übersetzungs-Callback
   * 2. Statische Fallback-Texte
   *
   * @param {string} key
   * @returns {string}
   * @private
   */
  _t(key) {
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
        console.warn(
          "[Tilla] Fehler beim getText-Aufruf:",
          err
        );
      }
    }

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
   * Vermeidet nach Möglichkeit direkte Textwiederholungen.
   *
   * @param {string} key
   * @param {string[]} variants
   * @returns {string}
   * @private
   */
  _pickVariant(key, variants) {
    if (!Array.isArray(variants) || variants.length === 0) {
      return "";
    }

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
   * Rendert den aktuellen Textzustand.
   *
   * Eine aktive Spielidee wird hier nicht überschrieben.
   * Der Erinnerungszettel wird unabhängig davon gesteuert.
   *
   * @private
   */
  _renderState() {
    if (!this.textEl) return;

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