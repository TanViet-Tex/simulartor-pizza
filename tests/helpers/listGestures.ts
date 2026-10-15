import type {Page} from '@playwright/test';
import {hubWallRect} from '../../src/presentation/HubWallLayout';
/** Mobile WebKit cannot dispatch wheel events; drag through the same Phaser list inputs. */
export async function scrollCanvasList(page:Page,x:number,y:number,delta:number):Promise<void>{
 const b=(await page.locator('canvas').boundingBox())!;
 if(page.context().browser()?.browserType().name()!=='webkit'){
  await page.mouse.move(b.x+x*b.width/360,b.y+y*b.height/640);await page.mouse.wheel(0,delta);return;
 }
 const position=()=>page.evaluate(()=>{const d=document.querySelector('canvas')!.dataset,m=JSON.parse(d.modalScroll||'[]');return m.length?JSON.stringify(m.map((v:any)=>v.offset)):d[(d.summaryTab||'')+'Scroll']||'';});
 let remaining=Math.abs(delta);const direction=Math.sign(delta);
 while(remaining>0){
  const before=await position(),amount=Math.min(160,remaining),start=y+direction*amount/2,end=y-direction*amount/2;
  await page.mouse.move(b.x+x*b.width/360,b.y+start*b.height/640);await page.mouse.down();
  await page.mouse.move(b.x+x*b.width/360,b.y+end*b.height/640,{steps:6});await page.mouse.up();
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
  remaining-=amount;if(await position()===before)break;
 }
}

/** A partly clipped enabled action is not yet a complete minimum-size tap target. */
export async function revealShopAction(page:Page,id:string):Promise<void>{
 for(let attempt=0;attempt<3;attempt++){
  const state=await page.locator('canvas').evaluate((canvas,id)=>{
   const d=(canvas as HTMLCanvasElement).dataset;
   return {control:JSON.parse(d.controls||'[]').find((c:any)=>c.id===id&&c.enabled),scroll:JSON.parse(d.shopScroll||'null'),action:JSON.parse(d.shopScreenActions||'[]').find((a:any)=>a.id===id),bounds:canvas.getBoundingClientRect().toJSON()};
  },id);
  const viewport=state.scroll?.viewport;if(!viewport)return;
  const v=hubWallRect(viewport.x,viewport.y,viewport.width,viewport.height),c=state.control;
  if(c&&c.width*state.bounds.width/360>=48&&c.height*state.bounds.height/640>=48&&c.x>=v.x-.01&&c.y>=v.y-.01&&c.x+c.width<=v.x+v.width+.01&&c.y+c.height<=v.y+v.height+.01)return;
  await scrollCanvasList(page,180,390,state.action&&state.action.y<viewport.y?-10000:10000);
  await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 }
 throw Error(`Shop action ${id} is not fully reachable inside its list viewport`);
}
