import {expect,test,type Page} from '@playwright/test';

async function tap(page:Page,id:string,menu=false){
  const canvas=page.locator('canvas'),attr=menu?'data-menu-targets':'data-controls';
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute(attr)??'[]').some((c:{id:string;enabled?:boolean;disabled?:boolean})=>c.id===id&&(menu?!c.disabled:c.enabled))).toBe(true);
  const c=JSON.parse(await canvas.getAttribute(attr)??'[]').find((c:{id:string})=>c.id===id),b=(await canvas.boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}

test('Continue day one enters the five-tab summary hub and opens the same unstarted shift',async({page},info)=>{
  await page.goto('/?mode=shop');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-screen','preparation-hub');await expect(canvas).toHaveAttribute('data-summary-tab','summary');
  const cash=await canvas.getAttribute('data-cash'),stock=await canvas.getAttribute('data-stock');
  const labels=[...JSON.parse(await canvas.getAttribute('data-labels')??'[]').map((l:{text:string})=>l.text),...JSON.parse(await canvas.getAttribute('data-hub-header-labels')??'[]')];
  expect(labels).toEqual(expect.arrayContaining(['Tổng kết','Chợ','Kho','Quán','Nhiệm vụ','Ngày 1/30 chưa bắt đầu']));
  expect(labels).not.toContain('Đặt nguyên liệu trong ca');
  await tap(page,'pause');await tap(page,'main-menu');await expect(canvas).toHaveAttribute('data-screen','menu');
  await tap(page,'menu-continue',true);await expect(canvas).toHaveAttribute('data-screen','preparation-hub');await expect(canvas).toHaveAttribute('data-summary-tab','summary');
  await expect(canvas).toHaveAttribute('data-cash',cash!);await expect(canvas).toHaveAttribute('data-stock',stock!);
  await expect(canvas).toHaveAttribute('data-day-summary','null');
  await canvas.screenshot({path:info.outputPath('continue-day-one-summary.png')});
  await tap(page,'summary-open-first-day');await expect(canvas).toHaveAttribute('data-shop','making');await expect(canvas).toHaveAttribute('data-screen','game');
});
