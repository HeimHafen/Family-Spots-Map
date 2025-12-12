(function () {
  const menuToggle = document.getElementById("menu-toggle");
  const menu = document.getElementById("app-menu");
  const backdrop = menu && menu.querySelector(".app-menu-backdrop");

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
      if (menu && menu.hidden) openMenu();
      else closeMenu();
    });
  }

  if (backdrop) backdrop.addEventListener("click", closeMenu);

  if (menu) {
    menu.addEventListener("click", (event) => {
      const target = event.target;
      if (target && target.closest("[data-menu-close]")) closeMenu();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  // Sprachchips → bestehenden Language-Switcher benutzen
  const langOrder = ["de", "da", "en"];

  function getCurrentLang() {
    const html = document.documentElement;
    return html.getAttribute("lang") || html.dataset.lang || "de";
  }

  function syncActiveLangChip() {
    const current = getCurrentLang();
    document.querySelectorAll(".app-menu-lang-chip").forEach((btn) => {
      const isActive = btn.dataset.langTarget === current;
      btn.classList.toggle("app-menu-lang-chip--active", isActive);
      btn.setAttribute("aria-pressed", String(isActive));
    });
  }

  function cycleLanguageTo(targetLang) {
    const legacyButton = document.getElementById("language-switcher");
    if (!legacyButton) return;

    if (getCurrentLang() === targetLang) {
      syncActiveLangChip();
      return;
    }

    let guard = 0;
    const guardMax = langOrder.length + 1;

    while (getCurrentLang() !== targetLang && guard < guardMax) {
      legacyButton.click();
      guard += 1;
    }
    syncActiveLangChip();
  }

  document.querySelectorAll(".app-menu-lang-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetLang = btn.dataset.langTarget;
      if (!targetLang) return;
      cycleLanguageTo(targetLang);
    });
  });

  window.addEventListener("load", syncActiveLangChip);
})();