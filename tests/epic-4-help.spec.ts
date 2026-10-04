import {expect,test,type Page} from '@playwright/test';
type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)??'null');}
async function tap(page:Page,id:string){
  await page.clock.runFor(100);await expect.poll(async()=>((await data(page,'controls')) as Control[]).some(c=>c.id===id&&c.enabled),{message:id}).toBe(true);
  const c=((await data(page,'controls')) as Control[]).find(c=>c.id===id)!,b=(await page.locator('canvas').boundingBox())!;
  expect(c.width*b.width/360).toBeGreaterThanOrEqual(48);expect(c.height*b.height/640).toBeGreaterThanOrEqual(48);
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);await page.clock.runFor(200);
}
async function until(page:Page,elapsed:number){for(let i=0;i<5;i++){const clock=await data(page,'shift-clock');if(clock.elapsed>=elapsed)return;await page.clock.runFor(Math.ceil((elapsed-clock.elapsed)*1000)+200);}expect((await data(page,'shift-clock')).elapsed).toBeGreaterThanOrEqual(elapsed);}
async function serve(page:Page){const ticket=(await data(page,'tickets'))[0];await tap(page,'ticket-'+ticket.id);for(const id of ['dough','sauce','cheese'])await tap(page,id);await tap(page,'bake');await page.clock.runFor(3100);await tap(page,'extract');await tap(page,'deliver');if(await page.locator('canvas').getAttribute('data-shop')==='delivered')await tap(page,'continue-shift');}
async function close(page:Page){for(const id of ['pause','end-day','confirm-end-day'])await tap(page,id);await expect.poll(async()=>{await page.clock.runFor(100);return (await data(page,'save-state'))?.state;}).toBe('ready');await page.clock.runFor(200);}
async function start(page:Page){
  await page.clock.install();await page.addInitScript(()=>{window.requestAnimationFrame=callback=>window.setTimeout(()=>callback(performance.now()),100);window.cancelAnimationFrame=handle=>window.clearTimeout(handle);});
  await page.goto('/?mode=shop');await expect(page.locator('canvas')).toHaveAttribute('data-shop','preparation');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  for(const id of ['dough','sauce','cheese']){await tap(page,'market-plus-'+id);await tap(page,'market-plus-'+id);await tap(page,'market-buy-'+id);}
  await tap(page,'market-open');await until(page,10);await serve(page);await close(page);await tap(page,'summary-open-next-day');await until(page,10);
}
test('free help has a distinct relationship result and Day3 thanks rewards once',async({page})=>{
  test.setTimeout(180000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
  expect(await data(page,'help-offer')).toMatchObject({canAccept:true});expect(await data(page,'tickets')).toEqual([]);
  const paused=await data(page,'shift-clock');await page.clock.runFor(5000);expect(await data(page,'shift-clock')).toEqual(paused);
  await page.screenshot({path:'_bmad-output/implementation-artifacts/epic-4-evidence/help-choice.png'});
  await tap(page,'accept-help');expect((await data(page,'tickets'))[0]).toMatchObject({help:true,takeaway:false,finalPrice:0});
  await tap(page,'ticket-'+(await data(page,'tickets'))[0].id);expect((await data(page,'order-detail')).lines.join(' ')).toContain('Tặng miễn phí');
  const xp=(await data(page,'progression')).xp,rep=(await data(page,'customer-progress')).reputation,cash=Number(await page.locator('canvas').getAttribute('data-cash'));
  await serve(page);expect(await data(page,'help')).toMatchObject({decision:'accepted',outcome:'succeeded',giftCost:15});
  expect(await data(page,'progression')).toMatchObject({xp,cheeseSales:1});expect(await data(page,'customer-progress')).toMatchObject({reputation:rep,relationship:2});expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(cash);
  await close(page);expect(await data(page,'day-summary')).toMatchObject({day:2,revenue:0,delivered:0,abandoned:0,rating:null,rewards:0,accounts:{giftCost:15}});
  await tap(page,'summary-tab-market');for(const id of ['dough','sauce','cheese'])await tap(page,'summary-buy-'+id);
  await tap(page,'summary-open-next-day');const before=Number(await page.locator('canvas').getAttribute('data-cash'));await until(page,10);
  expect(await data(page,'help')).toMatchObject({claims:['regular.thanks-day-3'],thanksPending:true});expect(Number(await page.locator('canvas').getAttribute('data-cash'))).toBe(before+20);
  await page.screenshot({path:'_bmad-output/implementation-artifacts/epic-4-evidence/regular-thanks.png'});await tap(page,'continue-thanks');await close(page);
  expect(await data(page,'day-summary')).toMatchObject({day:3,rewards:20,revenue:0,ending:'complete',accounts:{giftCost:0}});expect(errors).toEqual([]);
});
test('declining the paused narrative choice leaves money, XP and relationship unchanged',async({page})=>{
  test.setTimeout(180000);await start(page);const before={cash:await page.locator('canvas').getAttribute('data-cash'),progress:await data(page,'progression'),customer:await data(page,'customer-progress')};
  await tap(page,'decline-help');expect(await data(page,'help')).toMatchObject({decision:'declined',outcome:null});expect(await data(page,'tickets')).toEqual([]);
  expect(await page.locator('canvas').getAttribute('data-cash')).toBe(before.cash);expect(await data(page,'progression')).toEqual(before.progress);expect(await data(page,'customer-progress')).toEqual(before.customer);await close(page);
  expect(await data(page,'day-summary')).toMatchObject({day:2,rewards:0,revenue:0,accounts:{giftCost:0}});
});
