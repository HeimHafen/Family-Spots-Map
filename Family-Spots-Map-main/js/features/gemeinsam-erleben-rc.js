// Family Spots Map V34 · Private calendar, integrated with map and diary.
// Public registration remains disabled; drafts stay only on this device.
// Keep the existing storage key for compatibility with older private drafts.
import { createModalController } from "../ui/modal.js";

const STORAGE_KEY = "fsm-together-rc-private-v1";
const LOCK_ICON = '<svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="2"/><path d="M5 7V5a3 3 0 0 1 6 0v2m-3 3v1"/></svg>';
const CATEGORY = ["all", "camping", "sport", "nature", "family"];
const SYMBOL = { camping:"⛺", sport:"⚽", nature:"🌿", family:"💚" };
const T = {
 de: {
  name:"Gemeinsam erleben",
  menu:"Gemeinsam erleben · Kalender", eyebrow:"Family Spots Map",
  close:"Schließen", new:"Ausflug planen", calendar:"Kalender", upcoming:"Kommende Termine", today:"Heute",
  dayNames:["Mo","Di","Mi","Do","Fr","Sa","So"], monthFormat:"de-DE", filters:"Aktivitäten", all:"Alle Aktivitäten", camping:"Camping", sport:"Spiel & Sport", nature:"Natur & Bewegung", family:"Familienzeit",
  noEvents:"Keine Ausflüge für diese Auswahl", noEventsNote:"Deine privaten Pläne erscheinen hier.",
  private:"Nur auf diesem Gerät", storageError:"Speichern nicht möglich. Bitte prüfe den verfügbaren Gerätespeicher.", repeat:"Jährlich",
  spotTitle:"Gemeinsam erleben", spotNote:"Ausflüge planen, gemeinsam losziehen und draußen Neues entdecken.", atSpot:"Für diesen Spot planen", spotFallback:"Spot auswählen", allSpots:"Alle Spots", eventDay:"Termine am", eventCount: count => `${count} ${count === 1 ? "Ausflug" : "Ausflüge"}`, draftForm:"Ausflug planen",
  eventTitle:"Titel des Ausflugs", titlePlaceholder:"z. B. Picknick am See", eventType:"Aktivität", date:"Datum", time:"Beginn", spot:"Treffpunkt", note:"Notiz (optional)", notePlaceholder:"Was möchtet ihr festhalten?", yearly:"Jährlich wiederholen", save:"Privat speichern", cancel:"Zurück", edit:"Bearbeiten", remove:"Löschen", export:"Kalenderdatei exportieren", saved:"Ausflug gespeichert.", invalid:"Bitte alle Pflichtfelder ausfüllen.", unavailable:"Spots konnten nicht geladen werden. Bitte erneut versuchen.", privacy:"Bleibt auf diesem Gerät. Zum Sichern als Kalenderdatei exportieren.", preview:"Privater Ausflugskalender", noSpots:"Keine Spots verfügbar", location:"Ort", selectedDay:"Ausgewählter Tag", more:"Weiter", addTo:"Als Kalendereintrag speichern", confirmDelete:"Diesen Ausflug löschen?"
 },
 en: {
  name:"Experience together", menu:"Experience together · Calendar", eyebrow:"Family Spots Map", close:"Close", new:"Plan an outing", calendar:"Calendar", upcoming:"Upcoming outings", today:"Today", dayNames:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], monthFormat:"en-GB", filters:"Activities", all:"All activities", camping:"Camping", sport:"Play & sport", nature:"Nature & movement", family:"Family time", noEvents:"No outings match this selection", noEventsNote:"Your private plans will appear here.", private:"On this device only", storageError:"Unable to save. Check available device storage.", repeat:"Yearly", spotTitle:"Experience together", spotNote:"Plan outings and make the most of your time together outdoors.", atSpot:"Plan at this spot", spotFallback:"Choose a spot", allSpots:"All spots", eventDay:"Events on", eventCount: count => `${count} ${count === 1 ? "outing" : "outings"}`, draftForm:"Plan an outing", eventTitle:"Outing title", titlePlaceholder:"e.g. Picnic by the lake", eventType:"Activity", date:"Date", time:"Start time", spot:"Meeting point", note:"Note (optional)", notePlaceholder:"What would you like to remember?", yearly:"Repeat yearly", save:"Save privately", cancel:"Back", edit:"Edit", remove:"Delete", export:"Export calendar file", saved:"Outing saved.", invalid:"Complete the required fields.", unavailable:"Unable to load spots. Please retry.", privacy:"Stays on this device. Export a calendar file to keep a copy.", preview:"Private outing calendar", noSpots:"No spots available", location:"Location", selectedDay:"Selected day", more:"Next", addTo:"Save to calendar", confirmDelete:"Delete this outing?"
 },
 da: {
  name:"Oplev sammen", menu:"Oplev sammen · Kalender", eyebrow:"Family Spots Map", close:"Luk", new:"Planlæg en tur", calendar:"Kalender", upcoming:"Kommende ture", today:"I dag", dayNames:["Man","Tir","Ons","Tor","Fre","Lør","Søn"], monthFormat:"da-DK", filters:"Aktiviteter", all:"Alle aktiviteter", camping:"Camping", sport:"Leg og sport", nature:"Natur og bevægelse", family:"Familietid", noEvents:"Ingen ture passer til det valgte filter", noEventsNote:"Jeres private planer vises her.", private:"Kun på denne enhed", storageError:"Kunne ikke gemme. Kontroller ledig lagerplads på enheden.", repeat:"Årligt", spotTitle:"Oplev sammen", spotNote:"Planlæg en tur, kom af sted, og oplev noget nyt sammen.", atSpot:"Planlæg ved dette sted", spotFallback:"Vælg et sted", allSpots:"Alle steder", eventDay:"Arrangementer den", eventCount: count => `${count} ${count === 1 ? "tur" : "ture"}`, draftForm:"Planlæg en tur", eventTitle:"Turens titel", titlePlaceholder:"Fx picnic ved søen", eventType:"Aktivitet", date:"Dato", time:"Starttid", spot:"Mødested", note:"Note (valgfri)", notePlaceholder:"Hvad vil I gerne huske?", yearly:"Gentag hvert år", save:"Gem privat", cancel:"Tilbage", edit:"Rediger", remove:"Slet", export:"Eksportér kalenderfil", saved:"Turen er gemt.", invalid:"Udfyld de obligatoriske felter.", unavailable:"Steder kunne ikke indlæses. Prøv igen.", privacy:"Gemmes på denne enhed. Eksportér en kalenderfil for at gemme en kopi.", preview:"Privat turkalender", noSpots:"Ingen steder tilgængelige", location:"Sted", selectedDay:"Valgt dag", more:"Næste", addTo:"Gem i kalender", confirmDelete:"Vil I slette denne tur?"
 }
};

const clean = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const parseISO = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ""); if (!m) return null; const d = new Date(+m[1],+m[2]-1,+m[3]); return iso(d) === s ? d : null; };
const monthShift = (date,n) => new Date(date.getFullYear(),date.getMonth()+n,1);
const formatDay = (date,lang) => new Intl.DateTimeFormat(T[lang].monthFormat,{weekday:"long",day:"numeric",month:"long"}).format(date);
const locDate = (date,lang) => new Intl.DateTimeFormat(T[lang].monthFormat,{day:"numeric",month:"short"}).format(date);
const mode = () => { const l = document.documentElement.lang?.slice(0,2); return T[l] ? l : /\/da\//.test(location.pathname) ? "da" : /\/en\//.test(location.pathname) ? "en" : "de"; };

let spots = [], spotsPromise = null;
async function loadSpots() {
 if (spotsPromise) return spotsPromise;
 spotsPromise = fetch(new URL("../../data/spots.json",import.meta.url),{cache:"default"}).then(r=>{if(!r.ok)throw Error("spots unavailable");return r.json()}).then(list=>{if(!Array.isArray(list))throw Error("invalid spots");spots=list.filter(s=>s&&typeof s.id==="string"&&typeof s.lat==="number"&&typeof s.lon==="number");return spots}).catch(e=>{spotsPromise=null;throw e});
 return spotsPromise;
}
function getSpotTitle(s,lang) {return String(s?.[`title_${lang}`] || s?.title_de || s?.title || s?.id || "");}
function readDrafts(){ try { const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]"); return Array.isArray(raw) ? raw.filter(v=>v&&typeof v.id==="string"&&typeof v.title==="string"&&v.title.length<150&&parseISO(v.date)&&/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(v.time||"")&&["camping","sport","nature","family"].includes(v.category)).slice(0,300):[];}catch{return [];}}
function storeDrafts(d){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(d));return true;}catch{return false;}}
const state = {open:false, month:monthShift(new Date(),0), day:iso(new Date()), tab:"day", cat:"all", form:false, editing:null, spot:null, previousFocus:null, drafts:readDrafts()};
function occurrences(){
 const out=[]; const today=new Date();
 for(const e of state.drafts){
  const base=parseISO(e.date);if(!base)continue;
  out.push({...e,private:true});
  if(!e.yearly)continue;
  for(let y=Math.max(base.getFullYear()+1,today.getFullYear()-1);y<=today.getFullYear()+5;y++) {
   const yr = new Date(y,base.getMonth(),base.getDate());
   if(yr.getMonth()!==base.getMonth()) continue;
   out.push({...e,date:iso(yr),occurrence:true,private:true});
  }
 }
 return out.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
}
function matching(){let e=occurrences();if(state.cat!=="all")e=e.filter(x=>x.category===state.cat);if(state.spot)e=e.filter(x=>x.spotId===state.spot);return e;}
let overlay, body, footer, modal;
let previousBodyOverflow = null;
export function initPrivateCalendar({ closeMenu, captureMemory } = {}) {
 if(document.getElementById("fse-overlay"))return;
 const menuList=document.querySelector(".app-menu-list");
 if(!menuList)return;
 const button=document.createElement("button");button.type="button";button.id="fse-menu-open";button.className="app-menu-item fse-launch";button.setAttribute("aria-haspopup","dialog");
 button.innerHTML=`<span class="app-menu-item-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18M8 15l2.5 2.5L16 13"/></svg></span><span class="app-menu-item-label"></span>`;
 button.querySelector(".app-menu-item-label").textContent=T[mode()].menu;
 menuList.querySelector("#btn-open-favorites")?.after(button);
 if(!button.isConnected)menuList.prepend(button);
 button.addEventListener("click",()=>{closeMenu?.();open();});
 overlay=document.createElement("div");overlay.id="fse-overlay";overlay.hidden=true;overlay.innerHTML=`<section class="fse-shell" role="dialog" aria-modal="true" aria-labelledby="fse-title"><header class="fse-header"><div class="fse-title-row"><div class="fse-header-heading"><p class="fse-eyebrow" id="fse-eyebrow"></p><h2 id="fse-title"></h2></div><button type="button" class="fse-icon-btn" data-fse="close" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"/></svg></button></div><span class="fse-preview-badge" id="fse-preview-badge"></span></header><div class="fse-body" id="fse-body"></div><footer class="fse-footer" id="fse-footer"></footer></section>`;
 document.body.append(overlay);modal=createModalController(overlay);body=overlay.querySelector("#fse-body");footer=overlay.querySelector("#fse-footer");
 overlay.addEventListener("click",delegate);
 overlay.addEventListener("change",change);
 overlay.addEventListener("submit",submit);
 overlay.addEventListener("click",e=>{if(e.target===overlay)close();});
 document.addEventListener("keydown", e=>{if(!state.open)return;if(e.key==="Escape"){e.preventDefault();close();}});
 
 document.addEventListener("fsm:plan-spot", e=>{open(typeof e.detail?.spotId === "string" ? e.detail.spotId : null);});
 new MutationObserver(() => { button.querySelector(".app-menu-item-label").textContent=T[mode()].menu; }).observe(document.documentElement, {attributes:true, attributeFilter:["lang"]});
 overlay.addEventListener("click", event => {
  const action = event.target.closest("[data-fse-memory]");
  const plan = action && state.drafts.find(entry => entry.id === action.dataset.fseMemory);
  if (plan) { close(); captureMemory?.(plan.title); }
 });
}
async function open(spotId = null) {
 if (!overlay || state.open) return;
 state.open = true;
 state.form = false;
 state.editing = null;
 state.spot = spotId;
 state.drafts = readDrafts();
 state.day = iso(new Date());
 state.month = monthShift(new Date(), 0);
 state.tab = "day";
 state.cat = "all";
 previousBodyOverflow = document.body.style.overflow;
 document.body.style.overflow = "hidden";
 overlay.hidden = false;
 document.body.classList.add("fse-open");
 render();
 modal.activate({initialFocus: overlay.querySelector("[data-fse=close]")});

 // Show a normal calendar until spot data are ready; never replace a form in use.
 try {
  await loadSpots();
  if (!state.open || state.spot !== spotId || state.form) return;
  if (spotId && spots.some(spot => spot.id === spotId)) {
   state.form = true;
   render();
   body.querySelector("[name=title]")?.focus({preventScroll:true});
  } else {
   render();
  }
 } catch { /* General calendar and existing plans remain available. */ }
}
function close() {
 if (!state.open) return;
 state.open = false;
 state.form = false;
 state.spot = null;
 body.replaceChildren();
 overlay.hidden = true;
 document.body.classList.remove("fse-open");
 document.body.style.overflow = previousBodyOverflow || "";
 modal.deactivate();
}
function render(){
 if(!state.open)return;
 const lang=mode(),t=T[lang];
 overlay.querySelector("#fse-eyebrow").textContent=t.eyebrow;
 overlay.querySelector("#fse-title").textContent=t.name;
 overlay.querySelector("#fse-preview-badge").innerHTML=LOCK_ICON+clean(t.preview);
 overlay.querySelector("[data-fse=close]").setAttribute("aria-label",t.close);
 const active = document.activeElement;
 const action = overlay.contains(active) ? active.dataset.fse : null;
 if(state.form){renderForm(t,lang);}else{renderCalendar(t,lang);}
 if (action && !active.isConnected) {
  const selector = `[data-fse="${CSS.escape(action)}"]`;
  const replacement = [...overlay.querySelectorAll(selector)].find(node =>
   node.dataset.date === active.dataset.date && node.dataset.tab === active.dataset.tab && node.dataset.id === active.dataset.id);
  (replacement || overlay.querySelector("[data-fse=close]"))?.focus({preventScroll:true});
 }
}
function renderCalendar(t,lang){
 const date=new Date(state.month.getFullYear(),state.month.getMonth(),1);
 const dateTitle=new Intl.DateTimeFormat(t.monthFormat,{month:"long",year:"numeric"}).format(date);
 const start=(date.getDay()+6)%7;const max=new Date(date.getFullYear(),date.getMonth()+1,0).getDate();
 const events=matching();
 const cells=[];
 for(let i=0;i<start;i++)cells.push('<button type="button" class="fse-day" disabled aria-hidden="true"></button>');
 for(let i=1;i<=max;i++){
  const d=iso(new Date(date.getFullYear(),date.getMonth(),i)), dayEvents=events.filter(x=>x.date===d),today=d===iso(new Date());
  const cls=["fse-day",today?"fse-day--today":"",d===state.day?"fse-day--chosen":"",dayEvents.length?"fse-day--has":""].filter(Boolean).join(" ");
  const dotCategories=[...new Set(dayEvents.map(x=>x.category))].slice(0,3);
  cells.push(`<button type="button" class="${cls}" data-fse="day" data-date="${d}" aria-pressed="${d===state.day}" aria-label="${clean(formatDay(new Date(date.getFullYear(),date.getMonth(),i),lang))}${dayEvents.length?` · ${clean(t.eventCount(dayEvents.length))}`:""}">${i}<span class="fse-dots">${dotCategories.map(k=>`<span class="fse-dot fse-dot--${k}"></span>`).join("")}</span></button>`);
 }
 const selected=parseISO(state.day)||new Date();
 const shown=events.filter(e=>state.tab==="upcoming"?e.date>=iso(new Date()):e.date===state.day).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 const monthHtml=`<div class="fse-calendar"><div class="fse-calendar-nav"><button type="button" class="fse-cal-nav-btn" data-fse="prev" aria-label="${{de:"Vorheriger Monat",en:"Previous month",da:"Forrige måned"}[lang]}">‹</button><h3>${clean(dateTitle)}</h3><button type="button" class="fse-cal-nav-btn" data-fse="next" aria-label="${{de:"Nächster Monat",en:"Next month",da:"Næste måned"}[lang]}">›</button></div><div class="fse-weekdays">${t.dayNames.map(x=>`<span>${clean(x)}</span>`).join("")}</div><div class="fse-dates">${cells.join("")}</div></div>`;
 body.innerHTML=`${monthHtml}<div class="fse-controls"><button type="button" class="fse-toggle" data-fse="tab" data-tab="day" aria-pressed="${state.tab==="day"}">${clean(t.calendar)}</button><button type="button" class="fse-toggle" data-fse="tab" data-tab="upcoming" aria-pressed="${state.tab==="upcoming"}">${clean(t.upcoming)}</button></div><div class="fse-section-heading"><h3>${state.tab==="upcoming"?clean(t.upcoming):clean(formatDay(selected,lang))}</h3><button type="button" class="fse-link" data-fse="now">${clean(t.today)}</button></div><div class="fse-select-row"><label class="sr-only" for="fse-filter">${clean(t.filters)}</label><select id="fse-filter" class="fse-select" data-fse="category">${CATEGORY.map(c=>`<option value="${c}" ${state.cat===c?"selected":""}>${clean(t[c])}</option>`).join("")}</select></div><div class="fse-event-list">${shown.length?shown.map(e=>eventCard(e,t,lang)).join(""):`<div class="fse-empty"><strong>${clean(t.noEvents)}</strong>${clean(t.noEventsNote)}</div>`}</div><p class="fse-storage-status" role="status"></p>`;
 footer.innerHTML=`<button type="button" class="fse-cta" data-fse="form">+ ${clean(t.new)}</button>`;
}
function eventCard(e,t,lang){const memoryLabel={de:"Erinnerung festhalten",en:"Capture a memory",da:"Gem et minde"}[lang];const spot=spots.find(s=>s.id===e.spotId),name=spot?getSpotTitle(spot,lang):(e.spotName||"");return `<article class="fse-event"><div class="fse-event-symbol fse-event-symbol--${e.category}" aria-hidden="true">${SYMBOL[e.category]}</div><div class="fse-event-content"><h4>${clean(e.title)}</h4><p>${clean(locDate(parseISO(e.date),lang))} · ${clean(e.time)}${name?` · ${clean(name)}`:""}</p>${e.note?`<p>${clean(e.note)}</p>`:""}<div class="fse-event-badges"><span class="fse-tag fse-tag--private">${clean(t.private)}</span>${e.yearly?`<span class="fse-tag">${clean(t.repeat)}</span>`:""}</div>${e.private&&!e.occurrence?`<div class="fse-event-actions"><button type="button" class="fse-mini" data-fse="edit" data-id="${clean(e.id)}">${clean(t.edit)}</button><button type="button" class="fse-mini" data-fse="ics" data-id="${clean(e.id)}">${clean(t.export)}</button>${e.date<=iso(new Date())?`<button type="button" class="fse-mini" data-fse-memory="${clean(e.id)}">${clean(memoryLabel)}</button>`:""}<button type="button" class="fse-mini" data-fse="delete" data-id="${clean(e.id)}">${clean(t.remove)}</button></div>`:""}</div></article>`;}
function renderForm(t,lang){const draft=state.drafts.find(x=>x.id===state.editing);const selected=draft?.spotId||state.spot||"";const spotOptions=spots.map(s=>({id:s.id,name:getSpotTitle(s,lang)})).sort((a,b)=>a.name.localeCompare(b.name,lang));const d=draft?.date||(state.day||iso(new Date()));const cat=draft?.category||"family";
 body.innerHTML=`<div class="fse-form"><h3>${clean(t.draftForm)}</h3><form id="fse-draft-form"><label class="fse-field">${clean(t.eventTitle)}<input name="title" maxlength="90" placeholder="${clean(t.titlePlaceholder)}" value="${clean(draft?.title||"")}" required autocomplete="off"></label><label class="fse-field">${clean(t.eventType)}<select name="category" required>${CATEGORY.filter(c=>c!=="all").map(c=>`<option value="${c}" ${cat===c?"selected":""}>${clean(t[c])}</option>`).join("")}</select></label><div class="fse-form-row"><label class="fse-field">${clean(t.date)}<span class="fse-native-field"><input name="date" type="date" value="${clean(d)}" required></span></label><label class="fse-field">${clean(t.time)}<span class="fse-native-field"><input name="time" type="time" value="${clean(draft?.time||"15:30")}" required></span></label></div><label class="fse-field">${clean(t.spot)}<select name="spotId"><option value="">${clean(spots.length?t.spotFallback:t.noSpots)}</option>${spotOptions.map(s=>`<option value="${clean(s.id)}" ${selected===s.id?"selected":""}>${clean(s.name)}</option>`).join("")}</select></label><label class="fse-field">${clean(t.note)}<textarea name="note" maxlength="360" placeholder="${clean(t.notePlaceholder)}">${clean(draft?.note||"")}</textarea></label><label class="fse-check"><input name="yearly" type="checkbox" ${draft?.yearly?"checked":""}><span>${clean(t.yearly)}</span></label><div class="fse-form-actions"><button type="button" class="fse-cancel" data-fse="cancel">${clean(t.cancel)}</button><button type="submit" class="fse-save">${clean(t.save)}</button></div><p class="fse-status" role="status" id="fse-status"></p></form></div>`;
 footer.innerHTML=`<span class="fse-footer-note">${LOCK_ICON}<span>${clean(t.privacy)}</span></span>`;
}
async function openForm(id = null) {
 const selectedDay = state.day;
 state.editing = id;
 state.form = true;
 render();
 body.scrollTop = 0;
 body.querySelector("[name=title]")?.focus({preventScroll:true});
 const select = body.querySelector("[name=spotId]");
 if (spots.length || !select) return;
 try {
  const list = await loadSpots();
  if (!select.isConnected || state.day !== selectedDay) return;
  const lang = mode();
  const selected = state.drafts.find(entry => entry.id === id)?.spotId || state.spot || "";
  select.options[0].textContent = T[lang].spotFallback;
  for (const spot of [...list].sort((a,b) => getSpotTitle(a,lang).localeCompare(getSpotTitle(b,lang),lang))) {
   select.add(new Option(getSpotTitle(spot,lang),spot.id,false,spot.id === selected));
  }
 } catch { /* An outing can still be saved without a selected spot. */ }
}
function delegate(e){const btn=e.target.closest("[data-fse]");if(!btn)return;const action=btn.dataset.fse;
 if(action==="close")return close();
 if(action==="prev"||action==="next"){state.month=monthShift(state.month,action==="prev"?-1:1);state.day=iso(state.month);render();return;}
 if(action==="now"){state.month=monthShift(new Date(),0);state.day=iso(new Date());state.tab="day";render();return;}
 if(action==="day"){state.day=btn.dataset.date;state.tab="day";render();return;}
 if(action==="tab"){state.tab=btn.dataset.tab;render();return;}
 if(action==="form"){openForm();return;}
 if(action==="cancel"){state.form=false;state.editing=null;render();return;}
 if(action==="edit"){openForm(btn.dataset.id);return;}
 if(action==="delete"){if(!confirm(T[mode()].confirmDelete))return;const next=readDrafts().filter(x=>x.id!==btn.dataset.id);if(!storeDrafts(next)){body.querySelector(".fse-storage-status").textContent=T[mode()].storageError;return;}state.drafts=next;render();return;}
 if(action==="ics"){const ev=state.drafts.find(x=>x.id===btn.dataset.id);if(ev)exportICS(ev);return;}
}
function change(e){if(e.target.dataset.fse==="category"){state.cat=CATEGORY.includes(e.target.value)?e.target.value:"all";render();}}
function submit(e){if(e.target.id!=="fse-draft-form")return;e.preventDefault();const data=new FormData(e.target),title=String(data.get("title")||"").trim(),date=String(data.get("date")||""),time=String(data.get("time")||""),category=data.get("category"),spotId=String(data.get("spotId")||"");
 if(!title||title.length>90||!parseISO(date)||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)||!CATEGORY.slice(1).includes(category)||spotId&&!spots.some(s=>s.id===spotId)){e.target.querySelector("#fse-status").textContent=T[mode()].invalid;return;}
 const draft={id:state.editing||(`private-${Date.now()}-${Math.random().toString(36).slice(2,8)}`),title,category,date,time,spotId,spotName:spotId ? getSpotTitle(spots.find(spot=>spot.id===spotId),mode()) : "",note:String(data.get("note")||"").trim().slice(0,360),yearly:data.get("yearly")==="on"};
 const next=readDrafts().filter(x=>x.id!==draft.id).concat(draft);
 if(next.length>300){e.target.querySelector("#fse-status").textContent=({de:"Maximal 300 Pläne. Lösche zuerst einen alten Plan.",en:"Up to 300 plans. Delete an old plan first.",da:"Op til 300 planer. Slet først en gammel plan."})[mode()];return;}
 if(!storeDrafts(next)){e.target.querySelector("#fse-status").textContent=T[mode()].storageError;return;}
 state.drafts=next;state.form=false;state.editing=null;if(state.spot!==spotId)state.spot=null;state.month=monthShift(parseISO(date),0);state.day=date;state.tab="day";state.cat="all";render();body.scrollTop=0;
}
// Fold at 75 UTF-8 octets, including the space on continuation lines.
const calendarEncoder = new TextEncoder();
function foldCalendarLine(line) {
 const parts = [];
 let part = "", bytes = 0;
 for (const character of line) {
  const size = calendarEncoder.encode(character).length;
  if (bytes + size > 75) {
   parts.push(part);
   part = " ";
   bytes = 1;
  }
  part += character;
  bytes += size;
 }
 return [...parts, part].join("\r\n");
}
function exportICS(e){
 const date=e.date.replace(/-/g,"");const start=e.time.replace(":","")+"00";const endDate=new Date(`${e.date}T${e.time}:00`);endDate.setHours(endDate.getHours()+1);const end=`${String(endDate.getHours()).padStart(2,"0")}${String(endDate.getMinutes()).padStart(2,"0")}00`;const endDay=iso(endDate).replace(/-/g,"");
 const esc=s=>String(s||"").replace(/\\/g,"\\\\").replace(/\r\n|[\r\n]/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
 const spot=spots.find(s=>s.id===e.spotId);
 const props=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Family Spots Map//Private meetup drafts//DE","BEGIN:VEVENT",`UID:${e.id}@family-spots-map.local`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+/,"")}`,`DTSTART:${date}T${start}`,`DTEND:${endDay}T${end}`,`SUMMARY:${esc(e.title)}`,`DESCRIPTION:${esc(e.note)}`,`LOCATION:${esc(spot?getSpotTitle(spot,mode()):e.spotName)}`,...(e.yearly?["RRULE:FREQ=YEARLY"]:[]),"END:VEVENT","END:VCALENDAR"];
 const blob=new Blob([props.map(foldCalendarLine).join("\r\n")+"\r\n"],{type:"text/calendar;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`Family-Spots-Map-${e.date}.ics`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

