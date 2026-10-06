import type {ScheduleSlot} from './cozySchedule';
import type {RecipeId} from './recipeCatalog';
import {FINISHING_SAUCES,type FinishingSauce} from './ingredientCatalog';
export type CustomerPizzaRequest={recipe:RecipeId;finishingSauces:FinishingSauce[];price:number};
/** Separate hash channels keep requests stable regardless of staff, queue occupancy or reload. */
export function customerPizzaRequests(seed:number,day:number,slot:ScheduleSlot,menu:readonly RecipeId[],first:RecipeId,price:(id:RecipeId)=>number,appQuantity?:number):CustomerPizzaRequest[]{
 let hash=2166136261;for(const char of `${seed}:${day}:${slot.id}:pizza-items`)hash=Math.imul(hash^char.charCodeAt(0),16777619);hash>>>=0;
 const count=slot.opportunity==='help'?1:Math.min(menu.length,appQuantity??((slot.commercialOrdinal??1)%4===0?2+hash%2:1));
 const recipes=[first,...menu.filter(id=>id!==first).sort((a,b)=>a.localeCompare(b))];
 return recipes.slice(0,Math.max(1,count)).map((recipe,index)=>({recipe,price:price(recipe),finishingSauces:slot.opportunity!=='help'&&(hash+index)%4===0?[FINISHING_SAUCES[(hash+index)%3]]:[]}));
}
