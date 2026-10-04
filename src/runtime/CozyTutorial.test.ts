import { describe, expect, it } from 'vitest';
import { CozyRuntime } from './CozyRuntime';
import type { CozyIntent } from '../domain/CozyOrder';

const ingredients = ['dough', 'sauce', 'cheese'] as const;
function warm(runtime: CozyRuntime) {
  for (const ingredient of ingredients) expect(runtime.dispatch({ type: 'ingredient', ingredient })).toBe(true);
  expect(runtime.dispatch({ type: 'bake' })).toBe(true);
}
function finish(runtime: CozyRuntime) {
  warm(runtime);
  for (let frame = 0; frame < 32; frame++) runtime.advance(250);
  for (const type of ['extract', 'box', 'deliver'] as const) expect(runtime.dispatch({ type })).toBe(true);
}

describe('isolated first-shift guide', () => {
  it('prepares day one in the hub after practice without closing a day or granting rewards', () => {
    const runtime=new CozyRuntime(true,true);
    expect(runtime.postTutorialPreparation).toBe(false);
    finish(runtime);expect(runtime.startShift()).toBe(true);
    expect(runtime.postTutorialPreparation).toBe(true);
    expect(runtime.day).toBe(1);expect(runtime.shopPhase).toBe('preparation');
    expect(runtime.daySummary).toBeNull();expect(runtime.completedReports).toEqual([]);
    expect(runtime.stockLots).toEqual([]);expect(runtime.state.cash).toBe(300);
    expect(runtime.progression.xp).toBe(0);expect(runtime.canOpen).toBe(true);
    for(const ingredient of ingredients)expect(runtime.dispatch({type:'market.buy',ingredient,quantity:1,commandId:ingredient})).toBe(true);
    const cash=runtime.state.cash;
    expect(runtime.openShop()).toBe(true);expect(runtime.openShop()).toBe(false);
    expect(runtime.day).toBe(1);expect(runtime.state.cash).toBe(cash);
    expect(runtime.postTutorialPreparation).toBe(false);expect(runtime.daySummary).toBeNull();
  });
  it('requires each explicit command in order and keeps commercial economics untouched', () => {
    const runtime = new CozyRuntime(true);
    const commercial = JSON.stringify(runtime.commercialState);
    const wrong: CozyIntent[] = [{ type: 'reset' }, { type: 'discard' }, { type: 'box' }, { type: 'bake' }, { type: 'extract' }, { type: 'deliver' }, { type: 'ingredient', ingredient: 'cheese' }];
    expect(runtime.tutorialStep).toBe('dough');
    expect(runtime.expectedControl).toBe('dough');
    runtime.resume('tutorial');
    expect(runtime.pauses).toContain('tutorial');
    for (const intent of wrong) expect(runtime.dispatch(intent)).toBe(false);
    expect(runtime.state.ingredients).toEqual([]);
    for (const ingredient of ingredients) {
      expect(runtime.expectedControl).toBe(ingredient);
      expect(runtime.dispatch({ type: 'ingredient', ingredient })).toBe(true);
      expect(runtime.dispatch({ type: 'ingredient', ingredient })).toBe(false);
      expect(JSON.stringify(runtime.commercialState)).toBe(commercial);
    }
    expect(runtime.dispatch({ type: 'bake' })).toBe(true);
    expect(runtime.tutorialStep).toBe('warming');
    runtime.advance(49);
    expect(runtime.state.ovenSeconds).toBe(0);
    runtime.advance(1);
    expect(runtime.state.ovenSeconds).toBe(.05);
    for (let i = 0; i < 31; i++) runtime.advance(250);
    runtime.advance(250);
    expect(runtime.state.ovenSeconds).toBe(6);
    expect(runtime.state.stage).toBe('baking');
    expect(runtime.tutorialStep).toBe('extract');
    for (let i = 0; i < 100; i++) runtime.advance(250);
    expect(runtime.state.ovenSeconds).toBe(6);
    expect(runtime.startShift()).toBe(false);
    for (const type of ['extract', 'box', 'deliver'] as const) {
      expect(runtime.expectedControl).toBe(type);
      expect(runtime.dispatch({ type })).toBe(true);
      expect(runtime.dispatch({ type })).toBe(false);
      expect(JSON.stringify(runtime.commercialState)).toBe(commercial);
    }
    expect(runtime.state).toMatchObject({ cash: 300, reputation: 50, energy: 80 });
    expect(runtime.tutorialStep).toBe('complete');
    expect(runtime.expectedControl).toBe('start-shift');
    expect(runtime.pauses).toEqual(['tutorial']);
    expect(runtime.startShift()).toBe(true);
    expect(runtime.tutorialActive).toBe(false);
    expect(runtime.state).toMatchObject({ stage: 'assembly', ingredients: [], ovenSeconds: 0, cash: 300 });
    expect(runtime.startShift()).toBe(false);
    expect(runtime.dispatch({ type: 'ingredient', ingredient: 'dough' })).toBe(true);
  });

  it('keeps tutorial, order, orientation and user pause owners independent', () => {
    const runtime = new CozyRuntime(true);
    runtime.pause('order'); runtime.pause('orientation'); runtime.pause('user');
    runtime.resume('order');
    expect(runtime.dispatch({ type: 'ingredient', ingredient: 'dough' })).toBe(false);
    runtime.resume('orientation');
    expect(runtime.dispatch({ type: 'ingredient', ingredient: 'dough' })).toBe(false);
    runtime.resume('user');
    warm(runtime);
    runtime.pause('visibility'); runtime.pause('user');
    runtime.advance(200);
    runtime.resume('visibility'); runtime.advance(200);
    expect(runtime.state.ovenSeconds).toBe(0);
    runtime.resume('user');
    for (let i = 0; i < 24; i++) runtime.advance(250);
    expect(runtime.tutorialStep).toBe('extract');
    runtime.pause('order'); runtime.pause('orientation');
    runtime.resume('order');
    expect(runtime.pauses).toEqual(['tutorial', 'orientation']);
    expect(runtime.dispatch({ type: 'extract' })).toBe(false);
    runtime.resume('orientation');
    for (const type of ['extract', 'box', 'deliver'] as const) runtime.dispatch({ type });
    runtime.pause('user');
    expect(runtime.startShift()).toBe(false);
    runtime.resume('user');
    expect(runtime.startShift()).toBe(true);
  });

  it('discards frame gaps and uses a fresh commercial pizza after explicit start', () => {
    const runtime = new CozyRuntime(true);
    warm(runtime);
    runtime.advance(10000);
    expect(runtime.pauses).toEqual(['gap']);
    expect(runtime.state.ovenSeconds).toBe(0);
    runtime.resume('gap');
    for (let i = 0; i < 32; i++) runtime.advance(250);
    for (const type of ['extract', 'box', 'deliver'] as const) runtime.dispatch({ type });
    runtime.advance(10000);
    expect(runtime.tutorialStep).toBe('complete');
    runtime.startShift();
    warm(runtime);
    for (let i = 0; i < 24; i++) runtime.advance(250);
    for (const type of ['extract', 'box', 'deliver'] as const) runtime.dispatch({ type });
    expect(runtime.state).toMatchObject({ cash: 350, reputation: 51, energy: 75 });
  });

  it('increments render revision on transitions even when the lease remains held', () => {
    const runtime = new CozyRuntime(true);
    const before = runtime.pauseRevision;
    runtime.dispatch({ type: 'ingredient', ingredient: 'dough' });
    expect(runtime.pauseRevision).toBeGreaterThan(before);
    const fresh = new CozyRuntime(true);
    finish(fresh);
    const complete = fresh.pauseRevision;
    fresh.startShift();
    expect(fresh.pauseRevision).toBeGreaterThan(complete);
  });
});
