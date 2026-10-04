import { expect, test, type Page } from '@playwright/test';
type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function controls(page:Page):Promise<Control[]>{return JSON.parse((await page.locator('canvas').getAttribute('data-controls'))??'[]');}
async function tap(page:Page,id:string){
  // Slow headless rendering can trigger the real interruption guard. Recover by
  // the same explicit gesture a player uses, before requesting an unrelated action.
  if(id!=='resume'&&await page.locator('canvas').getAttribute('data-paused')==='gap')await tap(page,'resume');
  await expect.poll(async()=>(await controls(page)).some(c=>c.id===id&&c.enabled)).toBe(true);
  const c=(await controls(page)).find(c=>c.id===id)!,b=(await page.locator('canvas').boundingBox())!;
  expect(c.width*b.width/360).toBeGreaterThanOrEqual(48);expect(c.height*b.height/640).toBeGreaterThanOrEqual(48);
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
}
async function hideReturn(page:Page){await page.evaluate(()=>{
  Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
  Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));
});}
async function at(page:Page,x:number,y:number){const b=(await page.locator('canvas').boundingBox())!;await page.touchscreen.tap(b.x+x*b.width/360,b.y+y*b.height/640);}

test('HUD bands, safe insets, gesture audio and covered input ownership',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/?mode=freeplay');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-audio','locked');
  expect(JSON.parse((await canvas.getAttribute('data-bands'))!)).toMatchObject({status:{height:48},tickets:{height:112},work:{height:251},actions:{height:229}});
  // Ingredient shelves and the phase action keep the pre-1.7 geometry.
  expect((await controls(page)).find(c=>c.id==='sauce')).toMatchObject({x:8,y:464,width:54,height:50});
  expect((await controls(page)).find(c=>c.id==='cheese')).toMatchObject({x:16,y:524,width:60,height:50});
  const original=page.viewportSize()!;await page.setViewportSize({width:360,height:640});
  await expect.poll(async()=>Math.round((await canvas.boundingBox())!.width)).toBe(360);
  for(const c of (await controls(page)).filter(c=>c.enabled)){
    expect(c.width).toBeGreaterThanOrEqual(48);expect(c.height).toBeGreaterThanOrEqual(48);
    for(const other of (await controls(page)).filter(o=>o.enabled&&o.id!==c.id)){
      const overlap=Math.min(c.x+c.width,other.x+other.width)>Math.max(c.x,other.x)&&Math.min(c.y+c.height,other.y+other.height)>Math.max(c.y,other.y);
      expect(overlap,`${c.id} overlaps ${other.id}`).toBe(false);
    }
  }
  await page.screenshot({path:info.outputPath('hud-360x640.png')});await page.setViewportSize(original);
  const b=(await canvas.boundingBox())!;
  for(const c of await controls(page)){expect(c.width*b.width/360).toBeGreaterThanOrEqual(48);expect(c.height*b.height/640).toBeGreaterThanOrEqual(48);}
  await tap(page,'dough');await expect(canvas).toHaveAttribute('data-audio','running');
  await tap(page,'mute');await expect(canvas).toHaveAttribute('data-muted','true');
  await tap(page,'customer-linh');await tap(page,'order');await expect(canvas).toHaveAttribute('data-paused','order');
  await at(page,35,489);await at(page,46,549);await at(page,85,20);
  await expect(canvas).toHaveAttribute('data-ingredients','dough');await expect(canvas).toHaveAttribute('data-paused','order');
  expect((await controls(page)).filter(c=>c.enabled).map(c=>c.id)).toEqual(['close-order']);
  await page.screenshot({path:info.outputPath('frozen-order.png')});
  await tap(page,'close-order');await tap(page,'mute');await expect(canvas).toHaveAttribute('data-muted','false');
  await page.evaluate(()=>{document.body.style.setProperty('--safe-top','20px');document.body.style.setProperty('--safe-bottom','24px');window.dispatchEvent(new Event('resize'));});
  const height=page.viewportSize()!.height;
  await expect.poll(async()=>{const box=(await canvas.boundingBox())!;return box.y>=20&&box.y+box.height<=height-24;}).toBe(true);
  expect(errors).toEqual([]);
});

test('a stalled active render pauses before any oven catch-up',async({page})=>{
  await page.goto('/?mode=freeplay');const canvas=page.locator('canvas');
  for(const id of ['dough','sauce','cheese','bake'])await tap(page,id);
  await page.evaluate(()=>{const until=performance.now()+325;while(performance.now()<until){ /* deliberate test-only main-thread interruption */ }});
  await expect(canvas).toHaveAttribute('data-paused','gap');const oven=await canvas.getAttribute('data-oven');
  await page.waitForTimeout(300);await expect(canvas).toHaveAttribute('data-oven',oven!);
  await tap(page,'resume');await expect(canvas).toHaveAttribute('data-paused','');
});

test('campaign recovery remains above foreground interruption',async({page})=>{
  await page.addInitScript(()=>{IDBFactory.prototype.open=()=>{throw Error('storage unavailable');};});
  await page.goto('/?mode=campaign');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-recovery','true');await hideReturn(page);
  await expect(canvas).toHaveAttribute('data-paused','visibility');
  await at(page,180,490);
  await expect(canvas).toHaveAttribute('data-recovery','true');await expect(canvas).toHaveAttribute('aria-label',/error/);
  await expect(canvas).toHaveAttribute('data-paused','visibility');
  await expect(page.locator('#orientation-notice')).toBeHidden();
});

test('foreground Continue owns only its interruption while oven and order remain frozen',async({page},info)=>{
  await page.goto('/?mode=freeplay');const canvas=page.locator('canvas');
  for(const id of ['dough','sauce','cheese','bake','pause'])await tap(page,id);
  await hideReturn(page);await expect(canvas).toHaveAttribute('data-paused','user,visibility');
  const frozen=await canvas.getAttribute('data-oven');await page.waitForTimeout(350);await expect(canvas).toHaveAttribute('data-oven',frozen!);
  const original=page.viewportSize()!;await page.setViewportSize({width:original.height,height:original.width});
  await expect(canvas).toHaveAttribute('data-paused','user,visibility');expect((await controls(page)).some(c=>c.id==='resume'&&c.enabled)).toBe(true);
  await page.setViewportSize(original);await expect(canvas).toHaveAttribute('data-paused','user,visibility');
  await tap(page,'resume');await expect(canvas).toHaveAttribute('data-paused','user');
  await tap(page,'resume');await expect(canvas).toHaveAttribute('data-paused','');
  await tap(page,'customer-linh');await tap(page,'order');await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
  await expect(canvas).toHaveAttribute('data-paused','order,visibility');
  await tap(page,'resume');await expect(canvas).toHaveAttribute('data-paused','order');
  await page.screenshot({path:info.outputPath('remaining-order-lease.png')});
  await tap(page,'close-order');await expect(canvas).toHaveAttribute('data-paused','');
});

test('reduced motion and equivalent 200% modal text retain recovery and touch scrolling',async({page},info)=>{
  test.setTimeout(60000);
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/?mode=freeplay');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-reduced-motion','true');await tap(page,'customer-linh');await tap(page,'order');
  await page.evaluate(()=>{document.documentElement.style.fontSize='32px';window.dispatchEvent(new Event('resize'));});
  await expect(canvas).toHaveAttribute('data-text-scale','2');
  async function fixedPixels(){return canvas.evaluate(async element=>{
    await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));const copy=document.createElement('canvas');copy.width=360;copy.height=640;
    const context=copy.getContext('2d')!;context.drawImage(element as HTMLCanvasElement,0,0,360,640);
    return {heading:Array.from(context.getImageData(22,208,316,60).data),button:Array.from(context.getImageData(64,350,232,54).data)};
  });}
  const fixed=await fixedPixels();
  const bounds=(await canvas.boundingBox())!;
  await page.mouse.move(bounds.x+100*bounds.width/360,bounds.y+324*bounds.height/640);await page.mouse.down();
  await page.mouse.move(bounds.x+100*bounds.width/360,bounds.y+280*bounds.height/640,{steps:8});await page.mouse.up();
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-modal-scroll'))!)[0].offset).toBeGreaterThan(0);
  expect(await fixedPixels()).toEqual(fixed);
  await page.screenshot({path:info.outputPath('modal-200-percent.png')});
  await expect.poll(async()=>page.evaluate(()=>document.documentElement.scrollHeight<=window.innerHeight&&document.body.scrollHeight<=window.innerHeight)).toBe(true);
  await tap(page,'close-order');await tap(page,'pause');await tap(page,'resume');await expect(canvas).toHaveAttribute('data-paused','');
});

test('system reduced motion still wins after an explicit false menu preference',async({page})=>{
  await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('/');const canvas=page.locator('canvas');
  async function menuTap(id:string){
    await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-menu-targets'))??'[]').some((c:{id:string;disabled:boolean})=>c.id===id&&!c.disabled)).toBe(true);
    const c=JSON.parse((await canvas.getAttribute('data-menu-targets'))!).find((c:{id:string})=>c.id===id);await at(page,c.x+c.width/2,c.y+c.height/2);
  }
  await menuTap('menu-settings');await menuTap('menu-motion');await menuTap('menu-motion');
  await expect(canvas).toHaveAttribute('data-menu-reduced-motion','false');await menuTap('menu-settings-close');await menuTap('menu-start');
  await expect(canvas).toHaveAttribute('data-screen','game');await page.emulateMedia({reducedMotion:'reduce'});
  await expect(canvas).toHaveAttribute('data-reduced-motion','true');
});

test('three tickets retain owner timers and a short frame profile while another ticket is selected',async({page},info)=>{
  test.setTimeout(110000);await page.goto('/?mode=shop');const canvas=page.locator('canvas');
  for(const id of ['dough','sauce','cheese','mushroom']){await tap(page,`market-plus-${id}`);await tap(page,`market-plus-${id}`);await tap(page,`market-buy-${id}`);}
  await tap(page,'market-open');
  await expect.poll(async()=>{
    if(await canvas.getAttribute('data-paused')==='gap')await tap(page,'resume');
    if(await canvas.getAttribute('data-paused')==='bargain')await tap(page,'accept-bargain');
    return JSON.parse((await canvas.getAttribute('data-tickets'))??'[]').length;
  },{timeout:95000}).toBe(3);
  const tickets=JSON.parse((await canvas.getAttribute('data-tickets'))!);
  for(const id of ['dough','sauce','cheese','bake'])await tap(page,id);
  await tap(page,`ticket-${tickets[1].id}`);
  await expect(canvas).toHaveAttribute('data-oven-owner',tickets[0].id);
  await expect.poll(async()=>Number(await canvas.getAttribute('data-oven'))).toBeGreaterThan(0);
  const frame=await page.evaluate(()=>new Promise<{frames:number;maxSlowRun:number;intervals:number[]}>(resolve=>{
    let previous=performance.now(),start=previous,frames=0,slowRun=0,maxSlowRun=0;const intervals:number[]=[];
    function sample(now:number){const delta=now-previous;previous=now;frames++;intervals.push(delta);
      slowRun=delta>1000/30?slowRun+delta:0;maxSlowRun=Math.max(maxSlowRun,slowRun);
      if(now-start>=1500)resolve({frames,maxSlowRun,intervals});else requestAnimationFrame(sample);
    }requestAnimationFrame(sample);
  }));
  await info.attach('three-ticket-frame-sample',{body:JSON.stringify(frame),contentType:'application/json'});
  expect(frame.maxSlowRun).toBeLessThanOrEqual(1000);
  expect(Number(await canvas.getAttribute('data-static-texture-count'))).toBeLessThanOrEqual(96);
  expect(Number(await canvas.getAttribute('data-static-texture-bytes'))).toBeLessThan(32*1024*1024);
  await tap(page,'pause');await page.screenshot({path:info.outputPath('three-tickets-frozen.png')});
  await hideReturn(page);await tap(page,'resume');await expect(canvas).toHaveAttribute('data-paused','user');
});
