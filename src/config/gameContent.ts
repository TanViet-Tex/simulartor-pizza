import { ingredients as supportedIngredients, recipes as supportedRecipes } from '../domain/demo';

interface IngredientConfig { readonly id: string; readonly name: string; readonly basePrice: number; readonly color: number }
interface RecipeConfig { readonly id: string; readonly name: string; readonly price: number; readonly ingredients: readonly string[] }
declare const validated: unique symbol;
export interface ValidatedGameConfig {
  readonly [validated]: true;
  readonly version: 1;
  readonly ingredients: readonly IngredientConfig[];
  readonly recipes: readonly RecipeConfig[];
}
const invalid = (): never => { throw new Error('Cấu hình trò chơi không hợp lệ. Vui lòng thử tải lại.'); };
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}
function text(value: unknown, id = false): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 80 || (id && !/^[a-z][a-z0-9-]*$/.test(value))) return invalid();
  return value;
}
function number(value: unknown, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value) || value < 0 || value > max) return invalid();
  return value;
}
function list(value: unknown): unknown[] {
  if (!Array.isArray(value) || !value.length || value.length > 100) return invalid();
  return value;
}
function unique(ids: readonly string[]): void { if (new Set(ids).size !== ids.length) invalid(); }

/** Untrusted content becomes a detached, deeply immutable snapshot only after all checks. */
export function validateGameConfig(value: unknown): ValidatedGameConfig {
  const root = record(value);
  if (root.version !== 1) invalid();
  const ingredients = list(root.ingredients).map(value => {
    const row = record(value);
    return Object.freeze({ id: text(row.id, true), name: text(row.name), basePrice: number(row.basePrice, 1000000), color: number(row.color, 0xffffff) });
  });
  unique(ingredients.map(row => row.id));
  const ids = new Set(ingredients.map(row => row.id));
  const recipes = list(root.recipes).map(value => {
    const row = record(value);
    const components = list(row.ingredients).map(value => text(value, true));
    unique(components);
    if (components.some(id => !ids.has(id))) invalid();
    return Object.freeze({ id: text(row.id, true), name: text(row.name), price: number(row.price, 1000000), ingredients: Object.freeze(components) });
  });
  unique(recipes.map(row => row.id));
  return Object.freeze({version: 1, ingredients: Object.freeze(ingredients), recipes: Object.freeze(recipes)}) as ValidatedGameConfig;
}

/** This release uses compiled gameplay rules; reject content drift instead of silently ignoring it. */
export function assertRuntimeCompatibility(config: ValidatedGameConfig): void {
  if (config.ingredients.length !== supportedIngredients.length || config.recipes.length !== supportedRecipes.length) invalid();
  for (const item of supportedIngredients) {
    const actual = config.ingredients.find(row => row.id === item.id);
    if (!actual || actual.name !== item.name || actual.basePrice !== item.basePrice || actual.color !== item.color) invalid();
  }
  for (const item of supportedRecipes) {
    const actual = config.recipes.find(row => row.id === item.id);
    if (!actual || actual.name !== item.name || actual.price !== item.price || actual.ingredients.length !== item.ingredients.length || item.ingredients.some(id => !actual.ingredients.includes(id))) invalid();
  }
}
