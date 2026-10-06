import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';
import {fundedShopCheckpoint} from '../src/runtime/shopTestFixture';

test.setTimeout(120_000);
let bundleCode:string|undefined;
async function read(page:Page,key:string){return page.locator('canvas').getAttribute('data-'+key).then(value=>JSON.parse(value||'null'));}
async function settle(page:Page){await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));}
async function tap(page:Page,id:string){
  const controls=await read(page,'controls'),c=controls.find((c:any)=>c.id===id);
  expect(c?.enabled,`${id} enabled`).toBe(true);
  const b=(await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);await settle(page);
}
async function advance(page:Page,seconds:number){await page.evaluate(seconds=>(window as any).bench.runtime.advanceElapsed(seconds*1000),seconds);await settle(page);}
async function snapshot(page:Page){return page.evaluate(()=>{const r=(window as any).bench.runtime;return {owner:r.productionOwnerId,board:r.workbenchState,tickets:r.tickets};});}
async function fixture(page:Page,staff=false){
  const specifier:string='node:path',paths=await import(specifier);
  if(!bundleCode){const b=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';import {PlayLifecycle} from './src/runtime/PlayLifecycle';
    const runtime=CozyRuntime.restoreCheckpoint(window.benchCheckpoint,false,{eventRoll:()=>1,vipRoll:()=>1,schedule:day=>({day,duration:300,grace:120,slots:[0,1].map(i=>({id:'bench-'+i,at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:i+1,takeaway:true}))}),resolveRecipe:()=> 'cheese'});
    runtime.configureMenu('mushroom',100,false);for(const id of ['dough','sauce','cheese'])runtime.buy(id,4);if(window.benchStaff){runtime.hireStaff('prep','prep');runtime.hireStaff('oven','oven');}
    runtime.openShop();const lifecycle=new PlayLifecycle(runtime,()=>0);lifecycle.frame=()=>lifecycle.reconcile();const scene=new CozyScene(runtime,undefined,undefined,undefined,lifecycle);
    const game=new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[scene]});Object.assign(window,{bench:{runtime,scene,game}});
  `},bundle:true,platform:'browser',format:'iife',define:{'import.meta.env.BASE_URL':'"/"'},write:false});bundleCode=b.outputFiles[0].text;}
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.evaluate(({checkpoint,staff})=>Object.assign(window,{benchCheckpoint:checkpoint,benchStaff:staff}),{checkpoint:fundedShopCheckpoint(22000),staff});
  await page.addScriptTag({content:bundleCode});await expect(page.locator('canvas')).toHaveAttribute('data-booted','true',{timeout:30_000});await settle(page);
}

test('ingredients need dough; boxed order blocks next customer until delivery',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page);
  const tickets=await read(page,'tickets'),a=tickets[0].id,b=tickets[1].id;await tap(page,'ticket-'+a);
  expect((await read(page,'controls')).find((c:any)=>c.id==='cheese').enabled).toBe(false);
  expect(await page.evaluate(()=>(window as any).bench.runtime.dispatch({type:'ingredient',ingredient:'cheese'}))).toBe(false);
  for(const id of ['dough','sauce','cheese'])await tap(page,id);
  await tap(page,'dough');expect((await snapshot(page)).board?.ingredients??[]).toEqual([]);
  for(const id of ['dough','sauce','cheese'])await tap(page,id);await tap(page,'bake');
  await tap(page,'ticket-'+b);expect((await read(page,'controls')).find((c:any)=>c.id==='dough').enabled).toBe(false);
  await advance(page,(await read(page,'bake-timing')).perfectStart);await tap(page,'extract');await tap(page,'box');
  await tap(page,'ticket-'+b);expect((await snapshot(page)).owner).toBe(a);
  expect((await read(page,'controls')).find((c:any)=>c.id==='dough').enabled).toBe(false);
  expect(await page.evaluate(()=>(window as any).bench.runtime.dispatch({type:'ingredient',ingredient:'dough'}))).toBe(false);
  await page.locator('canvas').screenshot({path:info.outputPath('boxed-owner-awaits-delivery.png')});
  await tap(page,'ticket-'+a);await tap(page,'deliver');await tap(page,'ticket-'+b);await tap(page,'dough');
  expect((await snapshot(page)).owner).toBe(b);expect((await snapshot(page)).board?.ingredients).toEqual(['dough']);
  await page.locator('canvas').screenshot({path:info.outputPath('next-order-after-delivery.png')});expect(errors).toEqual([]);
});

test('staff shows the actual workbench and waits for boxed order handoff',async({page},info)=>{
  await fixture(page,true);const tickets=await read(page,'tickets'),a=tickets[0].id,b=tickets[1].id;
  await tap(page,'ticket-'+b);await advance(page,1);
  expect((await snapshot(page)).owner).toBe(a);expect((await snapshot(page)).board?.ingredients).toEqual(['dough']);
  expect((await read(page,'controls')).find((c:any)=>c.id==='dough').enabled).toBe(false);
  await page.locator('canvas').screenshot({path:info.outputPath('staff-owner-while-inspecting-other.png')});
  await advance(page,10);await tap(page,'ticket-'+a);await tap(page,'box');await tap(page,'ticket-'+b);await advance(page,5);
  expect((await snapshot(page)).board?.stage).toBe('boxed');
  expect(await page.evaluate(()=>(window as any).bench.runtime.ovenOwner)).toBeNull();
  expect((await snapshot(page)).tickets.find((t:any)=>t.id===b).stage).toBe('assembly');
  await tap(page,'ticket-'+a);await tap(page,'deliver');await advance(page,1);
  expect((await snapshot(page)).owner).toBe(b);expect((await snapshot(page)).board?.ingredients).toEqual(['dough']);
});
