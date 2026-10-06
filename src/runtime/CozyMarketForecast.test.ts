import {expect,it} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {CozyStock} from '../domain/CozyStock';
import {marketForecast} from '../domain/MarketForecast';
import type {CozyDaySummary} from '../domain/CozyCheckpoint';
import {threeDaySchedule} from '../config/cozySchedule';
import {deliverySchedule,type DeliveryScheduleSlot} from '../config/deliveryEvents';

it('forecasts day one deterministically, adds reserve once to shared needs and subtracts usable inventory',()=>{
  const r=new CozyRuntime(false,true),before=r.exportCheckpoint();
  const forecast=r.marketForecast;
  expect(forecast.day).toBe(1);expect(forecast.portions.reduce((n,p)=>n+p.quantity,0)).toBe(6);
  expect(forecast.rows.find(row=>row.ingredient==='dough')).toMatchObject({needed:7,available:0,missing:7});
  expect(r.marketForecast).toEqual(forecast);expect(r.exportCheckpoint()).toEqual(before);
  expect(r.buy('dough',2,'stock')).toBe(true);
  expect(r.marketForecast.rows.find(row=>row.ingredient==='dough')).toMatchObject({needed:7,available:2,missing:5});
});

it('blends only recent detailed history while preserving scheduled count and excluding disabled recipes',()=>{
  const reports=[1,2,3,4].map(day=>({day,salesByRecipe:[{recipe:'mushroom',quantity:10,revenue:650}]})) as CozyDaySummary[];
  const forecast=marketForecast(5,['cheese','mushroom'],{cheese:5,mushroom:1},reports,()=>0);
  expect(forecast.historyDays).toEqual([2,3,4]);
  const mixed=[...reports,{day:5},{day:6},{day:7}] as CozyDaySummary[];
  expect(marketForecast(8,['cheese','mushroom'],{cheese:5,mushroom:1},mixed,()=>0).historyDays).toEqual([2,3,4]);
  expect(forecast.portions.reduce((n,p)=>n+p.quantity,0)).toBe(6);
  expect(forecast.portions.find(p=>p.recipe==='mushroom')!.quantity).toBeGreaterThan(1);
  const disabled=marketForecast(5,['cheese'],{cheese:6},reports,()=>0);
  expect(disabled.portions).toEqual([{recipe:'cheese',quantity:6}]);
  expect(disabled.rows.some(row=>row.ingredient==='mushroom')).toBe(false);
  expect(marketForecast(1,['cheese'],{cheese:0},[],()=>0).rows).toEqual([]);
});

it('derives unlocked ingredients from ownership across menu toggles and restore, gating all purchase paths',()=>{
  const r=new CozyRuntime(false,true);
  expect(r.ingredientAccess('sausage').unlocked).toBe(false);
  expect(r.buy('sausage',1,'locked')).toBe(false);
  expect(r.quoteMarketBasket([{ingredient:'sausage',quantity:1}])).toBeNull();
  expect(r.buyAll([{ingredient:'sausage',quantity:1,unitPrice:r.price('sausage')}],'locked-bulk',1)).toBe(false);
  expect(r.buyRecipe('sausage','recipe')).toBe(true);
  expect(r.configureMenu('sausage',100,false)).toBe(true);
  expect(r.ingredientAccess('sausage').unlocked).toBe(true);
  expect(r.buy('sausage',1,'unlocked')).toBe(true);
  const loaded=CozyRuntime.restoreCheckpoint(r.exportCheckpoint())!;
  expect(loaded.ingredientAccess('sausage').unlocked).toBe(true);
  expect(loaded.marketForecast.portions.some(p=>p.recipe==='sausage')).toBe(false);
  expect(loaded.ingredientAccess('shrimp').unlocked).toBe(false);
  expect(loaded.openShop()).toBe(true);
  expect(loaded.orderExpress('shrimp',1,'locked-express')).toBe(false);
  expect(loaded.orderExpress('sausage',1,'owned-express')).toBe(true);
});

it('bulk confirmation validates prices, day, duplicates, pauses and current cash before atomic commit',()=>{
  const r=new CozyRuntime(false,true),quote=r.quoteMarketBasket([{ingredient:'dough',quantity:3},{ingredient:'cheese',quantity:3}])!;
  const before=r.exportCheckpoint();
  expect(r.buyAll([{...quote.entries[0],unitPrice:99},quote.entries[1]],'stale',1)).toBe(false);
  expect(r.buyAll(quote.entries,'day',2)).toBe(false);
  expect(r.buyAll([quote.entries[0],quote.entries[0]],'duplicate',1)).toBe(false);
  const pause=r.acquirePause('visibility');expect(r.buyAll(quote.entries,'pause',1)).toBe(false);pause.release();
  expect(r.exportCheckpoint()).toEqual(before);
  expect(r.buyAll(quote.entries,'commit',1)).toBe(true);
  expect(r.state.cash).toBe(300-quote.total);expect(r.stockLots).toHaveLength(2);
  expect(r.buyAll(quote.entries,'commit',1)).toBe(false);
  expect(r.shiftClock.phase).toBe('preparation');
  const expensive=r.quoteMarketBasket([{ingredient:'cheese',quantity:100}])!,after=r.exportCheckpoint();
  expect(r.buyAll(expensive.entries,'poor',1)).toBe(false);expect(r.exportCheckpoint()).toEqual(after);
});

it('stock bulk uses supplier prices and existing ordinary ledger without repricing old lots',()=>{
  const s=new CozyStock();s.receive(1000);s.buy('dough',100,1);s.settle(1);
  const entries=[{ingredient:'cheese' as const,quantity:2,unitPrice:s.purchasePrice('cheese',2)},{ingredient:'mushroom' as const,quantity:2,unitPrice:s.purchasePrice('mushroom',2)}];
  expect(s.buyAll(entries,2)).toBe(true);expect(s.ledger(2).purchases).toBe(entries.reduce((n,e)=>n+e.unitPrice*e.quantity,0));
  expect(s.lots.find(l=>l.day===1)!.unitCost).toBe(5);expect(CozyStock.restore(s.exportCheckpoint())).not.toBeNull();
});

it('forecasts the pending day with its app and event quantities without starting the next shift',()=>{
  const r=new CozyRuntime(false,true);
  for(let day=1;day<=5;day++){
    if(day===5)expect(r.configureDeliveryApp(true,'app')).toBe(true);
    expect(day===1?r.openShop():r.openNextDay()).toBe(true);
    expect(r.closeDay()).toBe(true);
  }
  const checkpoint=r.exportCheckpoint(),forecast=r.marketForecast;
  expect(r.day).toBe(5);expect(forecast.day).toBe(6);
  const schedule=deliverySchedule(threeDaySchedule(6,{regularDay1Stars:null,regularLatestStars:null,helpSucceeded:false,referral:false}),true);
  expect(forecast.portions.reduce((n,p)=>n+p.quantity,0)).toBe(schedule.slots.reduce((n,s)=>n+((s as DeliveryScheduleSlot).quantity??1),0));
  expect(r.exportCheckpoint()).toEqual(checkpoint);
  const quote=r.quoteMarketBasket([{ingredient:'dough',quantity:1}])!;
  expect(quote.day).toBe(6);expect(r.buyAll(quote.entries,'next-day',quote.day)).toBe(true);
  expect(r.stockLots[r.stockLots.length-1].day).toBe(6);expect(r.day).toBe(5);
});

it('excludes expired and reserved units, tolerates legacy history and rechecks cash after quoting',()=>{
  const stock=new CozyStock();stock.buy('dough',3,1);stock.buy('sauce',3,1);stock.buy('cheese',3,1);stock.reserve('hold','cheese',100,1);
  expect(marketForecast(1,['cheese'],{cheese:3},[],id=>stock.available(id,1),{reservePercent:0,recentReports:3,historyWeight:.5}).rows[0]).toMatchObject({available:2,missing:1});
  expect(marketForecast(3,['cheese'],{cheese:3},[{day:2} as CozyDaySummary],id=>stock.available(id,3)).rows[0]).toMatchObject({available:0,missing:4});
  const r=new CozyRuntime(false,true),quote=r.quoteMarketBasket([{ingredient:'dough',quantity:25}])!;
  expect(quote.total).toBe(125);expect(r.buyRecipe('pepperoni','spend')).toBe(true);
  const before=r.exportCheckpoint();expect(r.buyAll(quote.entries,'stale-cash',quote.day)).toBe(false);expect(r.exportCheckpoint()).toEqual(before);
});
