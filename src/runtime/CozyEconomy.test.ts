import {ORDER_TEST_SCHEDULE} from './cozyScheduleFixture';
import {expect,it} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
function provision(r:CozyRuntime,qty=2){for(const id of ['dough','sauce','cheese'] as const)r.buy(id,qty);}
it('rejects buying after opening, including the stock inspection surface',()=>{
  const r=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);provision(r);r.openShop();r.prepareAgain();
  const cash=r.state.cash,lots=r.stockLots;
  expect(r.buy('dough',1)).toBe(false);expect(r.state.cash).toBe(cash);expect(r.stockLots).toEqual(lots);
  expect(r.shopMessage).toContain('trước khi mở');
});
it('deduplicates accepted purchase commands while allowing independent purchases',()=>{
  const r=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);
  const command={type:'market.buy' as const,ingredient:'dough' as const,quantity:2,commandId:'purchase-1'};
  expect(r.dispatch(command)).toBe(true);expect(r.dispatch(command)).toBe(false);
  expect(r.state.cash).toBe(290);expect(r.owned('dough')).toBe(2);
  expect(r.dispatch({...command,commandId:'purchase-2'})).toBe(true);expect(r.state.cash).toBe(280);
});
it('reports rent and warning without inventing next day prices',()=>{
  const r=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);provision(r,19);
  expect(r.preparationBudget).toMatchObject({cash:15,rent:20,afterRent:-5});
  expect(r.preparationBudget.warning).toContain('thuê');expect(r.canOpen).toBe(true);
  expect(r.price('dough')).toBe(5);
});
it('prices stay immutable in a shift and prepare next day without rewriting the report',()=>{
  const r=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);provision(r);
  expect(r.dispatch({type:'customer.price',recipe:'cheese',percent:120})).toBe(true);
  expect(r.customerProgress.pricePercents.cheese).toBe(120);r.openShop();
  expect(r.tickets[0]!.finalPrice).toBe(60);r.prepareAgain();
  expect(r.setMenuPrice('cheese',80)).toBe(false);r.returnToOrders();r.closeDay();
  const report=r.daySummary;expect(r.setMenuPrice('cheese',80)).toBe(true);
  expect(r.daySummary).toEqual(report);expect(r.customerProgress.prices.cheese).toBe(40);
});
