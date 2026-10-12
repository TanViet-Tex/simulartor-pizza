import {ORDER_TEST_SCHEDULE} from './cozyScheduleFixture';
﻿import { describe, expect, it } from 'vitest';
import { CozyRuntime } from './CozyRuntime';
import { recipeIngredients, STOCK_INGREDIENTS, type StockRecipe } from '../domain/CozyStock';

// These first-day oven fixtures provision only the initially unlocked ingredients.
function provision(runtime: CozyRuntime, quantity = 1) { for (const id of ['dough','sauce','cheese','mushroom'] as const) expect(runtime.buy(id, quantity)).toBe(true); }
function cook(runtime: CozyRuntime, recipe: StockRecipe) {
  for (const ingredient of recipeIngredients(recipe)) expect(runtime.dispatch({ type: 'ingredient', ingredient })).toBe(true);
  expect(runtime.bakeReady).toBe(true); expect(runtime.dispatch({ type: 'bake' })).toBe(true);
}
function advance(runtime: CozyRuntime, seconds: number) { for (let i = 0; i < seconds * 4; i++) { runtime.advance(250); } }

describe('production preparation and bake-time consumption', () => {
  it('starts empty, reports exact missing ingredients and prevents bypassing the shop', () => {
    const runtime = new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);
    expect(runtime.state.cash).toBe(500); expect(runtime.shopPhase).toBe('preparation');
    expect(runtime.missingReason).toBe('Còn thiếu: Đế bánh ×1, Sốt cà chua ×1, Phô mai ×1.');
    expect(runtime.canOpen).toBe(true); // Opening is allowed without stock; assembly still needs real ingredients.
    expect(runtime.dispatch({ type: 'ingredient', ingredient: 'dough' })).toBe(false);
    provision(runtime); expect(runtime.state.cash).toBe(480);
    expect(runtime.selectRecipe('mushroom')).toBe(true);
    expect(runtime.openShop()).toBe(true); expect(runtime.dispatch({ type: 'bake' })).toBe(false);

    expect(runtime.reserved('mushroom')).toBe(0); expect(runtime.available('mushroom')).toBe(1);
    expect(runtime.buy('dough', 1)).toBe(false);
    runtime.dispatch({ type: 'ingredient', ingredient: 'dough' });
    runtime.dispatch({ type: 'ingredient', ingredient: 'dough' });
    expect(runtime.owned('dough')).toBe(1); expect(runtime.reserved('dough')).toBe(0);
    expect(runtime.dispatch({ type: 'bake' })).toBe(false);
  });
  it('commits once on bake, pays selected mushroom recipe once on delivery', () => {
    const runtime = new CozyRuntime(false,true,ORDER_TEST_SCHEDULE); provision(runtime);
    runtime.selectRecipe('mushroom'); runtime.openShop();
    cook(runtime, 'mushroom');
    for (const id of STOCK_INGREDIENTS) { expect(runtime.owned(id)).toBe(0); expect(runtime.reserved(id)).toBe(0); }
    expect(runtime.dispatch({ type: 'bake' })).toBe(false);
    advance(runtime, runtime.bakeTiming.perfectStart); runtime.dispatch({ type: 'extract' }); runtime.dispatch({ type: 'box' });
    expect(runtime.dispatch({ type: 'deliver' })).toBe(true); expect(runtime.dispatch({ type: 'deliver' })).toBe(false);
    expect(runtime.state.cash).toBe(545); expect(runtime.shopPhase).toBe('delivered');
    expect(runtime.state).toMatchObject({ reputation: 51, energy: 75 });
  });
  it('burns consumed stock without refunds and permits an empty remake that cannot assemble', () => {
    const runtime = new CozyRuntime(false,true,ORDER_TEST_SCHEDULE); provision(runtime);
    runtime.openShop(); cook(runtime, 'cheese'); advance(runtime, 12);
    expect(runtime.state.stage).toBe('burnt'); expect(runtime.dispatch({ type: 'discard' })).toBe(true);
    expect(runtime.discardPending).toBe(true); expect(runtime.confirmDiscard()).toBe(true); expect(runtime.needsRemake).toBe(true); expect(runtime.remake()).toBe(true); expect(runtime.remake()).toBe(false);
    expect(runtime.state.cash).toBe(480); expect(runtime.owned('dough')).toBe(0);
    expect(runtime.prepareAgain()).toBe(true); expect(runtime.prepareAgain()).toBe(false);
    expect(runtime.state.cash).toBe(480); expect(runtime.owned('mushroom')).toBe(1);
    for (const id of recipeIngredients('cheese')) expect(runtime.buy(id, 1)).toBe(false);
    expect(runtime.returnToOrders()).toBe(true); expect(runtime.remake()).toBe(false); expect(runtime.state.cash).toBe(480);
    expect(runtime.reserved('dough')).toBe(0); expect(runtime.state.ingredients).toEqual([]);
  });
  it('remakes from stock purchased before opening without buying during the shift',()=>{
    const runtime=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);provision(runtime,2);runtime.openShop();cook(runtime,'cheese');
    advance(runtime,6);runtime.dispatch({type: 'extract'});runtime.requestDiscard();runtime.confirmDiscard();
    const cash=runtime.state.cash;expect(runtime.remake()).toBe(true);expect(runtime.remake()).toBe(false);
    expect(runtime.state.cash).toBe(cash);expect(runtime.reserved('dough')).toBe(0);
  });
  it('expires an uncommitted draft without consuming stock and honors independent pauses', () => {
    const runtime = new CozyRuntime(false,true,ORDER_TEST_SCHEDULE); provision(runtime); runtime.openShop();
    runtime.dispatch({ type: 'ingredient', ingredient: 'dough' });
    runtime.pause('user'); runtime.pause('orientation'); advance(runtime, 60);
    runtime.resume('user'); advance(runtime, 60); expect(runtime.reserved('dough')).toBe(0);
    const oldId = runtime.selectedTicketId;
    runtime.resume('orientation'); advance(runtime, 60);
    expect(runtime.bargainPending).toBeNull();expect(runtime.selectedTicket!.remaining).toBe(60);
    expect(runtime.resolveBargain(false)).toBe(false);advance(runtime,61);
    expect(runtime.tickets.some(t => t.id === oldId)).toBe(false);
    // Arrivals do not reserve stock; timeout clears the unpaid assembly.
    expect(runtime.tickets).toHaveLength(4); expect(runtime.reserved('dough')).toBe(0);
    expect(runtime.owned('dough')).toBe(1); expect(runtime.state.ingredients).toEqual([]);
    expect(runtime.state.cash).toBe(480); advance(runtime, 20); expect(runtime.tickets).toHaveLength(4);
  });
  it('keeps tutorial economics and inventory isolated before entering preparation', () => {
    const runtime = new CozyRuntime(true, true);
    expect(runtime.buy('dough', 1)).toBe(false); expect(runtime.productionActive).toBe(false);
    for (const ingredient of recipeIngredients('cheese')) runtime.dispatch({ type: 'ingredient', ingredient });
    runtime.dispatch({ type: 'bake' }); advance(runtime, runtime.bakeTiming.perfectStart);
    for (const type of ['extract', 'box', 'deliver'] as const) runtime.dispatch({ type });
    expect(runtime.commercialState.cash).toBe(500); expect(runtime.owned('cheese')).toBe(0);
    expect(runtime.startShift()).toBe(true); expect(runtime.shopPhase).toBe('preparation');
    expect(runtime.productionActive).toBe(true); expect(runtime.canOpen).toBe(true);
  });
});
