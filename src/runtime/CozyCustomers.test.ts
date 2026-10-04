import {ORDER_TEST_SCHEDULE} from './cozyScheduleFixture';
import {expect,it} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {recipeIngredients} from '../domain/CozyStock';
function time(r:CozyRuntime,n:number){for(let i=0;i<n*20;i++)r.advance(50);}
function shop(percent=100,quantity=8){const r=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);for(const id of ['dough','sauce','cheese'] as const)r.buy(id,quantity);r.setMenuPrice('cheese',percent);r.openShop();return r;}
function serve(r:CozyRuntime,id=r.selectedTicketId){if(r.thanksPending)r.dismissThanks();r.selectTicket(id);for(const ingredient of recipeIngredients(r.selectedRecipe))r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});time(r,3);r.dispatch({type:'extract'});r.dispatch({type:'box'});r.dispatch({type:'deliver',commandId:'deliver:'+id});if(r.shopPhase==='delivered')r.continueShift();}
it('bargain creates neither hold nor timer before agreement, and owns only its lease',()=>{
 const r=shop();serve(r);time(r,57);expect(r.tickets.map(t=>t.kind)).toEqual(['hurry','picky']);
 expect(r.bargainPending).toMatchObject({originalPrice:50,finalPrice:45});const snapshot=r.tickets;const hold=r.reserved('dough');time(r,200);expect(r.tickets).toEqual(snapshot);expect(r.reserved('dough')).toBe(hold);
 const visibility=r.acquirePause('visibility'),user=r.acquirePause('user');expect(r.resolveBargain(true)).toBe(false);visibility.release();expect(r.resolveBargain(false)).toBe(false);user.release();
 const sameReason=r.acquirePause('bargain');expect(r.resolveBargain(true)).toBe(true);expect(r.pauses).toEqual(['bargain']);sameReason.release();
 expect(r.tickets[2]).toMatchObject({kind:'bargain',remaining:110,finalPrice:45});expect(r.reserved('dough')).toBe(hold+1);expect(r.resolveBargain(true)).toBe(false);
});
it('decline and missing stock do not affect ratings or reputation',()=>{
 const r=shop(100,1);serve(r);time(r,57);expect(r.bargainPending).not.toBeNull();expect(r.resolveBargain(false)).toBe(true);expect(r.resolveBargain(false)).toBe(false);expect(r.customerProgress.reputation).toBe(51);r.closeDay();expect(r.daySummary).toMatchObject({rating:5,abandoned:0});
});
it('acceptance without stock cannot reserve, score or substitute a different recipe',()=>{
 const r=shop(100,1);serve(r);time(r,57);expect(r.resolveBargain(true)).toBe(false);expect(r.tickets).toEqual([]);expect(r.reserved('dough')).toBe(0);expect(r.customerProgress.reputation).toBe(51);r.closeDay();expect(r.daySummary!.rating).toBe(5);
});
it('evaluates final bargain price and caps daily pre-ticket price rejection',()=>{
 const r=shop(140);time(r,60);expect(r.tickets).toEqual([]);expect(r.customerProgress).toMatchObject({reputation:47,priceRejections:3});expect(r.resolveBargain(true)).toBe(false);time(r,20);expect(r.customerProgress.reputation).toBe(47);r.closeDay();expect(r.daySummary!.rating).toBeNull();
 expect(r.openNextDay()).toBe(true);expect(r.customerProgress).toMatchObject({reputation:46,priceRejections:1});
 const b=shop(116);serve(b);time(b,57);expect(b.resolveBargain(true)).toBe(true);expect(b.tickets[b.tickets.length-1]).toMatchObject({kind:'bargain',finalPrice:52});
});
it('locks pricing after opening and captures ticket price unchanged',()=>{
 const r=shop(120);expect(r.tickets[0]!.finalPrice).toBe(60);r.prepareAgain();expect(r.setMenuPrice('cheese',100)).toBe(false);r.returnToOrders();serve(r);expect(r.lastResult).toMatchObject({price:60,stars:5,reputationDelta:1,relationshipDelta:1});
 expect(r.dispatch({type:'deliver',commandId:'deliver:cozy-1'})).toBe(false);expect(r.customerProgress.relationship).toBe(1);
});
it('relationship grows at most once per day; close-day referral snapshot survives duplicate close and next day',()=>{
 const r=shop();serve(r);time(r,17);serve(r,r.tickets[0]!.id);time(r,17);serve(r,r.tickets[0]!.id);time(r,17);r.resolveBargain(true);serve(r,r.tickets[0]!.id);time(r,17);serve(r,r.tickets[0]!.id);
 expect(r.customerProgress).toMatchObject({reputation:55,relationship:1});expect(r.events.filter(e=>e.includes('relationship:'))).toHaveLength(1);
 r.closeDay();r.openNextDay();serve(r);r.closeDay();expect(r.daySummary!.referral).toMatchObject({eligible:true,day:3});expect(r.customerProgress.relationship).toBe(2);const summary=r.daySummary;expect(r.closeDay()).toBe(false);expect(r.daySummary).toEqual(summary);
});
it.each([54,55])('publishes Day 3 eligibility exactly at final reputation %i through commercial public flow',target=>{
 const r=shop();serve(r);
 for(let i=1;i<3;i++){time(r,17);serve(r,r.tickets[0]!.id);}
 if(target===55){time(r,17);r.resolveBargain(true);serve(r,r.tickets[0]!.id);}
 r.closeDay();expect(r.customerProgress.referral).toBeNull();r.openNextDay();serve(r);r.closeDay();
 expect(r.daySummary!.reputation).toBe(target);expect(r.daySummary!.referral!.eligible).toBe(target===55);
 const flag=r.customerProgress.referral;r.closeDay();expect(r.customerProgress.referral).toEqual(flag);
 for(const id of ['dough','sauce','cheese'] as const)r.buy(id,2);r.openNextDay();serve(r);expect(r.customerProgress.relationship).toBe(3);expect(r.customerProgress.referral).toEqual(flag);
});
it('terminal public results expose actual reputation deltas at both clamp boundaries',()=>{
 const high=shop(100,19);
 for(let i=0;i<52;i++){
  if(!high.tickets.length){time(high,17);if(high.bargainPending)high.resolveBargain(true);}
  serve(high,high.tickets[0]!.id);
  if(high.owned('dough')===0&&i<51){high.closeDay();for(const id of ['dough','sauce','cheese'] as const)high.buy(id,19);high.openNextDay();}
 }
 expect(high.customerProgress.reputation).toBe(100);expect(high.lastResult!.reputationDelta).toBe(0);
 const low=shop();for(let i=0;i<40;i++){time(low,60);if(low.bargainPending)low.resolveBargain(false);}
 expect(low.customerProgress.reputation).toBe(0);expect(low.lastResult).toMatchObject({stars:1,price:0,reputationDelta:0});
});
it.each([116,118])('mushroom bargaining rounds original and final prices and checks final threshold at %i%%',percent=>{
 const r=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);for(const id of ['dough','sauce','cheese','mushroom'] as const)r.buy(id,8);
 r.selectRecipe('mushroom');expect(r.dispatch({type:'customer.price',recipe:'mushroom',percent})).toBe(true);
 expect(r.customerProgress.prices.mushroom).toBe(percent===116?75:77);r.openShop();serve(r);time(r,57);
 expect(r.bargainPending).toMatchObject({recipe:'mushroom',originalPrice:percent===116?75:77,finalPrice:percent===116?68:69});
 const cash=r.state.cash;
 if(percent===116){expect(r.resolveBargain(true)).toBe(true);const target=r.tickets.find(t=>t.kind==='bargain')!;serve(r,target.id);expect(r.state.cash).toBe(cash+68);expect(r.lastResult).toMatchObject({price:68,recipe:'mushroom'});expect(r.dispatch({type:'deliver',commandId:'deliver:'+target.id})).toBe(false);expect(r.state.cash).toBe(cash+68);}
 else {expect(r.resolveBargain(true)).toBe(false);expect(r.tickets.some(t=>t.kind==='bargain')).toBe(false);expect(r.state.cash).toBe(cash);expect(r.shopMessage).toContain('vượt mức');}
});
it('bargain freezes a heating oven and original patience, then resumes after decision',()=>{
 const r=shop();serve(r);time(r,55);r.selectTicket(r.tickets[0]!.id);
 for(const ingredient of recipeIngredients(r.selectedRecipe))r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});time(r,2);
 expect(r.bargainPending).not.toBeNull();expect(r.ovenState!.ovenSeconds).toBe(2);const remaining=r.selectedTicket!.remaining;
 time(r,100);expect(r.ovenState!.ovenSeconds).toBe(2);expect(r.selectedTicket!.remaining).toBe(remaining);
 r.resolveBargain(false);time(r,1);expect(r.ovenState!.ovenSeconds).toBe(3);expect(r.selectedTicket!.remaining).toBe(remaining-1);
});
it('closing pending Day 2 service settles reputation before referral and clears stale result',()=>{
 const r=shop();serve(r);for(let i=0;i<3;i++){time(r,17);if(r.bargainPending)r.resolveBargain(true);serve(r,r.tickets[0]!.id);}
 r.closeDay();expect(r.lastResult).toBeNull();r.openNextDay();serve(r);expect(r.customerProgress.reputation).toBe(55);time(r,17);
 expect(r.tickets).toHaveLength(1);expect(r.lastResult).not.toBeNull();r.closeDay();
 expect(r.lastResult).toBeNull();expect(r.daySummary).toMatchObject({reputation:53,referral:{eligible:false}});
 expect(r.daySummary!.reviews).toMatchObject([{outcome:'delivered',reputationDelta:1},{outcome:'closed',stars:1,reputationDelta:-2}]);
});
