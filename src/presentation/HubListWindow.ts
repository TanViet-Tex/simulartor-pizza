import Phaser from 'phaser';
import {HubListScroll} from './HubListScroll';
import {HubCanvasUI,type HubRect} from './HubCanvasUI';
import {HUB_THEME} from './HubTheme';
import {uiCanvas,UI_RASTER_SCALE} from './UiRaster';

export type HubDrag={active:boolean;startY:number;offset:number;controller?:HubListScroll};
/** Raster once; crop UVs and translate the image instead of uploading per move. */
export function hubListWindow(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,input:{key:string;viewport:HubRect;height:number;offset:number;drag:HubDrag;allowed:()=>boolean;paint:(ui:HubCanvasUI,ctx:CanvasRenderingContext2D)=>void;update:(offset:number)=>void}):void{
  const {viewport,key}=input,height=Math.max(viewport.height,input.height),texture=uiCanvas(scene,key,360,height);
  input.paint(new HubCanvasUI(scene,texture.context,()=>{}),texture.context);texture.refresh();
  const image=scene.add.image(0,viewport.y,key).setOrigin(0).setDisplaySize(360,height);layer.add(image);
  const max=Math.max(0,input.height-viewport.height);
  let thumb:Phaser.GameObjects.Image|undefined;
  const thumbKey=key+'-thumb';
  if(max){
    const thumbTexture=uiCanvas(scene,thumbKey,360,65);
    new HubCanvasUI(scene,thumbTexture.context,()=>{}).panel(342,0,3,65,HUB_THEME.colors.thumb,HUB_THEME.colors.thumb,1);thumbTexture.refresh();
    thumb=scene.add.image(0,viewport.y,thumbKey).setOrigin(0).setDisplaySize(360,65);layer.add(thumb);
    thumb.once('destroy',()=>scene.textures.remove(thumbKey));
  }
  const render=(offset:number)=>{image.setPosition(0,viewport.y-offset).setCrop(viewport.x*UI_RASTER_SCALE,offset*UI_RASTER_SCALE,viewport.width*UI_RASTER_SCALE,viewport.height*UI_RASTER_SCALE);thumb?.setY(viewport.y+offset/max*(viewport.height-65));input.update(offset);};
  const controller=new HubListScroll(input.offset,max,render,input.allowed);input.drag.controller=controller;render(controller.offset);
  const within=(p:Phaser.Input.Pointer)=>p.x>=viewport.x&&p.x<=viewport.x+viewport.width&&p.y>=viewport.y&&p.y<=viewport.y+viewport.height;
  const down=(p:Phaser.Input.Pointer)=>{if(within(p))controller.down(p.x,p.y,p.id);else controller.cancel();};
  const move=(p:Phaser.Input.Pointer)=>{if(p.isDown)controller.move(p.x,p.y,p.id);};
  const up=()=>{controller.flush();controller.cancel();};
  const wheel=(p:Phaser.Input.Pointer,_objects:unknown,_dx:number,dy:number)=>{if(within(p))controller.wheel(dy);};
  const flush=()=>controller.flush();
  scene.input.on('pointerdown',down);scene.input.on('pointermove',move);scene.input.on('pointerup',up);scene.input.on('pointerupoutside',up);scene.input.on('wheel',wheel);scene.events.on('preupdate',flush);
  image.once('destroy',()=>{scene.input.off('pointerdown',down);scene.input.off('pointermove',move);scene.input.off('pointerup',up);scene.input.off('pointerupoutside',up);scene.input.off('wheel',wheel);scene.events.off('preupdate',flush);controller.destroy();if(input.drag.controller===controller)input.drag.controller=undefined;scene.textures.remove(key);});
}
