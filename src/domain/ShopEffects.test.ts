import {describe, expect, it} from 'vitest';
import {shopEffects, SHOP_ITEM_EFFECTS, type ShopItemId} from './ShopEffects';

describe('user-defined placed shop effects', () => {
  it('keeps ownership without placement neutral and ignores duplicate activation', () => {
    expect(shopEffects([])).toEqual({visitors: 0, patience: 0, waitingSeats: 0});
    expect(shopEffects(['shop-sign', 'shop-sign', 'waiting-chair', 'waiting-chair']))
      .toEqual({visitors: .08, patience: .05, waitingSeats: 0});
  });
  it('adds patience on the base and uses the better cooling appliance', () => {
    expect(60 * (1 + shopEffects(['waiting-chair', 'wifi']).patience)).toBeCloseTo(67.8);
    expect(shopEffects(['fan', 'air-conditioner']).patience).toBe(.10);
    expect(shopEffects(['fan']).patience).toBe(.05);
  });
  it('keeps all-item totals below their caps and seats separate from ticket capacity', () => {
    const all = Object.keys(SHOP_ITEM_EFFECTS) as ShopItemId[];
    expect(shopEffects(all)).toEqual({visitors: .29, patience: .28, waitingSeats: 2});
    expect(shopEffects(['customer-tables'])).toEqual({visitors: 0, patience: 0, waitingSeats: 2});
  });
  it('returns an immutable snapshot independent from later placement changes', () => {
    const placed: ShopItemId[] = ['table-plant'];
    const openedDay = shopEffects(placed);
    placed.push('shop-sign');
    expect(openedDay.visitors).toBe(.03);
    expect(Object.isFrozen(openedDay)).toBe(true);
    expect(shopEffects(placed).visitors).toBe(.11);
  });
});
