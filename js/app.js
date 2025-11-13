// Family Spots Map – Minimal App (Liste + Karte + Suche)
// HINWEIS: Alten Service Worker deaktivieren, falls einer bereits registriert war.
if ('serviceWorker' in navigator) {
  // Alte Registrierungen entfernen, um "weiße Seite" durch SW-Cache auszuschließen.
  navigator.serviceWorker.getRegistrations().then(function(rs){ rs.forEach(function(r){ r.unregister(); }); });
}

window.addEventListener('load', function init() {
  var root = document.getElementById("app");
  if (!root) return;

  function el(tag, attrs) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "class") n.className = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    for (var i=2;i<arguments.length;i++){ var c=arguments[i]; if(c!=null) n.appendChild(typeof c==='string'?document.createTextNode(c):c); }
    return n;
  }

  // Toolbar
  var input = el("input", { id:"q", type:"search", placeholder:"Suche Kategorie oder Namen …" });
  var btnNear = el("button", { id:"nearby", type:"button" }, "In der Nähe");
  var btnReset = el("button", { id:"reset", type:"button" }, "Zurücksetzen");
  var toolbar = el("div", { class:"toolbar" }, input, btnNear, btnReset);

  // Tabs
  var tabListBtn = el("button", { id:"tab-list", type:"button", class:"active", "data-tab":"list" }, "Liste");
  var tabMapBtn  = el("button", { id:"tab-map",  type:"button", "data-tab":"map" }, "Karte");
  var tabs = el("div", { class:"tabs" }, tabListBtn, tabMapBtn);

  // Container
  var list = el("div", { id:"list" });
  var mapWrap = el("div", { id:"map", class:"hidden" });

  root.appendChild(toolbar);
  root.appendChild(tabs);
  root.appendChild(list);
  root.appendChild(mapWrap);

  function setTab(which){
    if(which === "map"){
      mapWrap.classList.remove("hidden");
      list.classList.add("hidden");
      setTimeout(function(){ try{ map.invalidateSize(); }catch(e){} }, 0);
      tabMapBtn.classList.add("active"); tabListBtn.classList.remove("active");
    }else{
      list.classList.remove("hidden");
      mapWrap.classList.add("hidden");
      tabListBtn.classList.add("active"); tabMapBtn.classList.remove("active");
    }
  }
  tabListBtn.onclick=function(){ setTab("list"); };
  tabMapBtn.onclick=function(){ setTab("map"); };

  // Karte
  if (window.L && document.getElementById('map')) {
    var map = L.map("map");
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap-Mitwirkende"
    }).addTo(map);
  }
  var markers = [];
  function clearMarkers(){ for (var i=0;i<markers.length;i++) { try{ map.removeLayer(markers[i]); }catch(e){} } markers = []; }

  function renderSpots(spots){
    list.innerHTML = "";
    clearMarkers();

    if (!spots || !spots.length) {
      list.appendChild(el("p", null, "Noch keine Spots. Lege data/spots.json an – unten sind Testdaten."));
      if (window.L && typeof map.setView === "function") map.setView([51.2, 10.4], 6);
      return;
    }

    var bounds = [];
    for (var i=0;i<spots.length;i++){
      var s = spots[i] || {};
      var title = s.title || s.name || "Spot";
      var city = s.city || "";
      list.appendChild(el("div", { class:"card" }, el("h3", null, title), el("div", { class:"meta" }, city)));

      if (window.L && typeof s.lat==="number" && typeof s.lon==="number"){
        var m = L.marker([s.lat, s.lon]).addTo(map).bindPopup(title);
        markers.push(m);
        bounds.push([s.lat, s.lon]);
      }
    }
    if (window.L){
      if (bounds.length) map.fitBounds(bounds, { padding:[20,20] });
      else map.setView([51.2, 10.4], 6);
    }
  }

  function fetchJSON(url, fallback){
    return fetch(url, { cache:"no-cache" })
      .then(function(r){ if(!r.ok) throw new Error("HTTP "+r.status); return r.json(); })
      .catch(function(){ return fallback; });
  }

  var ALL_SPOTS = [];
  Promise.all([
    fetchJSON("data/index.json", {}),               // optional
    fetchJSON("data/spots.json", window.__TEST__ || []) // Testdaten falls Datei fehlt
  ]).then(function(rs){
    ALL_SPOTS = rs[1] || [];
    renderSpots(ALL_SPOTS);

    input.addEventListener("input", function(e){
      var q = (e.target.value||"").toLowerCase().trim();
      if (!q) { renderSpots(ALL_SPOTS); return; }
      var filtered = ALL_SPOTS.filter(function(s){
        var hay = [
          s.title||s.name||"", s.city||"", s.address||"",
          (s.categories||[]).join(" "), (s.tags||[]).join(" ")
        ].join(" ").toLowerCase();
        return hay.indexOf(q) !== -1;
      });
      renderSpots(filtered);
    });
    btnReset.onclick = function(){ input.value=""; renderSpots(ALL_SPOTS); };
    btnNear.onclick = function(){
      if (!navigator.geolocation) { alert("Geolocation nicht verfügbar."); return; }
      navigator.geolocation.getCurrentPosition(function(pos){
        if (window.L) { setTab("map"); map.setView([pos.coords.latitude, pos.coords.longitude], 12); }
      }, function(){ alert("Position konnte nicht ermittelt werden."); });
    });
  }).catch(function(err){
    list.innerHTML = "<p>Fehler beim Laden der Daten.</p>";
    console.error(err);
    if (window.L) map.setView([51.2, 10.4], 6);
  });
});