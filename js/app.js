// Simple i18n dictionary
const translations = {
  en: {
    appTitle: 'Family Spots Map',
    heroTitle: 'The most beautiful map for family adventures.',
    heroSub: 'Find curated family spots near you – by parents for parents.',

    myDayTitle: 'My day',
    myDayQuestion: 'How was your day?',
    myDayPlaceholder:
      'Today we went to the wildlife park – the goats were sooo cute!',
    myDaySave: 'Save',
    myDaySaved: 'Saved just now. This note stays on this device.',
    myDayCleared: 'Cleared.',
    myDayError: 'Could not save this time.',

    filtersTitle: 'Filters',
    mapOnlyLabel: 'Map only',
    showListLabel: 'Show list',
    searchLabel: 'Search',
    searchPlaceholder: 'Playground, zoo, lake…',
    categoryLabel: 'Category',
    categoryAll: 'All categories',
    verifiedLabel: 'Only verified spots',

    spotsEmpty: 'No spots match your filters yet.',

    tabMap: 'Map',
    tabSpots: 'Spots',

    turtleTooltip:
      'The turtle is your quiet companion – one tap brings the map back to you.',

    aboutTitle: 'About Family Spots Map',
    aboutBody:
      'Family Spots Map is a warm, simple companion for your everyday family adventures. No tracking, no stress – just hand-picked spots and small moments that matter.',

    reopenMyDay: 'Show “My day”',
    reopenFilters: 'Show filters'
  },
  de: {
    appTitle: 'Family Spots Map',
    heroTitle: 'Die schönste Karte für Familienabenteuer.',
    heroSub:
      'Finde kuratierte Familien-Spots in deiner Nähe – von Eltern für Eltern.',

    myDayTitle: 'Mein Tag',
    myDayQuestion: 'Wie war euer Tag?',
    myDayPlaceholder:
      'Heute waren wir im Wildpark – die Ziegen waren sooo süß!',
    myDaySave: 'Speichern',
    myDaySaved:
      'Gerade gespeichert. Diese Notiz bleibt nur auf diesem Gerät.',
    myDayCleared: 'Gelöscht.',
    myDayError: 'Konnte dieses Mal nicht gespeichert werden.',

    filtersTitle: 'Filter',
    mapOnlyLabel: 'Nur Karte',
    showListLabel: 'Karte & Liste',
    searchLabel: 'Suche',
    searchPlaceholder: 'Spielplatz, Zoo, See…',
    categoryLabel: 'Kategorie',
    categoryAll: 'Alle Kategorien',
    verifiedLabel: 'Nur verifizierte Spots',

    spotsEmpty: 'Zu deinen Filtern gibt es noch keine Spots.',

    tabMap: 'Karte',
    tabSpots: 'Spots',

    turtleTooltip:
      'Die Schildkröte ist euer leiser Begleiter – ein Tipp und die Karte springt zurück zu euch.',

    aboutTitle: 'Über Family Spots Map',
    aboutBody:
      'Family Spots Map ist ein warmer, einfacher Begleiter für eure Familienabenteuer im Alltag. Kein Tracking, kein Stress – nur handverlesene Orte und kleine Momente, die zählen.',

    reopenMyDay: '„Mein Tag“ anzeigen',
    reopenFilters: 'Filter anzeigen'
  }
};

const LANG_KEY = 'fsm_lang_v1';
const THEME_KEY = 'fsm_theme_v1';
const MY_DAY_KEY = 'fsm_my_day_note_v1';
const TURTLE_TOOLTIP_SEEN_KEY = 'fsm_turtle_tooltip_seen_v1';

let currentLang = 'en';
let currentTheme = 'light';

let map;
let markersLayer;
let spotsData = [];
let spotMarkers = [];

// DOM refs
const appShell = document.querySelector('.app-shell');
const searchInput = document.getElementById('search-input');
const categorySelect = document.getElementById('category-select');
const verifiedOnlyCheckbox = document.getElementById('verified-only');
const spotsList = document.getElementById('spots-list');
const spotsEmpty = document.getElementById('spots-empty');
const mapOnlyToggle = document.getElementById('map-only-toggle');

const myDayInput = document.getElementById('my-day-input');
const myDaySave = document.getElementById('my-day-save');
const myDayStatus = document.getElementById('my-day-status');

const turtleButton = document.getElementById('turtle-companion');
const turtleTooltip = document.getElementById('turtle-tooltip');
const headerLocateBtn = document.getElementById('header-locate-btn');
const languageToggleBtn = document.getElementById('language-toggle');
const themeToggleBtn = document.getElementById('theme-toggle');

const aboutBtn = document.getElementById('about-btn');
const aboutOverlay = document.getElementById('about-overlay');
const aboutCloseBtn = document.getElementById('about-close-btn');

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  initTheme();
  initMap();
  loadSpots();
  initFilters();
  initMyDay();
  initTabs();
  initTurtle();
  initAbout();
  initCloseableSections();
});

// --- i18n ---

function initLanguage() {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'de' || stored === 'en') {
      currentLang = stored;
    }
  } catch (e) {
    // ignore
  }
  applyTranslations();
  if (languageToggleBtn) {
    languageToggleBtn.textContent = currentLang.toUpperCase();
    languageToggleBtn.addEventListener('click', () => {
      currentLang = currentLang === 'en' ? 'de' : 'en';
      try {
        localStorage.setItem(LANG_KEY, currentLang);
      } catch (e) {
        // ignore
      }
      languageToggleBtn.textContent = currentLang.toUpperCase();
      applyTranslations();
      updateMapOnlyLabel();
    });
  }
}

function applyTranslations() {
  const dict = translations[currentLang];

  document.querySelectorAll('[data-i18n-key]').forEach((el) => {
    const key = el.dataset.i18nKey;
    const txt = dict[key];
    if (!txt) return;
    el.textContent = txt;
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    const txt = dict[key];
    if (!txt) return;
    el.placeholder = txt;
  });
}

// --- Theme ---

function initTheme() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') {
      currentTheme = stored;
    }
  } catch (e) {
    // ignore
  }

  applyTheme();

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(THEME_KEY, currentTheme);
      } catch (e) {
        // ignore
      }
      applyTheme();
    });
  }
}

function applyTheme() {
  const isDark = currentTheme === 'dark';
  document.documentElement.classList.toggle('theme-dark', isDark);
  if (themeToggleBtn) {
    themeToggleBtn.textContent = isDark ? '☀️' : '🌙';
  }
}

// --- Map ---

function initMap() {
  map = L.map('map', {
    zoomControl: false,
    worldCopyJump: true
  }).setView([54.9, 9.8], 6); // Northern Europe

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
  }).addTo(map);

  L.control
    .zoom({
      position: 'bottomleft'
    })
    .addTo(map);

  markersLayer = L.markerClusterGroup();
  map.addLayer(markersLayer);
}

// --- Spots loading ---

async function loadSpots() {
  try {
    const res = await fetch('data/spots.json', { cache: 'no-cache' });
    const raw = await res.json();

    const list = Array.isArray(raw) ? raw : raw.spots || raw.data || [];
    spotsData = list.map((spot, index) => normalizeSpot(spot, index));

    populateCategorySelect(spotsData);
    renderSpotsAndMarkers();
  } catch (err) {
    console.error('Failed to load spots.json', err);
    spotsEmpty.hidden = false;
    spotsEmpty.textContent = translations[currentLang].spotsEmpty;
  }
}

function normalizeSpot(spot, index) {
  const lat =
    spot.lat ??
    spot.latitude ??
    (spot.location && spot.location.lat) ??
    spot.coords?.lat;
  const lng =
    spot.lng ??
    spot.lon ??
    (spot.location && spot.location.lng) ??
    spot.coords?.lng;

  return {
    id: spot.id || `spot-${index}`,
    name: spot.name || spot.title || 'Family spot',
    category: spot.category || spot.type || '',
    city: spot.city || spot.town || spot.place || '',
    verified: Boolean(spot.verified || spot.isVerified),
    lat,
    lng
  };
}

function populateCategorySelect(spots) {
  const categories = Array.from(
    new Set(spots.map((s) => s.category).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  categories.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });
}

function renderSpotsAndMarkers() {
  if (!markersLayer) return;
  markersLayer.clearLayers();
  spotMarkers = [];
  spotsList.innerHTML = '';

  const query = (searchInput.value || '').trim().toLowerCase();
  const cat = categorySelect.value;
  const verifiedOnly = verifiedOnlyCheckbox.checked;

  const filtered = spotsData.filter((spot) => {
    if (!spot.lat || !spot.lng) return false;

    if (cat && spot.category !== cat) return false;
    if (verifiedOnly && !spot.verified) return false;

    if (query) {
      const haystack =
        `${spot.name} ${spot.city} ${spot.category}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  filtered.forEach((spot) => {
    // Orange circle marker
    const marker = L.circleMarker([spot.lat, spot.lng], {
      radius: 8,
      color: '#ff8c00',
      weight: 2,
      fillColor: '#ffb347',
      fillOpacity: 0.95
    });

    marker.bindPopup(`<strong>${spot.name}</strong><br/>${spot.city || ''}`);

    marker.on('mouseover', () => {
      marker.setStyle({ radius: 11 });
    });
    marker.on('mouseout', () => {
      marker.setStyle({ radius: 8 });
    });

    markersLayer.addLayer(marker);
    spotMarkers.push({ spot, marker });

    // List card
    const li = document.createElement('li');
    li.className = 'spot-card';
    li.dataset.spotId = spot.id;

    const title = document.createElement('h3');
    title.className = 'spot-title';
    title.textContent = spot.name;
    li.appendChild(title);

    const meta = document.createElement('p');
    meta.className = 'spot-meta';

    const bits = [];
    if (spot.city) bits.push(spot.city);
    if (spot.category) bits.push(spot.category);
    if (spot.verified) bits.push('✓ verified');

    meta.textContent = bits.join(' • ');
    li.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'spot-actions';

    const focusBtn = document.createElement('button');
    focusBtn.className = 'spot-focus-btn';
    focusBtn.type = 'button';
    focusBtn.textContent = 'Show on map';
    focusBtn.addEventListener('click', () => focusSpotOnMap(spot));
    actions.appendChild(focusBtn);

    li.appendChild(actions);
    spotsList.appendChild(li);
  });

  spotsEmpty.hidden = filtered.length > 0;
}

function focusSpotOnMap(spot) {
  if (!spot.lat || !spot.lng || !map) return;
  map.setView([spot.lat, spot.lng], 14, { animate: true });
}

// --- Filters ---

function initFilters() {
  if (searchInput) {
    searchInput.addEventListener('input', debounce(renderSpotsAndMarkers, 150));
  }
  if (categorySelect) {
    categorySelect.addEventListener('change', renderSpotsAndMarkers);
  }
  if (verifiedOnlyCheckbox) {
    verifiedOnlyCheckbox.addEventListener('change', renderSpotsAndMarkers);
  }

  if (mapOnlyToggle) {
    mapOnlyToggle.addEventListener('click', () => {
      const mapOnly = !appShell.classList.contains('app-shell--map-only');
      appShell.classList.toggle('app-shell--map-only', mapOnly);
      mapOnlyToggle.setAttribute('aria-pressed', String(mapOnly));
      updateMapOnlyLabel();

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    });
  }
  updateMapOnlyLabel();
}

function updateMapOnlyLabel() {
  if (!mapOnlyToggle) return;
  const dict = translations[currentLang];
  const mapOnly = appShell.classList.contains('app-shell--map-only');
  mapOnlyToggle.textContent = mapOnly
    ? dict.showListLabel
    : dict.mapOnlyLabel;
}

// --- My day (localStorage only) ---

function initMyDay() {
  try {
    const stored = localStorage.getItem(MY_DAY_KEY);
    if (stored && myDayInput) {
      myDayInput.value = stored;
    }
  } catch (e) {
    console.warn('localStorage not available', e);
  }

  if (myDaySave && myDayInput) {
    myDaySave.addEventListener('click', () => {
      const value = myDayInput.value.trim();
      const dict = translations[currentLang];
      try {
        localStorage.setItem(MY_DAY_KEY, value);
        myDayStatus.textContent = value ? dict.myDaySaved : dict.myDayCleared;
      } catch (e) {
        myDayStatus.textContent = dict.myDayError;
      }
    });
  }
}

// --- Tabs: Map / Spots (bottom nav) ---

function initTabs() {
  const navItems = document.querySelectorAll('.bottom-nav-item');
  if (!navItems.length) return;

  appShell.classList.add('app-shell--tab-map');

  navItems.forEach((btn) => {
    btn.addEventListener('click', () => {
      navItems.forEach((b) =>
        b.classList.toggle('bottom-nav-item--active', b === btn)
      );

      const tab = btn.dataset.tab;
      if (tab === 'spots') {
        appShell.classList.remove('app-shell--tab-map');
        appShell.classList.add('app-shell--tab-spots');
      } else {
        appShell.classList.add('app-shell--tab-map');
        appShell.classList.remove('app-shell--tab-spots');
      }

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    });
  });
}

// --- Turtle companion 🐢 ---
// One tap: locate & center the map on the family.
// Tooltip appears once and can be closed.

function initTurtle() {
  if (headerLocateBtn) {
    headerLocateBtn.addEventListener('click', () => locateAndCenter());
  }

  if (!turtleButton) return;

  turtleButton.addEventListener('click', () => {
    locateAndCenter();
    maybeShowTurtleTooltipOnce();
  });

  if (turtleTooltip) {
    const closeBtn = turtleTooltip.querySelector('.turtle-tooltip-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        turtleTooltip.hidden = true;
      });
    }
  }
}

function locateAndCenter() {
  if (!navigator.geolocation || !map) {
    console.warn('Geolocation not available');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 13, { animate: true });
    },
    (err) => {
      console.warn('Could not get position', err);
    },
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 600000
    }
  );
}

function maybeShowTurtleTooltipOnce() {
  try {
    const seen = localStorage.getItem(TURTLE_TOOLTIP_SEEN_KEY);
    if (seen || !turtleTooltip) return;

    turtleTooltip.hidden = false;
    localStorage.setItem(TURTLE_TOOLTIP_SEEN_KEY, '1');

    setTimeout(() => {
      turtleTooltip.hidden = true;
    }, 6000);
  } catch (e) {
    // ignore
  }
}

// --- About modal ---

function initAbout() {
  if (!aboutBtn || !aboutOverlay) return;

  const open = () => {
    aboutOverlay.hidden = false;
  };
  const close = () => {
    aboutOverlay.hidden = true;
  };

  aboutBtn.addEventListener('click', open);
  if (aboutCloseBtn) {
    aboutCloseBtn.addEventListener('click', close);
  }

  aboutOverlay.addEventListener('click', (e) => {
    if (e.target === aboutOverlay) {
      close();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !aboutOverlay.hidden) {
      close();
    }
  });
}

// --- Closeable sections (My day / Filters) ---

function initCloseableSections() {
  document.querySelectorAll('.card-close-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.closeTarget;
      if (!id) return;
      const section = document.getElementById(id);
      if (!section) return;
      section.hidden = true;
      const reopen = document.querySelector(
        `.reopen-btn[data-reopen-target="${id}"]`
      );
      if (reopen) reopen.hidden = false;
    });
  });

  document.querySelectorAll('.reopen-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.reopenTarget;
      if (!id) return;
      const section = document.getElementById(id);
      if (section) section.hidden = false;
      btn.hidden = true;
    });
  });
}

// --- Utils ---

function debounce(fn, delay) {
  let t;
  return function debounced(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}