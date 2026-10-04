import {expect,test,type Page} from '@playwright/test';

type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function tapAt(page:Page,x:number,y:number){
  const bounds=(await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(bounds.x+x*bounds.width/360,bounds.y+y*bounds.height/640);
}
async function tap(page:Page,id:string){
  const canvas=page.locator('canvas');
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-controls'))??'[]').some((c:Control)=>c.id===id&&c.enabled)).toBe(true);
  const control=(JSON.parse((await canvas.getAttribute('data-controls'))!) as Control[]).find(c=>c.id===id)!;
  await tapAt(page,control.x+control.width/2,control.y+control.height/2);
}

test('reference grid uses real touch coordinates through resize and modal blocking',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?mode=freeplay');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-stage','assembly');
  // Touch the visible artwork rather than relying on expanded hit-zone metadata.
  await tapAt(page,45,514);await expect(canvas).toHaveAttribute('data-ingredients','dough');
  await tapAt(page,45,470);await expect(canvas).toHaveAttribute('data-ingredients','dough,sauce');
  await tapAt(page,112,514);await expect(canvas).toHaveAttribute('data-ingredients','dough,sauce,cheese');
  const controls=JSON.parse((await canvas.getAttribute('data-controls'))!) as Control[];
  expect(controls.find(c=>c.id==='bake')!.x).toBeGreaterThan(230);
  expect(controls.find(c=>c.id==='box')!.enabled).toBe(false);
  const actionLabels=JSON.parse((await canvas.getAttribute('data-labels'))!).filter((label:{x:number;y:number})=>label.x<230&&label.y>=410&&label.y<440).map((label:{text:string})=>label.text);
  expect(actionLabels).toEqual(['Đóng hộp','Giao bánh']);
  await tapAt(page,313,470); // Extra sauce is a real layer, even for a wrong recipe.
  await expect(canvas).toHaveAttribute('data-ingredients','dough,sauce,cheese,sauce-hot');
  await tap(page,'pause');
  await tapAt(page,313,605); // Trash is behind the pause modal.
  await expect(canvas).toHaveAttribute('data-ingredients','dough,sauce,cheese,sauce-hot');
  await tap(page,'pause-settings');await tap(page,'settings-effects-less');await tap(page,'pause-settings-back');await tap(page,'resume');
  const before=page.viewportSize()!;
  await page.setViewportSize(before.width===360?{width:390,height:844}:{width:360,height:640});
  await tapAt(page,313,605);await expect(canvas).toHaveAttribute('data-ingredients','');
  await expect(canvas).toHaveAttribute('data-cash','300');
  await tapAt(page,45,514);await expect(canvas).toHaveAttribute('data-ingredients','dough');
  await page.screenshot({path:info.outputPath('reference-kitchen-mobile.png')});
  const labels=JSON.parse((await canvas.getAttribute('data-labels'))!);
  for(const value of ['Phô mai','Nấm','Xúc xích','Pepperoni','Rau củ','Gà BBQ','Hải sản','Giăm bông']){
    expect(labels.some((label:{text:string})=>label.text.includes(value)),value).toBe(true);
  }
  expect(errors).toEqual([]);
});
