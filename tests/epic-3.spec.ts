import {expect,test,type Page} from '@playwright/test';
type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function data(page:Page,key:string){return JSON.parse(await page.locator('canvas').getAttribute('data-'+key)??'null');}
async function tap(page:Page,id:string){
  await expect.poll(async()=>((await data(page,'controls')) as Control[]).some(c=>c.id===id&&c.enabled)).toBe(true);
  const c=((await data(page,'controls')) as Control[]).find(c=>c.id===id)!,b=(await page.locator('canvas').boundingBox())!;
  expect(c.width*b.width/360).toBeGreaterThanOrEqual(48);expect(c.height*b.height/640).toBeGreaterThanOrEqual(48);
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);await page.clock.runFor(50);
}
async function start(page:Page){
  await page.clock.install();await page.goto('/?mode=shop');
  await expect(page.locator('canvas')).toHaveAttribute('data-shop','preparation');
  await page.clock.pauseAt(await page.evaluate(()=>Date.now()+5000));
}
async function labels(page:Page){return (await data(page,'labels')).map((l:{text:string})=>l.text).join(' ');}
test('preparation prices and next-day purchases preserve geometry and closed accounts',async({page},info)=>{
  test.setTimeout(180000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await start(page);
  expect(await labels(page)).toContain('Thuê 20 xu');
  const recipe=((await data(page,'controls')) as Control[]).find(c=>c.id==='market-recipe-cheese');
  expect(recipe).toMatchObject({x:20,y:431,width:157,height:48});
  await tap(page,'market-recipe-cheese');for(let i=0;i<4;i++)await tap(page,'market-price-plus');
  await page.screenshot({path:info.outputPath('price-editor.png')});await tap(page,'market-price-save');
  expect((await data(page,'customer-progress')).prices.cheese).toBe(60);
  for(const id of ['dough','sauce','cheese']){await tap(page,`market-plus-${id}`);await tap(page,`market-buy-${id}`);}
  await tap(page,'market-open');await page.clock.runFor(10000);expect((await data(page,'tickets'))[0].finalPrice).toBe(60);
  for(const id of ['dough','sauce','cheese','bake'])await tap(page,id);
  await page.clock.runFor(3100);for(const id of ['extract','deliver'])await tap(page,id);
  await tap(page,'continue-shift');await tap(page,'market-prepare');
  expect(((await data(page,'controls')) as Control[]).find(c=>c.id==='market-buy-dough')!.enabled).toBe(false);
  expect(await labels(page)).toContain('không mua thêm');await tap(page,'market-orders');
  for(const id of ['end-day','confirm-end-day'])await tap(page,id); await expect.poll(async()=>{await page.clock.runFor(100);return (await data(page,'save-state'))?.state;}).toBe('ready'); await page.clock.runFor(100);
  const statement=await data(page,'day-summary');expect(statement).toMatchObject({revenue:60,purchases:30,cost:15,profit:25,cash:310});
  const footer=((await data(page,'controls')) as Control[]).find(c=>c.id==='summary-open-next-day');
  expect(footer).toMatchObject({x:133,y:587,width:214,height:48});
  await tap(page,'summary-figure-2');expect(await labels(page)).toContain('Tiền cuối ngày đã chốt: 310 xu');
  expect(await labels(page)).toContain('Chưa có nhân viên');expect(await labels(page)).toContain('thiết bị hỏng');
  await page.screenshot({path:info.outputPath('statement-cash.png')});
  const scroll=(await data(page,'modal-scroll'))[0];expect(scroll.max).toBeGreaterThan(0);
  const box=(await page.locator('canvas').boundingBox())!;
  await page.mouse.move(box.x+180*box.width/360,box.y+350*box.height/640);await page.mouse.wheel(0,900);await page.clock.runFor(50);
  expect((await data(page,'modal-scroll'))[0].offset).toBeGreaterThan(0);
  await page.screenshot({path:info.outputPath('statement-detail.png')});await tap(page,'summary-statement-close');
  expect(await data(page,'day-summary')).toEqual(statement);
  await tap(page,'summary-tab-market');await tap(page,'summary-recipe-cheese');await tap(page,'market-price-minus');await tap(page,'market-price-save');
  await tap(page,'summary-buy-mushroom');expect(await data(page,'day-summary')).toEqual(statement);
  await page.screenshot({path:info.outputPath('day2-market.png')});expect(errors).toEqual([]);
  await tap(page,'summary-tab-summary');await tap(page,'summary-figure-0');
  expect(await labels(page)).toContain('Tiền hiện có: 304 xu');expect(await labels(page)).toContain('Tiền cuối ngày đã chốt: 310 xu');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await page.clock.runFor(50);
  await expect(page.locator('canvas')).toHaveAttribute('data-statement-open','true');
  expect(((await data(page,'controls')) as Control[]).some(c=>c.id==='summary-statement-close'&&c.enabled)).toBe(false);
  await tap(page,'resume');await tap(page,'summary-statement-close');await expect(page.locator('canvas')).toHaveAttribute('data-paused','');
  expect(await data(page,'day-summary')).toEqual(statement);
});
test('price editor retains its lease across visibility pause and cancels without price mutation',async({page})=>{
  await start(page);await tap(page,'market-recipe-mushroom');await tap(page,'market-price-plus');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await page.clock.runFor(50);
  expect(await data(page,'price-dialog')).toMatchObject({recipe:'mushroom',percent:105});
  expect(((await data(page,'controls')) as Control[]).some(c=>c.id==='market-price-save'&&c.enabled)).toBe(false);
  await tap(page,'resume');await tap(page,'market-price-cancel');
  expect((await data(page,'customer-progress')).prices.mushroom).toBe(65);
  await expect(page.locator('canvas')).toHaveAttribute('data-paused','');
});
test('third day settles once and exposes no fourth-day preparation',async({page})=>{
  test.setTimeout(120000);await start(page);
  for(const id of ['dough','sauce','cheese'])await tap(page,'market-buy-'+id);
  await tap(page,'market-open');
  for(let day=1;day<=3;day++){
    for(const id of ['end-day','confirm-end-day'])await tap(page,id); await expect.poll(async()=>{await page.clock.runFor(100);return (await data(page,'save-state'))?.state;}).toBe('ready'); await page.clock.runFor(100);
    const summary=await data(page,'day-summary');expect(summary.day).toBe(day);
    const a=summary.accounts;expect(a.endingCash).toBe(a.startingCash+a.sales-a.purchases-a.rent);
    if(day<3){
      if(day===2){await tap(page,'summary-tab-market');for(const id of ['dough','sauce','cheese'])await tap(page,'summary-buy-'+id);}
      await tap(page,'summary-open-next-day');
    }
  }
  const statement=await data(page,'day-summary');expect(statement.ending).toBe('complete');
  expect(((await data(page,'controls')) as Control[]).some(c=>c.id==='summary-open-next-day')).toBe(false);
  await tap(page,'summary-tab-market');expect(await labels(page)).toContain('Chợ · Ngày 3');
  expect(((await data(page,'controls')) as Control[]).some(c=>c.id.startsWith('summary-buy-'))).toBe(false);
  await tap(page,'summary-tab-summary');await tap(page,'summary-figure-1');await tap(page,'summary-statement-close');
  expect(await data(page,'day-summary')).toEqual(statement);expect(await labels(page)).not.toContain('Ngày 4');
});
