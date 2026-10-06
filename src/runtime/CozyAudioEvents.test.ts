import {describe,expect,it} from 'vitest';
import {CozyRuntime,type CozyAudioEffect} from './CozyRuntime';
import {ORDER_TEST_SCHEDULE} from './cozyScheduleFixture';
import {fundedShopCheckpoint} from './shopTestFixture';

function shop(){const r=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);for(const id of ['dough','sauce','cheese'] as const)r.buy(id,4);return r;}
describe('transient gameplay audio notifications',()=>{
  it('emits successful sauce additions and box once, with removable subscriptions',()=>{
    const r=shop(),effects:CozyAudioEffect[]=[];const unsubscribe=r.subscribeAudio(effect=>effects.push(effect));
    r.openShop();expect(effects).toEqual(['arrival']);
    expect(r.dispatch({type:'box'})).toBe(false);
    r.dispatch({type:'ingredient',ingredient:'sauce'});r.dispatch({type:'ingredient',ingredient:'sauce'});
    r.pause('user');expect(r.dispatch({type:'ingredient',ingredient:'sauce'})).toBe(false);r.resume('user');
    for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});
    r.dispatch({type:'bake'});r.advanceElapsed(6000);r.dispatch({type:'extract'});r.dispatch({type:'box'});r.dispatch({type:'box'});
    expect(effects).toEqual(['arrival','sauce','sauce','box']);
    unsubscribe();r.advanceElapsed(20000);expect(effects).toHaveLength(4);
  });
  it('coalesces catchup arrivals and drops arrivals that already expired',()=>{
    const r=shop(),effects:CozyAudioEffect[]=[];r.openShop();r.subscribeAudio(effect=>effects.push(effect));
    r.advanceElapsed(45000);expect(effects).toEqual(['arrival']);
    const stale=new CozyRuntime(false,true,{schedule:day=>({day,duration:350,grace:120,slots:[{id:'first',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:true},{id:'last',at:20,kind:'hurry',opportunity:'commercial',commercialOrdinal:2,takeaway:true}]})});
    for(const id of ['dough','sauce','cheese'] as const)stale.buy(id,4);
    stale.openShop();const staleEffects:CozyAudioEffect[]=[];stale.subscribeAudio(effect=>staleEffects.push(effect));
    stale.advanceElapsed(150000);expect(staleEffects).toEqual([]);
  });
  it('shares notifications with staff automation and isolates listener failures',()=>{
    const r=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint(22000),false,{schedule:day=>({day,duration:350,grace:120,slots:[{id:'staff',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:true}]})})!;
    for(const role of ['prep','oven','box'] as const)r.hireStaff(role,'hire-'+role);
    for(const id of ['dough','sauce','cheese'] as const)r.buy(id,1);
    const effects:CozyAudioEffect[]=[];r.subscribeAudio(()=>{throw new Error('missing audio');});r.subscribeAudio(effect=>effects.push(effect));
    expect(r.openShop()).toBe(true);r.advanceElapsed(10000);
    expect(r.state.stage).toBe('boxed');expect(effects).toEqual(['arrival','sauce','box']);
  });
  it('keeps one arrival cue when an earlier new customer survives a later expiry',()=>{
    const r=new CozyRuntime(false,true,{schedule:day=>({day,duration:350,grace:120,slots:[{id:'survivor',at:10,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:true},{id:'expired',at:20,kind:'hurry',opportunity:'commercial',commercialOrdinal:2,takeaway:true}]})});
    for(const id of ['dough','sauce','cheese'] as const)r.buy(id,3);
    r.openShop();const effects:CozyAudioEffect[]=[];r.subscribeAudio(effect=>effects.push(effect));
    r.advanceElapsed(100000);expect(r.tickets).toHaveLength(1);expect(effects).toEqual(['arrival']);
  });
  it('covers practice and isolated orders without playing rejected actions',()=>{
    const r=new CozyRuntime(true),effects:CozyAudioEffect[]=[];r.subscribeAudio(effect=>effects.push(effect));
    expect(r.dispatch({type:'ingredient',ingredient:'sauce'})).toBe(false);
    r.dispatch({type:'ingredient',ingredient:'dough'});r.dispatch({type:'ingredient',ingredient:'sauce'});
    expect(effects).toEqual(['sauce']);
    const direct=new CozyRuntime(false),directEffects:CozyAudioEffect[]=[];direct.subscribeAudio(effect=>directEffects.push(effect));
    direct.dispatch({type:'ingredient',ingredient:'sauce-white'});direct.dispatch({type:'ingredient',ingredient:'sauce-white'});
    expect(directEffects).toEqual(['sauce']);
  });
  it('coalesces several completed staff pizzas in one catchup and preserves small frame effects',()=>{
    const r=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint(22000),false,{schedule:day=>({day,duration:350,grace:120,slots:Array.from({length:3},(_,i)=>({id:'staff-'+i,at:i*10,kind:'regular' as const,opportunity:'commercial' as const,commercialOrdinal:i+1,takeaway:true}))})})!;
    for(const role of ['prep','oven','box'] as const)r.hireStaff(role,'hire-'+role);
    for(const id of ['dough','sauce','cheese'] as const)r.buy(id,3);
    r.openShop();const effects:CozyAudioEffect[]=[];r.subscribeAudio(effect=>effects.push(effect));
    r.advanceElapsed(19000);
    expect(r.tickets.filter(t=>t.stage==='boxed')).toHaveLength(2);
    expect(effects.filter(effect=>effect==='sauce')).toHaveLength(1);expect(effects.filter(effect=>effect==='box')).toHaveLength(1);
    effects.length=0;
    for(let i=0;i<200;i++)r.advanceElapsed(50);
    expect(r.tickets.filter(t=>t.stage==='boxed')).toHaveLength(3);
    expect(effects.filter(effect=>effect==='sauce')).toHaveLength(1);expect(effects.filter(effect=>effect==='box')).toHaveLength(1);
  });
});
