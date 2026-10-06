import {expect,it} from 'vitest';
import {CozyRuntime} from './CozyRuntime';

type Receipt={id:number;amount:number;cash:number};
function receipts(r:CozyRuntime){const list:Receipt[]=[];const unsubscribe=r.subscribeCash(e=>list.push(e));return {list,unsubscribe};}
it('emits one atomic basket delta, ignores duplicate and rejected purchases',()=>{
  const r=new CozyRuntime(false,true),{list}=receipts(r);
  const quote=r.quoteMarketBasket([{ingredient:'dough',quantity:2},{ingredient:'cheese',quantity:2}])!;
  expect(r.buyAll(quote.entries,'basket',quote.day)).toBe(true);
  expect(list).toEqual([{id:1,amount:-quote.total,cash:300-quote.total}]);
  expect(r.buyAll(quote.entries,'basket',quote.day)).toBe(false);expect(r.buy('dough',100,'too-much')).toBe(false);
  expect(r.buy('shrimp',1,'locked')).toBe(false);expect(list).toHaveLength(1);
});
it('keeps opposite transactions distinct and does not replay on reads, reload or reset',()=>{
  const r=new CozyRuntime(false,true),{list,unsubscribe}=receipts(r);
  r.buy('dough',1,'buy');r.claimTestCode('VIETVUIVE');
  expect(list).toHaveLength(2);expect(list[0].amount).toBeLessThan(0);expect(list[1].amount).toBe(100000);
  const checkpoint=r.exportCheckpoint(),restored=CozyRuntime.restoreCheckpoint(checkpoint)!;
  const reloaded=receipts(restored);void restored.state;void restored.marketForecast;expect(reloaded.list).toEqual([]);
  expect(restored.claimTestCode('VIETVUIVE')).toBe(false);expect(reloaded.list).toEqual([]);
  unsubscribe();r.buy('dough',1,'after-unsubscribe');expect(list).toHaveLength(2);
  restored.dispatch({type:'reset'});expect(reloaded.list).toEqual([]);
});
it('reports delivery net cash only once and safely isolates failed presentation',()=>{
  const r=new CozyRuntime(false,true,{schedule:day=>({day,duration:120,grace:20,slots:[{id:'payment',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:false}]})});
  for(const id of ['dough','sauce','cheese'] as const)r.buy(id,1);r.openShop();
  const {list}=receipts(r);r.subscribeCash(()=>{throw Error('UI failure');});
  for(const id of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient:id});r.dispatch({type:'bake'});
  r.advanceElapsed(6000);r.dispatch({type:'extract'});const before=r.state.cash;
  expect(r.dispatch({type:'deliver',commandId:'paid'})).toBe(true);
  expect(list).toEqual([{id:list[0].id,amount:50,cash:before+50}]);
  expect(r.dispatch({type:'deliver',commandId:'paid'})).toBe(false);r.continueShift();expect(list).toHaveLength(1);
});
it('publishes a confirmed persisted purchase once without replaying its checkpoint',()=>{
  const r=new CozyRuntime(false,true),{list}=receipts(r),candidate=CozyRuntime.restoreCheckpoint(r.exportCheckpoint())!;
  expect(candidate.buyRecipe('sausage','recipe')).toBe(true);
  // Recipe commits follow their own existing session path; shop confirmation covers upgrades.
  expect(candidate.claimTestCode('VIETVUIVE')).toBe(true);
  expect(r.confirmShopCheckpoint(candidate.exportCheckpoint(),'confirmed')).toBe(true);
  expect(list).toHaveLength(1);expect(list[0].amount).toBe(candidate.state.cash-300);
  expect(r.confirmShopCheckpoint(candidate.exportCheckpoint(),'confirmed')).toBe(true);expect(list).toHaveLength(1);
});
it('reports a committed thank-you reward even when the arriving order is rejected by a full queue',()=>{
  const r=new CozyRuntime(false,true,{resolveRecipe:()=> 'cheese',schedule:day=>({day,duration:120,grace:20,slots:day===3?
    [0,.05,.1,.15,1].map((at,i)=>({id:'full-'+i,at,kind:i===4?'regular':'hurry',opportunity:'commercial',commercialOrdinal:i+1,takeaway:false})):
    [{id:'first-'+day,at:0,kind:'regular',opportunity:day===2?'help':'commercial',commercialOrdinal:day===2?null:1,takeaway:false}]})});
  for(const id of ['dough','sauce','cheese'] as const)r.buy(id,7);
  for(let day=1;day<=2;day++){
    expect(day===1?r.openShop():r.openNextDay()).toBe(true);if(day===2)expect(r.resolveHelp(true)).toBe(true);
    for(const id of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient:id});r.dispatch({type:'bake'});r.advanceElapsed(6000);r.dispatch({type:'extract'});r.dispatch({type:'deliver',commandId:'gift-'+day});if(r.deliveryPending)r.confirmDelivery();r.closeDay();
  }
  expect(r.customerProgress.relationship).toBe(2);r.openNextDay();const {list}=receipts(r),before=r.state.cash;r.advanceElapsed(1000);
  expect(r.tickets).toHaveLength(4);expect(list.map(e=>e.amount)).toEqual([20]);expect(r.state.cash).toBe(before+20);
});
