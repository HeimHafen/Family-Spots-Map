// js/menu.js
"use strict";

function qs(sel, root = document) {
  return root.querySelector(sel);
}
function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

(function initMenu() {
  const menuToggle = qs("#menu-toggle");
  const menu = qs("#app-menu");
  const backdrop = menu ? qs(".app-menu-backdrop", menu) : null;

  function openMenu() {
    if (!menu) return;
    menu.hidden = false;
    document.body.dataset.menuOpen = "1";
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    if (!menu) return;
    menu.hidden = true;
    delete document.body.dataset.menuOpen;
    if (menuToggle) menuToggle.setAttribute("aria-expanded", "false");
  }

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      if (!menu) return;
      if (menu.hidden) openMenu();
      else closeMenu();
    });
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeMenu);
  }

  if (menu) {
    menu.addEventListener("click", (event) => {
      const target = event.target;
      if (!target) return;
      if (target.closest("[data-menu-close]")) closeMenu();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  // "Zur Spot-Liste springen" (ohne onclick)
  const btnSkipSpots = qs("#btn-skip-spots");
  btnSkipSpots?.addEventListener("click", () => {
    const spotsTitle = qs("#spots-title");
    if (spotsTitle) {
      spotsTitle.scrollIntoView({ behavior: "smooth", block: "start" });
      // Fokus nachziehen (A11y)
      if (typeof spotsTitle.focus === "function") spotsTitle.focus({ preventScroll: true });
    }
    closeMenu();
  });

  // Sprachchips -> Legacy language-switcher klicken (de -> da -> en)
  const langOrder = ["de", "da", "en"];
  const legacyBtn = qs("#language-switcher");

  function getCurrentLang() {
    return (document.documentElement.getAttribute("lang") || "de").toLowerCase().slice(0, 2);
  }

  function syncActiveLangChip() {
    const current = getCurrentLang();
    qsa(".app-menu-lang-chip").forEach((btn) => {
      const isActive = btn.dataset.langTarget === current;
      btn.classList.toggle("app-menu-lang-chip--active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function cycleLanguageTo(targetLang) {
    if (!legacyBtn) return;
    if (getCurrentLang() === targetLang) {
      syncActiveLangChip();
      return;
    }

    // Safety-Guard
    let guard = 0;
    const max = langOrder.length + 2;

    while (getCurrentLang() !== targetLang && guard < max) {
      legacyBtn.click();
      guard += 1;
    }

    syncActiveLangChip();
  }

  qsa(".app-menu-lang-chip").forEach((btn) => {
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      const target = btn.dataset.langTarget;
      if (!target) return;
      cycleLanguageTo(target);
    });
  });

  // Reagiere auf Sprachwechsel (MutationObserver auf <html lang>)
  const htmlEl = document.documentElement;
  const obs = new MutationObserver(() => syncActiveLangChip());
  obs.observe(htmlEl, { attributes: true, attributeFilter: ["lang"] });

  window.addEventListener("load", syncActiveLangChip);
})();