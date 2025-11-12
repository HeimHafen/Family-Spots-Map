import { isFav, toggleFav } from "./storage.js";
import { t, getLang, initI18n, applyStrings } from "./i18n.js";
import { getCategoryLabel } from "./data.js";

export function initUI(index, spots){
  const tabList = document.getElementById("tab-list");
  const tabMap = document.getElementById("tab-map");
  const panelList = document.getElementById("panel-list");
  const panelMap = document.getElementById("panel-map");
  const setTab = (tab) => {
    const isList = tab === "list";
    panelList.hidden = !isList; panelMap.hidden = isList;
    tabList.setAttribute("aria-selected", isList); tabMap.setAttribute("aria-selected", !isList);
  };
  tabList.addEventListener("click", ()=>setTab("list"));
  tabMap.addEventListener("click", ()=>setTab("map"));
  setTab("list");

  // Install prompt
  let deferredPrompt;
  window.addEventListener("beforeinstallprompt", (e)=>{ e.preventDefault(); deferredPrompt = e; });
  document.getElementById("install").addEventListener("click", async ()=>{
    if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; }
    else alert(t("install_help"));
  });

  // Lang switch
  const setActive = (lang)=>{
    document.querySelectorAll(".lang-switch .lang").forEach(b=>{
      const on = b.dataset.lang === lang;
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", on ? "true":"false");
    });
  };
  const saved = localStorage.getItem("fsm.lang") || getLang();
  setActive(saved);
  document.querySelectorAll(".lang-switch .lang").forEach(b=>{
    b.addEventListener("click", async ()=>{
      const lang = b.dataset.lang;
      await initI18n(lang);
      setActive(lang);
      applyStrings();
      const select = document.getElementById("category");
      populateCategories(index.categories, select, t("filter_all"), lang);
      document.getElementById("search").dispatchEvent(new Event("input"));
    });
  });
  document.getElementById("btn-share").title = t("share_title");

  // Modal
  document.getElementById("add-spot").addEventListener("click", openAddSpotModal);
  document.getElementById("modal-cancel").addEventListener("click", closeModal);
  document.getElementById("add-spot-form").addEventListener("submit", onSpotFormSubmit);
  document.getElementById("copy-json").addEventListener("click", copyJson);
  document.getElementById("download-json").addEventListener("click", downloadJson);
}
export function openAddSpotModal(){ document.getElementById("modal-overlay").hidden = false; }
function closeModal(){ document.getElementById("modal-overlay").hidden = true; }
function onSpotFormSubmit(e){
  e.preventDefault();
  const fd = new FormData(e.target);
  const obj = {
    id: fd.get("id"), name: fd.get("name"),
    category: fd.get("category"),
    lat: parseFloat(fd.get("lat")), lon: parseFloat(fd.get("lon")),
    address: fd.get("address") || null, city: fd.get("city"), country: fd.get("country"),
    usp: (fd.get("usp")||"").split(",").map(s=>s.trim()).filter(Boolean),
    tags: (fd.get("tags")||"").split(",").map(s=>s.trim()).filter(Boolean),
    poetry: fd.get("poetry") || null, verified: fd.get("verified")==="true",
    rating: fd.get("rating") ? parseFloat(fd.get("rating")) : undefined,
    source: fd.get("source") || "community"
  };
  const out = JSON.stringify(obj, null, 2);
  document.getElementById("json-code").textContent = out;
  document.getElementById("json-output").hidden = false;
}
function copyJson(){
  const txt = document.getElementById("json-code").textContent;
  navigator.clipboard.writeText(txt);
}
function downloadJson(){
  const txt = document.getElementById("json-code").textContent;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([txt],{type:"application/json"}));
  a.download = "spot.json"; a.click();
}

export function populateCategories(categories, selectEl, firstLabel, lang=getLang()){
  selectEl.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = ""; empty.textContent = firstLabel || t("filter_all");
  selectEl.appendChild(empty);
  categories.forEach(c => {
    const o = document.createElement("option");
    o.value = c.slug;
    o.textContent = getCategoryLabel(c.slug, lang);
    selectEl.appendChild(o);
  });
}

export function renderList(spots){
  const list = document.getElementById("spots");
  list.innerHTML = "";
  if (!spots.length){
    const p = document.createElement("p");
    p.className = "muted";
    p.textContent = t("no_results");
    list.appendChild(p);
    return;
  }
  const frag = document.createDocumentFragment();
  spots.forEach(s => {
    const li = document.createElement("li"); li.className = "spot-card"; li.dataset.spotId = s.id;
    li.innerHTML = `
      <div class="spot-head">
        <div>
          <h3>${s.name}</h3>
          <div class="meta">
            <span class="badge cat" data-cat="${s.category}">${s.category}</span>
            ${s.verified ? '<span class="badge ok">verifiziert</span>' : ''}
            ${s.rating ? `<span class="badge score">★ ${s.rating}</span>` : ''}
          </div>
        </div>
        <div class="row">
          <button class="fav" aria-label="Favorit" data-id="${s.id}">${isFav(s.id) ? "♥" : "♡"}</button>
        </div>
      </div>
      <p class="poetry">${s.poetry || ""}</p>
      <p class="addr">${s.address || ""}</p>
      <div class="tags">${(s.usp||[]).concat(s.tags||[]).map(x=>`<span class="chip">${x}</span>`).join("")}</div>
    `;
    li.addEventListener("click", (e)=>{ if ((e.target).closest("button.fav")) return; window.dispatchEvent(new CustomEvent("fsm.focus-spot", { detail: s })); });
    li.querySelector("button.fav").addEventListener("click", (e)=>{ e.stopPropagation(); toggleFav(s.id); e.currentTarget.textContent = isFav(s.id) ? "♥" : "♡"; });
    frag.appendChild(li);
  });
  list.appendChild(frag);
}