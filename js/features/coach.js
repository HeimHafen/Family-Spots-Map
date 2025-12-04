// js/features/coach.js
// Logik für den Familien-Kompass / "Mini-Life-Coach"

import { getLanguage } from "../core/i18n.js";

// Muss mit filters.js synchron sein
const RADIUS_LEVELS_KM = [5, 15, 30, 60, null];

function getLanguageInfo() {
  const lang = (getLanguage && getLanguage()) || "de";
  const lower = String(lang).toLowerCase();
  const isDe = lower.startsWith("de");
  const isDa = lower.startsWith("da");
  return { lang: lower, isDe, isDa };
}

function describeRadius(radiusIndex) {
  const { isDe, isDa } = getLanguageInfo();

  const idx =
    typeof radiusIndex === "number" && radiusIndex >= 0 && radiusIndex <= 4
      ? radiusIndex
      : 4;

  const radiusKm = RADIUS_LEVELS_KM[idx];

  if (radiusKm == null) {
    if (isDe) {
      return "ohne Radiusbegrenzung – ihr könnt auch große Abenteuer anschauen";
    }
    if (isDa) {
      return "uden radiusbegrænsning – I kan også kigge på de store eventyr";
    }
    return "without radius limit – you can also explore bigger adventures";
  }

  if (radiusKm <= 6) {
    if (isDe) {
      return "ganz in eurer Nähe, perfekt für ein kleines Micro-Abenteuer";
    }
    if (isDa) {
      return "helt tæt på jer, perfekt til et lille mikroeventyr";
    }
    return "very close by, perfect for a small micro-adventure";
  }
  if (radiusKm <= 20) {
    if (isDe) {
      return "im bequemen Umkreis, gut für Alltag und kurze Ausflüge";
    }
    if (isDa) {
      return "i behagelig afstand, godt til hverdagen og korte ture";
    }
    return "in a comfortable radius, great for everyday and short trips";
  }
  if (radiusKm <= 40) {
    if (isDe) {
      return "mit etwas Fahrtzeit – ideal für einen halben Tag";
    }
    if (isDa) {
      return "med lidt køretid – ideelt til en halv dag";
    }
    return "with a bit of travel – ideal for a half-day adventure";
  }

  if (isDe) {
    return "etwas weiter weg – ein Ausflug, der sich für einen ganzen Tag lohnt";
  }
  if (isDa) {
    return "lidt længere væk – en tur, der er værd at bruge en hel dag på";
  }
  return "a bit further away – a trip that’s worth a full day";
}

export function buildCompassMessage(filters, extras = {}) {
  const { isDe, isDa } = getLanguageInfo();

  if (!filters) {
    if (isDe) {
      return "Der Familien-Kompass hilft euch, aus allen Spots die zu eurer Energie und eurem Alltag passenden Abenteuer zu finden.";
    }
    if (isDa) {
      return "Familiekompasset hjælper jer med at finde de oplevelser, der passer til jeres energi og jeres hverdag.";
    }
    return "The family compass helps you find adventures that match your energy and everyday rhythm.";
  }

  const {
    mood,
    travelMode,
    ageGroup = "all",
    radiusIndex = 4,
    favoritesOnly
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
      if (isDe) {
        return "Zeige euch eure Lieblingsspots ohne weitere Filter. Ihr könnt Stimmung, Reise-Modus oder Radius ergänzen, um Inspiration für heute zu bekommen.";
      }
      if (isDa) {
        return "Viser jer jeres yndlingsspots uden ekstra filtre. I kan tilføje humør, rejsemåde eller radius for at få inspiration til i dag.";
      }
      return "Showing your favourite spots without extra filters. Add mood, travel mode or radius for inspiration for today.";
    }

    if (isDe) {
      return "Wählt eine Stimmung, einen Reise-Modus oder einen Radius – der Familien-Kompass sortiert die Karte dann so, dass die passendsten Spots oben stehen.";
    }
    if (isDa) {
      return "Vælg et humør, en rejsemåde eller en radius – så sorterer familiekompasset kortet, så de mest passende spots står øverst.";
    }
    return "Choose a mood, a travel mode or a radius – the family compass will then sort the map so the most fitting spots appear first.";
  }

  const parts = [];

  // Stimmung
  if (mood === "relaxed") {
    if (isDe) {
      parts.push(
        "Heute passt ein eher entspannter Spot: viel Luft zum Durchatmen, genug Platz für alle und kein Leistungsdruck."
      );
    } else if (isDa) {
      parts.push(
        "I dag passer et mere afslappet sted: god plads til at trække vejret, plads til alle og uden præstationspres."
      );
    } else {
      parts.push(
        "Today calls for a relaxed spot: space to breathe, enough room for everyone and no pressure to perform."
      );
    }
  } else if (mood === "action") {
    if (isDe) {
      parts.push(
        "Ihr habt Lust auf Action: Orte mit Bewegung, Klettern und ordentlich Auspowern stehen im Vordergrund."
      );
    } else if (isDa) {
      parts.push(
        "I har lyst til action: steder med bevægelse, klatring og mulighed for at få brugt en masse energi er i fokus."
      );
    } else {
      parts.push(
        "You’re in the mood for action: places with movement, climbing and plenty of energy are in focus."
      );
    }
  } else if (mood === "water") {
    if (isDe) {
      parts.push(
        "Etwas mit Wasser wäre heute schön: Matschhosen erlaubt, nasse Haare ausdrücklich erwünscht."
      );
    } else if (isDa) {
      parts.push(
        "Noget med vand ville være dejligt i dag: mudrede bukser er tilladt, våde hårstrå er direkte ønsket."
      );
    } else {
      parts.push(
        "Something with water sounds great today: muddy trousers allowed, wet hair encouraged."
      );
    }
  } else if (mood === "animals") {
    if (isDe) {
      parts.push(
        "Heute dürfen Tiere eine Rolle spielen: vom kleinen Bauernhof bis zum großen Wildpark."
      );
    } else if (isDa) {
      parts.push(
        "I dag må dyr gerne spille hovedrollen: fra lille bondegård til stor vildtpark."
      );
    } else {
      parts.push(
        "Today animals should be part of the day: from small farms to large wildlife parks."
      );
    }
  }

  // Reise-Modus
  if (travelMode === "everyday") {
    if (isDe) {
      parts.push(
        "Der Kompass sucht Spots, die gut in euren Alltag passen – auch nach Arbeit oder Kita noch machbar."
      );
    } else if (isDa) {
      parts.push(
        "Kompasset søger spots, der passer godt ind i hverdagen – også noget, der kan lade sig gøre efter arbejde eller institution."
      );
    } else {
      parts.push(
        "The compass looks for spots that fit easily into everyday life – also doable after work or daycare."
      );
    }
  } else if (travelMode === "trip") {
    if (isDe) {
      parts.push(
        "Ihr seid unterwegs: Die Vorschläge passen zu Touren mit Auto, Camper oder Bahn und dürfen auch mal etwas weiter weg liegen."
      );
    } else if (isDa) {
      parts.push(
        "I er på tur: Forslagene passer til ture med bil, camper eller tog og må gerne ligge lidt længere væk."
      );
    } else {
      parts.push(
        "You’re on the road: suggestions are chosen for trips by car, camper or train and can be a little further away."
      );
    }
  }

  // Altersgruppe
  if (ageGroup === "0-3") {
    if (isDe) {
      parts.push(
        "Der Fokus liegt auf den Kleinsten – kurze Wege, sichere Ecken zum Ankommen und Orte, an denen niemand komisch schaut, wenn es mal laut wird."
      );
    } else if (isDa) {
      parts.push(
        "Fokus er på de allermindste – korte afstande, trygge hjørner at lande i og steder, hvor ingen ser skævt til, hvis det bliver lidt højt."
      );
    } else {
      parts.push(
        "The focus is on the littlest ones – short distances, safe corners to arrive and places where nobody minds if it gets loud."
      );
    }
  } else if (ageGroup === "4-9") {
    if (isDe) {
      parts.push(
        "Ideal für neugierige Entdecker:innen: genug zu klettern, rennen und ausprobieren – ohne dass es gleich zu viel wird."
      );
    } else if (isDa) {
      parts.push(
        "Ideelt til nysgerrige opdagere: nok at klatre på, løbe og prøve af – uden at det bliver for meget."
      );
    } else {
      parts.push(
        "Ideal for curious explorers: enough to climb, run and try out – without it becoming overwhelming."
      );
    }
  } else if (ageGroup === "10+") {
    if (isDe) {
      parts.push(
        "Eure Großen wollen mitbestimmen: Der Kompass bevorzugt Spots, die sich auch für größere Kinder spannend anfühlen."
      );
    } else if (isDa) {
      parts.push(
        "De store vil også have indflydelse: Kompasset prioriterer spots, der også føles spændende for større børn."
      );
    } else {
      parts.push(
        "Your older kids want a say: the compass prefers spots that also feel exciting for bigger kids."
      );
    }
  }

  // Radius
  if (isDe) {
    parts.push(
      `Der Radius ist gerade so eingestellt: ${describeRadius(radiusIndex)}.`
    );
  } else if (isDa) {
    parts.push(
      `Lige nu er radius indstillet sådan her: ${describeRadius(radiusIndex)}.`
    );
  } else {
    parts.push(
      `Your radius is set like this: ${describeRadius(radiusIndex)}.`
    );
  }

  // Favoriten / Ergebnis-Anzahl
  if (favoritesOnly && favoritesCount > 0) {
    if (isDe) {
      parts.push(
        `Aktuell seht ihr nur eure Lieblingsspots – ${filteredCount} davon passen gerade zu euren Filtern.`
      );
    } else if (isDa) {
      parts.push(
        `Lige nu ser I kun jeres yndlingsspots – ${filteredCount} af dem passer til jeres nuværende filtre.`
      );
    } else {
      parts.push(
        `Right now you only see your favourite spots – ${filteredCount} of them match your filters.`
      );
    }
  } else if (filteredCount === 0) {
    if (isDe) {
      parts.push(
        "Mit dieser Kombination gibt es gerade keinen passenden Spot. Vielleicht hilft es, Radius oder Stimmung etwas weiter zu fassen."
      );
    } else if (isDa) {
      parts.push(
        "Med den her kombination er der ingen passende spots lige nu. Måske hjælper det at gøre radius eller humør lidt bredere."
      );
    } else {
      parts.push(
        "With this combination there are no matching spots right now. Try relaxing radius or mood a little."
      );
    }
  } else if (filteredCount === 1) {
    if (isDe) {
      parts.push(
        "Aktuell passt genau ein Spot besonders gut zu euch – manchmal reicht genau das für einen richtig guten Tag."
      );
    } else if (isDa) {
      parts.push(
        "Lige nu passer ét spot særligt godt til jer – nogle gange er det præcis dét, der skal til for en virkelig god dag."
      );
    } else {
      parts.push(
        "Right now exactly one spot fits you really well – sometimes that’s all you need for a really good day."
      );
    }
  } else {
    if (isDe) {
      parts.push(
        `Insgesamt passen gerade ${filteredCount} Spots gut zu euren Einstellungen – oben in der Liste starten die besten Matches.`
      );
    } else if (isDa) {
      parts.push(
        `I alt passer ${filteredCount} spots godt til jeres indstillinger lige nu – de bedste matches ligger øverst på listen.`
      );
    } else {
      parts.push(
        `In total, ${filteredCount} spots currently fit your settings well – the best matches start at the top of the list.`
      );
    }
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