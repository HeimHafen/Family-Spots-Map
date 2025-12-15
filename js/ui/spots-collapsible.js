// js/ui/spots-collapsible.js
(() => {
  const details = document.getElementById("spots-section");
  const btnToggleSpots = document.getElementById("btn-toggle-spots");

  if (!details || !btnToggleSpots) return;

  const KEY = "fsm-spots-open";
  const openLabel = btnToggleSpots.querySelector(".label-open");
  const closedLabel = btnToggleSpots.querySelector(".label-closed");

  const sync = () => {
    const isOpen = details.open;

    btnToggleSpots.setAttribute("aria-expanded", String(isOpen));
    btnToggleSpots.dataset.state = isOpen ? "open" : "closed";

    if (openLabel && closedLabel) {
      openLabel.classList.toggle("hidden", !isOpen);   // open => "Ausblenden"
      closedLabel.classList.toggle("hidden", isOpen);  // closed => "Anzeigen"
    }

    try {
      localStorage.setItem(KEY, isOpen ? "1" : "0");
    } catch {}
  };

  // Restore
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "0") details.open = false;
    if (stored === "1") details.open = true;
  } catch {}

  details.addEventListener("toggle", sync);

  btnToggleSpots.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    details.open = !details.open;
    sync();
  });

  sync();
})();