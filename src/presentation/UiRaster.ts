import Phaser from 'phaser';

/** Logical geometry stays fixed; 2x glyphs also remain sharp on desktop FIT. */
export const UI_RASTER_SCALE=2;
export function uiCanvas(scene:Phaser.Scene,key:string,width:number,height:number):{context:CanvasRenderingContext2D;refresh:()=>void} {
  if(scene.textures.exists(key))throw new Error(`UI texture already exists: ${key}`);
  const canvas=Phaser.Display.Canvas.CanvasPool.create2D(scene,Math.ceil(width*UI_RASTER_SCALE),Math.ceil(height*UI_RASTER_SCALE));
  // Register ownership immediately, so the texture manager owns cleanup even if painting fails.
  const texture=scene.textures.create(key,canvas);
  if(!texture){Phaser.Display.Canvas.CanvasPool.remove(canvas);throw new Error(`UI texture already exists: ${key}`);}
  texture.add('__BASE',0,0,0,canvas.width,canvas.height);
  const context=canvas.getContext('2d')!;
  context.scale(UI_RASTER_SCALE,UI_RASTER_SCALE);
  context.imageSmoothingEnabled=true;
  context.imageSmoothingQuality='high';
  scene.textures.emit(Phaser.Textures.Events.ADD,key,texture);
  scene.textures.emit(Phaser.Textures.Events.ADD_KEY+key,texture);
  scene.game.canvas.dataset.uiRasterScale=String(UI_RASTER_SCALE);
  // Paint-only UI never needs CanvasTexture's full ImageData copy or its extra blank upload.
  return {context,refresh:()=>{texture.source[0].update();}};
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
