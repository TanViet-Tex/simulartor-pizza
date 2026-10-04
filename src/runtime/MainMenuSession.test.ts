import { describe, expect, it } from 'vitest';
import { CozyRuntime } from './CozyRuntime';
import { MainMenuSession } from './MainMenuSession';

describe('MainMenuSession', () => {
  it('keeps visibility pause-free across scene/menu replacement and cleans up on disposal',()=>{
    const session=new MainMenuSession(()=>new CozyRuntime());const runtime=session.start();
    session.lifecycle!.setHidden(true);session.lifecycle!.setHidden(false);
    session.returnToMenu();session.continue();expect(runtime.pauses).toEqual([]);
    session.lifecycle!.continue();expect(runtime.pauses).toEqual([]);
    session.lifecycle!.viewportChanged();expect(runtime.pauses).toEqual([]);
    session.destroy();session.destroy();expect(runtime.pauses).toEqual([]);
  });
  it('has no fabricated saved session and starts the guided main game', () => {
    const session = new MainMenuSession();
    expect(session.hasSession).toBe(false);
    expect(session.continue()).toBeNull();
    expect(session.start().tutorialStep).toBe('dough');
    expect(session.hasSession).toBe(true);
  });
  it('preserves a baking pizza and releases only the menu pause on continue', () => {
    const session = new MainMenuSession(() => new CozyRuntime());
    const runtime = session.start();
    for (const ingredient of ['dough', 'sauce', 'cheese'] as const) runtime.dispatch({type:'ingredient',ingredient});
    runtime.dispatch({type:'bake'});runtime.advance(200);
    const state = {...runtime.state,ingredients:[...runtime.state.ingredients]};
    session.returnToMenu();
    runtime.pause('visibility');runtime.advance(200);
    expect(runtime.state).toEqual(state);
    expect(session.continue()).toBe(runtime);
    expect(runtime.pauses).toEqual(['visibility']);
    runtime.advance(200);expect(runtime.state).toEqual(state);
    runtime.resume('visibility');runtime.advance(200);
    expect(runtime.state.ovenSeconds).toBeGreaterThan(state.ovenSeconds);
  });
  it('replaces a session only when explicitly starting another', () => {
    const session = new MainMenuSession();const old = session.start();
    session.returnToMenu();expect(session.continue()).toBe(old);
    expect(session.start()).not.toBe(old);
  });
  it('never clears external user or menu holds when returning and continuing',()=>{
    const session=new MainMenuSession(()=>new CozyRuntime()),runtime=session.start();
    runtime.pause('user');runtime.pause('menu');session.returnToMenu();session.returnToMenu();
    session.continue();expect(runtime.pauses).toEqual(['user','menu']);
    runtime.resume('menu');expect(runtime.pauses).toEqual(['user']);
    session.destroy();expect(runtime.pauses).toEqual(['user']);
  });
});
