// Optional evening palette: the light design is always the default unless chosen.
import { applyTheme } from "../theme.js";

const TEXT = {
  de: {name:"Abendmodus", on:"Abendmodus ausschalten", off:"Abendmodus einschalten"},
  en: {name:"Evening mode", on:"Turn off evening mode", off:"Turn on evening mode"},
  da: {name:"Aftentilstand", on:"Slå aftentilstand fra", off:"Slå aftentilstand til"}
};
export function initEveningMode() {
  const menu = document.querySelector(".app-menu-list");
  if (!menu || document.getElementById("fsm-evening-toggle")) return;
  let selected = "light";
  try { selected = localStorage.getItem("fs_theme") === "dark" ? "dark" : "light"; }
  catch { /* Private browsing / unavailable storage: keep light mode. */ }
  applyTheme(selected);
  const button = document.createElement("button");
  button.type = "button";
  button.id = "fsm-evening-toggle";
  button.className = "app-menu-item";
  button.innerHTML = '<span class="app-menu-item-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14a8.6 8.6 0 0 1-10.5-10.5A8.6 8.6 0 1 0 20.5 14Z"/></svg></span><span class="app-menu-item-label"></span>';
  const translate = () => {
    const lang = document.documentElement.lang.slice(0,2);
    const copy = TEXT[lang] || TEXT.de;
    const on = document.documentElement.dataset.theme === "dark";
    button.querySelector(".app-menu-item-label").textContent = copy.name;
    button.setAttribute("aria-label",on ? copy.on : copy.off);
    button.setAttribute("aria-pressed",String(on));
  };
  button.addEventListener("click", () => {applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");translate();});
  menu.querySelector("#btn-help")?.before(button);
  if (!button.isConnected) menu.append(button);
  new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});
  translate();
}
