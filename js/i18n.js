let M = {};
let currentLang = "de";

export async function initI18n(lang="de"){
  currentLang = lang;
  const res = await fetch(`data/i18n/${lang}.json`);
  M = await res.json();
  applyStrings();
  localStorage.setItem("fsm.lang", lang);
}
export function t(k){ return M[k] || k; }
export function getLang(){ return currentLang; }

export function applyStrings(){
  document.documentElement.lang = currentLang;
  const y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set("title", M.title);
  set("tagline", M.tagline);
  const search = document.getElementById("search"); if (search) search.placeholder = M.search_placeholder;
  set("label-verified", M.toggle_verified);
  set("label-favs", M.toggle_favorites);
  set("nearby", M.nearby);
  set("reset", M.reset);
  set("tab-list", M.list);
  set("tab-map", M.map);
  set("add-spot", M.add_spot);
  set("import-favs", M.import_favs);
  set("export", M.export);
  set("install", M.install);
}