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
 const event=deliveryEvent(base.day),slots:DeliveryScheduleSlot[]=base.slots.map(slot=>({...slot,source:'shop',quantity:1}));
 // The seeded budget already includes app orders. Weather keeps its delivery rules,
 // while the new explicit day bands replace the former event density adjustments.
 if(enabled&&base.day>=DELIVERY_RULES.unlockDay){
  const positions=event.id==='rain'?[.23,.48,.73]:[.31,.65];
  for(const [i,fraction] of positions.entries()){
   const target=base.duration*fraction;
   const eligible=slots.map((slot,index)=>({slot,index})).filter(({slot})=>slot.source==='shop'&&slot.opportunity==='commercial'&&slot.kind!=='regular'&&slot.at>0);
   const chosen=eligible.sort((a,b)=>Math.abs(a.slot.at-target)-Math.abs(b.slot.at-target)||a.index-b.index)[0];
   if(!chosen)continue;
   slots[chosen.index]={...chosen.slot,id:`day-${base.day}-app-${i+1}`,kind:'hurry',source:'app',takeaway:true,quantity:event.id==='festival'&&i===1?3:i%2===0?1:2};
  }
 }
 return validateCozySchedule({...base,slots});
}
