import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

async function fixture(page:Page,upgraded=false,ready=false){
  const pathSpecifier:string='node:path';const paths:{resolve(path:string):string}=await import(pathSpecifier);
  const bundled=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';
    const runtime=new CozyRuntime(false,${!ready},{schedule:day=>({day,duration:120,grace:20,slots:[]})});
    ${upgraded?"runtime.dispatch({type:'shop.upgrade',kind:'queue',commandId:'fixture-upgrade'});":''}
    ${ready?"for(const ingredient of ['dough','sauce','cheese'])runtime.dispatch({type:'ingredient',ingredient});runtime.dispatch({type:'bake'});for(let i=0;i<120;i++)runtime.advance(50);runtime.dispatch({type:'extract'});":"runtime.openShop();"}
    const game=new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,backgroundColor:'#382019',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(runtime)]});
    Object.assign(window,{lockTest:{runtime,game}});
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:bundled.outputFiles[0].text});
  await expect(page.locator('canvas')).toHaveAttribute('data-stage',ready?'ready':'assembly');
}
async function controls(page:Page){return JSON.parse(await page.locator('canvas').getAttribute('data-controls')??'[]');}
async function tap(page:Page,id:string){
  await expect.poll(async()=> {
    if(id!=='resume'&&await page.locator('canvas').getAttribute('data-paused')==='gap'){await tap(page,'resume');return false;}
    return (await controls(page)).some((c:{id:string;enabled:boolean})=>c.id===id&&c.enabled);
  }).toBe(true);
  const c=(await controls(page)).find((c:{id:string})=>c.id===id),b=(await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}
async function at(page:Page,x:number,y:number){const b=(await page.locator('canvas').boundingBox())!;await page.touchscreen.tap(b.x+x*b.width/360,b.y+y*b.height/640);}

test('locked queue circles explain upgrades, block covered input and release only their pause',async({page},info)=>{
  await fixture(page);const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-queue-capacity','4');
  const cash=await canvas.getAttribute('data-cash');
  const locks=JSON.parse(await canvas.getAttribute('data-kitchen-art')??'[]').filter((a:{key:string})=>a.key==='pizza-icon-queue-lock');
  expect(locks).toHaveLength(2);
  locks.forEach((a:{x:number;y:number;width:number;height:number},i:number)=>{
    expect(a).toMatchObject({x:262+55*i,y:97,width:26,height:26});
    expect(Math.hypot(a.width/2,a.height/2)).toBeLessThan(21);
  });
  for(const index of [4,5]){
    await tap(page,'queue-locked-'+index);
    await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-labels')??'[]').some((l:{text:string})=>l.text.includes('Hãy nâng cấp cửa hàng để được mở ô hàng chờ.'))).toBe(true);
    await expect(canvas).toHaveAttribute('data-paused','order');
    await at(page,45,514);await expect(canvas).toHaveAttribute('data-ingredients','');
    await expect(canvas).toHaveAttribute('data-express-orders','[]');
    await expect(canvas).toHaveAttribute('data-cash',cash!);await expect(canvas).toHaveAttribute('data-queue-capacity','4');
    await canvas.screenshot({path:info.outputPath('queue-upgrade-notice.png')});
    await tap(page,'queue-upgrade-close');await expect(canvas).toHaveAttribute('data-paused','');
  }
  await canvas.screenshot({path:info.outputPath('locks-and-action-icons.png')});
  await tap(page,'queue-locked-4');
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));
  });
  await tap(page,'queue-upgrade-close');await expect(canvas).toHaveAttribute('data-paused','visibility');
  await tap(page,'resume');await expect(canvas).toHaveAttribute('data-paused','');
  const art=JSON.parse(await canvas.getAttribute('data-kitchen-art')??'[]');
  for(const [index,key] of [[0,'pizza-icon-box'],[1,'pizza-icon-deliver']] as const){
    const icon=art.find((a:{key:string})=>a.key===key);expect(icon).toBeTruthy();
    const left=14+110*index;expect(icon.x-icon.width/2).toBeGreaterThanOrEqual(left);expect(icon.x+icon.width/2).toBeLessThan(left+105);
    expect(icon.y-icon.height/2).toBeGreaterThanOrEqual(406);expect(icon.y+icon.height/2).toBeLessThanOrEqual(438);
    const label=JSON.parse(await canvas.getAttribute('data-labels')??'[]').find((l:{text:string})=>l.text===(index===0?'Đóng hộp':'Giao bánh'));
    expect(label.x).toBeGreaterThan(icon.x+icon.width/2);expect(label.x+label.width).toBeLessThanOrEqual(left+105);
  }
  const actions=await controls(page);expect(actions.find((c:{id:string})=>c.id==='box').enabled).toBe(false);
  expect(actions.find((c:{id:string})=>c.id==='deliver').enabled).toBe(false);
});

test('upgraded queue removes locked-slot controls',async({page})=>{
  await fixture(page,true);await expect(page.locator('canvas')).toHaveAttribute('data-queue-capacity','6');
  expect((await controls(page)).some((c:{id:string})=>c.id.startsWith('queue-locked-'))).toBe(false);
  expect(JSON.parse(await page.locator('canvas').getAttribute('data-kitchen-art')??'[]').some((a:{key:string})=>a.key==='pizza-icon-queue-lock')).toBe(false);
});

test('restored action icons keep enabled boxing and delivery working',async({page},info)=>{
  await fixture(page,false,true);const canvas=page.locator('canvas');
  await tap(page,'box');await expect(canvas).toHaveAttribute('data-stage','boxed');
  await expect.poll(async()=> (await controls(page)).some((c:{id:string;enabled:boolean})=>c.id==='deliver'&&c.enabled)).toBe(true);
  const art=JSON.parse(await canvas.getAttribute('data-kitchen-art')??'[]');
  expect(art.some((a:{key:string})=>a.key==='pizza-icon-box')).toBe(true);
  expect(art.some((a:{key:string})=>a.key==='pizza-icon-deliver')).toBe(true);
  await canvas.screenshot({path:info.outputPath('enabled-delivery-icons.png')});
  await tap(page,'deliver');await expect(canvas).toHaveAttribute('data-stage','delivered');
});
