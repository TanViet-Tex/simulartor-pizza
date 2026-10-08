import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';
import {fundedShopCheckpoint} from '../src/runtime/shopTestFixture';

test.setTimeout(90000);

async function settle(page:Page){await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));}
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)||'null');}
async function tap(page:Page,id:string){
  await expect.poll(async()=>(await data(page,'controls')).some((c:any)=>c.id===id&&c.enabled)).toBe(true);
  const c=(await data(page,'controls')).find((c:any)=>c.id===id),b=(await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);await settle(page);
}
async function fixture(page:Page){
  const pathSpecifier:string='node:path',paths=await import(pathSpecifier);
  const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';import {PlayLifecycle} from './src/runtime/PlayLifecycle';
    const runtime=CozyRuntime.restoreCheckpoint(window.backgroundCheckpoint,false,{eventRoll:()=>1,vipRoll:()=>1});
    for(const id of ['dough','sauce','cheese'])runtime.buy(id,4);
    const lifecycle=new PlayLifecycle(runtime,()=>0);lifecycle.frame=()=>lifecycle.reconcile();
    const scene=new CozyScene(runtime,undefined,undefined,undefined,lifecycle);
    const game=new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[scene]});
    window.backgroundFixture={scene,game,runtime};
  `},bundle:true,platform:'browser',format:'iife',define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;overflow:hidden}#fixture{height:100%;width:100%}</style><div id="fixture"></div>');
  await page.evaluate(checkpoint=>Object.assign(window,{backgroundCheckpoint:checkpoint}),fundedShopCheckpoint(6000));
  await page.addScriptTag({content:bundle.outputFiles[0].text});await expect(page.locator('canvas')).toHaveAttribute('data-booted','true',{timeout:30000});await settle(page);
}
async function snapshot(page:Page){return page.evaluate(()=>{
  const f=(window as any).backgroundFixture,images=f.scene.children.list.filter((o:any)=>o.texture?.key==='management-background');
  const image=images[0];f.firstBackground??=image;
  return {count:images.length,same:image===f.firstBackground,visible:image.visible,x:image.x,y:image.y,scaleX:image.scaleX,scaleY:image.scaleY,width:image.displayWidth,height:image.displayHeight,parent:image.parentContainer===null,scrollX:image.scrollFactorX,scrollY:image.scrollFactorY};
});}
async function hubRectangles(page:Page){return page.evaluate(()=>{
  const scene=(window as any).backgroundFixture.scene;
  return Array.from(scene.tapRects.entries()).map(([id,r]:any)=>({id,...r})) as {id:string;x:number;y:number;w:number;h:number}[];
});}

test('five hub tabs share one fixed cover image, scroll and redraw preserve it, kitchen hides it',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page);
  for(const tab of ['summary','market','stock','shop','missions']){
    await tap(page,'summary-tab-'+tab);const state=await snapshot(page);
    expect(state).toMatchObject({count:1,same:true,visible:true,x:180,y:320,parent:true,scrollX:0,scrollY:0});
    expect(state.scaleX).toBe(state.scaleY);expect(state.width).toBeGreaterThanOrEqual(360);expect(state.height).toBeGreaterThanOrEqual(640);
    expect((await data(page,'controls')).filter((c:any)=>c.id.startsWith('summary-tab-'))).toHaveLength(5);
    for(const rect of (await hubRectangles(page)).filter(r=>r.w>0&&r.h>0)){
      if(rect.id==='pause'){
        expect(rect.x+rect.w/2).toBeGreaterThan(40);expect(rect.x+rect.w/2).toBeLessThan(80);expect(rect.y).toBeGreaterThan(40);expect(rect.y+rect.h).toBeLessThan(80);
      }else if(rect.id.startsWith('summary-tab-')){
        expect(rect.x).toBeGreaterThanOrEqual(22);expect(rect.x+rect.w).toBeLessThanOrEqual(338);expect(rect.y).toBeGreaterThanOrEqual(78);expect(rect.y+rect.h).toBeLessThanOrEqual(130);
      }else{
        expect(rect.x).toBeGreaterThanOrEqual(24);expect(rect.x+rect.w).toBeLessThanOrEqual(336);
        expect(rect.y).toBeGreaterThanOrEqual(130);expect(rect.y+rect.h).toBeLessThanOrEqual(581);
      }
    }
    const cash=await data(page,'cash-header');expect(cash.bounds.y).toBeGreaterThanOrEqual(40);expect(cash.bounds.y+cash.bounds.height).toBeLessThanOrEqual(80);expect(cash.bounds.x).toBeGreaterThanOrEqual(280);
    const shell=await data(page,'hub-shell-layout');
    expect(shell.title).toMatchObject({x:80,y:25,width:200,height:50});
    expect(shell.navigation).toMatchObject({x:22,y:80,width:316,height:49});
    await page.locator('canvas').screenshot({path:info.outputPath('background-'+tab+'.png')});
  }
  await tap(page,'summary-tab-market');await tap(page,'market-filter-all');
  const before=await snapshot(page),scroll=await data(page,'market-scroll'),b=(await page.locator('canvas').boundingBox())!;
  const fit=await data(page,'hub-wall-layout'),point={x:fit.x+180*fit.scale,y:fit.y+350*fit.scale};
  await page.mouse.move(b.x+point.x*b.width/360,b.y+point.y*b.height/640);await page.mouse.wheel(0,1000);
  await expect.poll(async()=>(await data(page,'market-scroll')).offset).toBe(scroll.max);
  expect(await snapshot(page)).toEqual(before);await page.locator('canvas').screenshot({path:info.outputPath('background-market-scrolled.png')});
  await page.mouse.move(b.x+point.x*b.width/360,b.y+point.y*b.height/640);await page.mouse.down();
  await page.mouse.move(b.x+point.x*b.width/360,b.y+(point.y+65)*b.height/640,{steps:8});await page.mouse.up();
  await expect.poll(async()=>(await data(page,'market-scroll')).offset).toBeLessThan(scroll.max);
  expect(await snapshot(page)).toEqual(before);
  await tap(page,'market-filter-base');await tap(page,'market-plus-dough');expect(await snapshot(page)).toEqual(before);
  const stockBefore=await page.evaluate(()=>(window as any).backgroundFixture.runtime.available('dough'));
  await tap(page,'market-buy-dough');
  await expect.poll(async()=>await page.evaluate(()=>(window as any).backgroundFixture.runtime.available('dough'))).toBe(stockBefore+2);
  await tap(page,'pause');await page.locator('canvas').screenshot({path:info.outputPath('background-pause.png')});expect(await snapshot(page)).toEqual(before);await tap(page,'resume');
  await tap(page,'summary-open-first-day');await expect(page.locator('canvas')).toHaveAttribute('data-screen','game');
  expect(await snapshot(page)).toMatchObject({count:1,same:true,visible:false});await page.locator('canvas').screenshot({path:info.outputPath('background-kitchen-unchanged.png')});
  await page.evaluate(()=>{const f=(window as any).backgroundFixture;f.runtime.advanceElapsed(420000);f.runtime.closeDay();});await settle(page);
  await tap(page,'summary-tab-summary');expect(await snapshot(page)).toMatchObject({count:1,same:true,visible:true});
  await page.locator('canvas').screenshot({path:info.outputPath('background-closed-summary.png')});
  await page.evaluate(()=>{const f=(window as any).backgroundFixture;f.scene.scene.stop();});
  expect(await page.evaluate(()=>(window as any).backgroundFixture.firstBackground.scene==null)).toBe(true);
  expect(errors).toEqual([]);
});

test('startup loads the local background and asset failure uses existing retry',async({page})=>{
  let broken=true,failedRequests=0,successfulRequests=0;await page.route('**/assets/management-background.png',route=>{
    if(broken){failedRequests++;return route.abort();}successfulRequests++;return route.continue();
  });
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-startup-error','assets');
  broken=false;await page.getByRole('button',{name:'Thử lại'}).click();await expect(page.locator('html')).toHaveAttribute('data-startup','ready');
  await expect(page.locator('canvas')).toHaveAttribute('data-booted','true');expect(failedRequests).toBeGreaterThan(0);expect(successfulRequests).toBe(1);
});
