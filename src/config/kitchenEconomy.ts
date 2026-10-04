import {INGREDIENT_CATALOG} from './ingredientCatalog';
/** Provisional new ingredient prices. Existing five prices remain in demo.ts. */
export const EXTRA_INGREDIENTS = INGREDIENT_CATALOG.slice(5);
export const EXPRESS_PRICE_MULTIPLIER = 1.6;
export const EXPRESS_DELIVERY_SECONDS = 5;
/** Temporary gameplay prices awaiting a balancing pass; never read from reference art. */
export const OVEN_UPGRADE_PRICES=Object.freeze([2000,5000]);
export const QUEUE_UPGRADE_PRICE=6000;
