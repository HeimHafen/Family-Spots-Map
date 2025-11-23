// js/tilla.js
// ------------------------------------------------------
// Tilla – eure Schildkröten-Begleiterin für Familien-Abenteuer 🐢
//
// Idee:
// Tilla ist kein reiner Infokasten, sondern ein kleiner, freundlicher
// Begleiter. Sie reagiert auf Ereignisse in der App (Reise-Modus,
// Plus-Aktivierung, Favoriten, Mein Tag, leere Ergebnisse, Kompass)
// und spricht in kurzen, warmen Sätzen – auf Deutsch oder Englisch.
//
// Highlights dieser Version:
// - Mehrere Textvarianten pro Zustand (Intro, Alltag, Trip, Plus, …)
// - Sprache automatisch über <html lang="…"> oder eigenes i18n
// - Sanfter Fallback, wenn getText() nichts liefert
// - Kein „Spam“: pro Key wird nicht ständig derselbe Satz wiederholt
// - Spezieller Begrüßungstext beim ersten App-Start (localStorage)
// - NEU: Kleine Spielideen für unterwegs im Reise-Modus 🚐🎲
//
// Integration (in app.js):
//
//   import { TillaCompanion } from './tilla.js';
//
//   const tilla = new TillaCompanion({
//     getText: (key) => t(key)  // optional: Überschreiben einzelner Texte möglich
//   });
//
// ------------------------------------------------------

// Fallback-Texte, falls getText() nichts liefert oder (noch) nicht verkabelt ist.
// Jeder Key kann ein String ODER ein Array von Strings sein.
// Bei Arrays wählt Tilla automatisch eine passende Variante aus.
const FALLBACK_TEXTS = {
  de: {
    // Spezieller erster App-Start
    turtle_first_start: [
      "Schön, dass ihr hier seid. Ich bin Tilla und helfe euch, aus dieser Karte eine Familien-Schatzkarte zu machen.",
      "Hallo ihr Lieben – erster Start! Tippt euch einfach durch Stimmung, Radius und Kategorien, dann suche ich passende Spots für euren Tag."
    ],

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
    ],
    // Kompass-Kommentare
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
    // Special first app start
    turtle_first_start: [
      "Nice to meet you! I’m Tilla and I’ll help you turn this map into a little treasure map of family adventures.",
      "Hi there – first start! Just tap through mood, radius and categories and I’ll look for fitting spots for your day."
    ],

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

// Kleine Spielideen für unterwegs – nach Sprache getrennt
const TRAVEL_GAMES = {
  de: [
    {
      id: "spy",
      title: "Ich sehe was, was du nicht siehst",
      text:
        "Einer sucht sich draußen etwas aus und nennt nur die Farbe. Die anderen raten, was gemeint ist."
    },
    {
      id: "plates",
      title: "Kennzeichen-Bingo",
      text:
        "Jeder wählt zwei Buchstaben oder Zahlen. Wer seine zuerst auf Kennzeichen entdeckt, gewinnt."
    },
    {
      id: "colors",
      title: "Farben-Jagd",
      text:
        "Legt eine Farbe fest – zum Beispiel Rot. Alle schauen aus dem Fenster: Wer zuerst fünf rote Dinge entdeckt, hat gewonnen."
    },
    {
      id: "alphabet-animals",
      title: "Tier-Alphabet",
      text:
        "Geht das Alphabet durch: A wie Affe, B wie Bär … Jeder sagt abwechselnd ein Tier zum nächsten Buchstaben."
    },
    {
      id: "sounds",
      title: "Geräusch-Raten",
      text:
        "Einer macht ein leises Geräusch im Auto (rascheln, trommeln, knipsen). Die anderen raten, was es war."
    },
    {
      id: "story-chain",
      title: "Geschichten-Staffel",
      text:
        "Jemand beginnt mit einem Satz. Reihum fügt jeder einen neuen Satz hinzu, bis eine verrückte Geschichte entsteht."
    },
    {
      id: "what-if",
      title: "Was-wäre-wenn-Fragen",
      text:
        "Stellt euch gegenseitig Fragen wie: „Was wäre, wenn unser Auto plötzlich fliegen könnte?“ Jeder darf kurz fantasieren."
    },
    {
      id: "destination-dream",
      title: "Traumziel",
      text:
        "Jeder beschreibt, wie es am perfekten Ausflugsziel aussieht – Geräusche, Gerüche, Farben. Ihr dürft euch alles wünschen."
    },
    {
      id: "word-chain",
      title: "Wörter-Kette",
      text:
        "Ein Wort beginnen, das nächste muss mit dem letzten Buchstaben starten. Wie lange schafft ihr die Kette, ohne zu stocken?"
    },
    {
      id: "three-items-story",
      title: "Drei-Dinge-Geschichte",
      text:
        "Einer nennt drei Dinge, z. B. Schildkröte, Regenbogen, Picknick. Alle überlegen gemeinsam eine kurze Geschichte dazu."
    }
  ],
  en: [
    {
      id: "spy",
      title: "I spy",
      text:
        "One person picks something outside and only says the colour. The others guess what it is."
    },
    {
      id: "plates",
      title: "Number plate bingo",
      text:
        "Everyone chooses two letters or numbers. Whoever spots all of theirs on licence plates first wins."
    },
    {
      id: "colors",
      title: "Colour hunt",
      text:
        "Choose a colour – for example red. Everyone looks out of the window: the first to find five red things wins."
    },
    {
      id: "alphabet-animals",
      title: "Animal alphabet",
      text:
        "Go through the alphabet: A for ant, B for bear … Everyone adds an animal for the next letter."
    },
    {
      id: "sounds",
      title: "Guess the sound",
      text:
        "One player makes a soft sound in the car (rustling, tapping, clicking). The others guess what it was."
    },
    {
      id: "story-chain",
      title: "Story chain",
      text:
        "Someone starts with one sentence. Everyone adds a sentence in turn until a funny story appears."
    },
    {
      id: "what-if",
      title: "What if …?",
      text:
        "Ask each other questions like: “What if our car could suddenly fly?” Everyone can imagine a short answer."
    },
    {
      id: "destination-dream",
      title: "Dream destination",
      text:
        "Everyone describes what the perfect place at the end of the journey looks like – sounds, smells, colours."
    },
    {
      id: "word-chain",
      title: "Word chain",
      text:
        "Start with one word, the next word has to begin with the last letter. How long can you keep the chain going?"
    },
    {
      id: "three-items-story",
      title: "Three-things story",
      text:
        "One player names three things, e.g. turtle, rainbow, picnic. Together you invent a short story including all three."
    }
  ]
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
    this.state = "intro"; // intro | first-start | everyday | trip | plus | daylog | fav-added | fav-removed | no-spots
    this.travelMode = "everyday"; // everyday | trip | null
    this.lastInteraction = Date.now();

    // Merkt sich, welcher Variant-Index zuletzt für einen Key genutzt wurde,
    // damit nicht permanent derselbe Satz wiederholt wird.
    this._lastVariantIndex = {};

    // Prüfen, ob das der erste App-Start ist
    this._maybeSetFirstStartState();

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
   * Reise-Modus gesetzt (everyday | trip | null).
   * Bei null kehrt Tilla in den Intro-Zustand zurück.
   */
  setTravelMode(mode) {
    if (!this.textEl) return;

    if (mode === null || mode === undefined) {
      this.travelMode = null;
      this.state = "intro";
      this.lastInteraction = Date.now();
      this._renderState();
      return;
    }

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

  /**
   * Kompass wurde angewendet – Tilla kommentiert die Auswahl kurz.
   * @param {{travelMode?: string|null, mood?: string|null, radiusStep?: number}} context
   */
  onCompassApplied(context = {}) {
    if (!this.textEl) return;

    this.lastInteraction = Date.now();

    const mode = context.travelMode ?? this.travelMode;
    const key =
      mode === "trip" ? "turtle_compass_trip" : "turtle_compass_everyday";

    let text = this._t(key);

    // Bei Reise-Modus kann optional auch hier eine Spielidee angehängt werden
    if (mode === "trip") {
      const gameSnippet = this._getTravelGameSnippet();
      if (gameSnippet) text += " " + gameSnippet;
    }

    this.textEl.textContent = text;

    // State sanft anpassen
    if (mode === "trip") {
      this.state = "trip";
      this.travelMode = "trip";
    } else if (mode === "everyday" || mode == null) {
      this.state = "everyday";
      if (mode) this.travelMode = mode;
    }
  }

  // --------------------------------------------------
  // Interne Helfer
  // --------------------------------------------------

  /**
   * Prüft, ob es der erste Start ist – dann wird ein spezieller
   * Begrüßungstext gezeigt.
   */
  _maybeSetFirstStartState() {
    const STORAGE_KEY = "fs_tilla_first_start_v1";
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
        this.state = "first-start";
      }
    } catch (err) {
      // Wenn localStorage nicht geht (Privacy-Mode etc.), einfach still weitermachen.
    }
  }

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
        // Nur akzeptieren, wenn es NICHT einfach wieder der Key selbst ist
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

  /**
   * Liefert einen kurzen Text mit einer Spielidee für unterwegs.
   * Nutzt TRAVEL_GAMES[lang] und vermeidet Wiederholungen direkt
   * hintereinander.
   */
  _getTravelGameSnippet() {
    const lang = getCurrentLang();
    const list = TRAVEL_GAMES[lang] || TRAVEL_GAMES.de;
    if (!list || !list.length) return "";

    const key = "travel_game";
    const lastIndex = this._lastVariantIndex[key];

    let index;
    if (list.length === 1) {
      index = 0;
    } else {
      do {
        index = Math.floor(Math.random() * list.length);
      } while (index === lastIndex);
    }

    this._lastVariantIndex[key] = index;

    const game = list[index];
    if (!game) return "";

    if (lang === "de") {
      return `Kleine Spielidee für unterwegs: ${game.title} – ${game.text}`;
    } else {
      return `Little travel game for the road: ${game.title} – ${game.text}`;
    }
  }

  _renderState() {
    if (!this.textEl) return;

    let text = "";

    switch (this.state) {
      case "first-start": {
        // Spezielle erste Begrüßung
        text = this._t("turtle_first_start");
        break;
      }

      case "intro": {
        // Warmes Willkommen: Intro + je nach Reise-Modus
        const intro = this._t("turtle_intro_1");
        if (this.travelMode === "trip") {
          const base = this._t("turtle_trip_mode");
          const gameSnippet = this._getTravelGameSnippet();
          text = intro + " " + base + (gameSnippet ? " " + gameSnippet : "");
        } else if (this.travelMode === "everyday") {
          text = intro + " " + this._t("turtle_everyday_mode");
        } else {
          text = intro;
        }
        break;
      }

      case "everyday": {
        // Alltag: Fokus auf Mikro-Abenteuer in der Nähe
        text = this._t("turtle_everyday_mode");
        break;
      }

      case "trip": {
        // Unterwegs: Fokus auf Zwischenstopps + Spielidee
        const base = this._t("turtle_trip_mode");
        const gameSnippet = this._getTravelGameSnippet();
        text = base + (gameSnippet ? " " + gameSnippet : "");
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
          const base = this._t("turtle_trip_mode");
          const gameSnippet = this._getTravelGameSnippet();
          text = intro + " " + base + (gameSnippet ? " " + gameSnippet : "");
        } else if (this.travelMode === "everyday") {
          text = intro + " " + this._t("turtle_everyday_mode");
        } else {
          text = intro;
        }
      }
    }

    this.textEl.textContent = text;
  }
}