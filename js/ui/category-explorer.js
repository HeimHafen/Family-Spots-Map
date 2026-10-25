import { WORLDS, PLACE_TYPES, FACETS, labelOf, getPlaceTypes, getWorlds, facetValue, hasCategorySelection } from '../categories.js';

const COPY={
 de:{title:'Was möchtet ihr erleben?',all:'Alle Themen',types:'Ortsarten',helper:'Ortsarten gelten als Alternativen; gewählte Ausstattungen müssen alle vorhanden sein. Unbekannte Angaben zählen nicht als Treffer. Zahlen an Themen und Ortsarten: zugänglicher Bestand.',facets:'Was ist euch wichtig?',more:'Weitere Ausstattung',extras:'Praktisch unterwegs',pending:'Angaben folgen',none:'Keine bestätigten Treffer',empty:'Hier sind noch keine zugänglichen Spots eingetragen.',clear:'Auswahl zurücksetzen',remove:'Entfernen',results:'Treffer',selection:'Eure Auswahl',other:'Weitere Ortsarten',loading:'Spots werden geladen …',error:'Spots konnten nicht geladen werden.'},
 en:{title:'What would you like to explore?',all:'All themes',types:'Place types',helper:'Place types are alternatives; every selected facility must be available. Unknown details do not count as matches. Theme and type counts show the accessible catalogue.',facets:'What matters to you?',more:'More facilities',extras:'Useful on your trip',pending:'Details pending',none:'No confirmed matches',empty:'No accessible spots have been added here yet.',clear:'Reset selection',remove:'Remove',results:'results',selection:'Your selection',other:'Other place types',loading:'Loading spots …',error:'Could not load spots.'},
 da:{title:'Hvad vil I opleve?',all:'Alle temaer',types:'Stedtyper',helper:'Stedtyper gælder som alternativer; alle valgte faciliteter skal være til stede. Ukendte oplysninger tæller ikke som match. Tal ved temaer og stedtyper viser det tilgængelige katalog.',facets:'Hvad er vigtigt for jer?',more:'Flere faciliteter',extras:'Praktisk på tur',pending:'Oplysninger følger',none:'Ingen bekræftede match',empty:'Der er endnu ingen tilgængelige spots her.',clear:'Nulstil valg',remove:'Fjern',results:'resultater',selection:'Jeres valg',other:'Andre stedtyper',loading:'Indlæser spots …',error:'Spots kunne ikke indlæses.'}
};
const make=(tag,text,cls)=>{const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;};
export function createCategoryExplorer({mount,getLang,onChange}) {
 if(!mount)return null;
 const state={world:'',types:new Set(),facets:new Set()};
 let allSpots=[],lang='',catalogSignature='',selectionSignature='',counts={worlds:new Map(),types:new Map(),facets:new Map(),knownFacets:new Map()},resultCount=0,loadState='loading';
 let countEl,selectionEl,typeBox,worldButtons,facetInputs;
 const copy=()=>COPY[getLang()] || COPY.de;
 function focusKey() {return mount.contains(document.activeElement)?document.activeElement?.dataset?.categoryFocus:null;}
 function restoreFocus(key) {
   if(key==null)return;
   const target=[...mount.querySelectorAll('[data-category-focus]')].find(el=>el.dataset.categoryFocus===key && !el.disabled);
   (target || worldButtons.get(''))?.focus({preventScroll:true});
 }
 const typeList=()=>{
   const legacy=[...new Set(allSpots.flatMap(getPlaceTypes).filter(id=>id.startsWith('legacy:')))];
   return [...PLACE_TYPES,...legacy.map(id=>({id,world:'other',label:{de:id.slice(7).replaceAll('-',' '),en:id.slice(7).replaceAll('-',' '),da:id.slice(7).replaceAll('-',' ')}}))];
 };
 function changed(){renderTypes();refresh();onChange();}
 function toggle(set,id){set.has(id)?set.delete(id):set.add(id);changed();}
 function button(text,action){const el=make('button',text,'category-explorer__chip');el.type='button';el.addEventListener('click',action);return el;}
 function paintCount(){countEl.textContent=loadState==='loading'?copy().loading:loadState==='error'?copy().error:`${resultCount} ${copy().results}`;}
 function refresh(){
   if(!countEl)return;
   paintCount();
   for(const [id,btn] of worldButtons){const count=id?counts.worlds.get(id)||0:allSpots.length;btn.setAttribute('aria-pressed',String(state.world===id));btn.textContent=`${id?labelOf(WORLDS.find(x=>x.id===id)||{label:{de:copy().other}},getLang()):copy().all} (${count})`;btn.disabled=!!id && !count && state.world!==id;}
   for(const [id,input] of facetInputs){const n=counts.facets.get(id)||0;input.checked=state.facets.has(id);input.disabled=!n && !input.checked;input.nextElementSibling.textContent=labelOf(FACETS.find(x=>x.id===id),getLang())+(n?` (${n})`:` · ${counts.knownFacets.get(id)?copy().none:copy().pending}`);}
   const nextSelection=JSON.stringify([getLang(),state.world,[...state.types],[...state.facets]]);
   if(nextSelection===selectionSignature)return;
   selectionSignature=nextSelection;
   const focusedIndex=selectionEl.contains(document.activeElement)?[...selectionEl.children].indexOf(document.activeElement):-1;
   selectionEl.replaceChildren();selectionEl.hidden=!hasCategorySelection(state);
   if(state.world){const world=WORLDS.find(x=>x.id===state.world);const b=button(labelOf(world||{label:{de:copy().other}},getLang())+' ×',()=>{state.world='';state.types.clear();render();restoreFocus('world:');onChange();});b.setAttribute('aria-label',copy().remove+': '+labelOf(world,getLang()));selectionEl.append(b);}
   for(const [kind,set,list] of [['type',state.types,typeList()],['facet',state.facets,FACETS]])for(const id of set){const item=list.find(x=>x.id===id);const name=labelOf(item,getLang());const b=button(name+' ×',()=>toggle(set,id));b.setAttribute('aria-label',copy().remove+': '+name);b.dataset.selectionKind=kind;b.dataset.categoryFocus=`remove:${kind}:${id}`;selectionEl.append(b);}
   if(focusedIndex>=0)(selectionEl.children[Math.min(focusedIndex,selectionEl.children.length-1)] || worldButtons.get(''))?.focus({preventScroll:true});
 }
 function renderTypes(){
   if(!typeBox)return;
   const focused=focusKey();
   const hadTypeFocus=typeBox.contains(document.activeElement);
   typeBox.replaceChildren();
   // All themes is deliberately compact. Opening a world exposes its type choices.
   if(!state.world){typeBox.hidden=true;return;}
   typeBox.hidden=false;
   typeBox.append(make('legend',copy().types));
   const list=typeList().filter(x=>x.world===state.world && ((counts.types.get(x.id)||0)>0 || state.types.has(x.id)));
   if(!list.length){typeBox.append(make('p',copy().empty,'filter-group-helper'));return;}
   const row=make('div','','category-explorer__types');typeBox.append(row);
   for(const item of list){const wrap=make('label','','category-explorer__choice');const input=make('input');input.type='checkbox';input.name='place-types';input.value=item.id;input.dataset.categoryFocus='type:'+item.id;input.checked=state.types.has(item.id);input.addEventListener('change',()=>{if(input.checked)state.types.add(item.id);else state.types.delete(item.id);refresh();onChange();});wrap.append(input,make('span',`${labelOf(item,getLang())} (${counts.types.get(item.id)||0})`));row.append(wrap);}
   if(hadTypeFocus)restoreFocus(focused);
 }
 function render(){
   const focused=focusKey();
   const extrasWasOpen=mount.querySelector('.category-explorer__extras')?.open;
   const moreWasOpen=mount.querySelector('.category-explorer__more')?.open;
   selectionSignature='';
   lang=getLang();mount.replaceChildren();mount.className='category-explorer';worldButtons=new Map();facetInputs=new Map();
   const title=make('h3',copy().title);title.id='category-explorer-title';mount.setAttribute('aria-labelledby',title.id);mount.append(title);
   const helper=make('p',copy().helper,'filter-group-helper');helper.id='category-explorer-help';mount.append(helper);
   const worlds=make('div','','category-explorer__worlds');worlds.setAttribute('role','group');worlds.setAttribute('aria-labelledby',title.id);mount.append(worlds);
   function addWorld(item,target){const id=item?.id||'';const b=button('',()=>{state.world=id;state.types.clear();render();onChange();});b.dataset.world=id;b.dataset.categoryFocus='world:'+id;b.setAttribute('aria-describedby',helper.id);worldButtons.set(id,b);target.append(b);}
   addWorld(null,worlds);WORLDS.filter(x=>!x.auxiliary).forEach(x=>addWorld(x,worlds));
   const extras=make('details');extras.className='category-explorer__extras';extras.open=!!extrasWasOpen || ['services','events','other'].includes(state.world);extras.append(make('summary',copy().extras));const extraRow=make('div','','category-explorer__worlds');extraRow.setAttribute('role','group');extraRow.setAttribute('aria-label',copy().extras);extras.append(extraRow);WORLDS.filter(x=>x.auxiliary).forEach(x=>addWorld(x,extraRow));if(typeList().some(x=>x.world==='other'))addWorld({id:'other'},extraRow);mount.append(extras);
   typeBox=make('fieldset','','category-explorer__fieldset');mount.append(typeBox);renderTypes();
   const facets=make('fieldset','','category-explorer__fieldset');facets.append(make('legend',copy().facets));const quick=make('div','','category-explorer__types');facets.append(quick);
   const more=make('details');more.className='category-explorer__more';more.open=!!moreWasOpen;more.append(make('summary',copy().more));const moreRow=make('div','','category-explorer__types');more.append(moreRow);
   FACETS.forEach((item,i)=>{const wrap=make('label','','category-explorer__choice');const input=make('input');input.type='checkbox';input.name='category-facilities';input.value=item.id;input.dataset.categoryFocus='facet:'+item.id;input.addEventListener('change',()=>{input.checked?state.facets.add(item.id):state.facets.delete(item.id);refresh();onChange();});wrap.append(input,make('span'));(i<4?quick:moreRow).append(wrap);facetInputs.set(item.id,input);});facets.append(more);mount.append(facets);
   selectionEl=make('div','','category-explorer__selection');selectionEl.setAttribute('role','group');selectionEl.setAttribute('aria-label',copy().selection);mount.append(selectionEl);
   const footer=make('div','','category-explorer__footer');countEl=make('p');countEl.setAttribute('role','status');countEl.setAttribute('aria-live','polite');countEl.setAttribute('aria-atomic','true');const reset=button(copy().clear,()=>{api.reset();onChange();});reset.dataset.categoryFocus='reset';footer.append(countEl,reset);mount.append(footer);refresh();
   restoreFocus(focused);
 }
 const api={state,
   sync(spots,total,status='ready'){
     const next=JSON.stringify(spots.map(spot=>[spot.id,getPlaceTypes(spot),FACETS.map(f=>facetValue(spot,f.id))]));allSpots=spots;resultCount=total;loadState=status;
     counts={worlds:new Map(),types:new Map(),facets:new Map(),knownFacets:new Map()};
     const inc=(map,key)=>map.set(key,(map.get(key)||0)+1);
     for(const spot of spots){getWorlds(spot).forEach(id=>inc(counts.worlds,id));getPlaceTypes(spot).forEach(id=>inc(counts.types,id));FACETS.forEach(x=>{const value=facetValue(spot,x.id);if(value==='yes')inc(counts.facets,x.id);if(value!=='unknown')inc(counts.knownFacets,x.id);});}
     const rebuild=lang!==getLang() || catalogSignature!==next;catalogSignature=next;
     if(rebuild)render();else refresh();
   },
   reset(){state.world='';state.types.clear();state.facets.clear();render();},
   summary(){const list=[];if(state.world)list.push(labelOf(WORLDS.find(x=>x.id===state.world)||{label:{de:copy().other}},getLang()));for(const id of state.types)list.push(labelOf(typeList().find(x=>x.id===id),getLang()));for(const id of state.facets)list.push(labelOf(FACETS.find(x=>x.id===id),getLang()));return list;}
 };
 render();return api;
}
