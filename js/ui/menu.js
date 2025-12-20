// js/ui/menu.js
// ======================================================
// Family Spots Map – Menü (☰) – Option A
// Source of Truth für Sichtbarkeit ist das HTML-Attribut [hidden].
// aria-hidden / aria-expanded werden synchron gehalten.
// data-menu-open wird (optional) nur noch für Scroll-Lock genutzt.
// ======================================================

"use strict";

/**
 * Initialisiert das App-Menü.
 * Erwartete DOM-Struktur:
 * - Button:  #menu-toggle
 * - Dialog:  #app-menu (role="dialog", aria-hidden="true", hidden)
 *   - Backdrop: .app-menu-backdrop (empfohlen) – trägt data-menu-close
 *   - Panel:    .app-menu-panel (empfohlen)
 *   - Menü-Items: können data-menu-close tragen (z. B. "1")
 *
 * @returns {{ openMenu:Function, closeMenu:Function, toggleMenu:Function, isOpen:Function }}
 */
export function initMenu() {
  const toggleBtn = document.getElementById("menu-toggle");
  const menuEl = document.getElementById("app-menu");

  if (!toggleBtn || !menuEl) {
    // Defensive: App soll weiterlaufen, selbst wenn Menü nicht vorhanden ist.
    return {
      openMenu: () => {},
      closeMenu: () => {},
      toggleMenu: () => {},
      isOpen: () => false
    };
  }

  const panelEl =
    menuEl.querySelector(".app-menu-panel") ||
    menuEl.querySelector("[role='document']") ||
    menuEl;

  let lastFocus = null;

  // --- Helpers ------------------------------------------------

  const isOpen = () => menuEl.hidden === false;

  function setAria(open) {
    menuEl.setAttribute("aria-hidden", open ? "false" : "true");
    toggleBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function setScrollLock(open) {
    // Optional: Nur Scroll-Lock. Sichtbarkeit NICHT mehr daran koppeln.
    if (!document.body) return;
    if (open) {
      document.body.setAttribute("data-menu-open", "1");
    } else {
      document.body.removeAttribute("data-menu-open");
    }
  }

  function focusFirstInMenu() {
    const focusable = panelEl.querySelector(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    if (focusable && typeof focusable.focus === "function") {
      focusable.focus();
    } else {
      // Fallback: Panel fokussieren, damit ESC/Tab erwartbar bleibt
      if (!panelEl.hasAttribute("tabindex")) panelEl.setAttribute("tabindex", "-1");
      panelEl.focus?.();
    }
  }

  function trapTabKey(event) {
    if (event.key !== "Tab") return;
    if (!isOpen()) return;

    const nodes = Array.from(
      panelEl.querySelectorAll(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      )
    ).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");

    if (!nodes.length) return;

    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    const active = document.activeElement;

    if (event.shiftKey) {
      if (active === first || active === panelEl) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  // --- Public API --------------------------------------------

  function openMenu() {
    if (isOpen()) return;
    lastFocus = document.activeElement;

    menuEl.hidden = false;
    setAria(true);
    setScrollLock(true);

    // Nach dem Unhide fokussieren (iOS/Safari-stabiler)
    window.setTimeout(() => {
      focusFirstInMenu();
    }, 0);
  }

  function closeMenu(options = {}) {
    const { returnFocus = true } = options;

    if (!isOpen()) return;

    menuEl.hidden = true;
    setAria(false);
    setScrollLock(false);

    if (returnFocus && lastFocus && typeof lastFocus.focus === "function") {
      window.setTimeout(() => lastFocus.focus(), 0);
    }
    lastFocus = null;
  }

  function toggleMenu() {
    if (isOpen()) closeMenu({ returnFocus: true });
    else openMenu();
  }

  // --- Event Wiring ------------------------------------------

  toggleBtn.addEventListener("click", () => {
    toggleMenu();
  });

  // Click-to-close: Backdrop + Items mit data-menu-close
  menuEl.addEventListener("click", (event) => {
    const target = /** @type {HTMLElement} */ (event.target);
    if (!target) return;

    const closeEl = target.closest("[data-menu-close]");
    if (closeEl) {
      closeMenu({ returnFocus: true });
    }
  });

  // ESC schließt, Tab wird getrappt
  document.addEventListener("keydown", (event) => {
    if (!isOpen()) return;

    if (event.key === "Escape" || event.key === "Esc") {
      event.preventDefault();
      closeMenu({ returnFocus: true });
      return;
    }

    trapTabKey(event);
  });

  // Initiale ARIA-Sync (falls Markup abweicht)
  setAria(!menuEl.hidden);
  toggleBtn.setAttribute("aria-haspopup", "dialog");
  toggleBtn.setAttribute("aria-controls", menuEl.id);

  return { openMenu, closeMenu, toggleMenu, isOpen };
}
