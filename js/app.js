// Family Spots Map – Minimal Bootstrap (Liste + Karte + Suche)
// Keine optional chaining, läuft ohne Build-Step.

(function () {
  // Service Worker (falls vorhanden)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js").catch(function(){});
    });
  }

  var root = document.getElementById("app");
  if (!root) return;

  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === "class") node.className = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else node.setAttribute(k, attrs[k]);
      }
    }
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null) continue;
      if (typeof c === "string") node.appendChild(document.createTextNode(c));
      else node.appendChild(c);
    }
    return node;
  }

  // UI Grundgerüst
  var input = el("input", { id: "q", type: "search", placeholder: "Suche Kategorie oder Namen …" });
  var btnNear = el("button", { id: "nearby", type: "button" }, "In der Nähe");
  var btnReset = el("button", { id: "reset", type: "button" }, "Zurücksetzen");
  var toolbar = el("div", { class: "toolbar" }, input, btnNear, btnReset);

  var tabListBtn = el("button", { id: "tab-list", type: "button", class: "active", "data-tab": "list" }, "Liste");
  var tabMapBtn = el("button", { id: "tab-map", type: "button", "data-tab": "map" }, "Karte");
  var tabs = el("div", { class: "tabs" }, tabListBtn, tabMapBtn);

  var list = el("div", { id: "list" });
  var mapWrap = el("div", { id: "map", class: "hidden" });

  root.appendChild(toolbar);
  root.appendChild(tabs);
  root.appendChild(list);
  root.appendChild(mapWrap);

  function setTab(which) {
    if (which === "map") {
      mapWrap.classList.remove("hidden");
      list.classList.add("hidden");
      setTimeout(function(){ map.invalidateSize(); }, 0);
      tabMapBtn.classList.add("active"); tabListBtn.classList.remove("active");
    } else {
      list.classList.remove("hidden");
      mapWrap.classList.add("hidden");
      tabListBtn.classList.add("active"); tabMapBtn.classList.remove("active");
    }
  }
  tabListBtn.onclick = function(){ setTab("list"); };
  tabMapBtn.onclick = function(){ setTab("map"); };

  // Leaflet Map
  var map = L.map("map");
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap-Mitwirkende"
  }).addTo(map);

  var markers = [];
  function clearMarkers() {
    for (var i = 0; i < markers.length; i++) map.removeLayer(markers[i]);
    markers = [];
  }

  function renderSpots(spots) {
    list.innerHTML = "";
    clearMarkers();

    if (!spots || !spots.length) {
      list.appendChild(el("p", null, "Noch keine Spots. Füge welche in data/spots.json hinzu."));
      map.setView([51.2, 10.4], 6); // Deutschland
      return;
    }

    var bounds = [];
    for (var i = 0; i < spots.length; i++) {
      var s = spots[i] || {};
      var title = s.title || s.name || "Spot";
      var city = s.city || "";
      var card = el("div", { class: "card" },
        el("h3", null, title),
        el("div", { class: "meta" }, city)
      );
      list.appendChild(card);

      if (typeof s.lat === "number" && typeof s.lon === "number") {
        var m = L.marker([s.lat, s.lon]).addTo(map).bindPopup(title);
        markers.push(m);
        bounds.push([s.lat, s.lon]);
      }
    }
    if (bounds.length) map.fitBounds(bounds, { padding: [20, 20] });
    else map.setView([51.2, 10.4], 6);
  }

  function fetchJSON(url, fallback) {
    return fetch(url, { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .catch(function () { return fallback; });
  }

  // Daten laden: index + spots (spots.json optional)
  var ALL_SPOTS = [];
  Promise.all([
    fetchJSON("data/index.json", {}),
    fetchJSON("data/spots.json", [])
  ]).then(function (rs) {
    var idx = rs[0] || {};
    ALL_SPOTS = rs[1] || [];
    renderSpots(ALL_SPOTS);

    // Suche
    input.addEventListener("input", function (e) {
      var q = (e.target.value || "").toLowerCase().trim();
      if (!q) { renderSpots(ALL_SPOTS); return; }
      var filtered = ALL_SPOTS.filter(function (s) {
        var hay = [
          s.title || s.name || "",
          s.city || "",
          s.address || "",
          (s.categories || []).join(" "),
          (s.tags || []).join(" ")
        ].join(" ").toLowerCase();
        return hay.indexOf(q) !== -1;
      });
      renderSpots(filtered);
    });

    btnReset.onclick = function () { input.value = ""; renderSpots(ALL_SPOTS); };

    btnNear.onclick = function () {
      if (!navigator.geolocation) { alert("Geolocation nicht verfügbar."); return; }
      navigator.geolocation.getCurrentPosition(function (pos) {
        map.setView([pos.coords.latitude, pos.coords.longitude], 12);
        setTab("map");
      }, function () { alert("Position konnte nicht ermittelt werden."); });
    });
  }).catch(function (err) {
    list.innerHTML = "<p>Fehler beim Laden der Daten.</p>";
    console.error(err);
    map.setView([51.2, 10.4], 6);
  });
})();