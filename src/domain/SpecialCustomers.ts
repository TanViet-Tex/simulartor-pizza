import {SPECIAL_CUSTOMERS,SPECIAL_PRESENTATION,type SpecialCustomer} from '../config/specialCustomers';
import type {RecipeId} from '../config/recipeCatalog';
import {campaignEventRoll,campaignEventSeed} from './CampaignEvents';
export function specialCustomerSample(seed:number,day:number,slotId:string):number{return campaignEventRoll((seed^campaignEventSeed('special:'+slotId))>>>0,day);}
export function chooseSpecialCustomer(seed:number,day:number,slotId:string,active:readonly string[],vip:boolean):SpecialCustomer|null {
  const sample=specialCustomerSample(seed,day,slotId);
  if(!vip&&(day<SPECIAL_PRESENTATION.opensDay||sample>=SPECIAL_PRESENTATION.cosmeticProbability))return null;
  const pool=SPECIAL_CUSTOMERS.filter(c=>(vip?c.kind==='vip':c.kind!=='vip')&&(c.kind!=='attention'||c.fictional)&&!active.includes(c.id));
  return pool.length?pool[Math.min(pool.length-1,Math.floor(specialCustomerSample(seed,day,slotId+':identity')*pool.length))]:null;
}
export function specialOrderLine(customer:SpecialCustomer,recipe:RecipeId):string{return customer.orderSupported===false||customer.orderRecipe&&customer.orderRecipe!==recipe?'Cho mình một pizza nóng nha!':customer.orderLine;}
export function specialThanksLine(customer:SpecialCustomer):string{return customer.thanksSupported===false?'Cảm ơn quán nha!':customer.thanksLine;}
