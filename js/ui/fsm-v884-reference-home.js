// FSM V88.4 · Real Darkmode discovery surface after the approved reference.
// It reuses the real map, the original filters/favorites and the private calendar.
// No fake spot, rating, time, availability or user data is generated.
"use strict";

const TR = {
  de: {
    eyebrow: "FAMILY SPOTS MAP · GEMEINSAM", title: "Gemeinsam erleben",
    subtitle: "Orte entdecken. Menschen verbinden. Erinnerungen schaffen.",
    preview: "TESTVORSCHAU · V88 RC", plan: "Treffen planen", today: "Heute",
    filters: "Spots finden", filtersSub: "In eurer Nähe", calendar: "Kalender",
    calendarSub: "Alle Treffen", favorites: "Favoriten", favoritesSub: "Gespeicherte Orte",
    nearby: "In eurer Nähe", all: "Alle Spots", menu: "Menü öffnen"
  },
  en: {
    eyebrow: "FAMILY SPOTS MAP · TOGETHER", title: "Experience together",
    subtitle: "Discover places. Connect people. Make memories.",
    preview: "TEST PREVIEW · V88 RC", plan: "Plan a meetup", today: "Today",
    filters: "Find spots", filtersSub: "Near you", calendar: "Calendar", calendarSub: "All meetups",
    favorites: "Favourites", favoritesSub: "Saved places", nearby: "Near you",
    all: "All spots", menu: "Open menu"
  },
  da: {
    eyebrow: "FAMILY SPOTS MAP · SAMMEN", title: "Oplev sammen",
    subtitle: "Opdag steder. Forbind mennesker. Skab minder.",
    preview: "TESTVERSION · V88 RC", plan: "Planlæg et møde", today: "I dag",
    filters: "Find steder", filtersSub: "I nærheden", calendar: "Kalender", calendarSub: "Alle møder",
    favorites: "Favoritter", favoritesSub: "Gemte steder", nearby: "I nærheden",
    all: "Alle steder", menu: "Åbn menu"
  }
};
const icons = {
  pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18M8 15l2.5 2.5L16 13"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>'
};
const svg = name => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
function init() {
  const mapView = document.getElementById('view-map');
  if (!mapView || document.getElementById('fsm-v884-dark-hero')) return;
  const base = new URL('../../', import.meta.url);
  const hero = document.createElement('section');
  hero.id = 'fsm-v884-dark-hero';
  hero.setAttribute('aria-label', TR.de.title);
  hero.innerHTML = `
    <div class="fsm-v884-hero-top">
      <img src="${new URL('assets/tilla/tilla-watercolor.png',base).href}" width="52" height="52" alt="" decoding="async">
      <p class="fsm-v884-hero-eyebrow"></p>
    </div>
    <h1 class="fsm-v884-hero-title"></h1>
    <p class="fsm-v884-hero-subtitle"></p>
    <span class="fsm-v884-hero-badge"></span>
    <div class="fsm-v884-hero-landscape" aria-hidden="true"></div>
    <div class="fsm-v884-hero-actions">
      <button class="fsm-v884-plan" type="button" data-v884="plan"><span aria-hidden="true">＋</span> <span data-v884-text="plan"></span></button>
      <button class="fsm-v884-today" type="button" data-v884="today"><span data-v884-text="today"></span></button>
    </div>
    <div class="fsm-v884-hero-shortcuts" role="group">
      <button type="button" data-v884="filters">${svg('pin')}<strong data-v884-text="filters"></strong><small data-v884-text="filtersSub"></small></button>
      <button type="button" data-v884="calendar">${svg('calendar')}<strong data-v884-text="calendar"></strong><small data-v884-text="calendarSub"></small></button>
      <button type="button" data-v884="favorites">${svg('heart')}<strong data-v884-text="favorites"></strong><small data-v884-text="favoritesSub"></small></button>
    </div>
    <div class="fsm-v884-nearby"><h3 data-v884-text="nearby"></h3><button type="button" data-v884="all"><span data-v884-text="all"></span> <span aria-hidden="true">›</span></button></div>
  `;
  mapView.prepend(hero);
  // Only the source controls in V88 have behavior and user data: forward to them.
  const activate = (selector) => {
    const target = document.querySelector(selector);
    if (!target) return false;
    target.click();
    return true;
  };
  const openCalendar = (form = false) => {
    if (!activate('#fse-menu-open')) return;
    if (form) document.querySelector('#fse-overlay [data-fse="form"]')?.click();
  };
  hero.addEventListener('click', event => {
    const action = event.target.closest('[data-v884]')?.dataset.v884;
    switch (action) {
      case 'plan': openCalendar(true); break;
      case 'today': case 'calendar': openCalendar(); break;
      case 'filters': activate('#fsm-home-nav [data-fsm-home-action="filters"]'); break;
      case 'favorites': activate('#btn-open-favorites'); break;
      case 'all': activate('#fsm-home-nav [data-fsm-home-action="spots"]'); break;
    }
  });
  const paint = () => {
    const t = TR[document.documentElement.lang?.split('-')[0]] || TR.de;
    hero.setAttribute('aria-label', t.title);
    hero.querySelector('.fsm-v884-hero-eyebrow').textContent = t.eyebrow;
    hero.querySelector('.fsm-v884-hero-title').textContent = t.title;
    hero.querySelector('.fsm-v884-hero-subtitle').textContent = t.subtitle;
    hero.querySelector('.fsm-v884-hero-badge').textContent = t.preview;
    for (const el of hero.querySelectorAll('[data-v884-text]')) el.textContent = t[el.dataset.v884Text] || '';
    for (const key of ['filters','calendar','favorites','all','today','plan']) {
      const btn = hero.querySelector(`[data-v884="${key}"]`);
      if (btn) btn.setAttribute('aria-label', key==='plan'?t.plan:t[key]);
    }
  };
  new MutationObserver(paint).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  paint();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
else init();
