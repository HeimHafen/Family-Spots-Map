// Family Spots Map V86 – Gemeinsam erleben
// Read-only, verified public events + PRIVATE on-device planning drafts.
// No user accounts, public registration, chat, minors' profiles or user submissions.
const STORAGE_KEY = 'fsm-meetup-drafts-v1';
const MAX_DRAFTS = 20;
const CATEGORIES = ['camping', 'sport', 'natur', 'familie', 'andere'];
const V = {
  de: {
    menu:'Gemeinsam erleben · Kalender', eyebrow:'ORTE ENTDECKEN · MENSCHEN VERBINDEN', title:'Gemeinsam erleben',
    subtitle:'Echte Begegnungen beginnen mit einem gemeinsamen Moment.', close:'Schließen',
    public:'Treffen entdecken', drafts:'Meine Entwürfe', plan:'Treffen planen', all:'Alle Aktivitäten',
    category:'Aktivität', allSpots:'Alle Orte', thisSpot:'Nur dieser Spot', spotLabel:'Ort',
    camping:'Camping', sport:'Spiel & Sport', natur:'Natur & Bewegung', familie:'Familie & Freizeit', andere:'Sonstiges',
    previous:'Vorheriger Monat', next:'Nächster Monat', today:'Heute',
    weekdays:['Mo','Di','Mi','Do','Fr','Sa','So'], events:'Bestätigte Treffen',
    noEvents:'Für diese Auswahl sind noch keine bestätigten Treffen veröffentlicht.',
    noEventsHelp:'Hier erscheinen künftig Veranstaltungen von geprüften erwachsenen Organisatoren. Wir zeigen keine erfundenen Termine oder Teilnehmerzahlen.',
    noConnection:'Die Veranstaltungsdaten konnten nicht geladen werden. Bitte überprüfe deine Verbindung.',
    showAll:'Alle Orte anzeigen', back:'Zurück zum Kalender',
    draftIntro:'Deine Planung bleibt ausschließlich auf diesem Gerät. Andere Menschen können sie nicht sehen oder sich anmelden.',
    emptyDrafts:'Noch kein Treffen geplant. Starte mit einer Idee für ein gemeinsames Erlebnis.',
    startPlanning:'Ersten Entwurf erstellen',
    formTitle:'Ein Treffen vorbereiten', titleLabel:'Name des Treffens', titleExample:'Zum Beispiel: Familien-Campingwochenende',
    typeLabel:'Was möchtet ihr gemeinsam erleben?', spotForm:'Treffpunkt auswählen', spotPlaceholder:'Bitte einen vorhandenen Spot wählen',
    dateLabel:'Datum und Uhrzeit', recurrenceLabel:'Wiederholung', once:'Einmalig', yearly:'Jedes Jahr', descriptionLabel:'Kurze Beschreibung (optional)',
    descriptionExample:'Was ist geplant? Was sollten Familien vorab wissen?',
    adult:'Ich bin volljährig und organisiere dieses Treffen verantwortlich.',
    privacy:'Bitte keine Namen, Telefonnummern oder persönlichen Daten von Kindern eintragen.',
    save:'Entwurf speichern', cancel:'Abbrechen', remove:'Löschen', export:'Kalenderdatei', copy:'Text kopieren',
    draftBadge:'PRIVAT · NICHT VERÖFFENTLICHT', saved:'Dein Entwurf wurde nur auf diesem Gerät gespeichert.',
    storageError:'Dieser Browser konnte den Entwurf nicht speichern. Bitte überprüfe deine Speichereinstellungen.',
    invalid:'Bitte Titel, Ort, eine zukünftige Uhrzeit und die Bestätigung zur verantwortlichen Organisation ausfüllen.',
    deleted:'Entwurf gelöscht.', copyDone:'Zusammenfassung kopiert.',
    downloadNote:'Die Kalenderdatei ist nur für deinen eigenen Kalender. Sie veröffentlicht kein Treffen.',
    safe:'Keine öffentlichen Kinderprofile · keine unkontrollierten Anmeldungen',
    verified:'Von einem Veranstalter bestätigter Termin', organizer:'Veranstalter', link:'Informationen beim Veranstalter',
    detailsTitle:'Gemeinsam an diesem Ort', detailsIntro:'Neue Begegnungen und Erlebnisse beginnen hier.',
    detailsCta:'Treffen & Kalender ansehen', detailsPlan:'Treffen planen',
    dateInvalid:'Das Datum muss in der Zukunft liegen.',
    loading:'Treffen werden geladen …', selectDate:'Termine am', draftTime:'Geplant für',
    calendarNote:'Anzeigen und Planen sind kostenlos. Eine öffentliche Veröffentlichung ist noch nicht möglich.',
    current:'Ausgewählter Ort', noSpot:'Ort nicht mehr vorhanden'
  },
  en: {
    menu:'Get together · Calendar', eyebrow:'EXPLORE PLACES · CONNECT PEOPLE', title:'Experience together',
    subtitle:'Real connections begin with a moment shared.', close:'Close',
    public:'Find meetups', drafts:'My drafts', plan:'Plan a meetup', all:'All activities', category:'Activity',
    allSpots:'All places', thisSpot:'This spot only', spotLabel:'Place',
    camping:'Camping', sport:'Play & sport', natur:'Nature & movement', familie:'Family & leisure', andere:'Other',
    previous:'Previous month', next:'Next month', today:'Today', weekdays:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    events:'Confirmed meetups', noEvents:'There are no confirmed meetups for this selection yet.',
    noEventsHelp:'Events from verified adult organisers will appear here. We never invent dates or attendee numbers.',
    noConnection:'Event data could not be loaded. Please check your connection.',
    showAll:'Show all places', back:'Back to calendar', draftIntro:'Your planning stays on this device only. Others cannot see it or sign up.',
    emptyDrafts:'No meetup planned yet. Begin with an idea for a shared experience.', startPlanning:'Create a first draft',
    formTitle:'Prepare a meetup', titleLabel:'Meetup name', titleExample:'For example: Family camping weekend',
    typeLabel:'What would you like to do together?', spotForm:'Choose a meeting spot',spotPlaceholder:'Please choose an existing spot',
    dateLabel:'Date and time',recurrenceLabel:'Repeat',once:'One time',yearly:'Every year',descriptionLabel:'Short description (optional)',descriptionExample:'What is planned? What should families know?',
    adult:'I am an adult and will organise this meetup responsibly.',privacy:'Please do not include children’s names, phone numbers or personal details.',
    save:'Save draft',cancel:'Cancel',remove:'Delete',export:'Calendar file',copy:'Copy text',draftBadge:'PRIVATE · NOT PUBLISHED',
    saved:'Your draft was saved on this device only.',storageError:'This browser could not store the draft. Check storage settings.',
    invalid:'Enter a title, a place, a future date/time and confirm responsible adult organisation.',deleted:'Draft deleted.',copyDone:'Summary copied.',
    downloadNote:'The calendar file is for your own calendar. It does not publish an event.',
    safe:'No public child profiles · no uncontrolled sign-ups',verified:'Confirmed by an organiser',organizer:'Organiser',
    link:'Details from organiser',detailsTitle:'Experience together here',detailsIntro:'New connections and memories start here.',
    detailsCta:'See meetups & calendar',detailsPlan:'Plan a meetup',dateInvalid:'Date and time must be in the future.',
    loading:'Loading meetups …',selectDate:'Events on',draftTime:'Planned for',
    calendarNote:'Browsing and planning are free. Public publishing is not available yet.',current:'Selected spot',noSpot:'Place no longer available'
  },
  da: {
    menu:'Oplev sammen · Kalender',eyebrow:'OPDAG STEDER · MØD MENNESKER',title:'Oplev sammen',
    subtitle:'Ægte fællesskaber begynder med et øjeblik sammen.',close:'Luk',
    public:'Find møder',drafts:'Mine udkast',plan:'Planlæg et møde',all:'Alle aktiviteter',category:'Aktivitet',
    allSpots:'Alle steder',thisSpot:'Kun dette sted',spotLabel:'Sted',
    camping:'Camping',sport:'Leg og sport',natur:'Natur og bevægelse',familie:'Familie og fritid',andere:'Andet',
    previous:'Forrige måned',next:'Næste måned',today:'I dag',weekdays:['Man','Tir','Ons','Tor','Fre','Lør','Søn'],
    events:'Bekræftede arrangementer',noEvents:'Der er endnu ingen bekræftede møder for dette udvalg.',
    noEventsHelp:'Arrangementer fra godkendte voksne arrangører vises her. Vi opfinder ikke datoer eller deltagertal.',
    noConnection:'Arrangementerne kunne ikke indlæses. Kontrollér din forbindelse.',showAll:'Vis alle steder',back:'Tilbage til kalender',
    draftIntro:'Din plan gemmes kun på denne enhed. Andre kan ikke se den eller tilmelde sig.',
    emptyDrafts:'Intet møde er planlagt endnu. Begynd med en idé til en fælles oplevelse.',startPlanning:'Opret første udkast',
    formTitle:'Forbered et møde',titleLabel:'Mødets navn',titleExample:'For eksempel: Familiecampingweekend',
    typeLabel:'Hvad vil I gerne lave sammen?',spotForm:'Vælg mødested',spotPlaceholder:'Vælg et eksisterende sted',
    dateLabel:'Dato og tidspunkt',recurrenceLabel:'Gentagelse',once:'Én gang',yearly:'Hvert år',descriptionLabel:'Kort beskrivelse (valgfrit)',descriptionExample:'Hvad skal der ske? Hvad bør familier vide?',
    adult:'Jeg er myndig og arrangerer dette møde ansvarligt.',privacy:'Skriv ikke børns navne, telefonnumre eller personlige oplysninger.',
    save:'Gem udkast',cancel:'Annuller',remove:'Slet',export:'Kalenderfil',copy:'Kopiér tekst',draftBadge:'PRIVAT · IKKE OFFENTLIGGJORT',
    saved:'Udkastet er kun gemt på denne enhed.',storageError:'Browseren kunne ikke gemme udkastet. Kontrollér lagerindstillingerne.',
    invalid:'Udfyld navn, sted, fremtidigt tidspunkt og bekræft ansvarlig voksen organisering.',deleted:'Udkast slettet.',copyDone:'Oversigt kopieret.',
    downloadNote:'Kalenderfilen er kun til din egen kalender. Den offentliggør ikke et møde.',
    safe:'Ingen offentlige børneprofiler · ingen ukontrollerede tilmeldinger',
    verified:'Bekræftet af en arrangør',organizer:'Arrangør',link:'Information hos arrangøren',
    detailsTitle:'Oplev noget sammen her',detailsIntro:'Nye møder og minder starter her.',
    detailsCta:'Se møder og kalender',detailsPlan:'Planlæg et møde',dateInvalid:'Dato og tidspunkt skal være i fremtiden.',
    loading:'Indlæser møder …',selectDate:'Arrangementer den',draftTime:'Planlagt til',
    calendarNote:'Det er gratis at se og planlægge. Offentliggørelse er endnu ikke mulig.',current:'Valgt sted',noSpot:'Stedet findes ikke længere'
  }
};
const N = (tag, className, value) => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (value !== undefined && value !== null) el.textContent = value;
  return el;
};
const keyDate = date => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const validLocalTime = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) &&
  Number.isFinite(new Date(value).getTime()) &&
  `${new Date(value).getFullYear()}-${String(new Date(value).getMonth()+1).padStart(2,'0')}-${String(new Date(value).getDate()).padStart(2,'0')}T${String(new Date(value).getHours()).padStart(2,'0')}:${String(new Date(value).getMinutes()).padStart(2,'0')}` === value;
const clean = (s, n=120) => typeof s === 'string' ? s.trim().slice(0,n) : '';
const simpleId = item => String(item?.id ?? '');
const safeUrl = value => { try {const u=new URL(value);return u.protocol==='https:' && !u.username && !u.password ? u.href : null;}catch{return null;} };
function normalizePublished(items, spots) {
  const byId = new Set(spots.map(simpleId));
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter(item => {
    if (!item || item.status !== 'published' || item.approved !== true || item.organiser_verified !== true) return false;
    if (!/^[a-z0-9][a-z0-9_-]{2,79}$/.test(String(item.id||'')) || seen.has(item.id) || (byId.size>0 && !byId.has(String(item.spot_id)))) return false;
    if (!CATEGORIES.includes(item.category) || !validLocalTime(item.starts_at) || (item.recurrence !== 'yearly' && new Date(item.starts_at) < new Date())) return false;
    if (!['de','en','da'].every(lang => clean(item.title?.[lang],90))) return false;
    if (!clean(item.organiser?.name,90) || !safeUrl(item.source_url)) return false;
    seen.add(item.id);return true;
  }).flatMap(item => {
    if (item.recurrence !== 'yearly') return [item];
    const base = new Date(item.starts_at);
    const now = new Date();const occurrences=[];
    for(let year=now.getFullYear();year<=now.getFullYear()+5;year++) {
      const date=new Date(year,base.getMonth(),base.getDate(),base.getHours(),base.getMinutes());
      // No invented February 29th event on a year without that date.
      if(date.getMonth()!==base.getMonth()||date.getDate()!==base.getDate()||date<now)continue;
      const when=`${keyDate(date)}T${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
      occurrences.push({...item,id:`${item.id}-${year}`,starts_at:when});
    }
    return occurrences;
  }).sort((a,b)=>a.starts_at.localeCompare(b.starts_at));
}
export function initGemeinsamErleben({getLanguage, getSpots, getSpotId, getSpotName, closeMenu} = {}) {
  const lang=()=>['de','en','da'].includes(getLanguage?.()) ? getLanguage() : 'de';
  const tr=()=>V[lang()];
  const locale=()=>({de:'de-DE',en:'en-GB',da:'da-DK'})[lang()];
  const spots=()=>Array.isArray(getSpots?.())?getSpots():[];
  const spotId=spot=> String(getSpotId?.(spot) ?? simpleId(spot));
  const spotName=spot=>String(getSpotName?.(spot) || spot?.title || spot?.name || spot?.title_de || '');
  const getSpot=id=>spots().find(spot=>spotId(spot)===String(id));
  let overlay=null,lastTrigger=null,priorOverflow='',keyHandler=null;
  let month=new Date(new Date().getFullYear(),new Date().getMonth(),1);
  let selectedDay='',category='all',currentSpot='',tab='public',formOpen=false;
  let publicEvents=[],loadStatus='idle';
  const preservedFocus=()=>{const e=lastTrigger?.isConnected && lastTrigger.getClientRects?.().length?lastTrigger:document.getElementById('menu-toggle');e?.focus?.({preventScroll:true});};
  function drafts() {
    try {const result=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
      return Array.isArray(result)?result.filter(item=>item && typeof item.id==='string' && validLocalTime(item.starts_at) && CATEGORIES.includes(item.category) && clean(item.title,80) && typeof item.spot_id==='string').slice(0,MAX_DRAFTS):[];
    } catch{return [];}
  }
  function saveDrafts(items) {try{localStorage.setItem(STORAGE_KEY,JSON.stringify(items.slice(0,MAX_DRAFTS)));return true;}catch{return false;}}
  const formatDate = v => new Intl.DateTimeFormat(locale(),{dateStyle:'medium',timeStyle:'short'}).format(new Date(v));
  function close() {
    if(!overlay) return;
    overlay.remove(); overlay=null;
    document.body.classList.remove('fsm-meetups-open');document.body.style.overflow=priorOverflow;
    document.removeEventListener('keydown',keyHandler,true);keyHandler=null;
    preservedFocus();
  }
  function button(label,cls,onClick) {const b=N('button',cls,label);b.type='button';b.addEventListener('click',onClick);return b;}
  function notify(text,kind='note') {
    const target=overlay?.querySelector('#fsm-meetup-notice');
    if(target){target.textContent=text;target.hidden=false;target.dataset.kind=kind;target.scrollIntoView({block:'nearest'});}
  }
  function filteredEvents() {return publicEvents.filter(e=>(!currentSpot||String(e.spot_id)===currentSpot)&&(category==='all'||e.category===category));}
  async function loadEvents() {
    loadStatus='loading';
    try {
      const res=await fetch('./data/events.json?v=20261102-fsm-v86',{cache:'no-cache'});
      if(!res.ok)throw Error('events-not-available');
      const body=await res.json();
      if(!Array.isArray(body))throw Error('events-invalid');
      publicEvents=normalizePublished(body, spots());loadStatus='ready';
    } catch {publicEvents=[];loadStatus='error';}
    if(overlay && tab==='public' && !formOpen) render();
  }
  function makeHeader(panel){
    const header=N('header','fsm-meetup-header');
    const heading=N('div','fsm-meetup-heading');heading.append(N('small','fsm-meetup-eyebrow',tr().eyebrow));
    const title=N('h2','',tr().title);title.id='fsm-meetup-heading';heading.append(title,N('p','',tr().subtitle));
    const x=button('×','fsm-meetup-close',close);x.setAttribute('aria-label',tr().close);x.title=tr().close;
    header.append(N('span','fsm-meetup-badge','♡'),heading,x);panel.append(header);
  }
  function makeTabs(target){
    const tabs=N('div','fsm-meetup-tabs');tabs.setAttribute('role','group');
    for(const [id,label] of [['public',tr().public],['drafts',tr().drafts]]) {
      const b=button(label,tab===id?'is-active':'',()=>{tab=id;formOpen=false;selectedDay='';render();});
      b.setAttribute('aria-pressed',tab===id?'true':'false');tabs.append(b);
    } target.append(tabs);
  }
  function makeMonthCalendar(target){
    const wrap=N('section','fsm-meetup-calendar');
    const top=N('div','fsm-meetup-month-head');
    const prev=button('‹','fsm-meetup-month-arrow',()=>moveMonth(-1));prev.setAttribute('aria-label',tr().previous);
    const monthTitle=N('h3','',new Intl.DateTimeFormat(locale(),{month:'long',year:'numeric'}).format(month));
    const next=button('›','fsm-meetup-month-arrow',()=>moveMonth(1));next.setAttribute('aria-label',tr().next);
    top.append(prev,monthTitle,next);wrap.append(top);
    const grid=N('div','fsm-meetup-month-grid');grid.setAttribute('role','group');grid.setAttribute('aria-label',monthTitle.textContent);
    for(const wd of tr().weekdays)grid.append(N('span','fsm-meetup-weekday',wd));
    const offset=(month.getDay()+6)%7;const count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
    for(let i=0;i<offset;i++){const b=N('span','fsm-meetup-empty');b.setAttribute('aria-hidden','true');grid.append(b);}
    const eventDates=new Set(filteredEvents().map(e=>e.starts_at.slice(0,10)));
    for(let i=1;i<=count;i++) {
      const key=keyDate(new Date(month.getFullYear(),month.getMonth(),i));
      const b=button(String(i),'fsm-meetup-day',()=>{selectedDay=selectedDay===key?'':key;render();});
      if(key===keyDate(new Date())) b.classList.add('is-today');
      if(eventDates.has(key))b.classList.add('has-event');
      if(selectedDay===key){b.classList.add('is-selected');b.setAttribute('aria-pressed','true');}
      else b.setAttribute('aria-pressed','false');
      b.setAttribute('aria-label',new Intl.DateTimeFormat(locale(),{dateStyle:'full'}).format(new Date(month.getFullYear(),month.getMonth(),i)));
      grid.append(b);
    }
    wrap.append(grid);target.append(wrap);
  }
  function moveMonth(delta) {
    const changed=new Date(month.getFullYear(),month.getMonth()+delta,1);
    const limit=new Date(new Date().getFullYear()+5,11,1);
    const earliest=new Date(new Date().getFullYear()-1,0,1);
    if(changed>limit||changed<earliest)return;
    month=changed;selectedDay='';render();
  }
  function makeFilters(target){
    const controls=N('div','fsm-meetup-filters');
    const select=N('select','fsm-meetup-select');select.setAttribute('aria-label',tr().category);
    for(const c of ['all',...CATEGORIES]){
      const option=N('option','',c==='all'?tr().all:tr()[c]);option.value=c;option.selected=c===category;select.append(option);
    }
    select.addEventListener('change',()=>{category=select.value;selectedDay='';render();});controls.append(select);
    if(currentSpot){
      const info=N('div','fsm-meetup-spot-filter');info.append(N('span','',`${tr().current}: ${spotName(getSpot(currentSpot))||tr().noSpot}`));
      info.append(button(tr().showAll,'',()=>{currentSpot='';render();}));controls.append(info);
    }
    target.append(controls);
  }
  function makePublicCard(event){
    const card=N('article','fsm-meetup-event');
    const dateBlock=N('div','fsm-meetup-event-date');const at=new Date(event.starts_at);
    dateBlock.append(N('strong','',String(at.getDate()).padStart(2,'0')),N('small','',new Intl.DateTimeFormat(locale(),{month:'short'}).format(at)));
    const info=N('div','fsm-meetup-event-info');
    info.append(N('span','fsm-meetup-verified','✓ '+tr().verified),N('h4','',event.title[lang()]));
    info.append(N('p','',`${formatDate(event.starts_at)} · ${spotName(getSpot(event.spot_id))}`));
    info.append(N('p','',`${tr().organizer}: ${event.organiser.name}`));
    const source=safeUrl(event.source_url);
    if(source){const link=N('a','fsm-meetup-event-link',tr().link);link.href=source;link.rel='noopener noreferrer';link.target='_blank';info.append(link);}
    card.append(dateBlock,info);return card;
  }
  function makePublic(target){
    makeFilters(target);makeMonthCalendar(target);
    const events=N('section','fsm-meetup-event-list');events.append(N('h3','',selectedDay?`${tr().selectDate} ${new Intl.DateTimeFormat(locale(),{dateStyle:'long'}).format(new Date(selectedDay+'T12:00:00'))}`:tr().events));
    if(loadStatus==='loading')events.append(N('p','fsm-meetup-muted',tr().loading));
    else if(loadStatus==='error') events.append(N('p','fsm-meetup-muted',tr().noConnection));
    else {
      const matching=filteredEvents().filter(e => selectedDay?e.starts_at.slice(0,10)===selectedDay : e.starts_at.startsWith(`${month.getFullYear()}-${String(month.getMonth()+1).padStart(2,'0')}`));
      if(!matching.length){
        const empty=N('div','fsm-meetup-empty-state');empty.append(N('span','fsm-meetup-empty-symbol','♡'),N('strong','',tr().noEvents),N('p','',tr().noEventsHelp));events.append(empty);
      } else for(const e of matching)events.append(makePublicCard(e));
    }
    target.append(events);
  }
  function draftSummary(item){return `${item.title}\n${formatDate(item.starts_at)}${item.recurrence==='yearly'?' · '+tr().yearly:''}\n${spotName(getSpot(item.spot_id))}\n${item.description||''}\n\n${tr().draftBadge}`.trim();}
  function downloadIcs(item) {
    const icsEsc=s=>String(s||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/[,;]/g,v=>'\\'+v);
    const utcValue=date=>date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
    const start=new Date(item.starts_at),end=new Date(start.getTime()+90*60000);
    const floating=v=>`${v.slice(0,4)}${v.slice(5,7)}${v.slice(8,10)}T${v.slice(11,13)}${v.slice(14,16)}00`;
    const yearly=item.recurrence==='yearly';
    const endLocal=`${keyDate(end)}T${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`;
    const payload=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Family Spots Map//Gemeinsam Erleben//DE','CALSCALE:GREGORIAN','BEGIN:VEVENT',`UID:${item.id}@family-spots-map.local`,`DTSTAMP:${utcValue(new Date())}`,`DTSTART:${yearly?floating(item.starts_at):utcValue(start)}`,`DTEND:${yearly?floating(endLocal):utcValue(end)}`,`SUMMARY:${icsEsc(item.title)}`,`LOCATION:${icsEsc(spotName(getSpot(item.spot_id)))}`,`DESCRIPTION:${icsEsc(item.description||tr().draftBadge)}`,...(yearly?['RRULE:FREQ=YEARLY']:[]),'END:VEVENT','END:VCALENDAR',''].join('\r\n');
    const blob=new Blob([payload],{type:'text/calendar;charset=utf-8'});const url=URL.createObjectURL(blob);
    const link=N('a');link.href=url;link.download='family-spots-treffen.ics';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
    notify(tr().downloadNote);
  }
  function makeDraftCard(item){
    const card=N('article','fsm-meetup-draft-card');card.append(N('small','fsm-meetup-private-tag',tr().draftBadge));
    card.append(N('h4','',item.title),N('p','',`${tr().draftTime} ${formatDate(item.starts_at)}${item.recurrence==='yearly'?' · '+tr().yearly:''} · ${spotName(getSpot(item.spot_id))||tr().noSpot}`));
    if(item.description)card.append(N('p','',item.description));
    const actions=N('div','fsm-meetup-draft-actions');
    actions.append(button(tr().export,'',()=>downloadIcs(item)));
    actions.append(button(tr().copy,'',async()=>{
      try{await navigator.clipboard.writeText(draftSummary(item));notify(tr().copyDone);}catch{notify(draftSummary(item));}
    }));
    actions.append(button(tr().remove,'fsm-meetup-remove',()=>{
      if(saveDrafts(drafts().filter(e=>e.id!==item.id))){render();notify(tr().deleted);}else notify(tr().storageError,'error');
    }));card.append(actions);return card;
  }
  function makeDrafts(target){
    target.append(N('p','fsm-meetup-drafts-intro',tr().draftIntro));
    const mine=drafts();
    if(mine.length)for(const item of mine)target.append(makeDraftCard(item));
    else{const empty=N('div','fsm-meetup-empty-state');empty.append(N('span','fsm-meetup-empty-symbol','✎'),N('p','',tr().emptyDrafts));target.append(empty);}
  }
  function makeForm(target){
    const form=N('form','fsm-meetup-form');form.noValidate=true;
    const line=(text,control)=>{const label=N('label','fsm-meetup-field');label.append(N('span','',text),control);form.append(label);return control;};
    const name=N('input');name.type='text';name.maxLength=80;name.required=true;name.autocomplete='off';name.placeholder=tr().titleExample;
    line(tr().titleLabel,name);
    const kind=N('select');for(const type of CATEGORIES){const option=N('option','',tr()[type]);option.value=type;kind.append(option);}line(tr().typeLabel,kind);
    const spotSelect=N('select');spotSelect.required=true;
    const blank=N('option','',tr().spotPlaceholder);blank.value='';spotSelect.append(blank);
    for(const spot of [...spots()].sort((a,b)=>spotName(a).localeCompare(spotName(b),locale()))){
      const option=N('option','',spotName(spot)+(spot.city?` · ${spot.city}`:''));option.value=spotId(spot);option.selected=option.value===currentSpot;spotSelect.append(option);
    }line(tr().spotForm,spotSelect);
    const date=N('input');date.type='datetime-local';date.required=true;date.min=keyDate(new Date())+'T00:00';date.step=900;
    line(tr().dateLabel,date);
    const repeat=N('select');
    for(const [value,label] of [['none',tr().once],['yearly',tr().yearly]]){const opt=N('option','',label);opt.value=value;repeat.append(opt);}
    line(tr().recurrenceLabel,repeat);
    const description=N('textarea');description.maxLength=300;description.rows=3;description.placeholder=tr().descriptionExample;
    line(tr().descriptionLabel,description);
    const adultLabel=N('label','fsm-meetup-adult');const adult=N('input');adult.type='checkbox';adult.required=true;
    adultLabel.append(adult,N('span','',tr().adult));form.append(adultLabel,N('p','fsm-meetup-privacy',tr().privacy));
    const actions=N('div','fsm-meetup-form-actions');const save=N('button','fsm-meetup-orange',tr().save);save.type='submit';actions.append(save,button(tr().cancel,'',()=>{formOpen=false;render();}));form.append(actions);
    form.addEventListener('submit',event=>{
      event.preventDefault();
      if(!clean(name.value,80)||!spotSelect.value||!getSpot(spotSelect.value)||!validLocalTime(date.value)||new Date(date.value)<=new Date()||!adult.checked){notify(tr().invalid,'error');return;}
      const item={id:`draft-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,title:clean(name.value,80),category:kind.value,spot_id:spotSelect.value,starts_at:date.value,recurrence:repeat.value,description:clean(description.value,300),created_at:new Date().toISOString()};
      if(!saveDrafts([item,...drafts()])){notify(tr().storageError,'error');return;}
      formOpen=false;tab='drafts';render();notify(tr().saved);
    });
    target.append(N('h3','fsm-meetup-form-heading',tr().formTitle),form);
    requestAnimationFrame(()=>{if(overlay?.contains(name))name.focus({preventScroll:true});});
  }
  function render() {
    if(!overlay)return;
    const panel=overlay.querySelector('.fsm-meetup-panel');if(!panel)return;
    panel.replaceChildren();makeHeader(panel);
    const scroll=N('div','fsm-meetup-scroll');
    if(formOpen)makeForm(scroll);
    else{makeTabs(scroll);if(tab==='public')makePublic(scroll);else makeDrafts(scroll);}
    panel.append(scroll);
    const footer=N('footer','fsm-meetup-footer');
    const main=button(tr().plan,'fsm-meetup-orange',()=>{formOpen=true;render();});
    if(formOpen)main.hidden=true;
    footer.append(main,N('p','',tr().calendarNote),N('small','',tr().safe));panel.append(footer);
    const notice=N('div','fsm-meetup-notice');notice.id='fsm-meetup-notice';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');notice.hidden=true;panel.append(notice);
  }
  function open({spot=null,planning=false}={}) {
    if(overlay)close();
    lastTrigger=document.activeElement;
    closeMenu?.();
    priorOverflow=document.body.style.overflow;document.body.style.overflow='hidden';document.body.classList.add('fsm-meetups-open');
    currentSpot=spot?spotId(spot):'';
    month=new Date(new Date().getFullYear(),new Date().getMonth(),1);selectedDay='';category='all';tab='public';formOpen=!!planning;
    overlay=N('div','fsm-meetup-overlay');overlay.id='fsm-meetup-overlay';
    const shade=N('div','fsm-meetup-shade');shade.addEventListener('click',close);
    const panel=N('section','fsm-meetup-panel');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','fsm-meetup-heading');
    overlay.append(shade,panel);document.body.append(overlay);
    keyHandler=e=>{if(!overlay)return;if(e.key==='Escape'){e.preventDefault();close();}else if(e.key==='Tab'){
      const focusable=[...panel.querySelectorAll('button:not([disabled]):not([hidden]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]')].filter(n=>n.getClientRects().length);
      if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }};
    document.addEventListener('keydown',keyHandler,true);
    render();panel.querySelector('.fsm-meetup-close')?.focus({preventScroll:true});
    if(loadStatus==='idle'||loadStatus==='error')loadEvents();
  }
  const menu=document.querySelector('#app-menu .app-menu-list');
  if(menu){
    const item=button(tr().menu,'app-menu-item',()=>open());item.id='btn-gemeinsam-erleben';item.dataset.menuClose='1';
    const glyph=N('span','app-menu-item-icon','♡');glyph.setAttribute('aria-hidden','true');
    const label=N('span','app-menu-item-label',tr().menu);label.dataset.i18nDe=V.de.menu;label.dataset.i18nEn=V.en.menu;label.dataset.i18nDa=V.da.menu;
    item.replaceChildren(glyph,label);
    const after=menu.querySelector('#btn-community-preview');if(after)after.after(item);else menu.prepend(item);
  }
  document.addEventListener('fsm:gemeinsam-open',e=>open({spot:e.detail?.spot||null,planning:e.detail?.planning===true}));
  return {open,close};
}
