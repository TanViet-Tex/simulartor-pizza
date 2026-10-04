import { describe, expect, it } from 'vitest';
import { DemoGame, recipes, validateCampaign } from './demo';
const supply = (g: DemoGame, quantity = 10) => {
  for (const ingredient of ['dough', 'sauce', 'cheese', 'mushroom']) g.dispatch({ type: 'buy', ingredient, quantity });
};
const serve = (g: DemoGame) => {
  const offer = g.state.offer ?? g.state.tickets[0]!;
  if (g.state.offer) expect(g.dispatch({ type: 'accept' }).ok).toBe(true);
  g.dispatch({ type: 'select', id: offer.id });
  for (const ingredient of recipes.find(r => r.id === offer.recipe)!.ingredients) g.dispatch({ type: 'ingredient', ingredient });
  expect(g.dispatch({ type: 'bake' }).ok).toBe(true);
  g.tick(3.1); g.dispatch({ type: 'remove' });
  if (offer.takeaway) g.dispatch({ type: 'box' });
  expect(g.dispatch({ type: 'deliver' }).ok).toBe(true);
};
describe('three day pizza domain', () => {
  it('starts without inventory and atomically rejects overspending', () => {
    const g = new DemoGame();
    expect(g.dispatch({ type: 'open' }).ok).toBe(false);
    expect(g.dispatch({ type: 'buy', ingredient: 'cheese', quantity: 100 }).ok).toBe(false);
    expect(g.state.cash).toBe(300); expect(g.stock('cheese')).toBe(0);
  });
  it('automatically reserves ordinary orders, keeps time running and rewards delivery once', () => {
    const g = new DemoGame(); supply(g); g.dispatch({ type: 'open' }); g.tick(10);
    expect(g.state.offer).toBeNull(); expect(g.state.tickets).toHaveLength(1);
    const time = g.state.time; g.tick(1); expect(g.state.time).toBeGreaterThan(time);
    expect(g.available('dough')).toBe(9);
    expect(g.dispatch({ type: 'accept' }).ok).toBe(false);
    serve(g);
    expect(g.stock('dough')).toBe(9); expect(g.state.cash).toBe(150);
    expect(g.state.xp).toBe(15); expect(g.state.relationship).toBe(1);
    expect(g.dispatch({ type: 'deliver' }).ok).toBe(false); expect(g.state.cash).toBe(150);
  });
  it('releases reservation on timeout without awarding revenue or XP', () => {
    const g = new DemoGame(); supply(g); g.dispatch({ type: 'open' }); g.tick(10);
    expect(g.available('dough')).toBe(9);
    for (let n = 0; n < 200; n++) { if (g.state.offer) g.dispatch({ type: 'decline' }); g.tick(1); }
    expect(g.state.tickets.some(t => t.id === '1-0')).toBe(false);
    expect(g.available('dough')).toBe(10); expect(g.state.xp).toBe(0); expect(g.state.ratings).toEqual([1, 1, 1]);
  });
  it('plays all three days, excludes help from sales and advances checkpoints only forward', () => {
    let g = new DemoGame();
    for (let day = 1; day <= 3; day++) {
      supply(g, day === 1 ? 10 : 12);
      if (g.state.unlocked.includes('sausage')) g.dispatch({ type: 'buy', ingredient: 'sausage', quantity: 3 });
      expect(g.dispatch({ type: 'open' }).ok).toBe(true);
      let helped = false;
      for (let guard = 0; guard < 1000 && g.state.phase === 'shop'; guard++) {
        if (g.state.offer || g.state.tickets.length) {
          if (g.state.offer?.help) {
            const cash = g.state.cash, xp = g.state.xp;
            serve(g); expect(g.state.cash).toBe(cash); expect(g.state.xp).toBe(xp); helped = true;
          } else serve(g);
        } else g.tick(1);
      }
      expect(g.state.phase).toBe('summary');
      if (day === 2) expect(helped).toBe(true);
      const checkpoint = g.nextDayCheckpoint();
      expect(g.state.day).toBe(day); expect(g.state.phase).toBe('summary');
      expect(validateCampaign(checkpoint)).toEqual(checkpoint);
      g = new DemoGame(checkpoint);
      expect(g.state.day).toBe(Math.min(3, day + 1));
    }
    expect(g.state.phase).toBe('end'); expect(g.state.summary?.ending).toBe('complete');
    expect(g.state.missionReward).toBe(true);
  });
  it('rejects corrupted checkpoint and never loads a mid-day snapshot', () => {
    const g = new DemoGame();
    expect(() => validateCampaign({ ...g.snapshot(), cash: NaN })).toThrow();
    supply(g); g.dispatch({ type: 'open' });
    expect(() => validateCampaign(g.snapshot())).toThrow();
  });
});
