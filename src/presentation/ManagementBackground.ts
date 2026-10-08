import type Phaser from 'phaser';

export const MANAGEMENT_BACKGROUND_ASSET=Object.freeze({
  key:'management-background',url:'assets/management-background.png',type:'image' as const,
});

/** Direct-scene fixtures use the same asset as the normal startup gate. */
export function preloadManagementBackground(scene:Phaser.Scene):void {
  if(!scene.textures.exists(MANAGEMENT_BACKGROUND_ASSET.key))
    scene.load.image(MANAGEMENT_BACKGROUND_ASSET.key,`${import.meta.env.BASE_URL}${MANAGEMENT_BACKGROUND_ASSET.url}`);
}

/** One fixed backdrop per scene, outside the disposable UI and scrolling lists. */
export class ManagementBackground {
  readonly image:Phaser.GameObjects.Image;
  private disposed=false;
  private readonly onResize=()=>this.resize();
  private readonly onCleanup=()=>this.destroy();

  constructor(private readonly scene:Phaser.Scene) {
    this.image=scene.add.image(0,0,MANAGEMENT_BACKGROUND_ASSET.key)
      .setOrigin(.5).setScrollFactor(0).setDepth(-1).setVisible(false);
    this.resize();
    scene.scale.on('resize',this.onResize);
    scene.events.once('shutdown',this.onCleanup);
    scene.events.once('destroy',this.onCleanup);
  }

  show():void {if(!this.disposed)this.image.setVisible(true);}
  hide():void {if(!this.disposed)this.image.setVisible(false);}

  resize():void {
    if(this.disposed)return;
    const {width,height}=this.scene.scale.gameSize;
    const scale=Math.max(width/this.image.frame.realWidth,height/this.image.frame.realHeight);
    this.image.setPosition(width/2,height/2).setScale(scale);
  }

  destroy():void {
    if(this.disposed)return;
    this.disposed=true;
    this.scene.scale.off('resize',this.onResize);
    this.scene.events.off('shutdown',this.onCleanup);
    this.scene.events.off('destroy',this.onCleanup);
    this.image.destroy();
  }
}
