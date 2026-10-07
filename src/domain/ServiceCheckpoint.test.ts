import {describe,it,expect} from 'vitest';
import {emptyServices,validateServices,serviceCostForDay,servicePrizeForDay} from './ServiceCheckpoint';
import {lotteryDecision,lotteryMissionDay} from './LotteryMission';
import {closeAccounts} from './DayAccounts';

describe('service receipts',()=>{
 it('keeps legacy services empty and rejects duplicate advertisements',()=>{expect(validateServices(undefined,1,1,false)).toEqual(emptyServices());expect(validateServices({...emptyServices(),advertisingDays:[1,1]},1,1,false)).toBeNull();});
 it.each([5,10,20])('reconciles %i guaranteed tickets and only pays after the day',count=>{
  const seed=42,day=lotteryMissionDay(seed),lottery=lotteryDecision(seed,day,count)!;
  const before={advertisingDays:[day],lottery,lotteryPrizeClaimed:false};
  expect(validateServices(before,seed,day,false)).toEqual(before);
  expect(serviceCostForDay(before,day)).toBe(100+count*30);expect(servicePrizeForDay(before,day)).toBe(0);
  expect(validateServices(before,seed,day+1,false)).toBeNull();
  const after={...before,lotteryPrizeClaimed:true};expect(validateServices(after,seed,day+1,false)).toEqual(after);expect(servicePrizeForDay(after,day)).toBe(count*300);
  expect(validateServices({...after,lottery:{...lottery,prize:lottery.prize+1}},seed,day+1,false)).toBeNull();
 });
 it('expenses services independently from purchases and lottery rewards',()=>{
  const a=closeAccounts({startingCash:1000,openingInventoryValue:0,sales:0,purchases:0,consumed:0,expired:0,rent:20,inventory:{lots:[],units:0,value:0},previousProfit:0,serviceCosts:250,rewards:1500});
  expect(a.other).toBe(250);expect(a.profit).toBe(-270);expect(a.endingCash).toBe(2230);expect(a.purchases).toBe(0);
 });
});
