import {describe,expect,it,vi} from 'vitest';
import {LeaderboardError,LeaderboardSession,HttpLeaderboardTransport,type LeaderboardTransport} from './LeaderboardSession';
import {playerNameError,normalizePlayerName,type LeaderboardSnapshot} from '../domain/Leaderboard';
import {CozyRuntime} from './CozyRuntime';

const identity=()=>({id:'11111111-1111-4111-8111-111111111111',token:'a'.repeat(64)});
function storage(){const map=new Map<string,string>();return {getItem:(key:string)=>map.get(key)??null,setItem:(key:string,value:string)=>{map.set(key,value);}};}
function snapshot(revision=1):LeaderboardSnapshot {return {campaignId:'22222222-2222-4222-8222-222222222222',revision,payload:new CozyRuntime(false,true).exportCheckpoint()};}
const tick=()=>new Promise<void>(resolve=>setTimeout(resolve,0));
function transport():LeaderboardTransport{return {publish:vi.fn(async()=>{}),read:vi.fn(async()=>({entries:[],self:null}))};}

describe('named leaderboard session',()=>{
  it('normalizes Vietnamese names, rejects empty/long/control text',()=>{
    expect(normalizePlayerName('  Việt   Nam  ')).toBe('Việt Nam');
    expect(playerNameError('V\u202eiet')).not.toBe('');expect(playerNameError('a')).not.toBe('');
    expect(playerNameError('x'.repeat(21))).not.toBe('');expect(playerNameError('Nguyễn Việt')).toBe('');
  });
  it('does not create identity for invalid names and preserves identity/name on reload',()=>{
    const store=storage(),port=transport(),make=vi.fn(identity),session=new LeaderboardSession(store,port,make);
    expect(session.setName('')).not.toBe('');expect(make).not.toHaveBeenCalled();
    expect(session.setName(' Việt Nam ')).toBe('');const restored=new LeaderboardSession(store,port,()=>{throw Error('unexpected identity');});
    expect(restored.view().name).toBe('Việt Nam');restored.capture(snapshot());expect(port.publish).toHaveBeenCalledWith(expect.objectContaining({id:identity().id,name:'Việt Nam'}),snapshot());
  });
  it('serializes in-flight updates and replaces queued scores with the latest committed checkpoint',async()=>{
    let release!:()=>void;const port=transport();port.publish=vi.fn().mockImplementationOnce(()=>new Promise<void>(resolve=>{release=resolve;})).mockResolvedValue(undefined);
    const session=new LeaderboardSession(storage(),port,identity);session.setName('Player');session.capture(snapshot(1));session.capture(snapshot(2));session.capture(snapshot(3));
    expect(port.publish).toHaveBeenCalledTimes(1);release();await tick();expect(port.publish).toHaveBeenCalledTimes(2);
    expect(port.publish).toHaveBeenLastCalledWith(expect.objectContaining({sequence:3}),snapshot(3));
  });
  it('retains failed committed snapshot through reload and retries on refresh, including test-code funds',async()=>{
    const store=storage(),port=transport();port.publish=vi.fn().mockRejectedValueOnce(Error('offline')).mockResolvedValue(undefined);
    const session=new LeaderboardSession(store,port,identity);session.setName('Player');const r=new CozyRuntime(false,true);r.claimTestCode('VIETVUIVE');
    const score={...snapshot(),payload:r.exportCheckpoint()};session.capture(score);await tick();expect(session.view().state).toBe('error');session.destroy();
    const restored=new LeaderboardSession(store,port,identity);restored.refresh();await tick();expect(port.publish).toHaveBeenLastCalledWith(expect.anything(),score);expect(score.payload.stock.cash).toBe(100500);
    expect(restored.view().state).toBe('ready');
  });
  it('does not publish unnamed or storage-unavailable players; local name entry stays usable',()=>{
    const port=transport(),session=new LeaderboardSession(null,port,identity);session.capture(snapshot());expect(port.publish).not.toHaveBeenCalled();
    expect(session.setName('Player')).toBe('');session.capture(snapshot());expect(port.publish).not.toHaveBeenCalled();expect(session.view().state).toBe('error');
  });
  it('allocates above another tab sequence and keeps an unsent-score warning when public read succeeds',async()=>{
    const store=storage(),port=transport(),a=new LeaderboardSession(store,port,identity);a.setName('Player');
    const b=new LeaderboardSession(store,port,identity);a.capture(snapshot());await tick();b.capture(snapshot(2));await tick();
    expect(port.publish).toHaveBeenLastCalledWith(expect.objectContaining({sequence:2}),snapshot(2));
    port.publish=vi.fn(async()=>{throw Error('offline');});b.capture(snapshot(3));await tick();b.refresh();await tick();
    expect(b.view()).toMatchObject({state:'ready',message:expect.stringContaining('chưa đồng bộ')});
  });
  it('reports unconfigured API without fabricating rankings',async()=>{
    const port=transport();port.read=vi.fn(async()=>{throw new LeaderboardError('unconfigured','missing');});
    const session=new LeaderboardSession(storage(),port,identity);session.refresh();await tick();expect(session.view()).toMatchObject({state:'unconfigured',entries:[],self:null});
  });
  it('an older tab acknowledgement cannot erase another tab latest durable failed score',async()=>{
    const store=storage(),aPort=transport(),bPort=transport();let release!:()=>void;
    aPort.publish=vi.fn().mockImplementationOnce(()=>new Promise<void>(resolve=>{release=resolve;})).mockResolvedValue(undefined);
    bPort.publish=vi.fn(async()=>{throw Error('offline');});
    const a=new LeaderboardSession(store,aPort,identity);a.setName('Player');const b=new LeaderboardSession(store,bPort,identity);
    a.capture(snapshot(1));b.capture(snapshot(2));await tick();release();await tick();
    // A may safely help publish B's pending update, but must never replace it with rev1.
    expect(aPort.publish).toHaveBeenLastCalledWith(expect.objectContaining({sequence:2}),snapshot(2));
    expect(JSON.parse(store.getItem('pizza-leaderboard-player-v1')!).profile.sequence).toBe(2);
  });
  it('refresh retries persistence after storage becomes writable again',async()=>{
    const backing=storage();let blocked=false;const store={getItem:backing.getItem,setItem:(key:string,value:string)=>{if(blocked)throw Error('quota');backing.setItem(key,value);}},port=transport();
    const session=new LeaderboardSession(store,port,identity);session.setName('Player');blocked=true;session.capture(snapshot());expect(port.publish).not.toHaveBeenCalled();
    blocked=false;session.refresh();await tick();expect(port.publish).toHaveBeenCalledTimes(1);expect(session.view().state).toBe('ready');
  });
  it('a stale campaign cannot replace another tab new campaign without an explicit new start',async()=>{
    const store=storage(),port=transport(),a=new LeaderboardSession(store,port,identity);a.setName('Player');a.capture(snapshot());await tick();
    const b=new LeaderboardSession(store,port,identity),newRun={...snapshot(),campaignId:'33333333-3333-4333-8333-333333333333'};
    b.capture(newRun,true);await tick();const calls=vi.mocked(port.publish).mock.calls.length;
    a.capture(snapshot(2));await tick();expect(port.publish).toHaveBeenCalledTimes(calls);
    a.capture(snapshot(),true);await tick();expect(port.publish).toHaveBeenLastCalledWith(expect.anything(),snapshot());
  });
  it('never replaces a newer pending revision with a stale capture from the same campaign',async()=>{
    const store=storage(),port=transport();port.publish=vi.fn(async()=>{throw Error('offline');});
    const a=new LeaderboardSession(store,port,identity);a.setName('Player');const b=new LeaderboardSession(store,port,identity);
    b.capture(snapshot(3));await tick();const calls=vi.mocked(port.publish).mock.calls.length;
    a.capture(snapshot(2));await tick();expect(port.publish).toHaveBeenCalledTimes(calls);
    expect(JSON.parse(store.getItem('pizza-leaderboard-player-v1')!).pending.snapshot.revision).toBe(3);
    a.setName('New name');expect(a.view().name).toBe('New name');
  });
  it('can replace a corrupt stored profile after the player enters a new name',async()=>{
    const store=storage(),port=transport();store.setItem('pizza-leaderboard-player-v1','bad json');
    const session=new LeaderboardSession(store,port,identity);expect(session.setName('Player')).toBe('');session.capture(snapshot());await tick();expect(port.publish).toHaveBeenCalledTimes(1);
  });
  it('ignores late list response after destroy',async()=>{
    let release!:(value:{entries:[];self:null})=>void;const port=transport();port.read=()=>new Promise(resolve=>{release=resolve;});
    const session=new LeaderboardSession(storage(),port,identity),listener=vi.fn();session.subscribe(listener);session.refresh();await tick();session.destroy();release({entries:[],self:null});await tick();expect(listener).toHaveBeenCalledTimes(1);
  });
  it('rejects malformed ranking responses and sends auth tokens in headers, never URLs',async()=>{
    const request=vi.fn(async()=>new Response(JSON.stringify({entries:[{name:'Bad'}],self:null}),{status:200})) as unknown as typeof fetch;
    const http=new HttpLeaderboardTransport(request);await expect(http.read({...identity(),name:'Player',sequence:1})).rejects.toThrow('Invalid scoreboard response');
    const args=vi.mocked(request).mock.calls[0];expect(args[0]).toBe('/api/leaderboard');expect(args[1]?.headers).toMatchObject({Authorization:'Bearer '+identity().token});
  });
});
