import {describe,expect,it} from 'vitest';
import {resolveScheduleRecipe,threeDaySchedule,validateCozySchedule,type ScheduleEligibility} from './cozySchedule';
const eligibility:ScheduleEligibility={regularDay1Stars:null,regularLatestStars:null,helpSucceeded:false,referral:false};
describe('canonical three-day schedule',()=>{
  it('validates stable immutable times, mixes and shift lengths with ongoing days',()=>{
    const first=threeDaySchedule(1,eligibility);
    expect(first.duration).toBe(180);expect(first.grace).toBe(120);
    expect(first.slots.map(s=>s.at)).toEqual([10,26,42,58,74,90,106,122,138,154]);
    expect(first.slots.map(s=>s.kind)).toEqual(['regular','hurry','picky','hurry','picky','hurry','picky','hurry','picky','bargain']);
    expect(first.slots.map(s=>s.takeaway)).toEqual([false,false,true,false,false,true,false,false,true,false]);
    expect(threeDaySchedule(2,eligibility).slots.map(s=>s.at)).toEqual(Array.from({length:15},(_,i)=>10+12*i));
    expect(threeDaySchedule(3,eligibility).slots.map(s=>s.at)).toEqual(Array.from({length:20},(_,i)=>10+11*i));
    expect(Object.isFrozen(first.slots[0])).toBe(true);
    expect(threeDaySchedule(4,eligibility)).toMatchObject({day:4,duration:240,grace:120});expect(threeDaySchedule(4,eligibility).slots).toHaveLength(20);
  });
  it('keeps the requested customer progression and sparse bargain visits through day 30',()=>{
    for(let day=1;day<=30;day++){
      const schedule=threeDaySchedule(day,eligibility),count=day===1?10:day===2?15:day<8?20:25;
      expect(schedule.slots).toHaveLength(count);
      expect(schedule.duration).toBe(day===1?180:day===2?210:240);
      expect(schedule.slots.filter(s=>s.kind==='bargain').map(s=>s.id)).toEqual(Array.from({length:Math.floor(count/10)},(_,i)=>`day-${day}-slot-${(i+1)*10}`));
      expect(schedule.slots.every(s=>Number.isInteger(s.at*20)&&s.at<schedule.duration)).toBe(true);
      expect(new Set(schedule.slots.map(s=>s.at)).size).toBe(count);
      expect(schedule.slots.map(s=>s.id)).toEqual(Array.from({length:count},(_,i)=>`day-${day}-slot-${i+1}`));
    }
  });
  it('keeps conditional help in the first slot and outside commercial cadence',()=>{
    expect(threeDaySchedule(2,{...eligibility,regularDay1Stars:2}).slots[0].kind).toBe('hurry');
    const second=threeDaySchedule(2,{...eligibility,regularDay1Stars:3});
    expect(second.slots[0]).toMatchObject({kind:'regular',opportunity:'help',commercialOrdinal:null,takeaway:false});
    expect(second.slots.slice(1,4).map(s=>[s.kind,s.commercialOrdinal,s.takeaway])).toEqual([['hurry',1,false],['picky',2,false],['hurry',3,true]]);
    expect(threeDaySchedule(2,{...eligibility,regularDay1Stars:5,helpOfferEligible:false}).slots[0]).toMatchObject({kind:'hurry',opportunity:'commercial',commercialOrdinal:1});
    expect(threeDaySchedule(2,{...eligibility,regularDay1Stars:3,helpOfferEligible:true}).slots[0].opportunity).toBe('help');
  });
  it('adds exactly one earned referral and conditional regular return',()=>{
    expect(threeDaySchedule(3,{...eligibility,regularLatestStars:3}).slots[0].kind).toBe('hurry');
    for(const input of [{regularLatestStars:4},{helpSucceeded:true}])expect(threeDaySchedule(3,{...eligibility,...input}).slots[0].kind).toBe('regular');
    const third=threeDaySchedule(3,{...eligibility,referral:true});
    expect(third.slots).toHaveLength(21);expect(third.slots.find(s=>s.opportunity==='referral')).toMatchObject({id:'day-3-referral',at:210,opportunity:'referral',commercialOrdinal:21});
    for(let day=3;day<=30;day++){
      const ordinary=threeDaySchedule(day,eligibility),referred=threeDaySchedule(day,{...eligibility,referral:true});
      expect(referred.slots.filter(s=>s.opportunity!=='referral')).toEqual(ordinary.slots);
      expect(referred.slots).toHaveLength(ordinary.slots.length+1);
      expect(referred.slots.every((s,i)=>s.at<referred.duration&&(i===0||s.at>referred.slots[i-1].at))).toBe(true);
    }
  });
  it('resolves the proposed recipe cycle by enabled unlocked recipe order',()=>{
    const slots=threeDaySchedule(1,eligibility).slots;
    expect(slots.slice(0,5).map(s=>resolveScheduleRecipe(s,['cheese','mushroom','sausage']))).toEqual(['cheese','cheese','mushroom','cheese','sausage']);
    expect(resolveScheduleRecipe(slots[4],['cheese','mushroom'])).toBe('cheese');
    expect(resolveScheduleRecipe(slots[2],['cheese'])).toBe('cheese');
    expect(resolveScheduleRecipe(slots[0],['mushroom'])).toBeNull();
    expect(resolveScheduleRecipe(slots[1],[])).toBeNull();
    expect(resolveScheduleRecipe(threeDaySchedule(3,{...eligibility,referral:true}).slots.find(s=>s.opportunity==='referral')!,['mushroom','cheese'])).toBe('mushroom');
  });
  it('rejects malformed and duplicated slots instead of silently repairing content',()=>{
    const valid=threeDaySchedule(1,eligibility);
    for(const invalid of [{...valid,day:0},{...valid,duration:0},{...valid,slots:[valid.slots[0],valid.slots[0]]},{...valid,slots:[{...valid.slots[0],at:180}]},{...valid,slots:[{...valid.slots[0],commercialOrdinal:0}]},{...valid,slots:[{...valid.slots[0],opportunity:'help' as const}]}])expect(()=>validateCozySchedule(invalid)).toThrow();
    for(const invalid of [{...valid,duration:180.03},{...valid,grace:.03},{...valid,slots:[{...valid.slots[0],at:179.99}]},{...valid,slots:[valid.slots[0],{...valid.slots[1],at:10}]}])expect(()=>validateCozySchedule(invalid)).toThrow();
  });
});
