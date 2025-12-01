// js/router.js
// ===========================================
// Einfacher Router für Map-View / About-View
// (Navigation unten + optionaler Hilfe-Button)
// ===========================================

"use strict";

/**
 * Initialisiert das Routing zwischen Karten-Ansicht und About-Seite.
 *
 * @param {Object} opts
 * @param {HTMLElement} opts.viewMapEl
 * @param {HTMLElement} opts.viewAboutEl
 * @param {NodeListOf<HTMLElement>|HTMLElement[]} opts.bottomNavButtons
 * @param {HTMLElement} [opts.btnHelpEl]
 * @param {() => ("de"|"en")} opts.getCurrentLang  Funktion, die aktuelle Sprache liefert
 */
export function initRouter({
  viewMapEl,
  viewAboutEl,
  bottomNavButtons,
  btnHelpEl,
  getCurrentLang
}) {
  const buttons = Array.from(bottomNavButtons || []);

  function getLang() {
    try {
      if (typeof getCurrentLang === "function") {
        const lang = getCurrentLang();
        return lang === "en" ? "en" : "de";
      }
    } catch {
      // ignore
    }
    return "de";
  }

  /**
   * Route wechseln: "map" oder "about"
   */
  function switchRoute(route) {
    const lang = getLang();
    const showMap = route !== "about";

    // Views ein/ausblenden
    if (viewMapEl && viewAboutEl) {
      viewMapEl.classList.toggle("view--active", showMap);
      viewAboutEl.classList.toggle("view--active", !showMap);

      // zusätzlich direktes display, falls CSS nicht reicht
      viewMapEl.style.display = showMap ? "block" : "none";
      viewAboutEl.style.display = showMap ? "none" : "block";
    }

    // Bottom-Navigation aktualisieren
    buttons.forEach((btn) => {
      const btnRoute = btn.getAttribute("data-route");
      const isActive = btnRoute === (showMap ? "map" : "about");
      btn.classList.toggle("bottom-nav-item--active", isActive);
      btn.setAttribute("aria-current", isActive ? "page" : "false");
    });

    // nach oben scrollen (mit Rücksicht auf prefers-reduced-motion)
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
        lang === "de"
          ? document.querySelector("#page-about-de h2")
          : document.querySelector("#page-about-en h2");
    }

    if (focusTarget && typeof focusTarget.focus === "function") {
      // kleiner Timeout, damit DOM-Änderungen durch sind
      setTimeout(() => focusTarget.focus(), 50);
    }
  }

  // Bottom-Nav Buttons anbinden
  buttons.forEach((btn) => {
    const route = btn.getAttribute("data-route");
    if (!route) return;
    btn.addEventListener("click", () => {
      switchRoute(route);
    });
  });

  // Hilfe-Button (falls vorhanden) auf About routen
  if (btnHelpEl) {
    btnHelpEl.addEventListener("click", (e) => {
      e.preventDefault();
      switchRoute("about");
    });
  }

  // Initialen Zustand aus DOM ableiten
  let initialRoute = "map";
  if (
    viewAboutEl &&
    viewAboutEl.classList.contains("view--active")
  ) {
    initialRoute = "about";
  }
  switchRoute(initialRoute);

  // Rückgabe ist optional – app.js nutzt sie aktuell nicht,
  // kann aber später hilfreich sein.
  return {
    switchRoute
  };
}