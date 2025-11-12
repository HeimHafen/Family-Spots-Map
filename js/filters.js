// Family Spots Map – filtering
export const state = {
  category: null,
  query: "",
  verifiedOnly: false,
  favoritesOnly: false
};

const normalize = (s) => (s || "").toString().toLowerCase();

/**
 * Wendet alle aktiven Filter auf die übergebenen Spots an.
 */
export function applyFilters(spots) {
  const q = normalize(state.query);
  const cat = state.category;
  const favs = new Set(JSON.parse(localStorage.getItem("fsm.favorites") || "[]"));

  const out = [];
  for (let i = 0; i < spots.length; i++) {
    const s = spots[i];
    if (!s) continue;

    if (cat && s.category !== cat) continue;
    if (state.verifiedOnly && !s.verified) continue;
    if (state.favoritesOnly && !favs.has(s.id)) continue;

    if (q) {
      const parts = [
        s.name, s.city, s.address,
        ...(Array.isArray(s.tags) ? s.tags : []),
        ...(Array.isArray(s.usp) ? s.usp : [])
      ];
      const hay = parts.map(normalize).join(" ");
      if (hay.indexOf(q) === -1) continue;
    }
    out.push(s);
  }
  return out;
}