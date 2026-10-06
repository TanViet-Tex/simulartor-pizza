import {describe,expect,it} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {recipeIngredients,recipePrice} from '../domain/CozyStock';
import {helpOfferEligible} from '../domain/HelpOffers';
import {threeDaySchedule} from '../config/cozySchedule';
const helpSeed=Array.from({length:1000},(_,seed)=>seed).find(helpOfferEligible)!;
const dayOne=threeDaySchedule(1,{regularDay1Stars:null,regularLatestStars:null,helpSucceeded:false,referral:false});
function time(r:CozyRuntime,seconds:number){for(let i=0;i<Math.round(seconds*20);i++)r.advance(50);}
function shop(quantity=10,eventSeed?:number,firstDayCount?:number){const r=new CozyRuntime(false,true,{eventSeed,...(firstDayCount?{schedule:(day:number,eligibility:Parameters<typeof threeDaySchedule>[1])=>day===1?{day,duration:180,grace:120,slots:Array.from({length:firstDayCount},(_,i)=>({id:'threshold-'+i,at:10+i*12,kind:'regular' as const,opportunity:'commercial' as const,commercialOrdinal:i+1,takeaway:false}))}:threeDaySchedule(day,eligibility)}:{}),resolveItems:(_slot,_menu,recipe)=>[{recipe,price:recipePrice(recipe),finishingSauces:[]}]});if(firstDayCount)r.claimTestCode('VIETVUIVE');for(const id of ['dough','sauce','cheese','mushroom'] as const)r.buy(id,quantity);r.openShop();return r;}
function serve(r:CozyRuntime,boxed=false){if(r.bargainPending)r.resolveBargain(true);r.selectTicket(r.tickets[0]!.id);for(const ingredient of recipeIngredients(r.selectedRecipe))r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});time(r,r.bakeTiming.perfectStart);r.dispatch({type:'extract'});if(boxed||r.selectedTicket?.takeaway)r.dispatch({type:'box'});expect(r.dispatch({type:'deliver'})).toBe(true);if(r.deliveryPending)r.confirmDelivery();if(r.bargainPending)r.resolveBargain(true);if(r.shopPhase==='delivered')r.continueShift();}
describe('production deterministic schedule',()=>{
  it('opens without an instant order and attempts the first appointment exactly at ten seconds',()=>{
    const r=shop();expect(r.tickets).toEqual([]);expect(r.shiftClock).toMatchObject({elapsed:0,duration:180,grace:120,total:20,attempted:0});
    expect(r.processArrival('day-1-slot-1')).toBe(false);time(r,9.95);expect(r.tickets).toEqual([]);time(r,.05);
    expect(r.tickets[0]).toMatchObject({kind:'regular',recipe:'cheese',remaining:120,takeaway:false});expect(r.reserved('dough')).toBe(0);
    expect(r.tickets).toHaveLength(1);expect(r.shiftClock.attempted).toBe(1);
    expect(r.processArrival('day-1-slot-1')).toBe(false);time(r,dayOne.slots[1].at-10-.05);expect(r.shiftClock.attempted).toBe(1);time(r,.05);expect(r.shiftClock.attempted).toBe(2);expect(r.tickets[1]).toMatchObject({kind:'hurry',takeaway:false});
  });
  it('attempts an occasional canonical burst in one simulation tick when the queue is empty',()=>{
    const burstAt=dayOne.slots.find((slot,i)=>i>0&&slot.at===dayOne.slots[i-1].at)!.at;
    const r=new CozyRuntime(false,true,{schedule:()=>({...dayOne,slots:dayOne.slots.filter(slot=>slot.at===burstAt)}),resolveItems:(_slot,_menu,recipe)=>[{recipe,price:recipePrice(recipe),finishingSauces:[]}]});
    r.openShop();time(r,burstAt-.05);expect(r.tickets).toEqual([]);time(r,.05);
    expect(r.tickets).toHaveLength(4);expect(r.shiftClock.attempted).toBe(4);
  });
  it('counts full-capacity misses once without a backlog and defers stock consumption to baking',()=>{
    const full=shop();time(full,dayOne.slots[3].at);expect(full.tickets).toHaveLength(4);expect(full.bargainPending).toBeNull();time(full,dayOne.slots[4].at-full.shiftClock.elapsed);
    expect(full.tickets).toHaveLength(4);expect(full.shiftClock.attempted).toBe(5);expect(full.processArrival('day-1-slot-5')).toBe(false);
    serve(full);expect(full.tickets).toHaveLength(3);expect(full.shiftClock.attempted).toBe(5);
    expect(full.processArrival('day-1-slot-5')).toBe(false);expect(full.tickets).toHaveLength(3);
    const short=shop(1);time(short,10);expect(short.tickets).toHaveLength(1);expect(short.shiftClock.attempted).toBe(1);expect(short.reserved('dough')).toBe(0);
    serve(short);time(short,10);expect(short.tickets).toHaveLength(1);expect(short.shiftClock.attempted).toBe(2);
    short.selectTicket(short.tickets[0].id);for(const ingredient of recipeIngredients(short.selectedRecipe))short.dispatch({type:'ingredient',ingredient});
    expect(short.dispatch({type:'bake'})).toBe(false);expect(short.reserved('dough')).toBe(0);
  });
  it('scores counter pizza without a box and still requires a box for the third commercial opportunity',()=>{
    const r=shop();time(r,10);serve(r);expect(r.lastResult).toMatchObject({stars:5,price:50});expect(r.lastResult!.reasons).not.toContain('Chưa đóng hộp');
    time(r,dayOne.slots[1].at-r.shiftClock.elapsed);serve(r);time(r,dayOne.slots[2].at-r.shiftClock.elapsed);expect(r.bargainPending).toBeNull();r.selectTicket(r.tickets[0].id);expect(r.selectedTicket?.takeaway).toBe(true);
    for(const ingredient of recipeIngredients(r.selectedRecipe))r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});time(r,r.bakeTiming.perfectStart);r.dispatch({type:'extract'});
    expect(r.dispatch({type:'deliver'})).toBe(true);expect(r.deliveryPending?.reasons.join(' ')).toContain('hộp');expect(r.confirmDelivery()).toBe(true);expect(r.lastResult!.stars).toBeLessThan(5);
  });
  it('freezes arrival, oven, patience and grace under every owned pause without catch-up',()=>{
    const r=shop();time(r,9.95);const user=r.acquirePause('user'),hidden=r.acquirePause('visibility');time(r,100);user.release();time(r,100);expect(r.shiftClock.elapsed).toBe(9.95);hidden.release();time(r,.05);expect(r.tickets).toHaveLength(1);
    for(const ingredient of recipeIngredients(r.selectedRecipe))r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});const lease=r.acquirePause('order'),clock=r.shiftClock,remaining=r.selectedTicket!.remaining;time(r,200);expect(r.shiftClock).toEqual(clock);expect(r.ovenState!.ovenSeconds).toBe(0);expect(r.selectedTicket!.remaining).toBe(remaining);lease.release();time(r,1);expect(r.ovenState!.ovenSeconds).toBe(1);
  });
  it('stops arrivals at shift end, freezes after grace and leaves settlement to explicit manual close',()=>{
    const r=shop();for(let i=0;i<180*20;i++){r.advance(50);if(r.bargainPending)r.resolveBargain(false);}
    expect(r.shiftClock).toMatchObject({phase:'grace',elapsed:180,remaining:120,attempted:20});expect(r.daySummary).toBeNull();const cash=r.state.cash;
    const lease=r.acquirePause('user');time(r,10);expect(r.shiftClock.remaining).toBe(120);lease.release();time(r,120);
    expect(r.shiftClock).toMatchObject({phase:'awaiting-close',elapsed:300,remaining:0});expect(r.tickets).toEqual([]);expect(r.reserved('dough')).toBe(0);expect(r.daySummary).toBeNull();time(r,10);expect(r.shiftClock.elapsed).toBe(300);expect(r.state.cash).toBe(cash);
    expect(r.closeDay()).toBe(true);expect(r.daySummary).toMatchObject({day:1,rent:20});
  });
  it('bounds the read-only event journal without changing order state',()=>{
    const r=shop();time(r,10);for(let i=0;i<220;i++)expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(true);
    expect(r.events).toHaveLength(200);expect(r.state.ingredients).toEqual([]);expect(r.reserved('dough')).toBe(0);
    (r.events as string[]).push('external');expect(r.events).toHaveLength(200);
  });
  it.each([54,55])('reserves the help hook and adds a day-three referral only at final reputation %i',target=>{
    const r=shop(10,helpSeed,target===55?5:4);time(r,10);serve(r);
    for(let i=1;i<(target===55?5:4);i++){time(r,10);serve(r);}
    r.closeDay();expect(r.openNextDay()).toBe(true);time(r,10);
    expect(r.tickets).toEqual([]);expect(r.bargainPending).toBeNull();expect(r.events).toContain('10.00:help-offered:day-2-slot-1');expect(r.shiftClock.attempted).toBe(1);expect(r.dispatch({type:'customer.help',accept:false})).toBe(true);
    r.closeDay();expect(r.daySummary!.referral?.eligible).toBe(target===55);expect(r.configureMenu('mushroom',100,false)).toBe(true);for(const id of ['dough','sauce','cheese'] as const)expect(r.buy(id,16)).toBe(true);expect(r.openNextDay()).toBe(true);
    while(r.shiftClock.elapsed<210){r.advance(50);if(r.tickets.length&&r.shiftClock.elapsed<200&&r.available('dough')>0)serve(r);if(r.bargainPending)r.resolveBargain(false);}
    const base=threeDaySchedule(3,{regularDay1Stars:null,regularLatestStars:null,helpSucceeded:false,referral:false,customerSeed:helpSeed}).slots.length;
    expect(r.shiftClock.total).toBe(base+(target===55?1:0));expect(r.shiftClock.attempted).toBeLessThanOrEqual(r.shiftClock.total);
    const referralArrival=r.events.find(event=>event.startsWith('210.00:arrived:day-3-referral:'));
    if(target===54)expect(referralArrival).toBeUndefined();if(referralArrival)expect(r.tickets.some(t=>t.id===referralArrival.split(':').slice(-1)[0])).toBe(true);expect(r.processArrival('day-3-referral')).toBe(false);
  });
});
