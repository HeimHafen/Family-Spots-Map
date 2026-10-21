// Spot detail view: rendering, gallery, visitor information and route links.
// Personal data and map/location calculations remain in their existing owners.
import { FEATURES, LANG_EN, LANG_DA } from "../config.js";
import { createCrownIcon } from "../utils/dom.js?v=20261010-unified-4";

/**
 * Create one detail-view controller for the application lifetime.
 * Element/language getters read the current app state when needed.
 * Callbacks keep storage and map calculations outside this UI module.
 * Expanded galleries and visitor information belong to this controller.
 */
export function createSpotDetailsController({
  getElement,
  getListElement,
  getLastTrigger,
  getLanguage,
  getSpotId,
  getSpotName,
  getSpotSubtitle,
  getSpotMetaParts,
  getSpotDisplayTags,
  buildSpotBadges,
  getRouteUrlsForSpotFromUserLocation,
  syncFavButtonState,
  toggleFavorite,
  translate: t
}) {
  let openDetailSpot = null;

  function closeSpotDetails({ returnFocus = true } = {}) {
    const spotDetailEl = getElement();
    const spotListEl = getListElement();
    const lastSpotTriggerEl = getLastTrigger();
    if (!spotDetailEl) return;

    const closedId = openDetailSpot ? String(getSpotId(openDetailSpot)) : null;
    openDetailSpot = null;
    spotDetailEl.classList.add("spot-details--hidden");
    spotDetailEl.replaceChildren();
    spotDetailEl.removeAttribute("aria-labelledby");

    if (returnFocus) {
      const card = [...(spotListEl?.querySelectorAll(".spot-card") || [])].find(element => element.dataset.spotId === closedId);
      const target = lastSpotTriggerEl?.isConnected ? lastSpotTriggerEl : card?.querySelector(".spot-card-open");
      target?.focus({ preventScroll: true });
    }
  }

  // Einheitliche Besuchsinformationen; alle Texte werden als Textknoten eingesetzt.
  const VISIT_DETAIL_LABELS = {
    de: {title: "Euren Besuch planen", suitability: "Für wen geeignet?", duration: "Zeitbedarf", arrival: "Adresse und Anreise", admission: "Eintritt und Buchung", hours: "Öffnungszeiten", comfort: "Familienkomfort", food: "Essen und Trinken", accessibility: "Zugänglichkeit", tips: "Gut zu wissen", unknown: "Nicht bestätigt.", sources: "Quellen und Aktualität", source: "Quelle", checked: "Besuchshinweise geprüft", noSources: "Keine bestätigten Besuchshinweise verfügbar.", note: "Die Quellen bestätigen einzelne Angaben. Preise, Zeiten und Bedingungen bitte vor der Anreise prüfen.", partial: "Weitere Angaben nicht bestätigt."},
    en: {title: "Plan your visit", suitability: "Who is it suitable for?", duration: "Suggested visit length", arrival: "Address and getting there", admission: "Admission and booking", hours: "Opening hours", comfort: "Family facilities", food: "Food and drinks", accessibility: "Accessibility", tips: "Good to know", unknown: "Not confirmed.", sources: "Sources and updates", source: "Source", checked: "Visitor information checked", noSources: "No confirmed visitor information available.", note: "Sources confirm individual details. Check prices, times and conditions before travelling.", partial: "Further details not confirmed."},
    da: {title: "Planlæg jeres besøg", suitability: "Hvem passer stedet til?", duration: "Tidsforbrug", arrival: "Adresse og transport", admission: "Entré og booking", hours: "Åbningstider", comfort: "Familiefaciliteter", food: "Mad og drikke", accessibility: "Tilgængelighed", tips: "Godt at vide", unknown: "Ikke bekræftet.", sources: "Kilder og aktualitet", source: "Kilde", checked: "Besøgsoplysninger tjekket", noSources: "Ingen bekræftede besøgsoplysninger tilgængelige.", note: "Kilderne bekræfter enkelte oplysninger. Kontrollér priser, tider og vilkår før besøget.", partial: "Yderligere oplysninger er ikke bekræftet."}
  };

  const expandedVisitInfoSpots = new Set();
  const expandedSpotGalleries = new Set();

  function appendSpotGallery(container, spot) {
    const currentLang = getLanguage();
    const labels = {
      de: {show: "Bilder ansehen", hide: "Bilder ausblenden", test: "KI-Testbilder zur Vorschau. Eingang, Spielplatz und Wege sind beispielhaft dargestellt und zeigen nicht die tatsächlichen Gegebenheiten des Wildgatters.", open: "Bild in voller Größe öffnen (neuer Tab)", missing: "Dieses Bild ist gerade nicht verfügbar."},
      en: {show: "View pictures", hide: "Hide pictures", test: "AI test images for preview. The entrance, playground and paths are illustrative and do not show the actual facilities at Wildgatter.", open: "Open full-size image (new tab)", missing: "This image is currently unavailable."},
      da: {show: "Se billeder", hide: "Skjul billeder", test: "AI-testbilleder til forhåndsvisning. Indgang, legeplads og stier er eksempler og viser ikke de faktiske forhold i Wildgatter.", open: "Åbn billedet i fuld størrelse (ny fane)", missing: "Dette billede er ikke tilgængeligt lige nu."}
    }[currentLang];
    const photos = Array.isArray(spot.photos) ? spot.photos.filter(photo =>
      /^assets\/spots\/[a-z0-9/_-]+\.(?:webp|png|jpe?g)$/i.test(photo?.src || "") &&
      !photo.src.includes("..") && typeof photo.alt?.[currentLang] === "string" && photo.alt[currentLang].trim()
    ) : [];
    if (!photos.length) return;
    const id = getSpotId(spot);
    const details = document.createElement("details");
    details.className = "spot-gallery";
    details.open = expandedSpotGalleries.has(id);
    const summary = document.createElement("summary");
    summary.className = "spot-gallery__summary";
    const arrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    arrow.setAttribute("viewBox", "0 0 24 24");
    arrow.setAttribute("aria-hidden", "true");
    arrow.setAttribute("focusable", "false");
    arrow.classList.add("spot-gallery__arrow");
    const arrowPath = document.createElementNS(arrow.namespaceURI, "path");
    arrowPath.setAttribute("d", "M9 5l7 7-7 7");
    arrow.appendChild(arrowPath);
    const summaryLabel = document.createElement("span");
    summary.append(arrow, summaryLabel);
    const setLabel = () => { summaryLabel.textContent = `${details.open ? labels.hide : labels.show} (${photos.length})`; };
    setLabel();
    details.appendChild(summary);
    details.addEventListener("toggle", () => {
      if (!details.isConnected) return;
      if (details.open) expandedSpotGalleries.add(id); else expandedSpotGalleries.delete(id);
      setLabel();
    });
    if (photos.some(photo => photo.kind === "ai_test")) {
      const note = document.createElement("p");
      note.className = "spot-gallery__notice";
      note.textContent = labels.test;
      details.appendChild(note);
    }
    const grid = document.createElement("div");
    grid.className = "spot-gallery__grid";
    photos.forEach((photo, index) => {
      const figure = document.createElement("figure");
      figure.className = "spot-gallery__figure";
      const link = document.createElement("a");
      link.className = "spot-gallery__link";
      link.dataset.galleryIndex = String(index);
      link.href = photo.src;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", `${photo.caption?.[currentLang] || photo.alt[currentLang]} – ${labels.open}`);
      const img = document.createElement("img");
      img.className = "spot-gallery__image";
      img.alt = photo.alt[currentLang];
      img.width = Number.isInteger(photo.width) && photo.width > 0 ? photo.width : 1536;
      img.height = Number.isInteger(photo.height) && photo.height > 0 ? photo.height : 1024;
      img.loading = "lazy";
      img.decoding = "async";
      const missing = document.createElement("p");
      missing.className = "spot-gallery__missing";
      missing.textContent = labels.missing;
      missing.hidden = true;
      img.addEventListener("error", () => {
        const hadFocus = document.activeElement === link;
        link.hidden = true;
        if (hadFocus) summary.focus({preventScroll: true});
        missing.hidden = false;
      });
      img.src = photo.src;
      link.appendChild(img);
      figure.append(link, missing);
      const caption = document.createElement("figcaption");
      caption.className = "spot-gallery__caption";
      caption.textContent = photo.caption?.[currentLang] || "";
      figure.appendChild(caption);
      grid.appendChild(figure);
    });
    details.appendChild(grid);
    container.appendChild(details);
  }

  const expandedParkingSpots = new Set();

  function appendParkingInformation(container, spot) {
    const lang = ["de", "en", "da"].includes(getLanguage()) ? getLanguage() : "de";
    const labels = {
      de: {title: "Parken & Fußweg", location: "Wo parken?", cost: "Kosten & Parkdauer", walk: "Letztes Stück zu Fuß", vehicle: "Wohnmobil & Fahrzeug", note: "Gut zu wissen", unknown: "Noch keine verlässlich zugeordnete Parkmöglichkeit hinterlegt.", unclear: "Der genaue Standort ist noch ungeklärt. Deshalb empfehlen wir hier noch keinen Parkplatz.", missing: "Nicht bestätigte Kosten, Fußwege und Fahrzeuggrenzen bleiben offen.", source: "Parkhinweise und Quelle", checked: "Parkhinweise geprüft", existing: "Bisherige Hinweise; nicht erneut bestätigt.", mixed: "Offizielle Wegbeschreibung und unsere Besuchserfahrung; aktuelle Parkregeln offen.", booking: "Stellplatzbuchung; keine bestätigte Tagesparkfläche.", search: "Parkplatzsuche öffnen", point: "Gemeldeten Parkplatz öffnen", mapsNote: "Die Kartensuche zeigt die genannte Parkmöglichkeit; bitte Zufahrt und Beschilderung prüfen."},
      en: {title: "Parking & walk", location: "Where to park", cost: "Charges & time limits", walk: "Final walk", vehicle: "Motorhome & vehicle", note: "Good to know", unknown: "No reliably identified parking option recorded yet.", unclear: "The exact location is still unconfirmed, so we cannot recommend parking here yet.", missing: "Unconfirmed charges, walking routes and vehicle limits remain unknown.", source: "Parking information and source", checked: "Parking information checked", existing: "Existing guidance; not rechecked.", mixed: "Official walking information and our visit experience; current parking rules unconfirmed.", booking: "Pitch booking; no confirmed day-visitor parking.", search: "Open parking search", point: "Open reported parking location", mapsNote: "The map search shows the named parking option; check access and signs."},
      da: {title: "Parkering & gangrute", location: "Hvor kan I parkere?", cost: "Pris & tidsgrænser", walk: "Sidste stykke til fods", vehicle: "Autocamper & køretøj", note: "Godt at vide", unknown: "Der er endnu ikke registreret en sikkert identificeret parkeringsmulighed.", unclear: "Den præcise placering er uafklaret, så vi anbefaler endnu ikke parkering her.", missing: "Ubekræftede priser, gangruter og køretøjsgrænser er stadig uafklarede.", source: "Parkeringsoplysninger og kilde", checked: "Parkeringsoplysninger tjekket", existing: "Tidligere oplysninger; ikke tjekket igen.", mixed: "Officiel rutebeskrivelse og vores besøgserfaring; aktuelle parkeringsregler uafklarede.", booking: "Bestilling af plads; ingen bekræftet parkering til dagsgæster.", search: "Åbn parkeringssøgning", point: "Åbn det oplyste parkeringssted", mapsNote: "Kortsøgningen viser den nævnte parkering; tjek indkørsel og skiltning."}
    }[lang];
    const info = spot.parking_information;
    const details = document.createElement("details");
    details.className = "spot-parking";
    const id = getSpotId(spot);
    details.open = expandedParkingSpots.has(id);
    details.addEventListener("toggle", () => {
      if (!details.isConnected) return;
      if (details.open) expandedParkingSpots.add(id); else expandedParkingSpots.delete(id);
    });
    const summary = document.createElement("summary");
    summary.textContent = labels.title;
    details.appendChild(summary);
    if (!info || info.schema_version !== 1 || ["unknown", "location_unconfirmed"].includes(info.status)) {
      const p = document.createElement("p");
      p.textContent = info?.status === "location_unconfirmed" ? labels.unclear : labels.unknown;
      details.appendChild(p);
      container.appendChild(details);
      return;
    }
    const list = document.createElement("dl");
    list.className = "spot-parking__facts";
    for (const key of ["location", "cost", "walk", "vehicle", "note"]) {
      const value = info.facts?.[key]?.[lang];
      if (typeof value !== "string" || !value.trim()) continue;
      const row = document.createElement("div");
      row.dataset.parkingFact = key;
      const term = document.createElement("dt");
      term.textContent = labels[key];
      const definition = document.createElement("dd");
      definition.textContent = value;
      row.append(term, definition);
      list.appendChild(row);
    }
    details.appendChild(list);
    const navigation = info.navigation;
    let mapUrl;
    if (navigation?.kind === "search" && typeof navigation.query === "string" && navigation.query.trim()) {
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(navigation.query)}`;
    } else if (navigation?.kind === "coordinates" && Number.isFinite(navigation.lat) && Math.abs(navigation.lat) <= 90 && Number.isFinite(navigation.lon) && Math.abs(navigation.lon) <= 180) {
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(navigation.lat + "," + navigation.lon)}`;
    }
    if (mapUrl) {
      const a = document.createElement("a");
      a.className = "btn-ghost btn-small spot-parking__map";
      a.href = mapUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = navigation.kind === "search" ? labels.search : labels.point;
      details.appendChild(a);
    }
    for (const alternative of Array.isArray(info.alternatives) ? info.alternatives : []) {
      if (alternative?.kind !== "search" || typeof alternative.query !== "string" || !alternative.query.trim() || !alternative.label?.[lang]) continue;
      const a = document.createElement("a");
      a.className = "btn-ghost btn-small spot-parking__alternative";
      a.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alternative.query)}`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = alternative.label[lang];
      details.appendChild(a);
    }
    const evidence = document.createElement("p");
    evidence.className = "spot-parking__evidence";
    if (info.status === "source_supported" && /^\d{4}-\d{2}-\d{2}$/.test(info.checked_at || "")) {
      evidence.textContent = labels.checked + ": ";
      const time = document.createElement("time");
      time.dateTime = info.checked_at;
      time.textContent = new Intl.DateTimeFormat({de: "de-DE", en: "en-GB", da: "da-DK"}[lang], {dateStyle: "medium", timeZone: "UTC"}).format(new Date(info.checked_at + "T12:00:00Z"));
      evidence.appendChild(time);
    } else {
      evidence.textContent = info.status === "mixed" ? labels.mixed : info.status === "booking_required" ? labels.booking : labels.existing;
    }
    const sourceUrls = [...new Set(info.source_urls || [])];
    for (const value of sourceUrls) {
      try {
        const url = new URL(value);
        if (url.protocol !== "https:" || url.username || url.password) continue;
        const a = document.createElement("a");
        a.href = url.href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = url.hostname.replace(/^www\./, "");
        a.title = labels.source;
        evidence.append(" · ", a);
      } catch { /* Invalid evidence must not break the detail view. */ }
    }
    details.appendChild(evidence);
    if (!["cost", "walk", "vehicle"].every(key => info.facts?.[key]?.[lang])) {
      const p = document.createElement("p");
      p.className = "spot-parking__evidence";
      p.textContent = labels.missing;
      details.appendChild(p);
    }
    if (navigation?.kind === "search" && mapUrl) {
      const p = document.createElement("p");
      p.className = "spot-parking__evidence";
      p.textContent = labels.mapsNote;
      details.appendChild(p);
    }
    container.appendChild(details);
  }

  function appendVisitDetails(container, spot) {
    const currentLang = getLanguage();
    const details = spot?.visit_details;
    if (details?.schema_version !== 1 || !details.sections || typeof details.sections !== "object") return false;
    const lang = Object.hasOwn(VISIT_DETAIL_LABELS, currentLang) ? currentLang : "de";
    const labels = VISIT_DETAIL_LABELS[lang];
    const section = document.createElement("section");
    section.className = "spot-visit-info";
    section.id = "spot-visit-information";
    const spotId = getSpotId(spot);
    section.hidden = !expandedVisitInfoSpots.has(spotId);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "btn-ghost btn-small spot-visit-info__toggle";
    toggle.setAttribute("aria-label", labels.title);
    toggle.setAttribute("aria-controls", section.id);
    toggle.setAttribute("aria-expanded", String(!section.hidden));
    toggle.title = labels.title;
    toggle.addEventListener("click", () => {
      section.hidden = !section.hidden;
      toggle.setAttribute("aria-expanded", String(!section.hidden));
      if (section.hidden) expandedVisitInfoSpots.delete(spotId);
      else expandedVisitInfoSpots.add(spotId);
    });
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("width", "20");
    icon.setAttribute("height", "20");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    const circle = document.createElementNS(icon.namespaceURI, "circle");
    circle.setAttribute("cx", "12");
    circle.setAttribute("cy", "12");
    circle.setAttribute("r", "10");
    const glyph = document.createElementNS(icon.namespaceURI, "path");
    glyph.setAttribute("d", "M12 11v6M12 7h.01");
    icon.append(circle, glyph);
    toggle.appendChild(icon);
    container.querySelector(".spot-details-actions")?.prepend(toggle);
    section.setAttribute("aria-label", labels.title);
    const heading = document.createElement("h4");
    heading.className = "spot-visit-info__heading";
    heading.textContent = labels.title;
    section.appendChild(heading);
    const overview = spot.visit_overview?.[lang];
    if (typeof overview === "string" && overview.trim()) {
      const p = document.createElement("p");
      p.textContent = overview;
      section.appendChild(p);
    }
    const list = document.createElement("dl");
    list.className = "spot-visit-info__list";
    for (const key of ["suitability", "duration", "arrival", "admission", "hours", "comfort", "food", "accessibility", "tips"]) {
      const field = details.sections[key];
      const row = document.createElement("div");
      row.className = "spot-visit-info__row";
      row.dataset.visitSection = key;
      const term = document.createElement("dt");
      term.textContent = labels[key];
      const definition = document.createElement("dd");
      const items = Array.isArray(field?.items) ? field.items : [];
      const texts = [...new Set(items.map(item => typeof item?.text?.[lang] === "string" ? item.text[lang].trim() : "").filter(Boolean))];
      if (texts.length) {
        for (const text of texts) {
          const p = document.createElement("p");
          p.textContent = text;
          definition.appendChild(p);
        }
      } else {
        definition.className = "spot-visit-info__unknown";
        definition.textContent = labels.unknown;
      }
      row.append(term, definition);
      list.appendChild(row);
    }
    section.appendChild(list);
    const sources = document.createElement("details");
    sources.className = "spot-visit-info__sources";
    const summary = document.createElement("summary");
    summary.textContent = labels.sources;
    sources.appendChild(summary);
    const newUrls = Array.isArray(spot.visitor_information?.source_urls) ? spot.visitor_information.source_urls : [];
    const urls = [...new Set(newUrls.length ? newUrls : (Array.isArray(spot.source_urls) ? spot.source_urls : []))];
    let linked = 0;
    for (const value of urls) {
      try {
        const url = new URL(value);
        if (url.protocol !== "https:" || url.username || url.password) continue;
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.href = url.href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        const sourceLabel = spot.source_labels?.[url.href]?.[lang];
        a.textContent = typeof sourceLabel === "string" && sourceLabel.trim()
          ? sourceLabel
          : `${labels.source} ${linked + 1}: ${url.hostname.replace(/^www\./, "")}`;
        p.appendChild(a);
        sources.appendChild(p);
        linked += 1;
      } catch { /* Eine ungültige URL darf die Detailansicht nicht blockieren. */ }
    }
    const checked = spot.visitor_information?.checked_at;
    if (linked && newUrls.length && typeof checked === "string" && /^\d{4}-\d{2}-\d{2}$/.test(checked)) {
      const date = new Date(`${checked}T12:00:00Z`);
      if (Number.isFinite(date.getTime())) {
        const p = document.createElement("p");
        const time = document.createElement("time");
        time.dateTime = checked;
        time.textContent = new Intl.DateTimeFormat({de: "de-DE", en: "en-GB", da: "da-DK"}[lang], {dateStyle: "medium", timeZone: "UTC"}).format(date);
        p.append(`${labels.checked}: `, time);
        sources.appendChild(p);
      }
    }
    if (!newUrls.length || !linked) {
      const p = document.createElement("p");
      p.textContent = labels.noSources;
      sources.appendChild(p);
    }
    const note = document.createElement("p");
    note.className = "spot-visit-info__note";
    note.textContent = labels.note;
    sources.appendChild(note);
    section.appendChild(sources);
    container.appendChild(section);
    return true;
  }

  function showSpotDetails(spot, { focus = false } = {}) {
    const spotDetailEl = getElement();
    const currentLang = getLanguage();
    if (!spotDetailEl) return;
    const sameSpot = openDetailSpot && getSpotId(openDetailSpot) === getSpotId(spot);
    const previousScroll = spotDetailEl.scrollTop;
    const active = document.activeElement;
    const activeSelector = spotDetailEl.contains(active)
      ? active.matches(".spot-gallery__link") ? `.spot-gallery__link[data-gallery-index="${Number(active.dataset.galleryIndex)}"]`
      : [".spot-details-title", ".spot-visit-info__toggle", ".spot-details-favorite", ".spot-details-close", ".spot-gallery__summary", ".spot-parking > summary", ".spot-parking__map", '.spot-details-route-link[data-route-provider="apple"]', '.spot-details-route-link[data-route-provider="google"]']
        .find(selector => active.matches(selector)) : null;
    openDetailSpot = spot;

    const spotId = getSpotId(spot);
    const name = getSpotName(spot);
    const subtitle = getSpotSubtitle(spot);
    const metaParts = getSpotMetaParts(spot);

    const tags = getSpotDisplayTags(spot);

    let description = "";

    if (currentLang === LANG_EN) {
      description =
        spot.summary_en ||
        spot.poetry ||
        spot.description ||
        spot.text ||
        "";
    } else if (currentLang === LANG_DA) {
      description =
        spot.summary_da ||
        spot.summary_de ||
        spot.poetry ||
        spot.description ||
        spot.text ||
        "";
    } else {
      description =
        spot.summary_de ||
        spot.poetry ||
        spot.description ||
        spot.text ||
        "";
    }

    const addressParts = [];

    if (spot.address) addressParts.push(spot.address);
    if (spot.postcode) addressParts.push(spot.postcode);
    if (spot.city) addressParts.push(spot.city);

    if (!addressParts.length && subtitle) {
      addressParts.push(subtitle);
    }

    const addressText = addressParts.join(", ");

    spotDetailEl.replaceChildren();
    spotDetailEl.classList.remove("spot-details--hidden");

    const headerEl = document.createElement("div");
    headerEl.className = "spot-details-header";

    const titleWrapperEl = document.createElement("div");

    const titleEl = document.createElement("h3");
    titleEl.className = "spot-details-title";
    titleEl.id = "spot-detail-title";
    titleEl.tabIndex = -1;
    titleEl.textContent = name;
    spotDetailEl.setAttribute("aria-labelledby", titleEl.id);

    titleWrapperEl.appendChild(titleEl);

    const actionsEl = document.createElement("div");
    actionsEl.className = "spot-details-actions";

    if (FEATURES.favorites) {
      const favBtn = document.createElement("button");
      favBtn.type = "button";
      favBtn.className = "btn-ghost btn-small spot-details-favorite";

      syncFavButtonState(favBtn, spotId);

      favBtn.addEventListener("click", () => {
        toggleFavorite(spot);
        syncFavButtonState(favBtn, spotId);
      });

      actionsEl.appendChild(favBtn);
    }

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "btn-ghost btn-small spot-details-close";

    closeBtn.textContent =
      currentLang === LANG_EN
        ? "Close"
        : currentLang === LANG_DA
          ? "Luk"
          : "Schließen";

    closeBtn.addEventListener("click", () => {
      closeSpotDetails({ returnFocus: true });
    });

    actionsEl.appendChild(closeBtn);

    headerEl.appendChild(titleWrapperEl);
    headerEl.appendChild(actionsEl);

    spotDetailEl.appendChild(headerEl);

    if (metaParts.length) {
      const metaEl = document.createElement("div");
      metaEl.className = "spot-details-meta";

      metaParts.forEach((part) => {
        const span = document.createElement("span");
        span.textContent = part;

        metaEl.appendChild(span);
      });

      spotDetailEl.appendChild(metaEl);
    }

    if (description) {
      const descEl = document.createElement("p");
      descEl.className = "spot-details-description";
      descEl.textContent = description;

      spotDetailEl.appendChild(descEl);
    }

    appendSpotGallery(spotDetailEl, spot);
    const hasStructuredVisitDetails = appendVisitDetails(spotDetailEl, spot);

    if (addressText && !hasStructuredVisitDetails) {
      const addrEl = document.createElement("p");
      addrEl.className = "spot-details-address";
      addrEl.textContent = addressText;

      spotDetailEl.appendChild(addrEl);
    }

    const detailBadges = buildSpotBadges(spot).filter(badge => !badge.className.split(/\s+/).includes("badge--time"));

    if (detailBadges.length) {
      const detailBadgesContainer = document.createElement("div");
      detailBadgesContainer.className = "spot-details-scores";

      detailBadges.forEach((badge) => {
        const badgeEl = document.createElement("span");
        badgeEl.className = badge.className;

        if (badge.title) badgeEl.title = badge.title;

        if (badge.icon) {
          const iconEl = document.createElement("span");
          iconEl.className = "badge__icon";
          if (badge.icon === "crown") iconEl.appendChild(createCrownIcon());
          else iconEl.textContent = badge.icon;

          badgeEl.appendChild(iconEl);
        }

        const labelEl = document.createElement("span");
        labelEl.textContent = badge.label;

        badgeEl.appendChild(labelEl);
        detailBadgesContainer.appendChild(badgeEl);
      });

      spotDetailEl.appendChild(detailBadgesContainer);
    }

    const routeUrls = getRouteUrlsForSpotFromUserLocation(spot);

    if (routeUrls) {
      const routesEl = document.createElement("div");
      routesEl.className = "spot-details-routes";

      const appleLink = document.createElement("a");
      appleLink.href = routeUrls.apple;
      appleLink.target = "_blank";
      appleLink.rel = "noopener noreferrer";
      appleLink.className = "spot-details-route-link";
      setMapRouteLinkContent(appleLink, "apple");

      const googleLink = document.createElement("a");
      googleLink.href = routeUrls.google;
      googleLink.target = "_blank";
      googleLink.rel = "noopener noreferrer";
      googleLink.className = "spot-details-route-link";
      setMapRouteLinkContent(googleLink, "google");

      routesEl.appendChild(appleLink);
      routesEl.appendChild(googleLink);

      spotDetailEl.appendChild(routesEl);
    }

    appendParkingInformation(spotDetailEl, spot);

    if (tags.length) {
      const tagsEl = document.createElement("div");
      tagsEl.className = "spot-details-tags";

      tags.forEach((tag) => {
        const span = document.createElement("span");
        span.className = "badge badge--soft";
        span.textContent = tag;

        tagsEl.appendChild(span);
      });

      spotDetailEl.appendChild(tagsEl);
    }

    if (typeof spotDetailEl.scrollTop === "number") {
      spotDetailEl.scrollTop = !focus && sameSpot ? previousScroll : 0;
    }
    if (focus) titleEl.focus();
    else if (activeSelector) spotDetailEl.querySelector(activeSelector)?.focus({ preventScroll: true });
  }

  // Monochrome brand glyphs from Simple Icons (CC0); no remote icon dependency.
  function setMapRouteLinkContent(link, provider) {
    const currentLang = getLanguage();
    link.dataset.routeProvider = provider;
    const paths = {
      apple: "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701",
      google: "M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
    };
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    icon.setAttribute("focusable", "false");
    icon.classList.add("spot-route-icon");
    const path = document.createElementNS(icon.namespaceURI, "path");
    path.setAttribute("d", paths[provider]);
    icon.appendChild(path);
    const label = document.createElement("span");
    label.textContent = provider === "apple"
      ? {de: "Apple Karten", en: "Apple Maps", da: "Apple Maps"}[currentLang]
      : "Google Maps";
    link.setAttribute("aria-label", t(provider === "apple" ? "route_apple" : "route_google"));
    link.append(icon, label);
  }

  // Update location-dependent UI without rebuilding open details or moving focus.
  function refreshDetailLocation() {
    const spotDetailEl = getElement();
    if (!openDetailSpot || !spotDetailEl) return;
    const urls = getRouteUrlsForSpotFromUserLocation(openDetailSpot);
    const links = spotDetailEl.querySelectorAll(".spot-details-route-link");
    if (urls && links.length === 2) {
      links[0].href = urls.apple;
      links[1].href = urls.google;
    }
    const badge = buildSpotBadges(openDetailSpot).find(item => item.className.includes("badge--distance"));
    let element = spotDetailEl.querySelector(".badge--distance");
    if (!badge) { element?.remove(); return; }
    if (!element) {
      let scores = spotDetailEl.querySelector(".spot-details-scores");
      if (!scores) {
        scores = document.createElement("div");
        scores.className = "spot-details-scores";
        const routes = spotDetailEl.querySelector(".spot-details-routes");
        if (routes) routes.before(scores);
        else spotDetailEl.appendChild(scores);
      }
      element = document.createElement("span");
      element.className = badge.className;
      const icon = document.createElement("span");
      icon.className = "badge__icon";
      icon.textContent = badge.icon;
      element.append(icon, document.createElement("span"));
      scores.prepend(element);
    }
    element.title = badge.title;
    element.lastElementChild.textContent = badge.label;
  }

  return {
    show: showSpotDetails,
    close: closeSpotDetails,
    refreshLocation: refreshDetailLocation,
    getOpenSpot: () => openDetailSpot
  };
}
