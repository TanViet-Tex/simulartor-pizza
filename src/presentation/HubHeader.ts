import type Phaser from 'phaser';
import {HUB_THEME} from './HubTheme';
import type {HubHit,HubTab} from './HubCanvasUI';
import {CAMPAIGN_LAST_DAY} from '../config/campaignRules';
import {uiCanvas} from './UiRaster';
import {paintCashHeader} from './CashHeader';
import {HUB_SHELL_LAYOUT} from './HubWallLayout';

export const HUB_HEADER_ART={key:'shared-hub-header',url:'assets/references/Giao diện game pizza gỗ tối giản.png'};
let serial=0;
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
  const {title,pause,cash}=HUB_SHELL_LAYOUT;
  // Crop only framed artwork; the supplied image's wood never forms a second backdrop.
  crop(scene,ctx,[414,20,1250,356],[title.x,title.y,title.width,title.height],16);
  crop(scene,ctx,[98,112,178,160],[pause.x,pause.y,pause.width,pause.height],7);
  text(ctx,180,34,input.title,18,184);text(ctx,180,57,subtitle,10,184,HUB_THEME.colors.muted);
  paintCashHeader(scene,ctx,input.cash,'hub',cash);
  hit('pause',pause.x,pause.y,pause.width,pause.height,true,input.pause);
  scene.game.canvas.dataset.hubHeader='minimal-wood-reference';
  scene.game.canvas.dataset.hubHeaderLabels=JSON.stringify([input.title,subtitle,`${input.cash}`,'Tổng kết','Chợ','Kho','Quán','Nhiệm vụ']);
}
export function paintHubNavigation(scene:Phaser.Scene,ctx:CanvasRenderingContext2D,hit:HubHit,active:HubTab,tab:(id:HubTab)=>void):void{
  const nav=HUB_SHELL_LAYOUT.navigation;
  crop(scene,ctx,[17,407,2058,319],[nav.x,nav.y,nav.width,nav.height],12);
  const tabs=[['summary','Tổng kết'],['market','Chợ'],['stock','Kho'],['shop','Quán'],['missions','Nhiệm vụ']] as const;
  tabs.forEach(([id,title],i)=>{const width=nav.width/5,x=nav.x+i*width;
    if(id===active){ctx.save();ctx.fillStyle=HUB_THEME.colors.active;ctx.globalAlpha=.24;ctx.beginPath();ctx.roundRect(x+2,105,width-4,nav.y+nav.height-105,6);ctx.fill();ctx.restore();}
    text(ctx,x+width/2,108,title,11,width-4);hit(`summary-tab-${id}`,x,nav.y,width,nav.height,true,()=>tab(id));
  });
}
/** Transparent header/navigation layer; content coordinates remain unchanged. */
export function drawHubShell(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,hit:HubHit,input:{title:string;subtitle:string;cash:number;pause:()=>void;active:HubTab;tab:(id:HubTab)=>void}):void{
  const key=`hub-shell-${serial++}`,texture=uiCanvas(scene,key,360,640);
  paintHubHeader(scene,texture.context,hit,input);paintHubNavigation(scene,texture.context,hit,input.active,input.tab);texture.refresh();
  const image=scene.add.image(0,0,key).setOrigin(0).setDisplaySize(360,640);layer.add(image);image.once('destroy',()=>scene.textures.remove(key));
}
