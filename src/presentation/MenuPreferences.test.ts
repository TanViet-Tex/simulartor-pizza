import { describe, expect, it, vi } from 'vitest';
import { MenuPreferences } from './MenuPreferences';

describe('MenuPreferences', () => {
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
