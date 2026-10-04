import { ingredients, recipes } from './demo';
export type StockIngredient = 'dough' | 'sauce' | 'cheese' | 'mushroom' | 'sausage';
export type StockRecipe = 'cheese' | 'mushroom' | 'sausage';
export const STOCK_RECIPES:readonly StockRecipe[]=['cheese','mushroom','sausage'];
export const STOCK_INGREDIENTS: readonly StockIngredient[] = ['dough', 'sauce', 'cheese', 'mushroom','sausage'];
export function recipeIngredients(recipe: StockRecipe): StockIngredient[] {
  return [...recipes.find(item => item.id === recipe)!.ingredients] as StockIngredient[];
}
export function ingredientPrice(id: StockIngredient): number { return ingredients.find(item => item.id === id)!.basePrice; }
export function datedIngredientPrice(id: StockIngredient, day: number): number { return Math.round(ingredientPrice(id) * [1, 1.1, .9][day - 1]!); }
export function ingredientExpiry(id: StockIngredient, day: number): number { return day + (id === 'mushroom'||id==='sausage' ? 0 : 1); }
export function recipePrice(id: StockRecipe): number { return recipes.find(item => item.id === id)!.price; }
export function ingredientName(id: StockIngredient): string { return ingredients.find(item => item.id === id)!.name; }
interface Allocation { lotId:number; ingredient:StockIngredient; quantity:number }
interface Reservation { allocations:Allocation[]; day:number; expiresAt:number }
export interface CozyLot { id: number; ingredient: StockIngredient; quantity: number; unitCost: number; day: number; expiry: number }
export interface CozyInventory {units:number;value:number;lots:CozyLot[]}
export interface CozyStockSnapshot {cash:number;nextLot:number;activeDay:number;lots:CozyLot[];books:{day:number;purchases:number;consumed:number}[];settlements:{day:number;expired:number;rent:number}[]}
export function validateStockSnapshot(value:unknown):CozyStockSnapshot|null {
  if(!value||typeof value!=='object')return null;
  const s=value as CozyStockSnapshot,whole=(n:unknown,min=0,max=1000000)=>Number.isSafeInteger(n)&&Number(n)>=min&&Number(n)<=max;
  if(!whole(s.cash,-20)||!whole(s.nextLot,1,10000)||!whole(s.activeDay,1,3)||!Array.isArray(s.lots)||s.lots.length>300||!Array.isArray(s.books)||s.books.length>3||!Array.isArray(s.settlements)||s.settlements.length>3)return null;
  if(s.lots.some(l=>!l||!whole(l.id,1,9999)||l.id>=s.nextLot||!STOCK_INGREDIENTS.includes(l.ingredient)||!whole(l.quantity,1,100)||!whole(l.day,1,3)||l.unitCost!==datedIngredientPrice(l.ingredient,l.day)||l.expiry!==ingredientExpiry(l.ingredient,l.day))||new Set(s.lots.map(l=>l.id)).size!==s.lots.length)return null;
  if(s.books.some(b=>!b||!whole(b.day,1,3)||!whole(b.purchases)||!whole(b.consumed))||new Set(s.books.map(b=>b.day)).size!==s.books.length)return null;
  if(s.settlements.some(b=>!b||!whole(b.day,1,3)||!whole(b.expired)||b.rent!==20)||new Set(s.settlements.map(b=>b.day)).size!==s.settlements.length)return null;
  return {cash:s.cash,nextLot:s.nextLot,activeDay:s.activeDay,lots:s.lots.map(l=>({...l})),books:s.books.map(b=>({...b})),settlements:s.settlements.map(b=>({...b}))};
}

/** Stock is owned once, reserved once, and consumed once. Released tickets are idempotent. */
export class CozyStock {
  private inventory: CozyLot[] = [];
  private nextLot = 1;
  private tickets = new Map<string, Reservation>();
  private money = 300;
  private books = new Map<number, { purchases:number; consumed:number }>();
  private settlements=new Map<number,{expired:number;rent:number}>();
  private activeDay=1;
  exportCheckpoint():CozyStockSnapshot {return {cash:this.money,nextLot:this.nextLot,activeDay:this.activeDay,lots:this.inventory.map(l=>({...l})),books:[...this.books].map(([day,b])=>({day,...b})),settlements:[...this.settlements].map(([day,b])=>({day,...b}))};}
  static restore(value:unknown):CozyStock|null {const s=validateStockSnapshot(value);if(!s)return null;const stock=new CozyStock();stock.money=s.cash;stock.nextLot=s.nextLot;stock.activeDay=s.activeDay;stock.inventory=s.lots;stock.books=new Map(s.books.map(({day,...b})=>[day,b]));stock.settlements=new Map(s.settlements.map(({day,...b})=>[day,b]));return stock;}
  ledger(day:number) { return {...(this.books.get(day) ?? {purchases:0,consumed:0})}; }
  private book(day:number) { if(!this.books.has(day))this.books.set(day,{purchases:0,consumed:0});return this.books.get(day)!; }
  get cash() { return this.money; }
  get lots(): readonly Readonly<CozyLot>[] { return this.inventory.map(lot => ({ ...lot })); }
  inventorySnapshot():CozyInventory {
    return {units:this.inventory.reduce((sum,l)=>sum+l.quantity,0),value:this.inventory.reduce((sum,l)=>sum+l.quantity*l.unitCost,0),lots:this.inventory.map(l=>({...l}))};
  }
  private usable(lot:CozyLot,day:number) {return Number.isInteger(day)&&day>=1&&day<=3&&lot.day<=day&&lot.expiry>=day;}
  private held(lotId:number) {return [...this.tickets.values()].flatMap(t=>t.allocations).filter(a=>a.lotId===lotId).reduce((sum,a)=>sum+a.quantity,0);}
  owned(id: StockIngredient,day=this.activeDay) { return this.inventory.filter(lot => lot.ingredient === id&&this.usable(lot,day)).reduce((sum, lot) => sum + lot.quantity, 0); }
  reserved(id: StockIngredient,day=this.activeDay): number { return this.inventory.filter(lot=>lot.ingredient===id&&this.usable(lot,day)).reduce((sum,lot)=>sum+this.held(lot.id),0); }
  available(id: StockIngredient,day=this.activeDay) { return this.owned(id,day) - this.reserved(id,day); }
  buy(id: StockIngredient, quantity: number, day = 1): boolean {
    if(!Number.isInteger(day)||day<1||day>3||this.settlements.has(day))return false;
    if (!STOCK_INGREDIENTS.includes(id) || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) return false;
    const total = datedIngredientPrice(id,day) * quantity;
    if (total > this.money) return false;
    this.money -= total;
    this.book(day).purchases += total;
    this.inventory.push({ id: this.nextLot++, ingredient: id, quantity, unitCost: datedIngredientPrice(id,day), day, expiry: ingredientExpiry(id,day) });
    return true;
  }
  missing(recipe: StockRecipe,day=this.activeDay): StockIngredient[] { return recipeIngredients(recipe).filter(id => this.available(id,day) < 1); }
  reserve(ticketId: string, recipe: StockRecipe, expiresAt: number,day=this.activeDay): boolean {
    if(typeof ticketId!=='string'||!ticketId.trim()||this.tickets.has(ticketId)||!STOCK_RECIPES.includes(recipe)||!Number.isFinite(expiresAt)||!Number.isInteger(day)||day<1||day>3||this.settlements.has(day))return false;
    const allocations:Allocation[]=[];
    for(const ingredient of recipeIngredients(recipe)){
      const lot=this.inventory.filter(l=>l.ingredient===ingredient&&this.usable(l,day)&&l.quantity>this.held(l.id)).sort((a,b)=>a.expiry-b.expiry||a.id-b.id)[0];
      if(!lot)return false;
      allocations.push({lotId:lot.id,ingredient,quantity:1});
    }
    this.tickets.set(ticketId,{allocations,day,expiresAt});return true;
  }
  commit(ticketId: string, consumed: readonly StockIngredient[], day = this.activeDay): boolean {
    if(!Number.isInteger(day)||day<1||day>3||this.settlements.has(day))return false;
    const ticket = this.tickets.get(ticketId);
    if (!ticket || ticket.day!==day || !consumed.length || new Set(consumed).size !== consumed.length) return false;
    const selected:CozyLot[]=[];
    for(const id of consumed){
      const allocation=ticket.allocations.find(a=>a.ingredient===id),lot=allocation&&this.inventory.find(l=>l.id===allocation.lotId);
      if(!STOCK_INGREDIENTS.includes(id)||!allocation||!lot||!this.usable(lot,day)||lot.quantity<allocation.quantity)return false;
      selected.push(lot);
    }
    for(const lot of selected){lot.quantity--;this.book(day).consumed+=lot.unitCost;}
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
    if(!Number.isInteger(day)||day<1||day>3)return {expired:0,rent:0};
    let expired=0;for(const lot of this.inventory)if(lot.expiry<=day){expired+=lot.quantity*lot.unitCost;lot.quantity=0;}
    this.inventory=this.inventory.filter(lot=>lot.quantity>0);this.tickets.clear();this.money-=20;
    this.activeDay=Math.min(3,Math.max(this.activeDay,day+1));
    const result={expired,rent:20};this.settlements.set(day,result);return {...result};
  }
}
