// Basic Leaflet map + spots + warm UI helpers

let map;
let markersLayer;
let spotsData = [];
let spotMarkers = [];

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

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
  initMap();
  loadSpots();
  initFilters();
  initMyDay();
  initTabs();
  initTurtle();
});

// --- Map ---

function initMap() {
  map = L.map('map', {
    zoomControl: false,
    worldCopyJump: true
  }).setView([54.9, 9.8], 6); // Denmark / Northern Europe feeling

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
// Tries to be defensive, so it should work with several possible spot schemas.

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
    spotsEmpty.textContent = 'Spots could not be loaded.';
  }
}

// Try to unify different potential property names into a common shape
function normalizeSpot(spot, index) {
  const lat =
    spot.lat ??
    spot.latitude ??
    (spot.location && spot.location.lat) ??
    spot.coords?.lat;
  const lng =
    spot.lng ??
    spot.lon ??
    spot.lng ??
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
    // Marker
    const marker = L.marker([spot.lat, spot.lng]);
    marker.bindPopup(`<strong>${spot.name}</strong><br/>${spot.city || ''}`);
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
      mapOnlyToggle.textContent = mapOnly ? 'Show list' : 'Map only';

      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    });
  }
}

// --- My day (localStorage only) ---

const MY_DAY_KEY = 'fsm_my_day_note_v1';

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
      try {
        localStorage.setItem(MY_DAY_KEY, value);
        myDayStatus.textContent = value
          ? 'Saved just now. This note stays on this device.'
          : 'Cleared.';
      } catch (e) {
        myDayStatus.textContent = 'Could not save this time.';
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
        b.classList.toggle(
          'bottom-nav-item--active',
          b === btn
        )
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
// Tooltip appears on first use to explain gently.

const TURTLE_TOOLTIP_SEEN_KEY = 'fsm_turtle_tooltip_seen_v1';

function initTurtle() {
  if (headerLocateBtn) {
    headerLocateBtn.addEventListener('click', () => locateAndCenter());
  }

  if (!turtleButton) return;

  turtleButton.addEventListener('click', () => {
    locateAndCenter();
    maybeShowTurtleTooltipOnce();
  });
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

// --- Utils ---

function debounce(fn, delay) {
  let t;
  return function debounced(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), delay);
  };
}