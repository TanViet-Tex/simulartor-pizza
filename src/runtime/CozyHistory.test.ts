import {expect,it} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {expandCozyReport,validateCozyCheckpoint} from '../domain/CozyCheckpoint';
import type {ScheduleFactory} from '../config/cozySchedule';

const schedule:ScheduleFactory=day=>({day,duration:240,grace:120,slots:[{id:`day-${day}-one`,at:0,kind:'picky',opportunity:'commercial',commercialOrdinal:1,takeaway:true}]});
it('rejects inconsistent expanded history before normalization using a real legacy unlocked save',async()=>{
 const fsModule:string='node:fs';const {readFileSync}:{readFileSync:(path:string,encoding:string)=>string}=await import(fsModule);
 const fixtures=JSON.parse(readFileSync('tests/fixtures/epic5-legacy.json','utf8'));
 const runtime=CozyRuntime.restoreCheckpoint(fixtures.sausageUnlocked)!;
 expect(runtime.openShop()).toBe(true);expect(runtime.closeDay()).toBe(true);
 const input=runtime.exportCheckpoint();input.reports=input.reports.map(report=>expandCozyReport(report,input.progression));
 const normalized=validateCozyCheckpoint(input)!;expect(normalized).not.toBeNull();expect(validateCozyCheckpoint(normalized)).not.toBeNull();expect(()=>CozyRuntime.restoreCheckpoint(normalized)!.exportCheckpoint()).not.toThrow();
 const wrongUnlock=structuredClone(input);wrongUnlock.reports[0].progression.unlockDay=3;expect(validateCozyCheckpoint(wrongUnlock)).toBeNull();
 const extraOutcome=structuredClone(input);extraOutcome.reports[0].progression.outcomes.push('cozy-999');expect(validateCozyCheckpoint(extraOutcome)).toBeNull();
 const wrongPrefix=structuredClone(input);wrongPrefix.reports[0].progression.outcomes[0]='cozy-999';expect(validateCozyCheckpoint(wrongPrefix)).toBeNull();
 const extraClaim=structuredClone(input);extraClaim.reports[0].progression.claims.push('goal.day-2');expect(validateCozyCheckpoint(extraClaim)).toBeNull();
});
it('stores 30 real completed days with linear history and restores readable historical progression',()=>{
 const r=new CozyRuntime(false,true,{schedule});r.configureMenu('mushroom',100,false);let at15=0;
 for(let day=1;day<=30;day++){
  for(const ingredient of ['dough','sauce','cheese'] as const)expect(r.buy(ingredient,1)).toBe(true);
  expect(day===1?r.openShop():r.openNextDay()).toBe(true);
  for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});
  expect(r.dispatch({type:'bake'})).toBe(true);for(let tick=0;tick<140;tick++)r.advance(50);
  expect(r.dispatch({type:'extract'})).toBe(true);expect(r.dispatch({type:'box'})).toBe(true);
  expect(r.dispatch({type:'deliver',commandId:`deliver-${day}`})).toBe(true);r.continueShift();expect(r.closeDay()).toBe(true);
  if(day===15)at15=JSON.stringify(r.exportCheckpoint()).length;
 }
 const checkpoint=r.exportCheckpoint(),size=JSON.stringify(checkpoint).length;
 expect(size).toBeLessThan(at15*2.2);expect(size).toBeLessThan(1000000);
 expect(checkpoint.reports.every(report=>report.progressionArchive&&report.progression.outcomes.length===0&&report.progression.claims.length===0&&report.progression.goals.length===1)).toBe(true);
 expect(checkpoint.reports[14].progressionArchive?.outcomeCount).toBe(15);
 const loaded=CozyRuntime.restoreCheckpoint(checkpoint)!;expect(loaded.day).toBe(30);
 const history=loaded.completedReports;expect(history[14].progression.outcomes).toHaveLength(15);expect(history[14].progression.goals).toHaveLength(15);expect(history[14].progression.xp).toBe(245);
 expect(history[0].progression.outcomes).toHaveLength(1);history[0].progression.outcomes.push('fake');expect(loaded.completedReports[0].progression.outcomes).toHaveLength(1);
 const badCount=structuredClone(checkpoint);badCount.reports[20].progressionArchive!.outcomeCount++;expect(validateCozyCheckpoint(badCount)).toBeNull();
 const badXp=structuredClone(checkpoint);badXp.reports[20].progression.xp++;expect(validateCozyCheckpoint(badXp)).toBeNull();
 const badGoal=structuredClone(checkpoint);badGoal.reports[20].goal.stats.sales++;expect(validateCozyCheckpoint(badGoal)).toBeNull();
});
