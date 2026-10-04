import {CozyProgression,type ProgressionSnapshot,type GoalView} from './CozyProgression';
import {validateHelpCheckpoint,type CozyHelpCheckpoint} from './CozyHelp';
import {validateStockSnapshot,STOCK_RECIPES,type StockRecipe,type CozyStockSnapshot} from './CozyStock';
import {closeAccounts,type DayAccounts} from './DayAccounts';
import {referralEligibility} from './CustomerProgression';
import type {CozyViability} from './CozyViability';
import {cozyViability} from './CozyViability';
import {CozyStock} from './CozyStock';
export interface CozyReview {name:string;stars:number;reasons:readonly string[];outcome:'delivered'|'expired'|'closed';reputationDelta:number;relationshipDelta:number}
export interface CozyDaySummary {progression:ProgressionSnapshot;goal:GoalView;rewards:number;accounts:DayAccounts;day:number;revenue:number;purchases:number;cost:number;expired:number;rent:number;profit:number;delivered:number;abandoned:number;rating:number|null;cash:number;reviews:readonly CozyReview[];ending:'complete'|'insolvent'|null;reputation:number;relationship:number;referral:ReturnType<typeof referralEligibility>|null;viability?:CozyViability}
export const COZY_SCHEMA_VERSION=1;
export const COZY_CONTENT_VERSION='cozy-three-days-2026-10-03';
export type CozyCheckpoint={contentId:typeof COZY_CONTENT_VERSION;day:number;terminal:boolean;stock:CozyStockSnapshot;progression:ProgressionSnapshot;help:CozyHelpCheckpoint;menu:StockRecipe[];prices:Record<StockRecipe,number>;recipe:StockRecipe;reports:CozyDaySummary[];cumulativeProfit:number;reputation:number;relationship:number;relationshipDays:number[];regularDay1Stars:number|null;regularLatestStars:number|null;referral:ReturnType<typeof referralEligibility>|null};
const integer=(n:unknown,min=0,max=1000000):n is number=>Number.isSafeInteger(n)&&Number(n)>=min&&Number(n)<=max;
const stars=(n:unknown)=>n===null||integer(n,1,5);
const text=(v:unknown,max=512):v is string=>typeof v==='string'&&v.length<=max;
function summaryValid(s:CozyDaySummary):boolean {
  if(!s||!integer(s.day,1,3)||!CozyProgression.restore(s.progression)||!integer(s.revenue)||!integer(s.purchases)||!integer(s.cost)||!integer(s.expired)||s.rent!==20||!integer(s.rewards)||!integer(s.profit,-1000000)||!integer(s.cash,-20)||!integer(s.delivered,0,30)||!integer(s.abandoned,0,30)||!integer(s.reputation,0,100)||!integer(s.relationship,0,3)||![null,'complete','insolvent'].includes(s.ending))return false;
  if(!Array.isArray(s.reviews)||s.reviews.length>30||s.reviews.some(r=>!r||!text(r.name,80)||!integer(r.stars,1,5)||!Array.isArray(r.reasons)||r.reasons.length>8||r.reasons.some((reason:unknown)=>!text(reason))||!['delivered','expired','closed'].includes(r.outcome)||!integer(r.reputationDelta,-100,100)||!integer(r.relationshipDelta,-3,3)))return false;
  const rating=s.reviews.length?s.reviews.reduce((n,r)=>n+r.stars,0)/s.reviews.length:null;
  if(s.rating!==rating||s.delivered!==s.reviews.filter(r=>r.outcome==='delivered').length||s.abandoned!==s.reviews.filter(r=>r.outcome!=='delivered').length)return false;
  const a=s.accounts;
  if(!a||!integer(a.startingCash,-20)||!integer(a.openingInventoryValue)||!integer(a.cumulativeProfit,-1000000)||a.sales!==s.revenue||a.rewards!==s.rewards||a.purchases!==s.purchases||a.consumed!==s.cost||a.expired!==s.expired||a.rent!==20||a.profit!==s.profit||a.endingCash!==s.cash||s.profit!==s.revenue-s.cost-s.expired-20||s.cash!==a.startingCash+s.revenue+s.rewards-s.purchases-20||a.wages!==0||a.repairs!==0||a.other!==0||!integer(a.giftCost)||a.giftCost>s.cost)return false;
  if(!a.inventory||!Array.isArray(a.inventory.lots)||a.inventory.lots.length>300)return false;
  const lots=validateStockSnapshot({cash:s.cash,nextLot:10000,activeDay:Math.min(3,s.day+1),lots:a.inventory.lots,books:[],settlements:[]});
  if(!lots||a.inventory.units!==lots.lots.reduce((n,l)=>n+l.quantity,0)||a.inventory.value!==lots.lots.reduce((n,l)=>n+l.quantity*l.unitCost,0))return false;
  if(a.openingInventoryValue+a.purchases-a.consumed-a.expired!==a.inventory.value)return false;
  if(!a.zeroReasons||Object.values(a.zeroReasons).some(value=>!text(value)))return false;
  const goal=s.progression.goals.find(g=>g.day===s.day);
  if(!goal||JSON.stringify(goal)!==JSON.stringify(s.goal))return false;
  if(s.referral!==null&&s.day===2&&JSON.stringify(s.referral)!==JSON.stringify(referralEligibility(s.reputation)))return false;
  if(s.day===1&&s.referral!==null)return false;
  return true;
}
/** Validate a detached, bounded day boundary before constructing a runtime. */
function validatedCheckpoint(value:unknown):CozyCheckpoint|null {
  if(!value||typeof value!=='object')return null;
  const s=value as CozyCheckpoint;
  if(JSON.stringify(value).length>131072||!s.progression||!Array.isArray(s.progression.outcomes)||s.progression.outcomes.length>40||s.progression.outcomes.some(id=>typeof id!=='string'||!/^cozy-\d{1,5}$/.test(id))||!Array.isArray(s.progression.claims)||s.progression.claims.length>4)return null;
  const stock=validateStockSnapshot(s.stock),progress=CozyProgression.restore(s.progression),help=validateHelpCheckpoint(s.help);
  if(s.contentId!==COZY_CONTENT_VERSION||!integer(s.day,1,3)||typeof s.terminal!=='boolean'||!stock||!progress||!help||!integer(s.cumulativeProfit,-1000000)||!integer(s.reputation,0,100)||!integer(s.relationship,0,3)||!stars(s.regularDay1Stars)||!stars(s.regularLatestStars))return null;
  if(!Array.isArray(s.menu)||!s.menu.length||s.menu.length>3||s.menu.some(id=>!STOCK_RECIPES.includes(id))||new Set(s.menu).size!==s.menu.length||!STOCK_RECIPES.includes(s.recipe)||!s.menu.includes(s.recipe)||!s.prices||STOCK_RECIPES.some(id=>typeof s.prices[id]!=='number'||!Number.isFinite(s.prices[id])||s.prices[id]<80||s.prices[id]>140))return null;
  if(!Array.isArray(s.reports)||s.reports.length>3||s.reports.some((r,i)=>!summaryValid(r)||r.day!==i+1||i<s.reports.length-1&&r.ending!==null)||!Array.isArray(s.relationshipDays)||s.relationshipDays.length>3||s.relationshipDays.some(d=>!integer(d,1,3)||d>s.reports.length)||new Set(s.relationshipDays).size!==s.relationshipDays.length)return null;
  const closed=s.reports.length,last=s.reports[closed-1];
  let cash=300,inventoryValue=0,profit=0;
  for(const report of s.reports){
    profit+=report.profit;
    if(report.accounts.startingCash!==cash||report.accounts.openingInventoryValue!==inventoryValue||report.accounts.cumulativeProfit!==profit)return null;
    cash=report.cash;inventoryValue=report.accounts.inventory.value;
    if(report.day===3&&JSON.stringify(report.referral)!==JSON.stringify(s.reports[1].referral))return null;
  }
  if(last&&JSON.stringify(stock.lots)!==JSON.stringify(last.accounts.inventory.lots))return null;
  if(!last&&(stock.lots.length||stock.books.length||stock.nextLot!==1||progress.snapshot.xp||progress.snapshot.outcomes.length||s.regularDay1Stars!==null||s.regularLatestStars!==null||s.relationshipDays.length))return null;
  if(s.day!==(s.terminal?closed:closed+1)||s.terminal!==!!last?.ending||closed===3&&!s.terminal||progress.snapshot.goals.length!==closed||stock.settlements.length!==closed||stock.settlements.some(b=>b.day>closed)||stock.books.some(b=>b.day>closed)||stock.lots.some(l=>l.day>closed||!s.terminal&&l.expiry<s.day)||stock.activeDay!==Math.min(3,closed+1))return null;
  if(s.cumulativeProfit!==s.reports.reduce((n,r)=>n+r.profit,0)||stock.cash!==(last?.cash??300)||s.reputation!==(last?.reputation??50)||s.relationship!==(last?.relationship??0)||last&&JSON.stringify(progress.snapshot)!==JSON.stringify(last.progression))return null;
  for(const report of s.reports){const book=stock.books.find(b=>b.day===report.day)??{purchases:0,consumed:0},settled=stock.settlements.find(b=>b.day===report.day);if(book.purchases!==report.purchases||book.consumed!==report.cost||!settled||settled.expired!==report.expired||settled.rent!==report.rent)return null;}
  if(!s.menu.some(id=>progress.recipeAvailable(id,s.day))||!progress.recipeAvailable(s.recipe,s.day))return null;
  if(s.referral!==null&&(!s.referral||typeof s.referral.eligible!=='boolean'||JSON.stringify(s.referral)!==JSON.stringify(referralEligibility(s.reports.find(r=>r.day===2)?.reputation??s.reputation))))return null;
  if(closed<2&&(help.decision!=='unseen'||help.claims.length)||closed<3&&help.claims.length||help.claims.length&&!s.reports[2])return null;
  for(const report of s.reports){
    if(report.day===3){if(report.ending!=='complete')return null;continue;}
    const inventory=CozyStock.restore({cash:report.cash,nextLot:10000,activeDay:report.day+1,lots:report.accounts.inventory.lots,books:[],settlements:[]})!,p=CozyProgression.restore(report.progression)!;
    const expected=cozyViability(report.cash,report.day+1,STOCK_RECIPES.filter(recipe=>p.recipeAvailable(recipe,report.day+1)),id=>inventory.available(id,report.day+1));
    if(report.ending!==(expected.viable?null:'insolvent')||JSON.stringify(report.viability)!==JSON.stringify(expected))return null;
  }
  const reports=s.reports.map(r=>{
    const p=CozyProgression.restore(r.progression)!,a=r.accounts;
    const accounts=closeAccounts({startingCash:a.startingCash,openingInventoryValue:a.openingInventoryValue,sales:a.sales,purchases:a.purchases,consumed:a.consumed,expired:a.expired,rent:a.rent,inventory:a.inventory,previousProfit:a.cumulativeProfit-a.profit,rewards:a.rewards,giftCost:a.giftCost});
    return {progression:p.snapshot,goal:p.goal(r.day),rewards:r.rewards,accounts,day:r.day,revenue:r.revenue,purchases:r.purchases,cost:r.cost,expired:r.expired,rent:r.rent,profit:r.profit,delivered:r.delivered,abandoned:r.abandoned,rating:r.rating,cash:r.cash,reviews:r.reviews.map(review=>({name:review.name,stars:review.stars,reasons:[...review.reasons],outcome:review.outcome,reputationDelta:review.reputationDelta,relationshipDelta:review.relationshipDelta})),ending:r.ending,reputation:r.reputation,relationship:r.relationship,referral:r.referral?{...r.referral}:null,...(r.viability?{viability:{...r.viability}}:{})};
  });
  return structuredClone({contentId:COZY_CONTENT_VERSION,day:s.day,terminal:s.terminal,stock,progression:progress.snapshot,help,menu:[...s.menu],prices:{cheese:s.prices.cheese,mushroom:s.prices.mushroom,sausage:s.prices.sausage},recipe:s.recipe,reports,cumulativeProfit:s.cumulativeProfit,reputation:s.reputation,relationship:s.relationship,relationshipDays:[...s.relationshipDays],regularDay1Stars:s.regularDay1Stars,regularLatestStars:s.regularLatestStars,referral:s.referral?{...s.referral}:null});
}
export function validateCozyCheckpoint(value:unknown):CozyCheckpoint|null {try{return validatedCheckpoint(value);}catch{return null;}}
