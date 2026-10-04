import {expect,test,type Page} from '@playwright/test';

async function tap(page:Page,id:string){
  const canvas=page.locator('canvas');
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-controls'))??'[]').some((c:{id:string;enabled:boolean})=>c.id===id&&c.enabled)).toBe(true);
  const c=JSON.parse((await canvas.getAttribute('data-controls'))!).find((c:{id:string})=>c.id===id),b=(await canvas.boundingBox())!;
  expect(c.width*b.width/360,id).toBeGreaterThanOrEqual(48);expect(c.height*b.height/640,id).toBeGreaterThanOrEqual(48);
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}
async function tickets(page:Page):Promise<{id:string;name:string;remaining:number;stage:string}[]>{return JSON.parse((await page.locator('canvas').getAttribute('data-tickets'))??'[]');}
async function stock(page:Page){return JSON.parse((await page.locator('canvas').getAttribute('data-stock'))??'[]');}

test('two automatic tickets and the third agreed bargain keep genuine holds and selection',async({page},info)=>{
  test.setTimeout(100000);
  await page.goto('/?mode=shop');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-shop','preparation');
  for(const id of ['dough','sauce','cheese','mushroom']){
    await tap(page,`market-plus-${id}`);await tap(page,`market-plus-${id}`);await tap(page,`market-buy-${id}`);
  }
  await tap(page,'market-open');
  await expect.poll(async()=>(await tickets(page)).length,{timeout:15000}).toBe(1);
  const first=(await tickets(page))[0];
  await expect.poll(async()=>{if(await canvas.getAttribute('data-paused')==='bargain')await tap(page,'accept-bargain');return (await tickets(page)).length;},{timeout:80000}).toBe(3);
  await expect(canvas).toHaveAttribute('data-paused','');
  await expect(canvas).toHaveAttribute('data-selected-ticket',first.id);
  const customers=JSON.parse((await canvas.getAttribute('data-tickets'))!);
  expect(customers.map((t:{kind:string;patience:number})=>[t.kind,t.patience])).toEqual([['regular',120],['picky',100],['bargain',110]]);
  expect(await stock(page)).toEqual(expect.arrayContaining(['dough','sauce','cheese'].map(id=>expect.objectContaining({id,owned:3,reserved:3,available:0}))));
  expect(JSON.parse((await canvas.getAttribute('data-controls'))!).some((c:{id:string})=>/accept|decline/.test(c.id))).toBe(false);
  for(const customer of customers)await tap(page,`ticket-${customer.id}`);
  await page.screenshot({path:info.outputPath('three-automatic-customers.png')});
});

test('automatic ticket and shared oven remain touchable; raw discard confirms and remake consumes fresh stock',async({page},info)=>{
  test.setTimeout(60000);
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?mode=shop');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-shop','preparation');
  for(const id of ['dough','sauce','cheese']){await tap(page,`market-plus-${id}`);await tap(page,`market-buy-${id}`);}
  await tap(page,'market-open');await expect(canvas).toHaveAttribute('data-paused','');
  expect(JSON.parse((await canvas.getAttribute('data-controls'))!).some((c:{id:string})=>['accept-offer','decline-offer'].includes(c.id))).toBe(false);
  await expect.poll(async()=>(await tickets(page)).length,{timeout:15000}).toBe(1);
  const first=(await tickets(page))[0];
  await tap(page,`ticket-${first.id}`);await expect(canvas).toHaveAttribute('data-selected-ticket',first.id);
  for(const id of ['dough','sauce','cheese','bake'])await tap(page,id);
  await expect(canvas).toHaveAttribute('data-oven-owner',first.id);
  await tap(page,'oven-1');await tap(page,'extract');
  await expect(canvas).toHaveAttribute('data-stage','raw');
  expect(await stock(page)).toEqual(expect.arrayContaining(['dough','sauce','cheese'].map(id=>expect.objectContaining({id,owned:1,reserved:0}))));
  await tap(page,'discard');await expect(canvas).toHaveAttribute('data-discard-pending','true');
  await tap(page,'cancel-discard');await expect(canvas).toHaveAttribute('data-stage','raw');
  await tap(page,'discard');await tap(page,'confirm-discard');
  await expect(canvas).toHaveAttribute('data-oven-owner','');
  await tap(page,'remake');
  await expect.poll(async()=>await stock(page)).toEqual(expect.arrayContaining(['dough','sauce','cheese'].map(id=>expect.objectContaining({id,owned:1,reserved:1}))));
  for(const id of ['dough','sauce','cheese','bake'])await tap(page,id);
  await expect(canvas).toHaveAttribute('data-oven-owner',first.id);
  expect(await stock(page)).toEqual(expect.arrayContaining(['dough','sauce','cheese'].map(id=>expect.objectContaining({id,owned:0,reserved:0}))));
  await page.screenshot({path:info.outputPath('ticket-and-oven.png')});await tap(page,'pause');
  expect(errors).toEqual([]);
});

test('scheduled second ticket preserves first oven owner and rejects a busy bake',async({page},info)=>{
  test.setTimeout(120000);
  await page.goto('/?mode=shop');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-shop','preparation');
  for(const id of ['dough','sauce','cheese']){await tap(page,`market-plus-${id}`);await tap(page,`market-buy-${id}`);}
  await tap(page,'market-open');
  await expect.poll(async()=>(await tickets(page)).length,{timeout:15000}).toBe(1);
  const first=(await tickets(page))[0];
  for(const id of ['dough','sauce','cheese','bake'])await tap(page,id);
  await expect(canvas).toHaveAttribute('data-oven-owner',first.id);
  await expect.poll(async()=>(await tickets(page)).length,{timeout:80000}).toBe(2);
  await expect(canvas).toHaveAttribute('data-paused','');
  await expect(canvas).toHaveAttribute('data-selected-ticket',first.id);
  await expect.poll(async()=>(await tickets(page)).length).toBe(2);
  const second=(await tickets(page)).find(t=>t.id!==first.id)!;
  await tap(page,`ticket-${second.id}`);
  for(const id of ['dough','sauce','cheese','bake'])await tap(page,id);
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-labels'))!).some((l:{text:string})=>l.text.includes('Lò đang bận'))).toBe(true);
  expect(await stock(page)).toEqual(expect.arrayContaining(['dough','sauce','cheese'].map(id=>expect.objectContaining({id,owned:1,reserved:1}))));
  await expect(canvas).toHaveAttribute('data-oven-owner',first.id);
  await tap(page,'oven-1');await expect(canvas).toHaveAttribute('data-selected-ticket',first.id);
  await expect(canvas).toHaveAttribute('data-stage','burnt');
  await page.screenshot({path:info.outputPath('two-tickets-shared-oven.png')});
});

test('missing-stock scheduled arrival creates no extra ticket or arrival pause',async({page},info)=>{
  test.skip(!info.project.name.endsWith('360x640'),'Arrival shortage regression on both engines.');
  test.setTimeout(100000);
  await page.goto('/?mode=shop');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-shop','preparation');
  for(const id of ['dough','sauce','cheese'])await tap(page,`market-buy-${id}`);
  await tap(page,'market-open');
  await expect.poll(async()=>(await tickets(page)).length,{timeout:15000}).toBe(1);
  const first=(await tickets(page))[0];
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-labels'))!).some((l:{text:string})=>l.text.includes('Khách chưa thể đặt món')),{timeout:80000}).toBe(true);
  expect(await tickets(page)).toHaveLength(1);await expect(canvas).toHaveAttribute('data-paused','');
  expect((await tickets(page))[0].remaining).toBeLessThan(first.remaining);
  expect(await stock(page)).toEqual(expect.arrayContaining(['dough','sauce','cheese'].map(id=>expect.objectContaining({id,owned:1,reserved:1}))));
});
