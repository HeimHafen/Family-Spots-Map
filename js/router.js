// js/router.js
// ===========================================
// Einfacher Router für Map-View / About-View
// (keine Abhängigkeit von App-State)
// ===========================================

"use strict";

/**
 * Initialisiert das Routing zwischen Karten- und About-Ansicht.
 *
 * @param {Object} opts
 * @param {HTMLElement} opts.viewMapEl
 * @param {HTMLElement} opts.viewAboutEl
 * @param {NodeListOf<HTMLElement>|HTMLElement[]} opts.bottomNavButtons
 * @param {HTMLElement} [opts.bottomNavMapLabelEl]
 * @param {HTMLElement} [opts.bottomNavAboutLabelEl]
 * @param {() => ("de"|"en")} opts.getCurrentLang  Funktion, die aktuelle Sprache zurückgibt
 */
export function initRouter({
  viewMapEl,
  viewAboutEl,
  bottomNavButtons,
  bottomNavMapLabelEl,   // aktuell nur für spätere Erweiterungen – kann auch ungenutzt sein
  bottomNavAboutLabelEl, // "
  getCurrentLang
}) {
  if (!viewMapEl || !viewAboutEl) {
    console.warn("[Family Spots] Router: view elements missing");
  }

  const buttons = Array.from(bottomNavButtons || []);

  /**
   * Route wechseln: "map" oder "about"
   * – entspricht der alten switchRoute-Funktion aus app.js
   */
  function switchRoute(route) {
    const currentLang =
      typeof getCurrentLang === "function" ? getCurrentLang() : "de";

    const showMap = route !== "about";

    // Sichtbarkeit der Views
    if (viewMapEl && viewAboutEl) {
      viewMapEl.classList.toggle("view--active", showMap);
      viewAboutEl.classList.toggle("view--active", !showMap);

      viewMapEl.style.display = showMap ? "block" : "none";
      viewAboutEl.style.display = showMap ? "none" : "block";
    }

    // Bottom-Navigation
    buttons.forEach((btn) => {
      const btnRoute = btn.getAttribute("data-route");
      const isActive = btnRoute === route || (showMap && btnRoute === "map");
      btn.classList.toggle("bottom-nav-item--active", isActive);
      btn.setAttribute("aria-current", isActive ? "page" : "false");
    });

    // Nach oben scrollen (mit Rücksicht auf prefers-reduced-motion)
    const prefersReducedMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? "auto" : "smooth"
    });

    // Fokus für Screenreader setzen
    let focusTarget = null;
    if (showMap) {
      focusTarget = document.getElementById("app-title");
    } else {
      focusTarget =
        currentLang === "de"
          ? document.querySelector("#page-about-de h2")
          : document.querySelector("#page-about-en h2");
    }

    if (focusTarget && typeof focusTarget.focus === "function") {
      focusTarget.focus();
    }
  }

  /**
   * Aktuelle Route zurückgeben ("map" / "about")
   */
  function getCurrentRoute() {
    if (!viewMapEl || !viewAboutEl) return "map";
    return viewAboutEl.classList.contains("view--active") ? "about" : "map";
  }

  return {
    switchRoute,
    getCurrentRoute
  };
}