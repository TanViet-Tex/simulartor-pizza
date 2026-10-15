import {scrollCanvasList} from './helpers/listGestures';
import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';
test.setTimeout(120000);
type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)??'null');}
async function tap(page:Page,id:string){let c:Control|undefined;await expect.poll(async()=>{c=((await data(page,'controls'))??[]).find((v:Control)=>v.id===id&&v.enabled);return !!c;}).toBe(true);const b=(await page.locator('canvas').boundingBox())!,r=c!;await page.touchscreen.tap(b.x+(r.x+r.width/2)*b.width/360,b.y+(r.y+r.height/2)*b.height/640);}
async function seed(page:Page,open=false,wanted:'water'|'cola'|'orange'='cola',prepDay=4,twoCustomers=false){
 const pathModule:string='node:path',paths:{resolve:(s:string)=>string}=await import(pathModule);
 const source=`import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';import {requestedDrink} from './src/domain/DrinkStock';import {CozySaveRepository} from './src/infrastructure/CozySaveRepository';import {CozyCampaignSession} from './src/runtime/CozyCampaignSession';(async()=>{const deps={eventSeed:321,eventRoll:()=>1,schedule:day=>{let n=0;while(requestedDrink(321,4,'drink-ui-'+n)!=='${wanted}')n++;return {day,duration:180,grace:120,slots:day<4?[]:[{id:'drink-ui-'+n,at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:false},...(${twoCustomers}?[{id:'drink-second',at:1,kind:'regular',opportunity:'commercial',commercialOrdinal:2,takeaway:false}]:[])]};}};let r=new CozyRuntime(false,true,deps);for(let day=1;day<${prepDay};day++){if(!(day===1?r.openShop():r.openNextDay()))throw Error('Cannot open fixture day '+day);r.resolveLottery(0);if(!r.closeDay())throw Error('Cannot close fixture day '+day);}r=CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,deps);r.claimTestCode('VIETVUIVE');r.configureMenu('mushroom',100,false);for(const id of ['dough','sauce','cheese'])r.buy(id,2);if(${open}){for(const id of ['water','cola','orange'])r.buyDrink(id,2,'fixture-'+id);r.openShop();r.pause('user');}let session;if(!${open}){const repo=new CozySaveRepository(),loaded=await repo.load();const saved=await repo.commit({campaignId:'drinks-ui-${prepDay}',commitId:'prep',sourceRevision:0,replacementToken:loaded.replacementToken,payload:r.exportCheckpoint()});if(!saved.ok)throw Error(saved.message);session=new CozyCampaignSession(repo);r=await session.load();}(window as any).drinksFixture={r,session};new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(r,undefined,undefined,undefined,session?.lifecycle,session)]});})();`;
 const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:source},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
 await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{height:100%;width:100%}</style><div id="fixture"></div>');await page.addScriptTag({content:bundle.outputFiles[0].text});await expect.poll(()=>data(page,'controls'),{timeout:30000}).not.toBeNull();
}
for(const drink of ['water','cola','orange'] as const)test(`${drink} order attaches only requested bottle once, then pizza and drink settle once`,async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,true,drink);
 await page.evaluate(()=>{const r=(window as any).drinksFixture.r;r.resume('user');});
 await expect.poll(async()=>((await data(page,'controls'))??[]).filter((c:Control)=>/^drink-(water|cola|orange)$/.test(c.id)).length).toBe(3);
 expect(await page.evaluate(()=>{const r=(window as any).drinksFixture.r;return r.selectedTicket.drink;})).toBe(drink);
 expect(await page.evaluate(wanted=>{const r=(window as any).drinksFixture.r;return r.attachDrink(wanted==='water'?'cola':'water');},drink)).toBe(false);
 await tap(page,'drink-'+drink);
 await expect.poll(()=>data(page,'workbench-drink')).toMatchObject({drink});
 expect(await page.evaluate(wanted=>{const r=(window as any).drinksFixture.r;return [r.selectedTicket.drinkAttached,r.drinkStock.find((d:any)=>d.id===wanted).quantity,r.attachDrink(wanted)];},drink)).toEqual([true,1,false]);
 expect((await data(page,'drink-cells')).map((d:any)=>d.name)).toEqual(['Nước suối','Coca','Nước cam']);
 await page.locator('canvas').screenshot({path:info.outputPath('three-drinks.png')});
 await page.evaluate(()=>{const r=(window as any).drinksFixture.r;for(const ingredient of ['dough','sauce','cheese'])r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});r.advanceElapsed(4000);r.dispatch({type:'extract'});r.dispatch({type:'box'});});
 await expect.poll(()=>data(page,'workbench-drink')).toMatchObject({drink});
 await page.locator('canvas').screenshot({path:info.outputPath('boxed-pizza-and-drink.png')});
 const result=await page.evaluate(()=>{const r=(window as any).drinksFixture.r;const before=r.state.cash,id=r.selectedTicketId;const delivered=r.dispatch({type:'deliver',commandId:'drink-ui-delivery'});const cash=r.state.cash,repeat=r.dispatch({type:'deliver',sourceId:id,targetId:id,commandId:'drink-ui-delivery'});r.closeDay();return {delivered,repeat,received:cash-before,summary:r.daySummary};});
 await expect.poll(()=>data(page,'workbench-drink')).toBeNull();
 const sale={water:20,cola:25,orange:30}[drink];expect(result.delivered).toBe(true);expect(result.repeat).toBe(false);expect(result.received).toBe(60+sale);expect(result.summary.revenue).toBe(60+sale);expect(result.summary.reviews[0].soldDrink).toEqual({id:drink,price:sale});expect(result.summary.accounts.inventory.drinks[drink]).toBe(1);expect(errors).toEqual([]);
});
test('inspecting another customer keeps the bottle with the pizza owning the board',async({page})=>{
 await seed(page,true,'cola',4,true);
 await page.evaluate(()=>{const r=(window as any).drinksFixture.r;r.resume('user');r.setSpecialPresentation(false);});
 await tap(page,'drink-cola');
 const owner=await page.evaluate(()=>{const r=(window as any).drinksFixture.r;const id=r.selectedTicketId;r.dispatch({type:'ingredient',ingredient:'dough'});r.advanceElapsed(2000);return id;});
 expect(await page.evaluate(()=>{const r=(window as any).drinksFixture.r;const other=r.tickets.find((t:any)=>t.id!==r.productionOwnerId);return !!other&&r.selectTicket(other.id);})).toBe(true);
 await expect.poll(()=>data(page,'workbench-drink')).toMatchObject({ticketId:owner,drink:'cola'});
 expect(await page.evaluate(()=>(window as any).drinksFixture.r.selectedTicketId)).not.toBe(owner);
});

test('market locks all drinks before day four and enables their first purchase on day four',async({page})=>{
 for(const day of [1,3,4]){
  await seed(page,false,'cola',day);await tap(page,'summary-tab-market');await tap(page,'market-filter-drink');
  const rows=await data(page,'market-rows');expect(rows).toHaveLength(3);expect(rows.every((row:any)=>row.unlocked===(day>=4))).toBe(true);
  const controls=(await data(page,'controls')).filter((c:Control)=>/^market-buy-(water|cola|orange)$/.test(c.id));expect(controls).toHaveLength(3);expect(controls.every((c:Control)=>c.enabled===(day>=4))).toBe(true);
  expect(await page.evaluate(()=>(window as any).drinksFixture.r.preparationDay)).toBe(day);
  if(day===4){
   const before=await page.evaluate(()=>(window as any).drinksFixture.r.state.cash);await tap(page,'market-buy-water');
   await expect.poll(()=>page.evaluate(()=>(window as any).drinksFixture.session.view.state)).toBe('ready');
   expect(await page.evaluate(()=>{const r=(window as any).drinksFixture.r;return {cash:r.state.cash,quantity:r.drinkStock.find((d:any)=>d.id==='water').quantity};})).toEqual({cash:before-8,quantity:1});
  }
 }
});

test('market separates three labeled drinks, purchases quantities and restores bottle stock',async({page},info)=>{
 await seed(page);await tap(page,'summary-tab-shop');await tap(page,'shop-section-equipment');
 expect((await data(page,'shop-screen-cards')).map((c:any)=>c.id)).toEqual(['oven','fridge']);expect((await data(page,'controls')).some((c:Control)=>c.id==='shop-drinks-stock')).toBe(false);
 await tap(page,'summary-tab-market');await tap(page,'market-filter-drink');
 expect((await data(page,'market-rows')).map((r:any)=>r.name)).toEqual(['Nước suối','Coca','Nước cam']);
 const before=await page.evaluate(()=>(window as any).drinksFixture.r.state.cash);
 for(const id of ['water','cola','orange']){await tap(page,'market-plus-'+id);await tap(page,'market-buy-'+id);await expect.poll(()=>page.evaluate(()=>(window as any).drinksFixture.session.view.state)).toBe('ready');}
 expect(await page.evaluate(()=>{const r=(window as any).drinksFixture.r;return {spent:r.state.cash,quantities:r.drinkStock.map((d:any)=>d.quantity)};})).toEqual({spent:before-60,quantities:[2,2,2]});
 await page.locator('canvas').screenshot({path:info.outputPath('drink-stock-preparation.png')});
 await tap(page,'market-filter-all');expect((await data(page,'controls')).filter((c:Control)=>/^market-buy-(water|cola|orange)$/.test(c.id)).every((c:Control)=>!c.enabled)).toBe(true);
 const bounds=(await page.locator('canvas').boundingBox())!;await scrollCanvasList(page,180,384,10000);await expect.poll(async()=>(await data(page,'market-scroll')).offset).toBe((22*53)-318);
 const drinkControls=(await data(page,'controls')).filter((c:Control)=>/^market-buy-(water|cola|orange)$/.test(c.id));expect(drinkControls).toHaveLength(3);expect(drinkControls.every((c:Control)=>c.enabled&&c.y>=21.6+219*.88&&c.y+c.height<=21.6+537*.88)).toBe(true);
 const control=drinkControls.find((c:Control)=>c.id==='market-buy-water')!;const x=bounds.x+(control.x+control.width/2)*bounds.width/360,y=bounds.y+(control.y+control.height/2)*bounds.height/640;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x,y-120,{steps:4});await page.mouse.up();expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(before-60);
 await page.unroute('**/assets/index-*.js');await page.goto('/?mode=shop');await expect(page.locator('canvas')).toHaveAttribute('data-screen','preparation-hub',{timeout:30000});await tap(page,'summary-tab-market');await tap(page,'market-filter-drink');expect((await data(page,'market-rows')).map((r:any)=>r.available)).toEqual([2,2,2]);expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(before-60);
});
