// js/tilla.js
// Tilla – eure kleine Begleiterin in der App.
// Steuert, was Tilla im Sidebar-Kärtchen sagt.

import { getLanguage, t } from "./i18n.js";

/**
 * Zentraler Tilla-Helfer – aktualisiert den Text im Sidebar-Kärtchen.
 */
export function showTillaMessage(text) {
  if (!text) return;
  const el = document.getElementById("tilla-sidebar-text");
  if (!el) return;

  // Duplikate vermeiden – Tilla soll nicht dauernd denselben Satz neu schreiben
  if (el.dataset.lastMessage === text) return;

  el.textContent = text;
  el.dataset.lastMessage = text;
}

let initialized = false;

export function initTilla() {
  if (initialized) return;
  initialized = true;

  // Reise-Modus (Alltag / Unterwegs) aus filters.js
  document.addEventListener("fsm:travelModeChanged", (event) => {
    const mode = event && event.detail ? event.detail.mode : null;
    handleTravelModeChange(mode);
  });

  // Fallback: Begrüßung, falls das Kärtchen noch leer ist
  const lang = getLanguage() || "de";
  const isDe = lang.startsWith("de");
  const intro = t(
    "turtle_intro_1",
    isDe
      ? "Hallo, ich bin Tilla – eure Schildkröten-Begleiterin für entspannte Familien-Abenteuer!"
      : "Hi, I’m Tilla – your turtle companion for slow & relaxed family adventures!"
  );
  showTillaMessage(intro);
}

function handleTravelModeChange(mode) {
  const lang = getLanguage() || "de";
  const isDe = lang.startsWith("de");

  let key;
  let fallback;

  if (!mode) {
    key = "turtle_intro_1";
    fallback = isDe
      ? "Hallo, ich bin Tilla – eure Schildkröten-Begleiterin für entspannte Familien-Abenteuer!"
      : "Hi, I’m Tilla – your turtle companion for slow & relaxed family adventures!";
  } else if (mode === "everyday") {
    key = "turtle_everyday_mode";
    fallback = isDe
      ? "Alltag darf auch leicht sein. Lass uns schauen, was in eurer Nähe ein Lächeln zaubert. 🌿"
      : "Everyday life can feel light, too. Let’s see what nearby spot can bring a smile today. 🌿";
  } else if (mode === "trip") {
    key = "turtle_trip_mode";
    fallback = isDe
      ? "Ihr seid unterwegs – ich halte Ausschau nach guten Zwischenstopps für euch. 🚐"
      : "You’re on the road – I’ll watch out for good stopovers for you. 🚐";
  }

  if (!key) return;
  const text = t(key, fallback);
  showTillaMessage(text);
}

// ---- Domain-Aktionen, die Tilla kommentiert ----

export function onDaylogSaved() {
  const lang = getLanguage() || "de";
  const isDe = lang.startsWith("de");
  const text = t(
    "turtle_after_daylog_save",
    isDe
      ? "Schön, dass ihr euren Tag festhaltet. Solche kleinen Notizen werden später zu großen Erinnerungen. 💛"
      : "Nice that you captured your day. These small notes turn into big memories later. 💛"
  );
  showTillaMessage(text);
}

export function onFavoriteAdded() {
  const lang = getLanguage() || "de";
  const isDe = lang.startsWith("de");
  const text = t(
    "turtle_after_fav_added",
    isDe
      ? "Diesen Ort merkt ihr euch – eine kleine Perle auf eurer Familienkarte. ⭐"
      : "You’ve saved this place – a small gem on your family map. ⭐"
  );
  showTillaMessage(text);
}

export function onFavoriteRemoved() {
  const lang = getLanguage() || "de";
  const isDe = lang.startsWith("de");
  const text = t(
    "turtle_after_fav_removed",
    isDe
      ? "Alles gut – manchmal passen Orte nur zu bestimmten Phasen. Ich helfe euch, neue zu finden. 🐢"
      : "All good – some places only fit certain phases. I’ll help you find new ones. 🐢"
  );
  showTillaMessage(text);
}

export function onPlusActivated() {
  const lang = getLanguage() || "de";
  const isDe = lang.startsWith("de");
  const text = t(
    "turtle_plus_activated",
    isDe
      ? "Family Spots Plus ist aktiv – jetzt entdecke ich auch Rastplätze, Stellplätze und Camping-Spots für euch. ✨"
      : "Family Spots Plus is active – I can now show you rest areas, RV spots and campgrounds as well. ✨"
  );
  showTillaMessage(text);
}