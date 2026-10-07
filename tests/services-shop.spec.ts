import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';
type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)??'null');}
async function ready(page:Page){await expect.poll(async()=>(await data(page,'save-state'))?.state).toBe('ready');}
async function tap(page:Page,id:string){let c:Control|undefined;await expect.poll(async()=>{c=((await data(page,'controls'))??[]).find((v:Control)=>v.id===id&&v.enabled);return !!c;}).toBe(true);const b=(await page.locator('canvas').boundingBox())!,r=c!;await page.touchscreen.tap(b.x+(r.x+r.width/2)*b.width/360,b.y+(r.y+r.height/2)*b.height/640);await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));}
async function seed(page:Page,lottery=false){
 const moduleName:string='node:path',paths:{resolve:(s:string)=>string}=await import(moduleName);
 const source=`import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';import {CozyCampaignSession} from './src/runtime/CozyCampaignSession';import {CozySaveRepository} from './src/infrastructure/CozySaveRepository';import {lotteryMissionDay} from './src/domain/LotteryMission';(async()=>{let seed=1;while(lotteryMissionDay(seed)!==3)seed++;const initial=new CozyRuntime(false,true,{eventSeed:seed});initial.claimTestCode('VIETVUIVE');if(${lottery}){initial.openShop();initial.closeDay();initial.openNextDay();initial.closeDay();}const repo=new CozySaveRepository(),loaded=await repo.load();const saved=await repo.commit({campaignId:'services-test',commitId:'initial',sourceRevision:0,replacementToken:loaded.replacementToken,payload:initial.exportCheckpoint()});if(!saved.ok)throw Error(saved.message);const session=new CozyCampaignSession(repo),r=await session.load();if(${lottery}){r.openShop();r.advanceElapsed(5000);}(window as any).servicesFixture={r,session};new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(r,undefined,undefined,undefined,session.lifecycle,session)]});})();`;
 const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:source},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
 await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{height:100%;width:100%}</style><div id="fixture"></div>');await page.addScriptTag({content:bundle.outputFiles[0].text});await ready(page);
}
test('paid advertising reveals actual seeded forecast once and survives reload',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page);
 const before=await page.evaluate(()=>{const r=(window as any).servicesFixture.r;return {cash:r.state.cash,forecast:r.marketForecast};});
 expect((await data(page,'advertising')).forecast).toBeNull();await tap(page,'summary-tab-shop');await tap(page,'shop-section-expansion');await tap(page,'shop-advertising');await tap(page,'advertising-buy');await ready(page);
 const ad=await data(page,'advertising');expect(ad.bought).toBe(true);expect(ad.forecast.total).toBe(ad.forecast.shopVisits+ad.forecast.appOrders);
 expect(await page.evaluate(()=>{const r=(window as any).servicesFixture.r;return {cash:r.state.cash,forecast:r.marketForecast};})).toEqual({cash:before.cash-100,forecast:before.forecast});
 await tap(page,'shop-advertising');expect((await data(page,'controls')).find((c:Control)=>c.id==='advertising-buy').enabled).toBe(false);await page.locator('canvas').screenshot({path:info.outputPath('advertising-forecast.png')});await tap(page,'advertising-close');
 await page.unroute('**/assets/index-*.js');await page.goto('/?mode=shop');await ready(page);await expect.poll(()=>data(page,'advertising')).toMatchObject({bought:true,forecast:ad.forecast});expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(before.cash-100);expect(errors).toEqual([]);
});
test('homeless lottery choice pauses shift and pays all five tickets only once at day end',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,true);await expect.poll(()=>data(page,'lottery')).not.toBeNull();
 const before=await page.evaluate(()=>{const r=(window as any).servicesFixture.r;const clock=r.shiftClock;r.advanceElapsed(10000);return {cash:r.state.cash,frozen:JSON.stringify(clock)===JSON.stringify(r.shiftClock),orders:r.tickets.length};});expect(before.frozen).toBe(true);expect(before.orders).toBe(0);
 await page.locator('canvas').screenshot({path:info.outputPath('lottery-choice.png')});await tap(page,'lottery-5');await expect.poll(()=>data(page,'lottery')).toBeNull();
 expect(await page.evaluate(()=>{const r=(window as any).servicesFixture.r;return [r.state.cash,r.resolveLottery(5)];})).toEqual([before.cash-150,false]);
 expect(await page.evaluate(()=>(window as any).servicesFixture.session.closeDay())).toBe(true);await ready(page);
 const result=await page.evaluate(()=>{const {r,session}=(window as any).servicesFixture;const cash=r.state.cash;return {summary:r.daySummary,cash,repeat:session.closeDay(),same:r.state.cash===cash};});
 expect(result.summary.lotteryPrize).toBe(1500);expect(result.summary.rewards).toBe(1500);expect(result.summary.accounts.serviceCosts).toBe(150);expect(result.repeat).toBe(false);expect(result.same).toBe(true);
 await page.unroute('**/assets/index-*.js');await page.goto('/?mode=shop');await ready(page);expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(result.cash);expect(await data(page,'lottery')).toBeNull();expect(errors).toEqual([]);
});



