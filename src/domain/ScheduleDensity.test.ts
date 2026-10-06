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
    expect(schedule.slots).toHaveLength(counter+apps);
    expect(schedule).toEqual(deliverySchedule(base,app));
    const upgraded=shopSchedule(schedule,.3);
    expect(upgraded.slots.length).toBeGreaterThanOrEqual(schedule.slots.length);
    const eligible=schedule.slots.filter(s=>s.opportunity==='commercial'&&(s as {source?:string}).source!=='app').length;
    expect(upgraded.slots.length).toBeLessThanOrEqual(schedule.slots.length+eligible);
    for(const slot of schedule.slots)expect(upgraded.slots).toContainEqual(slot);
    expect(upgraded).toEqual(shopSchedule(schedule,.3));
    expect(upgraded.slots.every(s=>s.at<base.duration)).toBe(true);
    expect(new Set(upgraded.slots.map(s=>s.id)).size).toBe(upgraded.slots.length);
  }
});
it('keeps high density event and app opportunities beyond the former thirty slot boundary',()=>{
 const base=threeDaySchedule(30,{regularDay1Stars:null,regularLatestStars:null,helpSucceeded:false,referral:false,queueCapacity:6,customerSeed:'campaign'});
 const modified=deliverySchedule(base,true),bonus=shopSchedule(modified,.3);
 expect(base.slots).toHaveLength(98);expect(modified.slots.length).toBeGreaterThan(65);
 expect((modified.slots as readonly {source?:string}[]).filter(s=>s.source==='app')).toHaveLength(3);
 expect(bonus.slots.length).toBeGreaterThan(modified.slots.length);
 expect(bonus.slots.every((s,i)=>s.at<base.duration&&(i===0||s.at>=bonus.slots[i-1].at))).toBe(true);
});
