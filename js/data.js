let _index;

export async function loadIndex(){ const res = await fetch("data/index.json"); _index = await res.json(); return _index; }
export async function loadSpots(){ const res = await fetch("data/spots.json"); const data = await res.json(); return Array.isArray(data) ? data : []; }

export function aliasToCategory(v){
  if (!_index?.categories) return v;
  const needle = (v||"").toLowerCase().trim();
  const hit = _index.categories.find(c =>
    c.slug === v || c.slug.toLowerCase() === needle ||
    (c.aliases||[]).some(a => a.toLowerCase().trim() === needle)
  );
  return hit ? hit.slug : v;
}

export function getCategoryLabel(slug, lang="de"){
  const c = _index?.categories?.find(x => x.slug === slug);
  if (!c) return slug;
  const byLang = { de: c.label_de, en: c.label_en || c.label_de, da: c.label_da || c.label_de };
  return byLang[lang] || c.label_de || slug;
}
export function allCategorySlugs(){ return (_index?.categories||[]).map(c=>c.slug); }