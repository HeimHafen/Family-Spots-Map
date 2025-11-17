// js/ui.js
// Präsentationslogik: Spot-Liste, Spot-Details, Toasts

import { getLanguage, t } from "./i18n.js";
import { getState } from "./state.js";

function getLangInfo() {
  const lang = (getLanguage && getLanguage()) || "de";
  const isDe = lang.toLowerCase().startsWith("de");
  return { lang, isDe };
}

// ---------------------------------------------------------
// Utils für Formatierung
// ---------------------------------------------------------

function formatDistanceKm(distanceKm) {
  if (distanceKm == null || !Number.isFinite(distanceKm)) return null;
  const rounded = distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm);
  // deutsches Komma
  return String(rounded).replace(".", ",") + " km";
}

function estimateVisitDurationLabel(spot) {
  const minutes = Number(
    spot.visitMinutes != null ? spot.visitMinutes : spot.visit_minutes,
  );
  if (!Number.isFinite(minutes) || minutes <= 0) return null;

  const { isDe } = getLangInfo();
  if (minutes >= 360) {
    return isDe ? "Ganzer Tag" : "Full day";
  }
  if (minutes >= 180) {
    return isDe ? "Halber Tag" : "Half day";
  }
  if (minutes >= 90) {
    return isDe ? "Längerer Stopp" : "Longer stop";
  }
  return isDe ? "Kurzbesuch" : "Short visit";
}

function isBigAdventure(spot) {
  const categories = Array.isArray(spot.categories) ? spot.categories : [];
  const bigCats = new Set(["freizeitpark", "zoo", "wildpark", "tierpark"]);
  if (categories.some((c) => bigCats.has(c))) return true;

  const visitMinutes = Number(
    spot.visitMinutes != null ? spot.visitMinutes : spot.visit_minutes,
  );
  if (Number.isFinite(visitMinutes) && visitMinutes >= 240) {
    return true;
  }

  const tags = Array.isArray(spot.tags) ? spot.tags : [];
  const lowerTags = tags.map((t) => String(t).toLowerCase());
  return lowerTags.some(
    (t) =>
      t.includes("ganzer tag") ||
      t.includes("riesig") ||
      t.includes("groß") ||
      t.includes("gross"),
  );
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ---------------------------------------------------------
// Badges
// ---------------------------------------------------------

function buildBadgesHtml(spot, isFavorite) {
  const { isDe } = getLangInfo();
  const badges = [];

  // Mood-Match
  if (spot._moodScore && spot._moodScore > 0) {
    const label = isDe ? "passt heute besonders gut" : "great match today";
    badges.push(
      `<span class="badge badge--match"><span class="badge__icon">✨</span><span>${escapeHtml(
        label,
      )}</span></span>`,
    );
  }

  // Distanz
  if (spot._distanceKm != null) {
    const dist = formatDistanceKm(spot._distanceKm);
    if (dist) {
      badges.push(
        `<span class="badge badge--distance"><span class="badge__icon">📍</span><span>${escapeHtml(
          dist,
        )}</span></span>`,
      );
    }
  }

  // Aufenthaltsdauer
  const durationLabel = estimateVisitDurationLabel(spot);
  if (durationLabel) {
    badges.push(
      `<span class="badge badge--time"><span class="badge__icon">🕒</span><span>${escapeHtml(
        durationLabel,
      )}</span></span>`,
    );
  }

  // Big Adventure
  if (isBigAdventure(spot)) {
    const label = isDe ? "großes Abenteuer" : "big adventure";
    badges.push(
      `<span class="badge badge--big"><span class="badge__icon">🎢</span><span>${escapeHtml(
        label,
      )}</span></span>`,
    );
  }

  // Plus-Only
  if (spot.plus_only) {
    const label = isDe ? "Family Spots Plus" : "Family Spots Plus";
    badges.push(
      `<span class="badge badge--plus"><span class="badge__icon">⭐</span><span>${escapeHtml(
        label,
      )}</span></span>`,
    );
  }

  // Verifiziert
  if (spot.verified) {
    const label = isDe ? "Verifiziert" : "Verified";
    badges.push(
      `<span class="badge badge--verified"><span class="badge__icon">✔️</span><span>${escapeHtml(
        label,
      )}</span></span>`,
    );
  }

  // Favorit
  if (isFavorite) {
    const label = isDe ? "Lieblingsspot" : "Favourite";
    badges.push(
      `<span class="badge badge--soft"><span class="badge__icon">💛</span><span>${escapeHtml(
        label,
      )}</span></span>`,
    );
  }

  if (badges.length === 0) return "";
  return `<div class="spot-card__badges">${badges.join("")}</div>`;
}

// ---------------------------------------------------------
// Spot-Liste
// ---------------------------------------------------------

/**
 * Rendert die Spot-Liste in der Sidebar.
 * @param {Array} spots
 * @param {{favorites: string[], onSelect: (id: string) => void}} options
 */
export function renderSpotList(spots, { favorites, onSelect }) {
  const listEl = document.getElementById("spots-list");
  if (!listEl) return;

  const favSet = new Set(favorites || []);
  const { isDe } = getLangInfo();

  if (!Array.isArray(spots) || spots.length === 0) {
    const emptyText = isDe
      ? "Gerade keine passenden Spots für eure Einstellungen. Radius, Stimmung oder Reise-Modus etwas lockern?"
      : "No matching spots for your current settings. Try relaxing radius, mood or travel mode a little.";
    listEl.innerHTML = `<li class="spot-list-empty">${escapeHtml(emptyText)}</li>`;
    return;
  }

  const itemsHtml = spots
    .map((spot) => {
      if (!spot) return "";
      const isFav = favSet.has(spot.id);
      const name = spot.name || spot.title || "";
      const city = spot.city || "";
      const subtitleParts = [];

      if (city) {
        subtitleParts.push(city);
      }

      // kleine Info zur Distanz in der Subline, falls vorhanden
      if (spot._distanceKm != null) {
        const d = formatDistanceKm(spot._distanceKm);
        if (d) subtitleParts.push(d);
      }

      const subtitle = subtitleParts.join(" · ");

      const badgesHtml = buildBadgesHtml(spot, isFav);

      const favIcon = isFav ? "💛" : "🤍";

      return `
        <li class="spot-card" data-spot-id="${escapeHtml(spot.id)}">
          <div class="spot-card__header">
            <div>
              <div class="spot-card__title">${escapeHtml(name)}</div>
              ${
                subtitle
                  ? `<div class="spot-card__meta">${escapeHtml(subtitle)}</div>`
                  : ""
              }
            </div>
            <div class="spot-card__fav" aria-hidden="true" style="font-size: 1rem;">
              ${favIcon}
            </div>
          </div>
          ${badgesHtml}
        </li>
      `;
    })
    .join("");

  listEl.innerHTML = itemsHtml;

  // Klick-Handler
  listEl.querySelectorAll(".spot-card").forEach((itemEl) => {
    const id = itemEl.getAttribute("data-spot-id");
    if (!id) return;
    itemEl.addEventListener("click", () => {
      if (typeof onSelect === "function") {
        onSelect(id);
      }
    });
  });
}

// ---------------------------------------------------------
// Spot-Details
// ---------------------------------------------------------

function ensureDetailContainer() {
  let panel = document.getElementById("spot-detail-panel");
  if (panel) return panel;

  // Falls nicht im HTML vorhanden, erzeugen wir ein Panel
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return null;

  panel = document.createElement("section");
  panel.id = "spot-detail-panel";
  panel.className = "sidebar-section";
  sidebar.appendChild(panel);
  return panel;
}

/**
 * Rendert die Detailansicht eines Spots.
 * @param {object} spot
 * @param {{isFavorite: boolean, onToggleFavorite: (id: string) => void}} options
 */
export function renderSpotDetails(spot, { isFavorite, onToggleFavorite }) {
  const panel = ensureDetailContainer();
  if (!panel || !spot) return;

  const { isDe } = getLangInfo();
  const name = spot.name || spot.title || "";
  const city = spot.city || "";
  const address = spot.address || "";
  const poetry = (spot.poetry || "").trim();
  const summary = (isDe ? spot.summary_de : spot.summary_en) || "";
  const backupSummary = (isDe ? spot.summary_en : spot.summary_de) || "";
  const visitLabel = (isDe ? spot.visitLabel_de : spot.visitLabel_en) || "";

  const mainText =
    poetry || summary || visitLabel || backupSummary || "";

  const distanceLabel =
    spot._distanceKm != null ? formatDistanceKm(spot._distanceKm) : null;
  const durationLabel = estimateVisitDurationLabel(spot);

  const favBtnLabel = isFavorite
    ? isDe
      ? "Aus Favoriten entfernen"
      : "Remove from favourites"
    : isDe
      ? "Zu Favoriten hinzufügen"
      : "Add to favourites";

  const favIcon = isFavorite ? "💛" : "🤍";

  const bigAdv = isBigAdventure(spot);
  const plusOnly = !!spot.plus_only;

  const tags = Array.isArray(spot.tags) ? spot.tags : [];
  const categories = Array.isArray(spot.categories) ? spot.categories : [];

  panel.innerHTML = `
    <div class="sidebar-header">
      <h2 class="sidebar-title">${escapeHtml(name)}</h2>
    </div>

    ${
      city || address || distanceLabel
        ? `<p class="sidebar-subtitle">
            ${city ? escapeHtml(city) : ""}${
              city && address ? " · " : ""
            }${address ? escapeHtml(address) : ""}${
              (city || address) && distanceLabel ? " · " : ""
            }${distanceLabel ? escapeHtml(distanceLabel) : ""}
          </p>`
        : ""
    }

    ${
      mainText
        ? `<p style="font-size: 0.86rem; line-height: 1.5; margin-top: 6px;">
            ${escapeHtml(mainText)}
          </p>`
        : ""
    }

    ${
      durationLabel || bigAdv || plusOnly || spot.verified
        ? `<div class="badges-row" style="margin-top: 6px;">
            ${
              durationLabel
                ? `<span class="badge badge--time"><span class="badge__icon">🕒</span><span>${escapeHtml(
                    durationLabel,
                  )}</span></span>`
                : ""
            }
            ${
              bigAdv
                ? `<span class="badge badge--big"><span class="badge__icon">🎢</span><span>${escapeHtml(
                    isDe ? "großes Abenteuer" : "big adventure",
                  )}</span></span>`
                : ""
            }
            ${
              plusOnly
                ? `<span class="badge badge--plus"><span class="badge__icon">⭐</span><span>${escapeHtml(
                    "Family Spots Plus",
                  )}</span></span>`
                : ""
            }
            ${
              spot.verified
                ? `<span class="badge badge--verified"><span class="badge__icon">✔️</span><span>${escapeHtml(
                    isDe ? "Verifiziert" : "Verified",
                  )}</span></span>`
                : ""
            }
          </div>`
        : ""
    }

    ${
      tags.length || categories.length
        ? `<div style="margin-top: 8px;">
            ${
              categories.length
                ? `<div style="font-size: 0.75rem; color: var(--color-text-soft); margin-bottom: 2px;">
                    ${escapeHtml(isDe ? "Kategorien" : "Categories")}: 
                    ${escapeHtml(categories.join(", "))}
                  </div>`
                : ""
            }
            ${
              tags.length
                ? `<div style="font-size: 0.75rem; color: var(--color-text-soft);">
                    ${escapeHtml(isDe ? "Tags" : "Tags")}: 
                    ${escapeHtml(tags.join(", "))}
                  </div>`
                : ""
            }
          </div>`
        : ""
    }

    <div style="display: flex; gap: 8px; margin-top: 10px;">
      <button
        type="button"
        class="btn btn--sm"
        id="spot-fav-toggle"
      >
        <span>${favIcon}</span>
        <span>${escapeHtml(favBtnLabel)}</span>
      </button>
    </div>
  `;

  const favBtn = panel.querySelector("#spot-fav-toggle");
  if (favBtn && typeof onToggleFavorite === "function") {
    favBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      onToggleFavorite(spot.id);
    });
  }
}

// ---------------------------------------------------------
// Toasts
// ---------------------------------------------------------

let toastCounter = 0;

/**
 * Zeigt eine kleine Toast-Nachricht (unten mittig) an.
 * @param {string} message
 * @param {number} [durationMs]
 */
export function showToast(message, durationMs = 3400) {
  if (typeof document === "undefined") return;
  const text = String(message || "");

  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    Object.assign(container.style, {
      position: "fixed",
      left: "50%",
      bottom: "16px",
      transform: "translateX(-50%)",
      zIndex: "9999",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      pointerEvents: "none",
    });
    document.body.appendChild(container);
  }

  const toastId = `toast-${++toastCounter}`;
  const toast = document.createElement("div");
  toast.id = toastId;
  Object.assign(toast.style, {
    pointerEvents: "auto",
    maxWidth: "320px",
    padding: "8px 12px",
    borderRadius: "999px",
    background:
      "rgba(15, 23, 42, 0.92)",
    color: "#f9fafb",
    fontSize: "0.8rem",
    boxShadow: "0 10px 25px rgba(15, 23, 42, 0.6)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    opacity: "0",
    transform: "translateY(8px)",
    transition: "opacity 160ms ease-out, transform 160ms ease-out",
  });

  toast.innerHTML = `<span>${escapeHtml(text)}</span>`;

  container.appendChild(toast);

  // kleine Fade-In-Animation
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  // Auto-Dismiss
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => {
      if (toast.parentElement === container) {
        container.removeChild(toast);
      }
    }, 200);
  }, durationMs);
}

// ---------------------------------------------------------
// (optional) kleiner State-Debug – aktuell nicht benutzt
// ---------------------------------------------------------

// Beispiel, falls du später mal einen Subscriber brauchst:
export function _debugLogStateOnce() {
  const state = getState();
  // eslint-disable-next-line no-console
  console.log("[Family Spots] current state snapshot:", state);
}