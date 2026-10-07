import type Phaser from 'phaser';
import {UI_THEME} from './theme';
import {uiCanvas} from './UiRaster';

export const CASH_HEADER_BOUNDS=Object.freeze({
  kitchen:Object.freeze({x:247,y:5,width:100,height:28}),
  hub:Object.freeze({x:290,y:12,width:65,height:28}),
});
let serial=0;
/** Shared coin, frame and typography; each header keeps its approved position. */
export function paintCashHeader(scene:Phaser.Scene,ctx:CanvasRenderingContext2D,cash:number,location:keyof typeof CASH_HEADER_BOUNDS):void{
  const r=CASH_HEADER_BOUNDS[location],cy=r.y+r.height/2;
  ctx.save();ctx.lineWidth=2;ctx.fillStyle='#382215';ctx.strokeStyle='#b68a43';
  ctx.beginPath();ctx.roundRect(r.x,r.y,r.width,r.height,14);ctx.fill();ctx.stroke();
  ctx.fillStyle='#f6dfb4';ctx.strokeStyle='#6d4925';ctx.lineWidth=1;
  ctx.beginPath();ctx.roundRect(r.x+3,r.y+3,r.width-6,r.height-6,11);ctx.fill();ctx.stroke();
  ctx.fillStyle='#d99c25';ctx.strokeStyle='#845617';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(r.x+13,cy,9,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle='#ffdd76';ctx.lineWidth=1;ctx.beginPath();ctx.arc(r.x+13,cy,6.5,0,Math.PI*2);ctx.stroke();
  ctx.font=`bold 12px ${UI_THEME.typography.fontFamily}`;ctx.fillStyle='#765018';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('$',r.x+13,cy+.5);
  const textPadding=5,textRight=r.x+r.width-3-textPadding;
  let size=17;const value=String(cash),available=textRight-(r.x+23);
  ctx.font=`bold ${size}px ${UI_THEME.typography.fontFamily}`;
  while(size>9&&ctx.measureText(value).width>available){size--;ctx.font=`bold ${size}px ${UI_THEME.typography.fontFamily}`;}
  ctx.fillStyle='#2a160b';ctx.textAlign='right';ctx.fillText(value,textRight,cy+.5,available);ctx.restore();
  scene.game.canvas.dataset.cashHeader=JSON.stringify({location,bounds:r,cash,fontSize:size,textPadding});
}
export function drawCashHeader(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,cash:number):void{
  const key=`kitchen-cash-${serial++}`,texture=uiCanvas(scene,key,360,40);paintCashHeader(scene,texture.context,cash,'kitchen');texture.refresh();
  const image=scene.add.image(0,0,key).setOrigin(0).setDisplaySize(360,40);layer.add(image);image.once('destroy',()=>scene.textures.remove(key));
}
