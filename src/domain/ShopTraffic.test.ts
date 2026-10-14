import {expect,it} from 'vitest';
import {threeDaySchedule} from '../config/cozySchedule';
import {deliverySchedule,type DeliveryScheduleSlot} from '../config/deliveryEvents';
import {shopSchedule} from './ShopSchedule';
import {reduceShopTraffic} from './ShopTraffic';
import {advertisedVisitors} from './Advertising';

it('reduces final counter visits by 20% across days 1–30, seeds, app and shop bonuses',()=>{
  for(let day=1;day<=30;day++)for(const customerSeed of [0,2718,'campaign'])for(const app of [false,true])for(const bonus of [0,.3]){
    const base=shopSchedule(deliverySchedule(threeDaySchedule(day,{customerSeed,regularDay1Stars:5,regularLatestStars:5,helpSucceeded:true,helpOfferEligible:true,referral:true}),app),bonus);
    const original=JSON.stringify(base),reduced=reduceShopTraffic(base);
    const counter=(s:typeof base)=>s.slots.filter(slot=>(slot as DeliveryScheduleSlot).source!=='app');
    expect(counter(reduced)).toHaveLength(Math.round(counter(base).length*.8));
    expect(reduced.slots.filter(slot=>(slot as DeliveryScheduleSlot).source==='app')).toEqual(base.slots.filter(slot=>(slot as DeliveryScheduleSlot).source==='app'));
    for(const slot of base.slots.filter(slot=>slot.opportunity!=='commercial'))expect(reduced.slots).toContainEqual(slot);
    expect(reduced.slots[0]).toEqual(base.slots[0]);expect(reduced.duration).toBe(base.duration);expect(reduced.preparation).toBe(base.preparation);expect(reduced.grace).toBe(base.grace);
    expect(advertisedVisitors(reduced).shopVisits).toBe(counter(reduced).length);
    expect(reduced).toEqual(reduceShopTraffic(base));expect(JSON.stringify(base)).toBe(original);
  }
});
it('leaves day 31 and later schedules unchanged',()=>{
  for(const day of [31,1000000]){const base=threeDaySchedule(day,{regularDay1Stars:null,regularLatestStars:null,helpSucceeded:false,referral:false});expect(reduceShopTraffic(base)).toBe(base);}
});
