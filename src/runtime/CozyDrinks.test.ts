import {describe,it,expect} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {requestedDrink} from '../domain/DrinkStock';
import {DRINK_CATALOG,type DrinkId,drinkDefinition} from '../config/drinkCatalog';
import {validateCozyCheckpoint} from '../domain/CozyCheckpoint';
function fixture(drink:DrinkId='cola'){
  let n=0;while(requestedDrink(321,1,'drink-'+n)!==drink)n++;
  const r=new CozyRuntime(false,true,{eventSeed:321,schedule:day=>({day,duration:180,grace:120,slots:[{id:'drink-'+n,at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:false}]})});
  for(const id of ['dough','sauce','cheese'] as const)r.buy(id,2);
  r.buyDrink(drink,2,'buy-'+drink);return r;
}
describe('drinks served with pizza',()=>{
  it('does not settle an order until its requested drink is attached',()=>{
    const r=fixture();r.openShop();for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});r.advanceElapsed(4000);r.dispatch({type:'extract'});
    const cash=r.state.cash;expect(r.dispatch({type:'deliver',commandId:'missing-drink'})).toBe(false);expect(r.state.cash).toBe(cash);expect(r.lastResult).toBeNull();expect(r.attachDrink('cola')).toBe(true);expect(r.dispatch({type:'deliver',commandId:'complete-drink'})).toBe(true);expect(r.state.cash).toBe(cash+85);
  });
  it('persists prep purchase and rejects tampered bottle inventory',()=>{
    const r=fixture(),s=r.exportCheckpoint();expect(CozyRuntime.restoreCheckpoint(s)?.drinkStock.find(d=>d.id==='cola')?.quantity).toBe(2);
    s.stock.drinks!.cola++;expect(validateCozyCheckpoint(s)).toBeNull();
  });
  it.each(DRINK_CATALOG.map(d=>d.id as DrinkId))('serves %s only once with pizza and a valid report',drink=>{
    const r=fixture(drink),definition=drinkDefinition(drink);expect(r.openShop()).toBe(true);expect(r.selectedTicket?.drink).toBe(drink);
    expect(r.attachDrink(drink==='water'?'cola':'water')).toBe(false);expect(r.attachDrink(drink)).toBe(true);expect(r.attachDrink(drink)).toBe(false);
    for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});
    r.dispatch({type:'bake'});r.advanceElapsed(4000);r.dispatch({type:'extract'});
    const cash=r.state.cash;expect(r.dispatch({type:'deliver',commandId:'deliver-once'})).toBe(true);
    expect(r.state.cash-cash).toBe(60+definition.salePrice);expect(r.dispatch({type:'deliver',commandId:'deliver-once'})).toBe(false);
    expect(r.closeDay()).toBe(true);const report=r.daySummary!;expect(report.drinkCost).toBe(definition.purchasePrice);expect(report.reviews[0].soldDrink).toEqual({id:drink,price:definition.salePrice});
    expect(validateCozyCheckpoint(r.exportCheckpoint())).not.toBeNull();
  });
});
