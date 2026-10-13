import {describe,it,expect} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {CozyCampaignSession} from './CozyCampaignSession';
import {STAFF_ROLES,type StaffRole} from '../config/staffCatalog';
import {validateStaffCheckpoint} from '../domain/StaffCheckpoint';
import {validateCozyCheckpoint,COZY_SCHEMA_VERSION,COZY_CONTENT_VERSION} from '../domain/CozyCheckpoint';
import {checkpointChecksum,saveFailure,type CozySaveEnvelope,type CozyWriteRequest,type CozySavePort} from '../infrastructure/CozySaveRepository';
const deps={schedule:(day:number)=>({day,duration:350,grace:120,slots:[{id:`contract-${day}`,at:0,kind:'regular' as const,opportunity:'commercial' as const,commercialOrdinal:1,takeaway:true}]})};
function fresh(){const r=new CozyRuntime(false,true,deps);expect(r.claimTestCode('VIETVUIVE')).toBe(true);r.configureMenu('mushroom',100,false);return r;}
function close(r:CozyRuntime){for(const id of ['dough','sauce','cheese'] as const)expect(r.buy(id,2)).toBe(true);expect(r.daySummary?r.openNextDay():r.openShop()).toBe(true);if(r.lotteryPending)r.resolveLottery(0);r.dismissThanks();expect(r.closeDay()).toBe(true);}
function expired(role:StaffRole='box'){const r=fresh();expect(r.hireStaff(role,'first')).toBe(true);for(let i=0;i<10;i++)close(r);return r;}
// Preserve a genuine legacy ledger: the modern first-day report is converted to
// the old 800/day payroll and all dependent cash/profit fields are reconciled.
function legacy(paid:boolean){
 const r=fresh();for(const role of STAFF_ROLES)expect(r.hireStaff(role,'legacy-'+role)).toBe(true);
 if(!paid)while(r.state.cash>=600+r.price('dough'))expect(r.buy('dough',Math.min(100,Math.floor((r.state.cash-600)/r.price('dough'))))).toBe(true);
 close(r);
 const s=r.exportCheckpoint(),report=s.reports[0],wages=800,payment=paid?800:0;
 delete s.staff!.contracts;report.accounts.wages=wages;report.accounts.wagesPaid=payment;report.accounts.profit-=wages;report.accounts.cumulativeProfit-=wages;report.accounts.endingCash-=payment;
 report.accounts.zeroReasons.wages='Lương phát sinh trong ngày; tiền thực trả và nợ lương ghi riêng.';
 report.profit-=wages;report.cash-=payment;report.payroll={roles:[...STAFF_ROLES],openingArrears:0,wagesPaid:payment,endingArrears:wages-payment};
 s.staff!.arrears=wages-payment;s.cumulativeProfit-=wages;s.stock.cash-=payment;
 return s;
}
describe('prepaid ten-day staff contracts',()=>{
 it('charges once, works through inclusive day ten and stops without auto-renewal',()=>{
  const r=fresh(),cash=r.state.cash;expect(r.hireStaff('delivery','first')).toBe(true);expect(r.state.cash).toBe(cash-2000);expect(r.staffPreview('delivery')).toMatchObject({owned:true,remainingDays:10,expired:false});
  for(let day=1;day<=10;day++){expect(r.staffPreview('delivery').remainingDays).toBe(11-day);close(r);expect(r.daySummary!.accounts.wages).toBe(0);expect(r.daySummary!.payroll!.wagesPaid).toBe(0);}
  expect(r.preparationDay).toBe(11);expect(r.staffPreview('delivery')).toMatchObject({owned:false,expired:true,remainingDays:0,renewalPending:true});expect(r.deliveryApp.staffAvailable).toBe(false);
  const before=r.state.cash;close(r);expect(r.staffState.frozenRoles).toEqual([]);expect(r.state.cash).toBeLessThan(before);expect(r.exportCheckpoint().staff!.spent).toBe(2000);expect(r.staffState.renewalPendingRoles).toEqual(['delivery']);
 });
 it('renews only by explicit payment and retains both receipts across reload',()=>{
  const r=expired(),cash=r.state.cash;expect(r.hireStaff('box','renew')).toBe(true);expect(r.state.cash).toBe(cash-2000);expect(r.hireStaff('box','duplicate')).toBe(false);
  expect(r.staffPreview('box')).toMatchObject({owned:true,remainingDays:10,renewalPending:false});expect(r.exportCheckpoint().staff).toMatchObject({spent:4000,pendingSpent:2000,acquired:[{role:'box',hiredDay:1,actualPrice:2000}],contracts:{terms:[{role:'box',startDay:1,actualPrice:2000},{role:'box',startDay:11,actualPrice:2000}]}});
  const loaded=CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,deps)!;expect(loaded.staffPreview('box').remainingDays).toBe(10);close(loaded);expect(loaded.daySummary!.accounts.capitalPurchases).toBe(2000);expect(validateCozyCheckpoint(loaded.exportCheckpoint())).not.toBeNull();
 });
 it('persists declining a renewal and still permits later explicit renewal',()=>{
  const r=expired('oven'),cash=r.state.cash;expect(r.declineStaffRenewal('oven','decline')).toBe(true);expect(r.state.cash).toBe(cash);expect(r.staffState.renewalPendingRoles).toEqual([]);
  const loaded=CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,deps)!;expect(loaded.staffPreview('oven')).toMatchObject({expired:true,renewalPending:false});expect(loaded.hireStaff('oven','later')).toBe(true);expect(loaded.staffPreview('oven')).toMatchObject({owned:true,remainingDays:10});
 });
 it('guards expired renewal against insufficient funds, pause and an open shift',()=>{
  const r=expired(),lease=r.acquirePause('user'),cash=r.state.cash;expect(r.hireStaff('box','paused')).toBe(false);expect(r.declineStaffRenewal('box','paused-decline')).toBe(false);lease.release();
  while(r.state.cash>=1900+r.price('dough'))expect(r.buy('dough',Math.min(100,Math.floor((r.state.cash-1900)/r.price('dough'))))).toBe(true);
  const poor=r.state.cash;expect(poor).toBeLessThan(2000);expect(r.staffPreview('box').missing).toBe(2000-poor);expect(r.hireStaff('box','poor')).toBe(false);expect(r.state.cash).toBe(poor);expect(r.staffState.expiredRoles).toEqual(['box']);expect(cash).toBeGreaterThan(poor);
  expect(r.openNextDay()).toBe(true);expect(r.hireStaff('box','shift')).toBe(false);expect(r.declineStaffRenewal('box','shift-decline')).toBe(false);expect(r.staffState.frozenRoles).toEqual([]);
 });
 it('keeps historical paid wages and migrates old workers without new payments',()=>{
  const old=legacy(true)!,history=structuredClone(old.reports),cash=old.stock.cash;expect(validateCozyCheckpoint(old)).not.toBeNull();
  const loaded=CozyRuntime.restoreCheckpoint(old,false,deps)!;expect(loaded.state.cash).toBe(cash);expect(loaded.exportCheckpoint().reports).toEqual(history);expect(loaded.staffPreview('box').remainingDays).toBe(10);expect(loaded.exportCheckpoint().staff!.contracts).toMatchObject({fromDay:2,terms:STAFF_ROLES.map(role=>({role,startDay:2,actualPrice:0}))});
  close(loaded);expect(loaded.daySummary!.accounts.wages).toBe(0);expect(loaded.daySummary!.payroll!.wagesPaid).toBe(0);expect(loaded.exportCheckpoint().reports[0]).toEqual(history[0]);expect(validateCozyCheckpoint(loaded.exportCheckpoint())).not.toBeNull();
  const again=CozyRuntime.restoreCheckpoint(loaded.exportCheckpoint())!;expect(again.staffPreview('box').remainingDays).toBe(9);
 });
 it('rejects overlapping terms, fabricated free renewals and mismatched spending',()=>{
  const saved=expired().exportCheckpoint().staff!;for(const mutate of [(s:typeof saved)=>s.contracts!.terms.push({role:'box',startDay:10,actualPrice:2000}),(s:typeof saved)=>s.contracts!.terms.push({role:'box',startDay:11,actualPrice:0}),(s:typeof saved)=>s.spent+=2000,(s:typeof saved)=>s.contracts!.terms[0].startDay=0]){const forged=structuredClone(saved);mutate(forged);expect(validateStaffCheckpoint(forged,11)).toBeNull();}
 });
 it('retains historical arrears without automatic collection on new days',()=>{
  const old=legacy(false),history=structuredClone(old.reports);expect(validateCozyCheckpoint(old)).not.toBeNull();
  const schedule={schedule:(day:number)=>({day,duration:350,grace:120,slots:Array.from({length:20},(_,i)=>({id:`debt-${day}-${i}`,at:i*15,kind:'regular' as const,opportunity:'commercial' as const,commercialOrdinal:i+1,takeaway:true}))})};
  const loaded=CozyRuntime.restoreCheckpoint(old,false,schedule)!;for(const id of ['sauce','cheese'] as const)expect(loaded.buy(id,20)).toBe(true);expect(loaded.openShop()).toBe(true);for(let i=0;i<7000;i++)loaded.advance(50);expect(loaded.state.cash).toBeGreaterThan(800);expect(loaded.closeDay()).toBe(true);
  expect(loaded.daySummary!.payroll).toMatchObject({openingArrears:800,wagesPaid:0,endingArrears:800});expect(loaded.staffState.arrears).toBe(800);expect(loaded.exportCheckpoint().reports[0]).toEqual(history[0]);expect(validateCozyCheckpoint(loaded.exportCheckpoint())).not.toBeNull();
 });
 it('stages renewal atomically and retries identical payment once',async()=>{
  const payload=expired().exportCheckpoint();let envelope:CozySaveEnvelope={schemaVersion:COZY_SCHEMA_VERSION,contentVersion:COZY_CONTENT_VERSION,campaignId:'contract',commitId:'first',revision:1,checksum:checkpointChecksum(payload),payload};let fail=true;const requests:CozyWriteRequest[]=[];
  const port:CozySavePort={load:async()=>({ok:true,kind:'loaded',envelope,replacementToken:'test'}),commit:async request=>{requests.push(structuredClone(request));if(fail)return saveFailure('write-failed');envelope={...envelope,commitId:request.commitId,revision:envelope.revision+1,payload:structuredClone(request.payload),checksum:checkpointChecksum(request.payload)};return {ok:true,envelope};}};
  let id=0;const session=new CozyCampaignSession(port,()=>`contract-${++id}`),r=(await session.load())!,cash=r.state.cash;expect(session.hireStaff('box','renew')).toBe(true);await new Promise(resolve=>setTimeout(resolve,0));expect(session.view.state).toBe('error');expect(r.state.cash).toBe(cash);expect(r.staffPreview('box').expired).toBe(true);
  fail=false;await session.retry();expect(requests[1]).toEqual(requests[0]);expect(r.state.cash).toBe(cash-2000);expect(r.staffPreview('box').remainingDays).toBe(10);expect(session.hireStaff('box','duplicate')).toBe(false);
 });
});
