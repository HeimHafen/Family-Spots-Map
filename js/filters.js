export const state = { category:null, query:"", verifiedOnly:false, favoritesOnly:false };
const normalize = (s)=> (s||"").toString().toLowerCase();

export function applyFilters(spots){
  const q = normalize(state.query);
  const cat = state.category;
  const favs = new Set(JSON.parse(localStorage.getItem("fsm.favorites") || "[]"));

  return spots.filter(s => {
    if (cat && s.category !== cat) return false;
    if (state.verifiedOnly && !s.verified) return false;
    if (state.favoritesOnly && !favs.has(s.id)) return false;
    if (q){
      const hay = [s.name, s.city, s.address, ...(s.tags||[]), ...(s.usp||[])].map(normalize).join(" ");
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}