import {describe,it,expect} from 'vitest';
import {emptyDrinkInventory,validateDrinkInventory,drinkInventoryValue,requestedDrink} from './DrinkStock';
import {CozyStock} from './CozyStock';
describe('drink inventory and seeded requests',()=>{
  it('accepts old saves and rejects invalid bottle counts',()=>{
    expect(validateDrinkInventory(undefined)).toEqual(emptyDrinkInventory());
    expect(validateDrinkInventory({water:2,cola:1,orange:3})).toEqual({water:2,cola:1,orange:3});
    expect(validateDrinkInventory({water:-1,cola:0,orange:0})).toBeNull();
    expect(validateDrinkInventory({water:1,cola:0,orange:0,other:1})).toBeNull();
    expect(drinkInventoryValue({water:2,cola:1,orange:3})).toBe(62);
  });
  it('chooses a stable single bottle or no bottle without depending on inventory',()=>{
    const requests=Array.from({length:1000},(_,i)=>requestedDrink(123,2,`arrival-${i}`));
    expect(requests).toEqual(Array.from({length:1000},(_,i)=>requestedDrink(123,2,`arrival-${i}`)));
    expect(new Set(requests)).toEqual(new Set([null,'water','cola','orange']));
  });
  it('books fixed costs once, keeps stock through days, and restores old saves',()=>{
    const stock=new CozyStock();
    expect(stock.buyDrink('water',2,1)).toBe(true);
    expect(stock.buyDrink('cola',1,1)).toBe(true);
    expect(stock.buyDrink('orange',1,1)).toBe(true);
    expect(stock.cash).toBe(262);
    expect(stock.consumeDrink('water',1)).toBe(true);
    expect(stock.ledger(1)).toEqual({purchases:38,consumed:8});
    expect(stock.inventorySnapshot().value).toBe(30);
    stock.settle(1);
    const restored=CozyStock.restore(stock.exportCheckpoint())!;
    expect(restored.drinkOwned('water')).toBe(1);
    expect(restored.drinkOwned('orange')).toBe(1);
    expect(restored.consumeDrink('cola',2)).toBe(true);
    expect(restored.consumeDrink('cola',2)).toBe(false);
    expect(restored.buyDrink('water',-1,2)).toBe(false);
    expect(restored.consumeDrink('orange',1)).toBe(false);
    expect(CozyStock.restore(new CozyStock().exportCheckpoint())!.drinkOwned('water')).toBe(0);
  });
});
