import {expect,test,type Page} from '@playwright/test';
const controlledPages=new WeakSet<Page>();
type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function controls(page:Page):Promise<Control[]>{return JSON.parse(await page.locator('canvas').getAttribute('data-controls')??'[]');}
async function tap(page:Page,id:string){
  const canvas=page.locator('canvas');
  if(id!=='resume'&&await canvas.getAttribute('data-paused')==='gap')await tap(page,'resume');
  await expect.poll(async()=>{
    if(id!=='resume'&&await canvas.getAttribute('data-paused')==='gap')await tap(page,'resume');
    return (await controls(page)).some(c=>c.id===id&&c.enabled);
  },{message:'Control ready: '+id,timeout:15000}).toBe(true);
  const c=(await controls(page)).find(c=>c.id===id)!,b=(await canvas.boundingBox())!;
  expect(c.width*b.width/360,id).toBeGreaterThanOrEqual(48);expect(c.height*b.height/640,id).toBeGreaterThanOrEqual(48);
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
  if(controlledPages.has(page))await page.clock.runFor(50);
}
async function labels(page:Page){return JSON.parse(await page.locator('canvas').getAttribute('data-labels')??'[]').map((l:{text:string})=>l.text).join(' ');}
async function stock(page:Page,id:string){return JSON.parse(await page.locator('canvas').getAttribute('data-stock')??'[]').find((s:{id:string})=>s.id===id);}
async function provision(page:Page){for(const id of ['dough','sauce','cheese']){await tap(page,`market-plus-${id}`);await tap(page,`market-buy-${id}`);}await tap(page,'market-open');if(controlledPages.has(page))await page.clock.runFor(10000);else await expect.poll(async()=>JSON.parse(await page.locator('canvas').getAttribute('data-tickets')??'[]').length,{timeout:15000}).toBe(1);}

test('manual day close cancels safely, settles once and carries real stock into next day',async({page},info)=>{
  test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?mode=shop');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-shop','preparation');await provision(page);
  await expect(canvas).toHaveAttribute('data-cash','270');await tap(page,'end-day');
  await page.screenshot({path:info.outputPath('day-close-confirmation.png')});
  await tap(page,'cancel-end-day');await expect(canvas).toHaveAttribute('data-cash','270');
  expect(JSON.parse(await canvas.getAttribute('data-tickets')??'[]')).toHaveLength(1);
  await tap(page,'end-day');await tap(page,'confirm-end-day');
  await expect(canvas).toHaveAttribute('data-screen','day-summary');await expect(canvas).toHaveAttribute('data-cash','250');
  await expect(canvas).toHaveAttribute('data-day','1');
  expect(await labels(page)).toContain('Kết thúc ngày 1');
  expect(await controls(page)).not.toEqual(expect.arrayContaining([expect.objectContaining({id:'dough',enabled:true})]));
  const settled=await canvas.getAttribute('data-day-summary');await page.waitForTimeout(350);
  await expect(canvas).toHaveAttribute('data-day-summary',settled!);await expect(canvas).toHaveAttribute('data-oven','0');
  await page.screenshot({path:info.outputPath('day-summary.png')});
  await tap(page,'summary-tab-stock');expect((await stock(page,'cheese')).owned).toBe(2);
  await page.screenshot({path:info.outputPath('day-stock.png')});
  await tap(page,'summary-tab-shop');expect(await labels(page)).toContain('Chưa mở');
  await tap(page,'summary-tab-missions');expect(await labels(page)).toContain('Mục tiêu & nhiệm vụ');expect(await labels(page)).toContain('0/8 món đúng công thức');
  await tap(page,'summary-tab-market');expect(await labels(page)).toContain('Pizza phô mai');expect(await labels(page)).toContain('Pizza nấm');await tap(page,'summary-recipe-mushroom');await tap(page,'market-price-cancel');await tap(page,'summary-recipe-cheese');await tap(page,'market-price-cancel');await tap(page,'summary-buy-mushroom');
  expect((await stock(page,'mushroom')).owned).toBe(1);
  await page.screenshot({path:info.outputPath('day-market.png')});
  await tap(page,'summary-tab-summary');await tap(page,'summary-open-next-day');
  await expect(canvas).toHaveAttribute('data-screen','game');await expect(canvas).toHaveAttribute('data-day','2');
  await expect(canvas).toHaveAttribute('data-shop','making');
  expect((await stock(page,'cheese')).owned).toBe(2);expect((await stock(page,'mushroom')).owned).toBe(1);
  expect((await controls(page)).some(c=>c.id==='replay'||c.id==='market-reset')).toBe(false);
  await page.screenshot({path:info.outputPath('day-two-kitchen.png')});expect(errors).toEqual([]);
});

test('completed pizza produces truthful revenue, cost and customer review on summary',async({page},info)=>{
  test.setTimeout(120000);await page.clock.install();await page.goto('/?mode=shop');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-shop','preparation');await page.clock.pauseAt(await page.evaluate(()=>Date.now()+1000));controlledPages.add(page);await provision(page);
  for(const id of ['dough','sauce','cheese','bake'])await tap(page,id);
  await page.clock.runFor(3500);await expect(canvas).toHaveAttribute('data-heat','perfect');await tap(page,'extract');await tap(page,'deliver');
  await expect(canvas).toHaveAttribute('data-cash','320');await expect(page.locator('canvas')).toHaveAttribute('data-shop','making');await tap(page,'end-day');await tap(page,'confirm-end-day');
  await expect(canvas).toHaveAttribute('data-screen','day-summary');await expect(canvas).toHaveAttribute('data-cash','300');
  const summary=JSON.parse(await canvas.getAttribute('data-day-summary')??'null');
  expect(summary).toMatchObject({day:1,revenue:50,profit:15,delivered:1});
  expect(await labels(page)).toContain('Linh');await page.screenshot({path:info.outputPath('day-summary-with-review.png')});
});
