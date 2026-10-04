import {ORDER_TEST_SCHEDULE} from './cozyScheduleFixture';
import {expect,it} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
function provision(r:CozyRuntime,q=2){for(const i of ['dough','sauce','cheese'] as const)r.buy(i,q);}
function bake(r:CozyRuntime){for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});expect(r.dispatch({type:'bake'})).toBe(true);}
function identities(r:CozyRuntime){
  const s=r.daySummary!,a=s.accounts;
  expect(a.endingCash).toBe(a.startingCash+a.sales+a.rewards-a.purchases-a.rent-a.wages-a.repairs-a.other);
  expect(a.endingCash).toBe(s.cash);
  expect(a.profit).toBe(a.sales-a.consumed-a.expired-a.rent-a.wages-a.repairs-a.other);
  expect(a.openingInventoryValue+a.purchases).toBe(a.consumed+a.expired+a.inventory.value);
  expect(a.profit).toBe(s.profit);return a;
}
it('separates cash purchases from business cost, spoilage and retained historical valuation',()=>{
  const r=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);provision(r);r.buy('mushroom',2);r.openShop();bake(r);
  for(let i=0;i<120;i++)r.advance(50);r.dispatch({type:'extract'});r.dispatch({type:'box'});r.dispatch({type:'deliver'});r.closeDay();
  const a=identities(r);expect(a).toMatchObject({startingCash:300,sales:50,rewards:0,purchases:40,consumed:15,expired:10,rent:20,wages:0,repairs:0,other:0,endingCash:290,profit:5,openingInventoryValue:0,inventory:{units:3,value:15},cumulativeProfit:5});
  expect(a.zeroReasons.wages).toContain('nhân viên');expect(a.zeroReasons.repairs).toContain('hỏng');
  const snapshot=r.daySummary;r.buy('dough',1);r.buy('mushroom',1);expect(r.state.cash).toBe(278);expect(r.daySummary).toEqual(snapshot);
  a.inventory.lots[0]!.quantity=999;expect(r.daySummary!.accounts.inventory.units).toBe(3);
  expect(r.openNextDay()).toBe(true);r.closeDay();const b=identities(r);
  expect(b).toMatchObject({startingCash:290,openingInventoryValue:15,purchases:12,consumed:0,expired:21,rent:20,endingCash:258,profit:-41,cumulativeProfit:-36,inventory:{units:1,value:6}});
  const cash=r.state.cash;expect(r.closeDay()).toBe(false);expect(r.state.cash).toBe(cash);
});
it('counts discarded and remade stock once with no stock refund',()=>{
  const r=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);provision(r);r.openShop();bake(r);
  r.dispatch({type:'extract'});expect(r.requestDiscard()).toBe(true);expect(r.confirmDiscard()).toBe(true);expect(r.remake()).toBe(true);bake(r);r.closeDay();
  expect(identities(r)).toMatchObject({sales:0,purchases:30,consumed:30,expired:0,profit:-50,endingCash:250,inventory:{value:0,units:0}});
});
it('keeps terminal selectors on day three and refuses further economic commands',()=>{
  const r=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);provision(r,1);r.openShop();
  for(let d=1;d<=3;d++){r.closeDay();identities(r);if(d<3){if(!r.owned('dough'))provision(r,1);expect(r.openNextDay()).toBe(true);}}
  const report=r.daySummary;expect(r.preparationDay).toBe(3);expect(r.price('dough')).toBe(5);
  expect(r.buy('dough',1)).toBe(false);expect(r.setMenuPrice('cheese',110)).toBe(false);expect(r.openNextDay()).toBe(false);expect(r.daySummary).toEqual(report);
});
