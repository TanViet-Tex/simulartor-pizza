import {describe,expect,it} from 'vitest';
import {cozyDayRules,resolveScheduleRecipe,threeDaySchedule,validateCozySchedule,type ScheduleEligibility} from './cozySchedule';
const eligibility:ScheduleEligibility={regularDay1Stars:null,regularLatestStars:null,helpSucceeded:false,referral:false};
describe('canonical three-day schedule',()=>{
  it('validates stable immutable times, mixes and shift lengths with ongoing days',()=>{
    const first=threeDaySchedule(1,eligibility);
    expect(first.duration).toBe(180);expect(first.grace).toBe(120);
    expect(first.preparation).toBe(5);expect(first.slots[0].at).toBe(0);expect(first.slots[first.slots.length-1].at).toBe(171);
    expect(first.slots.filter(s=>s.at===0)).toHaveLength(1);
    expect(first.slots.slice(0,10).map(s=>s.kind)).toEqual(['regular','hurry','picky','hurry','picky','hurry','picky','hurry','picky','bargain']);
    expect(first.slots.slice(0,10).map(s=>s.takeaway)).toEqual([false,false,true,false,false,true,false,false,true,false]);
    expect(Object.isFrozen(first.slots[0])).toBe(true);
    expect(threeDaySchedule(4,eligibility)).toMatchObject({day:4,duration:210,grace:120});
  });
  it('keeps the requested customer progression and sparse bargain visits through day 30',()=>{
    for(let day=1;day<=30;day++){
      const schedule=threeDaySchedule(day,eligibility),count=schedule.slots.length;
      const rules=cozyDayRules(day);expect(count).toBeGreaterThanOrEqual(rules.min);expect(count).toBeLessThanOrEqual(rules.max);
      expect(schedule.duration).toBe(rules.duration);
      expect(schedule.slots.filter(s=>s.kind==='bargain').map(s=>s.id)).toEqual(Array.from({length:Math.floor(count/10)},(_,i)=>`day-${day}-slot-${(i+1)*10}`));
      expect(schedule.slots.every(s=>Math.abs(s.at*20-Math.round(s.at*20))<1e-8&&s.at<schedule.duration)).toBe(true);
      expect(new Set(schedule.slots.map(s=>s.at)).size).toBeGreaterThan(count/2);
      expect(schedule.slots.map(s=>s.id)).toEqual(Array.from({length:count},(_,i)=>`day-${day}-slot-${i+1}`));
    }
  });
  it('uses mostly individual arrivals with an occasional eighth-group burst and stable forecast samples',()=>{
    for(const queueCapacity of [4,6] as const)for(const day of [1,2,5,6,7,30,31,1000000]){
      const input={...eligibility,queueCapacity,customerSeed:2718},schedule=threeDaySchedule(day,input);
      expect(schedule).toEqual(threeDaySchedule(day,input));
      expect(schedule.slots.filter(s=>s.at===0)).toHaveLength(1);
      expect(schedule).toEqual(threeDaySchedule(day,{...input,queueCapacity:queueCapacity===4?6:4}));
      const burst=day<=5?2:3;
      const batches=new Map<number,number>();for(const s of schedule.slots)batches.set(s.at,(batches.get(s.at)??0)+1);
      expect([...batches.values()].every(n=>n<=burst)).toBe(true);
      const sizes=[...batches.values()];
      expect(sizes.filter(n=>n===1).length).toBeGreaterThan(sizes.length/2);
      expect(sizes[7]).toBe(burst);
      for(const [group,size] of sizes.entries())expect(size).toBe((group+1)%8===0?Math.min(burst,schedule.slots.length-sizes.slice(0,group).reduce((n,v)=>n+v,0)):1);
      if(day>=30){expect(schedule.slots.length).toBeGreaterThanOrEqual(46);expect(schedule.slots.length).toBeLessThanOrEqual(60);}
    }
    const samples=Array.from({length:32},(_,customerSeed)=>threeDaySchedule(2,{...eligibility,customerSeed}).slots.length);
    expect(new Set(samples).size).toBeGreaterThan(1);
  });
  it('keeps conditional help in the first slot and outside commercial cadence',()=>{
    expect(threeDaySchedule(2,{...eligibility,regularDay1Stars:2}).slots[0].kind).toBe('hurry');
    const second=threeDaySchedule(2,{...eligibility,regularDay1Stars:3});
    expect(second.slots[0]).toMatchObject({kind:'regular',opportunity:'help',commercialOrdinal:null,takeaway:false});
    expect(second.slots.slice(1,4).map(s=>[s.kind,s.commercialOrdinal,s.takeaway])).toEqual([['hurry',1,false],['picky',2,false],['hurry',3,true]]);
    expect(threeDaySchedule(2,{...eligibility,regularDay1Stars:5,helpOfferEligible:false}).slots[0]).toMatchObject({kind:'hurry',opportunity:'commercial',commercialOrdinal:1});
    expect(threeDaySchedule(2,{...eligibility,regularDay1Stars:3,helpOfferEligible:true}).slots[0].opportunity).toBe('help');
  });
  it('is sparse early, busiest in the middle and tapers towards closing across all day bands',()=>{
    for(const day of [1,2,5,6,10,11,20,21,30])for(let customerSeed=0;customerSeed<32;customerSeed++){
      const schedule=threeDaySchedule(day,{...eligibility,customerSeed}),third=schedule.duration/3;
      const early=schedule.slots.filter(s=>s.at<third).length,middle=schedule.slots.filter(s=>s.at>=third&&s.at<2*third).length,late=schedule.slots.filter(s=>s.at>=2*third).length;
      expect(middle).toBeGreaterThan(early);expect(middle).toBeGreaterThan(late);
    }
  });
  it('adds exactly one earned referral and conditional regular return',()=>{
    expect(threeDaySchedule(3,{...eligibility,regularLatestStars:3}).slots[0].kind).toBe('hurry');
    for(const input of [{regularLatestStars:4},{helpSucceeded:true}])expect(threeDaySchedule(3,{...eligibility,...input}).slots[0].kind).toBe('regular');
    const third=threeDaySchedule(3,{...eligibility,referral:true});
    expect(third.slots).toHaveLength(threeDaySchedule(3,eligibility).slots.length+1);expect(third.slots.find(s=>s.opportunity==='referral')).toMatchObject({id:'day-3-referral',opportunity:'referral',commercialOrdinal:third.slots.length});
    for(let day=3;day<=30;day++){
      const ordinary=threeDaySchedule(day,eligibility),referred=threeDaySchedule(day,{...eligibility,referral:true});
      expect(referred.slots.filter(s=>s.opportunity!=='referral')).toEqual(ordinary.slots);
      expect(referred.slots).toHaveLength(ordinary.slots.length+1);
      expect(referred.slots.every((s,i)=>s.at<referred.duration&&(i===0||s.at>=referred.slots[i-1].at))).toBe(true);
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
    expect(validateCozySchedule({...valid,slots:[valid.slots[0],{...valid.slots[1],at:10}]}).slots).toHaveLength(2);
    for(const invalid of [{...valid,duration:180.03},{...valid,grace:.03},{...valid,preparation:.03},{...valid,preparation:-1},{...valid,slots:[{...valid.slots[0],at:179.99}]},{...valid,slots:[{...valid.slots[0],at:10.05},{...valid.slots[1],at:10}]}])expect(()=>validateCozySchedule(invalid)).toThrow();
  });
});
