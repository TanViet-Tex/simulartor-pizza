import Phaser from 'phaser';

export const MENU_CURTAIN = {key:'menu-curtain',url:'assets/menu-curtain.png',type:'image' as const};
// Measured from the painted crossbar: image pixels (0, 361) to (60, 384).
// Hang directly from that beam; a second drawn rod would duplicate its edge.
const CURTAIN_ANCHOR={x:16,y:144,slope:23/60,width:28,height:92};

/** Decorative motion only: fire tongues, incoming breeze and a top-anchored curtain. */
export class MenuAmbience {
  private readonly flames:Phaser.GameObjects.Graphics[]=[];
  private readonly breeze:Phaser.GameObjects.Graphics[]=[];
  private readonly embers:Phaser.GameObjects.Arc[]=[];
  private readonly curtain:Phaser.GameObjects.Rope|Phaser.GameObjects.Container;
  private readonly curtainScale:number;
  private elapsed=0;
  private moving=false;

  constructor(scene:Phaser.Scene) {
    for(let i=0;i<7;i++){
      const flame=scene.add.graphics().setPosition(257+i*6,285).setDepth(1);
      const width=8+(i%3)*2,height=16+Math.sin(i/6*Math.PI)*16;
      this.flameShape(flame,width,height,0xf99121,.78);
      this.flameShape(flame,width*.48,height*.62,0xffe38a,.9);
      this.flames.push(flame);
    }
    for(let i=0;i<3;i++){
      const ember=scene.add.circle(269+i*6,278,1,0xffdd80).setDepth(1);
      this.embers.push(ember);
      const gust=scene.add.graphics().setDepth(1);
      gust.lineStyle(1,0xfff8e5,.8).beginPath();
      for(let j=0;j<=24;j++){
        const x=j*1.9,y=Math.sin(j/8)*3;
        if(j===0)gust.moveTo(x,y);else gust.lineTo(x,y);
      }
      gust.strokePath();this.breeze.push(gust);
    }
    const frame=scene.textures.getFrame(MENU_CURTAIN.key);
    this.curtainScale=CURTAIN_ANCHOR.width/frame.width;
    if(scene.game.renderer.type===Phaser.WEBGL){
      const points=Array.from({length:15},(_,i)=>({x:0,y:frame.height*i/14}));
      this.curtain=scene.add.rope(CURTAIN_ANCHOR.x,CURTAIN_ANCHOR.y,MENU_CURTAIN.key,undefined,points,false)
        .setScale(this.curtainScale,CURTAIN_ANCHOR.height/frame.height).setDepth(1);
    }else{
      // Narrow columns reproduce the sloped hanging edge in the Canvas renderer.
      const texture=scene.textures.get(MENU_CURTAIN.key);
      this.curtain=scene.add.container(CURTAIN_ANCHOR.x,CURTAIN_ANCHOR.y).setDepth(1);
      for(let i=0;i<16;i++){
        const left=Math.floor(i*frame.width/16),right=Math.floor((i+1)*frame.width/16),name=`curtain-column-${i}`;
        if(!texture.has(name))texture.add(name,0,left,0,right-left,frame.height);
        const x=-CURTAIN_ANCHOR.width/2+left*this.curtainScale;
        this.curtain.add(scene.add.image(x,x*CURTAIN_ANCHOR.slope,MENU_CURTAIN.key,name)
          .setOrigin(0,0).setDisplaySize((right-left)*this.curtainScale,CURTAIN_ANCHOR.height));
      }
    }
    this.setMotion(false);
  }

  setMotion(enabled:boolean):void {
    this.moving=enabled;
    for(const gust of this.breeze)gust.setVisible(enabled);
    for(const ember of this.embers)ember.setVisible(enabled);
    if(!enabled)this.pose(0,false);
  }

  update(delta:number):void {
    if(!this.moving)return;
    this.elapsed+=Math.min(delta,50);
    this.pose(this.elapsed,true);
  }

  private pose(time:number,animated:boolean):void {
    for(let i=0;i<this.flames.length;i++){
      const pulse=animated?Math.sin(time/(140+i*17)+i*1.4):0;
      this.flames[i].setScale(1-pulse*.1,.82+pulse*.2)
        .setRotation(animated?Math.sin(time/360+i)*.12:0).setAlpha(.82+pulse*.13);
    }
    for(let i=0;i<this.embers.length;i++){
      const phase=(time/2200+i/3)%1;
      this.embers[i].setPosition(267+i*6+Math.sin(phase*5)*2,281-phase*30)
        .setAlpha(Math.sin(phase*Math.PI)*.7);
      const windPhase=(time/4700+i/3)%1;
      this.breeze[i].setPosition(8+windPhase*80,176+i*17+Math.sin(windPhase*6)*3)
        .setAlpha(Math.sin(windPhase*Math.PI)*.19);
    }
    const gust=animated?.5+.5*Math.sin(time/1100):0;
    if(this.curtain instanceof Phaser.GameObjects.Rope){
      const points=this.curtain.points;
      for(let i=0;i<points.length;i++){
        const u=Math.max(0,(i-1)/(points.length-2));
        points[i].x=animated?u*u*(4+gust*11+Math.sin(time/530-u*5)*3)/this.curtainScale:0;
      }
      // Shear the cloth across its width so the top follows the window's perspective,
      // while the body still hangs down instead of rotating off the left edge.
      this.curtain.updateVertices();
      const vertices=this.curtain.vertices,shear=CURTAIN_ANCHOR.slope*this.curtainScale/this.curtain.scaleY;
      for(let i=0;i<vertices.length;i+=2)vertices[i+1]+=vertices[i]*shear;
    }else for(const strip of this.curtain.list)(strip as Phaser.GameObjects.Image).setRotation(animated?-(.025+gust*.09):0);
  }

  private flameShape(g:Phaser.GameObjects.Graphics,width:number,height:number,color:number,alpha:number):void {
    g.fillStyle(color,alpha).beginPath().moveTo(-width/2,0);
    // Sample two cubic curves once; frame animation transforms the existing objects.
    this.curve(g,-width/2,0,-width*.85,-height*.32,-width*.04,-height*.57,2,-height);
    this.curve(g,2,-height,width*.18,-height*.55,width*.95,-height*.24,width/2,0);
    g.closePath().fillPath();
  }
  private curve(g:Phaser.GameObjects.Graphics,x0:number,y0:number,x1:number,y1:number,x2:number,y2:number,x3:number,y3:number):void {
    for(let i=1;i<=14;i++){
      const t=i/14,s=1-t;
      g.lineTo(s*s*s*x0+3*s*s*t*x1+3*s*t*t*x2+t*t*t*x3,s*s*s*y0+3*s*s*t*y1+3*s*t*t*y2+t*t*t*y3);
    }
  }
  destroy():void {
    // Game objects belong to the scene and are destroyed by its shutdown lifecycle.
    this.moving=false;this.flames.length=0;this.embers.length=0;this.breeze.length=0;
  }
}
