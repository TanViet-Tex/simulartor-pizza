import {validateCozySchedule,type CozySchedule,type ScheduleSlot} from '../config/cozySchedule';
import type {DeliveryScheduleSlot} from '../config/deliveryEvents';
/** Stable Bernoulli samples add expected visits, without changing any base opportunity. */
function sample(key:string){let n=2166136261;for(const c of key)n=Math.imul(n^c.charCodeAt(0),16777619);n^=n>>>16;n=Math.imul(n,0x7feb352d);n^=n>>>15;n=Math.imul(n,0x846ca68b);return ((n^(n>>>16))>>>0)/4294967296;}
export function shopSchedule(base:CozySchedule,bonus:number):CozySchedule {
 if(bonus<=0)return base;
 const extras:ScheduleSlot[]=[],occupied=new Set(base.slots.map(s=>Math.round(s.at*20)));
 let ordinal=base.slots.reduce((n,s)=>Math.max(n,s.commercialOrdinal??0),0);
 for(const slot of base.slots){
  if(slot.opportunity!=='commercial'||(slot as DeliveryScheduleSlot).source==='app'||sample(`${base.day}/${slot.id}/shop-bonus`)>=Math.min(.30,bonus))continue;
  // Find a free 50ms tick near the midpoint to the next opportunity.
  const next=base.slots.find(s=>s.at>slot.at)?.at??base.duration;
  let tick=Math.round((slot.at+next)*10);while(occupied.has(tick))tick++;
  if(tick>=base.duration*20)continue;occupied.add(tick);
  extras.push({...slot,id:`${slot.id}-shop-bonus`,at:tick/20,commercialOrdinal:++ordinal});
 }
 return validateCozySchedule({...base,slots:[...base.slots,...extras].sort((a,b)=>a.at-b.at)});
}
