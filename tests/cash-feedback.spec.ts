import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

async function fixture(page:Page){
  const pathSpecifier='node:path',paths=await import(pathSpecifier);
  const fixture=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';
    import {PlayAudio} from './src/presentation/PlayAudio';import {MenuPreferences} from './src/presentation/MenuPreferences';
    const runtime=new CozyRuntime(false,true),preferences=new MenuPreferences();preferences.setReducedMotion(false);
    let payments=0;const media=[];
    const audio=new PlayAudio(()=>{throw Error('native media fixture')},url=>{const m={src:url,loop:false,preload:'',volume:1,currentTime:0,paused:true,muted:false,
      play(){this.paused=false;if(decodeURIComponent(this.src).endsWith('thanh toán.mp3'))payments++;return Promise.resolve()},pause(){this.paused=true},removeAttribute(){this.src=''},load(){}};media.push(m);return m;});
    const scene=new CozyScene(runtime,preferences,undefined,audio);
    const game=new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[scene]});
    Object.assign(window,{cashFixture:{runtime,preferences,audio,scene,game,get payments(){return payments}}});
  `},bundle:true,platform:'browser',format:'iife',define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.clock.install();
  await page.addScriptTag({content:fixture.outputFiles[0].text});await expect(page.locator('canvas')).toHaveAttribute('data-booted','true');
  await page.evaluate(()=>(window as any).cashFixture.audio.interact());
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
}
const snapshot=(page:Page)=>page.evaluate(()=>(window as any).cashFixture.scene.cashFeedback?.snapshot??[]);

test('cash receipts survive redraw, stack without overlap, fade once and follow reduced motion',async({page},info)=>{
  test.setTimeout(60000);await fixture(page);
  await page.evaluate(()=>{const f=(window as any).cashFixture;f.runtime.buy('dough',1,'one');f.runtime.buy('cheese',1,'two');f.runtime.claimTestCode('VIETVUIVE');});
  await page.clock.runFor(50);let effects=await snapshot(page);
  expect(effects).toHaveLength(3);expect(effects.map((e:any)=>e.id)).toEqual([1,2,3]);
  expect(effects[0].amount).toBeLessThan(0);expect(effects[0].color).toBe('#ff7474');
  expect(effects[2]).toMatchObject({amount:100000,text:'+100000 xu',color:'#75e96a'});
  expect(new Set(effects.map((e:any)=>e.startY)).size).toBe(3);
  expect(effects[1].startY-effects[0].startY).toBe(32);
  for(let i=1;i<effects.length;i++)expect(effects[i].bounds.y).toBeGreaterThanOrEqual(effects[i-1].bounds.y+effects[i-1].bounds.height);
  const paid=await page.evaluate(()=>(window as any).cashFixture.payments);expect(paid).toBeGreaterThan(0);expect(paid).toBeLessThanOrEqual(3);
  await page.evaluate(()=>{const f=(window as any).cashFixture;f.scene.draw();f.scene.draw();f.runtime.buy('dough',1,'one');f.runtime.claimTestCode('VIETVUIVE');});
  await page.clock.runFor(350);effects=await snapshot(page);expect(effects).toHaveLength(3);
  for(const effect of effects){expect(effect.y).toBeLessThan(effect.startY);expect(effect.alpha).toBeLessThan(1);}
  expect(await page.evaluate(()=>(window as any).cashFixture.payments)).toBe(paid);
  await page.screenshot({path:info.outputPath('cash-feedback.png')});
  await page.clock.runFor(750);expect(await snapshot(page)).toEqual([]);
  await page.evaluate(()=>(window as any).cashFixture.runtime.buy('dough',1,'stagger-a'));
  await page.clock.runFor(350);
  await page.evaluate(()=>(window as any).cashFixture.runtime.buy('dough',1,'stagger-b'));
  await page.clock.runFor(700);
  await page.evaluate(()=>(window as any).cashFixture.runtime.buy('dough',1,'stagger-c'));
  await page.clock.runFor(50);effects=(await snapshot(page)).sort((a:any,b:any)=>a.bounds.y-b.bounds.y);
  expect(effects).toHaveLength(2);expect(effects[1].bounds.y).toBeGreaterThanOrEqual(effects[0].bounds.y+effects[0].bounds.height);
  await page.clock.runFor(1050);expect(await snapshot(page)).toEqual([]);
  await page.evaluate(()=>{const f=(window as any).cashFixture;f.preferences.setReducedMotion(true);f.runtime.buy('dough',1,'reduced');});
  await page.clock.runFor(400);effects=await snapshot(page);expect(effects).toHaveLength(1);
  expect(effects[0].reducedMotion).toBe(true);expect(effects[0].y).toBe(effects[0].startY);expect(effects[0].alpha).toBeLessThan(1);
  const beforeStop=await page.evaluate(()=>(window as any).cashFixture.payments);
  await page.evaluate(()=>{const f=(window as any).cashFixture;f.feedback=f.scene.cashFeedback;f.scene.scene.stop();});
  await page.clock.runFor(50);
  await page.evaluate(()=>(window as any).cashFixture.runtime.buy('dough',1,'after-stop'));
  expect(await page.evaluate(()=>(window as any).cashFixture.feedback.snapshot)).toEqual([]);
  expect(await page.evaluate(()=>(window as any).cashFixture.payments)).toBe(beforeStop);
});
