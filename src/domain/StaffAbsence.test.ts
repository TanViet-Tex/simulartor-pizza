import {describe,it,expect} from 'vitest';
import {prepStaffAbsent} from './StaffAbsence';
describe('prep employee unavailable day',()=>{
 it('works 5–7 days then misses exactly one day, stable across reload and hire dates',()=>{
  for(let seed=0;seed<50;seed++){
   const days=Array.from({length:180},(_,i)=>i+8),absent=days.filter(day=>prepStaffAbsent(seed,8,day));
   expect(absent[0]-8).toBeGreaterThanOrEqual(5);expect(absent[0]-8).toBeLessThanOrEqual(7);
   for(let i=1;i<absent.length;i++){expect(absent[i]-absent[i-1]-1).toBeGreaterThanOrEqual(5);expect(absent[i]-absent[i-1]-1).toBeLessThanOrEqual(7);}
   expect(days.filter(day=>prepStaffAbsent(seed,8,day))).toEqual(absent);
  }
 });
 it('never marks a pre-hire day or invalid data unavailable',()=>{
  expect(prepStaffAbsent(48,8,7)).toBe(false);expect(prepStaffAbsent(NaN,8,10)).toBe(false);expect(prepStaffAbsent(48,0,10)).toBe(false);
 });
});
