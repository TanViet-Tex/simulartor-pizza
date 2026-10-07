import {test,expect} from '@playwright/test';
import {build} from 'esbuild';
for(const missing of [false,true])test(`special welcome freezes simulation and fictional bubble remains playable (${missing?'reduced motion, missing assets':'original portraits and frames'})`,async({page},info)=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:missing?'reduce':'no-preference'});
 if(missing){await page.route('**/*20*',route=>route.abort());await page.route('**/*cao*',route=>route.abort());}
 const specifier:string='node:path',paths=await import(specifier);
 const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
 import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';import {fundedShopCheckpoint} from './src/runtime/shopTestFixture';
 let r=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint(8000),false,{eventRoll:()=>1,vipRoll:()=>1});while(r.preparationDay<10){r.openShop();r.closeDay();r=CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,{eventRoll:()=>1,vipRoll:()=>1});}
 const runtime=CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,{eventRoll:()=>1,vipRoll:()=>0,schedule:day=>({day,duration:240,grace:120,slots:[{id:'special-first',at:0,kind:'picky',opportunity:'commercial',commercialOrdinal:1,takeaway:true}]})});window.specialFixture=runtime;
 new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(runtime)]});
 `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
 await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');await page.addScriptTag({content:bundle.outputFiles[0].text});await expect(page.locator('canvas')).toHaveAttribute('data-booted','true',{timeout:20000});
 await page.evaluate(()=>{const r=(window as any).specialFixture;r.openShop();(window as any).specialHold=r.acquirePause('user');});
 await expect.poll(()=>page.locator('canvas').getAttribute('data-special-welcome')).not.toBe('null');
 const before=await page.evaluate(()=>{const r=(window as any).specialFixture;return {elapsed:r.shiftClock.elapsed,patience:r.selectedTicket.remaining,welcome:r.specialWelcome.remaining};});
 await page.waitForTimeout(400);expect(await page.evaluate(()=>{const r=(window as any).specialFixture;return {elapsed:r.shiftClock.elapsed,patience:r.selectedTicket.remaining,welcome:r.specialWelcome.remaining};})).toEqual(before);
 await page.evaluate(()=>(window as any).specialHold.release());await page.locator('canvas').screenshot({path:info.outputPath('welcome.png')});
 if(missing)await page.evaluate(()=>{const nativeNow=performance.now.bind(performance);let offset=3000;performance.now=()=>nativeNow()+offset;(window as any).advancePresentationTime=()=>{offset+=5000;};});
 await expect.poll(()=>page.locator('canvas').getAttribute('data-special-welcome'),{timeout:7000}).toBe('null');
 await expect.poll(()=>page.locator('canvas').getAttribute('data-special-bubble')).not.toBe('null');
 const labels=JSON.parse(await page.locator('canvas').getAttribute('data-labels')||'[]');expect(labels.some((l:any)=>l.text.includes('Lời thoại hư cấu'))).toBe(true);
 await page.locator('canvas').screenshot({path:info.outputPath('fictional-order-bubble.png')});
 if(missing)await page.evaluate(()=>(window as any).advancePresentationTime());
 await expect.poll(()=>page.locator('canvas').getAttribute('data-special-bubble'),{timeout:7000}).toBe('null');
 expect(await page.evaluate(()=>(window as any).specialFixture.shiftClock.attempted)).toBe(1);expect(errors).toEqual([]);
});
