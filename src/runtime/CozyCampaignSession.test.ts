import {fundedShopCheckpoint} from './shopTestFixture';
import {describe,it,expect} from 'vitest';
import {CozyCampaignSession} from './CozyCampaignSession';
import {CozyRuntime} from './CozyRuntime';
import {COZY_SCHEMA_VERSION,COZY_CONTENT_VERSION} from '../domain/CozyCheckpoint';
import {checkpointChecksum,saveFailure,replacementToken,validateSaveEnvelope,type CozySavePort,type CozyLoadResult,type CozyWriteRequest,type CozyWriteResult,type CozySaveEnvelope} from '../infrastructure/CozySaveRepository';
class MemoryPort implements CozySavePort {
  value:CozySaveEnvelope|null=null;calls:CozyWriteRequest[]=[];fail=false;conflict=false;defer=false;release:(()=>void)|null=null;
  async load():Promise<CozyLoadResult>{if(!this.value)return {ok:true,kind:'empty',replacementToken:replacementToken(undefined)};const {campaignId,commitId,revision,checksum}=this.value;return {ok:true,kind:'loaded',envelope:structuredClone(this.value),replacementToken:replacementToken({campaignId,commitId,revision,checksum})};}
  async commit(request:CozyWriteRequest):Promise<CozyWriteResult>{this.calls.push(structuredClone(request));if(this.defer)await new Promise<void>(resolve=>{this.release=resolve;});if(this.conflict)return saveFailure('revision-conflict');if(this.fail)return saveFailure('write-failed');const value:CozySaveEnvelope={schemaVersion:COZY_SCHEMA_VERSION,contentVersion:COZY_CONTENT_VERSION,campaignId:request.campaignId,commitId:request.commitId,revision:(this.value?.revision??0)+1,checksum:checkpointChecksum(request.payload),payload:structuredClone(request.payload)};this.value=value;return {ok:true,envelope:value};}
}
const settle=()=>new Promise<void>(resolve=>setTimeout(resolve,0));
async function setup(funded=false){let id=0;const port=new MemoryPort(),session=new CozyCampaignSession(port,()=>`id-${++id}`);await session.load();const r=(await session.start(false))!;if(funded){port.value!.payload=fundedShopCheckpoint();port.value!.checksum=checkpointChecksum(port.value!.payload);const loaded=(await session.load())!;return {port,session,r:loaded};}return {port,session,r};}
function open(r:CozyRuntime){for(const id of ['dough','sauce','cheese'] as const)r.buy(id,1);expect(r.openShop()).toBe(true);}
describe('Cozy prepare/commit/confirm session',()=>{
  it('identifies only an in-flight tutorial save and exposes failures for normal recovery UI',async()=>{
    const port=new MemoryPort(),session=new CozyCampaignSession(port);await session.load();const r=(await session.start(true))!;port.defer=true;r.nextTutorial();await settle();expect(session.savingTutorial).toBe(true);expect(r.nextTutorial()).toBe(false);port.fail=true;port.release!();await settle();expect(session.savingTutorial).toBe(false);expect(session.view.state).toBe('error');port.defer=false;port.fail=false;await session.retry();expect(session.savingTutorial).toBe(false);expect(session.view.state).toBe('ready');session.destroy();
  });
  it('persists new-game tutorial progress, resumes its step and retries the identical failed commit',async()=>{
    let serial=0;const port=new MemoryPort(),session=new CozyCampaignSession(port,()=>`tutorial-${++serial}`);await session.load();const r=(await session.start(true))!;
    expect(port.value!.payload.tutorialProgress).toEqual({version:1,index:0,status:'active'});expect(r.nextTutorial()).toBe(true);await settle();expect(port.value!.payload.tutorialProgress?.index).toBe(1);
    const resumed=(await session.load())!;expect(resumed.tutorialProgress?.index).toBe(1);port.fail=true;expect(resumed.nextTutorial()).toBe(true);await settle();expect(session.view.state).toBe('error');expect(resumed.pauses).toContain('save');expect(resumed.nextTutorial()).toBe(false);
    const pending=port.calls[port.calls.length-1];port.fail=false;await session.retry();expect(port.calls[port.calls.length-1]).toEqual(pending);expect(session.runtime).toBe(resumed);expect(resumed.tutorialProgress?.index).toBe(2);expect(resumed.pauses).not.toContain('save');
    const lease=resumed.acquirePause('orientation');expect(resumed.skipTutorial()).toBe(true);await settle();expect(port.value!.payload.tutorialProgress?.status).toBe('skipped');expect(resumed.pauses).toContain('orientation');lease.release();session.destroy();
    const reloaded=new CozyCampaignSession(port);await reloaded.load();expect(reloaded.continue()!.tutorialPhase).toBeNull();reloaded.destroy();
  });
  it('saves real menu prices and selling state together, rejects concurrent edits and retries the same payload',async()=>{
    const {session,port,r}=await setup();port.fail=true;
    expect(session.configureMenu('cheese',105,true)).toBe(true);expect(session.configureMenu('mushroom',100,false)).toBe(false);await settle();
    expect(session.view.state).toBe('error');expect(CozyRuntime.restoreCheckpoint(port.value!.payload)!.customerProgress.pricePercents.cheese).toBe(100);
    const pending=port.calls[port.calls.length-1];port.fail=false;await session.retry();expect(port.calls[port.calls.length-1]).toEqual(pending);
    expect(session.configureMenu('mushroom',100,false)).toBe(true);await settle();const restored=(await session.load())!;
    expect(restored.customerProgress.pricePercents.cheese).toBe(105);expect(restored.menuRecipes).toEqual(['cheese']);
    expect(session.configureMenu('cheese',105,false)).toBe(false);expect(session.configureMenu('sausage',100,true)).toBe(false);
    restored.openShop();expect(session.configureMenu('cheese',100,true)).toBe(false);expect(r.state.cash).toBe(300);session.destroy();
  });
  it('grants test funds only after commit, once per campaign, with retry and owned pauses intact',async()=>{
    const {session,port,r}=await setup();const menu=r.acquirePause('menu'),user=r.acquirePause('user'),editor=r.acquirePause('order');port.fail=true;
    const receipts:number[]=[];r.subscribeCash(receipt=>receipts.push(receipt.amount));
    expect(session.claimTestCode(' vietvuive ')).toBe(true);expect(r.state.cash).toBe(300);expect(session.claimTestCode('VIETVUIVE')).toBe(false);
    await settle();expect(receipts).toEqual([]);expect(session.view.state).toBe('error');expect(r.state.cash).toBe(300);expect(port.value!.payload.stock.cash).toBe(300);
    const pending=port.calls[port.calls.length-1];port.fail=false;await session.retry();expect(port.calls[port.calls.length-1]).toEqual(pending);expect(r.state.cash).toBe(100300);expect(r.pauses).toEqual(expect.arrayContaining(['menu','user','order']));
    expect(receipts).toEqual([100000]);expect(session.claimTestCode('VIETVUIVE')).toBe(false);expect(receipts).toEqual([100000]);menu.release();user.release();editor.release();
    const restored=(await session.load())!;expect(restored.state.cash).toBe(100300);expect(restored.testCodeClaimed).toBe(true);expect(session.claimTestCode('VIETVUIVE')).toBe(false);
    expect(restored.progression.xp).toBe(0);expect(restored.state.reputation).toBe(50);
    expect((await session.start(false))!.state.cash).toBe(300);expect(session.claimTestCode('VIETVUIVE')).toBe(true);await settle();expect(session.runtime!.state.cash).toBe(100300);
  });
  it('rejects empty, wrong, no campaign, midshift and conflict without changing cash',async()=>{
    const empty=new CozyCampaignSession(new MemoryPort());await empty.load();expect(empty.claimTestCode('VIETVUIVE')).toBe(false);empty.destroy();
    const {session,port,r}=await setup();expect(session.claimTestCode('')).toBe(false);expect(session.claimTestCode('other')).toBe(false);open(r);const before=r.state.cash;session.returnToMenu();
    expect(session.claimTestCode('VIETVUIVE')).toBe(false);expect(r.state.cash).toBe(before);expect(port.calls).toHaveLength(1);session.destroy();
    const next=await setup();next.port.conflict=true;expect(next.session.claimTestCode('VIETVUIVE')).toBe(true);await settle();expect(next.r.state.cash).toBe(300);expect(next.session.view.canRetry).toBe(false);expect(next.session.claimTestCode('VIETVUIVE')).toBe(false);next.session.destroy();
  });
  it('reconciles preparation support after day close without inflating commercial income or profit',async()=>{
    const {session,r}=await setup();expect(session.claimTestCode('VIETVUIVE')).toBe(true);await settle();r.openShop();expect(session.closeDay()).toBe(true);await settle();
    const report=r.daySummary!;expect(report.accounts.supportFunds).toBe(100000);expect(report.revenue).toBe(0);expect(report.rewards).toBe(0);expect(report.profit).toBe(-20);expect(report.cash).toBe(100280);
    const restored=(await session.load())!;expect(restored.state.cash).toBe(100280);expect(restored.completedReports[0].accounts.supportFunds).toBe(100000);expect(session.claimTestCode('VIETVUIVE')).toBe(false);session.destroy();
  });
  it('accepts funds in next-day summary preparation without rewriting yesterday or double accounting on day two',async()=>{
    const {session,r}=await setup();r.openShop();expect(session.closeDay()).toBe(true);await settle();const yesterday=r.daySummary;
    expect(session.claimTestCode('VIETVUIVE')).toBe(true);await settle();expect(r.daySummary).toEqual(yesterday);expect(r.state.cash).toBe(100280);
    expect(r.openNextDay()).toBe(true);expect(session.closeDay()).toBe(true);await settle();expect(r.daySummary!.accounts.supportFunds).toBe(100000);expect(r.daySummary!.accounts.startingCash).toBe(280);expect(r.daySummary!.cash).toBe(100260);
    const restored=(await session.load())!;expect(restored.completedReports[0].accounts.supportFunds).toBeUndefined();expect(restored.completedReports[1].accounts.supportFunds).toBe(100000);session.destroy();
  });
  it('saves upgrade money and ownership together; blocked retries never charge twice',async()=>{
    const {session,port,r}=await setup(true);const cash=r.state.cash;port.defer=true;
    expect(session.upgradeShop('oven','oven')).toBe(true);expect(r.state.cash).toBe(cash);
    expect(session.upgradeShop('oven','again')).toBe(false);expect(session.view.state).toBe('saving');
    port.release!();await settle();expect(session.view.state).toBe('ready');
    const loaded=(await session.load())!;expect(loaded.ovenLevel).toBe(1);expect(loaded.state.cash).toBe(cash-2000);
    expect(port.value!.payload.upgrades.pendingSpent).toBe(2000);
  });
  it('keeps the old save on upgrade write failure and retries the same atomic payload',async()=>{
    const {session,port,r}=await setup(true);const cash=r.state.cash;port.fail=true;expect(session.upgradeShop('queue','queue')).toBe(true);await settle();
    expect(session.view.state).toBe('error');expect(port.value!.payload.stock.cash).toBe(cash);
    expect(r.queueCapacity).toBe(4);expect(r.state.cash).toBe(cash);expect(r.openShop()).toBe(false);
    const request=port.calls[1];port.fail=false;await session.retry();expect(port.calls[2]).toEqual(request);
    expect((await session.load())!.queueCapacity).toBe(5);expect(session.runtime!.state.cash).toBe(cash-6000);
  });
  it('explicit empty-store reload removes stale runtime and prevents its further mutations',async()=>{
    const {session,port,r}=await setup();port.value=null;expect(await session.load()).toBeNull();expect(session.runtime).toBeNull();expect(session.hasSession).toBe(false);expect(r.buy('dough',1)).toBe(false);expect(await session.start(false)).not.toBeNull();
  });
  it('new temporary campaign keeps explicit no-save mode when storage is unavailable',async()=>{
    let writes=0;const session=new CozyCampaignSession({load:async()=>saveFailure('unavailable'),commit:async()=>{writes++;return saveFailure('unavailable');}});await session.load();const old=session.temporary(false)!;old.buy('dough',1);const fresh=(await session.start(false))!;expect(fresh).not.toBe(old);expect(fresh.state.cash).toBe(300);expect(session.view.state).toBe('temporary');expect(writes).toBe(0);
  });
  it('creates before purchases; RAM taps do not write and reload restores same unclosed day',async()=>{
    const {session,port,r}=await setup();open(r);r.advance(100);expect(port.calls).toHaveLength(1);expect(port.value?.payload.stock.cash).toBe(300);const loaded=(await session.load())!;expect(loaded.day).toBe(1);expect(loaded.state.cash).toBe(300);expect(loaded.shopOpen).toBe(false);expect(loaded.tickets).toEqual([]);
  });
  it('blocks every preparation/reset/advance until confirmation and retries the exact once-calculated payload',async()=>{
    const {session,port,r}=await setup();open(r);const hidden=r.acquirePause('visibility');hidden.release();port.fail=true;expect(session.closeDay()).toBe(true);const summary=r.daySummary;expect(session.closeDay()).toBe(false);await settle();expect(session.view).toMatchObject({state:'error',pending:true,canRetry:true});expect(r.buy('dough',1)).toBe(false);expect(r.configureMenu('cheese',100,true)).toBe(false);expect(r.openNextDay()).toBe(false);expect(r.dispatch({type:'reset'})).toBe(false);
    const pending=port.calls[1];port.fail=false;port.defer=true;const visibility=r.acquirePause('visibility'),retry=session.retry();expect(session.view.state).toBe('saving');expect(r.canPrepareNextDay).toBe(false);port.release!();await retry;expect(port.calls[2]).toEqual(pending);expect(r.daySummary).toEqual(summary);expect(r.pauses).toContain('visibility');expect(r.pauses).not.toContain('save');visibility.release();expect(r.canPrepareNextDay).toBe(true);expect(port.value?.payload.day).toBe(2);expect(r.buy('dough',1)).toBe(true);expect(r.daySummary).toEqual(summary);expect(port.value?.payload.stock.cash).toBe(summary?.cash);
  });
  it('conflict requires latest reload, keeps pending result and never retries or merges',async()=>{
    const {session,port,r}=await setup();open(r);port.conflict=true;session.closeDay();await settle();expect(session.view).toMatchObject({state:'error',code:'revision-conflict',canRetry:false});expect(r.openNextDay()).toBe(false);await session.retry();expect(port.calls).toHaveLength(2);port.conflict=false;const loaded=(await session.load())!;expect(loaded.day).toBe(1);expect(session.view.pending).toBe(false);
  });
  it('accepts same-checkpoint recovery only after explicit confirmation and temporary play only for initial storage failure',async()=>{
    const value=(await setup()).port.value!,session=new CozyCampaignSession({load:async()=>({ok:true,kind:'recovery',envelope:value,replacementToken:'token'}),commit:async()=>saveFailure('unavailable')});await session.load();expect(session.runtime).toBeNull();expect(session.continue()).toBeNull();expect(session.confirmRecovery()?.day).toBe(1);
    const unavailable=new CozyCampaignSession({load:async()=>saveFailure('unavailable'),commit:async()=>saveFailure('unavailable')});await unavailable.load();expect(unavailable.view.canTemporary).toBe(true);const r=unavailable.temporary(false)!;open(r);expect(unavailable.closeDay()).toBe(true);expect(unavailable.view.state).toBe('temporary');expect(r.canPrepareNextDay).toBe(true);
  });
  it('checks envelope checksum and distinguishes version/content/migration failures without mutating originals',()=>{
    const payload=new CozyRuntime(false,true).exportCheckpoint(),e:CozySaveEnvelope={schemaVersion:COZY_SCHEMA_VERSION,contentVersion:COZY_CONTENT_VERSION,campaignId:'campaign',commitId:'commit',revision:1,checksum:checkpointChecksum(payload),payload};
    expect(validateSaveEnvelope(e)).toEqual(e);expect(validateSaveEnvelope({...e,payload:{...payload,reputation:99}})).toMatchObject({ok:false,code:'corrupt'});expect(validateSaveEnvelope({...e,schemaVersion:COZY_SCHEMA_VERSION+1})).toMatchObject({code:'newer-version'});expect(validateSaveEnvelope({...e,schemaVersion:0})).toMatchObject({code:'migration-failed'});expect(validateSaveEnvelope({...e,contentVersion:'different'})).toMatchObject({code:'incompatible-content'});expect(e.payload.reputation).toBe(50);
  });
});
