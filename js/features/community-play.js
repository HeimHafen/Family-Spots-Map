// Family Spots Map – Gemeinsam aktiv (V85 Preview)
// Existing map, filters, navigation and spot data remain unchanged.
// A public registration flow requires an approved organiser, moderation and a backend.
const LOCAL_IMAGE = /^assets\/spots\/[a-z0-9/_-]+\.(?:webp|png|jpe?g)$/i;
const L = {
 de:{menu:'Treffen & Spiele · Vorschau',preview:'KONZEPTVORSCHAU · KEIN VERÖFFENTLICHTER TERMIN',location:'Region Hannover · Ort noch nicht bestätigt', intro:'Treffpunkt für Bewegung, spontane Spiele und neue Begegnungen.',mission:'Menschen bewegen & verbinden', heading:'Treffen & Spiele', examples:[['Freies Kicken','Beispiel für ein offenes Spieltreffen'],['Dorf gegen Dorf','Beispiel für ein begleitetes Freundschaftsspiel'],['Eltern & Kinder','Beispiel für ein Familientreffen']],tags:['Bewegung','Begegnung','Fußball','Draußen'],details:'Details',join:'Mitspielen',information:'So funktioniert es',info:'Hier können künftig geprüfte, begleitete Spieltreffen erscheinen. Termine und Zusagen werden erst angezeigt, wenn ein verantwortlicher Veranstalter sie bestätigt hat. Es gibt keine öffentlichen Kinderprofile oder direkten Nachrichten zwischen Minderjährigen.',cta:'Mitspielen ist erst möglich, wenn ein bestätigter Termin mit verantwortlicher Kontaktperson veröffentlicht ist.',close:'Schließen',demo:'Beispiel · noch kein echter Termin', spot:'Gemeinsam spielen',spotAction:'Treffen & Spiele ansehen',now:'Noch keine bestätigten Termine',safeguard:'Begleitete Treffen · keine öffentlichen Kinderprofile'},
 en:{menu:'Meetups & games · Preview',preview:'CONCEPT PREVIEW · NO PUBLISHED EVENTS',location:'Hanover region · location unconfirmed',intro:'A place for movement, spontaneous games and new connections.',mission:'Move & connect people',heading:'Meetups & games',examples:[['Kickabout','Example of an open play session'],['Neighbourhood match','Example of a supervised friendly game'],['Parents & children','Example of a family meetup']],tags:['Activity','Connection','Football','Outdoors'],details:'Details',join:'Join a game',information:'How it works',info:'Verified, supervised meetups can appear here in the future. Dates and attendance figures are shown only once a responsible organiser has confirmed them. No public profiles for children or direct messaging between minors.',cta:'Joining is only available when a confirmed event with a responsible contact person has been published.',close:'Close',demo:'Example · not a real event',spot:'Play together',spotAction:'View meetups & games',now:'No verified events yet',safeguard:'Supervised meetups · no public child profiles'},
 da:{menu:'Møder og spil · Forhåndsvisning',preview:'KONCEPTVISNING · INGEN OFFENTLIGGJORTE ARRANGEMENTER',location:'Hannover-området · sted ikke bekræftet',intro:'Et sted for bevægelse, spontane spil og nye bekendtskaber.',mission:'Få mennesker i bevægelse & sammen',heading:'Møder og spil',examples:[['Spil fodbold','Eksempel på åbent spil'],['By mod by','Eksempel på ledsaget venskabskamp'],['Forældre & børn','Eksempel på familietræf']],tags:['Bevægelse','Fællesskab','Fodbold','Udendørs'],details:'Detaljer',join:'Deltag',information:'Sådan fungerer det',info:'Godkendte, ledsagede arrangementer kan vises her fremover. Datoer og tilmeldinger vises først, når en ansvarlig arrangør har bekræftet dem. Ingen offentlige børneprofiler eller direkte beskeder mellem mindreårige.',cta:'Deltagelse er først mulig, når et bekræftet arrangement med en ansvarlig kontaktperson er offentliggjort.',close:'Luk',demo:'Eksempel · ikke et rigtigt arrangement',spot:'Spil sammen',spotAction:'Se møder og spil',now:'Ingen bekræftede arrangementer endnu',safeguard:'Ledsagede møder · ingen offentlige børneprofiler'}
};
function el(name, cls, content) {
 const node = document.createElement(name);
 if (cls) node.className = cls;
 if (content !== undefined) node.textContent = content;
 return node;
}
function icon(type) {
 const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');
 const shapes={people:['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8','M22 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],football:['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20','M9.5 8.5 14.5 8.5 16 13 12 16 8 13Z','M7 3l2.5 5.5','M17 3l-2.5 5.5','M3 11l5 2','M21 11l-5 2'],calendar:['M8 2v4','M16 2v4','M3 10h18','M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2'],close:['M6 6l12 12','M18 6 6 18'],location:['M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0','M12 10a2 2 0 1 0 0 .01']};
 for (const d of shapes[type]||[]) {const q=document.createElementNS(svg.namespaceURI,'path');q.setAttribute('d',d);svg.append(q);} return svg;
}
const safePath = value => typeof value==='string' && LOCAL_IMAGE.test(value) && !value.includes('..') ? value : null;
export function initCommunityPlay({getLanguage, closeMenu}={}) {
 const lang=()=>['de','en','da'].includes(getLanguage?.())?getLanguage():'de';
 const menu=document.querySelector('#app-menu .app-menu-list');
 let lastFocus=null,overlay=null,preview=null,lockScroll='',escapeListener=null;
 let dockedNav=null,navParent=null,navNext=null;
 const navAction=()=>close();
 const button=el('button','app-menu-item');button.type='button';button.dataset.menuClose='1';button.id='btn-community-preview';
 const glyph=el('span','app-menu-item-icon');glyph.setAttribute('aria-hidden','true');glyph.append(icon('football'));
 const label=el('span','app-menu-item-label',L.de.menu);
 label.dataset.i18nDe=L.de.menu;label.dataset.i18nEn=L.en.menu;label.dataset.i18nDa=L.da.menu;
 button.append(glyph,label);
 if(menu) { const after=menu.querySelector('#btn-open-favorites'); if(after)after.after(button);else menu.prepend(button); }
 const load=async()=>{
  if(preview)return preview;
  try {const r=await fetch('data/community-play.json',{cache:'no-cache'});if(!r.ok)throw Error('community-data');const d=await r.json();
  if(d?.preview?.status!=='preview')throw Error('invalid-status');preview=d.preview;
  }catch {preview={title:{de:'Bolzplatz – Konzeptvorschau'},area:{},image:'assets/spots/community/bolzplatz-vorschau.webp',events:[]};}
  return preview;
 };
 const close=()=>{
  if(!overlay)return;
  if (dockedNav && navParent) {
    dockedNav.removeEventListener('click',navAction,true);
    navParent.insertBefore(dockedNav,navNext?.parentNode===navParent?navNext:null);
  }
  dockedNav=null;navParent=null;navNext=null;
  overlay.remove();overlay=null;document.body.classList.remove('fsm-community-open');document.body.style.overflow=lockScroll;
  document.removeEventListener('keydown',escapeListener,true);escapeListener=null;
  const target=lastFocus?.getClientRects?.().length?lastFocus:document.getElementById('menu-toggle');if(target?.isConnected)target.focus({preventScroll:true});
 };
 function makeAction(name, cls, onClick){const b=el('button',cls,name);b.type='button';b.addEventListener('click',onClick);return b;}
 async function open(spot=null){
  if(overlay)close();
  const cfg=await load();const tr=L[lang()];
  lastFocus=document.activeElement;closeMenu?.();
  lockScroll=document.body.style.overflow;document.body.style.overflow='hidden';document.body.classList.add('fsm-community-open');
  overlay=el('div','fsm-community-overlay');overlay.id='fsm-community-overlay';
  const mask=el('div','fsm-community-shade');mask.addEventListener('click',close);overlay.append(mask);
  const sheet=el('section','fsm-community-sheet');sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-labelledby','fsm-community-heading');
  sheet.append(el('div','fsm-community-handle'));
  const header=el('header','fsm-community-header');
  const badge=el('span','fsm-community-emblem');badge.append(icon('football'));
  const titles=el('div','fsm-community-titles');
  const h=el('h2','fsm-community-title',spot?.title||spot?.name||cfg.title?.[lang()]||cfg.title?.de||'Bolzplatz');h.id='fsm-community-heading';
  const area=el('p','fsm-community-location');area.append(icon('location'),document.createTextNode(spot?.city||cfg.area?.[lang()]||tr.location));
  titles.append(h,area);
  const x=makeAction('', 'fsm-community-close',close);x.append(icon('close'));x.setAttribute('aria-label',tr.close);
  header.append(badge,titles,x);sheet.append(header);
  const body=el('div','fsm-community-body');
  const imgPath=safePath(spot?.community?.image)||safePath(cfg.image);
  if(imgPath){const hero=el('img','fsm-community-photo');hero.alt=spot?'Bolzplatz':'Bolzplatz – Vorschaufoto';hero.src=imgPath;hero.loading='eager';hero.width=1400;hero.height=760;body.append(hero);}
  body.append(el('p','fsm-community-intro',tr.intro));
  const mission=el('p','fsm-community-mission');mission.append(icon('people'),document.createTextNode(tr.mission));body.append(mission);
  const events=el('section','fsm-community-events');const eh=el('h3','fsm-community-events-heading');eh.append(icon('calendar'),document.createTextNode(tr.heading));events.append(eh);
  const real=Array.isArray(spot?.community?.events)?spot.community.events.filter(e=>e?.status==='published'&&e?.approved===true&&e?.organiser_verified===true&&typeof e?.title==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(e?.date||'')):[];
  if(real.length){
   for(const event of real.slice(0,4)) {
    const row=el('div','fsm-community-event');const ico=el('span','fsm-community-event-icon');ico.append(icon('calendar'));
    const content=el('div','fsm-community-event-copy');content.append(el('strong','',event.title));
    const d=el('span','',event.date+(event.time?' · '+event.time:''));content.append(d);row.append(ico,content);events.append(row);
   }
  }else if(spot){
   events.append(el('p','fsm-community-demo-note',{
    de:'Aktuell kein Termin geplant',en:'No upcoming meetup',da:'Ingen kommende aftaler'
   }[lang()]));
  }else{
   events.append(el('p','fsm-community-demo-note',tr.preview));
   for(const [title,description] of tr.examples){const row=el('div','fsm-community-event fsm-community-event--demo');const ico=el('span','fsm-community-event-icon');ico.append(icon('calendar'));const content=el('div','fsm-community-event-copy');content.append(el('strong','',title),el('span','',description));row.append(ico,content);events.append(row);}
  }
  body.append(events);
  const tags=el('div','fsm-community-tags');for(const tag of tr.tags)tags.append(el('span','',tag));body.append(tags);
  const detailsPanel=el('div','fsm-community-explain');detailsPanel.hidden=true;detailsPanel.append(el('strong','',tr.information),el('p','',tr.info));
  const msg=el('p','fsm-community-alert',tr.cta);msg.hidden=true;msg.setAttribute('role','status');
  body.append(detailsPanel,msg);sheet.append(body);
  const foot=el('footer','fsm-community-actions');
  foot.append(makeAction(tr.details,'fsm-community-secondary',()=>{detailsPanel.hidden=!detailsPanel.hidden;detailsPanel.scrollIntoView({block:'nearest'});}));
  if(!spot)foot.append(makeAction(tr.join,'fsm-community-primary',()=>{msg.hidden=false;msg.scrollIntoView({block:'nearest'});}));
  sheet.append(foot);
  // Reuse the ORIGINAL five-button navigation inside the preview. No copy,
  // duplicate handlers or state: it returns to its original place on close.
  const originalNav=document.getElementById('fsm-home-nav');
  if (originalNav && originalNav.parentNode) {
    dockedNav=originalNav;navParent=originalNav.parentNode;navNext=originalNav.nextSibling;
    originalNav.addEventListener('click',navAction,true);
    sheet.append(originalNav);
  }
  overlay.append(sheet);document.body.append(overlay);
  escapeListener=e=>{if(!overlay)return;if(e.key==='Escape'){e.preventDefault();close();}else if(e.key==='Tab'){const focusable=[...sheet.querySelectorAll('button:not([disabled])')];const first=focusable[0],last=focusable[focusable.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
  document.addEventListener('keydown',escapeListener,true);
  x.focus({preventScroll:true});
 }
 button.addEventListener('click',()=>open());
 document.addEventListener('fsm:community-open',event=>{if(event.detail?.spot?.community?.enabled===true)open(event.detail.spot);});
 return {open,close};
}
