import {ORDER_TEST_SCHEDULE} from './cozyScheduleFixture';
import { expect, it } from 'vitest';
import { CozyRuntime } from './CozyRuntime';
function shop() { const r=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE); for(const id of ['dough','sauce','cheese','mushroom'] as const)r.buy(id,4); r.openShop(); return r; }
function time(r:CozyRuntime,s:number){for(let i=0;i<s*20;i++)r.advance(50);}
function cook(r:CozyRuntime){for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});time(r,3);r.dispatch({type:'extract'});}
it('confirms unboxed delivery, cancel preserves state, and duplicate commands cannot pay another target',()=>{
  const r=shop(),source=r.selectedTicketId; cook(r);time(r,17);const target=r.tickets[1]!.id;
  const cash=r.state.cash;
  expect(r.dispatch({type:'deliver',sourceId:source,targetId:source,commandId:'delivery-1'})).toBe(true);
  expect(r.deliveryPending).toMatchObject({sourceId:source,targetId:source});expect(r.state.cash).toBe(cash);
  expect(r.cancelDelivery()).toBe(true);expect(r.state.stage).toBe('ready');expect(r.tickets).toHaveLength(2);
  r.dispatch({type:'box'});
  expect(r.dispatch({type:'deliver',sourceId:source,targetId:source,commandId:'delivery-1'})).toBe(true);
  expect(r.lastResult).toMatchObject({stars:5,price:50,targetId:source});
  expect(r.dispatch({type:'deliver',sourceId:source,targetId:target,commandId:'delivery-1'})).toBe(false);
  expect(r.state.cash).toBe(cash+50);expect(r.events.filter(e=>e.includes('delivered:'))).toHaveLength(1);
  r.selectTicket(target);cook(r);r.dispatch({type:'box'});
  expect(r.dispatch({type:'deliver',sourceId:target,targetId:target,commandId:'delivery-1'})).toBe(false);
  expect(r.state.stage).toBe('boxed');expect(r.state.cash).toBe(cash+50);
});
it('confirms a wrong target recipe and preserves both tickets on cancellation',()=>{
  const r=shop(),source=r.selectedTicketId; cook(r);r.dispatch({type:'box'});
  r.prepareAgain();r.selectRecipe('mushroom');r.returnToOrders();time(r,17);const target=r.tickets[1]!.id;
  r.selectTicket(target);const cash=r.state.cash;
  r.dispatch({type:'deliver',sourceId:source,targetId:target,commandId:'wrong-1'});
  expect(r.deliveryPending?.reasons).toContain('Sai công thức');r.cancelDelivery();expect(r.tickets).toHaveLength(2);expect(r.state.cash).toBe(cash);
  r.dispatch({type:'deliver',sourceId:source,targetId:target,commandId:'wrong-2'});expect(r.confirmDelivery()).toBe(true);
  expect(r.lastResult).toMatchObject({targetId:target,stars:3,price:65});expect(r.tickets.map(t=>t.id)).toEqual([source]);
  expect(r.confirmDelivery()).toBe(false);
});
it('closes a committed ticket at zero once, retains pizza for discard, and rejects stale delivery without consumption',()=>{
  const r=shop(),id=r.selectedTicketId;cook(r);time(r,117);
  expect(r.tickets.some(t=>t.id===id)).toBe(false);expect(r.lastResult).toMatchObject({targetId:id,stars:1,price:0,outcome:'expired'});
  const cash=r.state.cash,stock=r.owned('dough');
  expect(r.dispatch({type:'deliver',sourceId:id,targetId:id,commandId:'stale'})).toBe(false);
  expect(r.state.stage).toBe('ready');expect(r.state.cash).toBe(cash);expect(r.events.filter(e=>e.endsWith('expired:'+id))).toHaveLength(1);
  expect(r.requestDiscard()).toBe(true);expect(r.confirmDiscard()).toBe(true);expect(r.owned('dough')).toBe(stock);
});
it('expired oven pizzas keep the shared oven busy until confirmed discard without refund',()=>{
  const r=shop(),id=r.selectedTicketId;time(r,119);
  for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});
  r.dispatch({type:'bake'});const stock=r.owned('dough');time(r,1);
  expect(r.ovenOwner).toBe(id);expect(r.selectedExpired).toBe(true);
  expect(r.selectTicket(id)).toBe(false);expect(r.requestDiscard()).toBe(true);
  r.cancelDiscard();expect(r.ovenOwner).toBe(id);
  r.requestDiscard();r.confirmDiscard();expect(r.ovenOwner).toBeNull();expect(r.owned('dough')).toBe(stock);
});
it('delivery confirmation owns its pause and cannot release visibility or alter its captured target',()=>{
  const r=shop(),id=r.selectedTicketId;cook(r);
  r.dispatch({type:'deliver',sourceId:id,targetId:id,commandId:'paused'});
  const remaining=r.selectedTicket!.remaining;time(r,40);expect(r.selectedTicket!.remaining).toBe(remaining);
  r.pause('visibility');expect(r.confirmDelivery()).toBe(false);expect(r.cancelDelivery()).toBe(false);
  r.resume('visibility');expect(r.confirmDelivery()).toBe(true);expect(r.lastResult).toMatchObject({targetId:id,stars:3});
  expect(r.confirmDelivery()).toBe(false);expect(r.pauses).toEqual([]);
});
it('delivering a different pizza to an oven owner preserves that owners consumed pizza for discard',()=>{
  const r=shop(),first=r.selectedTicketId;cook(r);r.dispatch({type:'box'});time(r,17);
  const second=r.tickets[1]!.id;r.selectTicket(second);
  for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});
  expect(r.dispatch({type:'deliver',sourceId:first,targetId:second,commandId:'cross'})).toBe(true);
  expect(r.ovenOwner).toBe(second);expect(r.tickets.some(t=>t.id===second)).toBe(false);
  expect(r.selectPizza(second)).toBe(true);expect(r.requestDiscard()).toBe(true);r.confirmDiscard();expect(r.ovenOwner).toBeNull();
});
