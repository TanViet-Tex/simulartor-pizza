import {test,expect,type Page} from '@playwright/test';
async function tap(page:Page,id:string,menu=false){
  const canvas=page.locator('canvas'),attr=menu?'data-menu-targets':'data-controls';
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute(attr)??'[]').some((c:any)=>c.id===id&&(menu?!c.disabled:c.enabled))).toBe(true);
  const c=JSON.parse(await canvas.getAttribute(attr)??'[]').find((c:any)=>c.id===id),b=(await canvas.boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}
async function prep(page:Page){await page.goto('/?mode=shop');await expect(page.locator('canvas')).toHaveAttribute('data-screen','preparation-hub',{timeout:20000});}
const input=(page:Page)=>page.getByRole('textbox',{name:'Mã nhận xu'});
test('Menu without a campaign gives guidance, closes native input and preserves controls',async({page})=>{
  await page.goto('/');await expect(page.locator('canvas')).toHaveAttribute('data-screen','menu');await tap(page,'menu-settings',true);await tap(page,'menu-code',true);
  await input(page).fill('VIETVUIVE');await tap(page,'test-code-receive',true);await expect(page.locator('canvas')).toHaveAttribute('data-test-code-feedback',/Bắt đầu/);
  await tap(page,'test-code-cancel',true);await expect(input(page)).toHaveCount(0);await tap(page,'menu-mute',true);await tap(page,'menu-motion',true);await tap(page,'menu-settings-close',true);
});
test('Pause preparation grants exact funds, preserves user pause and rejects repeat after reload',async({page})=>{
  await prep(page);const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-cash','300');await tap(page,'pause');await tap(page,'pause-settings');await tap(page,'settings-code');
  await input(page).fill('wrong');await tap(page,'test-code-receive');await expect(canvas).toHaveAttribute('data-test-code-feedback','Mã không hợp lệ.');await expect(canvas).toHaveAttribute('data-cash','300');
  await input(page).fill(' vietvuive ');await tap(page,'test-code-receive');await expect(canvas).toHaveAttribute('data-test-code-feedback',/Đã nhận 100.000/);await expect(canvas).toHaveAttribute('data-cash','100300');
  await page.screenshot({path:'_bmad-output/implementation-artifacts/ui-baseline/test-code-received-2026-10-06.png'});
  await input(page).focus();await input(page).press('Escape');await expect(input(page)).toHaveCount(0);await expect(canvas).toHaveAttribute('data-paused',/user/);await tap(page,'settings-effects-less');await tap(page,'settings-motion');
  await page.screenshot({path:'_bmad-output/implementation-artifacts/ui-baseline/test-code-settings-2026-10-06.png'});
  await tap(page,'pause-settings-back');await tap(page,'resume');await expect(canvas).toHaveAttribute('data-paused','');
  await page.reload();await expect(canvas).toHaveAttribute('data-cash','100300');await tap(page,'pause');await tap(page,'pause-settings');await tap(page,'settings-code');await input(page).fill('VIETVUIVE');await tap(page,'test-code-receive');await expect(canvas).toHaveAttribute('data-test-code-feedback',/đã được nhận/);
});
test('Menu uses the live preparation session and credits exactly once',async({page})=>{
  await prep(page);await tap(page,'pause');await tap(page,'main-menu');await tap(page,'menu-settings',true);await tap(page,'menu-code',true);await input(page).fill('VIETVUIVE');await tap(page,'test-code-receive',true);await expect(page.locator('canvas')).toHaveAttribute('data-test-code-feedback',/Đã nhận 100.000/);
  await tap(page,'test-code-cancel',true);await tap(page,'menu-settings-close',true);await tap(page,'menu-continue',true);await expect(page.locator('canvas')).toHaveAttribute('data-cash','100300');await expect(input(page)).toHaveCount(0);
});
test('Pause and Menu during a live shift never claim or save test funds',async({page})=>{
  await prep(page);const canvas=page.locator('canvas');await tap(page,'summary-open-first-day');await expect(canvas).toHaveAttribute('data-screen','game');
  await tap(page,'pause');await tap(page,'pause-settings');await tap(page,'settings-code');await input(page).fill('VIETVUIVE');await tap(page,'test-code-receive');await expect(canvas).toHaveAttribute('data-test-code-feedback',/chốt ngày/);await expect(canvas).toHaveAttribute('data-cash','300');
  await tap(page,'test-code-cancel');await tap(page,'pause-settings-back');await tap(page,'main-menu');await tap(page,'menu-settings',true);await tap(page,'menu-code',true);await input(page).fill('VIETVUIVE');await tap(page,'test-code-receive',true);await expect(canvas).toHaveAttribute('data-test-code-feedback',/chốt ngày/);
});
