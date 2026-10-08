import type Phaser from 'phaser';
export type ShopArtCrop=readonly[number,number,number,number];
export const SHOP_SCREEN_ART={
  room:{key:'reference-shop-decoration',crop:[25,294,886,294]},
  amenitiesRoom:{key:'reference-shop-amenities',crop:[38,175,867,303]},
  expansionRoom:{key:'reference-shop-expansion',crop:[39,255,865,295]},
  oven:{key:'reference-shop-equipment',crop:[48,254,426,240]},
  fridge:{key:'reference-shop-equipment',crop:[47,966,430,275]},
  before1:{key:'reference-shop-expansion',crop:[48,616,226,196]},after1:{key:'reference-shop-expansion',crop:[328,616,235,196]},
  before2:{key:'reference-shop-expansion',crop:[47,891,226,211]},after2:{key:'reference-shop-expansion',crop:[328,891,235,211]},
} satisfies Record<string,{key:string;crop:ShopArtCrop}>;
export const SHOP_PIZZA_CROPS:Record<string,ShopArtCrop>={cheese:[43,190,205,168],mushroom:[40,404,161,123],sausage:[40,551,162,123],pepperoni:[40,699,162,123],vegetable:[40,846,162,123],'chicken-bbq':[40,993,162,123],seafood:[40,1140,162,123],'ham-pineapple':[40,1288,162,123]};
export const SHOP_STAFF_CROPS:readonly ShopArtCrop[]=[[54,322,384,300],[502,322,387,300],[54,918,384,300],[502,918,387,300]];
export function shopScreenArt(scene:Phaser.Scene,ctx:CanvasRenderingContext2D,id:string,key:string,crop:ShopArtCrop,x:number,y:number,width:number,height:number):void{
  const [sx,sy,sw,sh]=crop,scale=Math.min(width/sw,height/sh),dx=x+(width-sw*scale)/2,dy=y+(height-sh*scale)/2;
  ctx.save();ctx.beginPath();ctx.roundRect(x,y,width,height,8);ctx.clip();ctx.drawImage(scene.textures.get(key).getSourceImage() as HTMLImageElement,sx,sy,sw,sh,dx,dy,sw*scale,sh*scale);ctx.restore();
  const entries=JSON.parse(scene.game.canvas.dataset.shopScreenArt||'[]');entries.push({id,key,source:crop,x:dx,y:dy,width:sw*scale,height:sh*scale});scene.game.canvas.dataset.shopScreenArt=JSON.stringify(entries);
}
