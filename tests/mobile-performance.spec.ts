import {expect,test,type Page} from '@playwright/test';
async function probe(page:Page){return page.evaluate(()=>(window as any).pizzaPerformance.snapshot());}
async function tap(page:Page,id:string){let c:any;await expect.poll(async()=>{c=JSON.parse(await page.locator('canvas').getAttribute('data-controls')??'[]').find((v:any)=>v.id===id&&v.enabled);return !!c;},{timeout:15000}).toBe(true);const b=(await page.locator('canvas').boundingBox())!;await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);}
test('production mobile clocks retain UI and transient effects do not accumulate',async({page},info)=>{
 test.skip(info.project.name!=='chromium-360x640','Focused Chromium CPU profile only');
 test.setTimeout(90000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?mode=shop&perf=1');await expect(page.locator('canvas')).toHaveAttribute('data-screen','preparation-hub',{timeout:30000});
 const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await page.evaluate(()=>{const p=(window as any).pizzaPerformance,r=p.game.scene.getScene('CozyScene').runtime;for(const id of ['dough','sauce','cheese'])r.buy(id,3);r.openShop();if(r.campaignEvent.id)r.acknowledgeCampaignEvent();r.advanceElapsed(10000);for(const ingredient of ['dough','sauce','cheese'])r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});});
 const live=()=>page.evaluate(()=>{const s=(window as any).pizzaPerformance.game.scene.getScene('CozyScene');return {texts:s.timers.map((t:any)=>t.text.text),heat:s.heatSignature,rings:s.dynamicVisuals.map((v:any)=>v.last),clock:s.runtime.shiftClock.elapsed};});
 await page.waitForTimeout(800);const start=await probe(page),liveStart=await live();await page.evaluate(()=>(window as any).pizzaPerformance.reset());await page.waitForTimeout(4500);const end=await probe(page),liveEnd=await live();
 expect(liveEnd.clock).toBeGreaterThan(liveStart.clock);expect(liveEnd.texts).not.toEqual(liveStart.texts);expect(liveEnd.heat).not.toBe(liveStart.heat);expect(liveEnd.rings).not.toEqual(liveStart.rings);
 const report={start,end};const fsName:string='node:fs';const fs=await import(fsName);fs.writeFileSync(info.outputPath('counts.json'),JSON.stringify(report,null,2));await info.attach('mobile-runtime-counts',{path:info.outputPath('counts.json'),contentType:'application/json'});
 if((globalThis as any).process.env.PIZZA_PERF_BASELINE!=='1'){for(const type of ['Text','Graphics','Image'])expect(end.created[type]??0).toBe(0);expect(end.objects).toBe(start.objects);}
 await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
 await tap(page,'pause');const paused=await probe(page);await page.waitForTimeout(1000);const settled=await probe(page);expect(settled.tweens).toBe(0);expect(settled.timers).toBe(0);
 for(let i=0;i<4;i++){await tap(page,'resume');await tap(page,'pause');}await page.waitForTimeout(400);const repeated=await probe(page);expect(repeated.tweens).toBe(0);expect(repeated.timers).toBe(0);expect(repeated.objects).toBeLessThanOrEqual(paused.objects+2);expect(repeated.listeners).toBe(settled.listeners);
 for(let i=0;i<3;i++){
  await tap(page,'main-menu');await expect(page.locator('canvas')).toHaveAttribute('data-screen','menu');
  await expect.poll(async()=>JSON.parse(await page.locator('canvas').getAttribute('data-menu-targets')??'[]').some((v:any)=>v.id==='menu-continue'&&!v.disabled)).toBe(true);
  const targets=JSON.parse(await page.locator('canvas').getAttribute('data-menu-targets')??'[]'),target=targets.find((v:any)=>v.id==='menu-continue'),b=(await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(b.x+(target.x+target.width/2)*b.width/360,b.y+(target.y+target.height/2)*b.height/640);
  await tap(page,'pause');await page.waitForTimeout(400);const restarted=await probe(page);expect(restarted.tweens).toBe(0);expect(restarted.timers).toBe(0);expect(restarted.listeners).toBe(settled.listeners);expect(restarted.objects).toBeLessThanOrEqual(paused.objects+2);
 }
 await tap(page,'pause-settings');await tap(page,'settings-motion');await tap(page,'pause-settings-back');await page.waitForTimeout(400);const reduced=await probe(page);expect(reduced.tweens).toBe(0);expect(reduced.timers).toBe(0);
 await page.locator('canvas').screenshot({path:info.outputPath('mobile-performance-pause.png')});expect(errors).toEqual([]);
});

test('production freeplay extraction becomes enabled when ready',async({page})=>{
 await page.goto('/?mode=freeplay&perf=1');await expect(page.locator('canvas')).toHaveAttribute('data-stage','assembly');
 await page.evaluate(()=>{const r=(window as any).pizzaPerformance.game.scene.getScene('CozyScene').runtime;for(const ingredient of ['dough','sauce','cheese'])r.dispatch({type:'ingredient',ingredient});r.dispatch({type:'bake'});});
 await expect.poll(async()=>JSON.parse(await page.locator('canvas').getAttribute('data-controls')??'[]').find((c:any)=>c.id==='extract')?.enabled).toBe(false);
 await page.evaluate(()=>{const r=(window as any).pizzaPerformance.game.scene.getScene('CozyScene').runtime;r.advanceElapsed(r.bakeTiming.perfectStart*1000);});
 await expect.poll(async()=>JSON.parse(await page.locator('canvas').getAttribute('data-controls')??'[]').find((c:any)=>c.id==='extract')?.enabled).toBe(true);await tap(page,'extract');await expect(page.locator('canvas')).toHaveAttribute('data-stage','ready');
});

test('staff return countdown updates with no inspected order',async({page})=>{
 await page.goto('/?mode=shop&perf=1');await expect(page.locator('canvas')).toHaveAttribute('data-screen','preparation-hub');
 // Seed the valid post-handoff state; exercise the production renderer and real fixed-step clock.
 await page.evaluate(()=>{const s=(window as any).pizzaPerformance.game.scene.getScene('CozyScene'),r=s.runtime;r.openShop();if(r.campaignEvent.id)r.acknowledgeCampaignEvent();r.courier={mode:'staff',phase:'return',ticketId:'already-handed-off',remaining:20};s.inspectedOrderId=null;s.dirty=true;});
 const read=()=>page.evaluate(()=>{const s=(window as any).pizzaPerformance.game.scene.getScene('CozyScene');return s.layer.list.find((o:any)=>o.type==='Text'&&o.text.startsWith('Nhân viên về'))?.text??'';});
 await expect.poll(read).toContain('20s');await page.evaluate(()=>(window as any).pizzaPerformance.game.scene.getScene('CozyScene').runtime.advanceElapsed(2000));await expect.poll(read).toContain('18s');
});

