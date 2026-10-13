import {describe,it,expect} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {CozyStock} from '../domain/CozyStock';
import {requestedDrink} from '../domain/DrinkStock';
import {validateCozyCheckpoint} from '../domain/CozyCheckpoint';

function fixture(){
  return new CozyRuntime(false,true,{eventSeed:321,vipRoll:()=>1,resolveRecipe:()=> 'cheese',schedule:day=>{
    let n=0;while(requestedDrink(321,day,'unlock-'+n)!=='water')n++;
    return {day,duration:180,grace:120,slots:[{id:'unlock-'+n,at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:false}]};
  }});
}
describe('drinks unlock on day four',()=>{
  it('blocks purchases and requests on days one to three, then unlocks in day-four preparation',()=>{
    const r=fixture();expect(r.claimTestCode('VIETVUIVE')).toBe(true);
    for(let day=1;day<=3;day++){
      expect(r.preparationDay).toBe(day);expect(r.drinksUnlocked).toBe(false);
      const cash=r.state.cash;
      for(const id of ['water','cola','orange'] as const)expect(r.buyDrink(id,1,`day-${day}-${id}`)).toBe(false);
      expect(r.state.cash).toBe(cash);expect(r.drinkStock.every(d=>d.quantity===0)).toBe(true);
      expect(day===1?r.openShop():r.openNextDay()).toBe(true);
      expect(r.tickets).toHaveLength(1);expect(r.tickets[0].drink).toBeUndefined();expect(r.attachDrink('water')).toBe(false);
      expect(r.closeDay()).toBe(true);
    }
    expect(r.preparationDay).toBe(4);expect(r.drinksUnlocked).toBe(true);
    const cash=r.state.cash;expect(r.buyDrink('water',2,'first-water')).toBe(true);expect(r.state.cash).toBe(cash-16);
    const loaded=CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,{eventSeed:321,vipRoll:()=>1,resolveRecipe:()=> 'cheese',schedule:day=>{
      let n=0;while(requestedDrink(321,day,'unlock-'+n)!=='water')n++;
      return {day,duration:180,grace:120,slots:[{id:'unlock-'+n,at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:false}]};
    }})!;
    expect(loaded.drinksUnlocked).toBe(true);expect(loaded.openShop()).toBe(true);expect(loaded.selectedTicket?.drink).toBe('water');expect(loaded.attachDrink('water')).toBe(true);
    expect(validateCozyCheckpoint(r.exportCheckpoint())).not.toBeNull();
  });
  it('keeps early bottled stock from old saves without generating early drink orders',()=>{
    const r=fixture(),checkpoint=r.exportCheckpoint(),stock=CozyStock.restore(checkpoint.stock)!;
    expect(stock.buyDrink('water',2,1)).toBe(true);checkpoint.stock=stock.exportCheckpoint();
    const restored=CozyRuntime.restoreCheckpoint(checkpoint,false,{schedule:day=>({day,duration:180,grace:120,slots:[{id:'old-stock',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:false}]})})!;
    expect(restored).not.toBeNull();expect(restored.drinkStock[0].quantity).toBe(2);expect(restored.drinksUnlocked).toBe(false);
    expect(restored.openShop()).toBe(true);expect(restored.selectedTicket?.drink).toBeUndefined();expect(restored.attachDrink('water')).toBe(false);expect(restored.drinkStock[0].quantity).toBe(2);
  });
});
