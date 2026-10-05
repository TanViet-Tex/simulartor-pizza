import {describe,it,expect} from 'vitest';
import {VIP_RULES} from '../config/vipCustomers';
import {isVipArrival,vipCustomerRoll} from '../domain/VipCustomers';
import {validateCozyCheckpoint} from '../domain/CozyCheckpoint';
import {CozyRuntime,type CozyScheduleDependencies} from './CozyRuntime';
import {fundedShopCheckpoint} from './shopTestFixture';

const schedule:CozyScheduleDependencies['schedule']=day=>({day,duration:240,grace:120,slots:Array.from({length:6},(_,i)=>({id:`vip-${day}-${i}`,at:i*10,kind:'picky',opportunity:'commercial',commercialOrdinal:i+1,takeaway:true}))});
function prepare(day=10,extra:CozyScheduleDependencies={}){
  let r=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint(8000),false,{vipRoll:()=>1,eventRoll:()=>1})!;
  while(r.preparationDay<day){expect(r.openShop()).toBe(true);expect(r.closeDay()).toBe(true);r=CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,{vipRoll:()=>1,eventRoll:()=>1})!;}
  return CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,{schedule,vipRoll:()=>0,eventRoll:()=>1,...extra})!;
}
function tick(r:CozyRuntime,seconds:number){for(let i=0;i<seconds*20;i++)r.advance(50);}
function serve(r:CozyRuntime,quality:'good'|'raw'|'burnt'='good',wrong=false){
  for(const id of ['dough','sauce',wrong?'mushroom':'cheese'] as const)expect(r.dispatch({type:'ingredient',ingredient:id})).toBe(true);
  expect(r.dispatch({type:'bake'})).toBe(true);tick(r,quality==='raw'?1:quality==='burnt'?12:7);
  if(quality!=='burnt')expect(r.dispatch({type:'extract'})).toBe(true);
  if(quality==='good')expect(r.dispatch({type:'box'})).toBe(true);expect(r.dispatch({type:'deliver',commandId:'deliver-'+r.selectedTicketId})).toBe(true);
  if(r.deliveryPending)expect(r.confirmDelivery()).toBe(true);
}
describe('Repeatable VIP customers',()=>{
  it('uses exact 10% from day10 and immutable slot-channel rolls',()=>{
    expect(VIP_RULES).toEqual({opensDay:10,probability:.1,quantity:1,patience:100,rewardCoins:500,reputation:2});
    expect(isVipArrival(48,9,'one',()=>0)).toBe(false);
    expect(isVipArrival(48,10,'one',()=>.099999)).toBe(true);
    for(const value of [.1,1,-1,NaN])expect(isVipArrival(48,10,'one',()=>value)).toBe(false);
    expect(vipCustomerRoll(48,10,'one')).toBe(vipCustomerRoll(48,10,'one'));
    const rolls=Array.from({length:10000},(_,i)=>vipCustomerRoll(48,10,'slot-'+i));
    expect(rolls.filter(r=>r<.1).length).toBeGreaterThan(850);expect(rolls.filter(r=>r<.1).length).toBeLessThan(1150);
  });
  it('supports multiple VIPs, ordinary XP, cash rewards and checkpoint restore exactly once',()=>{
    const r=prepare();for(const id of ['dough','sauce','cheese'] as const)r.buy(id,2);
    const before=r.state.cash,xp=r.progression.xp;r.openShop();expect(r.selectedTicket).toMatchObject({vip:true,quantity:1,patience:100,kindLabel:'VIP'});
    serve(r);expect(r.lastResult).toMatchObject({vip:true,vipRewardCoins:500,xpDelta:15});expect(r.state.cash).toBe(before+550);
    expect(r.dispatch({type:'deliver',commandId:'again'})).toBe(false);expect(r.state.cash).toBe(before+550);
    r.continueShift();tick(r,3);expect(r.selectedTicket?.vip).toBe(true);serve(r);r.continueShift();r.closeDay();
    expect(r.daySummary!.reviews.filter(v=>v.vip?.coins===500)).toHaveLength(2);expect(r.daySummary!.revenue).toBe(100);expect(r.daySummary!.rewards).toBe(1000);
    expect(r.progression.xp-xp).toBe(30);const saved=r.exportCheckpoint();expect(validateCozyCheckpoint(saved)).not.toBeNull();
    const restored=CozyRuntime.restoreCheckpoint(saved)!;expect(restored.state.cash).toBe(r.state.cash);expect(restored.closeDay()).toBe(false);expect(restored.exportCheckpoint()).toEqual(saved);
    const forged=structuredClone(saved);forged.reports[forged.reports.length-1].reviews[0].vip!.coins=1000;expect(validateCozyCheckpoint(forged)).toBeNull();
  });
  it.each(['raw','burnt','wrong'] as const)('does not reward %s pizza',quality=>{
    const r=prepare();for(const id of ['dough','sauce','cheese','mushroom'] as const)r.buy(id,1);r.openShop();serve(r,quality==='wrong'?'good':quality,quality==='wrong');
    expect(r.lastResult).toMatchObject({vip:true,vipRewardCoins:0,vipRewardReputation:0});r.closeDay();expect(validateCozyCheckpoint(r.exportCheckpoint())).not.toBeNull();
  });
  it('expires at100s, freezes with pause, and never exceeds four slots',()=>{
    const r=prepare();r.openShop();const lease=r.acquirePause('user');tick(r,10);expect(r.selectedTicket!.remaining).toBe(100);lease.release();tick(r,50);expect(r.tickets).toHaveLength(4);expect(r.tickets.every(t=>t.vip&&t.quantity===1)).toBe(true);
    tick(r,50);r.closeDay();expect(r.daySummary!.reviews[0]).toMatchObject({outcome:'expired',vip:{coins:0,reputation:0,onTime:false}});expect(validateCozyCheckpoint(r.exportCheckpoint())).not.toBeNull();
  });
  it('keeps day9 ordinary and app orders excluded; caps reputation while late good delivery still qualifies',()=>{
    const early=prepare(9);early.openShop();expect(early.selectedTicket?.vip).toBe(false);
    const app=prepare(10,{schedule:day=>({day,duration:240,grace:120,slots:[{id:'app-slot',at:0,kind:'picky',opportunity:'commercial',commercialOrdinal:1,takeaway:true,source:'app'}]})});app.configureDeliveryApp(true,'enabled');app.openShop();expect(app.selectedTicket).toMatchObject({source:'app',vip:false});
    const r=prepare();for(const id of ['dough','sauce','cheese'] as const)r.buy(id,1);r.openShop();tick(r,60);serve(r);expect(r.lastResult?.vipRewardCoins).toBe(500);expect(r.customerProgress.reputation).toBeLessThanOrEqual(100);expect(r.lastResult?.vipRewardReputation).toBeLessThanOrEqual(2);r.closeDay();expect(validateCozyCheckpoint(r.exportCheckpoint())).not.toBeNull();
  });
  it.each([29,30])('keeps VIP active on day%s without changing final-day rules',day=>{
    const r=prepare(day);r.openShop();expect(r.selectedTicket?.vip).toBe(true);r.closeDay();expect(r.daySummary!.ending).toBe(day===30?'complete':null);expect(validateCozyCheckpoint(r.exportCheckpoint())).not.toBeNull();
  });
  it('recovers negative event cash by a qualified VIP without changing salary or revenue rules',()=>{
    const r=prepare(10,{eventRoll:()=>0});for(const id of ['dough','sauce','cheese'] as const)r.buy(id,1);
    while(r.state.cash>150){const quantity=Math.min(100,Math.floor((r.state.cash-150)/r.price('dough')));if(!quantity)break;expect(r.buy('dough',quantity)).toBe(true);}
    const before=r.state.cash;r.openShop();expect(r.state.cash).toBe(before-200);serve(r);expect(r.state.cash).toBe(before-200+550);r.closeDay();const report=r.daySummary!;
    expect(report.accounts.eventLoss).toBe(200);expect(report.rewards).toBe(500);expect(report.revenue).toBe(50);expect(validateCozyCheckpoint(r.exportCheckpoint())).not.toBeNull();
  });
  it('preserves old report explanation text and legacy rewards rather than inserting VIP history',()=>{
    const old=fundedShopCheckpoint(8000);old.reports[0].accounts.zeroReasons.rewards='Lời giải thích lịch sử.';
    const normalized=validateCozyCheckpoint(old)!;expect(normalized.reports[0].accounts.zeroReasons.rewards).toBe('Lời giải thích lịch sử.');expect(normalized.reports[0].reviews.every(review=>review.vip===undefined)).toBe(true);
  });
  it('keeps the accepted returning customer identity when their arrival becomes VIP',()=>{
    const prepared=prepare().exportCheckpoint();prepared.customerMemory.accepted=[149];
    const r=CozyRuntime.restoreCheckpoint(prepared,false,{vipRoll:()=>0,eventRoll:()=>1,schedule:day=>({day,duration:240,grace:120,slots:[{id:'returning-vip',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:true}]})})!;
    r.openShop();expect(r.selectedTicket).toMatchObject({vip:true,avatarIndex:149,kind:'picky',patience:100});
  });
});
