import {STOCK_INGREDIENTS,ingredientName,recipeIngredients,type CozyLot,type StockIngredient,type StockRecipe} from '../domain/CozyStock';

export function stockRows(lots:readonly Readonly<CozyLot>[],day:number,reserved:(id:StockIngredient)=>number){
  return STOCK_INGREDIENTS.map(id=>{const own=lots.filter(l=>l.ingredient===id),usable=own.filter(l=>l.day<=day&&l.expiry>=day).reduce((sum,l)=>sum+l.quantity,0),held=reserved(id);
    return {id,name:ingredientName(id),usable:Math.max(0,usable-held),reserved:held,lots:own};});
}
/** Supported menu recipes only; viewing a plan never reserves or purchases stock. */
export function stockForecast(menu:readonly StockRecipe[],portions:Partial<Record<StockRecipe,number>>,available:(id:StockIngredient)=>number){
  const needs=new Map<StockIngredient,number>();
  for(const recipe of new Set(menu)){const count=portions[recipe]??0;if(!Number.isSafeInteger(count)||count<0||count>100)throw new RangeError('Invalid preparation portions');
    if(count)for(const id of recipeIngredients(recipe))needs.set(id,(needs.get(id)??0)+count);}
  return STOCK_INGREDIENTS.filter(id=>needs.has(id)).map(id=>({id,name:ingredientName(id),need:needs.get(id)!,available:available(id),missing:Math.max(0,needs.get(id)!-available(id))}));
}
