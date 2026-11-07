// Family Spots Map V34 · Private calendar, integrated with map and diary.
// Public registration remains disabled; drafts stay only on this device.
// Keep the existing storage key for compatibility with older private drafts.
"use strict";

const STORAGE_KEY = "fsm-together-rc-private-v1";
const CATEGORY = ["all", "camping", "sport", "nature", "family"];
const SYMBOL = { camping:"⛺", sport:"⚽", nature:"🌿", family:"💚" };
const T = {
 de: {
  name:"Gemeinsam erleben", subtitle:"Orte entdecken. Menschen verbinden. Erinnerungen schaffen.",
  menu:"Gemeinsam erleben · Kalender", eyebrow:"FAMILY SPOTS MAP · GEMEINSAM",
  close:"Schließen", create:"Treffen planen", new:"Neues Treffen", calendar:"Kalender", upcoming:"Alle kommenden", today:"Heute",
  dayNames:["Mo","Di","Mi","Do","Fr","Sa","So"], monthFormat:"de-DE", filters:"Interessen", all:"Alle Aktivitäten", camping:"Camping", sport:"Spiel & Sport", nature:"Natur & Bewegung", family:"Familienzeit",
  noEvents:"Noch keine Treffen für diese Auswahl", noEventsNote:"Plane eine gemeinsame Aktivität – erst einmal ganz privat auf deinem Gerät.",
  demoToggle:"Beispieltermine zum Ausprobieren anzeigen (keine echten Treffen)", demo:"Beispiel", private:"Nur auf diesem Gerät", storageError:"Speichern nicht möglich. Bitte prüfe den verfügbaren Gerätespeicher.", repeat:"Jährlich", sampleNames:["Campingwochenende · Beispiel","Bolzplatz-Treffen · Beispiel","Familienwanderung · Beispiel"],
  sampleNote:"Diese Termine zeigen nur die Gestaltung. Hier finden keine echten Veranstaltungen statt.",
  spotTitle:"Gemeinsam erleben", spotNote:"Treffen planen, gemeinsam losziehen und die schönsten Momente draußen erleben.", atSpot:"Für diesen Spot planen", spotFallback:"Spot auswählen", allSpots:"Alle Spots", eventDay:"Termine am", events:"Treffen", draftForm:"Euer gemeinsames Abenteuer planen", draftInfo:"Ein privater Entwurf für euch. Niemand sonst kann ihn sehen oder sich anmelden.",
  eventTitle:"Titel des Treffens", titlePlaceholder:"z. B. Familien-Campingwochenende", eventType:"Aktivität", date:"Datum", time:"Beginn", spot:"Treffpunkt", note:"Beschreibung (optional)", notePlaceholder:"Was möchtet ihr gemeinsam erleben?", yearly:"Dieses Treffen jährlich wiederholen", save:"Privat speichern", cancel:"Zurück", edit:"Bearbeiten", remove:"Löschen", export:"Kalendereintrag", saved:"Privater Entwurf gespeichert.", invalid:"Bitte alle Pflichtfelder ausfüllen.", unavailable:"Spots konnten nicht geladen werden. Bitte erneut versuchen.", privacy:"Nur auf diesem Gerät. Nicht in der Erinnerungs-Sicherung: Bei Bedarf als Kalenderdatei exportieren.", preview:"PRIVATE PLANUNG · LOKAL", noSpots:"Keine Spots verfügbar", location:"Ort", selectedDay:"Ausgewählter Tag", more:"Weiter", addTo:"Als Kalendereintrag speichern", confirmDelete:"Diesen privaten Entwurf löschen?"
 },
 en: {
  name:"Experience together", subtitle:"Discover places. Connect people. Make memories.", menu:"Experience together · Calendar", eyebrow:"FAMILY SPOTS MAP · TOGETHER", close:"Close", create:"Plan a meetup", new:"New meetup", calendar:"Calendar", upcoming:"All upcoming", today:"Today", dayNames:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], monthFormat:"en-GB", filters:"Interests", all:"All activities", camping:"Camping", sport:"Play & sport", nature:"Nature & movement", family:"Family time", noEvents:"No meetups for this selection yet", noEventsNote:"Plan something together, privately on this device to start with.", demoToggle:"Show sample events for preview (not real meetups)", demo:"Sample", private:"On this device only", storageError:"Unable to save. Check available device storage.", repeat:"Yearly", sampleNames:["Camping weekend · Sample","Playground football · Sample","Family hike · Sample"], sampleNote:"These sample events demonstrate the design. They are not real gatherings.", spotTitle:"Experience together", spotNote:"Plan meetups and make the most of your shared time outdoors.", atSpot:"Plan at this spot", spotFallback:"Choose a spot", allSpots:"All spots", eventDay:"Events on", events:"Meetups", draftForm:"Plan your next adventure together", draftInfo:"A private draft just for you. Nobody else can view it or sign up.", eventTitle:"Meetup title", titlePlaceholder:"e.g. Family camping weekend", eventType:"Activity", date:"Date", time:"Start time", spot:"Meeting point", note:"Description (optional)", notePlaceholder:"What would you like to do together?", yearly:"Repeat this meetup yearly", save:"Save privately", cancel:"Back", edit:"Edit", remove:"Delete", export:"Calendar entry", saved:"Private draft saved.", invalid:"Complete the required fields.", unavailable:"Unable to load spots. Please retry.", privacy:"Only on this device, not in the memories backup. Export calendar entries if needed.", preview:"PRIVATE PLANNING · ON DEVICE", noSpots:"No spots available", location:"Location", selectedDay:"Selected day", more:"Next", addTo:"Save to calendar", confirmDelete:"Delete this private draft?"
 },
 da: {
  name:"Oplev sammen", subtitle:"Opdag steder. Forbind mennesker. Skab minder.", menu:"Oplev sammen · Kalender", eyebrow:"FAMILY SPOTS MAP · SAMMEN", close:"Luk", create:"Planlæg et møde", new:"Nyt møde", calendar:"Kalender", upcoming:"Alle kommende", today:"I dag", dayNames:["Man","Tir","Ons","Tor","Fre","Lør","Søn"], monthFormat:"da-DK", filters:"Interesser", all:"Alle aktiviteter", camping:"Camping", sport:"Leg og sport", nature:"Natur og bevægelse", family:"Familietid", noEvents:"Ingen møder for dette valg endnu", noEventsNote:"Planlæg en aktivitet sammen – først helt privat på denne enhed.", demoToggle:"Vis eksempler til forhåndsvisning (ikke rigtige møder)", demo:"Eksempel", private:"Kun på denne enhed", storageError:"Kunne ikke gemme. Kontroller ledig lagerplads på enheden.", repeat:"Årligt", sampleNames:["Campingweekend · Eksempel","Fodboldmøde · Eksempel","Familievandring · Eksempel"], sampleNote:"Disse arrangementer viser kun designet. De er ikke virkelige møder.", spotTitle:"Oplev sammen", spotNote:"Planlæg møder, kom af sted og skab dejlige minder sammen.", atSpot:"Planlæg ved dette sted", spotFallback:"Vælg et sted", allSpots:"Alle steder", eventDay:"Arrangementer den", events:"Møder", draftForm:"Planlæg jeres næste eventyr", draftInfo:"Et privat udkast kun for jer. Ingen andre kan se det eller tilmelde sig.", eventTitle:"Titel", titlePlaceholder:"f.eks. Familieweekend på camping", eventType:"Aktivitet", date:"Dato", time:"Starttid", spot:"Mødested", note:"Beskrivelse (valgfrit)", notePlaceholder:"Hvad vil I gerne opleve sammen?", yearly:"Gentag mødet hvert år", save:"Gem privat", cancel:"Tilbage", edit:"Rediger", remove:"Slet", export:"Kalenderfil", saved:"Privat udkast gemt.", invalid:"Udfyld de obligatoriske felter.", unavailable:"Steder kunne ikke indlæses. Prøv igen.", privacy:"Kun på denne enhed, ikke i minde-backuppen. Eksportér kalenderaftaler ved behov.", preview:"PRIVAT PLANLÆGNING · PÅ ENHEDEN", noSpots:"Ingen steder tilgængelige", location:"Sted", selectedDay:"Valgt dag", more:"Næste", addTo:"Gem i kalender", confirmDelete:"Slet dette private udkast?"
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
const state = {open:false, month:monthShift(new Date(),0), day:iso(new Date()), tab:"day", cat:"all", demo:false, form:false, editing:null, spot:null, previousFocus:null, drafts:readDrafts()};
function sampleEvents() {
 // Samples intentionally exist in the non-public test build only and are visibly labeled.
 if (!state.demo) return [];
 const current = new Date();
 const next = dayOffset => {const d=new Date(current.getFullYear(),current.getMonth(),current.getDate()+dayOffset);return iso(d)};
 return [
  {id:"sample-camp",title:T[mode()].sampleNames[0],category:"camping",date:next(4),time:"15:30",spotName:"",demo:true},
  {id:"sample-ball",title:T[mode()].sampleNames[1],category:"sport",date:next(8),time:"16:00",spotName:"",demo:true},
  {id:"sample-hike",title:T[mode()].sampleNames[2],category:"nature",date:next(13),time:"10:30",spotName:"",demo:true}
 ];
}
function occurrences(){
 const out=[...sampleEvents()]; const today=new Date();
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
let overlay, body, footer;
let previousBodyOverflow = null;
export function initPrivateCalendar({ closeMenu } = {}) {
 if(document.getElementById("fse-overlay"))return;
 const menuList=document.querySelector(".app-menu-list");
 if(!menuList)return;
 const button=document.createElement("button");button.type="button";button.id="fse-menu-open";button.className="app-menu-item fse-launch";button.setAttribute("aria-haspopup","dialog");
 button.innerHTML=`<span class="app-menu-item-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18M8 15l2.5 2.5L16 13"/></svg></span><span class="app-menu-item-label"></span>`;
 button.querySelector(".app-menu-item-label").textContent=T[mode()].menu;
 menuList.querySelector("#btn-open-favorites")?.after(button);
 if(!button.isConnected)menuList.prepend(button);
 button.addEventListener("click",()=>{closeMenu?.();open();});
 overlay=document.createElement("div");overlay.id="fse-overlay";overlay.hidden=true;overlay.innerHTML=`<section class="fse-shell" role="dialog" aria-modal="true" aria-labelledby="fse-title"><header class="fse-header"><div class="fse-title-row"><img class="fse-tilla" src="${clean(new URL("../../assets/tilla/tilla-watercolor.png",import.meta.url).href)}" alt=""><div class="fse-header-heading"><p class="fse-eyebrow" id="fse-eyebrow"></p><h2 id="fse-title"></h2></div><button type="button" class="fse-icon-btn" data-fse="close" aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5"/></svg></button></div><p class="fse-subtitle" id="fse-subtitle"></p><span class="fse-preview-badge" id="fse-preview-badge"></span></header><div class="fse-body" id="fse-body"></div><footer class="fse-footer" id="fse-footer"></footer></section>`;
 document.body.append(overlay);body=overlay.querySelector("#fse-body");footer=overlay.querySelector("#fse-footer");
 overlay.addEventListener("click",delegate);
 overlay.addEventListener("change",change);
 overlay.addEventListener("submit",submit);
 overlay.addEventListener("click",e=>{if(e.target===overlay)close();});
 document.addEventListener("keydown", e=>{if(!state.open)return;if(e.key==="Escape"){e.preventDefault();close();}else if(e.key==="Tab")trapFocus(e);});
 
 document.addEventListener("fsm:plan-spot", e=>{open(typeof e.detail?.spotId === "string" ? e.detail.spotId : null);});
 window.addEventListener("pageshow",()=>{button.querySelector(".app-menu-item-label").textContent=T[mode()].menu;});
}
async function open(spotId=null){
 if(!overlay)return;
 state.previousFocus=document.activeElement;
 state.open=true;state.form=false;state.editing=null;state.spot=spotId||null;
 state.day=iso(new Date());state.month=monthShift(new Date(),0);state.cat="all";
 overlay.hidden=false;document.body.classList.add("fse-open");previousBodyOverflow=document.body.style.overflow;document.body.style.overflow="hidden";
 render();overlay.querySelector("[data-fse=close]")?.focus({preventScroll:true});
 try{await loadSpots();if(state.open)render();}catch{if(state.open)render();}
}
function close(){if(!state.open)return;state.open=false;overlay.hidden=true;document.body.classList.remove("fse-open");if(previousBodyOverflow)document.body.style.overflow=previousBodyOverflow;else document.body.style.removeProperty("overflow");state.form=false;state.spot=null;const el=state.previousFocus;if(el?.isConnected&&typeof el.focus==="function")el.focus({preventScroll:true});}
function trapFocus(e){const focusable=[...overlay.querySelectorAll('button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled])')].filter(n=>n.getClientRects().length);if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
function render(){
 if(!state.open)return;
 const lang=mode(),t=T[lang];
 overlay.querySelector("#fse-eyebrow").textContent=t.eyebrow;
 overlay.querySelector("#fse-title").textContent=t.name;
 overlay.querySelector("#fse-subtitle").textContent=t.subtitle;
 overlay.querySelector("#fse-preview-badge").textContent=t.preview;
 overlay.querySelector("[data-fse=close]").setAttribute("aria-label",t.close);
 if(state.form){renderForm(t,lang);}else{renderCalendar(t,lang);}
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
  const cls=["fse-day",today?"fse-day--today":"",d===state.day?"fse-day--chosen":"",dayEvents.length?(dayEvents.some(x=>!x.demo)?"fse-day--has":"fse-day--demo"):""].filter(Boolean).join(" ");
  const dotCategories=[...new Set(dayEvents.map(x=>x.category))].slice(0,3);
  cells.push(`<button type="button" class="${cls}" data-fse="day" data-date="${d}" aria-pressed="${d===state.day}" aria-label="${clean(formatDay(new Date(date.getFullYear(),date.getMonth(),i),lang))}${dayEvents.length?` · ${dayEvents.length} ${clean(t.events)}`:""}">${i}<span class="fse-dots">${dotCategories.map(k=>`<span class="fse-dot fse-dot--${k}"></span>`).join("")}</span></button>`);
 }
 const selected=parseISO(state.day)||new Date();
 const shown=events.filter(e=>state.tab==="upcoming"?e.date>=iso(new Date()):e.date===state.day).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 const monthHtml=`<div class="fse-calendar"><div class="fse-calendar-nav"><button type="button" class="fse-cal-nav-btn" data-fse="prev" aria-label="‹">‹</button><h3>${clean(dateTitle)}</h3><button type="button" class="fse-cal-nav-btn" data-fse="next" aria-label="›">›</button></div><div class="fse-weekdays">${t.dayNames.map(x=>`<span>${clean(x)}</span>`).join("")}</div><div class="fse-dates">${cells.join("")}</div></div>`;
 body.innerHTML=`<div class="fse-pillbar"><button type="button" class="fse-pill fse-pill--primary" data-fse="form">＋ ${clean(t.create)}</button><button type="button" class="fse-pill" data-fse="now">${clean(t.today)}</button></div>${monthHtml}<div class="fse-controls"><button type="button" class="fse-toggle" data-fse="tab" data-tab="day" aria-pressed="${state.tab==="day"}">${clean(t.calendar)}</button><button type="button" class="fse-toggle" data-fse="tab" data-tab="upcoming" aria-pressed="${state.tab==="upcoming"}">${clean(t.upcoming)}</button></div><div class="fse-section-heading"><h3>${state.tab==="upcoming"?clean(t.upcoming):clean(formatDay(selected,lang))}</h3><button type="button" class="fse-link" data-fse="now">${clean(t.today)}</button></div><div class="fse-select-row"><label class="sr-only" for="fse-filter">${clean(t.filters)}</label><select id="fse-filter" class="fse-select" data-fse="category">${CATEGORY.map(c=>`<option value="${c}" ${state.cat===c?"selected":""}>${clean(t[c])}</option>`).join("")}</select></div><div class="fse-event-list">${shown.length?shown.map(e=>eventCard(e,t,lang)).join(""):`<div class="fse-empty"><strong>${clean(t.noEvents)}</strong>${clean(t.noEventsNote)}</div>`}</div><label class="fse-demo-line"><input type="checkbox" data-fse="demo" ${state.demo?"checked":""}><span>${clean(t.demoToggle)}</span></label>`;
 footer.innerHTML=`<button type="button" class="fse-cta" data-fse="form">＋ ${clean(t.new)}</button>`;
}
function eventCard(e,t,lang){const spot=spots.find(s=>s.id===e.spotId),name=spot?getSpotTitle(spot,lang):(e.spotName||"");return `<article class="fse-event"><div class="fse-event-symbol fse-event-symbol--${e.category}" aria-hidden="true">${SYMBOL[e.category]}</div><div class="fse-event-content"><h4>${clean(e.title)}</h4><p>${clean(locDate(parseISO(e.date),lang))} · ${clean(e.time)}${name?` · ${clean(name)}`:""}</p>${e.note?`<p>${clean(e.note)}</p>`:""}<div class="fse-event-badges"><span class="fse-tag ${e.demo?"fse-tag--demo":"fse-tag--private"}">${clean(e.demo?t.demo:t.private)}</span>${e.yearly?`<span class="fse-tag">${clean(t.repeat)}</span>`:""}</div>${e.private&&!e.occurrence?`<div class="fse-event-actions"><button type="button" class="fse-mini" data-fse="edit" data-id="${clean(e.id)}">${clean(t.edit)}</button><button type="button" class="fse-mini" data-fse="ics" data-id="${clean(e.id)}">${clean(t.export)}</button><button type="button" class="fse-mini" data-fse="delete" data-id="${clean(e.id)}">${clean(t.remove)}</button></div>`:""}</div></article>`;}
function renderForm(t,lang){const draft=state.drafts.find(x=>x.id===state.editing);const selected=state.spot||draft?.spotId||"";const spotOptions=spots.map(s=>({id:s.id,name:getSpotTitle(s,lang)})).sort((a,b)=>a.name.localeCompare(b.name,lang));const d=draft?.date||(state.day||iso(new Date()));const cat=draft?.category||"family";
 body.innerHTML=`<div class="fse-form"><h3>${clean(t.draftForm)}</h3><p class="fse-form-intro">${clean(t.draftInfo)}</p><form id="fse-draft-form"><label class="fse-field">${clean(t.eventTitle)}<input name="title" maxlength="90" placeholder="${clean(t.titlePlaceholder)}" value="${clean(draft?.title||"")}" required autocomplete="off"></label><label class="fse-field">${clean(t.eventType)}<select name="category" required>${CATEGORY.filter(c=>c!=="all").map(c=>`<option value="${c}" ${cat===c?"selected":""}>${clean(t[c])}</option>`).join("")}</select></label><div class="fse-form-row"><label class="fse-field">${clean(t.date)}<input name="date" type="date" value="${clean(d)}" required></label><label class="fse-field">${clean(t.time)}<input name="time" type="time" value="${clean(draft?.time||"15:30")}" required></label></div><label class="fse-field">${clean(t.spot)}<select name="spotId"><option value="">${clean(spots.length?t.spotFallback:t.noSpots)}</option>${spotOptions.map(s=>`<option value="${clean(s.id)}" ${selected===s.id?"selected":""}>${clean(s.name)}</option>`).join("")}</select></label><label class="fse-field">${clean(t.note)}<textarea name="note" maxlength="360" placeholder="${clean(t.notePlaceholder)}">${clean(draft?.note||"")}</textarea></label><label class="fse-check"><input name="yearly" type="checkbox" ${draft?.yearly?"checked":""}><span>${clean(t.yearly)}</span></label><div class="fse-form-actions"><button type="button" class="fse-cancel" data-fse="cancel">${clean(t.cancel)}</button><button type="submit" class="fse-save">${clean(t.save)}</button></div><p class="fse-status" role="status" id="fse-status"></p></form></div>`;
 footer.innerHTML=`<span class="fse-footer-note">🔒 ${clean(t.privacy)}</span>`;
}
function delegate(e){const btn=e.target.closest("[data-fse]");if(!btn)return;const action=btn.dataset.fse;
 if(action==="close")return close();
 if(action==="prev"||action==="next"){state.month=monthShift(state.month,action==="prev"?-1:1);state.day=iso(state.month);render();return;}
 if(action==="now"){state.month=monthShift(new Date(),0);state.day=iso(new Date());state.tab="day";render();return;}
 if(action==="day"){state.day=btn.dataset.date;state.tab="day";render();return;}
 if(action==="tab"){state.tab=btn.dataset.tab;render();return;}
 if(action==="form"){state.editing=null;state.form=true;render();body.scrollTop=0;return;}
 if(action==="cancel"){state.form=false;state.editing=null;render();return;}
 if(action==="edit"){state.editing=btn.dataset.id;state.form=true;render();body.scrollTop=0;return;}
 if(action==="delete"){if(!confirm(T[mode()].confirmDelete))return;state.drafts=state.drafts.filter(x=>x.id!==btn.dataset.id);storeDrafts(state.drafts);render();return;}
 if(action==="ics"){const ev=state.drafts.find(x=>x.id===btn.dataset.id);if(ev)exportICS(ev);return;}
}
function change(e){if(e.target.dataset.fse==="category"){state.cat=CATEGORY.includes(e.target.value)?e.target.value:"all";render();}if(e.target.dataset.fse==="demo"){state.demo=!!e.target.checked;render();}}
function submit(e){if(e.target.id!=="fse-draft-form")return;e.preventDefault();const data=new FormData(e.target),title=String(data.get("title")||"").trim(),date=String(data.get("date")||""),time=String(data.get("time")||""),category=data.get("category"),spotId=String(data.get("spotId")||"");
 if(!title||title.length>90||!parseISO(date)||!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)||!CATEGORY.slice(1).includes(category)||spotId&&!spots.some(s=>s.id===spotId)){e.target.querySelector("#fse-status").textContent=T[mode()].invalid;return;}
 const draft={id:state.editing||(`private-${Date.now()}-${Math.random().toString(36).slice(2,8)}`),title,category,date,time,spotId,note:String(data.get("note")||"").trim().slice(0,360),yearly:data.get("yearly")==="on"};
 const next=state.drafts.filter(x=>x.id!==draft.id).concat(draft);
 if(!storeDrafts(next)){e.target.querySelector("#fse-status").textContent=T[mode()].storageError;return;}
 state.drafts=next;state.form=false;state.editing=null;state.month=monthShift(parseISO(date),0);state.day=date;state.tab="day";state.cat="all";render();body.scrollTop=0;
}
function exportICS(e){
 const date=e.date.replace(/-/g,"");const start=e.time.replace(":","")+"00";const endDate=new Date(`${e.date}T${e.time}:00`);endDate.setHours(endDate.getHours()+1);const end=`${String(endDate.getHours()).padStart(2,"0")}${String(endDate.getMinutes()).padStart(2,"0")}00`;const endDay=iso(endDate).replace(/-/g,"");
 const esc=s=>String(s||"").replace(/\\/g,"\\\\").replace(/\r?\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
 const spot=spots.find(s=>s.id===e.spotId);
 const props=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Family Spots Map//Private meetup drafts//DE","BEGIN:VEVENT",`UID:${e.id}@family-spots-map.local`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+/,"")}`,`DTSTART:${date}T${start}`,`DTEND:${endDay}T${end}`,`SUMMARY:${esc(e.title)}`,`DESCRIPTION:${esc(e.note)}`,`LOCATION:${esc(spot?getSpotTitle(spot,mode()):"")}`,...(e.yearly?["RRULE:FREQ=YEARLY"]:[]),"END:VEVENT","END:VCALENDAR"];
 const blob=new Blob([props.join("\r\n")+"\r\n"],{type:"text/calendar;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`Family-Spots-Map-${e.date}.ics`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

