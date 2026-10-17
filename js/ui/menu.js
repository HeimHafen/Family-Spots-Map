import { qs } from "../utils/dom.js";
import { createModalController } from "./modal.js";

export function initMenu() {
  const menuToggle = qs("#menu-toggle");
  const menu = qs("#app-menu");
  const header = qs(".app-header");
  const home = menuToggle?.parentElement;
  const tillaHeader = qs("#tilla-section > .sidebar-section-header");
  const mapView = qs("#view-map"), sidebar = qs("#sidebar");
  const mobile = window.matchMedia("(max-width: 899px)");
  function placeMenu() {
    if (!menuToggle || !home || !header) return;
    const nearTilla = mobile.matches && tillaHeader &&
      mapView?.classList.contains("view--active") &&
      !sidebar?.classList.contains("hidden") &&
      getComputedStyle(mapView).display !== "none" &&
      getComputedStyle(sidebar).display !== "none" &&
      getComputedStyle(tillaHeader.parentElement).display !== "none";
    const target = nearTilla ? tillaHeader : home;
    const focused = document.activeElement === menuToggle;
    if (menuToggle.parentElement !== target) target.append(menuToggle);
    header.classList.toggle("fsm-menu-near-tilla", !!nearTilla);
    if (focused) menuToggle.focus({ preventScroll: true });
  }
  const placementObserver = new MutationObserver(placeMenu);
  for (const element of [mapView, sidebar, tillaHeader?.parentElement]) {
    if (element) placementObserver.observe(element, { attributes: true, attributeFilter: ["class", "style", "hidden"] });
  }
  mobile.addEventListener("change", placeMenu);
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
    // Route/map-only actions may hide Tilla before the dialog closes. Move
    // the same trigger first so focus returns to a visible menu button.
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
