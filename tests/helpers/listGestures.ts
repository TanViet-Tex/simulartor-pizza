import type {Page} from '@playwright/test';
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
