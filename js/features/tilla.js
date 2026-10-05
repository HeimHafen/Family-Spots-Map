// js/tilla.js
// ------------------------------------------------------
// Tilla – eure Schildkröten-Begleiterin für Familien-Abenteuer 🐢
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
//  - onPlusActivated()
//  - onDaylogSaved(entry)
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
 *
 * - bevorzugt I18N.getLanguage(), falls vorhanden
 * - fällt auf <html lang="…"> zurück
 * - alles außer "en" → "de" (inkl. "da")
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

      if (lang.startsWith("en")) {
        return "en";
      }

      return "de";
    }
  } catch {
    // ignore
  }

  if (typeof document !== "undefined" && document.documentElement) {
    const langAttr = (document.documentElement.lang || "de").toLowerCase();

    if (langAttr.startsWith("en")) {
      return "en";
    }
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
 * Steuert die Texte im Tilla-Sidebar-Widget (#tilla-sidebar-text) abhängig von
 * App-Zuständen (Reisemodus, Filter, Plus, Favoriten, Daylog, Kompass, etc.).
 *
 * Zusätzlich visualisiert Tilla gespeicherte Daylog-Einträge:
 *
 *   Daylog speichern
 *        ↓
 *   kleiner Papierzettel
 *        ↓
 *   fliegt zu Tillas Tasche
 *        ↓
 *   verschwindet in der Tasche
 *
 * Die Animation arbeitet bewusst unabhängig von einer speziellen HTML-Struktur
 * für die Tasche. Dadurch bleibt tilla.js kompatibel mit dem bestehenden Tilla-
 * Bild und kann später durch tilla.css weiter verfeinert werden.
 *
 * Optionen:
 * - getText(key): optionaler Übersetzer, z. B. (key) => I18N.t(key)
 */
export class TillaCompanion {
  /**
   * @param {{ getText?: (key: string) => string }} [options]
   */
  constructor(options = {}) {
    /**
     * Optionaler Übersetzungs-Callback (z. B. I18N.t)
     *
     * @type {(key: string) => string | null}
     */
    this.getText =
      typeof options.getText === "function" ? options.getText : null;

    /**
     * Ziel-Element für Tilla-Text
     *
     * @type {HTMLElement | null}
     */
    this.textEl =
      typeof document !== "undefined"
        ? document.getElementById("tilla-sidebar-text")
        : null;

    /**
     * Tilla-Bild in der Sidebar.
     *
     * @type {HTMLImageElement | null}
     */
    this.tillaImageEl =
      typeof document !== "undefined"
        ? document.querySelector(".tilla-sidebar-avatar img")
        : null;

    /** @type {TillaState} */
    this.state = "intro";

    /** @type {TravelMode | null} */
    this.travelMode = "everyday";

    /** @type {number} – Timestamp der letzten Interaktion */
    this.lastInteraction = Date.now();

    /**
     * Merkt sich letzte Textvariante pro Key, um Wiederholungen zu vermeiden.
     *
     * @type {Record<string, number>}
     * @private
     */
    this._lastVariantIndex = {};

    /**
     * Aktuell fliegender Daylog-Zettel.
     *
     * @type {HTMLElement | null}
     * @private
     */
    this._activeDaylogLetter = null;

    /**
     * ID des letzten Daylog-Eintrags, für den die Animation gestartet wurde.
     * Verhindert doppelte Animationen bei versehentlichen Mehrfachaufrufen.
     *
     * @type {string|number|null}
     * @private
     */
    this._lastAnimatedDaylogId = null;

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
   * Setzt den Reisemodus:
   *
   * - "everyday" → Alltagsmodus
   * - "trip" → Unterwegs / Roadtrip
   * - null/undef → zurück zum Intro
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
   * Wird aufgerufen, wenn der Daylog gespeichert wurde.
   *
   * @param {{id?: string|number, text?: string, ts?: number}|null} [entry]
   */
  onDaylogSaved(entry = null) {
    if (!this.textEl) return;

    this.lastInteraction = Date.now();
    this.state = "daylog";
    this._renderState();

    /*
     * Die visuelle Erinnerung ist bewusst vom Text-State getrennt.
     * Selbst wenn die Animation aus irgendeinem Grund nicht möglich ist,
     * funktioniert der Daylog-Status von Tilla weiterhin ganz normal.
     */
    this._showDaylogLetter(entry);
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
   *
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
   *
   * @param {{ travelMode?: TravelMode | null, radiusStep?: number }} [context]
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
   * Zeigt eine Spielidee direkt im Tilla-Panel an.
   *
   * Diese State bleibt, bis etwas anderes Tilla überschreibt.
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
   * Zeigt den gespeicherten Daylog als kleinen Papierzettel,
   * der in Tillas Brusttasche wandert.
   *
   * Die Methode ist absichtlich fehlertolerant:
   * - fehlt das Tilla-Bild → kein Fehler
   * - fehlt der Save-Button → Startposition wird aus dem Tilla-Panel genommen
   * - fehlt die Web-Animations-API → Zettel wird nach kurzer Zeit entfernt
   *
   * @param {{id?: string|number, text?: string, ts?: number}|null} [entry]
   * @private
   */
  _showDaylogLetter(entry = null) {
    if (typeof document === "undefined" || !document.body) {
      return;
    }

    /*
     * Wenn app.js später tatsächlich einen Entry übergibt, nutzen wir dessen ID.
     * Ohne ID lassen wir die Animation trotzdem zu – das hält die Methode
     * kompatibel mit dem bisherigen onDaylogSaved()-Aufruf.
     */
    if (
      entry &&
      entry.id != null &&
      this._lastAnimatedDaylogId === entry.id
    ) {
      return;
    }

    if (entry && entry.id != null) {
      this._lastAnimatedDaylogId = entry.id;
    }

    /*
     * Bereits fliegenden Zettel sauber entfernen, bevor ein neuer startet.
     * So kann auch ein schneller Doppelklick nicht mehrere Zettel stapeln.
     */
    this._removeActiveDaylogLetter();

    const imageEl =
      this.tillaImageEl ||
      document.querySelector(".tilla-sidebar-avatar img");

    if (!imageEl) {
      return;
    }

    /*
     * Startposition:
     *
     * Primär vom Daylog-Speichern-Button.
     * Falls dieser gerade nicht existiert oder keine sichtbare Fläche hat,
     * nehmen wir das Textfeld von Tilla.
     */
    const saveEl =
      document.getElementById("daylog-save") ||
      document.querySelector("[data-daylog-save]");

    const startRect = this._getUsableRect(saveEl)
      ? saveEl.getBoundingClientRect()
      : this._getUsableRect(this.textEl)
        ? this.textEl.getBoundingClientRect()
        : null;

    const imageRect = this._getUsableRect(imageEl)
      ? imageEl.getBoundingClientRect()
      : null;

    if (!imageRect) {
      return;
    }

    /*
     * Ohne Startposition können wir die Animation nicht sinnvoll führen.
     * In diesem seltenen Fall bleibt Tilla einfach beim normalen Daylog-State.
     */
    if (!startRect) {
      return;
    }

    const startX = startRect.left + startRect.width / 2;
    const startY = startRect.top + startRect.height / 2;

    /*
     * Die originale Tilla-Grafik wird per CSS horizontal gespiegelt.
     * Die Tasche liegt daher visuell links im Bild.
     *
     * Zielpunkt:
     *   x ≈ 40 % der Bildbreite
     *   y ≈ 60 % der Bildhöhe
     *
     * Dieser Punkt liegt bewusst im oberen Bereich der sichtbaren Tasche,
     * damit der Zettel nicht einfach auf Tillas Bauch landet.
     */
    const pouchX = imageRect.left + imageRect.width * 0.40;
    const pouchY = imageRect.top + imageRect.height * 0.60;

    const deltaX = pouchX - startX;
    const deltaY = pouchY - startY;

    const letter = this._createDaylogLetter();

    if (!letter) {
      return;
    }

    /*
     * Fixed positioning sorgt dafür, dass der Zettel:
     * - nicht von Sidebar-Overflow abgeschnitten wird
     * - unabhängig vom Scrollcontainer animiert
     * - auch auf Mobile zuverlässig sichtbar bleibt
     */
    letter.style.left = `${startX}px`;
    letter.style.top = `${startY}px`;

    document.body.appendChild(letter);

    this._activeDaylogLetter = letter;

    /*
     * Für reduzierte Bewegung wird die Flugstrecke deutlich verkürzt,
     * aber der symbolische Übergang bleibt erhalten.
     */
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const duration = prefersReducedMotion ? 420 : 1150;

    const middleX = deltaX * 0.48;
    const middleY = deltaY * 0.48 - (prefersReducedMotion ? 0 : 28);

    const keyframes = [
      {
        transform:
          "translate3d(-50%, -50%, 0) rotate(-5deg) scale(1)",
        opacity: "1"
      },
      {
        transform:
          `translate3d(calc(-50% + ${middleX}px), calc(-50% + ${middleY}px), 0) rotate(3deg) scale(1.04)`,
        opacity: "1"
      },
      {
        transform:
          `translate3d(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px), 0) rotate(8deg) scale(0.42)`,
        opacity: "0"
      }
    ];

    /*
     * Moderne Browser: Web Animations API.
     */
    if (typeof letter.animate === "function") {
      try {
        const animation = letter.animate(keyframes, {
          duration,
          easing: "cubic-bezier(0.22, 0.75, 0.25, 1)",
          fill: "forwards"
        });

        animation.onfinish = () => {
          this._removeDaylogLetter(letter);
        };

        animation.oncancel = () => {
          this._removeDaylogLetter(letter);
        };

        return;
      } catch (err) {
        console.warn("[Tilla] Daylog-Zettel konnte nicht animiert werden:", err);
      }
    }

    /*
     * Fallback für Browser ohne Web Animations API.
     * Der Zettel wird zumindest kurz sichtbar und anschließend entfernt.
     */
    window.setTimeout(() => {
      this._removeDaylogLetter(letter);
    }, duration);
  }

  /**
   * Erzeugt die visuelle Papiernotiz.
   *
   * Der Zettel ist bewusst klein und zurückhaltend:
   * kein Badge, kein Counter, kein Gamification-Element.
   * Er soll sich wie ein kleiner echter Erinnerungszettel anfühlen.
   *
   * @returns {HTMLDivElement|null}
   * @private
   */
  _createDaylogLetter() {
    if (typeof document === "undefined") {
      return null;
    }

    const letter = document.createElement("div");

    letter.className = "tilla-daylog-letter";
    letter.setAttribute("aria-hidden", "true");
    letter.dataset.tillaDaylogLetter = "1";

    Object.assign(letter.style, {
      position: "fixed",
      zIndex: "2147483000",
      width: "34px",
      height: "27px",
      boxSizing: "border-box",
      pointerEvents: "none",
      transformOrigin: "50% 50%",
      borderRadius: "3px",
      background: "linear-gradient(145deg, #fffdf5 0%, #f7efd9 100%)",
      border: "1px solid rgba(122, 92, 48, 0.28)",
      boxShadow:
        "0 4px 9px rgba(73, 47, 21, 0.24), 0 1px 2px rgba(73, 47, 21, 0.14)",
      overflow: "hidden",
      willChange: "transform, opacity",
      transform:
        "translate3d(-50%, -50%, 0) rotate(-5deg) scale(1)"
    });

    /*
     * Kleine umgeschlagene Ecke – macht aus dem Rechteck optisch
     * einen gefalteten Papierzettel.
     */
    const fold = document.createElement("span");

    Object.assign(fold.style, {
      position: "absolute",
      top: "0",
      right: "0",
      width: "8px",
      height: "8px",
      boxSizing: "border-box",
      background: "#e8dcc0",
      clipPath: "polygon(0 0, 100% 0, 100% 100%)",
      opacity: "0.9"
    });

    /*
     * Drei sehr feine Linien – nur angedeutete Handschrift,
     * keine tatsächliche Daylog-Inhaltsanzeige.
     */
    const lines = document.createElement("span");

    Object.assign(lines.style, {
      position: "absolute",
      left: "6px",
      right: "7px",
      top: "9px",
      height: "10px",
      opacity: "0.42",
      background:
        "linear-gradient(to bottom, transparent 0, transparent 2px, rgba(102, 85, 57, 0.42) 2px, rgba(102, 85, 57, 0.42) 3px, transparent 3px, transparent 6px, rgba(102, 85, 57, 0.42) 6px, rgba(102, 85, 57, 0.42) 7px, transparent 7px, transparent 10px)"
    });

    /*
     * Ein winziger Punkt als handschriftliche Andeutung.
     */
    const mark = document.createElement("span");

    Object.assign(mark.style, {
      position: "absolute",
      left: "7px",
      bottom: "5px",
      width: "5px",
      height: "2px",
      borderRadius: "999px",
      background: "rgba(102, 85, 57, 0.38)"
    });

    letter.appendChild(fold);
    letter.appendChild(lines);
    letter.appendChild(mark);

    return letter;
  }

  /**
   * Prüft, ob ein DOMRect eine tatsächlich nutzbare Fläche beschreibt.
   *
   * @param {Element|null} element
   * @returns {boolean}
   * @private
   */
  _getUsableRect(element) {
    if (!element || typeof element.getBoundingClientRect !== "function") {
      return false;
    }

    const rect = element.getBoundingClientRect();

    return (
      Number.isFinite(rect.left) &&
      Number.isFinite(rect.top) &&
      Number.isFinite(rect.width) &&
      Number.isFinite(rect.height) &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  /**
   * Entfernt den aktuell aktiven Daylog-Zettel.
   *
   * @private
   */
  _removeActiveDaylogLetter() {
    if (!this._activeDaylogLetter) {
      return;
    }

    this._removeDaylogLetter(this._activeDaylogLetter);
  }

  /**
   * Entfernt einen konkreten Daylog-Zettel.
   *
   * @param {HTMLElement|null} letter
   * @private
   */
  _removeDaylogLetter(letter) {
    if (!letter) {
      return;
    }

    try {
      if (typeof letter.getAnimations === "function") {
        letter.getAnimations().forEach((animation) => {
          try {
            animation.cancel();
          } catch {
            // ignore
          }
        });
      }
    } catch {
      // ignore
    }

    if (letter.parentNode) {
      letter.parentNode.removeChild(letter);
    }

    if (this._activeDaylogLetter === letter) {
      this._activeDaylogLetter = null;
    }
  }

  /**
   * Interne Übersetzungsfunktion:
   *
   * 1. versucht getText(key) (z. B. I18N.t)
   * 2. nutzt Fallback-Texte aus FALLBACK_TEXTS
   *
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
   * Rendert den aktuellen State in das Tilla-Panel.
   *
   * Achtung:
   * Wenn state === "play-idea", wird nicht automatisch überschrieben.
   *
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