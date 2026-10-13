import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

test.setTimeout(90000);
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)??'null');}
async function tap(page:Page,id:string){
  await expect.poll(async()=>((await data(page,'controls'))??[]).some((c:any)=>c.id===id&&c.enabled)).toBe(true);
  const c=(await data(page,'controls')).find((c:any)=>c.id===id),b=(await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}
async function fixture(page:Page,bargain=false){
  const moduleName:string='node:path',paths=await import(moduleName);
  const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';
    import {requestedDrink} from './src/domain/DrinkStock';import {STAFF_ROLES} from './src/config/staffCatalog';import {PlayLifecycle} from './src/runtime/PlayLifecycle';
    const requests=${bargain?"['water',null,null]":"[null,'water','cola','orange',null,'water','cola','orange']"};
    const slots=requests.map((drink,i)=>{let n=0;while(requestedDrink(321,4,'staff-canvas-'+i+'-'+n)!==drink)n++;return {id:'staff-canvas-'+i+'-'+n,at:${bargain?'i*2':'i*12'},kind:${bargain?"i===0?'bargain':'regular'":"'regular'"},opportunity:'commercial',commercialOrdinal:i+1,takeaway:true};});
    const deps={eventSeed:321,eventRoll:()=>1,vipRoll:()=>1,resolveRecipe:()=> 'cheese',schedule:day=>({day,duration:240,grace:120,slots:day<4?[]:slots})};
    let r=new CozyRuntime(false,true,deps);for(let day=1;day<=3;day++){if(!(day===1?r.openShop():r.openNextDay()))throw Error('Cannot open fixture day '+day);r.resolveLottery(0);if(!r.closeDay())throw Error('Cannot close fixture day '+day);}r=CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,deps);
    r.claimTestCode('VIETVUIVE');r.configureMenu('mushroom',100,false);for(const role of STAFF_ROLES)if(!r.hireStaff(role,'fixture-hire-'+role))throw Error('Hire failed');
    for(const id of ['dough','sauce','cheese'])r.buy(id,20);for(const id of ['water','cola','orange'])r.buyDrink(id,5,'fixture-drink-'+id);
    const lifecycle=new PlayLifecycle(r,()=>0);lifecycle.frame=()=>lifecycle.reconcile();const scene=new CozyScene(r,undefined,undefined,undefined,lifecycle);
    Object.assign(window,{staffHandoff:{r}});
    new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[scene]});
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:bundle.outputFiles[0].text});await expect(page.locator('canvas')).toHaveAttribute('data-screen','preparation-hub',{timeout:30000});
  await page.evaluate(()=>(window as any).staffHandoff.r.setSpecialPresentation(false));
  await tap(page,'summary-open-first-day');await expect(page.locator('canvas')).toHaveAttribute('data-screen','game');
}

test('four staff keep delivering a sequence of boxed pizzas and all three drinks without manual handoff',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page);
  for(let i=0;i<8;i++){
    const progress=await page.evaluate(()=>{const r=(window as any).staffHandoff.r;r.advanceElapsed(12000);return {delivered:r.events.filter((e:string)=>e.includes(':delivered:')).length,board:r.productionOwnerId,drinks:r.drinkStock.map((d:any)=>d.quantity)};});
    expect(progress.delivered).toBe(i+1);expect(progress.board).toBeNull();
  }
  const report=await page.evaluate(()=>{const r=(window as any).staffHandoff.r;const quantities=r.drinkStock.map((d:any)=>d.quantity),closed=r.closeDay();return {closed,quantities,report:r.daySummary};});
  expect(report.closed).toBe(true);expect(report.quantities).toEqual([3,3,3]);expect(report.report).toMatchObject({delivered:8,pizzasSold:8,revenue:630,drinkCost:60});
  await page.locator('canvas').screenshot({path:info.outputPath('staff-eight-orders-complete.png')});expect(errors).toEqual([]);
});

for(const accept of [true,false])test(`staff opens the bargain choice and resumes after player ${accept?'accepts':'refuses'}`,async({page},info)=>{
  await fixture(page,true);
  const selected=await page.evaluate(()=>{const r=(window as any).staffHandoff.r;r.advanceElapsed(5000);const id=r.tickets[2].id;r.selectTicket(id);r.advanceElapsed(12000);return id;});
  await expect.poll(()=>data(page,'bargain')).not.toBeNull();expect(await page.locator('canvas').getAttribute('data-paused')).toContain('bargain');
  const before=await page.evaluate(()=>{const r=(window as any).staffHandoff.r;return {cash:r.state.cash,water:r.drinkStock.find((d:any)=>d.id==='water').quantity};});expect(before.water).toBe(4);
  await page.evaluate(()=>(window as any).staffHandoff.r.advanceElapsed(10000));expect(await page.evaluate(()=>(window as any).staffHandoff.r.state.cash)).toBe(before.cash);
  await page.locator('canvas').screenshot({path:info.outputPath('staff-bargain-choice.png')});await tap(page,accept?'accept-bargain':'reject-bargain');
  await expect.poll(()=>page.evaluate(()=>(window as any).staffHandoff.r.bargainPending)).toBeNull();
  expect(await page.evaluate(()=>(window as any).staffHandoff.r.selectedTicketId)).toBe(selected);
  const after=await page.evaluate(()=>{const r=(window as any).staffHandoff.r;r.advanceElapsed(30000);return {orders:r.tickets.length,water:r.drinkStock.find((d:any)=>d.id==='water').quantity,closed:r.closeDay(),report:r.daySummary};});
  expect(after.orders).toBe(0);expect(after.water).toBe(4);expect(after.closed).toBe(true);expect(after.report.delivered).toBe(3);expect(after.report.drinkCost).toBe(8);
});
