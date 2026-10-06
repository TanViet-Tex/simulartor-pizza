import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

async function tap(page:Page,id:string,menu=false){
  const canvas=page.locator('canvas'),attr=menu?'data-menu-targets':'data-controls';
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute(attr)??'[]').some((c:any)=>c.id===id&&(menu?!c.disabled:c.enabled))).toBe(true);
  const c=JSON.parse(await canvas.getAttribute(attr)??'[]').find((c:any)=>c.id===id),b=(await canvas.boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}
async function corner(page:Page){
  const png=await page.locator('canvas').screenshot();
  return page.evaluate(async encoded=>{
    const image=new Image();image.src='data:image/png;base64,'+encoded;await image.decode();
    const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d')!;ctx.drawImage(image,0,0);
    return Array.from(ctx.getImageData(10*image.width/360,60*image.height/640,1,1).data).slice(0,3);
  },png.toString('base64'));
}
function gentleDim(before:number[],after:number[]){
  expect(before.reduce((a,b)=>a+b,0)).toBeGreaterThan(20);
  before.forEach((value,i)=>{expect(after[i]).toBeGreaterThanOrEqual(value*.67-3);expect(after[i]).toBeLessThanOrEqual(value*.75+3);});
}

test('all five hub labels and coin amount fit; purchase veil is gently dimmed once and blocks the hub',async({page},info)=>{
  await page.goto('/?mode=shop');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-screen','preparation-hub',{timeout:15000});
  for(const tab of ['summary','market','stock','shop','missions']){
    await tap(page,'summary-tab-'+tab);
    const labels=JSON.parse(await canvas.getAttribute('data-hub-header-labels')??'[]');
    expect(labels[2]).toBe(await canvas.getAttribute('data-cash'));expect(labels[2]).not.toContain('xu');
    const targets=JSON.parse(await canvas.getAttribute('data-controls')??'[]').filter((c:any)=>c.id.startsWith('summary-tab-'));
    expect(targets).toHaveLength(5);expect(targets.every((c:any)=>c.y>=70&&c.y+c.height<=125)).toBe(true);
    await canvas.screenshot({path:info.outputPath('hub-'+tab+'.png')});
  }
  await tap(page,'summary-tab-market');const before=await corner(page),cash=await canvas.getAttribute('data-cash');
  await tap(page,'market-buy-dough');await expect(canvas).toHaveAttribute('data-paused',/order/);
  gentleDim(before,await corner(page));
  const b=(await canvas.boundingBox())!;await page.touchscreen.tap(b.x+180*b.width/360,b.y+95*b.height/640);
  await expect(canvas).toHaveAttribute('data-summary-tab','market');await expect(canvas).toHaveAttribute('data-cash',cash!);
  await canvas.screenshot({path:info.outputPath('purchase-dim.png')});
  await tap(page,'market-purchase-cancel');await expect(canvas).toHaveAttribute('data-paused','');
});

test('Menu and Pause share settings, geometry and live audio preferences without resuming behind them',async({page},info)=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/?mode=freeplay');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-screen','game');
  expect(JSON.parse(await canvas.getAttribute('data-labels')??'[]').some((label:any)=>label.text==='300 xu')).toBe(false);
  await tap(page,'dough');await tap(page,'pause');await tap(page,'main-menu');
  const behindStart=JSON.parse(await canvas.getAttribute('data-menu-targets')??'[]').find((c:any)=>c.id==='menu-start');
  await tap(page,'menu-settings',true);
  const menuBounds=(await canvas.boundingBox())!;
  await page.touchscreen.tap(menuBounds.x+(behindStart.x+2)*menuBounds.width/360,menuBounds.y+(behindStart.y+behindStart.height-2)*menuBounds.height/640);
  await expect(canvas).toHaveAttribute('data-menu-dialog','settings');
  await canvas.focus();await page.keyboard.press('Tab');await page.keyboard.press('Enter');
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-settings-panel'))||'{}').muted).toBe(true);
  await tap(page,'menu-motion',true);
  await expect(canvas).toHaveAttribute('data-menu-reduced-motion','true');
  const menuSettings=await canvas.getAttribute('data-settings-panel'),menuFrame=await canvas.getAttribute('data-notification-frame');
  expect(menuSettings).toBeTruthy();
  const rendered=JSON.parse(menuSettings!);expect(rendered.musicAvailable).toBe(false);expect(rendered.motionEnabled).toBe(false);
  const menuTargets=JSON.parse(await canvas.getAttribute('data-menu-targets')??'[]');
  for(const id of ['menu-music','menu-music-choice'])expect(menuTargets.find((c:any)=>c.id===id).disabled).toBe(true);
  const active=menuTargets.filter((c:any)=>!c.disabled);
  active.forEach((c:any)=>{expect(c.width*menuBounds.width/360).toBeGreaterThanOrEqual(48);expect(c.height*menuBounds.height/640).toBeGreaterThanOrEqual(48);});
  for(let i=0;i<active.length;i++)for(let j=i+1;j<active.length;j++){const a=active[i],z=active[j];expect(a.x+a.width<=z.x||z.x+z.width<=a.x||a.y+a.height<=z.y||z.y+z.height<=a.y).toBe(true);}
  if(info.project.name==='chromium-360x640')await canvas.screenshot({path:'_bmad-output/implementation-artifacts/ui-baseline/reference-settings-menu-2026-10-06.png'});
  const beforeTargets=JSON.parse(await canvas.getAttribute('data-menu-targets')??'[]');
  const b=(await canvas.boundingBox())!;await page.touchscreen.tap(b.x+180*b.width/360,b.y+615*b.height/640);
  await expect(canvas).toHaveAttribute('data-menu-dialog','settings');
  await tap(page,'menu-settings-close',true);await tap(page,'menu-continue',true);await tap(page,'pause');await tap(page,'pause-settings');
  await expect(canvas).toHaveAttribute('data-paused',/user/);await expect(canvas).toHaveAttribute('data-settings-panel',menuSettings!);
  expect(await canvas.getAttribute('data-notification-frame')).toBe(menuFrame);
  const pauseTargets=JSON.parse(await canvas.getAttribute('data-controls')??'[]');
  for(const suffix of ['mute','motion']){
    const a=beforeTargets.find((c:any)=>c.id==='menu-'+suffix),z=pauseTargets.find((c:any)=>c.id===(suffix==='mute'?'mute':'settings-motion'));
    expect({x:z.x,y:z.y,width:z.width,height:z.height}).toEqual({x:a.x,y:a.y,width:a.width,height:a.height});
    expect(z.width*b.width/360).toBeGreaterThanOrEqual(48);expect(z.height*b.height/640).toBeGreaterThanOrEqual(48);
  }
  await expect(canvas).toHaveAttribute('data-ingredients','dough');
  const clock=JSON.parse(await canvas.getAttribute('data-shift-clock')??'null');
  await page.waitForTimeout(300);expect(JSON.parse(await canvas.getAttribute('data-shift-clock')??'null')).toEqual(clock);
  if(info.project.name==='chromium-360x640')await canvas.screenshot({path:'_bmad-output/implementation-artifacts/ui-baseline/reference-settings-pause-2026-10-06.png'});
  const oldMuted=JSON.parse((await canvas.getAttribute('data-settings-panel'))||'{}').muted;
  await canvas.focus();await page.keyboard.press('Tab');await page.keyboard.press('Enter');
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-settings-panel'))||'{}').muted).toBe(!oldMuted);
  await page.keyboard.press('Escape');await expect(canvas).toHaveAttribute('data-paused',/user/);
  await expect(canvas).toHaveAttribute('data-settings-panel','');
  await tap(page,'resume');await expect(canvas).toHaveAttribute('data-paused','');
  await page.reload();await expect(canvas).toHaveAttribute('data-screen','game');
  await tap(page,'pause');await tap(page,'pause-settings');
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-settings-panel')??'{}').motionEnabled).toBe(false);
});

test('automatic end-day notice retains a visible dim background and waits for acknowledgement',async({page},info)=>{
  const pathSpecifier:string='node:path';const paths:{resolve(path:string):string}=await import(pathSpecifier);
  const bundled=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';
    const runtime=new CozyRuntime(false,true,{schedule:day=>({day,duration:120,grace:20,slots:[]})});runtime.openShop();
    new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(runtime)]});Object.assign(window,{noticeRuntime:runtime});
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:bundled.outputFiles[0].text});const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-screen','game');
  await tap(page,'pause');const paused=await corner(page);await tap(page,'resume');
  await page.evaluate(()=>{const runtime=(window as unknown as {noticeRuntime:any}).noticeRuntime;for(let i=0;i<2800;i++)runtime.advance(50);});
  await expect(canvas).toHaveAttribute('data-screen','day-ended-notice',{timeout:15000});
  const automatic=await corner(page);automatic.forEach((value,i)=>expect(Math.abs(value-paused[i])).toBeLessThanOrEqual(3));
  expect(automatic.reduce((a,b)=>a+b,0)).toBeGreaterThan(20);
  await canvas.screenshot({path:info.outputPath('automatic-notice-dim.png')});
  const b=(await canvas.boundingBox())!;await page.touchscreen.tap(b.x+25*b.width/360,b.y+615*b.height/640);
  await expect(canvas).toHaveAttribute('data-screen','day-ended-notice');
  await tap(page,'day-ended-understood');await expect(canvas).toHaveAttribute('data-screen','day-summary');
});
