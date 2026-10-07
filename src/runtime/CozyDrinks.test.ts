import {describe,it,expect} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {requestedDrink} from '../domain/DrinkStock';
import {validateCozyCheckpoint} from '../domain/CozyCheckpoint';
function fixture(){
  let n=0;while(requestedDrink(321,1,'drink-'+n)!=='cola')n++;
  const r=new CozyRuntime(false,true,{eventSeed:321,schedule:day=>({day,duration:180,grace:120,slots:[{id:'drink-'+n,at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:false}]})});
  for(const id of ['dough','sauce','cheese'] as const)r.buy(id,2);
  r.buyDrink('cola',2,'buy-cola');return r;
}
describe('drinks served with pizza',()=>{
  it('persists prep purchase and rejects tampered bottle inventory',()=>{
    const r=fixture(),s=r.exportCheckpoint();expect(CozyRuntime.restoreCheckpoint(s)?.drinkStock.find(d=>d.id==='cola')?.quantity).toBe(2);
    s.stock.drinks!.cola++;expect(validateCozyCheckpoint(s)).toBeNull();
  });
  it('consumes a bottle once and settles pizza plus drink once with valid report',()=>{
    const r=fixture();expect(r.openShop()).toBe(true);expect(r.selectedTicket?.drink).toBe('cola');
    expect(r.attachDrink('water')).toBe(false);expect(r.attachDrink('cola')).toBe(true);expect(r.attachDrink('cola')).toBe(false);
    for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});
    r.dispatch({type:'bake'});r.advanceElapsed(6000);r.dispatch({type:'extract'});
    const cash=r.state.cash;expect(r.dispatch({type:'deliver',commandId:'deliver-once'})).toBe(true);
    expect(r.state.cash-cash).toBe(75);expect(r.dispatch({type:'deliver',commandId:'deliver-once'})).toBe(false);
    expect(r.closeDay()).toBe(true);const report=r.daySummary!;expect(report.drinkCost).toBe(10);expect(report.reviews[0].soldDrink).toEqual({id:'cola',price:25});
    expect(validateCozyCheckpoint(r.exportCheckpoint())).not.toBeNull();
  });
});
