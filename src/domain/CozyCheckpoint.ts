import {TEST_CODE_COINS,validTestCodeReceipt,type TestCodeReceipt} from './TestCode';
import {chooseCampaignEvent,validCampaignEventSeed,type CampaignLossEvent} from './CampaignEvents';
import {VIP_RULES} from '../config/vipCustomers';
import {vipQualifies,type VipReceipt} from './VipCustomers';
import {CAMPAIGN_LAST_DAY} from '../config/campaignRules';
import {validateShopCheckpoint,type ShopCheckpoint,type UpgradeReceipt} from './ShopCheckpoint';
import {validateStaffCheckpoint,type StaffCheckpoint,type StaffPayroll} from './StaffCheckpoint';
import {STAFF_RULES} from '../config/staffCatalog';
import {recipeDefinition,defaultRecipePercents} from '../config/recipeCatalog';
import {CozyProgression,type ProgressionSnapshot,type GoalView} from './CozyProgression';
import {validateHelpCheckpoint,type CozyHelpCheckpoint} from './CozyHelp';
import {datedIngredientPrice,expressIngredientPrice,validateStockSnapshot,STOCK_RECIPES,STOCK_INGREDIENTS,type StockIngredient,type StockRecipe,type CozyStockSnapshot} from './CozyStock';
import {closeAccounts,type DayAccounts} from './DayAccounts';
import {referralEligibility} from './CustomerProgression';
import type {CozyViability} from './CozyViability';
import {cozyViability} from './CozyViability';
import {CozyStock} from './CozyStock';
import {deliveryEvent} from '../config/deliveryEvents';
import {OVEN_UPGRADE_PRICES,QUEUE_UPGRADE_PRICE} from '../config/kitchenEconomy';
export interface CozyReview {vip?:VipReceipt;source?:'shop'|'app';quantity?:1|2|3;deliveryFee?:number;avatarIndex?:number;name:string;stars:number;reasons:readonly string[];outcome:'delivered'|'expired'|'closed';reputationDelta:number;relationshipDelta:number}
export interface CozyDaySummary {campaignEvent?:{id:'A';loss:200};payroll?:StaffPayroll;pizzasSold?:number;deliveryFees?:number;event?:'normal'|'rain'|'rush'|'festival';appEnabled?:boolean;progressionArchive?:{outcomeCount:number;claimCount:number};ownedRecipes?:StockRecipe[];salesByRecipe?:{recipe:StockRecipe;quantity:number;revenue:number}[];costByIngredient?:{ingredient:StockIngredient;cost:number}[];progression:ProgressionSnapshot;goal:GoalView;rewards:number;accounts:DayAccounts;day:number;revenue:number;purchases:number;cost:number;expired:number;rent:number;profit:number;delivered:number;abandoned:number;rating:number|null;cash:number;reviews:readonly CozyReview[];ending:'complete'|'insolvent'|null;reputation:number;relationship:number;referral:ReturnType<typeof referralEligibility>|null;viability?:CozyViability}
/** Historical arrays live once in the master progression, with prefix lengths per day. */
export function compactCozyReport(report:CozyDaySummary):CozyDaySummary {
  const copy=structuredClone(report);
  copy.progressionArchive??={outcomeCount:copy.progression.outcomes.length,claimCount:copy.progression.claims.length};
  copy.progression={...copy.progression,outcomes:[],claims:[],goals:[structuredClone(copy.goal)]};
  return copy;
}
export function reportProgression(report:CozyDaySummary,master:ProgressionSnapshot):ProgressionSnapshot {
  if(!report.progressionArchive)return structuredClone(report.progression);
  return {...report.progression,outcomes:master.outcomes.slice(0,report.progressionArchive.outcomeCount),claims:master.claims.slice(0,report.progressionArchive.claimCount),goals:structuredClone(master.goals.slice(0,report.day))};
}
export function expandCozyReport(report:CozyDaySummary,master:ProgressionSnapshot):CozyDaySummary {
  const copy=structuredClone(report);copy.progression=reportProgression(report,master);delete copy.progressionArchive;return copy;
}
export const COZY_SCHEMA_VERSION=2;
export const COZY_CONTENT_VERSION='cozy-open-campaign-2026-10-04'
export const COZY_LEGACY_CONTENT_VERSION='cozy-three-days-2026-10-03';
export type CozyCheckpoint={testCodeReceipt?:TestCodeReceipt;campaignEventSeed?:number;campaignEndDay?:number;staff?:StaffCheckpoint;shop?:ShopCheckpoint;deliveryAppEnabled?:boolean;ownedRecipes:StockRecipe[];recipePurchases:{spent:number;pendingSpent:number;purchased:StockRecipe[];granted?:StockRecipe[]};upgrades:{receipts?:UpgradeReceipt[];ovenLevel:number;queueLevel:number;spent:number;pendingSpent:number};customerMemory:{accepted:number[];declined:number[]};contentId:typeof COZY_CONTENT_VERSION;day:number;terminal:boolean;stock:CozyStockSnapshot;progression:ProgressionSnapshot;help:CozyHelpCheckpoint;menu:StockRecipe[];prices:Record<StockRecipe,number>;recipe:StockRecipe;reports:CozyDaySummary[];cumulativeProfit:number;reputation:number;relationship:number;relationshipDays:number[];regularDay1Stars:number|null;regularLatestStars:number|null;referral:ReturnType<typeof referralEligibility>|null};
const integer=(n:unknown,min=0,max=1000000):n is number=>Number.isSafeInteger(n)&&Number(n)>=min&&Number(n)<=max;
const stars=(n:unknown)=>n===null||integer(n,1,5);
const text=(v:unknown,max=512):v is string=>typeof v==='string'&&v.length<=max;
function summaryValid(s:CozyDaySummary,master:ProgressionSnapshot,previousLoss:number):boolean {
  const event=s?.campaignEvent,eventLoss=event?.loss??0;
  if(event!==undefined&&(!event||event.id!=='A'||event.loss!==200))return false;
  const archive=s?.progressionArchive,p=s?.progression;
  if(archive&&(!p||!integer(archive.outcomeCount,0,master.outcomes.length)||!integer(archive.claimCount,0,master.claims.length)||!integer(p.xp)||!integer(p.cheeseSales,0,archive.outcomeCount)||p.unlockDay!==null&&!integer(p.unlockDay,2,s.day+1)||!['active','completed','expired'].includes(p.mission)||!Array.isArray(p.outcomes)||p.outcomes.length||!Array.isArray(p.claims)||p.claims.length||!Array.isArray(p.goals)||p.goals.length!==1||JSON.stringify(p.goals[0])!==JSON.stringify(master.goals[s.day-1])))return false;
  if(p&&(p.xp<60?p.unlockDay!==null:p.unlockDay!==master.unlockDay||!integer(p.unlockDay,2,s.day+1)))return false;
  if(archive&&p.mission==='expired'&&s.day<3)return false;
  if(!s||!integer(s.day,1,1000000)||!archive&&!CozyProgression.restore(s.progression)||!integer(s.revenue)||!integer(s.purchases)||!integer(s.cost)||!integer(s.expired)||s.rent!==20||!integer(s.rewards)||!integer(s.profit,-1000000)||!integer(s.cash,-20-previousLoss-eventLoss)||!integer(s.delivered,0,30)||!integer(s.abandoned,0,30)||!integer(s.reputation,0,100)||!integer(s.relationship,0,3)||![null,'complete','insolvent'].includes(s.ending))return false;
  if(s.ownedRecipes!==undefined&&(!Array.isArray(s.ownedRecipes)||!s.ownedRecipes.includes('cheese')||!s.ownedRecipes.includes('mushroom')||new Set(s.ownedRecipes).size!==s.ownedRecipes.length||s.ownedRecipes.some(id=>!STOCK_RECIPES.includes(id))))return false;
  if(!Array.isArray(s.reviews)||s.reviews.length>30||s.reviews.some(r=>!r||!text(r.name,80)||(r.avatarIndex!==undefined&&!integer(r.avatarIndex,0,149))||!integer(r.stars,1,5)||!Array.isArray(r.reasons)||r.reasons.length>8||r.reasons.some((reason:unknown)=>!text(reason))||!['delivered','expired','closed'].includes(r.outcome)||!integer(r.reputationDelta,-100,100)||!integer(r.relationshipDelta,-3,3)))return false;
  if(s.reviews.some(r=>{
    const v=r.vip;if(v===undefined)return false;
    if(!v||s.day<VIP_RULES.opensDay||r.source==='app'||typeof v.correct!=='boolean'||typeof v.onTime!=='boolean'||!['good','raw','burnt'].includes(v.quality)||!integer(v.reputation,0,VIP_RULES.reputation))return true;
    const qualified=r.outcome==='delivered'&&vipQualifies(v);
    if(v.coins!==(qualified?VIP_RULES.rewardCoins:0)||!qualified&&v.reputation!==0||v.onTime!==(r.outcome==='delivered'))return true;
    if(r.outcome==='delivered'&&(v.correct===r.reasons.some((reason:string)=>['Sai công thức','Đơn mang đi chưa đóng hộp'].includes(reason))||v.quality==='raw'!==r.reasons.includes('Bánh còn sống')||v.quality==='burnt'!==r.reasons.includes('Bánh bị cháy')))return true;
    return false;
  }))return false;
  const pizzas=s.reviews.filter(r=>r.outcome==='delivered').reduce((n,r)=>n+(r.quantity??1),0),fees=s.reviews.reduce((n,r)=>n+(r.deliveryFee??0),0);
  if(s.reviews.some(r=>r.source!==undefined&&!['shop','app'].includes(r.source)||r.quantity!==undefined&&!integer(r.quantity,1,3)||r.source!=='app'&&(r.quantity??1)!==1||r.deliveryFee!==undefined&&r.deliveryFee!==0&&r.deliveryFee!==5||r.source!=='app'&&(r.deliveryFee??0)!==0||r.outcome!=='delivered'&&(r.deliveryFee??0)!==0||r.source==='app'&&(s.day<5||!s.appEnabled||r.quantity===undefined||r.deliveryFee===undefined)))return false;
  if((s.pizzasSold??s.delivered)!==pizzas||(s.deliveryFees??0)!==fees||s.event!==undefined&&s.event!==deliveryEvent(s.day).id||s.appEnabled!==undefined&&(typeof s.appEnabled!=='boolean'||s.appEnabled&&s.day<5))return false;
  const rating=s.reviews.length?s.reviews.reduce((n,r)=>n+r.stars,0)/s.reviews.length:null;
  if(s.rating!==rating||s.delivered!==s.reviews.filter(r=>r.outcome==='delivered').length||s.abandoned!==s.reviews.filter(r=>r.outcome!=='delivered').length)return false;
  if(s.salesByRecipe!==undefined){
    const rows=s.salesByRecipe;
    if(!Array.isArray(rows)||rows.length>STOCK_RECIPES.length||rows.some(row=>!row||!STOCK_RECIPES.includes(row.recipe)||!integer(row.quantity,1,90)||!integer(row.revenue))||new Set(rows.map(row=>row.recipe)).size!==rows.length||rows.reduce((sum,row)=>sum+row.quantity,0)!==pizzas||rows.reduce((sum,row)=>sum+row.revenue,0)!==s.revenue)return false;
  }
  if(s.costByIngredient!==undefined){
    const rows=s.costByIngredient;
    if(!Array.isArray(rows)||rows.length>STOCK_INGREDIENTS.length||rows.some(row=>!row||!STOCK_INGREDIENTS.includes(row.ingredient)||!integer(row.cost))||new Set(rows.map(row=>row.ingredient)).size!==rows.length||rows.reduce((sum,row)=>sum+row.cost,0)!==s.cost)return false;
  }
  const a=s.accounts;
  if(!a||!integer(a.startingCash,-20-previousLoss)||!integer(a.openingInventoryValue)||!integer(a.cumulativeProfit,-1000000)||a.sales!==s.revenue||a.rewards!==s.rewards||a.purchases!==s.purchases||a.consumed!==s.cost||a.expired!==s.expired||a.rent!==20||a.profit!==s.profit||a.endingCash!==s.cash||s.profit!==s.revenue-s.cost-s.expired-20-fees-eventLoss-a.wages||s.cash!==a.startingCash+(a.supportFunds??0)+s.revenue+s.rewards-s.purchases-20-fees-eventLoss-(a.wagesPaid??a.wages)-(a.capitalPurchases??0)||!integer(a.supportFunds??0,0,TEST_CODE_COINS)||!integer(a.capitalPurchases??0)||!integer(a.wages)||!integer(a.wagesPaid??a.wages)||a.repairs!==0||a.other!==fees+eventLoss||(a.eventLoss??0)!==eventLoss||(a.deliveryFees??0)!==fees||!integer(a.giftCost)||a.giftCost>s.cost)return false;
  if(!a.inventory||!Array.isArray(a.inventory.lots)||a.inventory.lots.length>300)return false;
  const lots=validateStockSnapshot({cash:0,nextLot:1000000000,activeDay:s.day+1,lots:a.inventory.lots,books:[],settlements:[]});
  if(!lots||a.inventory.units!==lots.lots.reduce((n,l)=>n+l.quantity,0)||a.inventory.value!==lots.lots.reduce((n,l)=>n+l.quantity*l.unitCost,0))return false;
  if(a.openingInventoryValue+a.purchases-a.consumed-a.expired!==a.inventory.value)return false;
  if(!a.zeroReasons||Object.values(a.zeroReasons).some(value=>!text(value)))return false;
  const goal=s.progression.goals.find(g=>g.day===s.day);
  if(!goal||JSON.stringify(goal)!==JSON.stringify(s.goal))return false;
  if(goal.stats.delivered!==s.delivered||goal.stats.sales!==s.revenue||JSON.stringify(goal.stats.stars)!==JSON.stringify(s.reviews.map(review=>review.stars)))return false;
  if(s.referral!==null&&s.day===2&&JSON.stringify(s.referral)!==JSON.stringify(referralEligibility(s.reputation)))return false;
  if(s.day===1&&s.referral!==null)return false;
  return true;
}
/** Validate a detached, bounded day boundary before constructing a runtime. */
function validatedCheckpoint(value:unknown):CozyCheckpoint|null {
  if(!value||typeof value!=='object')return null;
  const s=structuredClone(value) as CozyCheckpoint;
  if(s.testCodeReceipt!==undefined&&!validTestCodeReceipt(s.testCodeReceipt,s.day))return null;
  const legacy=(s.contentId as string)===COZY_LEGACY_CONTENT_VERSION;
  if(s.campaignEventSeed!==undefined&&!validCampaignEventSeed(s.campaignEventSeed))return null;
  const campaignEndDay=s.campaignEndDay??Math.max(CAMPAIGN_LAST_DAY,s.day);
  if(!integer(campaignEndDay,CAMPAIGN_LAST_DAY)||s.day>campaignEndDay)return null;
  // Extended limits preserve an already prepared legacy day; they never open extra days.
  if(campaignEndDay>CAMPAIGN_LAST_DAY&&(s.day!==campaignEndDay||!Array.isArray(s.reports)||s.reports.length<CAMPAIGN_LAST_DAY))return null;
  if(s.deliveryAppEnabled!==undefined&&(typeof s.deliveryAppEnabled!=='boolean'||s.deliveryAppEnabled&&s.day<5))return null;
  const ownership=s.ownedRecipes??STOCK_RECIPES.filter(id=>id==='cheese'||id==='mushroom'||id==='sausage'&&CozyProgression.restore(s.progression)?.recipeAvailable(id,s.day));
  const recipePurchases=s.recipePurchases??{spent:0,pendingSpent:0,purchased:[],granted:ownership.filter(id=>id==='sausage')};
  if(!Array.isArray(ownership)||!ownership.includes('cheese')||!ownership.includes('mushroom')||new Set(ownership).size!==ownership.length||ownership.some(id=>!STOCK_RECIPES.includes(id)))return null;
  if(!integer(recipePurchases.spent)||!integer(recipePurchases.pendingSpent,0,recipePurchases.spent)||!Array.isArray(recipePurchases.purchased)||new Set(recipePurchases.purchased).size!==recipePurchases.purchased.length||recipePurchases.purchased.some(id=>!ownership.includes(id)||!STOCK_RECIPES.includes(id)||recipeDefinition(id).purchasePrice===0)||recipePurchases.spent!==recipePurchases.purchased.reduce((n,id)=>n+recipeDefinition(id).purchasePrice,0))return null;
  const granted=recipePurchases.granted??[];if(!Array.isArray(granted)||new Set(granted).size!==granted.length||granted.some(id=>id!=='sausage'||!CozyProgression.restore(s.progression)?.recipeAvailable(id,s.day))||ownership.some(id=>recipeDefinition(id).purchasePrice>0&&!recipePurchases.purchased.includes(id)&&!granted.includes(id)))return null;
  if(!legacy&&(!s.ownedRecipes||!s.recipePurchases))return null;
  if(legacy)s.prices={...defaultRecipePercents(),...s.prices};
  const upgrades=s.upgrades??{ovenLevel:0,queueLevel:0,spent:0,pendingSpent:0},memory=s.customerMemory??{accepted:[],declined:[]};
  if(!integer(upgrades.ovenLevel,0,2)||!integer(upgrades.queueLevel,0,1)||!integer(upgrades.spent)||!integer(upgrades.pendingSpent,0,upgrades.spent))return null;
  // Receipt-less saves belong to the original 150/250/200 economy only.
  const receipts=upgrades.receipts??[...Array.from({length:upgrades.ovenLevel},(_,i)=>({kind:'oven' as const,level:i+1,actualPrice:[150,250][i]})),...(upgrades.queueLevel?[{kind:'queue' as const,level:1,actualPrice:200}]:[])];
  if(!Array.isArray(receipts)||receipts.length!==upgrades.ovenLevel+upgrades.queueLevel||receipts.some(r=>!r||!['oven','queue'].includes(r.kind)||!integer(r.level,1,r.kind==='oven'?upgrades.ovenLevel:upgrades.queueLevel)||!(r.kind==='oven'?[OVEN_UPGRADE_PRICES[r.level-1],[150,250][r.level-1]]:[QUEUE_UPGRADE_PRICE,200]).includes(r.actualPrice))||new Set(receipts.map(r=>r.kind+':'+r.level)).size!==receipts.length||receipts.reduce((n,r)=>n+r.actualPrice,0)!==upgrades.spent)return null;
  upgrades.receipts=receipts;
  const shop=validateShopCheckpoint(s.shop),staff=validateStaffCheckpoint(s.staff,s.day);if(!shop||!staff)return null;
  if(!memory||![memory.accepted,memory.declined].every(ids=>Array.isArray(ids)&&ids.length<=150&&ids.every(id=>integer(id,0,149))&&new Set(ids).size===ids.length)||memory.accepted.some(id=>memory.declined.includes(id)))return null;
  if(JSON.stringify(value).length>16777216||!s.progression||!Array.isArray(s.progression.outcomes)||s.progression.outcomes.length>1000000||s.progression.outcomes.some(id=>typeof id!=='string'||!/^cozy-\d{1,9}$/.test(id))||!Array.isArray(s.progression.claims)||s.progression.claims.length>1000000)return null;
  const stock=validateStockSnapshot(s.stock),progress=CozyProgression.restore(s.progression),help=validateHelpCheckpoint(s.help);
  if(!legacy&&s.contentId!==COZY_CONTENT_VERSION||!integer(s.day,1,1000000)||typeof s.terminal!=='boolean'||!stock||!progress||!help||!integer(s.cumulativeProfit,-1000000)||!integer(s.reputation,0,100)||!integer(s.relationship,0,3)||!stars(s.regularDay1Stars)||!stars(s.regularLatestStars))return null;
  const master=progress.snapshot;
  if(stock.lots.some(l=>l.unitCost!==datedIngredientPrice(l.ingredient,l.day)&&l.unitCost!==expressIngredientPrice(l.ingredient,l.day)&&stock.books.filter(b=>b.day<l.day).reduce((n,b)=>n+(b.ordinaryPurchases??0),0)<500))return null;
  if(!Array.isArray(s.menu)||!s.menu.length||s.menu.length>8||s.menu.some(id=>!STOCK_RECIPES.includes(id))||new Set(s.menu).size!==s.menu.length||!STOCK_RECIPES.includes(s.recipe)||!s.menu.includes(s.recipe)||!s.prices||STOCK_RECIPES.some(id=>typeof s.prices[id]!=='number'||!Number.isFinite(s.prices[id])||s.prices[id]<80||s.prices[id]>140))return null;
  if(!Array.isArray(s.reports)||s.reports.length>1000000||s.reports.some((r,i)=>!summaryValid(r,master,s.reports.slice(0,i).reduce((sum,report)=>sum+(report.campaignEvent?.loss??0),0))||r.day!==i+1||i<s.reports.length-1&&r.ending!==null)||!Array.isArray(s.relationshipDays)||s.relationshipDays.length>1000000||s.relationshipDays.some(d=>!integer(d,1,1000000)||d>s.reports.length)||new Set(s.relationshipDays).size!==s.relationshipDays.length)return null;
  const eventHistory:CampaignLossEvent[]=[];
  for(const report of s.reports){if(report.campaignEvent){
    if(s.campaignEventSeed===undefined||!chooseCampaignEvent(s.campaignEventSeed,report.day,eventHistory,()=>0))return null;
    eventHistory.push({...report.campaignEvent,day:report.day});
  }}
  if(stock.books.some(book=>(book.eventLoss??0)!==(s.reports.find(report=>report.day===book.day)?.campaignEvent?.loss??0)))return null;
  const closed=s.reports.length,last=s.reports[closed-1];
  let cash=300,inventoryValue=0,profit=0,outcomes=0,claims=0,xp=0,cheeseSales=0,arrears=0;
  const claimPosition=new Map(master.claims.map((id,index)=>[id,index]));
  for(const report of s.reports){
    const roles=staff.acquired.filter(a=>a.hiredDay<=report.day).map(a=>a.role),wages=roles.length*STAFF_RULES.dailyWage;
    const due=arrears+wages,a=report.accounts,available=a.startingCash+(a.supportFunds??0)+report.revenue+report.rewards-report.purchases-20-(report.deliveryFees??0)-(report.campaignEvent?.loss??0)-(a.capitalPurchases??0),paid=available>=due?due:0;
    const payroll=report.payroll;
    if((a.capitalPurchases??0)<staff.acquired.filter(a=>a.hiredDay===report.day).length*STAFF_RULES.hirePrice)return null;
    if(a.wages!==wages||(a.wagesPaid??a.wages)!==paid||roles.length&&!payroll||payroll&&(!Array.isArray(payroll.roles)||JSON.stringify([...payroll.roles].sort())!==JSON.stringify([...roles].sort())||payroll.openingArrears!==arrears||payroll.wagesPaid!==paid||payroll.endingArrears!==due-paid))return null;
    if((a.supportFunds??0)!==(s.testCodeReceipt?.day===report.day?TEST_CODE_COINS:0))return null;
    arrears=due-paid;
    profit+=report.profit;
    outcomes+=report.delivered;const missionNew=report.progression.mission==='completed'&&cheeseSales<8;
    if(report.progression.cheeseSales<cheeseSales||report.progression.cheeseSales-cheeseSales>report.delivered)return null;
    cheeseSales=report.progression.cheeseSales;
    if((cheeseSales>=8)!==(report.progression.mission==='completed'))return null;
    if(missionNew&&claimPosition.get('mission.cheese-8')!==claims)return null;
    claims+=missionNew?1:0;
    if(report.goal.status==='completed'&&claimPosition.get(`goal.day-${report.day}`)!==claims)return null;
    claims+=report.goal.status==='completed'?1:0;
    xp+=report.reviews.filter(r=>r.outcome==='delivered').reduce((n,r)=>n+(r.stars>=4?15:10),0)+(report.goal.status==='completed'?10:0)+(missionNew?20:0);
    if(report.progression.xp!==xp)return null;
    if(report.rewards!==(report.goal.status==='completed'?20:0)+(missionNew?30:0)+(report.day===3&&help.claims.includes('regular.thanks-day-3')?20:0)+report.reviews.reduce((sum,review)=>sum+(review.vip?.coins??0),0))return null;
    if(report.progressionArchive&&(report.progressionArchive.outcomeCount!==outcomes||report.progressionArchive.claimCount!==claims))return null;
    if(!report.progressionArchive&&(JSON.stringify(report.progression.outcomes)!==JSON.stringify(master.outcomes.slice(0,outcomes))||JSON.stringify(report.progression.claims)!==JSON.stringify(master.claims.slice(0,claims))||JSON.stringify(report.progression.goals)!==JSON.stringify(master.goals.slice(0,report.day))))return null;
    if(report.accounts.startingCash!==cash||report.accounts.openingInventoryValue!==inventoryValue||report.accounts.cumulativeProfit!==profit)return null;
    cash=report.cash;inventoryValue=report.accounts.inventory.value;
    if(report.day===3&&JSON.stringify(report.referral)!==JSON.stringify(s.reports[1].referral))return null;
  }
  const prepBook=stock.books.find(b=>b.day===s.day&&!s.terminal),prepPurchases=prepBook?.purchases??0;
  if(staff.arrears!==arrears||staff.pendingSpent!==(s.terminal?0:staff.acquired.filter(a=>a.hiredDay===s.day).length*STAFF_RULES.hirePrice))return null;
  if(prepBook?.consumed||stock.lots.filter(l=>l.day===s.day&&!s.terminal).reduce((sum,l)=>sum+l.quantity*l.unitCost,0)!==prepPurchases)return null;
  if(last&&JSON.stringify(stock.lots.filter(l=>l.day<=closed))!==JSON.stringify(last.accounts.inventory.lots))return null;
  if(!last&&(master.xp||master.outcomes.length||s.regularDay1Stars!==null||s.regularLatestStars!==null||s.relationshipDays.length))return null;
  if(s.day!==(s.terminal?closed:closed+1)||s.terminal!==!!last?.ending||master.goals.length!==closed||stock.settlements.length!==closed||stock.settlements.some(b=>b.day>closed)||stock.books.some(b=>b.day>(s.terminal?closed:s.day))||stock.lots.some(l=>l.day>(s.terminal?closed:s.day)||!s.terminal&&l.expiry<s.day)||stock.activeDay!==(legacy?Math.min(3,closed+1):closed+1))return null;
  if(s.cumulativeProfit!==s.reports.reduce((n,r)=>n+r.profit,0)||stock.cash!==(last?.cash??300)+(s.testCodeReceipt?.day===s.day&&!s.terminal?TEST_CODE_COINS:0)-upgrades.pendingSpent-recipePurchases.pendingSpent-shop.pendingSpent-staff.pendingSpent-prepPurchases||s.reputation!==(last?.reputation??50)||s.relationship!==(last?.relationship??0)||last&&JSON.stringify(master)!==JSON.stringify(reportProgression(last,master)))return null;
  for(const report of s.reports){const book=stock.books.find(b=>b.day===report.day)??{purchases:0,consumed:0,eventLoss:0},settled=stock.settlements.find(b=>b.day===report.day);if((book.eventLoss??0)!==(report.campaignEvent?.loss??0)||book.purchases!==report.purchases||book.consumed!==report.cost||!settled||settled.expired!==report.expired||settled.rent!==report.rent)return null;}
  if(!s.menu.some(id=>ownership.includes(id))||!ownership.includes(s.recipe)||s.menu.some(id=>!ownership.includes(id)&&!legacy))return null;
  if(s.referral!==null&&(!s.referral||typeof s.referral.eligible!=='boolean'||JSON.stringify(s.referral)!==JSON.stringify(referralEligibility(s.reports.find(r=>r.day===2)?.reputation??s.reputation))))return null;
  if(closed<2&&(help.decision!=='unseen'||help.claims.length)||closed<3&&help.claims.length||help.claims.length&&!s.reports[2])return null;
  for(const report of s.reports){
    if(legacy&&report.day===3){if(report.ending!=='complete')return null;continue;}
    const inventory=CozyStock.restore({cash:0,nextLot:1000000000,activeDay:report.day+1,lots:report.accounts.inventory.lots,books:[],settlements:[]})!;
    const expected=cozyViability(report.cash,report.day+1,report.ownedRecipes??STOCK_RECIPES.filter(recipe=>recipe==='cheese'||recipe==='mushroom'||recipe==='sausage'&&report.progression.unlockDay!==null&&report.day+1>=report.progression.unlockDay),id=>inventory.available(id,report.day+1),id=>CozyStock.restore(stock)!.purchasePrice(id,report.day+1));
    const finalDay=report.day===campaignEndDay;
    const expectedEnding=finalDay?'complete':expected.viable?null:'insolvent';
    const preservedInsolvency=finalDay&&report.ending==='insolvent'&&!expected.viable;
    if(report.day>campaignEndDay||report.ending!==expectedEnding&&!preservedInsolvency||JSON.stringify(report.viability)!==JSON.stringify(expected))return null;
  }
  const reports=s.reports.map(r=>{
    const a=r.accounts;
    const accounts={...closeAccounts({... (r.campaignEvent?{eventLoss:r.campaignEvent.loss}:{}),...(a.supportFunds!==undefined?{supportFunds:a.supportFunds}:{}),startingCash:a.startingCash,openingInventoryValue:a.openingInventoryValue,sales:a.sales,purchases:a.purchases,consumed:a.consumed,expired:a.expired,rent:a.rent,inventory:a.inventory,previousProfit:a.cumulativeProfit-a.profit,rewards:a.rewards,giftCost:a.giftCost,capitalPurchases:a.capitalPurchases??0,wages:a.wages,wagesPaid:a.wagesPaid??a.wages,...(r.deliveryFees!==undefined?{deliveryFees:r.deliveryFees}:{})}),zeroReasons:structuredClone(a.zeroReasons)};
    return {...(r.campaignEvent?{campaignEvent:{...r.campaignEvent}}:{}),...(r.payroll?{payroll:structuredClone(r.payroll)}:{}),...(r.pizzasSold!==undefined?{pizzasSold:r.pizzasSold}:{}),...(r.deliveryFees!==undefined?{deliveryFees:r.deliveryFees}:{}),...(r.event!==undefined?{event:r.event}:{}),...(r.appEnabled!==undefined?{appEnabled:r.appEnabled}:{}),...(r.progressionArchive?{progressionArchive:{...r.progressionArchive}}:{}),...(r.ownedRecipes?{ownedRecipes:[...r.ownedRecipes]}:{}),...(r.salesByRecipe!==undefined?{salesByRecipe:r.salesByRecipe.map(row=>({...row}))}:{}),...(r.costByIngredient!==undefined?{costByIngredient:r.costByIngredient.map(row=>({...row}))}:{}),progression:structuredClone(r.progression),goal:progress.goal(r.day),rewards:r.rewards,accounts,day:r.day,revenue:r.revenue,purchases:r.purchases,cost:r.cost,expired:r.expired,rent:r.rent,profit:r.profit,delivered:r.delivered,abandoned:r.abandoned,rating:r.rating,cash:r.cash,reviews:r.reviews.map(review=>({... (review.vip?{vip:{...review.vip}}:{}),... (review.source!==undefined?{source:review.source}:{}),...(review.quantity!==undefined?{quantity:review.quantity}:{}),...(review.deliveryFee!==undefined?{deliveryFee:review.deliveryFee}:{}),... (review.avatarIndex!==undefined?{avatarIndex:review.avatarIndex}:{}),name:review.name,stars:review.stars,reasons:[...review.reasons],outcome:review.outcome,reputationDelta:review.reputationDelta,relationshipDelta:review.relationshipDelta})),ending:r.ending,reputation:r.reputation,relationship:r.relationship,referral:r.referral?{...r.referral}:null,...(r.viability?{viability:{...r.viability}}:{})};
  });
  if(s.reports.reduce((sum,r)=>sum+(r.accounts.capitalPurchases??0),0)+upgrades.pendingSpent+recipePurchases.pendingSpent+shop.pendingSpent+staff.pendingSpent!==upgrades.spent+recipePurchases.spent+shop.spent+staff.spent)return null;
  if(legacy){stock.activeDay=closed+1;const last=reports[reports.length-1];if(last?.ending==='complete'){const inventory=CozyStock.restore(stock)!;const viability=cozyViability(stock.cash,4,ownership,id=>inventory.available(id,4));last.ending=viability.viable?null:'insolvent';last.viability=viability;s.terminal=!viability.viable;s.day=s.terminal?3:4;}}
  return structuredClone({...(s.testCodeReceipt?{testCodeReceipt:{...s.testCodeReceipt}}:{}),... (s.campaignEventSeed!==undefined?{campaignEventSeed:s.campaignEventSeed}:{}),campaignEndDay,staff,shop,deliveryAppEnabled:s.deliveryAppEnabled??false,ownedRecipes:ownership,recipePurchases,upgrades:{...upgrades},customerMemory:{accepted:[...memory.accepted],declined:[...memory.declined]},contentId:COZY_CONTENT_VERSION,day:s.day,terminal:s.terminal,stock,progression:master,help,menu:s.menu.filter(id=>ownership.includes(id)),prices:{...s.prices},recipe:s.recipe,reports:reports.map(compactCozyReport),cumulativeProfit:s.cumulativeProfit,reputation:s.reputation,relationship:s.relationship,relationshipDays:[...s.relationshipDays],regularDay1Stars:s.regularDay1Stars,regularLatestStars:s.regularLatestStars,referral:s.referral?{...s.referral}:null});
}
export function validateCozyCheckpoint(value:unknown):CozyCheckpoint|null {try{return validatedCheckpoint(value);}catch{return null;}}
