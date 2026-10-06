import {expect,test,type Page} from '@playwright/test';
type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)??'null');}
async function tap(page:Page,id:string){
  await page.clock.runFor(100);
  await expect.poll(async()=>((await data(page,'controls')) as Control[]).some(c=>c.id===id&&c.enabled),{message:id}).toBe(true);
  const c=((await data(page,'controls')) as Control[]).find(c=>c.id===id)!,b=(await page.locator('canvas').boundingBox())!;
  expect(c.width*b.width/360).toBeGreaterThanOrEqual(48);expect(c.height*b.height/640).toBeGreaterThanOrEqual(48);
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);await page.clock.runFor(200);
}
async function until(page:Page,elapsed:number){
  for(let i=0;i<10;i++){const c=await data(page,'shift-clock');if(c.elapsed>=elapsed)return;await page.clock.runFor(Math.ceil((elapsed-c.elapsed)*1000)+200);}
  expect((await data(page,'shift-clock')).elapsed).toBeGreaterThanOrEqual(elapsed);
}
async function serve(page:Page,screenshot?:string){
  const ticket=(await data(page,'tickets'))[0];await tap(page,'ticket-'+ticket.id);
  for(const id of ['dough','sauce','cheese',...(ticket.recipe==='cheese'?[]:[ticket.recipe])])await tap(page,id);
  if(screenshot)await page.screenshot({path:screenshot});
  await tap(page,'bake');await page.clock.runFor(3100);await tap(page,'extract');
  if(ticket.takeaway)await tap(page,'box');await tap(page,'deliver');
  expect((await data(page,'result')).stars).toBe(5);
  if(await page.locator('canvas').getAttribute('data-shop')==='delivered')await expect(page.locator('canvas')).toHaveAttribute('data-shop','making');
}
test('goals grant separate rewards and sausage unlocks in the existing next-day UI',async({page})=>{
  test.setTimeout(300000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install();await page.addInitScript(()=>{
    window.requestAnimationFrame=callback=>window.setTimeout(()=>callback(performance.now()),100);
    window.cancelAnimationFrame=handle=>window.clearTimeout(handle);
  });
  await page.goto('/?mode=shop');await expect(page.locator('canvas')).toHaveAttribute('data-shop','preparation');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  for(const id of ['dough','sauce','cheese']){for(let i=0;i<4;i++)await tap(page,'market-plus-'+id);await tap(page,'market-buy-'+id);}
  await tap(page,'market-buy-mushroom');await tap(page,'market-recipe-mushroom');await tap(page,'market-price-cancel');await tap(page,'market-open');
  for(const elapsed of [10,35,60,85]){await until(page,elapsed);if(await data(page,'bargain'))await tap(page,'accept-bargain');await serve(page);}
  expect(await data(page,'progression')).toMatchObject({xp:60,level:2,unlockDay:2,cheeseSales:3});
  expect(await data(page,'menu-recipes')).toEqual(['cheese','mushroom']);
  // Preparation still selected mushroom, now exhausted; the actual cheese bargain remains viable.
  await until(page,110);expect(await data(page,'bargain')).toMatchObject({recipe:'cheese'});await tap(page,'accept-bargain');await serve(page);
  for(const id of ['end-day','confirm-end-day'])await tap(page,id); await expect.poll(async()=>{await page.clock.runFor(100);return (await data(page,'save-state'))?.state;}).toBe('ready'); await page.clock.runFor(100);
  const closed=await data(page,'day-summary');expect(closed).toMatchObject({day:1,revenue:254,rewards:20,profit:154,cash:474,progression:{xp:85},goal:{status:'completed'}});
  const controls=await data(page,'controls');expect(controls.filter((c:Control)=>c.id.startsWith('summary-tab-'))).toHaveLength(5);expect(controls.filter((c:Control)=>c.id.startsWith('summary-prepare-'))).toHaveLength(4);
  expect(controls.find((c:Control)=>c.id==='summary-open-next-day')).toMatchObject({x:133,y:587,width:214,height:48});
  await page.screenshot({path:'_bmad-output/implementation-artifacts/epic-4-evidence/progression-summary.png'});
  await tap(page,'summary-tab-missions');await page.screenshot({path:'_bmad-output/implementation-artifacts/epic-4-evidence/missions.png'});
  await tap(page,'summary-tab-market');await tap(page,'summary-recipe-cheese');
  const paused=await data(page,'shift-clock');await page.clock.runFor(10000);expect(await data(page,'shift-clock')).toEqual(paused);
  // Menu inclusion is independent of preparation selection; use the same two market buttons.
  await tap(page,'market-price-enabled');await tap(page,'market-price-save');
  await tap(page,'summary-recipe-mushroom');await tap(page,'market-price-enabled');await tap(page,'market-price-save');
  await tap(page,'summary-recipe-cheese');await tap(page,'market-price-recipe');await tap(page,'market-price-recipe');
  expect(await data(page,'price-dialog')).toMatchObject({recipe:'sausage',enabled:true,percent:100});
  await page.screenshot({path:'_bmad-output/implementation-artifacts/epic-4-evidence/sausage-menu.png'});
  await tap(page,'market-buy-sausage');expect((await data(page,'stock')).find((s:{id:string})=>s.id==='sausage').owned).toBe(1);
  // Last recipe cannot be removed; rejected changes preserve price and draft.
  await tap(page,'market-price-enabled');await tap(page,'market-price-save');expect(await data(page,'menu-recipes')).toEqual(['sausage']);expect(await data(page,'price-dialog')).not.toBeNull();
  await tap(page,'market-price-enabled');await tap(page,'market-price-save');
  for(const id of ['dough','sauce','cheese'])await tap(page,'summary-buy-'+id);
  expect(await data(page,'day-summary')).toEqual(closed);
  await tap(page,'summary-open-next-day');await until(page,10);expect(await data(page,'tickets')).toEqual([]);await tap(page,'decline-help');await until(page,32);
  expect((await data(page,'tickets'))[0]).toMatchObject({kind:'hurry',recipe:'sausage',finalPrice:75});
  await serve(page,'_bmad-output/implementation-artifacts/epic-4-evidence/sausage-kitchen.png');expect(await data(page,'progression')).toMatchObject({xp:100,cheeseSales:4});
  for(const id of ['end-day','confirm-end-day'])await tap(page,id); await expect.poll(async()=>{await page.clock.runFor(100);return (await data(page,'save-state'))?.state;}).toBe('ready'); await page.clock.runFor(100);
  expect(await data(page,'day-summary')).toMatchObject({day:2,rewards:0,cost:28,revenue:75,goal:{status:'expired'}});expect(errors).toEqual([]);
});
