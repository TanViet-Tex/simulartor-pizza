import {test,expect,type Page} from '@playwright/test';
async function tap(page:Page,id:string,menu=false){
  const canvas=page.locator('canvas'),attr=menu?'data-menu-targets':'data-controls';
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute(attr)??'[]').some((c:any)=>c.id===id&&(menu?!c.disabled:c.enabled))).toBe(true);
  const c=JSON.parse(await canvas.getAttribute(attr)??'[]').find((c:any)=>c.id===id),b=(await canvas.boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}
async function prep(page:Page){await page.goto('/?mode=shop');await expect(page.locator('canvas')).toHaveAttribute('data-screen','preparation-hub',{timeout:20000});}
const input=(page:Page)=>page.getByRole('textbox',{name:'Mã nhận xu'});

for(const source of ['Menu','Pause'])test(`${source} mobile visualViewport moves frame, textbox and tap targets together and resets on blur`,async({page})=>{
  await page.addInitScript(()=>{
    const viewport=Object.assign(new EventTarget(),{height:window.innerHeight,offsetTop:0});
    Object.defineProperty(window,'visualViewport',{configurable:true,value:viewport});
    (window as any).codeViewport=(height:number,offsetTop:number,event='resize')=>{Object.assign(viewport,{height,offsetTop});viewport.dispatchEvent(new Event(event));};
  });
  const menu=source==='Menu';
  if(menu){await page.goto('/');await tap(page,'menu-settings',true);await tap(page,'menu-code',true);}
  else{await prep(page);await tap(page,'pause');await tap(page,'pause-settings');await tap(page,'settings-code');}
  await input(page).fill('keep-me');
  const canvas=page.locator('canvas'),b=(await canvas.boundingBox())!,originalTop=(await input(page).boundingBox())!.y;
  const receive=async()=>JSON.parse(await canvas.getAttribute(menu?'data-menu-targets':'data-controls')??'[]').find((c:any)=>c.id==='test-code-receive');
  const original=await receive();if(menu)await page.screenshot({path:test.info().outputPath('test-code-mobile-normal.png')});
  await page.evaluate(()=>{const b=document.querySelector('canvas')!.getBoundingClientRect();(window as any).codeViewport(360*b.height/640,0);});
  await expect.poll(async()=>Number(await canvas.getAttribute('data-test-code-offset'))).toBeLessThan(0);
  const offset=Number(await canvas.getAttribute('data-test-code-offset'));
  expect((await receive()).y-original.y).toBeCloseTo(offset,3);expect((await input(page).boundingBox())!.y-originalTop).toBeCloseTo(offset*b.height/640,1);
  if(menu)await page.screenshot({path:test.info().outputPath('test-code-mobile-keyboard.png')});
  await page.evaluate(()=>(window as any).codeViewport(360*document.querySelector('canvas')!.getBoundingClientRect().height/640,30,'scroll'));
  await expect.poll(async()=>Number(await canvas.getAttribute('data-test-code-offset'))).toBeCloseTo(offset+30*640/b.height,1);
  await input(page).evaluate((e:HTMLInputElement)=>e.blur());await expect(canvas).toHaveAttribute('data-test-code-offset','0');await expect(input(page)).toHaveValue('keep-me');
  await input(page).focus();await page.evaluate(()=>(window as any).codeViewport(window.innerHeight,0));await expect(canvas).toHaveAttribute('data-test-code-offset','0');
  await page.evaluate(()=>(window as any).codeViewport(360*document.querySelector('canvas')!.getBoundingClientRect().height/640,0));await expect.poll(async()=>Number(await canvas.getAttribute('data-test-code-offset'))).toBeLessThan(0);
  await tap(page,'test-code-cancel',menu);await expect(input(page)).toHaveCount(0);await expect(canvas).toHaveAttribute('data-settings-panel',/motionEnabled/);
  await page.evaluate(()=>(window as any).codeViewport(300,0));await expect(canvas).not.toHaveAttribute('data-test-code-offset',/./);await tap(page,menu?'menu-mute':'mute',menu);
});

test('Viewport API fallback and Escape clean up the native editor',async({page})=>{
  await page.addInitScript(()=>Object.defineProperty(window,'visualViewport',{configurable:true,value:undefined}));
  await page.goto('/');await tap(page,'menu-settings',true);await tap(page,'menu-code',true);await expect(page.locator('canvas')).toHaveAttribute('data-test-code-offset','0');await input(page).press('Escape');await expect(input(page)).toHaveCount(0);await tap(page,'menu-motion',true);
});
test('Menu without a campaign gives guidance, closes native input and preserves controls',async({page})=>{
  await page.goto('/');await expect(page.locator('canvas')).toHaveAttribute('data-screen','menu');await tap(page,'menu-settings',true);await tap(page,'menu-code',true);
  await input(page).fill('VIETVUIVE');await tap(page,'test-code-receive',true);await expect(page.locator('canvas')).toHaveAttribute('data-test-code-feedback',/Bắt đầu/);
  await tap(page,'test-code-cancel',true);await expect(input(page)).toHaveCount(0);await tap(page,'menu-mute',true);await tap(page,'menu-motion',true);await tap(page,'menu-settings-close',true);
});
test('Pause preparation grants exact funds, preserves user pause and rejects repeat after reload',async({page})=>{
  await prep(page);const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-cash','300');await tap(page,'pause');await tap(page,'pause-settings');await tap(page,'settings-code');
  await input(page).fill('wrong');await tap(page,'test-code-receive');await expect(canvas).toHaveAttribute('data-test-code-feedback','Mã không hợp lệ.');await expect(canvas).toHaveAttribute('data-cash','300');
  await input(page).fill(' vietvuive ');await tap(page,'test-code-receive');await expect(canvas).toHaveAttribute('data-test-code-feedback',/Đã nhận 100.000/);await expect(canvas).toHaveAttribute('data-cash','100300');
  await page.screenshot({path:test.info().outputPath('test-code-received.png')});
  await expect(input(page)).toHaveCount(0);await expect(canvas).toHaveAttribute('data-test-code-reward',/100000/);await tap(page,'test-code-reward-close');await expect(canvas).toHaveAttribute('data-paused',/user/);await tap(page,'mute');await tap(page,'settings-motion');
  await page.screenshot({path:test.info().outputPath('test-code-settings.png')});
  await tap(page,'pause-settings-back');await tap(page,'resume');await expect(canvas).toHaveAttribute('data-paused','');
  await page.reload();await expect(canvas).toHaveAttribute('data-cash','100300');await tap(page,'pause');await tap(page,'pause-settings');await tap(page,'settings-code');await input(page).fill('VIETVUIVE');await tap(page,'test-code-receive');await expect(canvas).toHaveAttribute('data-test-code-feedback',/đã được nhận/);
});
test('Menu uses the live preparation session and credits exactly once',async({page})=>{
  await prep(page);await tap(page,'pause');await tap(page,'main-menu');await tap(page,'menu-settings',true);await tap(page,'menu-code',true);await input(page).fill('VIETVUIVE');await tap(page,'test-code-receive',true);await expect(page.locator('canvas')).toHaveAttribute('data-test-code-feedback',/Đã nhận 100.000/);
  await expect(input(page)).toHaveCount(0);await tap(page,'test-code-reward-ok',true);await expect(page.locator('canvas')).toHaveAttribute('data-settings-panel',/motionEnabled/);await tap(page,'menu-settings-close',true);await tap(page,'menu-continue',true);await expect(page.locator('canvas')).toHaveAttribute('data-cash','100300');await expect(input(page)).toHaveCount(0);
});
test('Pause and Menu during a live shift never claim or save test funds',async({page})=>{
  await prep(page);const canvas=page.locator('canvas');await tap(page,'summary-open-first-day');await expect(canvas).toHaveAttribute('data-screen','game');
  // Opening a real campaign may produce the existing seeded loss event. Acknowledge
  // its modal before testing Settings and compare against the actual starting cash.
  if(JSON.parse(await canvas.getAttribute('data-controls')??'[]').some((c:any)=>c.id==='campaign-event-understood'))await tap(page,'campaign-event-understood');
  const startingCash=(await canvas.getAttribute('data-cash'))!;
  await tap(page,'pause');await tap(page,'pause-settings');await tap(page,'settings-code');await input(page).fill('VIETVUIVE');await tap(page,'test-code-receive');await expect(canvas).toHaveAttribute('data-test-code-feedback',/chốt ngày/);await expect(canvas).toHaveAttribute('data-cash',startingCash);
  await tap(page,'test-code-cancel');await tap(page,'pause-settings-back');await tap(page,'main-menu');await tap(page,'menu-settings',true);await tap(page,'menu-code',true);await input(page).fill('VIETVUIVE');await tap(page,'test-code-receive',true);await expect(canvas).toHaveAttribute('data-test-code-feedback',/chốt ngày/);
});
