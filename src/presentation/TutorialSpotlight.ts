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
export function drawTutorialSpotlight(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,input:{focus:TutorialRect;text:string;index:number;total:number;next:boolean;from?:TutorialRect;reducedMotion:boolean;complete:()=>void}):{card:TutorialRect;next:TutorialRect|null}{
  const body=scene.add.text(0,0,input.text,{fontFamily:UI_THEME.typography.fontFamily,fontSize:'14px',fontStyle:'bold',color:'#2a160b',wordWrap:{width:256,useAdvancedWrap:true}}).setResolution(UI_RASTER_SCALE);
  const f=input.focus,card=tutorialCardBounds(f,32+Math.ceil(body.height)+(input.next?52:12)),g=scene.add.graphics().setData('dynamic',true);
  const moving={...(input.from??f)},paint=()=>{g.clear().fillStyle(0x000000,.3).fillRect(0,0,360,moving.y).fillRect(0,moving.y,moving.x,moving.height).fillRect(moving.x+moving.width,moving.y,360-moving.x-moving.width,moving.height).fillRect(0,moving.y+moving.height,360,640-moving.y-moving.height);g.lineStyle(3,0xffd158,1).strokeRoundedRect(moving.x,moving.y,moving.width,moving.height,7);scene.game.canvas.dataset.tutorialAnimatedFocus=JSON.stringify(moving);};
  paint();layer.add(g);
  const panel=scene.add.container(),paper=scene.add.graphics();layer.add(panel);panel.add(paper);
  paper.fillStyle(0xffefd0,1).fillRoundedRect(card.x,card.y,card.width,card.height,16).lineStyle(2,0xe7bc66).strokeRoundedRect(card.x,card.y,card.width,card.height,16);
  const text=(x:number,y:number,value:string,size:number,width?:number)=>{const t=scene.add.text(x,y,value,{fontFamily:UI_THEME.typography.fontFamily,fontSize:`${size}px`,fontStyle:'bold',color:'#2a160b',...(width?{wordWrap:{width,useAdvancedWrap:true}}:{})}).setResolution(UI_RASTER_SCALE);panel.add(t);return t;};
  text(card.x+12,card.y+10,`${input.index+1}/${input.total}`,11);
  body.setPosition(card.x+12,card.y+30);panel.add(body);
  const next=input.next?{x:card.x+card.width-122,y:card.y+card.height-44,width:110,height:34}:null;
  if(next){paper.fillStyle(0x362016,1).fillRoundedRect(next.x,next.y,next.width,next.height,11);const label=text(next.x+next.width/2,next.y+8,'Tiếp tục',14);label.setOrigin(.5,0).setColor('#fff0d5');}
  if(input.reducedMotion){Object.assign(moving,f);paint();input.complete();}
  else{
    panel.setAlpha(.35).setY(6);
    const focusTween=scene.tweens.add({targets:moving,x:f.x,y:f.y,width:f.width,height:f.height,duration:240,ease:'Sine.easeInOut',onUpdate:paint});
    const panelTween=scene.tweens.add({targets:panel,alpha:1,y:0,duration:240,ease:'Sine.easeOut',onComplete:input.complete});
    g.once('destroy',()=>focusTween.remove());panel.once('destroy',()=>panelTween.remove());
  }
  scene.game.canvas.dataset.tutorialFocus=JSON.stringify(f);scene.game.canvas.dataset.tutorialCard=JSON.stringify(card);scene.game.canvas.dataset.tutorialText=input.text;
  return {card,next};
}
