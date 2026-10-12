import type Phaser from 'phaser';
import {HubCanvasUI,type HubHit} from './HubCanvasUI';
import {uiCanvas} from './UiRaster';
import {shopScreenArt,type ShopArtCrop} from './ShopScreenArt';
let serial=0;
/** Shared screen components retain true labels and isolated reference artwork. */
export class ShopScreenUI extends HubCanvasUI {
  constructor(private owner:Phaser.Scene,ctx:CanvasRenderingContext2D,hit:HubHit){super(owner,ctx,hit);}
  art(id:string,key:string,crop:ShopArtCrop,x:number,y:number,w:number,h:number):void{shopScreenArt(this.owner,this.context,id,key,crop,x,y,w,h);}
  money(x:number,y:number,value:number,size=13):void{this.art('coin','reference-shop-menu',[263,252,40,42],x,y,18,19);this.text(x+23,y+2,`${value.toLocaleString('vi-VN')} xu`,size);}
  static shell(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,hit:HubHit,back:()=>void):void{
    const key=`shop-screen-shell-${serial++}`,texture=uiCanvas(scene,key,360,640),ui=new ShopScreenUI(scene,texture.context,hit);
    ui.button(8,133,120,36,'‹  Quay lại',true,14);hit('shop-back',8,130,120,43,true,back);
    ui.text(145,145,'Quản lý quán',12,'#623619',false,195);
    ui.button(12,591,336,40,'‹  Về quản lý quán',true,17);hit('shop-screen-back',12,588,336,48,true,back);
    texture.refresh();const image=scene.add.image(0,0,key).setOrigin(0).setDisplaySize(360,640);layer.add(image);image.once('destroy',()=>scene.textures.remove(key));
  }
}
