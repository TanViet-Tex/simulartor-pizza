import { describe, expect, it } from 'vitest';
import { CozyStock, STOCK_INGREDIENTS } from './CozyStock';

describe('real stock ledger', () => {
  it('settles dated lots once and uses retained lot cost instead of the new purchase price',()=>{
    const stock=new CozyStock();stock.buy('dough',2,1);stock.buy('sauce',2,1);stock.buy('cheese',2,1);stock.buy('mushroom',2,1);
    expect(stock.settle(1)).toEqual({expired:10,rent:20});const cash=stock.cash;expect(stock.settle(1)).toEqual({expired:10,rent:20});expect(stock.cash).toBe(cash);
    expect(stock.buy('dough',1,1)).toBe(false);expect(stock.buy('dough',1,2)).toBe(true);expect(stock.lots[stock.lots.length-1]).toMatchObject({day:2,expiry:3,unitCost:6});
    stock.reserve('day2','cheese',120);expect(stock.commit('day2',['dough','sauce','cheese'],2)).toBe(true);
    expect(stock.ledger(1)).toEqual({purchases:40,consumed:0});expect(stock.ledger(2)).toEqual({purchases:6,consumed:15});
    expect(stock.settle(2)).toEqual({expired:12,rent:20});expect(stock.lots).toEqual([expect.objectContaining({ingredient:'sauce',quantity:1,expiry:1000001}),expect.objectContaining({ingredient:'dough',quantity:1,unitCost:6,expiry:3})]);
  });
  it('rejects unsupported dates without cash or ledger mutations',()=>{
    const stock=new CozyStock();for(const day of [0,1000001,-1,NaN,.5]){expect(stock.buy('cheese',1,day)).toBe(false);expect(stock.settle(day)).toEqual({expired:0,rent:0});}
    expect(stock.cash).toBe(300);expect(stock.lots).toEqual([]);
  });
  it('records each Day 1 purchase lot and consumes FIFO with exact unit cost conservation', () => {
    const stock = new CozyStock();
    stock.buy('dough', 1); stock.buy('dough', 2); stock.buy('sauce', 3); stock.buy('cheese', 3); stock.buy('mushroom', 2);
    expect(stock.lots).toEqual([
      { id: 1, ingredient: 'dough', quantity: 1, unitCost: 5, day: 1, expiry: 2 },
      { id: 2, ingredient: 'dough', quantity: 2, unitCost: 5, day: 1, expiry: 2 },
      { id: 3, ingredient: 'sauce', quantity: 3, unitCost: 3, day: 1, expiry: 1000001 },
      { id: 4, ingredient: 'cheese', quantity: 3, unitCost: 7, day: 1, expiry: 2 },
      { id: 5, ingredient: 'mushroom', quantity: 2, unitCost: 5, day: 1, expiry: 1 },
    ]);
    const totalCost = stock.lots.reduce((sum, lot) => sum + lot.quantity * lot.unitCost, 0);
    expect(stock.cash + totalCost).toBe(300);
    stock.reserve('pizza', 'cheese', 60); stock.commit('pizza', ['dough', 'sauce', 'cheese']);
    expect(stock.lots.some(lot => lot.id === 1)).toBe(false);
    expect(stock.lots.find(lot => lot.id === 2)?.quantity).toBe(2);
    expect(stock.lots.reduce((sum, lot) => sum + lot.quantity * lot.unitCost, 0)).toBe(totalCost - 15);
    const detached = stock.lots[0] as { quantity: number }; detached.quantity = 999;
    expect(stock.owned('dough')).toBe(2);
  });
  it('buys exact catalog prices atomically and rejects invalid quantities or unaffordable purchases', () => {
    const stock = new CozyStock();
    for (const id of STOCK_INGREDIENTS) expect(stock.owned(id)).toBe(0);
    for (const qty of [0, -1, .5, NaN, Infinity, 101]) expect(stock.buy('cheese', qty)).toBe(false);
    expect(stock.buy('cheese', 100)).toBe(false);
    expect(stock.cash).toBe(300); expect(stock.owned('cheese')).toBe(0);
    expect(stock.buy('dough', 2)).toBe(true); expect(stock.cash).toBe(290);
    expect(stock.buy('sauce', 2)).toBe(true); expect(stock.cash).toBe(284);
    expect(stock.buy('cheese', 2)).toBe(true); expect(stock.cash).toBe(270);
    expect(stock.buy('mushroom', 2)).toBe(true); expect(stock.cash).toBe(260);
  });
  it('excludes reserved units across simultaneous tickets, releases unused stock and prevents duplicate consumption', () => {
    const stock = new CozyStock();
    for (const id of STOCK_INGREDIENTS) stock.buy(id, 2);
    expect(stock.reserve('A', 'mushroom', 60)).toBe(true);
    expect(stock.reserve('A', 'cheese', 60)).toBe(false);
    expect(stock.reserve('B', 'cheese', 60)).toBe(true);
    expect(stock.reserve('C', 'cheese', 60)).toBe(false);
    expect(stock.available('dough')).toBe(0);
    expect(stock.owned('dough')).toBe(2); expect(stock.reserved('dough')).toBe(2);
    expect(stock.commit('A', ['dough', 'dough'])).toBe(false);
    expect(stock.commit('B', ['mushroom'])).toBe(false);
    expect(stock.owned('dough')).toBe(2);
    expect(stock.commit('A', ['dough', 'sauce', 'cheese'])).toBe(true);
    expect(stock.available('mushroom')).toBe(2);
    expect(stock.owned('dough')).toBe(1); expect(stock.available('dough')).toBe(0);
    expect(stock.commit('A', ['dough'])).toBe(false);
    expect(stock.release('A')).toBe(false);
    expect(stock.release('B')).toBe(true); expect(stock.release('B')).toBe(false);
    expect(stock.available('dough')).toBe(1);
  });
  it('expires only due reservations, idempotently, without changing owned stock or cash', () => {
    const stock = new CozyStock();
    for (const id of STOCK_INGREDIENTS) stock.buy(id, 2);
    const cash = stock.cash;
    stock.reserve('first', 'mushroom', 10); stock.reserve('second', 'cheese', 20);
    expect(stock.expire(9)).toEqual([]); expect(stock.expire(10)).toEqual(['first']);
    expect(stock.expire(10)).toEqual([]); expect(stock.reserved('dough')).toBe(1);
    expect(stock.expire(20)).toEqual(['second']); expect(stock.available('dough')).toBe(2);
    expect(stock.owned('mushroom')).toBe(2); expect(stock.cash).toBe(cash);
  });
});
