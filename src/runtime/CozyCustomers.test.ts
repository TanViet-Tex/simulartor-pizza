import {expect,it} from 'vitest';
import {CozyRuntime,type CozyScheduleDependencies} from './CozyRuntime';
import {recipeIngredients} from '../domain/CozyStock';
// Ordinary-only service fixtures isolate reputation and relationships from arrival budgets.
const deps=(kind:'regular'|'bargain'='regular'):CozyScheduleDependencies=>({eventRoll:()=>1,vipRoll:()=>1,schedule:day=>({day,duration:16000,grace:120,slots:Array.from({length:800},(_,i)=>({id:'arrival-'+i,at:i*20,kind,opportunity:'commercial' as const,commercialOrdinal:i+1,takeaway:true}))}),resolveRecipe:(_slot,_enabled,selected)=>selected});
function time(r:CozyRuntime,n:number){for(let i=0;i<n*20;i++)r.advance(50);}
function shop(percent=100,quantity=8,kind:'regular'|'bargain'='regular'){const r=new CozyRuntime(false,true,deps(kind));for(const id of ['dough','sauce','cheese'] as const)r.buy(id,quantity);r.setMenuPrice('cheese',percent);r.openShop();return r;}
function cook(r:CozyRuntime){for(const ingredient of recipeIngredients(r.selectedRecipe))expect(r.dispatch({type:'ingredient',ingredient}),JSON.stringify({ingredient,stock:r.owned(ingredient),pauses:r.pauses,phase:r.shopPhase,selected:r.selectedTicketId,owner:r.productionOwnerId})).toBe(true);expect(r.dispatch({type:'bake'})).toBe(true);time(r,r.bakeTiming.perfectStart);expect(r.dispatch({type:'extract'})).toBe(true);expect(r.dispatch({type:'box'})).toBe(true);}
function serve(r:CozyRuntime){r.resolveLottery(0);if(r.thanksPending)r.dismissThanks();cook(r);const id=r.selectedTicketId;expect(r.dispatch({type:'deliver',commandId:'serve-'+id})).toBe(true);if(r.bargainPending)expect(r.resolveBargain(true)).toBe(true);if(r.shopPhase==='delivered')r.continueShift();return id;}
it('bargain starts patience on arrival, reserves only at bake, and owns only its delivery lease',()=>{
 const r=shop(100,8,'bargain');expect(r.selectedTicket).toMatchObject({kind:'bargain',remaining:110,finalPrice:50});expect(r.reserved('dough')).toBe(0);expect(r.bargainPending).toBeNull();cook(r);r.dispatch({type:'deliver',commandId:'discount'});
 expect(r.bargainPending).toMatchObject({originalPrice:50,finalPrice:45});const snapshot=r.tickets;time(r,200);expect(r.tickets).toEqual(snapshot);
 const visibility=r.acquirePause('visibility'),user=r.acquirePause('user');expect(r.resolveBargain(true)).toBe(false);visibility.release();expect(r.resolveBargain(false)).toBe(false);user.release();
 const sameReason=r.acquirePause('bargain');expect(r.resolveBargain(true)).toBe(true);expect(r.pauses).toEqual(['bargain']);sameReason.release();expect(r.pauses).toEqual([]);expect(r.lastResult).toMatchObject({price:45,stars:5});expect(r.resolveBargain(true)).toBe(false);
});
it('declining a cooked bargain records its full payment and poor review once',()=>{
 const r=shop(100,1,'bargain');cook(r);const cash=r.state.cash;r.dispatch({type:'deliver',commandId:'declined'});expect(r.resolveBargain(false)).toBe(true);expect(r.resolveBargain(false)).toBe(false);expect(r.state.cash).toBe(cash+50);expect(r.lastResult).toMatchObject({stars:2,reputationDelta:-2});r.closeDay();expect(r.daySummary).toMatchObject({rating:2,abandoned:0});
});
it('a bargain without stock keeps its requested recipe but cannot bake, score or settle',()=>{
 const r=shop(100,0,'bargain');expect(r.selectedTicket?.recipe).toBe('cheese');expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(false);expect(r.dispatch({type:'bake'})).toBe(false);expect(r.resolveBargain(true)).toBe(false);expect(r.reserved('dough')).toBe(0);expect(r.lastResult).toBeNull();expect(r.customerProgress.reputation).toBe(50);
});
it('evaluates discounted bargain price before admission and caps daily price rejection',()=>{
 const r=shop(140);time(r,60);expect(r.tickets).toEqual([]);expect(r.customerProgress).toMatchObject({reputation:47,priceRejections:3});expect(r.resolveBargain(true)).toBe(false);time(r,20);expect(r.customerProgress.reputation).toBe(47);r.closeDay();expect(r.daySummary!.rating).toBeNull();expect(r.openNextDay()).toBe(true);expect(r.customerProgress).toMatchObject({reputation:46,priceRejections:1});
 const b=shop(116,1,'bargain');expect(b.selectedTicket?.finalPrice).toBe(58);serve(b);expect(b.lastResult).toMatchObject({price:52});
});
it('locks pricing after opening and captures ticket price unchanged',()=>{
 const r=shop(120);expect(r.tickets[0]!.finalPrice).toBe(60);r.prepareAgain();expect(r.setMenuPrice('cheese',100)).toBe(false);r.returnToOrders();const id=serve(r);expect(r.lastResult).toMatchObject({price:60,stars:5,reputationDelta:1,relationshipDelta:1});expect(r.dispatch({type:'deliver',commandId:'serve-'+id})).toBe(false);expect(r.customerProgress.relationship).toBe(1);
});
it('relationship grows at most once per day; referral snapshot survives duplicate close and next day',()=>{
 const r=shop();for(let i=0;i<5;i++){serve(r);if(i<4)time(r,14);}expect(r.customerProgress).toMatchObject({reputation:55,relationship:1});expect(r.events.filter(e=>e.includes('relationship:'))).toHaveLength(1);r.closeDay();r.openNextDay();serve(r);r.closeDay();expect(r.daySummary!.referral).toMatchObject({eligible:true,day:3});expect(r.customerProgress.relationship).toBe(2);const summary=r.daySummary;expect(r.closeDay()).toBe(false);expect(r.daySummary).toEqual(summary);
});
it.each([54,55])('publishes Day 3 eligibility exactly at final reputation %i through commercial flow',target=>{
 const r=shop();for(let i=0;i<target-51;i++){serve(r);if(i<target-52)time(r,14);}r.closeDay();expect(r.customerProgress.referral).toBeNull();r.openNextDay();serve(r);r.closeDay();expect(r.daySummary!.reputation).toBe(target);expect(r.daySummary!.referral!.eligible).toBe(target===55);const flag=r.customerProgress.referral;r.closeDay();expect(r.customerProgress.referral).toEqual(flag);for(const id of ['dough','sauce','cheese'] as const)r.buy(id,2);r.openNextDay();serve(r);expect(r.customerProgress.relationship).toBe(3);expect(r.customerProgress.referral).toEqual(flag);
});
it('terminal public results expose actual reputation deltas at both clamp boundaries',()=>{
 const high=shop(100,19);for(let i=0;i<52;i++){if(i>0&&i%19!==0)time(high,14);serve(high);if((i+1)%19===0){high.closeDay();for(const id of ['dough','sauce','cheese'] as const)high.buy(id,19);high.openNextDay();}}expect(high.customerProgress.reputation).toBe(100);expect(high.lastResult!.reputationDelta).toBe(0);
 const low=shop();time(low,4000);expect(low.customerProgress.reputation).toBe(0);expect(low.lastResult).toMatchObject({stars:1,price:0,reputationDelta:0});
});
it.each([116,118])('mushroom bargain rounds prices and checks final threshold at %i percent',percent=>{
 const r=new CozyRuntime(false,true,deps('bargain'));for(const id of ['dough','sauce','cheese','mushroom'] as const)r.buy(id,2);r.selectRecipe('mushroom');r.setMenuPrice('mushroom',percent);expect(r.customerProgress.prices.mushroom).toBe(percent===116?75:77);r.openShop();
 if(percent===116){cook(r);const cash=r.state.cash,id=r.selectedTicketId;r.dispatch({type:'deliver',commandId:'rounded'});expect(r.bargainPending).toMatchObject({recipe:'mushroom',originalPrice:75,finalPrice:68});expect(r.resolveBargain(true)).toBe(true);expect(r.state.cash).toBe(cash+68);expect(r.lastResult).toMatchObject({price:68,recipe:'mushroom'});expect(r.dispatch({type:'deliver',targetId:id,commandId:'rounded'})).toBe(false);expect(r.state.cash).toBe(cash+68);}
 else {expect(r.tickets).toEqual([]);expect(r.bargainPending).toBeNull();expect(r.resolveBargain(true)).toBe(false);expect(r.shopMessage).toContain('vượt mức');}
});
it('bargain freezes original patience after cooking, then resumes the next arrival after decision',()=>{
 const r=shop(100,2,'bargain');cook(r);expect(r.ovenOwner).toBeNull();r.dispatch({type:'deliver',commandId:'paused'});const remaining=r.selectedTicket!.remaining;time(r,100);expect(r.selectedTicket!.remaining).toBe(remaining);expect(r.shiftClock.elapsed).toBe(6);r.resolveBargain(false);r.continueShift();time(r,14);expect(r.tickets).toHaveLength(1);expect(r.selectedTicket?.remaining).toBe(110);
});
it('closing pending Day 2 service settles reputation before referral and clears stale result',()=>{
 const r=shop();for(let i=0;i<4;i++){serve(r);if(i<3)time(r,14);}r.closeDay();expect(r.lastResult).toBeNull();r.openNextDay();serve(r);expect(r.customerProgress.reputation).toBe(55);time(r,14);expect(r.tickets).toHaveLength(1);expect(r.lastResult).not.toBeNull();r.closeDay();expect(r.lastResult).toBeNull();expect(r.daySummary).toMatchObject({reputation:53,referral:{eligible:false}});expect(r.daySummary!.reviews).toMatchObject([{outcome:'delivered',reputationDelta:1},{outcome:'closed',stars:1,reputationDelta:-2}]);
});
