import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
async function tap(page:Page,id:string){
  const canvas=page.locator('canvas');
  await expect.poll(async()=>{
    const controls=JSON.parse((await canvas.getAttribute('data-controls'))??'[]') as Control[],resume=controls.find(c=>c.id==='resume'&&c.enabled);
    if(id!=='resume'&&resume){const bounds=(await canvas.boundingBox())!;await page.touchscreen.tap(bounds.x+(resume.x+resume.width/2)*bounds.width/360,bounds.y+(resume.y+resume.height/2)*bounds.height/640);return false;}
    return controls.some(c=>c.id===id&&c.enabled);
  },{timeout:10000}).toBe(true);
  const control=(JSON.parse((await canvas.getAttribute('data-controls'))!) as Control[]).find(c=>c.id===id)!;
  const bounds=(await canvas.boundingBox())!;
  await page.touchscreen.tap(bounds.x+(control.x+control.width/2)*bounds.width/360,bounds.y+(control.y+control.height/2)*bounds.height/640);
}

test('mobile rush supplies, layered wrong pizza, automatic order and rounded bake feedback',async({page},info)=>{
  test.setTimeout(120000);
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/?mode=shop');const canvas=page.locator('canvas');
  await tap(page,'summary-open-first-day');
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-order-detail'))??'null'),{timeout:16000}).not.toBeNull();
  const ingredients=['dough','sauce','cheese','mushroom','sausage','pepperoni','pepper','onion'];
  for(const id of ingredients){
    await tap(page,id);await tap(page,'express-confirm');
  }
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-express-orders'))??'[]').length).toBe(8);
  await tap(page,'pause');
  const paused=await canvas.getAttribute('data-express-orders');await page.waitForTimeout(1100);
  expect(await canvas.getAttribute('data-express-orders')).toEqual(paused);
  await tap(page,'resume');
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-stock'))??'[]').filter((s:{id:string;owned:number})=>ingredients.includes(s.id)&&s.owned>=1).length,{timeout:10000}).toBe(8);
  for(const id of ingredients)await tap(page,id);
  expect((await canvas.getAttribute('data-ingredients'))!.split(',')).toHaveLength(8);
  const labels=JSON.parse((await canvas.getAttribute('data-labels'))!) as {text:string;x:number;y:number;width:number;height:number}[];
  expect(labels.filter(label=>label.x>=12&&label.x+label.width<=228&&label.y>=290&&label.y<402)).toHaveLength(0);
  const art=JSON.parse((await canvas.getAttribute('data-kitchen-art'))!) as {key:string;frame:string}[];
  expect(art.some(image=>image.frame.startsWith('pizza-')||image.frame.startsWith('recipe-'))).toBe(false);
  expect(art.some(image=>image.key.startsWith('customer-sheet-'))).toBe(true);
  await tap(page,'bake');await expect(canvas).toHaveAttribute('data-heat','warming');
  await expect(canvas).toHaveAttribute('data-heat','perfect',{timeout:10000});
  await page.screenshot({path:info.outputPath('kitchen-v2-mobile.png')});
  await tap(page,'extract');await tap(page,'box');await tap(page,'deliver');
  await tap(page,'confirm-delivery');
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-result'))??'null')?.reasons.length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('mobile customer selection shows each order without changing the pizza owner in the oven',async({page})=>{
  test.setTimeout(60000);
  const pathSpecifier:string='node:path';const paths:{resolve(path:string):string}=await import(pathSpecifier);
  const fixture=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';
    import {CozyScene} from './src/scenes/CozyScene';
    import {CozyRuntime} from './src/runtime/CozyRuntime';
    const runtime=new CozyRuntime(false,true,{schedule:day=>({day,duration:120,grace:20,slots:[0,1].map((at,i)=>({id:'touch-'+i,at,kind:'regular',opportunity:'commercial',commercialOrdinal:i+1,takeaway:true}))})});
    runtime.buy('dough',1);runtime.openShop();
    new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,backgroundColor:'#382019',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[new CozyScene(runtime)]});
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:fixture.outputFiles[0].text});const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-stage','assembly');
  const first=await canvas.getAttribute('data-selected-ticket');
  await tap(page,'dough');await tap(page,'bake');
  await expect.poll(async()=>JSON.parse((await canvas.getAttribute('data-tickets'))??'[]').length).toBe(2);
  const tickets=JSON.parse((await canvas.getAttribute('data-tickets'))!) as {id:string}[],second=tickets.find(ticket=>ticket.id!==first)!;
  await tap(page,'ticket-'+second.id);
  await expect(canvas).toHaveAttribute('data-selected-ticket',second.id);
  expect(JSON.parse((await canvas.getAttribute('data-order-detail'))!).id).toBe(second.id);
  await expect(canvas).toHaveAttribute('data-oven-owner',first!);
  await expect(canvas).toHaveAttribute('data-heat','perfect',{timeout:10000});
  await tap(page,'extract');await expect(canvas).toHaveAttribute('data-selected-ticket',first!);await expect(canvas).toHaveAttribute('data-stage','ready');
});
