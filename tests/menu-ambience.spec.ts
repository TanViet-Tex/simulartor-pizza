import { expect, test, type Page } from '@playwright/test';

async function tap(page:Page,id:string,menu=true):Promise<void>{
  const canvas=page.locator('canvas'),attribute=menu?'data-menu-targets':'data-controls';
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute(attribute))??'[]').some((c:{id:string;disabled?:boolean;enabled?:boolean})=>c.id===id&&(menu?!c.disabled:c.enabled))).toBe(true);
  const control=JSON.parse((await canvas.getAttribute(attribute))!).find((c:{id:string})=>c.id===id),bounds=(await canvas.boundingBox())!;
  await page.touchscreen.tap(bounds.x+(control.x+control.width/2)*bounds.width/360,bounds.y+(control.y+control.height/2)*bounds.height/640);
}
async function pixels(page:Page){
  return page.locator('canvas').evaluate(async element=>{
    await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
    const copy=document.createElement('canvas');copy.width=360;copy.height=640;
    const context=copy.getContext('2d')!;context.drawImage(element as HTMLCanvasElement,0,0,360,640);
    const fingerprint=(x:number,y:number,width:number,height:number)=>{
      const bytes=context.getImageData(x,y,width,height).data;let hash=2166136261;
      for(const byte of bytes)hash=Math.imul(hash^byte,16777619);return hash>>>0;
    };
    const plants=[[25,44],[330,52],[301,177],[38,225],[11,248],[161,220],[190,256],[25,283],[94,292],[349,311],[336,371],[17,519]].map(([x,y])=>fingerprint(Math.min(342,Math.max(0,x-9)),y-9,18,18));
    const titlePixels=context.getImageData(110,128,140,44).data;
    let titleInk=0;
    for(let i=0;i<titlePixels.length;i+=4){
      const r=titlePixels[i],g=titlePixels[i+1],b=titlePixels[i+2];
      if(r>130&&r>g*1.35&&g>b*1.4&&b<90&&g<135)titleInk++;
    }
    // Sample the lower crust below the existing vapor sprites, which can extend
    // into y395 and change that region without moving the painted pizza.
    return {titleInk,plants,sign:fingerprint(100,65,140,100),pizza:fingerprint(150,410,45,12),fire:fingerprint(250,248,52,40),curtain:fingerprint(1,125,59,118),steam:fingerprint(110,295,135,72)};
  });
}
test('fire tongues, curtain and pizza steam visibly animate, freeze for reduced motion and restart after menu reentry',async({page,context},info)=>{
  test.setTimeout(60000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-menu-animations','running');
  const first=await pixels(page);await page.waitForTimeout(700);const second=await pixels(page);
  expect(second.fire).not.toEqual(first.fire);expect(second.curtain).not.toEqual(first.curtain);
  expect(second.steam).not.toEqual(first.steam);
  for(let i=0;i<first.plants.length;i++)expect(second.plants[i],`plant ${i}`).not.toEqual(first.plants[i]);
  expect(second.sign).not.toEqual(first.sign);expect(second.pizza).toEqual(first.pizza);
  await page.waitForTimeout(1900);const peak=await pixels(page);
  await page.screenshot({path:info.outputPath('menu-wind-peak.png')});
  await page.screenshot({path:info.outputPath('menu-fire-curtain.png')});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await expect(canvas).toHaveAttribute('data-menu-animations','hidden');
  const hidden=await pixels(page);await page.waitForTimeout(300);expect(await pixels(page)).toEqual(hidden);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await tap(page,'menu-settings');await tap(page,'menu-motion');await tap(page,'menu-settings-close');
  await expect(canvas).toHaveAttribute('data-menu-animations','reduced');
  const stopped=await pixels(page);
  const neutralPage=await context.newPage();await neutralPage.emulateMedia({reducedMotion:'reduce'});await neutralPage.goto('/');
  await expect(neutralPage.locator('canvas')).toHaveAttribute('data-menu-animations','reduced');
  const neutral=await pixels(neutralPage);expect(stopped.plants).toEqual(neutral.plants);expect(stopped.sign).toEqual(neutral.sign);
  // A moving title must retain its ink, not merely its text metadata. This
  // catches clipped glyphs that appeared only while the sign was rotating.
  expect(neutral.titleInk).toBeGreaterThan(300);
  expect(first.titleInk).toBeGreaterThan(neutral.titleInk*.9);
  expect(second.titleInk).toBeGreaterThan(neutral.titleInk*.9);
  expect(peak.titleInk).toBeGreaterThan(neutral.titleInk*.9);
  await neutralPage.close();await page.waitForTimeout(700);expect(await pixels(page)).toEqual(stopped);
  await tap(page,'menu-settings');await tap(page,'menu-motion');await tap(page,'menu-settings-close');
  await tap(page,'menu-start');await tap(page,'pause',false);await tap(page,'main-menu',false);
  await expect(canvas).toHaveAttribute('data-menu-animations','running');
  const returned=await pixels(page);await page.waitForTimeout(700);const next=await pixels(page);
  expect(next.fire).not.toEqual(returned.fire);expect(next.curtain).not.toEqual(returned.curtain);
  expect(next.steam).not.toEqual(returned.steam);
  for(let i=0;i<returned.plants.length;i++)expect(next.plants[i],`returned plant ${i}`).not.toEqual(returned.plants[i]);
  expect(next.sign).not.toEqual(returned.sign);
  expect(errors).toEqual([]);
});
test('missing curtain blocks the menu and retry recovers',async({page})=>{
  let broken=true;await page.route('**/assets/menu-curtain.png',route=>broken?route.abort():route.continue());
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-startup-error','assets');
  await expect(page.locator('canvas')).not.toHaveAttribute('data-screen','menu');
  broken=false;await page.getByRole('button',{name:'Thử lại'}).click();
  await expect(page.locator('canvas')).toHaveAttribute('data-screen','menu');
});

test('Canvas fallback animates plants and sign and freezes with reduced motion',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
    const getContext=HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,kind:string,...args:unknown[]){
      if(kind==='webgl'||kind==='webgl2'||kind==='experimental-webgl')return null;
      return Reflect.apply(getContext,this,[kind,...args]);
    } as typeof getContext;
  });
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');
  await expect(page.locator('canvas')).toHaveAttribute('data-menu-animations','running');
  const first=await pixels(page);await page.waitForTimeout(700);const next=await pixels(page);
  for(let i=0;i<first.plants.length;i++)expect(next.plants[i],`Canvas plant ${i}`).not.toEqual(first.plants[i]);
  expect(next.sign).not.toEqual(first.sign);expect(next.pizza).toEqual(first.pizza);
  await page.waitForTimeout(1900);expect((await pixels(page)).titleInk).toBeGreaterThan(300);
  await page.screenshot({path:info.outputPath('canvas-menu.png')});
  await tap(page,'menu-settings');await tap(page,'menu-motion');await tap(page,'menu-settings-close');
  const still=await pixels(page);await page.waitForTimeout(350);expect(await pixels(page)).toEqual(still);
  expect(errors).toEqual([]);
});
