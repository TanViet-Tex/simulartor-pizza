import {describe,expect,it} from 'vitest';
import {resolveScheduleRecipe,threeDaySchedule,validateCozySchedule,type ScheduleEligibility} from './cozySchedule';
const eligibility:ScheduleEligibility={regularDay1Stars:null,regularLatestStars:null,helpSucceeded:false,referral:false};
describe('canonical three-day schedule',()=>{
  it('validates stable immutable times, mixes and shift lengths with ongoing days',()=>{
    const first=threeDaySchedule(1,eligibility);
    expect(first.duration).toBe(180);expect(first.grace).toBe(120);
    expect(first.slots.map(s=>s.at)).toEqual([10,35,60,85,110,135]);
    expect(first.slots.map(s=>s.kind)).toEqual(['regular','picky','bargain','picky','bargain','bargain']);
    expect(first.slots.map(s=>s.takeaway)).toEqual([false,false,true,false,false,true]);
    expect(threeDaySchedule(2,eligibility).slots.map(s=>s.at)).toEqual([10,32,54,76,98,120,142,164]);
    expect(threeDaySchedule(3,eligibility).slots.map(s=>s.at)).toEqual([10,30,50,70,90,110,130,150,170,190]);
    expect(Object.isFrozen(first.slots[0])).toBe(true);
    expect(threeDaySchedule(4,eligibility)).toMatchObject({day:4,duration:240,grace:120});expect(threeDaySchedule(4,eligibility).slots).toHaveLength(10);
  });
  it('keeps conditional help in the first slot and outside commercial cadence',()=>{
    expect(threeDaySchedule(2,{...eligibility,regularDay1Stars:2}).slots[0].kind).toBe('bargain');
    const second=threeDaySchedule(2,{...eligibility,regularDay1Stars:3});
    expect(second.slots[0]).toMatchObject({kind:'regular',opportunity:'help',commercialOrdinal:null,takeaway:false});
    expect(second.slots.slice(1,4).map(s=>[s.kind,s.commercialOrdinal,s.takeaway])).toEqual([['hurry',1,false],['picky',2,false],['bargain',3,true]]);
  });
  it('adds exactly one earned referral and conditional regular return',()=>{
    expect(threeDaySchedule(3,{...eligibility,regularLatestStars:3}).slots[0].kind).toBe('bargain');
    for(const input of [{regularLatestStars:4},{helpSucceeded:true}])expect(threeDaySchedule(3,{...eligibility,...input}).slots[0].kind).toBe('regular');
    const third=threeDaySchedule(3,{...eligibility,referral:true});
    expect(third.slots).toHaveLength(11);expect(third.slots[10]).toMatchObject({id:'day-3-referral',at:210,opportunity:'referral'});
  });
  it('resolves the proposed recipe cycle by enabled unlocked recipe order',()=>{
    const slots=threeDaySchedule(1,eligibility).slots;
    expect(slots.slice(0,5).map(s=>resolveScheduleRecipe(s,['cheese','mushroom','sausage']))).toEqual(['cheese','cheese','mushroom','cheese','sausage']);
    expect(resolveScheduleRecipe(slots[4],['cheese','mushroom'])).toBe('cheese');
    expect(resolveScheduleRecipe(slots[2],['cheese'])).toBe('cheese');
    expect(resolveScheduleRecipe(slots[0],['mushroom'])).toBeNull();
    expect(resolveScheduleRecipe(slots[1],[])).toBeNull();
    expect(resolveScheduleRecipe(threeDaySchedule(3,{...eligibility,referral:true}).slots[10],['mushroom','cheese'])).toBe('mushroom');
  });
  it('rejects malformed and duplicated slots instead of silently repairing content',()=>{
    const valid=threeDaySchedule(1,eligibility);
    for(const invalid of [{...valid,day:0},{...valid,duration:0},{...valid,slots:[valid.slots[0],valid.slots[0]]},{...valid,slots:[{...valid.slots[0],at:180}]},{...valid,slots:[{...valid.slots[0],commercialOrdinal:0}]},{...valid,slots:[{...valid.slots[0],opportunity:'help' as const}]}])expect(()=>validateCozySchedule(invalid)).toThrow();
    for(const invalid of [{...valid,duration:180.03},{...valid,grace:.03},{...valid,slots:[{...valid.slots[0],at:179.99}]},{...valid,slots:[valid.slots[0],{...valid.slots[1],at:10}]}])expect(()=>validateCozySchedule(invalid)).toThrow();
  });
});
