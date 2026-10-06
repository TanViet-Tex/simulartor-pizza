import {expect,it} from 'vitest';
import {CozyRuntime,validateHelpState} from './CozyRuntime';
import {validateHelpCheckpoint} from '../domain/CozyHelp';
import {recipeIngredients} from '../domain/CozyStock';
import type {ScheduleFactory} from '../config/cozySchedule';
import {helpOfferEligible} from '../domain/HelpOffers';
const helpSeed=Array.from({length:100},(_,i)=>i).find(helpOfferEligible)!;
function time(r:CozyRuntime,s:number){for(let i=0;i<Math.round(s*20);i++){r.advance(50);if(r.bargainPending)r.resolveBargain(false);}}
function buy(r:CozyRuntime,q=2){for(const id of ['dough','sauce','cheese'] as const)r.buy(id,q);}
function serve(r:CozyRuntime,quality:'good'|'raw'|'burnt'='good'){
  const id=r.selectedTicketId;for(const ingredient of recipeIngredients(r.selectedRecipe))r.dispatch({type:'ingredient',ingredient});
  expect(r.dispatch({type:'bake'})).toBe(true);time(r,quality==='raw'?1:quality==='burnt'?r.bakeTiming.perfectEnd+.05:r.bakeTiming.perfectStart);
  r.dispatch({type:'extract'});
  expect(r.dispatch({type:'deliver',commandId:'serve-'+id})).toBe(true);if(r.deliveryPending)r.confirmDelivery();
  if(r.shopPhase==='delivered')r.continueShift();return id;
}
function day2(seed=helpSeed){const r=new CozyRuntime(false,true,{eventSeed:seed});buy(r,3);r.openShop();time(r,10);serve(r);r.closeDay();r.openNextDay();time(r,10);return r;}
it('skips help in non-selected campaigns without losing the first commercial visit',()=>{
  const seed=Array.from({length:100},(_,i)=>i).find(seed=>!helpOfferEligible(seed))!;
  const r=day2(seed);expect(r.helpPending).toBeNull();expect(r.pauses).not.toContain('help');
  expect(r.tickets[0]).toMatchObject({help:false,kind:'hurry'});expect(r.shiftClock.total).toBe(15);
  r.closeDay();const checkpoint=r.exportCheckpoint(),restored=CozyRuntime.restoreCheckpoint(checkpoint,false)!;
  expect(restored.campaignEvents.seed).toBe(seed);expect(helpOfferEligible(restored.campaignEvents.seed)).toBe(false);
  expect(restored.marketForecast).toEqual(r.marketForecast);
});
it('gates actual Day2 help, pauses before ticket/reservation, declines without economic consequences',()=>{
  const r=day2(),cash=r.state.cash,rep=r.customerProgress,stock=r.stockLots,xp=r.progression.xp;
  expect(r.helpPending).toMatchObject({canAccept:true});expect(r.tickets).toEqual([]);expect(r.pauses).toContain('help');
  time(r,100);expect(r.shiftClock.elapsed).toBe(10);expect(r.reserved('dough')).toBe(0);
  expect(r.dispatch({type:'customer.help',accept:false})).toBe(true);expect(r.dispatch({type:'customer.help',accept:false})).toBe(false);
  expect(r.state.cash).toBe(cash);expect(r.customerProgress).toEqual(rep);expect(r.stockLots).toEqual(stock);expect(r.progression.xp).toBe(xp);
  expect(r.helpState).toMatchObject({decision:'declined',outcome:null});
  const bad=new CozyRuntime(false,true);buy(bad);bad.openShop();time(bad,10);time(bad,61);serve(bad,'raw');bad.closeDay();bad.openNextDay();time(bad,10);
  expect(bad.helpPending).toBeNull();expect(bad.events.some(event=>event.includes('help-offered'))).toBe(false);
});
it('resolves good gift once without commercial XP, sales, rating, reputation, goals or mission',()=>{
  const r=day2(),xp=r.progression.xp,rep=r.customerProgress.reputation,cash=r.state.cash;
  expect(r.dispatch({type:'customer.help',accept:true})).toBe(true);expect(r.selectedTicket).toMatchObject({help:true,takeaway:false,finalPrice:0,remaining:120});
  const id=serve(r);expect(r.helpState).toMatchObject({decision:'accepted',outcome:'succeeded',giftCost:15});
  expect(r.customerProgress).toMatchObject({relationship:2,reputation:rep});expect(r.progression).toMatchObject({xp,cheeseSales:1,goal:{stats:{delivered:0,sales:0,stars:[]}}});
  expect(r.state.cash).toBe(cash);expect(r.dispatch({type:'deliver',targetId:id,commandId:'duplicate'})).toBe(false);
  r.closeDay();expect(r.daySummary).toMatchObject({delivered:0,abandoned:0,revenue:0,rewards:0,rating:null,cost:15,expired:12,profit:-47,accounts:{giftCost:15},reviews:[]});
  expect(r.daySummary!.accounts.endingCash).toBe(r.state.cash);
});
it.each(['raw','burnt'] as const)('fails %s help once without commercial penalties',quality=>{
  const r=day2(),rep=r.customerProgress.reputation,xp=r.progression.xp;r.resolveHelp(true);serve(r,quality);
  expect(r.helpState.outcome).toBe('failed');expect(r.customerProgress).toMatchObject({relationship:0,reputation:rep});expect(r.progression.xp).toBe(xp);
  r.closeDay();expect(r.daySummary).toMatchObject({delivered:0,abandoned:0,rating:null,accounts:{giftCost:15}});
});
it('help remains successful after half-patience when exact good pizza arrives before its deadline',()=>{
  const r=day2();r.resolveHelp(true);time(r,61);serve(r);expect(r.helpState.outcome).toBe('succeeded');expect(r.customerProgress.relationship).toBe(2);
});
it.each(['expired','closed'] as const)('resolves %s help failure once and releases stock without commercial counters',outcome=>{
  const r=day2(),rep=r.customerProgress.reputation;r.resolveHelp(true);
  if(outcome==='expired')time(r,120);else r.closeDay();
  expect(r.helpState.outcome).toBe('failed');expect(r.customerProgress).toMatchObject({relationship:0,reputation:outcome==='closed'?rep:expect.any(Number)});
  expect(r.lastResult?.help??outcome==='closed').toBe(true);r.closeDay();expect(r.daySummary!.reviews.every(review=>review.name!=='Linh')).toBe(true);
  expect(r.helpState.outcome).toBe('failed');
});
it('disables help with exact stock or omitted preference reason, preserves nested pause ownership',()=>{
  const r=new CozyRuntime(false,true,{eventSeed:helpSeed});buy(r,1);r.openShop();time(r,10);serve(r);r.closeDay();buy(r,1);r.openNextDay();time(r,10);
  const hidden=r.acquirePause('visibility'),second=r.acquirePause('help');expect(r.resolveHelp(true)).toBe(false);hidden.release();expect(r.resolveHelp(false)).toBe(false);second.release();
  expect(r.resolveHelp(true)).toBe(true);expect(r.pauses).toEqual([]);
  const omitted=day2();omitted.resolveHelp(false);omitted.closeDay(); // state is detached even after closure
  const view=omitted.helpState;view.claims.push('bad');expect(omitted.helpState.claims).toEqual([]);
  const s=new CozyRuntime(false,true,{eventSeed:helpSeed});buy(s,1);s.openShop();time(s,10);serve(s);s.closeDay();s.selectRecipe('mushroom');s.buy('mushroom',1);buy(s,1);s.configureMenu('cheese',100,false);s.openNextDay();time(s,10);
  expect(s.helpPending).toMatchObject({canAccept:false});expect(s.helpPending!.reason).toContain('thực đơn');expect(s.resolveHelp(true)).toBe(false);expect(s.resolveHelp(false)).toBe(true);
});
it('Day3 thanks grants twenty cash once separately from sales and XP',()=>{
  const r=day2();r.resolveHelp(true);serve(r);r.closeDay();buy(r,1);r.openNextDay();const cash=r.state.cash,xp=r.progression.xp;time(r,10);
  expect(r.thanksPending).toBe(true);expect(r.state.cash).toBe(cash+20);expect(r.progression.xp).toBe(xp);expect(r.helpState.claims).toEqual(['regular.thanks-day-3']);
  const hidden=r.acquirePause('visibility');expect(r.dismissThanks()).toBe(false);hidden.release();expect(r.dismissThanks()).toBe(true);expect(r.dismissThanks()).toBe(false);
  r.closeDay();expect(r.daySummary).toMatchObject({revenue:0,rewards:20,accounts:{giftCost:0}});expect(r.daySummary!.profit).toBe(-20);expect(r.helpState.claims).toHaveLength(1);
});
it('wrong commercial pizza given to help fails once and books its actual cost as a gift subset',()=>{
  const schedule:ScheduleFactory=day=>({day,duration:180,grace:120,slots:day===1?[{id:'regular',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:false}]:[{id:'help',at:0,kind:'regular',opportunity:'help',commercialOrdinal:null,takeaway:false},{id:'other',at:1,kind:'picky',opportunity:'commercial',commercialOrdinal:3,takeaway:false}]});
  const r=new CozyRuntime(false,true,{schedule});buy(r,3);r.openShop();serve(r);r.closeDay();r.buy('mushroom',1);r.openNextDay();r.resolveHelp(true);const helpId=r.selectedTicketId;time(r,1);
  const other=r.tickets.find(t=>!t.help)!;r.selectTicket(other.id);for(const ingredient of recipeIngredients('mushroom'))r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});time(r,3);r.dispatch({type:'extract'});
  const xp=r.progression.xp;expect(r.dispatch({type:'deliver',sourceId:other.id,targetId:helpId,commandId:'wrong-help'})).toBe(true);expect(r.deliveryPending).not.toBeNull();expect(r.confirmDelivery()).toBe(true);
  expect(r.helpState).toMatchObject({outcome:'failed',giftCost:21});expect(r.customerProgress.relationship).toBe(0);expect(r.progression.xp).toBe(xp);r.closeDay();
  expect(r.daySummary).toMatchObject({cost:21,revenue:0,delivered:0,accounts:{giftCost:21}});expect(r.daySummary!.reviews.some(review=>review.name==='Linh')).toBe(false);
});
it('permits help before stocking ingredients and a relationship already at zero cannot go negative',()=>{
  const schedule:ScheduleFactory=day=>({day,duration:180,grace:120,slots:day===1?[{id:'regular',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:false}]:[{id:'other',at:0,kind:'picky',opportunity:'commercial',commercialOrdinal:1,takeaway:false},{id:'help',at:1,kind:'regular',opportunity:'help',commercialOrdinal:null,takeaway:false}]});
  const r=new CozyRuntime(false,true,{schedule});buy(r,2);r.openShop();serve(r,'raw');r.closeDay();r.openNextDay();time(r,1);
  expect(r.helpPending).toMatchObject({canAccept:true,reason:''});expect(r.resolveHelp(true)).toBe(true);expect(r.customerProgress.relationship).toBe(0);
  const zero=new CozyRuntime(false,true,{schedule});buy(zero,2);zero.openShop();serve(zero,'raw');zero.closeDay();zero.openNextDay();time(zero,1);zero.resolveHelp(true);zero.selectTicket(zero.tickets.find(t=>t.help)!.id);serve(zero,'raw');expect(zero.helpState.outcome).toBe('failed');expect(zero.customerProgress.relationship).toBe(0);
});
it('a help pizza sold to a commercial ticket is consumed cost but no longer gift cost',()=>{
  const schedule:ScheduleFactory=day=>({day,duration:180,grace:120,slots:day===1?[{id:'regular',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:false}]:[{id:'help',at:0,kind:'regular',opportunity:'help',commercialOrdinal:null,takeaway:false},{id:'other',at:1,kind:'picky',opportunity:'commercial',commercialOrdinal:1,takeaway:false}]});
  const r=new CozyRuntime(false,true,{schedule,resolveRecipe:()=> 'cheese'});buy(r,3);r.openShop();serve(r);r.closeDay();r.openNextDay();r.resolveHelp(true);const help=r.selectedTicketId;time(r,1);r.selectTicket(help);
  for(const ingredient of recipeIngredients('cheese'))r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});time(r,3);r.dispatch({type:'extract'});
  const commercial=r.tickets.find(t=>!t.help)!;expect(r.dispatch({type:'deliver',sourceId:help,targetId:commercial.id,commandId:'sold-help-pizza'})).toBe(true);if(r.deliveryPending)r.confirmDelivery();
  r.closeDay();expect(r.daySummary).toMatchObject({delivered:1,cost:15,accounts:{giftCost:0}});expect(r.helpState.giftCost).toBe(0);
});
it('validates detached checkpoint choices and active views rather than accepting incoherent narrative state',()=>{
  const valid={decision:'accepted',outcome:'succeeded',claims:['regular.thanks-day-3']};const copy=validateHelpCheckpoint(valid)!;copy.claims.length=0;expect(valid.claims).toHaveLength(1);
  for(const value of [null,{...valid,outcome:null},{...valid,decision:'declined'},{...valid,claims:['x']},{...valid,claims:['regular.thanks-day-3','regular.thanks-day-3']}])expect(validateHelpCheckpoint(value)).toBeNull();
  expect(validateHelpState({...valid,ticketId:null,offer:null,giftCost:0,thanksPending:false})).not.toBeNull();
  expect(validateHelpState({...valid,outcome:'pending',ticketId:null,offer:null,giftCost:0,thanksPending:false})).toBeNull();
});
it('explains full capacity at the help choice and never creates a fifth ticket',()=>{
  const schedule:ScheduleFactory=day=>({day,duration:180,grace:120,slots:day===1?[{id:'regular',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:false}]:[0,1,2,3,4].map(i=>({id:'slot-'+i,at:i,kind:i===4?'regular':'picky',opportunity:i===4?'help':'commercial',commercialOrdinal:i===4?null:i+1,takeaway:false}))});
  const r=new CozyRuntime(false,true,{schedule,resolveRecipe:()=> 'cheese'});buy(r,5);r.openShop();serve(r);r.closeDay();r.openNextDay();time(r,4);
  expect(r.tickets).toHaveLength(4);expect(r.helpPending).toMatchObject({canAccept:false});expect(r.helpPending!.reason).toContain('Hàng chờ đã đầy');expect(r.resolveHelp(true)).toBe(false);expect(r.reserved('dough')).toBe(0);r.resolveHelp(false);
});
