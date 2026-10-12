import {ORDER_TEST_SCHEDULE} from './cozyScheduleFixture';
import { describe, expect, it } from 'vitest';
import { CozyRuntime } from './CozyRuntime';
import { recipeIngredients, STOCK_INGREDIENTS } from '../domain/CozyStock';
function shop(quantity = 4) { const r = new CozyRuntime(false,true,ORDER_TEST_SCHEDULE); for (const id of STOCK_INGREDIENTS) r.buy(id, quantity); r.openShop(); return r; }
function advance(r: CozyRuntime, seconds: number) { for (let i = 0; i < seconds * 20; i++) r.advance(50); }
function prepare(r: CozyRuntime) { for (const ingredient of recipeIngredients(r.selectedRecipe)) r.dispatch({ type: 'ingredient', ingredient }); }
describe('Story 1.5 automatic tickets and shared oven', () => {
  it('does not process arrivals before opening; opening creates exactly one ticket without pausing', () => {
    const r = new CozyRuntime(false,true,ORDER_TEST_SCHEDULE); for (const id of STOCK_INGREDIENTS) r.buy(id, 4);
    expect(r.processArrival('arrival-0')).toBe(false); expect(r.tickets).toHaveLength(0);
    expect(r.openShop()).toBe(true); expect(r.openShop()).toBe(false);
    expect(r.processArrival('arrival-0')).toBe(false); expect(r.processArrival('arrival-1')).toBe(false);
    expect(r.tickets).toHaveLength(1); expect(r.reserved('dough')).toBe(0); expect(r.pauses).toEqual([]);
    expect(r.tickets[0]).toMatchObject({kind:'regular', patience:120, remaining:120, extraPenalty:0});
    advance(r, 1); expect(r.tickets[0]!.remaining).toBe(119);
  });
  it('schedules hurried and picky tickets with configured patience and preserves selection', () => {
    const r = shop(), first = r.selectedTicketId; advance(r, 20);
    expect(r.tickets).toHaveLength(2); expect(r.selectedTicketId).toBe(first); expect(r.pauses).toEqual([]);
    expect(r.tickets[1]).toMatchObject({kind:'hurry', patience:75, remaining:75, extraPenalty:0});
    advance(r, 20); expect(r.tickets[2]).toMatchObject({kind:'picky', patience:100, remaining:100, extraPenalty:1});
    expect(r.reserved('dough')).toBe(0); advance(r,20);
    expect(r.tickets).toHaveLength(4); expect(r.selectedTicketId).toBe(first);
    expect(r.tickets[3]).toMatchObject({kind:'bargain',patience:110,remaining:110});
    expect(r.bargainPending).toBeNull(); // Negotiation happens at delivery, not arrival.
    const lots=r.stockLots;advance(r,20);
    expect(r.tickets).toHaveLength(4);expect(r.stockLots).toEqual(lots);
    expect(r.shopMessage).toContain('4 đơn');
    const before=r.events;expect(r.processArrival('arrival-4')).toBe(false);expect(r.events).toEqual(before);
  });
  it('rejects wrong IDs and arrivals during user pause, preparation and delivery screen', () => {
    const r=shop(); const before=r.events;
    expect(r.processArrival('unknown')).toBe(false); expect(r.processArrival('arrival-2')).toBe(false);
    r.pause('user'); expect(r.processArrival('arrival-1')).toBe(false); advance(r,40); r.resume('user');
    r.prepareAgain(); expect(r.processArrival('arrival-1')).toBe(false); advance(r,40); r.returnToOrders();
    expect(r.events).toEqual(before); expect(r.tickets[0]!.remaining).toBe(120);
    prepare(r); r.dispatch({type:'bake'}); advance(r,r.bakeTiming.perfectStart); r.dispatch({type:'extract'}); r.dispatch({type:'box'}); r.dispatch({type:'deliver'});
    advance(r,40); expect(r.processArrival('arrival-1')).toBe(false); expect(r.tickets).toHaveLength(2);
    expect(r.selectedTicketId).not.toBeNull(); // Successful delivery continues the real shift immediately.
    const tickets=r.tickets;expect(r.continueShift()).toBe(false);expect(r.tickets).toEqual(tickets);
  });
  it('accepts arrivals without early stock holds and rejects an unfunded bake atomically', () => {
    const r=shop(1),first=r.selectedTicketId!;prepare(r);expect(r.dispatch({type:'bake'})).toBe(true);
    advance(r,r.bakeTiming.perfectStart);expect(r.dispatch({type:'extract'})).toBe(true);expect(r.dispatch({type:'box'})).toBe(true);
    advance(r,20-r.bakeTiming.perfectStart);const second=r.tickets.find(t=>t.id!==first)!;
    expect(second).toMatchObject({stage:'assembly'});expect(r.reserved('dough')).toBe(0);
    expect(r.processArrival('arrival-1')).toBe(false);expect(r.pauses).toEqual([]);
    expect(r.dispatch({type:'deliver',sourceId:first,targetId:first,commandId:'first'})).toBe(true);
    expect(r.selectTicket(second.id)).toBe(true);const cash=r.state.cash,lots=r.stockLots;
    expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(false);expect(r.dispatch({type:'bake'})).toBe(false);
    expect(r.state.cash).toBe(cash);expect(r.stockLots).toEqual(lots);expect(r.lastResult?.targetId).toBe(first);
    expect(r.prepareAgain()).toBe(true);expect(r.buy('dough',1)).toBe(false);expect(r.returnToOrders()).toBe(true);
    expect(r.tickets).toHaveLength(1);expect(r.selectedTicketId).toBe(second.id);
  });
  it('arrival does not stop a heating oven or steal its controls; a second bake is atomic', () => {
    const r=shop(); const first=r.selectedTicketId; advance(r,18); prepare(r); r.dispatch({type:'bake'}); advance(r,2);
    expect(r.tickets).toHaveLength(2); expect(r.selectedTicketId).toBe(first); expect(r.ovenOwner).toBe(first); expect(r.ovenState!.ovenSeconds).toBe(2);
    advance(r,.05); expect(r.ovenState!.ovenSeconds).toBe(2.05); expect(r.pauses).toEqual([]);
    const second=r.tickets[1]!.id; r.selectTicket(second); const stock=r.owned('dough');
    for(const ingredient of recipeIngredients(r.selectedRecipe))expect(r.dispatch({type:'ingredient',ingredient})).toBe(false);
    expect(r.dispatch({type:'bake'})).toBe(false); expect(r.owned('dough')).toBe(stock); expect(r.ovenOwner).toBe(first);
    advance(r,r.bakeTiming.perfectStart-2.05); r.selectTicket(first); expect(r.dispatch({type:'extract'})).toBe(true); r.selectTicket(second);
    expect(r.dispatch({type:'bake'})).toBe(false);expect(r.productionOwnerId).toBe(first);
    r.selectTicket(first);expect(r.dispatch({type:'box'})).toBe(true);expect(r.dispatch({type:'deliver'})).toBe(true);
    r.selectTicket(second);prepare(r);expect(r.dispatch({type:'bake'})).toBe(true);expect(r.dispatch({type:'bake'})).toBe(false);expect(r.owned('dough')).toBe(stock-1);
  });
  it('retains raw discard confirmation, no refund and a fresh reservation for remake', () => {
    const r=shop(), id=r.selectedTicketId; prepare(r); r.dispatch({type:'bake'}); advance(r,2.95); r.dispatch({type:'extract'});
    expect(r.state.stage).toBe('raw'); const cash=r.state.cash, stock=r.owned('dough'), remaining=r.selectedTicket!.remaining;
    r.requestDiscard(); r.cancelDiscard(); expect(r.state.stage).toBe('raw'); r.requestDiscard(); r.confirmDiscard();
    expect(r.confirmDiscard()).toBe(false); expect(r.owned('dough')).toBe(stock); expect(r.state.cash).toBe(cash); expect(r.needsRemake).toBe(true);
    expect(r.remake()).toBe(true); expect(r.remake()).toBe(false); expect(r.selectedTicketId).toBe(id); expect(r.selectedTicket!.remaining).toBe(remaining);
    prepare(r); r.dispatch({type:'bake'}); advance(r,r.bakeTiming.perfectStart); expect(r.dispatch({type:'extract'})).toBe(true); expect(r.state.stage).toBe('ready');
  });
  it('burns after the current perfect window and frees the oven only on confirmed discard', () => {
    const r=shop(); prepare(r); r.dispatch({type:'bake'}); advance(r,r.bakeTiming.perfectEnd+.05); expect(r.state.stage).toBe('burnt');
    r.requestDiscard(); r.cancelDiscard(); expect(r.ovenOwner).toBe(r.selectedTicketId);
    r.requestDiscard(); r.pause('visibility'); expect(r.confirmDiscard()).toBe(false); r.resume('visibility'); r.confirmDiscard(); expect(r.ovenOwner).toBeNull();
  });
  it('does not pay another boxed ticket after a rapid duplicate delivery', () => {
    const r=shop(), first=r.selectedTicketId; prepare(r); r.dispatch({type:'bake'}); advance(r,r.bakeTiming.perfectStart); r.dispatch({type:'extract'}); r.dispatch({type:'box'});
    advance(r,14); const second=r.tickets[1]!.id,secondPrice=r.tickets[1]!.finalPrice; r.selectTicket(first);
    expect(r.dispatch({type:'deliver',targetId:first,sourceId:first,commandId:'first-paid'})).toBe(true);const cash=r.state.cash;
    r.selectTicket(second);prepare(r);expect(r.dispatch({type:'bake'})).toBe(true);advance(r,r.bakeTiming.perfectStart);expect(r.dispatch({type:'extract'})).toBe(true);expect(r.dispatch({type:'box'})).toBe(true);
    expect(r.dispatch({type:'deliver',targetId:second,sourceId:second,commandId:'first-paid'})).toBe(false);expect(r.state.cash).toBe(cash);expect(r.state.stage).toBe('boxed');
    expect(r.dispatch({type:'deliver',targetId:second,sourceId:second,commandId:'second-paid'})).toBe(true);expect(r.state.cash).toBe(cash+secondPrice);
  });
  it('emits the same deterministic arrival and oven events for fixed commands', () => {
    function flow(){const r=shop(); prepare(r); r.dispatch({type:'bake'}); advance(r,r.bakeTiming.perfectStart); r.dispatch({type:'extract'}); r.requestDiscard(); r.confirmDiscard(); advance(r,14); return r.events;}
    expect(flow()).toEqual(flow()); expect(flow()).toContain('0.00:arrived:arrival-0:cozy-1'); expect(flow()).toContain('20.00:arrived:arrival-1:cozy-2');
  });
  it('keeps recovery clock frozen and resumes the original ticket and arrival schedule', () => {
    const r=shop(); prepare(r); r.dispatch({type:'bake'}); r.dispatch({type:'extract'}); r.requestDiscard(); r.confirmDiscard();
    const first=r.selectedTicketId; r.prepareAgain(); r.selectRecipe('mushroom'); advance(r,40);
    expect(r.tickets[0]!.remaining).toBe(120); expect(r.tickets[0]!.recipe).toBe('cheese'); r.returnToOrders(); expect(r.selectedTicketId).toBe(first); expect(r.selectedRecipe).toBe('cheese');
    r.remake(); prepare(r); r.dispatch({type:'bake'}); advance(r,r.bakeTiming.perfectStart); r.dispatch({type:'extract'}); r.dispatch({type:'box'}); r.dispatch({type:'deliver'}); expect(r.lastDelivery).toMatchObject({recipe:'cheese',price:60});
  });
});
