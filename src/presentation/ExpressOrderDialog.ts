import type Phaser from 'phaser';
import type {StockIngredient} from '../domain/CozyStock';
import {drawMarketIngredient,MARKET_INGREDIENT_ART} from './MarketIngredientArt';
import {UI_RASTER_SCALE,uiCanvas} from './UiRaster';
import {UI_THEME} from './theme';

let serial=0;
export function drawExpressOrderDialog(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,input:{ingredient:StockIngredient;name:string;price:number;markup:number;seconds:number;quantity:5|10;cash:number;textScale:number;select:(quantity:5|10)=>void;cancel:()=>void;order:()=>void;register:(id:string,x:number,y:number,width:number,height:number,enabled:boolean,action:()=>void)=>void}):void {
  const x=40,width=280,padding=12,left=x+padding,right=x+width-padding,scale=input.textScale;
  const g=scene.add.graphics();layer.add(g);
  const text=(value:string,size:number,maxWidth:number,color='#462a18')=>{const t=scene.add.text(0,0,value,{fontFamily:UI_THEME.typography.fontFamily,fontSize:`${size*scale}px`,fontStyle:'bold',color,wordWrap:{width:maxWidth,useAdvancedWrap:true}}).setResolution(UI_RASTER_SCALE);layer.add(t);return t;};
  const title=text('Đặt hỏa tốc',20,width-24),name=text(input.name,16,186);
  const price=text(`${input.price} xu / phần · +${input.markup}% giá chợ`,12,186),arrival=text(`Nhận sau ${input.seconds} giây chạy ca`,12,186);
  const quantityLabel=text('Số lượng',13,84),totalLabel=text('Tổng tiền',14,100),total=text(`${input.price*input.quantity} xu`,16,150);
  const missing=Math.max(0,input.price*input.quantity-input.cash),hint=missing?text(`Thiếu ${missing} xu`,12,width-28,'#9c3c25'):null;
  const canvasScale=(scene.game.canvas.getBoundingClientRect().width||360)/360,touchHeight=Math.max(48,Math.ceil(48/canvasScale)),buttonHeight=36;
  const itemHeight=Math.max(64,name.height+price.height+arrival.height+10);
  const height=padding+title.height+10+itemHeight+6+Math.max(touchHeight,quantityLabel.height)+8+Math.max(total.height,totalLabel.height)+(hint?hint.height+6:0)+8+touchHeight+padding;
  const top=(640-height)/2;
  g.fillStyle(0xfff2d8).fillRoundedRect(x,top,width,height,14).lineStyle(3,0x704723).strokeRoundedRect(x,top,width,height,14);
  g.lineStyle(1,0xd8ad57).strokeRoundedRect(x+4,top+4,width-8,height-8,11);
  title.setPosition(180,top+padding).setOrigin(.5,0);
  const itemY=top+padding+title.height+10;
  g.fillStyle(0xf3e6c9).fillRoundedRect(left,itemY,right-left,itemHeight,8);
  name.setPosition(left+70,itemY);price.setPosition(left+70,itemY+name.height+5);arrival.setPosition(left+70,itemY+name.height+price.height+10);
  if(scene.textures.exists(MARKET_INGREDIENT_ART.key)){
    const key=`express-icon-${serial++}`,texture=uiCanvas(scene,key,60,60);
    drawMarketIngredient(scene,texture.context,input.ingredient,0,0,60,60);texture.refresh();
    const icon=scene.add.image(left+2,itemY+(itemHeight-60)/2,key).setOrigin(0).setDisplaySize(60,60);layer.add(icon);icon.once('destroy',()=>scene.textures.remove(key));
  }
  const button=(id:string,bx:number,by:number,bw:number,label:string,enabled:boolean,selected:boolean,dark:boolean,action:()=>void)=>{
    g.fillStyle(dark?0x241b15:selected?0xffd66b:0xffefd3).fillRoundedRect(bx,by,bw,buttonHeight,7);
    g.lineStyle(selected?2:1.5,selected||dark?0xc69b44:0xa78054).strokeRoundedRect(bx,by,bw,buttonHeight,7);
    const t=text(label,13,bw-12,dark?enabled?'#fff0d5':'#8f8576':'#462a18');t.setScale(Math.min(1,(buttonHeight-8)/t.height)).setPosition(bx+bw/2,by+buttonHeight/2).setOrigin(.5);
    input.register(id,bx,by,bw,buttonHeight,enabled,action);
  };
  const quantityY=itemY+itemHeight+6;
  const quantityHeight=Math.max(touchHeight,quantityLabel.height),quantityButtonsY=quantityY+(quantityHeight-buttonHeight)/2;
  quantityLabel.setPosition(left,quantityY+(quantityHeight-quantityLabel.height)/2);
  button('express-quantity-5',right-136,quantityButtonsY,64,'5',true,input.quantity===5,false,()=>input.select(5));
  button('express-quantity-10',right-64,quantityButtonsY,64,'10',true,input.quantity===10,false,()=>input.select(10));
  const totalY=quantityY+quantityHeight+8;
  g.lineStyle(1,0xc9a66a).lineBetween(left,totalY-6,right,totalY-6);
  totalLabel.setPosition(left,totalY);total.setPosition(right,totalY).setOrigin(1,0);
  if(hint)hint.setPosition(left,totalY+Math.max(total.height,totalLabel.height)+6);
  const footerY=top+height-padding-touchHeight+(touchHeight-buttonHeight)/2;
  button('express-close',left+10,footerY,112,'Hủy',true,false,true,input.cancel);
  button('express-confirm',right-122,footerY,112,'Đặt hàng',missing===0,false,true,input.order);
  scene.game.canvas.dataset.expressDialog=JSON.stringify({ingredient:input.ingredient,quantity:input.quantity,unitPrice:input.price,total:input.price*input.quantity,missing,bounds:{x,y:top,width,height}});
}
