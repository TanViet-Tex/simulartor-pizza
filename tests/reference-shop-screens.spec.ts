import {scrollCanvasList} from './helpers/listGestures';
import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';
import {fundedShopCheckpoint} from '../src/runtime/shopTestFixture';

test.setTimeout(120000);
type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
let bundleCode:string;
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)||'null');}
async function settle(page:Page){await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));}
async function ready(page:Page){await expect(page.locator('canvas')).toHaveAttribute('data-screen',/^(preparation-hub|day-summary|day-ended-notice|game)$/,{timeout:30000});await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('ready');await settle(page);}
async function tap(page:Page,id:string){
  await expect.poll(async()=>((await data(page,'controls'))||[]).some((c:Control)=>c.id===id&&c.enabled)).toBe(true);
  const c:Control=(await data(page,'controls')).find((c:Control)=>c.id===id),b=(await page.locator('canvas').boundingBox())!;
  expect(c.x).toBeGreaterThanOrEqual(0);expect(c.y).toBeGreaterThanOrEqual(0);
  expect(c.x+c.width).toBeLessThanOrEqual(360);expect(c.y+c.height).toBeLessThanOrEqual(640);
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);await settle(page);
}
async function scroll(page:Page,dy:number){
  await scrollCanvasList(page,180,390,dy);await settle(page);
}
async function fixture(page:Page,funded=true){
  if(!bundleCode){
    const name:string='node:path',paths=await import(name);
    const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
      import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyCampaignSession} from './src/runtime/CozyCampaignSession';import {CozySaveRepository} from './src/infrastructure/CozySaveRepository';
      (async()=>{const repo=new CozySaveRepository(),loaded=await repo.load();
      if(window.shopCheckpoint){const result=await repo.commit({campaignId:'shop-screens',commitId:'earned',sourceRevision:0,replacementToken:loaded.replacementToken,payload:window.shopCheckpoint});if(!result.ok)throw Error(result.message);}
      const session=new CozyCampaignSession(repo);let runtime=await session.load();if(!runtime)runtime=await session.start(false);
      const scene=new CozyScene(runtime,undefined,undefined,undefined,session.lifecycle,session);
      const game=new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[scene]});window.shopFixture={runtime,session,scene,game};})();
    `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});bundleCode=bundle.outputFiles[0].text;
  }
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;overflow:hidden}#fixture{height:100%;width:100%}</style><div id="fixture"></div>');
  await page.evaluate(checkpoint=>Object.assign(window,{shopCheckpoint:checkpoint}),funded?fundedShopCheckpoint(26000):null);
  await page.addScriptTag({content:bundleCode});await expect(page.locator('canvas')).toHaveAttribute('data-booted','true',{timeout:30000});await ready(page);
  await tap(page,'summary-tab-shop');
}
async function open(page:Page,section:string){await tap(page,'shop-section-'+section);await expect(page.locator('canvas')).toHaveAttribute('data-shop-page',section);}
async function restoreProduction(page:Page){await page.unroute('**/assets/index-*.js');await page.goto('/?mode=shop');await ready(page);}

test('polished management market and stock keep real purchases filters and fixed shell',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page);
  const canvas=page.locator('canvas');
  await canvas.screenshot({path:info.outputPath('polished-management.png')});
  const shell=(await data(page,'controls')).filter((c:Control)=>c.id.startsWith('summary-tab-')||c.id==='pause');
  expect((await data(page,'controls')).filter((c:Control)=>c.id.startsWith('shop-section-'))).toHaveLength(7);
  await tap(page,'summary-tab-market');
  await canvas.screenshot({path:info.outputPath('polished-market.png')});
  await tap(page,'market-filter-base');
  expect((await data(page,'market-rows')).map((r:any)=>r.id).sort()).toEqual(['cheese','dough']);
  const beforeCash=Number(await canvas.getAttribute('data-cash'));
  const before=(await data(page,'market-rows')).find((r:any)=>r.id==='dough');
  await tap(page,'market-plus-dough');
  const purchase=(await data(page,'market-rows')).find((r:any)=>r.id==='dough');
  await tap(page,'market-buy-dough');await ready(page);
  await expect(canvas).toHaveAttribute('data-cash',String(beforeCash-purchase.total));
  expect((await data(page,'market-rows')).find((r:any)=>r.id==='dough').available).toBe(before.available+purchase.quantity);
  await tap(page,'market-filter-all');await scroll(page,10000);
  await expect.poll(async()=>(await data(page,'market-scroll')).offset).toBeGreaterThan(0);
  await tap(page,'summary-tab-stock');
  await canvas.screenshot({path:info.outputPath('polished-stock.png')});
  const cash=await canvas.getAttribute('data-cash');
  const stock=(await data(page,'stock-rows')).find((r:any)=>r.id==='dough');
  expect(stock.usable).toBe(before.available+purchase.quantity);
  await tap(page,'stock-item-dough');expect(await data(page,'hub-detail')).not.toBeNull();await tap(page,'hub-detail-close');
  await tap(page,'stock-filter-low');
  const threshold=page.getByRole('textbox',{name:'Ngưỡng sắp hết'});
  await threshold.fill('1');await threshold.press('Enter');
  await expect.poll(async()=>(await data(page,'stock-rows')).every((r:any)=>r.usable<=1)).toBe(true);
  await tap(page,'stock-filter-all');await scroll(page,10000);
  await expect.poll(async()=>(await data(page,'stock-scroll')).offset).toBeGreaterThan(0);
  expect((await data(page,'controls')).filter((c:Control)=>c.id.startsWith('summary-tab-')||c.id==='pause')).toEqual(shell);
  await expect(canvas).toHaveAttribute('data-cash',cash!);
  await tap(page,'summary-stock-market');await expect(canvas).toHaveAttribute('data-summary-tab','market');
  expect(page.context().pages()).toHaveLength(1);expect(errors).toEqual([]);
});

test('market sauce labels match all five kitchen bottles and current economy',async({page},info)=>{
  await fixture(page,false);const canvas=page.locator('canvas');
  expect((await data(page,'customer-progress')).prices.cheese).toBe(60);
  await tap(page,'summary-tab-market');await tap(page,'market-filter-sauce');
  expect((await data(page,'market-rows')).find((r:any)=>r.id==='sauce').unitPrice).toBe(4);
  const frames=await page.evaluate(()=>{
    const texture=(window as any).shopFixture.game.textures.get('market-sauces-labeled');
    return ['sauce','sauce-white','sauce-bbq','sauce-pesto','sauce-hot'].map(id=>({id,exists:texture.has('label-'+id),frame:texture.get('label-'+id).cutX}));
  });
  expect(frames.every(frame=>frame.exists)).toBe(true);expect(new Set(frames.map(frame=>frame.frame)).size).toBe(5);
  await canvas.screenshot({path:info.outputPath('market-labeled-sauces.png')});
  await tap(page,'market-buy-sauce');await tap(page,'market-filter-base');
  await tap(page,'market-buy-dough');await tap(page,'market-buy-cheese');
  await tap(page,'summary-open-first-day');await expect(canvas).toHaveAttribute('data-screen','game');
  const labels=(await data(page,'kitchen-art')).filter((entry:any)=>entry.key==='market-sauces-labeled');
  expect(labels.map((entry:any)=>entry.frame).sort()).toEqual(frames.map(frame=>'label-'+frame.id).sort());
  await canvas.screenshot({path:info.outputPath('kitchen-labeled-sauces.png')});
});

test('all six illustrated pages have fixed shell, scroll and independent navigation',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page);
  const liveResources=()=>page.evaluate(()=>{const f=(window as any).shopFixture;return {textures:Object.keys(f.game.textures.list).filter(key=>key.startsWith('shop-')).length,handlers:['pointerdown','pointermove','pointerup','wheel'].map(name=>f.scene.input.listenerCount(name))};});
  const initial=await liveResources();
  for(const section of ['menu','expansion','equipment','amenities','decoration','staff']){
    await open(page,section);
    expect((await data(page,'controls')).filter((c:Control)=>c.id.startsWith('summary-tab-'))).toHaveLength(5);
    expect(await page.evaluate(()=>{const layer=(window as any).shopFixture.scene.hubLayer;return {x:layer.x,y:layer.y,scale:layer.scaleX};})).toEqual({x:21.6,y:21.6,scale:.88});
    expect((await data(page,'shop-screen')).viewport.y).toBe(['decoration','staff'].includes(section)?174:130);
    const art=(await data(page,'shop-screen-art'))||[];
    if(section==='menu'){
      const pizzas=art.filter((entry:any)=>entry.id.startsWith('recipe-'));
      expect(pizzas).toHaveLength(8);expect(new Set(pizzas.map((entry:any)=>JSON.stringify(entry.source))).size).toBe(8);
    }
    if(section==='staff')expect(art.filter((entry:any)=>entry.key==='reference-shop-staff')).toHaveLength(4);
    await page.locator('canvas').screenshot({path:info.outputPath('shop-'+section+'.png')});
    expect((await data(page,'controls')).some((c:Control)=>c.id==='shop-back')).toBe(false);
    const before=(await data(page,'controls')).find((c:Control)=>c.id==='shop-screen-back');
    expect(before?.enabled).toBe(true);
    await scroll(page,200);
    expect((await data(page,'controls')).find((c:Control)=>c.id==='shop-screen-back')).toEqual(before);
    await page.locator('canvas').screenshot({path:info.outputPath('shop-'+section+'-scrolled.png')});
    if(section==='menu'){
      await tap(page,'summary-tab-shop');await expect(page.locator('canvas')).toHaveAttribute('data-shop-page','home');
      await open(page,section);
    }
    await tap(page,'shop-screen-back');await expect(page.locator('canvas')).toHaveAttribute('data-shop-page','home');
  }
  expect(await liveResources()).toEqual(initial);
  expect(page.context().pages()).toHaveLength(1);expect(errors).toEqual([]);
});

test('menu price and selling changes persist with actual profit and recipe ownership',async({page})=>{
  await fixture(page);await open(page,'menu');
  const before=await page.evaluate(()=>(window as any).shopFixture.runtime.customerProgress.prices.cheese);
  await tap(page,'shop-menu-plus-cheese');await ready(page);
  expect(await page.evaluate(()=>(window as any).shopFixture.runtime.customerProgress.prices.cheese)).toBeGreaterThan(before);
  const cheese=(await data(page,'shop-screen-cards')).find((card:any)=>card.id==='cheese');
  expect(cheese.selected).toBe(true);expect(cheese.price-cheese.cost).toBeGreaterThan(0);
  await tap(page,'shop-menu-minus-cheese');await ready(page);
  await tap(page,'shop-menu-toggle-mushroom');await ready(page);
  await tap(page,'shop-menu-select-mushroom');
  expect((await data(page,'shop-screen-cards')).find((card:any)=>card.id==='mushroom').selected).toBe(true);
  await tap(page,'shop-menu-toggle-cheese');await ready(page);
  expect(await page.evaluate(()=>(window as any).shopFixture.runtime.menuRecipes.includes('cheese'))).toBe(false);
  await restoreProduction(page);await tap(page,'summary-tab-shop');await open(page,'menu');
  expect((await data(page,'customer-progress')).prices.cheese).toBe(before);
  await tap(page,'shop-menu-toggle-cheese');await ready(page);
});

test('item purchase place store, upgrades and hiring retain real accounting across reload',async({page},info)=>{
  await page.addInitScript(()=>{const paint=CanvasRenderingContext2D.prototype.fillText;const labels:string[]=[];Object.assign(window,{ownedLabelColors:labels});CanvasRenderingContext2D.prototype.fillText=function(text,x,y,maxWidth){if(text==='Đã sở hữu')labels.push(String(this.fillStyle));if(maxWidth===undefined)paint.call(this,text,x,y);else paint.call(this,text,x,y,maxWidth);};});
  await fixture(page);const starting=Number(await page.locator('canvas').getAttribute('data-cash'));
  await open(page,'decoration');await tap(page,'shop-decoration-tab-owned');
  expect((await data(page,'controls')).filter((c:Control)=>c.id.startsWith('shop-item-'))).toHaveLength(0);
  await tap(page,'shop-decoration-tab-store');await tap(page,'shop-item-table-plant');await tap(page,'shop-item-confirm');await ready(page);
  expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(starting-500);
  expect(await page.evaluate(()=>(window as any).ownedLabelColors)).toContain('#247339');
  await page.locator('canvas').screenshot({path:info.outputPath('shop-decoration-owned-green.png')});
  await tap(page,'shop-item-table-plant');await tap(page,'shop-item-confirm');await tap(page,'shop-item-confirm');await ready(page);
  expect((await data(page,'shop-items')).effects.visitors).toBe(.03);
  await tap(page,'shop-item-table-plant');await tap(page,'shop-item-confirm');await tap(page,'shop-item-confirm');await ready(page);
  expect((await data(page,'shop-items')).effects.visitors).toBe(0);
  await tap(page,'shop-screen-back');await open(page,'equipment');
  await tap(page,'summary-upgrade-oven');await tap(page,'hub-upgrade-confirm');await ready(page);
  await tap(page,'shop-fridge-buy');await tap(page,'fridge-confirm');await ready(page);
  expect(await page.evaluate(()=>(window as any).ownedLabelColors)).toContain('#247339');
  await page.locator('canvas').screenshot({path:info.outputPath('shop-equipment-owned-green.png')});
  await tap(page,'shop-screen-back');await open(page,'expansion');
  await tap(page,'summary-upgrade-queue');await tap(page,'hub-upgrade-confirm');await ready(page);expect(await data(page,'queue-capacity')).toBe(5);
  await scroll(page,250);
  await tap(page,'summary-upgrade-queue');await tap(page,'hub-upgrade-confirm');await ready(page);expect(await data(page,'queue-capacity')).toBe(6);
  await tap(page,'shop-screen-back');await open(page,'staff');await tap(page,'shop-staff-prep');await tap(page,'staff-hire-confirm');await ready(page);
  await expect.poll(async()=>(await data(page,'staff-state'))?.acquired.length).toBe(1);
  await tap(page,'shop-staff-prep');expect(await data(page,'staff-hire')).toMatchObject({owned:true,remainingDays:10,dailyWage:0});await tap(page,'staff-hire-cancel');
  await tap(page,'shop-staff-tab-working');
  expect((await data(page,'controls')).filter((c:Control)=>c.id.startsWith('shop-staff-')&&!c.id.startsWith('shop-staff-tab-')).map((c:Control)=>c.id)).toEqual(['shop-staff-prep']);
  await page.locator('canvas').screenshot({path:info.outputPath('shop-staff-working.png')});
  expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(starting-23500);
  await restoreProduction(page);await tap(page,'summary-tab-shop');await open(page,'staff');expect(await data(page,'queue-capacity')).toBe(6);expect((await data(page,'staff-state')).acquired).toHaveLength(1);
  expect((await data(page,'shop-items')).acquired[0].placedSlot).toBeNull();
  await tap(page,'shop-staff-prep');expect(await data(page,'staff-hire')).toMatchObject({owned:true,remainingDays:10,dailyWage:0});await tap(page,'staff-hire-cancel');await page.locator('canvas').screenshot({path:info.outputPath('shop-staff-hired.png')});
});

test('unaffordable staff and equipment remain honest; drag does not open a card',async({page},info)=>{
  await fixture(page,false);await open(page,'staff');await tap(page,'shop-staff-prep');
  expect((await data(page,'staff-hire')).available).toBe(true);expect((await data(page,'staff-hire')).missing).toBe(1500);
  expect((await data(page,'controls')).find((c:Control)=>c.id==='staff-hire-confirm').enabled).toBe(false);
  await tap(page,'staff-hire-cancel');await tap(page,'shop-staff-tab-working');
  expect((await data(page,'controls')).filter((c:Control)=>c.id.startsWith('shop-staff-')&&!c.id.startsWith('shop-staff-tab-'))).toHaveLength(0);
  await tap(page,'shop-screen-back');await open(page,'equipment');
  expect((await data(page,'controls')).find((c:Control)=>c.id==='summary-upgrade-oven').enabled).toBe(false);
  const actions=await data(page,'shop-screen-actions');
  expect(actions.find((action:any)=>action.id==='summary-upgrade-oven').title).toBe('Thiếu 1500 xu');
  expect(actions.find((action:any)=>action.id==='shop-fridge-buy').title).toBe('Thiếu 2500 xu');
  await page.locator('canvas').screenshot({path:info.outputPath('shop-equipment-poor.png')});
  await tap(page,'shop-screen-back');await open(page,'decoration');
  const cash=await page.locator('canvas').getAttribute('data-cash'),b=(await page.locator('canvas').boundingBox())!;
  await page.mouse.move(b.x+90*b.width/360,b.y+390*b.height/640);await page.mouse.down();
  await page.mouse.move(b.x+90*b.width/360,b.y+230*b.height/640,{steps:8});await page.mouse.up();await settle(page);
  await expect(page.locator('canvas')).toHaveAttribute('data-paused','');
  expect(await page.locator('canvas').getAttribute('data-cash')).toBe(cash);
  expect((await data(page,'shop-scroll')).offset).toBeGreaterThan(0);
});

test('purchases save in background without blocking the screen and persist exactly once',async({page},info)=>{
  await fixture(page);const canvas=page.locator('canvas'),before=Number(await canvas.getAttribute('data-cash'));
  await open(page,'decoration');
  await page.evaluate(()=>{const f=(window as any).shopFixture,repo=f.session.repository,commit=repo.commit.bind(repo);repo.commit=async(request:any)=>{await new Promise<void>(resolve=>{f.releasePurchase=resolve;});return commit(request);};});
  await tap(page,'shop-item-table-plant');await tap(page,'shop-item-confirm');
  await expect.poll(async()=>(await data(page,'save-state')).state).toBe('saving');
  await expect(canvas).toHaveAttribute('data-modal-backdrop','');await expect(canvas).toHaveAttribute('data-notification-frame','');await expect(canvas).toHaveAttribute('data-pause-panel','');
  expect(await page.evaluate(()=>{const f=(window as any).shopFixture;return [f.session.savingPreparation,f.session.buyShopItem('table-plant','duplicate'),f.runtime.openShop()];})).toEqual([true,false,false]);
  expect(Number(await canvas.getAttribute('data-cash'))).toBe(before);
  await canvas.screenshot({path:info.outputPath('silent-purchase.png')});
  await tap(page,'summary-tab-stock');await expect(canvas).toHaveAttribute('data-summary-tab','stock');await expect(canvas).toHaveAttribute('data-modal-backdrop','');
  await page.evaluate(()=>(window as any).shopFixture.releasePurchase());await ready(page);
  expect(Number(await canvas.getAttribute('data-cash'))).toBe(before-500);expect((await data(page,'shop-items')).acquired).toHaveLength(1);
  await restoreProduction(page);expect(Number(await canvas.getAttribute('data-cash'))).toBe(before-500);expect((await data(page,'shop-items')).acquired).toHaveLength(1);
});

test('failed purchase retains cash and ownership then retry applies once',async({page})=>{
  await page.addInitScript(()=>{const put=IDBObjectStore.prototype.put;let failed=false;IDBObjectStore.prototype.put=function(value:any,key?:IDBValidKey){if(key==='active'&&value.payload?.shop?.spent===500&&!failed){failed=true;this.transaction.abort();throw new DOMException('test write failure','QuotaExceededError');}return key===undefined?put.call(this,value):put.call(this,value,key);};});
  await fixture(page);const before=Number(await page.locator('canvas').getAttribute('data-cash'));
  await open(page,'decoration');await tap(page,'shop-item-table-plant');await tap(page,'shop-item-confirm');
  await expect.poll(async()=>(await data(page,'save-state')).state).toBe('error');
  expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(before);expect((await data(page,'shop-items')).acquired).toEqual([]);
  await tap(page,'save-retry');await ready(page);expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(before-500);expect((await data(page,'shop-items')).acquired).toHaveLength(1);
});
