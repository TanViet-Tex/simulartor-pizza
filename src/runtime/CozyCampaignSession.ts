import {TEST_CODE,normalizeTestCode} from '../domain/TestCode';
import {campaignEventSeed} from '../domain/CampaignEvents';
import {CozyRuntime} from './CozyRuntime';
import {PlayLifecycle,type PauseLease} from './PlayLifecycle';
import type {CozyLoadResult,CozySaveEnvelope,CozySavePort,CozyWriteRequest,SaveFailure} from '../infrastructure/CozySaveRepository';
import {replacementToken} from '../infrastructure/CozySaveRepository';
export type CozySaveState='loading'|'ready'|'saving'|'error'|'recovery'|'temporary';
export interface CozySaveView {state:CozySaveState;message:string;code:string|null;day:number|null;revision:number;commitId:string|null;campaignId:string|null;pending:boolean;canRetry:boolean;canTemporary:boolean;canReload:boolean}
/** Session owns persistence and its save/menu pauses. Domain outcomes remain runtime-owned. */
export class CozyCampaignSession {
  private current:CozyRuntime|null=null;
  private interruption:PlayLifecycle|null=null;
  private menuLease:PauseLease|null=null;
  private saveLease:PauseLease|null=null;
  private status:CozySaveState='loading';
  private failure:SaveFailure|null=null;
  private saved:CozySaveEnvelope|null=null;
  private recovery:Extract<CozyLoadResult,{kind:'loaded'|'recovery'}>|null=null;
  private replacement:string|undefined;
  private pending:{request:CozyWriteRequest;kind:'create'|'day'|'upgrade';tutorial:boolean;shopCommand?:string}|null=null;
  private inFlight:Promise<CozyRuntime|null>|null=null;
  private listeners=new Set<()=>void>();
  private generation=0;
  private confirmedRecovery=false;
  constructor(private readonly repository:CozySavePort,private readonly id:()=>string=()=>crypto.randomUUID()){}
  get runtime(){return this.current;}
  get lifecycle(){return this.interruption;}
  get hasSession(){return this.current!==null||this.saved!==null;}
  get busy(){return this.status==='loading'||this.status==='saving';}
  get view():CozySaveView {return {state:this.status,message:this.status==='loading'?'Đang đọc tiến độ…':this.status==='saving'?'Đang lưu ngày. Giữ trang này mở…':this.status==='recovery'?'Bản chính bị hỏng. Bản dự phòng cùng mốc mới nhất đã được kiểm tra. Xác nhận để tiếp tục; không quay lại ngày cũ.':this.status==='temporary'?'Chơi tạm không lưu. Đóng hoặc tải lại trang sẽ mất phiên này.':this.failure?this.failure.message+((this.pending?.kind==='day'||this.pending?.kind==='upgrade')?' Ngày này chưa lưu. Đóng trang sẽ mất kết quả chưa lưu.':''):'Lưu lúc tạo chiến dịch, mua nâng cấp và kết thúc ngày. Tải lại giữa ca trở về đầu ngày hiện tại.',code:this.failure?.code??null,day:this.current?(this.current.shopPhase==='summary'&&!this.current.daySummary?.ending?this.current.day+1:this.current.day):this.saved?.payload.day??null,revision:this.saved?.revision??0,commitId:this.pending?.request.commitId??this.saved?.commitId??null,campaignId:this.pending?.request.campaignId??this.saved?.campaignId??null,pending:this.pending!==null,canRetry:this.status==='error'&&this.pending!==null&&this.failure?.code!=='revision-conflict',canTemporary:this.status==='error'&&this.pending?.kind!=='day'&&this.pending?.kind!=='upgrade'&&this.failure?.code!=='revision-conflict'&&this.current===null&&['unavailable','timeout','write-failed'].includes(this.failure?.code??''),canReload:this.status==='error'&&(this.pending?.kind==='day'||this.pending?.kind==='upgrade')};}
  subscribe(listener:()=>void){this.listeners.add(listener);return ()=>this.listeners.delete(listener);}
  private publish(){for(const listener of this.listeners)listener();}
  private allowed=()=>this.status==='ready'||this.status==='temporary';
  private holdSave(){this.saveLease??=this.current?.acquirePause('save')??null;}
  private releaseSave(){this.saveLease?.release();this.saveLease=null;}
  private install(runtime:CozyRuntime){this.releaseSave();this.menuLease?.release();this.menuLease=null;this.interruption?.destroy();this.current=runtime;runtime.attachSaveGuard(()=>this.current===runtime&&this.allowed());this.interruption=new PlayLifecycle(runtime);}
  async load():Promise<CozyRuntime|null>{
    if(this.busy&&this.inFlight)return this.inFlight;
    const generation=++this.generation;this.status='loading';this.failure=null;this.holdSave();this.publish();
    const result=await this.repository.load();if(generation!==this.generation)return null;
    if(!result.ok){this.status='error';this.failure=result;this.replacement=result.replacementToken;this.publish();return null;}
    this.replacement=result.replacementToken;
    if(result.kind==='empty'){this.releaseSave();this.menuLease?.release();this.menuLease=null;this.interruption?.destroy();this.interruption=null;this.current=null;this.saved=null;this.pending=null;this.recovery=null;this.confirmedRecovery=false;this.status='ready';this.publish();return null;}
    if(result.kind==='recovery'){this.recovery=result;this.status='recovery';this.publish();return null;}
    return this.acceptLoaded(result.envelope);
  }
  private acceptLoaded(envelope:CozySaveEnvelope,recovered=false):CozyRuntime|null {
    const runtime=CozyRuntime.restoreCheckpoint(envelope.payload,false,{eventSeed:campaignEventSeed(envelope.campaignId)});if(!runtime){this.status='error';this.failure={ok:false,code:'corrupt',message:'Không thể mở tiến độ đã lưu.'};this.publish();return null;}
    this.install(runtime);this.saved=structuredClone(envelope);this.confirmedRecovery=recovered;this.pending=null;this.recovery=null;this.status='ready';this.failure=null;this.publish();return runtime;
  }
  confirmRecovery():CozyRuntime|null {if(this.status!=='recovery'||!this.recovery)return null;return this.acceptLoaded(this.recovery.envelope,true);}
  async start(tutorial=true):Promise<CozyRuntime|null> {
    if(this.busy)return null;
    if((this.pending?.kind==='day'||this.pending?.kind==='upgrade'))return null;
    if(this.status==='temporary'){this.install(new CozyRuntime(tutorial,true,{eventSeed:campaignEventSeed(this.id())}));this.publish();return this.current;}
    const campaignId=this.id(),runtime=new CozyRuntime(false,true,{eventSeed:campaignEventSeed(campaignId)}),payload=runtime.exportCheckpoint();
    this.pending={kind:'create',tutorial,request:{campaignId,commitId:this.id(),sourceRevision:0,payload,...(this.replacement!==undefined?{replacementToken:this.replacement}:{})}};
    return this.writePending();
  }
  closeDay():boolean {
    if(!this.allowed()||!this.current||!this.current.closeDay())return false;
    if(this.status==='temporary'){this.publish();return true;}
    try{this.pending={kind:'day',tutorial:false,request:{campaignId:this.saved!.campaignId,commitId:this.id(),sourceRevision:this.saved!.revision,payload:this.current.exportCheckpoint(),...(this.confirmedRecovery?{confirmedRecovery:true}:{})}};}
    catch{this.status='error';this.failure={ok:false,code:'invalid-payload',message:'Không chuẩn bị được mốc ngày hợp lệ. Kết quả vẫn ở phiên này; tải lại để mở bản lưu cũ.'};this.holdSave();this.publish();return true;}
    void this.writePending();return true;
  }
  retry():Promise<CozyRuntime|null>{if(!this.view.canRetry)return Promise.resolve(null);return this.writePending();}
  buyRecipe(recipe:import('../domain/CozyStock').StockRecipe,commandId:string):boolean {
    if(!this.allowed()||!this.current)return false;const before=this.current.exportCheckpoint();
    if(!this.current.buyRecipe(recipe,commandId))return false;if(this.status==='temporary'){this.publish();return true;}
    try{this.pending={kind:'upgrade',tutorial:false,request:{campaignId:this.saved!.campaignId,commitId:this.id(),sourceRevision:this.saved!.revision,payload:this.current.exportCheckpoint(),...(this.confirmedRecovery?{confirmedRecovery:true}:{})}};}catch{this.install(CozyRuntime.restoreCheckpoint(before)!);this.publish();return false;}void this.writePending();return true;
  }
  configureDeliveryApp(enabled:boolean,commandId:string):boolean {
    if(!this.allowed()||!this.current||!this.current.canSetPrices)return false;
    const before=this.current.exportCheckpoint();
    if(!this.current.configureDeliveryApp(enabled,commandId))return false;
    if(this.status==='temporary'){this.publish();return true;}
    try{this.pending={kind:'upgrade',tutorial:false,request:{campaignId:this.saved!.campaignId,commitId:this.id(),sourceRevision:this.saved!.revision,payload:this.current.exportCheckpoint(),...(this.confirmedRecovery?{confirmedRecovery:true}:{})}};}
    catch{this.install(CozyRuntime.restoreCheckpoint(before)!);this.publish();return false;}
    void this.writePending();return true;
  }
  buyShopItem(id:import('../domain/ShopEffects').ShopItemId,commandId:string):boolean {return this.stageShop(r=>r.buyShopItem(id,commandId),commandId);}
  placeShopItem(id:import('../domain/ShopEffects').ShopItemId,placed:boolean,commandId:string):boolean {return this.stageShop(r=>r.placeShopItem(id,placed,commandId),commandId);}
  upgradeShop(kind:'oven'|'queue',commandId:string):boolean {return this.stageShop(r=>r.upgradeShop(kind,commandId),commandId);}
  testCodeMessage(value:string):string {
    if(normalizeTestCode(value)!==TEST_CODE)return 'Mã không hợp lệ.';
    if(this.status!=='ready'||this.pending)return this.status==='saving'?'Đang lưu…':this.status==='temporary'?'Cần chiến dịch có lưu để nhận mã.':'Hãy xử lý lưu tiến độ trước khi nhận mã.';
    if(!this.current)return 'Hãy Bắt đầu lượt chơi rồi nhập mã.';
    if(this.current.testCodeClaimed)return 'Mã đã được nhận trong lượt chơi này.';
    if(!this.current.canClaimTestCode)return 'Chỉ nhận trong chuẩn bị. Hãy chốt ngày rồi nhập mã.';
    return '';
  }
  claimTestCode(value:string):boolean {
    if(this.testCodeMessage(value))return false;
    return this.stageShop(r=>r.claimTestCode(value),'test-code:VIETVUIVE',true);
  }
  hireStaff(role:import('../config/staffCatalog').StaffRole,commandId:string):boolean {return this.stageShop(r=>r.hireStaff(role,commandId),commandId);}
  private stageShop(action:(candidate:CozyRuntime)=>boolean,commandId:string,testCode=false):boolean {
    if(!this.allowed()||!this.current||!(testCode?this.current.canClaimTestCode:this.current.canSetPrices)||this.current.shopCommandUsed(commandId))return false;
    if(this.status==='temporary'){const accepted=action(this.current);if(accepted)this.publish();return accepted;}
    const candidate=CozyRuntime.restoreCheckpoint(this.current.exportCheckpoint())!;
    if(!action(candidate))return false;
    this.pending={kind:'upgrade',tutorial:false,shopCommand:commandId,request:{campaignId:this.saved!.campaignId,commitId:this.id(),sourceRevision:this.saved!.revision,payload:candidate.exportCheckpoint(),...(this.confirmedRecovery?{confirmedRecovery:true}:{})}};
    void this.writePending();return true;
  }
  private writePending():Promise<CozyRuntime|null> {
    if(this.inFlight)return this.inFlight;
    const pending=this.pending;if(!pending)return Promise.resolve(null);
    const generation=this.generation;this.status='saving';this.failure=null;this.holdSave();this.publish();
    this.inFlight=(async()=>{
      const result=await this.repository.commit(structuredClone(pending.request));if(generation!==this.generation)return null;
      if(!result.ok){this.status='error';this.failure=result;this.publish();return null;}
      this.saved=structuredClone(result.envelope);this.replacement=replacementToken({campaignId:result.envelope.campaignId,checksum:result.envelope.checksum,commitId:result.envelope.commitId,revision:result.envelope.revision});this.confirmedRecovery=false;
      if(pending.shopCommand)this.current!.confirmShopCheckpoint(result.envelope.payload,pending.shopCommand);
      if(pending.kind==='create')this.install(CozyRuntime.restoreCheckpoint(result.envelope.payload,pending.tutorial)!);
      this.pending=null;this.status='ready';this.failure=null;this.releaseSave();this.publish();return this.current;
    })().finally(()=>{this.inFlight=null;});return this.inFlight;
  }
  temporary(tutorial=true):CozyRuntime|null {
    if(!this.view.canTemporary)return null;this.pending=null;this.saved=null;this.recovery=null;this.install(new CozyRuntime(tutorial,true,{eventSeed:campaignEventSeed(this.id())}));this.status='temporary';this.failure=null;this.publish();return this.current;
  }
  returnToMenu(){if(this.current)this.menuLease??=this.current.acquirePause('menu');}
  continue():CozyRuntime|null {if(!this.allowed())return null;if(!this.current&&this.saved)this.install(CozyRuntime.restoreCheckpoint(this.saved.payload,false,{eventSeed:campaignEventSeed(this.saved.campaignId)})!);this.menuLease?.release();this.menuLease=null;return this.current;}
  destroy(){this.generation++;this.releaseSave();this.menuLease?.release();this.menuLease=null;this.interruption?.destroy();this.interruption=null;this.current=null;this.listeners.clear();}
}
