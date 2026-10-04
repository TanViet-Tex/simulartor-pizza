import Phaser from 'phaser';

const TEXTURE='menu-soft-vapor';
/** Reusable soft vapor sprites, with no hard outlines or frame allocations. */
export class MenuSteam {
  private readonly wisps:Phaser.GameObjects.Image[]=[];
  private elapsed=0;
  constructor(scene:Phaser.Scene){
    if(!scene.textures.exists(TEXTURE)){
      const texture=scene.textures.createCanvas(TEXTURE,96,128)!;
      const context=texture.context;
      // Overlapping radial gradients produce an irregular, feathered wisp.
      for(const [x,y,r] of [[44,85,25],[51,63,29],[40,39,25],[49,23,18]]){
        const gradient=context.createRadialGradient(x,y,0,x,y,r);
        gradient.addColorStop(0,'rgba(255,247,230,0.25)');
        gradient.addColorStop(.45,'rgba(255,247,230,0.12)');
        gradient.addColorStop(1,'rgba(255,247,230,0)');
        context.fillStyle=gradient;context.fillRect(0,0,96,128);
      }
      texture.refresh();
    }
    for(let i=0;i<12;i++)this.wisps.push(scene.add.image(0,0,TEXTURE).setDepth(2).setVisible(false));
    this.pose();
  }
  setMotion(enabled:boolean):void {for(const wisp of this.wisps)wisp.setVisible(enabled);}
  update(delta:number):void {this.elapsed+=Math.min(delta,50);this.pose();}
  private pose():void {
    for(let i=0;i<this.wisps.length;i++){
      const phase=(this.elapsed/(4200+(i%3)*430)+i/this.wisps.length)%1;
      const x=123+(i%6)*22;
      this.wisps[i].setPosition(x+Math.sin(phase*5+i*.8)*(3+phase*7),374-phase*62)
        .setScale(.30+phase*.30,.34+phase*.23).setRotation(Math.sin(phase*4+i)*.12)
        .setAlpha(Math.sin(phase*Math.PI)*.68);
    }
  }
  destroy():void {this.wisps.length=0;}
}
