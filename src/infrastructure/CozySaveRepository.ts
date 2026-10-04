import {COZY_SCHEMA_VERSION,COZY_CONTENT_VERSION,COZY_LEGACY_CONTENT_VERSION,validateCozyCheckpoint,type CozyCheckpoint} from '../domain/CozyCheckpoint';
export const COZY_SAVE_DATABASE='pizza-cozy-checkpoints';
export const COZY_SAVE_STORE='latest';
export type SaveFailureCode='unavailable'|'timeout'|'write-failed'|'corrupt'|'newer-version'|'incompatible-content'|'migration-failed'|'revision-conflict'|'invalid-payload';
export type SaveFailure={ok:false;code:SaveFailureCode;message:string;replacementToken?:string};
export type SaveIdentity={campaignId:string;commitId:string;revision:number;checksum:string};
export type CozySaveEnvelope=SaveIdentity&{schemaVersion:number;contentVersion:string;payload:CozyCheckpoint};
export type CozyLoadResult=SaveFailure|{ok:true;kind:'empty';replacementToken:string}|{ok:true;kind:'loaded'|'recovery';envelope:CozySaveEnvelope;replacementToken:string};
export type CozyWriteRequest={campaignId:string;commitId:string;payload:CozyCheckpoint;sourceRevision:number;replacementToken?:string;confirmedRecovery?:boolean};
export type CozyWriteResult=SaveFailure|{ok:true;envelope:CozySaveEnvelope};
export interface CozySavePort {load():Promise<CozyLoadResult>;commit(request:CozyWriteRequest):Promise<CozyWriteResult>}
const messages:Record<SaveFailureCode,string>={unavailable:'Không mở được bộ nhớ lưu. Thử đọc lại hoặc chọn chơi tạm không lưu.',timeout:'Lưu quá thời gian. Giữ trang này mở và thử lại.', 'write-failed':'Chưa ghi được tiến độ. Bản lưu cũ được giữ nguyên.',corrupt:'Bản lưu không hợp lệ. Không tự sửa hoặc quay lại ngày cũ.', 'newer-version':'Bản lưu thuộc phiên bản game mới hơn.', 'incompatible-content':'Bản lưu không phù hợp nội dung demo này.', 'migration-failed':'Không chuyển được phiên bản bản lưu. Dữ liệu gốc được giữ nguyên.', 'revision-conflict':'Tiến độ đã thay đổi ở tab khác. Cần tải lại bản mới nhất.', 'invalid-payload':'Trạng thái ngày không hợp lệ để lưu.'};
export const saveFailure=(code:SaveFailureCode):SaveFailure=>({ok:false,code,message:messages[code]});
function canonical(value:unknown):string {if(value===null||typeof value!=='object')return JSON.stringify(value)??'undefined';if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical((value as Record<string,unknown>)[k])).join(',')+'}';}
export function checkpointChecksum(payload:unknown):string {let hash=2166136261;const value=canonical(payload);for(let i=0;i<value.length;i++)hash=Math.imul(hash^value.charCodeAt(i),16777619);return (hash>>>0).toString(16).padStart(8,'0');}
export function replacementToken(latest:unknown):string {return canonical(latest);}
function identity(value:unknown):SaveIdentity|null {if(!value||typeof value!=='object')return null;const s=value as SaveIdentity;return typeof s.campaignId==='string'&&s.campaignId.length>0&&s.campaignId.length<=100&&typeof s.commitId==='string'&&s.commitId.length>0&&s.commitId.length<=100&&Number.isSafeInteger(s.revision)&&s.revision>=1&&s.revision<=100000&&typeof s.checksum==='string'&&/^[a-f\d]{8}$/.test(s.checksum)?{campaignId:s.campaignId,commitId:s.commitId,revision:s.revision,checksum:s.checksum}:null;}
function same(a:SaveIdentity,b:SaveIdentity){return a.campaignId===b.campaignId&&a.commitId===b.commitId&&a.revision===b.revision&&a.checksum===b.checksum;}
export function validateSaveEnvelope(value:unknown):CozySaveEnvelope|SaveFailure {
  if(!value||typeof value!=='object')return saveFailure('corrupt');
  const e=value as CozySaveEnvelope;
  if(typeof e.schemaVersion==='number'&&e.schemaVersion>COZY_SCHEMA_VERSION)return saveFailure('newer-version');
  if(e.schemaVersion!==1&&e.schemaVersion!==COZY_SCHEMA_VERSION)return saveFailure(e.schemaVersion===0?'migration-failed':'corrupt');
  if(!(e.schemaVersion===COZY_SCHEMA_VERSION&&e.contentVersion===COZY_CONTENT_VERSION)&&!(e.schemaVersion===1&&e.contentVersion===COZY_LEGACY_CONTENT_VERSION))return saveFailure('incompatible-content');
  const id=identity(e);
  if(!id||checkpointChecksum(e.payload)!==e.checksum)return saveFailure('corrupt');
  const payload=validateCozyCheckpoint(e.payload);
  if(!payload)return saveFailure('corrupt');
  return {...id,schemaVersion:COZY_SCHEMA_VERSION,contentVersion:COZY_CONTENT_VERSION,payload};
}
/** Native IndexedDB; only transaction completion can confirm a checkpoint. */
export class CozySaveRepository implements CozySavePort {
  constructor(private readonly factory:IDBFactory|undefined=globalThis.indexedDB,private readonly timeoutMs=8000){}
  private open():Promise<IDBDatabase|SaveFailure> {return new Promise(resolve=>{
    if(!this.factory){resolve(saveFailure('unavailable'));return;}let settled=false;
    const finish=(result:IDBDatabase|SaveFailure)=>{if(settled){if('close' in result)result.close();return;}settled=true;clearTimeout(timer);resolve(result);};
    const timer=setTimeout(()=>finish(saveFailure('timeout')),this.timeoutMs);
    let request:IDBOpenDBRequest;try{request=this.factory.open(COZY_SAVE_DATABASE,1);}catch{finish(saveFailure('unavailable'));return;}
    request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(COZY_SAVE_STORE))request.result.createObjectStore(COZY_SAVE_STORE);};
    request.onerror=()=>finish(saveFailure('unavailable'));request.onblocked=()=>finish(saveFailure('unavailable'));
    request.onsuccess=()=>{request.result.onversionchange=()=>request.result.close();finish(request.result);};
  });}
  private async transaction<T>(mode:IDBTransactionMode,operation:(store:IDBObjectStore,set:(result:T)=>void,abort:(failure:SaveFailure)=>void)=>void):Promise<T|SaveFailure> {
    const db=await this.open();if(!('close' in db))return db;
    try{return await new Promise<T|SaveFailure>(resolve=>{
      let tx:IDBTransaction;try{tx=db.transaction(COZY_SAVE_STORE,mode);}catch{resolve(saveFailure('unavailable'));return;}
      let result:T|undefined,failure:SaveFailure|undefined,settled=false;
      const finish=(value:T|SaveFailure)=>{if(settled)return;settled=true;clearTimeout(timer);resolve(value);};
      const abort=(value:SaveFailure)=>{failure=value;try{tx.abort();}catch{finish(value);}};
      const timer=setTimeout(()=>abort(saveFailure('timeout')),this.timeoutMs);
      tx.oncomplete=()=>finish(result??saveFailure('write-failed'));
      tx.onabort=()=>finish(failure??saveFailure('write-failed'));tx.onerror=()=>{};
      try{operation(tx.objectStore(COZY_SAVE_STORE),value=>{result=value;},abort);}catch{abort(saveFailure('write-failed'));}
    });}finally{db.close();}
  }
  async load():Promise<CozyLoadResult> {
    return this.transaction<CozyLoadResult>('readonly',(store,set)=>{
      const a=store.get('active'),b=store.get('backup'),m=store.get('manifest');
      m.onsuccess=()=>{
        const token=replacementToken(m.result),manifest=identity(m.result);
        if(a.result===undefined&&b.result===undefined&&m.result===undefined){set({ok:true,kind:'empty',replacementToken:token});return;}
        const active=validateSaveEnvelope(a.result);
        if(!('ok' in active)&&manifest&&same(active,manifest)){set({ok:true,kind:'loaded',envelope:active,replacementToken:token});return;}
        const failure='ok' in active?active:saveFailure('corrupt');
        if(['newer-version','incompatible-content','migration-failed'].includes(failure.code)){set({...failure,replacementToken:token});return;}
        const backup=validateSaveEnvelope(b.result);
        if(!('ok' in backup)&&manifest&&same(backup,manifest)){set({ok:true,kind:'recovery',envelope:backup,replacementToken:token});return;}
        set({...failure,replacementToken:token});
      };
    });
  }
  async commit(request:CozyWriteRequest):Promise<CozyWriteResult> {
    const payload=validateCozyCheckpoint(request.payload);
    if(!payload||typeof request.campaignId!=='string'||!request.campaignId||request.campaignId.length>100||typeof request.commitId!=='string'||!request.commitId||request.commitId.length>100||!Number.isSafeInteger(request.sourceRevision)||request.sourceRevision<0)return saveFailure('invalid-payload');
    const checksum=checkpointChecksum(payload);
    return this.transaction<CozyWriteResult>('readwrite',(store,set,abort)=>{
      const manifestRead=store.get('manifest'),activeRead=store.get('active'),backupRead=store.get('backup');
      backupRead.onsuccess=()=>{
        try {
        const manifest=identity(manifestRead.result);
        if(manifest?.campaignId===request.campaignId&&manifest.commitId===request.commitId){
          if(manifest.checksum!==checksum){abort(saveFailure('invalid-payload'));return;}
          const active=validateSaveEnvelope(activeRead.result),backup=validateSaveEnvelope(backupRead.result);
          if('ok' in active||'ok' in backup||!same(active,manifest)||!same(backup,manifest)){abort(saveFailure('corrupt'));return;}
          set({ok:true,envelope:active});return;
        }
        if(request.replacementToken!==undefined){if(replacementToken(manifestRead.result)!==request.replacementToken){abort(saveFailure('revision-conflict'));return;}}
        else if(request.sourceRevision===0?(manifestRead.result!==undefined||activeRead.result!==undefined||backupRead.result!==undefined):(!manifest||manifest.campaignId!==request.campaignId||manifest.revision!==request.sourceRevision)){abort(saveFailure('revision-conflict'));return;}
        if(request.replacementToken===undefined&&request.sourceRevision>0){
          const active=validateSaveEnvelope(activeRead.result),backup=validateSaveEnvelope(backupRead.result);
          const validActive=!('ok' in active)&&!!manifest&&same(active,manifest);
          const confirmedBackup=request.confirmedRecovery===true&&!('ok' in backup)&&!!manifest&&same(backup,manifest)&&('ok' in active?active.code==='corrupt':!validActive);
          if(!validActive&&!confirmedBackup){abort(saveFailure('corrupt'));return;}
        }
        const next:CozySaveEnvelope={schemaVersion:COZY_SCHEMA_VERSION,contentVersion:COZY_CONTENT_VERSION,campaignId:request.campaignId,commitId:request.commitId,revision:(manifest?.revision??0)+1,checksum,payload:structuredClone(payload)};
        const {schemaVersion:_schema,contentVersion:_content,payload:_payload,...latest}=next;
        store.put(next,'active');store.put(next,'backup');store.put(latest,'manifest');set({ok:true,envelope:next});
        } catch {abort(saveFailure('write-failed'));}
      };
    });
  }
}
