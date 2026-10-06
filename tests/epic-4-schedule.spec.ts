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
async function labels(page:Page){return (await data(page,'labels')).map((l:{text:string})=>l.text).join(' ');}
async function serve(page:Page){
  const ticket=(await data(page,'tickets'))[0];await tap(page,'ticket-'+ticket.id);
  expect((await data(page,'order-detail')).takeaway).toBe(ticket.takeaway);
  for(const id of ['dough','sauce','cheese',...(ticket.recipe==='mushroom'?['mushroom']:[])])await tap(page,id);
  await tap(page,'bake');await page.clock.runFor(3100);await tap(page,'extract');
  const primary=((await data(page,'controls')) as Control[]).find(c=>c.id===(ticket.takeaway?'box':'deliver'))!;
  expect(primary).toMatchObject({x:8,y:411,height:48});
  if(ticket.takeaway)await tap(page,'box');else expect(primary.width).toBe(216);
  await tap(page,'deliver');expect((await data(page,'result')).stars).toBe(5);await expect(page.locator('canvas')).toHaveAttribute('data-shop','making');
}
test('day-one appointments show real service, fixed clock, grace and explicit manual close',async({page},info)=>{
  test.setTimeout(480000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install();
  // Fake browser frame cadence is independent of the runtime's fixed 50ms simulation.
  // This keeps long simulated shifts focused on game behavior rather than GPU frame volume.
  await page.addInitScript(()=>{
    window.requestAnimationFrame=callback=>window.setTimeout(()=>callback(performance.now()),100);
    window.cancelAnimationFrame=handle=>window.clearTimeout(handle);
  });
  await page.goto('/?mode=shop');await expect(page.locator('canvas')).toHaveAttribute('data-shop','preparation');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  for(const id of ['dough','sauce','cheese','mushroom']){for(let i=0;i<4;i++)await tap(page,'market-plus-'+id);await tap(page,'market-buy-'+id);}
  await tap(page,'market-open');expect(await data(page,'tickets')).toEqual([]);expect((await data(page,'shift-clock')).elapsed).toBeLessThan(10);
  await tap(page,'pause');const frozen=await data(page,'shift-clock');await page.clock.runFor(20000);expect(await data(page,'shift-clock')).toEqual(frozen);await tap(page,'resume');
  await until(page,10);expect((await data(page,'tickets'))[0]).toMatchObject({kind:'regular',takeaway:false});
  await tap(page,'ticket-cozy-1');expect(await labels(page)).toContain('Tại quầy');await page.screenshot({path:info.outputPath('counter-service.png')});await serve(page);
  await until(page,35);expect((await data(page,'tickets'))[0].kind).toBe('picky');await serve(page);
  await until(page,60);expect(await data(page,'bargain')).toMatchObject({takeaway:true});await tap(page,'accept-bargain');
  await tap(page,'ticket-cozy-3');expect(await labels(page)).toContain('Mang đi');await page.screenshot({path:info.outputPath('takeaway-service.png')});await serve(page);
  for(const elapsed of [85,110,135,180]){await until(page,elapsed);if(await data(page,'bargain'))await tap(page,'reject-bargain');}
  expect(await data(page,'shift-clock')).toMatchObject({phase:'grace',attempted:6});expect(await data(page,'day-summary')).toBeNull();
  expect(await labels(page)).toContain('Chờ ');await until(page,300);expect(await data(page,'shift-clock')).toMatchObject({phase:'awaiting-close',elapsed:300});
  expect(await data(page,'tickets')).toEqual([]);expect(await data(page,'day-summary')).toBeNull();expect(await labels(page)).toContain('Chốt ngày');
  const prompt=(await data(page,'labels')).find((l:{text:string})=>l.text==='Chốt ngày');
  expect(prompt.x).toBeGreaterThanOrEqual(163);expect(prompt.x+prompt.width).toBeLessThanOrEqual(224);
  await page.screenshot({path:info.outputPath('await-manual-close.png')});
  for(const id of ['end-day','confirm-end-day'])await tap(page,id); await expect.poll(async()=>{await page.clock.runFor(100);return (await data(page,'save-state'))?.state;}).toBe('ready'); await page.clock.runFor(100);
  expect(await data(page,'day-summary')).toMatchObject({day:1,delivered:3});
  const footer=((await data(page,'controls')) as Control[]).find(c=>c.id==='summary-open-next-day');expect(footer).toMatchObject({x:133,y:587,width:214,height:48});expect(errors).toEqual([]);
});
