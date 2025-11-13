let currentLang = "de";
let messages = {};

export function getLanguage() {
  return currentLang;
}

export async function initI18n(lang) {
  const target = lang || currentLang || "de";
  try {
    const res = await fetch(`data/i18n/${target}.json`);
    if (!res.ok) throw new Error("i18n load failed");
    messages = await res.json();
    currentLang = target;
  } catch (err) {
    console.error(err);
    if (target !== "de") {
      return initI18n("de");
    }
  }
}

export function t(key, fallback) {
  return messages[key] ?? fallback ?? key;
}

export function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const value = t(key);
    if (value) el.textContent = value;
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const value = t(key);
    if (value) el.setAttribute("placeholder", value);
  });
}