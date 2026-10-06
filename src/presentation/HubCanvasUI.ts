import Phaser from 'phaser';
import {HUB_THEME} from './HubTheme';
import {paintHubWood,paintHubHeader,paintHubNavigation} from './HubHeader';

export const HUB_ART = {key:'reference-market',url:'assets/references/chợ.png'};
export type HubTab = 'summary'|'market'|'stock'|'shop'|'missions';
export type HubRect = {x:number;y:number;width:number;height:number};
export type HubHit = (id:string,x:number,y:number,w:number,h:number,enabled:boolean,action:()=>void)=>void;

/** Canvas painter only: the caller owns its texture, input zones and cleanup. */
export class HubCanvasUI {
  constructor(private scene:Phaser.Scene,private ctx:CanvasRenderingContext2D,private hit:HubHit){}
  get context():CanvasRenderingContext2D{return this.ctx;}

  text(x:number,y:number,value:string,size:number=12,color:string=HUB_THEME.colors.ink,center=false,max=0):void {
    const ctx=this.ctx;ctx.save();
    ctx.font=`bold ${size}px ${HUB_THEME.typography.fontFamily}`;
    ctx.fillStyle=color;ctx.textAlign=center?'center':'left';ctx.textBaseline='top';
    if(max&&ctx.measureText(value).width>max){
      const characters=Array.from(value);
      while(characters.length&&ctx.measureText(characters.join('')+'…').width>max)characters.pop();
      value=characters.join('')+'…';
    }
    ctx.fillText(value,x,y);ctx.restore();
  }

  panel(x:number,y:number,w:number,h:number,fill:string=HUB_THEME.colors.paper,stroke:string=HUB_THEME.colors.border,r:number=HUB_THEME.radii.tile):void {
    const ctx=this.ctx;ctx.save();
    ctx.fillStyle=HUB_THEME.colors.shadow;ctx.globalAlpha=.22;
    ctx.beginPath();ctx.roundRect(x+.5,y+2,w-1,h-2,r);ctx.fill();ctx.globalAlpha=1;
    ctx.beginPath();ctx.roundRect(x+.5,y+.5,w-1,h-2,r);ctx.fillStyle=fill;ctx.fill();
    ctx.save();ctx.clip();
    const light=ctx.createLinearGradient(0,y,0,y+h);
    light.addColorStop(0,'rgba(255,255,255,.22)');light.addColorStop(.45,'rgba(255,255,255,0)');light.addColorStop(1,'rgba(82,40,15,.12)');
    ctx.fillStyle=light;ctx.fillRect(x,y,w,h);ctx.restore();
    ctx.strokeStyle=stroke;ctx.lineWidth=1.2;ctx.stroke();
    ctx.beginPath();ctx.roundRect(x+2,y+2,w-4,h-5,Math.max(1,r-2));
    ctx.strokeStyle='rgba(255,244,212,.32)';ctx.lineWidth=1;ctx.stroke();ctx.restore();
  }

  icon(name:string,x:number,y:number,size:number):void {
    const key=`pizza-icon-${name}`;
    if(!this.scene.textures.exists(key))return;
    const texture=this.scene.textures.get(key),frame=texture.get();
    this.ctx.drawImage(texture.getSourceImage() as HTMLImageElement,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,x,y,size,size);
  }

  crop(source:HubRect,target:HubRect):void {
    if(!this.scene.textures.exists(HUB_ART.key))return;
    const image=this.scene.textures.get(HUB_ART.key).getSourceImage() as HTMLImageElement;
    this.ctx.drawImage(image,source.x,source.y,source.width,source.height,target.x,target.y,target.width,target.height);
  }

  frame(target:HubRect):void {
    const ctx=this.ctx,{x,y,width:w,height:h}=target,r=Math.min(HUB_THEME.radii.panel,w/2,h/2);
    this.panel(x,y,w,h,HUB_THEME.colors.paper,HUB_THEME.colors.shadow,r);
    ctx.save();ctx.beginPath();ctx.roundRect(x+1.5,y+1.5,w-3,h-3,r-1);
    ctx.strokeStyle=HUB_THEME.colors.shadow;ctx.lineWidth=3;ctx.stroke();
    ctx.beginPath();ctx.roundRect(x+4,y+4,w-8,h-8,r-3);
    ctx.strokeStyle=HUB_THEME.colors.border;ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
  }

  button(x:number,y:number,w:number,h:number,title:string,enabled=true,size=13):void {
    const radius=Math.min(h/2,w/2);
    this.panel(x,y,w,h,enabled?HUB_THEME.colors.action:HUB_THEME.colors.disabled,HUB_THEME.colors.actionEdge,radius);
    const ctx=this.ctx;ctx.save();ctx.beginPath();ctx.roundRect(x+1.5,y+1.5,w-3,h-4,Math.max(2,radius-1));ctx.strokeStyle=HUB_THEME.colors.actionEdge;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.roundRect(x+3.5,y+3.5,w-7,h-8,Math.max(2,radius-3));ctx.strokeStyle=HUB_THEME.colors.cream;ctx.globalAlpha=enabled?.8:.4;ctx.lineWidth=1;ctx.stroke();ctx.restore();
    this.text(x+w/2,y+(h-size)/2-1,title,size,HUB_THEME.colors.cream,true,w-8);
  }

  background():void {paintHubWood(this.ctx);}
  header(input:{title:string;subtitle:string;cash:number;pause:()=>void}):void {paintHubHeader(this.scene,this.ctx,this.hit,input);}
  navigation(active:HubTab,tab:(id:HubTab)=>void):void {paintHubNavigation(this.scene,this.ctx,this.hit,active,tab);}

  footer(input:{id:string;title:string;enabled:boolean;action:()=>void}):void {
    this.frame(HUB_THEME.geometry.footer);
    this.button(15,595,330,32,input.title,input.enabled,18);
    this.hit(input.id,12,587,336,48,input.enabled,input.action);
  }
}
