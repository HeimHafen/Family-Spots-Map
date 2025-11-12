let _map, _clusterLayer;

function emoji(cat){
  const m = {
    "spielplatz":"🛝","abenteuerspielplatz":"🧗","indoor-spielplatz":"🏟️","waldspielplatz":"🌲","wasserspielplatz":"💧",
    "zoo":"🦁","tierpark":"🐐","wildpark":"🦌","bauernhof":"🐄","schwimmbad":"🏊","badesee":"🏖️",
    "park-garten":"🌳","picknickwiese":"🧺","wanderweg-kinderwagen":"👶","radweg-family":"🚲","museum-kinder":"🏛️","bibliothek":"📚",
    "freizeitpark":"🎢","minigolf":"⛳","kletterhalle":"🧗","kletteranlage-outdoor":"🧗","boulderpark":"🧗",
    "trampolinpark":"🤸","skatepark":"🛹","pumptrack":"🏁","multifunktionsfeld":"🏟️","bolzplatz":"⚽","bewegungspark":"🏃",
    "familiencafe":"☕","familien-restaurant":"🍽️","kinder-familiencafe":"🍼","eisbahn":"⛸️","rodelhuegel":"🛷",
    "oeffentliche-toilette":"🚻","wickelraum":"🧷","familien-event":"🎪","rastplatz-spielplatz-dusche":"🚿",
    "stellplatz-spielplatz-naehe-kostenlos":"🅿️","wohnmobil-service-station":"🚐","bikepacking-spot":"⛺",
    "toddler-barfuss-motorik":"🦶","naturerlebnispfad":"🍃","walderlebnisroute":"🪵"
  };
  return m[cat] || "📍";
}

export function initMap(index){
  const L = window.L;
  _map = L.map("map", { zoomControl: true }).setView([52.3759, 9.7320], 12);
  L.tileLayer(index.app.tile_provider, { maxZoom: 19, attribution: index.app.tile_attribution }).addTo(_map);

  _clusterLayer = L.markerClusterGroup({ showCoverageOnHover:false, spiderfyOnMaxZoom:true, maxClusterRadius:50 });
  _map.addLayer(_clusterLayer);

  window.addEventListener("fsm.focus-spot", (e)=>{ const s = e.detail; focusLatLon(s.lat, s.lon, 15); });
  return _map;
}

export function addSpotMarkers(map, spots, onClick){
  const L = window.L;
  _clusterLayer.clearLayers();
  spots.forEach(s => {
    const icon = L.divIcon({
      className:"spot-emoji",
      html:`<span role="img" aria-label="${s.category}">${emoji(s.category)}</span>`,
      iconSize:[24,24], iconAnchor:[12,12]
    });
    const m = L.marker([s.lat, s.lon], {icon});
    m.on("click", ()=>{ onClick?.(s.id); map.flyTo([s.lat, s.lon], 15, {duration:0.5}); });
    m.bindPopup(`<strong>${s.name}</strong><br><small>${s.category}</small>`);
    _clusterLayer.addLayer(m);
  });
}
export function updateMarkersFor(filtered){ addSpotMarkers(_map, filtered, () => {}); }
export function focusLatLon(lat, lon, z=14){ if (_map) _map.flyTo([lat, lon], z, {duration:0.5}); }