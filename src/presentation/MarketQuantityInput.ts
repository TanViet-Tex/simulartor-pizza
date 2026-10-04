import {HUB_THEME} from './HubTheme';

/** Native numeric keyboard without adding a Phaser DOM plugin or changing game config. */
export class MarketQuantityInput {
  readonly element=document.createElement('input');
  constructor(private canvas:HTMLCanvasElement,value:number,change:()=>void,accept:()=>void,cancel:()=>void,private options:{min?:number;max?:number;label?:string}={}){
    const input=this.element;
    input.type='text';input.inputMode='numeric';input.autocomplete='off';input.maxLength=10;
    input.setAttribute('aria-label',options.label??'Số lượng nguyên liệu');input.setAttribute('data-market-quantity-input','true');
    input.value=String(value);
    Object.assign(input.style,{position:'fixed',zIndex:'1000',boxSizing:'border-box',border:`2px solid ${HUB_THEME.colors.border}`,outlineColor:HUB_THEME.colors.border,borderRadius:'10px',background:HUB_THEME.colors.field,color:HUB_THEME.colors.ink,textAlign:'center',fontFamily:HUB_THEME.typography.fontFamily,fontWeight:'bold'});
    input.addEventListener('input',change);
    input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();accept();}else if(event.key==='Escape'){event.preventDefault();cancel();}});
    document.body.append(input);this.position();input.focus();input.select();
  }
  get quantity():number|null {
    const value=this.element.value.trim();if(!/^\d{1,3}$/.test(value))return null;
    const quantity=Number(value);return quantity>=(this.options.min??1)&&quantity<=(this.options.max??100)?quantity:null;
  }
  position():void {
    const b=this.canvas.getBoundingClientRect(),scale=Math.min(b.width/360,b.height/640);
    Object.assign(this.element.style,{left:`${b.left+80*b.width/360}px`,top:`${b.top+326*b.height/640}px`,width:`${200*b.width/360}px`,height:`${Math.max(48,48*b.height/640)}px`,fontSize:`${Math.max(16,24*scale)}px`});
  }
  destroy():void{this.element.remove();}
}
