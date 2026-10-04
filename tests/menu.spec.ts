import { expect, test, type Page } from '@playwright/test';

async function tap(page:Page,id:string,menu=true) {
  const canvas=page.locator('canvas');
  const attr=menu?'data-menu-targets':'data-controls';
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute(attr))??'[]').some((c:{id:string;disabled?:boolean;enabled?:boolean})=>c.id===id&&(menu?!c.disabled:c.enabled))).toBe(true);
  const c=JSON.parse((await canvas.getAttribute(attr))!).find((c:{id:string})=>c.id===id),b=(await canvas.boundingBox())!;
  expect(c.width*b.width/360).toBeGreaterThanOrEqual(47.99);expect(c.height*b.height/640).toBeGreaterThanOrEqual(47.99);
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}

test('reference menu opens, settings reduce animation and start enters the real guided game',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-screen','menu');
  await expect(canvas).toHaveAttribute('data-menu-dialog','none');
  await expect(canvas).toHaveAttribute('data-menu-has-session','false');
  await expect(canvas).toHaveAttribute('data-menu-animations','running');
  expect(JSON.parse((await canvas.getAttribute('data-menu-targets'))!).find((c:{id:string})=>c.id==='menu-continue').disabled).toBe(true);
  const targets=JSON.parse((await canvas.getAttribute('data-menu-targets'))!);
  expect(targets.every((target:{width:number})=>target.width===208)).toBe(true);
  for(let i=0;i<2;i++){
    const gap=targets[i+1].y-targets[i].y-targets[i].height;
    expect(gap).toBeGreaterThanOrEqual(0);expect(gap).toBeLessThanOrEqual(7);
  }
  const labels=JSON.parse((await canvas.getAttribute('data-labels'))!);
  expect(labels.map((label:{text:string})=>label.text)).toEqual(expect.arrayContaining(['Tiệm','Pizza','Ấm Áp','Bắt đầu','Tiếp tục','Cài đặt']));
  // Capture the completed 516ms entrance rather than its transparent first frame.
  await page.waitForTimeout(600);
  await page.screenshot({path:info.outputPath('main-menu.png')});
  await tap(page,'menu-settings');await expect(canvas).toHaveAttribute('data-menu-dialog','settings');
  await tap(page,'menu-motion');await expect(canvas).toHaveAttribute('data-menu-reduced-motion','true');
  await expect(canvas).toHaveAttribute('data-menu-animations','reduced');
  await page.screenshot({path:info.outputPath('menu-settings.png')});
  await tap(page,'menu-settings-close');await tap(page,'menu-start');
  await expect(canvas).toHaveAttribute('data-screen','game');await expect(canvas).toHaveAttribute('data-tutorial','dough');
  await expect(canvas).toHaveAttribute('data-reduced-motion','true');expect(errors).toEqual([]);
});

test('return and continue retain ingredients; cancel new session and visibility retain ownership',async({page},info)=>{
  await page.goto('/');const canvas=page.locator('canvas');await tap(page,'menu-start');
  await tap(page,'dough',false);await tap(page,'pause',false);await tap(page,'main-menu',false);
  await expect(canvas).toHaveAttribute('data-screen','menu');await expect(canvas).toHaveAttribute('data-menu-has-session','true');
  await page.waitForTimeout(600);await page.screenshot({path:info.outputPath('menu-continue.png')});
  await tap(page,'menu-start');await expect(canvas).toHaveAttribute('data-menu-dialog','new-session');
  await tap(page,'menu-new-cancel');await tap(page,'menu-continue');
  await expect(canvas).toHaveAttribute('data-screen','game');await expect(canvas).toHaveAttribute('data-ingredients','dough');await expect(canvas).toHaveAttribute('data-tutorial','sauce');
  await tap(page,'pause',false);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await tap(page,'main-menu',false);await tap(page,'menu-continue');
  await expect(canvas).toHaveAttribute('data-paused','tutorial,visibility');
  await tap(page,'resume',false);await expect(canvas).toHaveAttribute('data-paused','tutorial');
  await tap(page,'pause',false);await tap(page,'main-menu',false);await tap(page,'menu-start');await tap(page,'menu-new-confirm');
  await expect(canvas).toHaveAttribute('data-tutorial','dough');await expect(canvas).toHaveAttribute('data-ingredients','');
  await tap(page,'pause',false);await tap(page,'main-menu',false);await page.reload();
  await expect(canvas).toHaveAttribute('data-menu-has-session','true');await page.screenshot({path:info.outputPath('menu-checkpoint-after-reload.png')});
});

test('hidden and reduced-motion menu stops effects; missing background blocks entry and retry recovers',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});let broken=true;
  await page.route('**/assets/main-menu-background.png',route=>broken?route.abort():route.continue());
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-startup-error','assets');
  await expect(page.locator('canvas')).not.toHaveAttribute('data-screen','menu');
  broken=false;await page.getByRole('button',{name:'Thử lại'}).click();const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-menu-animations','reduced');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(canvas).toHaveAttribute('data-menu-animations','hidden');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(canvas).toHaveAttribute('data-menu-animations','reduced');
});

test('short portrait controls remain disjoint and Tab can leave the canvas',async({page},info)=>{
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');const canvas=page.locator('canvas');
  await tap(page,'menu-start');await tap(page,'pause',false);await tap(page,'main-menu',false);
  await page.setViewportSize({width:320,height:400});
  await expect.poll(async()=>{
    const targets=JSON.parse((await canvas.getAttribute('data-menu-targets'))??'[]');
    return targets.length===3&&targets.every((c:{y:number;height:number},i:number)=>c.y>=0&&c.y+c.height<=640&&(i===2||c.y+c.height<=targets[i+1].y));
  }).toBe(true);
  const first=JSON.parse((await canvas.getAttribute('data-menu-targets'))!)[0],bounds=(await canvas.boundingBox())!;
  await page.touchscreen.tap(bounds.x+180*bounds.width/360,bounds.y+(first.y+first.height-2)*bounds.height/640);
  await expect(canvas).toHaveAttribute('data-menu-dialog','new-session');await tap(page,'menu-new-cancel');
  await page.screenshot({path:info.outputPath('menu-short.png')});
  await page.evaluate(()=>{const next=document.createElement('button');next.id='outside-game';next.textContent='Outside game';document.body.append(next);});
  await canvas.focus();
  // Cancel restored Start focus; move through Continue to Settings.
  for(let i=0;i<2;i++)await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');await expect(canvas).toHaveAttribute('data-menu-dialog','settings');
  await page.keyboard.press('Escape');
  for(let i=0;i<4;i++)await page.keyboard.press('Tab');
  await expect(page.locator('#outside-game')).toBeFocused();
});
