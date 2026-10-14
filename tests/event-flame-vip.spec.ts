import {test,expect,type Page} from '@playwright/test';
import {build} from 'esbuild';
const proof='_bmad-output/implementation-artifacts/ui-baseline/event-flame-vip-2026-10-14/';
const data=async(page:Page,key:string)=>JSON.parse(await page.locator('canvas').getAttribute('data-'+key)||'null');
async function fixture(page:Page,day:number,vip=false){
 const moduleName:string='node:path',paths=await import(moduleName);
 const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
 import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';import {fundedShopCheckpoint} from './src/runtime/shopTestFixture';
 let r=CozyRuntime.restoreCheckpoint(fundedShopCheckpoint(1000),false,{eventRoll:()=>1,vipRoll:()=>1});while(r.preparationDay<${day}){r.resolveLottery(0);r.openShop();r.closeDay();r=CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,{eventRoll:()=>1,vipRoll:()=>1});}
 const runtime=CozyRuntime.restoreCheckpoint(r.exportCheckpoint(),false,{eventRoll:()=>1,vipRoll:(_s,_d,id)=>${vip}&&id==='vip'?0:1,schedule:day=>({day,duration:240,grace:120,slots:[{id:'vip',at:0,kind:'picky',opportunity:'commercial',commercialOrdinal:1,takeaway:true},{id:'ordinary',at:1,kind:'regular',opportunity:'commercial',commercialOrdinal:2,takeaway:true}]})});
 runtime.setSpecialPresentation(true);runtime.openShop();runtime.advanceElapsed(5000);runtime.advanceSpecialPresentation(3000);runtime.advanceSpecialPresentation(4000);runtime.setSpecialPresentation(false);runtime.advanceElapsed(1000);runtime.selectTicket(runtime.tickets[0].id);const hold=runtime.acquirePause('special-welcome');
 new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(runtime)]});window.hudFixture={runtime,hold};
 `},bundle:true,format:'iife',platform:'browser',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
 await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');await page.addScriptTag({content:bundle.outputFiles[0].text});await expect(page.locator('canvas')).toHaveAttribute('data-booted','true',{timeout:30000});
}
test('only rush and festival show a flame beside the unchanged clock',async({page})=>{
 test.setTimeout(120000);
 for(const [day,event] of [[6,''],[7,'rush'],[8,''],[9,'festival']] as const){
  await fixture(page,day);await expect(page.locator('canvas')).toHaveAttribute('data-shift-heat-indicator',event);
  const labels=await data(page,'labels'),clock=labels.find((l:any)=>/^09:\d\d$/.test(l.text));expect(clock).toBeTruthy();expect(clock.x).toBeGreaterThan(62);expect(clock.x+clock.width).toBeLessThan(130);
  if(event)await page.locator('canvas').screenshot({path:proof+event+'.png'});
 }
});
test('VIP portrait retains its frame without rings and keeps a live deadline in information',async({page})=>{
 await fixture(page,10,true);const tickets=await data(page,'tickets'),vip=tickets.find((t:any)=>t.vip),ordinary=tickets.find((t:any)=>!t.vip);expect(vip).toBeTruthy();expect(ordinary).toBeTruthy();
 const rings=await data(page,'customer-patience-rings');expect(rings).not.toContain(vip.id);expect(rings).toContain(ordinary.id);
 const remaining=()=>data(page,'labels').then(labels=>labels.find((l:any)=>l.text.startsWith('Còn ')&&l.text.includes('+500'))?.text);
 const before=await remaining();expect(before).toContain('Còn ');const art=await data(page,'kitchen-art');expect(art.some((a:any)=>a.key==='special-customer-sheet')).toBe(true);expect(art.some((a:any)=>a.key==='special-customer-frames'&&a.frame==='special-frame-vip')).toBe(true);
 await page.locator('canvas').screenshot({path:proof+'vip.png'});
 await page.evaluate(()=>{const f=(window as any).hudFixture;f.hold.release();f.runtime.advanceElapsed(1000);f.hold=f.runtime.acquirePause('special-welcome');});
 await expect.poll(remaining).not.toBe(before);expect((await data(page,'customer-patience-rings'))).not.toContain(vip.id);
 await page.evaluate(()=>{const r=(window as any).hudFixture.runtime,staff=r.staffState;Object.defineProperty(r,'staffState',{get:()=>({...staff,absentRoles:['prep']})});r.setSpecialPresentation(false);});
 const absentRemaining=()=>data(page,'labels').then(labels=>labels.find((l:any)=>l.text.startsWith('Còn ')&&l.text.includes('Phụ bếp bận'))?.text);
 await expect.poll(absentRemaining).toContain('Phụ bếp bận');const absentBefore=await absentRemaining();
 await page.locator('canvas').screenshot({path:proof+'vip-prep-absent.png'});
 await page.evaluate(()=>{const f=(window as any).hudFixture;f.hold.release();f.runtime.advanceElapsed(1000);f.hold=f.runtime.acquirePause('special-welcome');});
 await expect.poll(absentRemaining).not.toBe(absentBefore);
});
