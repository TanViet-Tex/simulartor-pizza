import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';
type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)??'null');}
async function tap(page:Page,id:string){
 let c:Control|undefined;await expect.poll(async()=>{c=((await data(page,'controls'))??[]).find((v:Control)=>v.id===id&&v.enabled);return !!c;}).toBe(true);
 const b=(await page.locator('canvas').boundingBox())!,r=c!;expect(r.width*b.width/360).toBeGreaterThanOrEqual(48);expect(r.height*b.height/640).toBeGreaterThanOrEqual(48);
 await page.touchscreen.tap(b.x+(r.x+r.width/2)*b.width/360,b.y+(r.y+r.height/2)*b.height/640);await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
}
async function advance(page:Page,ms:number){await page.evaluate(ms=>(window as any).epic6.advanceElapsed(ms),ms);await page.waitForTimeout(100);}
async function fixture(page:Page,code:string){
 const moduleName:string='node:path';const paths:{resolve:(p:string)=>string}=await import(moduleName);
 const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';import {CozyCampaignSession} from './src/runtime/CozyCampaignSession';import {CozySaveRepository} from './src/infrastructure/CozySaveRepository';(async()=>{${code}})();`},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
 await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{height:100%;width:100%}</style><div id="fixture"></div>');await page.addScriptTag({content:bundle.outputFiles[0].text});await expect(page.locator('canvas')).toHaveAttribute('data-screen',/preparation-hub|day-summary|game/);
}
const prepare=`const deps={schedule:(day:number)=>({day,duration:240,grace:120,slots:day>=5?[{id:'app-'+day,at:0,kind:'hurry',opportunity:'commercial',commercialOrdinal:1,takeaway:true,source:'app',quantity:2}]:[]})};const r=new CozyRuntime(false,true,deps);for(let day=1;day<=4;day++){day===1?r.openShop():r.openNextDay();r.closeDay();}`;
const game=`(window as any).epic6=r;new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(r)]});`;
async function active(page:Page){return page.evaluate(()=>new Promise<any>((resolve,reject)=>{const q=indexedDB.open('pizza-cozy-checkpoints',1);q.onerror=()=>reject(q.error);q.onsuccess=()=>{const db=q.result,tx=db.transaction('latest','readonly'),r=tx.objectStore('latest').get('active');tx.oncomplete=()=>{db.close();resolve(r.result);};};}));}

test('app opt-in is atomic, cancel preserves data and reload restores day5',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await fixture(page,`${prepare}const repo=new CozySaveRepository();const loaded=await repo.load();await repo.commit({campaignId:'epic6-fixture',commitId:'day5',sourceRevision:0,replacementToken:loaded.replacementToken,payload:r.exportCheckpoint()});const session=new CozyCampaignSession(repo);const saved=await session.load();new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(saved,undefined,undefined,undefined,session.lifecycle,session)]});`);
 const before=await active(page);await tap(page,'summary-tab-shop');await tap(page,'shop-section-amenities');await tap(page,'shop-delivery-app');await page.locator('canvas').screenshot({path:info.outputPath('app-settings.png')});await tap(page,'delivery-app-cancel');expect(await active(page)).toEqual(before);
 await tap(page,'shop-delivery-app');await tap(page,'delivery-app-confirm');await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('ready');const saved=await active(page);expect(saved.revision).toBe(before.revision+1);expect(saved.payload.deliveryAppEnabled).toBe(true);expect(saved.payload.stock).toEqual(before.payload.stock);
 await page.locator('canvas').screenshot({path:info.outputPath('app-enabled.png')});await page.unroute('**/assets/index-*.js');await page.goto('/?mode=shop');await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('ready');expect((await data(page,'delivery-app')).enabled).toBe(true);expect(await active(page)).toEqual(saved);expect(errors).toEqual([]);
});

test('two pizzas book, box and settle immediately; manual pause freezes pickup wait',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page,`${prepare}const factory=deps.schedule;deps.schedule=day=>{const s=factory(day);if(day>=5)s.slots.push({...s.slots[0],id:'counter',at:1,source:'shop',quantity:1});return s;};r.configureMenu('mushroom',100,false);r.configureDeliveryApp(true,'on');for(const i of ['dough','sauce','cheese'] as const)r.buy(i,3);r.openNextDay();${game}`);
 const cash=Number(await page.locator('canvas').getAttribute('data-cash'));const ticket=(await data(page,'tickets'))[0];await tap(page,'ticket-'+ticket.id);await tap(page,'app-book-shipper');await page.locator('canvas').screenshot({path:info.outputPath('book-shipper.png')});await tap(page,'delivery-app-confirm');
 await tap(page,'pause');const remaining=(await data(page,'delivery-status')).remaining;await advance(page,10000);expect((await data(page,'delivery-status')).remaining).toBe(remaining);await tap(page,'resume');
 const beforeHidden=(await data(page,'delivery-status')).remaining;await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(500);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});expect((await data(page,'delivery-status')).remaining).toBeLessThan(beforeHidden);
 for(let i=0;i<2;i++){
  for(const id of ['dough','sauce','cheese'])await tap(page,id);
  await tap(page,'bake');await advance(page,7000);await tap(page,'extract');await tap(page,'box');await tap(page,'deliver');
  if(i===0){expect((await data(page,'tickets'))[0].packed).toBe(1);expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(cash);}
 }
 expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(cash+95);expect((await data(page,'delivery-status')).phase).toBe('idle');expect((await data(page,'labels')).some((l:{text:string})=>l.text.includes('Đang giao'))).toBe(false);await page.locator('canvas').screenshot({path:info.outputPath('app-completed.png')});await advance(page,20000);expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(cash+95);
 const report=await page.evaluate(()=>{const r=(window as any).epic6;r.closeDay();return r.daySummary;});expect(report).toMatchObject({delivered:1,pizzasSold:2,revenue:100,deliveryFees:5});expect(report.reviews.filter((review:{source:string})=>review.source==='app')).toHaveLength(1);expect(errors).toEqual([]);
});

test('next-day rain forecast uses slower shipper timing without enabling app',async({page},info)=>{
 await fixture(page,`${prepare}r.openNextDay();r.closeDay();${game}`);expect((await data(page,'delivery-app')).enabled).toBe(false);expect((await data(page,'delivery-app'))).toMatchObject({nextEvent:{id:'rain'},waitSeconds:15,travelSeconds:0});await tap(page,'summary-tab-shop');await tap(page,'shop-section-amenities');await tap(page,'shop-delivery-app');await page.locator('canvas').screenshot({path:info.outputPath('rain-forecast.png')});await tap(page,'delivery-app-cancel');expect((await data(page,'delivery-app')).enabled).toBe(false);
});

test('rain order settles at the click before deadline without waiting for travel',async({page},info)=>{
 await fixture(page,`${prepare.replace('quantity:2','quantity:1')}r.configureMenu('mushroom',100,false);r.openNextDay();r.closeDay();r.configureDeliveryApp(true,'on');for(const i of ['dough','sauce','cheese'] as const)r.buy(i,1);r.openNextDay();${game}`);
 const cash=Number(await page.locator('canvas').getAttribute('data-cash'));const ticket=(await data(page,'tickets'))[0];await tap(page,'ticket-'+ticket.id);await tap(page,'app-book-shipper');await tap(page,'delivery-app-confirm');
 for(const id of ['dough','sauce','cheese'])await tap(page,id);await tap(page,'bake');await advance(page,7000);await tap(page,'extract');await tap(page,'box');await tap(page,'deliver');expect((await data(page,'tickets'))[0].packed).toBe(1);await advance(page,75000);await tap(page,'deliver');expect((await data(page,'delivery-status')).phase).toBe('idle');
 const result=await page.evaluate(()=>(window as any).epic6.lastResult);expect(result.stars).toBe(5);expect(result.reasons).not.toContain('Giao app trễ hạn');expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(cash+45);await advance(page,30000);expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(cash+45);await page.locator('canvas').screenshot({path:info.outputPath('rain-completed.png')});
});
