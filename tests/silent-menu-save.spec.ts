import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)||'null');}
async function tap(page:Page,id:string){
  await expect.poll(async()=>((await data(page,'controls'))||[]).some((control:Control)=>control.id===id&&control.enabled)).toBe(true);
  const control:Control=(await data(page,'controls')).find((entry:Control)=>entry.id===id),bounds=(await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(bounds.x+(control.x+control.width/2)*bounds.width/360,bounds.y+(control.y+control.height/2)*bounds.height/640);
}

test('menu prices save without an overlay, retain error recovery and persist selling changes',async({page})=>{
  test.setTimeout(120000);
  const pathName:string='node:path',paths=await import(pathName);
  const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyCampaignSession} from './src/runtime/CozyCampaignSession';import {CozySaveRepository,saveFailure} from './src/infrastructure/CozySaveRepository';
    (async()=>{const repository=new CozySaveRepository();let delayed=false,failed=false,release;
      const session=new CozyCampaignSession({load:()=>repository.load(),commit:async request=>{if(delayed)await new Promise(resolve=>{release=resolve;});return failed?saveFailure('write-failed'):repository.commit(request);}});
      const runtime=await session.load()??await session.start(false),scene=new CozyScene(runtime,undefined,undefined,undefined,session.lifecycle,session);
      const game=new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[scene]});
      window.menuFixture={runtime,session,scene,game,delay:()=>{delayed=true;},fail:value=>{failed=value;},release:()=>{release();},resume:()=>{delayed=false;}};
    })();
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;overflow:hidden}#fixture{height:100%;width:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:bundle.outputFiles[0].text});
  const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-booted','true',{timeout:30000});
  await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('ready');
  await tap(page,'summary-tab-shop');await tap(page,'shop-section-menu');
  const before=await page.evaluate(()=>(window as any).menuFixture.runtime.customerProgress.pricePercents.cheese);
  await page.evaluate(()=>(window as any).menuFixture.delay());await tap(page,'shop-menu-plus-cheese');
  await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('saving');
  await expect(canvas).toHaveAttribute('data-notification-frame','');await expect(canvas).toHaveAttribute('data-pause-panel','');
  await expect(canvas).toHaveAttribute('data-modal-backdrop','');
  expect(await page.evaluate(()=>(window as any).menuFixture.runtime.customerProgress.pricePercents.cheese)).toBeGreaterThan(before);
  expect((await data(page,'controls')).find((control:Control)=>control.id==='shop-menu-plus-cheese').enabled).toBe(false);
  await page.evaluate(()=>{const fixture=(window as any).menuFixture;fixture.fail(true);fixture.release();});
  await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('error');
  await expect.poll(async()=>(await data(page,'controls')).some((control:Control)=>control.id==='save-retry'&&control.enabled)).toBe(true);
  await page.evaluate(()=>(window as any).menuFixture.fail(false));await tap(page,'save-retry');
  await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('saving');
  await expect(canvas).toHaveAttribute('data-notification-frame','');await expect(canvas).toHaveAttribute('data-pause-panel','');
  await page.evaluate(()=>{const fixture=(window as any).menuFixture;fixture.resume();fixture.release();});
  await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('ready');
  const price=await page.evaluate(()=>(window as any).menuFixture.runtime.customerProgress.prices.cheese);
  const sellingBefore=await page.evaluate(()=>(window as any).menuFixture.runtime.menuRecipes.includes('mushroom'));
  await tap(page,'shop-menu-toggle-mushroom');await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('ready');
  await page.reload();
  await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;overflow:hidden}#fixture{height:100%;width:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:bundle.outputFiles[0].text});
  await expect(canvas).toHaveAttribute('data-booted','true',{timeout:30000});
  await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('ready');
  await tap(page,'summary-tab-shop');await tap(page,'shop-section-menu');
  expect((await data(page,'customer-progress')).prices.cheese).toBe(price);
  expect((await data(page,'shop-screen-cards')).find((card:any)=>card.id==='mushroom').enabled).toBe(!sellingBefore);
});
