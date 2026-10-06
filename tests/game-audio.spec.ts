import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

async function tap(page:Page,id:string,menu=false){
  const canvas=page.locator('canvas');
  const attribute=menu?'data-menu-targets':'data-controls';
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute(attribute)??'[]').some((c:any)=>c.id===id&&(menu?!c.disabled:c.enabled))).toBe(true);
  const c=JSON.parse(await canvas.getAttribute(attribute)??'[]').find((c:any)=>c.id===id),b=(await canvas.boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}
async function fixture(page:Page,level:number){
  page.on('pageerror',error=>console.error(error.message));
  const pathSpecifier:string='node:path';const paths:{resolve(path:string):string}=await import(pathSpecifier);
  const bundled=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';
    import {fundedShopCheckpoint} from './src/runtime/shopTestFixture';import {PlayAudio} from './src/presentation/PlayAudio';import {MenuPreferences} from './src/presentation/MenuPreferences';
    import {PlayLifecycle} from './src/runtime/PlayLifecycle';
    const runtime=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint(22000),false,{schedule:day=>({day,duration:350,grace:120,slots:[{id:'audio-first',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:true},{id:'audio-next',at:12,kind:'regular',opportunity:'commercial',commercialOrdinal:2,takeaway:true}]}),resolveRecipe:()=> 'cheese'});
    for(let i=0;i<${level};i++)if(!runtime.upgradeShop('oven','audio-upgrade-'+i))throw Error('upgrade failed');
    for(const ingredient of ['dough','sauce','cheese'])runtime.buy(ingredient,3);
    if(!runtime.openShop())throw Error('open shop failed');runtime.dismissThanks();
    const media=[];const audio=new PlayAudio(undefined,url=>{const item={src:url,loop:false,volume:1,currentTime:0,paused:true,plays:0,preload:'',onended:null,play(){if(!this.src.startsWith('data:'))this.plays++;this.paused=false;return Promise.resolve();},pause(){this.paused=true;},removeAttribute(){},load(){}};media.push(item);return item;});
    const lifecycle=new PlayLifecycle(runtime,()=>0);lifecycle.frame=()=>lifecycle.reconcile();
    new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(runtime,new MenuPreferences(),undefined,audio,lifecycle)]});Object.assign(window,{audioFixture:{runtime,audio,media}});
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:bundled.outputFiles[0].text});await expect(page.locator('canvas')).toHaveAttribute('data-screen','game',{timeout:15000});
}
const snapshot=(page:Page)=>page.evaluate(()=>(window as any).audioFixture.audio.snapshot);
for(const level of [0,1,2])test(`oven level ${level+1} follows real timing, pause owners and settings`,async({page})=>{
  await fixture(page,level);
  await tap(page,'dough');await tap(page,'sauce');await tap(page,'cheese');await tap(page,'bake');
  await expect.poll(async()=>(await snapshot(page)).streams.find((s:any)=>s.name==='oven')?.paused).toBe(false);
  await page.evaluate(()=>{const f=(window as any).audioFixture;f.media.find((m:any)=>decodeURIComponent(m.src).includes('lò nướng')).currentTime=.7;});
  await tap(page,'pause');await tap(page,'pause-settings');
  expect((await snapshot(page)).streams.find((s:any)=>s.name==='oven')).toMatchObject({paused:true,currentTime:.7});
  await page.evaluate(()=>{const f=(window as any).audioFixture;f.runtime.advanceElapsed(3000);});
  expect((await snapshot(page)).streams.find((s:any)=>s.name==='oven')).toMatchObject({paused:true,currentTime:.7});
  await tap(page,'settings-music-choice');expect((await snapshot(page)).musicTrack).toBe(1);
  await tap(page,'settings-music');expect((await snapshot(page)).musicEnabled).toBe(false);
  await tap(page,'settings-music');expect((await snapshot(page)).musicEnabled).toBe(true);
  await page.evaluate(()=>{const f=(window as any).audioFixture;f.lease=f.runtime.acquirePause('order');});
  await tap(page,'pause-settings-back');await tap(page,'resume');
  expect((await snapshot(page)).streams.find((s:any)=>s.name==='oven')).toMatchObject({paused:true,currentTime:.7});
  await page.evaluate(()=>{(window as any).audioFixture.lease.release();});
  await expect.poll(async()=>(await snapshot(page)).streams.find((s:any)=>s.name==='oven')?.paused).toBe(false);
  expect((await snapshot(page)).streams.find((s:any)=>s.name==='oven')?.currentTime).toBe(.7);
  await page.evaluate(()=>{const f=(window as any).audioFixture;f.runtime.advanceElapsed((f.runtime.bakeTiming.perfectStart-.05-f.runtime.ovenState.ovenSeconds)*1000);});
  expect((await snapshot(page)).baking).toBe(true);
  await page.evaluate(()=>{const f=(window as any).audioFixture;f.runtime.advanceElapsed(50);});
  await expect.poll(async()=>(await snapshot(page)).baking).toBe(false);
  expect((await snapshot(page)).streams.find((s:any)=>s.name==='oven')).toMatchObject({paused:true,currentTime:0});
  await tap(page,'extract');await tap(page,'box');
  await page.evaluate(()=>{(window as any).audioFixture.runtime.advanceElapsed(13000);});
  const sounds=await page.evaluate(()=>(window as any).audioFixture.media.map((m:any)=>({file:decodeURIComponent(m.src.split('/').pop()),plays:m.plays})));
  for(const file of ['sốt.mp3','đóng hộp pizza.wav','cài đặt.mp3','tiếng khách đến.wav'])expect(sounds.find((s:any)=>s.file===file)?.plays).toBe(1);
  expect(sounds.filter((s:any)=>s.file==='lò nướng.mp3')).toHaveLength(1);
});

test('all seven audio assets load browser media metadata',async({page})=>{
  test.setTimeout(60000);
  await page.goto('/');
  const files=['lò nướng.mp3','cài đặt.mp3','sốt.mp3','đóng hộp pizza.wav','tiếng khách đến.wav','nhạc nèn bán pizza 2.mp3','nhac nền bán pizza.mp3'];
  const durations=await page.evaluate(async names=>{
    return await Promise.all(names.map(name=>new Promise<number>((resolve,reject)=>{const media=new Audio('/assets/audio/'+encodeURIComponent(name));media.preload='metadata';media.onloadedmetadata=()=>{const duration=media.duration;media.removeAttribute('src');media.load();resolve(duration);};media.onerror=()=>reject(Error(name));})));
  },files);
  expect(durations).toHaveLength(7);for(const seconds of durations)expect(seconds).toBeGreaterThan(0);
});

test('real browser playback keeps oven position through Menu and Music remains shared',async({page})=>{
  test.setTimeout(60000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?mode=freeplay&perf=1');
  await expect(page.locator('canvas')).toHaveAttribute('data-screen','game',{timeout:15000});
  const read=()=>page.evaluate(()=>{
    const game=(window as any).pizzaPerformance.game;
    return game.scene.getScenes(true).find((s:any)=>s.audio?.snapshot)?.audio.snapshot;
  });
  await tap(page,'dough');
  // A timer callback has no direct input gesture: Safari must use the primed voice.
  await page.evaluate(()=>new Promise<void>(resolve=>setTimeout(()=>{
    const scene=(window as any).pizzaPerformance.game.scene.getScene('CozyScene');scene.audio.effect('arrival');resolve();
  },100)));
  await expect.poll(async()=>(await read()).streams.find((s:any)=>s.name==='arrival')?.currentTime).toBeGreaterThan(0);
  await tap(page,'bake');
  await expect.poll(async()=>(await read()).streams.find((s:any)=>s.name==='oven')?.currentTime).toBeGreaterThan(0);
  await tap(page,'pause');const position=(await read()).streams.find((s:any)=>s.name==='oven').currentTime;
  expect((await read()).streams.find((s:any)=>s.name==='oven').paused).toBe(true);
  await tap(page,'main-menu');await tap(page,'menu-settings',true);
  expect((await read()).streams.find((s:any)=>s.name==='oven').currentTime).toBeCloseTo(position,2);
  await expect.poll(async()=>(await read()).streams.find((s:any)=>s.name==='music2')?.currentTime).toBeGreaterThan(0);
  await tap(page,'menu-music-choice',true);
  await expect.poll(async()=>(await read()).streams.find((s:any)=>s.name==='music1')?.currentTime).toBeGreaterThan(0);
  expect((await read()).streams.find((s:any)=>s.name==='music2').paused).toBe(true);
  await tap(page,'menu-settings-close',true);await tap(page,'menu-continue',true);
  await expect.poll(async()=>(await read()).streams.find((s:any)=>s.name==='oven')?.paused).toBe(false);
  expect((await read()).streams.filter((s:any)=>s.name==='oven')).toHaveLength(1);
  expect((await read()).streams.find((s:any)=>s.name==='oven').currentTime).toBeGreaterThanOrEqual(position);
  await expect.poll(async()=>(await read()).baking,{timeout:10000}).toBe(false);
  expect((await read()).streams.find((s:any)=>s.name==='oven')).toMatchObject({paused:true,currentTime:0});
  await page.evaluate(()=>(window as any).pizzaPerformance.game.scene.getScene('CozyScene').runtime.dispatch({type:'reset'}));
  await tap(page,'dough');await tap(page,'bake');await tap(page,'pause');await tap(page,'main-menu');
  await tap(page,'menu-start',true);await tap(page,'menu-new-confirm',true);
  await expect(page.locator('canvas')).toHaveAttribute('data-stage','assembly');
  await expect.poll(async()=>(await read()).baking).toBe(false);
  expect((await read()).streams.find((s:any)=>s.name==='oven')).toMatchObject({paused:true,currentTime:0});
  expect((await read()).musicTrack).toBe(1);
  expect(errors).toEqual([]);
});
