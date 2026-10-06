import {bakeTiming} from '../config/bakeTiming';
import Phaser from 'phaser';
import { UI_THEME } from './theme';
export const UI = UI_THEME.colors;

export class CozyArt {
  constructor(readonly g:Phaser.GameObjects.Graphics){}
  rect(x:number,y:number,w:number,h:number,c:number,a=1):void{this.g.fillStyle(c,a).fillRect(x,y,w,h);}
  round(x:number,y:number,w:number,h:number,r:number,c:number,stroke=0,sw=0):void{
    this.g.fillStyle(c,1).fillRoundedRect(x,y,w,h,r);
    if(sw)this.g.lineStyle(sw,stroke,1).strokeRoundedRect(x,y,w,h,r);
  }
  circle(x:number,y:number,r:number,c:number):void{this.g.fillStyle(c,1).fillCircle(x,y,r);}
  ellipse(x:number,y:number,w:number,h:number,c:number):void{this.g.fillStyle(c,1).fillEllipse(x,y,w,h);}
  panel(x:number,y:number,w:number,h:number,c:number=UI.dark,border:number=UI.border,r:number=UI_THEME.radii.panel):void{
    this.round(x,y+3,w,h,r,0x47281c);this.round(x,y,w,h,r,c,border,1.6);
    this.g.lineStyle(1,0xffd5a5,.32).beginPath().moveTo(x+r,y+3).lineTo(x+w-r,y+3).strokePath();
  }
  background():void{
    this.rect(0,0,360,640,UI.wood);
    for(let y=0;y<640;y+=24){this.rect(0,y,360,12,y%48?0xb27340:0xa66637);this.rect(0,y+23,360,1,0x784428,.6);
      for(let j=0;j<5;j++){const x=(j*83+y*7)%360;this.g.lineStyle(1,0xe5ad68,.2).lineBetween(x,y+7,x+48,y+9);}}
    this.rect(0,44,360,247,0x462b22,.8);
  }
  awning():void{
    this.rect(8,48,344,112,UI.customer);this.round(10,56,340,102,9,0x8f493d,0x7d4038,2);
    // Six broad, softly sagging fabric spans share a thin continuous terracotta hem.
    this.g.fillStyle(UI.paper,1).beginPath().moveTo(8,44).lineTo(352,44).lineTo(352,55);
    for(let n=72;n>=0;n--){const x=8+n*344/72,y=55+8*Math.sin((n%12)*Math.PI/12);this.g.lineTo(x,y);}
    this.g.closePath().fillPath();
    this.g.lineStyle(3,0xad5947,1).beginPath().moveTo(8,55);
    for(let n=1;n<=72;n++){const x=8+n*344/72,y=55+8*Math.sin((n%12)*Math.PI/12);this.g.lineTo(x,y);}
    this.g.strokePath();
    for(let i=0;i<6;i++){
      const x=8+(i+.5)*344/6;
      this.g.lineStyle(1,0xddc6a2,.5).lineBetween(x-7,45,x-4,53);
      this.rect(x-1,65,2,7,0x5c3e2c);
      this.g.fillStyle(0xffd966,.16).fillCircle(x,75,5);
      this.circle(x,75,3.5,0xf9ce59);this.circle(x-1,74,1.3,0xffefa9);
    }
  }
  board():void{
    // Cropped checkered towel and bowls stay decorative at the left edge.
    this.round(-18,294,58,150,7,0xffe2bd);
    for(let y=296;y<440;y+=15)for(let x=-15;x<40;x+=15)if((x+15+y-296)/15%2===0)this.rect(x,y,15,15,0xd95c49,.8);
    this.ellipse(-1,351,67,57,0xb2a293);this.ellipse(-2,346,61,51,UI.paper);this.ellipse(-2,345,49,38,0xb92f21);
    this.g.lineStyle(7,0x965128,1).lineBetween(3,349,44,315);this.g.lineStyle(3,0xd38b40,1).lineBetween(4,347,43,315);
    this.ellipse(1,407,52,43,0xbea887);this.ellipse(0,403,47,37,0xffd773);
    this.panel(8,296,216,139,0xd99653,0x97542f,12);
    for(let y=307;y<429;y+=14){this.g.lineStyle(1,0xffdc98,.32).lineBetween(17,y,214,y);this.g.lineStyle(1,0x9e6236,.22).lineBetween(20,y+5,203,y+6);}
    for(let i=0;i<70;i++){const x=16+(i*37)%200,y=304+(i*23)%122;this.circle(x,y,i%3?.5:1,0xf9dab0);}
  }
  pizza(x:number,y:number,r:number,ingredients:readonly string[],boxed=false,appearance?:{seconds:number;timing:ReturnType<typeof bakeTiming>;finishing?:readonly string[]}):void{
    if(boxed){this.panel(x-r-7,y-r-5,r*2+14,r*2+10,0xe1b775,0x956235,5);this.round(x-r+1,y-r+3,r*2-2,r*2-6,4,0xf8db9b);}
    if(!ingredients.includes('dough'))return;
    const gold=appearance?Math.min(1,appearance.seconds/appearance.timing.perfectStart):1;
    const burn=appearance?appearance.seconds>appearance.timing.perfectEnd?Math.max(.78,Math.min(1,(appearance.seconds-appearance.timing.perfectEnd)/(appearance.timing.gaugeEnd-appearance.timing.perfectEnd))):0:0;
    const mix=(a:number,b:number,t:number)=>{let c=0;for(const shift of [16,8,0])c|=Math.round(((a>>shift)&255)*(1-t)+((b>>shift)&255)*t)<<shift;return c;};
    const cook=(color:number)=>appearance?mix(mix(mix(color,0xffefc8,(1-gold)*.45),0xa75c24,gold*.08),0x24180f,burn*.93):color;
    this.ellipse(x+2,y+5,r*2+5,r*1.73,cook(0x945029));
    this.ellipse(x,y,r*2,r*1.78,cook(0xe8a958));this.ellipse(x,y-2,r*1.9,r*1.67,cook(0xffdfa0));
    this.ellipse(x,y-3,r*1.72,r*1.48,cook(0xefc281));
    for(let i=0;i<28;i++){const a=i*Math.PI/14;this.ellipse(x+Math.cos(a)*r*.91,y-1+Math.sin(a)*r*.77,5,3,cook(0xf7ca82));}
    for(const ingredient of ingredients){
    if(['sauce','sauce-white','sauce-bbq','sauce-pesto','sauce-hot'].includes(ingredient)){
      const color:Record<string,number>={sauce:cook(0xda4524),'sauce-white':cook(0xffecd0),'sauce-bbq':cook(0x763122),'sauce-pesto':cook(0x668c25),'sauce-hot':cook(0xed6320)};
      if(ingredient!=='sauce'){this.ellipse(x,y-3,r*1.64,r*1.39,color[ingredient]);continue;}
      this.ellipse(x,y-3,r*1.64,r*1.39,cook(0xda4524));this.ellipse(x,y-5,r*1.5,r*1.25,cook(0xed5830));
      for(let i=0;i<4;i++)this.g.lineStyle(2,cook(0xb73323),.45).strokeEllipse(x+2,y-3,r*(.35+i*.29),r*(.26+i*.25));
      for(let i=0;i<29;i++){const a=i*2.4,d=Math.sqrt(i/29)*r*.7;this.ellipse(x+Math.cos(a)*d,y-3+Math.sin(a)*d*.8,3,2,cook(0xff9d48));}
    }
    if(appearance&&ingredient==='cheese'&&gold>0){this.ellipse(x,y-3,r*1.58*gold,r*1.31*gold,cook(0xffd259));for(let i=0;i<16;i++){const a=i*2.4,d=Math.sqrt(i/16)*r*.65;this.ellipse(x+Math.cos(a)*d,y-3+Math.sin(a)*d*.8,r*.17*gold,r*.1*gold,cook(0xffe89d));}}
    if(ingredient==='cheese')for(let i=0;i<82;i++){const a=i*2.4,d=Math.sqrt(i/82)*r*.72,px=x+Math.cos(a)*d,py=y-3+Math.sin(a)*d*.8;this.g.lineStyle(Math.max(1,r/23),i%3?cook(0xffe7a0):cook(0xf6bf53),1).lineBetween(px-2,py-2,px+4,py+2);}
    if(ingredient==='sausage'||ingredient==='pepperoni')for(let i=0;i<7;i++){const a=i*2.4;this.ellipse(x+Math.cos(a)*r*.49,y-3+Math.sin(a)*r*.4,r*.3,r*.25,ingredient==='sausage'?cook(0xcb3d2d):cook(0xa52c24));}
    if(ingredient==='mushroom')for(let i=0;i<7;i++){
      const a=i*2.4,px=x+Math.cos(a)*r*.5,py=y-3+Math.sin(a)*r*.42;
      this.round(px-r*.035,py,r*.07,r*.13,r*.02,cook(0xffe2b5));this.ellipse(px,py,r*.23,r*.15,cook(0xbc8967));
    }
    const colors:Record<string,number>={pepper:cook(0x5baa28),onion:cook(0xc49add),corn:cook(0xffd04b),olive:cook(0x302e24),chicken:cook(0xeeb480),shrimp:cook(0xfc8055),squid:cook(0xffd3c1),ham:cook(0xe88587),pineapple:cook(0xffd85a)};
    if(ingredient in colors)for(let i=0;i<9;i++){
      const seed=ingredient.length*1.37,a=i*2.4+seed,d=Math.sqrt((i+.5)/10)*r*.65,px=x+Math.cos(a)*d,py=y-3+Math.sin(a)*d*.8,size=r*.15;
      if(['onion','olive','squid'].includes(ingredient)){this.g.lineStyle(Math.max(1,r*.045),colors[ingredient],1).strokeEllipse(px,py,size*1.5,size);}
      else if(ingredient==='pepper'){this.g.lineStyle(Math.max(1,r*.045),colors[ingredient],1).strokeRoundedRect(px-size/2,py-size/2,size,size*.8,size*.22);}
      else if(['ham','pineapple','chicken'].includes(ingredient))this.round(px-size/2,py-size/2,size,size*.7,size*.15,colors[ingredient]);
      else this.ellipse(px,py,size,ingredient==='corn'?size*.6:size*.85,colors[ingredient]);
    }
    }
    const drizzle:Record<string,number>={'sauce-white':0xfffaf0,'sauce-pesto':0x66a536,'sauce-hot':0xf05b2c};
    for(const [index,id] of (appearance?.finishing??[]).entries()){
      const offset=(index-1)*r*.09;this.g.lineStyle(Math.max(1.4,r*.055),drizzle[id],1).beginPath();
      for(let i=0;i<=6;i++){const dy=-r*.53+i*r*1.04/6,dx=(i%2?1:-1)*r*.43+offset;if(i===0)this.g.moveTo(x+dx,y-3+dy);else this.g.lineTo(x+dx,y-3+dy);}this.g.strokePath();
    }
  }
  leaves():void{
    for(const side of [0,360])for(let i=0;i<5;i++){this.g.fillStyle(i%2?0x557d2d:0x719d39,1);this.g.fillEllipse(side+(side? -1:1)*(i%2?9:2),641-i*8,19,31);}
  }
}
