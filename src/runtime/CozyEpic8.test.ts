import {describe,it,expect} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {CozyCampaignSession} from './CozyCampaignSession';
import {fundedShopCheckpoint} from './shopTestFixture';
import {STAFF_ROLES,type StaffRole} from '../config/staffCatalog';
import {validateCozyCheckpoint,COZY_SCHEMA_VERSION,COZY_CONTENT_VERSION} from '../domain/CozyCheckpoint';
import {checkpointChecksum,saveFailure,type CozySaveEnvelope,type CozyWriteRequest,type CozySavePort} from '../infrastructure/CozySaveRepository';
const time=(r:CozyRuntime,seconds:number)=>{for(let i=0;i<seconds*20;i++)r.advance(50);};
const schedule=(count=1,app=false)=>({schedule:(day:number)=>({day,duration:350,grace:120,slots:Array.from({length:count},(_,i)=>({id:'staff-'+i,at:i*10,kind:'regular' as const,opportunity:'commercial' as const,commercialOrdinal:i+1,takeaway:true,...(app?{source:'app' as const,quantity:3 as const}:{})}))})});
const funded=()=>fundedShopCheckpoint(22000);
function staffRuntime(roles:readonly StaffRole[]=STAFF_ROLES,count=1,app=false){const r=CozyRuntime.restoreCheckpoint(funded(),false,schedule(count,app))!;for(const role of roles)expect(r.hireStaff(role,'hire-'+role)).toBe(true);if(app)r.configureDeliveryApp(true,'app');return r;}
describe('Epic8 fixed-role staff',()=>{
 it('takes one simulation second per ingredient while manual additions preserve or cancel the appropriate job',()=>{
  const r=staffRuntime(['prep']);for(const id of ['dough','sauce','cheese'] as const)r.buy(id,2);r.openShop();
  time(r,.5);expect(r.state.ingredients).toEqual([]);
  expect(r.dispatch({type:'ingredient',ingredient:'cheese'})).toBe(true);
  time(r,.45);expect(r.state.ingredients).toEqual(['cheese']);time(r,.05);expect(r.state.ingredients).toEqual(['cheese','dough']);
  time(r,.5);const lease=r.acquirePause('user');time(r,3);expect(r.state.ingredients).toEqual(['cheese','dough']);lease.release();
  expect(r.dispatch({type:'ingredient',ingredient:'sauce'})).toBe(true);time(r,1);expect(r.state.ingredients).toEqual(['cheese','dough','sauce']);
  expect(r.owned('sauce')).toBeGreaterThanOrEqual(2);expect(r.state.stage).toBe('assembly');
 });
 it('keeps legacy saves empty and guards unlock, ownership, pause and shift hiring',()=>{
  const old=new CozyRuntime(false,true).exportCheckpoint();delete old.staff;const loaded=CozyRuntime.restoreCheckpoint(old)!;
  expect(loaded.staffState.acquired).toEqual([]);expect(loaded.state.cash).toBe(300);expect(loaded.hireStaff('prep','early')).toBe(false);
  const r=staffRuntime(['prep']);const cash=r.state.cash;expect(r.staffState.acquired[0]).toMatchObject({role:'prep',actualPrice:2000});expect(r.hireStaff('prep','duplicate')).toBe(false);
  const lease=r.acquirePause('user');expect(r.hireStaff('oven','paused')).toBe(false);lease.release();r.openShop();expect(r.hireStaff('oven','shift')).toBe(false);expect(r.state.cash).toBe(cash);
 });
 it('automates exact recipe FEFO once, retains manual selection and waits through pause',()=>{
  const r=staffRuntime(['prep','oven','box'],2);for(const ingredient of ['dough','sauce','cheese'] as const)r.buy(ingredient,3);
  const before=r.exportCheckpoint();r.openShop();const first=r.tickets[0].id;
  const lease=r.acquirePause('user');time(r,10);expect(r.tickets[0].stage).toBe('assembly');expect(r.staffState.jobs).toEqual([]);lease.release();
  time(r,14);const second=r.tickets[1].id;expect(r.ovenOwner).toBe(second);r.selectTicket(first);time(r,6);
  expect(r.selectedTicketId).toBe(first);expect(r.tickets.find(t=>t.id===first)!.stage).toBe('boxed');expect(r.tickets.find(t=>t.id===second)!.stage).toBe('boxed');
  expect(r.owned('dough')).toBe(before.stock.lots.filter(l=>l.ingredient==='dough').reduce((n,l)=>n+l.quantity,0)-2);
  expect(r.ovenOwner).toBeNull();expect(r.staffState.frozenRoles).toEqual(['prep','oven','box']);
 });
 it('manual topping races cancel stale prep jobs and do not remove wrong ingredients',()=>{
  const r=staffRuntime(['prep','oven']);for(const id of ['dough','sauce','cheese','mushroom'] as const)r.buy(id,1);r.openShop();time(r,.05);
  r.dispatch({type:'ingredient',ingredient:'dough'});time(r,.4);expect(r.state.ingredients).toContain('dough');
  r.dispatch({type:'ingredient',ingredient:'mushroom'});const ingredients=[...r.state.ingredients];time(r,10);expect(r.state.ingredients).toEqual(ingredients);expect(r.state.stage).toBe('assembly');expect(r.ovenOwner).toBeNull();
 });
 it('boxes three app pizzas, completes once and waits for courier return before next trip',()=>{
  const r=staffRuntime(STAFF_ROLES,2,true);for(const id of ['dough','sauce','cheese'] as const)r.buy(id,7);r.openShop();const first=r.tickets[0].id;time(r,42);const second=r.tickets[0].id;
  expect(r.lastResult?.outcome).toBe('delivered');expect(r.tickets.some(t=>t.id===first)).toBe(false);expect(r.deliveryStatus.phase).toBe('return');expect(r.deliveryStatus.mode).toBe('staff');
  expect(r.tickets[0].packed).toBeLessThanOrEqual(3);const remaining=r.deliveryStatus.remaining;
  const lease=r.acquirePause('user');time(r,5);expect(r.deliveryStatus.remaining).toBe(remaining);lease.release();
  time(r,31);expect(r.tickets).toHaveLength(0);expect(r.lastResult?.targetId).toBe(second);
 });
 it('expenses daily wages, retains shortages and repays debt without expensing it twice',()=>{
  const r=staffRuntime(STAFF_ROLES,25);for(const id of ['sauce','cheese'] as const)expect(r.buy(id,25)).toBe(true);const unit=r.price('dough');
  while(r.state.cash>=820+unit){const amount=Math.min(100,Math.floor((r.state.cash-600)/unit));if(amount<1)break;expect(r.buy('dough',amount)).toBe(true);}
  r.openShop();const cash=r.state.cash;expect(r.closeDay()).toBe(true);const report=r.daySummary!;
  expect(report.accounts.wages).toBe(800);expect(report.payroll).toMatchObject({wagesPaid:0,openingArrears:0,endingArrears:800});expect(report.cash).toBe(cash-20);
  expect(r.staffState.warning).toContain(String(800-report.cash));expect(r.staffState.arrears).toBe(800);expect(r.closeDay()).toBe(false);
  const saved=r.exportCheckpoint();expect(validateCozyCheckpoint(saved)).not.toBeNull();
  const loaded=CozyRuntime.restoreCheckpoint(saved,false,schedule(25))!;expect(loaded.staffState.arrears).toBe(800);
  loaded.openShop();time(loaded,250);expect(loaded.closeDay()).toBe(true);const next=loaded.daySummary!;
  expect(next.payroll!.wagesPaid).toBe(1600);expect(next.accounts.wages).toBe(800);expect(loaded.staffState.arrears).toBe(0);
  expect(validateCozyCheckpoint(loaded.exportCheckpoint())).not.toBeNull();
 });
 it('validates roster prices, hire day, payroll sequence, cash payment and arrears',()=>{
  const r=staffRuntime();r.openShop();r.closeDay();const saved=r.exportCheckpoint();expect(validateCozyCheckpoint(saved)).not.toBeNull();
  const corruptions=[(s:typeof saved)=>s.staff!.acquired[0].actualPrice=1,(s:typeof saved)=>s.staff!.acquired[0].hiredDay=7,(s:typeof saved)=>s.staff!.acquired.push({...s.staff!.acquired[0]}),(s:typeof saved)=>s.staff!.arrears=1,(s:typeof saved)=>s.reports[s.reports.length-1].payroll!.roles.pop(),(s:typeof saved)=>s.reports[s.reports.length-1].payroll!.wagesPaid=0,(s:typeof saved)=>s.reports[s.reports.length-1].accounts.wages=0];
  for(const mutate of corruptions){const forged=structuredClone(saved);mutate(forged);expect(validateCozyCheckpoint(forged)).toBeNull();}
 });
 it('stages hiring atomically and retries the same candidate without changing runtime identity',async()=>{
  const payload=funded();let envelope:CozySaveEnvelope={schemaVersion:COZY_SCHEMA_VERSION,contentVersion:COZY_CONTENT_VERSION,campaignId:'staff',commitId:'initial',revision:1,checksum:checkpointChecksum(payload),payload};let fail=true;const requests:CozyWriteRequest[]=[];
  const port:CozySavePort={load:async()=>({ok:true,kind:'loaded',envelope,replacementToken:'test'}),commit:async request=>{requests.push(structuredClone(request));if(fail)return saveFailure('write-failed');envelope={...envelope,commitId:request.commitId,revision:envelope.revision+1,payload:structuredClone(request.payload),checksum:checkpointChecksum(request.payload)};return {ok:true,envelope};}};
  let id=0;const session=new CozyCampaignSession(port,()=>`staff-${++id}`),r=(await session.load())!,cash=r.state.cash;
  expect(session.hireStaff('delivery','hire')).toBe(true);expect(r.state.cash).toBe(cash);expect(r.staffState.acquired).toEqual([]);await new Promise(resolve=>setTimeout(resolve,0));expect(session.view.state).toBe('error');
  fail=false;await session.retry();expect(requests[1]).toEqual(requests[0]);expect(session.runtime).toBe(r);expect(r.state.cash).toBe(cash-2000);expect(r.staffState.acquired).toHaveLength(1);expect(session.hireStaff('delivery','hire')).toBe(false);expect(CozyRuntime.restoreCheckpoint(r.exportCheckpoint())!.staffState.acquired).toHaveLength(1);
 });
});
