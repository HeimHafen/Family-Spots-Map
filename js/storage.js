export function isFav(id){
  const favs = JSON.parse(localStorage.getItem("fsm.favorites") || "[]");
  return favs.includes(id);
}
export function toggleFav(id){
  const favs = new Set(JSON.parse(localStorage.getItem("fsm.favorites") || "[]"));
  if (favs.has(id)) favs.delete(id); else favs.add(id);
  localStorage.setItem("fsm.favorites", JSON.stringify([...favs]));
}