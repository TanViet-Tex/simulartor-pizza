import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

async function tap(page:Page,id:string,menu=false){
  const canvas=page.locator('canvas'),attr=menu?'data-menu-targets':'data-controls';
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute(attr)??'[]').some((c:{id:string;enabled?:boolean;disabled?:boolean})=>c.id===id&&(menu?!c.disabled:c.enabled))).toBe(true);
  const c=JSON.parse(await canvas.getAttribute(attr)??'[]').find((c:{id:string})=>c.id===id),b=(await canvas.boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}
async function fixture(page:Page){
  const pathSpecifier:string='node:path';const paths:{resolve(path:string):string}=await import(pathSpecifier);
  const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';import {MenuPreferences} from './src/presentation/MenuPreferences';
    const runtime=new CozyRuntime(false,true,{schedule:day=>({day,duration:120,grace:20,slots:[0,4].map((at,i)=>({id:'pause-'+i,at,kind:'regular',opportunity:'commercial',commercialOrdinal:i+1,takeaway:true}))})});
    runtime.buy('dough',3);runtime.openShop();runtime.advance(50);runtime.dispatch({type:'ingredient',ingredient:'dough'});runtime.dispatch({type:'bake'});for(let i=0;i<20;i++)runtime.advance(50);
    const game=new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(runtime,new MenuPreferences(),()=>{})]});
    Object.assign(window,{pauseTest:{runtime,game}});
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:bundle.outputFiles[0].text});await expect(page.locator('canvas')).toHaveAttribute('data-stage','baking');
  if(await page.locator('canvas').getAttribute('data-paused')==='gap')await tap(page,'resume');
}
async function snapshot(page:Page){return page.evaluate(()=>{
  const runtime=(window as unknown as {pauseTest:{runtime:any}}).pauseTest.runtime;
  return {clock:runtime.shiftClock,oven:runtime.ovenState?.ovenSeconds,tickets:runtime.tickets,cash:runtime.state.cash,stock:runtime.owned('dough'),owner:runtime.ovenOwner};
});}
async function advance(page:Page){await page.evaluate(()=>{const r=(window as unknown as {pauseTest:{runtime:any}}).pauseTest.runtime;for(let i=0;i<100;i++)r.advance(50);});}

test('three artwork buttons block background; settings and pause freeze every simulation timer',async({page},info)=>{
  await fixture(page);const canvas=page.locator('canvas');await tap(page,'pause');
  await expect(canvas).toHaveAttribute('data-paused','user');const frozen=await snapshot(page);
  const controls=JSON.parse(await canvas.getAttribute('data-controls')??'[]');
  expect(controls.filter((c:{enabled:boolean})=>c.enabled).map((c:{id:string})=>c.id)).toEqual(['resume','pause-settings','main-menu']);
  await advance(page);expect(await snapshot(page)).toEqual(frozen);
  const b=(await canvas.boundingBox())!;await page.touchscreen.tap(b.x+45*b.width/360,b.y+514*b.height/640);expect(await snapshot(page)).toEqual(frozen);
  await canvas.screenshot({path:info.outputPath('reference-pause.png')});
  await tap(page,'pause-settings');await advance(page);expect(await snapshot(page)).toEqual(frozen);
  await tap(page,'settings-effects-less');await tap(page,'settings-motion');
  await expect(canvas).toHaveAttribute('data-reduced-motion','true');
  await canvas.screenshot({path:info.outputPath('pause-settings.png')});
  await tap(page,'pause-settings-back');await expect(canvas).toHaveAttribute('data-paused','user');
  await tap(page,'resume');await expect(canvas).toHaveAttribute('data-paused','');
  await advance(page);expect((await snapshot(page)).clock).not.toEqual(frozen.clock);
});

test('resume keeps another order owner while switching tabs adds no automatic pause',async({page})=>{
  await fixture(page);const canvas=page.locator('canvas');await tap(page,'pause');
  await page.evaluate(()=>{
    const state=(window as unknown as {pauseTest:{runtime:any;other?:any}}).pauseTest;
    state.other=state.runtime.acquirePause('order');
    Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
  });
  const frozen=await snapshot(page);await tap(page,'resume');await advance(page);expect(await snapshot(page)).toEqual(frozen);
  expect((await canvas.getAttribute('data-paused'))!.split(',')).toContain('order');
  expect((await canvas.getAttribute('data-paused'))!.split(',')).not.toContain('visibility');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  expect((await canvas.getAttribute('data-paused'))!.split(',')).toContain('order');
  await page.evaluate(()=>{(window as unknown as {pauseTest:{other:any}}).pauseTest.other.release();});
});

test('hidden throttled render catches up clock, oven, patience, arrivals and express without Continue',async({page})=>{
  await fixture(page);const canvas=page.locator('canvas');
  await page.evaluate(()=>{
    const r=(window as unknown as {pauseTest:{runtime:any}}).pauseTest.runtime;
    r.dispatch({type:'express.order',ingredient:'dough',quantity:1,commandId:'background-test'});
  });
  const before=await snapshot(page);
  await page.evaluate(()=>{
    const s=(window as unknown as {pauseTest:{game:any}}).pauseTest;
    Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('blur'));s.game.loop.sleep();
  });
  await page.waitForTimeout(5400);
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));(window as unknown as {pauseTest:{game:any}}).pauseTest.game.loop.wake();
  });
  await expect.poll(async()=> (await snapshot(page)).clock.elapsed).toBeGreaterThan(before.clock.elapsed+5);
  const after=await snapshot(page);expect(after.oven).toBeGreaterThan((before.oven??0)+5);expect(after.tickets.length).toBe(2);
  expect(after.tickets[0].remaining).toBeLessThan(before.tickets[0].remaining-5);expect(after.stock).toBe(before.stock+1);
  await expect(canvas).toHaveAttribute('data-paused','');
  expect(JSON.parse(await canvas.getAttribute('data-controls')??'[]').some((c:{id:string})=>c.id==='resume')).toBe(false);
});

test('manual Pause and Settings exclude hidden time and resume without catch-up',async({page})=>{
  await fixture(page);const canvas=page.locator('canvas');await tap(page,'pause');await tap(page,'pause-settings');
  const before=await snapshot(page);
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
    (window as unknown as {pauseTest:{game:any}}).pauseTest.game.loop.sleep();
  });
  await page.waitForTimeout(1600);
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));
    (window as unknown as {pauseTest:{game:any}}).pauseTest.game.loop.wake();
  });
  await tap(page,'pause-settings-back');expect(await snapshot(page)).toEqual(before);await tap(page,'resume');
  await page.waitForTimeout(200);const after=await snapshot(page);expect(after.clock.elapsed-before.clock.elapsed).toBeLessThan(1);
  await expect(canvas).toHaveAttribute('data-paused','');
});

test('Menu and Continue keep the exact active session without writing or ending the day',async({page})=>{
  await page.goto('/?mode=freeplay');const canvas=page.locator('canvas');await tap(page,'dough');await tap(page,'sauce');await tap(page,'pause');
  await page.evaluate(()=>{const state={writes:0};Object.assign(window,{pauseWrites:state});const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args:Parameters<IDBObjectStore['put']>){state.writes++;return original.apply(this,args);};});
  await tap(page,'main-menu');await expect(canvas).toHaveAttribute('data-screen','menu');await tap(page,'menu-start',true);
  await expect(canvas).toHaveAttribute('data-menu-dialog','new-session');await tap(page,'menu-new-cancel',true);await tap(page,'menu-continue',true);
  await expect(canvas).toHaveAttribute('data-screen','game');await expect(canvas).toHaveAttribute('data-ingredients','dough,sauce');await expect(canvas).toHaveAttribute('data-cash','300');
  expect(await page.evaluate(()=>(window as unknown as {pauseWrites:{writes:number}}).pauseWrites.writes)).toBe(0);
});

test('Continue recovers a runtime-owned long-delta gap without clearing another owner',async({page})=>{
  await fixture(page);const canvas=page.locator('canvas');
  await page.evaluate(()=>{
    const state=(window as unknown as {pauseTest:{runtime:any;other?:any}}).pauseTest;
    state.runtime.advance(500);state.other=state.runtime.acquirePause('order');
  });
  await expect(canvas).toHaveAttribute('data-paused',/gap/);await tap(page,'resume');
  await expect(canvas).toHaveAttribute('data-paused','order');
});
