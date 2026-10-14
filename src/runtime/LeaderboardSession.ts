import {isLeaderboardEntry,normalizePlayerName,playerNameError,type LeaderboardEntry,type LeaderboardMenuActions,type LeaderboardProfile,type LeaderboardSnapshot,type LeaderboardView} from '../domain/Leaderboard';

const STORAGE_KEY='pizza-leaderboard-player-v1';
type StoragePort=Pick<Storage,'getItem'|'setItem'>;
type Pending={profile:LeaderboardProfile;snapshot:LeaderboardSnapshot};
type RecordState={profile:LeaderboardProfile;pending:Pending|null;campaignId:string|null;revision:number};
export interface LeaderboardTransport {
  publish:(profile:LeaderboardProfile,snapshot:LeaderboardSnapshot)=>Promise<void>;
  read:(profile:LeaderboardProfile|null)=>Promise<{entries:LeaderboardEntry[];self:LeaderboardEntry|null}>;
}
export class LeaderboardError extends Error {constructor(readonly code:string,message:string){super(message);}}
function validProfile(value:unknown):value is LeaderboardProfile {
  const p=value as LeaderboardProfile;
  return !!p&&typeof p.id==='string'&&/^[0-9a-f-]{36}$/i.test(p.id)&&typeof p.token==='string'&&/^[0-9a-f]{64}$/.test(p.token)&&typeof p.name==='string'&&!playerNameError(p.name)&&Number.isSafeInteger(p.sequence)&&p.sequence>=0;
}
function validPending(value:unknown,profile:LeaderboardProfile):value is Pending {
  const p=value as Pending;
  return !!p&&validProfile(p.profile)&&p.profile.id===profile.id&&p.profile.token===profile.token&&p.profile.sequence<=profile.sequence&&!!p.snapshot&&typeof p.snapshot.campaignId==='string'&&Number.isSafeInteger(p.snapshot.revision)&&p.snapshot.revision>=1&&!!p.snapshot.payload&&Number.isSafeInteger(p.snapshot.payload.stock?.cash)&&Number.isSafeInteger(p.snapshot.payload.day);
}
/** Guest identity and latest unsent committed score survive reload; network never owns gameplay. */
export class LeaderboardSession implements LeaderboardMenuActions {
  private record:RecordState|null=null;
  private listeners=new Set<()=>void>();
  private status:LeaderboardView['state']='idle';
  private message='';
  private entries:LeaderboardEntry[]=[];
  private self:LeaderboardEntry|null=null;
  private running:Promise<void>|null=null;
  private readGeneration=0;
  private destroyed=false;
  private storageFailed=false;
  constructor(private readonly storage:StoragePort|null,private readonly transport:LeaderboardTransport=new HttpLeaderboardTransport(),private readonly identity:()=>{id:string;token:string}=()=>{
    const bytes=crypto.getRandomValues(new Uint8Array(32));
    return {id:crypto.randomUUID(),token:[...bytes].map(n=>n.toString(16).padStart(2,'0')).join('')};
  }){
    try{
      const raw=storage?.getItem(STORAGE_KEY),saved=raw?JSON.parse(raw) as RecordState:null;
      if(saved&&validProfile(saved.profile))this.record={profile:saved.profile,pending:validPending(saved.pending,saved.profile)?saved.pending:null,campaignId:typeof saved.campaignId==='string'?saved.campaignId:saved.pending?.snapshot?.campaignId??null,revision:Number.isSafeInteger(saved.revision)?saved.revision:saved.pending?.snapshot?.revision??0};
    }catch{this.storageFailed=true;}
  }
  view=():LeaderboardView=>({state:this.status,message:this.message,entries:this.entries.map(e=>({...e})),self:this.self?{...this.self}:null,name:this.record?.profile.name??''});
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return ()=>this.listeners.delete(listener);};
  private emit(){if(!this.destroyed)for(const listener of this.listeners)listener();}
  private persist(acknowledged?:Pending):boolean {
    try{
      if(!this.storage)throw Error();
      const raw=this.storage.getItem(STORAGE_KEY);let latest:RecordState|null=null;
      try{latest=raw?JSON.parse(raw) as RecordState:null;}catch{/* Replace corrupt identity data with the newly entered profile. */}
      if(latest&&validProfile(latest.profile)&&this.record&&latest.profile.id===this.record.profile.id&&latest.profile.token===this.record.profile.token){
        const pending=validPending(latest.pending,latest.profile)?latest.pending:null;
        const matchingAck=!!pending&&!!acknowledged&&pending.profile.sequence===acknowledged.profile.sequence&&pending.snapshot.campaignId===acknowledged.snapshot.campaignId&&pending.snapshot.revision===acknowledged.snapshot.revision;
        if(latest.profile.sequence>this.record.profile.sequence){this.record={profile:latest.profile,pending:matchingAck?null:pending,campaignId:latest.campaignId??pending?.snapshot.campaignId??null,revision:latest.revision??pending?.snapshot.revision??0};}
        else if(pending&&!matchingAck&&(!this.record.pending||pending.profile.sequence>this.record.pending.profile.sequence||pending.snapshot.campaignId===this.record.pending.snapshot.campaignId&&pending.snapshot.revision>this.record.pending.snapshot.revision)){
          this.record.pending=pending;this.record.campaignId=latest.campaignId??pending.snapshot.campaignId;this.record.revision=latest.revision??pending.snapshot.revision;
        }
      }
      this.storage.setItem(STORAGE_KEY,JSON.stringify(this.record));this.storageFailed=false;return true;
    }
    catch{this.storageFailed=true;this.status='error';this.message='Không thể lưu tên trên thiết bị. Bạn vẫn có thể chơi; xếp hạng chưa đồng bộ.';return false;}
  }
  setName=(value:string):string=>{
    const error=playerNameError(value);if(error)return error;
    const name=normalizePlayerName(value);
    try{
      const raw=this.storage?.getItem(STORAGE_KEY),latest=raw?JSON.parse(raw) as RecordState:null;
      if(this.record&&latest&&validProfile(latest.profile)&&latest.profile.id===this.record.profile.id&&latest.profile.token===this.record.profile.token&&latest.profile.sequence>this.record.profile.sequence)this.record={profile:latest.profile,pending:validPending(latest.pending,latest.profile)?latest.pending:null,campaignId:latest.campaignId??null,revision:latest.revision??0};
    }catch{/* persist handles unavailable storage. */}
    if(this.record)this.record.profile.name=name;
    else this.record={profile:{...this.identity(),name,sequence:0},pending:null,campaignId:null,revision:0};
    this.persist();this.emit();return '';
  };
  capture(snapshot:LeaderboardSnapshot,replaceCampaign=false):void {
    if(this.destroyed||!this.record)return;
    // Another tab may have published since this instance loaded its identity.
    try{
      const raw=this.storage?.getItem(STORAGE_KEY),latest=raw?JSON.parse(raw) as RecordState:null;
      if(latest&&validProfile(latest.profile)&&latest.profile.id===this.record.profile.id&&latest.profile.token===this.record.profile.token){
        const knownCampaign=latest.campaignId??latest.pending?.snapshot.campaignId??null;
        if(knownCampaign&&knownCampaign!==snapshot.campaignId&&!replaceCampaign)return;
        if(knownCampaign===snapshot.campaignId&&(latest.revision??latest.pending?.snapshot.revision??0)>snapshot.revision)return;
        this.record.profile.sequence=Math.max(this.record.profile.sequence,latest.profile.sequence);
      }
    }catch{/* persist() will surface unavailable storage without affecting the game. */}
    const old=this.record.pending;
    if(old&&old.snapshot.campaignId===snapshot.campaignId&&old.snapshot.revision===snapshot.revision&&old.profile.name===this.record.profile.name){void this.flush();return;}
    if(this.record.profile.sequence>=Number.MAX_SAFE_INTEGER){this.status='error';this.message='Không thể cập nhật xếp hạng.';this.emit();return;}
    this.record.profile.sequence++;
    this.record.campaignId=snapshot.campaignId;
    this.record.revision=snapshot.revision;
    this.record.pending={profile:{...this.record.profile},snapshot:structuredClone(snapshot)};
    if(this.persist())void this.flush();this.emit();
  }
  private fail(error:unknown){
    this.status=error instanceof LeaderboardError&&error.code==='unconfigured'?'unconfigured':'error';
    this.message=this.status==='unconfigured'?'Bảng xếp hạng online chưa được kết nối.': 'Chưa kết nối được bảng xếp hạng. Tiến độ trên máy vẫn được giữ.';
  }
  private flush():Promise<void> {
    if(this.running)return this.running;
    if(this.destroyed||!this.record?.pending)return Promise.resolve();
    if(this.storageFailed&&!this.persist())return Promise.resolve();
    this.running=(async()=>{
      while(!this.destroyed&&this.record?.pending){
        const pending=this.record.pending;
        try{await this.transport.publish(pending.profile,pending.snapshot);}
        catch(error){this.fail(error);this.emit();return;}
        if(this.destroyed)return;
        if(this.record?.pending===pending){this.record.pending=null;this.persist(pending);}
        if(!this.record?.pending&&this.status==='ready'&&this.message==='Kết quả mới chưa đồng bộ. Bấm Làm mới để thử lại.')this.message=this.entries.length?'':'Chưa có người chơi được ghi nhận.';
        if(this.status!=='loading'&&this.status!=='ready'&&!this.storageFailed){this.status='idle';this.message='';}this.emit();
        if(this.storageFailed)return;
      }
    })().finally(()=>{this.running=null;});return this.running;
  }
  refresh=():void=>{void this.load();};
  private async load(){
    const generation=++this.readGeneration;this.status='loading';this.message='Đang tải xếp hạng…';this.emit();
    await this.flush();if(this.destroyed||generation!==this.readGeneration)return;
    try{
      const result=await this.transport.read(this.record?.profile??null);
      if(this.destroyed||generation!==this.readGeneration)return;
      this.entries=result.entries;this.self=result.self;this.status='ready';this.message=this.record?.pending?'Kết quả mới chưa đồng bộ. Bấm Làm mới để thử lại.':this.entries.length?'':'Chưa có người chơi được ghi nhận.';
    }catch(error){if(this.destroyed||generation!==this.readGeneration)return;this.fail(error);}
    this.emit();
  }
  destroy(){this.destroyed=true;this.readGeneration++;this.listeners.clear();}
}

export class HttpLeaderboardTransport implements LeaderboardTransport {
  constructor(private readonly request:typeof fetch=fetch,private readonly endpoint='/api/leaderboard'){}
  private async call(method:'GET'|'POST',profile:LeaderboardProfile|null,snapshot?:LeaderboardSnapshot):Promise<unknown>{
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await this.request.call(globalThis,this.endpoint,{method,cache:'no-store',signal:controller.signal,headers:{...(profile?{Authorization:`Bearer ${profile.token}`,'X-Player-Id':profile.id}:{}),...(method==='POST'?{'Content-Type':'application/json'}:{})},...(method==='POST'?{body:JSON.stringify({profile,snapshot})}:{})});
      if(response.status===404||response.headers.get('content-type')?.includes('text/html'))throw new LeaderboardError('unconfigured','Scoreboard API is not installed');
      const result=await response.json() as {code?:string;ok?:boolean};
      if(!response.ok)throw new LeaderboardError(result.code??'network','Leaderboard request failed');
      return result;
    }finally{clearTimeout(timeout);}
  }
  async publish(profile:LeaderboardProfile,snapshot:LeaderboardSnapshot):Promise<void>{
    const result=await this.call('POST',profile,snapshot) as {ok?:boolean};if(result.ok!==true)throw new LeaderboardError('invalid-response','Invalid scoreboard response');
  }
  async read(profile:LeaderboardProfile|null):Promise<{entries:LeaderboardEntry[];self:LeaderboardEntry|null}>{
    const result=await this.call('GET',profile) as {entries?:unknown;self?:unknown};
    if(!Array.isArray(result.entries)||result.entries.length>10||result.entries.some(row=>!isLeaderboardEntry(row))||(result.self!==null&&!isLeaderboardEntry(result.self)))throw new LeaderboardError('invalid-response','Invalid scoreboard response');
    return {entries:result.entries as LeaderboardEntry[],self:result.self as LeaderboardEntry|null};
  }
}
