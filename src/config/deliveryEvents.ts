import {validateCozySchedule,type CozySchedule,type ScheduleSlot} from './cozySchedule.js';
import {APP_CAMPAIGN} from './appCampaign.js';

/** Provisional playtest values, independent of future hiring and wages. */
export const DELIVERY_RULES=Object.freeze({unlockDay:5,deadline:90,fee:5,waitSeconds:10,travelSeconds:0,rainWaitSeconds:15,rainTravelSeconds:0,returnSeconds:20,rainReturnSeconds:30});
export type DeliveryEventId='normal'|'rain'|'rush'|'festival';
export type DeliveryEvent=Readonly<{id:DeliveryEventId;name:string;day:number}>;
export type DeliveryScheduleSlot=ScheduleSlot&Readonly<{source?:'shop'|'app';quantity?:1|2|3;appCampaign?:true}>;
export function deliveryEvent(day:number):DeliveryEvent {
 const id:DeliveryEventId=day<6?'normal':(['rain','rush','normal','festival'] as const)[(day-6)%4];
 return Object.freeze({id,day,name:({normal:'Bình thường',rain:'Mưa',rush:'Cao điểm',festival:'Lễ hội'})[id]});
}
export function deliveryTiming(event:DeliveryEventId){return {waitSeconds:event==='rain'?15:10,travelSeconds:0,returnSeconds:event==='rain'?30:20,fee:DELIVERY_RULES.fee};}
export function deliverySchedule(base:CozySchedule,enabled:boolean,campaign=false):CozySchedule {
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
 if(enabled&&campaign&&base.day>=APP_CAMPAIGN.firstDay&&base.day<=APP_CAMPAIGN.lastDay){
  const apps=slots.filter(slot=>slot.source==='app'),extra=Math.round(apps.length*APP_CAMPAIGN.multiplier)-apps.length;
  const ordinal=Math.max(0,...slots.map(slot=>slot.commercialOrdinal??0));
  for(let i=0;i<extra;i++){
   // Append opportunities instead of replacing more counter visits. Original slots stay intact.
   let tick=Math.round(base.duration*(i+1)/(extra+1)*20);
   while(slots.some(slot=>Math.round(slot.at*20)===tick))tick++;
   if(tick>=Math.round(base.duration*20))tick=Math.round(base.duration*20)-1;
   slots.push({...apps[i%apps.length],id:`day-${base.day}-app-campaign-${i+1}`,appCampaign:true,at:tick/20,commercialOrdinal:ordinal+i+1});
  }
  slots.sort((a,b)=>a.at-b.at);
 }
 return validateCozySchedule({...base,slots});
}
