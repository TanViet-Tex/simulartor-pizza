import type Phaser from 'phaser';
import {drawModalBackdrop} from './ModalBackdrop';
import {drawNotificationFrame,drawNotificationButton,drawNotificationClose,type NotificationRect} from './NotificationFrame';
import {UI_THEME} from './theme';
import {testCodeViewportOffset} from './TestCodeViewport';
import {drawTestCodeReward} from './TestCodeReward';
import {TEST_CODE_COINS} from '../domain/TestCode';

export type TestCodeActions={message:(value:string)=>string;claim:(value:string)=>boolean;claimed:()=>boolean;save:()=>{state:string;message:string;canRetry:boolean};retry:()=>void};
/** Native text input lives above the canvas; each scene owns and destroys this editor. */
export class TestCodePanel {
  readonly element=document.createElement('input');
  private feedback='Nhập mã để nhận xu thử chức năng.';
  private submitted=false;
  private received=false;
  private destroyed=false;
  private redraw=0;
  private viewport=window.visualViewport;
  private viewportChanged=():void=>{
    if(this.destroyed||this.redraw)return;
    this.redraw=requestAnimationFrame(()=>{this.redraw=0;if(!this.destroyed)this.changed();});
  };
  private offset():number {
    const b=this.canvas.getBoundingClientRect();
    return testCodeViewportOffset({canvasTop:b.top,canvasHeight:b.height,visibleTop:this.viewport?.offsetTop??0,visibleHeight:this.viewport?.height??window.innerHeight,focused:document.activeElement===this.element&&!this.received});
  }
  private keyDown=(event:KeyboardEvent):void=>{
    if(event.key==='Escape'){event.preventDefault();this.close();}
    else if(event.key==='Enter'&&(document.activeElement===this.element||document.activeElement===this.canvas)){
      event.preventDefault();if(this.received)this.close();else this.accept();
    }
  };
  constructor(private canvas:HTMLCanvasElement,private actions:TestCodeActions|undefined,private changed:()=>void,private close:()=>void){
    const input=this.element;input.type='text';input.autocomplete='off';input.maxLength=64;
    input.setAttribute('aria-label','Mã nhận xu');input.dataset.testCodeInput='true';
    Object.assign(input.style,{position:'fixed',zIndex:'1000',boxSizing:'border-box',border:'2px solid #bd9458',borderRadius:'10px',background:'#fff0d5',color:'#362018',textAlign:'center',fontFamily:UI_THEME.typography.fontFamily,fontSize:'20px'});
    document.addEventListener('keydown',this.keyDown);
    input.addEventListener('focus',this.viewportChanged);input.addEventListener('blur',this.viewportChanged);
    this.viewport?.addEventListener('resize',this.viewportChanged);this.viewport?.addEventListener('scroll',this.viewportChanged);window.addEventListener('resize',this.viewportChanged);window.addEventListener('scroll',this.viewportChanged);
    document.body.append(input);this.position();input.focus();
  }
  accept():void {
    if(!this.actions){this.feedback='Cần chiến dịch có lưu để nhận mã.';this.changed();return;}
    if(this.actions.save().state==='saving')return;
    if(this.submitted&&this.actions.save().canRetry){this.actions.retry();this.changed();return;}
    const message=this.actions.message(this.element.value);
    if(message){this.feedback=message;this.changed();return;}
    this.submitted=this.actions.claim(this.element.value);this.changed();
  }
  position(offset=this.offset()):void {
    const b=this.canvas.getBoundingClientRect();Object.assign(this.element.style,{left:`${b.left+55*b.width/360}px`,top:`${b.top+(315+offset)*b.height/640}px`,width:`${250*b.width/360}px`,height:`${Math.max(48,48*b.height/640)}px`});
  }
  draw(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,register:(id:string,r:NotificationRect,enabled:boolean,action:()=>void)=>void):void {
    const save=this.actions?.save(),busy=save?.state==='saving';
    if(this.submitted&&!this.received&&save?.state==='ready'&&this.actions?.claimed()){this.received=true;this.feedback='Đã nhận 100.000 xu. Mã dùng một lần mỗi lượt chơi.';this.element.blur();this.element.remove();this.canvas.focus();}
    const feedback=busy?'Đang lưu… Giữ trang này mở.':this.submitted&&save?.state==='error'?save.message:this.feedback;
    this.element.readOnly=busy||this.received;
    drawModalBackdrop(scene,layer);
    scene.game.canvas.dataset.testCodeFeedback=feedback;
    if(this.received){scene.game.canvas.dataset.testCodeOffset='0';drawTestCodeReward(scene,layer,TEST_CODE_COINS,register,this.close);return;}
    const offset=this.offset();this.position(offset);const content=scene.add.container(0,offset);layer.add(content);
    const originalRegister=register;register=(id,r,enabled,action)=>originalRegister(id,{...r,y:r.y+offset},enabled,action);
    layer=content;const layout=drawNotificationFrame(scene,layer,'two',170,330);
    scene.game.canvas.dataset.testCodeOffset=String(offset);
    const close=drawNotificationClose(scene,layer,layout);if(close)register('test-code-close',close,true,this.close);
    const text=(y:number,value:string,size:number)=>layer.add(scene.add.text(180,y,value,{fontFamily:UI_THEME.typography.fontFamily,fontSize:`${size}px`,fontStyle:'bold',color:'#362018',align:'center',wordWrap:{width:276}}).setOrigin(.5,0));
    text(layout.titleY+10,'Nhập mã',22);text(285,'Mã nhận xu thử chức năng',15);text(378,feedback,14);
    ['test-code-cancel','test-code-receive'].forEach((id,index)=>{const r=layout.footer[index];drawNotificationButton(scene,layer,r.x,r.y,r.width,r.height);layer.add(scene.add.text(r.x+r.width/2,r.y+r.height/2,index?save?.canRetry&&this.submitted?'Thử lại':'Nhận xu':'Quay lại',{fontFamily:UI_THEME.typography.fontFamily,fontSize:'16px',fontStyle:'bold',color:'#fff0d5'}).setOrigin(.5));register(id,r,index?!busy&&!this.received:true,index?()=>this.accept():this.close);});
    scene.game.canvas.dataset.testCodeFeedback=feedback;
  }
  destroy():void{this.destroyed=true;cancelAnimationFrame(this.redraw);document.removeEventListener('keydown',this.keyDown);this.element.removeEventListener('focus',this.viewportChanged);this.element.removeEventListener('blur',this.viewportChanged);this.viewport?.removeEventListener('resize',this.viewportChanged);this.viewport?.removeEventListener('scroll',this.viewportChanged);window.removeEventListener('resize',this.viewportChanged);window.removeEventListener('scroll',this.viewportChanged);this.element.remove();this.canvas.focus();delete this.canvas.dataset.testCodeFeedback;delete this.canvas.dataset.testCodeOffset;delete this.canvas.dataset.testCodeReward;}
}
