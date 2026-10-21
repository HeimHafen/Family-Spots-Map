// Content-contract checks shared by local review and publication.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const spots=JSON.parse(read('data/spots.json'));
const config=read('js/config.js');
const literal=name=>vm.runInNewContext('('+config.match(new RegExp(`export const ${name} = (\\{[\\s\\S]*?\\n\\});`))[1]+')');
const tables=['DE','EN','DA'].map(lang=>literal('CATEGORY_LABELS_'+lang));
const tags=literal('CATEGORY_TAGS');
let errors=0;let translatedSections=0;
const fail=message=>{console.error('Content: '+message);errors++;};
const ids=new Set(spots.map(s=>s.id));
const validDate=date=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(Date.parse(date));
for(const s of spots){
 for(const lang of ['de','en','da']){
  for(const key of ['title','summary','visit_label'])if(typeof s[`${key}_${lang}`]!=='string'||!s[`${key}_${lang}`].trim())fail(`${s.id}: missing ${key}/${lang}`);
  if(!Array.isArray(s[`tags_${lang}`])||s[`tags_${lang}`].some(t=>typeof t!=='string'||!t.trim()))fail(`${s.id}: invalid display tags/${lang}`);
 }
 for(const category of s.categories||[])for(let i=0;i<3;i++)if(!tables[i][category])fail(`${s.id}: unknown category ${category} in language ${i}`);
 if(s.source_checked_at&&!validDate(s.source_checked_at))fail(`${s.id}: invalid source date`);
 if(s.verified&&!s.visitor_information?.confirmed_topics?.length)fail(`${s.id}: check badge has no documented confirmed topic`);
 for(const other of [...(s.related_spot_ids||[]),...(s.same_place_as?[s.same_place_as]:[])])if(other===s.id||!ids.has(other))fail(`${s.id}: broken place reference ${other}`);
 for(const [section,field]of Object.entries(s.visit_details?.sections||{}))for(const item of field.items||[]){
  for(const lang of ['de','en','da'])if(typeof item.text?.[lang]!=='string'||!item.text[lang].trim())fail(`${s.id}: missing ${section}/${lang}`);
  translatedSections++;
  if(item.checked_at&&!validDate(item.checked_at))fail(`${s.id}: invalid date in ${section}`);
  for(const u of item.source_urls||[])if(!/^https:\/\//.test(u))fail(`${s.id}: unsafe source in ${section}`);
 }
 if((s.tags||[]).some(t=>t==='Wasserspiel'||t==='Saisonale Wasserspiele')&&!(s.tags||[]).includes('water'))fail(`${s.id}: water feature missing from language-neutral filter data`);
 for(const photo of s.photos||[])for(const lang of ['de','en','da'])if(!photo.alt?.[lang]?.trim()||!photo.caption?.[lang]?.trim())fail(`${s.id}: incomplete photo text/${lang}`);
}
for(const c of ['zoo','tierpark','bauernhof'])for(const tag of ['stroller-friendly','wheelchair','accessible','petting-zoo'])if(tags[c]?.includes(tag))fail(`${c}: generic category promises ${tag}`);
if(tags['stellplatz-spielplatz-naehe-kostenlos']?.includes('overnight'))fail('Free parking cannot imply overnight permission');
console.log(`Content contract: ${spots.length} records, ${translatedSections} trilingual information items, ${errors} errors.`);
if(errors)process.exitCode=1;
