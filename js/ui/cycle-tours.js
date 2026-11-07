import { trackPoints } from "./stroebeck-track.js";

const photo = "assets/spots/schachplatz-stroebeck/schachplatz.webp";
const source = "https://www.strava.com/routes/3247495945863738730";
const credit = '<a href="https://commons.wikimedia.org/wiki/File:Schachplatz_(Str%C3%B6beck)_P1130227.jpg">Goldmull / Wikimedia Commons</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>';
const icons = {
  bike: '<circle cx="5" cy="17" r="4"/><circle cx="19" cy="17" r="4"/><path d="m5 17 4-8 5 8H5m9 0 3-10h2M7 9h5"/>',
  tent: '<path d="M3 20 12 4l9 16H3Zm6 0 3-6 3 6"/>',
  pin: '<path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  hills: '<path d="m2 19 7-10 4 5 3-8 6 13H2Z"/>',
  route: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h8a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h8"/>',
};
const icon = name => `<svg class="cycle-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
const elevation = { de: "Ca. 123 hm", en: "Approx. 123 m ascent", da: "Ca. 123 højdemeter" };
// Curated places in riding order. Source links stay available independently of the GPX.
export const schachplatzNearbyStops = {
  park: {
    title: "Europapark Ströbeck",
    url: "https://www.halberstadt.de/de/wichtige-orte-und-sehenswuerdigkeiten/europapark.html",
    text: {
      de: "Bäume aus Europas Kulturdörfern entdecken · ca. 200 m vom Schachplatz",
      en: "Discover trees representing European cultural villages · approx. 200 m from the chess square",
      da: "Oplev træer fra Europas kulturlandsbyer · ca. 200 m fra skakpladsen",
    },
  },
  cafe: {
    title: "Hofcafé Gut Mahndorf",
    url: "https://www.gut-mahndorf.de/hofcafe/",
    text: {
      de: "Hausgebackener Kuchen auf dem Rückweg · Öffnungszeiten beim Hofcafé",
      en: "Homemade cake on the way back · check opening times with the café",
      da: "Hjemmebagt kage på vejen tilbage · se caféens åbningstider",
    },
  },
};
const copy = {
  de: ["Radtouren & Bikepacking", "Entdeckt Ausflugsziele entlang eurer nächsten Radtour.", "Familienradtouren", "Bikepacking", "Deutschland", "Dänemark", "Mit dem Rad ins Schachdorf", "Ca. 23 km · Rundtour", "Von Halberstadt nach Ströbeck und zurück.", "Hier sind noch keine Touren eingetragen.", "Zur Übersicht", "Streckenverlauf", "Unterwegs entdecken", "Optionaler Stopp in Ströbeck", "Originalroute ansehen", "Veranstaltungsstrecke von 2025 · ProSport Harz", "Schließen", "Bildzuschnitt"],
  en: ["Cycle tours & bikepacking", "Discover places to visit along your next ride.", "Family rides", "Bikepacking", "Germany", "Denmark", "Ride to the chess village", "Approx. 23 km · Loop", "From Halberstadt to Ströbeck and back.", "There are no rides listed here yet.", "Back to tours", "Route outline", "Discover along the way", "Optional stop in Ströbeck", "View original route", "2025 event route · ProSport Harz", "Close", "Cropped photo"],
  da: ["Cykelture og bikepacking", "Find steder at besøge på jeres næste cykeltur.", "Familiecykelture", "Bikepacking", "Tyskland", "Danmark", "På cykel til skaklandsbyen", "Ca. 23 km · Rundtur", "Fra Halberstadt til Ströbeck og tilbage.", "Der er endnu ingen ture her.", "Tilbage til oversigten", "Ruteforløb", "Oplev undervejs", "Valgfrit stop i Ströbeck", "Se den originale rute", "Eventrute fra 2025 · ProSport Harz", "Luk", "Beskåret foto"],
};

export function initCycleTours({ getLanguage, closeMenu, openStop }) {
  const trigger = document.getElementById("btn-cycle-tours");
  if (!trigger) return;
  const dialog = document.createElement("dialog");
  dialog.className = "fsm-cycle-tours";
  dialog.setAttribute("aria-labelledby", "cycle-tours-heading");
  document.body.append(dialog);
  let type = "family";
  let country = "DE";
  let detail = false;

  function render(focusTarget) {
    const [title, intro, family, bikepacking, germany, denmark, name, metrics, description, empty, back, outline, discover, stopHint, original, provenance, close, crop] = copy[getLanguage()] || copy.de;
    const filters = '<div class="cycle-filters">' +
      [["family", family], ["bike", bikepacking]].map(([value, label]) =>
        `<button type="button" data-type="${value}" aria-pressed="${type === value}">${icon(value === "family" ? "bike" : "tent")}${label}</button>`).join("") +
      [["DE", germany], ["DK", denmark]].map(([value, label]) =>
        `<button type="button" data-country="${value}" aria-pressed="${country === value}">${icon("pin")}${label}</button>`).join("") +
      "</div>";
    const row = `<button type="button" class="cycle-card" data-detail>
      <img src="${photo}" alt="" width="470" height="470">
      <span><strong>${name}</strong><small>${metrics}</small><span>${description}</span><em>${family}</em></span>
      <span aria-hidden="true">›</span>
    </button><p class="cycle-credit">${credit} · ${crop}</p>`;
    const route = `<button class="cycle-back" type="button" data-back>‹ ${back}</button>
      <h2 id="cycle-tours-heading" tabindex="-1">${icon("bike")}<span>${name}</span></h2>
      <div class="cycle-meta"><span>${icon("route")}${metrics}</span><span>${icon("hills")}${elevation[getLanguage()] || elevation.de}</span></div>
      <svg class="cycle-map" viewBox="0 0 375 320" role="img" aria-label="${outline}">
        <path d="M0 40 55 19 108 26 119 66 82 97 0 114Z M375 75 320 59 285 89 310 131 375 122Z M5 235 75 222 105 267 78 320H0Z M375 259 311 230 256 267 269 320H375Z" fill="#dce8c7"/>
        <polyline points="${trackPoints.map(point => point.join(",")).join(" ")}" />
        <circle cx="${trackPoints[0][0]}" cy="${trackPoints[0][1]}" r="9"/><text class="cycle-map-number" x="${trackPoints[0][0]}" y="${trackPoints[0][1]}">1</text>
        <circle cx="29.7" cy="139.3" r="9"/><text class="cycle-map-number" x="29.7" y="139.3">2</text><text x="244" y="231">Halberstadt</text><text x="16" y="170">Ströbeck</text>
      </svg>
      <h3>${icon("pin")}${discover}</h3>
      <button type="button" class="cycle-stop" data-stop><img src="${photo}" alt="" width="470" height="470"><span><strong>Platz am Schachspiel</strong><small>${stopHint}</small></span><span aria-hidden="true">›</span></button>
      ${Object.values(schachplatzNearbyStops).map(stop => `<a class="cycle-stop cycle-nearby" href="${stop.url}" target="_blank" rel="noopener noreferrer">${icon("pin")}<span><strong>${stop.title}</strong><small>${stop.text[getLanguage()] || stop.text.de}</small></span><span aria-hidden="true">↗</span></a>`).join("")}
      <a class="cycle-action" href="${source}" target="_blank" rel="noopener noreferrer">${icon("route")}${original} ↗</a>
      <p class="cycle-credit">${provenance} · OpenStreetMap contributors</p>`;
    dialog.innerHTML = `<header><span>Family Spots Map</span><button type="button" aria-label="${close}" data-close>×</button></header><div class="cycle-content">${detail ? route :
      `<h2 id="cycle-tours-heading" tabindex="-1">${icon("bike")}<span>${title}</span></h2><p>${intro}</p>${filters}${type === "family" && country === "DE" ? row : `<p class="cycle-empty">${empty}</p>`}`}</div>`;
    if (focusTarget) dialog.querySelector(focusTarget)?.focus();
    dialog.scrollTop = 0;
  }

  trigger.addEventListener("click", () => {
    closeMenu();
    detail = false;
    render();
    dialog.showModal();
    dialog.querySelector("#cycle-tours-heading").focus();
  });
  dialog.addEventListener("close", () => {
    if (!document.activeElement || document.activeElement === document.body) document.getElementById("menu-toggle")?.focus({preventScroll: true});
  });
  dialog.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.hasAttribute("data-close")) dialog.close();
    if (button.dataset.type) {
      type = button.dataset.type;
      render(`[data-type="${type}"]`);
    }
    if (button.dataset.country) {
      country = button.dataset.country;
      render(`[data-country="${country}"]`);
    }
    if (button.hasAttribute("data-detail")) {
      detail = true;
      render("#cycle-tours-heading");
    }
    if (button.hasAttribute("data-back")) {
      detail = false;
      render("[data-detail]");
    }
    if (button.hasAttribute("data-stop") && openStop(() => dialog.close())) return;
  });
}
