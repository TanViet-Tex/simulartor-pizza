import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)??'null');}
async function tap(page:Page,id:string){
  await expect.poll(async()=>(await data(page,'controls'))?.some((c:any)=>c.id===id&&c.enabled)).toBe(true);
  const c=(await data(page,'controls')).find((c:any)=>c.id===id),b=(await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}
async function fixture(page:Page,poor=false){
  const pathSpecifier:string='node:path',paths:{resolve:(path:string)=>string}=await import(pathSpecifier);
  const bundled=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyRuntime} from './src/runtime/CozyRuntime';import {CozyScene} from './src/scenes/CozyScene';
    const r=new CozyRuntime(false,true,{schedule:day=>({day,duration:180,grace:120,slots:[{id:'first',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:false}]})});
    ${poor?"r.buy('mushroom',96);":''}r.openShop();
    new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(r)]});(window as any).expressRuntime=r;
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:bundled.outputFiles[0].text});await expect(page.locator('canvas')).toHaveAttribute('data-shop','making');
}
test('rush popup uses 5/10, exact total, 70% backdrop and delivers stock once',async({page},info)=>{
  await fixture(page);await tap(page,'dough');const canvas=page.locator('canvas');
  await expect.poll(async()=>(await data(page,'express-dialog'))?.quantity).toBe(5);
  expect((await data(page,'modal-backdrop')).alpha).toBe(.7);
  let dialog=await data(page,'express-dialog');expect(dialog.total).toBe(dialog.unitPrice*5);expect(dialog.bounds.height).toBeLessThan(380);
  const controls=await data(page,'controls');expect(controls.map((c:any)=>c.id)).toEqual(['express-quantity-5','express-quantity-10','express-close','express-confirm']);
  for(const control of controls){expect(control.width).toBeGreaterThanOrEqual(48);expect(control.height).toBeGreaterThanOrEqual(48);}
  const before=Number(await canvas.getAttribute('data-cash'));
  await page.touchscreen.tap(10,550);await expect(canvas).toHaveAttribute('data-cash',String(before));
  await tap(page,'express-quantity-10');await expect.poll(async()=>(await data(page,'express-dialog')).quantity).toBe(10);
  dialog=await data(page,'express-dialog');expect(dialog.total).toBe(dialog.unitPrice*10);
  await canvas.screenshot({path:info.outputPath('express-popup.png')});await tap(page,'express-confirm');
  await expect(canvas).toHaveAttribute('data-cash',String(before-dialog.total));
  await expect.poll(async()=>(await data(page,'express-orders'))?.length).toBe(1);
  const order=(await data(page,'express-orders'))[0];expect(order.quantity).toBe(10);expect(order.unitPrice).toBe(dialog.unitPrice);
  const results=await page.evaluate(()=>{const r=(window as any).expressRuntime,o=r.expressOrders[0],lease=r.acquirePause('user'),initialRemaining=r.expressOrders[0].remaining;const duplicate=r.dispatch({type:'express.order',ingredient:o.ingredient,quantity:o.quantity,commandId:o.id});r.advanceElapsed(10000);const remaining=r.expressOrders[0].remaining;lease.release();r.advanceElapsed(5000);return {duplicate,frozen:remaining===initialRemaining,owned:r.owned('dough'),pending:r.expressOrders.length,cash:r.state.cash};});
  expect(results).toEqual({duplicate:false,frozen:true,owned:10,pending:0,cash:before-dialog.total});
});
test('insufficient cash locks ordering and cancel leaves stock and money unchanged',async({page},info)=>{
  await fixture(page,true);await tap(page,'dough');const canvas=page.locator('canvas');
  await expect.poll(async()=>(await data(page,'express-dialog'))?.missing).toBeGreaterThan(0);
  const controls=await data(page,'controls'),confirm=controls.find((c:any)=>c.id==='express-confirm');expect(confirm.enabled).toBe(false);
  await canvas.screenshot({path:info.outputPath('express-insufficient.png')});
  const b=(await canvas.boundingBox())!;await page.touchscreen.tap(b.x+(confirm.x+confirm.width/2)*b.width/360,b.y+(confirm.y+confirm.height/2)*b.height/640);
  await expect(canvas).toHaveAttribute('data-cash','20');expect(await data(page,'express-orders')).toEqual([]);
  await tap(page,'express-close');await expect(canvas).not.toHaveAttribute('data-paused',/order/);await expect(canvas).toHaveAttribute('data-cash','20');
});
test('rush popup remains inside the viewport with enlarged text',async({page})=>{
  await fixture(page);await page.evaluate(()=>{document.documentElement.style.fontSize='32px';});await tap(page,'dough');
  await expect.poll(async()=>(await data(page,'express-dialog'))?.quantity).toBe(5);
  const bounds=(await data(page,'express-dialog')).bounds;expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(640);
  const labels=await data(page,'labels');for(const label of labels.filter((t:any)=>t.y>=bounds.y&&t.x>=bounds.x&&t.x<=bounds.x+bounds.width)){expect(label.y+label.height).toBeLessThanOrEqual(640);}
  await tap(page,'express-close');
});
