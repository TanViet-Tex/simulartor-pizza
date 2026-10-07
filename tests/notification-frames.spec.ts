import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

async function tap(page:Page,id:string,menu=false){
  const canvas=page.locator('canvas'),attr=menu?'data-menu-targets':'data-controls';
  await expect.poll(async()=>{
    if(!menu&&id!=='resume'&&await canvas.getAttribute('data-paused')==='gap'){await tap(page,'resume');return false;}
    return JSON.parse(await canvas.getAttribute(attr)??'[]').some((c:{id:string;enabled?:boolean;disabled?:boolean})=>c.id===id&&(menu?!c.disabled:c.enabled));
  }).toBe(true);
  const c=JSON.parse(await canvas.getAttribute(attr)??'[]').find((c:{id:string})=>c.id===id),b=(await canvas.boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}
async function visibleCorners(page:Page){
  const screenshot=await page.locator('canvas').screenshot();
  const pixels=await page.evaluate(async encoded=>{
    const image=new Image();image.src='data:image/png;base64,'+encoded;await image.decode();
    const sample=document.createElement('canvas');sample.width=image.width;sample.height=image.height;
    const ctx=sample.getContext('2d')!;ctx.drawImage(image,0,0);
    return [[10,60],[image.width-10,60],[10,image.height-60],[image.width-10,image.height-60]].map(([x,y])=>Array.from(ctx.getImageData(x,y,1,1).data));
  },screenshot.toString('base64'));
  for(const pixel of pixels){expect(pixel[3]).toBe(255);expect(pixel.slice(0,3).reduce((a,b)=>a+b,0)).toBeGreaterThan(0);}
}
async function variant(page:Page,expected:'one'|'two'){
  await expect.poll(async()=>JSON.parse(await page.locator('canvas').getAttribute('data-notification-frame')||'{}').variant).toBe(expected);
}

test('one-button queue notice dims the background and retains independent pause ownership',async({page},info)=>{
  const pathSpecifier:string='node:path';const paths:{resolve(path:string):string}=await import(pathSpecifier);
  const bundled=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';
    const runtime=new CozyRuntime(false,true,{schedule:day=>({day,duration:120,grace:20,slots:[]})});runtime.openShop();
    new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(runtime)]});Object.assign(window,{noticeRuntime:runtime});
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:bundled.outputFiles[0].text});const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-stage','assembly');const cash=await canvas.getAttribute('data-cash');
  await tap(page,'queue-locked-4');await variant(page,'one');await visibleCorners(page);
  const layout=JSON.parse(await canvas.getAttribute('data-notification-frame')||'{}');
  expect(layout.bounds.width).toBe(332);expect(layout.bounds.height).toBeLessThan(300);
  expect(layout.bounds.y+layout.bounds.height/2).toBe(320);
  expect(layout.body.x-layout.bounds.x-14).toBe(12);
  expect(layout.footer[0].y-layout.body.y-layout.body.height).toBe(10);
  expect(layout.footer[0].height).toBe(48);
  expect(layout.bounds.y+layout.bounds.height-layout.footer[0].y-layout.footer[0].height).toBe(18);
  const heading=JSON.parse(await canvas.getAttribute('data-labels')||'[]').find((label:{text:string})=>label.text.includes('Ô hàng chờ'));
  expect(layout.body.y-heading.y-heading.height).toBe(10);
  expect(JSON.parse(await canvas.getAttribute('data-controls')??'[]').map((c:{id:string})=>c.id)).toEqual(['queue-upgrade-close']);
  const bounds=(await canvas.boundingBox())!;await page.touchscreen.tap(bounds.x+45*bounds.width/360,bounds.y+514*bounds.height/640);
  await expect(canvas).toHaveAttribute('data-ingredients','');await expect(canvas).toHaveAttribute('data-cash',cash!);
  await canvas.screenshot({path:info.outputPath('notification-one.png')});
  await page.evaluate(()=>{const state=window as unknown as {noticeRuntime:any;otherNoticeLease:any};state.otherNoticeLease=state.noticeRuntime.acquirePause('order');});
  await tap(page,'queue-upgrade-close');await expect(canvas).toHaveAttribute('data-paused','order');
  await page.evaluate(()=>{(window as unknown as {otherNoticeLease:any}).otherNoticeLease.release();});await expect(canvas).toHaveAttribute('data-paused','');
  await tap(page,'end-day');await variant(page,'two');
  const confirmation=JSON.parse(await canvas.getAttribute('data-notification-frame')||'{}'),region=JSON.parse(await canvas.getAttribute('data-modal-scroll')||'[]')[0],mute=JSON.parse(await canvas.getAttribute('data-controls')||'[]').find((c:{id:string})=>c.id==='mute');
  expect(confirmation.bounds.height).toBeLessThan(450);expect(mute.y).toBeGreaterThanOrEqual(region.y+region.height);
  await canvas.screenshot({path:info.outputPath('notification-end-day.png')});
  await tap(page,'notification-close');await expect(canvas).toHaveAttribute('data-paused','');
});

test('menu confirmation uses two-button art, cancels without resetting and settings remains functional',async({page},info)=>{
  await page.goto('/?mode=shop');const canvas=page.locator('canvas');
  await tap(page,'pause');await tap(page,'main-menu');await tap(page,'menu-start',true);
  await expect(canvas).toHaveAttribute('data-menu-dialog','new-session');await variant(page,'two');await visibleCorners(page);
  const layout=JSON.parse(await canvas.getAttribute('data-notification-frame')||'{}');expect(layout.bounds.height).toBeLessThan(300);expect(layout.footer[0].y-layout.body.y-layout.body.height).toBeCloseTo(10);
  await canvas.screenshot({path:info.outputPath('notification-two.png')});
  await tap(page,'notification-close',true);await tap(page,'menu-settings',true);await expect(canvas).toHaveAttribute('data-menu-dialog','settings');
  await tap(page,'menu-motion',true);await expect(canvas).toHaveAttribute('data-menu-reduced-motion','true');
  await tap(page,'menu-settings-close',true);await tap(page,'menu-continue',true);await expect(canvas).toHaveAttribute('data-cash','300');await expect(canvas).toHaveAttribute('data-screen','preparation-hub');
});

test('order information grows to fit at 200% without moving the close action',async({page},info)=>{
  await page.goto('/?mode=freeplay');await tap(page,'customer-linh');await tap(page,'order');const canvas=page.locator('canvas');
  await page.evaluate(()=>{document.documentElement.style.fontSize='32px';window.dispatchEvent(new Event('resize'));});
  await expect(canvas).toHaveAttribute('data-text-scale','2');await variant(page,'one');
  const region=JSON.parse(await canvas.getAttribute('data-modal-scroll')??'[]')[0];expect(region.max).toBe(0);
  const layout=JSON.parse(await canvas.getAttribute('data-notification-frame')||'{}');
  expect(layout.bounds.height).toBeLessThanOrEqual(600);expect(layout.bounds.y+layout.bounds.height/2).toBe(320);
  const before=JSON.parse(await canvas.getAttribute('data-controls')??'[]').find((c:{id:string})=>c.id==='close-order');
  const bounds=(await canvas.boundingBox())!;
  await page.mouse.move(bounds.x+(region.x+region.width/2)*bounds.width/360,bounds.y+(region.y+region.height/2)*bounds.height/640);
  await page.mouse.wheel(0,160);
  expect(JSON.parse(await canvas.getAttribute('data-modal-scroll')??'[]')[0].offset).toBe(0);
  expect(JSON.parse(await canvas.getAttribute('data-controls')??'[]').find((c:{id:string})=>c.id==='close-order')).toEqual(before);
  await canvas.screenshot({path:info.outputPath('notification-large-text.png')});
  await tap(page,'close-order');await expect(canvas).toHaveAttribute('data-paused','');
});

test('long notice caps its height and scrolls while the confirmation stays visible',async({page})=>{
  const pathSpecifier:string='node:path';const paths:{resolve(path:string):string}=await import(pathSpecifier);
  const bundled=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {drawCompactNotification,preloadNotificationFrames} from './src/presentation/NotificationFrame';
    class Notice extends Phaser.Scene{
      preload(){preloadNotificationFrames(this);}
      create(){drawCompactNotification(this,this.add.container(),'Long notification','Long details that must remain readable. '.repeat(60),17,2);}
    }
    new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[Notice]});
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:bundled.outputFiles[0].text});const canvas=page.locator('canvas');await variant(page,'one');
  const layout=JSON.parse(await canvas.getAttribute('data-notification-frame')||'{}');
  expect(layout.bounds.height).toBe(600);expect(layout.footer[0].height).toBe(48);
  const region=JSON.parse(await canvas.getAttribute('data-modal-scroll')||'[]')[0];expect(region.max).toBeGreaterThan(0);
  const bounds=(await canvas.boundingBox())!;
  await page.mouse.move(bounds.x+(region.x+region.width/2)*bounds.width/360,bounds.y+(region.y+region.height/2)*bounds.height/640);
  await page.mouse.wheel(0,160);
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-modal-scroll')||'[]')[0].offset).toBeGreaterThan(0);
  expect(JSON.parse(await canvas.getAttribute('data-notification-frame')||'{}').footer).toEqual(layout.footer);
});

test('legacy campaign tutorial also uses shared notification art',async({page},info)=>{
  await page.goto('/?mode=campaign');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('aria-label',/Tiệm pizza: start,/);const bounds=(await canvas.boundingBox())!;
  await page.touchscreen.tap(bounds.x+180*bounds.width/360,bounds.y+490*bounds.height/640);
  await variant(page,'one');await visibleCorners(page);
  await canvas.screenshot({path:info.outputPath('notification-legacy.png')});
  const footer=JSON.parse(await canvas.getAttribute('data-notification-frame')||'{}').footer[0];
  await page.touchscreen.tap(bounds.x+(footer.x+footer.width/2)*bounds.width/360,bounds.y+(footer.y+footer.height/2)*bounds.height/640);
  await expect(canvas).toHaveAttribute('data-paused','');
});

test('legacy load failure uses one-button frame and retries without entering gameplay',async({page},info)=>{
  await page.addInitScript(()=>{Object.defineProperty(indexedDB,'open',{configurable:true,value:()=>{throw new Error('Không đọc được bản lưu kiểm tra.');}});});
  await page.goto('/?mode=campaign');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('aria-label',/Tiệm pizza: error,/);await variant(page,'one');await visibleCorners(page);
  const footer=JSON.parse(await canvas.getAttribute('data-notification-frame')||'{}').footer[0],bounds=(await canvas.boundingBox())!;
  await page.touchscreen.tap(bounds.x+(footer.x+footer.width/2)*bounds.width/360,bounds.y+(footer.y+footer.height/2)*bounds.height/640);
  await expect(canvas).toHaveAttribute('aria-label',/Tiệm pizza: error,/);await variant(page,'one');
  await canvas.screenshot({path:info.outputPath('notification-load-error.png')});
});
