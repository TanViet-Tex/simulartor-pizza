import type Phaser from 'phaser';
import {normalizePlayerName,playerNameError} from '../domain/Leaderboard';
import {drawModalBackdrop} from './ModalBackdrop';
import {drawNotificationFrame,drawNotificationButton,drawNotificationClose,type NotificationRect} from './NotificationFrame';
import {testCodeViewportOffset} from './TestCodeViewport';
import {UI_THEME} from './theme';
import {UI_RASTER_SCALE} from './UiRaster';

/** The scene owns this native editor and tears it down before entering play. */
export class PlayerNamePanel {
  readonly element=document.createElement('input');
  private feedback='Tên từ 2–20 ký tự. Có thể trùng tên người khác.';
  private submitted=false;
  private destroyed=false;
  private redraw=0;
  private viewport=window.visualViewport;
  private viewportChanged=():void=>{if(!this.destroyed&&!this.redraw)this.redraw=requestAnimationFrame(()=>{this.redraw=0;if(!this.destroyed)this.changed();});};
  private keyDown=(event:KeyboardEvent):void=>{
    if(event.isComposing||event.keyCode===229)return;
    if(document.activeElement!==this.element&&document.activeElement!==this.canvas)return;
    if(event.key==='Escape'){event.preventDefault();this.close();}
    else if(event.key==='Enter'){event.preventDefault();this.accept();}
  };
  constructor(private canvas:HTMLCanvasElement,name:string,private submit:(value:string)=>string,private changed:()=>void,private close:()=>void){
    const input=this.element;input.type='text';input.setAttribute('autocomplete','nickname');input.maxLength=80;input.value=name;
    input.setAttribute('aria-label','Tên người chơi');input.dataset.playerNameInput='true';
    Object.assign(input.style,{position:'fixed',zIndex:'1000',boxSizing:'border-box',border:'2px solid #bd9458',borderRadius:'10px',background:'#fff0d5',color:'#362018',textAlign:'center',fontFamily:UI_THEME.typography.fontFamily,fontSize:'20px'});
    document.addEventListener('keydown',this.keyDown);input.addEventListener('focus',this.viewportChanged);input.addEventListener('blur',this.viewportChanged);
    this.viewport?.addEventListener('resize',this.viewportChanged);this.viewport?.addEventListener('scroll',this.viewportChanged);window.addEventListener('resize',this.viewportChanged);window.addEventListener('scroll',this.viewportChanged);
    document.body.append(input);this.position();input.focus();
  }
  private offset():number {const b=this.canvas.getBoundingClientRect();return testCodeViewportOffset({canvasTop:b.top,canvasHeight:b.height,visibleTop:this.viewport?.offsetTop??0,visibleHeight:this.viewport?.height??window.innerHeight,focused:document.activeElement===this.element});}
  private position(offset=this.offset()):void{const b=this.canvas.getBoundingClientRect();Object.assign(this.element.style,{left:`${b.left+55*b.width/360}px`,top:`${b.top+(315+offset)*b.height/640}px`,width:`${250*b.width/360}px`,height:`${Math.max(48,48*b.height/640)}px`});}
  accept():void{
    if(this.submitted||this.destroyed)return;
    const name=normalizePlayerName(this.element.value),error=playerNameError(name);
    if(error){this.feedback=error;this.changed();return;}
    this.submitted=true;
    const failure=this.submit(name);
    if(failure){this.submitted=false;this.feedback=failure;this.changed();}
  }
  draw(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,register:(id:string,r:NotificationRect,enabled:boolean,action:()=>void)=>void):void{
    drawModalBackdrop(scene,layer);const offset=this.offset();this.position(offset);const content=scene.add.container(0,offset);layer.add(content);
    const layout=drawNotificationFrame(scene,content,'two',170,330);
    const target=(id:string,r:NotificationRect,action:()=>void)=>register(id,{...r,y:r.y+offset},!this.submitted,action);
    const close=drawNotificationClose(scene,content,layout);if(close)target('player-name-close',close,this.close);
    const text=(y:number,value:string,size:number)=>content.add(scene.add.text(180,y,value,{fontFamily:UI_THEME.typography.fontFamily,fontSize:`${size}px`,fontStyle:'bold',color:'#362018',align:'center',wordWrap:{width:276}}).setResolution(UI_RASTER_SCALE).setOrigin(.5,0));
    text(layout.titleY+10,'Tên người chơi',22);text(285,'Đặt tên để vào bảng xếp hạng',15);text(378,this.feedback,14);
    layout.footer.forEach((r,index)=>{drawNotificationButton(scene,content,r.x,r.y,r.width,r.height);content.add(scene.add.text(r.x+r.width/2,r.y+r.height/2,index?'Vào chơi':'Quay lại',{fontFamily:UI_THEME.typography.fontFamily,fontSize:'16px',fontStyle:'bold',color:'#fff0d5'}).setResolution(UI_RASTER_SCALE).setOrigin(.5));target(index?'player-name-submit':'player-name-cancel',r,index?()=>this.accept():this.close);});
    this.canvas.dataset.playerNameFeedback=this.feedback;this.canvas.dataset.playerNameOffset=String(offset);
  }
  destroy():void{if(this.destroyed)return;this.destroyed=true;cancelAnimationFrame(this.redraw);document.removeEventListener('keydown',this.keyDown);this.element.removeEventListener('focus',this.viewportChanged);this.element.removeEventListener('blur',this.viewportChanged);this.viewport?.removeEventListener('resize',this.viewportChanged);this.viewport?.removeEventListener('scroll',this.viewportChanged);window.removeEventListener('resize',this.viewportChanged);window.removeEventListener('scroll',this.viewportChanged);this.element.remove();this.canvas.focus();delete this.canvas.dataset.playerNameFeedback;delete this.canvas.dataset.playerNameOffset;}
}
