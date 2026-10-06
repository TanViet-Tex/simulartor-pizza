import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

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
  await tap(page,'pause-settings');await tap(page,'mute');await tap(page,'mute');await tap(page,'pause-settings-back');await tap(page,'resume');
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

test('missing ingredient hints follow additions, removal, clear and the selected order',async({page},info)=>{
  const pathSpecifier='node:path',paths=await import(pathSpecifier);
  const fixture=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';
    const runtime=new CozyRuntime(false,true,{schedule:day=>({day,duration:120,grace:20,slots:[0,1].map((at,i)=>({id:'hint-'+i,at,kind:'regular',opportunity:'commercial',commercialOrdinal:i+1,takeaway:true}))}),resolveRecipe:slot=>slot.id==='hint-0'?'cheese':'mushroom'});
    for(const id of ['dough','sauce','cheese','mushroom'])runtime.buy(id,3);
    runtime.openShop();runtime.advanceElapsed(1100);runtime.selectTicket(runtime.tickets.find(t=>t.recipe==='cheese').id);
    new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(runtime)]});
  `},bundle:true,platform:'browser',format:'iife',define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:fixture.outputFiles[0].text});const canvas=page.locator('canvas');
  const hints=async()=>JSON.parse((await canvas.getAttribute('data-needed-ingredients'))??'null');
  await expect.poll(hints).toEqual(['dough','sauce','cheese']);
  const labels=JSON.parse((await canvas.getAttribute('data-labels'))!);
  for(const text of ['CÀ','KEM','BBQ','PESTO','CAY'])expect(labels.some((label:{text:string})=>label.text===text)).toBe(true);
  const layout=JSON.parse((await canvas.getAttribute('data-kitchen-layout'))!);
  for(const [index,name] of ['Cà chua','Kem trắng','BBQ','Pesto','Sốt cay'].entries()){
    const cell=layout.ingredients[index],label=labels.find((label:{text:string;y:number})=>label.text===name&&label.y>=cell.y);
    expect(label.y+label.height,name).toBeLessThanOrEqual(cell.y+cell.h-2);
    expect(label.x,name).toBeGreaterThanOrEqual(cell.x+3);
    expect(label.x+label.width,name).toBeLessThanOrEqual(cell.x+cell.w-3);
  }
  await page.screenshot({path:info.outputPath('ingredient-hints-and-sauce-labels.png')});
  await tap(page,'dough');await expect.poll(hints).toEqual(['sauce','cheese']);
  await tap(page,'dough');await expect.poll(hints).toEqual(['dough','sauce','cheese']);
  await tap(page,'mushroom'); // Non-highlighted ingredient is still usable.
  await expect(canvas).toHaveAttribute('data-ingredients','mushroom');
  await expect.poll(hints).toEqual(['dough','sauce','cheese']);
  const tickets=JSON.parse((await canvas.getAttribute('data-tickets'))!) as {id:string;recipe:string}[];
  const second=tickets.find(t=>t.recipe==='mushroom')!,first=tickets.find(t=>t.recipe==='cheese')!;
  await tap(page,'ticket-'+second.id);await expect.poll(hints).toEqual(['dough','sauce','cheese','mushroom']);
  await tap(page,'mushroom');await expect.poll(hints).toEqual(['dough','sauce','cheese']);
  await tap(page,'clear');await expect.poll(hints).toEqual(['dough','sauce','cheese','mushroom']);
  await tap(page,'ticket-'+first.id);await expect.poll(hints).toEqual(['dough','sauce','cheese']);
  await expect(canvas).toHaveAttribute('data-ingredients','mushroom');
});
