import {supplierPrice,SUPPLIER_THRESHOLD} from '../config/cozyContinuity';
import {INGREDIENT_CATALOG,type IngredientId} from '../config/ingredientCatalog';
import {isNonExpiring,NON_EXPIRING_DAY} from '../config/ingredientCatalog';
import {RECIPE_CATALOG,type RecipeId} from '../config/recipeCatalog';
import { EXPRESS_PRICE_MULTIPLIER } from '../config/kitchenEconomy';
import {INITIAL_CASH} from '../config/campaignRules';
import {drinkDefinition,type DrinkId} from '../config/drinkCatalog';
import {emptyDrinkInventory,validateDrinkInventory,drinkInventoryValue,isDrinkId,type DrinkInventory} from './DrinkStock';
const catalog = INGREDIENT_CATALOG;
const recipes=RECIPE_CATALOG;
export type StockIngredient = IngredientId;
export type StockRecipe = RecipeId;
export const STOCK_RECIPES:readonly StockRecipe[]=RECIPE_CATALOG.map(r=>r.id);
export const STOCK_INGREDIENTS: readonly StockIngredient[] = catalog.map(item => item.id as StockIngredient);
export function recipeIngredients(recipe: StockRecipe): StockIngredient[] {
  return [...recipes.find(item => item.id === recipe)!.ingredients] as StockIngredient[];
}
export function ingredientPrice(id: StockIngredient): number { return catalog.find(item => item.id === id)!.basePrice; }
export function datedIngredientPrice(id: StockIngredient, day: number): number { return Math.round(ingredientPrice(id) * [1, 1.1, .9][(day - 1)%3]!); }
export function ingredientExpiry(id: StockIngredient, day: number, preservation:1|4=1): number { return isNonExpiring(id)?NON_EXPIRING_DAY:day + (catalog.find(item=>item.id===id)!.expiryOffset+1)*preservation-1; }
export function recipePrice(id: StockRecipe): number { return recipes.find(item => item.id === id)!.price; }
export function ingredientName(id: StockIngredient): string { return catalog.find(item => item.id === id)!.name; }
export function expressIngredientPrice(id:StockIngredient,day:number) { return Math.ceil(datedIngredientPrice(id,day)*EXPRESS_PRICE_MULTIPLIER); }
export interface ExpressReceipt { id:string; ingredient:StockIngredient; quantity:number; unitCost:number; total:number; day:number; expiry:number }
interface Allocation { lotId:number; ingredient:StockIngredient; quantity:number }
interface Reservation { allocations:Allocation[]; day:number; expiresAt:number }
export interface CozyLot { id: number; ingredient: StockIngredient; quantity: number; unitCost: number; day: number; expiry: number }
export interface CozyInventory {units:number;value:number;lots:CozyLot[];drinks?:DrinkInventory}
export interface MarketBasketEntry {ingredient:StockIngredient;quantity:number;unitPrice:number}
export interface CozyStockSnapshot {cash:number;nextLot:number;activeDay:number;drinkService?:true;drinks?:DrinkInventory;refrigeration?:{multiplier:4;acquiredDay:number};lots:CozyLot[];books:{day:number;purchases:number;ordinaryPurchases?:number;eventLoss?:number;drinkConsumed?:number;consumed:number}[];settlements:{day:number;expired:number;rent:number}[]}
export function validateStockSnapshot(value:unknown):CozyStockSnapshot|null {
  if(!value||typeof value!=='object')return null;
  const s=value as CozyStockSnapshot,whole=(n:unknown,min=0,max=1000000)=>Number.isSafeInteger(n)&&Number(n)>=min&&Number(n)<=max;
  const drinks=validateDrinkInventory(s.drinks);if(!drinks||s.drinkService!==undefined&&s.drinkService!==true||Object.values(drinks).some(Boolean)&&!s.drinkService)return null;
  const eventLoss=Array.isArray(s.books)?s.books.reduce((sum,b)=>sum+(b?.eventLoss===200?200:0),0):0;
  if(s.refrigeration!==undefined&&(!s.refrigeration||typeof s.refrigeration!=='object'||s.refrigeration.multiplier!==4||!whole(s.refrigeration.acquiredDay,1,1000000)||Object.keys(s.refrigeration).some(key=>key!=='multiplier'&&key!=='acquiredDay')))return null;
  if(!whole(s.cash,-20-eventLoss)||!whole(s.nextLot,1,1000000000)||!whole(s.activeDay,1,1000000)||!Array.isArray(s.lots)||s.lots.length>300||!Array.isArray(s.books)||s.books.length>1000000||!Array.isArray(s.settlements)||s.settlements.length>1000000)return null;
  if(s.lots.some(l=>!l||!whole(l.id,1,999999999)||l.id>=s.nextLot||!STOCK_INGREDIENTS.includes(l.ingredient)||!whole(l.quantity,1,100)||!whole(l.day,1,1000000)||![datedIngredientPrice(l.ingredient,l.day),expressIngredientPrice(l.ingredient,l.day),supplierPrice(datedIngredientPrice(l.ingredient,l.day),SUPPLIER_THRESHOLD)].includes(l.unitCost)||(l.expiry!==ingredientExpiry(l.ingredient,l.day,s.refrigeration&&ingredientExpiry(l.ingredient,l.day)>=s.refrigeration.acquiredDay?4:1)&&!(isNonExpiring(l.ingredient)&&l.expiry===l.day+1)))||new Set(s.lots.map(l=>l.id)).size!==s.lots.length)return null;
  if(s.books.some(b=>!b||!whole(b.day,1,1000000)||!whole(b.purchases)||!whole(b.ordinaryPurchases??0,0,b.purchases)||!whole(b.consumed)||!whole(b.drinkConsumed??0,0,b.consumed)||(b.eventLoss!==undefined&&b.eventLoss!==200))||new Set(s.books.map(b=>b.day)).size!==s.books.length)return null;
  if(s.settlements.some(b=>!b||!whole(b.day,1,1000000)||!whole(b.expired)||b.rent!==20)||new Set(s.settlements.map(b=>b.day)).size!==s.settlements.length)return null;
  return {cash:s.cash,nextLot:s.nextLot,activeDay:s.activeDay,...(s.drinkService?{drinkService:true as const}:{}),...(s.drinks?{drinks}:{}),...(s.refrigeration?{refrigeration:{...s.refrigeration}}:{}),lots:s.lots.map(l=>({...l})),books:s.books.map(b=>({...b})),settlements:s.settlements.map(b=>({...b}))};
}

/** Stock is owned once, reserved once, and consumed once. Released tickets are idempotent. */
export class CozyStock {
  private inventory: CozyLot[] = [];
  private nextLot = 1;
  private tickets = new Map<string, Reservation>();
  private money = INITIAL_CASH;
  private books = new Map<number, { purchases:number; ordinaryPurchases?:number; eventLoss?:number; drinkConsumed?:number; consumed:number }>();
  private ingredientCosts=new Map<number,Map<StockIngredient,number>>();
  private settlements=new Map<number,{expired:number;rent:number}>();
  private activeDay=1;
  private refrigeration:CozyStockSnapshot['refrigeration'];
  private drinks=emptyDrinkInventory();
  private drinkService=false;
  get drinksEnabled(){return this.drinkService;}
  private express = new Map<string,{receipt:ExpressReceipt;received:boolean}>();
  exportCheckpoint():CozyStockSnapshot {return {cash:this.money,nextLot:this.nextLot,activeDay:this.activeDay,...(this.drinkService?{drinkService:true as const}:{}),...(Object.values(this.drinks).some(Boolean)?{drinks:{...this.drinks}}:{}),...(this.refrigeration?{refrigeration:{...this.refrigeration}}:{}),lots:this.inventory.map(l=>({...l})),books:[...this.books].map(([day,b])=>({day,...b})),settlements:[...this.settlements].map(([day,b])=>({day,...b}))};}
  static restore(value:unknown):CozyStock|null {const s=validateStockSnapshot(value);if(!s)return null;const stock=new CozyStock();stock.money=s.cash;stock.drinks=validateDrinkInventory(s.drinks)!;stock.drinkService=!!s.drinkService;stock.nextLot=s.nextLot;stock.activeDay=s.activeDay;stock.refrigeration=s.refrigeration;stock.inventory=s.lots.map(l=>({...l,expiry:isNonExpiring(l.ingredient)?NON_EXPIRING_DAY:l.expiry}));stock.books=new Map(s.books.map(({day,...b})=>[day,b]));stock.settlements=new Map(s.settlements.map(({day,...b})=>[day,b]));return stock;}
  /** Apply once to still-usable lots; disposed or already expired food is never restored. */
  enableRefrigeration(day:number):boolean {
    if(this.refrigeration||!Number.isSafeInteger(day)||day<this.activeDay||day>1000000||this.settlements.has(day))return false;
    this.refrigeration={multiplier:4,acquiredDay:day};
    for(const lot of this.inventory)if(this.usable(lot,day)&&!isNonExpiring(lot.ingredient))lot.expiry=ingredientExpiry(lot.ingredient,lot.day,4);
    for(const pending of this.express.values())if(!pending.received&&pending.receipt.expiry>=day)pending.receipt.expiry=ingredientExpiry(pending.receipt.ingredient,pending.receipt.day,4);
    return true;
  }
  private expiry(id:StockIngredient,day:number){return ingredientExpiry(id,day,this.refrigeration?4:1);}
  ledger(day:number) { const book=this.books.get(day);return {purchases:book?.purchases??0,consumed:book?.consumed??0}; }
  consumedByIngredient(day:number):{ingredient:StockIngredient;cost:number}[] {return [...(this.ingredientCosts.get(day)??[])].map(([ingredient,cost])=>({ingredient,cost}));}
  private book(day:number) { if(!this.books.has(day))this.books.set(day,{purchases:0,consumed:0});return this.books.get(day)!; }
  supplier(day:number){const purchased=[...this.books].filter(([d])=>d<day).reduce((n,[,b])=>n+(b.ordinaryPurchases??0),0);return {purchased,threshold:SUPPLIER_THRESHOLD,familiar:purchased>=SUPPLIER_THRESHOLD,discount:purchased>=SUPPLIER_THRESHOLD?10:0};}
  purchasePrice(id:StockIngredient,day:number){return supplierPrice(datedIngredientPrice(id,day),this.supplier(day).purchased);}
  get cash() { return this.money; }
  debit(amount:number):boolean { if(!Number.isSafeInteger(amount)||amount<0||amount>this.money)return false;this.money-=amount;return true; }
  spend(amount:number):boolean { return this.debit(amount); }
  /** Only the approved daily event may force an overdraft; ordinary spending still needs funds. */
  applyCampaignLoss(day:number):boolean {
    if(!Number.isSafeInteger(day)||day<1||day>1000000||this.settlements.has(day)||this.books.get(day)?.eventLoss)return false;
    this.book(day).eventLoss=200;this.money-=200;return true;
  }
  get lots(): readonly Readonly<CozyLot>[] { return this.inventory.map(lot => ({ ...lot })); }
  inventorySnapshot():CozyInventory {
    return {units:this.inventory.reduce((sum,l)=>sum+l.quantity,0)+Object.values(this.drinks).reduce((n,q)=>n+q,0),value:this.inventory.reduce((sum,l)=>sum+l.quantity*l.unitCost,0)+drinkInventoryValue(this.drinks),lots:this.inventory.map(l=>({...l})),...(Object.values(this.drinks).some(Boolean)?{drinks:{...this.drinks}}:{})};
  }
  drinkConsumed(day:number){return this.books.get(day)?.drinkConsumed??0;}
  drinkOwned(id:DrinkId){return this.drinks[id]??0;}
  buyDrink(id:DrinkId,quantity:number,day:number):boolean {
    if(!isDrinkId(id)||!Number.isSafeInteger(quantity)||quantity<1||quantity>100||!Number.isSafeInteger(day)||day<this.activeDay||day>1000000||this.settlements.has(day)||this.drinks[id]+quantity>1000000)return false;
    const cost=drinkDefinition(id).purchasePrice*quantity;if(!this.debit(cost))return false;
    this.drinkService=true;this.drinks[id]+=quantity;this.book(day).purchases+=cost;return true;
  }
  consumeDrink(id:DrinkId,day:number):boolean {
    if(!isDrinkId(id)||!Number.isSafeInteger(day)||day<this.activeDay||day>1000000||this.settlements.has(day)||this.drinks[id]<1)return false;
    this.drinks[id]--;const book=this.book(day);book.consumed+=drinkDefinition(id).purchasePrice;book.drinkConsumed=(book.drinkConsumed??0)+drinkDefinition(id).purchasePrice;return true;
  }
  private usable(lot:CozyLot,day:number) {return Number.isInteger(day)&&day>=1&&day<=1000000&&lot.day<=day&&lot.expiry>=day;}
  private held(lotId:number) {return [...this.tickets.values()].flatMap(t=>t.allocations).filter(a=>a.lotId===lotId).reduce((sum,a)=>sum+a.quantity,0);}
  owned(id: StockIngredient,day=this.activeDay) { return this.inventory.filter(lot => lot.ingredient === id&&this.usable(lot,day)).reduce((sum, lot) => sum + lot.quantity, 0); }
  reserved(id: StockIngredient,day=this.activeDay): number { return this.inventory.filter(lot=>lot.ingredient===id&&this.usable(lot,day)).reduce((sum,lot)=>sum+this.held(lot.id),0); }
  available(id: StockIngredient,day=this.activeDay) { return this.owned(id,day) - this.reserved(id,day); }
  buy(id: StockIngredient, quantity: number, day = 1): boolean {
    if(!Number.isInteger(day)||day<1||day>1000000||this.settlements.has(day))return false;
    if (!STOCK_INGREDIENTS.includes(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) return false;
    const total = this.purchasePrice(id,day) * quantity;
    if (total > this.money) return false;
    this.money -= total;
    this.book(day).purchases += total;this.book(day).ordinaryPurchases=(this.book(day).ordinaryPurchases??0)+total;
    this.inventory.push({ id: this.nextLot++, ingredient: id, quantity, unitCost: this.purchasePrice(id,day), day, expiry: this.expiry(id,day) });
    return true;
  }
  /** Validate every line before committing one ordinary purchase ledger entry. */
  buyAll(entries:readonly MarketBasketEntry[],day:number):boolean {
    if(!Number.isSafeInteger(day)||day<1||day>1000000||this.settlements.has(day)||!entries.length||entries.length>STOCK_INGREDIENTS.length||new Set(entries.map(e=>e.ingredient)).size!==entries.length)return false;
    if(entries.some(e=>!STOCK_INGREDIENTS.includes(e.ingredient)||!Number.isSafeInteger(e.quantity)||e.quantity<1||e.quantity>100||e.unitPrice!==this.purchasePrice(e.ingredient,day)))return false;
    const total=entries.reduce((sum,e)=>sum+e.quantity*e.unitPrice,0);
    if(!Number.isSafeInteger(total)||total>this.money)return false;
    this.money-=total;
    const book=this.book(day);book.purchases+=total;book.ordinaryPurchases=(book.ordinaryPurchases??0)+total;
    for(const entry of entries)this.inventory.push({id:this.nextLot++,ingredient:entry.ingredient,quantity:entry.quantity,unitCost:entry.unitPrice,day,expiry:this.expiry(entry.ingredient,day)});
    return true;
  }
  missing(recipe: StockRecipe,day=this.activeDay): StockIngredient[] { return recipeIngredients(recipe).filter(id => this.available(id,day) < 1); }
  orderExpress(commandId:string,id:StockIngredient,quantity:number,day=this.activeDay):ExpressReceipt|null {
    const old=this.express.get(commandId);
    if(old)return old.receipt.ingredient===id&&old.receipt.quantity===quantity&&old.receipt.day===day?{...old.receipt}:null;
    if(typeof commandId!=='string'||!commandId.trim()||!STOCK_INGREDIENTS.includes(id)||!Number.isInteger(quantity)||quantity<1||quantity>100||!Number.isInteger(day)||day<1||day>1000000||this.settlements.has(day))return null;
    const unitCost=expressIngredientPrice(id,day),total=unitCost*quantity;
    if(!this.debit(total))return null;
    const receipt={id:commandId,ingredient:id,quantity,unitCost,total,day,expiry:this.expiry(id,day)};
    this.book(day).purchases+=total;this.express.set(commandId,{receipt,received:false});return {...receipt};
  }
  receiveExpress(commandId:string):boolean {
    const pending=this.express.get(commandId);
    if(!pending||pending.received||this.settlements.has(pending.receipt.day))return false;
    const {ingredient,quantity,unitCost,day,expiry}=pending.receipt;
    this.inventory.push({id:this.nextLot++,ingredient,quantity,unitCost,day,expiry});pending.received=true;return true;
  }
  reserve(ticketId: string, recipe: StockRecipe, expiresAt: number,day=this.activeDay): boolean {
    if(typeof ticketId!=='string'||!ticketId.trim()||this.tickets.has(ticketId)||!STOCK_RECIPES.includes(recipe)||!Number.isFinite(expiresAt)||!Number.isInteger(day)||day<1||day>1000000||this.settlements.has(day))return false;
    return this.reserveIngredients(ticketId,recipeIngredients(recipe),expiresAt,day);
  }
  reserveIngredients(ticketId:string,actual:readonly StockIngredient[],expiresAt:number,day=this.activeDay):boolean {
    if(typeof ticketId!=='string'||!ticketId.trim()||!Number.isFinite(expiresAt)||!Number.isInteger(day)||day<1||day>1000000||this.settlements.has(day)||new Set(actual).size!==actual.length||actual.some(id=>!STOCK_INGREDIENTS.includes(id)))return false;
    const prior=this.tickets.get(ticketId);
    const allocations:Allocation[]=[];
    for(const ingredient of actual){
      const lot=this.inventory.filter(l=>l.ingredient===ingredient&&this.usable(l,day)&&l.quantity>this.held(l.id)-(prior?.allocations.filter(a=>a.lotId===l.id).reduce((sum,a)=>sum+a.quantity,0)??0)).sort((a,b)=>a.expiry-b.expiry||a.id-b.id)[0];
      if(!lot)return false;
      allocations.push({lotId:lot.id,ingredient,quantity:1});
    }
    this.tickets.set(ticketId,{allocations,day,expiresAt});return true;
  }
  commit(ticketId: string, consumed: readonly StockIngredient[], day = this.activeDay): boolean {
    if(!Number.isInteger(day)||day<1||day>1000000||this.settlements.has(day))return false;
    const ticket = this.tickets.get(ticketId);
    if (!ticket || ticket.day!==day || !consumed.length || new Set(consumed).size !== consumed.length) return false;
    const selected:CozyLot[]=[];
    for(const id of consumed){
      const allocation=ticket.allocations.find(a=>a.ingredient===id),lot=allocation&&this.inventory.find(l=>l.id===allocation.lotId);
      if(!STOCK_INGREDIENTS.includes(id)||!allocation||!lot||!this.usable(lot,day)||lot.quantity<allocation.quantity)return false;
      selected.push(lot);
    }
    for(const lot of selected){
      lot.quantity--;this.book(day).consumed+=lot.unitCost;
      const costs=this.ingredientCosts.get(day)??new Map<StockIngredient,number>();
      costs.set(lot.ingredient,(costs.get(lot.ingredient)??0)+lot.unitCost);this.ingredientCosts.set(day,costs);
    }
    this.inventory = this.inventory.filter(lot => lot.quantity > 0);
    this.tickets.delete(ticketId); return true;
  }
  release(ticketId: string): boolean { return this.tickets.delete(ticketId); }
  expire(now: number): string[] {
    if (!Number.isFinite(now)) return [];
    const expired = [...this.tickets].filter(([, ticket]) => ticket.expiresAt <= now).map(([id]) => id);
    for (const id of expired) this.release(id);
    return expired;
  }
  receive(amount: number): void { if (Number.isFinite(amount) && amount >= 0) this.money += amount; }
  settle(day:number): {expired:number;rent:number} {
    if(this.settlements.has(day))return {...this.settlements.get(day)!};
    if(!Number.isInteger(day)||day<1||day>1000000)return {expired:0,rent:0};
    let expired=0;for(const lot of this.inventory)if(lot.expiry<=day){expired+=lot.quantity*lot.unitCost;lot.quantity=0;}
    this.inventory=this.inventory.filter(lot=>lot.quantity>0);this.tickets.clear();this.money-=20;
    this.activeDay=Math.max(this.activeDay,day+1);
    const result={expired,rent:20};this.settlements.set(day,result);return {...result};
  }
}
