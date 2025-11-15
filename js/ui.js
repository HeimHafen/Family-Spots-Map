import { $, formatVisitMinutes } from "./utils.js";
import { getLanguage, t } from "./i18n.js";
import { getCategoryLabel } from "./data.js";

/**
 * Liste der Spots links
 * – in der LISTE soll weiterhin die POETRY stehen.
 */
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

    // In der LISTE weiterhin die Poetry zeigen
    const listDescription = spot.poetry || "";

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
        listDescription
          ? `<p class="spot-card-poetry">${listDescription}</p>`
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

/**
 * Detail-Karte unten
 * – beim Klick auf PIN oder Karte soll **summary_de / summary_en**
 *   angezeigt werden (mit Fallback auf poetry, wenn noch kein summary vorhanden ist).
 */
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

  // Zusammenfassung je nach Sprache – Fallback auf jeweils andere Sprache
  const summary =
    lang === "de"
      ? spot.summary_de || spot.summary_en || ""
      : spot.summary_en || spot.summary_de || "";

  const visitLabel =
    lang === "de" ? spot.visit_label_de || "" : spot.visit_label_en || "";

  const suitability =
    lang === "de" ? spot.suitability_de || "" : spot.suitability_en || "";

  const season =
    lang === "de" ? spot.season_de || "" : spot.season_en || "";

  const infrastructure =
    lang === "de"
      ? spot.infrastructure_de || ""
      : spot.infrastructure_en || "";

  const whyWeLike =
    lang === "de" ? spot.why_we_like_de || "" : spot.why_we_like_en || "";

  // In den DETAILS zuerst summary_* anzeigen – wenn noch nicht vorhanden, Poetry als Fallback
  const descriptionText = summary || spot.poetry || "";

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
      descriptionText
        ? `<p class="spot-details-description">${descriptionText}</p>`
        : ""
    }
    ${spot.address ? `<p class="spot-details-meta">${spot.address}</p>` : ""}
    ${
      visitLabel ||
      suitability ||
      season ||
      infrastructure ||
      whyWeLike
        ? `<div class="spot-details-extra">
            ${
              visitLabel
                ? `<p><strong>${t(
                    "details_visit_tip",
                    "Besuchstipp"
                  )}:</strong> ${visitLabel}</p>`
                : ""
            }
            ${
              suitability
                ? `<p><strong>${t(
                    "details_suitability",
                    "Geeignet für"
                  )}:</strong> ${suitability}</p>`
                : ""
            }
            ${
              season
                ? `<p><strong>${t(
                    "details_season",
                    "Beste Zeit"
                  )}:</strong> ${season}</p>`
                : ""
            }
            ${
              infrastructure
                ? `<p><strong>${t(
                    "details_infrastructure",
                    "Vor Ort"
                  )}:</strong> ${infrastructure}</p>`
                : ""
            }
            ${
              whyWeLike
                ? `<p><strong>${t(
                    "details_why_we_like",
                    "Darum mögen wir den Spot"
                  )}:</strong> ${whyWeLike}</p>`
                : ""
            }
          </div>`
        : ""
    }
    ${
      (spot.tags && spot.tags.length) || (spot.usps && spot.usps.length)
        ? `<div class="spot-card-tags">${[
            ...(spot.usps || []),
            ...(spot.tags || []),
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