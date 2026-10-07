import {describe,it,expect} from 'vitest';
import {CozyRuntime,type CozyScheduleDependencies} from './CozyRuntime';
import {fundedShopCheckpoint} from './shopTestFixture';
import {chooseSpecialCustomer,specialOrderLine,specialThanksLine} from '../domain/SpecialCustomers';
import {SPECIAL_CUSTOMERS} from '../config/specialCustomers';
const schedule:CozyScheduleDependencies['schedule']=day=>({day,duration:240,grace:120,slots:[0,2,8].map((at,i)=>({id:`special-${i}`,at,kind:'picky',opportunity:'commercial',commercialOrdinal:i+1,takeaway:true}))});
function prepare(extra:CozyScheduleDependencies={}){
 let r=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint(8000),false,{vipRoll:()=>1,eventRoll:()=>1})!;
 while(r.preparationDay<10){r.openShop();r.closeDay();r=CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,{vipRoll:()=>1,eventRoll:()=>1})!;}
 return CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,{schedule,vipRoll:()=>0,eventRoll:()=>1,...extra})!;
}
describe('special customer presentation',()=>{
 it('selects stable identity, excludes active characters and falls back for mismatched recipe',()=>{
  const one=chooseSpecialCustomer(12,10,'first',[],true)!;
  expect(chooseSpecialCustomer(12,10,'first',[],true)).toEqual(one);
  expect(chooseSpecialCustomer(12,10,'first',[one.id],true)?.id).not.toBe(one.id);
  expect(chooseSpecialCustomer(12,10,'first',SPECIAL_CUSTOMERS.map(c=>c.id),true)).toBeNull();
  expect(specialOrderLine({...one,orderRecipe:'mushroom',orderLine:'Một pizza nấm nha!'},'cheese')).toBe('Cho mình một pizza nóng nha!');
  expect(specialOrderLine({...one,orderSupported:false},'cheese')).toBe('Cho mình một pizza nóng nha!');
  expect(specialThanksLine({...one,thanksSupported:false})).toBe('Cảm ơn quán nha!');
 });
 it('cosmetic KOL keeps ordinary quantity, price and patience and uses an existing budget slot',()=>{
  const base=prepare(),seed=base.campaignEvents.seed;let id='';
  for(let i=0;i<1000&&!id;i++)if(chooseSpecialCustomer(seed,10,`cosmetic-${i}`,[],false))id=`cosmetic-${i}`;
  expect(id).not.toBe('');
  const deps:CozyScheduleDependencies={vipRoll:()=>1,schedule:day=>({day,duration:240,grace:120,slots:[{id,at:0,kind:'hurry',opportunity:'commercial',commercialOrdinal:1,takeaway:true}]}),resolveItems:()=>Array.from({length:2},()=>({recipe:'cheese',price:50,finishingSauces:[]}))};
  const ordinary=prepare(deps),cosmetic=prepare(deps);ordinary.openShop();cosmetic.setSpecialPresentation(true);cosmetic.openShop();
  expect(cosmetic.specialWelcome?.customer.kind).toBe('kol');
  const fields=(r:CozyRuntime)=>{const t=r.selectedTicket!;return {vip:t.vip,kind:t.kind,quantity:t.quantity,totalPrice:t.totalPrice,patience:t.patience,items:t.items,attempted:r.shiftClock.attempted};};
  expect(fields(cosmetic)).toEqual(fields(ordinary));expect(cosmetic.state.cash).toBe(ordinary.state.cash);
 });
 it('freezes shift, oven and patience under intro, respects user lease and does not add arrivals',()=>{
  const r=prepare();for(const id of ['dough','sauce','cheese'] as const)r.buy(id,2);
  const forecast=r.marketForecast;r.setSpecialPresentation(true);r.openShop();
  expect(r.specialWelcome).not.toBeNull();expect(r.shiftClock.attempted).toBe(1);
  const user=r.acquirePause('user');r.advanceSpecialPresentation(5000);expect(r.specialWelcome?.remaining).toBe(2.5);
  r.advanceElapsed(10000);expect(r.shiftClock.elapsed).toBe(0);user.release();
  r.advanceSpecialPresentation(2500);expect(r.pauses).toEqual([]);expect(r.specialBubble?.fictional).toBe(true);
  const first=r.specialCustomerForTicket(r.selectedTicketId)!;
  for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});
  r.advanceElapsed(2000);expect(r.specialWelcome).not.toBeNull();expect(r.specialWelcome?.customer.id).not.toBe(first.id);
  const frozen={elapsed:r.shiftClock.elapsed,oven:r.ovenState?.ovenSeconds,patience:r.tickets.map(t=>t.remaining)};
  r.advanceElapsed(10000);expect({elapsed:r.shiftClock.elapsed,oven:r.ovenState?.ovenSeconds,patience:r.tickets.map(t=>t.remaining)}).toEqual(frozen);
  const held=r.acquirePause('user');r.setSpecialPresentation(false);expect(r.pauses).toEqual(['user']);held.release();
  expect(r.marketForecast.portions).toEqual(forecast.portions);expect(r.shiftClock.attempted).toBe(2);
 });
 it('emits one thanks bubble and exactly existing payment, never another payment on repeated delivery',()=>{
  const r=prepare({schedule:day=>({...schedule!(day,{} as never),slots:schedule!(day,{} as never).slots.slice(0,1)})});for(const id of ['dough','sauce','cheese'] as const)r.buy(id,1);r.setSpecialPresentation(true);r.openShop();r.advanceSpecialPresentation(2500);
  const id=r.selectedTicketId,before=r.state.cash;
  for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});
  r.advanceElapsed(7000);r.advanceSpecialPresentation(2500);r.advanceElapsed(50);r.dispatch({type:'extract'});r.dispatch({type:'box'});
  expect(r.dispatch({type:'deliver',sourceId:id,targetId:id,commandId:'one'})).toBe(true);
  const cash=r.state.cash,bubble=r.specialBubble;expect(cash-before).toBe(550);expect(bubble?.ticketId).toBe(id);
  expect(r.dispatch({type:'deliver',sourceId:id,targetId:id,commandId:'again'})).toBe(false);expect(r.state.cash).toBe(cash);expect(r.specialBubble).toEqual(bubble);
  r.advanceSpecialPresentation(3000);expect(r.specialBubble).toBeNull();
 });
});
