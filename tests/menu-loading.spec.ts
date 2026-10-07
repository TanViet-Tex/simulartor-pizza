import {expect,test,type Page} from '@playwright/test';

async function tap(page:Page,id:string){
  const canvas=page.locator('canvas');
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-menu-targets')??'[]').some((t:{id:string;disabled:boolean})=>t.id===id&&!t.disabled)).toBe(true);
  const t=JSON.parse(await canvas.getAttribute('data-menu-targets')??'[]').find((t:{id:string})=>t.id===id),b=(await canvas.boundingBox())!;
  await page.touchscreen.tap(b.x+(t.x+t.width/2)*b.width/360,b.y+(t.y+t.height/2)*b.height/640);
}

test('menu reports actual asset progress and blocks repeat actions until the game is ready',async({page},info)=>{
  let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
  await page.route(url=>decodeURIComponent(url.pathname).endsWith('/Quán.png'),async route=>{await gate;await route.continue();});
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-menu-dialog','none');
  await page.evaluate(()=>{const canvas=document.querySelector('canvas')!;const values:number[]=[];(window as any).loadingValues=values;new MutationObserver(()=>{const v=canvas.dataset.menuLoadingProgress;if(v!==undefined)values.push(Number(v));}).observe(canvas,{attributes:true,attributeFilter:['data-menu-loading-progress']});});
  await tap(page,'menu-start');await expect(canvas).toHaveAttribute('data-menu-dialog','loading');
  await expect.poll(async()=>Number(await canvas.getAttribute('data-menu-loading-progress'))).toBeGreaterThan(10);
  const percent=Number(await canvas.getAttribute('data-menu-loading-progress'));expect(percent).toBeLessThan(100);
  expect(JSON.parse(await canvas.getAttribute('data-labels')??'[]').some((t:{text:string})=>t.text==='Đang tải dữ liệu…')).toBe(true);
  await expect(canvas).toHaveAttribute('data-menu-targets','[]');
  await expect(canvas).toHaveAttribute('data-notification-frame','');
  await page.keyboard.press('Escape');await expect(canvas).toHaveAttribute('data-menu-dialog','loading');
  await page.touchscreen.tap(180,550);await expect(canvas).toHaveAttribute('data-screen','menu');
  await canvas.screenshot({path:info.outputPath('menu-loading.png')});release();
  await expect(canvas).toHaveAttribute('data-screen','game');await expect(canvas).toHaveAttribute('data-tutorial','customer');
  await expect(canvas).toHaveAttribute('data-cash','500');await expect(canvas).not.toHaveAttribute('data-paused',/menu/);
  const values:number[]=await page.evaluate(()=>(window as any).loadingValues);expect(values).toContain(100);
  expect(values.every((v,i)=>i===0||v>=values[i-1])).toBe(true);expect(errors).toEqual([]);
  await page.reload();await expect(canvas).toHaveAttribute('data-menu-dialog','none');await tap(page,'menu-continue');
  await expect(canvas).toHaveAttribute('data-screen','game');await expect(canvas).toHaveAttribute('data-tutorial','customer');
  await expect(canvas).not.toHaveAttribute('data-paused',/menu|save/);expect(errors).toEqual([]);
});

test('failed campaign write dismisses loading and retry can enter the game',async({page})=>{
  await page.addInitScript(()=>{
    (window as any).failCampaignWrite=true;const original=IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put=function(...args:Parameters<typeof original>){if((window as any).failCampaignWrite)throw new DOMException('test write failed','QuotaExceededError');return original.apply(this,args);};
  });
  await page.goto('/');const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-menu-dialog','none');
  await tap(page,'menu-start');await expect(canvas).toHaveAttribute('data-menu-dialog','save-error');
  await expect(canvas).not.toHaveAttribute('data-menu-loading-progress',/.+/);
  await page.evaluate(()=>{(window as any).failCampaignWrite=false;});await tap(page,'menu-save-retry');
  await expect(canvas).toHaveAttribute('data-screen','game');await expect(canvas).toHaveAttribute('data-cash','500');
  await expect(canvas).not.toHaveAttribute('data-paused',/menu|save/);
});
