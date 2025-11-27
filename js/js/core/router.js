export function parseHash(hash){
  const out = {};
  (hash.replace(/^#/, "").split("&").filter(Boolean)).forEach(kv=>{
    const [k, v] = kv.split("=");
    if (k === "verifiedOnly" || k === "favoritesOnly") out[k] = v === "1";
    else if (k === "category") out[k] = v || null;
    else if (k === "query") out[k] = decodeURIComponent(v || "");
    else if (k === "spotId") out[k] = v;
  });
  return out;
}
export function pushHash(state){
  const params = [];
  if (state.query) params.push("query=" + encodeURIComponent(state.query));
  if (state.category) params.push("category=" + state.category);
  if (state.verifiedOnly) params.push("verifiedOnly=1");
  if (state.favoritesOnly) params.push("favoritesOnly=1");
  const h = "#" + params.join("&");
  if (location.hash !== h) history.replaceState(null, "", h || "#");
}