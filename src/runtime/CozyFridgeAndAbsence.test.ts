import {describe,it,expect} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {CozyCampaignSession} from './CozyCampaignSession';
import {fundedShopCheckpoint} from './shopTestFixture';
import {prepStaffAbsent} from '../domain/StaffAbsence';
import {validateCozyCheckpoint,COZY_SCHEMA_VERSION,COZY_CONTENT_VERSION} from '../domain/CozyCheckpoint';
import {checkpointChecksum,saveFailure,type CozySaveEnvelope,type CozyWriteRequest,type CozySavePort} from '../infrastructure/CozySaveRepository';
const schedule={schedule:(day:number)=>({day,duration:60,grace:120,slots:[{id:`fridge-${day}`,at:0,kind:'regular' as const,opportunity:'commercial' as const,commercialOrdinal:1,takeaway:true}]})};
function fresh(){const r=new CozyRuntime(false,true,schedule);r.claimTestCode('VIETVUIVE');r.configureMenu('mushroom',100,false);return r;}
function provision(r:CozyRuntime,q=2){for(const id of ['dough','sauce','cheese'] as const)expect(r.buy(id,q)).toBe(true);}

describe('fridge and unpaid prep absence integration',()=>{
  it('preserves a legacy terminal payroll on the first seeded absence day',()=>{
    const r=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint(18000),false,schedule)!;
    expect(r.hireStaff('prep','legacy-hire')).toBe(true);
    const hired=r.preparationDay,seed=r.exportCheckpoint().campaignEventSeed!;
    let finalDay=hired;while(!prepStaffAbsent(seed,hired,finalDay))finalDay++;
    // Reproduce pre-feature staffing: the worker still worked on this day.
    (r as unknown as {staffAbsenceFromDay:number}).staffAbsenceFromDay=finalDay+1;
    for(let day=hired;day<=finalDay;day++){
      provision(r,1);
      if(day===finalDay)while(r.state.cash>=r.price('sauce'))r.buy('sauce',Math.min(100,Math.floor(r.state.cash/r.price('sauce'))));
      expect(day===hired?r.openShop():r.openNextDay()).toBe(true);
      if(r.lotteryPending)r.resolveLottery(0);
      for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});
      r.dispatch({type:'bake'});
      expect(r.closeDay()).toBe(true);
    }
    expect(r.daySummary!.ending).toBe('insolvent');expect(r.daySummary!.accounts.wages).toBe(200);
    const old=r.exportCheckpoint();delete old.staffAbsenceFromDay;
    expect(old.terminal).toBe(true);expect(validateCozyCheckpoint(old)).not.toBeNull();
    expect(CozyRuntime.restoreCheckpoint(old)!.exportCheckpoint().staffAbsenceFromDay).toBe(finalDay+1);
  });
  it('restores legacy payroll before applying absence rules to future days',()=>{
    const checkpoint=fundedShopCheckpoint(18000);
    delete checkpoint.staffAbsenceFromDay;
    const restored=CozyRuntime.restoreCheckpoint(checkpoint,false,schedule)!;
    expect(restored).not.toBeNull();
    expect(restored.exportCheckpoint().staffAbsenceFromDay).toBe(checkpoint.day);
    expect(validateCozyCheckpoint(restored.exportCheckpoint())).not.toBeNull();
  });
  it('buys once at 3000, persists and reports capital cost with actual long expiry',()=>{
    const r=fresh();provision(r);r.buy('mushroom',2);const cash=r.state.cash;
    expect(r.buyFridge('fridge')).toBe(true);expect(r.state.cash).toBe(cash-3000);
    expect(r.buyFridge('retry')).toBe(false);expect(r.purchaseExpiry('dough')).toBe(8);
    expect(r.stockLots.find(l=>l.ingredient==='mushroom')!.expiry).toBe(4);
    const before=r.exportCheckpoint();expect(before.stock.refrigeration).toEqual({multiplier:4,acquiredDay:1});
    const loaded=CozyRuntime.restoreCheckpoint(before,false,schedule)!;expect(loaded.fridgeState.owned).toBe(true);
    expect(loaded.openShop()).toBe(true);expect(loaded.buyFridge('midshift')).toBe(false);expect(loaded.closeDay()).toBe(true);
    expect(loaded.daySummary!.accounts.capitalPurchases).toBe(3000);expect(loaded.daySummary!.expired).toBe(0);
    expect(validateCozyCheckpoint(loaded.exportCheckpoint())).not.toBeNull();
    expect(CozyRuntime.restoreCheckpoint(loaded.exportCheckpoint())!.stockLots.find(l=>l.ingredient==='dough')!.expiry).toBe(8);
  });
  it('extends carried usable lots during preparation while retaining historical reports',()=>{
    const r=fresh();provision(r);r.openShop();r.closeDay();const history=structuredClone(r.daySummary!.accounts.inventory.lots);
    expect(r.buyFridge('next')).toBe(true);const checkpoint=r.exportCheckpoint();
    expect(checkpoint.reports[0].accounts.inventory.lots).toEqual(history);
    expect(checkpoint.stock.lots.find(l=>l.ingredient==='dough')!.expiry).toBe(8);
    expect(validateCozyCheckpoint(checkpoint)).not.toBeNull();
    const forged=structuredClone(checkpoint);forged.stock.refrigeration!.acquiredDay=1;expect(validateCozyCheckpoint(forged)).toBeNull();
    const restored=CozyRuntime.restoreCheckpoint(checkpoint,false,schedule)!;restored.openShop();restored.closeDay();
    expect(restored.daySummary!.accounts.capitalPurchases).toBe(3000);expect(restored.exportCheckpoint().reports[0].accounts.inventory.lots).toEqual(history);
  });
  it('stages a fridge purchase atomically and retries the same saved candidate',async()=>{
    const r=fresh();provision(r);const payload=r.exportCheckpoint();
    let envelope:CozySaveEnvelope={schemaVersion:COZY_SCHEMA_VERSION,contentVersion:COZY_CONTENT_VERSION,campaignId:'fridge',commitId:'initial',revision:1,checksum:checkpointChecksum(payload),payload};
    let fail=true;const requests:CozyWriteRequest[]=[];
    const port:CozySavePort={load:async()=>({ok:true,kind:'loaded',envelope,replacementToken:'test'}),commit:async request=>{requests.push(structuredClone(request));if(fail)return saveFailure('write-failed');envelope={...envelope,commitId:request.commitId,revision:envelope.revision+1,payload:structuredClone(request.payload),checksum:checkpointChecksum(request.payload)};return {ok:true,envelope};}};
    let id=0;const session=new CozyCampaignSession(port,()=>`fridge-${++id}`),live=(await session.load())!,cash=live.state.cash,expiry=live.stockLots[0].expiry;
    expect(session.buyFridge('purchase')).toBe(true);expect(live.fridgeState.owned).toBe(false);expect(live.stockLots[0].expiry).toBe(expiry);expect(live.state.cash).toBe(cash);
    await new Promise(resolve=>setTimeout(resolve,0));expect(session.view.state).toBe('error');fail=false;await session.retry();
    expect(requests[1]).toEqual(requests[0]);expect(session.runtime).toBe(live);expect(live.state.cash).toBe(cash-3000);expect(live.stockLots[0].expiry).toBe(8);
    expect(session.buyFridge('again')).toBe(false);expect(live.exportCheckpoint().stock.refrigeration).toEqual({multiplier:4,acquiredDay:1});
  });
  it('freezes prep out of automation and wages on its seeded day off, preserving old arrears',()=>{
    const r=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint(18000),false,schedule)!;
    expect(r.hireStaff('prep','hire')).toBe(true);expect(r.hireStaff('box','box')).toBe(true);
    const hiredDay=r.preparationDay,seed=r.exportCheckpoint().campaignEventSeed!;
    let absentDay=hiredDay;while(!prepStaffAbsent(seed,hiredDay,absentDay))absentDay++;
    expect(absentDay-hiredDay).toBeGreaterThanOrEqual(5);expect(absentDay-hiredDay).toBeLessThanOrEqual(7);
    for(let day=hiredDay;day<=absentDay;day++){
      provision(r,1);
      if(day===absentDay){expect(r.staffState.absentRoles).toEqual(['prep']);expect(r.staffState.dailyWages).toBe(200);expect(r.staffPreview('prep').dailyWage).toBe(0);}
      expect(day===hiredDay?r.openShop():r.openNextDay()).toBe(true);
      if(day===absentDay){r.advanceElapsed(2000);expect(r.state.ingredients).toEqual([]);expect(r.staffState.jobs).toEqual([]);expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(true);expect(r.staffState.frozenRoles).toEqual(['box']);}
      expect(r.closeDay()).toBe(true);expect(r.daySummary!.accounts.wages).toBe(day===absentDay?200:400);
      expect(validateCozyCheckpoint(r.exportCheckpoint())).not.toBeNull();
    }
    const restored=CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,schedule)!;
    expect(restored.staffState.absentRoles).toEqual([]);expect(restored.staffState.dailyWages).toBe(400);
  });
});
