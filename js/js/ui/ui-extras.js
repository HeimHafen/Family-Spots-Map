// js/ui-extras.js
// Kleine Zusatz-Logik für UI-Buttons (Filter, Nur Karte, Bottom-Navigation)

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

  // -----------------------------------
  // Bottom-Navigation: Karte / Über
  // -----------------------------------
  const viewMap = document.getElementById("view-map");
  const viewAbout = document.getElementById("view-about");
  const navButtons = document.querySelectorAll(".bottom-nav-item");
  const navIndicator = document.getElementById("bottom-nav-indicator");

  function activateRoute(route) {
    if (!viewMap || !viewAbout) return;

    if (route === "about") {
      viewMap.classList.add("fsm-view-hidden");
      viewAbout.classList.remove("fsm-view-hidden");
    } else {
      viewAbout.classList.add("fsm-view-hidden");
      viewMap.classList.remove("fsm-view-hidden");
    }

    navButtons.forEach((btn, index) => {
      const active = btn.dataset.route === route;
      btn.classList.toggle("bottom-nav-item--active", active);
      if (active && navIndicator) {
        navIndicator.style.transform = `translateX(${index * 100}%)`;
      }
    });
  }

  // Initial: Karte aktiv
  if (viewMap && viewAbout) {
    activateRoute("map");
  }

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const route = btn.dataset.route || "map";
      activateRoute(route);
    });
  });
});