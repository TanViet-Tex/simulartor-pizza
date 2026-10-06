import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

const read=(page:Page,key:string)=>page.locator('canvas').getAttribute('data-'+key).then(value=>key==='finishing-sauces'?(value?value.split(','):[]):JSON.parse(value||'null'));
async function settle(page:Page){await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));}
async function tap(page:Page,id:string){
  await expect.poll(async()=>(await read(page,'controls')).some((c:any)=>c.id===id&&c.enabled)).toBe(true);
  const c=(await read(page,'controls')).find((c:any)=>c.id===id),b=(await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);await settle(page);
}
async function fixture(page:Page,level=0,preparation=false){
  const specifier:string='node:path',paths=await import(specifier);
  const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';import {PlayLifecycle} from './src/runtime/PlayLifecycle';
    const runtime=new CozyRuntime(false,true,{schedule:day=>({day,duration:300,grace:120,slots:[0,1].map((at,i)=>({id:'finishing-'+i,at,kind:'regular',opportunity:'commercial',commercialOrdinal:i+1,takeaway:true}))}),resolveRecipe:()=> 'cheese'});
    runtime.claimTestCode('VIETVUIVE');for(let i=0;i<${level};i++)runtime.upgradeShop('oven','finishing-upgrade-'+i);
    for(const id of ['dough','sauce','cheese','sauce-white','sauce-pesto','sauce-hot'])if(!runtime.buy(id,3))throw Error('fixture purchase failed '+id);
    ${preparation?'':'runtime.openShop();'}
    const lifecycle=new PlayLifecycle(runtime,()=>0);lifecycle.frame=()=>lifecycle.reconcile();
    const scene=new CozyScene(runtime,undefined,undefined,undefined,lifecycle);
    const game=new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[scene]});Object.assign(window,{finishingFixture:{runtime,scene,game}});
  `},bundle:true,platform:'browser',format:'iife',define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:bundle.outputFiles[0].text});await expect(page.locator('canvas')).toHaveAttribute('data-booted','true');await settle(page);
}
async function advance(page:Page,seconds:number){await page.evaluate(seconds=>(window as any).finishingFixture.runtime.advanceElapsed(seconds*1000),seconds);await settle(page);}
const crop=(page:Page,region:{x:number;y:number;width:number;height:number})=>page.screenshot({clip:region});

for(const level of [0,1,2])test(`oven ${level+1} renders actual bake progress and freezes extracted pizza with optional sauces`,async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page,level);
  const canvas=page.locator('canvas');
  expect((await read(page,'controls')).find((c:any)=>c.id==='sauce-white').enabled).toBe(false);
  for(const id of ['dough','sauce','cheese'])await tap(page,id);
  expect(await read(page,'needed-ingredients')).toEqual([]);
  await canvas.screenshot({path:info.outputPath('raw.png')});await tap(page,'bake');
  const ovenRegion={x:273,y:314,width:40,height:26},raw=await crop(page,ovenRegion);
  const timing=await read(page,'bake-timing');await advance(page,timing.perfectStart/2);
  const half=await crop(page,ovenRegion);expect(half.equals(raw)).toBe(false);
  await advance(page,timing.perfectStart/2);const ready=await crop(page,ovenRegion);expect(ready.equals(half)).toBe(false);
  await tap(page,'extract');await expect(canvas).toHaveAttribute('data-stage','ready');
  const boardRegion={x:70,y:296,width:104,height:95};const before=await crop(page,boardRegion);
  await advance(page,1);expect((await crop(page,boardRegion)).equals(before)).toBe(true);
  for(const id of ['sauce-white','sauce-pesto','sauce-hot'])await tap(page,id);
  expect(await read(page,'finishing-sauces')).toEqual(['sauce-white','sauce-pesto','sauce-hot']);
  expect(await canvas.getAttribute('data-ingredients')).toBe('dough,sauce,cheese');
  for(const id of ['sauce-white','sauce-pesto','sauce-hot']){
    expect((await read(page,'stock')).find((s:any)=>s.id===id).owned).toBe(2);
    expect(await page.evaluate(id=>(window as any).finishingFixture.runtime.dispatch({type:'ingredient',ingredient:id}),id)).toBe(false);
  }
  const drizzled=await crop(page,boardRegion);expect(drizzled.equals(before)).toBe(false);
  await canvas.screenshot({path:info.outputPath('cooked-with-sauces.png')});
  const identity=await canvas.getAttribute('data-selected-ticket');const tickets=await read(page,'tickets');
  const other=tickets.find((t:any)=>t.id!==identity);if(other){await tap(page,'ticket-'+other.id);expect(await read(page,'finishing-sauces')).toEqual([]);await tap(page,'ticket-'+identity);expect(await read(page,'finishing-sauces')).toHaveLength(3);}
  await tap(page,'box');expect((await read(page,'controls')).find((c:any)=>c.id==='sauce-hot').enabled).toBe(false);
  await tap(page,'deliver');expect((await read(page,'result')).stars).toBe(5);expect((await read(page,'result')).reasons).not.toContain('Sai công thức');expect(errors).toEqual([]);
});

test('burnt pizza can be extracted and keeps dark layers beneath bright finishing sauces',async({page},info)=>{
  await fixture(page);for(const id of ['dough','sauce','cheese'])await tap(page,id);await tap(page,'bake');
  await advance(page,10);await expect(page.locator('canvas')).toHaveAttribute('data-stage','burnt');
  expect((await read(page,'controls')).find((c:any)=>c.id==='sauce-pesto').enabled).toBe(false);
  await tap(page,'extract');expect(await read(page,'extracted')).toBe(true);
  for(const id of ['sauce-white','sauce-pesto','sauce-hot'])await tap(page,id);
  await page.locator('canvas').screenshot({path:info.outputPath('burnt-with-sauces.png')});
  const region={x:70,y:296,width:104,height:95},before=await crop(page,region),seconds=await page.evaluate(()=>(window as any).finishingFixture.runtime.state.ovenSeconds);
  expect(seconds).toBeGreaterThan(8);await advance(page,3);expect((await crop(page,region)).equals(before)).toBe(true);
  expect(await page.evaluate(()=>(window as any).finishingFixture.runtime.state.ovenSeconds)).toBe(seconds);
});

test('Market immediately unlocks finishing sauces and Stock labels all sauces without expiry',async({page},info)=>{
  await fixture(page,0,true);await tap(page,'summary-tab-market');await tap(page,'market-filter-sauce');
  const rows=await read(page,'market-rows');expect(rows).toHaveLength(5);
  for(const id of ['sauce-white','sauce-pesto','sauce-hot'])expect(rows.find((r:any)=>r.id===id).unlocked).toBe(true);
  expect(rows.find((r:any)=>r.id==='sauce-bbq').unlocked).toBe(false);
  await page.locator('canvas').screenshot({path:info.outputPath('market-sauces.png')});
  await tap(page,'market-buy-sauce-white');expect((await read(page,'market-rows')).find((r:any)=>r.id==='sauce-white').available).toBe(4);
  await tap(page,'summary-tab-stock');await tap(page,'stock-item-sauce');
  expect((await read(page,'hub-detail')).body).toContain('Không hết hạn');expect((await read(page,'hub-detail')).body).not.toContain('1000001');
  await page.locator('canvas').screenshot({path:info.outputPath('stock-sauce-lots.png')});
});
