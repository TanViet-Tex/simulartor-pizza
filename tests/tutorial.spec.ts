import {expect,test,type Page} from '@playwright/test';
async function tap(page:Page,id:string){
  const canvas=page.locator('canvas');
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-controls'))??'[]').some((c:{id:string;enabled:boolean})=>c.id===id&&c.enabled)).toBe(true);
  const controls=JSON.parse((await canvas.getAttribute('data-controls'))!);
  const c=controls.find((c:{id:string})=>c.id===id),b=(await canvas.boundingBox())!;
  expect(c.width*b.width/360).toBeGreaterThanOrEqual(48);expect(c.height*b.height/640).toBeGreaterThanOrEqual(48);
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}
test('guided practice is isolated, freezes at green and starts the shift explicitly',async({page},info)=>{
  test.setTimeout(60000);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.addInitScript(()=>{IDBFactory.prototype.open=()=>{throw new Error('Tutorial touched campaign storage');};});
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?mode=tutorial');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-tutorial','dough');
  await expect(canvas).toHaveAttribute('data-paused','tutorial');
  await expect(canvas).toHaveAttribute('data-reduced-motion','true');
  await page.screenshot({path:info.outputPath('guided-dough.png')});
  await tap(page,'pause');await expect(canvas).toHaveAttribute('data-paused',/tutorial.*user/);
  await tap(page,'resume');await expect(canvas).toHaveAttribute('data-paused','tutorial');
  const next=['sauce','cheese','bake','warming'];
  for(const [i,id] of ['dough','sauce','cheese','bake'].entries()){
    await tap(page,id);await expect(canvas).toHaveAttribute('data-tutorial',next[i]);
    await expect(canvas).toHaveAttribute('data-commercial-cash','300');
  }
  await expect(canvas).toHaveAttribute('data-tutorial','extract',{timeout:20000});
  await expect(canvas).toHaveAttribute('data-oven','3');await expect(canvas).toHaveAttribute('data-paused','tutorial');
  await page.waitForTimeout(500);await expect(canvas).toHaveAttribute('data-oven','3');
  await page.screenshot({path:info.outputPath('guided-green.png')});
  for(const [id,step] of [['extract','box'],['box','deliver'],['deliver','complete']]){
    await tap(page,id);await expect(canvas).toHaveAttribute('data-tutorial',step);
  }
  await expect(canvas).toHaveAttribute('data-cash','300');await expect(canvas).toHaveAttribute('data-commercial-cash','300');
  await page.screenshot({path:info.outputPath('guided-complete.png')});
  await tap(page,'start-shift');await expect(canvas).toHaveAttribute('data-tutorial','off');
  await expect(canvas).toHaveAttribute('data-stage','assembly');await expect(canvas).toHaveAttribute('data-ingredients','');
  await expect(canvas).toHaveAttribute('data-paused','');await expect(canvas).toHaveAttribute('data-cash','300');
  await expect(canvas).toHaveAttribute('data-shop','preparation');
  await expect(canvas).toHaveAttribute('data-screen','preparation-hub');
  await expect(canvas).toHaveAttribute('data-summary-tab','market');
  await expect(canvas).toHaveAttribute('data-day','1');
  await expect(canvas).toHaveAttribute('data-day-summary','null');
  let controls=JSON.parse((await canvas.getAttribute('data-controls'))!);
  expect(controls.find((c:{id:string})=>c.id==='summary-open-first-day').enabled).toBe(false);
  expect(controls.some((c:{id:string})=>c.id==='market-open')).toBe(false);
  await page.screenshot({path:info.outputPath('post-tutorial-market.png')});
  await tap(page,'pause');await tap(page,'market-reset');await tap(page,'market-new-cancel');await tap(page,'resume');
  await expect(canvas).toHaveAttribute('data-cash','300');
  await tap(page,'summary-tab-summary');
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-labels'))!).some((l:{text:string})=>l.text==='Ngày 1 chưa bắt đầu')).toBe(true);
  await tap(page,'summary-tab-market');
  for(const ingredient of ['dough','sauce','cheese'])await tap(page,`summary-buy-${ingredient}`);
  controls=JSON.parse((await canvas.getAttribute('data-controls'))!);
  expect(controls.find((c:{id:string})=>c.id==='summary-open-first-day').enabled).toBe(true);
  await tap(page,'summary-open-first-day');
  await expect(canvas).toHaveAttribute('data-day','1');
  await expect(canvas).toHaveAttribute('data-shop','making');
  await expect(canvas).toHaveAttribute('data-screen','game');
  await expect(canvas).toHaveAttribute('data-day-summary','null');
  expect(errors).toEqual([]);
});

test('campaign tutorial hub retains preparation through pause and menu return',async({page})=>{
  test.setTimeout(60000);
  await page.goto('/');const canvas=page.locator('canvas');await tap(page,'menu-start');
  for(const id of ['dough','sauce','cheese','bake'])await tap(page,id);
  await expect(canvas).toHaveAttribute('data-tutorial','extract',{timeout:20000});
  for(const id of ['extract','box','deliver','start-shift'])await tap(page,id);
  await expect(canvas).toHaveAttribute('data-screen','preparation-hub');
  await tap(page,'summary-buy-dough');
  const cash=await canvas.getAttribute('data-cash');
  await tap(page,'pause');await tap(page,'mute');
  await tap(page,'main-menu');await expect(canvas).toHaveAttribute('data-screen','menu');
  await tap(page,'menu-continue');await expect(canvas).toHaveAttribute('data-screen','preparation-hub');
  await expect(canvas).toHaveAttribute('data-summary-tab','market');
  await expect(canvas).toHaveAttribute('data-cash',cash!);
  await expect(canvas).toHaveAttribute('data-day-summary','null');
  await tap(page,'pause');await tap(page,'market-reset');
  await tap(page,'market-new-cancel');await tap(page,'resume');
  for(const id of ['sauce','cheese'])await tap(page,`summary-buy-${id}`);
  await tap(page,'summary-open-first-day');
  await expect(canvas).toHaveAttribute('data-shop','making');await expect(canvas).toHaveAttribute('data-day','1');
});

test('reading order and nested visibility pauses keep tutorial ownership',async({page})=>{
  await page.goto('/?mode=tutorial');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-tutorial','dough');
  await tap(page,'order');
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(canvas).toHaveAttribute('data-paused',/tutorial.*order.*visibility/);
  await tap(page,'resume');await expect(canvas).toHaveAttribute('data-paused','tutorial,order');
  await tap(page,'close-order');await expect(canvas).toHaveAttribute('data-paused','tutorial');
  await expect(canvas).toHaveAttribute('data-tutorial','dough');
  await tap(page,'pause');
  await page.setViewportSize({width:640,height:360});
  await expect(canvas).toHaveAttribute('data-paused','tutorial,user');
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-labels'))!).some((l:{text:string})=>l.text.includes('Đang dừng: hướng dẫn, nghỉ tay'))).toBe(true);
  await page.setViewportSize({width:360,height:640});
  await expect(canvas).toHaveAttribute('data-paused','tutorial,user');
  await tap(page,'resume');await expect(canvas).toHaveAttribute('data-paused','tutorial');
});
