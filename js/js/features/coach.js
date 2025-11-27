// js/features/coach.js
// Logik für den Familien-Kompass / "Mini-Life-Coach"

import { getLanguage } from "../core/i18n.js";

// Muss mit filters.js synchron sein
const RADIUS_LEVELS_KM = [5, 15, 30, 60, null];

function getLanguageInfo() {
  const lang = (getLanguage && getLanguage()) || "de";
  const isDe = lang.toLowerCase().startsWith("de");
  return { lang, isDe };
}

function describeRadius(radiusIndex) {
  const { isDe } = getLanguageInfo();

  const idx = typeof radiusIndex === "number" && radiusIndex >= 0 && radiusIndex <= 4
    ? radiusIndex
    : 4;

  const radiusKm = RADIUS_LEVELS_KM[idx];

  if (radiusKm == null) {
    return isDe
      ? "ohne Radiusbegrenzung – ihr könnt auch große Abenteuer anschauen"
      : "without radius limit – you can also explore bigger adventures";
  }

  if (radiusKm <= 6) {
    return isDe
      ? "ganz in eurer Nähe, perfekt für ein kleines Micro-Abenteuer"
      : "very close by, perfect for a small micro-adventure";
  }
  if (radiusKm <= 20) {
    return isDe
      ? "im bequemen Umkreis, gut für Alltag und kurze Ausflüge"
      : "in a comfortable radius, great for everyday and short trips";
  }
  if (radiusKm <= 40) {
    return isDe
      ? "mit etwas Fahrtzeit – ideal für einen halben Tag"
      : "with a bit of travel – ideal for a half-day adventure";
  }

  return isDe
    ? "etwas weiter weg – ein Ausflug, der sich für einen ganzen Tag lohnt"
    : "a bit further away – a trip that’s worth a full day";
}

export function buildCompassMessage(filters, extras = {}) {
  const { isDe } = getLanguageInfo();

  if (!filters) {
    return isDe
      ? "Der Familien-Kompass hilft euch, aus allen Spots die zu eurer Energie und eurem Alltag passenden Abenteuer zu finden."
      : "The family compass helps you find adventures that match your energy and everyday rhythm.";
  }

  const {
    mood,
    travelMode,
    ageGroup = "all",
    radiusIndex = 4,
    favoritesOnly,
  } = filters;
  const { filteredCount = 0, favoritesCount = 0 } = extras;

  const nothingSelected =
    !mood &&
    !travelMode &&
    (ageGroup === "all" || !ageGroup) &&
    radiusIndex === 4 &&
    !favoritesOnly;

  if (nothingSelected) {
    if (favoritesOnly && favoritesCount > 0) {
      return isDe
        ? "Zeige euch eure Lieblingsspots ohne weitere Filter. Ihr könnt Stimmung, Reise-Modus oder Radius ergänzen, um Inspiration für heute zu bekommen."
        : "Showing your favourite spots without extra filters. Add mood, travel mode or radius for inspiration for today.";
    }

    return isDe
      ? "Wählt eine Stimmung, einen Reise-Modus oder einen Radius – der Familien-Kompass sortiert die Karte dann so, dass die passendsten Spots oben stehen."
      : "Choose a mood, a travel mode or a radius – the family compass will then sort the map so the most fitting spots appear first.";
  }

  const parts = [];

  if (mood === "relaxed") {
    parts.push(
      isDe
        ? "Heute passt ein eher entspannter Spot: viel Luft zum Durchatmen, genug Platz für alle und kein Leistungsdruck."
        : "Today calls for a relaxed spot: space to breathe, enough room for everyone and no pressure to perform.",
    );
  } else if (mood === "action") {
    parts.push(
      isDe
        ? "Ihr habt Lust auf Action: Orte mit Bewegung, Klettern und ordentlich Auspowern stehen im Vordergrund."
        : "You’re in the mood for action: places with movement, climbing and plenty of energy are in focus.",
    );
  } else if (mood === "water") {
    parts.push(
      isDe
        ? "Etwas mit Wasser wäre heute schön: Matschhosen erlaubt, nasse Haare ausdrücklich erwünscht."
        : "Something with water sounds great today: muddy trousers allowed, wet hair encouraged.",
    );
  } else if (mood === "animals") {
    parts.push(
      isDe
        ? "Heute dürfen Tiere eine Rolle spielen: vom kleinen Bauernhof bis zum großen Wildpark."
        : "Today animals should be part of the day: from small farms to large wildlife parks.",
    );
  }

  if (travelMode === "everyday") {
    parts.push(
      isDe
        ? "Der Kompass sucht Spots, die gut in euren Alltag passen – auch nach Arbeit oder Kita noch machbar."
        : "The compass looks for spots that fit easily into everyday life – also doable after work or daycare.",
    );
  } else if (travelMode === "trip") {
    parts.push(
      isDe
        ? "Ihr seid unterwegs: Die Vorschläge passen zu Touren mit Auto, Camper oder Bahn und dürfen auch mal etwas weiter weg liegen."
        : "You’re on the road: suggestions are chosen for trips by car, camper or train and can be a little further away.",
    );
  }

  if (ageGroup === "0-3") {
    parts.push(
      isDe
        ? "Der Fokus liegt auf den Kleinsten – kurze Wege, sichere Ecken zum Ankommen und Orte, an denen niemand komisch schaut, wenn es mal laut wird."
        : "The focus is on the littlest ones – short distances, safe corners to arrive and places where nobody minds if it gets loud.",
    );
  } else if (ageGroup === "4-9") {
    parts.push(
      isDe
        ? "Ideal für neugierige Entdecker:innen: genug zu klettern, rennen und ausprobieren – ohne dass es gleich zu viel wird."
        : "Ideal for curious explorers: enough to climb, run and try out – without it becoming overwhelming.",
    );
  } else if (ageGroup === "10+") {
    parts.push(
      isDe
        ? "Eure Großen wollen mitbestimmen: Der Kompass bevorzugt Spots, die sich auch für größere Kinder spannend anfühlen."
        : "Your older kids want a say: the compass prefers spots that also feel exciting for bigger kids.",
    );
  }

  parts.push(
    isDe
      ? `Der Radius ist gerade so eingestellt: ${describeRadius(radiusIndex)}.`
      : `Your radius is set like this: ${describeRadius(radiusIndex)}.`,
  );

  if (favoritesOnly && favoritesCount > 0) {
    parts.push(
      isDe
        ? `Aktuell seht ihr nur eure Lieblingsspots – ${filteredCount} davon passen gerade zu euren Filtern.`
        : `Right now you only see your favourite spots – ${filteredCount} of them match your filters.`,
    );
  } else if (filteredCount === 0) {
    parts.push(
      isDe
        ? "Mit dieser Kombination gibt es gerade keinen passenden Spot. Vielleicht hilft es, Radius oder Stimmung etwas weiter zu fassen."
        : "With this combination there are no matching spots right now. Try relaxing radius or mood a little.",
    );
  } else if (filteredCount === 1) {
    parts.push(
      isDe
        ? "Aktuell passt genau ein Spot besonders gut zu euch – manchmal reicht genau das für einen richtig guten Tag."
        : "Right now exactly one spot fits you really well – sometimes that’s all you need for a really good day.",
    );
  } else {
    parts.push(
      isDe
        ? `Insgesamt passen gerade ${filteredCount} Spots gut zu euren Einstellungen – oben in der Liste starten die besten Matches.`
        : `In total, ${filteredCount} spots currently fit your settings well – the best matches start at the top of the list.`,
    );
  }

  return parts.join(" ");
}

/**
 * Aktualisiert den DOM mit der Compass-Nachricht.
 */
export function updateCompassMessage(filters, extras = {}) {
  if (typeof document === "undefined") return;

  const section = document.getElementById("compass-section");
  if (!section) return;

  let messageEl = document.getElementById("compass-message");
  if (!messageEl) {
    messageEl = document.createElement("p");
    messageEl.id = "compass-message";
    messageEl.className = "compass-message";

    const helper = document.getElementById("compass-helper");
    if (helper && helper.parentElement === section) {
      helper.insertAdjacentElement("afterend", messageEl);
    } else {
      section.appendChild(messageEl);
    }
  }

  messageEl.textContent = buildCompassMessage(filters, extras);
}