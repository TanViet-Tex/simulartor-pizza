import {describe,expect,it} from 'vitest';
import {CAMPAIGN_EVENT_A,LEGACY_EVENT_SEED} from '../config/campaignEvents';
import {campaignEventRoll,campaignEventSeed,chooseCampaignEvent} from '../domain/CampaignEvents';
import {validateCozyCheckpoint,COZY_CONTENT_VERSION,COZY_SCHEMA_VERSION} from '../domain/CozyCheckpoint';
import {CozyStock,validateStockSnapshot} from '../domain/CozyStock';
import {checkpointChecksum,validateSaveEnvelope,type CozySaveEnvelope,type CozySavePort,type CozyWriteRequest} from '../infrastructure/CozySaveRepository';
import {CozyRuntime} from './CozyRuntime';
import {CozyCampaignSession} from './CozyCampaignSession';
import {ORDER_TEST_SCHEDULE} from './cozyScheduleFixture';

const eventSeed=Array.from({length:100},(_,i)=>i).find(seed=>campaignEventRoll(seed,1)<.1)!;
function eventRuntime(){return new CozyRuntime(false,true,{...ORDER_TEST_SCHEDULE,eventSeed});}
function envelope(payload:ReturnType<CozyRuntime['exportCheckpoint']>,campaignId='old-identity'):CozySaveEnvelope {return {schemaVersion:COZY_SCHEMA_VERSION,contentVersion:COZY_CONTENT_VERSION,campaignId,commitId:'create',revision:1,checksum:checkpointChecksum(payload),payload};}

describe('Campaign Event A',()=>{
  it('honors exact probability boundary, invalid rolls, one/day, adjacent day and day-distance cooldown',()=>{
    const at10={id:'A' as const,day:10,loss:200 as const};
    expect(CAMPAIGN_EVENT_A).toEqual({id:'A',probability:.1,loss:200,cooldownDays:3});
    expect(chooseCampaignEvent(3,10,[],()=>.099999)).toEqual(at10);
    for(const roll of [.1,1,NaN,-.1])expect(chooseCampaignEvent(3,10,[],()=>roll)).toBeNull();
    for(const day of [10,11,12])expect(chooseCampaignEvent(3,day,[at10],()=>0)).toBeNull();
    expect(chooseCampaignEvent(3,13,[at10],()=>0)).toEqual({...at10,day:13});
  });
  it('uses stable uniform daily decisions and detached event state',()=>{
    const seed=campaignEventSeed('campaign-id');
    expect(campaignEventSeed('campaign-id')).toBe(seed);
    expect(campaignEventSeed('different-campaign')).not.toBe(seed);
    const rolls=Array.from({length:10000},(_,day)=>campaignEventRoll(seed,day+1));
    expect(rolls.every(roll=>roll>=0&&roll<1)).toBe(true);
    expect(rolls.filter(roll=>roll<.1).length).toBeGreaterThan(850);
    expect(rolls.filter(roll=>roll<.1).length).toBeLessThan(1150);
    expect(campaignEventRoll(seed,7)).toBe(rolls[6]);
    const r=eventRuntime();r.openShop();const decision=r.campaignEvents.decision!;decision.loss=200;decision.day=900;
    expect(r.campaignEvent.day).toBe(1);
  });
  it('applies the full 200 to cash50 once and acknowledgement/menu leases cannot spend again',()=>{
    const r=eventRuntime();expect(r.buy('dough',50)).toBe(true);expect(r.state.cash).toBe(50);
    expect(r.openShop()).toBe(true);expect(r.state.cash).toBe(-150);
    expect(r.campaignEvent).toEqual({day:1,id:'A',loss:200,acknowledged:false});
    expect(r.openShop()).toBe(false);expect(r.acknowledgeCampaignEvent()).toBe(true);expect(r.acknowledgeCampaignEvent()).toBe(false);
    const lease=r.acquirePause('menu');lease.release();r.advance(50);
    expect(r.state.cash).toBe(-150);expect(r.buy('cheese',1)).toBe(false);
    expect(r.closeDay()).toBe(true);const report=r.daySummary!;
    expect(report).toMatchObject({campaignEvent:{id:'A',loss:200},cash:-170,profit:-220,accounts:{eventLoss:200,other:200,endingCash:-170}});
    const saved=r.exportCheckpoint();expect(validateCozyCheckpoint(saved)).not.toBeNull();
    const restored=CozyRuntime.restoreCheckpoint(saved)!;expect(restored.daySummary).toEqual(report);
    expect(restored.closeDay()).toBe(false);expect(restored.state.cash).toBe(-170);
  });
  it('still receives and delivers orders with negative cash',()=>{
    const r=eventRuntime();for(const id of ['dough','sauce','cheese'] as const)r.buy(id,1);r.buy('dough',47);
    expect(r.state.cash).toBe(50);r.openShop();expect(r.state.cash).toBe(-150);expect(r.tickets).toHaveLength(1);
    for(const ingredient of ['dough','sauce','cheese'] as const)expect(r.dispatch({type:'ingredient',ingredient})).toBe(true);
    expect(r.dispatch({type:'bake'})).toBe(true);for(let t=0;t<120;t++)r.advance(50);
    expect(r.dispatch({type:'extract'})).toBe(true);expect(r.dispatch({type:'box'})).toBe(true);expect(r.dispatch({type:'deliver'})).toBe(true);
    expect(r.state.cash).toBe(-100);expect(r.daySummary).toBeNull();
    r.closeDay();expect(r.daySummary!.delivered).toBe(1);expect(r.exportCheckpoint().stock.cash).toBe(-120);
  });
  it('reloads the saved beginning of the day to the same event after preparation purchases',()=>{
    const initial=eventRuntime().exportCheckpoint();expect(initial.campaignEventSeed).toBe(eventSeed);
    const one=CozyRuntime.restoreCheckpoint(initial)!,two=CozyRuntime.restoreCheckpoint(initial)!;
    one.buy('dough',1);one.openShop();two.openShop();
    expect(one.campaignEvents.decision).toEqual(two.campaignEvents.decision);
    expect(one.state.cash).toBe(two.state.cash-5);
    one.acknowledgeCampaignEvent();expect(one.campaignEvent.id).toBe('A');
  });
  it('permits overdrafts only with exact event ledger costs and rejects mismatched report economics',()=>{
    const stock=new CozyStock();stock.buy('dough',50);expect(stock.applyCampaignLoss(1)).toBe(true);expect(stock.applyCampaignLoss(1)).toBe(false);
    expect(stock.cash).toBe(-150);expect(stock.debit(1)).toBe(false);expect(CozyStock.restore(stock.exportCheckpoint())?.cash).toBe(-150);
    const unproven=stock.exportCheckpoint();delete unproven.books[0].eventLoss;expect(validateStockSnapshot(unproven)).toBeNull();
    const r=eventRuntime();r.buy('dough',50);r.openShop();r.closeDay();const original=r.exportCheckpoint();
    const changes:((s:typeof original)=>void)[]=[s=>{s.campaignEventSeed=-1;},s=>{s.reports[0].campaignEvent!.loss=199 as 200;},s=>{s.reports[0].accounts.eventLoss=0;},s=>{s.reports[0].accounts.other=0;},s=>{delete s.stock.books[0].eventLoss;},s=>{delete s.reports[0].campaignEvent;},s=>{s.stock.cash--;},s=>{s.reports[0].profit++;}];
    for(const change of changes){const value=structuredClone(original);change(value);expect(validateCozyCheckpoint(value)).toBeNull();}
  });
  it('keeps old reports untouched and verifies the original checksum before normalization',()=>{
    const r=new CozyRuntime(false,true,{...ORDER_TEST_SCHEDULE,eventSeed:LEGACY_EVENT_SEED});r.buy('dough',1);r.openShop();r.closeDay();
    const legacy=r.exportCheckpoint();delete legacy.campaignEventSeed;
    const source=structuredClone(legacy),raw=envelope(legacy),valid=validateSaveEnvelope(raw);
    expect('payload' in valid).toBe(true);if(!('payload' in valid))return;
    expect(valid.payload.reports).toEqual(source.reports);expect(legacy).toEqual(source);
    expect(valid.payload.campaignEventSeed).toBeUndefined();
    raw.payload.stock.cash--;expect(validateSaveEnvelope(raw)).toMatchObject({ok:false,code:'corrupt'});
  });
  it('persists each new campaign seed before play and retries the same creation payload',async()=>{
    const writes:CozyWriteRequest[]=[];let fail=true;
    const port:CozySavePort={load:async()=>({ok:true,kind:'empty',replacementToken:'empty'}),commit:async request=>{writes.push(structuredClone(request));return fail?{ok:false,code:'write-failed',message:'retry'}:{ok:true,envelope:envelope(request.payload,request.campaignId)};}};
    let serial=0;const session=new CozyCampaignSession(port,()=>`identity-${++serial}`);await session.load();expect(await session.start(false)).toBeNull();
    expect(writes[0].payload.campaignEventSeed).toBe(campaignEventSeed(writes[0].campaignId));
    fail=false;await session.retry();expect(writes[1]).toEqual(writes[0]);expect(session.runtime!.campaignEvents.seed).toBe(writes[0].payload.campaignEventSeed);
  });
  it('derives legacy seed from verified immutable campaign identity, independent of preparation cash',async()=>{
    const payload=new CozyRuntime(false,true).exportCheckpoint();delete payload.campaignEventSeed;const saved=envelope(payload);
    const session=new CozyCampaignSession({load:async()=>({ok:true,kind:'loaded',envelope:saved,replacementToken:'loaded'}),commit:async()=>({ok:false,code:'write-failed',message:'unused'})});
    const r=(await session.load())!;expect(r.campaignEvents.seed).toBe(campaignEventSeed(saved.campaignId));
    r.buy('dough',1);expect(r.exportCheckpoint().campaignEventSeed).toBe(campaignEventSeed(saved.campaignId));
  });
});
