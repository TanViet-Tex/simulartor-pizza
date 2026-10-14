import {describe,expect,it} from 'vitest';
import {CozyRuntime,type CozyScheduleDependencies} from './CozyRuntime';

const dependencies:CozyScheduleDependencies={eventSeed:321,eventRoll:()=>1,vipRoll:()=>1,resolveRecipe:()=> 'cheese',schedule:day=>({day,duration:180,grace:120,slots:Array.from({length:day===1?1:2},(_,i)=>({id:`review-${day}-${i}`,at:i*20,kind:'regular',opportunity:'commercial',commercialOrdinal:i+1,takeaway:true}))})};
function advance(runtime:CozyRuntime,seconds:number){runtime.advanceElapsed(seconds*1000);}
function deliver(runtime:CozyRuntime){
  for(const ingredient of ['dough','sauce','cheese'] as const)expect(runtime.dispatch({type:'ingredient',ingredient})).toBe(true);
  expect(runtime.dispatch({type:'bake'})).toBe(true);advance(runtime,4);
  for(const type of ['extract','box','deliver'] as const)expect(runtime.dispatch({type})).toBe(true);
  expect(runtime.continueShift()).toBe(true);
}
function twoDays(){
  const runtime=new CozyRuntime(false,true,dependencies);expect(runtime.claimTestCode('VIETVUIVE')).toBe(true);
  for(const ingredient of ['dough','sauce','cheese'] as const)expect(runtime.buy(ingredient,3)).toBe(true);
  expect(runtime.openShop()).toBe(true);advance(runtime,5);deliver(runtime);expect(runtime.closeDay()).toBe(true);
  for(const ingredient of ['dough','sauce','cheese'] as const)expect(runtime.buy(ingredient,3)).toBe(true);
  expect(runtime.openNextDay()).toBe(true);advance(runtime,5);if(runtime.lotteryPending)expect(runtime.resolveLottery(0)).toBe(true);
  deliver(runtime);advance(runtime,20);expect(runtime.closeDay()).toBe(true);
  return runtime;
}
describe('campaign review history',()=>{
  it('has an honest empty history before any customer outcome',()=>{
    const runtime=new CozyRuntime(false,true,dependencies);
    expect(runtime.reviewHistory).toEqual({reviews:[],total:0,rating:null});expect(runtime.latestDayReport).toBeNull();
  });
  it('includes active reviews, weights all customer reviews, and never duplicates settlement',()=>{
    const runtime=new CozyRuntime(false,true,dependencies);runtime.claimTestCode('VIETVUIVE');
    for(const ingredient of ['dough','sauce','cheese'] as const)runtime.buy(ingredient,2);
    runtime.openShop();advance(runtime,5);deliver(runtime);
    expect(runtime.reviewHistory).toMatchObject({total:1,rating:5});
    const active=runtime.reviewHistory;expect(runtime.closeDay()).toBe(true);expect(runtime.reviewHistory).toEqual(active);
    expect(runtime.closeDay()).toBe(false);expect(runtime.reviewHistory).toEqual(active);
    const complete=twoDays(),reports=complete.completedReports;
    expect(reports.map(report=>report.reviews.length)).toEqual([1,2]);
    expect(reports.map(report=>report.rating)).toEqual([5,3]);
    expect(complete.reviewHistory).toEqual({reviews:reports.flatMap(report=>report.reviews),total:3,rating:11/3});
    expect(complete.closeDay()).toBe(false);expect(complete.reviewHistory.total).toBe(3);
  });
  it('restores old checkpoint reports repeatedly and preserves last-day profit during preparation purchases',()=>{
    let runtime=twoDays();const history=runtime.reviewHistory,report=runtime.latestDayReport!;
    for(let reload=0;reload<3;reload++){
      runtime=CozyRuntime.restoreCheckpoint(runtime.exportCheckpoint(),false,dependencies)!;
      expect(runtime).not.toBeNull();expect(runtime.daySummary).toBeNull();expect(runtime.day).toBe(3);
      expect(runtime.reviewHistory).toEqual(history);expect(runtime.latestDayReport).toEqual(report);
      const cash=runtime.state.cash;expect(runtime.buy('dough',1)).toBe(true);expect(runtime.state.cash).toBeLessThan(cash);
      expect(runtime.latestDayReport!.profit).toBe(report.profit);expect(runtime.latestDayReport!.accounts).toEqual(report.accounts);
    }
  });
  it('returns independent review and report snapshots including nested reasons',()=>{
    const runtime=twoDays(),history=runtime.reviewHistory,report=runtime.latestDayReport!;
    const exposed=runtime.reviewHistory;exposed.reviews[0].name='Changed';(exposed.reviews[0].reasons as string[]).push('Changed');exposed.reviews.pop();
    const exposedReport=runtime.latestDayReport!;exposedReport.profit=123456;exposedReport.accounts.profit=123456;(exposedReport.reviews[0].reasons as string[]).push('Changed');
    expect(runtime.reviewHistory).toEqual(history);expect(runtime.latestDayReport).toEqual(report);
  });
});
