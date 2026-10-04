import {test,expect,type Page} from '@playwright/test';
import {checkpointChecksum} from '../src/infrastructure/CozySaveRepository';
const fsModule:string='node:fs';
const {readFileSync}:{readFileSync:(path:string,encoding:string)=>string}=await import(fsModule);
const fixtures=JSON.parse(readFileSync('tests/fixtures/epic5-legacy.json','utf8'));
type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function tap(page:Page,id:string){
 let chosen:Control|undefined;const canvas=page.locator('canvas');
 await expect.poll(async()=>{const controls:Control[]=JSON.parse(await canvas.getAttribute('data-controls')??'[]');const resume=controls.find(c=>c.id==='resume'&&c.enabled);if(resume&&id!=='resume'&&(await canvas.getAttribute('data-paused')??'').includes('gap')){const b=(await canvas.boundingBox())!;await page.touchscreen.tap(b.x+(resume.x+resume.width/2)*b.width/360,b.y+(resume.y+resume.height/2)*b.height/640);return false;}chosen=controls.find(c=>c.id===id&&c.enabled);return !!chosen;}).toBe(true);
 const b=(await canvas.boundingBox())!,c=chosen!;await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
}
async function seed(page:Page,payload:unknown){
 const envelope={schemaVersion:1,contentVersion:'cozy-three-days-2026-10-03',campaignId:'original-campaign',commitId:'original-commit',revision:4,checksum:checkpointChecksum(payload),payload};
 await page.goto('/?mode=freeplay');await expect(page.locator('canvas')).toHaveAttribute('data-booted','true');
 await page.evaluate(async e=>new Promise<void>((resolve,reject)=>{const r=indexedDB.open('pizza-cozy-checkpoints',1);r.onupgradeneeded=()=>r.result.createObjectStore('latest');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('latest','readwrite'),s=tx.objectStore('latest');s.put(e,'active');s.put(e,'backup');s.put({campaignId:e.campaignId,commitId:e.commitId,revision:e.revision,checksum:e.checksum},'manifest');tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>reject(tx.error);};}),envelope);
 return envelope;
}
async function saved(page:Page){return page.evaluate(async()=>new Promise<{revision:number;schemaVersion:number;payload:{day:number;stock:{cash:number}}}>((resolve,reject)=>{const r=indexedDB.open('pizza-cozy-checkpoints',1);r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('latest','readonly'),q=tx.objectStore('latest').get('active');tx.oncomplete=()=>{db.close();resolve(q.result);};};}));}
test('native v1 day-three completion restores day four, commits day five and reloads with the same campaign',async({page},info)=>{
 const old=await seed(page,fixtures.terminal);await page.goto('/?mode=shop');const canvas=page.locator('canvas');
 await expect(canvas).toHaveAttribute('data-screen','preparation-hub');await expect(canvas).toHaveAttribute('data-day','4');await expect(canvas).toHaveAttribute('data-cash',String(fixtures.terminal.stock.cash));
 expect(await saved(page)).toEqual(old);await tap(page,'summary-open-first-day');await tap(page,'end-day');await tap(page,'confirm-end-day');
 await expect(canvas).toHaveAttribute('data-screen','day-summary');await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-save-state')??'null')?.state).toBe('ready');
 const current=await saved(page);expect(current).toMatchObject({schemaVersion:2,revision:5,campaignId:'original-campaign',payload:{day:5,stock:{cash:220}}});
 await page.reload();await expect(canvas).toHaveAttribute('data-day','5');await expect(canvas).toHaveAttribute('data-screen','preparation-hub');await expect(canvas).toHaveAttribute('data-cash','220');
 await canvas.screenshot({path:info.outputPath('legacy-day-five.png')});
});
