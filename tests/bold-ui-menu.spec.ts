import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';
import {fundedShopCheckpoint} from '../src/runtime/shopTestFixture';

test.setTimeout(120_000);
let code:string|undefined;
async function read(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)||'null');}
async function settle(page:Page){await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));}
async function tap(page:Page,id:string){
  await expect.poll(async()=>(await read(page,'controls')).some((c:any)=>c.id===id&&c.enabled)).toBe(true);
  const c=(await read(page,'controls')).find((c:any)=>c.id===id),b=(await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);await settle(page);
}
async function fixture(page:Page){
  const pathSpecifier:string='node:path',paths=await import(pathSpecifier);
  if(!code){const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';import {PlayLifecycle} from './src/runtime/PlayLifecycle';import {modalText} from './src/presentation/ModalText';
    const runtime=CozyRuntime.restoreCheckpoint(window.boldCheckpoint,false,{eventRoll:()=>1,vipRoll:()=>1,schedule:day=>({day,duration:300,grace:120,slots:[{id:'old',at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:true},{id:'next',at:20,kind:'regular',opportunity:'commercial',commercialOrdinal:2,takeaway:true}]}),resolveRecipe:()=> 'cheese',resolveItems:()=>[{recipe:'cheese',price:50,finishingSauces:[]}]});
    runtime.configureMenu('mushroom',100,true);for(const id of ['dough','sauce','cheese'])runtime.buy(id,4);const lifecycle=new PlayLifecycle(runtime,()=>0);lifecycle.frame=()=>lifecycle.reconcile();
    const scene=new CozyScene(runtime,undefined,undefined,undefined,lifecycle);const game=new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[scene]});Object.assign(window,{boldFixture:{runtime,scene,game,modalText}});
  `},bundle:true,platform:'browser',format:'iife',define:{'import.meta.env.BASE_URL':'"/"'},write:false});code=bundle.outputFiles[0].text;}
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;overflow:hidden}#fixture{height:100%;width:100%}</style><div id="fixture"></div>');
  await page.evaluate(checkpoint=>Object.assign(window,{boldCheckpoint:checkpoint}),fundedShopCheckpoint(6000));await page.addScriptTag({content:code});
  await expect(page.locator('canvas')).toHaveAttribute('data-booted','true',{timeout:30_000});await settle(page);
}

test('all management screens render clearly and sauces stay purchasable',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page);
  for(const tab of ['summary','market','stock','shop','missions']){
    await tap(page,'summary-tab-'+tab);expect((await read(page,'controls')).filter((c:any)=>c.id.startsWith('summary-tab-'))).toHaveLength(5);
    await expect(page.locator('canvas')).toHaveAttribute('data-ui-raster-scale','2');
    await page.locator('canvas').screenshot({path:info.outputPath('bold-'+tab+'.png')});
  }
  expect(await page.evaluate(()=>['sauce','sauce-white','sauce-bbq','sauce-pesto','sauce-hot'].every(id=>(window as any).boldFixture.runtime.ingredientAccess(id).unlocked))).toBe(true);
  await tap(page,'summary-tab-shop');await tap(page,'shop-section-menu');
  const before=await page.evaluate(()=>(window as any).boldFixture.runtime.customerProgress.prices.cheese);
  await tap(page,'shop-menu-plus-cheese');expect(await page.evaluate(()=>(window as any).boldFixture.runtime.customerProgress.prices.cheese)).toBeGreaterThan(before);
  await tap(page,'shop-menu-minus-cheese');expect(await page.evaluate(()=>(window as any).boldFixture.runtime.customerProgress.prices.cheese)).toBe(before);
  await tap(page,'shop-menu-toggle-cheese');expect(await page.evaluate(()=>(window as any).boldFixture.runtime.menuRecipes.includes('cheese'))).toBe(false);
  await tap(page,'shop-menu-toggle-cheese');expect(await page.evaluate(()=>(window as any).boldFixture.runtime.menuRecipes.includes('cheese'))).toBe(true);
  await page.locator('canvas').screenshot({path:info.outputPath('bold-menu-price.png')});
  await tap(page,'pause');await tap(page,'pause-settings');
  await page.locator('canvas').screenshot({path:info.outputPath('bold-settings.png')});
  expect(errors).toEqual([]);
});

test('high-resolution explanation text stays inside its viewport when scrolled',async({page},info)=>{
  await fixture(page);
  await page.evaluate(()=>{const {scene,modalText}=(window as any).boldFixture,layer=scene.add.container(0,0).setDepth(100);layer.add(scene.add.graphics().fillStyle(0xffffff).fillRect(0,0,360,640));scene.game.canvas.dataset.modalScroll='[]';modalText(scene,layer,40,200,260,100,Array.from({length:16},(_,i)=>'Dòng giải thích '+i).join('\n'),18,'#151515');});await settle(page);
  const bounds=async()=>{const png=await page.locator('canvas').screenshot();return page.evaluate(async encoded=>{const image=new Image();image.src='data:image/png;base64,'+encoded;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let min=640,max=0;for(let y=140;y<380;y++)for(let x=40;x<300;x++){const index=(y*canvas.width+x)*4;if(data[index]<100&&data[index+1]<100&&data[index+2]<100){min=Math.min(min,y);max=Math.max(max,y);}}return {min,max};},png.toString('base64'));};
  expect((await bounds()).min).toBeGreaterThanOrEqual(200);
  const b=(await page.locator('canvas').boundingBox())!;await page.mouse.move(b.x+170*b.width/360,b.y+240*b.height/640);await page.mouse.wheel(0,50);
  await expect.poll(async()=>(await read(page,'modal-scroll'))[0].offset).toBe(50);
  const after=await bounds();expect(after.min).toBeGreaterThanOrEqual(200);expect(after.max).toBeLessThan(300);expect(after.max-after.min).toBeGreaterThan(50);
  await page.locator('canvas').screenshot({path:info.outputPath('bold-explanation-scrolled.png')});
});

test('expired pizza leaves catalog cells intact and can be discarded from the workbench',async({page},info)=>{
  await fixture(page);await tap(page,'summary-open-first-day');
  for(const id of ['dough','sauce','cheese','bake'])await tap(page,id);
  await page.evaluate(()=>(window as any).boldFixture.runtime.advanceElapsed(120_000));await settle(page);
  expect((await read(page,'labels')).some((l:any)=>l.text.startsWith('Bánh bỏ'))).toBe(false);
  expect((await read(page,'controls')).filter((c:any)=>/^recipe-\d$/.test(c.id))).toHaveLength(8);
  await page.locator('canvas').screenshot({path:info.outputPath('bold-expired-pizza.png')});
  await tap(page,'discard');await tap(page,'confirm-discard');
  expect(await page.evaluate(()=>(window as any).boldFixture.runtime.abandonedPizzas.length)).toBe(0);
});

test('main menu artwork and text use the same stronger presentation',async({page},info)=>{
  await page.goto('/?perf=1');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-menu-dialog','none',{timeout:30_000});
  await expect(canvas).toHaveAttribute('data-ui-art-contrast','1.14');
  await canvas.screenshot({path:info.outputPath('bold-main-menu.png')});
  const resolutions=await page.evaluate(()=>{
    const game=(window as any).pizzaPerformance.game,result:number[]=[];
    const visit=(object:any)=>{if(object.type==='Text')result.push(object.style.resolution);if(object.list)for(const child of object.list)visit(child);};
    for(const scene of game.scene.getScenes(true))for(const child of scene.children.list)visit(child);return result;
  });expect(resolutions.length).toBeGreaterThan(0);expect(resolutions.every(n=>n===2)).toBe(true);
});

test('closed-day summary and finance scroll retain high-resolution text and correct bounds',async({page},info)=>{
  await fixture(page);await tap(page,'summary-open-first-day');
  await page.evaluate(()=>{const r=(window as any).boldFixture.runtime;r.advanceElapsed(420_000);if(!r.closeDay())throw Error('close day failed');});await settle(page);
  await tap(page,'summary-tab-summary');await page.locator('canvas').screenshot({path:info.outputPath('bold-closed-summary.png')});
  await tap(page,'summary-finance-open');await page.locator('canvas').screenshot({path:info.outputPath('bold-finance.png')});
  const region=(await read(page,'modal-scroll'))[0];expect(region.max).toBeGreaterThan(0);
  const b=(await page.locator('canvas').boundingBox())!;await page.mouse.move(b.x+(region.x+region.width/2)*b.width/360,b.y+(region.y+region.height/2)*b.height/640);await page.mouse.wheel(0,160);
  await expect.poll(async()=>(await read(page,'modal-scroll'))[0].offset).toBeGreaterThan(0);
  await page.locator('canvas').screenshot({path:info.outputPath('bold-finance-scrolled.png')});await tap(page,'summary-statement-close');
  await expect(page.locator('canvas')).toHaveAttribute('data-summary-modal','');
});
