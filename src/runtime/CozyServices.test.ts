import {describe,it,expect} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {validateCozyCheckpoint} from '../domain/CozyCheckpoint';
import {lotteryMissionDay} from '../domain/LotteryMission';
import {CozyCampaignSession} from './CozyCampaignSession';
import {COZY_CONTENT_VERSION,COZY_SCHEMA_VERSION} from '../domain/CozyCheckpoint';
import {checkpointChecksum,saveFailure,type CozySaveEnvelope,type CozySavePort,type CozyWriteRequest} from '../infrastructure/CozySaveRepository';

function fresh(seed=42){const r=new CozyRuntime(false,true,{eventSeed:seed});r.claimTestCode('VIETVUIVE');return r;}
function goTo(r:CozyRuntime,day:number){for(let d=1;d<day;d++){expect(d===1?r.openShop():r.openNextDay()).toBe(true);expect(r.closeDay()).toBe(true);}}

describe('advertising and lottery integration',()=>{
 it('allows a free decline even when a campaign loss made cash negative',()=>{
  let seed=1;while(lotteryMissionDay(seed)!==3)seed++;
  const r=new CozyRuntime(false,true,{eventSeed:seed,eventRoll:(_seed,day)=>day===3?0:1});goTo(r,3);
  r.buy('sauce',Math.min(100,Math.floor(r.state.cash/r.price('sauce'))));
  expect(r.openNextDay()).toBe(true);expect(r.state.cash).toBeLessThan(0);r.advanceElapsed(5000);
  expect(r.lotteryPending).not.toBeNull();const cash=r.state.cash;
  expect(r.resolveLottery(0)).toBe(true);expect(r.state.cash).toBe(cash);expect(r.pauses).not.toContain('lottery');
 });
 it('charges advertising once, preserves budget and persists the purchased forecast',()=>{
  const r=fresh(),cash=r.state.cash,before=r.marketForecast;
  expect(r.advertisingState.forecast).toBeNull();expect(r.buyAdvertising('ad')).toBe(true);
  expect(r.state.cash).toBe(cash-100);expect(r.buyAdvertising('ad-again')).toBe(false);
  expect(r.marketForecast).toEqual(before);const forecast=r.advertisingState.forecast!;
  expect(forecast.total).toBe(forecast.shopVisits+forecast.appOrders);
  expect(CozyRuntime.restoreCheckpoint(r.exportCheckpoint())!.advertisingState.forecast).toEqual(forecast);
  expect(r.openShop()).toBe(true);expect(r.buyAdvertising('midshift')).toBe(false);expect(r.closeDay()).toBe(true);
  expect(r.daySummary!.accounts.serviceCosts).toBe(100);expect(r.daySummary!.accounts.other).toBe(100);
  expect(validateCozyCheckpoint(r.exportCheckpoint())).not.toBeNull();
 });
 it.each([5,10,20])('purchases %i tickets and claims their guaranteed prize only once at day end',count=>{
  const seed=42,r=fresh(seed),day=lotteryMissionDay(seed);goTo(r,day);
  expect(r.openNextDay()).toBe(true);expect(r.lotteryPending).toBeNull();r.advanceElapsed(5000);
  expect(r.lotteryPending).not.toBeNull();expect(r.pauses).toContain('lottery');const frozen=r.shiftClock,user=r.acquirePause('user');
  r.advanceElapsed(10000);expect(r.shiftClock).toEqual(frozen);expect(r.resolveLottery(count)).toBe(false);user.release();
  const cash=r.state.cash;expect(r.resolveLottery(count)).toBe(true);expect(r.state.cash).toBe(cash-count*30);
  expect(r.pauses).not.toContain('lottery');expect(r.resolveLottery(count)).toBe(false);
  expect(r.closeDay()).toBe(true);expect(r.daySummary!.rewards).toBe(count*300);expect(r.daySummary!.accounts.serviceCosts).toBe(count*30);
  const after=r.state.cash;expect(r.closeDay()).toBe(false);expect(r.state.cash).toBe(after);
  const checkpoint=r.exportCheckpoint();expect(validateCozyCheckpoint(checkpoint)).not.toBeNull();
  const restored=CozyRuntime.restoreCheckpoint(checkpoint)!;expect(restored.state.cash).toBe(after);expect(restored.lotteryPending).toBeNull();
  checkpoint.reports[day-1].rewards+=300;expect(validateCozyCheckpoint(checkpoint)).toBeNull();
 });
 it('declines without a purchase or reward and remembers that choice',()=>{
  const r=fresh(),day=lotteryMissionDay(42);goTo(r,day);r.openNextDay();r.advanceElapsed(5000);
  const cash=r.state.cash;expect(r.resolveLottery(0)).toBe(true);expect(r.state.cash).toBe(cash);r.closeDay();
  expect(r.daySummary!.rewards).toBe(0);expect(CozyRuntime.restoreCheckpoint(r.exportCheckpoint())).not.toBeNull();
 });
 it('refuses unaffordable tickets without a debit or a free prize',()=>{
  let seed=1;while(lotteryMissionDay(seed)!==3)seed++;
  const r=new CozyRuntime(false,true,{eventSeed:seed});goTo(r,3);r.openNextDay();r.advanceElapsed(5000);
  const cash=r.state.cash;expect(cash).toBeLessThan(600);expect(r.resolveLottery(20)).toBe(false);expect(r.state.cash).toBe(cash);expect(r.lotteryPending).not.toBeNull();
  expect(r.resolveLottery(0)).toBe(true);r.closeDay();expect(r.daySummary!.rewards).toBe(0);
 });
 it('publishes the advertisement only after saving and retries the same candidate once',async()=>{
  const r=fresh(),payload=r.exportCheckpoint();
  let envelope:CozySaveEnvelope={schemaVersion:COZY_SCHEMA_VERSION,contentVersion:COZY_CONTENT_VERSION,campaignId:'advertising',commitId:'initial',revision:1,checksum:checkpointChecksum(payload),payload};
  let fail=true;const requests:CozyWriteRequest[]=[];
  const port:CozySavePort={load:async()=>({ok:true,kind:'loaded',envelope,replacementToken:'test'}),commit:async request=>{requests.push(structuredClone(request));if(fail)return saveFailure('write-failed');envelope={...envelope,commitId:request.commitId,revision:envelope.revision+1,payload:structuredClone(request.payload),checksum:checkpointChecksum(request.payload)};return {ok:true,envelope};}};
  let id=0;const session=new CozyCampaignSession(port,()=>`ad-${++id}`),live=(await session.load())!,cash=live.state.cash;
  expect(session.buyAdvertising('advertising')).toBe(true);expect(live.advertisingState.bought).toBe(false);expect(live.state.cash).toBe(cash);
  await new Promise(resolve=>setTimeout(resolve,0));expect(session.view.state).toBe('error');fail=false;await session.retry();
  expect(requests[1]).toEqual(requests[0]);expect(session.runtime).toBe(live);expect(live.state.cash).toBe(cash-100);expect(live.advertisingState.bought).toBe(true);expect(session.buyAdvertising('again')).toBe(false);
 });
});
