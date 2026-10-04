import {expect,test,type Page} from '@playwright/test';
import {CozyRuntime} from '../src/runtime/CozyRuntime';
import {COZY_CONTENT_VERSION} from '../src/domain/CozyCheckpoint';
import {checkpointChecksum,type CozySaveEnvelope} from '../src/infrastructure/CozySaveRepository';
type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
test.setTimeout(120000);
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)??'null');}
async function tap(page:Page,id:string){
  let c:Control|undefined;
  await expect.poll(async()=>{
    const controls=(await data(page,'controls')) as Control[]|null;
    const paused=await page.locator('canvas').getAttribute('data-paused');
    if(id!=='resume'&&paused?.split(',').some(r=>r==='gap'||r==='visibility')&&controls?.some(r=>r.id==='resume'&&r.enabled)){await tap(page,'resume');return false;}
    c=controls?.find(r=>r.id===id&&r.enabled);return !!c;
  },{message:id,timeout:15000}).toBe(true);
  const b=(await page.locator('canvas').boundingBox())!;
  if(!c)throw new Error('Missing '+id);
  expect(c.width*b.width/360).toBeGreaterThanOrEqual(48);expect(c.height*b.height/640).toBeGreaterThanOrEqual(48);
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
}
async function ready(page:Page){await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('ready');}
async function open(page:Page){for(const id of ['dough','sauce','cheese'])await tap(page,'market-buy-'+id);await tap(page,'market-open');}
async function close(page:Page){for(const id of ['end-day','confirm-end-day'])await tap(page,id);await expect(page.locator('canvas')).toHaveAttribute('data-screen','day-summary');}
async function nativeRead(page:Page){return page.evaluate(async()=>new Promise<Record<string,unknown>>((resolve,reject)=>{const r=indexedDB.open('pizza-cozy-checkpoints',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('latest','readonly'),store=tx.objectStore('latest'),active=store.get('active'),backup=store.get('backup'),manifest=store.get('manifest');tx.oncomplete=()=>{db.close();resolve({active:active.result,backup:backup.result,manifest:manifest.result});};};}));}
async function mutate(page:Page,kind:'active-corrupt'|'backup-old'|'newer'|'migration'|'active-identity'){
  await page.evaluate(async(kind)=>new Promise<void>((resolve,reject)=>{const r=indexedDB.open('pizza-cozy-checkpoints',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('latest','readwrite'),s=tx.objectStore('latest'),a=s.get('active'),b=s.get('backup');b.onsuccess=()=>{if(kind==='active-corrupt')s.put({...a.result,payload:{...a.result.payload,stock:{...a.result.payload.stock,cash:999}}},'active');if(kind==='backup-old'){s.put({broken:true},'active');s.put({...b.result,revision:b.result.revision-1},'backup');}if(kind==='active-identity')s.put({...a.result,campaignId:'stale-active'},'active');if(kind==='newer')s.put({...a.result,schemaVersion:99},'active');if(kind==='migration')s.put({...a.result,schemaVersion:0},'active');};tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>reject(tx.error);};}),kind);
}
async function seed(page:Page,envelope:CozySaveEnvelope){
  await page.goto('/?mode=freeplay');await expect(page.locator('canvas')).toHaveAttribute('data-booted','true');
  await page.evaluate(async(envelope)=>new Promise<void>((resolve,reject)=>{const request=indexedDB.open('pizza-cozy-checkpoints',1);request.onupgradeneeded=()=>request.result.createObjectStore('latest');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,tx=db.transaction('latest','readwrite'),s=tx.objectStore('latest');s.put(envelope,'active');s.put(envelope,'backup');const {payload:_payload,schemaVersion:_schema,contentVersion:_content,...identity}=envelope;s.put(identity,'manifest');tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>reject(tx.error);};}),envelope);
}
test('native creation precedes purchases; reload restores current unclosed day and committed next day',async({page})=>{
  await page.goto('/?mode=shop');await expect(page.locator('canvas')).toHaveAttribute('data-shop','preparation');await ready(page);
  expect((await nativeRead(page)).active).toMatchObject({schemaVersion:1,payload:{day:1,stock:{cash:300}}});await open(page);expect((await nativeRead(page)).active).toMatchObject({payload:{day:1,stock:{cash:300}}});
  await page.reload();await expect(page.locator('canvas')).toHaveAttribute('data-shop','preparation');await expect(page.locator('canvas')).toHaveAttribute('data-cash','300');expect(await data(page,'tickets')).toEqual([]);
  await open(page);await close(page);await ready(page);const saved=await nativeRead(page);expect(saved.active).toMatchObject({revision:2,payload:{day:2,reports:[{day:1,cash:265}]}});expect(saved.active).toEqual(saved.backup);
  const report=await data(page,'day-summary');await tap(page,'summary-tab-market');await tap(page,'summary-buy-dough');expect(await data(page,'day-summary')).toEqual(report);expect((await nativeRead(page)).active).toEqual(saved.active);
  await page.goto('/');await ready(page);expect((await data(page,'labels')).map((l:{text:string})=>l.text).join(' ')).toContain('Ngày 2');await tap(page,'menu-continue');await expect(page.locator('canvas')).toHaveAttribute('data-day','2');await expect(page.locator('canvas')).toHaveAttribute('data-cash','265');await expect(page.locator('canvas')).toHaveAttribute('data-shop','preparation');expect((await data(page,'controls')).some((c:Control)=>c.id==='replay'||c.id==='market-reset')).toBe(false);
});
test('in-game same-latest recovery can be reopened after viewing the pending summary',async({page})=>{
  await page.addInitScript(()=>{const put=IDBObjectStore.prototype.put;let failed=false;IDBObjectStore.prototype.put=function(value:unknown,key?:IDBValidKey){const e=value as {payload?:{reports?:unknown[]}};if(key==='active'&&this.transaction.db.name==='pizza-cozy-checkpoints'&&e.payload?.reports?.length===1&&!failed){failed=true;this.transaction.abort();throw new DOMException('Injected abort','AbortError');}return key===undefined?put.call(this,value):put.call(this,value,key);};});
  await page.goto('/?mode=shop');await expect(page.locator('canvas')).toHaveAttribute('data-shop','preparation');await open(page);await close(page);await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('error');await mutate(page,'active-identity');await tap(page,'save-reload');await tap(page,'save-reload-confirm');await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('recovery');
  await tap(page,'save-view-summary');await tap(page,'save-show-status');await tap(page,'save-recover-confirm');await expect(page.locator('canvas')).toHaveAttribute('data-shop','preparation');await expect(page.locator('canvas')).toHaveAttribute('data-cash','300');await open(page);await close(page);await ready(page);expect((await nativeRead(page)).active).toMatchObject({revision:2,payload:{day:2}});
});
test('native transaction abort leaves original checkpoint and RAM result; retry uses one commit identity',async({page})=>{
  await page.addInitScript(()=>{const put=IDBObjectStore.prototype.put;let failed=false;IDBObjectStore.prototype.put=function(value:unknown,key?:IDBValidKey){const e=value as {payload?:{reports?:unknown[]}};if(this.transaction.db.name==='pizza-cozy-checkpoints'&&key==='active'&&e.payload?.reports?.length===1&&!failed){failed=true;this.transaction.abort();throw new DOMException('Injected quota failure','QuotaExceededError');}return key===undefined?put.call(this,value):put.call(this,value,key);};});
  await page.goto('/?mode=shop');await expect(page.locator('canvas')).toHaveAttribute('data-shop','preparation');await open(page);const old=await nativeRead(page);await close(page);await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('error');const pending=await data(page,'save-state'),summary=await data(page,'day-summary');expect(pending).toMatchObject({pending:true,canRetry:true});expect((await nativeRead(page)).active).toEqual(old.active);
  await page.screenshot({path:'_bmad-output/implementation-artifacts/epic-4-evidence/save-failed.png'});await tap(page,'save-view-summary');await tap(page,'summary-tab-market');expect((await data(page,'controls')).filter((c:Control)=>c.id.startsWith('summary-buy-')&&c.enabled)).toEqual([]);expect((await data(page,'controls')).find((c:Control)=>c.id==='summary-open-next-day')?.enabled).not.toBe(true);
  await tap(page,'save-show-status');expect(await data(page,'save-state')).toMatchObject({commitId:pending.commitId,pending:true});
  await page.goto('/?mode=shop'); // A real reload discards the failed day, as the copy warned.
  await expect(page.locator('canvas')).toHaveAttribute('data-day','1');expect((await nativeRead(page)).active).toEqual(old.active);
  // The separate page below tests a retry before closing/reloading the page.
  expect(summary.day).toBe(1);expect(pending.commitId).toBeTruthy();
});
test('retry before reload preserves pending commitId and detached summary',async({page})=>{
  await page.addInitScript(()=>{const put=IDBObjectStore.prototype.put;let failed=false;IDBObjectStore.prototype.put=function(value:unknown,key?:IDBValidKey){const e=value as {payload?:{reports?:unknown[]}};if(this.transaction.db.name==='pizza-cozy-checkpoints'&&key==='active'&&e.payload?.reports?.length===1&&!failed){failed=true;this.transaction.abort();throw new DOMException('Injected abort','AbortError');}return key===undefined?put.call(this,value):put.call(this,value,key);};});
  await page.goto('/?mode=shop');await expect(page.locator('canvas')).toHaveAttribute('data-shop','preparation');await open(page);await close(page);await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('error');const pending=await data(page,'save-state'),summary=await data(page,'day-summary');await tap(page,'save-view-summary');await tap(page,'save-show-status');await tap(page,'save-retry');await ready(page);const saved=await nativeRead(page);expect(saved.active).toMatchObject({commitId:pending.commitId,revision:2});expect(saved.active).toEqual(saved.backup);expect(await data(page,'day-summary')).toEqual(summary);expect((await data(page,'save-state')).pending).toBe(false);
});
test('corrupt active offers only same latest backup after confirmation, then next endday can commit',async({page})=>{
  await page.goto('/?mode=shop');await expect(page.locator('canvas')).toHaveAttribute('data-shop','preparation');await open(page);await close(page);await ready(page);const latest=await nativeRead(page);await mutate(page,'active-corrupt');await page.goto('/');await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('recovery');expect(await page.locator('canvas').getAttribute('data-screen')).toBe('menu');await tap(page,'menu-recover-confirm');await expect(page.locator('canvas')).toHaveAttribute('data-day','2');await expect(page.locator('canvas')).toHaveAttribute('data-cash','265');await tap(page,'market-open');await close(page);await ready(page);const repaired=await nativeRead(page);expect(repaired.active).toMatchObject({revision:3,payload:{day:3}});expect(repaired.active).toEqual(repaired.backup);expect((latest.manifest as {revision:number}).revision).toBe(2);
});
test('old backup, newer schema and failed migration are refused without changing originals',async({page})=>{
  for(const [kind,code] of [['backup-old','corrupt'],['newer','newer-version'],['migration','migration-failed']] as const){
    const cp=new CozyRuntime(false,true).exportCheckpoint();await seed(page,{schemaVersion:1,contentVersion:COZY_CONTENT_VERSION,campaignId:'fixture-'+kind,commitId:'fixture',revision:2,checksum:checkpointChecksum(cp),payload:cp});await mutate(page,kind);const original=await nativeRead(page);await page.goto('/');await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('error');expect(await data(page,'save-state')).toMatchObject({code});expect((await data(page,'controls')).some((c:Control)=>c.id==='menu-recover-confirm')).toBe(false);expect(await nativeRead(page)).toEqual(original);
  }
});
test('two pages refuse stale commit; reload reads latest unclosed day instead of merging',async({page,context})=>{
  await page.goto('/?mode=shop');await expect(page.locator('canvas')).toHaveAttribute('data-shop','preparation');
  // Pages in one browser context share IndexedDB; foreground recovery stays owned.
  const second=await context.newPage();await second.goto('/?mode=shop');await expect(second.locator('canvas')).toHaveAttribute('data-shop','preparation');await second.bringToFront();await open(second);await close(second);await ready(second);
  await page.bringToFront();const resume=(await data(page,'controls')).find((c:Control)=>c.id==='resume'&&c.enabled);if(resume)await tap(page,'resume');await open(page);await close(page);await expect.poll(async()=>(await data(page,'save-state')).code).toBe('revision-conflict');expect(await data(page,'save-state')).toMatchObject({canRetry:false,pending:true});await tap(page,'save-reload');await tap(page,'save-reload-confirm');await expect(page.locator('canvas')).toHaveAttribute('data-day','2');await expect(page.locator('canvas')).toHaveAttribute('data-shop','preparation');await second.close();
});
test('returning to menu preserves live purchases and the same current-day session',async({page})=>{
  await page.goto('/?mode=shop');await expect(page.locator('canvas')).toHaveAttribute('data-shop','preparation');await open(page);
  const cash=await page.locator('canvas').getAttribute('data-cash'),revision=(await data(page,'save-state')).revision;
  await tap(page,'pause');await tap(page,'main-menu');await expect(page.locator('canvas')).toHaveAttribute('data-screen','menu');await tap(page,'menu-continue');await expect(page.locator('canvas')).toHaveAttribute('data-shop','making');await expect(page.locator('canvas')).toHaveAttribute('data-cash',cash!);expect((await data(page,'save-state')).revision).toBe(revision);expect((await nativeRead(page)).active).toMatchObject({payload:{stock:{cash:300}}});
});
test('terminal checkpoint reload has no Day4 and confirmed replacement atomically creates fresh Day1',async({page})=>{
  const r=new CozyRuntime(false,true);for(let day=1;day<=3;day++){for(const id of ['dough','sauce','cheese'] as const)r.buy(id,1);if(day===1)r.openShop();else r.openNextDay();expect(r.closeDay()).toBe(true);}const cp=r.exportCheckpoint();await seed(page,{schemaVersion:1,contentVersion:COZY_CONTENT_VERSION,campaignId:'terminal-campaign',commitId:'terminal-commit',revision:4,checksum:checkpointChecksum(cp),payload:cp});await page.goto('/?mode=shop');await expect(page.locator('canvas')).toHaveAttribute('data-screen','day-summary');await ready(page);expect((await data(page,'controls')).some((c:Control)=>c.id==='summary-open-next-day')).toBe(false);await tap(page,'summary-final-result');await page.screenshot({path:'_bmad-output/implementation-artifacts/epic-4-evidence/final-result.png'});await tap(page,'summary-new-campaign');await tap(page,'market-new-cancel');expect((await nativeRead(page)).active).toMatchObject({commitId:'terminal-commit'});await tap(page,'summary-final-result');await tap(page,'summary-new-campaign');await tap(page,'market-new-confirm');await expect(page.locator('canvas')).toHaveAttribute('data-day','1');await expect(page.locator('canvas')).toHaveAttribute('data-shop','preparation');await expect(page.locator('canvas')).toHaveAttribute('data-cash','300');const saved=await nativeRead(page);expect(saved.active).toMatchObject({revision:5,payload:{day:1,terminal:false,reports:[],stock:{cash:300,lots:[]}}});expect((saved.active as CozySaveEnvelope).campaignId).not.toBe('terminal-campaign');
});
