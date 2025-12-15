// Syncs the label inside the "Map only" menu item with aria-pressed state.
// Works even if another script controls the actual map-only behavior.

(() => {
  const btn = document.getElementById("btn-toggle-view");
  if (!btn) return;

  const labelOn = btn.querySelector(".label-on");
  const labelOff = btn.querySelector(".label-off");

  const sync = () => {
    const pressed = btn.getAttribute("aria-pressed") === "true";
    if (labelOn) labelOn.classList.toggle("hidden", !pressed);
    if (labelOff) labelOff.classList.toggle("hidden", pressed);
  };

  // If your existing app logic flips aria-pressed, we mirror it:
  const mo = new MutationObserver(sync);
  mo.observe(btn, { attributes: true, attributeFilter: ["aria-pressed"] });

  // After click, sync once more (in case aria-pressed changes async)
  btn.addEventListener("click", () => requestAnimationFrame(sync));

  sync();
})();