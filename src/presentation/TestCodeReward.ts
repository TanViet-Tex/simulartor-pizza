import {uiCanvas,UI_RASTER_SCALE} from './UiRaster';
import type Phaser from 'phaser';
import {UI_THEME} from './theme';
import type {NotificationRect} from './NotificationFrame';

/** Extract ornaments and blank borders; the sample's baked +500 is never drawn. */
export function drawTestCodeReward(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,coins:number,register:(id:string,r:NotificationRect,enabled:boolean,action:()=>void)=>void,close:()=>void):void {
  const texture=scene.textures.get('test-code-reward'),x=14,top=135,width=332,height=370,scale=width/240;
  const artKey='test-code-reward-clipped';
  if(!scene.textures.exists(artKey)){
    // Phaser 4 WebGL containers do not apply legacy GeometryMask. Rasterize the
    // static source slices once with a Canvas2D silhouette clip for both renderers.
    const art=uiCanvas(scene,artKey,360,640);const ctx=art.context,source=texture.getSourceImage() as HTMLImageElement;
    ctx.beginPath();ctx.roundRect(x,top+20,width,height-20,26);ctx.ellipse(180,top+22,61,18,0,0,Math.PI*2);ctx.ellipse(180,top+20,25,25,0,0,Math.PI*2);ctx.clip();
    ctx.fillStyle='#ffedbd';ctx.fillRect(x,top,width,height);
    for(const [sx,sy,sw,sh,dx,dy,dw,dh] of [
      [31,13,198,13,x+21*scale,top+13*scale,198*scale,13*scale],
      [10,14,30,28,x,top+14*scale,30*scale,28*scale],
      [220,14,30,28,x+210*scale,top+14*scale,30*scale,28*scale],
      [86,0,88,31,180-44*scale,top,88*scale,31*scale],
      [10,42,14,164,x,top+42*scale,14*scale,height-84*scale],
      [236,42,14,164,x+226*scale,top+42*scale,14*scale,height-84*scale],
      [10,206,22,42,x,top+height-42*scale,22*scale,42*scale],
      [230,206,20,42,x+220*scale,top+height-42*scale,20*scale,42*scale],
      [32,243,198,9,x+22*scale,top+height-5*scale,198*scale,5*scale],
      [52,60,153,84,180-153*1.26/2,220,153*1.26,84*1.26],
      [31,213,95,30,38,440,136,48], [133,213,95,30,184,440,136,48],
    ] as const)ctx.drawImage(source,sx,sy,sw,sh,dx,dy,dw,dh);
    art.refresh();
  }
  layer.add(scene.add.image(0,0,artKey).setOrigin(0).setDisplaySize(360,640));
  const text=(y:number,value:string,size:number,color='#583319')=>layer.add(scene.add.text(180,y,value,{fontFamily:UI_THEME.typography.fontFamily,fontSize:`${size}px`,fontStyle:'bold',color,align:'center',wordWrap:{width:272}}).setResolution(UI_RASTER_SCALE).setOrigin(.5,0));
  text(184,'Nhập mã thành công!',22);text(330,`+${coins.toLocaleString('vi-VN')} xu`,29,'#a85805');text(378,'Bạn đã nhận được xu thưởng từ mã quà tặng.',15);
  for(const index of [0,1]){
    const r={x:38+index*146,y:440,width:136,height:48};
    register(index?'test-code-reward-ok':'test-code-reward-close',r,true,close);
  }
  scene.game.canvas.dataset.testCodeReward=JSON.stringify({coins,bounds:{x,y:top,width,height}});
}
