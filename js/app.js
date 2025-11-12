import { initMap, addSpotMarkers, focusLatLon, updateMarkersFor } from "./map.js";
import { loadIndex, loadSpots, aliasToCategory } from "./data.js";
import { initI18n } from "./i18n.js";
import { initUI, renderList, openAddSpotModal, populateCategories } from "./ui.js";
import { applyFilters, state } from "./filters.js";
import { parseHash, pushHash } from "./router.js";
import { debounce, downloadText, tryShare } from "./utils.js";
import "./sw-register.js";

(async function main(){
  const preferred = localStorage.getItem("fsm.lang") || (navigator.language?.startsWith("de") ? "de":"en");
  await initI18n(preferred);

  const [index, spots] = await Promise.all([loadIndex(), loadSpots()]);
  window._FSM_INDEX = index; window._FSM_SPOTS = spots;

  initUI(index, spots);
  populateCategories(index.categories, document.getElementById("category"));
  populateCategories(index.categories, document.getElementById("form-category"));

  const map = initMap(index);
  addSpotMarkers(map, spots, (spotId) => {
    const el = document.querySelector(`[data-spot-id="${spotId}"]`);
    if (el) el.scrollIntoView({ behavior:"smooth", block:"center" });
  });

  const doRender = () => {
    const filtered = applyFilters(spots);
    renderList(filtered);
    updateMarkersFor(filtered);
    const rc = document.getElementById("results-count");
    if (rc) rc.textContent = `${filtered.length} ${filtered.length===1?'Ergebnis':'Ergebnisse'}`;
  };
  const doRenderDebounced = debounce(doRender, 60);

  // Filter Bindings
  const search = document.getElementById("search");
  search.addEventListener("input", () => { state.query = search.value; pushHash(state); doRenderDebounced(); });

  const category = document.getElementById("category");
  category.addEventListener("change", (e)=>{
    const v = e.target.value.trim();
    state.category = v === "" ? null : (aliasToCategory(v) || v);
    pushHash(state); doRenderDebounced();
  });

  document.getElementById("toggle-verified").addEventListener("change", (e)=>{ state.verifiedOnly = e.target.checked; pushHash(state); doRenderDebounced(); });
  document.getElementById("toggle-favs").addEventListener("change", (e)=>{ state.favoritesOnly = e.target.checked; pushHash(state); doRenderDebounced(); });

  document.getElementById("reset").addEventListener("click", ()=>{ search.value=""; category.value=""; state.category=null; state.query=""; state.verifiedOnly=false; state.favoritesOnly=false; pushHash(state); doRender(); });

  document.getElementById("nearby").addEventListener("click", async ()=>{
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, {enableHighAccuracy:true}));
      focusLatLon(pos.coords.latitude, pos.coords.longitude, 14);
    } catch { alert("Geolocation nicht verfügbar."); }
  });

  document.getElementById("export").addEventListener("click", ()=>{ const favs = JSON.parse(localStorage.getItem("fsm.favorites") || "[]"); downloadText(JSON.stringify(favs, null, 2), "favorites.json"); });
  document.getElementById("import-favs").addEventListener("click", ()=>{ const inp=document.createElement("input"); inp.type="file"; inp.accept="application/json";
    inp.onchange=async()=>{ const f=inp.files?.[0]; if(!f) return; const txt=await f.text(); try{const ids=JSON.parse(txt); if(!Array.isArray(ids)) throw 0; localStorage.setItem("fsm.favorites", JSON.stringify(ids)); alert("Favoriten importiert."); doRender(); }catch{ alert("Ungültige Datei."); } };
    inp.click();
  });

  document.getElementById("btn-share").addEventListener("click", ()=>{ tryShare({ title:"Family Spots Map", text:"Familienfreundliche Orte – Family Spots Map", url: location.href }); });

  document.getElementById("add-spot").addEventListener("click", openAddSpotModal);

  const syncStateFromHash = () => {
    const h = parseHash(location.hash);
    if (h.query !== undefined) { search.value = h.query; state.query = h.query; }
    if (h.category !== undefined) { category.value = h.category || ""; state.category = h.category || null; }
    if (h.verifiedOnly !== undefined) { document.getElementById("toggle-verified").checked = h.verifiedOnly; state.verifiedOnly = h.verifiedOnly; }
    if (h.favoritesOnly !== undefined) { document.getElementById("toggle-favs").checked = h.favoritesOnly; state.favoritesOnly = h.favoritesOnly; }
    doRender();
    if (h.spotId) {
      const s = spots.find(x => x.id === h.spotId);
      if (s) focusLatLon(s.lat, s.lon, 15);
    }
  };
  window.addEventListener("hashchange", syncStateFromHash);
  syncStateFromHash();

  const setOffline = (b)=> document.getElementById("offline").classList.toggle("show", b);
  window.addEventListener("online", ()=>setOffline(false));
  window.addEventListener("offline", ()=>setOffline(true));
  if (!navigator.onLine) setOffline(true);
})();