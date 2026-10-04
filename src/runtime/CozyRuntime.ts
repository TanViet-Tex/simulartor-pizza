import {recipeDefinition,defaultRecipePercents} from '../config/recipeCatalog';
import {DELIVERY_RULES,deliveryEvent,deliveryTiming,deliverySchedule,type DeliveryEvent,type DeliveryScheduleSlot} from '../config/deliveryEvents';
import { bakeTiming } from '../config/bakeTiming';
import { customerProfile } from '../config/customerCatalog';
import {OVEN_UPGRADE_PRICES,QUEUE_UPGRADE_PRICE} from '../config/kitchenEconomy';
import { CUSTOMER_PROFILES, type CustomerKind } from '../config/ordinaryCustomers';
import { menuPrice, agreedPrice, priceAccepted, reputationResult, relationshipResult, referralEligibility } from '../domain/CustomerProgression';
import {threeDaySchedule,validateCozySchedule,resolveScheduleRecipe,type CozySchedule,type ScheduleFactory,type ScheduleSlot} from '../config/cozySchedule';
import { deliveryResult } from '../domain/DeliveryResult';
import {closeAccounts} from '../domain/DayAccounts';
import {compactCozyReport,expandCozyReport,reportProgression,COZY_CONTENT_VERSION,validateCozyCheckpoint,type CozyCheckpoint,type CozyDaySummary,type CozyReview} from '../domain/CozyCheckpoint';
import {cozyViability} from '../domain/CozyViability';
export type {CozyDaySummary,CozyReview} from '../domain/CozyCheckpoint';
import {CozyProgression,type ProgressEffects} from '../domain/CozyProgression';
import type { PauseLease } from './PlayLifecycle';
import { COZY_BAKE, CozyOrder, type CozyIntent } from '../domain/CozyOrder';
import { CozyStock,STOCK_RECIPES, datedIngredientPrice, ingredientExpiry, ingredientName, recipeIngredients, recipePrice, type StockIngredient, type StockRecipe } from '../domain/CozyStock';
export type CozyRuntimeIntent=CozyIntent|{type:'customer.price';recipe:StockRecipe;percent:number}|{type:'customer.bargain';accept:boolean}|{type:'customer.help';accept:boolean}|{type:'customer.thanks'}|{type:'market.buy';ingredient:StockIngredient;quantity:number;commandId:string}|{type:'menu.configure';recipe:StockRecipe;percent:number;enabled:boolean}|{type:'express.order';ingredient:StockIngredient;quantity:number;commandId:string}|{type:'shop.upgrade';kind:'oven'|'queue';commandId:string};

export type CozyPause = 'user' | 'visibility' | 'orientation' | 'order' | 'gap' | 'success' | 'tutorial' | 'discard' | 'delivery' | 'menu' | 'bargain' | 'help' | 'save';
export type CozyTutorialStep = 'dough' | 'sauce' | 'cheese' | 'bake' | 'warming' | 'extract' | 'box' | 'deliver' | 'complete';
const steps: readonly CozyTutorialStep[] = ['dough', 'sauce', 'cheese', 'bake', 'warming', 'extract', 'box', 'deliver', 'complete'];
type Ticket = {source:'shop'|'app';quantity:1|2|3;packed:{stars:number;reasons:string[];correct:boolean}[]; avatarIndex:number; bargainDecision?:'accepted'|'declined'; id: string; name: string; recipe: StockRecipe; kind: CustomerKind; help?:boolean; bakedCost?:number;giftBooked?:boolean; takeaway:boolean; finalPrice:number; patience: number; extraPenalty: number; deadline: number; committed: boolean; order: CozyOrder };
export type CozyHelpState={decision:'unseen'|'accepted'|'declined';outcome:null|'pending'|'succeeded'|'failed';ticketId:string|null;offer:{arrivalId:string;name:string}|null;giftCost:number;claims:string[];thanksPending:boolean};
export function validateHelpState(value:unknown):CozyHelpState|null {
  if(!value||typeof value!=='object')return null;
  const s=value as CozyHelpState;
  if(!['unseen','accepted','declined'].includes(s.decision)||![null,'pending','succeeded','failed'].includes(s.outcome)||!Number.isSafeInteger(s.giftCost)||s.giftCost<0||typeof s.thanksPending!=='boolean'||!Array.isArray(s.claims)||s.claims.some(id=>id!=='regular.thanks-day-3')||new Set(s.claims).size!==s.claims.length)return null;
  if(s.ticketId!==null&&(typeof s.ticketId!=='string'||!/^cozy-\d+$/.test(s.ticketId)))return null;
  if(s.offer!==null&&(!s.offer||typeof s.offer.arrivalId!=='string'||!s.offer.arrivalId||s.offer.name!=='Linh'))return null;
  if((s.decision==='accepted'?(s.outcome===null||s.outcome==='pending'&&!s.ticketId||s.offer!==null):(s.outcome!==null||s.ticketId!==null||s.giftCost!==0))||s.offer!==null&&s.decision!=='unseen'||s.thanksPending&&(!s.claims.length||s.outcome==='pending'))return null;
  return {decision:s.decision,outcome:s.outcome,ticketId:s.ticketId,offer:s.offer?{arrivalId:s.offer.arrivalId,name:s.offer.name}:null,giftCost:s.giftCost,claims:[...s.claims],thanksPending:s.thanksPending};
}
export type CozyScheduleDependencies=Readonly<{schedule?:ScheduleFactory;deliveryStaffAvailable?:()=>boolean;resolveRecipe?:(slot:ScheduleSlot,enabled:readonly StockRecipe[],selected:StockRecipe)=>StockRecipe|null}>;
export class CozyRuntime {
  private appEnabled=false;
  private appCommands=new Set<string>();
  private bookingCommands=new Set<string>();
  private shiftEvent:DeliveryEvent|null=null;
  private shiftApp=false;
  private shiftStaff=false;
  private deliveryFees=0;
  private pizzasSold=0;
  private deliveryTime=0;
  private courier:{mode:'shipper'|'staff';phase:'waiting'|'arrived'|'travel'|'return';ticketId:string;remaining:number;ticket?:Ticket;launchedAt?:number}|null=null;
  get deliveryApp(){return {available:this.preparationDay>=DELIVERY_RULES.unlockDay,enabled:this.appEnabled,nextEvent:deliveryEvent(this.preparationDay),event:this.shiftEvent,staffAvailable:this.shiftOpen?this.shiftStaff:!!this.scheduleDependencies.deliveryStaffAvailable?.(),...deliveryTiming((this.shiftOpen?this.shiftEvent!:deliveryEvent(this.preparationDay)).id)};}
  get deliveryStatus(){const c=this.courier;return {busy:!!c,mode:c?.mode??null,phase:c?.phase??'idle' as const,remaining:c?.remaining??0,ticketId:c?.ticketId??null,shipments:c?.phase==='travel'?1:0};}
  configureDeliveryApp(enabled:boolean,commandId:string):boolean {
    if(!this.canSetPrices||this.preparationDay<5||typeof enabled!=='boolean'||typeof commandId!=='string'||!commandId.trim()||this.appCommands.has(commandId)||enabled===this.appEnabled)return false;
    this.appEnabled=enabled;this.appCommands.add(commandId);this.revision++;return true;
  }
  bookShipper(ticketId:string,commandId:string):boolean {return this.clockAction(()=>{
    const t=this.active.get(ticketId);
    if(!this.saveGuard()||this.reasons.size||!t||t.source!=='app'||t.deadline<=this.elapsed||this.courier||this.shiftStaff||typeof commandId!=='string'||!commandId.trim()||this.bookingCommands.has(commandId))return false;
    this.bookingCommands.add(commandId);this.courier={mode:'shipper',phase:'waiting',ticketId,remaining:deliveryTiming(this.shiftEvent!.id).waitSeconds};this.revision++;return true;
  });}
  private recipeOwnership=new Set<StockRecipe>(['cheese','mushroom']);
  private purchasedRecipes:StockRecipe[]=[];
  private grantedRecipes:StockRecipe[]=[];
  private recipeSpent=0;
  private pendingRecipeSpent=0;
  private recipeCommands=new Set<string>();
  get ownedRecipes(){return [...this.recipeOwnership];}
  get recipePurchases(){return {spent:this.recipeSpent,pendingSpent:this.pendingRecipeSpent,purchased:[...this.purchasedRecipes],granted:[...this.grantedRecipes]};}
  buyRecipe(recipe:StockRecipe,commandId:string):boolean {
    if(!this.canSetPrices||!STOCK_RECIPES.includes(recipe)||typeof commandId!=='string'||!commandId.trim()||this.recipeCommands.has(commandId)||this.recipeOwnership.has(recipe))return false;
    const cost=recipeDefinition(recipe).purchasePrice;if(!this.stock.debit(cost))return this.shopFeedback('Kh\u00f4ng \u0111\u1ee7 ti\u1ec1n mua c\u00f4ng th\u1ee9c.');
    this.recipeCommands.add(commandId);this.recipeOwnership.add(recipe);this.enabledMenu.add(recipe);this.purchasedRecipes.push(recipe);this.recipeSpent+=cost;this.pendingRecipeSpent+=cost;this.message='\u0110\u00e3 m\u1edf c\u00f4ng th\u1ee9c '+recipeDefinition(recipe).name;this.revision++;return true;
  }
  private ovenUpgrade:0|1|2=0;
  private queueUpgrade=0;
  private upgradeSpent=0;
  private pendingUpgradeSpent=0;
  private capitalPurchases=0;
  private upgradeCommands=new Set<string>();
  private customerDecisions={accepted:[] as number[],declined:[] as number[]};
  private expressPending=new Map<string,{id:string;ingredient:StockIngredient;quantity:number;unitPrice:number;remaining:number;duration:number}>();
  get ovenLevel(){return this.ovenUpgrade;}
  get queueCapacity(){return this.queueUpgrade?6:4;}
  get bakeTiming(){return bakeTiming(this.ovenUpgrade);}
  get upgrades(){return {ovenLevel:this.ovenUpgrade,queueLevel:this.queueUpgrade,spent:this.upgradeSpent,pendingSpent:this.pendingUpgradeSpent};}
  get customerMemory(){return structuredClone(this.customerDecisions);}
  get expressOrders(){return [...this.expressPending.values()].map(order=>({...order}));}
  expressPrice(id:StockIngredient){return Math.ceil(datedIngredientPrice(id,this.preparationDay)*1.6);}
  upgradePrice(kind:'oven'|'queue'){return kind==='oven'?OVEN_UPGRADE_PRICES[this.ovenUpgrade]??null:this.queueUpgrade?null:QUEUE_UPGRADE_PRICE;}
  private order = new CozyOrder();
  private stock = new CozyStock();
  private phase: 'preparation' | 'making' | 'delivered' | 'summary' = 'preparation';
  private currentDay=1;
  private guidedPreparation=false;
  private summary:CozyDaySummary|null=null;
  private reports:CozyDaySummary[]=[];
  private saveGuard:()=>boolean=()=>true;
  private guarded=false;
  /** Production session injects its gate once; callers cannot release it via pause tokens. */
  attachSaveGuard(guard:()=>boolean):void {if(this.guarded)throw new Error('Save guard already attached');this.guarded=true;this.saveGuard=guard;}
  get persistentMode(){return this.guarded;}
  get completedReports(){const master=this.progress.snapshot;return this.reports.map(report=>{const copy=structuredClone(report);delete copy.progressionArchive;Object.defineProperty(copy,'progression',{enumerable:true,get:()=>reportProgression(report,master)});return copy;});}
  exportCheckpoint():CozyCheckpoint {
    if(!this.production||this.shiftOpen||this.tutorialActive||!['preparation','summary'].includes(this.phase))throw new Error('Not a day boundary');
    const terminal=!!this.summary?.ending,day=this.summary?(terminal?this.currentDay:this.currentDay+1):this.currentDay;
    const recipe=this.recipeOwnership.has(this.recipe)?this.recipe:this.menuFor(day)[0];
    const data:CozyCheckpoint={deliveryAppEnabled:this.appEnabled,ownedRecipes:this.ownedRecipes,recipePurchases:this.recipePurchases,upgrades:this.upgrades,customerMemory:this.customerMemory,contentId:COZY_CONTENT_VERSION,day,terminal,stock:this.stock.exportCheckpoint(),progression:this.progress.snapshot,help:{decision:this.help.decision,outcome:this.help.outcome==='pending'?null:this.help.outcome,claims:[...this.help.claims]},menu:[...this.enabledMenu],prices:{...this.pricing},recipe,reports:structuredClone(this.reports),cumulativeProfit:this.cumulativeProfit,reputation:this.reputation,relationship:this.relationship,relationshipDays:[...this.relationshipDays],regularDay1Stars:this.regularDay1Stars,regularLatestStars:this.regularLatestStars,referral:this.referral?{...this.referral}:null};
    const validated=validateCozyCheckpoint(data);if(!validated)throw new Error('Invalid day boundary');return validated;
  }
  static restoreCheckpoint(value:unknown,tutorial=false,dependencies:CozyScheduleDependencies={}):CozyRuntime|null {
    const s=validateCozyCheckpoint(value);if(!s)return null;
    const r=new CozyRuntime(tutorial&&s.day===1&&!s.reports.length,true,dependencies);
    r.appEnabled=s.deliveryAppEnabled??false;r.recipeOwnership=new Set(s.ownedRecipes);r.purchasedRecipes=[...s.recipePurchases.purchased];r.grantedRecipes=[...(s.recipePurchases.granted??[])];r.recipeSpent=s.recipePurchases.spent;r.pendingRecipeSpent=s.recipePurchases.pendingSpent;
    r.ovenUpgrade=s.upgrades.ovenLevel as 0|1|2;r.queueUpgrade=s.upgrades.queueLevel;r.upgradeSpent=s.upgrades.spent;r.pendingUpgradeSpent=s.upgrades.pendingSpent;r.customerDecisions=structuredClone(s.customerMemory);r.stock=CozyStock.restore(s.stock)!;r.progress=CozyProgression.restore(s.progression)!;r.currentDay=s.day;r.enabledMenu=new Set(s.menu);r.pricing={...s.prices};r.recipe=s.recipe;r.order=new CozyOrder(false,s.recipe,true,r.ovenUpgrade);r.reports=structuredClone(s.reports);r.closedDays=new Set(s.reports.map(x=>x.day));r.cumulativeProfit=s.cumulativeProfit;r.reputation=s.reputation;r.relationship=s.relationship;r.relationshipDays=new Set(s.relationshipDays);r.regularDay1Stars=s.regularDay1Stars;r.regularLatestStars=s.regularLatestStars;r.referral=s.referral?{...s.referral}:null;
    r.serial=s.progression.outcomes.reduce((n,id)=>Math.max(n,Number(id.replace('cozy-',''))||0),0)+s.reports.reduce((n,x)=>n+x.abandoned,0)+(s.help.decision==='accepted'?1:0);
    r.help={...s.help,ticketId:null,offer:null,giftCost:0,thanksPending:false};r.startingCash=s.reports[s.reports.length-1]?.cash??300;r.openingInventoryValue=s.reports[s.reports.length-1]?.accounts.inventory.value??0;
    if(s.terminal){r.summary=expandCozyReport(s.reports[s.reports.length-1],s.progression);r.phase='summary';}return r;
  }
  private reviews:CozyReview[]=[];
  private revenue=0;
  private salesByRecipe=new Map<StockRecipe,{quantity:number;revenue:number}>();
  private progress=new CozyProgression();
  private rewardCash=0;
  private enabledMenu=new Set<StockRecipe>(['cheese','mushroom']);
  private startingCash=300;
  private openingInventoryValue=0;
  private cumulativeProfit=0;
  private deliveredCount=0;
  private abandonedCount=0;
  private closedDays=new Set<number>();
  private recipe: StockRecipe = 'cheese';
  private message = 'Mở ca; chạm ô hết nguyên liệu để đặt hỏa tốc.';
  private revision = 0;
  private elapsed = 0;
  private serial = 0;
  private ticket = '';
  private active = new Map<string, Ticket>();
  private abandoned = new Map<string, Ticket>();
  private deliveredCommands = new Set<string>();
  private purchaseCommands=new Set<string>();
  private purchaseSerial=0;
  private sourceId = '';
  private pendingDelivery: { sourceId:string; targetId:string; commandId:string; name:string; recipe:StockRecipe; reasons:string[] } | null = null;
  private result: { targetId:string; name:string; recipe:StockRecipe; help?:boolean; price:number; stars:number; reasons:string[]; outcome:'delivered'|'expired'; reputationDelta:number; relationshipDelta:number;xpDelta?:number;rewardCoins?:number;rewardReputation?:number } | null = null;
  private reputation = 50;
  private relationship=0;
  private relationshipDays=new Set<number>();
  private help:CozyHelpState={decision:'unseen',outcome:null,ticketId:null,offer:null,giftCost:0,claims:[],thanksPending:false};
  private helpLease:PauseLease|null=null;
  private dailyGiftCost=0;
  get helpState():CozyHelpState{return structuredClone(this.help);}
  get helpPending(){return this.help.offer?{...this.help.offer,reason:this.helpUnavailableReason,canAccept:!this.helpUnavailableReason}:null;}
  get thanksPending(){return this.help.thanksPending;}
  private get helpUnavailableReason(){return !this.menuFor(this.currentDay).includes('cheese')?'Linh thích pizza phô mai, món này chưa có trong thực đơn.':this.active.size>=this.queueCapacity?'Hàng chờ đã đầy. Không còn chỗ nhận đơn giúp.':'';}
  private helpChoiceBlocked(){return this.blocked('help')||(this.leases.get('help')?.size??0)>1;}
  resolveHelp(accept:boolean):boolean {
    if(typeof accept!=='boolean'||!this.help.offer||this.helpChoiceBlocked()||accept&&this.helpUnavailableReason)return false;
    const pending=this.help.offer;
    if(accept&&!this.createTicket('regular',pending.name,'cheese',0,pending.arrivalId,false,true))return false;
    this.help.offer=null;this.help.decision=accept?'accepted':'declined';
    if(accept){this.help.outcome='pending';this.help.ticketId='cozy-'+this.serial;}
    this.helpLease?.release();this.helpLease=null;
    this.message=accept?'Giúp Linh: pizza phô mai miễn phí, 120 giây. Đúng món chín vừa: quan hệ +1; sai hoặc trễ: −1.':'Đã từ chối giúp. Tiền, uy tín và quan hệ giữ nguyên.';
    this.event('help-'+this.help.decision+':'+pending.arrivalId);this.revision++;return true;
  }
  dismissThanks():boolean {if(!this.help.thanksPending||this.helpChoiceBlocked())return false;this.help.thanksPending=false;this.helpLease?.release();this.helpLease=null;this.revision++;return true;}
  private resolveHelpOutcome(t:Ticket,success:boolean){
    if(this.help.outcome!=='pending'||this.help.ticketId!==t.id)return {reputationDelta:0,relationshipDelta:0};
    const before=this.relationship;this.relationship=Math.max(0,Math.min(3,before+(success?1:-1)));this.help.outcome=success?'succeeded':'failed';
    this.event('help-'+this.help.outcome+':'+t.id);return {reputationDelta:0,relationshipDelta:this.relationship-before};
  }
  private regularDay1Stars:number|null=null;
  private regularLatestStars:number|null=null;
  private schedule:CozySchedule|null=null;
  private priceRejections=0;
  private pricing:Record<StockRecipe,number>=defaultRecipePercents();
  private referral:ReturnType<typeof referralEligibility>|null=null;
  private bargain:{sourceId:string;targetId:string;commandId:string;arrivalId:string;name:string;recipe:StockRecipe;takeaway:boolean;originalPrice:number;finalPrice:number;patience:number;maxPricePercent:number;discountPercent:number}|null=null;
  private bargainLease:PauseLease|null=null;
  get bargainPending(){return this.bargain?{...this.bargain}:null;}
  get customerProgress(){return {reputation:this.reputation,relationship:this.relationship,priceRejections:this.priceRejections,referral:this.referral?{...this.referral}:null,pricePercents:{...this.pricing},prices:Object.fromEntries(STOCK_RECIPES.map(id=>[id,menuPrice(recipePrice(id),this.pricing[id])!])) as Record<StockRecipe,number>};}
  get progression(){const stats=this.preparationDay===this.currentDay&&this.phase!=='summary'?this.goalStats():{delivered:0,sales:0,stars:[]};return {...this.progress.snapshot,level:this.progress.level,goal:this.progress.goal(this.preparationDay,stats)};}
  private goalStats(){return {delivered:this.deliveredCount,sales:this.revenue,stars:this.reviews.map(r=>r.stars)};}
  get availableRecipes(){return STOCK_RECIPES.filter(recipe=>this.recipeOwnership.has(recipe));}
  private menuFor(_day:number){return STOCK_RECIPES.filter(recipe=>this.enabledMenu.has(recipe)&&this.recipeOwnership.has(recipe));}
  get menuRecipes(){return this.menuFor(this.preparationDay);}
  configureMenu(recipe:StockRecipe,percent:number,enabled:boolean):boolean {
    if(!this.canSetPrices||!this.availableRecipes.includes(recipe)||typeof enabled!=='boolean'||menuPrice(recipePrice(recipe),percent)===null)return false;
    const next=new Set(this.enabledMenu);if(enabled)next.add(recipe);else next.delete(recipe);
    const eligible=this.availableRecipes.filter(id=>next.has(id));
    if(!eligible.length)return this.shopFeedback('Thực đơn cần ít nhất một món đang mở.');
    this.enabledMenu=next;this.pricing[recipe]=percent;this.recipe=enabled?recipe:eligible[0];
    if(!this.active.size)this.order=new CozyOrder(false,this.recipe,true,this.ovenUpgrade);
    this.message='Đã cập nhật thực đơn và giá trước mở cửa.';this.revision++;return true;
  }
  private applyProgress(effect:ProgressEffects){
    if(!effect.accepted)return 0;
    this.stock.receive(effect.coins);this.rewardCash+=effect.coins;
    const before=this.reputation;this.reputation=Math.min(100,this.reputation+effect.reputation);
    for(const claim of effect.claims)this.event('reward:'+claim);
    return this.reputation-before;
  }
  get canSetPrices(){return this.saveGuard()&&this.productionActive&&!this.reasons.size&&(this.phase==='preparation'&&!this.shiftOpen||this.canPrepareNextDay);}
  get preparationBudget(){
    const cash=this.stock.cash,rent=20;
    const viability=cozyViability(cash,this.preparationDay,STOCK_RECIPES.filter(recipe=>this.recipeOwnership.has(recipe)),id=>this.stock.available(id,this.preparationDay),id=>this.stock.purchasePrice(id,this.preparationDay));
    return {cash,rent,afterRent:cash-rent,warning:viability.message||this.missingReason,viability};
  }
  setMenuPrice(recipe:StockRecipe,percent:number):boolean {
    if(this.productionActive&&this.shiftOpen)return this.shopFeedback('Chỉ đổi giá trước khi mở cửa. Đơn đã nhận giữ nguyên giá.');
    if(!this.canSetPrices||!this.availableRecipes.includes(recipe)||menuPrice(recipePrice(recipe),percent)===null)return false;
    this.pricing[recipe]=percent;this.revision++;return true;
  }
  private terminal(t:Ticket,stars:number,reasons:string[],outcome:CozyReview['outcome']){
    if(t.help)return this.resolveHelpOutcome(t,outcome==='delivered'&&!reasons.length);
    if(t.kind==='regular'){this.regularLatestStars=stars;if(this.currentDay===1)this.regularDay1Stars=stars;}
    const rep=reputationResult(this.reputation,stars),relation=relationshipResult(this.relationship,t.kind,stars,this.relationshipDays.has(this.currentDay));
    this.reputation=rep.value;this.relationship=relation.value;
    if(t.kind==='regular'&&stars>=4){this.relationshipDays.add(this.currentDay);if(relation.delta)this.event('relationship:'+this.currentDay+':'+relation.value);}
    const feedback={reputationDelta:rep.delta,relationshipDelta:relation.delta};
    this.reviews.push({...(t.source==='app'?{source:t.source,quantity:t.quantity,deliveryFee:outcome==='delivered'?(this.courier?.mode==='shipper'?DELIVERY_RULES.fee:0):0}:{}),name:t.name,avatarIndex:t.avatarIndex,stars,reasons:[...reasons],outcome,...feedback});return feedback;
  }
  private rejectPrice():boolean {
    const delta=this.priceRejections<3?Math.max(0,this.reputation-1)-this.reputation:0;
    if(this.priceRejections<3){this.priceRejections++;this.reputation+=delta;}
    return this.shopFeedback('Khách từ chối giá vượt mức chấp nhận · Uy tín '+delta+' (tối đa 3 lần/ngày).');
  }
  private createTicket(kind:CustomerKind,name:string,recipe:StockRecipe,finalPrice:number,arrivalId:string,takeaway:boolean,help=false):boolean {
    const profile=CUSTOMER_PROFILES[kind],id='cozy-'+(this.serial+1);
    const eligiblePrice=kind==='bargain'?agreedPrice(finalPrice,profile.discountPercent):finalPrice;
    if(!priceAccepted(eligiblePrice,recipePrice(recipe),profile.maxPricePercent))return this.rejectPrice();
    const busy=new Set([...this.active.values()].map(t=>t.avatarIndex));
    let avatarIndex=kind==='regular'?this.customerDecisions.accepted.find(index=>!busy.has(index)&&!this.customerDecisions.declined.includes(index)):undefined;
    if(avatarIndex===undefined)avatarIndex=Array.from({length:150},(_,i)=>(this.serial*37+i)%150).find(index=>!busy.has(index)&&!this.customerDecisions.declined.includes(index));
    if(avatarIndex===undefined)return this.shopFeedback('Không có khách mới phù hợp.');
    if(!help)name=customerProfile(avatarIndex).name;
    this.serial++;
    const t:Ticket={source:'shop',quantity:1,packed:[],avatarIndex,id,name,recipe,kind,help,takeaway,finalPrice,patience:profile.patience,extraPenalty:profile.extraPenalty,deadline:this.elapsed+profile.patience,committed:false,order:new CozyOrder(false,recipe,true,this.ovenUpgrade)};
    this.active.set(id,t);
    if(!this.active.has(this.ticket)){this.ticket=id;this.order=t.order;}
    if(this.phase==='delivered')this.phase='making';
    this.event('arrived:'+arrivalId+':'+id);this.message=name+' · '+profile.label+': đã đặt món.';this.revision++;return true;
  }
  resolveBargain(accept:boolean):boolean {
    if(typeof accept!=='boolean'||!this.bargain||this.blocked('bargain'))return false;
    const pending=this.bargain,target=this.active.get(pending.targetId);
    if(!target)return false;
    target.bargainDecision=accept?'accepted':'declined';
    target.finalPrice=accept?pending.finalPrice:pending.originalPrice;
    const list=accept?this.customerDecisions.accepted:this.customerDecisions.declined;
    const other=accept?'declined':'accepted';this.customerDecisions[other]=this.customerDecisions[other].filter(index=>index!==target.avatarIndex);
    if(!list.includes(target.avatarIndex))list.push(target.avatarIndex);
    this.bargain=null;this.bargainLease?.release();this.bargainLease=null;
    const accepted=this.deliver(pending.sourceId,pending.targetId,pending.commandId,true);
    this.revision++;return accepted;
  }
  private energy = 80;
  private processedArrivals = new Set<string>();
  private ovenId: string | null = null;
  private discardId: string | null = null;
  private shiftOpen = false;
  private arrival = 0;
  private history: string[] = [];
  private completed: { name: string; recipe: StockRecipe; price: number } | null = null;
  private readonly practice = new CozyOrder(true);
  private step: CozyTutorialStep | null;
  private readonly reasons = new Set<CozyPause>();
  private readonly leases = new Map<CozyPause,Set<symbol>>();
  private readonly legacyLeases = new Map<CozyPause,PauseLease>();
  private accumulator = 0;
  private pauseVersion = 0;
  constructor(tutorial = false, private readonly production = false,private readonly scheduleDependencies:CozyScheduleDependencies={}) {
    this.step = tutorial ? 'dough' : null;
    if (tutorial) this.pause('tutorial');
  }
  get state() { return this.tutorialActive ? this.practice.state : this.commercialState; }
  get commercialState() { return this.production ? { ...this.order.state, cash: this.stock.cash, reputation:this.reputation, energy:this.energy } : this.order.state; }
  get productionActive() { return this.production && !this.tutorialActive; }
  get shopOpen() { return this.shiftOpen; }
  get simulationActive():boolean {return this.tutorialActive?this.step==='warming':this.production?this.shiftOpen&&this.phase!=='preparation'&&this.phase!=='summary'&&(this.shiftClock.phase!=='awaiting-close'||this.expressPending.size>0||this.courier?.phase==='travel'||this.courier?.phase==='return'):this.state.stage==='baking';}
  get shopPhase() { return this.phase; }
  get postTutorialPreparation() {return this.guidedPreparation&&this.productionActive&&this.phase==='preparation'&&!this.shiftOpen&&this.currentDay===1;}
  get day() {return this.currentDay;}
  /** Story 4.2 supplies all enabled unlocked recipes at this boundary. */
  eligibleMenuRecipes():readonly StockRecipe[]{return this.menuFor(this.currentDay);}
  get shiftClock(){
    const duration=this.schedule?.duration??[180,210,240][Math.min(2,this.currentDay-1)]!,grace=this.schedule?.grace??120;
    const phase=!this.shiftOpen?'preparation':this.elapsed<duration?'serving':this.elapsed<duration+grace?'grace':'awaiting-close';
    return {phase,elapsed:this.elapsed,duration,grace,remaining:Math.max(0,(phase==='grace'?duration+grace:duration)-this.elapsed),attempted:this.processedArrivals.size,total:this.schedule?.slots.length??0};
  }
  get daySummary():CozyDaySummary|null {return this.summary?structuredClone(this.summary):null;}
  get preparationDay() {return this.canPrepareNextDay?this.currentDay+1:this.currentDay;}
  price(id:StockIngredient) {return this.stock.purchasePrice(id,this.preparationDay);}
  get supplier(){return this.stock.supplier(this.preparationDay);}
  purchaseExpiry(id:StockIngredient) {return ingredientExpiry(id,this.preparationDay);}
  get canCloseDay() {return this.productionActive&&this.shiftOpen&&this.phase!=='summary'&&!this.expressPending.size&&this.courier?.phase!=='travel'&&this.courier?.phase!=='return'&&!this.blocked('user');}
  get canPrepareNextDay() {return this.saveGuard()&&this.phase==='summary'&&!!this.summary&&!this.summary.ending;}
  get canOpenNextDay() {return this.canPrepareNextDay&&!this.reasons.size;}
  closeDay():boolean {return this.clockAction(()=>this.closeDayNow());}
  private closeDayNow():boolean {
    if(!this.canCloseDay||this.closedDays.has(this.currentDay))return false;
    for(const t of this.active.values()){this.stock.release(t.id);if(!t.help)this.abandonedCount++;this.terminal(t,1,['Quán đóng cửa trước khi giao món'],'closed');}
    this.applyProgress(this.progress.closeDay(this.currentDay,this.goalStats()));
    const ledger=this.stock.ledger(this.currentDay),settled=this.stock.settle(this.currentDay);
    const accounts=closeAccounts({startingCash:this.startingCash,openingInventoryValue:this.openingInventoryValue,sales:this.revenue,rewards:this.rewardCash,purchases:ledger.purchases,consumed:ledger.consumed,giftCost:this.dailyGiftCost,capitalPurchases:this.capitalPurchases,deliveryFees:this.deliveryFees,...settled,inventory:this.stock.inventorySnapshot(),previousProfit:this.cumulativeProfit});
    this.cumulativeProfit=accounts.cumulativeProfit;
    const viability=cozyViability(this.stock.cash,this.currentDay+1,STOCK_RECIPES.filter(recipe=>this.recipeOwnership.has(recipe)),id=>this.stock.available(id,this.currentDay+1),id=>this.stock.purchasePrice(id,this.currentDay+1));
    if(this.currentDay===2&&!this.referral)this.referral=referralEligibility(this.reputation);
    this.summary={pizzasSold:this.pizzasSold,deliveryFees:this.deliveryFees,event:this.shiftEvent!.id,appEnabled:this.shiftApp,ownedRecipes:this.ownedRecipes,progression:this.progress.snapshot,goal:this.progress.goal(this.currentDay),rewards:this.rewardCash,accounts,reputation:this.reputation,relationship:this.relationship,referral:this.referral?{...this.referral}:null,day:this.currentDay,revenue:this.revenue,purchases:ledger.purchases,cost:ledger.consumed,...settled,profit:accounts.profit,delivered:this.deliveredCount,abandoned:this.abandonedCount,rating:this.reviews.length?this.reviews.reduce((sum,r)=>sum+r.stars,0)/this.reviews.length:null,cash:this.stock.cash,reviews:structuredClone(this.reviews),ending:!viability.viable?'insolvent':null,...(viability?{viability}:{})};
    this.summary.salesByRecipe=[...this.salesByRecipe].map(([recipe,sales])=>({recipe,...sales}));
    this.summary.costByIngredient=this.stock.consumedByIngredient(this.currentDay);
    this.reports.push(compactCozyReport(this.summary));
    this.courier=null;this.closedDays.add(this.currentDay);this.shiftOpen=false;this.phase='summary';this.active.clear();this.abandoned.clear();this.ovenId=null;this.ticket='';this.sourceId='';this.pendingDelivery=null;this.discardId=null;this.result=null;this.order=new CozyOrder(false,this.recipe,true,this.ovenUpgrade);this.accumulator=0;
    this.message='Ngày đã chốt. Chuẩn bị cho ngày tiếp theo.';this.revision++;return true;
  }
  openNextDay():boolean {return this.clockAction(()=>this.openNextDayNow());}
  private openNextDayNow():boolean {
    if(!this.canOpenNextDay)return false;
    this.startingCash=this.summary!.cash;this.openingInventoryValue=this.summary!.accounts.inventory.value;
    this.currentDay++;this.deliveryFees=0;this.pizzasSold=0;this.deliveryTime=0;this.courier=null;this.shiftEvent=null;this.rewardCash=0;this.dailyGiftCost=0;this.priceRejections=0;this.summary=null;this.reviews=[];this.revenue=0;this.deliveredCount=0;this.abandonedCount=0;this.elapsed=0;this.arrival=0;this.schedule=null;this.processedArrivals.clear();this.completed=null;this.result=null;this.phase='preparation';this.accumulator=0;
    this.salesByRecipe.clear();
    return this.openShop();
  }
  get selectedRecipe() { return this.phase === 'preparation' ? this.recipe : this.active.get(this.ticket)?.recipe ?? (this.phase === 'delivered' ? this.completed?.recipe : null) ?? this.recipe; }
  get lastDelivery() { return this.completed ? { ...this.completed } : null; }
  get lastResult() { return this.result ? {...this.result,reasons:[...this.result.reasons]} : null; }
  get deliveryPending() { return this.pendingDelivery ? {...this.pendingDelivery,reasons:[...this.pendingDelivery.reasons]} : null; }
  get deliverySource() { const t=this.active.get(this.sourceId); return t && ['raw','ready','boxed','burnt'].includes(t.order.state.stage) ? {id:t.id,name:t.name,recipe:t.recipe,stage:t.order.state.stage} : null; }
  get selectedExpired() { return this.abandoned.has(this.ticket); }
  get abandonedPizzas() { return [...this.abandoned.values()].map(t=>({id:t.id,name:t.name})); }
  get shopRevision() { return this.revision; }
  get shopMessage() { return this.message; }
  missingRecipeReason(recipe:StockRecipe) { const missing = this.stock.missing(recipe,this.preparationDay); return missing.length ? `Còn thiếu: ${missing.map(id => `${ingredientName(id)} ×1`).join(', ')}.` : ''; }
  get missingReason() {return this.missingRecipeReason(this.recipe);}
  get stockLots() { return this.stock.lots; }
  get canOpen() { return this.saveGuard()&&this.productionActive && this.phase === 'preparation' && this.active.size < this.queueCapacity; }
  get bakeReady() { return (this.tutorialActive ? this.practice : this.order).bakeReady && !this.needsRemake; }
  get tickets() { return [...this.active.values()].map(t => ({ source:t.source,quantity:t.quantity,packed:t.packed.length,booked:this.courier?.ticketId===t.id,riderState:this.courier?.ticketId===t.id?(this.courier.phase==='waiting'?'waiting':'arrived'):this.shiftStaff?'staff':'none',riderRemaining:this.courier?.ticketId===t.id?this.courier.remaining:0,avatarIndex:t.avatarIndex,id: t.id, name: t.name, recipe: t.recipe, kind: t.kind,help:!!t.help,takeaway:t.takeaway, kindLabel:t.help?'Giúp miễn phí':CUSTOMER_PROFILES[t.kind].label, finalPrice:t.finalPrice, maxPricePercent:CUSTOMER_PROFILES[t.kind].maxPricePercent, patience: t.patience, extraPenalty: t.extraPenalty, remaining: Math.max(0, t.deadline - this.elapsed), stage: t.order.state.stage })); }
  get selectedTicketId() { return this.ticket; }
  get selectedTicket() { return this.tickets.find(t => t.id === this.ticket) ?? null; }
  get ovenOwner() { return this.ovenId; }
  get ovenState() { const s = this.ovenId ? (this.active.get(this.ovenId)??this.abandoned.get(this.ovenId))?.order.state : null; return s ? { ...s, ingredients: [...s.ingredients] } : null; }
  get oven() { const t = this.ovenId ? this.active.get(this.ovenId)??this.abandoned.get(this.ovenId) : null; return t ? { ticketId: t.id, name: t.name, recipe: t.recipe, state: this.ovenState! } : null; }
  get bakeQuality() { const s = this.ovenState ?? this.state; return s.stage === 'burnt' ? 'burned' : s.ovenSeconds < this.bakeTiming.perfectStart ? 'raw' : s.ovenSeconds >= this.bakeTiming.perfectEnd-.5 ? 'warning' : 'ready'; }
  get discardPending() { return this.discardId !== null; }
  get needsRemake() { return !!this.active.get(this.ticket)?.committed && this.order.state.stage === 'assembly'; }
  get events(): readonly string[] { return [...this.history]; }
  available(id: StockIngredient) { return this.stock.available(id,this.preparationDay); }
  owned(id: StockIngredient) { return this.stock.owned(id,this.preparationDay); }
  reserved(id: StockIngredient) { return this.stock.reserved(id,this.preparationDay); }
  private event(action: string) { this.history.push(`${this.elapsed.toFixed(2)}:${action}`);if(this.history.length>200)this.history.splice(0,this.history.length-200); }
  private shopFeedback(message: string): boolean { this.message = message; this.revision++; return false; }
  private blocked(except?: CozyPause) { return !this.saveGuard()||[...this.reasons].some(reason => reason !== except); }
  buy(id: StockIngredient, quantity: number,commandId=`purchase-${++this.purchaseSerial}`): boolean {
    if (!this.saveGuard() || !this.productionActive || this.reasons.size || !(this.phase === 'preparation'||this.canPrepareNextDay)) return false;
    if(this.shiftOpen)return this.shopFeedback('Chỉ mua nguyên liệu trước khi mở cửa. Kho hiện tại chỉ để xem.');
    if(typeof commandId!=='string'||!commandId.trim()||this.purchaseCommands.has(commandId))return false;
    if (!this.stock.buy(id, quantity,this.preparationDay)) return this.shopFeedback('Số lượng không hợp lệ hoặc không đủ tiền.');
    this.purchaseCommands.add(commandId);
    this.message = `Đã mua ${quantity} ${ingredientName(id)}.`; this.revision++; return true;
  }
  orderExpress(id:StockIngredient,quantity:number,commandId:string):boolean {
    if(!this.saveGuard()||!this.productionActive||!this.shiftOpen||this.phase==='summary'||this.blocked('order')||this.shiftClock.phase==='awaiting-close')return false;
    if(typeof commandId!=='string'||!commandId.trim()||this.purchaseCommands.has(commandId))return false;
    const receipt=this.stock.orderExpress(commandId,id,quantity,this.currentDay);
    if(!receipt)return this.shopFeedback('Không đủ tiền hoặc số lượng đặt hỏa tốc không hợp lệ.');
    this.purchaseCommands.add(commandId);
    this.expressPending.set(commandId,{id:commandId,ingredient:id,quantity,unitPrice:receipt.unitCost,remaining:5,duration:5});
    this.message=`Đang giao ${ingredientName(id)} ×${quantity}; nhận sau 5 giây.`;this.revision++;return true;
  }
  upgradeShop(kind:'oven'|'queue',commandId:string):boolean {
    if(!['oven','queue'].includes(kind)||!this.canSetPrices||typeof commandId!=='string'||!commandId.trim()||this.upgradeCommands.has(commandId))return false;
    const cost=this.upgradePrice(kind);if(cost===null||!this.stock.debit(cost))return this.shopFeedback('Không đủ tiền hoặc đã nâng cấp tối đa.');
    if(kind==='oven')this.ovenUpgrade=(this.ovenUpgrade+1) as 1|2;else this.queueUpgrade=1;
    this.upgradeSpent+=cost;this.pendingUpgradeSpent+=cost;
    this.upgradeCommands.add(commandId);this.revision++;return true;
  }
  selectRecipe(recipe: StockRecipe): boolean {
    if (!this.saveGuard() || !this.productionActive || this.reasons.size || !(this.phase === 'preparation'||this.canPrepareNextDay) || !this.menuRecipes.includes(recipe)) return false;
    this.recipe = recipe;
    if (!this.active.size) this.order = new CozyOrder(false,recipe,true,this.ovenUpgrade);
    this.message = this.missingReason || 'Đủ nguyên liệu cho món đã chọn.'; this.revision++; return true;
  }
  openShop():boolean {return this.clockAction(()=>this.openShopNow());}
  private openShopNow():boolean {
    if (!this.saveGuard() || !this.productionActive || this.reasons.size || this.phase !== 'preparation') return false;
    if (this.shiftOpen) return this.returnToOrders();
    if (!this.canOpen) return this.shopFeedback(this.missingReason);
    this.schedule=validateCozySchedule((this.scheduleDependencies.schedule??threeDaySchedule)(this.currentDay,{regularDay1Stars:this.regularDay1Stars,regularLatestStars:this.regularLatestStars,helpSucceeded:this.help.outcome==='succeeded',referral:this.currentDay>=4?this.reputation>=55:!!this.referral?.eligible}));
    this.shiftEvent=deliveryEvent(this.currentDay);this.shiftStaff=!!this.scheduleDependencies.deliveryStaffAvailable?.();this.shiftApp=this.appEnabled&&this.currentDay>=5;if(!this.scheduleDependencies.schedule)this.schedule=deliverySchedule(this.schedule,this.shiftApp);
    this.shiftOpen = true; this.phase = 'making';
    this.capitalPurchases=this.pendingUpgradeSpent+this.pendingRecipeSpent;this.pendingUpgradeSpent=0;this.pendingRecipeSpent=0;
    const first=this.schedule.slots[0];if(first?.at===0)this.processArrival(first.id);
    this.revision++; return true;
  }
  /** Atomic scheduled arrival. A failed slot is consumed rather than queued for retry. */
  processArrival(arrivalId: string): boolean {
    const slot=this.schedule?.slots[this.arrival];
    if (!this.saveGuard() || !this.productionActive || !this.shiftOpen || !['making','delivered'].includes(this.phase) || this.reasons.size || !slot||arrivalId!==slot.id||this.processedArrivals.has(arrivalId)||this.elapsed<slot.at||this.elapsed>=this.schedule!.duration) return false;
    this.processedArrivals.add(arrivalId);this.arrival++;
    if(slot.opportunity==='help'){
      if(this.help.decision!=='unseen'||this.help.offer)return false;
      this.help.offer={arrivalId,name:'Linh'};this.helpLease=this.acquirePause('help');this.event('help-offered:'+arrivalId);this.revision++;return true;
    }
    if(this.currentDay===3&&slot.kind==='regular'&&this.relationship>=2&&!this.help.claims.includes('regular.thanks-day-3')){
      this.help.claims.push('regular.thanks-day-3');this.stock.receive(20);this.rewardCash+=20;this.help.thanksPending=true;this.helpLease=this.acquirePause('help');this.event('reward:regular.thanks-day-3');this.revision++;
    }
    if(this.active.size>=this.queueCapacity)return this.shopFeedback('Hàng chờ đã đủ '+this.queueCapacity+' đơn.');
    const kind=slot.kind,name=slot.opportunity==='referral'?'Khách giới thiệu':({regular:'Linh',hurry:'Minh',picky:'Lan',bargain:'Hùng'} as const)[kind];
    const recipe=this.scheduleDependencies.resolveRecipe?this.scheduleDependencies.resolveRecipe(slot,this.eligibleMenuRecipes(),this.recipe):resolveScheduleRecipe(slot,this.eligibleMenuRecipes());
    if(!recipe)return this.shopFeedback('Khách chưa thể đặt món. Món yêu cầu chưa có trong thực đơn.');
    const originalPrice=menuPrice(recipePrice(recipe),this.pricing[recipe])!;
    const accepted=this.createTicket(kind,name,recipe,originalPrice,arrivalId,slot.takeaway);
    const deliverySlot=slot as DeliveryScheduleSlot;if(accepted&&deliverySlot.source==='app'&&this.shiftApp){const t=this.active.get('cozy-'+this.serial)!;t.source='app';t.quantity=deliverySlot.quantity??1;t.takeaway=true;t.patience=DELIVERY_RULES.deadline;t.deadline=this.elapsed+t.patience;t.kind='hurry';t.extraPenalty=0;t.name='App '+t.id;}
    return accepted;
  }

  prepareAgain():boolean {return this.clockAction(()=>this.prepareAgainNow());}
  private prepareAgainNow(): boolean {
    if (!this.saveGuard() || !this.productionActive || this.reasons.size || this.phase !== 'making') return false;
    this.phase = 'preparation'; this.message = 'Mua thêm nguyên liệu cho đơn tiếp theo.'; this.revision++; return true;
  }
  returnToOrders():boolean {return this.clockAction(()=>this.returnToOrdersNow());}
  private returnToOrdersNow():boolean {
    if (!this.saveGuard() || !this.productionActive || this.reasons.size || this.phase !== 'preparation' || !this.shiftOpen) return false;
    this.phase = 'making'; this.revision++; return true;
  }
  continueShift():boolean {return this.clockAction(()=>this.continueShiftNow());}
  private continueShiftNow():boolean {
    if (!this.saveGuard() || !this.productionActive || this.reasons.size || this.phase !== 'delivered') return false;
    this.phase = 'making'; this.ticket = ''; this.order = new CozyOrder(false,this.recipe,true,this.ovenUpgrade);
    this.message = 'Ca tiếp tục. Khách tiếp theo sắp đến.'; this.revision++; return true;
  }
  selectTicket(id: string): boolean {
    if (!this.saveGuard() || !this.productionActive || this.reasons.size) return false;
    const t = this.active.get(id); if (!t) return false;
    this.ticket = id; this.order = t.order;
    if(['raw','ready','boxed','burnt'].includes(t.order.state.stage))this.sourceId=id;
    this.phase = 'making'; this.revision++; return true;
  }
  selectPizza(id:string): boolean {
    if (!this.saveGuard()||this.reasons.size) return false;
    const t=this.active.get(id)??this.abandoned.get(id); if(!t)return false;
    this.ticket=id;this.order=t.order;this.sourceId=id;this.revision++;return true;
  }
  private deliver(sourceId:string,targetId:string,commandId:string,confirmed=false):boolean {
    if(this.deliveredCommands.has(commandId))return false;
    const source=this.active.get(sourceId),target=this.active.get(targetId);
    if(!source||!target||target.deadline<=this.elapsed||!['raw','ready','boxed','burnt'].includes(source.order.state.stage))return this.shopFeedback('Khách đã rời đi hoặc bánh chưa sẵn sàng. Không thể giao.');
    if(source.source!==target.source||source.source==='app'&&sourceId!==targetId)return false;
    if(target.source==='app')return this.packApp(target,commandId,confirmed);
    const s=source.order.state;
    const helpSuccess=!['raw','burnt'].includes(s.stage);
    const result=deliveryResult({expected:recipeIngredients(target.recipe),actual:s.ingredients,takeaway:target.takeaway,boxed:s.stage==='boxed',quality:s.stage==='raw'?'raw':s.stage==='burnt'?'burnt':'good',remaining:target.deadline-this.elapsed,patience:target.patience,extraPenalty:target.extraPenalty});
    if(result.mismatch&&!confirmed){this.pendingDelivery={sourceId,targetId,commandId,name:target.name,recipe:target.recipe,reasons:result.reasons};this.pause('delivery');this.revision++;return true;}
    if(target.kind==='bargain'&&!target.bargainDecision){
      const profile=CUSTOMER_PROFILES.bargain;
      this.bargain={sourceId,targetId,commandId,arrivalId:target.id,name:target.name,recipe:target.recipe,takeaway:target.takeaway,originalPrice:target.finalPrice,finalPrice:agreedPrice(target.finalPrice,profile.discountPercent),patience:target.patience,maxPricePercent:profile.maxPricePercent,discountPercent:profile.discountPercent};
      this.bargainLease=this.acquirePause('bargain');this.revision++;return true;
    }
    if(target.bargainDecision==='declined'){result.stars=Math.min(result.stars,2);result.reasons.push('Khách không được giảm giá và sẽ không quay lại');}
    if(!source.order.dispatch({type:'deliver'}))return false;
    if(!target.help&&source.giftBooked){const soldCost=source.bakedCost??0;this.dailyGiftCost-=soldCost;this.help.giftCost-=soldCost;source.giftBooked=false;}
    if(target.help&&!source.giftBooked){const gift=source.bakedCost??0;this.dailyGiftCost+=gift;this.help.giftCost+=gift;source.giftBooked=true;}
    if(this.ovenId===sourceId)this.ovenId=null;
    const price=target.help?0:target.finalPrice;
    this.deliveredCommands.add(commandId);this.stock.receive(price);this.stock.release(targetId);
    if(!target.help){
      this.revenue+=price;this.deliveredCount++;this.pizzasSold++;
      const sales=this.salesByRecipe.get(target.recipe)??{quantity:0,revenue:0};
      this.salesByRecipe.set(target.recipe,{quantity:sales.quantity+1,revenue:sales.revenue+price});
    }
    const feedback=target.help?this.resolveHelpOutcome(target,!result.mismatch&&helpSuccess):this.terminal(target,result.stars,result.reasons,'delivered');
    const progress=this.progress.recordDelivery({id:target.id,day:this.currentDay,stars:result.stars,qualifyingCheese:target.recipe==='cheese'&&source.recipe==='cheese'&&s.ingredients.length===3&&recipeIngredients('cheese').every(id=>s.ingredients.includes(id)),commercial:!target.help});
    const rewardReputation=this.applyProgress(progress);
    if(sourceId!==targetId&&target.committed&&target.order.state.stage!=='assembly')this.abandoned.set(targetId,target);
    this.active.delete(targetId);
    this.energy-=5;
    this.result={targetId,name:target.name,recipe:target.recipe,help:!!target.help,price,stars:result.stars,reasons:result.reasons,outcome:'delivered',...feedback,xpDelta:progress.xp,rewardCoins:progress.coins,rewardReputation};
    this.completed={name:target.name,recipe:target.recipe,price};
    if(sourceId!==targetId)source.order=new CozyOrder(false,source.recipe,true,this.ovenUpgrade);
    this.order=source.order;this.ticket='';this.sourceId='';
    this.phase=this.active.size?'making':'delivered';
    const next=[...this.active.values()].find(t=>t.order.state.stage!=='delivered');
    if(next){this.ticket=next.id;this.order=next.order;}
    this.message=target.help?`Món tặng Linh · ${this.help.outcome==='succeeded'?'Giúp thành công':'Giúp chưa đạt'} · Quan hệ ${feedback.relationshipDelta>0?'+':''}${feedback.relationshipDelta} · Không doanh thu/XP/đánh giá thương mại.`:`Đã giao ${target.name}: ${result.stars} sao · +${price} xu${result.reasons.length?' · '+result.reasons.join(', '):''}`;
    this.event(`delivered:${targetId}`);this.revision++;return true;
  }
  private packApp(t:Ticket,commandId:string,confirmed:boolean):boolean {
    if(t.order.state.stage!=='boxed')return this.shopFeedback('Đơn app cần đóng hộp trước khi giao.');
    if(t.packed.length<t.quantity){
      const s=t.order.state;
      const check=deliveryResult({expected:recipeIngredients(t.recipe),actual:s.ingredients,takeaway:true,boxed:true,quality:'good',remaining:90,patience:90,extraPenalty:0});
      if(check.mismatch&&!confirmed){this.pendingDelivery={sourceId:t.id,targetId:t.id,commandId,name:t.name,recipe:t.recipe,reasons:check.reasons};this.pause('delivery');this.revision++;return true;}
      t.packed.push({stars:check.stars,reasons:check.reasons,correct:!check.mismatch});this.deliveredCommands.add(commandId);
      if(t.packed.length<t.quantity){
        t.order=new CozyOrder(false,t.recipe,true,this.ovenUpgrade);t.committed=false;t.bakedCost=0;this.order=t.order;this.ticket=t.id;this.sourceId=t.id;
        this.message=`Đã đóng ${t.packed.length}/${t.quantity} bánh.`;this.revision++;return true;
      }
    }
    const staff=this.shiftStaff&&this.courier?.ticketId!==t.id;
    if(staff&&this.courier){this.message='Đã đủ hộp; nhân viên giao đang bận.';this.revision++;return true;}
    if(!staff&&(this.courier?.ticketId!==t.id||this.courier.phase!=='arrived')){this.message='Đã đủ hộp; đợi shipper tới rồi bấm Giao.';this.revision++;return true;}
    this.deliveredCommands.add(commandId);
    this.courier={mode:staff?'staff':'shipper',phase:'travel',ticketId:t.id,ticket:t,remaining:deliveryTiming(this.shiftEvent!.id).travelSeconds,launchedAt:this.deliveryTime};
    this.active.delete(t.id);this.stock.release(t.id);this.ticket='';this.sourceId='';
    const next=this.active.values().next().value as Ticket|undefined;if(next){this.ticket=next.id;this.order=next.order;}else this.order=new CozyOrder(false,this.recipe,true,this.ovenUpgrade);
    this.phase='making';this.message='Đơn app đang giao.';this.event('app-sent:'+t.id);this.revision++;this.tickCourier(0);return true;
  }
  private tickCourier(seconds:number):void {
    const c=this.courier;if(!c||c.phase==='arrived')return;
    c.remaining=Math.max(0,Math.round((c.remaining-seconds)*1e6)/1e6);if(c.remaining)return;
    if(c.phase==='waiting'){c.phase='arrived';this.revision++;return;}
    if(c.phase==='return'){this.courier=null;this.revision++;return;}
    const t=c.ticket!,fee=c.mode==='shipper'?DELIVERY_RULES.fee:0,price=t.finalPrice*t.quantity;
    const reasons=[...new Set(t.packed.flatMap(part=>part.reasons))];let stars=Math.min(...t.packed.map(part=>part.stars));
    if(this.deliveryTime>t.deadline){stars=Math.max(1,stars-2);reasons.push('Giao app trễ hạn');}
    this.stock.receive(price-fee);this.deliveryFees+=fee;this.revenue+=price;this.deliveredCount++;this.pizzasSold+=t.quantity;
    const sales=this.salesByRecipe.get(t.recipe)??{quantity:0,revenue:0};this.salesByRecipe.set(t.recipe,{quantity:sales.quantity+t.quantity,revenue:sales.revenue+price});
    const feedback=this.terminal(t,stars,reasons,'delivered');
    const progress=this.progress.recordDelivery({id:t.id,day:this.currentDay,stars,qualifyingCheese:t.recipe==='cheese'&&t.packed.every(part=>part.correct),commercial:true});const rewardReputation=this.applyProgress(progress);
    this.result={targetId:t.id,name:t.name,recipe:t.recipe,price,stars,reasons,outcome:'delivered',...feedback,xpDelta:progress.xp,rewardCoins:progress.coins,rewardReputation};
    this.completed={name:t.name,recipe:t.recipe,price};this.message=`Đã giao app: ${stars} sao · +${price-fee} xu`;this.event('app-arrived:'+t.id);this.revision++;
    if(c.mode==='staff'){c.phase='return';c.remaining=deliveryTiming(this.shiftEvent!.id).returnSeconds;delete c.ticket;}else this.courier=null;
  }
  cancelDelivery():boolean {if(!this.pendingDelivery||this.blocked('delivery'))return false;this.pendingDelivery=null;this.resume('delivery');this.revision++;return true;}
  confirmDelivery():boolean {
    if(!this.pendingDelivery||this.blocked('delivery'))return false;
    const pending=this.pendingDelivery;
    const accepted=this.deliver(pending.sourceId,pending.targetId,pending.commandId,true);
    this.pendingDelivery=null;this.resume('delivery');this.revision++;return accepted;
  }
  requestDiscard(): boolean {
    const selected=this.active.get(this.ticket);if(selected?.source==='app'&&selected.packed.length===selected.quantity)return false;
    if (!this.saveGuard() || !this.productionActive || this.reasons.size || !(this.active.has(this.ticket)||this.abandoned.has(this.ticket)) || !(['raw', 'ready', 'burnt','boxed'].includes(this.order.state.stage)||this.selectedExpired&&this.order.state.stage==='baking')) return false;
    this.discardId = this.ticket; this.pause('discard'); this.revision++; return true;
  }
  cancelDiscard(): boolean {
    if (!this.discardId || this.blocked('discard')) return false;
    this.discardId = null; this.resume('discard'); this.revision++; return true;
  }
  confirmDiscard(): boolean {
    if (!this.discardId || this.blocked('discard')) return false;
    const id = this.discardId, t = this.active.get(id)??this.abandoned.get(id);
    if (!t) return false;
    if(t.order.state.stage==='boxed'||this.abandoned.has(id)&&t.order.state.stage==='baking')t.order=new CozyOrder(false,t.recipe,true,this.ovenUpgrade);
    else if(!t.order.dispatch({ type: 'discard' }))return false;
    if(this.ticket===id)this.order=t.order;
    this.abandoned.delete(id);if(this.sourceId===id)this.sourceId='';
    if (this.ovenId === id) this.ovenId = null;
    this.discardId = null; this.resume('discard'); this.event(`discarded:${id}`);
    this.message = 'Bánh đã bỏ, không hoàn nguyên liệu. Giữ nguyên liệu mới để làm lại.'; this.revision++; return true;
  }
  remake(): boolean {
    if (!this.saveGuard() || !this.productionActive || this.reasons.size || !this.needsRemake) return false;
    const t = this.active.get(this.ticket)!;
    if (t.deadline <= this.elapsed) return this.shopFeedback('Đơn đã hết thời gian, không thể làm lại.');
    t.committed = false; this.message = `Làm bánh mới cho ${t.name}.`; this.event(`remake:${t.id}`); this.revision++; return true;
  }
  get tutorialActive() { return this.step !== null; }
  get tutorialStep() { return this.step; }
  get expectedControl(): string | null { return this.step === 'complete' ? 'start-shift' : this.step === 'warming' ? null : this.step; }
  get pauseRevision() { return this.pauseVersion; }
  private readonly timeBoundaryListeners=new Set<(phase:'before'|'after')=>void>();
  subscribeTimeBoundary(listener:(phase:'before'|'after')=>void):()=>void {this.timeBoundaryListeners.add(listener);return ()=>this.timeBoundaryListeners.delete(listener);}
  private clockAction<T>(action:()=>T):T {this.timeBoundary("before");try{return action();}finally{this.timeBoundary("after");}}
  private timeBoundary(phase:'before'|'after'):void {for(const listener of this.timeBoundaryListeners)listener(phase);}
  get pauses(): readonly CozyPause[] { return [...this.reasons]; }
  acquirePause(reason:CozyPause):PauseLease {
    this.timeBoundary('before');
    const token=Symbol(reason),owners=this.leases.get(reason)??new Set<symbol>();
    owners.add(token);this.leases.set(reason,owners);
    if(!this.reasons.has(reason)){this.reasons.add(reason);this.pauseVersion++;}
    this.accumulator=0;
    this.timeBoundary('after');
    let released=false;
    return {release:()=>{
      if(released)return;this.timeBoundary('before');released=true;owners.delete(token);
      if(!owners.size){this.leases.delete(reason);this.reasons.delete(reason);this.pauseVersion++;}
      this.accumulator=0;
      this.timeBoundary('after');
    }};
  }
  pause(reason: CozyPause): void {
    if(!this.legacyLeases.has(reason))this.legacyLeases.set(reason,this.acquirePause(reason));
    this.accumulator=0;
  }
  resume(reason: CozyPause): void {
    if (reason === 'tutorial' && this.tutorialActive || reason === 'discard' && this.discardId) return;
    this.legacyLeases.get(reason)?.release();this.legacyLeases.delete(reason);this.accumulator=0;
  }
  private otherPaused(): boolean { return [...this.reasons].some(reason => reason !== 'tutorial'); }
  private setStep(step: CozyTutorialStep): void {
    this.step = step; this.pauseVersion++; this.accumulator = 0;
    if (step === 'warming') {this.legacyLeases.get('tutorial')?.release();this.legacyLeases.delete('tutorial');} else this.pause('tutorial');
  }
  dispatch(intent:CozyRuntimeIntent):boolean {return this.clockAction(()=>this.dispatchIntent(intent));}
  private dispatchIntent(intent: CozyRuntimeIntent): boolean {
    if(!this.saveGuard()||this.guarded&&intent.type==='reset')return false;
    if(intent.type==='menu.configure')return this.configureMenu(intent.recipe,intent.percent,intent.enabled);
    if(intent.type==='express.order')return this.orderExpress(intent.ingredient,intent.quantity,intent.commandId);
    if(intent.type==='shop.upgrade')return this.upgradeShop(intent.kind,intent.commandId);
    if(intent.type==='market.buy')return this.buy(intent.ingredient,intent.quantity,intent.commandId);
    if(intent.type==='customer.price')return this.setMenuPrice(intent.recipe,intent.percent);
    if(intent.type==='customer.bargain')return this.resolveBargain(intent.accept);
    if(intent.type==='customer.help')return this.resolveHelp(intent.accept);
    if(intent.type==='customer.thanks')return this.dismissThanks();
    if (!this.tutorialActive) {
      if (this.reasons.size) return false;
      if (!this.production) return this.order.dispatch(intent);
      if (intent.type === 'reset') {
        if(this.closedDays.size)return false;
        this.appEnabled=false;this.appCommands.clear();this.bookingCommands.clear();this.shiftEvent=null;this.shiftApp=false;this.shiftStaff=false;this.deliveryFees=0;this.pizzasSold=0;this.deliveryTime=0;this.courier=null;this.recipeOwnership=new Set(['cheese','mushroom']);this.recipeSpent=0;this.pendingRecipeSpent=0;this.purchasedRecipes=[];this.grantedRecipes=[];this.recipeCommands.clear();this.ovenUpgrade=0;this.queueUpgrade=0;this.upgradeSpent=0;this.pendingUpgradeSpent=0;this.capitalPurchases=0;this.upgradeCommands.clear();this.customerDecisions={accepted:[],declined:[]};this.expressPending.clear();
        this.stock = new CozyStock();this.progress=new CozyProgression();this.rewardCash=0;this.dailyGiftCost=0;this.help={decision:'unseen',outcome:null,ticketId:null,offer:null,giftCost:0,claims:[],thanksPending:false};this.enabledMenu=new Set(['cheese','mushroom']);this.startingCash=300;this.openingInventoryValue=0;this.cumulativeProfit=0; this.purchaseCommands.clear();this.purchaseSerial=0;this.order = new CozyOrder(); this.recipe = 'cheese'; this.phase = 'preparation';
        this.active.clear(); this.processedArrivals.clear(); this.ovenId = null; this.discardId = null; this.ticket = ''; this.elapsed = 0; this.serial = 0; this.arrival = 0; this.schedule=null;this.regularDay1Stars=null;this.regularLatestStars=null; this.shiftOpen = false; this.history = [];
        this.completed = null;this.summary=null;this.reports=[];this.currentDay=1;this.revenue=0;this.deliveredCount=0;this.abandonedCount=0;this.reviews=[];
        this.salesByRecipe.clear();
        this.abandoned.clear();this.deliveredCommands.clear();this.pendingDelivery=null;this.sourceId='';this.result=null;this.reputation=50;this.relationship=0;this.relationshipDays.clear();this.priceRejections=0;this.pricing=defaultRecipePercents();this.referral=null;this.energy=80;
        this.message = 'Mua nguyên liệu để bắt đầu ca.'; this.revision++; return true;
      }
      const t = this.active.get(this.ticket);
      if(intent.type==='deliver'&&this.phase==='making'){
        const sourceId=intent.sourceId??(this.sourceId||this.ticket),targetId=intent.targetId??this.ticket,target=this.active.get(targetId);
        const part=target?.source==='app'?`:${target.packed.length===target.quantity?'launch':target.packed.length}`:'';
        return this.deliver(sourceId,targetId,intent.commandId??`deliver:${sourceId}:${targetId}${part}`);
      }
      if(intent.type==='discard')return this.requestDiscard();
      if (this.phase !== 'making' || !t) return false;
      if (intent.type === 'ingredient' && (this.needsRemake || !this.order.state.ingredients.includes(intent.ingredient)&&this.available(intent.ingredient)<1)) return false;
      if (intent.type === 'bake') {
        if(t.source==='app'&&(!this.shiftStaff&&this.courier?.ticketId!==t.id))return this.shopFeedback('Book shipper trước khi nướng đơn app.');
        if(t.source==='app'&&t.packed.length>=t.quantity)return false;
        if (this.ovenId) return this.shopFeedback('Lò đang bận. Lấy hoặc bỏ bánh trong lò trước.');
        if (!this.bakeReady || this.order.state.stage !== 'assembly') return false;
        if(!this.stock.reserveIngredients(t.id,this.order.state.ingredients,t.deadline,this.currentDay))return this.shopFeedback('Không đủ nguyên liệu còn dùng được cho bánh này.');
        const consumedBefore=this.stock.ledger(this.currentDay).consumed;
        if (!this.stock.commit(t.id, this.order.state.ingredients,this.currentDay)) return this.shopFeedback('Nguyên liệu đã hết hoặc đơn đã hết thời gian.');
        t.bakedCost=this.stock.ledger(this.currentDay).consumed-consumedBefore;t.giftBooked=!!t.help;
        if(t.help){this.dailyGiftCost+=t.bakedCost;this.help.giftCost+=t.bakedCost;}
        t.committed = true;
      }
      const accepted = this.order.dispatch(intent); if (!accepted) return false;
      if (intent.type === 'bake') { this.ovenId = t.id; this.sourceId=t.id; this.message = `Đang nướng pizza cho ${t.name}.`; }
      if (intent.type === 'extract' && this.ovenId === t.id) { this.ovenId = null; this.message = this.order.state.feedback; }
      if(intent.type==='extract'||intent.type==='box')this.sourceId=t.id;
      if (intent.type === 'box') this.message = `Pizza đã đóng hộp cho ${t.name}.`;
      this.event(`${intent.type}:${t.id}`); this.revision++; return true;
    }
    if (this.otherPaused() || this.step === 'warming' || this.step === 'complete') return false;
    const matches = intent.type === 'ingredient' ? intent.ingredient === this.step : intent.type === this.step;
    if (!matches || !this.practice.dispatch(intent)) return false;
    this.setStep(steps[steps.indexOf(this.step!) + 1]!); return true;
  }
  startShift():boolean {return this.clockAction(()=>this.startShiftNow());}
  private startShiftNow():boolean {
    if(!this.saveGuard())return false;
    if (this.step !== 'complete' || this.otherPaused()) return false;
    this.step = null; this.guidedPreparation=true; this.resume('tutorial'); this.accumulator = 0; this.pauseVersion++; return true;
  }
  /** Wall-clock catch-up uses bounded steps and stops at the first decision or shift boundary. */
  advanceElapsed(delta:number):void {
    if(!Number.isFinite(delta)||delta<=0)return;
    let remaining=delta;
    while(remaining>0&&this.simulationActive&&!this.reasons.size&&this.saveGuard()){
      const step=Math.min(50,remaining);remaining-=step;this.advance(step);
    }
  }
  advance(delta: number): void {
    if(!this.saveGuard())return;
    if (this.reasons.size || !Number.isFinite(delta) || delta <= 0) return;
    if (this.tutorialActive && this.step !== 'warming') return;
    if (delta > 250) { if ((this.ovenState ?? this.state).stage === 'baking'||this.productionActive&&this.shiftOpen&&this.phase==='making') this.pause('gap'); this.accumulator = 0; return; }
    this.accumulator += delta;
    while (this.accumulator >= 50) {
      this.accumulator -= 50;
      if (this.tutorialActive) {
        this.practice.tick(Math.min(.05, COZY_BAKE.perfectStart - this.state.ovenSeconds));
        if (this.state.ovenSeconds >= COZY_BAKE.perfectStart) { this.setStep('extract'); break; }
      } else if (!this.production) this.order.tick(.05);
      else if (this.shiftOpen && this.phase !== 'preparation' && this.phase !== 'summary') {
        for(const pending of this.expressPending.values()){pending.remaining=Math.max(0,Math.round((pending.remaining-.05)*1e6)/1e6);if(!pending.remaining&&this.stock.receiveExpress(pending.id)){this.expressPending.delete(pending.id);this.event('express-received:'+pending.id);this.revision++;}}
        this.deliveryTime=Math.round((this.deliveryTime+.05)*1e6)/1e6;this.tickCourier(.05);
        const end=this.schedule!.duration+this.schedule!.grace;
        if(this.elapsed>=end)continue;
        this.elapsed = Math.round((this.elapsed + .05) * 1e6) / 1e6;
        if (this.ovenId) (this.active.get(this.ovenId)??this.abandoned.get(this.ovenId))?.order.tick(.05);
        for (const t of [...this.active.values()].filter(t=>t.deadline<=this.elapsed||this.elapsed>=end)) {
          const id=t.id;if(this.courier?.ticketId===id)this.courier=null;this.stock.release(id);
          this.active.delete(id); this.event(`expired:${id}`); this.revision++;
          if(t.committed&&t.order.state.stage!=='assembly')this.abandoned.set(id,t);
          if(id===this.ticket&&!t.committed){this.ticket='';this.order=new CozyOrder(false,this.recipe,true,this.ovenUpgrade);}

          const reason=this.elapsed>=end?'Hết thời gian xử lý cuối ca':'Hết kiên nhẫn';
          if(!t.help)this.abandonedCount++;const feedback=this.terminal(t,1,[reason],'expired');
          this.result={targetId:id,name:t.name,recipe:t.recipe,help:!!t.help,price:0,stars:1,reasons:[reason],outcome:'expired',...feedback};
          this.message = t.help?reason+' · Món giúp chưa hoàn thành. Quan hệ '+feedback.relationshipDelta+'; không phạt uy tín.':t.committed?reason+' · 1 sao. Bỏ bánh còn lại, không hoàn nguyên liệu.':reason+' · 1 sao. Nguyên liệu đã giữ được trả về kho.';
        }
        const next=this.schedule!.slots[this.arrival];
        if (next&&this.elapsed>=next.at&&this.elapsed<this.schedule!.duration) {
          this.processArrival(next.id);
          if(this.reasons.size)break;
        }
      }
    }
  }
}



