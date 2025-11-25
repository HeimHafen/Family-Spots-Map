// js/i18n.js

const I18N = (() => {
  const fallbackLang = 'de';
  const supportedLangs = ['de', 'en'];
  let currentLang = localStorage.getItem('language') || detectLang();
  let translations = {};

  function detectLang() {
    const browserLang = navigator.language.slice(0, 2);
    return supportedLangs.includes(browserLang) ? browserLang : fallbackLang;
  }

  async function loadTranslations(lang) {
    try {
      const response = await fetch(`data/i18n/${lang}.json`);
      if (!response.ok) throw new Error(`Couldn't load: ${lang}`);
      translations = await response.json();
    } catch (error) {
      console.warn(`[i18n] Fehler beim Laden von ${lang}.json`, error);
      if (lang !== fallbackLang) {
        console.log(`[i18n] Fallback auf ${fallbackLang}`);
        return loadTranslations(fallbackLang);
      }
    }
  }

  function t(key) {
    return translations[key] || `⚠️${key}`;
  }

  async function setLanguage(lang) {
    if (!supportedLangs.includes(lang)) return;
    currentLang = lang;
    localStorage.setItem('language', lang);
    await loadTranslations(lang);
    updateDOM();
  }

  function updateDOM() {
    // Variante 1: data-i18n-key → übersetzt aus JSON
    document.querySelectorAll('[data-i18n-key]').forEach((el) => {
      const key = el.getAttribute('data-i18n-key');
      const value = t(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = value;
      } else {
        el.innerHTML = value;
      }
    });

    // Variante 2: data-i18n-de / data-i18n-en → direkt aus HTML
    document.querySelectorAll('[data-i18n-de], [data-i18n-en]').forEach((el) => {
      const attr = `data-i18n-${currentLang}`;
      const value = el.getAttribute(attr);
      if (!value) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = value;
      } else {
        el.textContent = value;
      }
    });

    // Update <html lang="">
    document.documentElement.setAttribute('lang', currentLang);
  }

  async function init() {
    await setLanguage(currentLang);
  }

  return {
    init,
    t,
    setLanguage,
    getLanguage: () => currentLang
  };
})();