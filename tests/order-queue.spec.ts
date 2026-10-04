import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function controls(page:Page):Promise<Control[]>{return JSON.parse((await page.locator('canvas').getAttribute('data-controls'))??'[]');}
async function tap(page:Page,id:string){
  const canvas=page.locator('canvas');
  if(id!=='resume'&&await canvas.getAttribute('data-paused')==='gap')await tap(page,'resume');
  await expect.poll(async()=>(await controls(page)).some(c=>c.id===id&&c.enabled)).toBe(true);
  const c=(await controls(page)).find(c=>c.id===id)!,bounds=(await canvas.boundingBox())!;
  expect(c.width*bounds.width/360).toBeGreaterThanOrEqual(48);expect(c.height*bounds.height/640).toBeGreaterThanOrEqual(48);
  await page.touchscreen.tap(bounds.x+(c.x+c.width/2)*bounds.width/360,bounds.y+(c.y+c.height/2)*bounds.height/640);
}
async function detail(page:Page){return JSON.parse((await page.locator('canvas').getAttribute('data-order-detail'))??'null');}
async function queue(page:Page){return JSON.parse((await page.locator('canvas').getAttribute('data-order-queue'))??'[]') as {id:string;source:string;icon:string;selected:boolean}[];}

test('explicit avatar inspection updates the panel and preserves the rest of the kitchen',async({page},info)=>{
  test.setTimeout(60000);await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/?mode=freeplay');const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-stage','assembly');
  expect(await detail(page)).toBeNull();
  expect((await queue(page)).some(slot=>slot.selected)).toBe(false);
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-labels'))!).some((l:{text:string})=>l.text==='Chọn đơn để xem chi tiết')).toBe(true);
  await page.setViewportSize({width:360,height:640});
  await expect.poll(async()=>Math.round((await canvas.boundingBox())!.width)).toBe(360);
  // Node built-ins are loaded by the test runner, outside the app's DOM-only typings.
  const fsSpecifier:string='node:fs';
  const fs:{readFileSync(path:string,encoding:'base64'):string}=await import(fsSpecifier);
  const old=fs.readFileSync('_bmad-output/implementation-artifacts/ui-baseline/game-360x640.png','base64');
  // This stored screenshot predates the queue change. Compare only the preserved
  // recipe/work/action/ingredient pixels, below the old order panel's shadow.
  const rendered=(await canvas.screenshot()).toString('base64');
  expect(await page.evaluate(async({base64,rendered})=>{
    const reference=new Image(),actualImage=new Image();reference.src='data:image/png;base64,'+base64;actualImage.src='data:image/png;base64,'+rendered;
    await Promise.all([reference.decode(),actualImage.decode()]);
    const current=document.createElement('canvas'),prior=document.createElement('canvas');current.width=prior.width=360;current.height=prior.height=640;
    const c=current.getContext('2d')!,p=prior.getContext('2d')!;c.drawImage(actualImage,0,0,360,640);p.drawImage(reference,0,0);
    const actual=c.getImageData(0,230,360,410).data,expected=p.getImageData(0,230,360,410).data;
    let changed=0;for(let i=0;i<actual.length;i++)if(actual[i]!==expected[i])changed++;return changed;
  },{base64:old,rendered})).toBe(0);
  await page.screenshot({path:info.outputPath('queue-unselected-360x640.png')});
  await tap(page,'customer-linh');await expect(canvas).toHaveAttribute('data-paused','');
  await expect.poll(async()=>(await detail(page))?.name).toBe('Linh');
  expect((await queue(page)).filter(slot=>slot.selected)).toHaveLength(1);
  await page.screenshot({path:info.outputPath('queue-selected-360x640.png')});
  await tap(page,'order');await expect(canvas).toHaveAttribute('data-paused','order');
  expect((await controls(page)).filter(c=>c.enabled).map(c=>c.id)).toEqual(['close-order']);
  await tap(page,'close-order');await expect(canvas).toHaveAttribute('data-paused','');
});

test('real ticket selection updates matching detail without stealing the oven owner',async({page})=>{
  test.setTimeout(70000);await page.goto('/?mode=shop');const canvas=page.locator('canvas');
  for(const id of ['dough','sauce','cheese']){await tap(page,`market-plus-${id}`);await tap(page,`market-buy-${id}`);}
  await tap(page,'market-open');expect(await detail(page)).toBeNull();
  await expect.poll(async()=>{
    if(await canvas.getAttribute('data-paused')==='gap')await tap(page,'resume');
    return JSON.parse((await canvas.getAttribute('data-tickets'))??'[]').length;
  },{timeout:50000}).toBe(2);
  const [first,second]=JSON.parse((await canvas.getAttribute('data-tickets'))!);
  await tap(page,`ticket-${first.id}`);
  for(const id of ['dough','sauce','cheese','bake'])await tap(page,id);
  await tap(page,`ticket-${second.id}`);
  await expect(canvas).toHaveAttribute('data-selected-ticket',second.id);
  await expect(canvas).toHaveAttribute('data-oven-owner',first.id);
  await expect.poll(async()=>(await detail(page))?.id).toBe(second.id);
  expect((await queue(page)).filter(slot=>slot.selected).map(slot=>slot.id)).toEqual([second.id]);
});

test('six mixed-source presentation orders fit and clear expired inspection using the real scene renderer',async({page},info)=>{
  test.setTimeout(60000);
  const pathSpecifier:string='node:path';
  const paths:{resolve(path:string):string}=await import(pathSpecifier);
  const fixture=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';
    import {CozyScene} from './src/scenes/CozyScene';
    import {CozyRuntime} from './src/runtime/CozyRuntime';
    class QueueFixture extends CozyRuntime {
      rows=Array.from({length:7},(_,i)=>({id:'fixture-'+(i+1),name:['Linh','Minh','App 03','Nam','Lan','App 06','Hidden'][i],recipe:i%2?'mushroom':'cheese',kind:'regular',kindLabel:'Khách thường',patience:120,extraPenalty:0,remaining:120-i*10,stage:'assembly',source:i===2||i===5?'app':'shop'}));
      selected='';revision=0;
      constructor(){super(false,true);}
      get tickets(){return this.rows;}
      get shopPhase(){return 'making';}
      get selectedTicketId(){return this.selected;}
      get selectedTicket(){return this.rows.find(row=>row.id===this.selected)??null;}
      get selectedRecipe(){return this.selectedTicket?.recipe??'cheese';}
      get shopRevision(){return this.revision;}
      selectTicket(id){if(this.pauses.length||!this.rows.some(row=>row.id===id))return false;this.selected=id;this.revision++;return true;}
      remove(id){this.rows=this.rows.filter(row=>row.id!==id);if(this.selected===id)this.selected='';this.revision++;}
    }
    const runtime=new QueueFixture();window.queueFixture=runtime;
    new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,backgroundColor:'#382019',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(runtime)]});
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  // Isolated fixture only: block the production entry, use the same-origin asset
  // server and supply queue data at the presentation boundary. No test hook or
  // mock order is shipped in the player app.
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden;background:#382019}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:fixture.outputFiles[0].text});const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-screen','game');
  expect(await queue(page)).toHaveLength(6);expect(await detail(page)).toBeNull();
  const appSlots=(await queue(page)).filter(slot=>slot.source==='app');expect(appSlots.map(slot=>slot.id)).toEqual(['fixture-3','fixture-6']);
  expect(appSlots.every(slot=>slot.icon==='phone')).toBe(true);
  const hits=(await controls(page)).filter(c=>c.id.startsWith('ticket-')&&c.enabled);expect(hits).toHaveLength(6);
  const bounds=(await canvas.boundingBox())!;
  for(const hit of hits){
    expect(hit.width*bounds.width/360).toBeGreaterThanOrEqual(48);expect(hit.height*bounds.height/640).toBeGreaterThanOrEqual(48);
    expect(hit.x).toBeGreaterThanOrEqual(8);expect(hit.x+hit.width).toBeLessThanOrEqual(352);expect(hit.y+hit.height).toBeLessThanOrEqual(160);
    for(const other of hits.filter(o=>o.id!==hit.id))expect(Math.min(hit.x+hit.width,other.x+other.width)>Math.max(hit.x,other.x)).toBe(false);
  }
  await tap(page,'ticket-fixture-3');await expect.poll(async()=>(await detail(page))?.sourceLabel).toBe('Qua app');
  await page.screenshot({path:info.outputPath('queue-six-mixed-selected.png')});
  await tap(page,'pause');const selected=(await detail(page))?.id;
  const first=hits[0];await page.touchscreen.tap(bounds.x+(first.x+first.width/2)*bounds.width/360,bounds.y+(first.y+first.height/2)*bounds.height/640);
  expect((await detail(page))?.id).toBe(selected);await tap(page,'resume');
  await page.evaluate(()=>{(window as unknown as {queueFixture:{remove(id:string):void}}).queueFixture.remove('fixture-3');});
  await expect.poll(async()=>detail(page)).toBeNull();expect((await queue(page)).some(slot=>slot.selected)).toBe(false);
});
