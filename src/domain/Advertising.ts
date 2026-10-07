import type {CozySchedule} from '../config/cozySchedule';
import type {DeliveryScheduleSlot} from '../config/deliveryEvents';
/** Forecast counts opportunities, not guaranteed completed orders or number of pizzas. */
export function advertisedVisitors(schedule:CozySchedule){
 const shop=schedule.slots.filter(slot=>(slot as DeliveryScheduleSlot).source!=='app');
 return Object.freeze({day:schedule.day,groups:new Set(shop.map(slot=>slot.at)).size,shopVisits:shop.length,appOrders:schedule.slots.length-shop.length,total:schedule.slots.length});
}
