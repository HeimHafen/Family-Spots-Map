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