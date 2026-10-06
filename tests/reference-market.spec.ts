import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
type Row={id:string;name:string;quantity:number;unitPrice:number;total:number;available:number;remainingCash:number;visible:boolean};
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)||'null');}
async function tap(page:Page,id:string){
  const canvas=page.locator('canvas');
  let candidate:Control|undefined;
  await expect.poll(async()=>{
    const controls=(await data(page,'controls')) as Control[],resume=controls.find(c=>c.id==='resume'&&c.enabled);
    if(id!=='resume'&&resume&&(await canvas.getAttribute('data-paused')||'').split(',').includes('gap')){
      const b=(await canvas.boundingBox())!;await page.touchscreen.tap(b.x+(resume.x+resume.width/2)*b.width/360,b.y+(resume.y+resume.height/2)*b.height/640);return false;
    }
    candidate=controls.find(c=>c.id===id&&c.enabled);return !!candidate;
  }).toBe(true);
  const c=candidate!,b=(await canvas.boundingBox())!;
  expect(c.width*b.width/360).toBeGreaterThanOrEqual(48);expect(c.height*b.height/640).toBeGreaterThanOrEqual(48);
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
}
async function fixture(page:Page,mode:'regular'|'poor'|'terminal'='regular'){
  const specifier:string='node:path';const paths:{resolve(path:string):string}=await import(specifier);
  const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';
    const runtime=new CozyRuntime(false,true,{schedule:day=>({day,duration:180,grace:120,slots:[{id:'first',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:true}]}),resolveRecipe:()=> 'cheese'});
    ${mode==='poor'?"runtime.buy('dough',58);":''}
    ${mode==='terminal'?"runtime.buy('mushroom',59);runtime.openShop();runtime.closeDay();":''}
    let guarded=false;runtime.attachSaveGuard(()=>!guarded);
    window.marketFixture={runtime,advance:seconds=>{for(let i=0;i<seconds*20;i++)runtime.advance(50);},guard:value=>{guarded=value;window.dispatchEvent(new Event('resize'));}};
    const game=new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(runtime)]});window.marketFixture.game=game;
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:bundle.outputFiles[0].text});
  await expect(page.locator('canvas')).toHaveAttribute('data-screen',mode==='terminal'?'day-summary':'preparation-hub');
  await tap(page,'summary-tab-market');
}
async function buyTwo(page:Page,id:string,filter='base'){
  await tap(page,'market-filter-'+filter);await tap(page,'market-plus-'+id);await tap(page,'market-buy-'+id);
  await expect.poll(async()=>((await data(page,'stock')) as {id:string;owned:number}[]).find(s=>s.id===id)?.owned).toBe(2);
}
async function scrollToEnd(page:Page){
  const region=await data(page,'market-scroll'),b=(await page.locator('canvas').boundingBox())!;
  await page.mouse.move(b.x+(region.x+region.width/2)*b.width/360,b.y+(region.y+region.height/2)*b.height/640);await page.mouse.wheel(0,10000);
  await expect.poll(async()=>(await data(page,'market-scroll')).offset).toBe(region.max);
}

test('regular market purchase enters stock and is used once through the next-day flow',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await fixture(page);const canvas=page.locator('canvas');
  expect((await data(page,'market-rows')).length).toBe(19);await canvas.screenshot({path:info.outputPath('reference-market.png')});
  await buyTwo(page,'dough');await buyTwo(page,'cheese');await buyTwo(page,'sauce','sauce');
  await expect(canvas).toHaveAttribute('data-cash','270');expect(await data(page,'express-orders')).toEqual([]);
  await tap(page,'summary-tab-stock');
  expect((await data(page,'stock-rows')).find((r:{id:string})=>r.id==='cheese').usable).toBe(2);
  await tap(page,'stock-item-cheese');expect((await data(page,'hub-detail')).body).toContain('Lô ngày 1');await tap(page,'hub-detail-close');
  await tap(page,'summary-stock-market');await expect(canvas).toHaveAttribute('data-summary-tab','market');
  await tap(page,'summary-open-first-day');await expect(canvas).toHaveAttribute('data-cash','270');
  for(const id of ['dough','sauce','cheese'])await tap(page,id);
  await tap(page,'bake');expect((await data(page,'stock')).filter((s:{id:string})=>['dough','sauce','cheese'].includes(s.id)).map((s:{owned:number})=>s.owned)).toEqual([1,1,1]);
  await page.evaluate(()=>{(window as unknown as {marketFixture:{advance:(n:number)=>void}}).marketFixture.advance(6);});
  await expect(canvas).toHaveAttribute('data-heat','perfect');await tap(page,'extract');await tap(page,'box');await tap(page,'deliver');
  await tap(page,'continue-shift');await tap(page,'end-day');await tap(page,'confirm-end-day');await expect(canvas).toHaveAttribute('data-screen','day-ended-notice');await tap(page,'day-ended-understood');await expect(canvas).toHaveAttribute('data-screen','day-summary');
  const report=await data(page,'day-summary');expect(report).toMatchObject({purchases:30,cost:15,revenue:50,profit:15,cash:300});
  await tap(page,'summary-tab-market');await tap(page,'market-filter-base');
  const dough=(await data(page,'market-rows')).find((r:Row)=>r.id==='dough');expect(dough).toMatchObject({unitPrice:6,available:1});
  await tap(page,'market-buy-dough');
  await expect(canvas).toHaveAttribute('data-cash',String(300-6*dough.quantity));expect(await data(page,'day-summary')).toEqual(report);
  await tap(page,'summary-tab-stock');await tap(page,'stock-item-dough');expect((await data(page,'hub-detail')).body).toContain('Lô ngày 2');await tap(page,'hub-detail-close');
  await tap(page,'summary-stock-market');await tap(page,'summary-open-next-day');await expect(canvas).toHaveAttribute('data-day','2');await expect(canvas).toHaveAttribute('data-screen','game');
  expect(errors).toEqual([]);
});

test('day one clock ends with a single acknowledgement before summary and preserves other pause owners',async({page},info)=>{
  await fixture(page);await tap(page,'summary-open-first-day');const canvas=page.locator('canvas');
  await tap(page,'pause');await tap(page,'resume');
  await page.evaluate(()=>{(window as unknown as {marketFixture:{advance:(n:number)=>void}}).marketFixture.advance(180);});
  await expect.poll(async()=>(await data(page,'shift-clock')).phase).toBe('grace');await expect(canvas).toHaveAttribute('data-screen','game');
  await page.evaluate(()=>{(window as unknown as {marketFixture:{advance:(n:number)=>void}}).marketFixture.advance(121);});
  await expect.poll(async()=>{if((await data(page,'controls')).some((c:Control)=>c.id==='resume'&&c.enabled))await tap(page,'resume');return await canvas.getAttribute('data-screen');}).toBe('day-ended-notice');
  await expect(canvas).toHaveAttribute('data-screen','day-ended-notice');
  expect((await data(page,'controls')).filter((c:Control)=>c.enabled).map((c:Control)=>c.id)).toEqual(['day-ended-understood']);
  const report=await data(page,'day-summary'),cash=await canvas.getAttribute('data-cash');await canvas.screenshot({path:info.outputPath('day-one-ended-notice.png')});
  await page.evaluate(()=>{const f=(window as unknown as {marketFixture:{advance:(n:number)=>void;runtime:{acquirePause:(r:string)=>unknown}}}).marketFixture;f.runtime.acquirePause('visibility');f.advance(300);});
  await tap(page,'day-ended-understood');await expect(canvas).toHaveAttribute('data-screen','day-summary');await expect(canvas).toHaveAttribute('data-summary-tab','summary');
  expect(await data(page,'day-summary')).toEqual(report);await expect(canvas).toHaveAttribute('data-cash',cash!);expect((await canvas.getAttribute('data-paused'))?.split(',')).toContain('visibility');
});

test('filters and scroll expose all nineteen real ingredients and cancellation changes nothing',async({page},info)=>{
  await fixture(page);const canvas=page.locator('canvas');
  const beforeModal=await data(page,'market-scroll'),bounds=(await canvas.boundingBox())!;
  const wheelBehind=async()=>{await page.mouse.move(bounds.x+120*bounds.width/360,bounds.y+350*bounds.height/640);await page.mouse.wheel(0,200);await page.waitForTimeout(150);expect((await data(page,'market-scroll')).offset).toBe(beforeModal.offset);};
  await tap(page,'pause');await wheelBehind();await tap(page,'resume');
  await tap(page,'market-price-open');await wheelBehind();await tap(page,'market-price-cancel');
  await tap(page,'market-filter-sauce');expect((await data(page,'market-rows')).map((r:Row)=>r.id).sort()).toEqual(['sauce','sauce-white','sauce-bbq','sauce-pesto','sauce-hot'].sort());
  await tap(page,'market-filter-base');expect((await data(page,'market-rows')).map((r:Row)=>r.id).sort()).toEqual(['cheese','dough']);
  await tap(page,'market-buy-all');await expect.poll(async()=>await data(page,'market-basket')).not.toBeNull();
  const stock=await data(page,'stock');await canvas.screenshot({path:info.outputPath('market-confirmation.png')});
  expect(((await data(page,'controls')) as Control[]).some(c=>c.id==='summary-open-first-day'&&c.enabled)).toBe(false);
  await tap(page,'market-purchase-cancel');await expect(canvas).toHaveAttribute('data-cash','300');expect(await data(page,'stock')).toEqual(stock);
  await tap(page,'market-buy-all');
  const confirm=((await data(page,'controls')) as Control[]).find(c=>c.id==='market-purchase-confirm')!,box=(await canvas.boundingBox())!;
  for(let i=0;i<2;i++)await page.touchscreen.tap(box.x+(confirm.x+confirm.width/2)*box.width/360,box.y+(confirm.y+confirm.height/2)*box.height/640);
  await expect(canvas).toHaveAttribute('data-cash','280');expect((await data(page,'stock')).find((s:{id:string})=>s.id==='dough').owned).toBe(1);
  await tap(page,'market-filter-topping');expect((await data(page,'market-rows')).length).toBe(12);
  const b=(await canvas.boundingBox())!,region=await data(page,'market-scroll');
  await page.mouse.move(b.x+120*b.width/360,b.y+(region.y+region.height-20)*b.height/640);await page.mouse.down();
  await page.mouse.move(b.x+120*b.width/360,b.y+(region.y+30)*b.height/640,{steps:12});await page.mouse.up();
  await expect.poll(async()=>(await data(page,'market-scroll')).offset).toBeGreaterThan(100);
  await scrollToEnd(page);await canvas.screenshot({path:info.outputPath('market-scrolled.png')});
  expect((await data(page,'market-rows')).some((r:Row)=>r.id==='pineapple'&&r.visible)).toBe(true);
  expect(((await data(page,'controls')) as Control[]).find(c=>c.id==='market-buy-pineapple')?.enabled).toBe(false);
  expect((await data(page,'stock')).find((s:{id:string})=>s.id==='pineapple').owned).toBe(0);
  const offset=(await data(page,'market-scroll')).offset;expect(offset).toBeGreaterThan(0);
  await tap(page,'summary-tab-stock');await tap(page,'summary-stock-market');expect((await data(page,'market-scroll')).offset).toBe(offset);
});

test('unaffordable purchases are explained and save guards prevent cash or stock mutation',async({page})=>{
  await fixture(page,'poor');const canvas=page.locator('canvas');await tap(page,'market-filter-base');await tap(page,'market-plus-cheese');
  expect((await data(page,'market-rows')).find((r:Row)=>r.id==='cheese')).toMatchObject({quantity:2,total:14,remainingCash:-4});
  const cash=await canvas.getAttribute('data-cash'),stock=await data(page,'stock');
  const buy=((await data(page,'controls')) as Control[]).find(c=>c.id==='market-buy-cheese');
  if(buy?.enabled){await tap(page,'market-buy-cheese');expect(await data(page,'market-purchase')).toBeNull();}
  await expect(canvas).toHaveAttribute('data-cash',cash!);expect(await data(page,'stock')).toEqual(stock);
  await page.evaluate(()=>{(window as unknown as {marketFixture:{guard:(v:boolean)=>void}}).marketFixture.guard(true);});
  await expect.poll(async()=>((await data(page,'controls')) as Control[]).filter(c=>c.id.startsWith('market-buy-')&&c.enabled).length).toBe(0);
  expect(((await data(page,'controls')) as Control[]).find(c=>c.id==='summary-open-first-day')?.enabled).toBe(false);
});

test('terminal market stays read-only and switching tabs does not add a visibility pause',async({page})=>{
  await fixture(page);const canvas=page.locator('canvas');await tap(page,'market-buy-all');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await tap(page,'market-purchase-cancel');await expect(canvas).toHaveAttribute('data-paused','');await expect(canvas).toHaveAttribute('data-cash','300');
  await fixture(page,'terminal');expect(((await data(page,'controls')) as Control[]).filter(c=>c.id.startsWith('market-buy-')&&c.enabled)).toEqual([]);
  expect(((await data(page,'controls')) as Control[]).some(c=>c.id==='summary-open-next-day')).toBe(false);
});

test('express remains an optional in-shift order with premium, cancellation and paused delivery',async({page})=>{
  await fixture(page);const canvas=page.locator('canvas');await tap(page,'summary-open-first-day');
  await tap(page,'dough');await tap(page,'express-close');await expect(canvas).toHaveAttribute('data-cash','300');expect(await data(page,'express-orders')).toEqual([]);
  await tap(page,'dough');await tap(page,'express-confirm');await expect(canvas).toHaveAttribute('data-cash','292');
  expect((await data(page,'stock')).find((s:{id:string})=>s.id==='dough').owned).toBe(0);
  await tap(page,'pause');const before=await data(page,'express-orders');
  await page.evaluate(()=>{(window as unknown as {marketFixture:{advance:(n:number)=>void}}).marketFixture.advance(10);});
  expect(await data(page,'express-orders')).toEqual(before);await tap(page,'resume');
  await page.evaluate(()=>{(window as unknown as {marketFixture:{advance:(n:number)=>void}}).marketFixture.advance(5);});
  await expect.poll(async()=>(await data(page,'express-orders')).length).toBe(0);
  expect((await data(page,'stock')).find((s:{id:string})=>s.id==='dough').owned).toBe(1);
});

test('quantity number opens numeric input, validates integers and buys the chosen amount',async({page},info)=>{
  await fixture(page);const canvas=page.locator('canvas'),input=page.getByRole('textbox',{name:'Số lượng nguyên liệu'});
  await tap(page,'market-quantity-dough');await expect(input).toBeFocused();await expect(input).toHaveAttribute('inputmode','numeric');
  await input.fill('37');await page.screenshot({path:info.outputPath('market-quantity-input.png')});await input.press('Enter');
  await expect(input).toHaveCount(0);await expect.poll(async()=>(await data(page,'market-rows')).find((r:Row)=>r.id==='dough')?.quantity).toBe(37);
  await expect(canvas).toHaveAttribute('data-cash','300');
  await tap(page,'market-quantity-dough');await input.fill('12');await tap(page,'market-quantity-cancel');
  await expect(input).toHaveCount(0);expect((await data(page,'market-rows')).find((r:Row)=>r.id==='dough').quantity).toBe(37);
  await tap(page,'market-quantity-dough');await input.fill('37');await tap(page,'market-quantity-apply');await expect(input).toHaveCount(0);
  await tap(page,'market-quantity-dough');
  for(const invalid of ['101','-2','2.5','1e2','1000','']){
    await input.fill(invalid);await expect.poll(async()=>((await data(page,'controls')) as Control[]).find(c=>c.id==='market-quantity-apply')?.enabled).toBe(false);
    await input.press('Enter');await expect(input).toHaveCount(1);
  }
  await input.press('Escape');await expect(input).toHaveCount(0);
  expect((await data(page,'market-rows')).find((r:Row)=>r.id==='dough').quantity).toBe(37);
  await tap(page,'market-minus-dough');expect((await data(page,'market-rows')).find((r:Row)=>r.id==='dough').quantity).toBe(36);
  await tap(page,'market-plus-dough');await tap(page,'market-buy-dough');
  await expect(canvas).toHaveAttribute('data-cash','115');expect((await data(page,'stock')).find((s:{id:string})=>s.id==='dough').owned).toBe(37);
});

test('all five hub tabs share the reference header and retain cash and stock',async({page},info)=>{
  await fixture(page);const canvas=page.locator('canvas'),before=await data(page,'stock');
  for(const tab of ['summary','market','stock','shop','missions']){
    await tap(page,'summary-tab-'+tab);await expect(canvas).toHaveAttribute('data-summary-tab',tab);await expect(canvas).toHaveAttribute('data-hub-header','minimal-wood-reference');await expect(canvas).toHaveAttribute('data-cash','300');expect(await data(page,'stock')).toEqual(before);
    const controls=await data(page,'controls') as Control[];expect(controls.filter(c=>c.id.startsWith('summary-tab-')).length).toBe(5);
    for(const c of controls.filter(c=>c.id.startsWith('summary-tab-')))expect(c.y+c.height).toBeLessThanOrEqual(130);
    await canvas.screenshot({path:info.outputPath('shared-header-'+tab+'.png')});
  }
  await tap(page,'pause');await expect(canvas).toHaveAttribute('data-paused',/user/);await tap(page,'resume');await expect(canvas).toHaveAttribute('data-summary-tab','missions');
});

test('stock filters, lot detail, row drag and menu plan are read-only',async({page},info)=>{
  await fixture(page);await buyTwo(page,'dough');await buyTwo(page,'cheese');await buyTwo(page,'sauce','sauce');await tap(page,'summary-tab-stock');
  const canvas=page.locator('canvas'),cash=await canvas.getAttribute('data-cash'),stock=await data(page,'stock');
  expect(await data(page,'stock-rows')).toHaveLength(19);await canvas.screenshot({path:info.outputPath('stock-reference.png')});
  await tap(page,'stock-filter-low');await page.getByRole('textbox',{name:'Ngưỡng sắp hết'}).fill('1');await page.getByRole('textbox',{name:'Ngưỡng sắp hết'}).press('Enter');expect((await data(page,'stock-rows')).every((r:{usable:number})=>r.usable<=1)).toBe(true);
  await tap(page,'stock-filter-all');await tap(page,'stock-filter-expiry');await page.getByRole('textbox',{name:'Số ngày sắp hết hạn'}).fill('1');await page.getByRole('textbox',{name:'Số ngày sắp hết hạn'}).press('Enter');expect(await data(page,'stock-rows')).toHaveLength(3);
  await tap(page,'stock-filter-all');const b=(await canvas.boundingBox())!,region=await data(page,'stock-scroll');
  await page.mouse.move(b.x+130*b.width/360,b.y+400*b.height/640);await page.mouse.down();await page.mouse.move(b.x+130*b.width/360,b.y+280*b.height/640,{steps:8});await page.mouse.up();await expect.poll(async()=>(await data(page,'stock-scroll')).offset).toBeGreaterThan(40);expect(await data(page,'hub-detail')).toBeNull();
  await page.mouse.move(b.x+130*b.width/360,b.y+350*b.height/640);await page.mouse.wheel(0,10000);await expect.poll(async()=>(await data(page,'stock-scroll')).offset).toBe(region.max);await tap(page,'stock-item-pineapple');expect((await data(page,'hub-detail')).title).toBe('Dứa');await tap(page,'hub-detail-close');
  await tap(page,'stock-suggestions');await tap(page,'stock-plan-plus-cheese');await tap(page,'stock-plan-plus-cheese');await tap(page,'stock-plan-plus-mushroom');
  expect((await data(page,'stock-forecast')).find((r:{id:string})=>r.id==='dough')).toMatchObject({need:3,available:2,missing:1});expect((await data(page,'stock-forecast')).some((r:{id:string})=>r.id==='shrimp')).toBe(false);await canvas.screenshot({path:info.outputPath('stock-planner.png')});
  await tap(page,'stock-plan-close');await expect(canvas).toHaveAttribute('data-cash',cash!);expect(await data(page,'stock')).toEqual(stock);await tap(page,'summary-stock-market');await expect(canvas).toHaveAttribute('data-summary-tab','market');
});

test('shop has six categories, real menu editing and confirmed atomic upgrades',async({page},info)=>{
  await fixture(page);await tap(page,'summary-tab-shop');const canvas=page.locator('canvas');await canvas.screenshot({path:info.outputPath('shop-reference.png')});
  for(const section of ['decoration','amenities','staff']){await tap(page,'shop-section-'+section);await expect(canvas).toHaveAttribute('data-shop-page',section);await canvas.screenshot({path:info.outputPath('shop-'+section+'.png')});await expect(canvas).toHaveAttribute('data-cash','300');await tap(page,'shop-back');}
  await tap(page,'shop-section-menu');await tap(page,'shop-price-cheese');await tap(page,'market-price-plus');await tap(page,'market-price-save');expect((await data(page,'menu-recipes')).includes('cheese')).toBe(true);await tap(page,'shop-back');
  await tap(page,'shop-section-equipment');await canvas.screenshot({path:info.outputPath('shop-equipment.png')});await tap(page,'summary-upgrade-oven');await tap(page,'hub-upgrade-cancel');await expect(canvas).toHaveAttribute('data-cash','300');
  await tap(page,'summary-upgrade-oven');await tap(page,'hub-upgrade-confirm');await expect(canvas).toHaveAttribute('data-cash','150');expect((await data(page,'bake-timing')).perfectStart).toBe(4);
  await tap(page,'shop-back');await tap(page,'shop-section-expansion');await tap(page,'summary-upgrade-queue');expect((await data(page,'hub-upgrade')).cost).toBe(200);expect((await data(page,'controls')).find((c:Control)=>c.id==='hub-upgrade-confirm').enabled).toBe(false);await tap(page,'hub-upgrade-cancel');await expect(canvas).toHaveAttribute('data-cash','150');
});

test('missions shows real preparation and terminal goals without claiming rewards',async({page},info)=>{
  await fixture(page);await tap(page,'summary-tab-missions');const canvas=page.locator('canvas');expect(await data(page,'missions-view')).toMatchObject({xp:0,cheeseSales:0,mission:'active',goal:{day:1,status:'active'}});await canvas.screenshot({path:info.outputPath('missions-reference.png')});await expect(canvas).toHaveAttribute('data-cash','300');
  await fixture(page,'terminal');await tap(page,'summary-tab-missions');const before=await canvas.getAttribute('data-cash');expect(await data(page,'missions-view')).toMatchObject({mission:'active',goal:{day:1,status:'expired'}});await tap(page,'summary-tab-summary');await tap(page,'summary-tab-missions');await expect(canvas).toHaveAttribute('data-cash',before!);expect((await data(page,'missions-view')).claims).toEqual([]);
});

test('large quantity keeps every shortfall digit visible inside the market row',async({page},info)=>{
  await fixture(page);
  await page.evaluate(()=>{
    const state=window as unknown as {marketMoneyPaints:{value:string;width:number;x:number;font:string}[]};state.marketMoneyPaints=[];
    const original=CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText=function(value,x,y,maxWidth){
      if(this.canvas.width===360&&value.includes('1000'))state.marketMoneyPaints.push({value,width:this.measureText(value).width,x,font:this.font});
      if(maxWidth===undefined)original.call(this,value,x,y);else original.call(this,value,x,y,maxWidth);
    };
  });
  await tap(page,'market-quantity-chicken');await page.getByRole('textbox',{name:'Số lượng nguyên liệu'}).fill('100');await page.getByRole('textbox',{name:'Số lượng nguyên liệu'}).press('Enter');
  const paints=await page.evaluate(()=>(window as unknown as {marketMoneyPaints:{value:string;width:number;x:number;font:string}[]}).marketMoneyPaints);
  const money=paints.find(p=>p.value==='1000 xu · Thiếu 700');expect(money).toBeDefined();expect(money!.width).toBeLessThanOrEqual(120);expect(money!.x+money!.width).toBeLessThan(196);
  await expect(page.locator('canvas')).toHaveAttribute('data-cash','300');
  await page.locator('canvas').screenshot({path:info.outputPath('market-large-quantity.png')});
});

test('market ingredient sheet has actual transparent background and no brown tiles',async({page},info)=>{
  await fixture(page);await tap(page,'market-filter-topping');await scrollToEnd(page);
  const alpha=await page.evaluate(async()=>{
    const image=new Image();image.src='/assets/market-ingredients-transparent.png';await image.decode();
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);
    const value=(x:number,y:number)=>ctx.getImageData(x,y,1,1).data[3];
    return {corner:value(0,0),emptyCell:value(image.width*.9,image.height*.87),bottle:value(image.width*.1,image.height*.26)};
  });
  expect(alpha.corner).toBe(0);expect(alpha.emptyCell).toBe(0);expect(alpha.bottle).toBeGreaterThan(200);
  await page.locator('canvas').screenshot({path:info.outputPath('market-transparent-ingredients.png')});
});

test('market and stock retain their list textures and input while dragging across frames',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page);
  const canvas=page.locator('canvas'),cash=await canvas.getAttribute('data-cash'),stock=await data(page,'stock');
  for(const tab of ['market','stock']){
    if(tab==='stock')await tap(page,'summary-tab-stock');
    const baseline=await page.evaluate(tab=>{
      const game=(window as unknown as {marketFixture:{game:{textures:{list:Record<string,unknown>};scene:{scenes:{input:{listenerCount:(event:string)=>number};hitZones:Map<string,unknown>}[]}}}}).marketFixture.game;
      const key=Object.keys(game.textures.list).find(k=>k.startsWith(tab+'-window-')&&k.endsWith('-list'))!;
      const scene=game.scene.scenes[0],saved={key,texture:game.textures.list[key],zones:[...scene.hitZones.values()],listeners:['wheel','pointerdown','pointermove','pointerup'].map(e=>scene.input.listenerCount(e))};
      (window as unknown as {scrollBaseline:typeof saved}).scrollBaseline=saved;return {key,zones:saved.zones.length,listeners:saved.listeners};
    },tab);
    const b=(await canvas.boundingBox())!;
    // Begin directly on a Mua button / stock row: moving must suppress its tap.
    const x=tab==='market'?306:130;
    await page.mouse.move(b.x+x*b.width/360,b.y+448*b.height/640);await page.mouse.down();
    for(let i=1;i<=20;i++){await page.mouse.move(b.x+x*b.width/360,b.y+(448-i*8)*b.height/640);await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve())));}
    await page.mouse.up();
    await expect.poll(async()=>(await data(page,tab+'-scroll')).offset).toBeGreaterThan(100);
    expect(await data(page,'hub-detail')).toBeNull();expect(await data(page,'market-purchase')).toBeNull();
    const retained=await page.evaluate(()=>{
      const game=(window as unknown as {marketFixture:{game:{textures:{list:Record<string,unknown>};scene:{scenes:{input:{listenerCount:(event:string)=>number};hitZones:Map<string,unknown>}[]}}}}).marketFixture.game;
      const saved=(window as unknown as {scrollBaseline:{key:string;texture:unknown;zones:unknown[];listeners:number[]}}).scrollBaseline,scene=game.scene.scenes[0];
      return {key:saved.key,sameTexture:game.textures.list[saved.key]===saved.texture,sameZones:saved.zones.every(z=>[...scene.hitZones.values()].includes(z)),zones:scene.hitZones.size,listeners:['wheel','pointerdown','pointermove','pointerup'].map(e=>scene.input.listenerCount(e))};
    });
    expect(retained).toMatchObject({...baseline,sameTexture:true,sameZones:true});
    const controls=await data(page,'controls') as Control[];
    expect(new Set(controls.map(c=>c.id)).size).toBe(controls.length);
    expect(controls.filter(c=>c.enabled&&c.id!=='market-buy-all'&&(c.id.startsWith('stock-item-')||/^market-(buy|quantity|minus|plus)-/.test(c.id))).every(c=>c.y>=(tab==='market'?219:223)&&c.y+c.height<=(tab==='market'?537:535))).toBe(true);
    await canvas.screenshot({path:info.outputPath(tab+'-retained-scroll.png')});
    // Correct current row remains actionable after the scroll.
    const target=controls.find(c=>c.enabled&&c.height>=48&&(tab==='market'?c.id==='market-buy-all':c.id.startsWith('stock-item-')))!;
    await tap(page,target.id);
    const offset=(await data(page,tab+'-scroll')).offset;
    await page.mouse.move(b.x+130*b.width/360,b.y+350*b.height/640);await page.mouse.wheel(0,200);
    expect((await data(page,tab+'-scroll')).offset).toBe(offset);
    await tap(page,tab==='market'?'market-purchase-cancel':'hub-detail-close');
    await expect(canvas).toHaveAttribute('data-cash',cash!);expect(await data(page,'stock')).toEqual(stock);
    await tap(page,'summary-tab-shop');
    const cleared=await page.evaluate(tab=>{
      const game=(window as unknown as {marketFixture:{game:{textures:{list:Record<string,unknown>};scene:{scenes:{input:{listenerCount:(event:string)=>number}}[]}}}}).marketFixture.game;
      return {keys:Object.keys(game.textures.list).filter(k=>k.startsWith(tab+'-window-')),wheel:game.scene.scenes[0].input.listenerCount('wheel')};
    },tab);
    expect(cleared).toEqual({keys:[],wheel:0});
  }
  expect(errors).toEqual([]);
});
