import type Phaser from 'phaser';
import {UI_THEME} from './theme';
import {UI_RASTER_SCALE} from './UiRaster';

export type TutorialRect={x:number;y:number;width:number;height:number};
export function tutorialCardBounds(focus:TutorialRect,height=100):TutorialRect{
  const width=280,x=Math.max(8,Math.min(352-width,focus.x+focus.width/2-width/2));
  const below=focus.y+focus.height+12,above=focus.y-height-12;
  const y=below+height<=632?below:above>=8?above:focus.y>=320?8:632-height;
  return {x,y,width,height};
}
export function tutorialContains(rect:TutorialRect,x:number,y:number):boolean{return x>=rect.x&&x<=rect.x+rect.width&&y>=rect.y&&y<=rect.y+rect.height;}

/** Coordinates share the live scene canvas; no screenshot or DOM offset approximation. */
export function drawTutorialSpotlight(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,input:{focus:TutorialRect;text:string;index:number;total:number;next:boolean;register:(id:string,rect:TutorialRect,action:()=>void)=>void;advance:()=>void}):void{
  const body=scene.add.text(0,0,input.text,{fontFamily:UI_THEME.typography.fontFamily,fontSize:'14px',fontStyle:'bold',color:'#2a160b',wordWrap:{width:256,useAdvancedWrap:true}}).setResolution(UI_RASTER_SCALE);
  const f=input.focus,card=tutorialCardBounds(f,32+Math.ceil(body.height)+(input.next?52:12)),g=scene.add.graphics().setData('dynamic',true);
  g.fillStyle(0x000000,.3).fillRect(0,0,360,f.y).fillRect(0,f.y,f.x,f.height).fillRect(f.x+f.width,f.y,360-f.x-f.width,f.height).fillRect(0,f.y+f.height,360,640-f.y-f.height);
  g.lineStyle(3,0xffd158,1).strokeRoundedRect(f.x,f.y,f.width,f.height,7);
  g.fillStyle(0xffefd0,1).fillRoundedRect(card.x,card.y,card.width,card.height,16).lineStyle(2,0xe7bc66).strokeRoundedRect(card.x,card.y,card.width,card.height,16);layer.add(g);
  const text=(x:number,y:number,value:string,size:number,width?:number)=>{const t=scene.add.text(x,y,value,{fontFamily:UI_THEME.typography.fontFamily,fontSize:`${size}px`,fontStyle:'bold',color:'#2a160b',...(width?{wordWrap:{width,useAdvancedWrap:true}}:{})}).setResolution(UI_RASTER_SCALE);layer.add(t);return t;};
  text(card.x+12,card.y+10,`${input.index+1}/${input.total}`,11);
  body.setPosition(card.x+12,card.y+30);layer.add(body);
  if(input.next){const next={x:card.x+card.width-122,y:card.y+card.height-44,width:110,height:34};g.fillStyle(0x362016,1).fillRoundedRect(next.x,next.y,next.width,next.height,11);const label=text(next.x+next.width/2,next.y+8,'Tiếp tục',14);label.setOrigin(.5,0).setColor('#fff0d5');input.register('tutorial-next',next,input.advance);}
  scene.game.canvas.dataset.tutorialFocus=JSON.stringify(f);scene.game.canvas.dataset.tutorialCard=JSON.stringify(card);scene.game.canvas.dataset.tutorialText=input.text;
}
