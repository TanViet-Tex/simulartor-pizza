import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';
import {fundedShopCheckpoint} from '../src/runtime/shopTestFixture';

test.setTimeout(120_000);
let bundleCode:string|undefined;

async function read(page:Page,key:string){return page.locator('canvas').getAttribute('data-'+key).then(value=>JSON.parse(value||'null'));}
async function settle(page:Page){await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));}
async function tap(page:Page,id:string){
  await expect.poll(async()=>(await read(page,'controls')).some((c:any)=>c.id===id&&c.enabled)).toBe(true);
  const c=(await read(page,'controls')).find((c:any)=>c.id===id),b=(await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);await settle(page);
}
async function advance(page:Page,seconds:number){await page.evaluate(seconds=>(window as any).mixedFixture.runtime.advanceElapsed(seconds*1000),seconds);await settle(page);}
async function cash(page:Page){return page.evaluate(()=>(window as any).mixedFixture.runtime.state.cash);}
async function fixture(page:Page,app=false){
  const bootErrors:string[]=[];page.on('pageerror',error=>bootErrors.push(error.message));
  const specifier:string='node:path',paths=await import(specifier);
  if(!bundleCode){const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';import {PlayLifecycle} from './src/runtime/PlayLifecycle';
    const app=Boolean(window.mixedApp);const items=[{recipe:'cheese',price:50,finishingSauces:['sauce-white']},{recipe:'mushroom',price:55,finishingSauces:['sauce-pesto']},...(app?[{recipe:'sausage',price:65,finishingSauces:['sauce-hot']}]:[])];
    const runtime=CozyRuntime.restoreCheckpoint(window.mixedCheckpoint,false,{eventRoll:()=>1,vipRoll:()=>1,schedule:day=>({day,duration:300,grace:120,slots:[{id:'mixed',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:!app,...(app?{source:'app',quantity:3}:{})}]}),resolveRecipe:()=> 'cheese',resolveItems:()=>structuredClone(items)});
    runtime.configureMenu('mushroom',100,true);if(app){runtime.buyRecipe('sausage','mixed-sausage');runtime.configureMenu('sausage',100,true);runtime.configureDeliveryApp(true,'mixed-app');}
    for(const id of ['dough','sauce','cheese','mushroom','sausage','sauce-white','sauce-pesto','sauce-hot'])if(id!=='sausage'||app)if(!runtime.buy(id,6))throw Error('fixture purchase failed '+id);
    runtime.openShop();const lifecycle=new PlayLifecycle(runtime,()=>0);lifecycle.frame=()=>lifecycle.reconcile();
    const scene=new CozyScene(runtime,undefined,undefined,undefined,lifecycle);const game=new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[scene]});Object.assign(window,{mixedFixture:{runtime,scene,game}});
  `},bundle:true,platform:'browser',format:'iife',define:{'import.meta.env.BASE_URL':'"/"'},write:false});bundleCode=bundle.outputFiles[0].text;}
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.evaluate(({app,checkpoint})=>Object.assign(window,{mixedApp:app,mixedCheckpoint:checkpoint}),{app,checkpoint:fundedShopCheckpoint(22000)});
  await page.addScriptTag({content:bundleCode});
  try{await expect(page.locator('canvas')).toHaveAttribute('data-booted','true',{timeout:30_000});}catch(error){throw new Error(`Scene boot failed: ${bootErrors.join('; ')}\n${error}`);}
  await settle(page);
}
async function make(page:Page,recipe:string,sauce:string){
  for(const id of ['dough','sauce','cheese',...(recipe==='cheese'?[]:[recipe])])await tap(page,id);
  await tap(page,'bake');const timing=await read(page,'bake-timing');await advance(page,timing.perfectStart);await tap(page,'extract');await tap(page,sauce);await tap(page,'box');
}

test('counter mixed order advances after boxing and pays once after every pizza is ready',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page);
  const before=await cash(page),ticket=(await read(page,'tickets'))[0];expect(ticket.quantity).toBe(2);expect(ticket.requestedSauces).toEqual(['sauce-white']);
  await tap(page,'ticket-'+ticket.id);await tap(page,'order');await page.locator('canvas').screenshot({path:info.outputPath('mixed-order-detail.png')});await tap(page,'close-order');await make(page,'cheese','sauce-white');
  const next=(await read(page,'tickets'))[0];expect(next).toMatchObject({id:ticket.id,recipe:'mushroom',packed:1,quantity:2,itemIndex:1,stage:'assembly'});expect(next.requestedSauces).toEqual(['sauce-pesto']);expect(await cash(page)).toBe(before);
  expect((await read(page,'controls')).find((c:any)=>c.id==='deliver')?.enabled).toBe(false);
  await page.locator('canvas').screenshot({path:info.outputPath('second-pizza-order.png')});
  await make(page,'mushroom','sauce-pesto');expect(await cash(page)).toBe(before);expect((await read(page,'tickets'))[0].packed).toBe(2);
  await tap(page,'deliver');expect(await read(page,'tickets')).toEqual([]);expect((await read(page,'result')).stars).toBe(5);
  const received=await cash(page);expect(received).toBeGreaterThanOrEqual(before+ticket.totalPrice);
  expect(await page.evaluate(()=>(window as any).mixedFixture.runtime.dispatch({type:'deliver'}))).toBe(false);expect(await cash(page)).toBe(received);expect(errors).toEqual([]);
});

test('app accepts three different pizzas and sends the complete boxed order together',async({page},info)=>{
  await fixture(page,true);const before=await cash(page),ticket=(await read(page,'tickets'))[0];expect(ticket.items.map((i:any)=>i.recipe)).toEqual(['cheese','mushroom','sausage']);
  await tap(page,'ticket-'+ticket.id);await tap(page,'order');await page.locator('canvas').screenshot({path:info.outputPath('three-pizza-app-detail.png')});await tap(page,'close-order');await tap(page,'app-book-shipper');await tap(page,'delivery-app-confirm');
  for(const [recipe,sauce] of [['cheese','sauce-white'],['mushroom','sauce-pesto'],['sausage','sauce-hot']])await make(page,recipe,sauce);
  expect(await cash(page)).toBe(before);expect((await read(page,'tickets'))[0].packed).toBe(3);await advance(page,20);await tap(page,'deliver');
  expect(await read(page,'tickets')).toEqual([]);await advance(page,60);const result=await read(page,'result');expect(result.price).toBe(ticket.totalPrice);expect(result.stars).toBe(5);
  const received=await cash(page);expect(received).toBeGreaterThanOrEqual(before+ticket.totalPrice-5);await advance(page,5);expect(await cash(page)).toBe(received);
  expect(await page.evaluate(()=>{const r=(window as any).mixedFixture.runtime;r.closeDay();return r.daySummary.deliveryFees;})).toBe(5);
});
