// js/ui.js

import { $, formatVisitMinutes } from "./utils.js";
import { getLanguage, t } from "./i18n.js";
import { getCategoryLabel } from "./data.js";

/**
 * Kurzbeschreibung für Liste/Details:
 * summary_de / summary_en, Fallback auf poetry.
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

/**
 * Hilfsfunktion: holt einen lokalisierten Text
 * z. B. "visitLabel" → visitLabel_de / visitLabel_en
 */
function getLocalizedSpotText(spot, baseKey) {
  const lang = getLanguage() || "de";
  const isEn = lang.toLowerCase().startsWith("en");

  const deKey = baseKey + "_de";
  const enKey = baseKey + "_en";

  if (isEn) {
    return spot[enKey] || spot[deKey] || "";
  }
  return spot[deKey] || spot[enKey] || "";
}

/**
 * Routen-Buttons (Google / Apple) für das Detail-Panel.
 */
function buildRoutesHtml(spot, lang) {
  if (!spot.location) return "";

  const { lat, lng } = spot.location;
  const encodedName = encodeURIComponent(
    (spot.name || "") + (spot.city ? " " + spot.city : ""),
  );

  const googleUrl =
    "https://www.google.com/maps/dir/?api=1&destination=" +
    encodeURIComponent(lat + "," + lng) +
    (encodedName ? "&destination_place_id=&query=" + encodedName : "");

  const appleUrl =
    "https://maps.apple.com/?daddr=" + encodeURIComponent(lat + "," + lng);

  const lower = (lang || "de").toLowerCase();
  const isEn = lower.startsWith("en");

  const googleLabel = isEn ? "Route (Google Maps)" : "Route (Google Maps)";
  const appleLabel = isEn ? "Route (Apple Maps)" : "Route (Apple Karten)";

  return `
    <div class="spot-details-routes">
      <a
        class="spot-details-route-link"
        href="${googleUrl}"
        target="_blank"
        rel="noopener noreferrer"
      >
        ${googleLabel}
      </a>
      <a
        class="spot-details-route-link"
        href="${appleUrl}"
        target="_blank"
        rel="noopener noreferrer"
      >
        ${appleLabel}
      </a>
    </div>
  `;
}

export function renderSpotList(spots, { favorites, onSelect }) {
  const listEl = $("#spot-list");
  const lang = getLanguage() || "de";

  if (!listEl) return;

  listEl.innerHTML = "";

  if (!spots.length) {
    const p = document.createElement("p");
    p.className = "spot-list-empty";
    p.textContent = t(
      "no_results",
      "Keine passenden Spots gefunden. Passe die Filter an.",
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
                    "Verifiziert",
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
    */

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

  const lang = getLanguage() || "de";
  const categoryLabel = getCategoryLabel(spot.primaryCategory, lang);
  const durationLabel = formatVisitMinutes(spot.visitMinutes, lang);
  const summaryText = getSpotSummary(spot, lang);

  // Zusätzliche Texte
  const visitLabel = getLocalizedSpotText(spot, "visitLabel");
  const suitability = getLocalizedSpotText(spot, "suitability");
  const season = getLocalizedSpotText(spot, "season");
  const infrastructure = getLocalizedSpotText(spot, "infrastructure");
  const whyWeLike = getLocalizedSpotText(spot, "whyWeLike");

  const routesHtml = buildRoutesHtml(spot, lang);

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
                  "Verifiziert",
                )}</span>`
              : ""
          }
          ${
            durationLabel
              ? `<span class="badge badge--time">${t(
                  "label_duration",
                  "Empfohlene Zeit",
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
        ? `<p class="spot-details-meta spot-details-address">${spot.address}</p>`
        : ""
    }
    ${routesHtml}
    ${
      (spot.tags && spot.tags.length) || (spot.usps && spot.usps.length)
        ? `<div class="spot-card-tags spot-details-tags">${[
            ...(spot.usps || []),
            ...(spot.tags || []),
          ]
            .map((tag) => `<span class="badge badge--tag">${tag}</span>`)
            .join("")}</div>`
        : ""
    }
    ${
      visitLabel
        ? `<section class="spot-details-section">
             <h3 class="spot-details-section-title">
               ${t("label_visit", "Unser Tipp für euren Besuch")}
             </h3>
             <p class="spot-details-section-text">${visitLabel}</p>
           </section>`
        : ""
    }
    ${
      suitability
        ? `<section class="spot-details-section">
             <h3 class="spot-details-section-title">
               ${t("label_suitability", "Geeignet für")}
             </h3>
             <p class="spot-details-section-text">${suitability}</p>
           </section>`
        : ""
    }
    ${
      season
        ? `<section class="spot-details-section">
             <h3 class="spot-details-section-title">
               ${t("label_season", "Beste Zeit / Saison")}
             </h3>
             <p class="spot-details-section-text">${season}</p>
           </section>`
        : ""
    }
    ${
      infrastructure
        ? `<section class="spot-details-section">
             <h3 class="spot-details-section-title">
               ${t("label_infrastructure", "Vor Ort / Infrastruktur")}
             </h3>
             <p class="spot-details-section-text">${infrastructure}</p>
           </section>`
        : ""
    }
    ${
      whyWeLike
        ? `<section class="spot-details-section">
             <h3 class="spot-details-section-title">
               ${t("label_why_we_like", "Warum wir diesen Spot mögen")}
             </h3>
             <p class="spot-details-section-text">${whyWeLike}</p>
           </section>`
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