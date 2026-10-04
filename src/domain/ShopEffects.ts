/** User-defined effects; prices and placement are separate from these rules. */
export const SHOP_ITEM_EFFECTS = Object.freeze({
  'table-plant': {visitors: .03},
  'pizza-painting': {visitors: .05},
  'decorative-light': {visitors: .05},
  'shop-sign': {visitors: .08},
  'large-plant': {visitors: .05},
  curtains: {visitors: .03},
  'waiting-chair': {patience: .05},
  wifi: {patience: .08},
  fan: {cooling: .05},
  'air-conditioner': {cooling: .10},
  speaker: {patience: .05},
  'customer-tables': {waitingSeats: 2},
} as const);

export type ShopItemId = keyof typeof SHOP_ITEM_EFFECTS;
export type ShopEffects = Readonly<{visitors: number; patience: number; waitingSeats: number}>;

/** Call with placed items only. Ownership alone never activates an effect. */
export function shopEffects(placed: readonly ShopItemId[]): ShopEffects {
  let visitors = 0, patience = 0, cooling = 0, waitingSeats = 0;
  for (const id of new Set(placed)) {
    const effect = SHOP_ITEM_EFFECTS[id];
    if ('visitors' in effect) visitors += effect.visitors;
    if ('patience' in effect) patience += effect.patience;
    if ('cooling' in effect) cooling = Math.max(cooling, effect.cooling);
    if ('waitingSeats' in effect) waitingSeats += effect.waitingSeats;
  }
  // Round float sums once; never mutate or persist a modified base stat.
  return Object.freeze({
    visitors: Math.min(.30, Math.round(visitors * 100) / 100),
    patience: Math.min(.40, Math.round((patience + cooling) * 100) / 100),
    waitingSeats,
  });
}
