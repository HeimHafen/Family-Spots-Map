// Geographic spot presentation. Text comes from the existing translated data.
import { getSpotName, getSpotId, getSpotCategorySlugs } from "../filters/tags.js?v=20261010-unified-4";

const paths = {
  animals: '<path fill="currentColor" stroke="none" d="M5 15c2-3 7-4 12-2l3-4 3-1 2 3-3 3-1 4-2 2-1 9h-2l-1-9h-5l-1 9H7l-1-10-2-1-2-4 2-1 1 2Z"/><path d="M21 9l-2-5m1 3-3-2m7 4 2-6m-1 3 4-2M7 19l-3 8m14-8 4 8"/>',
  play: '<path d="M7 28l5-19h5l7 19M10 16h8m-10 7h12M17 9l8 12 4 1M12 5h5"/>',
  water: '<path d="M5 11q5-5 10 0t10 0M5 18q5-5 10 0t10 0M5 25q5-5 10 0t10 0"/>',
  rv: '<path d="M4 24V10h18l6 7v7H4zm2-4h22M9 10v7h6v-7m7 0v7h6"/><circle cx="10" cy="25" r="3"/><circle cx="23" cy="25" r="3"/>',
  culture: '<path d="M4 11l12-7 12 7H4zm3 3v12m6-12v12m6-12v12m6-12v12M4 29h24"/>',
  food: '<path d="M7 4v8m4-8v8M5 4v8q0 4 4 4v13M24 4q-6 6-6 13h6V4zm0 13v12"/>',
  practical: '<circle cx="16" cy="6" r="3"/><path d="M11 29V17H7v-7h18v7h-4v12M16 17v12"/>',
  bike: '<circle cx="8" cy="23" r="6"/><circle cx="25" cy="23" r="6"/><path d="M8 23l6-13 7 13H8zm6-13h-4m10-5h5l-4 18"/>',
  nature: '<path d="M16 4L7 17h6L7 23h7v6h4v-6h7l-6-6h6L16 4z"/>',
  adventure: '<path d="M5 27l8-18 6 11 4-7 7 14H5zm6-14 2 3 2-3"/>'
};
const kinds = {
  animals: ["zoo", "tierpark", "wildpark", "bauernhof"],
  play: ["spielplatz", "abenteuerspielplatz", "indoor-spielplatz", "waldspielplatz", "wasserspielplatz", "bewegungspark", "bolzplatz", "pumptrack", "skatepark", "verkehrsgarten", "multifunktionsfeld"],
  water: ["schwimmbad", "badesee", "strand"],
  rv: ["stellplatz-spielplatz-naehe-kostenlos", "wohnmobil-service-station", "rastplatz-spielplatz-dusche", "campingplatz-familien"],
  culture: ["kinder-museum", "museum-kinder", "freilichtmuseum", "bibliothek"],
  food: ["familiencafe", "familien-restaurant", "kinder-familiencafe"],
  practical: ["oeffentliche-toilette", "wickelraum"],
  bike: ["radweg-family", "bikepacking-spot"],
  adventure: ["freizeitpark", "trampolinpark", "kletterhalle", "kletterwald-hochseilgarten", "boulderpark", "minigolf", "eisbahn", "rodelhuegel"]
};

function kindFor(spot) {
  const categories = getSpotCategorySlugs(spot);
  // The primary category decides; secondary playgrounds must not turn a zoo into a playground pin.
  const category = categories[0];
  for (const [kind, values] of Object.entries(kinds)) if (values.includes(category)) return kind;
  return "nature";
}

export function createSpotPin(spot) {
  const node = document.createElement("div");
  node.className = "fsm-spot-pin";
  const art = document.createElement("span");
  art.className = "fsm-spot-pin__art";
  art.setAttribute("aria-hidden", "true");
  // Only our fixed SVG paths enter innerHTML; all spot data enters textContent.
  art.innerHTML = `<svg viewBox="0 0 44 52" focusable="false"><path class="fsm-spot-pin__shape" d="M22 50C15 41 2 30 2 21a20 20 0 0 1 40 0c0 9-13 20-20 29Z"/><g transform="translate(8 7) scale(.875)" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${paths[kindFor(spot)]}</g></svg>`;
  const label = document.createElement("span");
  label.className = "fsm-spot-pin__name";
  label.setAttribute("aria-hidden", "true");
  label.textContent = getSpotName(spot);
  node.append(art, label);
  return node;
}

const copy = {
  de: {open: "Spot ansehen", close: "Vorschau schließen", free: "Kostenlos"},
  en: {open: "View spot", close: "Close preview", free: "Free"},
  da: {open: "Se spot", close: "Luk forhåndsvisning", free: "Gratis"}
};

export function createSpotPreview(spot, { lang, metaParts, onOpen, onClose }) {
  const labels = copy[lang] || copy.de;
  const card = document.createElement("section");
  card.className = "fsm-spot-preview";
  const title = document.createElement("h3");
  title.id = "fsm-map-preview-title";
  title.textContent = getSpotName(spot);
  card.setAttribute("aria-labelledby", title.id);
  const close = document.createElement("button");
  close.type = "button";
  close.className = "fsm-spot-preview__close";
  close.setAttribute("aria-label", labels.close);
  close.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg>';
  close.addEventListener("click", onClose);
  card.append(title, close);
  const parts = (metaParts || []).filter(part => part && part !== spot.city).slice(0, 2);
  if (parts.length) {
    const meta = document.createElement("p");
    meta.className = "fsm-spot-preview__meta";
    meta.textContent = parts.join(" · ");
    card.appendChild(meta);
  }
  if (Array.isArray(spot.tags) && spot.tags.includes("free")) {
    const free = document.createElement("span");
    free.className = "fsm-spot-preview__free";
    free.textContent = labels.free;
    card.appendChild(free);
  }
  const summaryText = spot[`summary_${lang}`] || spot.summary;
  if (summaryText) {
    const summary = document.createElement("p");
    summary.className = "fsm-spot-preview__summary";
    summary.textContent = summaryText;
    card.appendChild(summary);
  }
  const open = document.createElement("button");
  open.type = "button";
  open.className = "fsm-spot-preview__open";
  open.textContent = labels.open;
  const arrow = document.createElement("span");
  arrow.setAttribute("aria-hidden", "true");
  arrow.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="m9 5 7 7-7 7"/></svg>';
  open.appendChild(arrow);
  open.addEventListener("click", () => onOpen(open));
  card.appendChild(open);
  return card;
}

const mapStates = new WeakMap();
const overlap = (a, b) => a.left < b.right + 6 && a.right + 6 > b.left && a.top < b.bottom + 6 && a.bottom + 6 > b.top;

// Labels use the existing marker DOM, not a second clickable geographic layer.
// Reserve all pin hit areas and visible controls; try right then left and suppress collisions.
export function attachSpotLabels(map) {
  const state = { markers: [], frame: null, schedule: null };
  function update() {
    state.frame = null;
    const container = map.getContainer();
    const bounds = container.getBoundingClientRect();
    const size = map.getSize();
    const entries = state.markers.map(marker => ({ marker, el: marker.getElement?.() })).filter(entry => entry.el?.isConnected);
    for (const { marker } of entries) {
      const popup = marker.getPopup();
      const maxWidth = Math.min(300, Math.max(190, size.x - 60));
      const maxHeight = Math.max(100, Math.min(300, size.y - 110));
      if (popup && (popup.options.maxWidth !== maxWidth || popup.options.maxHeight !== maxHeight)) {
        popup.options.maxWidth = maxWidth;
        popup.options.maxHeight = maxHeight;
        if (marker.isPopupOpen()) popup.update();
      }
    }
    const reserved = entries.map(({ marker }) => {
      const p = map.latLngToContainerPoint(marker.getLatLng());
      return {marker, left: p.x - 22, right: p.x + 22, top: p.y - 52, bottom: p.y};
    });
    container.querySelectorAll(".leaflet-control, .leaflet-popup, .marker-cluster, .fsm-map-offline-status").forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.width && r.height) reserved.push({left: r.left - bounds.left, right: r.right - bounds.left, top: r.top - bounds.top, bottom: r.bottom - bounds.top});
    });
    entries.sort((a, b) => {
      const focused = entry => entry.marker.isPopupOpen() ? 0 : entry.el === document.activeElement ? 1 : 2;
      return focused(a) - focused(b) || String(a.marker._fsmSpotId).localeCompare(String(b.marker._fsmSpotId));
    });
    for (const { marker, el } of entries) {
      const label = el.querySelector(".fsm-spot-pin__name");
      if (!label) continue;
      el.classList.remove("fsm-label-visible", "fsm-label-left");
      label.style.maxWidth = "190px";
      el.setAttribute("aria-expanded", String(marker.isPopupOpen()));
      if (map.getZoom() < 13) continue;
      const p = map.latLngToContainerPoint(marker.getLatLng());
      for (const left of [false, true]) {
        // Fit long names to the actual space beside their geographic pin.
        const available = left ? p.x - 32 : size.x - p.x - 32;
        if (available < 86) continue;
        label.style.maxWidth = `${Math.min(190, available)}px`;
        const width = label.offsetWidth, height = label.offsetHeight;
        const x = left ? p.x - 24 - width : p.x + 24;
        const box = {left: x, right: x + width, top: p.y - 43, bottom: p.y - 43 + height};
        if (box.left < 8 || box.right > size.x - 8 || box.top < 8 || box.bottom > size.y - 8 || reserved.some(other => other.marker !== marker && overlap(box, other))) continue;
        el.classList.toggle("fsm-label-left", left);
        el.classList.add("fsm-label-visible");
        reserved.push(box);
        break;
      }
    }
  }
  state.schedule = () => { if (state.frame === null) state.frame = requestAnimationFrame(update); };
  mapStates.set(map, state);
  map.on("moveend zoomend resize popupopen popupclose layeradd layerremove", state.schedule);
  map.on("unload", () => { if (state.frame !== null) cancelAnimationFrame(state.frame); mapStates.delete(map); });
}

export function setSpotLabelMarkers(map, markers) {
  const state = mapStates.get(map);
  if (!state) return;
  state.markers = markers;
  state.schedule();
}

export function scheduleSpotLabels(map) { mapStates.get(map)?.schedule(); }

export function spotPinId(spot) { return getSpotId(spot); }
