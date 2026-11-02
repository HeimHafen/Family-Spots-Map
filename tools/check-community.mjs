// V86 meetup integrity, data safety and annual recurrence regression checks.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const assert=(ok,label)=>{if(!ok)throw new Error(label);};
const source=read('js/features/gemeinsam-erleben.js');
const exported=source.replace('export function initGemeinsamErleben','function initGemeinsamErleben')+'\n({normalizePublished,V,validLocalTime})';
const {normalizePublished,V,validLocalTime}=vm.runInNewContext(exported,{URL,Date,Intl});
let count=0;
const check=(ok,label)=>{assert(ok,label);count++;};
const spots=JSON.parse(read('data/spots.json'));
check(spots.length===164,'All 164 spots retained');
for(const lang of ['de','en','da']) {
 const tr=V[lang];
 for(const key of ['menu','title','public','drafts','plan','all','camping','sport','natur','familie','andere','dateLabel','recurrenceLabel','once','yearly','save','copy','remove','privacy','adult','noEvents']) {
  check(typeof tr?.[key]==='string'&&tr[key].trim(),`${lang}: ${key} missing`);
 }
}
const now=new Date();let start=new Date(now.getFullYear(),now.getMonth()+2,Math.min(10,28),14,30);
const y=start.getFullYear(),m=String(start.getMonth()+1).padStart(2,'0'),d=String(start.getDate()).padStart(2,'0');
const startAt=`${y}-${m}-${d}T14:30`;
check(validLocalTime(startAt),'valid future date');
check(!validLocalTime('2026-02-30T12:00'),'reject invalid date');
const spotId=String(spots[0].id);
const approved={id:'approved-familientreffen',spot_id:spotId,status:'published',approved:true,organiser_verified:true,category:'camping',title:{de:'Familientreffen',en:'Family meetup',da:'Familiemøde'},starts_at:startAt,organiser:{name:'Beispielorganisation'},source_url:'https://example.org/veranstaltung'};
const cases=[approved,{...approved,id:'not-reviewed',approved:false},{...approved,id:'not-organised',organiser_verified:false},{...approved,id:'wrong-spot',spot_id:'missing-spot'},{...approved,id:'no-url',source_url:'javascript:alert(1)'},{...approved,id:'private',status:'draft'},null];
const found=normalizePublished(cases,spots);
check(found.length===1,'only approved, verified, sourced, future events visible');
check(found[0].id===approved.id,'approved record unchanged');
const annual=normalizePublished([{...approved,id:'annual-camp',starts_at:'2024-07-15T16:30',recurrence:'yearly'}],spots);
check(annual.length>=5&&annual.length<=6,'annual events expanded in future years');
check(annual.every(e=>new Date(e.starts_at)>=now),'annual events never published in the past');
check(new Set(annual.map(e=>e.id)).size===annual.length,'annual event identifiers unique');
check(JSON.parse(read('data/events.json')).length===0,'no fictional events published');
for(const page of ['index.html','en/index.html','da/index.html'])check(read(page).includes('gemeinsam-erleben.css'),'linked style missing: '+page);
check(read('js/app.js').includes('initGemeinsamErleben'),'calendar not initialized');
check(read('js/ui/spot-details.js').includes('fsm:gemeinsam-open'),'spot bridge missing');
check(read('service-worker.js').includes('"data/events.json"'),'events offline caching missing');
console.log(`Community checks passed: ${count} assertions, 164 spots, no fabricated public events.`);
