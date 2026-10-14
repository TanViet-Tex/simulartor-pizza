import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

test.setTimeout(90000);
type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)??'null');}
async function tap(page:Page,id:string){
  let control:Control|undefined;await expect.poll(async()=>{control=((await data(page,'controls'))??[]).find((c:Control)=>c.id===id&&c.enabled);return !!control;}).toBe(true);
  const c=control!,b=(await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}
async function fixture(page:Page,mode:'empty'|'carryover'|'purchased'|'poor'='empty'){
  const moduleName:string='node:path',paths=await import(moduleName);
  const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';import {PlayLifecycle} from './src/runtime/PlayLifecycle';
    const deps={eventSeed:321,eventRoll:()=>1,schedule:day=>({day,duration:180,grace:120,slots:[]})};
    const r=new CozyRuntime(false,true,deps);
    if('${mode}'!=='empty')for(const ingredient of ['dough','sauce','cheese'])if(!r.buy(ingredient,2))throw Error('Fixture purchase failed');
    if('${mode}'==='poor')while(r.state.cash>=r.price('sauce')+40){const quantity=Math.min(100,Math.floor((r.state.cash-40)/r.price('sauce')));if(!r.buy('sauce',quantity))throw Error('Fixture cash spending failed');}
    if('${mode}'==='carryover'||'${mode}'==='poor'){if(!r.openShop())throw Error('Fixture open failed');r.resolveLottery(0);if(!r.closeDay())throw Error('Fixture close failed');}
    const lifecycle=new PlayLifecycle(r,()=>0);lifecycle.frame=()=>lifecycle.reconcile();const scene=new CozyScene(r,undefined,undefined,undefined,lifecycle);
    Object.assign(window,{ingredientReminder:{r,scene}});
    new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[scene]});
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:bundle.outputFiles[0].text});await expect(page.locator('canvas')).toHaveAttribute('data-booted','true',{timeout:30000});
}
async function snapshot(page:Page){return page.evaluate(()=>{const r=(window as any).ingredientReminder.r;return {day:r.day,preparationDay:r.preparationDay,open:r.shopOpen,cash:r.state.cash,elapsed:r.shiftClock.elapsed,pauses:r.pauses};});}
async function reminder(page:Page,day:number){
  await expect.poll(async()=>((await data(page,'controls'))??[]).some((c:Control)=>c.id==='hub-detail-close'&&c.enabled)).toBe(true);
  await expect(page.locator('canvas')).toHaveAttribute('data-summary-tab','market');await expect(page.locator('canvas')).toHaveAttribute('data-paused','order');
  await expect(page.locator('canvas')).toHaveAttribute('data-market-filter','all');
  const texts=await page.evaluate(()=>{const values:string[]=[];const visit=(o:any)=>{if(typeof o.text==='string')values.push(o.text);if(Array.isArray(o.list))o.list.forEach(visit);};(window as any).ingredientReminder.scene.children.list.forEach(visit);return values.join('\n');});
  expect(texts).toContain('Mua nguyên liệu trước khi mở quán');expect(texts).toContain('Bạn chưa mua nguyên liệu cho ngày '+day);
  expect((await data(page,'market-scroll')).offset).toBe(0);
}
async function closeDay(page:Page){expect(await page.evaluate(()=>{const r=(window as any).ingredientReminder.r;r.resolveLottery(0);return r.closeDay();})).toBe(true);await expect(page.locator('canvas')).toHaveAttribute('data-screen','day-summary');}

test('first opening redirects to market, pauses without changing cash/day, then food purchase opens the day',async({page},info)=>{
  await fixture(page);const before=await snapshot(page);await tap(page,'summary-open-first-day');await reminder(page,1);
  expect(await snapshot(page)).toEqual({...before,pauses:['order']});
  await page.evaluate(()=>(window as any).ingredientReminder.r.advanceElapsed(60000));expect(await snapshot(page)).toEqual({...before,pauses:['order']});
  await page.locator('canvas').screenshot({path:info.outputPath('ingredient-reminder-day-one.png')});
  await tap(page,'hub-detail-close');await expect(page.locator('canvas')).toHaveAttribute('data-paused','');
  await tap(page,'market-buy-dough');expect((await snapshot(page)).cash).toBeLessThan(before.cash);
  await tap(page,'summary-open-first-day');await expect(page.locator('canvas')).toHaveAttribute('data-screen','game');expect((await snapshot(page)).day).toBe(1);
});

test('old food stock allows opening after one reminder and a later day receives its own reminder',async({page})=>{
  await fixture(page,'carryover');const before=await snapshot(page);expect(before.preparationDay).toBe(2);
  await tap(page,'summary-tab-market');await tap(page,'market-filter-sauce');await tap(page,'summary-open-next-day');await reminder(page,2);
  expect(await snapshot(page)).toEqual({...before,pauses:['order']});
  await tap(page,'hub-detail-close');await tap(page,'summary-open-next-day');await expect(page.locator('canvas')).toHaveAttribute('data-screen','game');
  expect(await snapshot(page)).toMatchObject({day:2,cash:before.cash,open:true,pauses:[]});
  await closeDay(page);await tap(page,'summary-open-next-day');await reminder(page,3);
  await tap(page,'hub-detail-close');await tap(page,'summary-open-next-day');await expect(page.locator('canvas')).toHaveAttribute('data-screen','game');expect((await snapshot(page)).day).toBe(3);
});

test('food purchased before opening skips the reminder',async({page})=>{
  await fixture(page,'purchased');const before=await snapshot(page);await tap(page,'summary-open-first-day');await expect(page.locator('canvas')).toHaveAttribute('data-screen','game');
  expect(await snapshot(page)).toMatchObject({day:1,cash:before.cash,open:true,pauses:[]});expect((await data(page,'controls')).some((c:Control)=>c.id==='hub-detail-close')).toBe(false);
});

test('low funds do not trap a player with usable carryover stock in repeated reminders',async({page})=>{
  await fixture(page,'poor');const before=await snapshot(page);expect(before.cash).toBeGreaterThanOrEqual(20);expect(before.cash).toBeLessThan(24);
  await tap(page,'summary-open-next-day');await reminder(page,2);await tap(page,'hub-detail-close');await tap(page,'summary-open-next-day');
  await expect(page.locator('canvas')).toHaveAttribute('data-screen','game');expect(await snapshot(page)).toMatchObject({day:2,cash:before.cash,open:true,pauses:[]});
});
