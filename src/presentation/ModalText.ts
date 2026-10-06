import {UI_RASTER_SCALE} from './UiRaster';
import Phaser from 'phaser';
import { UI_THEME } from './theme';

/** Texture cropping works with both Phaser 4 renderers, including container children. */
export function modalText(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,x:number,y:number,width:number,height:number,value:string,size:number,color:string,scale=1):void{
  const text=scene.add.text(x,y,value,{fontFamily:UI_THEME.typography.fontFamily,fontSize:`${size*scale}px`,fontStyle:'bold',color,wordWrap:{width},padding:{top:2,bottom:2}});
  text.setResolution(UI_RASTER_SCALE).setCrop(0,0,width*UI_RASTER_SCALE,height*UI_RASTER_SCALE);
  const zone=scene.add.zone(x,y,width,height).setOrigin(0).setDepth(11).setInteractive();
  layer.add([text,zone]);
  const regions=JSON.parse(scene.game.canvas.dataset.modalScroll??'[]') as {x:number;y:number;width:number;height:number;offset:number;max:number}[];
  const region={x,y,width,height,offset:0,max:Math.max(0,text.height-height)};regions.push(region);
  scene.game.canvas.dataset.modalScroll=JSON.stringify(regions);
  let lastY:number|undefined,offset=0;
  // Phaser adds the source-pixel crop offset to the draw position before
  // dividing dimensions by Text resolution. Compensate in the same units.
  const scroll=(amount:number)=>{offset=Phaser.Math.Clamp(offset+amount,0,region.max);text.setY(y-offset*UI_RASTER_SCALE).setCrop(0,offset*UI_RASTER_SCALE,width*UI_RASTER_SCALE,height*UI_RASTER_SCALE);region.offset=offset;scene.game.canvas.dataset.modalScroll=JSON.stringify(regions);};
  zone.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{lastY=pointer.y;});
  zone.on('pointermove',(pointer:Phaser.Input.Pointer)=>{if(pointer.isDown&&lastY!==undefined){scroll(lastY-pointer.y);lastY=pointer.y;}});
  zone.on('pointerup',()=>{lastY=undefined;});zone.on('pointerout',()=>{lastY=undefined;});
  zone.on('wheel',(_pointer:unknown,_dx:number,dy:number)=>scroll(dy));
}
