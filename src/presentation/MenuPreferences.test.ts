import { describe, expect, it, vi } from 'vitest';
import { MenuPreferences } from './MenuPreferences';

describe('MenuPreferences', () => {
  it('restores an explicit choice across sessions and removes it when following the system', () => {
    const values = new Map<string,string>();
    const storage = {getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>{values.set(key,value);},removeItem:(key:string)=>{values.delete(key);}};
    const source = {matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()};
    new MenuPreferences(source,storage).setReducedMotion(true);
    const restored = new MenuPreferences(source,storage);
    expect(restored.reducedMotion).toBe(true);
    restored.setReducedMotion(undefined);
    expect(new MenuPreferences(source,storage).reducedMotion).toBe(false);
  });

  it('ignores corrupt stored values and preserves live choices when storage is blocked', () => {
    const source = {matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()};
    const corrupt = {getItem:()=> 'invalid',setItem:vi.fn(),removeItem:vi.fn()};
    expect(new MenuPreferences(source,corrupt).reducedMotion).toBe(true);
    const blocked = {getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('blocked');},removeItem:()=>{throw new Error('blocked');}};
    const preferences = new MenuPreferences(source,blocked),changed=vi.fn();
    preferences.subscribe(changed);
    preferences.setReducedMotion(false);
    expect(preferences.reducedMotion).toBe(false);
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('follows the system until an explicit preference is chosen and can restore system behavior', () => {
    const source = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    const preferences = new MenuPreferences(source);
    const changed = vi.fn();
    const release = preferences.subscribe(changed);
    const systemChanged = source.addEventListener.mock.calls[0][1] as () => void;
    expect(preferences.reducedMotion).toBe(false);
    source.matches = true; systemChanged();
    expect(preferences.reducedMotion).toBe(true);
    expect(changed).toHaveBeenCalledTimes(1);
    preferences.setReducedMotion(false);
    expect(preferences.reducedMotion).toBe(false);
    systemChanged();
    expect(changed).toHaveBeenCalledTimes(2);
    preferences.setReducedMotion(undefined);
    expect(preferences.reducedMotion).toBe(true);
    expect(changed).toHaveBeenCalledTimes(3);
    release();
    expect(source.removeEventListener).toHaveBeenCalledWith('change', systemChanged);
  });

  it('uses one system listener and cleans it after all subscribers leave or the game is destroyed', () => {
    const source = { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    const preferences = new MenuPreferences(source);
    const changed = vi.fn();
    const releaseA = preferences.subscribe(changed);
    const releaseB = preferences.subscribe(() => undefined);
    expect(source.addEventListener).toHaveBeenCalledTimes(1);
    releaseA(); expect(source.removeEventListener).not.toHaveBeenCalled();
    releaseB(); expect(source.removeEventListener).toHaveBeenCalledTimes(1);
    preferences.subscribe(changed);
    preferences.destroy();
    source.matches = false;
    (source.addEventListener.mock.calls[1][1] as () => void)();
    expect(changed).not.toHaveBeenCalled();
  });
});
