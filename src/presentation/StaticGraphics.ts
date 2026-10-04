import Phaser from 'phaser';

/** Cache unchanged vector decoration; preserve text, dynamic markers and input objects. */
export class StaticGraphics {
  private serial=0;
  private entries=new Map<string,{key:string;x:number;y:number;width:number;height:number}>();
  constructor(private readonly scene:Phaser.Scene){}
  bake(layer:Phaser.GameObjects.Container):void{
    const used=new Set<string>();
    for(const object of [...layer.list]){
      if(!(object instanceof Phaser.GameObjects.Graphics)||object.getData('dynamic'))continue;
      const signature=JSON.stringify(object.commandBuffer);used.add(signature);
      let entry=this.entries.get(signature);
      if(!entry){
        const staging='cozy-static-staging',key=`cozy-static-${this.serial++}`;object.generateTexture(staging,360,640);
        const canvas=this.scene.textures.get(staging).getSourceImage() as HTMLCanvasElement;
        const context=canvas.getContext('2d')!,pixels=context.getImageData(0,0,360,640).data;
        let left=360,top=640,right=0,bottom=0;
        for(let y=0;y<640;y++)for(let x=0;x<360;x++)if(pixels[(y*360+x)*4+3]){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
        entry={key,x:left,y:top,width:Math.max(1,right-left+1),height:Math.max(1,bottom-top+1)};
        const texture=this.scene.textures.createCanvas(key,entry.width,entry.height)!;
        texture.context.putImageData(context.getImageData(entry.x,entry.y,entry.width,entry.height),0,0);texture.refresh();
        this.scene.textures.remove(staging);
        this.entries.set(signature,entry);
      }
      const image=this.scene.add.image(entry.x,entry.y,entry.key).setOrigin(0);
      const index=layer.getIndex(object);layer.remove(object,true);layer.addAt(image,index);
    }
    // Never evict a texture used by the currently displayed layer.
    for(const [signature,entry] of this.entries){if(this.entries.size<=96)break;if(!used.has(signature)){this.scene.textures.remove(entry.key);this.entries.delete(signature);}}
    this.scene.game.canvas.dataset.staticTextureCount=String(this.entries.size);
    this.scene.game.canvas.dataset.staticTextureBytes=String([...this.entries.values()].reduce((bytes,e)=>bytes+e.width*e.height*8,0));
  }
  destroy():void{for(const entry of this.entries.values())this.scene.textures.remove(entry.key);this.entries.clear();}
}
