import {expect,it} from 'vitest';
import {threeDaySchedule} from '../config/cozySchedule';
import {deliveryEvent,deliverySchedule} from '../config/deliveryEvents';
import {shopSchedule} from './ShopSchedule';

it('keeps counter plus app in one seeded budget and decoration as the only commercial multiplier',()=>{
  for(let day=1;day<=30;day++)for(const app of [false,true]){
    const base=threeDaySchedule(day,{regularDay1Stars:null,regularLatestStars:null,helpSucceeded:false,referral:false});
    const event=deliveryEvent(day).id,schedule=deliverySchedule(base,app);
    const apps=app&&day>=5?(event==='rain'?3:2):0;
    expect(schedule.slots).toHaveLength(base.slots.length);
    expect((schedule.slots as readonly {source?:string}[]).filter(s=>s.source==='app')).toHaveLength(apps);
    expect(schedule.slots.map(s=>s.at)).toEqual(base.slots.map(s=>s.at));
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
it('keeps late-campaign event and app opportunities within the final budget before decoration',()=>{
 const base=threeDaySchedule(30,{regularDay1Stars:null,regularLatestStars:null,helpSucceeded:false,referral:false,queueCapacity:6,customerSeed:'campaign'});
 const modified=deliverySchedule(base,true),bonus=shopSchedule(modified,.3);
 expect(base.slots.length).toBeGreaterThanOrEqual(46);expect(base.slots.length).toBeLessThanOrEqual(60);expect(modified.slots).toHaveLength(base.slots.length);
 expect((modified.slots as readonly {source?:string}[]).filter(s=>s.source==='app')).toHaveLength(3);
 expect(bonus.slots.length).toBeGreaterThan(modified.slots.length);
 expect(bonus.slots.every((s,i)=>s.at<base.duration&&(i===0||s.at>=bonus.slots[i-1].at))).toBe(true);
});
