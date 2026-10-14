import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

test.setTimeout(90000);
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)??'null');}
async function tap(page:Page,id:string){
  let control:any;await expect.poll(async()=>{control=(await data(page,'controls')).find((c:any)=>c.id===id&&c.enabled);return !!control;}).toBe(true);
  const b=(await page.locator('canvas').boundingBox())!;await page.touchscreen.tap(b.x+(control.x+control.width/2)*b.width/360,b.y+(control.y+control.height/2)*b.height/640);
}
async function fixture(page:Page,mode:'preparation'|'end-day'|'unconfigured'|'no-port'|'tutorial'='preparation'){
  const moduleName:string='node:path',paths=await import(moduleName);
  const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';import {PlayLifecycle} from './src/runtime/PlayLifecycle';import {LeaderboardSession,LeaderboardError} from './src/runtime/LeaderboardSession';
    const deps={eventSeed:321,eventRoll:()=>1,schedule:day=>({day,duration:180,grace:120,slots:[]})};
    let r=new CozyRuntime(false,true,deps);for(const ingredient of ['dough','sauce','cheese'])r.buy(ingredient,2);
    if('${mode}'==='end-day'){r.openShop();r.resolveLottery(0);r.closeDay();}
    if('${mode}'==='tutorial'){const checkpoint=r.exportCheckpoint();checkpoint.tutorialProgress={version:1,index:30,status:'active'};r=CozyRuntime.restoreCheckpoint(checkpoint,false,deps);if(!r)throw Error('Tutorial checkpoint invalid');}
    const f={r,scene:null,reads:0,pending:[],mode:'${mode}',unsubscribed:0,leaderboard:null};
    const entries=Array.from({length:10},(_,i)=>({id:'player-'+i,name:'Người chơi '+(i+1),cash:100000-i*5000,day:10-i,rank:i+1}));
    const transport={publish:async()=>{},read:()=>{f.reads++;return new Promise((resolve,reject)=>f.pending.push({resolve,reject}));}};
    const board=new LeaderboardSession(localStorage,transport);board.setName('Người chơi của tôi');f.leaderboard=board;
    const subscribe=board.subscribe;board.subscribe=listener=>{const unsubscribe=subscribe(listener);return ()=>{f.unsubscribed++;unsubscribe();};};
    f.resolve=()=>{const next=f.pending.shift();if(!next)throw Error('No request');if(f.mode==='unconfigured')next.reject(new LeaderboardError('unconfigured','Bảng xếp hạng chưa được kết nối.'));else next.resolve({entries,self:{id:'me',name:'Người chơi của tôi',cash:2000,day:4,rank:12}});};
    const lifecycle=new PlayLifecycle(r,()=>0);lifecycle.frame=()=>lifecycle.reconcile();const scene=new CozyScene(r,undefined,undefined,undefined,lifecycle,undefined,undefined,undefined,'${mode}'==='no-port'?undefined:board);f.scene=scene;window.rankFixture=f;
    new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[scene]});
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:bundle.outputFiles[0].text});await expect(page.locator('canvas')).toHaveAttribute('data-booted','true',{timeout:30000});
}
async function resolve(page:Page){await expect.poll(()=>page.evaluate(()=>(window as any).rankFixture.pending.length)).toBe(1);await page.evaluate(()=>(window as any).rankFixture.resolve());}

for(const mode of ['preparation','end-day'] as const)test(`${mode} fifth tab displays online cash/day data, personal rank and explicit refresh`,async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page,mode);
  const before=await page.evaluate(()=>{const r=(window as any).rankFixture.r;return {cash:r.state.cash,day:r.day,pauses:r.pauses};});
  await tap(page,'summary-tab-missions');await expect(page.locator('canvas')).toHaveAttribute('data-summary-tab','missions');
  expect((await data(page,'hub-header-labels'))[0]).toBe('Bảng xếp hạng');expect(await data(page,'hub-header-labels')).toContain('Xếp hạng');
  await expect.poll(async()=>(await data(page,'hub-leaderboard')).state).toBe('loading');await resolve(page);
  await expect.poll(async()=>(await data(page,'hub-leaderboard')).state).toBe('ready');let view=await data(page,'hub-leaderboard');
  expect(view.visible.map((r:any)=>r.rank)).toEqual([1,2,3,4,5]);expect(view.visible[0]).toMatchObject({cash:100000,day:10});expect(view.self).toMatchObject({rank:12,cash:2000,day:4});
  await page.locator('canvas').screenshot({path:info.outputPath(`leaderboard-${mode}.png`)});
  await tap(page,'leaderboard-next');expect((await data(page,'hub-leaderboard')).visible.map((r:any)=>r.rank)).toEqual([6,7,8,9,10]);
  expect(await page.evaluate(()=>(window as any).rankFixture.reads)).toBe(1);await tap(page,'leaderboard-refresh');await resolve(page);await expect.poll(async()=>(await data(page,'hub-leaderboard')).state).toBe('ready');
  expect(await page.evaluate(()=>(window as any).rankFixture.reads)).toBe(2);await page.waitForTimeout(250);expect(await page.evaluate(()=>(window as any).rankFixture.reads)).toBe(2);
  expect(await page.evaluate(()=>{const r=(window as any).rankFixture.r;return {cash:r.state.cash,day:r.day,pauses:r.pauses};})).toEqual(before);
  await tap(page,'summary-tab-stock');await expect(page.locator('canvas')).toHaveAttribute('data-summary-tab','stock');
  await tap(page,'summary-tab-missions');await resolve(page);await expect.poll(async()=>(await data(page,'hub-leaderboard')).state).toBe('ready');
  expect(await page.evaluate(()=>(window as any).rankFixture.reads)).toBe(3);
  // Both lifecycle events may fire; the shared port must be unsubscribed once.
  await page.evaluate(()=>{const scene=(window as any).rankFixture.scene;scene.game.scene.remove('CozyScene');});
  await expect.poll(()=>page.evaluate(()=>(window as any).rankFixture.unsubscribed)).toBe(1);expect(errors).toEqual([]);
});

test('missing online configuration and missing port show no fake rows and leave day opening available',async({page},info)=>{
  test.setTimeout(150000);
  for(const mode of ['unconfigured','no-port'] as const){
    await fixture(page,mode);await tap(page,'summary-tab-missions');if(mode==='unconfigured')await resolve(page);
    await expect.poll(async()=>(await data(page,'hub-leaderboard')).state).toBe('unconfigured');const view=await data(page,'hub-leaderboard');expect(view.visible).toEqual([]);expect(view.message).toContain('chưa được kết nối');
    await page.locator('canvas').screenshot({path:info.outputPath(`leaderboard-${mode}.png`)});
    await tap(page,'summary-open-first-day');await expect(page.locator('canvas')).toHaveAttribute('data-screen','game');
  }
});

test('saved fifth-tab tutorial index introduces rankings and Next advances to ready',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await fixture(page,'tutorial');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-tutorial','missions-goal');await expect(canvas).toHaveAttribute('data-tutorial-text',/Bảng xếp hạng.*tiền.*ngày chơi/);
  expect((await data(page,'tutorial-guide')).index).toBe(30);await resolve(page);await expect.poll(async()=>(await data(page,'hub-leaderboard')).state).toBe('ready');
  const tab=(await data(page,'controls')).find((r:any)=>r.id==='summary-tab-missions'),focus=await data(page,'tutorial-focus');expect(focus).toMatchObject({x:tab.x,y:tab.y,width:tab.width,height:tab.height});
  expect((await data(page,'hub-navigation-motion')).tabs.missions).toEqual({amount:1,scale:1});await tap(page,'tutorial-next');await expect(canvas).toHaveAttribute('data-tutorial','ready');expect((await data(page,'tutorial-guide')).index).toBe(33);
});
