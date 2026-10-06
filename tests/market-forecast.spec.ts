import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

const data=(page:Page,key:string)=>page.locator('canvas').getAttribute('data-'+key).then(value=>JSON.parse(value||'null'));
async function tap(page:Page,id:string){
  await expect.poll(async()=>(await data(page,'controls')).some((c:any)=>c.id===id&&c.enabled)).toBe(true);
  const c=(await data(page,'controls')).find((c:any)=>c.id===id),b=(await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
}
async function fixture(page:Page,poor=false){
  const specifier:string='node:path';const paths=await import(specifier);
  const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';
    const runtime=new CozyRuntime(false,true);${poor?"runtime['stock'].spend(290);":"runtime.buy('dough',2,'prior-stock');"}
    const game=new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(runtime)]});Object.assign(window,{marketForecastFixture:{runtime,game}});
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:bundle.outputFiles[0].text});await expect(page.locator('canvas')).toHaveAttribute('data-screen','preparation-hub');await tap(page,'summary-tab-market');
}
test('suggestion subtracts stock, editable basket cancels and buys once without opening the shift',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));await fixture(page);
  const canvas=page.locator('canvas');await tap(page,'market-suggest');
  const forecast=await data(page,'market-forecast'),rows=await data(page,'market-rows');
  for(const row of forecast.rows)expect(rows.find((item:any)=>item.id===row.ingredient).quantity).toBe(row.missing);
  expect(rows.find((row:any)=>row.id==='dough')).toMatchObject({quantity:5,available:2});
  expect(rows.find((row:any)=>row.id==='sausage')).toMatchObject({unlocked:false,quantity:0,recipes:['sausage']});
  expect((await data(page,'controls')).find((c:any)=>c.id==='market-plus-sausage').enabled).toBe(false);
  await tap(page,'market-plus-dough');await tap(page,'market-minus-dough');
  await canvas.screenshot({path:info.outputPath('market-forecast.png')});
  const before=await page.evaluate(()=>(window as any).marketForecastFixture.runtime.exportCheckpoint());
  await tap(page,'market-buy-all');const quote=await data(page,'market-basket');
  await tap(page,'market-purchase-cancel');expect(await page.evaluate(()=>(window as any).marketForecastFixture.runtime.exportCheckpoint())).toEqual(before);
  await tap(page,'market-buy-all');const committedQuote=await data(page,'market-basket');await canvas.screenshot({path:info.outputPath('basket-confirm.png')});await tap(page,'market-purchase-confirm');
  await expect(canvas).toHaveAttribute('data-cash',String(before.stock.cash-quote.total));
  for(const row of quote.entries)expect(await page.evaluate(id=>(window as any).marketForecastFixture.runtime.available(id),row.ingredient)).toBe((forecast.rows.find((item:any)=>item.ingredient===row.ingredient)?.available??0)+row.quantity);
  expect(await page.evaluate(quote=>(window as any).marketForecastFixture.runtime.buyAll(quote.entries,quote.commandId,quote.day),committedQuote)).toBe(false);
  await expect(canvas).toHaveAttribute('data-screen','preparation-hub');expect(await data(page,'market-basket')).toBe(null);expect(errors).toEqual([]);
});
test('insufficient basket funds leaves all stock unchanged',async({page})=>{
  await fixture(page,true);await tap(page,'market-suggest');const before=await page.evaluate(()=>(window as any).marketForecastFixture.runtime['stock'].exportCheckpoint());
  await tap(page,'market-buy-all');expect((await data(page,'controls')).find((c:any)=>c.id==='market-purchase-confirm').enabled).toBe(false);
  await tap(page,'market-purchase-cancel');
  expect(await page.evaluate(()=>(window as any).marketForecastFixture.runtime['stock'].exportCheckpoint())).toEqual(before);
});
test('row Mua buys immediately without a dialog and ignores an accidental double tap',async({page})=>{
  await fixture(page);const canvas=page.locator('canvas');
  const control=(await data(page,'controls')).find((c:any)=>c.id==='market-buy-dough'),bounds=(await canvas.boundingBox())!;
  await page.mouse.dblclick(bounds.x+(control.x+control.width/2)*bounds.width/360,bounds.y+(control.y+control.height/2)*bounds.height/640);
  await expect(canvas).toHaveAttribute('data-cash','285');expect(await data(page,'market-purchase')).toBe(null);expect(await data(page,'market-basket')).toBe(null);
  expect(await page.evaluate(()=>(window as any).marketForecastFixture.runtime.available('dough'))).toBe(3);
  await expect(canvas).toHaveAttribute('data-paused','');await expect(canvas).toHaveAttribute('data-screen','preparation-hub');
});
test('confirmed recipe ownership opens Market immediately and after restore even when not selling',async({page})=>{
  await page.goto('/?mode=shop&perf=1');await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('ready');
  await tap(page,'summary-tab-market');expect((await data(page,'market-rows')).find((row:any)=>row.id==='sausage').unlocked).toBe(false);
  await tap(page,'summary-tab-shop');await tap(page,'shop-section-menu');await tap(page,'shop-recipe-buy-sausage');await tap(page,'recipe-buy-confirm');
  await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('ready');await tap(page,'summary-tab-market');
  expect((await data(page,'market-rows')).find((row:any)=>row.id==='sausage').unlocked).toBe(true);
  await page.evaluate(()=>{const r=(window as any).pizzaPerformance.game.scene.getScenes(true).find((scene:any)=>scene.runtime).runtime;r.configureMenu('sausage',100,false);});
  await expect.poll(async()=>(await data(page,'market-rows')).find((row:any)=>row.id==='sausage')?.unlocked).toBe(true);
  await tap(page,'market-suggest');expect((await data(page,'market-rows')).find((row:any)=>row.id==='sausage').quantity).toBe(0);
  await page.reload();await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('ready');await tap(page,'summary-tab-market');
  expect((await data(page,'market-rows')).find((row:any)=>row.id==='sausage').unlocked).toBe(true);
});
