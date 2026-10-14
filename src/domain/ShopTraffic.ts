import {validateCozySchedule,type CozySchedule} from '../config/cozySchedule.js';
import type {DeliveryScheduleSlot} from '../config/deliveryEvents.js';

/** Reduce the final counter budget, after delivery allocation and shop bonuses. */
export function reduceShopTraffic(schedule:CozySchedule):CozySchedule {
  if(schedule.day>30)return schedule;
  const counter=schedule.slots.filter(slot=>(slot as DeliveryScheduleSlot).source!=='app');
  const ordinary=counter.filter(slot=>slot.opportunity==='commercial');
  const protectedCount=counter.length-ordinary.length;
  const count=Math.min(ordinary.length,Math.max(ordinary.length?1:0,Math.round(counter.length*.8)-protectedCount));
  if(count===ordinary.length)return schedule;
  // Evenly retain visits across the shift, including its first ordinary arrival.
  const kept=new Set(Array.from({length:count},(_,i)=>ordinary[count===1?0:Math.round(i*(ordinary.length-1)/(count-1))].id));
  return validateCozySchedule({...schedule,slots:schedule.slots.filter(slot=>(slot as DeliveryScheduleSlot).source==='app'||slot.opportunity!=='commercial'||kept.has(slot.id))});
}
