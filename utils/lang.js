// utils/lang.js
import { getLanguage } from "../core/i18n.js";

export function getLanguageInfo() {
  const lang = (getLanguage && getLanguage()) || "de";
  const lower = lang.toLowerCase();
  return {
    lang: lower,
    isDe: lower.startsWith("de"),
    isDa: lower.startsWith("da"),
    isEn: lower.startsWith("en"),
  };
}