import {expect,it} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {ORDER_TEST_SCHEDULE} from './cozyScheduleFixture';
import {recipeIngredients,CozyStock} from '../domain/CozyStock';
function time(r:CozyRuntime,s:number){for(let i=0;i<Math.round(s*20);i++)r.advance(50);}
function serve(r:CozyRuntime){if(r.bargainPending)r.resolveBargain(true);for(const ingredient of recipeIngredients(r.selectedRecipe))r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});time(r,3);r.dispatch({type:'extract'});r.dispatch({type:'box'});const id=r.selectedTicketId;expect(r.dispatch({type:'deliver',commandId:'serve-'+id})).toBe(true);if(r.shopPhase==='delivered')r.continueShift();return id;}
function shop(q=4){const r=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);for(const id of ['dough','sauce','cheese'] as const)r.buy(id,q);r.openShop();return r;}
it('separates goal cash from sales/profit and unlocks sausage only in next-day preparation',()=>{
  const r=shop();for(let i=0;i<4;i++){serve(r);if(i<3)time(r,17);}
  expect(r.progression).toMatchObject({xp:60,level:2,unlockDay:2,cheeseSales:4});expect(r.buy('sausage',1)).toBe(false);r.closeDay();
  const closed=r.daySummary!;expect(closed).toMatchObject({revenue:195,rewards:20,profit:115,cash:435,goal:{status:'completed'},progression:{xp:70}});
  expect(closed.accounts.endingCash).toBe(closed.accounts.startingCash+closed.revenue+closed.rewards-closed.purchases-closed.rent);
  expect(r.availableRecipes).toContain('sausage');expect(r.buy('sausage',1)).toBe(true);for(const id of ['dough','sauce','cheese'] as const)r.buy(id,1);
  expect(r.dispatch({type:'menu.configure',recipe:'sausage',percent:100,enabled:true})).toBe(true);expect(r.daySummary).toEqual(closed);
  expect(r.openNextDay()).toBe(true);expect(r.selectedTicket?.recipe).toBe('sausage');serve(r);r.closeDay();
  expect(r.daySummary).toMatchObject({day:2,rewards:0,cost:28,goal:{status:'expired'}});expect(r.progression.xp).toBe(85);
});
it('mission reward and XP apply once and remain separate from sale review reputation',()=>{
  const r=shop(8);for(let i=0;i<8;i++){const id=serve(r);expect(r.dispatch({type:'deliver',targetId:id,commandId:'repeat-'+id})).toBe(false);if(i<7)time(r,17);}
  expect(r.progression).toMatchObject({cheeseSales:8,mission:'completed',xp:140});expect(r.customerProgress.reputation).toBe(60);expect(r.lastResult).toMatchObject({rewardCoins:30,rewardReputation:2,xpDelta:35});
  r.closeDay();expect(r.daySummary).toMatchObject({rewards:50,progression:{xp:150},goal:{status:'completed'}});const cash=r.state.cash;r.closeDay();expect(r.state.cash).toBe(cash);
});
it('rejects empty menu, locked recipe and paused changes without partial mutation',()=>{
  const r=new CozyRuntime(false,true);expect(r.configureMenu('sausage',100,true)).toBe(false);expect(r.buy('sausage',1)).toBe(false);expect(r.selectRecipe('sausage')).toBe(false);
  expect(r.configureMenu('mushroom',100,false)).toBe(true);const menu=r.menuRecipes,prices=r.customerProgress.prices;
  expect(r.configureMenu('cheese',120,false)).toBe(false);expect(r.menuRecipes).toEqual(menu);expect(r.customerProgress.prices).toEqual(prices);
  const lease=r.acquirePause('visibility');expect(r.configureMenu('cheese',110,true)).toBe(false);expect(r.buy('dough',1)).toBe(false);lease.release();
  for(const id of ['dough','sauce','cheese'] as const)r.buy(id,3);r.openShop();time(r,60);expect(r.bargainPending?.recipe).toBe('cheese');expect(r.configureMenu('cheese',110,true)).toBe(false);
});
it('default generator skips omitted recipes and never requests the locked sausage',()=>{
  const r=new CozyRuntime(false,true);r.configureMenu('cheese',100,false);for(const id of ['dough','sauce','cheese','mushroom'] as const)r.buy(id,2);r.openShop();time(r,10);expect(r.tickets).toEqual([]);time(r,25);expect(r.tickets[0].recipe).toBe('mushroom');
  expect(r.eligibleMenuRecipes()).toEqual(['mushroom']);expect(r.availableRecipes).not.toContain('sausage');
});
it('sausage lots carry real dated prices, four-part recipe and same-day expiration',()=>{
  const s=new CozyStock();for(const id of ['dough','sauce','cheese','sausage'] as const)s.buy(id,2,2);
  expect(s.reserve('A','sausage',100,2)).toBe(true);expect(s.commit('A',recipeIngredients('sausage'),2)).toBe(true);
  expect(s.ledger(2)).toEqual({purchases:56,consumed:28});expect(s.settle(2)).toEqual({expired:11,rent:20});expect(s.inventorySnapshot().value).toBe(17);
});
it('timeouts, practice and replay before close cannot retain commercial XP/rewards',()=>{
  const r=shop(1);time(r,120);expect(r.progression.xp).toBe(0);expect(r.progression.cheeseSales).toBe(0);
  const sold=shop(1);serve(sold);expect(sold.progression.xp).toBe(15);expect(sold.dispatch({type:'reset'})).toBe(true);expect(sold.progression).toMatchObject({xp:0,cheeseSales:0,claims:[]});
  const tutorial=new CozyRuntime(true,true);expect(tutorial.progression.xp).toBe(0);expect(tutorial.configureMenu('mushroom',100,false)).toBe(false);
});
it('completes the mission across canonical days and attributes its reward only to day two',()=>{
  const r=new CozyRuntime(false,true);r.configureMenu('mushroom',100,false);
  for(const id of ['dough','sauce','cheese'] as const)r.buy(id,6);r.openShop();
  for(const at of [10,35,60,85,110,135]){time(r,at-r.shiftClock.elapsed);serve(r);}
  expect(r.progression).toMatchObject({xp:90,cheeseSales:6,mission:'active'});r.closeDay();const day1=r.daySummary!;
  expect(day1).toMatchObject({rewards:20,progression:{xp:100},goal:{status:'completed'}});
  r.configureMenu('sausage',100,false);for(const id of ['dough','sauce','cheese'] as const)r.buy(id,2);r.openNextDay();
  time(r,10);r.dispatch({type:'customer.help',accept:false});time(r,22);serve(r);time(r,54-r.shiftClock.elapsed);serve(r);
  expect(r.progression).toMatchObject({xp:150,cheeseSales:8,mission:'completed'});expect(r.lastResult).toMatchObject({rewardCoins:30,rewardReputation:2,xpDelta:35});
  expect(day1.progression.cheeseSales).toBe(6);expect(day1.rewards).toBe(20);r.closeDay();expect(r.daySummary).toMatchObject({day:2,revenue:100,rewards:30,goal:{status:'expired'}});
  for(const id of ['dough','sauce','cheese'] as const)r.buy(id,1);r.openNextDay();time(r,10);serve(r);r.closeDay();
  expect(r.daySummary).toMatchObject({day:3,rewards:0,progression:{xp:165,cheeseSales:9,mission:'completed'}});expect(r.progression.claims.filter(id=>id==='mission.cheese-8')).toHaveLength(1);
});
it('permits a cheaper unlocked menu after close rather than locking a viable campaign',()=>{
  const r=new CozyRuntime(false,true);r.configureMenu('cheese',100,false);for(const id of ['dough','sauce','cheese'] as const)r.buy(id,1);r.buy('mushroom',49);r.openShop();time(r,35);
  for(const ingredient of recipeIngredients('mushroom'))r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});r.closeDay();
  expect(r.daySummary).toMatchObject({cash:20,ending:null});expect(r.configureMenu('cheese',100,true)).toBe(true);
  for(const id of ['dough','sauce','cheese'] as const)expect(r.buy(id,1)).toBe(true);expect(r.openNextDay()).toBe(true);
});
it('checks bargain stock for the requested recipe when preparation chose mushroom',()=>{
  const r=new CozyRuntime(false,true);r.selectRecipe('mushroom');for(const id of ['dough','sauce','cheese'] as const)r.buy(id,5);r.buy('mushroom',1);r.openShop();
  for(const at of [10,35,60,85]){time(r,at-r.shiftClock.elapsed);serve(r);}time(r,110-r.shiftClock.elapsed);
  expect(r.bargainPending?.recipe).toBe('cheese');expect(r.missingReason).toContain('Nấm');expect(r.missingRecipeReason('cheese')).toBe('');expect(r.resolveBargain(true)).toBe(true);
});
