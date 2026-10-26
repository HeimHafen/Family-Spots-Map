// Pure selection model. Access, search and radius are applied by the caller first.
import { WORLDS, PLACE_TYPES, FACETS, getPlaceTypes, getWorlds, matchesCategoryProfile } from './categories.js';
export const SHORTCUTS = {
 relaxed: {world:'nature', types:[]}, action:{world:'play', types:[]},
 animals:{world:'animals', types:[]},
 water:{world:'', types:['water-playground','pool','lake','beach']}
};
export function selectShortcut(state, id) {
 const preset=SHORTCUTS[id];if(!preset)return;
 const same=shortcutIsSelected(state,id);
 state.world=same?'':preset.world;state.types=new Set(same?[]:preset.types);
}
export function shortcutIsSelected(state,id) {
 const preset=SHORTCUTS[id];if(!preset)return false;
 const types=new Set(state?.types||[]);
 return (state?.world||'')===preset.world && types.size===preset.types.length && preset.types.every(x=>types.has(x));
}
export function evaluateSelection(spots, state={}, now=Date.now()) {
 const source=Array.isArray(spots)?spots:[];
 const current={world:state.world||'',types:new Set(state.types||[]),facets:new Set(state.facets||[])};
 const matching=choice=>source.filter(spot=>matchesCategoryProfile(spot,choice,now));
 const selected=matching(current), worlds=new Map(),types=new Map(),facets=new Map();
 const rawWorlds=new Map(),rawTypes=new Map(), inc=(map,id)=>map.set(id,(map.get(id)||0)+1);
 source.forEach(spot=>{getWorlds(spot).forEach(x=>inc(rawWorlds,x));getPlaceTypes(spot).forEach(x=>inc(rawTypes,x));});
 for(const id of new Set([...WORLDS.map(x=>x.id),...rawWorlds.keys(),current.world].filter(Boolean)))worlds.set(id,matching({...current,world:id,types:new Set()}).length);
 worlds.set('',matching({...current,world:'',types:new Set()}).length);
 for(const id of new Set([...PLACE_TYPES.map(x=>x.id),...rawTypes.keys(),...current.types])){
  const next=new Set(current.types);next.add(id);
  types.set(id,matching({...current,types:next}).length);
 }
 for(const {id} of FACETS){const next=new Set(current.facets);next.add(id);facets.set(id,matching({...current,facets:next}).length);}
 // Suggest only changes that demonstrably recover results, preserving all other conditions.
 const recovery=[];
 if(!selected.length)for(const id of current.facets){const next=new Set(current.facets);next.delete(id);const count=matching({...current,facets:next}).length;if(count)recovery.push({kind:'facet',id,count});}
 return {spots:selected,worlds,types,facets,rawWorlds,rawTypes,recovery};
}
