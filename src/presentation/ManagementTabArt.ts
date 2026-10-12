import type Phaser from 'phaser';

export const STOCK_REFERENCE_ART={key:'reference-stock',url:'assets/references/kho.png'};
type Detail='leaf'|'coin'|'crate'|'warning'|'clock'|'basket';
const details:Record<Detail,{key:string;crop:readonly [number,number,number,number]}>= {
  leaf:{key:'reference-market',crop:[48,481,53,71]},
  coin:{key:'reference-market',crop:[221,628,37,40]},
  crate:{key:'reference-market',crop:[360,630,38,42]},
  warning:{key:'reference-stock',crop:[367,370,62,63]},
  clock:{key:'reference-stock',crop:[649,369,62,66]},
  basket:{key:'reference-stock',crop:[60,1288,140,119]},
};

/** Sample illustrations only. Labels, warnings and amounts are painted from live state. */
export function drawManagementDetail(scene:Phaser.Scene,ctx:CanvasRenderingContext2D,name:Detail,x:number,y:number,w:number,h=w):void{
  const {key,crop:[sx,sy,sw,sh]}=details[name];
  if(!scene.textures.exists(key))return;
  const scale=Math.min(w/sw,h/sh);
  ctx.drawImage(scene.textures.get(key).getSourceImage() as HTMLImageElement,sx,sy,sw,sh,x+(w-sw*scale)/2,y+(h-sh*scale)/2,sw*scale,sh*scale);
}

/** Scoped reference-style card: other approved hub/subpage panels are unaffected. */
export function managementCard(ctx:CanvasRenderingContext2D,x:number,y:number,w:number,h:number,fill='#fff5e1',edge='#dcc09b',radius=10):void{
  ctx.save();ctx.beginPath();ctx.roundRect(x+.8,y+.8,w-1.6,h-1.6,radius);
  ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=edge;ctx.lineWidth=1.5;ctx.stroke();
  ctx.beginPath();ctx.roundRect(x+3,y+3,w-6,h-6,Math.max(2,radius-2));ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1;ctx.stroke();ctx.restore();
}
