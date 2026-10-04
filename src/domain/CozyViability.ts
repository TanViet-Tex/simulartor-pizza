import {datedIngredientPrice,ingredientName,recipeIngredients,type StockIngredient,type StockRecipe} from './CozyStock';
export type CozyViability={viable:boolean;cause:'rent'|'ingredients'|null;missing:number;recipe:StockRecipe|null;ingredientCost:number;message:string};
/** Rent and a first recipe are independent thresholds, as required by the demo. */
export function cozyViability(cash:number,day:number,recipes:readonly StockRecipe[],available:(id:StockIngredient)=>number,price:(id:StockIngredient)=>number=id=>datedIngredientPrice(id,day)):CozyViability {
  const options=recipes.map(recipe=>({recipe,ids:recipeIngredients(recipe).filter(id=>available(id)<1)})).map(o=>({...o,cost:o.ids.reduce((sum,id)=>sum+price(id),0)})).sort((a,b)=>a.cost-b.cost);
  const best=options[0],ingredientCost=best?.cost??0,recipe=best?.recipe??null;
  if(cash<20)return {viable:false,cause:'rent',missing:20-cash,recipe,ingredientCost,message:`Thiếu ${20-cash} xu để đủ tiền thuê 20 xu.`};
  if(!best||cash<ingredientCost)return {viable:false,cause:'ingredients',missing:Math.max(0,ingredientCost-cash),recipe,ingredientCost,message:best?`Thiếu ${ingredientCost-cash} xu mua ${best.ids.map(ingredientName).join(', ')} cho món rẻ nhất (${ingredientCost} xu).`:'Chưa có món đang mở để phục vụ.'};
  return {viable:true,cause:null,missing:0,recipe,ingredientCost,message:''};
}
