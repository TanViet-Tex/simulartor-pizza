import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

type Label={text:string;x:number;y:number;width:number;height:number};
type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
const data=(page:Page,key:string)=>page.locator('canvas').getAttribute('data-'+key).then(value=>JSON.parse(value||'null'));
async function tap(page:Page,id:string){
  const c=(await data(page,'controls') as Control[]).find(c=>c.id===id&&c.enabled)!;
  expect(c,`${id} enabled`).toBeTruthy();const b=(await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);await page.clock.runFor(300);
}
test('HUD clock stays beside Pause and shows preparation, opening, closed status and a paused grace countdown',async({page},info)=>{
  test.setTimeout(180000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install();
  const specifier:string='node:path';const paths=await import(specifier);
  const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';
    let runtime=new CozyRuntime(false,true,{eventSeed:2718,eventRoll:()=>1,vipRoll:()=>1});runtime.claimTestCode('VIETVUIVE');
    for(let day=1;day<6;day++){day===1?runtime.openShop():runtime.openNextDay();runtime.closeDay();}runtime.configureDeliveryApp(true,'app');runtime=CozyRuntime.restoreCheckpoint(runtime.exportCheckpoint(),false,{eventRoll:()=>1,vipRoll:()=>1})!;
    for(const id of ['dough','sauce','cheese','mushroom'] as const)runtime.buy(id,2);
    Object.assign(window,{shiftClockFixture:runtime});
    new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(runtime)]});
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addInitScript(()=>{window.requestAnimationFrame=callback=>window.setTimeout(()=>callback(performance.now()),100);window.cancelAnimationFrame=handle=>window.clearTimeout(handle);});
  await page.evaluate(()=>{window.requestAnimationFrame=callback=>window.setTimeout(()=>callback(performance.now()),100);window.cancelAnimationFrame=handle=>window.clearTimeout(handle);});
  await page.addScriptTag({content:bundle.outputFiles[0].text});await expect(page.locator('canvas')).toHaveAttribute('data-booted','true');
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  await tap(page,'summary-open-first-day');
  const clock=(await data(page,'labels') as Label[]).find(l=>l.text==='08:50')!;
  const pause=(await data(page,'controls') as Control[]).find(c=>c.id==='pause')!;
  expect(clock.x).toBeGreaterThanOrEqual(pause.x+pause.width);expect(clock.x+clock.width).toBeLessThan(130);
  expect(await data(page,'tickets')).toEqual([]);await page.locator('canvas').screenshot({path:info.outputPath('preparation-clock.png')});
  await tap(page,'pause');const frozen=await data(page,'shift-clock');await page.clock.runFor(10000);expect(await data(page,'shift-clock')).toEqual(frozen);await tap(page,'resume');
  await page.clock.runFor(5000);expect((await data(page,'shift-clock')).phase).toBe('serving');expect((await data(page,'shift-clock')).attempted).toBeGreaterThan(0);
  // Runtime boundary coverage is in CozySchedule.test; skip thousands of GPU frames here.
  expect(await page.evaluate(()=>{const r=(window as any).shiftClockFixture;r.advanceElapsed((r.shiftClock.duration-r.shiftClock.elapsed-.05)*1000);const t=r.tickets.find((t:any)=>t.source==='shop');r.selectTicket(t.id);for(const ingredient of ['dough','sauce','cheese',...(r.selectedRecipe==='mushroom'?['mushroom']:[])])r.dispatch({type:'ingredient',ingredient});const baked=r.dispatch({type:'bake'});r.advanceElapsed(50);return baked;})).toBe(true);
  await page.clock.runFor(300);expect(await data(page,'shift-clock')).toMatchObject({phase:'grace',displayTime:'21:00'});
  const labels=await data(page,'labels') as Label[],closed=labels.find(l=>l.text==='Đã đóng cửa · xử lý đơn còn lại')!,countdown=labels.find(l=>/^\d{1,2}:\d{2}$/.test(l.text)&&l.x>200)!;
  expect(countdown).toBeTruthy();expect(closed.x+closed.width).toBeLessThan(countdown.x);expect(closed.y+closed.height).toBeLessThanOrEqual(38);expect(countdown.y+countdown.height).toBeLessThanOrEqual(38);
  expect(labels.some(l=>l.text.startsWith('Lò 1 · '))).toBe(true);
  await page.locator('canvas').screenshot({path:info.outputPath('closed-clock.png')});const attempted=(await data(page,'shift-clock')).attempted;
  await tap(page,'pause');const grace=await data(page,'shift-clock');await page.clock.runFor(10000);expect(await data(page,'shift-clock')).toEqual(grace);await tap(page,'resume');await page.clock.runFor(1000);
  expect((await data(page,'shift-clock')).remaining).toBeLessThan(grace.remaining);expect((await data(page,'shift-clock')).attempted).toBe(attempted);expect(errors).toEqual([]);
});
