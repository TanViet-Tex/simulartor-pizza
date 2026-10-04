import {describe,expect,it} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {recipeIngredients} from '../domain/CozyStock';
function time(r:CozyRuntime,seconds:number){for(let i=0;i<Math.round(seconds*20);i++)r.advance(50);}
function shop(quantity=10){const r=new CozyRuntime(false,true);for(const id of ['dough','sauce','cheese','mushroom'] as const)r.buy(id,quantity);r.openShop();return r;}
function serve(r:CozyRuntime,boxed=false){if(r.bargainPending)r.resolveBargain(true);r.selectTicket(r.tickets[0]!.id);for(const ingredient of recipeIngredients(r.selectedRecipe))r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});time(r,3);r.dispatch({type:'extract'});if(boxed||r.selectedTicket?.takeaway)r.dispatch({type:'box'});expect(r.dispatch({type:'deliver'})).toBe(true);if(r.deliveryPending)r.confirmDelivery();if(r.shopPhase==='delivered')r.continueShift();}
describe('production deterministic schedule',()=>{
  it('opens without an instant order and attempts the first appointment exactly at ten seconds',()=>{
    const r=shop();expect(r.tickets).toEqual([]);expect(r.shiftClock).toMatchObject({elapsed:0,duration:180,grace:120,total:6,attempted:0});
    expect(r.processArrival('day-1-slot-1')).toBe(false);time(r,9.95);expect(r.tickets).toEqual([]);time(r,.05);
    expect(r.tickets[0]).toMatchObject({kind:'regular',recipe:'cheese',remaining:120,takeaway:false});expect(r.reserved('dough')).toBe(1);
    expect(r.processArrival('day-1-slot-1')).toBe(false);time(r,24.95);expect(r.tickets).toHaveLength(1);time(r,.05);expect(r.tickets[1]).toMatchObject({kind:'picky',takeaway:false});
  });
  it('counts full-capacity and stock misses once without a backlog or commercial replacement',()=>{
    const full=shop();time(full,60);expect(full.bargainPending).toMatchObject({takeaway:true});full.resolveBargain(true);time(full,25);
    expect(full.tickets).toHaveLength(3);expect(full.shiftClock.attempted).toBe(4);expect(full.processArrival('day-1-slot-4')).toBe(false);
    serve(full);expect(full.tickets).toHaveLength(2);expect(full.shiftClock.attempted).toBe(4);
    const short=shop(1);time(short,35);expect(short.tickets).toHaveLength(1);expect(short.shiftClock.attempted).toBe(2);expect(short.reserved('dough')).toBe(1);
    serve(short);time(short,22);expect(short.tickets).toHaveLength(0);expect(short.shiftClock.attempted).toBe(3);
    short.resolveBargain(true);expect(short.tickets).toEqual([]);expect(short.reserved('dough')).toBe(0);
  });
  it('scores counter pizza without a box and still requires a box for the third commercial opportunity',()=>{
    const r=shop();time(r,10);serve(r);expect(r.lastResult).toMatchObject({stars:5,price:50});expect(r.lastResult!.reasons).not.toContain('Chưa đóng hộp');
    time(r,22);serve(r);time(r,22);expect(r.bargainPending?.takeaway).toBe(true);r.resolveBargain(true);
    for(const ingredient of recipeIngredients(r.selectedRecipe))r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});time(r,3);r.dispatch({type:'extract'});
    expect(r.dispatch({type:'deliver'})).toBe(true);expect(r.deliveryPending?.reasons.join(' ')).toContain('hộp');expect(r.confirmDelivery()).toBe(true);expect(r.lastResult!.stars).toBeLessThan(5);
  });
  it('freezes arrival, oven, patience and grace under every owned pause without catch-up',()=>{
    const r=shop();time(r,9.95);const user=r.acquirePause('user'),hidden=r.acquirePause('visibility');time(r,100);user.release();time(r,100);expect(r.shiftClock.elapsed).toBe(9.95);hidden.release();time(r,.05);expect(r.tickets).toHaveLength(1);
    for(const ingredient of recipeIngredients(r.selectedRecipe))r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});const lease=r.acquirePause('order'),clock=r.shiftClock,remaining=r.selectedTicket!.remaining;time(r,200);expect(r.shiftClock).toEqual(clock);expect(r.ovenState!.ovenSeconds).toBe(0);expect(r.selectedTicket!.remaining).toBe(remaining);lease.release();time(r,1);expect(r.ovenState!.ovenSeconds).toBe(1);
  });
  it('stops arrivals at shift end, freezes after grace and leaves settlement to explicit manual close',()=>{
    const r=shop();for(let i=0;i<180*20;i++){r.advance(50);if(r.bargainPending)r.resolveBargain(false);}
    expect(r.shiftClock).toMatchObject({phase:'grace',elapsed:180,remaining:120,attempted:6});expect(r.daySummary).toBeNull();const cash=r.state.cash;
    const lease=r.acquirePause('user');time(r,10);expect(r.shiftClock.remaining).toBe(120);lease.release();time(r,120);
    expect(r.shiftClock).toMatchObject({phase:'awaiting-close',elapsed:300,remaining:0});expect(r.tickets).toEqual([]);expect(r.reserved('dough')).toBe(0);expect(r.daySummary).toBeNull();time(r,10);expect(r.shiftClock.elapsed).toBe(300);expect(r.state.cash).toBe(cash);
    expect(r.closeDay()).toBe(true);expect(r.daySummary).toMatchObject({day:1,rent:20});
  });
  it('bounds the read-only event journal without changing order state',()=>{
    const r=shop();time(r,10);for(let i=0;i<220;i++)expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(true);
    expect(r.events).toHaveLength(200);expect(r.state.ingredients).toEqual([]);expect(r.reserved('dough')).toBe(1);
    (r.events as string[]).push('external');expect(r.events).toHaveLength(200);
  });
  it.each([54,55])('reserves the help hook and adds a day-three referral only at final reputation %i',target=>{
    const r=shop();time(r,10);serve(r);
    for(let i=1;i<(target===55?5:4);i++){time(r,22);serve(r);}
    r.closeDay();expect(r.openNextDay()).toBe(true);time(r,10);
    expect(r.tickets).toEqual([]);expect(r.bargainPending).toBeNull();expect(r.events).toContain('10.00:help-offered:day-2-slot-1');expect(r.shiftClock.attempted).toBe(1);expect(r.dispatch({type:'customer.help',accept:false})).toBe(true);
    r.closeDay();expect(r.daySummary!.referral?.eligible).toBe(target===55);for(const id of ['dough','sauce','cheese'] as const)r.buy(id,10);expect(r.openNextDay()).toBe(true);
    for(let i=0;i<210*20;i++){r.advance(50);if(r.bargainPending)r.resolveBargain(false);}
    expect(r.shiftClock.total).toBe(target===55?11:10);expect(r.shiftClock.attempted).toBe(target===55?11:10);
    expect(r.tickets.some(t=>t.name==='Khách giới thiệu')).toBe(target===55);expect(r.processArrival('day-3-referral')).toBe(false);
  });
});
