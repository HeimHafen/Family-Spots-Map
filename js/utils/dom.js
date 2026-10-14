// js/utils/dom.js
// -----------------------------------------
// Mini-Utils für DOM-Zugriff
// -----------------------------------------

/**
 * Kurzform für querySelector.
 * @param {string} sel - CSS-Selektor
 * @param {ParentNode} [root=document]
 * @returns {Element|null}
 */
export function qs(sel, root = document) {
  return root.querySelector(sel);
}

/**
 * Kurzform für querySelectorAll als Array.
 * @param {string} sel - CSS-Selektor
 * @param {ParentNode} [root=document]
 * @returns {Element[]}
 */
export function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

const HEART_ART_URL = new URL("../../assets/tilla/tilla-heart.png", import.meta.url).href;

/** Shared decorative watercolor heart, matching Tilla's shell marking. */
export function createHeartIcon(className = "fsm-inline-heart", ownerDocument = document) {
  const svg = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.classList.add(className);
  const path = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z");
  path.classList.add("fsm-heart-outline");
  svg.appendChild(path);
  const art = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "image");
  art.classList.add("fsm-heart-art");
  art.setAttribute("href", HEART_ART_URL);
  art.setAttribute("x", "0");
  art.setAttribute("y", "0");
  art.setAttribute("width", "24");
  art.setAttribute("height", "24");
  art.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.appendChild(art);
  return svg;
}

/** Render translated text safely, replacing heart markers with our shared watercolor icon. */
export function setTextWithHearts(element, text) {
  if (!element) return;
  const ownerDocument = element.ownerDocument;
  const parts = String(text ?? "").split(/\{heart\}|\u{1f49a}|\u{1f9e1}/u);
  const fragment = ownerDocument.createDocumentFragment();
  parts.forEach((part, index) => {
    if (index) fragment.appendChild(createHeartIcon("fsm-inline-heart", ownerDocument));
    fragment.appendChild(ownerDocument.createTextNode(part));
  });
  element.replaceChildren(fragment);
}
