// Family Spots Map – Tilla Edition
// Einfaches JS: Map initialisieren + Tabs + kleine Tilla-Microcopy.

(function () {
  "use strict";

  // --- Helper: Tab-Switching ---
  const tabButtons = document.querySelectorAll(".fsm-tabbar-item");
  const screens = document.querySelectorAll(".fsm-screen");

  function showScreen(id) {
    screens.forEach((el) => {
      if (el.id === id) {
        el.classList.add("fsm-screen--active");
      } else {
        el.classList.remove("fsm-screen--active");
      }
    });
    tabButtons.forEach((btn) => {
      btn.classList.toggle(
        "fsm-tabbar-item--active",
        btn.getAttribute("data-target") === id
      );
    });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      if (target) {
        showScreen(target);
      }
    });
  });

  // Standard: Karte zuerst zeigen
  showScreen("screen-map");

  // --- Leaflet Map (Basis) ---
  const mapContainer = document.getElementById("map");
  if (mapContainer && typeof L !== "undefined") {
    const map = L.map(mapContainer, {
      center: [52.52, 13.405], // Berlin – kannst du gern ändern
      zoom: 6,
      zoomControl: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap-Mitwirkende",
      maxZoom: 19
    }).addTo(map);

    // Beispiel-Marker – hier kannst du später deine echten Spots reinladen
    L.marker([52.52, 13.405])
      .addTo(map)
      .bindPopup("Beispiel-Spot – ersetze mich durch echte Daten 🙂");
  }

  // --- Familien-Kompass: kleine Tilla-Nachricht ---
  const compassButton = document.getElementById("btn-open-compass");
  if (compassButton) {
    compassButton.addEventListener("click", () => {
      // Hier später dein echtes Kompass-Overlay öffnen.
      alert(
        "Tilla sagt:\n\n„Lasst uns schauen, welcher Spot heute zu euch passt.“"
      );
    });
  }

  // --- Partner-Code (Stub) ---
  const activateButton = document.getElementById("btn-activate-code");
  const partnerInput = document.getElementById("partner-code-input");

  if (activateButton && partnerInput) {
    activateButton.addEventListener("click", () => {
      const code = partnerInput.value.trim();
      if (!code) {
        alert("Bitte gib einen Partner-Code ein.");
        return;
      }

      // Hier später echte Logik / API.
      alert(
        `Tilla sagt:\n\n„Ich habe euren Code „${code}“ gespeichert. Die Plus-Features kommen in einem späteren Update.“`
      );
    });
  }
})();