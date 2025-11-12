// Family Spots Map – data helpers
let _index = null;

export async function loadIndex() {
  const res = await fetch("data/index.json", { cache: "no-cache" });
  _index = await res.json();
  return _index;
}

export async function loadSpots() {
  const res = await fetch("data/spots.json", { cache: "no-cache" });
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Normalisiert eine Eingabe (Alias) auf einen gültigen Kategorie-Slug.
 */
export function aliasToCategory(v) {
  if (!_index || !_index.categories) return v;
  const needle = (v || "").toString().toLowerCase().trim();

  for (let i = 0; i < _index.categories.length; i++) {
    const c = _index.categories[i];
    if (!c) continue;

    const slug = (c.slug || "").toLowerCase().trim();
    if (slug === needle || c.slug === v) return c.slug;

    const aliases = Array.isArray(c.aliases) ? c.aliases : [];
    for (let j = 0; j < aliases.length; j++) {
      if ((aliases[j] || "").toLowerCase().trim() === needle) return c.slug;
    }
  }
  return v;
}

/**
 * Liefert das Label einer Kategorie in der gewünschten Sprache.
 * Fallback: de → slug
 */
export function getCategoryLabel(slug, lang = "de") {
  if (!_index || !_index.categories) return slug;
  let cat = null;
  for (let i = 0; i < _index.categories.length; i++) {
    if (_index.categories[i].slug === slug) { cat = _index.categories[i]; break; }
  }
  if (!cat) return slug;

  const byLang = {
    de: cat.label_de,
    en: cat.label_en || cat.label_de,
    da: cat.label_da || cat.label_de
  };
  return byLang[lang] || cat.label_de || slug;
}

export function allCategorySlugs() {
  if (!_index || !_index.categories) return [];
  const arr = [];
  for (let i = 0; i < _index.categories.length; i++) {
    const c = _index.categories[i];
    if (c && c.slug) arr.push(c.slug);
  }
  return arr;
}