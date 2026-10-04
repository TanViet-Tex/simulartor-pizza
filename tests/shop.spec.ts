import {expect,test,type Page} from '@playwright/test';
async function tap(page:Page,id:string){
  const canvas=page.locator('canvas');
  await expect.poll(async()=>{
    if(id!=='resume'&&await canvas.getAttribute('data-paused')==='gap')await tap(page,'resume');
    return JSON.parse((await canvas.getAttribute('data-controls'))??'[]').some((c:{id:string;enabled:boolean})=>c.id===id&&c.enabled);
  },{message:'Control ready: '+id,timeout:15000}).toBe(true);
  const c=JSON.parse((await canvas.getAttribute('data-controls'))!).find((c:{id:string})=>c.id===id),b=(await canvas.boundingBox())!;
  expect(c.width*b.width/360,id).toBeGreaterThanOrEqual(48);expect(c.height*b.height/640,id).toBeGreaterThanOrEqual(48);
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}
async function stock(page:Page,id:string){return JSON.parse((await page.locator('canvas').getAttribute('data-stock'))!).find((s:{id:string})=>s.id===id);}
test('Day 1 buys real stock, blocks missing menu and reserves first automatic ticket',async({page},info)=>{
  test.setTimeout(45000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?mode=shop');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-shop','preparation');await expect(canvas).toHaveAttribute('data-cash','300');
  for(const id of ['dough','sauce','cheese','mushroom'])expect(await stock(page,id)).toMatchObject({owned:0,available:0,reserved:0});
  const labels=JSON.parse((await canvas.getAttribute('data-labels'))!).map((l:{text:string})=>l.text).join(' ');
  expect(labels).toContain('Còn thiếu:');expect(labels).toContain('×1');
  const controls=JSON.parse((await canvas.getAttribute('data-controls'))!);expect(controls.find((c:{id:string})=>c.id==='market-open').enabled).toBe(false);
  await page.screenshot({path:info.outputPath('empty-stock.png')});
  for(const id of ['dough','sauce','cheese']){
    await tap(page,`market-plus-${id}`);await tap(page,`market-buy-${id}`);
    await expect.poll(async()=> (await stock(page,id)).owned).toBe(2);
  }
  await expect(canvas).toHaveAttribute('data-cash','270');
  await tap(page,'market-recipe-mushroom');await tap(page,'market-price-cancel');
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-labels'))!).some((l:{text:string})=>l.text.includes('Nấm ×1'))).toBe(true);
  await tap(page,'market-recipe-cheese');await tap(page,'market-price-cancel');await tap(page,'market-open');
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-tickets'))??'[]').length,{timeout:15000}).toBe(1);
  await expect(canvas).toHaveAttribute('data-paused','');
  await expect(canvas).toHaveAttribute('data-shop','making');
  for(const id of ['dough','sauce','cheese'])expect(await stock(page,id)).toMatchObject({owned:2,available:1,reserved:1});
  await tap(page,'ticket-cozy-1');
  await tap(page,'order');
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-labels'))!).some((l:{text:string})=>l.text.includes('có 2 · rảnh 1 · giữ 1'))).toBe(true);
  await tap(page,'close-order');
  await page.screenshot({path:info.outputPath('reserved-order.png')});
  for(const id of ['dough','sauce','cheese'])await tap(page,id);
  await tap(page,'clear');await expect(canvas).toHaveAttribute('data-ingredients','');
  for(const id of ['dough','sauce','cheese'])expect(await stock(page,id)).toMatchObject({owned:2,available:1,reserved:1});
  for(const id of ['dough','sauce','cheese','bake'])await tap(page,id);
  await expect(canvas).toHaveAttribute('data-stage','baking');
  for(const id of ['dough','sauce','cheese'])expect(await stock(page,id)).toMatchObject({owned:1,available:1,reserved:0});
  expect(errors).toEqual([]);
});

test('scheduled mushroom takeaway consumes four ingredients and pays the agreed price',async({page},info)=>{
  test.skip(!info.project.name.endsWith('360x640'),'Additional cooking regression on the two smallest viewport profiles.');
  test.setTimeout(180000);await page.clock.install();await page.goto('/?mode=shop');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-shop','preparation');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));
  async function touch(id:string){await tap(page,id);await page.clock.runFor(50);}
  for(const id of ['dough','sauce','cheese','mushroom']){await touch('market-plus-'+id);await touch('market-plus-'+id);await touch('market-buy-'+id);}
  await touch('market-open');
  // Phaser smooths frame deltas: virtual wall time need not equal model time.
  // Drive until the real scheduled offer appears, rather than waiting on a
  // control while the test clock is frozen just short of the arrival.
  for(let i=0;i<80&&await canvas.getAttribute('data-bargain')==='null';i++){
    if(await canvas.getAttribute('data-paused')==='gap')await touch('resume');
    await page.clock.runFor(1000);
  }
  expect(await canvas.getAttribute('data-bargain')).not.toBe('null');
  await touch('accept-bargain');
  const target=JSON.parse((await canvas.getAttribute('data-tickets'))!).find((t:{recipe:string;takeaway:boolean})=>t.recipe==='mushroom'&&t.takeaway);
  expect(target).toBeTruthy();await touch('ticket-'+target.id);await touch('order');
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-labels'))!).some((l:{text:string})=>l.text==='1 pizza nấm · Mang đi')).toBe(true);
  await touch('close-order');const cash=Number(await canvas.getAttribute('data-cash')),before:Record<string,number>={};
  for(const id of ['dough','sauce','cheese','mushroom'])before[id]=(await stock(page,id)).owned;
  for(const id of ['dough','sauce','cheese','mushroom','bake'])await touch(id);
  for(const id of ['dough','sauce','cheese','mushroom'])expect((await stock(page,id)).owned).toBe(before[id]-1);
  for(let i=0;i<100&&Number(await canvas.getAttribute('data-oven'))<3;i++)await page.clock.runFor(50);
  expect(Number(await canvas.getAttribute('data-oven'))).toBeGreaterThanOrEqual(3);
  await touch('extract');await page.screenshot({path:info.outputPath('mushroom-pizza.png')});
  await touch('box');await touch('deliver');await expect(canvas).toHaveAttribute('data-cash',String(cash+target.finalPrice));
});

test('preparation restart requires confirmation and returns to zero stock',async({page},info)=>{
  test.skip(!info.project.name.endsWith('360x640'),'Recovery regression on two smallest viewport profiles.');
  await page.goto('/?mode=shop');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-shop','preparation');
  await tap(page,'market-buy-dough');await expect(canvas).toHaveAttribute('data-cash','295');
  await tap(page,'market-reset');await tap(page,'market-cancel-reset');
  await expect(canvas).toHaveAttribute('data-cash','295');expect((await stock(page,'dough')).owned).toBe(1);
  await tap(page,'market-reset');await tap(page,'market-confirm-reset');
  await expect(canvas).toHaveAttribute('data-cash','300');expect((await stock(page,'dough')).owned).toBe(0);
});
