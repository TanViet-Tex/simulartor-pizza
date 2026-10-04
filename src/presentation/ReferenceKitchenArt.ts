import type Phaser from 'phaser';

/** Clean artwork only: day/cash/orders and hit targets belong to the scene. */
export const REFERENCE_KITCHEN_MANIFEST = Object.freeze([
  {key:'reference-kitchen-background',url:'assets/reference-kitchen-clean.png',type:'image' as const},
  {key:'reference-kitchen-ovens',url:'assets/reference-kitchen-ovens.png',type:'image' as const},
]);

export function registerReferenceKitchenFrames(scene:Phaser.Scene):void {
  for(const [key,names] of [
    ['reference-kitchen-ovens',['oven-empty','oven-occupied','oven-burnt']],
  ] as const){
    const texture=scene.textures.get(key),source=texture.getSourceImage(),cell=source.width/3;
    names.forEach((name,i)=>{
      // Discard the transparent atlas margins, retaining the art's native proportions.
      const x=Math.round(i*cell+cell*.035),y=Math.round(source.height*.2);
      if(!texture.has(name))texture.add(name,0,x,y,Math.floor(cell*.93),Math.floor(source.height*.59));
    });
  }
}
