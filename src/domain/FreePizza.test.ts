import { describe, expect, it } from 'vitest';
import { bakeTiming, type OvenLevel } from '../config/bakeTiming';
import { CozyOrder } from './CozyOrder';
import { CozyStock, STOCK_INGREDIENTS, expressIngredientPrice } from './CozyStock';

describe('free pizza assembly and real ingredient cost', () => {
  it('allows eight layers, then reports wrong recipe only on delivery', () => {
    const order = new CozyOrder(false, 'cheese', true);
    for (const ingredient of ['dough', 'sauce', 'cheese', 'mushroom', 'sausage', 'pepper', 'corn', 'olive'] as const) expect(order.dispatch({type:'ingredient', ingredient})).toBe(true);
    expect(order.bakeReady).toBe(true);
    expect(order.dispatch({type:'bake'})).toBe(true);
    order.tick(6);
    expect(order.dispatch({type:'extract'})).toBe(true);
    expect(order.dispatch({type:'box'})).toBe(true);
    expect(order.dispatch({type:'deliver'})).toBe(true);
    expect(order.state.cash).toBe(300);
    expect(order.state.feedback).toContain('không đúng');
  });
  it.each([0,1,2] as OvenLevel[])('uses exact upgrade %i boundaries', level => {
    const timing = bakeTiming(level);
    const ready = new CozyOrder(false, 'cheese', true, level);
    ready.dispatch({type:'ingredient',ingredient:'dough'});ready.dispatch({type:'bake'});
    ready.tick(timing.perfectEnd);
    expect(ready.state.stage).toBe('baking');
    expect(ready.dispatch({type:'extract'})).toBe(true);
    expect(ready.state.stage).toBe('ready');
    const burnt = new CozyOrder(false, 'cheese', true, level);
    burnt.dispatch({type:'ingredient',ingredient:'dough'});burnt.dispatch({type:'bake'});
    burnt.tick(timing.perfectEnd + .05);
    expect(burnt.state.stage).toBe('burnt');
    expect(timing.perfectStart).toBe(6-level*2);
  });
  it('reserves the actual eight ingredients atomically and consumes once', () => {
    const stock = new CozyStock();
    const actual = ['dough','sauce','cheese','mushroom','pepper','corn','olive','onion'] as const;
    for(const id of actual)expect(stock.buy(id,1)).toBe(true);
    expect(STOCK_INGREDIENTS).toHaveLength(19);
    expect(stock.reserveIngredients('pizza',actual,30)).toBe(true);
    expect(stock.reserveIngredients('pizza',[...actual,'shrimp'],30)).toBe(false);
    expect(stock.reserved('dough')).toBe(1);
    expect(stock.commit('pizza',actual)).toBe(true);
    expect(stock.commit('pizza',actual)).toBe(false);
    expect(stock.inventorySnapshot().units).toBe(0);
    expect(stock.ledger(1).consumed).toBe(stock.ledger(1).purchases);
  });
  it('charges premium once and receives paid stock once, preserving the cost in saves', () => {
    const stock = new CozyStock();
    const price = expressIngredientPrice('cheese',1);
    expect(price).toBe(12);
    expect(stock.orderExpress('rush','cheese',2,1)?.total).toBe(24);
    expect(stock.orderExpress('rush','cheese',2,1)?.total).toBe(24);
    expect(stock.cash).toBe(276);
    expect(stock.owned('cheese')).toBe(0);
    expect(stock.receiveExpress('rush')).toBe(true);
    expect(stock.receiveExpress('rush')).toBe(false);
    expect(stock.owned('cheese')).toBe(2);
    expect(stock.ledger(1).purchases).toBe(24);
    expect(CozyStock.restore(stock.exportCheckpoint())?.lots[0].unitCost).toBe(12);
  });
});
