import {describe,it,expect} from 'vitest';
import {lotteryMissionDay,lotteryDecision,validateLotteryDecision} from './LotteryMission';
describe('one-time guaranteed lottery help mission',()=>{
 it('offers one stable day in campaign and validates selected ticket counts',()=>{
  for(let seed=0;seed<100;seed++){const day=lotteryMissionDay(seed);expect(day).toBeGreaterThanOrEqual(3);expect(day).toBeLessThanOrEqual(27);expect(lotteryMissionDay(seed)).toBe(day);expect(lotteryDecision(seed,day+1,5)).toBeNull();}
 });
 it('all purchased tickets win300 each, preserving exact cost30 each',()=>{
  const day=lotteryMissionDay(48);
  for(const count of [5,10,20]){const r=lotteryDecision(48,day,count)!;expect(r).toEqual({day,count,cost:count*30,prize:count*300});expect(validateLotteryDecision(r,48)).toEqual(r);expect(validateLotteryDecision({...r,prize:r.prize+300},48)).toBeNull();}
  expect(lotteryDecision(48,day,0)).toEqual({day,count:0,cost:0,prize:0});expect(lotteryDecision(48,day,1)).toBeNull();
 });
});
