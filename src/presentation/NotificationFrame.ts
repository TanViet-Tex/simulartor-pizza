import {UI_RASTER_SCALE} from './UiRaster';
import Phaser from 'phaser';
import {UI_THEME} from './theme';
import {modalText} from './ModalText';

export type NotificationVariant = 'one'|'two';
export type NotificationRect = {x:number;y:number;width:number;height:number};
export type NotificationLayout = {variant:NotificationVariant;bounds:NotificationRect;titleY:number;body:NotificationRect;footer:NotificationRect[];close?:NotificationRect};
export const NOTIFICATION_FRAMES = [
  {key:'notification-frame-one',url:'assets/references/Khung thông báo tiệm pizza ấm cúng.png'},
  {key:'notification-frame-two',url:'assets/references/Hộp thoại thông báo pizza ấm cúng.png'},
  {key:'test-code-reward',url:'assets/references/thông báo nhận tiền.png'},
] as const;

export function preloadNotificationFrames(scene:Phaser.Scene):void{
  for(const asset of NOTIFICATION_FRAMES)if(!scene.textures.exists(asset.key))scene.load.image(asset.key,`${import.meta.env.BASE_URL}${asset.url}`);
}

/** Only the undecorated middle grows; the pizza crest, borders and buttons retain their proportions. */
export function drawNotificationFrame(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,variant:NotificationVariant,top=125,height=420):NotificationLayout{
  const x=14,width=332,key=`notification-frame-${variant}`,texture=scene.textures.get(key);
  const source=texture.getSourceImage(),scale=width/source.width;
  const headerEnd=variant==='one'?240:410,footerStart=variant==='one'?1120:800;
  const headerHeight=headerEnd*scale,footerHeight=(source.height-footerStart)*scale;
  const slices=[['header',0,headerEnd,top,headerHeight],['middle',headerEnd,footerStart-headerEnd,top+headerHeight,height-headerHeight-footerHeight],['footer',footerStart,source.height-footerStart,top+height-footerHeight,footerHeight]] as const;
  for(const [name,sourceY,sourceHeight,y,h] of slices){
    if(!texture.has(name))texture.add(name,0,0,sourceY,source.width,sourceHeight);
    layer.add(scene.add.image(x,y,key,name).setOrigin(0).setDisplaySize(width,h));
  }
  const buttonY=top+height-footerHeight+(variant==='one'?17:8)*scale;
  const footer=variant==='one'
    ?[{x:x+257*scale,y:buttonY,width:607*scale,height:145*scale}]
    :[{x:x+172*scale,y:buttonY,width:505*scale,height:145*scale},{x:x+733*scale,y:buttonY,width:505*scale,height:145*scale}];
  const bodyY=top+(variant==='one'?125:115),bodyBottom=footer[0].y-14;
  const close=variant==='two'?{x:x+1244*scale,y:top+252*scale,width:88*scale,height:88*scale}:undefined;
  const layout={variant,bounds:{x,y:top,width,height},titleY:top+(variant==='one'?73:65),body:{x:38,y:bodyY,width:284,height:bodyBottom-bodyY},footer,close};
  scene.game.canvas.dataset.notificationFrame=JSON.stringify(layout);
  return layout;
}

export function drawNotificationClose(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,layout:NotificationLayout):NotificationRect|undefined{
  const r=layout.close;if(!r)return;
  layer.add(scene.add.text(r.x+r.width/2,r.y+r.height/2,'×',{fontFamily:'Arial',fontSize:'22px',color:'#fff0d5',fontStyle:'bold'}).setResolution(UI_RASTER_SCALE).setOrigin(.5));
  return r;
}

/** Reuse the blank one-action button artwork for secondary modal controls. */
export function drawNotificationButton(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,x:number,y:number,width:number,height:number):void{
  const texture=scene.textures.get('notification-frame-one');
  const cap=Math.min(height*73/145,width/2);
  for(const [name,sourceX,sourceWidth,left,w] of [
    ['button-left',257,73,x,cap],
    ['button-middle',330,461,x+cap,width-2*cap],
    ['button-right',791,73,x+width-cap,cap],
  ] as const){
    if(!texture.has(name))texture.add(name,0,sourceX,1137,sourceWidth,145);
    if(w>0)layer.add(scene.add.image(left,y,'notification-frame-one',name).setOrigin(0).setDisplaySize(w,height));
  }
}

/** Content-sized notice: preserve the crest and bottom border, stretch only blank paper. */
export function drawCompactNotification(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,title:string,message:string,size=14,textScale=1):NotificationLayout{
  const texture=scene.textures.get('notification-frame-one'),source=texture.getSourceImage(),width=332,scale=width/source.width,padding=18,border=14,inset=border+padding,gap=14;
  const heading=scene.add.text(180,0,title,{fontFamily:UI_THEME.typography.fontFamily,fontSize:'20px',fontStyle:'bold',color:UI_THEME.text.ink,wordWrap:{width:width-inset*2},padding:{top:1,bottom:1}}).setResolution(UI_RASTER_SCALE).setOrigin(.5,0);
  const measure=scene.add.text(0,0,message,{fontFamily:UI_THEME.typography.fontFamily,fontSize:`${size*textScale}px`,fontStyle:'bold',wordWrap:{width:width-inset*2},padding:{top:2,bottom:2}});
  const headerHeight=300*scale,titleOffset=headerHeight,bottomPadding=48;
  const bodyHeight=Math.min(Math.max(18,measure.height),600-titleOffset-heading.height-gap*2-48-bottomPadding);measure.destroy();
  const height=titleOffset+heading.height+gap+bodyHeight+gap+48+bottomPadding,top=(640-height)/2,bodyY=top+titleOffset+heading.height+gap;
  const cornerWidth=150*scale,cornerHeight=(source.height-1220)*scale,baseHeight=(source.height-1290)*scale;
  // Preserve complete ornaments; stretch the blank paper and straight side rails
  // separately. The source button is excluded from every background slice.
  for(const [name,sx,sy,sw,sh,x,y,w,h] of [
    ['compact-top-v3',0,0,source.width,300,14,top,width,headerHeight],
    ['compact-paper-v3',150,300,source.width-300,820,14+cornerWidth,top+headerHeight,width-2*cornerWidth,height-headerHeight-baseHeight],
    ['compact-side-left-v3',0,300,150,920,14,top+headerHeight,cornerWidth,height-headerHeight-cornerHeight],
    ['compact-side-right-v3',source.width-150,300,150,920,14+width-cornerWidth,top+headerHeight,cornerWidth,height-headerHeight-cornerHeight],
    ['compact-left-v3',0,1220,150,source.height-1220,14,top+height-cornerHeight,cornerWidth,cornerHeight],
    ['compact-right-v3',source.width-150,1220,150,source.height-1220,14+width-cornerWidth,top+height-cornerHeight,cornerWidth,cornerHeight],
    ['compact-base-v3',150,1290,source.width-300,source.height-1290,14+cornerWidth,top+height-baseHeight,width-2*cornerWidth,baseHeight],
  ] as const){
    if(!texture.has(name))texture.add(name,0,sx,sy,sw,sh);
    layer.add(scene.add.image(x,y,texture.key,name).setOrigin(0).setDisplaySize(w,h));
  }
  heading.setY(top+titleOffset);layer.add(heading);
  modalText(scene,layer,14+inset,bodyY,width-inset*2,bodyHeight,message,size,UI_THEME.text.ink,textScale);
  const footer={x:90,y:bodyY+bodyHeight+gap,width:180,height:48};drawNotificationButton(scene,layer,footer.x,footer.y,footer.width,footer.height);
  const layout:NotificationLayout={variant:'one',bounds:{x:14,y:top,width,height},titleY:top+titleOffset,body:{x:14+inset,y:bodyY,width:width-inset*2,height:bodyHeight},footer:[footer]};
  scene.game.canvas.dataset.notificationFrame=JSON.stringify(layout);return layout;
}
