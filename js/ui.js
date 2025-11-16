// js/ui.js

import { $, $$ } from "./utils.js";
import { getLanguage, t } from "./i18n.js";

/**
 * Rendert die Spot-Liste in #spot-list.
 */
export function renderSpotList(spots, options = {}) {
  const container = $("#spot-list");
  if (!container) return;

  const { favorites = [], onSelect } = options;
  const favSet = new Set(favorites || []);

  if (!Array.isArray(spots) || spots.length === 0) {
    container.innerHTML = `
      <p class="spot-list__empty">
        ${t(
          "spots.empty",
          "Gerade passt kein Spot zu euren Filtern. Passe die Filter an oder vergrößere den Radius.",
        )}
      </p>
    `;
    return;
  }

  const lang = getLanguage() || "de";
  const isGerman = lang.toLowerCase().startsWith("de");

  const frag = document.createDocumentFragment();

  spots.forEach((spot) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "spot-list-item";
    item.dataset.spotId = spot.id;

    const title = getLocalizedField(spot, "title", lang);
    const city = spot.city || spot.town || spot.region || "";
    const distanceLabel = formatDistance(spot.distanceKm, lang);

    const isFav = favSet.has(spot.id);
    const verified = isSpotVerified(spot);

    item.innerHTML = `
      <div class="spot-list-item__header">
        <div class="spot-list-item__title-block">
          <h3 class="spot-list-item__title">${escapeHtml(title)}</h3>
          ${
            city
              ? `<div class="spot-list-item__subtitle">${escapeHtml(city)}</div>`
              : ""
          }
        </div>
        <div class="spot-list-item__meta-top">
          ${
            verified
              ? `<span class="badge badge--verified">${t(
                  "spot.badge_verified",
                  isGerman ? "Verifiziert" : "Verified",
                )}</span>`
              : ""
          }
          <span class="spot-list-item__favorite ${
            isFav ? "spot-list-item__favorite--active" : ""
          }" aria-hidden="true">★</span>
        </div>
      </div>
      <div class="spot-list-item__bottom-row">
        ${
          distanceLabel
            ? `<span class="spot-list-item__distance">${escapeHtml(distanceLabel)}</span>`
            : ""
        }
        <span class="spot-list-item__more">
          ${t(
            "spot.button_more",
            isGerman ? "Details anzeigen" : "Show details",
          )}
        </span>
      </div>
    `;

    if (typeof onSelect === "function") {
      item.addEventListener("click", () => onSelect(spot.id));
    }

    frag.appendChild(item);
  });

  container.innerHTML = "";
  container.appendChild(frag);
}

/**
 * Rendert die Spot-Details in #spot-detail.
 */
export function renderSpotDetails(spot, options = {}) {
  const container = $("#spot-detail");
  if (!container || !spot) return;

  const { isFavorite = false, onToggleFavorite } = options;

  const lang = getLanguage() || "de";
  const isGerman = lang.toLowerCase().startsWith("de");

  const title = getLocalizedField(spot, "title", lang);
  const description = getLocalizedField(spot, "description", lang);
  const city = spot.city || spot.town || spot.region || "";
  const category = spot.category || "";
  const verified = isSpotVerified(spot);
  const usps = spot.usp || spot.usps || [];
  const isPlusOnly =
    spot.plusOnly === true ||
    (Array.isArray(spot.labels) && spot.labels.includes("plus"));

  const coords = extractCoords(spot);
  const mapsUrl = coords
    ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
    : null;

  container.dataset.spotId = spot.id;

  const uspHtml =
    Array.isArray(usps) && usps.length > 0
      ? `
        <div class="spot-detail__section spot-detail__section--usp">
          <h3 class="spot-detail__section-title">
            ${t(
              "spot.section_highlights",
              isGerman ? "Besonderheiten" : "Highlights",
            )}
          </h3>
          <div class="chip-row">
            ${usps
              .map(
                (u) =>
                  `<span class="chip chip--usp">${escapeHtml(String(u))}</span>`,
              )
              .join("")}
          </div>
        </div>
      `
      : "";

  const metaList = [];

  if (category) {
    metaList.push(
      `<li>${t(
        "spot.meta_category",
        isGerman ? "Kategorie" : "Category",
      )}: <strong>${escapeHtml(String(category))}</strong></li>`,
    );
  }

  if (city) {
    metaList.push(
      `<li>${t(
        "spot.meta_place",
        isGerman ? "Ort" : "Place",
      )}: <strong>${escapeHtml(String(city))}</strong></li>`,
    );
  }

  if (verified) {
    metaList.push(
      `<li>${t(
        "spot.meta_verified",
        isGerman ? "Status" : "Status",
      )}: <strong>${t(
        "spot.meta_verified_yes",
        isGerman ? "Verifiziert" : "Verified",
      )}</strong></li>`,
    );
  }

  if (isPlusOnly) {
    metaList.push(
      `<li>${t(
        "spot.meta_plus_only",
        isGerman
          ? "Family Spots Plus: Spezial-Kategorie"
          : "Family Spots Plus: special category",
      )}</li>`,
    );
  }

  const metaHtml =
    metaList.length > 0
      ? `
        <div class="spot-detail__section spot-detail__section--meta">
          <ul class="spot-detail__meta-list">
            ${metaList.join("")}
          </ul>
        </div>
      `
      : "";

  const descriptionHtml = description
    ? `
      <div class="spot-detail__section spot-detail__section--description">
        <p>${escapeHtml(description)}</p>
      </div>
    `
    : "";

  const mapsButtonHtml = mapsUrl
    ? `
      <a class="btn btn--secondary spot-detail__btn-maps"
         href="${mapsUrl}"
         target="_blank"
         rel="noopener noreferrer">
        ${t(
          "spot.button_open_maps",
          isGerman ? "In Karten öffnen" : "Open in maps",
        )}
      </a>
    `
    : "";

  const favLabel = isFavorite
    ? t(
        "spot.button_favorite_remove",
        isGerman ? "Aus Favoriten entfernen" : "Remove from favourites",
      )
    : t(
        "spot.button_favorite_add",
        isGerman ? "Zu Favoriten hinzufügen" : "Add to favourites",
      );

  container.innerHTML = `
    <article class="spot-detail-card">
      <header class="spot-detail-card__header">
        <div>
          <h2 class="spot-detail-card__title">${escapeHtml(title)}</h2>
          ${
            city
              ? `<div class="spot-detail-card__subtitle">${escapeHtml(city)}</div>`
              : ""
          }
          ${
            verified
              ? `<div class="spot-detail-card__verified">
                    <span class="badge badge--verified">
                      ${t(
                        "spot.badge_verified",
                        isGerman ? "Verifiziert" : "Verified",
                      )}
                    </span>
                 </div>`
              : ""
          }
          ${
            isPlusOnly
              ? `<div class="spot-detail-card__plus">
                    <span class="badge badge--plus">
                      ${t(
                        "spot.badge_plus",
                        isGerman ? "Family Spots Plus" : "Family Spots Plus",
                      )}
                    </span>
                 </div>`
              : ""
          }
        </div>
        <button
          type="button"
          class="btn btn--icon spot-detail-card__favorite"
          aria-pressed="${isFavorite ? "true" : "false"}"
          aria-label="${favLabel}"
        >
          <span class="spot-detail-card__favorite-icon">${
            isFavorite ? "★" : "☆"
          }</span>
        </button>
      </header>

      <div class="spot-detail-card__body">
        ${descriptionHtml}
        ${metaHtml}
        ${uspHtml}
      </div>

      <footer class="spot-detail-card__footer">
        ${mapsButtonHtml}
      </footer>
    </article>
  `;

  const favBtn = container.querySelector(".spot-detail-card__favorite");
  if (favBtn && typeof onToggleFavorite === "function") {
    favBtn.addEventListener("click", () => onToggleFavorite(spot.id));
  }
}

/**
 * Zeigt einen Toast. message sollte bereits in der richtigen Sprache sein.
 */
export function showToast(message, type = "info") {
  if (!message) return;

  let container = $("#toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // minimal Animation / Auto-Dismiss
  requestAnimationFrame(() => {
    toast.classList.add("toast--visible");
  });

  const remove = () => {
    toast.classList.remove("toast--visible");
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
    }, 250);
  };

  setTimeout(remove, 3500);

  toast.addEventListener("click", remove);
}

// ------------------------------------------------------
// Hilfsfunktionen
// ------------------------------------------------------

function getLocalizedField(obj, baseKey, lang) {
  const isGerman = (lang || "de").toLowerCase().startsWith("de");

  const deKey = `${baseKey}_de`;
  const enKey = `${baseKey}_en`;

  if (isGerman) {
    return (
      obj[deKey] ||
      obj[baseKey] ||
      obj[enKey] ||
      ""
    );
  } else {
    return (
      obj[enKey] ||
      obj[baseKey] ||
      obj[deKey] ||
      ""
    );
  }
}

function formatDistance(distanceKm, lang) {
  if (typeof distanceKm !== "number" || !Number.isFinite(distanceKm)) {
    return "";
  }

  const isGerman = (lang || "de").toLowerCase().startsWith("de");

  if (distanceKm < 1) {
    return isGerman ? "unter 1 km" : "under 1 km";
  }

  const rounded = Math.round(distanceKm * 10) / 10;
  return isGerman ? `ca. ${rounded} km` : `approx. ${rounded} km`;
}

function extractCoords(spot) {
  if (
    typeof spot.lat === "number" &&
    typeof spot.lng === "number"
  ) {
    return { lat: spot.lat, lng: spot.lng };
  }
  if (
    spot.location &&
    typeof spot.location.lat === "number" &&
    typeof spot.location.lng === "number"
  ) {
    return { lat: spot.location.lat, lng: spot.location.lng };
  }
  return null;
}

function isSpotVerified(spot) {
  if (spot.verified === true) return true;
  if (spot.flags && spot.flags.verified === true) return true;
  if (Array.isArray(spot.labels) && spot.labels.includes("verified")) return true;
  return false;
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}