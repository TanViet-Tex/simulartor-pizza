import { expect, test, type Page } from '@playwright/test';
async function tap(page:Page,id:string){
  const canvas=page.locator('canvas');
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-controls'))??'[]').some((c:{id:string;enabled:boolean})=>c.id===id&&c.enabled)).toBe(true);
  const c=JSON.parse((await canvas.getAttribute('data-controls'))!).find((c:{id:string})=>c.id===id),b=(await canvas.boundingBox())!;
  expect(c.width*b.width/360).toBeGreaterThanOrEqual(48);expect(c.height*b.height/640).toBeGreaterThanOrEqual(48);
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}
async function open(page:Page){
  await page.goto('/?mode=shop');const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-shop','preparation');
  for(const id of ['dough','sauce','cheese']){await tap(page,`market-plus-${id}`);await tap(page,`market-buy-${id}`);}
  await tap(page,'market-open');await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-tickets'))??'[]').length,{timeout:15000}).toBe(1);return canvas;
}
async function cook(page:Page){
  for(const id of ['dough','sauce','cheese','bake'])await tap(page,id);
  const canvas=page.locator('canvas');
  await expect.poll(async()=>Number(await canvas.getAttribute('data-oven')),{timeout:15000}).toBeGreaterThanOrEqual(3);
  await tap(page,'extract');await expect(canvas).toHaveAttribute('data-stage','ready');
}
test('takeaway unboxed consequence cancels without payment, then confirms one captured ticket',async({page},info)=>{
  test.setTimeout(90000);await page.clock.install();await page.goto('/?mode=shop');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-shop','preparation');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  async function touch(id:string){await tap(page,id);await page.clock.runFor(50);}
  for(const id of ['dough','sauce','cheese','mushroom']){await touch('market-plus-'+id);await touch('market-plus-'+id);await touch('market-buy-'+id);}
  await touch('market-open');await page.clock.runFor(60100);await touch('accept-bargain');
  const target=JSON.parse((await canvas.getAttribute('data-tickets'))!).find((t:{takeaway:boolean})=>t.takeaway);await touch('ticket-'+target.id);
  for(const id of ['dough','sauce','cheese',...(target.recipe==='mushroom'?['mushroom']:[]),'bake'])await touch(id);
  await page.clock.runFor(3100);await touch('extract');const cash=Number(await canvas.getAttribute('data-cash'));
  await touch('deliver-unboxed');await expect(canvas).toHaveAttribute('data-paused','delivery');
  expect(JSON.parse((await canvas.getAttribute('data-delivery-pending'))!).reasons).toContain('Đơn mang đi chưa đóng hộp');
  await touch('cancel-delivery');await expect(canvas).toHaveAttribute('data-stage','ready');await expect(canvas).toHaveAttribute('data-cash',String(cash));
  await touch('deliver-unboxed');await page.screenshot({path:info.outputPath('unboxed-confirmation.png')});await touch('confirm-delivery');
  expect(JSON.parse((await canvas.getAttribute('data-result'))!)).toMatchObject({stars:3,price:target.finalPrice,targetId:target.id});
  await expect(canvas).toHaveAttribute('data-cash',String(cash+target.finalPrice));expect(JSON.parse((await canvas.getAttribute('data-tickets'))!).some((t:{id:string})=>t.id===target.id)).toBe(false);
});
test('campaign wrong recipe names the captured customer, cancel preserves the pizza, confirm pays once',async({page},info)=>{
  test.setTimeout(60000);await page.goto('/?mode=campaign');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('aria-label',/start/);
  async function touch(x:number,y:number){const b=(await canvas.boundingBox())!;await page.touchscreen.tap(b.x+x*b.width/360,b.y+y*b.height/640);}
  await touch(150,498);await expect(canvas).toHaveAttribute('aria-label',/game, market/);await touch(150,473);
  for(const y of [157,216,275])await touch(309,y);await touch(150,603);
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-tickets'))??'[]').length,{timeout:18000}).toBe(1);
  await touch(45,518);await touch(112,518);await touch(180,437);
  await expect.poll(async()=>Number(await canvas.getAttribute('data-oven')),{timeout:15000}).toBeGreaterThanOrEqual(3);await touch(180,437);
  const cash=Number(await canvas.getAttribute('data-cash'));
  await touch(180,437);await expect(canvas).toHaveAttribute('data-paused','confirm');
  await expect(canvas).toHaveAttribute('data-confirmation',/Anh Minh.*Phô mai.*Sai công thức/);
  await page.screenshot({path:info.outputPath('wrong-recipe-confirmation.png')});
  await touch(255,465);await expect(canvas).toHaveAttribute('data-paused','');await expect(canvas).toHaveAttribute('data-cash',String(cash));
  expect(JSON.parse((await canvas.getAttribute('data-tickets'))!)).toHaveLength(1);
  await touch(180,437);await touch(95,465);
  await expect(canvas).toHaveAttribute('aria-label',/Đã giao: 3 sao.*Sai công thức/);
  await expect(canvas).toHaveAttribute('data-cash',String(cash+50));
  await touch(180,437);await expect(canvas).toHaveAttribute('data-cash',String(cash+50));
});
test('ready counter target label survives arrivals; rapid delivery taps pay only the selected customer',async({page})=>{
  test.setTimeout(60000);const canvas=await open(page);await cook(page);
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-tickets'))!).length,{timeout:35000}).toBe(2);
  const first=JSON.parse((await canvas.getAttribute('data-tickets'))!)[0];
  const second=JSON.parse((await canvas.getAttribute('data-tickets'))!)[1];
  await tap(page,`ticket-${second.id}`);
  expect(JSON.parse((await canvas.getAttribute('data-labels'))!).some((t:{text:string})=>t.text.includes('Giao: Lan'))).toBe(true);
  await tap(page,`ticket-${first.id}`);
  expect(JSON.parse((await canvas.getAttribute('data-labels'))!).some((t:{text:string})=>t.text.includes('Giao: Linh')&&t.text.includes('pizza phô mai'))).toBe(true);
  const cash=Number(await canvas.getAttribute('data-cash'));
  await tap(page,'deliver');
  const b=(await canvas.boundingBox())!;await page.touchscreen.tap(b.x+116*b.width/360,b.y+435*b.height/640);
  await expect(canvas).toHaveAttribute('data-cash',String(cash+50));
  expect(JSON.parse((await canvas.getAttribute('data-result'))!)).toMatchObject({targetId:first.id,price:50});
  expect(JSON.parse((await canvas.getAttribute('data-tickets'))!)).toHaveLength(1);
});
