import {describe,it,expect} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {CozyCampaignSession} from './CozyCampaignSession';
import {fundedShopCheckpoint} from './shopTestFixture';
import {cozyCampaignResults} from '../domain/CozyCampaignResults';
import {validateCozyCheckpoint,COZY_CONTENT_VERSION,COZY_SCHEMA_VERSION,type CozyCheckpoint} from '../domain/CozyCheckpoint';
import {checkpointChecksum,saveFailure,validateSaveEnvelope,type CozySaveEnvelope,type CozySavePort,type CozyWriteRequest} from '../infrastructure/CozySaveRepository';
import type {ScheduleFactory} from '../config/cozySchedule';

const schedule:ScheduleFactory=day=>({day,duration:240,grace:120,slots:[{id:`day-${day}`,at:0,kind:'picky',opportunity:'commercial',commercialOrdinal:1,takeaway:true}]});
function throughDay29(){
 const r=new CozyRuntime(false,true,{schedule});r.configureMenu('mushroom',100,false);
 for(let day=1;day<=29;day++){
  for(const id of ['dough','sauce','cheese'] as const)expect(r.buy(id,1)).toBe(true);
  expect(day===1?r.openShop():r.openNextDay()).toBe(true);
  for(const id of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient:id});
  expect(r.dispatch({type:'bake'})).toBe(true);for(let i=0;i<140;i++)r.advance(50);
  r.dispatch({type:'extract'});r.dispatch({type:'box'});r.dispatch({type:'deliver',commandId:'served-'+day});r.continueShift();expect(r.closeDay()).toBe(true);
 }
 return r;
}
const envelope=(payload:CozyCheckpoint):CozySaveEnvelope=>({schemaVersion:COZY_SCHEMA_VERSION,contentVersion:COZY_CONTENT_VERSION,campaignId:'existing',commitId:'checkpoint',revision:1,checksum:checkpointChecksum(payload),payload});
function portWith(payload:CozyCheckpoint){
 let saved=envelope(payload),fail=true;const writes:CozyWriteRequest[]=[];
 const port:CozySavePort={load:async()=>({ok:true,kind:'loaded',envelope:saved,replacementToken:'token'}),commit:async request=>{
  writes.push(structuredClone(request));if(fail)return saveFailure('write-failed');
  saved={...envelope(request.payload),campaignId:request.campaignId,commitId:request.commitId,revision:request.sourceRevision+1};return {ok:true,envelope:saved};
 }};
 return {port,writes,allow:()=>{fail=false;},saved:()=>saved};
}

describe('Epic9 finite campaign',()=>{
 it('keeps day30 preparation and completes without requiring capital for day31',()=>{
  const r=throughDay29();expect(r.campaignEndDay).toBe(30);expect(r.exportCheckpoint()).toMatchObject({day:30,terminal:false,campaignEndDay:30});
  expect(r.buy('dough',1)).toBe(true);expect(r.openNextDay()).toBe(true);expect(r.closeDay()).toBe(true);
  expect(r.daySummary!.ending).toBe('complete');const checkpoint=r.exportCheckpoint();expect(checkpoint).toMatchObject({day:30,terminal:true});
  expect(r.canSetPrices).toBe(false);expect(r.buy('dough',1)).toBe(false);expect(r.upgradeShop('queue','after')).toBe(false);expect(r.openNextDay()).toBe(false);expect(r.openShop()).toBe(false);expect(r.closeDay()).toBe(false);
  const loaded=CozyRuntime.restoreCheckpoint(checkpoint)!;expect(loaded.campaignResults).toEqual(r.campaignResults);expect(loaded.exportCheckpoint()).toEqual(checkpoint);
  expect(loaded.openShop()).toBe(false);expect(loaded.canPrepareNextDay).toBe(false);
  const poor=CozyRuntime.restoreCheckpoint(throughDay29().exportCheckpoint(),false,{schedule})!;
  while(poor.state.cash>=poor.price('dough'))expect(poor.buy('dough',Math.min(100,Math.floor(poor.state.cash/poor.price('dough'))))).toBe(true);
  expect(poor.openShop()).toBe(true);expect(poor.closeDay()).toBe(true);expect(poor.daySummary!.viability!.viable).toBe(false);expect(poor.daySummary!.ending).toBe('complete');expect(validateCozyCheckpoint(poor.exportCheckpoint())).not.toBeNull();
 });
 it('preserves old insolvency and rejects artificial extended or premature endings',()=>{
  const r=new CozyRuntime(false,true);while(r.state.cash>=r.price('dough'))r.buy('dough',Math.min(100,Math.floor(r.state.cash/r.price('dough'))));r.openShop();r.closeDay();
  const old=r.exportCheckpoint();delete old.campaignEndDay;const loaded=CozyRuntime.restoreCheckpoint(old)!;expect(loaded.daySummary!.ending).toBe('insolvent');expect(loaded.openShop()).toBe(false);
  const unfinished=throughDay29().exportCheckpoint();unfinished.campaignEndDay=31;expect(validateCozyCheckpoint(unfinished)).toBeNull();
  const early=structuredClone(unfinished);early.campaignEndDay=30;early.reports[28].ending='complete';early.terminal=true;early.day=29;expect(validateCozyCheckpoint(early)).toBeNull();
 });
 it('preserves a real beyond30 old checkpoint and completes its already prepared day once',async()=>{
  const fsModule:string='node:fs';const {readFileSync}=await import(fsModule);const old:CozyCheckpoint=JSON.parse(readFileSync('tests/fixtures/epic9-legacy-over30.json','utf8'));
  const original=envelope(old),checked=validateSaveEnvelope(original);expect('ok' in checked).toBe(false);expect(old.day).toBeGreaterThan(30);
  const r=CozyRuntime.restoreCheckpoint(old,false,{schedule})!;expect(r.campaignEndDay).toBe(old.day);expect(r.day).toBe(old.day);expect(r.state.cash).toBe(old.stock.cash);expect(r.completedReports).toHaveLength(old.reports.length);
  expect(validateCozyCheckpoint(r.exportCheckpoint())).not.toBeNull();expect(r.buy('dough',1)).toBe(true);expect(r.openShop()).toBe(true);expect(r.closeDay()).toBe(true);expect(r.daySummary!.ending).toBe('complete');expect(r.openNextDay()).toBe(false);
  const saved=r.exportCheckpoint(),restored=CozyRuntime.restoreCheckpoint(saved)!;expect(restored.campaignResults).toEqual(r.campaignResults);expect(restored.exportCheckpoint()).toEqual(saved);
 });
 it('derives distinct app pizza and order totals and returns detached results',()=>{
  const r=throughDay29(),reports=r.completedReports,progression=r.exportCheckpoint().progression;
  const report=structuredClone(reports[0]);delete report.pizzasSold;report.delivered=1;report.revenue=48;report.reviews=[{source:'app',quantity:3,deliveryFee:0,name:'App',stars:5,reasons:[],outcome:'delivered',reputationDelta:1,relationshipDelta:0}];
  const result=cozyCampaignResults([report],progression,30);expect(result).toMatchObject({orders:1,pizzas:3,revenue:48,missionsCompleted:1});
  const copy=r.campaignResults;Object.assign(copy,{cash:-999});expect(r.campaignResults.cash).not.toBe(-999);expect(r.campaignResults.orders).toBe(29);expect(r.campaignResults.missionsCompleted).toBe(1);
 });
 it('keeps final settlement and restart candidates stable across failed commits and retry',async()=>{
  const boundary=throughDay29().exportCheckpoint(),memory=portWith(boundary);let id=0;const session=new CozyCampaignSession(memory.port,()=>`transaction-${++id}`),r=(await session.load())!;
  r.openShop();expect(session.closeDay()).toBe(true);await new Promise(resolve=>setTimeout(resolve,0));expect(session.view.state).toBe('error');const final=r.exportCheckpoint();expect(memory.saved().payload).toEqual(boundary);
  memory.allow();await session.retry();expect(memory.writes[1]).toEqual(memory.writes[0]);expect(r.exportCheckpoint()).toEqual(final);expect(session.runtime).toBe(r);
  const restartMemory=portWith(final),restart=new CozyCampaignSession(restartMemory.port,()=>`restart-${++id}`),old=(await restart.load())!;
  expect(await restart.start(false)).toBeNull();expect(restart.runtime).toBe(old);expect(restartMemory.saved().payload).toEqual(final);restartMemory.allow();const fresh=(await restart.retry())!;
  expect(restartMemory.writes[1]).toEqual(restartMemory.writes[0]);expect(fresh).not.toBe(old);expect(fresh.exportCheckpoint()).toMatchObject({day:1,campaignEndDay:30,terminal:false,reports:[],stock:{cash:300}});expect(restart.view.campaignId).not.toBe('existing');
 });
 it('earns the richest existing shop fixture before the final day',()=>{
  const checkpoint=fundedShopCheckpoint(30000);expect(checkpoint.day).toBeLessThanOrEqual(30);expect(checkpoint.stock.cash).toBeGreaterThanOrEqual(30000);expect(validateCozyCheckpoint(checkpoint)).not.toBeNull();
 });
 it('settles final-day payroll once and keeps the paid amount through reload',()=>{
  let r=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint(22000),false,{schedule})!;expect(r.hireStaff('prep','hire')).toBe(true);
  while(r.day<30){expect(r.openShop()).toBe(true);expect(r.closeDay()).toBe(true);const loaded=CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,{schedule})!;r=loaded;}
  expect(r.openShop()).toBe(true);const cash=r.state.cash;expect(r.closeDay()).toBe(true);expect(r.daySummary).toMatchObject({ending:'complete',cash:cash-220,payroll:{wagesPaid:200,endingArrears:0}});
  const final=r.exportCheckpoint(),loaded=CozyRuntime.restoreCheckpoint(final)!;expect(loaded.closeDay()).toBe(false);expect(loaded.exportCheckpoint()).toEqual(final);expect(loaded.staffState.arrears).toBe(0);
 });
});
