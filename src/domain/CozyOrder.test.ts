import { describe, expect, it } from 'vitest';
import { CozyOrder } from './CozyOrder';
import { CozyRuntime } from '../runtime/CozyRuntime';

const prepare = (game: CozyOrder | CozyRuntime) => {
  for (const ingredient of ['dough', 'sauce', 'cheese'] as const) game.dispatch({ type: 'ingredient', ingredient });
};
describe('cozy day-one interaction fixture', () => {
  it('requires dough before loose toppings and clears them when dough is removed',()=>{
    const game=new CozyOrder();
    for(const ingredient of ['sauce','cheese','mushroom'] as const)expect(game.dispatch({type:'ingredient',ingredient})).toBe(false);
    expect(game.state.ingredients).toEqual([]);prepare(game);
    expect(game.dispatch({type:'ingredient',ingredient:'dough'})).toBe(true);
    expect(game.state.ingredients).toEqual([]);
    expect(game.dispatch({type:'ingredient',ingredient:'cheese'})).toBe(false);
    expect(game.state.cash).toBe(300);
  });
  it('discards a boxed mixed pizza without refunding stock or resetting progress',()=>{
    const game=new CozyOrder();prepare(game);game.dispatch({type:'ingredient',ingredient:'pepperoni'});
    game.dispatch({type:'bake'});game.tick(6);game.dispatch({type:'extract'});game.dispatch({type:'box'});
    expect(game.dispatch({type:'discard'})).toBe(true);
    expect(game.state).toMatchObject({stage:'assembly',ingredients:[],cash:300,reputation:50});
  });
  it('requires ingredients, cooking and boxing in order; delivery is single-use', () => {
    const game = new CozyOrder();
    expect(game.dispatch({ type: 'bake' })).toBe(false);
    expect(game.dispatch({ type: 'deliver' })).toBe(false);
    prepare(game); expect(game.dispatch({ type: 'bake' })).toBe(true);
    game.tick(5.9); expect(game.dispatch({ type: 'box' })).toBe(false);
    expect(game.dispatch({ type: 'extract' })).toBe(false);
    game.tick(.1); expect(game.state.stage).toBe('baking');
    expect(game.dispatch({ type: 'extract' })).toBe(true);
    game.tick(30); expect(game.state.stage).toBe('ready');
    expect(game.dispatch({ type: 'deliver' })).toBe(false);
    game.dispatch({ type: 'box' }); game.dispatch({ type: 'deliver' });
    expect(game.state).toMatchObject({ cash: 350, reputation: 51, energy: 75 });
    expect(game.dispatch({ type: 'deliver' })).toBe(false);
    expect(game.state.cash).toBe(350);
  });
  it('keeps the green window inclusive and burns only after its end', () => {
    const game = new CozyOrder(); prepare(game); game.dispatch({ type: 'bake' });
    game.tick(8);
    expect(game.state.stage).toBe('baking');
    expect(game.dispatch({ type: 'extract' })).toBe(true);
    expect(game.dispatch({ type: 'extract' })).toBe(false);
  });
  it('cannot box or deliver burnt pizza and discards it without resetting money', () => {
    const game = new CozyOrder(); prepare(game); game.dispatch({ type: 'bake' });
    game.tick(8.05);
    expect(game.state.stage).toBe('burnt');
    expect(game.dispatch({type:'extract'})).toBe(true);
    for(const type of ['box','deliver','bake'] as const)expect(game.dispatch({type})).toBe(false);
    expect(game.dispatch({type:'discard'})).toBe(true);
    expect(game.state).toMatchObject({stage:'assembly',ingredients:[],ovenSeconds:0,cash:300,reputation:50,energy:80});
    prepare(game);game.dispatch({type:'bake'});game.tick(6);
    expect(game.dispatch({type:'extract'})).toBe(true);
  });
  it('allows correcting ingredients before cooking and resets only the fixture', () => {
    const game = new CozyOrder(); prepare(game);
    game.dispatch({ type: 'ingredient', ingredient: 'cheese' });
    expect(game.state.ingredients).toHaveLength(2);
    expect(game.dispatch({ type: 'bake' })).toBe(true);
    game.dispatch({ type: 'reset' }); expect(game.state.cash).toBe(300);
    expect(game.state.ingredients).toHaveLength(0);
  });
  it('does not release another pause owner or catch up after long frame gaps', () => {
    const game = new CozyRuntime(); prepare(game); game.dispatch({ type: 'bake' });
    game.advance(200); expect(game.state.ovenSeconds).toBe(.2);
    game.pause('user'); game.pause('visibility'); game.resume('user');
    game.advance(200); expect(game.state.ovenSeconds).toBe(.2);
    game.resume('visibility'); game.advance(200); expect(game.state.ovenSeconds).toBeCloseTo(.4);
    game.advance(5000); expect(game.pauses).toEqual(['gap']);
    game.resume('gap'); game.advance(100); expect(game.state.ovenSeconds).toBeCloseTo(.5);
  });
});
