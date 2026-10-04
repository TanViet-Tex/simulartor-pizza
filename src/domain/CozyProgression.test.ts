import {describe,it,expect} from 'vitest';
import {CozyProgression,progressionLevel} from './CozyProgression';
const stats=(delivered=0,sales=0,stars:number[]=[])=>({delivered,sales,stars});
describe('commercial progression',()=>{
  it('grants actual XP once; help and invalid outcomes give none',()=>{
    const p=new CozyProgression();expect(p.recordDelivery({id:'A',day:1,stars:3,qualifyingCheese:true,commercial:true}).xp).toBe(10);
    expect(p.recordDelivery({id:'B',day:1,stars:4,qualifyingCheese:false,commercial:true}).xp).toBe(15);
    for(const input of [{id:'A',day:1,stars:5,commercial:true},{id:'help',day:1,stars:5,commercial:false},{id:'future',day:2,stars:5,commercial:true},{id:'invalid',day:1,stars:NaN,commercial:true}])expect(p.recordDelivery({...input,qualifyingCheese:true}).accepted).toBe(false);
    expect(p.snapshot).toMatchObject({xp:25,cheeseSales:1,outcomes:['A','B']});
  });
  it('resolves daily goals independently and excludes rewards from revenue',()=>{
    const p=new CozyProgression();expect(p.closeDay(1,stats(3,150,[5,5,5]))).toMatchObject({coins:20,xp:10});
    expect(p.closeDay(1,stats(3,150,[5,5,5])).accepted).toBe(false);
    expect(p.closeDay(2,stats(4,199,[5,5,5,5])).coins).toBe(0);
    expect(p.closeDay(3,stats(2,100,[5,5,2])).coins).toBe(20);
    expect(p.snapshot.goals.map(g=>g.status)).toEqual(['completed','expired','completed']);expect(p.snapshot.mission).toBe('active');
  });
  it('checks daily threshold edges and failed goals never block later days',()=>{
    const p=new CozyProgression();expect(p.closeDay(1,stats(2,100,[5,5])).coins).toBe(0);
    expect(p.closeDay(2,stats(4,200,[5,5,5,5])).coins).toBe(20);
    expect(p.closeDay(3,stats(3,100,[5,4,2])).coins).toBe(0);expect(p.snapshot.goals[2].status).toBe('expired');
  });
  it('claims eight cheese sales once, preserves IDs through detached round-trip',()=>{
    const p=new CozyProgression();for(let i=1;i<=7;i++)expect(p.recordDelivery({id:String(i),day:1,stars:5,qualifyingCheese:true,commercial:true}).coins).toBe(0);
    expect(p.recordDelivery({id:'8',day:1,stars:5,qualifyingCheese:true,commercial:true})).toMatchObject({coins:30,xp:35,reputation:2,claims:['mission.cheese-8']});
    const snapshot=p.snapshot,restored=CozyProgression.restore(snapshot)!;snapshot.claims=[];snapshot.xp=999;
    expect(restored.snapshot.xp).toBe(140);expect(restored.recordDelivery({id:'8',day:1,stars:5,qualifyingCheese:true,commercial:true}).accepted).toBe(false);
    expect(restored.recordDelivery({id:'9',day:1,stars:5,qualifyingCheese:true,commercial:true}).coins).toBe(0);expect(restored.snapshot.xp).toBe(155);expect(restored.level).toBe(3);
  });
  it('delays level-two recipe until the next day and retains XP over level three',()=>{
    const p=new CozyProgression();for(let i=0;i<6;i++)p.recordDelivery({id:String(i),day:1,stars:3,qualifyingCheese:false,commercial:true});
    expect(p.snapshot).toMatchObject({xp:60,unlockDay:2});expect(p.level).toBe(2);expect(p.recipeAvailable('sausage',1)).toBe(false);expect(p.recipeAvailable('sausage',2)).toBe(true);expect(p.recipeAvailable('sausage',4)).toBe(true);
    expect([0,59,60,149,150,300].map(progressionLevel)).toEqual([1,1,2,2,3,3]);
  });
  it('rejects corrupt claims/unlock/goals and prevents late delivery after close',()=>{
    const p=new CozyProgression();p.closeDay(1,stats());const s=p.snapshot;
    expect(p.recordDelivery({id:'late',day:1,stars:5,qualifyingCheese:true,commercial:true}).accepted).toBe(false);
    for(const x of [null,{...s,xp:-1},{...s,claims:['goal.day-1']},{...s,unlockDay:2},{...s,outcomes:['A','A']},{...s,mission:'completed'},{...s,goals:[{...s.goals[0],day:2}]}])expect(CozyProgression.restore(x)).toBeNull();
    expect(CozyProgression.restore(s)!.goal(1).status).toBe('expired');
    expect(CozyProgression.restore({...s,xp:60,unlockDay:2})).toBeNull();
    const legal=new CozyProgression();for(let i=0;i<4;i++)legal.recordDelivery({id:String(i),day:1,stars:5,qualifyingCheese:false,commercial:true});
    expect(CozyProgression.restore({...legal.snapshot,unlockDay:3})).toBeNull();
  });
});
