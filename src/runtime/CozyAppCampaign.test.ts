import {describe,it,expect} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {CozyCampaignSession} from './CozyCampaignSession';
import {COZY_CONTENT_VERSION,COZY_SCHEMA_VERSION,validateCozyCheckpoint} from '../domain/CozyCheckpoint';
import {validateServices,emptyServices,serviceCostForDay} from '../domain/ServiceCheckpoint';
import {threeDaySchedule} from '../config/cozySchedule';
import {deliverySchedule,type DeliveryScheduleSlot} from '../config/deliveryEvents';
import {shopSchedule} from '../domain/ShopSchedule';
import {reduceShopTraffic} from '../domain/ShopTraffic';
import {advertisedVisitors} from '../domain/Advertising';
import {checkpointChecksum,saveFailure,type CozySaveEnvelope,type CozySavePort,type CozyWriteRequest} from '../infrastructure/CozySaveRepository';

function preparation(day=5,funded=true){
 let r=new CozyRuntime(false,true,{eventSeed:42,eventRoll:()=>1});
 if(funded)r.claimTestCode('VIETVUIVE');
 for(let d=1;d<day;d++){expect(d===1?r.openShop():r.openNextDay()).toBe(true);expect(r.closeDay()).toBe(true);}
 return r;
}

describe('one-day app campaign',()=>{
 it('appends rounded app opportunities and preserves all existing slot metadata, timings and counter bonuses',()=>{
  for(let day=5;day<=30;day++)for(const seed of [0,42,'campaign'])for(const bonus of [0,.3]){
   const base=threeDaySchedule(day,{customerSeed:seed,regularDay1Stars:5,regularLatestStars:5,helpSucceeded:true,referral:true});
   const ordinary=deliverySchedule(base,true),promoted=deliverySchedule(base,true,true);
   const apps=ordinary.slots.filter(s=>(s as DeliveryScheduleSlot).source==='app');
   expect(promoted.slots.filter(s=>(s as DeliveryScheduleSlot).source==='app')).toHaveLength(Math.round(apps.length*1.5));
   for(const slot of ordinary.slots)expect(promoted.slots).toContainEqual(slot);
   const counter=(schedule:typeof base)=>schedule.slots.filter(s=>(s as DeliveryScheduleSlot).source!=='app');
   const normalWithBonus=shopSchedule(ordinary,bonus),promotedWithBonus=shopSchedule(promoted,bonus);
   const ordinals=promotedWithBonus.slots.map(slot=>slot.commercialOrdinal).filter(ordinal=>ordinal!==null);
   expect(new Set(ordinals).size).toBe(ordinals.length);
   for(const slot of normalWithBonus.slots)expect(promotedWithBonus.slots).toContainEqual(slot);
   const normalFinal=reduceShopTraffic(normalWithBonus),promotedFinal=reduceShopTraffic(promotedWithBonus);
   expect(counter(promotedFinal)).toEqual(counter(normalFinal));
   expect(promotedFinal.slots.filter(s=>(s as DeliveryScheduleSlot).source==='app')).toHaveLength(day>=6&&(day-6)%4===0?5:3);
   expect(promoted.slots.every(s=>s.at<base.duration&&Math.abs(s.at*20-Math.round(s.at*20))<1e-8)).toBe(true);
   expect(new Set(promoted.slots.map(s=>s.id)).size).toBe(promoted.slots.length);
  }
 });
 it.each([1,4,31])('ignores a campaign schedule flag outside the approved days (%i)',day=>{
  const base=threeDaySchedule(day,{regularDay1Stars:null,regularLatestStars:null,helpSucceeded:false,referral:false});
  expect(deliverySchedule(base,true,true)).toEqual(deliverySchedule(base,true));
  expect(deliverySchedule(base,false,true)).toEqual(deliverySchedule(base,false));
 });
 it('buys once, restores forecast/cash, toggles without refund and accounts for cost once on close',()=>{
  const r=preparation();expect(r.configureDeliveryApp(true,'on')).toBe(true);
  const before=r.appCampaignState.forecast,cash=r.state.cash;
  expect(before.appOrders).toBe(2);expect(r.buyAppCampaign('campaign')).toBe(true);
  expect(r.state.cash).toBe(cash-100);expect(r.buyAppCampaign('campaign')).toBe(false);expect(r.buyAppCampaign('other')).toBe(false);
  expect(r.appCampaignState.forecast).toMatchObject({appOrders:3,shopVisits:before.shopVisits});
  const forecast=r.marketForecast,saved=r.exportCheckpoint(),restored=CozyRuntime.restoreCheckpoint(saved)!;
  expect(restored.marketForecast).toEqual(forecast);expect(restored.state.cash).toBe(cash-100);expect(restored.appCampaignState.bought).toBe(true);
  expect(r.configureDeliveryApp(false,'off')).toBe(true);expect(r.appCampaignState.bought).toBe(true);expect(r.appCampaignState.forecast.appOrders).toBe(0);expect(r.state.cash).toBe(cash-100);
  expect(r.configureDeliveryApp(true,'on-again')).toBe(true);expect(r.marketForecast).toEqual(forecast);
  expect(r.openNextDay()).toBe(true);expect(advertisedVisitors((r as any).schedule)).toEqual(restored.appCampaignState.forecast);expect(r.buyAppCampaign('midshift')).toBe(false);
  expect(r.closeDay()).toBe(true);expect(r.daySummary!.accounts.serviceCosts).toBe(100);expect(r.daySummary!.accounts.other).toBe(100);
  expect(validateCozyCheckpoint(r.exportCheckpoint())).not.toBeNull();expect(CozyRuntime.restoreCheckpoint(r.exportCheckpoint())!.state.cash).toBe(r.state.cash);
  expect(r.appCampaignState.bought).toBe(false);expect(r.appCampaignState.forecast.appOrders).toBe(3); // rainy base
  const expiredCheckpoint=r.exportCheckpoint(),expired=CozyRuntime.restoreCheckpoint(expiredCheckpoint)!;
  expect(expiredCheckpoint.services!.appCampaignDays).toEqual([5]);expect(expiredCheckpoint.reports[4].accounts.serviceCosts).toBe(100);
  expect(expired.state.cash).toBe(r.state.cash);expect(expired.appCampaignState.bought).toBe(false);expect(expired.appCampaignState.forecast.appOrders).toBe(3);
  expect(expired.exportCheckpoint().services!.appCampaignDays).toEqual([5]);expect(expired.completedReports[4].accounts.serviceCosts).toBe(100);
  expect(r.buyAppCampaign('next-day')).toBe(true);expect(r.appCampaignState.forecast.appOrders).toBe(5);
 });
 it('closes and restores the purchased last day with its cost and no further purchase',()=>{
  const r=preparation(30);expect(r.configureDeliveryApp(true,'on')).toBe(true);expect(r.buyAppCampaign('last-day')).toBe(true);
  expect(r.openNextDay()).toBe(true);expect(r.closeDay()).toBe(true);expect(r.daySummary!.ending).toBe('complete');expect(r.daySummary!.accounts.serviceCosts).toBe(100);
  const checkpoint=r.exportCheckpoint();expect(checkpoint).toMatchObject({day:30,terminal:true,services:{appCampaignDays:[30]}});
  const restored=CozyRuntime.restoreCheckpoint(checkpoint)!;expect(restored.completedReports[29].accounts.serviceCosts).toBe(100);expect(restored.state.cash).toBe(r.state.cash);
  expect(restored.buyAppCampaign('after-terminal')).toBe(false);expect(restored.openNextDay()).toBe(false);expect(restored.exportCheckpoint()).toEqual(checkpoint);
 });
 it('rejects locked/disabled/unaffordable/invalid/active-shift/reused purchases without mutation',()=>{
  const early=preparation(4);const earlyCash=early.state.cash;expect(early.buyAppCampaign('locked')).toBe(false);expect(early.state.cash).toBe(earlyCash);
  const r=preparation(),cash=r.state.cash;expect(r.buyAppCampaign('disabled')).toBe(false);expect(r.state.cash).toBe(cash);
  r.configureDeliveryApp(true,'on');expect(r.buyAppCampaign('')).toBe(false);expect(r.buyAppCampaign('   ')).toBe(false);
  expect(r.buyShopItem('table-plant','shared')).toBe(true);const after=r.exportCheckpoint();expect(r.buyAppCampaign('shared')).toBe(false);expect(r.exportCheckpoint()).toEqual(after);
  const poor=preparation(5,false);poor.configureDeliveryApp(true,'on');while(poor.state.cash>=poor.price('sauce'))poor.buy('sauce',1);
  const poorSave=poor.exportCheckpoint();expect(poor.buyAppCampaign('poor')).toBe(false);expect(poor.exportCheckpoint()).toEqual(poorSave);
  const late=preparation(30);late.configureDeliveryApp(true,'on');expect(late.buyAppCampaign('last-day')).toBe(true);
  // Legacy campaigns can contain a preparation boundary above day30. Exercise its guard directly.
  (late as any).currentDay=31;(late as any).phase='preparation';const lateCash=late.state.cash;
  expect(late.buyAppCampaign('late')).toBe(false);expect(late.state.cash).toBe(lateCash);expect((late as any).services.appCampaignDays).toEqual([30]);
  expect(r.openNextDay()).toBe(true);const activeCash=r.state.cash;expect(r.buyAppCampaign('active')).toBe(false);expect(r.state.cash).toBe(activeCash);
 });
 it('accepts old receipts and rejects malformed, duplicate, future and out-of-bounds days',()=>{
  const old={advertisingDays:[],lottery:null,lotteryPrizeClaimed:false};expect(validateServices(old,42,5,false)).toEqual(old);
  expect(validateServices(undefined,42,5,false)).toEqual(emptyServices());
  for(const value of [null,'5',[4],[31],[6],[5,5],[5.1],[-1]])expect(validateServices({...old,appCampaignDays:value},42,5,false)).toBeNull();
  expect(serviceCostForDay({...old,advertisingDays:[5],appCampaignDays:[5]},5)).toBe(200);
  const r=preparation(),checkpoint=r.exportCheckpoint();delete checkpoint.services!.appCampaignDays;expect(CozyRuntime.restoreCheckpoint(checkpoint)).not.toBeNull();
  checkpoint.services!.appCampaignDays=[5];expect(validateCozyCheckpoint(checkpoint)).toBeNull(); // no corresponding cash debit
 });
 it('stages silently, fails without live cash/receipt changes, and retries identical candidate exactly once',async()=>{
  const r=preparation();r.configureDeliveryApp(true,'on');const payload=r.exportCheckpoint();
  let envelope:CozySaveEnvelope={schemaVersion:COZY_SCHEMA_VERSION,contentVersion:COZY_CONTENT_VERSION,campaignId:'app-campaign',commitId:'initial',revision:1,checksum:checkpointChecksum(payload),payload};
  let fail=true;const requests:CozyWriteRequest[]=[];
  const port:CozySavePort={load:async()=>({ok:true,kind:'loaded',envelope,replacementToken:'test'}),commit:async request=>{requests.push(structuredClone(request));if(fail)return saveFailure('write-failed');envelope={...envelope,commitId:request.commitId,revision:envelope.revision+1,payload:structuredClone(request.payload),checksum:checkpointChecksum(request.payload)};return {ok:true,envelope};}};
  let id=0;const session=new CozyCampaignSession(port,()=>`app-${++id}`),live=(await session.load())!,cash=live.state.cash;
  expect(session.buyAppCampaign('campaign')).toBe(true);expect(session.savingPreparation).toBe(true);expect(session.buyAppCampaign('double')).toBe(false);
  expect(live.appCampaignState.bought).toBe(false);expect(live.state.cash).toBe(cash);
  await new Promise(resolve=>setTimeout(resolve,0));expect(session.view.state).toBe('error');expect(live.state.cash).toBe(cash);expect(live.appCampaignState.bought).toBe(false);
  const reloaded=(await new CozyCampaignSession(port).load())!;expect(reloaded.state.cash).toBe(cash);expect(reloaded.appCampaignState.bought).toBe(false);expect(reloaded.exportCheckpoint().services!.appCampaignDays??[]).not.toContain(5);
  fail=false;await session.retry();expect(requests[1]).toEqual(requests[0]);expect(session.runtime).toBe(live);expect(live.state.cash).toBe(cash-100);expect(live.appCampaignState.bought).toBe(true);expect(session.buyAppCampaign('again')).toBe(false);
  expect((await new CozyCampaignSession(port).load())!.appCampaignState.bought).toBe(true);
 });
});
