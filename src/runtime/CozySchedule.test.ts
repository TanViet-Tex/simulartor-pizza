import {describe,expect,it} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {threeDaySchedule} from '../config/cozySchedule';
import {deliverySchedule} from '../config/deliveryEvents';
import {recipeIngredients,recipePrice} from '../domain/CozyStock';

const eligibility={regularDay1Stars:null,regularLatestStars:null,helpSucceeded:false,referral:false};
function time(r:CozyRuntime,seconds:number){for(let i=0;i<Math.round(seconds*20);i++)r.advance(50);}
function shop(){const r=new CozyRuntime(false,true,{eventSeed:2718,resolveItems:(_slot,_menu,recipe)=>[{recipe,price:recipePrice(recipe),finishingSauces:[]}]});for(const id of ['dough','sauce','cheese','mushroom'] as const)r.buy(id,4);expect(r.openShop()).toBe(true);return r;}
function dayRuntime(day:number,app=false){const r=new CozyRuntime(false,true,{eventSeed:2718});r.claimTestCode('VIETVUIVE');for(let d=1;d<day;d++){expect(d===1?r.openShop():r.openNextDay()).toBe(true);expect(r.closeDay()).toBe(true);}if(app)expect(r.configureDeliveryApp(true,'app')).toBe(true);expect(day===1?r.openShop():r.openNextDay()).toBe(true);return r;}

describe('opening hours and seeded customer budget',()=>{
  it('prepares from 08:50 to 09:00 in exactly five seconds without spending selling time or customer patience',()=>{
    const r=shop();expect(r.shiftClock).toMatchObject({phase:'preparing',displayTime:'08:50',elapsed:0,remaining:5,attempted:0});
    expect(r.processArrival('day-1-slot-1')).toBe(false);
    time(r,4.95);expect(r.shiftClock).toMatchObject({phase:'preparing',displayTime:'08:59',elapsed:0,attempted:0});expect(r.shiftClock.remaining).toBeCloseTo(.05,8);expect(r.tickets).toEqual([]);
    time(r,.05);expect(r.shiftClock).toMatchObject({phase:'serving',displayTime:'09:00',elapsed:0,remaining:180,attempted:1});
    expect(r.tickets[0]).toMatchObject({kind:'regular',remaining:120,takeaway:false});
    expect(r.processArrival('day-1-slot-1')).toBe(false);
    time(r,1);expect(r.tickets[0].remaining).toBe(119);expect(r.shiftClock.elapsed).toBe(1);
  });

  it('freezes preparation, display clock, selling time, oven and grace under nested owned pause leases',()=>{
    const r=shop();time(r,2);const clock=r.shiftClock,user=r.acquirePause('user'),menu=r.acquirePause('menu');time(r,20);expect(r.shiftClock).toEqual(clock);
    user.release();time(r,20);expect(r.shiftClock).toEqual(clock);menu.release();time(r,3);expect(r.shiftClock.displayTime).toBe('09:00');
    for(const ingredient of recipeIngredients(r.selectedRecipe))r.dispatch({type:'ingredient',ingredient});expect(r.dispatch({type:'bake'})).toBe(true);
    const serving=r.shiftClock,remaining=r.tickets[0].remaining,paused=r.acquirePause('user');time(r,100);expect(r.shiftClock).toEqual(serving);expect(r.tickets[0].remaining).toBe(remaining);expect(r.ovenState!.ovenSeconds).toBe(0);paused.release();time(r,1);expect(r.ovenState!.ovenSeconds).toBe(1);
    time(r,179);expect(r.shiftClock).toMatchObject({phase:'grace',displayTime:'21:00',remaining:120});const grace=r.shiftClock,lease=r.acquirePause('user');time(r,30);expect(r.shiftClock).toEqual(grace);lease.release();time(r,1);expect(r.shiftClock.remaining).toBe(119);
  });

  it.each([1,2,5,6,10,11,20,21,30])('maps day %i selling duration to 09:00–21:00 and stops all new opportunities at closing',day=>{
    const r=dayRuntime(day,day>=5),schedule=deliverySchedule(threeDaySchedule(day,{...eligibility,customerSeed:2718}),day>=5);
    expect(r.shiftClock.duration).toBe(schedule.duration);expect(r.tickets).toEqual([]);time(r,5);
    expect(r.shiftClock).toMatchObject({displayTime:'09:00',elapsed:0,attempted:1});
    time(r,schedule.duration/2);expect(r.shiftClock.displayTime).toBe('15:00');
    time(r,schedule.duration/2-.05);expect(r.shiftClock.displayTime).toBe('20:59');time(r,.05);
    expect(r.shiftClock).toMatchObject({phase:'grace',displayTime:'21:00',elapsed:schedule.duration,remaining:120,attempted:schedule.slots.length});
    const attempted=r.shiftClock.attempted;expect(r.processArrival(schedule.slots[schedule.slots.length-1].id)).toBe(false);time(r,120);
    expect(r.shiftClock).toMatchObject({phase:'awaiting-close',displayTime:'21:00',elapsed:schedule.duration+120,remaining:0,attempted});expect(r.tickets).toEqual([]);
    const cash=r.state.cash;time(r,5);expect(r.shiftClock.elapsed).toBe(schedule.duration+120);expect(r.state.cash).toBe(cash);
  });

  it('still delivers express stock after five simulation seconds during preparation',()=>{
    const r=shop();expect(r.orderExpress('dough',1,'prep-express')).toBe(true);const before=r.available('dough');time(r,4.95);expect(r.available('dough')).toBe(before);expect(r.tickets).toEqual([]);time(r,.05);expect(r.available('dough')).toBe(before+1);expect(r.tickets[0].remaining).toBe(120);
  });

  it('consumes full-queue misses once without spending stock or keeping an arrival backlog',()=>{
    const r=shop(),schedule=threeDaySchedule(1,{...eligibility,customerSeed:2718});time(r,5);
    while(r.shiftClock.attempted<6)r.advance(50);
    const attempted=r.shiftClock.attempted;expect(r.tickets.length).toBeLessThanOrEqual(4);expect(r.available('dough')).toBe(4);expect(r.reserved('dough')).toBe(0);
    expect(r.processArrival(schedule.slots[attempted-1].id)).toBe(false);expect(r.shiftClock.attempted).toBe(attempted);expect(r.available('dough')).toBe(4);
  });

  it('keeps the event journal bounded and read-only during the new opening clock',()=>{
    const r=shop();time(r,5);for(let i=0;i<220;i++)expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(true);
    expect(r.events).toHaveLength(200);expect(r.state.ingredients).toEqual([]);expect(r.reserved('dough')).toBe(0);(r.events as string[]).push('external');expect(r.events).toHaveLength(200);
  });

  it('keeps counter payment and the third commercial order box requirement under the new schedule',()=>{
    const r=shop(),schedule=threeDaySchedule(1,{...eligibility,customerSeed:2718});time(r,5);const cash=r.state.cash;
    const cook=()=>{for(const ingredient of recipeIngredients(r.selectedRecipe))r.dispatch({type:'ingredient',ingredient});expect(r.dispatch({type:'bake'})).toBe(true);time(r,r.bakeTiming.perfectStart);expect(r.dispatch({type:'extract'})).toBe(true);};
    cook();expect(r.dispatch({type:'deliver'})).toBe(true);expect(r.lastResult).toMatchObject({stars:5,price:50});expect(r.state.cash).toBe(cash+50);r.continueShift();
    time(r,schedule.slots[1].at-r.shiftClock.elapsed);r.selectTicket(r.tickets[0].id);cook();expect(r.dispatch({type:'deliver'})).toBe(true);r.continueShift();
    time(r,schedule.slots[2].at-r.shiftClock.elapsed);r.selectTicket(r.tickets[0].id);expect(r.selectedTicket?.takeaway).toBe(true);cook();expect(r.dispatch({type:'deliver'})).toBe(true);expect(r.deliveryPending?.reasons.join(' ')).toContain('hộp');expect(r.confirmDelivery()).toBe(true);expect(r.lastResult!.stars).toBeLessThan(5);
  });

  it('uses identical seeded arrivals after restoring a checkpoint without changing progress or stock',()=>{
    const r=new CozyRuntime(false,true,{eventSeed:2718});r.buy('dough',2,'stock');const checkpoint=r.exportCheckpoint(),restored=CozyRuntime.restoreCheckpoint(checkpoint)!;
    expect(restored.exportCheckpoint()).toEqual(checkpoint);expect(restored.marketForecast).toEqual(r.marketForecast);
    expect(r.openShop()).toBe(true);expect(restored.openShop()).toBe(true);expect(restored.shiftClock).toEqual(r.shiftClock);time(r,5);time(restored,5);expect(restored.tickets).toEqual(r.tickets);
  });

  it('only increases capacity when upgrading from four to six',()=>{
    const base=new CozyRuntime(false,true,{eventSeed:2718}),upgraded=new CozyRuntime(false,true,{eventSeed:2718});upgraded.claimTestCode('VIETVUIVE');expect(upgraded.upgradeShop('queue','queue')).toBe(true);
    expect(upgraded.queueCapacity).toBe(6);expect(base.queueCapacity).toBe(4);expect(upgraded.marketForecast.portions).toEqual(base.marketForecast.portions);
    base.openShop();upgraded.openShop();expect(upgraded.shiftClock.total).toBe(base.shiftClock.total);
    const schedule=threeDaySchedule(1,{...eligibility,customerSeed:2718});const burst=schedule.slots.find((s,i)=>i>0&&s.at===schedule.slots[i-1].at)!.at;
    time(base,5+burst);time(upgraded,5+burst);expect(upgraded.shiftClock.attempted).toBe(base.shiftClock.attempted);
  });
});
