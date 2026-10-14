import {describe,expect,it} from 'vitest';
import {CozyRuntime} from './CozyRuntime';

const dependencies={eventSeed:321,eventRoll:()=>1,schedule:(day:number)=>({day,duration:180,grace:120,slots:[]})};
function runtime(){return new CozyRuntime(false,true,dependencies);}
function close(r:CozyRuntime){r.resolveLottery(0);expect(r.closeDay()).toBe(true);}

describe('food purchases for the preparation day',()=>{
  it('counts successful food purchases but rejects empty, unaffordable and locked purchases',()=>{
    const r=runtime();expect(r.boughtIngredientsForPreparation).toBe(false);
    expect(r.buy('dough',0)).toBe(false);expect(r.buy('dough',100000)).toBe(false);
    expect(r.buy('shrimp',1)).toBe(false);expect(r.boughtIngredientsForPreparation).toBe(false);
    expect(r.buy('sauce',1)).toBe(true);expect(r.boughtIngredientsForPreparation).toBe(true);
  });

  it('does not treat usable old lots as a new purchase and preserves that distinction after restore',()=>{
    const r=runtime();for(const ingredient of ['dough','sauce','cheese'] as const)expect(r.buy(ingredient,2)).toBe(true);
    expect(r.openShop()).toBe(true);close(r);
    expect(r.preparationDay).toBe(2);expect(r.available('dough')).toBe(2);
    expect(r.boughtIngredientsForPreparation).toBe(false);
    const restored=CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,dependencies)!;
    expect(restored.preparationDay).toBe(2);expect(restored.boughtIngredientsForPreparation).toBe(false);
    expect(restored.buy('sauce-white',1)).toBe(true);expect(restored.boughtIngredientsForPreparation).toBe(true);
    expect(CozyRuntime.restoreCheckpoint(restored.exportCheckpoint(),false,dependencies)!.boughtIngredientsForPreparation).toBe(true);
    expect(restored.openShop()).toBe(true);close(restored);
    expect(restored.preparationDay).toBe(3);expect(restored.boughtIngredientsForPreparation).toBe(false);
  });

  it('does not count drinks bought on day four as food',()=>{
    let r=runtime();for(let day=1;day<4;day++){expect(day===1?r.openShop():r.openNextDay()).toBe(true);close(r);}
    r=CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,dependencies)!;
    expect(r.preparationDay).toBe(4);expect(r.buyDrink('water',2,'reminder-water')).toBe(true);
    expect(r.boughtIngredientsForPreparation).toBe(false);
    r=CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,dependencies)!;
    expect(r.drinkStock.find(d=>d.id==='water')?.quantity).toBe(2);expect(r.boughtIngredientsForPreparation).toBe(false);
    expect(r.buy('dough',1)).toBe(true);expect(r.boughtIngredientsForPreparation).toBe(true);
  });
});
