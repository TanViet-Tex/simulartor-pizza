export type OvenLevel = 0 | 1 | 2;
export function bakeTiming(level: number = 0) {
  const upgrade = Number.isInteger(level) && level >= 0 && level <= 2 ? level : 0;
  const perfectStart = 6 - upgrade * 2;
  return Object.freeze({ perfectStart, perfectEnd: perfectStart + 2, gaugeEnd: perfectStart + 4 });
}
export const BAKE_TIMING = bakeTiming();
