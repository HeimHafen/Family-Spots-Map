// js/ui.js

import { $, formatVisitMinutes } from "./utils.js";
import { getLanguage, t } from "./i18n.js";
import { getCategoryLabel } from "./data.js";

/**
 * Wählt die passende Kurzbeschreibung (summary) je nach Sprache.
 * Fallback: andere Sprache, danach poetry, danach leer.
 */
function getSpotSummary(spot, lang) {
  if (lang === "de") {
    return spot.summary_de || spot.summary_en || spot.poetry || "";
  }
  if (lang === "en") {
    return spot.summary_en || spot.summary_de || spot.poetry || "";
  }
  return spot.summary_de || spot.summary_en || spot.poetry || "";
}

export function renderSpotList(spots, { favorites, onSelect }) {
  const listEl = $("#spot-list");
  const lang = getLanguage();

  if (!listEl) return;

  listEl.innerHTML = "";

  if (!spots.length) {
    const p = document.createElement("p");
    p.className = "spot-list-empty";
    p.textContent = t(
      "no_results",
      "Keine passenden Spots gefunden. Passe die Filter an."
    );
    listEl.appendChild(p);
    return;
  }

  const favSet = new Set(favorites || []);
  const frag = document.createDocumentFragment();

  spots.forEach((spot) => {
    const card = document.createElement("article");
    card.className = "spot-card";
    card.tabIndex = 0;
    card.dataset.spotId = spot.id;

    const categoryLabel = getCategoryLabel(spot.primaryCategory, lang);
    const durationLabel = formatVisitMinutes(spot.visitMinutes, lang);
    const isFav = favSet.has(spot.id);

    card.innerHTML = `
      <header class="spot-card-header">
        <div>
          <h3 class="spot-card-title">${spot.name}</h3>
          <div class="spot-card-meta">
            ${spot.city ? `<span>${spot.city}</span>` : ""}
            ${categoryLabel ? `<span>${categoryLabel}</span>` : ""}
            ${
              spot.verified
                ? `<span class="badge badge--verified">${t(
                    "badge_verified",
                    "Verifiziert"
                  )}</span>`
                : ""
            }
            ${
              durationLabel
                ? `<span class="badge badge--time">${durationLabel}</span>`
                : ""
            }
          </div>
        </div>
        <button
          class="btn-ghost btn-small spot-card-fav"
          type="button"
          aria-pressed="${isFav}"
          aria-label="${
            isFav
              ? t("fav_remove", "Aus Favoriten entfernen")
              : t("fav_add", "Zu Favoriten hinzufügen")
          }"
        >
          ${isFav ? "★" : "☆"}
        </button>
      </header>
      ${
        spot.poetry
          ? `<p class="spot-card-poetry">${spot.poetry}</p>`
          : ""
      }
      ${
        spot.tags && spot.tags.length
          ? `<div class="spot-card-tags">${spot.tags
              .map((tag) => `<span class="badge badge--tag">${tag}</span>`)
              .join("")}</div>`
          : ""
      }
    `;

    card.addEventListener("click", (evt) => {
      // Klick auf Stern soll nicht die Detailansicht öffnen
      if (evt.target.closest(".spot-card-fav")) return;
      if (onSelect) onSelect(spot.id);
    });

    card.addEventListener("keydown", (evt) => {
      if (evt.key === "Enter" || evt.key === " ") {
        evt.preventDefault();
        if (onSelect) onSelect(spot.id);
      }
    });

    frag.appendChild(card);
  });

  listEl.appendChild(frag);
}

export function renderSpotDetails(spot, { isFavorite, onToggleFavorite }) {
  const container = $("#spot-details");
  if (!container) return;

  if (!spot) {
    container.classList.remove("spot-details--visible");
    container.innerHTML = "";
    return;
  }

  const lang = getLanguage();
  const categoryLabel = getCategoryLabel(spot.primaryCategory, lang);
  const durationLabel = formatVisitMinutes(spot.visitMinutes, lang);
  const summaryText = getSpotSummary(spot, lang);

  container.innerHTML = `
    <header class="spot-details-header">
      <div>
        <h2 class="spot-details-title">${spot.name}</h2>
        <div class="spot-details-meta">
          ${spot.city ? `<span>${spot.city}</span>` : ""}
          ${spot.country ? `<span>${spot.country}</span>` : ""}
          ${categoryLabel ? `<span>${categoryLabel}</span>` : ""}
          ${
            spot.verified
              ? `<span class="badge badge--verified">${t(
                  "badge_verified",
                  "Verifiziert"
                )}</span>`
              : ""
          }
          ${
            durationLabel
              ? `<span class="badge badge--time">${t(
                  "label_duration",
                  "Empfohlene Zeit"
                )}: ${durationLabel}</span>`
              : ""
          }
        </div>
      </div>
      <div class="spot-details-actions">
        <button
          id="spot-fav-btn"
          class="btn btn-small"
          type="button"
          aria-pressed="${isFavorite}"
          aria-label="${
            isFavorite
              ? t("fav_remove", "Aus Favoriten entfernen")
              : t("fav_add", "Zu Favoriten hinzufügen")
          }"
        >
          ${isFavorite ? "★" : "☆"}
          <span>${t("btn_favorite", "Favorit")}</span>
        </button>
        <button
          id="spot-close-btn"
          class="btn-ghost btn-small"
          type="button"
          aria-label="${t("btn_close_details", "Details schließen")}"
        >
          ✕
        </button>
      </div>
    </header>
    ${
      summaryText
        ? `<p class="spot-details-description">${summaryText}</p>`
        : ""
    }
    ${
      spot.poetry && spot.poetry !== summaryText
        ? `<p class="spot-details-poetry">${spot.poetry}</p>`
        : ""
    }
    ${
      spot.address
        ? `<p class="spot-details-meta">${spot.address}</p>`
        : ""
    }
    ${
      (spot.tags && spot.tags.length) || (spot.usps && spot.usps.length)
        ? `<div class="spot-card-tags">${[
            ...(spot.usps || []),
            ...(spot.tags || [])
          ]
            .map((tag) => `<span class="badge badge--tag">${tag}</span>`)
            .join("")}</div>`
        : ""
    }
  `;

  container.classList.add("spot-details--visible");

  const favBtn = $("#spot-fav-btn", container);
  const closeBtn = $("#spot-close-btn", container);

  if (favBtn) {
    favBtn.addEventListener("click", () => {
      if (onToggleFavorite) onToggleFavorite(spot.id);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      container.classList.remove("spot-details--visible");
    });
  }
}

let toastTimeout;

export function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("toast--visible");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("toast--visible");
  }, 2500);
}