// js/ui-extras.js
// Kleine Zusatz-Logik für UI-Buttons (Filter, Nur Karte)

document.addEventListener("DOMContentLoaded", () => {
  // -----------------------------------
  // Filter ein-/ausblenden
  // -----------------------------------
  const filterToggleBtn = document.getElementById("btn-toggle-filters");
  if (filterToggleBtn) {
    const filterSection = filterToggleBtn.closest(".sidebar-section");
    const labelSpan = filterToggleBtn.querySelector("span") || filterToggleBtn;
    const groups = filterSection
      ? Array.from(filterSection.querySelectorAll(".filter-group"))
      : [];

    filterToggleBtn.addEventListener("click", () => {
      if (!groups.length) return;
      const hidden = groups[0].classList.contains("fsm-hidden");
      groups.forEach((el) => el.classList.toggle("fsm-hidden", !hidden));
      labelSpan.textContent = hidden ? "Filter ausblenden" : "Filter anzeigen";
    });
  }

  // -----------------------------------
  // Nur Karte / Liste zeigen
  // -----------------------------------
  const viewToggleBtn = document.getElementById("btn-toggle-view");
  const listSection = document.querySelector(".sidebar-section--grow");
  if (viewToggleBtn && listSection) {
    const labelSpan = viewToggleBtn.querySelector("span") || viewToggleBtn;

    viewToggleBtn.addEventListener("click", () => {
      const isHidden = listSection.classList.toggle("fsm-hidden");
      labelSpan.textContent = isHidden ? "Liste zeigen" : "Nur Karte";
    });
  }
});