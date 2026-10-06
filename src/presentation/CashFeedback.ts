import {UI_RASTER_SCALE} from './UiRaster';
import type Phaser from 'phaser';
import {UI_THEME} from './theme';

type Receipt=Readonly<{id:number;amount:number;cash:number}>;
type Effect={receipt:Receipt;slot:number;text:Phaser.GameObjects.Text;tween?:Phaser.Tweens.Tween;startY:number;reduced:boolean};

/** Transient HUD objects survive a scene redraw, but never a scene shutdown. */
export class CashFeedback {
  private effects=new Set<Effect>();
  private lastId=0;
  private disposed=false;
  constructor(private scene:Phaser.Scene,private anchor:()=>{x:number;y:number},private reduced:()=>boolean){}
  get snapshot(){return [...this.effects].map(e=>{const bounds=e.text.getBounds();return {...e.receipt,x:e.text.x,y:e.text.y,startY:e.startY,alpha:e.text.alpha,reducedMotion:e.reduced,text:e.text.text,color:e.text.style.color,bounds:{x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height}};});}
  show(receipt:Receipt):void {
    if(this.disposed||receipt.id<=this.lastId||!receipt.amount)return;
    this.lastId=receipt.id;
    const used=new Set([...this.effects].map(e=>e.slot));let slot=0;while(used.has(slot))slot++;
    const anchor=this.anchor(),y=anchor.y+slot*32;
    const text=this.scene.add.text(anchor.x-(slot%2)*10,y,`${receipt.amount>0?'+':''}${receipt.amount} xu`,{
      fontFamily:UI_THEME.typography.fontFamily,fontSize:'14px',fontStyle:'bold',color:receipt.amount>0?'#75e96a':'#ff7474',stroke:'#302017',strokeThickness:3,
    }).setResolution(UI_RASTER_SCALE).setOrigin(1,0).setDepth(70);
    if(text.width>100)text.setScale(100/text.width);
    const effect:Effect={receipt,slot,text,startY:y,reduced:this.reduced()};this.effects.add(effect);
    const dispose=()=>{if(this.effects.delete(effect))text.destroy();};
    effect.tween=this.scene.tweens.add({targets:text,alpha:0,...(!effect.reduced?{y:y-8}:{}),duration:1000,ease:'Linear',onComplete:dispose,onStop:dispose});
  }
  destroy():void {
    if(this.disposed)return;this.disposed=true;
    for(const effect of this.effects){effect.tween?.remove();effect.text.destroy();}this.effects.clear();
  }
}
