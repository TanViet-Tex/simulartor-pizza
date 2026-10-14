import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

test.setTimeout(120000);
type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)||'null');}
async function settle(page:Page){await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));}
async function ready(page:Page){await expect.poll(async()=>(await data(page,'save-state'))?.state,{timeout:30000}).toBe('ready');await settle(page);}
async function tap(page:Page,id:string){
 await expect.poll(async()=>((await data(page,'controls'))||[]).some((c:Control)=>c.id===id&&c.enabled)).toBe(true);
 const c:Control=(await data(page,'controls')).find((c:Control)=>c.id===id),b=(await page.locator('canvas').boundingBox())!;
 await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);await settle(page);
}
async function scrollHome(page:Page){const b=(await page.locator('canvas').boundingBox())!;await page.mouse.move(b.x+b.width*.5,b.y+b.height*.7);await page.mouse.wheel(0,400);await expect.poll(async()=>(await data(page,'shop-scroll')).offset).toBe(95);await settle(page);}
async function swipeHomeCard(page:Page){
 const card:Control=(await data(page,'controls')).find((c:Control)=>c.id==='shop-section-staff'),b=(await page.locator('canvas').boundingBox())!;
 const x=b.x+(card.x+card.width/2)*b.width/360,y=b.y+(card.y+card.height/2)*b.height/640;
 const touch=await page.context().newCDPSession(page);
 try{
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  for(let step=1;step<=6;step++){await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-step*18*b.height/640,id:1}]});await settle(page);}
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await settle(page);
 }finally{await touch.detach();}
 await expect.poll(async()=>(await data(page,'shop-scroll')).offset).toBe(95);
 await expect(page.locator('canvas')).toHaveAttribute('data-shop-page','home');
}
let bundles=new Map<number,string>();
async function fixture(page:Page,day=5){
 if(!bundles.has(day)){
  const name:string='node:path',paths=await import(name);
  const result=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
   import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';import {CozyCampaignSession} from './src/runtime/CozyCampaignSession';import {CozySaveRepository,saveFailure} from './src/infrastructure/CozySaveRepository';
   (async()=>{const initial=new CozyRuntime(false,true,{eventSeed:42,eventRoll:()=>1});initial.claimTestCode('VIETVUIVE');
    for(let d=1;d<${day};d++){d===1?initial.openShop():initial.openNextDay();initial.closeDay();}
    const repo=new CozySaveRepository(),loaded=await repo.load(),saved=await repo.commit({campaignId:'app-campaign-test',commitId:'initial',sourceRevision:0,replacementToken:loaded.replacementToken,payload:initial.exportCheckpoint()});if(!saved.ok)throw Error(saved.message);
    const port={load:()=>repo.load(),commit:async request=>{if(window.appFailNext){window.appFailNext=false;return saveFailure('write-failed');}if(window.appHoldNext){window.appHoldNext=false;await new Promise(resolve=>window.releaseAppWrite=resolve);}return repo.commit(request);}};
    const session=new CozyCampaignSession(port),runtime=await session.load(),scene=new CozyScene(runtime,undefined,undefined,undefined,session.lifecycle,session);
    const game=new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[scene]});window.appFixture={runtime,session,scene,game};})();
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});bundles.set(day,result.outputFiles[0].text);
 }
 await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
 await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;overflow:hidden}#fixture{height:100%;width:100%}</style><div id="fixture"></div>');
 await page.addScriptTag({content:bundles.get(day)!});await expect(page.locator('canvas')).toHaveAttribute('data-booted','true',{timeout:30000});await ready(page);await tap(page,'summary-tab-shop');
}
async function openApp(page:Page){await scrollHome(page);await tap(page,'shop-section-app');await expect(page.locator('canvas')).toHaveAttribute('data-shop-page','app');}
async function enableApp(page:Page){await tap(page,'shop-delivery-app');await tap(page,'delivery-app-confirm');await ready(page);}
async function campaign(page:Page){return page.evaluate(()=>(window as any).appFixture.runtime.appCampaignState);}

test('seventh card is clipped, scrollable and discoverable while day1 app remains locked',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await fixture(page,1);
 const home=await data(page,'controls'),sections=home.filter((c:Control)=>c.id.startsWith('shop-section-'));
 expect(sections).toHaveLength(7);expect(sections.find((c:Control)=>c.id==='shop-section-app').enabled).toBe(false);
 const expected=['menu','decoration','equipment','amenities','expansion','staff'];
 for(const [i,id] of expected.entries()){
  const rect=await page.evaluate(id=>(window as any).appFixture.scene.tapRects.get('shop-section-'+id),id);
  expect(rect.x).toBeCloseTo(21.6+(8+i%2*176)*.88);expect(rect.y).toBeCloseTo(21.6+(292+Math.floor(i/2)*95)*.88);expect(rect.w).toBeCloseTo(168*.88);expect(rect.h).toBeCloseTo(89*.88);
 }
 const shell=home.filter((c:Control)=>c.id.startsWith('summary-tab-')||c.id==='pause'||c.id==='summary-open-first-day');
 await page.locator('canvas').screenshot({path:'_bmad-output/implementation-artifacts/ui-baseline/app-orders-visual-polish-2026-10-14/home.png'});
 await swipeHomeCard(page);expect((await data(page,'controls')).filter((c:Control)=>c.id.startsWith('summary-tab-')||c.id==='pause'||c.id==='summary-open-first-day')).toEqual(shell);
 await page.locator('canvas').screenshot({path:'_bmad-output/implementation-artifacts/ui-baseline/app-orders-visual-polish-2026-10-14/home-scrolled.png'});await tap(page,'shop-section-app');
 expect((await data(page,'controls')).find((c:Control)=>c.id==='shop-app-campaign').enabled).toBe(false);expect((await campaign(page)).reason).toBe('Mở từ ngày 5');
 await tap(page,'shop-delivery-app');await tap(page,'delivery-app-close');expect((await data(page,'delivery-app')).enabled).toBe(false);
 await page.locator('canvas').screenshot({path:'_bmad-output/implementation-artifacts/ui-baseline/app-orders-visual-polish-2026-10-14/app-locked.png'});await tap(page,'shop-screen-back');
 await tap(page,'shop-section-amenities');expect((await data(page,'controls')).some((c:Control)=>c.id==='shop-delivery-app')).toBe(false);expect(errors).toEqual([]);
});

test('app toggle and daily campaign save silently once, preserve counter forecasts and survive reload',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await fixture(page);await openApp(page);
 expect((await campaign(page)).reason).toBe('Bật app để chạy chiến dịch');await enableApp(page);
 const before=await campaign(page),cash=Number(await page.locator('canvas').getAttribute('data-cash'));expect(before.forecast.appOrders).toBe(2);
 await page.evaluate(()=>{(window as any).appHoldNext=true;});await tap(page,'shop-app-campaign');
 expect((await data(page,'save-state')).state).toBe('saving');await expect(page.locator('canvas')).toHaveAttribute('data-screen','preparation-hub');
 expect((await campaign(page)).bought).toBe(false);expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(cash);
 expect((await data(page,'controls')).some((c:Control)=>c.id.startsWith('save-'))).toBe(false);
 await page.locator('canvas').screenshot({path:'_bmad-output/implementation-artifacts/ui-baseline/app-orders-visual-polish-2026-10-14/silent-saving.png'});await tap(page,'summary-tab-stock');
 await page.evaluate(()=>(window as any).releaseAppWrite());await ready(page);await tap(page,'summary-tab-shop');await openApp(page);
 const after=await campaign(page);expect(after.bought).toBe(true);expect(after.forecast).toMatchObject({appOrders:3,shopVisits:before.forecast.shopVisits});expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(cash-100);
 expect((await data(page,'controls')).find((c:Control)=>c.id==='shop-app-campaign').enabled).toBe(false);
 await enableApp(page);expect((await campaign(page)).forecast.appOrders).toBe(0);expect((await campaign(page)).bought).toBe(true);await enableApp(page);expect((await campaign(page)).forecast).toEqual(after.forecast);
 await page.locator('canvas').screenshot({path:'_bmad-output/implementation-artifacts/ui-baseline/app-orders-visual-polish-2026-10-14/purchased.png'});
 await page.unroute('**/assets/index-*.js');await page.goto('/?mode=shop');await ready(page);await tap(page,'summary-tab-shop');await openApp(page);
 expect((await data(page,'shop-screen-cards')).find((card:any)=>card.id==='app-campaign').bought).toBe(true);expect((await data(page,'shop-screen-cards')).find((card:any)=>card.id==='app-forecast').appOrders).toBe(3);expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(cash-100);
 await page.locator('canvas').screenshot({path:'_bmad-output/implementation-artifacts/ui-baseline/app-orders-visual-polish-2026-10-14/restored.png'});expect(errors).toEqual([]);
});

test('failed campaign save shows retry and commits the staged cost once',async({page})=>{
 await fixture(page);await openApp(page);await enableApp(page);const cash=Number(await page.locator('canvas').getAttribute('data-cash'));
 await page.evaluate(()=>{(window as any).appFailNext=true;});await tap(page,'shop-app-campaign');await expect.poll(async()=>(await data(page,'save-state')).state).toBe('error');
 expect((await campaign(page)).bought).toBe(false);expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(cash);
 await tap(page,'save-retry');await ready(page);expect((await campaign(page)).bought).toBe(true);expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(cash-100);
});
