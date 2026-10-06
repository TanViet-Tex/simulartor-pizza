import {validateCozySchedule,type CozySchedule,type ScheduleSlot} from './cozySchedule';

/** Provisional playtest values, independent of future hiring and wages. */
export const DELIVERY_RULES=Object.freeze({unlockDay:5,deadline:90,fee:5,waitSeconds:10,travelSeconds:0,rainWaitSeconds:15,rainTravelSeconds:0,returnSeconds:20,rainReturnSeconds:30});
export type DeliveryEventId='normal'|'rain'|'rush'|'festival';
export type DeliveryEvent=Readonly<{id:DeliveryEventId;name:string;day:number}>;
export type DeliveryScheduleSlot=ScheduleSlot&Readonly<{source?:'shop'|'app';quantity?:1|2|3}>;
export function deliveryEvent(day:number):DeliveryEvent {
 const id:DeliveryEventId=day<6?'normal':(['rain','rush','normal','festival'] as const)[(day-6)%4];
 return Object.freeze({id,day,name:({normal:'Bình thường',rain:'Mưa',rush:'Cao điểm',festival:'Lễ hội'})[id]});
}
export function deliveryTiming(event:DeliveryEventId){return {waitSeconds:event==='rain'?15:10,travelSeconds:0,returnSeconds:event==='rain'?30:20,fee:DELIVERY_RULES.fee};}
export function deliverySchedule(base:CozySchedule,enabled:boolean):CozySchedule {
 const event=deliveryEvent(base.day),slots:DeliveryScheduleSlot[]=base.slots.filter((_slot,i)=>event.id!=='rain'||i%3!==2).map(slot=>({...slot,source:'shop',quantity:1}));
 let ordinal=base.slots.reduce((n,s)=>Math.max(n,s.commercialOrdinal??0),0);
 const add=(at:number,id:string,source:'shop'|'app',quantity:1|2|3)=>{
  if(at>=base.duration)return;
  while(slots.some(s=>s.at===at))at+=.05;
  if(at>=base.duration)return;
  slots.push({id:`day-${base.day}-${id}`,at,kind:'hurry',opportunity:'commercial',commercialOrdinal:++ordinal,takeaway:source==='app',source,quantity});
 };
 if(event.id==='rush'||event.id==='festival')for(const [i,at] of (event.id==='rush'?[45,125]:[45,125,205]).entries())add(at,`event-counter-${i+1}`,'shop',1);
 if(enabled&&base.day>=DELIVERY_RULES.unlockDay)for(const [i,at] of (event.id==='rain'?[55,115,175]:[75,155]).entries())add(at,`app-${i+1}`,'app',event.id==='festival'&&i===1?3:i%2===0?1:2);
 return validateCozySchedule({...base,slots:slots.sort((a,b)=>a.at-b.at)});
}
