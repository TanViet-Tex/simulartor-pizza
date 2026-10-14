import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import leaderboard,{type ApiRequest,type ApiResponse} from '../../api/leaderboard';
import {CozyRuntime} from '../runtime/CozyRuntime';
const id='12345678-1234-4234-8234-123456789abc',token='a'.repeat(64);
function publication(){return {profile:{id,token,name:'  Việt   Vui  ',sequence:3},snapshot:{campaignId:'campaign',revision:2,payload:new CozyRuntime(false,true).exportCheckpoint()}};}
async function call(method='POST',body:unknown=publication(),headers:ApiRequest['headers']={}){
  let status=0,result:unknown;const response:ApiResponse={status(code){status=code;return this;},json(value){result=value;},setHeader:vi.fn()};
  await leaderboard({method,body,headers},response);return {status,result,response};
}
describe('Vercel leaderboard boundary',()=>{
  const fetchMock=vi.fn<typeof fetch>();
  beforeEach(()=>{vi.stubEnv('SUPABASE_URL','https://project.supabase.co');vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','server-secret');vi.stubGlobal('fetch',fetchMock);fetchMock.mockReset();fetchMock.mockResolvedValue(new Response('null',{status:200}));});
  afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
  it('extracts only verified checkpoint cash/day and hashes identity token',async()=>{
    const result=await call();expect(result).toMatchObject({status:200,result:{ok:true}});
    const [url,options]=fetchMock.mock.calls[0],args=JSON.parse(options!.body as string);
    expect(url).toBe('https://project.supabase.co/rest/v1/rpc/publish_player_score');expect(args).toMatchObject({p_id:id,p_name:'Việt Vui',p_sequence:3,p_cash:500,p_day:1,p_revision:2});
    expect(args.p_token_hash).toMatch(/^[0-9a-f]{64}$/);expect(args.p_token_hash).not.toBe(token);expect(options!.signal).toBeInstanceOf(AbortSignal);
  });
  it('includes cash obtained through the approved test code',async()=>{const body=publication(),runtime=new CozyRuntime(false,true);runtime.claimTestCode('VIETVUIVE');body.snapshot.payload=runtime.exportCheckpoint();expect((await call('POST',body)).status).toBe(200);expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string).p_cash).toBe(100500);});
  it('rejects a forged checkpoint before calling the database',async()=>{const body=publication();body.snapshot.payload.stock.cash=999999;expect((await call('POST',body)).status).toBe(400);expect(fetchMock).not.toHaveBeenCalled();});
  it('rejects malformed identity, name, sequence and snapshot revision',async()=>{
    for(const mutation of [(b:ReturnType<typeof publication>)=>{b.profile.id='wrong';},(b:ReturnType<typeof publication>)=>{b.profile.token='short';},(b:ReturnType<typeof publication>)=>{b.profile.name='a';},(b:ReturnType<typeof publication>)=>{b.profile.sequence=0;},(b:ReturnType<typeof publication>)=>{b.snapshot.revision=Infinity;}]){const body=publication();mutation(body);expect((await call('POST',body)).status).toBe(400);}expect(fetchMock).not.toHaveBeenCalled();
  });
  it('bounds payload length and rejects malformed JSON',async()=>{expect((await call('POST',' '.repeat(2*1024*1024+1))).status).toBe(413);expect((await call('POST','{')).status).toBe(400);expect(fetchMock).not.toHaveBeenCalled();});
  it('reports missing server configuration without making requests',async()=>{vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY','');expect(await call()).toMatchObject({status:503,result:{code:'unconfigured'}});expect(fetchMock).not.toHaveBeenCalled();});
  it('returns authenticated self rank beyond top ten',async()=>{
    const entry={id,name:'Việt Vui',cash:500,day:1,rank:15};fetchMock.mockResolvedValue(new Response(JSON.stringify({entries:[],self:entry})));
    expect(await call('GET',undefined,{'x-player-id':id,authorization:`Bearer ${token}`})).toMatchObject({status:200,result:{entries:[],self:entry}});
    const args=JSON.parse(fetchMock.mock.calls[0][1]!.body as string);expect(args.p_id).toBe(id);expect(args.p_token_hash).not.toBe(token);
  });
  it('allows public lists without identity and rejects partial credentials',async()=>{
    fetchMock.mockResolvedValue(new Response('{"entries":[],"self":null}'));expect((await call('GET')).status).toBe(200);expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string)).toEqual({p_id:null,p_token_hash:null});
    expect((await call('GET',undefined,{'x-player-id':id})).status).toBe(401);
  });
  it('maps database token mismatch to a safe forbidden response',async()=>{fetchMock.mockResolvedValue(new Response('secret database details',{status:403}));expect(await call()).toMatchObject({status:403,result:{code:'forbidden'}});});
  it('rejects bad ranking data and isolates upstream failures',async()=>{fetchMock.mockResolvedValue(new Response('{"entries":[],"self":{}}'));expect((await call('GET')).status).toBe(502);fetchMock.mockRejectedValue(new Error('server-secret'));const result=await call();expect(result.status).toBe(503);expect(JSON.stringify(result.result)).not.toContain('server-secret');});
  it('rejects cross-origin requests and unsupported methods',async()=>{expect((await call('POST',publication(),{origin:'https://other.example',host:'game.example'})).status).toBe(403);expect((await call('DELETE')).status).toBe(405);expect(fetchMock).not.toHaveBeenCalled();});
});
