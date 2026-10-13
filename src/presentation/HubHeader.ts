import type Phaser from 'phaser';
import {HUB_THEME} from './HubTheme';
import type {HubHit,HubTab} from './HubCanvasUI';
import {CAMPAIGN_LAST_DAY} from '../config/campaignRules';
import {uiCanvas,UI_RASTER_SCALE} from './UiRaster';
import {paintCashHeader} from './CashHeader';
import {HUB_SHELL_LAYOUT} from './HubWallLayout';
import type {HubNavigationSample} from './HubNavigationMotion';

export const HUB_HEADER_ART={key:'shared-hub-header',url:'assets/references/Giao diện game pizza gỗ tối giản.png'};
let serial=0;
type NavigationIcon={canvas:HTMLCanvasElement;x:number;y:number;width:number;height:number};
const navigationIcons=new WeakMap<HTMLImageElement,Map<number,NavigationIcon>>();
/** Remove only cream connected to the crop edges; enclosed icon details stay intact. */
function navigationIcon(source:HTMLImageElement,index:number):NavigationIcon{
  let cache=navigationIcons.get(source);if(!cache){cache=new Map();navigationIcons.set(source,cache);}
  const cached=cache.get(index);if(cached)return cached;
  const nav=HUB_SHELL_LAYOUT.navigation,width=nav.width/5;
  // Use the same complete tile draw and final pixel grid as uiCanvas. Cropping
  // source pixels first would introduce a second, slightly different resampling.
  const canvas=document.createElement('canvas');canvas.width=nav.width*UI_RASTER_SCALE;canvas.height=nav.height*UI_RASTER_SCALE;
  const context=canvas.getContext('2d')!;context.scale(UI_RASTER_SCALE,UI_RASTER_SCALE);
  context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';
  context.drawImage(source,17+index*2058/5,407,2058/5,319,index*width,0,width,nav.height);
  const sw=canvas.width,sh=canvas.height;
  const left=Math.floor(((index+.5)*width-12)*UI_RASTER_SCALE),right=Math.ceil(((index+.5)*width+12)*UI_RASTER_SCALE);
  const top=4*UI_RASTER_SCALE,bottom=28*UI_RASTER_SCALE;
  const pixels=context.getImageData(0,0,sw,sh),visited=new Uint8Array(sw*sh),pending:number[]=[];
  for(let y=0;y<sh;y++)for(let x=0;x<sw;x++)if(x<left||x>=right||y<top||y>=bottom)pixels.data[(y*sw+x)*4+3]=0;
  const add=(position:number):void=>{
    if(visited[position])return;visited[position]=1;const offset=position*4;
    if(pixels.data[offset]!>200&&pixels.data[offset+1]!>170&&pixels.data[offset+2]!>115)pending.push(position);
  };
  for(let x=left;x<right;x++){add(top*sw+x);add((bottom-1)*sw+x);}
  for(let y=top;y<bottom;y++){add(y*sw+left);add(y*sw+right-1);}
  while(pending.length){const position=pending.pop()!,x=position%sw,y=Math.floor(position/sw);
    pixels.data[position*4+3]=0;
    if(x>left)add(position-1);if(x<right-1)add(position+1);if(y>top)add(position-sw);if(y<bottom-1)add(position+sw);
  }
  context.putImageData(pixels,0,0);
  const icon={canvas,x:nav.x,y:nav.y,width:nav.width,height:nav.height};
  cache.set(index,icon);return icon;
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
export function paintHubNavigation(scene:Phaser.Scene,ctx:CanvasRenderingContext2D,hit:HubHit,active:HubTab,tab:(id:HubTab)=>void,motion?:HubNavigationSample):void{
  const nav=HUB_SHELL_LAYOUT.navigation;
  const source=scene.textures.get(HUB_HEADER_ART.key).getSourceImage() as HTMLImageElement;
  const tabs=[['summary','Tổng kết'],['market','Chợ'],['stock','Kho'],['shop','Quán'],['missions','Nhiệm vụ']] as const;
  ctx.save();ctx.beginPath();ctx.roundRect(nav.x,nav.y,nav.width,nav.height,12);ctx.clip();
  tabs.forEach(([id,title],i)=>{const width=nav.width/5,x=nav.x+i*width;
    const {amount,scale}=motion?.tabs[id]??{amount:id===active?1:0,scale:1};
    ctx.save();ctx.translate(x+width/2,nav.y+nav.height/2);ctx.scale(scale,scale);ctx.translate(-x-width/2,-nav.y-nav.height/2);
    // Scale the entire tile together, while keeping its original input rectangle.
    ctx.drawImage(source,17+i*2058/5,407,2058/5,319,x,nav.y,width,nav.height);
    if(amount>0){ctx.save();ctx.globalAlpha=amount;ctx.fillStyle='#fff0bd';ctx.strokeStyle='#d9ad58';ctx.lineWidth=1;
      ctx.beginPath();ctx.roundRect(x+2.5,nav.y+.5,width-5,nav.height-1,8);ctx.fill();ctx.stroke();ctx.restore();
      // The cached transparent sprite restores icon colors without a cream rectangle.
      const icon=navigationIcon(source,i);ctx.drawImage(icon.canvas,icon.x,icon.y,icon.width,icon.height);
    }
    text(ctx,x+width/2,108,title,11,width-4);ctx.restore();hit(`summary-tab-${id}`,x,nav.y,width,nav.height,true,()=>tab(id));
  });
  ctx.restore();
  scene.game.canvas.dataset.hubNavigationMotion=JSON.stringify(motion??{active,tabs:Object.fromEntries(tabs.map(([id])=>[id,{amount:id===active?1:0,scale:1}])),animating:false});
}
/** Transparent header/navigation layer; content coordinates remain unchanged. */
export function drawHubShell(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,hit:HubHit,input:{title:string;subtitle:string;cash:number;pause:()=>void;active:HubTab;tab:(id:HubTab)=>void;motion?:()=>HubNavigationSample}):()=>void{
  const key=`hub-shell-${serial++}`,texture=uiCanvas(scene,key,360,640);
  paintHubHeader(scene,texture.context,hit,input);paintHubNavigation(scene,texture.context,hit,input.active,input.tab,input.motion?.());texture.refresh();
  const image=scene.add.image(0,0,key).setOrigin(0).setDisplaySize(360,640);layer.add(image);image.once('destroy',()=>scene.textures.remove(key));
  return ()=>{if(!image.scene)return;const nav=HUB_SHELL_LAYOUT.navigation;
    texture.context.clearRect(nav.x,nav.y,nav.width,nav.height);
    paintHubNavigation(scene,texture.context,()=>{},input.active,input.tab,input.motion?.());texture.refresh();
  };
}
