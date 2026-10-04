import type Phaser from 'phaser';

export const REFERENCE_PAUSE_ART={key:'reference-pause-panel',url:'assets/references/Bảng tạm dừng tiệm pizza.png'};
/** Coordinates measured on the unmodified 1200 × 1283 reference artwork. */
export function referencePauseLayout(){
  const scale=336/1200,x=12,y=(640-1283*scale)/2;
  const button=(top:number)=>({x:x+194*scale,y:y+top*scale,width:828*scale,height:166*scale});
  return {x,y,width:336,height:1283*scale,buttons:{resume:button(530),settings:button(720),menu:button(910)}};
}
export function preloadReferencePause(scene:Phaser.Scene):void{
  if(!scene.textures.exists(REFERENCE_PAUSE_ART.key))scene.load.image(REFERENCE_PAUSE_ART.key,`${import.meta.env.BASE_URL}${REFERENCE_PAUSE_ART.url}`);
}
