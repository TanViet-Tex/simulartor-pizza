import { describe, expect, it } from 'vitest';
import content from '../../public/game-content.json';
import { assertRuntimeCompatibility, validateGameConfig } from './gameContent';

describe('untrusted boot configuration', () => {
  it('validates the shipped catalog against actual gameplay definitions and detaches/freezes nested data', () => {
    const input = structuredClone(content);
    const config = validateGameConfig(input);
    expect(() => assertRuntimeCompatibility(config)).not.toThrow();
    input.recipes[0].ingredients.pop();
    expect(config.recipes[0].ingredients).toHaveLength(3);
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.ingredients)).toBe(true);
    expect(Object.isFrozen(config.ingredients[0])).toBe(true);
    expect(Object.isFrozen(config.recipes[0].ingredients)).toBe(true);
  });
  it.each([null, {}, {version:2}, {...content,ingredients:[]}])('rejects incomplete roots %j', value => {
    expect(() => validateGameConfig(value)).toThrow('Cấu hình');
  });
  it('rejects duplicate ingredient and recipe IDs', () => {
    const input = structuredClone(content);
    input.ingredients.push(input.ingredients[0]);
    expect(() => validateGameConfig(input)).toThrow();
    input.ingredients.pop();
    input.recipes.push(input.recipes[0]);
    expect(() => validateGameConfig(input)).toThrow();
  });
  it('rejects dangling and duplicate recipe components', () => {
    const input = structuredClone(content);
    input.recipes[0].ingredients.push('missing');
    expect(() => validateGameConfig(input)).toThrow();
    input.recipes[0].ingredients.pop();
    input.recipes[0].ingredients.push('dough');
    expect(() => validateGameConfig(input)).toThrow();
  });
  it.each([-1,NaN,Infinity,1.1,1000001])('rejects bad price %s', price => {
    const input = structuredClone(content);
    input.recipes[0].price = price;
    expect(() => validateGameConfig(input)).toThrow();
  });
  it('rejects catalog drift even when the schema is valid', () => {
    const input = structuredClone(content);
    input.ingredients[0].basePrice++;
    expect(() => assertRuntimeCompatibility(validateGameConfig(input))).toThrow();
  });
});
