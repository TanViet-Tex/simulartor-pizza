import {expect,test} from '@playwright/test';
import {build} from 'esbuild';

test('twenty original special portraits preserve opaque pixels and fit circular frames',async({page},info)=>{
 const pathSpecifier='node:path';const paths:{resolve(path:string):string}=await import(pathSpecifier);
 const fixture=await build({stdin:{resolveDir:paths.resolve('.'),loader:'ts',contents:`
  import Phaser from 'phaser';
  import {preloadSpecialCustomerPortraits,registerSpecialCustomerPortraitFrames,specialCustomerPortraitFrame,specialCustomerPortraitFit,preloadSpecialCustomerFrames,registerSpecialCustomerFrames,specialCustomerFrame,specialCustomerFrameFit} from './src/presentation/SpecialCustomerPortraits';
  class Gallery extends Phaser.Scene {
   preload(){preloadSpecialCustomerPortraits(this);preloadSpecialCustomerFrames(this);}
   create(){
    registerSpecialCustomerPortraitFrames(this);registerSpecialCustomerFrames(this);
    const texture=this.textures.get(specialCustomerPortraitFrame(0).key),source=texture.getSourceImage();
    const sheet=document.createElement('canvas');sheet.width=source.width;sheet.height=source.height;
    const ctx=sheet.getContext('2d');ctx.drawImage(source,0,0);
    const rgba=ctx.getImageData(0,0,sheet.width,sheet.height).data,reports=[],covered=new Uint8Array(sheet.width*sheet.height);
    for(let index=0;index<20;index++){
     const p=specialCustomerPortraitFrame(index),frame=texture.get(p.frame);
     const x=70+140*(index%5),y=68+145*Math.floor(index/5),kind=index<10?'vip':'kol',border=specialCustomerFrameFit(this,kind,x,y,110),fit=specialCustomerPortraitFit(frame.realWidth,frame.realHeight,border.portraitDiameter);
     this.add.image(x,y,p.key,p.frame).setDisplaySize(fit.width,fit.height);
     const ring=specialCustomerFrame(kind);this.add.image(border.x,border.y,ring.key,ring.frame).setDisplaySize(border.width,border.height);
     this.add.text(x,y+62,String(index+1),{fontSize:'14px',color:'#fff0d8'}).setOrigin(.5,0);
     for(let py=frame.cutY;py<frame.cutY+frame.cutHeight;py++)for(let px=frame.cutX;px<frame.cutX+frame.cutWidth;px++)covered[py*sheet.width+px]++;
     reports.push({index,x:frame.cutX,y:frame.cutY,width:frame.cutWidth,height:frame.cutHeight,fit,portraitDiameter:border.portraitDiameter});
    }
    let uncoveredOpaque=0,uncoveredAlpha=0,duplicateOpaque=0;
    for(let pixel=0;pixel<covered.length;pixel++){
     if(rgba[pixel*4+3]>=160&&!covered[pixel])uncoveredOpaque++;
     if(rgba[pixel*4+3]>=32&&!covered[pixel])uncoveredAlpha++;
     if(rgba[pixel*4+3]>=160&&covered[pixel]>1)duplicateOpaque++;
    }
    const frameTexture=this.textures.get(specialCustomerFrame('vip').key),frameSource=frameTexture.getSourceImage();
    const frameCanvas=document.createElement('canvas');frameCanvas.width=frameSource.width;frameCanvas.height=frameSource.height;
    const frameContext=frameCanvas.getContext('2d');frameContext.drawImage(frameSource,0,0);
    const frameRgba=frameContext.getImageData(0,0,frameCanvas.width,frameCanvas.height).data,frameCovered=new Uint8Array(frameCanvas.width*frameCanvas.height),frameBounds=[];
    for(const kind of ['vip','kol','attention']){
     const f=frameTexture.get(specialCustomerFrame(kind).frame);frameBounds.push({kind,x:f.cutX,y:f.cutY,width:f.cutWidth,height:f.cutHeight});
     for(let py=f.cutY;py<f.cutY+f.cutHeight;py++)for(let px=f.cutX;px<f.cutX+f.cutWidth;px++)frameCovered[py*frameCanvas.width+px]++;
    }
    let frameUncoveredAlpha=0,frameDuplicateAlpha=0;
    for(let p=0;p<frameCovered.length;p++)if(frameRgba[p*4+3]>=32){if(!frameCovered[p])frameUncoveredAlpha++;if(frameCovered[p]>1)frameDuplicateAlpha++;}
    this.game.canvas.dataset.report=JSON.stringify({reports,uncoveredOpaque,uncoveredAlpha,duplicateOpaque,cornerAlpha:rgba[3],frameBounds,frameUncoveredAlpha,frameDuplicateAlpha});
   }
  }
  new Phaser.Game({type:Phaser.CANVAS,parent:'fixture',width:700,height:580,backgroundColor:'#362018',scene:[Gallery]});
 `},bundle:true,platform:'browser',format:'iife',minify:true,define:{'import.meta.env.BASE_URL':'"/"'},write:false});
 await page.route('**/assets/references/**',route=>route.fulfill({path:paths.resolve(decodeURIComponent(route.request().url()).includes('Ba khung')?'public/assets/references/Ba khung avatar pizza cao cấp.png':'public/assets/references/Bộ avatar 20 sao Việt.png'),contentType:'image/png'}));
 await page.route('**/assets/index-*.js',route=>route.abort());await page.goto('/');
 await page.setViewportSize({width:720,height:620});
 await page.setContent('<style>html,body{margin:0;background:#362018}</style><div id="fixture"></div>');
 await page.addScriptTag({content:fixture.outputFiles[0].text});
 const canvas=page.locator('canvas');await expect(canvas).toHaveAttribute('data-report',/.+/);
 const report=JSON.parse((await canvas.getAttribute('data-report'))!);
 expect(report.reports).toHaveLength(20);expect(report.cornerAlpha).toBe(0);
 expect(report.uncoveredOpaque).toBe(0);expect(report.uncoveredAlpha).toBe(0);expect(report.duplicateOpaque).toBe(0);
 expect(report.frameBounds).toHaveLength(3);expect(report.frameUncoveredAlpha).toBe(0);expect(report.frameDuplicateAlpha).toBe(0);
 for(const item of report.reports){expect(item.width).toBeGreaterThan(100);expect(item.height).toBeGreaterThan(100);expect(Math.hypot(item.fit.width,item.fit.height)).toBeCloseTo(item.portraitDiameter,5);}
 await info.attach('portrait-alpha-report',{body:JSON.stringify(report,null,2),contentType:'application/json'});
 await canvas.screenshot({path:info.outputPath('twenty-special-portraits.png')});
});
