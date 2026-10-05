import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)??'null');}
async function tap(page:Page,id:string){
  let c:any;await expect.poll(async()=>{c=((await data(page,'controls'))??[]).find((v:any)=>v.id===id&&v.enabled);return !!c;},{timeout:15000}).toBe(true);
  const b=(await page.locator('canvas').boundingBox())!;await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}
async function active(page:Page){return page.evaluate(()=>new Promise<any>((resolve,reject)=>{const q=indexedDB.open('pizza-cozy-checkpoints',1);q.onerror=()=>reject(q.error);q.onsuccess=()=>{const db=q.result,tx=db.transaction('latest','readonly'),read=tx.objectStore('latest').get('active');tx.oncomplete=()=>{db.close();resolve(read.result);};};}));}
async function fixture(page:Page){
  const moduleName:string='node:path';const paths:{resolve:(p:string)=>string}=await import(moduleName);
  const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';import {CozyCampaignSession} from './src/runtime/CozyCampaignSession';import {CozySaveRepository} from './src/infrastructure/CozySaveRepository';import {campaignEventRoll} from './src/domain/CampaignEvents';
    (async()=>{let seed=0;while(campaignEventRoll(seed,1)>=.1)seed++;
    const initial=new CozyRuntime(false,true,{eventSeed:seed});initial.buy('dough',50);
    const repository=new CozySaveRepository(),loaded=await repository.load();const result=await repository.commit({campaignId:'event-e2e',commitId:'create',sourceRevision:0,replacementToken:loaded.replacementToken,payload:initial.exportCheckpoint()});if(!result.ok)throw Error(result.message);
    const session=new CozyCampaignSession(repository);let runtime=await session.load();
    const game=new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(runtime,undefined,undefined,undefined,session.lifecycle,session,enter)]});
    function enter(next){if(!next)return;runtime=next;game.scene.stop('CozyScene');game.scene.remove('CozyScene');game.scene.add('CozyScene',new CozyScene(runtime,undefined,undefined,undefined,session.lifecycle,session,enter),true);}
    window.eventTest={session,get runtime(){return runtime;},restore:async()=>enter(await session.load())};})();
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{height:100%;width:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:bundle.outputFiles[0].text});await expect(page.locator('canvas')).toHaveAttribute('data-screen','preparation-hub',{timeout:15000});
}

test('event A subtracts the full amount into negative cash; acknowledgement blocks input and preserves another pause owner',async({page},info)=>{
  await fixture(page);const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-cash','50');const old=await active(page);
  await tap(page,'summary-open-first-day');await expect.poll(async()=>(await data(page,'campaign-event'))?.id).toBe('A');await expect(canvas).toHaveAttribute('data-cash','-150');
  expect(await active(page)).toEqual(old);expect((await data(page,'controls')).filter((c:any)=>c.enabled).map((c:any)=>c.id)).toEqual(['campaign-event-understood']);
  const b=(await canvas.boundingBox())!;await page.touchscreen.tap(b.x+45*b.width/360,b.y+514*b.height/640);await expect(canvas).toHaveAttribute('data-cash','-150');await expect(canvas).toHaveAttribute('data-ingredients','');
  await canvas.screenshot({path:info.outputPath('event-negative-cash.png')});
  await page.evaluate(()=>{const state=window as unknown as {eventTest:any};state.eventTest.other=state.eventTest.runtime.acquirePause('order');});
  await tap(page,'campaign-event-understood');await expect(canvas).toHaveAttribute('data-paused','order');
  await page.evaluate(()=>{(window as unknown as {eventTest:any}).eventTest.other.release();});await expect(canvas).toHaveAttribute('data-paused','');
  await page.evaluate(()=>{void (window as unknown as {eventTest:any}).eventTest.restore();});await expect(canvas).toHaveAttribute('data-screen','preparation-hub');await expect(canvas).toHaveAttribute('data-cash','50');
  await tap(page,'summary-open-first-day');await expect(canvas).toHaveAttribute('data-cash','-150');await tap(page,'campaign-event-understood');
  await tap(page,'end-day');await tap(page,'confirm-end-day');await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('ready');await tap(page,'day-ended-understood');
  const saved=await active(page),report=saved.payload.reports.at(-1);expect(report.campaignEvent).toEqual({id:'A',loss:200});expect(report.accounts.eventLoss).toBe(200);expect(report.cash).toBe(-170);expect(report.profit).toBe(-220);
  await tap(page,'summary-figure-0');await expect.poll(async()=>await data(page,'summary-modal-text')).toContain('Sự kiện A: 200 xu');await canvas.screenshot({path:info.outputPath('event-finance.png')});
});

test('failed day save keeps the prior boundary; retry and restore do not charge event loss twice',async({page})=>{
  await fixture(page);const old=await active(page);await tap(page,'summary-open-first-day');await tap(page,'campaign-event-understood');
  await page.evaluate(()=>{const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value:any,key?:IDBValidKey){if(key==='active'&&value.payload?.reports?.length&&!sessionStorage.getItem('event-save-failed')){sessionStorage.setItem('event-save-failed','1');this.transaction.abort();throw new DOMException('Event test','QuotaExceededError');}return key===undefined?original.call(this,value):original.call(this,value,key);};});
  await tap(page,'end-day');await tap(page,'confirm-end-day');await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('error');expect(await active(page)).toEqual(old);
  await tap(page,'save-retry');await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('ready');const saved=await active(page);expect(saved.payload.stock.cash).toBe(-170);expect(saved.payload.reports.at(-1).accounts.eventLoss).toBe(200);
  await page.evaluate(()=>{void (window as unknown as {eventTest:any}).eventTest.restore();});await expect(page.locator('canvas')).toHaveAttribute('data-cash','-170');expect(await active(page)).toEqual(saved);
});
