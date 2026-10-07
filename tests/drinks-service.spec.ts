import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';
type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)??'null');}
async function tap(page:Page,id:string){let c:Control|undefined;await expect.poll(async()=>{c=((await data(page,'controls'))??[]).find((v:Control)=>v.id===id&&v.enabled);return !!c;}).toBe(true);const b=(await page.locator('canvas').boundingBox())!,r=c!;await page.touchscreen.tap(b.x+(r.x+r.width/2)*b.width/360,b.y+(r.y+r.height/2)*b.height/640);}
async function seed(page:Page,open=false){
 const pathModule:string='node:path',paths:{resolve:(s:string)=>string}=await import(pathModule);
 const source=`import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';import {requestedDrink} from './src/domain/DrinkStock';const r=new CozyRuntime(false,true,{eventSeed:321,schedule:day=>{let n=0;while(requestedDrink(321,day,'drink-ui-'+n)!=='cola')n++;return {day,duration:180,grace:120,slots:[{id:'drink-ui-'+n,at:0,kind:'regular',opportunity:'commercial',commercialOrdinal:1,takeaway:false}]};}});r.claimTestCode('VIETVUIVE');r.configureMenu('mushroom',100,false);for(const id of ['dough','sauce','cheese'])r.buy(id,2);if(${open}){for(const id of ['water','cola','orange'])r.buyDrink(id,2,'fixture-'+id);r.openShop();r.pause('user');}(window as any).drinksFixture={r};new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(r)]});`;
 const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:source},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
 await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{height:100%;width:100%}</style><div id="fixture"></div>');await page.addScriptTag({content:bundle.outputFiles[0].text});await expect.poll(()=>data(page,'controls')).not.toBeNull();
}
test('three kitchen drink cells attach only requested bottle once, then pizza and drink settle once',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await seed(page,true);
 await page.evaluate(()=>{const r=(window as any).drinksFixture.r;r.resume('user');});
 await expect.poll(async()=>((await data(page,'controls'))??[]).filter((c:Control)=>/^drink-(water|cola|orange)$/.test(c.id)).length).toBe(3);
 expect(await page.evaluate(()=>{const r=(window as any).drinksFixture.r;return r.selectedTicket.drink;})).toBe('cola');
 expect(await page.evaluate(()=>{const r=(window as any).drinksFixture.r;return r.attachDrink('water');})).toBe(false);
 await tap(page,'drink-cola');
 expect(await page.evaluate(()=>{const r=(window as any).drinksFixture.r;return [r.selectedTicket.drinkAttached,r.drinkStock.find((d:any)=>d.id==='cola').quantity,r.attachDrink('cola')];})).toEqual([true,1,false]);
 await page.locator('canvas').screenshot({path:info.outputPath('three-drinks.png')});
 const result=await page.evaluate(()=>{const r=(window as any).drinksFixture.r;for(const ingredient of ['dough','sauce','cheese'])r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});r.advanceElapsed(6000);r.dispatch({type:'extract'});const before=r.state.cash,id=r.selectedTicketId;const delivered=r.dispatch({type:'deliver',commandId:'drink-ui-delivery'});const cash=r.state.cash,repeat=r.dispatch({type:'deliver',sourceId:id,targetId:id,commandId:'drink-ui-delivery'});r.closeDay();return {delivered,repeat,received:cash-before,summary:r.daySummary};});
 expect(result.delivered).toBe(true);expect(result.repeat).toBe(false);expect(result.received).toBe(75);expect(result.summary.revenue).toBe(75);expect(result.summary.reviews[0].soldDrink).toEqual({id:'cola',price:25});expect(result.summary.accounts.inventory.drinks.cola).toBe(1);expect(errors).toEqual([]);
});
test('equipment replaces second oven with three purchasable drinks at catalog costs',async({page},info)=>{
 await seed(page);await tap(page,'summary-tab-shop');await tap(page,'shop-section-equipment');await tap(page,'shop-drinks-stock');
 const before=await page.evaluate(()=>(window as any).drinksFixture.r.state.cash);
 for(const id of ['water','cola','orange']){await tap(page,'drink-buy-'+id);await tap(page,'shop-drinks-stock');}
 expect(await page.evaluate(()=>{const r=(window as any).drinksFixture.r;return {spent:r.state.cash,quantities:r.drinkStock.map((d:any)=>d.quantity)};})).toEqual({spent:before-30,quantities:[1,1,1]});
 await page.locator('canvas').screenshot({path:info.outputPath('drink-stock-preparation.png')});
 expect((await data(page,'labels')).map((l:{text:string})=>l.text).join(' ')).toContain('Coca');
});
