import { qs } from "../utils/dom.js";
import { createModalController } from "./modal.js";

export function initMenu() {
  const menuToggle = qs("#menu-toggle");
  const menu = qs("#app-menu");
  const header = qs(".app-header");
  const home = menuToggle?.parentElement;
  // The app-wide menu stays in the header on every screen size.
  function placeMenu() {
    if (menuToggle && home && menuToggle.parentElement !== home) home.append(menuToggle);
    header?.classList.remove("fsm-menu-near-tilla");
  }
  placeMenu();
  const controller = menu ? createModalController(menu) : null;
  // Start on the dialog title, so opening the menu does not highlight an action.
  const menuTitle = menu?.querySelector("#app-menu-title");
  if (menuTitle) {
    menuTitle.tabIndex = -1;
    menuTitle.style.outline = "none";
    menuTitle.style.boxShadow = "none";
  }
  function openMenu() {
    if (!menu || !menu.hidden) return;
    menu.hidden = false;
    menu.setAttribute("aria-hidden", "false");
    document.body.dataset.menuOpen = "1";
    menuToggle?.setAttribute("aria-expanded", "true");
    controller.activate({ initialFocus: menuTitle });
  }
  function closeMenu() {
    if (!menu || menu.hidden) return;
    // Keep the original trigger available for focus restoration.
    placeMenu();
    controller.deactivate();
    menu.hidden = true;
    menu.setAttribute("aria-hidden", "true");
    delete document.body.dataset.menuOpen;
    menuToggle?.setAttribute("aria-expanded", "false");
  }
  menuToggle?.addEventListener("click", () => menu?.hidden ? openMenu() : closeMenu());
  menu?.addEventListener("click", event => {
    if (event.target?.closest("[data-menu-close]")) closeMenu();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && menu && !menu.hidden) { event.preventDefault(); closeMenu(); }
  });
  return { openMenu, closeMenu };
}
