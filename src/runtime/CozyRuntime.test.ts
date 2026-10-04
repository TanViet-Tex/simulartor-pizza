import { describe, expect, it } from 'vitest';
import { CozyRuntime } from './CozyRuntime';

function startOven(runtime: CozyRuntime) {
  for (const ingredient of ['dough', 'sauce', 'cheese'] as const) {
    runtime.dispatch({ type: 'ingredient', ingredient });
  }
  runtime.dispatch({ type: 'bake' });
}

describe('preview simulation boundaries', () => {
  it('runs at 20 Hz and requires extraction in the green window', () => {
    const runtime = new CozyRuntime();
    startOven(runtime);
    runtime.advance(49);
    expect(runtime.state.ovenSeconds).toBe(0);
    runtime.advance(1);
    expect(runtime.state.ovenSeconds).toBe(.05);
    for (let frame = 0; frame < 295; frame++) runtime.advance(10);
    expect(runtime.state.stage).toBe('baking');
    expect(runtime.state.ovenSeconds).toBe(3);
    runtime.pause('user');runtime.advance(200);
    expect(runtime.dispatch({type:'extract'})).toBe(false);
    expect(runtime.state.ovenSeconds).toBe(3);
    runtime.resume('user');
    expect(runtime.dispatch({type:'extract'})).toBe(true);
    expect(runtime.state.stage).toBe('ready');
  });

  it('blocks actions and discards elapsed time while paused by independent owners', () => {
    const runtime = new CozyRuntime();
    startOven(runtime);
    runtime.pause('user');
    runtime.pause('orientation');
    runtime.pause('visibility');
    runtime.advance(10000);
    runtime.resume('orientation');
    runtime.resume('orientation');
    runtime.resume('visibility');
    expect(runtime.pauses).toEqual(['user']);
    expect(runtime.dispatch({ type: 'reset' })).toBe(false);
    expect(runtime.state.stage).toBe('baking');
    runtime.resume('user');
    runtime.advance(50);
    expect(runtime.state.ovenSeconds).toBe(.05);
  });

  it('does not introduce catch-up from invalid time or a hidden frame gap', () => {
    const runtime = new CozyRuntime();
    startOven(runtime);
    for (const delta of [NaN, Infinity, -1, 0]) runtime.advance(delta);
    expect(runtime.state.ovenSeconds).toBe(0);
    runtime.advance(30000);
    expect(runtime.pauses).toEqual(['gap']);
    runtime.resume('gap');
    runtime.advance(50);
    expect(runtime.state.ovenSeconds).toBe(.05);
  });
});
