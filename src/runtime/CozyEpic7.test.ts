import {describe,it,expect} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {CozyCampaignSession} from './CozyCampaignSession';
import {fundedShopCheckpoint} from './shopTestFixture';
import {shopSchedule} from '../domain/ShopSchedule';
import {threeDaySchedule,validateCozySchedule} from '../config/cozySchedule';
import {SHOP_CATALOG} from '../config/shopCatalog';
import {validateCozyCheckpoint,COZY_SCHEMA_VERSION,COZY_CONTENT_VERSION} from '../domain/CozyCheckpoint';
import {checkpointChecksum,saveFailure,type CozySaveEnvelope,type CozyWriteRequest,type CozySavePort} from '../infrastructure/CozySaveRepository';
describe('Epic7 shop investment',()=>{
 it('buys once without activating; validates ownership and placement, casks without refund, guards the shift',()=>{
  const r=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint())!,cash=r.state.cash;
  expect(r.buyShopItem('table-plant','buy')).toBe(true);expect(r.state.cash).toBe(cash-500);expect(r.shopState.effects.visitors).toBe(0);
  expect(r.buyShopItem('table-plant','duplicate')).toBe(false);expect(r.buyShopItem('wifi','buy')).toBe(false);
  expect(r.placeShopItem('wifi',true,'wrong')).toBe(false);expect(r.placeShopItem('table-plant',true,'place')).toBe(true);
  expect(r.placeShopItem('table-plant',true,'again')).toBe(false);expect(r.shopState.effects.visitors).toBe(.03);
  expect(r.shopItemPreview('table-plant',false).after.visitors).toBe(0);
  expect(r.placeShopItem('table-plant',false,'store')).toBe(true);expect(r.state.cash).toBe(cash-500);expect(r.shopState.acquired).toHaveLength(1);
  expect(SHOP_CATALOG.find(i=>i.id==='customer-tables')).toMatchObject({price:4000,available:true});
  r.openShop();expect(r.buyShopItem('wifi','shift')).toBe(false);expect(r.placeShopItem('table-plant',true,'shift-place')).toBe(false);
  const poor=new CozyRuntime(false,true);expect(poor.buyShopItem('table-plant','poor')).toBe(false);expect(poor.shopItemPreview('table-plant').missing).toBe(200);expect(poor.state.cash).toBe(300);
 });
 it('tables activate only after placement, survive reload and cask without changing capacity',()=>{
  const r=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint(),false,{schedule:day=>({day,duration:180,grace:120,slots:[{id:'counter',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:false}]})})!,cash=r.state.cash;
  expect(r.buyShopItem('customer-tables','tables')).toBe(true);expect(r.state.cash).toBe(cash-4000);
  expect(r.shopState.effects.patience).toBe(0);expect(r.queueCapacity).toBe(4);
  expect(r.placeShopItem('customer-tables',true,'place')).toBe(true);expect(r.shopState.effects.patience).toBe(.10);
  const loaded=CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,{schedule:day=>({day,duration:180,grace:120,slots:[{id:'counter',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:false}]})})!;
  expect(loaded.queueCapacity).toBe(4);expect(loaded.shopState.effects.patience).toBe(.10);
  loaded.openShop();expect(loaded.tickets[0].patience).toBeCloseTo(132);expect(loaded.shopState.frozenEffects.patience).toBe(.10);
  expect(loaded.placeShopItem('customer-tables',false,'during-shift')).toBe(false);
  const stored=CozyRuntime.restoreCheckpoint(r.exportCheckpoint())!;expect(stored.placeShopItem('customer-tables',false,'store')).toBe(true);
  expect(stored.shopState.effects.patience).toBe(0);expect(stored.state.cash).toBe(cash-4000);expect(stored.queueCapacity).toBe(4);
 });
 it('all twelve placed items never change capacity; two expansions change four to five to six',()=>{
  const r=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint(30000))!;r.claimTestCode('VIETVUIVE');
  for(const item of SHOP_CATALOG){expect(r.buyShopItem(item.id,'buy-'+item.id)).toBe(true);expect(r.queueCapacity).toBe(4);expect(r.placeShopItem(item.id,true,'place-'+item.id)).toBe(true);expect(r.queueCapacity).toBe(4);}
  const prep=r.exportCheckpoint();expect(prep.shop!.acquired).toHaveLength(12);expect(validateCozyCheckpoint(prep)).not.toBeNull();
  expect(r.shopState.effects).toEqual({visitors:.29,patience:.38});expect(r.shopState.effects.patience).toBeLessThanOrEqual(.40);
  const loaded=CozyRuntime.restoreCheckpoint(prep)!;expect(loaded.queueCapacity).toBe(4);
  expect(loaded.upgradeShop('queue','expansion')).toBe(true);expect(loaded.queueCapacity).toBe(5);expect(loaded.queueVisitorBonus).toBe(.10);expect(loaded.upgradePrice('queue')).toBe(10000);expect(loaded.upgradeShop('queue','expansion-two')).toBe(true);expect(loaded.queueCapacity).toBe(6);expect(loaded.queueVisitorBonus).toBe(.30);expect(loaded.shopVisitorBonus).toBe(.59);expect(loaded.upgradePrice('queue')).toBeNull();
  const expanded=loaded.exportCheckpoint(),cash=loaded.state.cash;
  expect(loaded.upgradeShop('queue','expansion-again')).toBe(false);expect(loaded.state.cash).toBe(cash);expect(loaded.exportCheckpoint()).toEqual(expanded);
  expect(CozyRuntime.restoreCheckpoint(expanded)!.queueCapacity).toBe(6);
  for(const level of [3,4]){const forged=structuredClone(expanded);forged.upgrades.queueLevel=level;expect(validateCozyCheckpoint(forged)).toBeNull();expect(CozyRuntime.restoreCheckpoint(forged)).toBeNull();}
 });
 it('grandfathers six legacy seats without inventing a second receipt or charge',()=>{
  for(const price of [200,6000]){
   const old=fundedShopCheckpoint(22000);old.stock.cash-=price;
   old.upgrades={ovenLevel:0,queueLevel:1,spent:price,pendingSpent:price,...(price===6000?{receipts:[{kind:'queue' as const,level:1,actualPrice:price}]}:{})};
   const r=CozyRuntime.restoreCheckpoint(old)!;expect(r.queueCapacity).toBe(6);expect(r.queueLevel).toBe(1);expect(r.queueVisitorBonus).toBe(.10);expect(r.state.cash).toBe(old.stock.cash);
   const saved=r.exportCheckpoint();expect(saved.upgrades).toMatchObject({rulesVersion:2,legacyCapacity:6,queueLevel:1,spent:price});expect(saved.upgrades.receipts).toEqual([{kind:'queue',level:1,actualPrice:price}]);
   expect(CozyRuntime.restoreCheckpoint(saved)!.queueCapacity).toBe(6);expect(r.upgradeShop('queue','second')).toBe(true);expect(r.queueVisitorBonus).toBe(.30);expect(r.queueCapacity).toBe(6);expect(r.state.cash).toBe(old.stock.cash-10000);expect(r.exportCheckpoint().upgrades.receipts).toHaveLength(2);
   for(const mutate of [(s:typeof saved)=>{s.upgrades.legacyCapacity=5 as 6;},(s:typeof saved)=>{s.upgrades.rulesVersion=3 as 2;},(s:typeof saved)=>{s.upgrades.queueLevel=0;}]){const forged=structuredClone(saved);mutate(forged);expect(validateCozyCheckpoint(forged)).toBeNull();}
  }
 });
 it('restores actual receipts and capital accounting once, rejects forged investment metadata',()=>{
  const r=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint())!;
  r.buyShopItem('waiting-chair','chair');r.placeShopItem('waiting-chair',true,'install');r.upgradeShop('oven','oven');
  const prep=r.exportCheckpoint();expect(prep.shop!.pendingSpent).toBe(1200);expect(prep.upgrades.receipts).toEqual([{kind:'oven',level:1,actualPrice:2000}]);
  const loaded=CozyRuntime.restoreCheckpoint(prep)!;expect(loaded.shopState).toMatchObject({spent:1200,pendingSpent:1200,effects:{patience:.05}});
  loaded.openShop();loaded.closeDay();expect(loaded.daySummary!.accounts.capitalPurchases).toBe(3200);
  expect(loaded.daySummary!.accounts.profit).toBe(-20);expect(loaded.exportCheckpoint().shop!.pendingSpent).toBe(0);
  const after=CozyRuntime.restoreCheckpoint(loaded.exportCheckpoint())!;after.openShop();after.closeDay();expect(after.daySummary!.accounts.capitalPurchases).toBe(0);
  const wrong=structuredClone(prep);wrong.shop!.acquired[0].placedSlot='wifi';expect(validateCozyCheckpoint(wrong)).toBeNull();
  const wrongPrice=structuredClone(prep);wrongPrice.upgrades.receipts![0].actualPrice=250;expect(validateCozyCheckpoint(wrongPrice)).toBeNull();
  const wrongSpent=structuredClone(prep);wrongSpent.shop!.pendingSpent--;expect(validateCozyCheckpoint(wrongSpent)).toBeNull();
 });
 it('migrates old upgrade receipts and prices only future upgrades',()=>{
  const old=new CozyRuntime(false,true).exportCheckpoint();delete old.shop;
  old.upgrades={ovenLevel:1,queueLevel:0,spent:150,pendingSpent:150};old.stock.cash=150;
  const r=CozyRuntime.restoreCheckpoint(old)!;expect(r.state.cash).toBe(150);expect(r.shopState.acquired).toEqual([]);expect(r.upgradePrice('oven')).toBe(5000);
  expect(r.exportCheckpoint().upgrades.receipts).toEqual([{kind:'oven',level:1,actualPrice:150}]);
 });
 it('freezes paying counter patience including referrals at open and leaves app deadlines unchanged',()=>{
  const r=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint(),false,{schedule:day=>({day,duration:180,grace:120,slots:[{id:'counter',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:false},{id:'referral',at:20,kind:'regular',opportunity:'referral',commercialOrdinal:2,takeaway:false},{id:'app',at:40,kind:'hurry',opportunity:'commercial',commercialOrdinal:3,takeaway:true,source:'app'}]})})!;
  r.buyShopItem('waiting-chair','chair');r.buyShopItem('wifi','wifi');r.placeShopItem('waiting-chair',true,'install-chair');r.placeShopItem('wifi',true,'install-wifi');r.configureDeliveryApp(true,'app-on');
  r.openShop();expect(r.tickets[0].patience).toBeCloseTo(135.6);expect(r.shopState.frozenEffects.patience).toBe(.13);expect(r.placeShopItem('wifi',false,'no')).toBe(false);
  for(let i=0;i<400;i++)r.advance(50);expect(r.tickets[1].patience).toBeCloseTo(135.6);
  for(let i=0;i<400;i++)r.advance(50);expect(r.tickets[2].patience).toBe(90);
 });
 it('stable sampled schedule adds expected commercial arrivals only and keeps all base slots',()=>{
  let extras=0,commercial=0;for(let day=1;day<=30;day++){
   const base=threeDaySchedule(day,{regularDay1Stars:4,regularLatestStars:4,helpSucceeded:false,referral:true}),result=shopSchedule(base,.29);
   expect(result).toEqual(shopSchedule(base,.29));expect(result.slots.length).toBeLessThanOrEqual(base.slots.length*2);for(const slot of base.slots)expect(result.slots).toContainEqual(slot);
   extras+=result.slots.length-base.slots.length;commercial+=base.slots.filter(s=>s.opportunity==='commercial').length;expect(()=>validateCozySchedule(result)).not.toThrow();expect(result.slots.filter(s=>s.opportunity==='referral')).toHaveLength(base.slots.filter(s=>s.opportunity==='referral').length);
  }expect(extras/commercial).toBeGreaterThan(.23);expect(extras/commercial).toBeLessThan(.35);
  const appSlot={id:'app-only',at:0,kind:'hurry' as const,opportunity:'commercial' as const,commercialOrdinal:1,takeaway:true,source:'app' as const};const base=validateCozySchedule({day:2,duration:10,grace:0,slots:[appSlot]});expect(shopSchedule(base,.3).slots).toEqual(base.slots);
 });
 it('stages buy/place before commit and leaves RAM unchanged on failure; retry preserves reference, leases and payload',async()=>{
  const payload=fundedShopCheckpoint();let envelope:CozySaveEnvelope={schemaVersion:COZY_SCHEMA_VERSION,contentVersion:COZY_CONTENT_VERSION,campaignId:'campaign',commitId:'initial',revision:1,checksum:checkpointChecksum(payload),payload};
  let fail=true;const requests:CozyWriteRequest[]=[];
  const port:CozySavePort={load:async()=>({ok:true,kind:'loaded',envelope,replacementToken:'test'}),commit:async request=>{requests.push(structuredClone(request));if(fail)return saveFailure('write-failed');envelope={...envelope,commitId:request.commitId,revision:envelope.revision+1,payload:structuredClone(request.payload),checksum:checkpointChecksum(request.payload)};return {ok:true,envelope};}};
  let id=0;const session=new CozyCampaignSession(port,()=>`commit-${++id}`),r=(await session.load())!,cash=r.state.cash;
  expect(session.buyShopItem('table-plant','buy')).toBe(true);expect(r.state.cash).toBe(cash);expect(r.shopState.acquired).toEqual([]);await new Promise(resolve=>setTimeout(resolve,0));
  expect(session.view.state).toBe('error');expect(r.openShop()).toBe(false);expect(session.buyShopItem('wifi','blocked')).toBe(false);expect(r.state.cash).toBe(cash);
  const lease=r.acquirePause('visibility');fail=false;await session.retry();expect(requests[1]).toEqual(requests[0]);expect(session.runtime).toBe(r);expect(r.state.cash).toBe(cash-500);expect(r.pauses).toContain('visibility');lease.release();
  expect(session.buyShopItem('wifi','buy')).toBe(false);expect(session.placeShopItem('table-plant',true,'place')).toBe(true);expect(r.shopState.effects.visitors).toBe(0);await new Promise(resolve=>setTimeout(resolve,0));expect(r.shopState.effects.visitors).toBe(.03);
  const loaded=(await session.load())!;expect(loaded.state.cash).toBe(cash-500);expect(loaded.shopState.acquired[0].placedSlot).toBe('table-plant');
  loaded.openShop();session.closeDay();await new Promise(resolve=>setTimeout(resolve,0));
  expect(loaded.shopPhase).toBe('summary');expect(session.buyShopItem('pizza-painting','after-summary')).toBe(true);await new Promise(resolve=>setTimeout(resolve,0));
  expect(session.runtime).toBe(loaded);expect(loaded.shopState.acquired.map(i=>i.id)).toContain('pizza-painting');expect(loaded.shopPhase).toBe('summary');
 });
});
