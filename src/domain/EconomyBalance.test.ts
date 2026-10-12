import {expect,it} from 'vitest';
import {INGREDIENT_CATALOG} from '../config/ingredientCatalog';
import {RECIPE_CATALOG} from '../config/recipeCatalog';
import {CozyStock} from './CozyStock';
import {CozyRuntime} from '../runtime/CozyRuntime';

it('increases all pizza and ingredient base prices by twenty percent rounded to whole coins',()=>{
  const pizzaBaseline=[50,65,75,85,80,90,100,95];
  const ingredientBaseline=[5,3,7,5,10,4,4,4,4,10,5,4,4,5,10,12,12,10,5];
  expect(RECIPE_CATALOG.map(recipe=>recipe.price)).toEqual(pizzaBaseline.map(price=>Math.round(price*1.2)));
  expect(INGREDIENT_CATALOG.map(ingredient=>ingredient.basePrice)).toEqual(ingredientBaseline.map(price=>Math.round(price*1.2)));
  // Recipe ownership and capital purchases are separate from pizza selling prices.
  expect(RECIPE_CATALOG.map(recipe=>recipe.purchasePrice)).toEqual([0,0,150,200,200,250,300,250]);
  const runtime=new CozyRuntime(false,true);expect(runtime.setMenuPrice('cheese',120)).toBe(true);
  const loaded=CozyRuntime.restoreCheckpoint(runtime.exportCheckpoint())!;
  expect(loaded.customerProgress.pricePercents.cheese).toBe(120);
  expect(loaded.customerProgress.prices.cheese).toBe(72);
});

it('retains historical lot valuation on reload while pricing new purchases at the updated rate',()=>{
  const stock=new CozyStock();expect(stock.buy('dough',1)).toBe(true);
  const historical=stock.exportCheckpoint();historical.lots[0].unitCost=5;
  historical.books[0].purchases=5;historical.books[0].ordinaryPurchases=5;historical.cash=495;
  const restored=CozyStock.restore(historical)!;expect(restored).not.toBeNull();
  expect(restored.lots[0].unitCost).toBe(5);expect(restored.cash).toBe(495);
  expect(restored.buy('dough',1)).toBe(true);
  expect(restored.lots.map(lot=>lot.unitCost)).toEqual([5,6]);
  expect(restored.reserveIngredients('old-lot',['dough'],30,1)).toBe(true);
  expect(restored.commit('old-lot',['dough'],1)).toBe(true);
  expect(restored.ledger(1)).toEqual({purchases:11,consumed:5});
  const forged=structuredClone(historical);forged.lots[0].unitCost=999;
  expect(CozyStock.restore(forged)).toBeNull();
});
