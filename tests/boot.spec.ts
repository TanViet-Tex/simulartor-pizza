import { expect, test, type Page, type Route } from '@playwright/test';
import { UI_THEME } from '../src/presentation/theme';

const ready=async(page:Page)=>{
  await expect(page.locator('html')).toHaveAttribute('data-startup','ready');
  await expect(page.locator('canvas')).toHaveAttribute('data-booted','true');
};
test('cold boot meets local production budget and mobile typography contract',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await ready(page);
  const evidence=await page.evaluate(()=>{
    const nav=performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources=performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return {observedMs:performance.now(),decodedBytes:nav.decodedBodySize+resources.reduce((sum,r)=>sum+r.decodedBodySize,0),resources:resources.map(r=>({name:r.name,bytes:r.decodedBodySize}))};
  });
  expect(evidence.observedMs).toBeLessThanOrEqual(5000);
  expect(evidence.decodedBytes).toBeGreaterThan(0);expect(evidence.decodedBytes).toBeLessThanOrEqual(10*1024*1024);
  await info.attach('boot-budget.json',{body:JSON.stringify(evidence,null,2),contentType:'application/json'});
  console.log(`${info.project.name} boot: ${Math.round(evidence.observedMs)}ms; ${evidence.decodedBytes} decoded bytes`);
  const canvas=page.locator('canvas'),bounds=(await canvas.boundingBox())!;
  const labels=JSON.parse((await canvas.getAttribute('data-labels'))!);
  for(const label of labels){
    expect(label.font,label.text).toBe(UI_THEME.typography.fontFamily);expect(label.spacing).toBe(0);
    expect(parseFloat(label.size),label.text).toBeGreaterThanOrEqual(UI_THEME.typography.minSize);
    expect(label.x,label.text).toBeGreaterThanOrEqual(0);expect(label.y,label.text).toBeGreaterThanOrEqual(0);
    expect(label.x+label.width,label.text).toBeLessThanOrEqual(360);expect(label.y+label.height,label.text).toBeLessThanOrEqual(640);
  }
  for(const c of JSON.parse((await canvas.getAttribute('data-controls'))!)){
    expect(c.width*bounds.width/360,c.id).toBeGreaterThanOrEqual(48);
    expect(c.height*bounds.height/640,c.id).toBeGreaterThanOrEqual(48);
  }
  // Essential panel boundary and green primary fill are actually rendered.
  const pixels=await canvas.evaluate(async el=>{
    await new Promise<void>(r=>requestAnimationFrame(()=>r()));
    const copy=document.createElement('canvas');copy.width=360;copy.height=640;
    const ctx=copy.getContext('2d')!;ctx.drawImage(el as HTMLCanvasElement,0,0);
    return Array.from(ctx.getImageData(180,10,1,1).data);
  });
  expect(pixels[3]).toBe(255);expect(errors).toEqual([]);
  await page.screenshot({path:info.outputPath('portrait-theme.png')});
});

test('nonzero safe areas keep the canvas and Vietnamese labels inside usable space',async({page},info)=>{
  await page.goto('/');await ready(page);
  await page.evaluate(()=>{
    for(const [side,px] of Object.entries({top:20,right:4,bottom:16,left:4}))document.body.style.setProperty(`--safe-${side}`,`${px}px`);
    window.dispatchEvent(new Event('resize'));
  });
  await expect.poll(async()=>{
    const b=(await page.locator('canvas').boundingBox())!,v=page.viewportSize()!;
    return b.x>=3&&b.y>=19&&b.x+b.width<=v.width-3&&b.y+b.height<=v.height-15;
  }).toBe(true);
  const canvas=page.locator('canvas'),bounds=(await canvas.boundingBox())!;
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-controls'))!).every((c:{width:number;height:number})=>c.width*bounds.width/360>=47.99&&c.height*bounds.height/640>=47.99)).toBe(true);
  // The layout uses the requested safe-area space; screenshots cover glyph clipping.
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:info.outputPath('safe-area.png')});
});

test('invalid content blocks both attempts without checkpoint access, then retry recovers',async({page})=>{
  await page.addInitScript(()=>{IDBFactory.prototype.open=()=>{throw new Error('Unexpected checkpoint access before startup');};});
  let broken=true;
  await page.route('**/game-content.json',async route=>broken?route.fulfill({json:{version:1,ingredients:[],recipes:[]}}):route.continue());
  await page.goto('/');
  for(let attempt=0;attempt<2;attempt++){
    await expect(page.locator('html')).toHaveAttribute('data-startup-error','config');
    await expect(page.locator('canvas')).not.toHaveAttribute('data-stage',/assembly/);
    const retry=page.getByRole('button',{name:'Thử lại'}),b=(await retry.boundingBox())!;
    expect(b.height).toBeGreaterThanOrEqual(48);expect(b.width).toBeGreaterThanOrEqual(48);
    if(attempt===1)broken=false;
    await retry.click();
  }
  await ready(page);await expect(page.locator('canvas')).toHaveAttribute('data-screen','menu');
});

test('required SVG failure blocks gameplay and can be retried after repair',async({page},info)=>{
  let broken=true;
  await page.route('**/assets/ui/sauce.svg',route=>broken?route.abort():route.continue());
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-startup-error','assets');
  await expect(page.locator('canvas')).not.toHaveAttribute('data-stage',/assembly/);
  await page.screenshot({path:info.outputPath('asset-retry.png')});
  broken=false;await page.getByRole('button',{name:'Thử lại'}).click();await ready(page);
});

test('campaign also stays before storage when content is invalid',async({page})=>{
  let storageReads=0;
  await page.exposeFunction('recordStorageRead',()=>{storageReads++;});
  await page.addInitScript(()=>{IDBFactory.prototype.open=()=>{void (window as unknown as {recordStorageRead:()=>void}).recordStorageRead();throw new Error('blocked');};});
  await page.route('**/game-content.json',route=>route.fulfill({json:{version:999}}));
  await page.goto('/?mode=campaign');
  await expect(page.locator('html')).toHaveAttribute('data-startup-error','config');
  expect(storageReads).toBe(0);
});

test('malformed SVG response is blocked and repaired retry reaches the kitchen',async({page})=>{
  let broken=true;
  await page.route('**/assets/ui/sauce.svg',route=>broken?route.fulfill({contentType:'image/svg+xml',body:'<svg>invalid'}):route.continue());
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-startup-error','assets',{timeout:12000});
  broken=false;await page.getByRole('button',{name:'Thử lại'}).click();await ready(page);
});

test('campaign recovers after invalid configuration is repaired',async({page})=>{
  let broken=true;
  await page.route('**/game-content.json',route=>broken?route.fulfill({json:{}}):route.continue());
  await page.goto('/?mode=campaign');await expect(page.locator('html')).toHaveAttribute('data-startup-error','config');
  broken=false;await page.getByRole('button',{name:'Thử lại'}).click();await ready(page);
  await expect(page.locator('canvas')).toHaveAttribute('aria-label',/start/);
});

test('late response from timed-out asset cannot break a successful retry',async({page},info)=>{
  test.skip(info.project.name!=='chromium-360x640','Timing regression needs one browser run; all profiles cover immediate failure/retry.');
  let stale:Route|undefined;
  await page.route('**/assets/ui/sauce.svg',route=>{if(!stale){stale=route;return;}return route.continue();});
  await page.goto('/');await expect(page.locator('html')).toHaveAttribute('data-startup-error','assets',{timeout:12000});
  await page.getByRole('button',{name:'Thử lại'}).click();await ready(page);
  await stale!.abort().catch(()=>{});
  await page.waitForTimeout(300);
  await expect(page.locator('html')).toHaveAttribute('data-startup','ready');
  await expect(page.locator('canvas')).toHaveAttribute('data-screen','menu');
});

test('visible control wins over expanded neighbour on short portrait screens',async({page},info)=>{
  test.skip(info.project.name!=='chromium-360x640','Additional small-screen regression.');
  await page.setViewportSize({width:320,height:480});await page.goto('/?mode=tutorial');await ready(page);
  const canvas=page.locator('canvas');
  const tap=async(x:number,y:number)=>{const b=(await canvas.boundingBox())!;await page.touchscreen.tap(b.x+x*b.width/360,b.y+y*b.height/640);};
  await tap(116,354);await expect(canvas).toHaveAttribute('data-ingredients','dough');
  await tap(35,490);await expect(canvas).toHaveAttribute('data-ingredients','dough,sauce');
  await tap(46,545);await expect(canvas).toHaveAttribute('data-ingredients','dough,sauce,cheese');
  await tap(30,458);await expect(canvas).toHaveAttribute('data-stage','baking');
});
