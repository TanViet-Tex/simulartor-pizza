import {expect,test,type Page} from '@playwright/test';

async function tap(page:Page,id:string){
  const canvas=page.locator('canvas');
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-controls')??'[]').some((c:{id:string;enabled:boolean})=>c.id===id&&c.enabled)).toBe(true);
  const controls=JSON.parse(await canvas.getAttribute('data-controls')??'[]');
  const c=controls.find((c:{id:string})=>c.id===id),b=(await canvas.boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}

test('rotation adds no portrait gate and preserves foreground/user pause ownership',async({page})=>{
  await page.goto('/?mode=freeplay');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-paused','');
  await tap(page,'pause');
  await page.setViewportSize({width:844,height:390});
  await expect(canvas).toHaveAttribute('data-paused','user');
  await expect(page.locator('#orientation-notice')).toHaveCount(0);
  await page.evaluate(()=>{
    Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(canvas).toHaveAttribute('data-paused','user,visibility');
  await tap(page,'resume');await expect(canvas).toHaveAttribute('data-paused','user');
  await tap(page,'resume');await expect(canvas).toHaveAttribute('data-paused','');
  await tap(page,'dough');await expect(canvas).toHaveAttribute('data-ingredients','dough');
  await page.setViewportSize({width:390,height:844});
  await expect(canvas).not.toHaveAttribute('data-paused',/orientation/);
  await expect(canvas).toHaveAttribute('data-ingredients','dough');
});

test('tutorial starts in landscape and retains only its tutorial pause',async({page})=>{
  await page.setViewportSize({width:844,height:390});
  await page.goto('/?mode=tutorial');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-paused','tutorial');
  await expect(page.locator('#orientation-notice')).toHaveCount(0);
  await tap(page,'dough');await expect(canvas).toHaveAttribute('data-tutorial','sauce');
});

test('main menu can start a campaign in landscape',async({page})=>{
  await page.setViewportSize({width:844,height:390});await page.goto('/');
  const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-screen','menu');
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-menu-targets')??'[]').some((c:{id:string;disabled:boolean})=>c.id==='menu-start'&&!c.disabled)).toBe(true);
  const c=JSON.parse(await canvas.getAttribute('data-menu-targets')??'[]').find((c:{id:string})=>c.id==='menu-start'),b=(await canvas.boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
  await expect(canvas).toHaveAttribute('data-paused','tutorial');
  await expect(page.locator('#orientation-notice')).toHaveCount(0);
});
