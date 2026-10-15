import {revealShopAction} from './helpers/listGestures';
import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';
test.setTimeout(120000);
type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)??'null');}
async function tap(page:Page,id:string){if(/^shop-staff-(prep|oven|box|delivery)$/.test(id))await revealShopAction(page,id);let c:Control|undefined;await expect.poll(async()=>{c=((await data(page,'controls'))??[]).find((v:Control)=>v.id===id&&v.enabled);return !!c;},{message:`Enabled control ${id}`}).toBe(true);const b=(await page.locator('canvas').boundingBox())!,r=c!;expect(r.width*b.width/360).toBeGreaterThanOrEqual(48);expect(r.height*b.height/640).toBeGreaterThanOrEqual(48);await page.touchscreen.tap(b.x+(r.x+r.width/2)*b.width/360,b.y+(r.y+r.height/2)*b.height/640);await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));}
async function ready(page:Page){await expect(page.locator('canvas')).toHaveAttribute('data-screen',/^(preparation-hub|day-summary|day-ended-notice|game)$/,{timeout:30000});await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('ready');}
async function active(page:Page){return page.evaluate(()=>new Promise<any>((resolve,reject)=>{const q=indexedDB.open('pizza-cozy-checkpoints',1);q.onerror=()=>reject(q.error);q.onsuccess=()=>{const db=q.result,tx=db.transaction('latest','readonly'),r=tx.objectStore('latest').get('active');tx.oncomplete=()=>{db.close();resolve(r.result);};};}));}
async function seed(page:Page,dayOne=false,expired=false){
 const moduleName:string='node:path';const paths:{resolve:(p:string)=>string}=await import(moduleName);
 const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyCampaignSession} from './src/runtime/CozyCampaignSession';import {CozySaveRepository} from './src/infrastructure/CozySaveRepository';import {fundedShopCheckpoint} from './src/runtime/shopTestFixture';import {CozyRuntime} from './src/runtime/CozyRuntime';(async()=>{const early=new CozyRuntime(false,true,{schedule:day=>({day,duration:350,grace:120,slots:[]})});early.claimTestCode('VIETVUIVE');${expired?`early.hireStaff('delivery','initial-contract');for(let day=1;day<=10;day++){if(!(day===1?early.openShop():early.openNextDay()))throw Error('Cannot open contract day '+day);early.dismissThanks();early.resolveLottery(0);if(!early.closeDay())throw Error('Cannot close contract day '+day);}`:''}const repo=new CozySaveRepository(),loaded=await repo.load();const result=await repo.commit({campaignId:'epic8',commitId:'earned',sourceRevision:0,replacementToken:loaded.replacementToken,payload:${dayOne?'early.exportCheckpoint()':'fundedShopCheckpoint()'}});if(!result.ok)throw Error(result.message);const session=new CozyCampaignSession(repo),r=await session.load();(window as any).epic8={session,r};new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(r,undefined,undefined,undefined,session.lifecycle,session)]});})();`},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
 await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{height:100%;width:100%}</style><div id="fixture"></div>');await page.addScriptTag({content:bundle.outputFiles[0].text});await ready(page);
}
async function staffPage(page:Page){await tap(page,'summary-tab-shop');await tap(page,'shop-section-staff');}
async function hireAll(page:Page){for(const role of ['prep','oven','box','delivery']){await tap(page,'shop-staff-'+role);await tap(page,'staff-hire-confirm');await ready(page);}}

test('day one failed early hiring and retry never lose money or duplicate staff',async({page},info)=>{
 await page.addInitScript(()=>{const put=IDBObjectStore.prototype.put;let failed=sessionStorage.getItem('epic8-hire-failed')==='1';IDBObjectStore.prototype.put=function(value:any,key?:IDBValidKey){if(key==='active'&&value.payload?.staff?.spent===2000&&!failed){failed=true;sessionStorage.setItem('epic8-hire-failed','1');this.transaction.abort();throw new DOMException('Epic8 hire failure','QuotaExceededError');}return key===undefined?put.call(this,value):put.call(this,value,key);};});
 await seed(page,true);const before=await active(page),cash=before.payload.stock.cash;expect(before.payload.day).toBe(1);await staffPage(page);await tap(page,'shop-staff-prep');await page.locator('canvas').screenshot({path:info.outputPath('hire-prep.png')});await tap(page,'staff-hire-cancel');expect(await active(page)).toEqual(before);await tap(page,'shop-staff-prep');await tap(page,'staff-hire-confirm');await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('error');expect((await data(page,'staff-state')).acquired).toEqual([]);expect(await active(page)).toEqual(before);
 await tap(page,'save-retry');await ready(page);await expect.poll(async()=>(await active(page)).payload.staff.acquired.length).toBe(1);await staffPage(page);expect((await data(page,'staff-state')).acquired).toEqual([expect.objectContaining({role:'prep',hiredDay:1,actualPrice:2000})]);expect((await active(page)).payload.stock.cash).toBe(cash-2000);await tap(page,'shop-staff-prep');expect((await data(page,'staff-hire')).owned).toBe(true);expect((await data(page,'controls')).find((c:Control)=>c.id==='staff-hire-confirm').enabled).toBe(false);await tap(page,'staff-hire-cancel');
 await page.unroute('**/assets/index-*.js');await page.goto('/?mode=shop');await ready(page);await staffPage(page);expect((await data(page,'staff-state')).acquired).toEqual([expect.objectContaining({role:'prep',hiredDay:1,actualPrice:2000})]);expect((await active(page)).payload.stock.cash).toBe(cash-2000);
});

test('four fixed roles activate prepaid contracts with no daily wages',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,true);const cash=(await active(page)).payload.stock.cash;await staffPage(page);await hireAll(page);const staffed=await active(page);expect(staffed.payload.stock.cash).toBe(cash-8000);expect((await data(page,'staff-state')).dailyWages).toBe(0);await page.locator('canvas').screenshot({path:info.outputPath('four-fixed-roles.png')});
 const result=await page.evaluate(()=>{const {r,session}=(window as any).epic8;const opened=r.openShop();r.dismissThanks();r.resolveLottery(0);const roles=r.staffState.frozenRoles;const closed=session.closeDay();return {opened,roles,closed};});expect(result).toEqual({opened:true,roles:['prep','oven','box','delivery'],closed:true});await ready(page);
 const saved=await active(page),report=saved.payload.reports.at(-1);expect(report.accounts.wages).toBe(0);expect(report.payroll).toMatchObject({wagesPaid:0,openingArrears:0,endingArrears:0});expect(report.accounts.capitalPurchases).toBe(8000);expect(report.accounts.endingCash).toBe(report.cash);expect(saved.payload.staff.pendingSpent).toBe(0);
 await page.unroute('**/assets/index-*.js');await page.goto('/?mode=shop');await ready(page);await staffPage(page);expect((await data(page,'staff-state')).acquired).toHaveLength(4);expect((await data(page,'staff-state')).arrears).toBe(0);expect((await data(page,'kitchen-layout')).customerFrames).toHaveLength(6);expect(errors).toEqual([]);
});

test('ten days expire without automatic debit; declining persists and an explicit renewal charges once',async({page},info)=>{
 await seed(page,true,true);const before=await active(page),cash=before.payload.stock.cash;
 expect(before.payload.day).toBe(11);
 expect(before.payload.reports).toHaveLength(10);
 expect(before.payload.reports.every((report:any)=>report.accounts.wages===0&&report.payroll.wagesPaid===0)).toBe(true);
 await expect.poll(async()=>(await data(page,'staff-hire'))?.renewalPending).toBe(true);
 expect(await data(page,'staff-hire')).toMatchObject({role:'delivery',owned:false,expired:true,remainingDays:0});
 expect((await data(page,'controls')).find((c:Control)=>c.id==='staff-hire-confirm').enabled).toBe(true);
 expect(await active(page)).toEqual(before);
 await page.locator('canvas').screenshot({path:info.outputPath('staff-expiry-asks.png')});
 await tap(page,'staff-hire-cancel');await ready(page);
 const declined=await active(page);expect(declined.payload.stock.cash).toBe(cash);
 await page.unroute('**/assets/index-*.js');await page.goto('/?mode=shop');await ready(page);
 expect(((await data(page,'controls'))??[]).some((c:Control)=>c.id==='staff-hire-confirm')).toBe(false);
 await staffPage(page);expect((await data(page,'staff-state')).expiredRoles).toContain('delivery');
 expect((await data(page,'staff-state')).renewalPendingRoles).not.toContain('delivery');
 await tap(page,'shop-staff-tab-working');expect((await data(page,'controls')).some((c:Control)=>c.id==='shop-staff-delivery')).toBe(false);
 await tap(page,'shop-staff-tab-recruit');await tap(page,'shop-staff-delivery');
 expect(await data(page,'staff-hire')).toMatchObject({expired:true,renewalPending:false});
 await tap(page,'staff-hire-confirm');await ready(page);
 await expect.poll(async()=>(await active(page)).payload.stock.cash).toBe(cash-2000);
 await tap(page,'shop-staff-delivery');expect(await data(page,'staff-hire')).toMatchObject({owned:true,expired:false,remainingDays:10});
 expect((await data(page,'controls')).find((c:Control)=>c.id==='staff-hire-confirm').enabled).toBe(false);
 await tap(page,'staff-hire-cancel');await page.reload();await ready(page);await staffPage(page);
 expect((await active(page)).payload.stock.cash).toBe(cash-2000);expect((await data(page,'staff-state')).expiredRoles).not.toContain('delivery');
});

test('a failed renewal leaves the expired contract and cash intact; retry and reload apply it once',async({page})=>{
 await page.addInitScript(()=>{const put=IDBObjectStore.prototype.put;let failed=false;IDBObjectStore.prototype.put=function(value:any,key?:IDBValidKey){if(key==='active'&&value.payload?.staff?.spent===4000&&!failed){failed=true;this.transaction.abort();throw new DOMException('Renewal write failure','QuotaExceededError');}return key===undefined?put.call(this,value):put.call(this,value,key);};});
 await seed(page,true,true);const before=await active(page),cash=before.payload.stock.cash;
 await expect.poll(async()=>(await data(page,'staff-hire'))?.expired).toBe(true);
 await tap(page,'staff-hire-confirm');await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('error');
 expect(await active(page)).toEqual(before);
 await tap(page,'save-retry');await ready(page);await expect.poll(async()=>(await active(page)).payload.stock.cash).toBe(cash-2000);
 await staffPage(page);await tap(page,'shop-staff-delivery');expect(await data(page,'staff-hire')).toMatchObject({owned:true,expired:false,remainingDays:10});await tap(page,'staff-hire-cancel');
 await page.unroute('**/assets/index-*.js');await page.goto('/?mode=shop');await ready(page);await staffPage(page);await tap(page,'shop-staff-delivery');
 expect(await data(page,'staff-hire')).toMatchObject({owned:true,expired:false,remainingDays:10});expect((await active(page)).payload.stock.cash).toBe(cash-2000);
});
