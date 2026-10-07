import {DRINK_CATALOG,drinkDefinition,type DrinkId} from '../config/drinkCatalog';

export type DrinkInventory=Record<DrinkId,number>;
export const emptyDrinkInventory=():DrinkInventory=>({water:0,cola:0,orange:0});
export const isDrinkId=(id:unknown):id is DrinkId=>DRINK_CATALOG.some(drink=>drink.id===id);
export function validateDrinkInventory(value:unknown):DrinkInventory|null {
  if(value===undefined)return emptyDrinkInventory();
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const quantities=value as DrinkInventory;
  if(Object.keys(quantities).some(key=>!isDrinkId(key))||DRINK_CATALOG.some(drink=>!Number.isSafeInteger(quantities[drink.id as DrinkId])||quantities[drink.id as DrinkId]<0||quantities[drink.id as DrinkId]>1000000))return null;
  return {...quantities};
}
export function drinkInventoryValue(quantities:DrinkInventory):number {
  return DRINK_CATALOG.reduce((sum,drink)=>sum+quantities[drink.id as DrinkId]*drink.purchasePrice,0);
}
/** One stable request on a quarter of shop orders, independent of stock and pizza count. */
export function requestedDrink(seed:number|string,day:number,arrivalId:string):DrinkId|null {
  let hash=2166136261;
  for(const char of `${seed}/${day}/${arrivalId}/drink`)hash=Math.imul(hash^char.charCodeAt(0),16777619);
  hash=(hash^(hash>>>16))>>>0;
  if(hash%4)return null;
  return DRINK_CATALOG[Math.floor(hash/4)%DRINK_CATALOG.length].id as DrinkId;
}
export const drinkSalePrice=(id:DrinkId)=>drinkDefinition(id).salePrice;
