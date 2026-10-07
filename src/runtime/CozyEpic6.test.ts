import {describe,expect,it} from 'vitest';
import {CozyRuntime,type CozyScheduleDependencies} from './CozyRuntime';
import {deliveryEvent,deliverySchedule,type DeliveryScheduleSlot} from '../config/deliveryEvents';
import {threeDaySchedule,type ScheduleFactory} from '../config/cozySchedule';
import {validateCozyCheckpoint} from '../domain/CozyCheckpoint';
import {PlayLifecycle} from './PlayLifecycle';
import {CozyCampaignSession} from './CozyCampaignSession';
import {checkpointChecksum,saveFailure,type CozySaveEnvelope,type CozyWriteRequest} from '../infrastructure/CozySaveRepository';
import {COZY_CONTENT_VERSION,COZY_SCHEMA_VERSION} from '../domain/CozyCheckpoint';

const ingredients=['dough','sauce','cheese'] as const;
const slot=(day:number,at:number,source:'shop'|'app',quantity:1|2|3=1):DeliveryScheduleSlot=>({id:`${day}-${at}`,at,source,quantity,kind:'hurry',opportunity:'commercial',commercialOrdinal:1,takeaway:true});
const schedule:ScheduleFactory=day=>({day,duration:240,grace:120,slots:[slot(day,0,day>=5?'app':'shop',day>=5?2:1)]});
function cook(r:CozyRuntime,command:string,wrong=false){
 for(const ingredient of wrong?['dough'] as const:ingredients)expect(r.dispatch({type:'ingredient',ingredient})).toBe(true);
 expect(r.dispatch({type:'bake'})).toBe(true);r.advanceElapsed(7000);expect(r.dispatch({type:'extract'})).toBe(true);expect(r.dispatch({type:'box'})).toBe(true);
 expect(r.dispatch({type:'deliver',commandId:command})).toBe(true);
}
function campaign(deps:CozyScheduleDependencies={schedule}){
 const r=new CozyRuntime(false,true,deps);r.configureMenu('mushroom',100,false);
 for(let day=1;day<=4;day++){
  for(const i of ingredients)expect(r.buy(i,1)).toBe(true);
  expect(day===1?r.openShop():r.openNextDay()).toBe(true);cook(r,`shop-${day}`);r.continueShift();expect(r.closeDay()).toBe(true);
 }
 return r;
}
function app(quantity:1|2|3=2,staff=false,extra:DeliveryScheduleSlot[]=[]){
 const deps:CozyScheduleDependencies={deliveryStaffAvailable:()=>staff,schedule:day=>({day,duration:240,grace:120,slots:[slot(day,0,day>=5?'app':'shop',day>=5?quantity:1),...(day>=5?extra:[])]})};
 const r=campaign(deps);expect(r.configureDeliveryApp(true,'app-on')).toBe(true);
 for(const i of ingredients)expect(r.buy(i,quantity+2)).toBe(true);
 expect(r.openNextDay()).toBe(true);return r;
}

describe('delivery schedule',()=>{
 it('gates day5 and deterministically freezes weather/rush/festival opportunities',()=>{
  const eligibility={regularDay1Stars:null,regularLatestStars:null,helpSucceeded:false,referral:false};
  const count=(day:number,on:boolean)=>deliverySchedule(threeDaySchedule(day,eligibility),on).slots as DeliveryScheduleSlot[];
  expect(count(4,true).filter(s=>s.source==='app')).toHaveLength(0);
  expect(count(5,true).filter(s=>s.source==='app').map(s=>s.quantity)).toEqual([1,2]);
  for(const day of [5,6,7,9]){expect(count(day,false)).toHaveLength(threeDaySchedule(day,eligibility).slots.length);expect(count(day,true)).toHaveLength(count(day,false).length);}
  expect(count(6,true).filter(s=>s.source==='app')).toHaveLength(3);
  expect(count(9,true).filter(s=>s.source==='app').map(s=>s.quantity)).toEqual([1,3]);
  expect(count(10,true)).toEqual(count(10,true));expect(deliveryEvent(10).id).toBe('rain');expect(deliveryEvent(8).id).toBe('normal');
 });
});
describe('app order settlement',()=>{
 it('generates distinct default commands for each pizza and launch after the rider arrives',()=>{
  const r=app(2);r.bookShipper(r.selectedTicketId,'book');
  for(let part=0;part<2;part++){
   for(const ingredient of ingredients)r.dispatch({type:'ingredient',ingredient});expect(r.dispatch({type:'bake'})).toBe(true);r.advanceElapsed(7000);r.dispatch({type:'extract'});r.dispatch({type:'box'});
   expect(r.dispatch({type:'deliver'})).toBe(true);
  }
  expect(r.deliveryStatus.phase).toBe('idle');expect(r.lastResult?.price).toBe(100);
  const early=app(1);early.bookShipper(early.selectedTicketId,'early');for(const ingredient of ingredients)early.dispatch({type:'ingredient',ingredient});early.dispatch({type:'bake'});early.advanceElapsed(7000);early.dispatch({type:'extract'});early.dispatch({type:'box'});
  expect(early.dispatch({type:'deliver'})).toBe(true);expect(early.selectedTicket?.packed).toBe(1);early.advanceElapsed(3000);expect(early.dispatch({type:'deliver'})).toBe(true);expect(early.deliveryStatus.phase).toBe('idle');expect(early.lastResult?.price).toBe(50);
 });
 it('requires booking before bake, waits for rider, consumes two pies and charges once per order',()=>{
  const r=app(),id=r.selectedTicketId,cash=r.state.cash,cost=r.available('dough');
  const payments:number[]=[];r.subscribeCash(receipt=>payments.push(receipt.amount));
  for(const ingredient of ingredients)r.dispatch({type:'ingredient',ingredient});
  expect(r.dispatch({type:'bake'})).toBe(false);expect(r.bookShipper(id,'book')).toBe(true);expect(r.bookShipper(id,'again')).toBe(false);
  expect(r.dispatch({type:'bake'})).toBe(true);r.advanceElapsed(7000);r.dispatch({type:'extract'});r.dispatch({type:'box'});expect(r.dispatch({type:'deliver',commandId:'part0'})).toBe(true);
  expect(r.selectedTicket?.packed).toBe(1);expect(r.state.stage).toBe('assembly');expect(r.dispatch({type:'deliver',commandId:'part0'})).toBe(false);
  cook(r,'part1');expect(r.tickets).toHaveLength(0);expect(r.deliveryStatus.phase).toBe('idle');expect(r.canCloseDay).toBe(true);expect(r.state.cash).toBe(cash+95);
  expect(r.available('dough')).toBe(cost-2);expect(r.state.cash).toBe(cash+95);expect(payments).toEqual([95]);
  expect(r.deliveryStatus.phase).toBe('idle');expect(r.dispatch({type:'deliver',sourceId:id,targetId:id,commandId:'send-again'})).toBe(false);
  expect(r.closeDay()).toBe(true);const report=r.daySummary!;
  expect(report.delivered).toBe(1);expect(report.pizzasSold).toBe(2);expect(report.revenue).toBe(100);expect(report.deliveryFees).toBe(5);expect(report.accounts.other).toBe(5);
  expect(report.salesByRecipe).toEqual([{recipe:'cheese',quantity:2,revenue:100}]);expect(report.reviews).toHaveLength(1);expect(report.goal.stats.delivered).toBe(1);
  const checkpoint=r.exportCheckpoint();expect(validateCozyCheckpoint(checkpoint)).not.toBeNull();expect(CozyRuntime.restoreCheckpoint(checkpoint)?.deliveryApp.enabled).toBe(true);
  const bad=structuredClone(checkpoint);bad.reports[4].pizzasSold=3;expect(validateCozyCheckpoint(bad)).toBeNull();
  const fee=structuredClone(checkpoint);fee.reports[4].reviews[0].deliveryFee=0;expect(validateCozyCheckpoint(fee)).toBeNull();
 });
 it('packs three pies using one review and one XP outcome; employee returns before becoming free',()=>{
  const r=app(3,true),xp=r.progression.xp,cash=r.state.cash,id=r.selectedTicketId;
  expect(r.bookShipper(id,'not-needed')).toBe(false);
  for(let i=0;i<3;i++)cook(r,`part${i}`);
  expect(r.deliveryStatus.mode).toBe('staff');expect(r.state.cash).toBe(cash+150);expect(r.progression.xp-xp).toBe(15);
  expect(r.deliveryStatus.phase).toBe('return');expect(r.canCloseDay).toBe(false);r.advanceElapsed(20000);expect(r.deliveryStatus.busy).toBe(false);
  expect(r.closeDay()).toBe(true);expect(r.daySummary?.pizzasSold).toBe(3);expect(r.daySummary?.deliveryFees).toBe(0);expect(r.daySummary?.reviews).toHaveLength(1);expect(()=>r.exportCheckpoint()).not.toThrow();
 });
 it('waits after packing early, refuses cross-source and unboxed delivery, confirms wrong recipe',()=>{
  const r=app(1,false,[slot(5,1,'shop')]),id=r.selectedTicketId;r.bookShipper(id,'book');
  for(const ingredient of ingredients)r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});r.advanceElapsed(7000);r.dispatch({type:'extract'});
  expect(r.dispatch({type:'deliver',sourceId:id,targetId:r.tickets[1].id,commandId:'cross'})).toBe(false);
  expect(r.dispatch({type:'deliver',commandId:'unboxed'})).toBe(false);r.dispatch({type:'box'});r.dispatch({type:'deliver',commandId:'pack'});
  expect(r.selectedTicket?.packed).toBe(1);expect(r.deliveryStatus.phase).toBe('waiting');r.advanceElapsed(3000);
  expect(r.dispatch({type:'deliver',sourceId:id,targetId:id,commandId:'launch'})).toBe(true);expect(r.deliveryStatus.phase).toBe('idle');
  const wrong=app(1);wrong.bookShipper(wrong.selectedTicketId,'book');cook(wrong,'wrong',true);expect(wrong.deliveryPending).not.toBeNull();expect(wrong.confirmDelivery()).toBe(true);
  wrong.advanceElapsed(3000);wrong.dispatch({type:'deliver',commandId:'launch'});expect(wrong.lastResult?.stars).toBe(3);expect(wrong.lastResult?.reasons).toContain('Sai công thức');
 });
 it('cancels unsent expiry without refund and immediately settles delivery before the deadline',()=>{
  const canceled=app(1),cash=canceled.state.cash;canceled.bookShipper(canceled.selectedTicketId,'book');cook(canceled,'pack');canceled.advanceElapsed(83000);
  expect(canceled.tickets).toHaveLength(0);expect(canceled.deliveryStatus.busy).toBe(false);expect(canceled.state.cash).toBe(cash);expect(canceled.lastResult?.stars).toBe(1);expect(canceled.available('dough')).toBe(2);
  const late=app(1);late.bookShipper(late.selectedTicketId,'book');cook(late,'pack');late.advanceElapsed(70000);expect(late.dispatch({type:'deliver',commandId:'launch'})).toBe(true);
  expect(late.lastResult?.stars).toBe(5);expect(late.lastResult?.reasons).toEqual([]);expect(late.deliveryStatus.phase).toBe('idle');expect(late.closeDay()).toBe(true);expect(()=>late.exportCheckpoint()).not.toThrow();
 });
 it('keeps employee return alive beyond grace and excludes manual paused time',()=>{
  const deps:CozyScheduleDependencies={deliveryStaffAvailable:()=>true,schedule:day=>({day,duration:day>=5?10:240,grace:day>=5?1:120,slots:[slot(day,0,day>=5?'app':'shop')]})};
  const r=campaign(deps);r.configureDeliveryApp(true,'on');for(const i of ingredients)r.buy(i,1);r.openNextDay();
  let now=0;const clock=new PlayLifecycle(r,()=>now);clock.frame(now,true);cook(r,'pack');
  const pause=r.acquirePause('user');now=40000;clock.frame(now,true);expect(r.deliveryStatus.remaining).toBe(20);pause.release();now+=10000;clock.frame(now,true);
  expect(r.shiftClock.phase).toBe('awaiting-close');expect(r.deliveryStatus.phase).toBe('return');expect(r.deliveryStatus.remaining).toBe(10);now+=10000;clock.frame(now,true);expect(r.canCloseDay).toBe(true);clock.destroy();
 });
 it('old saves default off, preparation toggle is gated and shift event remains frozen',()=>{
  const r=new CozyRuntime(false,true);expect(r.configureDeliveryApp(true,'early')).toBe(false);expect(CozyRuntime.restoreCheckpoint(r.exportCheckpoint())?.deliveryApp.enabled).toBe(false);
  const ready=campaign();const old=ready.exportCheckpoint();delete old.deliveryAppEnabled;expect(CozyRuntime.restoreCheckpoint(old)?.deliveryApp.enabled).toBe(false);
  ready.configureDeliveryApp(true,'on');ready.openNextDay();expect(ready.configureDeliveryApp(false,'mid-shift')).toBe(false);expect(ready.deliveryApp.event?.id).toBe('normal');
 });
 it('rain pickup takes fifteen seconds then settles immediately; booking does not block day close',()=>{
  const r=app(1);expect(r.closeDay()).toBe(true);for(const i of ingredients)r.buy(i,1);expect(r.openNextDay()).toBe(true);
  expect(r.deliveryApp.event?.id).toBe('rain');expect(r.bookShipper(r.selectedTicketId,'rain-book')).toBe(true);cook(r,'rain-pack');
  expect(r.deliveryStatus.remaining).toBe(8);r.advanceElapsed(8000);expect(r.deliveryStatus.phase).toBe('arrived');r.dispatch({type:'deliver',commandId:'rain-send'});
  expect(r.deliveryStatus.phase).toBe('idle');expect(r.deliveryApp.travelSeconds).toBe(0);expect(r.deliveryApp.returnSeconds).toBe(30);expect(r.lastResult?.stars).toBe(5);expect(r.closeDay()).toBe(true);expect(()=>r.exportCheckpoint()).not.toThrow();
  expect(r.deliveryApp.nextEvent.id).toBe('rush');expect(r.deliveryApp.waitSeconds).toBe(10);expect(r.deliveryApp.travelSeconds).toBe(0);expect(r.deliveryApp.returnSeconds).toBe(20);
  const waiting=app(1);waiting.bookShipper(waiting.selectedTicketId,'waiting-book');expect(waiting.canCloseDay).toBe(true);expect(waiting.closeDay()).toBe(true);expect(waiting.deliveryStatus.busy).toBe(false);expect(waiting.daySummary?.deliveryFees).toBe(0);
 });
 it('courier is exclusive until pickup then immediately frees; employee must wait for return',()=>{
  const second=slot(5,1,'app');const r=app(1,false,[second]);r.bookShipper(r.selectedTicketId,'first');cook(r,'pack');r.advanceElapsed(3000);r.dispatch({type:'deliver',commandId:'send'});
  expect(r.tickets).toHaveLength(1);expect(r.deliveryStatus.phase).toBe('idle');expect(r.bookShipper(r.tickets[0].id,'next')).toBe(true);
  const staff=app(1,true,[second]);cook(staff,'first');staff.selectTicket(staff.tickets[0].id);cook(staff,'second');expect(staff.selectedTicket?.packed).toBe(1);
  expect(staff.deliveryStatus.phase).toBe('return');expect(staff.deliveryStatus.remaining).toBe(13);expect(staff.dispatch({type:'deliver',commandId:'busy-return'})).toBe(true);expect(staff.tickets).toHaveLength(1);
  staff.advanceElapsed(13000);expect(staff.deliveryStatus.phase).toBe('idle');expect(staff.dispatch({type:'deliver',commandId:'after-return'})).toBe(true);expect(staff.tickets).toHaveLength(0);
 });
 it('booking catches up without frames, manual pause excludes time, and queue cap remains four',()=>{
  const r=app(1,false,[slot(5,1,'app'),slot(5,2,'app'),slot(5,3,'app'),slot(5,4,'app')]);let now=0;const clock=new PlayLifecycle(r,()=>now);clock.frame(0,true);
  r.bookShipper(r.selectedTicketId,'book');now=5000;clock.setHidden(true);expect(r.deliveryStatus.remaining).toBe(5);expect(r.tickets).toHaveLength(4);
  const pause=r.acquirePause('user');now=25000;clock.frame(now,true);expect(r.deliveryStatus.remaining).toBe(5);pause.release();now+=5000;clock.frame(now,true);expect(r.deliveryStatus.phase).toBe('arrived');clock.destroy();
 });
 it('app setting commits atomically, failed write retains old save and retry preserves the exact request',async()=>{
  const payload=campaign().exportCheckpoint();let value:CozySaveEnvelope={schemaVersion:COZY_SCHEMA_VERSION,contentVersion:COZY_CONTENT_VERSION,campaignId:'campaign',commitId:'old',revision:4,checksum:checkpointChecksum(payload),payload};
  let fail=true;const requests:CozyWriteRequest[]=[];
  const session=new CozyCampaignSession({load:async()=>({ok:true,kind:'loaded',envelope:structuredClone(value),replacementToken:'old'}),commit:async request=>{
   requests.push(structuredClone(request));if(fail)return saveFailure('write-failed');value={...value,commitId:request.commitId,revision:5,payload:structuredClone(request.payload),checksum:checkpointChecksum(request.payload)};return {ok:true,envelope:value};
  }},()=> 'app-commit');
  const r=(await session.load())!,cash=r.state.cash,lots=r.stockLots;
  expect(session.configureDeliveryApp(true,'toggle')).toBe(true);await new Promise(resolve=>setTimeout(resolve,0));expect(session.view.state).toBe('error');expect(value.payload.deliveryAppEnabled).toBe(false);
  expect(r.deliveryApp.enabled).toBe(true);expect(r.openShop()).toBe(false);expect(session.configureDeliveryApp(false,'again')).toBe(false);expect(r.state.cash).toBe(cash);expect(r.stockLots).toEqual(lots);
  fail=false;await session.retry();expect(requests[1]).toEqual(requests[0]);const loaded=(await session.load())!;expect(loaded.deliveryApp.enabled).toBe(true);expect(loaded.state.cash).toBe(cash);expect(loaded.stockLots).toEqual(lots);session.destroy();
 });
});
