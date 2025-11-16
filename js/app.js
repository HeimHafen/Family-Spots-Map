// js/app.js

import { $, $$, getGeolocation } from "./utils.js";
import {
  getSettings,
  saveSettings,
  getFavorites,
  toggleFavorite,
  getPlusStatus,
  savePlusStatus,
} from "./storage.js";
import { initI18n, applyTranslations, getLanguage, t } from "./i18n.js";
import {
  loadAppData,
  getSpots,
  getCategories,
  findSpotById,
} from "./data.js";
import {
  initFilters,
  applyFilters,
  refreshCategorySelect,
  getRadiusKmForIndex,
} from "./filters.js";
import { initMap, setSpotsOnMap, focusOnSpot, getMap, updateRadiusCircle } from "./map.js";
import { renderSpotList, renderSpotDetails, showToast } from "./ui.js";
import "./sw-register.js";

let currentFilterState = null;
let allSpots = [];
let filteredSpots = [];
let plusStatus = null;
let partnerCodesCache = null;
let currentSelectedSpotId = null;

// -----------------------------------------------------
// Bootstrap
// -----------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  bootstrapApp().catch((err) => {
    console.error(err);
    showToast(
      t(
        "error_data_load",
        "Ups – die Daten konnten gerade nicht geladen werden. Bitte versuch es gleich noch einmal.",
      ),
    );
  });
});

async function bootstrapApp() {
  const settings = getSettings();
  applyTheme(settings.theme);

  await initI18n(settings.language);
  applyTranslations();
  updateStaticLanguageTexts(getLanguage());

  const { index } = await loadAppData();
  allSpots = getSpots();
  const categories = getCategories();

  // Plus-Status laden
  plusStatus = getPlusStatus();
  updatePlusStatusUI(plusStatus);

  // Karte
  initMap({
    center: index.defaultLocation,
    zoom: index.defaultZoom,
    onMarkerSelect: handleSpotSelect,
  });

  // Filter
  currentFilterState = initFilters({
    categories,
    favoritesProvider: getFavorites,
    onFilterChange: handleFilterChange,
  });

  const map = getMap();
  const center = map ? map.getCenter() : null;

  filteredSpots = applyFilters(allSpots, {
    ...currentFilterState,
    favorites: getFavorites(),
    mapCenter: center,
  });

  setSpotsOnMap(filteredSpots);

  renderSpotList(filteredSpots, {
    favorites: getFavorites(),
    onSelect: handleSpotSelect,
  });

  initUIEvents();
  updateRoute("map");
}

// -----------------------------------------------------
// UI + Routing
// -----------------------------------------------------

function initUIEvents() {
  // Sprache
  const langSelect = $("#language-switcher");
  if (langSelect) {
    langSelect.value = getLanguage();
    langSelect.addEventListener("change", async () => {
      const settings = getSettings();
      const nextLang = langSelect.value || "de";

      await initI18n(nextLang);
      saveSettings({ ...settings, language: nextLang });

      // i18n-Texte im DOM aktualisieren
      applyTranslations();
      updateStaticLanguageTexts(nextLang);

      const categories = getCategories();
      refreshCategorySelect(categories);

      // Filter neu anwenden -> Liste + Marker in neuer Sprache
      handleFilterChange({
        ...currentFilterState,
        favorites: getFavorites(),
      });

      // Plus-Status-Text in neuer Sprache aktualisieren
      updatePlusStatusUI(plusStatus);

      // Offene Spot-Details in neuer Sprache neu rendern
      rerenderCurrentSpotDetails();
    });
  }

  // Theme
  const themeToggle = $("#theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const settings = getSettings();
      const nextTheme = settings.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      saveSettings({ ...settings, theme: nextTheme });
    });
  }

  // Standort
  const locateBtn = $("#btn-locate");
  if (locateBtn) {
    locateBtn.addEventListener("click", async () => {
      try {
        const pos = await getGeolocation();
        const map = getMap();
        if (map) {
          map.setView([pos.lat, pos.lng], 14);
        }
        showToast(
          t(
            "toast_location_ok",
            "Dein Startpunkt ist gesetzt – viel Spaß beim nächsten Abenteuer!",
          ),
        );
      } catch (err) {
        console.error(err);
        showToast(
          t(
            "toast_location_error",
            "Standort konnte nicht ermittelt werden. Bitte prüfe die Freigabe oder zoom manuell in deine Region.",
          ),
        );
      }
    });
  }

  // Bottom-Navigation
  $$(".bottom-nav-item").forEach((btn, index) => {
    btn.addEventListener("click", () => {
      const routeAttr = btn.dataset.route;
      const route = routeAttr === "about" ? "about" : "map";
      updateRoute(route, index);
    });
  });

  // Listen-/Kartenansicht im Sidebar-Panel
  const toggleViewBtn = $("#btn-toggle-view");
  if (toggleViewBtn) {
    toggleViewBtn.addEventListener("click", () => {
      const list = $(".sidebar-section--grow");
      const labelSpan = $("#btn-toggle-view span");
      if (!list || !labelSpan) return;

      const nowHidden = list.classList.toggle("hidden");
      labelSpan.textContent = nowHidden
        ? t("btn_show_list", "Liste zeigen")
        : t("btn_only_map", "Nur Karte");

      const map = getMap();
      if (map) {
        setTimeout(() => map.invalidateSize(), 0);
      }
    });
  }

  // Filter-Panel ein-/ausblenden
  const filterToggleBtn = $("#btn-toggle-filters");
  if (filterToggleBtn) {
    const filterSection = filterToggleBtn.closest(".sidebar-section");
    const labelSpan = filterToggleBtn.querySelector("span");
    if (filterSection && labelSpan) {
      const filterControls = Array.from(
        filterSection.querySelectorAll(".filter-group"),
      );

      // auf kleinen Screens: Filter anfangs einklappen
      if (window.innerWidth <= 900 && filterControls.length > 0) {
        filterControls.forEach((el) => el.classList.add("hidden"));
        labelSpan.textContent = t("btn_show_filters", "Show filters");
      }

      filterToggleBtn.addEventListener("click", () => {
        if (filterControls.length === 0) return;
        const currentlyHidden =
          filterControls[0].classList.contains("hidden");
        const makeVisible = currentlyHidden;

        filterControls.forEach((el) => {
          if (makeVisible) el.classList.remove("hidden");
          else el.classList.add("hidden");
        });

        labelSpan.textContent = makeVisible
          ? t("btn_hide_filters", "Filter ausblenden")
          : t("btn_show_filters", "Show filters");

        const map = getMap();
        if (map) {
          setTimeout(() => map.invalidateSize(), 0);
        }
      });
    }
  }

  // Fenster-/Orientierungswechsel: Map-Größe aktualisieren
  window.addEventListener("resize", () => {
    const map = getMap();
    if (map) {
      map.invalidateSize();
    }
  });

  // Plus-Code-Formular
  const plusInput = $("#plus-code-input");
  const plusButton = $("#plus-code-submit");
  if (plusInput && plusButton) {
    plusButton.addEventListener("click", async () => {
      const rawCode = plusInput.value.trim();
      if (!rawCode) {
        showToast(t("plus_code_empty", "Bitte Code eingeben."));
        return;
      }

      const normalized = rawCode.toUpperCase();

      try {
        const codes = await loadPartnerCodes();
        const match = codes.find(
          (c) =>
            String(c.code).toUpperCase() === normalized &&
            (c.enabled ?? true),
        );

        if (!match) {
          showToast(
            t(
              "plus_code_unknown",
              "Code nicht bekannt oder nicht mehr gültig.",
            ),
          );
          return;
        }

        const days = Number(match.days) || 0;
        const now = new Date();
        const expires =
          days > 0
            ? new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
            : null;

        plusStatus = savePlusStatus({
          code: normalized,
          plan: match.plan || null,
          partner: match.partner || null,
          source: match.source || "partner",
          activatedAt: now.toISOString(),
          expiresAt: expires ? expires.toISOString() : null,
        });

        updatePlusStatusUI(plusStatus);
        showToast(
          t(
            "plus_code_activated",
            "Family Spots Plus ist jetzt aktiv – viel Freude auf euren Touren!",
          ),
        );
      } catch (err) {
        console.error(err);
        showToast(
          t(
            "plus_code_failed",
            "Code konnte nicht geprüft werden. Versuch es später noch einmal.",
          ),
        );
      }
    });
  }
}

function updateRoute(route, indexFromClick) {
  const viewMap = $("#view-map");
  const viewAbout = $("#view-about");
  const navIndicator = $("#bottom-nav-indicator");
  const buttons = Array.from(document.querySelectorAll(".bottom-nav-item"));

  if (!viewMap || !viewAbout || buttons.length === 0) return;

  const targetRoute = route === "about" ? "about" : "map";

  if (targetRoute === "about") {
    viewMap.classList.remove("view--active");
    viewAbout.classList.add("view--active");
  } else {
    viewAbout.classList.remove("view--active");
    viewMap.classList.add("view--active");

    const map = getMap();
    if (map) {
      setTimeout(() => map.invalidateSize(), 0);
    }
  }

  buttons.forEach((btn, index) => {
    const isActive = btn.dataset.route === targetRoute;
    btn.classList.toggle("bottom-nav-item--active", isActive);

    if (isActive && navIndicator) {
      const idx = indexFromClick != null ? indexFromClick : index;
      navIndicator.style.transform = `translateX(${idx * 100}%)`;
    }
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// -----------------------------------------------------
// Filter-Logik
// -----------------------------------------------------

function handleFilterChange(filterState) {
  currentFilterState = filterState;

  const map = getMap();
  const center = map ? map.getCenter() : null;

  filteredSpots = applyFilters(allSpots, {
    ...filterState,
    mapCenter: center,
  });

  setSpotsOnMap(filteredSpots);

  // Radius-Kreis visualisieren (Micro-Abenteuer-Radius)
  const radiusKm = getRadiusKmForIndex(
    typeof filterState.radiusIndex === "number" ? filterState.radiusIndex : 4,
  );
  if (center && radiusKm) {
    updateRadiusCircle({ lat: center.lat, lng: center.lng }, radiusKm);
  } else {
    updateRadiusCircle(null, null);
  }

  renderSpotList(filteredSpots, {
    favorites: filterState.favorites,
    onSelect: handleSpotSelect,
  });
}

// -----------------------------------------------------
// Spot-Auswahl
// -----------------------------------------------------

function handleSpotSelect(id) {
  const spot = findSpotById(id);
  if (!spot) return;

  currentSelectedSpotId = spot.id;

  focusOnSpot(spot);

  const favorites = getFavorites();
  const isFav = favorites.includes(spot.id);

  renderSpotDetails(spot, {
    isFavorite: isFav,
    onToggleFavorite: (spotId) => {
      const updatedFavorites = toggleFavorite(spotId);

      showToast(
        updatedFavorites.includes(spotId)
          ? t("toast_fav_added", "Zu euren Lieblingsspots gelegt 💛")
          : t("toast_fav_removed", "Aus den Lieblingsspots entfernt."),
      );

      handleFilterChange({
        ...currentFilterState,
        favorites: updatedFavorites,
      });

      const freshSpot = findSpotById(spotId);
      renderSpotDetails(freshSpot, {
        isFavorite: updatedFavorites.includes(spotId),
        onToggleFavorite: () => handleSpotSelect(spotId),
      });
    },
  });
}

function rerenderCurrentSpotDetails() {
  if (!currentSelectedSpotId) return;
  const spot = findSpotById(currentSelectedSpotId);
  if (!spot) return;

  const favorites = getFavorites();
  const isFav = favorites.includes(spot.id);

  renderSpotDetails(spot, {
    isFavorite: isFav,
    onToggleFavorite: (spotId) => {
      const updatedFavorites = toggleFavorite(spotId);

      showToast(
        updatedFavorites.includes(spotId)
          ? t("toast_fav_added", "Zu euren Lieblingsspots gelegt 💛")
          : t("toast_fav_removed", "Aus den Lieblingsspots entfernt."),
      );

      handleFilterChange({
        ...currentFilterState,
        favorites: updatedFavorites,
      });

      const freshSpot = findSpotById(spotId);
      renderSpotDetails(freshSpot, {
        isFavorite: updatedFavorites.includes(spotId),
        onToggleFavorite: () => handleSpotSelect(spotId),
      });
    },
  });
}

// -----------------------------------------------------
// Theme
// -----------------------------------------------------

function applyTheme(theme) {
  const value = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", value);
}

// -----------------------------------------------------
// Texte / Sprache
// -----------------------------------------------------

function updateStaticLanguageTexts(lang) {
  const isGerman = !lang || lang.toLowerCase().startsWith("de");

  const txt = (de, en) => (isGerman ? de : en);

  const setText = (id, de, en) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt(de, en);
  };

  // Filterüberschrift
  setText("filter-title", "Filter", "Filters");

  // Kompass
  setText("compass-title", "Familien-Kompass", "Family compass");
  setText(
    "compass-helper",
    "Mit einem Klick passende Spots nach Zeit, Alter und Energie finden.",
    "With one tap, find spots that match your time, kids’ age and everyone’s energy.",
  );
  setText("btn-compass-label", "Kompass anwenden", "Apply compass");

  // Suche, Kategorie
  setText("label-search", "Suche", "Search");
  const searchInput = $("#filter-search");
  if (searchInput) {
    searchInput.placeholder = txt(
      "Ort, Spot, Stichwörter …",
      "Place, spot, keywords …",
    );
  }
  setText("label-category", "Kategorie", "Category");

  // Stimmung
  setText("label-mood", "Stimmung", "Mood");
  setText(
    "helper-mood",
    "Wonach fühlt es sich heute an?",
    "What does today feel like?",
  );
  setText("mood-label-relaxed", "Entspannt", "Relaxed");
  setText("mood-label-action", "Bewegung", "Action & movement");
  setText("mood-label-water", "Wasser & Sand", "Water & sand");
  setText("mood-label-animals", "Tier-Tag", "Animal day");

  // Reise-Modus
  setText("label-travel-mode", "Reise-Modus", "Travel mode");
  setText(
    "helper-travel-mode",
    "Seid ihr heute im Alltag unterwegs oder auf Tour mit WoMo, Auto oder Bahn?",
    "Are you out and about at home today or travelling with RV, car or train?",
  );
  setText("travel-label-everyday", "Alltag", "Everyday");
  setText("travel-label-trip", "Unterwegs", "On the road");

  // Alter
  setText("label-age", "Alter der Kinder", "Kids’ age");
  const ageSelect = document.getElementById("filter-age");
  if (ageSelect && ageSelect.options.length >= 4) {
    ageSelect.options[0].textContent = txt(
      "Alle Altersstufen",
      "All age groups",
    );
    ageSelect.options[1].textContent = txt("0–3 Jahre", "0–3 years");
    ageSelect.options[2].textContent = txt("4–9 Jahre", "4–9 years");
    ageSelect.options[3].textContent = txt("10+ Jahre", "10+ years");
  }

  // Radius
  setText(
    "label-radius",
    "Micro-Abenteuer-Radius",
    "Micro-adventure radius",
  );
  setText(
    "helper-radius",
    "Wie weit darf euer Abenteuer heute gehen? Der Radius bezieht sich auf die Kartenmitte (Zuhause, Ferienwohnung, Hotel …).",
    "How far may your adventure go today? The radius is measured from the map centre (home, holiday flat, hotel …).",
  );

  const radiusDesc = document.getElementById("filter-radius-description");
  const radiusMax = document.getElementById("filter-radius-max-label");
  if (radiusMax) {
    radiusMax.textContent = txt("Alle Spots", "All spots");
  }
  if (radiusDesc) {
    radiusDesc.textContent = txt(
      "Alle Spots – ohne Radiusbegrenzung. Die Karte gehört euch.",
      "All spots – no radius limit. The map is yours.",
    );
  }

  // Checkboxen
  setText(
    "label-big-only",
    "Nur große Abenteuer",
    "Only big adventures",
  );
  setText(
    "label-verified-only",
    "Nur verifizierte Spots",
    "Only verified spots",
  );
  setText(
    "label-favorites-only",
    "Nur Favoriten",
    "Only favourites",
  );

  // Bottom-Navigation
  setText("bottom-label-map", "Karte", "Map");
  setText("bottom-label-about", "Über", "About");

  // Plus-Code / Status
  setText(
    "plus-code-label",
    "Aktionscode für Family Spots Plus",
    "Promo code for Family Spots Plus",
  );
  const plusInput = document.getElementById("plus-code-input");
  if (plusInput) {
    plusInput.placeholder = txt("Code eingeben …", "Enter code …");
  }
  const plusButton = document.getElementById("plus-code-submit");
  if (plusButton) {
    plusButton.textContent = txt("Code einlösen", "Redeem code");
  }
  setText(
    "plus-note",
    "Plus wird über zeitlich begrenzte Aktionscodes aktiviert (z. B. auf Messen oder bei Partnern).",
    "Plus is activated via time-limited promo codes (e.g. at fairs or via partners).",
  );

  // About-Content
  updateAboutContent(isGerman);

  // Plus-Status-Text ebenfalls in aktueller Sprache
  updatePlusStatusUI(plusStatus);
}

function updateAboutContent(isGerman) {
  const article = document.getElementById("about-article");
  if (!article) return;

  if (isGerman) {
    article.innerHTML = `
      <h2>Über Family Spots Map</h2>

      <p>
        Family Spots Map ist eine kuratierte Karte für Familien-Abenteuer –
        von Eltern für Eltern. Statt unübersichtlicher Listen oder anonymer
        Bewertungen findest du hier ausgewählte Spielplätze, Zoos, Wildparks,
        Wasser-Spots, Museen, Bewegungsparks und viele weitere Orte, die sich
        in der Praxis bewährt haben.
      </p>
      <p>
        Der Fokus: Qualität, Sicherheit und echte Erlebnisse mit Kindern –
        nicht die größte, sondern die verlässlichste Karte.
      </p>

      <hr />

      <h3>So funktioniert Family Spots Map</h3>
      <p>
        • <strong>Karte &amp; Filter:</strong> Zoome in deine Region und
        filtere nach Kategorien (z.&nbsp;B. Spielplatz, Wildpark, Pumptrack) oder Stichworten.<br />
        • <strong>Spot-Karten:</strong> Jeder Spot zeigt dir eine Kurzbeschreibung,
        Besonderheiten (z.&nbsp;B. „Autosafari“, „barrierefrei“) und ob er von uns
        verifiziert wurde.<br />
        • <strong>Favoriten:</strong> Markiere eure Lieblingsorte mit dem Stern
        und habt sie unterwegs schnell parat – auch offline.<br />
        • <strong>Offline-Grundfunktion:</strong> Wichtige Daten werden lokal
        gespeichert, damit ihr eure Spots auch mit schwachem Empfang wiederfindet.
      </p>

      <hr />

      <h3>Kuratiert &amp; verifiziert – unser Qualitätsversprechen</h3>
      <p>
        Family Spots Map ist keine anonyme Sammelplattform. Jeder Spot wird
        bewusst ausgewählt und laufend gepflegt.
      </p>
      <p>
        <strong>Verifizierte Spots</strong> tragen ein entsprechendes Label.
        Das bedeutet zum Beispiel:
      </p>
      <p>
        – der Ort wurde persönlich besucht oder ausführlich recherchiert,<br />
        – Lage, Kategorie und Eckdaten wurden geprüft,<br />
        – besondere Hinweise (z.&nbsp;B. Eintritt, Saison, Parken) sind
        soweit möglich ergänzt.
      </p>
      <p>
        Trotzdem können sich Bedingungen vor Ort ändern – prüft deshalb immer
        die Hinweise vor Ort und aktuelle Informationen der Betreiber.
      </p>

      <hr />

      <h3>Family Spots Plus – mehr für Camping, WoMo &amp; Abenteuer</h3>
      <p>
        Neben den Basis-Kategorien gibt es mit <strong>Family Spots Plus</strong>
        zusätzliche Spezial-Kategorien, zum Beispiel:
      </p>
      <p>
        – Rastplätze mit Spielplatz &amp; Dusche<br />
        – kostenlose Stellplätze in Spielplatznähe<br />
        – Wohnmobil-Service-Stationen<br />
        – familienfreundliche Campingplätze<br />
        – Bikepacking-Spots und besondere Abenteuer-Routen
      </p>
      <p>
        Plus wird über zeitlich begrenzte <strong>Aktions-Codes</strong> aktiviert –
        zum Beispiel auf Messen wie der ABF, bei Partnern oder in speziellen Aktionen.
      </p>
      <p>
        Dein aktueller Status wird in der App angezeigt, zum Beispiel:
        „Family Spots Plus ist nicht aktiviert“ oder „Family Spots Plus ist aktiv bis …“.
      </p>

      <hr />

      <h3>Mitmachen – hilf, die Karte besser zu machen</h3>
      <p>
        Du kennst einen Spot, der hier unbedingt auftauchen sollte – einen besonderen
        Spielplatz, ein verstecktes Natur-Highlight oder einen perfekten
        Familien-Campingplatz?
      </p>
      <p>
        Dann melde dich gern mit den wichtigsten Infos (Ort, Kategorie, kurzer Grund,
        warum er besonders familiengeeignet ist). Gemeinsam machen wir die Karte
        Schritt für Schritt besser.
      </p>

      <hr />

      <h3>Nutzung, Verantwortung &amp; Sicherheit</h3>
      <p>
        Family Spots Map stellt Informationen nach bestem Wissen zur Verfügung,
        übernimmt aber keine Haftung für Vollständigkeit, Sicherheit oder die
        Einhaltung lokaler Regeln.
      </p>
      <p>
        Bitte achtet vor Ort immer auf:
      </p>
      <p>
        – Beschilderung und lokale Hinweise,<br />
        – Naturschutz-Bestimmungen, Badeaufsicht und Wetter,<br />
        – Alter und Fähigkeiten eurer Kinder.
      </p>
      <p>
        Die Nutzung der App erfolgt auf eigene Verantwortung – ihr kennt eure Kinder
        und eure Situation am besten.
      </p>

      <hr />

      <h3>Projektstatus &amp; Version</h3>
      <p>
        Family Spots Map ist ein wachsendes Herzensprojekt. Neue Spots, Regionen und
        Kategorien kommen Schritt für Schritt dazu – zuerst dort, wo wir selbst mit
        unseren Kindern unterwegs sind, dann gemeinsam mit Partnern und der Community.
      </p>
      <p>
        Aktuelle Karten-Version:
        <strong>2025-11-08</strong> (siehe Datenstand in der App).
      </p>
    `;
  } else {
    article.innerHTML = `
      <h2>About Family Spots Map</h2>

      <p>
        Family Spots Map is a curated map for family adventures – by parents for parents.
        Instead of endless lists and anonymous ratings, you’ll find selected playgrounds,
        zoos, wildlife parks, water spots, movement parks, museums and many other places
        that have proven themselves in real family life.
      </p>
      <p>
        The focus: quality, safety and real experiences with children – not the biggest,
        but the most trustworthy map.
      </p>

      <hr />

      <h3>How Family Spots Map works</h3>
      <p>
        • <strong>Map &amp; filters:</strong> Zoom into your region and filter by category
        (e.g. playground, wildlife park, pumptrack) or keywords.<br />
        • <strong>Spot cards:</strong> Each spot shows a short description, special
        features (e.g. “car safari”, “accessible”) and whether it has been verified by us.<br />
        • <strong>Favourites:</strong> Mark your favourite places with the star so you can
        find them quickly on the go – even offline.<br />
        • <strong>Offline basics:</strong> Important data is stored locally so you can
        find your spots again even with weak reception.
      </p>

      <hr />

      <h3>Curated &amp; verified – our promise of quality</h3>
      <p>
        Family Spots Map is not an anonymous collection platform. Every spot is selected
        deliberately and maintained continuously.
      </p>
      <p>
        <strong>Verified spots</strong> carry a dedicated label. This usually means:
      </p>
      <p>
        – the place has been visited personally or researched in depth,<br />
        – location, category and key facts have been checked,<br />
        – important hints (e.g. admission, season, parking) are added where possible.
      </p>
      <p>
        Conditions on site can always change – so please always check local signs and the
        latest information from the operators.
      </p>

      <hr />

      <h3>Family Spots Plus – more for camping, RV trips &amp; adventures</h3>
      <p>
        In addition to the basic categories, <strong>Family Spots Plus</strong> adds
        specialised categories, for example:
      </p>
      <p>
        – rest areas with playground &amp; showers<br />
        – free RV spots close to playgrounds<br />
        – motorhome service stations<br />
        – family-friendly campsites<br />
        – bikepacking spots and special adventure routes
      </p>
      <p>
        Plus is activated via time-limited <strong>promo codes</strong> – for example at
        fairs, via partners or during special campaigns.
      </p>
      <p>
        Your current status is shown in the app, for example:
        “Family Spots Plus is not activated” or “Family Spots Plus is active until …”.
      </p>

      <hr />

      <h3>Get involved – help improve the map</h3>
      <p>
        Do you know a spot that simply has to be on this map – a special playground,
        a hidden nature gem or a perfect family campsite?
      </p>
      <p>
        Then feel free to send us the key information (place, category, short reason why
        it’s especially family-friendly). Step by step, we’ll make the map better
        together.
      </p>

      <hr />

      <h3>Use, responsibility &amp; safety</h3>
      <p>
        Family Spots Map provides information to the best of our knowledge but assumes no
        liability for completeness, safety or compliance with local rules.
      </p>
      <p>
        On site, please always pay attention to:
      </p>
      <p>
        – signs and local information,<br />
        – nature protection rules, lifeguards and weather conditions,<br />
        – age and abilities of your children.
      </p>
      <p>
        You use the app at your own responsibility – you know your children and your
        situation best.
      </p>

      <hr />

      <h3>Project status &amp; version</h3>
      <p>
        Family Spots Map is a growing passion project. New spots, regions and categories
        are added step by step – first in the regions we travel with our own children,
        then together with partners and the community.
      </p>
      <p>
        Current map version:
        <strong>2025-11-08</strong> (see data version in the app).
      </p>
    `;
  }
}

// -----------------------------------------------------
// Plus / Partner-Codes
// -----------------------------------------------------

async function loadPartnerCodes() {
  if (Array.isArray(partnerCodesCache)) {
    return partnerCodesCache;
  }

  try {
    const res = await fetch("data/partners.json");
    if (!res.ok) {
      throw new Error("Failed to load partners.json");
    }
    const json = await res.json();
    let codes = [];

    if (Array.isArray(json)) {
      codes = json;
    } else if (Array.isArray(json.codes)) {
      codes = json.codes;
    } else {
      console.warn("[Plus] Unerwartetes Format in partners.json", json);
      codes = [];
    }

    partnerCodesCache = codes;
    return codes;
  } catch (err) {
    console.error("[Plus] Partner-Codes konnten nicht geladen werden", err);
    partnerCodesCache = [];
    return [];
  }
}

function updatePlusStatusUI(status) {
  const el = document.getElementById("plus-status-text");
  if (!el) return;

  const lang = getLanguage() || "de";
  const isGerman = lang.toLowerCase().startsWith("de");

  if (!status) {
    el.textContent = isGerman
      ? "Family Spots Plus ist nicht aktiviert."
      : "Family Spots Plus is not activated.";
    return;
  }

  const expires = status.expiresAt ? new Date(status.expiresAt) : null;
  const formatter = new Intl.DateTimeFormat(
    isGerman ? "de-DE" : "en-US",
    { year: "numeric", month: "2-digit", day: "2-digit" },
  );

  const datePart = expires ? formatter.format(expires) : null;

  if (datePart) {
    el.textContent = isGerman
      ? `Family Spots Plus ist aktiv bis ${datePart}.`
      : `Family Spots Plus is active until ${datePart}.`;
  } else {
    el.textContent = isGerman
      ? "Family Spots Plus ist aktuell aktiv."
      : "Family Spots Plus is currently active.";
  }
}