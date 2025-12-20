// js/ui/menu.js
import { qs } from "../utils/dom.js";

export function initMenu() {
  const menuToggle = qs("#menu-toggle");
  const menu = qs("#app-menu");
  const backdrop = menu ? qs(".app-menu-backdrop", menu) : null;

  function openMenu() {
    if (!menu) return;
    menu.hidden = false;
    document.body.dataset.menuOpen = "1";
    menuToggle?.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    if (!menu) return;
    menu.hidden = true;
    delete document.body.dataset.menuOpen;
    menuToggle?.setAttribute("aria-expanded", "false");
  }

  menuToggle?.addEventListener("click", () => {
    if (!menu) return;
    menu.hidden ? openMenu() : closeMenu();
  });

  backdrop?.addEventListener("click", closeMenu);

  menu?.addEventListener("click", (e) => {
    if (e.target?.closest("[data-menu-close]")) closeMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  return { openMenu, closeMenu };
}