import {describe,it,expect} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {CozyCampaignSession} from './CozyCampaignSession';
import {CozyStock,STOCK_INGREDIENTS,recipeIngredients,datedIngredientPrice} from '../domain/CozyStock';
import {RECIPE_CATALOG} from '../config/recipeCatalog';
import {INGREDIENT_CATALOG} from '../config/ingredientCatalog';
import {threeDaySchedule,resolveScheduleRecipe} from '../config/cozySchedule';
import {stockForecast} from '../presentation/StockPlanning';
import {COZY_SCHEMA_VERSION,COZY_CONTENT_VERSION,validateCozyCheckpoint} from '../domain/CozyCheckpoint';
import {checkpointChecksum,saveFailure,type CozySaveEnvelope,type CozySavePort,type CozyWriteRequest} from '../infrastructure/CozySaveRepository';
describe('Epic 5 catalog, purchases and ongoing campaign',()=>{
 it('has exactly 19 unique ingredient icons and eight complete one-portion recipes',()=>{
  expect(INGREDIENT_CATALOG).toHaveLength(19);expect(new Set(INGREDIENT_CATALOG.map(i=>i.icon)).size).toBe(19);expect(RECIPE_CATALOG).toHaveLength(8);
  for(const recipe of RECIPE_CATALOG){expect(recipe.ingredients.filter(id=>id==='dough')).toHaveLength(1);expect(new Set(recipe.ingredients).size).toBe(recipe.ingredients.length);expect(recipe.ingredients.every(id=>STOCK_INGREDIENTS.includes(id))).toBe(true);}
  expect(recipeIngredients('chicken-bbq')).toContain('sauce-bbq');expect(recipeIngredients('ham-pineapple')).toContain('pineapple');
 });
 it('purchases immediately once, rejects insufficient funds and restores cash and ownership together',()=>{
  const r=new CozyRuntime(false,true);expect(r.availableRecipes).toEqual(['cheese','mushroom']);expect(r.buyRecipe('sausage','buy')).toBe(true);expect(r.state.cash).toBe(150);expect(r.buyRecipe('sausage','again')).toBe(false);expect(r.buyRecipe('pepperoni','poor')).toBe(false);
  expect(r.configureMenu('sausage',110,true)).toBe(true);const save=r.exportCheckpoint(),loaded=CozyRuntime.restoreCheckpoint(save)!;expect(loaded.state.cash).toBe(150);expect(loaded.availableRecipes).toContain('sausage');expect(loaded.customerProgress.pricePercents.sausage).toBe(110);expect(loaded.recipePurchases.pendingSpent).toBe(150);
 });
 it('save failure blocks opening, retry reuses the same payload and cannot charge twice',async()=>{
  let value:CozySaveEnvelope|undefined,fail=false;const calls:CozyWriteRequest[]=[];
  const port:CozySavePort={load:async()=>({ok:true,kind:'empty',replacementToken:'undefined'}),commit:async request=>{calls.push(structuredClone(request));if(fail)return saveFailure('write-failed');value={schemaVersion:COZY_SCHEMA_VERSION,contentVersion:COZY_CONTENT_VERSION,campaignId:request.campaignId,commitId:request.commitId,revision:(value?.revision??0)+1,checksum:checkpointChecksum(request.payload),payload:structuredClone(request.payload)};return {ok:true,envelope:value};}};
  let sequence=0;const session=new CozyCampaignSession(port,()=>String(++sequence));await session.load();const r=(await session.start(false))!;fail=true;expect(session.buyRecipe('pepperoni','purchase')).toBe(true);await new Promise(resolve=>setTimeout(resolve,0));expect(session.view.state).toBe('error');expect(value!.payload.stock.cash).toBe(300);expect(r.state.cash).toBe(100);expect(r.canOpen).toBe(false);expect(session.buyRecipe('pepperoni','duplicate')).toBe(false);fail=false;await session.retry();expect(calls[2]).toEqual(calls[1]);expect(value!.payload.stock.cash).toBe(100);expect(value!.payload.ownedRecipes).toContain('pepperoni');
 });
 it('closes days 3, 4 and 5 into finite valid checkpoints with no success ending',()=>{
  const r=new CozyRuntime(false,true);
  for(let day=1;day<=5;day++){for(const id of ['dough','sauce','cheese'] as const)expect(r.buy(id,1)).toBe(true);expect(day===1?r.openShop():r.openNextDay()).toBe(true);expect(r.shiftClock.duration).toBe(day===1?180:day===2?210:240);expect(r.closeDay()).toBe(true);expect(r.daySummary!.ending).toBeNull();expect(validateCozyCheckpoint(r.exportCheckpoint())).not.toBeNull();}
  
 });
 it('day continuation preserves insolvency and never permits terminal reopening',()=>{const r=new CozyRuntime(false,true);expect(r.buy('shrimp',24)).toBe(true);expect(r.openShop()).toBe(true);expect(r.closeDay()).toBe(true);expect(r.daySummary!.ending).toBe('insolvent');expect(r.openNextDay()).toBe(false);});
 it('supplier rewards ordinary purchases next day, never discounts express or reprices old lots',()=>{
  const s=new CozyStock();s.receive(1000);expect(s.buy('dough',100,1)).toBe(true);expect(s.purchasePrice('cheese',1)).toBe(7);const old=s.lots[0];s.settle(1);expect(s.supplier(2).familiar).toBe(true);expect(s.purchasePrice('cheese',2)).toBe(7);expect(s.buy('shrimp',1,2)).toBe(true);expect(s.lots.find(l=>l.ingredient==='shrimp')!.unitCost).toBe(12);expect(s.lots.find(l=>l.id===old.id)!.unitCost).toBe(5);expect(s.orderExpress('express','shrimp',1,2)!.unitCost).toBe(Math.ceil(datedIngredientPrice('shrimp',2)*1.6));expect(CozyStock.restore(s.exportCheckpoint())).not.toBeNull();
 });
 it('full-menu forecast combines shared needs once, excludes expired and reserved stock, and zero targets need nothing',()=>{
  const s=new CozyStock();for(const id of ['dough','sauce','cheese'] as const)s.buy(id,3,1);expect(s.reserve('held','cheese',100,1)).toBe(true);
  const menu=RECIPE_CATALOG.map(r=>r.id),counts=Object.fromEntries(menu.map(id=>[id,1]));const forecast=stockForecast(menu,counts,id=>s.available(id,1));expect(forecast.find(row=>row.id==='dough')).toMatchObject({need:8,available:2,missing:6});expect(forecast.find(row=>row.id==='sauce')).toMatchObject({need:7,available:2,missing:5});expect(stockForecast(menu,{},id=>s.available(id,1))).toEqual([]);expect(stockForecast(['cheese'],{cheese:1},id=>s.available(id,3)).every(row=>row.available===0)).toBe(true);expect(()=>stockForecast(menu,{cheese:101},()=>0)).toThrow();
 });
 it('long-term schedule keeps bounded slots and only requests enabled owned recipes',()=>{const schedule=threeDaySchedule(4,{regularDay1Stars:4,regularLatestStars:4,helpSucceeded:false,referral:true});expect(schedule.slots).toHaveLength(11);expect(schedule.slots[0].kind).toBe('regular');expect(schedule.duration).toBe(240);for(const slot of schedule.slots)expect(['cheese','pepperoni']).toContain(resolveScheduleRecipe(slot,['cheese','pepperoni']));});
 it('includes newly purchased recipes in small menus and excludes express spending from supplier status',()=>{
  const schedule=threeDaySchedule(4,{regularDay1Stars:null,regularLatestStars:null,helpSucceeded:false,referral:false});expect(schedule.slots.map(slot=>resolveScheduleRecipe(slot,['cheese','pepperoni']))).toContain('pepperoni');
  const stock=new CozyStock();stock.receive(1000);expect(stock.orderExpress('bulk','shrimp',30,1)).not.toBeNull();expect(stock.receiveExpress('bulk')).toBe(true);expect(stock.supplier(2)).toMatchObject({familiar:false,purchased:0});
 });
 it('rejects forged ownership without payment and keeps supplier prices valid through day statements',()=>{
  const r=new CozyRuntime(false,true),save=r.exportCheckpoint();save.ownedRecipes.push('pepperoni');save.menu.push('pepperoni');expect(validateCozyCheckpoint(save)).toBeNull();
  const stock=new CozyStock();stock.receive(1000);stock.buy('dough',100,1);stock.settle(1);stock.buy('shrimp',1,2);const stored=stock.exportCheckpoint();expect(stored.lots.find(l=>l.ingredient==='shrimp')!.unitCost).toBe(12);expect(CozyStock.restore(stored)).not.toBeNull();
 });
});
