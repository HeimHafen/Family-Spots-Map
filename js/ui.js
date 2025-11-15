// js/ui.js
// UI-Helfer für Family Spots Map
// - Spotliste rendern
// - Detailpanel rendern (mit X-Button oben rechts)
// - Toasts anzeigen

import { $, $$ } from "./utils.js";
import { getLanguage } from "./i18n.js";
import { getCategoryLabel } from "./data.js";

// -------------------------
// Helfer
// -------------------------

function getUiLanguage() {
  const lang = (getLanguage && getLanguage()) || "de";
  return lang && lang.toLowerCase().startsWith("en") ? "en" : "de";
}

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textByLang(spot, baseKey) {
  const lang = getUiLanguage();
  const primaryKey = `${baseKey}_${lang}`;
  const fallbackKey = lang === "en" ? `${baseKey}_de` : `${baseKey}_en`;
  return spot[primaryKey] || spot[fallbackKey] || "";
}

function formatVisitTime(spot) {
  const lang = getUiLanguage();
  const fromData = textByLang(spot, "visitLabel");
  if (fromData) return fromData;

  const minutes = Number(spot.visitMinutes || 0);
  if (!minutes) return "";

  const hoursRaw = minutes / 60;
  const hoursRounded = Math.round(hoursRaw * 2) / 2;

  const hoursText =
    Math.abs(hoursRounded - Math.round(hoursRounded)) < 0.001
      ? String(Math.round(hoursRounded))
      : String(hoursRounded).replace(".", ",");

  if (lang === "en") {
    return `Recommended time: approx. ${hoursText} h`;
  }
  return `Empfohlene Zeit: ca. ${hoursText} Std`;
}

// -------------------------
// Auto-Texte für Spots
// -------------------------

function generateSuitability(spot) {
  const lang = getUiLanguage();
  const cat = spot.primaryCategory || "";

  const isPlayground = [
    "spielplatz",
    "abenteuerspielplatz",
    "waldspielplatz",
    "wasserspielplatz",
  ].includes(cat);

  const isAnimalPark = ["zoo", "wildpark", "tierpark"].includes(cat);
  const isAdventurePark = ["freizeitpark"].includes(cat);

  if (isPlayground) {
    return lang === "en"
      ? "Great for preschool and primary school kids; older kids usually still find something to do. Toddlers depending on the equipment and surface."
      : "Ideal für Kinder im Kindergarten- und Grundschulalter; größere Kids finden meistens auch noch etwas zu tun. Für Kleinkinder je nach Ausstattung und Boden geeignet.";
  }

  if (isAnimalPark) {
    return lang === "en"
      ? "For the whole family – from toddlers to grandparents. Most paths are stroller-friendly, details depend on the terrain."
      : "Für die ganze Familie – vom Kleinkind bis zu den Großeltern. Viele Wege sind kinderwagengeeignet, Details hängen vom Gelände ab.";
  }

  if (isAdventurePark) {
    return lang === "en"
      ? "Best for older children and teens; many parks also offer calmer areas and rides for younger kids."
      : "Besonders spannend für größere Kinder und Teens; viele Parks haben aber auch ruhigere Bereiche und Fahrgeschäfte für jüngere Kinder.";
  }

  return lang === "en"
    ? "Suitable for families with children of different ages; check details in the description."
    : "Geeignet für Familien mit Kindern in verschiedenen Altersstufen; Details siehe Beschreibung.";
}

function generateSeason(spot) {
  const lang = getUiLanguage();
  const cat = spot.primaryCategory || "";

  const isPlayground = [
    "spielplatz",
    "abenteuerspielplatz",
    "waldspielplatz",
    "wasserspielplatz",
  ].includes(cat);

  const isAnimalPark = ["zoo", "wildpark", "tierpark"].includes(cat);

  if (isPlayground) {
    return lang === "en"
      ? "Best in dry weather. In summer: sun protection and water/mud clothes are helpful."
      : "Am schönsten bei trockenem Wetter. Im Sommer sind Sonnen- und ggf. Matschschutz hilfreich.";
  }

  if (isAnimalPark) {
    return lang === "en"
      ? "Worth a visit almost all year round; especially nice in spring and autumn."
      : "Fast ganzjährig spannend; besonders schön im Frühling und Herbst.";
  }

  return lang === "en"
    ? "Best on days with decent weather; check local opening times before visiting."
    : "Am besten an Tagen mit passablem Wetter; Öffnungszeiten vorab prüfen.";
}

function generateInfrastructure(spot) {
  const lang = getUiLanguage();
  const cat = spot.primaryCategory || "";

  const isAnimalParkOrPark = ["zoo", "wildpark", "tierpark", "freizeitpark"].includes(
    cat,
  );

  const isPlayground = [
    "spielplatz",
    "abenteuerspielplatz",
    "waldspielplatz",
    "wasserspielplatz",
  ].includes(cat);

  if (isAnimalParkOrPark) {
    return lang === "en"
      ? "Usually there are larger parking areas, toilets and one or more places to eat. Some parks offer playgrounds and picnic areas – check the park website for details."
      : "In der Regel gibt es größere Parkplätze, Toiletten und ein oder mehrere Gastronomieangebote. Viele Parks haben zusätzlich Spielplätze und Picknickmöglichkeiten – Details auf der Website des Parks.";
  }

  if (isPlayground) {
    return lang === "en"
      ? "Often without fixed gastronomy; sometimes there is a bakery or kiosk nearby. Toilets depend strongly on the location."
      : "Oft ohne feste Gastronomie; manchmal gibt es Bäcker, Kiosk oder Café in der Nähe. Toiletten sind je nach Standort vorhanden oder nicht.";
  }

  return lang === "en"
    ? "Infrastructure varies by location – check maps or local information for parking and toilets."
    : "Die Infrastruktur variiert je nach Ort – Parkmöglichkeiten und Toiletten am besten vorab kurz auf der Karte oder vor Ort prüfen.";
}

function generateWhyWeLike(spot) {
  const lang = getUiLanguage();
  const cat = spot.primaryCategory || "";

  const isAnimalPark = ["zoo", "wildpark", "tierpark"].includes(cat);

  if (isAnimalPark) {
    return lang === "en"
      ? "Because animals can be experienced up close and you naturally spend many hours outside together."
      : "Weil man Tiere aus nächster Nähe erleben kann und ganz automatisch viele Stunden gemeinsam draußen verbringt.";
  }

  const isPlaygroundOrNature = [
    "spielplatz",
    "abenteuerspielplatz",
    "waldspielplatz",
    "wasserspielplatz",
    "naturerlebnispfad",
    "walderlebnisroute",
    "wanderweg-kinderwagen",
    "radweg-family",
  ].includes(cat);

  if (isPlaygroundOrNature) {
    return lang === "en"
      ? "Because families can be outside together with little preparation and the children can simply run, climb and discover."
      : "Weil Familien mit wenig Vorbereitung draußen zusammen sein können und die Kinder einfach laufen, klettern und entdecken dürfen.";
  }

  return lang === "en"
    ? "Because it’s an easy way to spend quality time together as a family."
    : "Weil man hier ohne viel Planung schöne gemeinsame Familienzeit verbringen kann.";
}

// -------------------------
// Toast
// -------------------------

let toastTimeoutId = null;

export function showToast(message) {
  const toastEl = $("#toast");
  if (!toastEl) return;

  toastEl.textContent = message;
  toastEl.classList.add("toast--visible");

  if (toastTimeoutId) {
    clearTimeout(toastTimeoutId);
  }

  toastTimeoutId = setTimeout(() => {
    toastEl.classList.remove("toast--visible");
  }, 2800);
}

// -------------------------
// Spot-Liste
// -------------------------

export function renderSpotList(spots, options = {}) {
  const listEl = $("#spot-list");
  if (!listEl) return;

  const { favorites = [], onSelect } = options;
  const favSet = new Set(favorites);

  listEl.innerHTML = "";

  if (!spots || spots.length === 0) {
    const empty = document.createElement("p");
    empty.className = "spot-list-empty";
    empty.textContent =
      getUiLanguage() === "en"
        ? "No family spots found for the current filters."
        : "Keine passenden Spots für die aktuellen Filter gefunden.";
    listEl.appendChild(empty);
    return;
  }

  const lang = getUiLanguage();

  spots.forEach((spot) => {
    const isFav = favSet.has(spot.id);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "spot-list-item";
    btn.dataset.spotId = spot.id;

    const categoryLabel = spot.primaryCategory
      ? getCategoryLabel(spot.primaryCategory, lang)
      : "";

    const visitLabel = formatVisitTime(spot);
    const summary = textByLang(spot, "summary");
    const locationLine = [spot.city, spot.country].filter(Boolean).join("  ");
    const favMark = isFav ? "★" : "☆";

    btn.innerHTML = `
      <div class="spot-list-item-header">
        <div class="spot-list-item-title-row">
          <h3 class="spot-list-item-title">${escapeHtml(spot.name)}</h3>
          <span class="spot-list-item-fav-indicator" aria-hidden="true">${favMark}</span>
        </div>
        ${
          locationLine
            ? `<div class="spot-list-item-location">${escapeHtml(
                locationLine,
              )}</div>`
            : ""
        }
        ${
          categoryLabel
            ? `<div class="spot-list-item-category">${escapeHtml(
                categoryLabel,
              )}</div>`
            : ""
        }
      </div>
      <div class="spot-list-item-badges">
        ${
          spot.verified
            ? `<span class="badge badge--verified">${
                lang === "en" ? "Verified" : "Verifiziert"
              }</span>`
            : ""
        }
        ${
          visitLabel
            ? `<span class="badge badge--time">${escapeHtml(
                visitLabel,
              )}</span>`
            : ""
        }
      </div>
      ${
        spot.poetry
          ? `<p class="spot-list-item-poetry">${escapeHtml(
              spot.poetry,
            )}</p>`
          : ""
      }
      ${
        summary
          ? `<p class="spot-list-item-summary">${escapeHtml(
              summary,
            )}</p>`
          : ""
      }
    `;

    if (typeof onSelect === "function") {
      btn.addEventListener("click", () => onSelect(spot.id));
    }

    listEl.appendChild(btn);
  });
}

// -------------------------
// Detail-Panel
// -------------------------

export function renderSpotDetails(spot, options = {}) {
  const detailsEl = $("#spot-details");
  if (!detailsEl) return;

  const { isFavorite = false, onToggleFavorite } = options;

  // Panel schließen, wenn kein Spot übergeben wird
  if (!spot) {
    detailsEl.innerHTML = "";
    detailsEl.classList.add("hidden");
    detailsEl.classList.remove("spot-details--visible");
    return;
  }

  detailsEl.classList.remove("hidden");
  detailsEl.classList.add("spot-details--visible");

  const lang = getUiLanguage();

  const categoryLabel = spot.primaryCategory
    ? getCategoryLabel(spot.primaryCategory, lang)
    : "";

  const visitLabel = formatVisitTime(spot);
  const summary = textByLang(spot, "summary");
  const locationLine = [spot.city, spot.country].filter(Boolean).join("  ");

  const suitability =
    textByLang(spot, "suitability") || generateSuitability(spot);
  const season = textByLang(spot, "season") || generateSeason(spot);
  const infrastructure =
    textByLang(spot, "infrastructure") || generateInfrastructure(spot);
  const whyWeLike =
    textByLang(spot, "whyWeLike") || generateWhyWeLike(spot);

  const coords =
    spot.location && typeof spot.location.lat === "number"
      ? `${spot.location.lat},${spot.location.lng}`
      : "";

  const googleUrl = coords
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        coords,
      )}`
    : "#";

  const appleUrl = coords
    ? `https://maps.apple.com/?daddr=${encodeURIComponent(coords)}`
    : "#";

  const googleLabel =
    lang === "en" ? "Route (Google Maps)" : "Route (Google Maps)";
  const appleLabel =
    lang === "en" ? "Route (Apple Maps)" : "Route (Apple Karten)";

  const sections = [];

  if (summary) {
    sections.push({
      title: lang === "en" ? "Short description" : "Kurzbeschreibung",
      text: summary,
    });
  }
  if (suitability) {
    sections.push({
      title: lang === "en" ? "Who it's for" : "Für wen geeignet",
      text: suitability,
    });
  }
  if (season) {
    sections.push({
      title: lang === "en" ? "Best time to visit" : "Beste Zeit / Saison",
      text: season,
    });
  }
  if (infrastructure) {
    sections.push({
      title: lang === "en" ? "On site / infrastructure" : "Vor Ort / Infrastruktur",
      text: infrastructure,
    });
  }
  if (whyWeLike) {
    sections.push({
      title: lang === "en" ? "Why we like this spot" : "Warum wir diesen Spot mögen",
      text: whyWeLike,
    });
  }

  const favLabel = isFavorite
    ? lang === "en"
      ? "Favorite"
      : "Favorit"
    : lang === "en"
    ? "Add to favorites"
    : "Zu Favoriten";

  const closeLabel =
    lang === "en" ? "Close details" : "Details schließen";

  const tagChips =
    Array.isArray(spot.tags) && spot.tags.length
      ? `<div class="spot-details-tags">
          ${spot.tags
            .map(
              (tag) =>
                `<span class="badge badge--tag">${escapeHtml(tag)}</span>`,
            )
            .join("")}
        </div>`
      : "";

  const poetryLine = spot.poetry
    ? `<p class="spot-details-poetry">${escapeHtml(spot.poetry)}</p>`
    : "";

  const sectionsHtml = sections
    .map(
      (sec) => `
      <section class="spot-details-section">
        <h4 class="spot-details-section-title">${escapeHtml(sec.title)}</h4>
        <p class="spot-details-section-text">${escapeHtml(sec.text)}</p>
      </section>
    `,
    )
    .join("");

  detailsEl.innerHTML = `
    <header class="spot-details-header">
      <button
        type="button"
        id="spot-details-close-btn"
        class="btn-icon spot-details-close-btn"
        aria-label="${escapeHtml(closeLabel)}"
      >
        ✕
      </button>
      <div class="spot-details-header-main">
        <h3 class="spot-details-title">${escapeHtml(spot.name)}</h3>
        ${
          locationLine
            ? `<div class="spot-details-location">${escapeHtml(
                locationLine,
              )}</div>`
            : ""
        }
        ${
          categoryLabel
            ? `<div class="spot-details-category">${escapeHtml(
                categoryLabel,
              )}</div>`
            : ""
        }
        <div class="spot-details-badges">
          ${
            spot.verified
              ? `<span class="badge badge--verified">${
                  lang === "en" ? "Verified" : "Verifiziert"
                }</span>`
              : ""
          }
          ${
            visitLabel
              ? `<span class="badge badge--time">${escapeHtml(
                  visitLabel,
                )}</span>`
              : ""
          }
        </div>
      </div>
    </header>

    ${poetryLine}

    <div class="spot-details-routes">
      <a href="${googleUrl}" target="_blank" rel="noopener" class="spot-details-route-link">
        ${escapeHtml(googleLabel)}
      </a>
      <a href="${appleUrl}" target="_blank" rel="noopener" class="spot-details-route-link">
        ${escapeHtml(appleLabel)}
      </a>
    </div>

    <div class="spot-details-actions">
      <button
        type="button"
        id="spot-details-fav-btn"
        class="btn-ghost btn-small"
      >
        ${escapeHtml(favLabel)}
      </button>
    </div>

    <div class="spot-details-body">
      ${sectionsHtml}
      ${tagChips}
    </div>
  `;

  // Events nach dem Einfügen setzen
  const favBtn = $("#spot-details-fav-btn");
  if (favBtn && typeof onToggleFavorite === "function") {
    favBtn.addEventListener("click", () => {
      onToggleFavorite(spot.id);
    });
  }

  const closeBtn = $("#spot-details-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      detailsEl.innerHTML = "";
      detailsEl.classList.add("hidden");
      detailsEl.classList.remove("spot-details--visible");
    });
  }
}