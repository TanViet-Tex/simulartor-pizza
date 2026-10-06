import type Phaser from 'phaser';

export const SETTINGS_ART={key:'reference-settings-source',url:'assets/references/Cài đặt tiệm pizza ấm cúng.png'};
export function preloadSettingsArt(scene:Phaser.Scene):void {
  if(!scene.textures.exists(SETTINGS_ART.key))scene.load.image(SETTINGS_ART.key,`${import.meta.env.BASE_URL}${SETTINGS_ART.url}`);
}

/** Cache the ornament, blank paper and edge slices. No sample controls survive. */
export function drawSettingsArt(scene:Phaser.Scene,layer:Phaser.GameObjects.Container):void {
  const key='reference-settings-frame';
  if(!scene.textures.exists(key)){
    const art=scene.textures.createCanvas(key,360,640)!,ctx=art.context;
    const source=scene.textures.get(SETTINGS_ART.key).getSourceImage() as HTMLImageElement;
    const s=336/868,x=(v:number)=>12+(v-38)*s,y=(v:number)=>34+(v-132)*s;
    // Rasterize the source silhouette: Phaser 4 WebGL container masks are not
    // available, and the photograph outside the wooden border is not panel art.
    ctx.beginPath();ctx.moveTo(x(38),y(365));
    for(const [px,py] of [[45,296],[75,262],[113,239],[273,232],[266,215],[312,212],[370,174],[384,189],[408,145],[457,131],[508,135],[557,171],[575,192],[627,211],[676,213],[666,231],[814,236],[868,268],[904,325]] as const)ctx.lineTo(x(px),y(py));
    ctx.lineTo(348,579);ctx.quadraticCurveTo(348,609,312,612);ctx.lineTo(48,612);ctx.quadraticCurveTo(12,609,12,579);ctx.closePath();ctx.clip();
    ctx.drawImage(source,300,439,200,45,12,34,336,578);
    ctx.drawImage(source,38,132,868,318,12,34,336,318*s);
    // Remove the baked title while retaining its two flourishes.
    ctx.drawImage(source,300,439,200,45,x(310),y(327),310*s,112*s);
    const bodyTop=y(450),bottomTop=552;
    ctx.drawImage(source,38,450,45,856,12,bodyTop,45*s,bottomTop-bodyTop);
    ctx.drawImage(source,860,450,46,856,x(860),bodyTop,46*s,bottomTop-bodyTop);
    ctx.drawImage(source,38,1305,123,162,12,bottomTop,123*s,60);
    ctx.drawImage(source,783,1305,123,162,x(783),bottomTop,123*s,60);
    ctx.drawImage(source,161,1410,622,57,x(161),590,622*s,22);
    art.refresh();
  }
  layer.add(scene.add.image(0,0,key).setOrigin(0));
}

export type SettingsIcon='music'|'record'|'code'|'motion';
const iconSlices:Record<SettingsIcon,readonly [number,number,number,number]>={music:[116,488,122,113],record:[116,650,121,125],code:[108,866,134,129],motion:[106,1080,129,122]};
export function drawSettingsIcon(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,icon:SettingsIcon,left:number,top:number,size=44):void {
  const texture=scene.textures.get(SETTINGS_ART.key),[x,y,w,h]=iconSlices[icon];
  if(!texture.has(icon))texture.add(icon,0,x,y,w,h);
  const scale=size/Math.max(w,h);
  layer.add(scene.add.image(left+size/2,top+size/2,SETTINGS_ART.key,icon).setDisplaySize(w*scale,h*scale));
}
