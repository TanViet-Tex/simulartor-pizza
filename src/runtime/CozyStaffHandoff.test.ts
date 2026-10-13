import {describe,it,expect} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {STAFF_ROLES} from '../config/staffCatalog';
import {DRINK_CATALOG,type DrinkId} from '../config/drinkCatalog';
import {requestedDrink} from '../domain/DrinkStock';
import {validateCozyCheckpoint} from '../domain/CozyCheckpoint';

function runtime(drinks:readonly (DrinkId|null)[],kind:'regular'|'bargain'='regular',quantity=2,spacing=0){
  const ids=drinks.map((drink,index)=>{let n=0;while(requestedDrink(321,1,`handoff-${index}-${n}`)!==drink)n++;return `handoff-${index}-${n}`;});
  const r=new CozyRuntime(false,true,{eventSeed:321,resolveRecipe:()=> 'cheese',schedule:day=>({day,duration:180,grace:120,slots:ids.map((id,index)=>({id,at:index*spacing,kind,opportunity:'commercial',commercialOrdinal:index+1,takeaway:true}))})});
  expect(r.claimTestCode('VIETVUIVE')).toBe(true);
  for(const role of STAFF_ROLES)expect(r.hireStaff(role,'hire-'+role)).toBe(true);
  for(const id of ['dough','sauce','cheese'] as const)expect(r.buy(id,Math.max(10,drinks.length))).toBe(true);
  for(const drink of DRINK_CATALOG)expect(r.buyDrink(drink.id as DrinkId,quantity,'buy-'+drink.id)).toBe(true);
  expect(r.openShop()).toBe(true);return r;
}
function boxed(r:CozyRuntime){for(let i=0;i<400&&r.workbenchState?.stage!=='boxed';i++)r.advance(50);expect(r.workbenchState?.stage).toBe('boxed');}

describe('four staff handoff regressions',()=>{
  it.each([true,false])('preserves a third selected customer after staff bargain decision %s',accept=>{
    const r=runtime(['water',null,null],'bargain');const selected=r.tickets[2].id;
    expect(r.selectTicket(selected)).toBe(true);r.advanceElapsed(15000);
    expect(r.bargainPending).not.toBeNull();expect(r.selectedTicketId).toBe(selected);
    expect(r.resolveBargain(accept)).toBe(true);expect(r.selectedTicketId).toBe(selected);
  });
  it('freezes boxed drink handoff during pause and resumes without consuming twice',()=>{
    const r=runtime(['water']);boxed(r);const cash=r.state.cash;
    const lease=r.acquirePause('user');r.advanceElapsed(5000);
    expect(r.workbenchState?.stage).toBe('boxed');expect(r.drinkStock[0].quantity).toBe(2);expect(r.state.cash).toBe(cash);
    lease.release();r.advanceElapsed(1000);expect(r.tickets).toHaveLength(0);expect(r.drinkStock[0].quantity).toBe(1);
  });
  it('blocks boxed drink handoff while the save guard is closed and resumes once opened',()=>{
    const r=runtime(['water']);boxed(r);let allowed=false;r.attachSaveGuard(()=>allowed);const cash=r.state.cash;
    r.advanceElapsed(1000);expect(r.drinkStock[0].quantity).toBe(2);expect(r.state.cash).toBe(cash);expect(r.tickets).toHaveLength(1);
    allowed=true;r.advanceElapsed(1000);expect(r.tickets).toHaveLength(0);expect(r.drinkStock[0].quantity).toBe(1);
  });
  it('keeps delivering a long sequence of twelve bottled orders without duplicate sales or resource consumption',()=>{
    const r=runtime(Array.from({length:12},(_,index)=>(['water','cola','orange'] as const)[index%3]),'regular',5,10);
    const before=r.owned('dough');r.advanceElapsed(140000);
    expect(r.tickets).toHaveLength(0);expect(r.productionOwnerId).toBeNull();expect(r.staffState.jobs).toHaveLength(0);
    expect(r.owned('dough')).toBe(before-12);expect(r.drinkStock.map(d=>d.quantity)).toEqual([1,1,1]);
    const cash=r.state.cash;r.advanceElapsed(1000);expect(r.state.cash).toBe(cash);r.closeDay();
    expect(r.daySummary).toMatchObject({delivered:12,pizzasSold:12,revenue:1020,drinkCost:120,abandoned:0});
    expect(r.daySummary?.reviews.filter(review=>review.soldDrink)).toHaveLength(12);
    expect(validateCozyCheckpoint(r.exportCheckpoint())).not.toBeNull();
  });
  it('delivers each requested bottle once, preserves another selected customer and unblocks the bench',()=>{
    const r=runtime(['water','cola','orange']);const first=r.tickets[0].id,second=r.tickets[1].id;
    boxed(r);expect(r.selectTicket(second)).toBe(true);r.advanceElapsed(400);
    expect(r.tickets.some(t=>t.id===first)).toBe(false);expect(r.selectedTicketId).toBe(second);
    r.advanceElapsed(30000);expect(r.tickets).toHaveLength(0);expect(r.productionOwnerId).toBeNull();
    for(const drink of r.drinkStock)expect(drink.quantity).toBe(1);
    const cash=r.state.cash;r.advanceElapsed(1000);expect(r.state.cash).toBe(cash);
    expect(r.closeDay()).toBe(true);expect(r.daySummary).toMatchObject({delivered:3,pizzasSold:3,revenue:255,drinkCost:30});
    expect(r.daySummary!.reviews.map(review=>review.soldDrink?.id)).toEqual(['water','cola','orange']);
    expect(validateCozyCheckpoint(r.exportCheckpoint())).not.toBeNull();
  });
  it('does not consume a second bottle when the player already attached the requested one',()=>{
    const r=runtime(['cola']);expect(r.attachDrink('cola')).toBe(true);r.advanceElapsed(15000);
    expect(r.tickets).toHaveLength(0);expect(r.drinkStock.find(d=>d.id==='cola')!.quantity).toBe(1);
    r.closeDay();expect(r.daySummary).toMatchObject({revenue:85,drinkCost:10,delivered:1});
  });
  it('never substitutes another drink or charges a blocked order when the requested bottle runs out',()=>{
    const r=runtime(['water','water'],'regular',1);r.advanceElapsed(25000);
    expect(r.tickets).toHaveLength(1);expect(r.tickets[0]).toMatchObject({drink:'water',drinkAttached:false,stage:'boxed'});
    expect(r.drinkStock.map(d=>d.quantity)).toEqual([0,1,1]);
    const cash=r.state.cash;r.advanceElapsed(1000);expect(r.state.cash).toBe(cash);
    expect(r.attachDrink('cola')).toBe(false);r.closeDay();expect(r.daySummary).toMatchObject({revenue:80,drinkCost:8,delivered:1});
  });
  it.each([[true,null],[false,null],[true,'water'],[false,'water']] as const)('asks the player about bargain customers and completes exactly once after decision %s, drink %s',(accept,drink)=>{
    const r=runtime([drink],'bargain');const cash=r.state.cash;r.advanceElapsed(15000);
    expect(r.bargainPending).not.toBeNull();expect(r.pauses).toContain('bargain');expect(r.state.cash).toBe(cash);
    const bottles=r.drinkStock.find(d=>d.id==='water')!.quantity;
    expect(bottles).toBe(drink?1:2);r.advanceElapsed(5000);expect(r.drinkStock.find(d=>d.id==='water')!.quantity).toBe(bottles);
    expect(r.dispatch({type:'customer.bargain',accept})).toBe(true);expect(r.tickets).toHaveLength(0);
    const paid=r.state.cash;expect(paid).toBeGreaterThan(cash);r.advanceElapsed(1000);expect(r.state.cash).toBe(paid);
    expect(r.dispatch({type:'customer.bargain',accept})).toBe(false);r.closeDay();expect(r.daySummary?.delivered).toBe(1);
    expect(r.daySummary?.drinkCost).toBe(drink?8:0);expect(validateCozyCheckpoint(r.exportCheckpoint())).not.toBeNull();
  });
});
