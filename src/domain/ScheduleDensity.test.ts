import {expect,it} from 'vitest';
import {threeDaySchedule} from '../config/cozySchedule';
import {deliveryEvent,deliverySchedule} from '../config/deliveryEvents';
import {shopSchedule} from './ShopSchedule';

it('preserves rain, rush, festival, app and shop changes across the expanded campaign',()=>{
  for(let day=1;day<=30;day++)for(const app of [false,true]){
    const base=threeDaySchedule(day,{regularDay1Stars:null,regularLatestStars:null,helpSucceeded:false,referral:false});
    const event=deliveryEvent(day).id,schedule=deliverySchedule(base,app);
    const counter=base.slots.filter((_,i)=>event!=='rain'||i%3!==2).length+(event==='rush'?2:event==='festival'?3:0);
    const apps=app&&day>=5?(event==='rain'?3:2):0;
    expect(schedule.slots).toHaveLength(Math.min(30,counter+apps));
    expect(schedule).toEqual(deliverySchedule(base,app));
    const upgraded=shopSchedule(schedule,.3);
    expect(upgraded.slots.length).toBeGreaterThanOrEqual(schedule.slots.length);
    expect(upgraded.slots.length).toBeLessThanOrEqual(30);
    expect(upgraded.slots.every(s=>s.at<base.duration)).toBe(true);
    expect(new Set(upgraded.slots.map(s=>s.id)).size).toBe(upgraded.slots.length);
  }
});
