import type Phaser from 'phaser';
import {HUB_THEME} from './HubTheme';
import type {HubHit,HubTab} from './HubCanvasUI';
import {CAMPAIGN_LAST_DAY} from '../config/campaignRules';

export const HUB_HEADER_ART={key:'shared-hub-header',url:'assets/references/Giao diện game pizza gỗ tối giản.png'};
let serial=0;
export function paintHubWood(ctx:CanvasRenderingContext2D):void{
  ctx.save();ctx.fillStyle=HUB_THEME.colors.wood;ctx.fillRect(0,0,360,640);
  for(let y=0;y<640;y+=27){const grain=ctx.createLinearGradient(0,y,0,y+27);grain.addColorStop(0,'rgba(255,202,127,.10)');grain.addColorStop(1,'rgba(73,32,13,.12)');ctx.fillStyle=grain;ctx.fillRect(0,y,360,27);ctx.strokeStyle=HUB_THEME.colors.woodEdge;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(360,y);ctx.stroke();}ctx.restore();
}
function crop(scene:Phaser.Scene,ctx:CanvasRenderingContext2D,s:number[],t:number[],radius:number):void{
  const source=scene.textures.get(HUB_HEADER_ART.key).getSourceImage() as HTMLImageElement;
  ctx.save();ctx.beginPath();ctx.roundRect(t[0]!,t[1]!,t[2]!,t[3]!,radius);ctx.clip();ctx.drawImage(source,s[0]!,s[1]!,s[2]!,s[3]!,t[0]!,t[1]!,t[2]!,t[3]!);ctx.restore();
}
function text(ctx:CanvasRenderingContext2D,x:number,y:number,value:string,size:number,max:number,color:string=HUB_THEME.colors.ink):void{
  ctx.save();ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle=color;
  ctx.font=`bold ${size}px ${HUB_THEME.typography.fontFamily}`;
  while(size>9&&ctx.measureText(value).width>max){size--;ctx.font=`bold ${size}px ${HUB_THEME.typography.fontFamily}`;}
  ctx.fillText(value,x,y);ctx.restore();
}
export function paintHubHeader(scene:Phaser.Scene,ctx:CanvasRenderingContext2D,hit:HubHit,input:{title:string;subtitle:string;cash:number;pause:()=>void}):void{
  const subtitle=input.subtitle.replace(/(ngày\s+)(\d+)(?![\d/])/i,(_match,prefix:string,day:string)=>`${prefix}${day}/${Math.max(CAMPAIGN_LAST_DAY,Number(day))}`);
  // Crop only framed artwork; the supplied image's wood never forms a second backdrop.
  crop(scene,ctx,[414,20,1250,356],[71,3,215,62],16);
  crop(scene,ctx,[1689,70,380,164],[290,12,65,28],13);
  crop(scene,ctx,[98,112,178,160],[17,19,31,28],7);
  text(ctx,178,18,input.title,20,192);text(ctx,178,46,subtitle,11,192,HUB_THEME.colors.muted);
  text(ctx,333,21,`${input.cash}`,11,37);
  hit('pause',12,14,40,40,true,input.pause);
  scene.game.canvas.dataset.hubHeader='minimal-wood-reference';
  scene.game.canvas.dataset.hubHeaderLabels=JSON.stringify([input.title,subtitle,`${input.cash}`,'Tổng kết','Chợ','Kho','Quán','Nhiệm vụ']);
}
export function paintHubNavigation(scene:Phaser.Scene,ctx:CanvasRenderingContext2D,hit:HubHit,active:HubTab,tab:(id:HubTab)=>void):void{
  crop(scene,ctx,[17,407,2058,319],[3,70,354,55],12);
  const tabs=[['summary','Tổng kết'],['market','Chợ'],['stock','Kho'],['shop','Quán'],['missions','Nhiệm vụ']] as const;
  tabs.forEach(([id,title],i)=>{const x=7+i*69.2;
    if(id===active){ctx.save();ctx.fillStyle=HUB_THEME.colors.active;ctx.globalAlpha=.24;ctx.beginPath();ctx.roundRect(x,73,68,49,10);ctx.fill();ctx.restore();}
    text(ctx,x+34,105,title,11,63);hit(`summary-tab-${id}`,x,73,68,49,true,()=>tab(id));
  });
}
/** Retained background/header layer; content renderers keep their existing coordinates. */
export function drawHubShell(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,hit:HubHit,input:{title:string;subtitle:string;cash:number;pause:()=>void;active:HubTab;tab:(id:HubTab)=>void}):void{
  const key=`hub-shell-${serial++}`,texture=scene.textures.createCanvas(key,360,640)!;
  paintHubWood(texture.context);paintHubHeader(scene,texture.context,hit,input);paintHubNavigation(scene,texture.context,hit,input.active,input.tab);texture.refresh();
  const image=scene.add.image(0,0,key).setOrigin(0);layer.add(image);image.once('destroy',()=>scene.textures.remove(key));
}
