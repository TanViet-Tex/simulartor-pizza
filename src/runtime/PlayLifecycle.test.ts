import {describe,expect,it} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {PlayLifecycle} from './PlayLifecycle';
import type {ScheduleFactory} from '../config/cozySchedule';

function shop(){const runtime=new CozyRuntime(false,true,{schedule:day=>({day,duration:240,grace:120,slots:Array.from({length:10},(_,i)=>({id:'slot-'+i,at:i*20,kind:i===0?'regular':'hurry',opportunity:'commercial',commercialOrdinal:i+1,takeaway:false}))}),resolveRecipe:()=> 'cheese'});for(const id of ['dough','sauce','cheese'] as const)runtime.buy(id,3);runtime.openShop();let now=0;const lifecycle=new PlayLifecycle(runtime,()=>now);lifecycle.frame(now,true);return {runtime,lifecycle,time:(ms:number)=>{now=ms;return now;}};}
describe('background wall-clock simulation',()=>{
 it('reconciles before the legacy preparation transition and excludes its idle duration',()=>{
  const {runtime,lifecycle,time}=shop();time(1000);expect(runtime.prepareAgain()).toBe(true);expect(runtime.shiftClock.elapsed).toBe(1);
  time(10000);lifecycle.frame(10000,false);expect(runtime.shiftClock.elapsed).toBe(1);expect(runtime.returnToOrders()).toBe(true);
  time(11000);lifecycle.frame(11000,true);expect(runtime.shiftClock.elapsed).toBe(2);
 });
 it('starts a freeplay oven at the action time after an idle RAF gap',()=>{
  const runtime=new CozyRuntime();let now=0;const lifecycle=new PlayLifecycle(runtime,()=>now);lifecycle.frame(0,false);
  now=7000;for(const ingredient of ['dough','sauce','cheese'] as const)runtime.dispatch({type:'ingredient',ingredient});expect(runtime.dispatch({type:'bake'})).toBe(true);
  lifecycle.frame(7000,true);expect(runtime.state.ovenSeconds).toBe(0);now=8000;lifecycle.frame(now,true);expect(runtime.state.ovenSeconds).toBe(1);
 });
 it('starts a production shift and oven at their own action timestamps after idle gaps',()=>{
  const runtime=new CozyRuntime(false,true,{schedule:day=>({day,duration:240,grace:120,slots:[{id:'first',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:false}]}),resolveRecipe:()=> 'cheese'});
  for(const ingredient of ['dough','sauce','cheese'] as const)runtime.buy(ingredient,1);
  let now=0;const lifecycle=new PlayLifecycle(runtime,()=>now);lifecycle.frame(0,false);now=7000;expect(runtime.openShop()).toBe(true);lifecycle.frame(now,true);expect(runtime.shiftClock.elapsed).toBe(0);
  now=14000;for(const ingredient of ['dough','sauce','cheese'] as const)runtime.dispatch({type:'ingredient',ingredient});expect(runtime.dispatch({type:'bake'})).toBe(true);
  expect(runtime.shiftClock.elapsed).toBe(7);expect(runtime.ovenState!.ovenSeconds).toBe(0);lifecycle.frame(14000,true);expect(runtime.ovenState!.ovenSeconds).toBe(0);now=15000;lifecycle.frame(now,true);expect(runtime.ovenState!.ovenSeconds).toBe(1);expect(runtime.shiftClock.elapsed).toBe(8);
 });
 it('reconciles long frames, repeated hide/show and resize exactly once without recovery leases',()=>{
  const {runtime,lifecycle,time}=shop(),remaining=runtime.tickets[0].remaining;
  lifecycle.setHidden(true);time(1000);lifecycle.setHidden(false);lifecycle.viewportChanged();lifecycle.frame(1000,true);
  expect(runtime.shiftClock.elapsed).toBe(1);expect(runtime.tickets[0].remaining).toBeCloseTo(remaining-1);expect(runtime.pauses).toEqual([]);expect(lifecycle.needsContinue).toBe(false);expect(lifecycle.continue()).toBe(false);
  time(2000);lifecycle.setHidden(true);time(3000);lifecycle.setHidden(false);lifecycle.frame(3000,true);expect(runtime.shiftClock.elapsed).toBe(3);
 });
 it('reconciles immediately before manual pause and excludes all paused wall time even without frames',()=>{
  const {runtime,lifecycle,time}=shop();time(1050);const pause=runtime.acquirePause('user');expect(runtime.shiftClock.elapsed).toBe(1.05);
  time(9050);pause.release();expect(runtime.shiftClock.elapsed).toBe(1.05);time(10050);lifecycle.frame(10050,true);expect(runtime.shiftClock.elapsed).toBe(2.05);
 });
 it('keeps other modal/menu/save owners paused through overlapping leases and resumes at the final release',()=>{
  const {runtime,lifecycle,time}=shop();time(500);const user=runtime.acquirePause('user'),menu=runtime.acquirePause('menu'),save=runtime.acquirePause('save');
  time(5000);user.release();menu.release();lifecycle.setHidden(false);expect(runtime.shiftClock.elapsed).toBe(.5);expect(runtime.pauses).toEqual(['save']);
  time(7000);save.release();time(8000);lifecycle.frame(8000,true);expect(runtime.shiftClock.elapsed).toBe(1.5);
 });
 it('advances oven, incoming customers, patience and express delivery during a throttled frame',()=>{
  const {runtime,lifecycle,time}=shop(),remaining=runtime.tickets[0].remaining;
  for(const ingredient of ['dough','sauce','cheese'] as const)runtime.dispatch({type:'ingredient',ingredient});runtime.dispatch({type:'bake'});
  expect(runtime.dispatch({type:'express.order',ingredient:'mushroom',quantity:1,commandId:'delivery'})).toBe(true);
  time(22000);lifecycle.frame(22000,true);
  expect(runtime.shiftClock.elapsed).toBe(22);expect(runtime.ovenState!.stage).toBe('burnt');expect(runtime.tickets.length).toBeGreaterThan(1);expect(runtime.tickets[0].remaining).toBeCloseTo(remaining-22);expect(runtime.expressOrders).toEqual([]);expect(runtime.owned('mushroom')).toBe(1);expect(runtime.pauses).toEqual([]);
 });
 it('stops catch-up at a newly created decision and discards time spent awaiting that decision',()=>{
  const schedule:ScheduleFactory=day=>({day,duration:240,grace:120,slots:[{id:'help',at:10,kind:'regular',opportunity:'help',commercialOrdinal:null,takeaway:false}]});
  const runtime=new CozyRuntime(false,true,{schedule});runtime.openShop();let now=0;const lifecycle=new PlayLifecycle(runtime,()=>now);lifecycle.frame(0,true);now=60000;lifecycle.frame(now,true);
  expect(runtime.shiftClock.elapsed).toBe(10);expect(runtime.pauses).toEqual(['help']);expect(runtime.helpState.offer).not.toBeNull();
  now=70000;runtime.dispatch({type:'customer.help',accept:false});now=71000;lifecycle.frame(now,true);expect(runtime.shiftClock.elapsed).toBe(11);
 });
 it('bounds a day-long gap at the existing shift end and leaves a correct first frame after cleanup',()=>{
  const {runtime,lifecycle,time}=shop();time(86400000);lifecycle.frame(86400000,true);expect(runtime.shiftClock.elapsed).toBe(360);expect(runtime.shiftClock.phase).toBe('awaiting-close');expect(runtime.pauses).toEqual([]);
  lifecycle.destroy();lifecycle.destroy();time(86401000);lifecycle.frame(86401000,true);expect(runtime.shiftClock.elapsed).toBe(360);
 });
 it('rebases the first frame, ignores backward timestamps and leaves external owners intact on destroy',()=>{
  const runtime=new CozyRuntime();for(const ingredient of ['dough','sauce','cheese'] as const)runtime.dispatch({type:'ingredient',ingredient});runtime.dispatch({type:'bake'});
  const lifecycle=new PlayLifecycle(runtime,()=>10000);lifecycle.frame(10000,true);expect(runtime.state.ovenSeconds).toBe(0);lifecycle.frame(10050,true);expect(runtime.state.ovenSeconds).toBe(.05);lifecycle.frame(9000,true);expect(runtime.state.ovenSeconds).toBe(.05);
  const owner=runtime.acquirePause('order');lifecycle.destroy();expect(runtime.pauses).toEqual(['order']);owner.release();expect(runtime.pauses).toEqual([]);
 });
});
