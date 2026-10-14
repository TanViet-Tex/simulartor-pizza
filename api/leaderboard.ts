import {validateCozyCheckpoint} from '../src/domain/CozyCheckpoint.js';
import {isLeaderboardEntry,normalizePlayerName,playerNameError} from '../src/domain/Leaderboard.js';

declare const process:{env:Record<string,string|undefined>};
export interface ApiRequest {method?:string;headers:Record<string,string|string[]|undefined>;body?:unknown}
export interface ApiResponse {status(code:number):ApiResponse;json(value:unknown):unknown;setHeader(name:string,value:string):unknown}
const MAX_BODY_BYTES=2*1024*1024;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const tokenPattern=/^[0-9a-f]{64}$/i;
function header(req:ApiRequest,name:string):string {const value=req.headers[name];return typeof value==='string'?value:'';}
function object(value:unknown):Record<string,unknown>|null {return value!==null&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;}
function positive(value:unknown):value is number {return Number.isSafeInteger(value)&&Number(value)>0;}
async function hash(token:string):Promise<string> {
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');
}
export default async function leaderboard(req:ApiRequest,res:ApiResponse):Promise<void> {
  res.setHeader('Cache-Control','no-store');
  const fail=(status:number,code:string,message:string)=>{res.status(status).json({code,message});};
  if(req.method!=='GET'&&req.method!=='POST'){res.setHeader('Allow','GET, POST');fail(405,'method','Phương thức không hỗ trợ.');return;}
  const origin=header(req,'origin');
  if(origin){try {if(new URL(origin).host!==header(req,'host')){fail(403,'forbidden','Yêu cầu không hợp lệ.');return;}}catch {fail(403,'forbidden','Yêu cầu không hợp lệ.');return;}}
  const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key){fail(503,'unconfigured','Bảng xếp hạng chưa được cấu hình online.');return;}
  let rpc:string,args:Record<string,unknown>;
  try {
    if(req.method==='POST'){
      const declared=Number(header(req,'content-length'));
      if(declared>MAX_BODY_BYTES){fail(413,'too-large','Dữ liệu quá lớn.');return;}
      const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);
      if(!raw||new TextEncoder().encode(raw).byteLength>MAX_BODY_BYTES){fail(413,'too-large','Dữ liệu quá lớn.');return;}
      const body=object(JSON.parse(raw)),profile=object(body?.profile),snapshot=object(body?.snapshot);
      if(!profile||!snapshot||typeof profile.id!=='string'||!uuid.test(profile.id)||typeof profile.token!=='string'||!tokenPattern.test(profile.token)||typeof profile.name!=='string'||playerNameError(profile.name)||!positive(profile.sequence)||typeof snapshot.campaignId!=='string'||snapshot.campaignId.length<1||snapshot.campaignId.length>128||!positive(snapshot.revision)){
        fail(400,'invalid','Thông tin người chơi không hợp lệ.');return;
      }
      const checkpoint=validateCozyCheckpoint(snapshot.payload);
      if(!checkpoint){fail(400,'invalid','Tiến độ đã lưu không hợp lệ.');return;}
      rpc='publish_player_score';args={p_id:profile.id,p_token_hash:await hash(profile.token),p_name:normalizePlayerName(profile.name),p_sequence:profile.sequence,p_cash:checkpoint.stock.cash,p_day:checkpoint.day,p_campaign_id:snapshot.campaignId,p_revision:snapshot.revision};
    }else{
      const id=header(req,'x-player-id'),auth=header(req,'authorization');
      const token=auth.startsWith('Bearer ')?auth.slice(7):'';
      if((id||auth)&&(!uuid.test(id)||!tokenPattern.test(token))){fail(401,'unauthorized','Không thể xác nhận người chơi.');return;}
      rpc='read_player_leaderboard';args={p_id:id||null,p_token_hash:token?await hash(token):null};
    }
  }catch {fail(400,'invalid','Dữ liệu không hợp lệ.');return;}
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try {
    const response=await fetch(`${url.replace(/\/$/,'')}/rest/v1/rpc/${rpc}`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(args),signal:controller.signal});
    if(response.status===401||response.status===403){fail(403,'forbidden','Không thể xác nhận người chơi.');return;}
    if(!response.ok){fail(502,'unavailable','Bảng xếp hạng tạm thời không khả dụng.');return;}
    if(req.method==='POST'){res.status(200).json({ok:true});return;}
    const result=object(await response.json());
    if(!result||!Array.isArray(result.entries)||result.entries.length>10||!result.entries.every(isLeaderboardEntry)||(result.self!==null&&!isLeaderboardEntry(result.self))){fail(502,'unavailable','Dữ liệu bảng xếp hạng không hợp lệ.');return;}
    res.status(200).json({entries:result.entries,self:result.self});
  }catch {fail(503,'unavailable','Không thể kết nối bảng xếp hạng.');}finally {clearTimeout(timer);}
}
