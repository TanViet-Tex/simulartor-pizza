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

describe('production preparation and reserved orders', () => {
  it('starts empty, reports exact missing ingredients and prevents bypassing the shop', () => {
    const runtime = new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);
    expect(runtime.state.cash).toBe(300); expect(runtime.shopPhase).toBe('preparation');
    expect(runtime.missingReason).toBe('Còn thiếu: Đế bánh ×1, Sốt cà chua ×1, Phô mai ×1.');
    expect(runtime.openShop()).toBe(false); 
    expect(runtime.dispatch({ type: 'ingredient', ingredient: 'dough' })).toBe(false);
    provision(runtime); expect(runtime.state.cash).toBe(280);
    expect(runtime.selectRecipe('mushroom')).toBe(true);
    expect(runtime.openShop()).toBe(true); expect(runtime.dispatch({ type: 'bake' })).toBe(false);

    expect(runtime.reserved('mushroom')).toBe(1); expect(runtime.available('mushroom')).toBe(0);
    expect(runtime.buy('dough', 1)).toBe(false);
    runtime.dispatch({ type: 'ingredient', ingredient: 'dough' });
    runtime.dispatch({ type: 'ingredient', ingredient: 'dough' });
    expect(runtime.owned('dough')).toBe(1); expect(runtime.reserved('dough')).toBe(1);
    expect(runtime.dispatch({ type: 'bake' })).toBe(false);
  });
  it('commits once on bake, pays selected mushroom recipe once on delivery', () => {
    const runtime = new CozyRuntime(false,true,ORDER_TEST_SCHEDULE); provision(runtime);
    runtime.selectRecipe('mushroom'); runtime.openShop();
    cook(runtime, 'mushroom');
    for (const id of STOCK_INGREDIENTS) { expect(runtime.owned(id)).toBe(0); expect(runtime.reserved(id)).toBe(0); }
    expect(runtime.dispatch({ type: 'bake' })).toBe(false);
    advance(runtime, 3); runtime.dispatch({ type: 'extract' }); runtime.dispatch({ type: 'box' });
    expect(runtime.dispatch({ type: 'deliver' })).toBe(true); expect(runtime.dispatch({ type: 'deliver' })).toBe(false);
    expect(runtime.state.cash).toBe(345); expect(runtime.shopPhase).toBe('delivered');
    expect(runtime.state).toMatchObject({ reputation: 51, energy: 75 });
  });
  it('burns consumed stock without refunds and requires a new funded reservation', () => {
    const runtime = new CozyRuntime(false,true,ORDER_TEST_SCHEDULE); provision(runtime);
    runtime.openShop(); cook(runtime, 'cheese'); advance(runtime, 12);
    expect(runtime.state.stage).toBe('burnt'); expect(runtime.dispatch({ type: 'discard' })).toBe(true);
    expect(runtime.discardPending).toBe(true); expect(runtime.confirmDiscard()).toBe(true); expect(runtime.needsRemake).toBe(true); expect(runtime.remake()).toBe(false);
    expect(runtime.state.cash).toBe(280); expect(runtime.owned('dough')).toBe(0);
    expect(runtime.prepareAgain()).toBe(true); expect(runtime.prepareAgain()).toBe(false);
    expect(runtime.state.cash).toBe(280); expect(runtime.owned('mushroom')).toBe(1);
    for (const id of recipeIngredients('cheese')) expect(runtime.buy(id, 1)).toBe(false);
    expect(runtime.returnToOrders()).toBe(true); expect(runtime.remake()).toBe(false); expect(runtime.state.cash).toBe(280);
    expect(runtime.reserved('dough')).toBe(0); expect(runtime.state.ingredients).toEqual([]);
  });
  it('remakes from stock purchased before opening without buying during the shift',()=>{
    const runtime=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);provision(runtime,2);runtime.openShop();cook(runtime,'cheese');
    advance(runtime,6);runtime.requestDiscard();runtime.confirmDiscard();
    const cash=runtime.state.cash;expect(runtime.remake()).toBe(true);expect(runtime.remake()).toBe(false);
    expect(runtime.state.cash).toBe(cash);expect(runtime.reserved('dough')).toBe(1);
  });
  it('releases timed-out ingredients and honors independent pauses', () => {
    const runtime = new CozyRuntime(false,true,ORDER_TEST_SCHEDULE); provision(runtime); runtime.openShop();
    runtime.dispatch({ type: 'ingredient', ingredient: 'dough' });
    runtime.pause('user'); runtime.pause('orientation'); advance(runtime, 60);
    runtime.resume('user'); advance(runtime, 60); expect(runtime.reserved('dough')).toBe(1);
    const oldId = runtime.selectedTicketId;
    runtime.resume('orientation'); advance(runtime, 60);
    expect(runtime.bargainPending).not.toBeNull();expect(runtime.selectedTicket!.remaining).toBe(60);
    expect(runtime.resolveBargain(false)).toBe(true);advance(runtime,61);
    expect(runtime.tickets.some(t => t.id === oldId)).toBe(false);
    // The next scheduled slot may reserve the newly released stock atomically.
    expect(runtime.tickets).toHaveLength(1); expect(runtime.reserved('dough')).toBe(1);
    expect(runtime.owned('dough')).toBe(1); expect(runtime.state.ingredients).toEqual([]);
    expect(runtime.state.cash).toBe(280); advance(runtime, 20); expect(runtime.tickets).toHaveLength(1);
  });
  it('keeps tutorial economics and inventory isolated before entering preparation', () => {
    const runtime = new CozyRuntime(true, true);
    expect(runtime.buy('dough', 1)).toBe(false); expect(runtime.productionActive).toBe(false);
    for (const ingredient of recipeIngredients('cheese')) runtime.dispatch({ type: 'ingredient', ingredient });
    runtime.dispatch({ type: 'bake' }); advance(runtime, 3);
    for (const type of ['extract', 'box', 'deliver'] as const) runtime.dispatch({ type });
    expect(runtime.commercialState.cash).toBe(300); expect(runtime.owned('cheese')).toBe(0);
    expect(runtime.startShift()).toBe(true); expect(runtime.shopPhase).toBe('preparation');
    expect(runtime.productionActive).toBe(true); expect(runtime.canOpen).toBe(false);
  });
});

