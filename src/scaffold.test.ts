import { describe, expect, it } from 'vitest';
import { GAME_HEIGHT, GAME_WIDTH } from './config/viewport';

describe('portrait viewport contract', () => {
  it('keeps the logical canvas within the smallest approved mobile viewport', () => {
    expect(Number.isInteger(GAME_WIDTH)).toBe(true);
    expect(Number.isInteger(GAME_HEIGHT)).toBe(true);
    expect(GAME_WIDTH).toBeGreaterThan(0);
    expect(GAME_HEIGHT).toBeGreaterThan(GAME_WIDTH);
    expect(GAME_WIDTH).toBeLessThanOrEqual(360);
    expect(GAME_HEIGHT).toBeLessThanOrEqual(640);
  });
});
