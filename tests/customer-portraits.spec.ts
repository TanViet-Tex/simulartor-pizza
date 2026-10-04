import {expect,test} from '@playwright/test';
import {build} from 'esbuild';

test('all 150 transparent portraits retain their ratio and stay centered inside green circles',async({page},info)=>{
  const pathSpecifier='node:path';const paths:{resolve(path:string):string}=await import(pathSpecifier);
  const fixture=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
    import Phaser from 'phaser';
    import {preloadCustomerPortraits,registerCustomerPortraitFrames,customerPortraitFrame,customerPortraitFit} from './src/presentation/CustomerPortraits';
    class PortraitGallery extends Phaser.Scene {
      preload(){preloadCustomerPortraits(this);}
      create(){
        registerCustomerPortraitFrames(this);const reports=[];
        for(let i=0;i<150;i++){
          const p=customerPortraitFrame(i),texture=this.textures.get(p.key),frame=texture.get(p.frame);
          const x=30+60*(i%10),y=29+64*Math.floor(i/10),fit=customerPortraitFit(frame.realWidth,frame.realHeight,48);
          this.add.graphics().lineStyle(2,0x65b74d).strokeCircle(x,y,26);
          const image=this.add.image(x,y,p.key,p.frame).setDisplaySize(fit.width,fit.height);
          this.add.text(x,y+28,String(i),{fontSize:'10px',color:'#362018'}).setOrigin(.5,0);
          const source=texture.getSourceImage(),c=document.createElement('canvas');c.width=source.width;c.height=source.height;
          const ctx=c.getContext('2d');ctx.drawImage(source,0,0);
          const data=ctx.getImageData(frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight).data;
          let solid=0;for(let a=3;a<data.length;a+=4)if(data[a]>=32)solid++;
          reports.push({id:i,x:image.x,y:image.y,width:image.displayWidth,height:image.displayHeight,ratio:frame.realWidth/frame.realHeight,cutX:frame.cutX,cutY:frame.cutY,cutWidth:frame.cutWidth,cutHeight:frame.cutHeight,solidRatio:solid/(frame.cutWidth*frame.cutHeight),cornerAlpha:ctx.getImageData(0,0,1,1).data[3]});
        }
        this.game.canvas.dataset.portraits=JSON.stringify(reports);
      }
    }
    new Phaser.Game({type:Phaser.CANVAS,parent:'fixture',width:600,height:960,backgroundColor:'#fff0d8',scene:[PortraitGallery]});
  `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
  await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
  await page.setViewportSize({width:620,height:980});
  await page.setContent('<style>html,body{margin:0;background:#fff0d8}#fixture{width:600px;height:960px}</style><div id="fixture"></div>');
  await page.addScriptTag({content:fixture.outputFiles[0].text});const canvas=page.locator('canvas');
  await expect(canvas).toHaveAttribute('data-portraits',/.+/);
  const reports=JSON.parse((await canvas.getAttribute('data-portraits'))!);
  expect(reports).toHaveLength(150);
  for(const r of reports){
    expect(r.x).toBe(30+60*(r.id%10));expect(r.y).toBe(29+64*Math.floor(r.id/10));
    expect(r.width/r.height).toBeCloseTo(r.ratio,6);expect(Math.hypot(r.width,r.height)).toBeLessThanOrEqual(48.00001);
    expect(r.cornerAlpha).toBe(0);expect(r.solidRatio).toBeGreaterThan(.05);expect(r.solidRatio).toBeLessThan(.95);
  }
  // Repacked ghost and demon frames must remain separated, with no borrowed feet.
  expect(reports[30].cutY+reports[30].cutHeight).toBeLessThan(reports[35].cutY);
  await canvas.screenshot({path:info.outputPath('all-150-portraits.png')});
});

test('real customer queue uses centered transparent portraits with unchanged ring geometry',async({page},info)=>{
  await page.goto('/?mode=freeplay');const canvas=page.locator('canvas');
  await expect.poll(async()=>JSON.parse(await canvas.getAttribute('data-kitchen-art')??'[]').filter((a:{key:string})=>a.key.startsWith('customer-sheet-')).length).toBe(1);
  const avatar=JSON.parse((await canvas.getAttribute('data-kitchen-art'))!).find((a:{key:string})=>a.key.startsWith('customer-sheet-'));
  expect(avatar).toMatchObject({x:42,y:97,frame:'customer-0'});
  expect(Math.hypot(avatar.width,avatar.height)).toBeCloseTo(40,5);
  expect(avatar.width).not.toBe(avatar.height);
  await canvas.screenshot({path:info.outputPath('queue-centered-avatar.png')});
});
