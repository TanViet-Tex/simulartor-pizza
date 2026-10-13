import {expect,test,type Page} from '@playwright/test';
import {build} from 'esbuild';

test.setTimeout(90000);
async function state(page:Page){return JSON.parse(await page.locator('canvas').getAttribute('data-hub-navigation-motion')??'null');}
async function tick(page:Page,now:number){await page.evaluate(value=>{(window as any).navFixture.now=value;},now);await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));}
async function tap(page:Page,id:string){
  const controls=JSON.parse(await page.locator('canvas').getAttribute('data-controls')??'[]'),c=controls.find((c:any)=>c.id==='summary-tab-'+id),b=(await page.locator('canvas').boundingBox())!;
  await page.touchscreen.tap(b.x+(c.x+c.width/2)*b.width/360,b.y+(c.y+c.height/2)*b.height/640);
  await expect(page.locator('canvas')).toHaveAttribute('data-summary-tab',id);
}
async function fixture(page:Page){
  const moduleName:string='node:path',paths=await import(moduleName);
  const bundle=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';import {CozyScene} from './src/scenes/CozyScene';import {CozyRuntime} from './src/runtime/CozyRuntime';import {PlayLifecycle} from './src/runtime/PlayLifecycle';import {MenuPreferences} from './src/presentation/MenuPreferences';
    const r=new CozyRuntime(false,true),prefs=new MenuPreferences(undefined,{getItem:()=>null,setItem:()=>{},removeItem:()=>{}});prefs.setReducedMotion(false);
    const lifecycle=new PlayLifecycle(r,()=>0);lifecycle.frame=()=>lifecycle.reconcile();const scene=new CozyScene(r,prefs,undefined,undefined,lifecycle);
    const f={r,prefs,scene,now:0};window.navFixture=f;const motion=scene.hubNavigationMotion,select=motion.select.bind(motion),sample=motion.sample.bind(motion);
    motion.select=(id,now,reduced)=>select(id,f.now,reduced);motion.sample=(now,reduced)=>sample(f.now,reduced);
    new Phaser.Game({type:Phaser.AUTO,parent:'fixture',width:360,height:640,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:[scene]});
  `},bundle:true,platform:'browser',format:'iife',define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');await page.setContent('<style>html,body{margin:0;height:100%;overflow:hidden}#fixture{width:100%;height:100%}</style><div id="fixture"></div>');
  await page.addScriptTag({content:bundle.outputFiles[0].text});await expect(page.locator('canvas')).toHaveAttribute('data-screen','preparation-hub',{timeout:30000});
}
async function iconPixels(page:Page){return page.evaluate(()=>{
  const scene=(window as any).navFixture.scene,image=scene.layer.list.find((o:any)=>o.texture?.key.startsWith('hub-shell-'));
  const source=image.texture.getSourceImage() as HTMLCanvasElement,scale=source.width/360;
  return Array.from({length:5},(_,i)=>Array.from(source.getContext('2d')!.getImageData((22+(i+.5)*316/5-10)*scale,86*scale,20*scale,18*scale).data));
});}
function expectIconColors(actual:number[][],original:number[][]){
  const width=40,height=36;
  const foreground=(data:number[],pixel:number)=>data[pixel]<160||data[pixel+1]<120||data[pixel+2]<75;
  let compared=0,totalDifference=0,maxDifference=0;
  for(let icon=0;icon<5;icon++)for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++){
    const pixel=(y*width+x)*4;
    // Compare the opaque stroke interiors; antialiased edges blend with the new background.
    if([-1,0,1].every(dy=>[-1,0,1].every(dx=>foreground(original[icon],((y+dy)*width+x+dx)*4)))){
      for(let channel=0;channel<3;channel++){
        const difference=Math.abs(actual[icon][pixel+channel]-original[icon][pixel+channel]);
        maxDifference=Math.max(maxDifference,difference);totalDifference+=difference;compared++;
      }
    }
  }
  expect(compared).toBeGreaterThan(100);expect(maxDifference).toBeLessThanOrEqual(6);expect(totalDifference/compared).toBeLessThan(1);
}
async function selectedBackground(page:Page,id:string){return page.evaluate(tab=>{
  const scene=(window as any).navFixture.scene,image=scene.layer.list.find((o:any)=>o.texture?.key.startsWith('hub-shell-'));
  const source=image.texture.getSourceImage() as HTMLCanvasElement,scale=source.width/360,i=['summary','market','stock','shop','missions'].indexOf(tab);
  return Array.from(source.getContext('2d')!.getImageData((22+i*316/5+8)*scale,90*scale,1,1).data);
},id);}
test('all five tabs animate once, keep icon pixels and hit bounds, and honor reduced motion',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await fixture(page);
  const icons=await iconPixels(page),bounds=await page.evaluate(()=>JSON.parse(document.querySelector('canvas')!.dataset.controls!).filter((c:any)=>c.id.startsWith('summary-tab-')).map(({id,x,y,width,height}:any)=>({id,x,y,width,height})));
  let now=0;
  for(const id of ['market','stock','shop','missions','summary']){
    await tick(page,now);await tap(page,id);await tick(page,now+60);const middle=await state(page);
    expect(middle.tabs[id].scale).toBeCloseTo(.96);expect(middle.tabs[id].amount).toBeGreaterThan(0);expect(middle.tabs[id].amount).toBeLessThan(1);
    await tick(page,now+150);const complete=await state(page);expect(complete.tabs[id]).toEqual({amount:1,scale:1});expect(complete.animating).toBe(false);
    expectIconColors(await iconPixels(page),icons);expect(await selectedBackground(page,id)).toEqual([255,240,189,255]);
    expect(await page.evaluate(()=>JSON.parse(document.querySelector('canvas')!.dataset.controls!).filter((c:any)=>c.id.startsWith('summary-tab-')).map(({id,x,y,width,height}:any)=>({id,x,y,width,height})))).toEqual(bounds);
    await tick(page,now+1000);expect(await state(page)).toEqual(complete);now+=1100;
  }
  await page.locator('canvas').screenshot({path:info.outputPath('tab-summary-selected.png')});
  await page.evaluate(()=>(window as any).navFixture.prefs.setReducedMotion(true));await tap(page,'market');await tick(page,now);
  const reduced=await state(page);expect(reduced.tabs.market).toEqual({amount:1,scale:1});expect(reduced.animating).toBe(false);expectIconColors(await iconPixels(page),icons);
  expect(await page.evaluate(()=>(window as any).navFixture.scene.feedback.size)).toBe(0);expect(errors).toEqual([]);
});
