import type Phaser from 'phaser';
import {HubCanvasUI,type HubHit} from './HubCanvasUI';
import {paintCashHeader} from './CashHeader';
import {uiCanvas} from './UiRaster';
import {shopScreenArt,type ShopArtCrop} from './ShopScreenArt';
let serial=0;
/** Shared screen components retain true labels and isolated reference artwork. */
export class ShopScreenUI extends HubCanvasUI {
  constructor(private owner:Phaser.Scene,ctx:CanvasRenderingContext2D,hit:HubHit){super(owner,ctx,hit);}
  override button(x:number,y:number,w:number,h:number,title:string,enabled=true,size=13):void {
    this.panel(x,y,w,h,enabled?'#24221e':'#66615a','#b78945',Math.min(12,h/2));
    this.text(x+w/2,y+(h-size)/2-1,title,size,enabled?'#fff0d1':'#d5c7b7',true,w-10);
  }
  art(id:string,key:string,crop:ShopArtCrop,x:number,y:number,w:number,h:number):void{shopScreenArt(this.owner,this.context,id,key,crop,x,y,w,h);}
  money(x:number,y:number,value:number,size=13):void{this.art('coin','reference-shop-menu',[263,252,40,42],x,y,18,19);this.text(x+23,y+2,`${value.toLocaleString('vi-VN')} xu`,size);}
  static shell(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,hit:HubHit,title:string,cash:number,back:()=>void):void{
    const key=`shop-screen-shell-${serial++}`,texture=uiCanvas(scene,key,360,640),ui=new ShopScreenUI(scene,texture.context,hit);
    ui.frame({x:69,y:9,width:218,height:65});ui.text(178,31,title,21,'#2a160b',true,200);
    // Two suspension rings and isolated leafy corners from the reference header.
    const ctx=texture.context;ctx.strokeStyle='#654025';ctx.lineWidth=3;for(const x of [92,262]){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,15);ctx.stroke();ctx.beginPath();ctx.ellipse(x,15,4,6,0,0,Math.PI*2);ctx.stroke();}
    ui.art('header-leaf-left','reference-shop-equipment',[253,64,52,61],76,42,18,22);ui.art('header-leaf-right','reference-shop-equipment',[667,69,46,55],263,43,17,21);
    ui.button(10,16,48,48,'‹',true,32);hit('shop-back',10,16,48,48,true,back);
    paintCashHeader(scene,ctx,cash,'hub',{x:292,y:20,width:64,height:28});
    ui.button(12,591,336,40,'‹  Về quản lý quán',true,17);hit('shop-screen-back',12,588,336,48,true,back);
    texture.refresh();const image=scene.add.image(0,0,key).setOrigin(0).setDisplaySize(360,640);layer.add(image);image.once('destroy',()=>scene.textures.remove(key));
  }
}
