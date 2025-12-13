// js/ui/skip-to-spots.js
import { qs } from "../utils/dom.js";

export function initSkipToSpots(onSkipCallback = () => {}) {
  const btnSkipSpots = qs("#btn-skip-spots");
  btnSkipSpots?.addEventListener("click", () => {
    const spotsTitle = qs("#spots-title");
    if (spotsTitle) {
      spotsTitle.scrollIntoView({ behavior: "smooth", block: "start" });
      spotsTitle.focus?.({ preventScroll: true });
    }
    onSkipCallback(); // optional z. B. um Menü zu schließen
  });
}