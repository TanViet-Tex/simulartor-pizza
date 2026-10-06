import type Phaser from 'phaser';

/** Logical geometry stays fixed; 2x glyphs also remain sharp on desktop FIT. */
export const UI_RASTER_SCALE=2;
export function uiCanvas(scene:Phaser.Scene,key:string,width:number,height:number):Phaser.Textures.CanvasTexture {
  const texture=scene.textures.createCanvas(key,Math.ceil(width*UI_RASTER_SCALE),Math.ceil(height*UI_RASTER_SCALE))!;
  texture.context.scale(UI_RASTER_SCALE,UI_RASTER_SCALE);
  texture.context.imageSmoothingEnabled=true;
  texture.context.imageSmoothingQuality='high';
  scene.game.canvas.dataset.uiRasterScale=String(UI_RASTER_SCALE);
  return texture;
}

const strengthened=new WeakMap<Phaser.Textures.TextureManager,Set<string>>();
/** Adjust illustration pixels once at scene entry, before registering crops.
 * DOM fields, dynamic semantic colors and Text objects never pass through this.
 */
export function strengthenIllustrations(scene:Phaser.Scene):void {
  let done=strengthened.get(scene.textures);if(!done){done=new Set();strengthened.set(scene.textures,done);}
  for(const key of scene.textures.getTextureKeys()){
    if(done.has(key)||!(/^(reference-|shared-hub-header$|notification-frame-|test-code-reward$|main-menu-background$)/.test(key)))continue;
    const original=scene.textures.get(key),source=original.getSourceImage();
    if(!(source instanceof HTMLImageElement))continue;
    const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
    const ctx=canvas.getContext('2d')!;
    ctx.filter='contrast(1.14) saturate(1.08)';ctx.drawImage(source,0,0);ctx.filter='none';
    scene.textures.remove(key);scene.textures.addCanvas(key,canvas);done.add(key);
  }
  scene.game.canvas.dataset.uiArtContrast='1.14';
}
