/**
 * Zerlegt die URL-Hash-Parameter in ein lesbares Objekt.
 * Beispiel: #query=test&category=spielplatz
 */
export function parseHash(hash) {
  const out = {};
  (hash.replace(/^#/, "").split("&").filter(Boolean)).forEach(kv => {
    const [k, v] = kv.split("=");

    switch (k) {
      case "verifiedOnly":
      case "favoritesOnly":
        out[k] = v === "1";
        break;
      case "category":
        out[k] = v || null;
        break;
      case "query":
        out[k] = decodeURIComponent(v || "");
        break;
      case "spotId":
        out[k] = v;
        break;
      // Optional: weitere Parameter hier unterstützen
      case "radiusIndex":
        out[k] = parseInt(v, 10);
        break;
      case "mood":
        out[k] = v || null;
        break;
      case "ageGroup":
        out[k] = v || "all";
        break;
      case "travelMode":
        out[k] = v || null;
        break;
    }
  });

  return out;
}

/**
 * Erzeugt einen URL-Hash basierend auf dem Filter-Zustand
 */
export function pushHash(state) {
  const params = [];

  if (state.query) params.push("query=" + encodeURIComponent(state.query));
  if (state.category) params.push("category=" + state.category);
  if (state.verifiedOnly) params.push("verifiedOnly=1");
  if (state.favoritesOnly) params.push("favoritesOnly=1");
  if (typeof state.radiusIndex === "number") params.push("radiusIndex=" + state.radiusIndex);
  if (state.mood) params.push("mood=" + state.mood);
  if (state.ageGroup && state.ageGroup !== "all") params.push("ageGroup=" + state.ageGroup);
  if (state.travelMode) params.push("travelMode=" + state.travelMode);
  if (state.spotId) params.push("spotId=" + state.spotId);

  const h = "#" + params.join("&");
  if (location.hash !== h) history.replaceState(null, "", h || "#");
}
