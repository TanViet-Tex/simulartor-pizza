import {expect,it} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {datedIngredientPrice,ingredientExpiry} from '../domain/CozyStock';

function runtime(){return new CozyRuntime(false,true,{schedule:day=>({day,duration:180,grace:120,slots:[{id:'sale',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:true}]}),resolveRecipe:()=> 'cheese'});}
function buy(r:CozyRuntime,id:'dough'|'sauce'|'cheese',quantity:number,commandId:string){return r.dispatch({type:'market.buy',ingredient:id,quantity,commandId});}
function time(r:CozyRuntime,seconds:number){for(let i=0;i<seconds*20;i++)r.advance(50);}

it('buys before opening, consumes actual lots once and buys for the next day without rewriting the report',()=>{
  const r=runtime();
  for(const id of ['dough','sauce','cheese'] as const)expect(buy(r,id,2,'day1-'+id)).toBe(true);
  expect(r.state.cash).toBe(270);expect(r.stockLots).toHaveLength(3);
  expect(r.stockLots.every(l=>l.day===1&&l.expiry===ingredientExpiry(l.ingredient,1)&&l.quantity===2)).toBe(true);
  const lots=r.stockLots;expect(r.openShop()).toBe(true);expect(r.stockLots).toEqual(lots);
  for(const ingredient of ['dough','sauce','cheese'] as const)expect(r.dispatch({type:'ingredient',ingredient})).toBe(true);
  expect(r.stockLots).toEqual(lots);expect(r.dispatch({type:'bake'})).toBe(true);expect(r.dispatch({type:'bake'})).toBe(false);
  for(const id of ['dough','sauce','cheese'] as const)expect(r.owned(id)).toBe(1);
  time(r,7);for(const type of ['extract','box','deliver'] as const)expect(r.dispatch({type})).toBe(true);
  expect(r.closeDay()).toBe(true);const report=r.daySummary!;
  expect(report).toMatchObject({purchases:30,cost:15,revenue:50,profit:15,cash:300});
  expect(r.preparationDay).toBe(2);
  expect(buy(r,'dough',2,'day2-dough')).toBe(true);
  expect(r.daySummary).toEqual(report);expect(r.state.cash).toBe(288);
  expect(r.stockLots[r.stockLots.length-1]).toMatchObject({ingredient:'dough',quantity:2,day:2,expiry:ingredientExpiry('dough',2),unitCost:datedIngredientPrice('dough',2)});
  expect(r.openNextDay()).toBe(true);expect(r.day).toBe(2);
  for(const ingredient of ['dough','sauce','cheese'] as const)expect(r.dispatch({type:'ingredient',ingredient})).toBe(true);
  expect(r.dispatch({type:'bake'})).toBe(true);expect(r.owned('dough')).toBe(2);
  expect(r.stockLots.filter(l=>l.ingredient==='dough').every(l=>l.day===2)).toBe(true);
  expect(r.closeDay()).toBe(true);expect(r.daySummary!.cost).toBe(15);
  expect(r.completedReports[0]).toEqual(report);
});

it('rejects invalid and unaffordable quantities atomically and deduplicates accepted commands',()=>{
  const r=runtime(),initial=r.stockLots;
  for(const quantity of [0,-1,1.5,101,100])expect(buy(r,'cheese',quantity,'bad-'+quantity)).toBe(false);
  expect(r.state.cash).toBe(300);expect(r.stockLots).toEqual(initial);
  expect(buy(r,'dough',2,'same')).toBe(true);expect(buy(r,'dough',2,'same')).toBe(false);
  expect(buy(r,'cheese',1,'same')).toBe(false);expect(r.state.cash).toBe(290);expect(r.owned('dough')).toBe(2);expect(r.owned('cheese')).toBe(0);
  r.openShop();expect(buy(r,'dough',1,'in-shift')).toBe(false);expect(r.state.cash).toBe(290);
});

it('keeps independent pauses blocking purchases after a confirmation lease closes',()=>{
  const r=runtime(),modal=r.acquirePause('order'),hidden=r.acquirePause('visibility');
  expect(buy(r,'dough',1,'pending')).toBe(false);modal.release();expect(buy(r,'dough',1,'pending')).toBe(false);
  expect(r.state.cash).toBe(300);hidden.release();expect(buy(r,'dough',1,'pending')).toBe(true);expect(r.state.cash).toBe(295);
});

it('preserves legacy checkpoint stock and cash while buying at its current preparation day',()=>{
  const r=runtime();for(const id of ['dough','sauce','cheese'] as const)buy(r,id,2,'start-'+id);
  r.openShop();r.closeDay();const checkpoint=r.exportCheckpoint();
  for(const report of checkpoint.reports){delete report.salesByRecipe;delete report.costByIngredient;for(const review of report.reviews)delete review.avatarIndex;}
  const loaded=CozyRuntime.restoreCheckpoint(checkpoint)!;expect(loaded).not.toBeNull();
  expect(loaded.state.cash).toBe(checkpoint.stock.cash);expect(loaded.stockLots).toEqual(checkpoint.stock.lots);
  expect(buy(loaded,'sauce',1,'restored')).toBe(true);
  expect(loaded.stockLots[loaded.stockLots.length-1]).toMatchObject({ingredient:'sauce',day:checkpoint.day,quantity:1,unitCost:datedIngredientPrice('sauce',checkpoint.day)});
  expect(loaded.completedReports).toEqual(checkpoint.reports.map(({progressionArchive:_,...report})=>report));
});
