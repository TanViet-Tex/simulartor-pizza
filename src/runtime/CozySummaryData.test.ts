import {expect,it} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {CozyStock} from '../domain/CozyStock';
import {validateCozyCheckpoint} from '../domain/CozyCheckpoint';

function time(r:CozyRuntime,seconds:number){for(let i=0;i<seconds*20;i++)r.advance(50);}
function bake(r:CozyRuntime){for(const ingredient of ['dough','sauce','cheese'] as const)expect(r.dispatch({type:'ingredient',ingredient})).toBe(true);expect(r.dispatch({type:'bake'})).toBe(true);}
function serve(r:CozyRuntime,id:string){bake(r);time(r,6);r.dispatch({type:'extract'});r.dispatch({type:'box'});expect(r.dispatch({type:'deliver',commandId:id})).toBe(true);}
function shop(){
  const r=new CozyRuntime(false,true,{schedule:day=>({day,duration:120,grace:20,slots:[{id:'first',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:true},{id:'second',at:10,kind:'bargain',opportunity:'commercial',commercialOrdinal:2,takeaway:true}]})});
  for(const id of ['dough','sauce','cheese'] as const)r.buy(id,4);
  r.setMenuPrice('cheese',116);r.openShop();return r;
}

it('records actual prices only after successful commercial transactions and freezes identities and day metadata',()=>{
  const r=shop(),first=r.tickets[0].avatarIndex;serve(r,'first-delivery');
  expect(r.dispatch({type:'deliver',commandId:'first-delivery'})).toBe(false);
  r.continueShift();time(r,4.1);const second=r.tickets[0].avatarIndex;serve(r,'second-delivery');
  expect(r.bargainPending).not.toBeNull();expect(r.resolveBargain(true)).toBe(true);expect(r.resolveBargain(true)).toBe(false);
  expect(r.closeDay()).toBe(true);
  const report=r.daySummary!;
  expect(report.salesByRecipe).toEqual([{recipe:'cheese',quantity:2,revenue:110}]);
  expect(report.costByIngredient).toEqual([{ingredient:'dough',cost:10},{ingredient:'sauce',cost:6},{ingredient:'cheese',cost:14}]);
  expect(report.reviews.map(review=>review.avatarIndex)).toEqual([first,second]);
  expect(report.revenue).toBe(110);expect(report.cost).toBe(30);
  const checkpoint=r.exportCheckpoint(),loaded=CozyRuntime.restoreCheckpoint(checkpoint)!;
  expect(loaded.completedReports[0]).toEqual(report);
  r.buy('dough',1);expect(r.daySummary).toEqual(report);
  expect(r.openNextDay()).toBe(true);expect(r.closeDay()).toBe(true);
  expect(r.daySummary).toMatchObject({salesByRecipe:[],costByIngredient:[],revenue:0,cost:0});
});

it('collects actual retained lot costs once and excludes failed commits and unconsumed expired stock',()=>{
  const stock=new CozyStock();for(const id of ['dough','sauce','cheese'] as const)stock.buy(id,2,1);
  stock.settle(1);stock.buy('dough',1,2);
  stock.reserve('baked','cheese',60);expect(stock.commit('baked',['dough','sauce','cheese'],2)).toBe(true);
  expect(stock.commit('baked',['dough'],2)).toBe(false);
  expect(stock.consumedByIngredient(2)).toEqual([{ingredient:'dough',cost:5},{ingredient:'sauce',cost:3},{ingredient:'cheese',cost:7}]);
  const detached=stock.consumedByIngredient(2);detached[0].cost=999;
  stock.settle(2);expect(stock.consumedByIngredient(2)[0].cost).toBe(5);expect(stock.consumedByIngredient(1)).toEqual([]);
});

it('counts discarded batches in ingredient cost once without inventing another expense',()=>{
  const r=shop();bake(r);r.dispatch({type:'extract'});r.requestDiscard();r.confirmDiscard();r.remake();bake(r);r.closeDay();
  expect(r.daySummary).toMatchObject({salesByRecipe:[],cost:30,profit:-50,costByIngredient:[{ingredient:'dough',cost:10},{ingredient:'sauce',cost:6},{ingredient:'cheese',cost:14}]});
});

it('keeps burnt ingredients in consumed cost without charging an additional loss',()=>{
  const r=shop();bake(r);time(r,9);expect(r.ovenState?.stage).toBe('burnt');
  expect(r.closeDay()).toBe(true);
  const summary=r.daySummary!;
  expect(summary).toMatchObject({revenue:0,cost:15,profit:-35,rent:20});
  expect(summary.costByIngredient?.reduce((sum,row)=>sum+row.cost,0)).toBe(15);
  expect(summary.accounts.other).toBe(0);
});

it('preserves optional report metadata, accepts old saves and rejects corrupt or unreconciled metadata',()=>{
  const r=shop();serve(r,'sale');r.closeDay();const original=r.exportCheckpoint();
  const old=structuredClone(original);delete old.reports[0].salesByRecipe;delete old.reports[0].costByIngredient;for(const review of old.reports[0].reviews)delete review.avatarIndex;
  const legacy=validateCozyCheckpoint(old)!;expect(legacy).not.toBeNull();expect(legacy.reports[0].salesByRecipe).toBeUndefined();expect(legacy.reports[0].costByIngredient).toBeUndefined();expect(legacy.reports[0].reviews[0].avatarIndex).toBeUndefined();
  const mutations:((s:typeof original)=>void)[]=[
    s=>{s.reports[0].salesByRecipe![0].revenue++;},s=>{s.reports[0].salesByRecipe![0].quantity++;},
    s=>{s.reports[0].salesByRecipe!.push({...s.reports[0].salesByRecipe![0]});},
    s=>{s.reports[0].costByIngredient![0].cost++;},s=>{s.reports[0].costByIngredient!.push({...s.reports[0].costByIngredient![0]});},
    s=>{s.reports[0].reviews[0].avatarIndex=150;},s=>{s.reports[0].reviews[0].avatarIndex=NaN;},
  ];
  for(const mutate of mutations){const corrupted=structuredClone(original);mutate(corrupted);expect(validateCozyCheckpoint(corrupted)).toBeNull();}
  expect(validateCozyCheckpoint(original)).toEqual(original);
});
