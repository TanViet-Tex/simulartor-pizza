import { describe, expect, it } from 'vitest';
import { DemoGame } from './demo';

function shop(quantity = 10) {
  const g = new DemoGame();
  for (const ingredient of ['dough', 'sauce', 'cheese', 'mushroom']) g.dispatch({ type: 'buy', ingredient, quantity });
  g.dispatch({ type: 'open' });
  return g;
}

describe('campaign automatic customer arrivals', () => {
  it('creates ordinary tickets once, preserves selection and stops at three without pausing', () => {
    const g = shop(); g.tick(10); const first = g.state.selected;
    g.tick(50);
    expect(g.state.offer).toBeNull(); expect(g.state.tickets).toHaveLength(3);
    expect(g.state.selected).toBe(first);
    expect(g.state.tickets.map(t => [t.kind, t.patience])).toEqual([['regular', 120], ['picky', 100], ['picky', 100]]);
    expect(g.available('dough')).toBe(7);
    g.tick(25);
    expect(g.state.tickets).toHaveLength(3); expect(g.state.offer).toBeNull();
    expect(g.state.message).toContain('3');
    expect(new Set(g.state.tickets.map(t => t.id)).size).toBe(3);
  });
  it('rejects missing stock and high prices without a hold or changing the requested recipe', () => {
    const g = shop(1); g.tick(60);
    expect(g.state.offer).toBeNull(); expect(g.state.tickets).toHaveLength(1);
    expect(g.state.message).toContain('nguyên liệu'); expect(g.available('dough')).toBe(0);
    const expensive = shop(); expensive.state.prices.cheese = 70; expensive.tick(35);
    expect(expensive.state.tickets).toHaveLength(0); expect(expensive.state.offer).toBeNull();
    expect(expensive.available('dough')).toBe(10); expect(expensive.state.reputation).toBe(48);
  });
  it('only bargaining pauses arrivals and waits to reserve until the price is agreed', () => {
    const g = shop(); g.tick(60);
    for (const t of g.state.tickets) t.remaining = 1;
    g.tick(25);
    expect(g.state.offer).toMatchObject({ kind: 'bargain', reserved: [], price: 45 });
    const time = g.state.time; const available = g.available('dough');
    g.tick(100); expect(g.state.time).toBe(time);
    expect(g.dispatch({ type: 'accept' }).ok).toBe(true);
    expect(g.state.offer).toBeNull(); expect(g.available('dough')).toBe(available - 1);
    expect(g.dispatch({ type: 'accept' }).ok).toBe(false);
    expect(g.state.tickets[0]).toMatchObject({ remaining: 110, patience: 110 });
  });
  it('keeps Help / Decline separate and reserves nothing before deciding', () => {
    const g = shop(); g.state.day = 2; g.state.regularRating = 5; g.tick(10);
    expect(g.state.offer).toMatchObject({ help: true, reserved: [] });
    expect(g.state.tickets).toHaveLength(0); expect(g.available('dough')).toBe(10);
    const time = g.state.time; g.tick(100); expect(g.state.time).toBe(time);
    g.dispatch({ type: 'decline' }); g.tick(22);
    expect(g.state.offer).toBeNull(); expect(g.state.tickets[0]).toMatchObject({ kind: 'hurry', patience: 75 });
  });
  it('keeps the configured extra wrong-order penalty specific to picky customers', () => {
    function wrongOrder(kind: string) {
      const g = shop(); g.tick(10);
      g.state.tickets[0]!.kind = kind;
      for (const ingredient of ['dough', 'sauce']) g.dispatch({ type: 'ingredient', ingredient });
      g.dispatch({ type: 'bake' }); g.tick(3.1); g.dispatch({ type: 'remove' }); g.dispatch({ type: 'deliver', confirmed:true });
      return g.state.ratings[0];
    }
    expect(wrongOrder('regular')).toBe(3);
    expect(wrongOrder('hurry')).toBe(3);
    expect(wrongOrder('picky')).toBe(2);
  });
});
