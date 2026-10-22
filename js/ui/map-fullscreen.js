// One Leaflet instance, temporarily moved into a modal, viewport-sized map.
// No browser Fullscreen API: this also works in an iPhone browser tab.
const COPY = {
  de: { open: "Vollbild", close: "Schließen", openLabel: "Karte im Vollbild öffnen", closeLabel: "Vollbildkarte schließen", title: "Vollbildkarte" },
  en: { open: "Full screen", close: "Close", openLabel: "Open full-screen map", closeLabel: "Close full-screen map", title: "Full-screen map" },
  da: { open: "Fuld skærm", close: "Luk", openLabel: "Åbn kort i fuld skærm", closeLabel: "Luk kort i fuld skærm", title: "Kort i fuld skærm" }
};

export function initMapFullscreen(map) {
  const element = map.getContainer();
  const dialog = document.createElement("dialog");
  if (typeof dialog.showModal !== "function") return;
  dialog.id = "fsm-map-fullscreen";
  document.body.appendChild(dialog);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "fsm-map-fullscreen-button";
  button.setAttribute("aria-controls", dialog.id);
  button.setAttribute("aria-haspopup", "dialog");
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute("focusable", "false");
  const path = document.createElementNS(icon.namespaceURI, "path");
  icon.appendChild(path);
  const label = document.createElement("span");
  button.append(icon, label);
  const control = L.control({ position: "topright" });
  control.onAdd = () => {
    const wrapper = L.DomUtil.create("div", "leaflet-control fsm-map-fullscreen-control");
    wrapper.appendChild(button);
    L.DomEvent.disableClickPropagation(wrapper);
    L.DomEvent.disableScrollPropagation(wrapper);
    return wrapper;
  };
  control.addTo(map);

  let placeholder = null;
  let scrollPosition = null;
  let frame = 0;
  let previewOpen = false;
  map.on("popupopen", () => { previewOpen = true; });
  map.on("popupclose", () => { previewOpen = false; });
  function updateLanguage() {
    const text = COPY[document.documentElement.lang] || COPY.de;
    label.textContent = dialog.open ? text.close : text.open;
    button.setAttribute("aria-label", dialog.open ? text.closeLabel : text.openLabel);
    button.setAttribute("aria-expanded", String(dialog.open));
    dialog.setAttribute("aria-label", text.title);
    path.setAttribute("d", dialog.open
      ? "m6 6 12 12M18 6 6 18"
      : "M9 3H3v6m0-6 6 6m6-6h6v6m0-6-6 6M3 15v6h6m-6 0 6-6m6 6h6v-6m0 6-6-6");
  }
  const languageObserver = new MutationObserver(updateLanguage);
  languageObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  updateLanguage();

  function resizeMap() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      // Leaflet's non-animated pan compensates for the changed container size,
      // retaining the current geographic center and zoom, including user pans.
      map.invalidateSize({ animate: false, pan: true });
    });
  }
  function restoreMap({ focus = true } = {}) {
    if (!placeholder) return;
    placeholder.replaceWith(element);
    placeholder = null;
    document.documentElement.classList.remove("fsm-map-fullscreen-open");
    if (dialog.open) dialog.close();
    updateLanguage();
    resizeMap();
    if (scrollPosition) window.scrollTo({ ...scrollPosition, behavior: "instant" });
    scrollPosition = null;
    if (focus) button.focus({ preventScroll: true });
  }
  function openMap() {
    if (dialog.open) return;
    map.stop();
    scrollPosition = { left: window.scrollX, top: window.scrollY };
    placeholder = document.createElement("div");
    placeholder.className = "fsm-map-placeholder";
    placeholder.style.height = `${element.getBoundingClientRect().height}px`;
    placeholder.setAttribute("aria-hidden", "true");
    element.replaceWith(placeholder);
    dialog.appendChild(element);
    document.documentElement.classList.add("fsm-map-fullscreen-open");
    dialog.showModal();
    updateLanguage();
    resizeMap();
    button.focus({ preventScroll: true });
  }
  button.addEventListener("click", () => dialog.open ? restoreMap() : openMap());
  dialog.addEventListener("keydown", event => {
    // Background app shortcuts must not close an already open detail panel.
    if (event.key === "Escape") event.stopPropagation();
    if (event.key === "Tab") {
      const targets = [...dialog.querySelectorAll("button, a[href], input, select, textarea, [tabindex]")]
        .filter(node => !node.disabled && node.tabIndex >= 0 && node.getClientRects().length);
      const current = targets.indexOf(document.activeElement);
      const next = current < 0 ? (event.shiftKey ? targets.length - 1 : 0)
        : (current + (event.shiftKey ? -1 : 1) + targets.length) % targets.length;
      event.preventDefault();
      (targets[next] || button).focus({ preventScroll: true });
    }
  });
  dialog.addEventListener("cancel", event => {
    event.preventDefault();
    // Escape first closes an open preview; a second Escape leaves the map.
    if (previewOpen) map.closePopup();
    else restoreMap();
  });
  dialog.addEventListener("close", () => {
    // The close event is queued: an immediate reopen must not be undone by it.
    if (!dialog.open) restoreMap();
  });
  element.addEventListener("click", event => {
    if (dialog.open && event.target.closest(".fsm-spot-preview__open")) {
      // Restore before the existing preview handler opens and focuses details.
      restoreMap({ focus: false });
    }
  }, true);
  window.addEventListener("resize", resizeMap);
  window.visualViewport?.addEventListener("resize", resizeMap);
  map.on("unload", () => {
    restoreMap({ focus: false });
    cancelAnimationFrame(frame);
    languageObserver.disconnect();
    window.removeEventListener("resize", resizeMap);
    window.visualViewport?.removeEventListener("resize", resizeMap);
    dialog.remove();
  });
}
