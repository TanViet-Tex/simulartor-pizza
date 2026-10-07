import type Phaser from 'phaser';
import {customerPortraitAlphaBounds,customerPortraitFit,type PortraitBounds} from './CustomerPortraits';

/** Source art remains untouched; each portrait is a frame on the transparent original. */
export const SPECIAL_CUSTOMER_PORTRAIT_MANIFEST=Object.freeze([
 Object.freeze({key:'special-customer-sheet',url:'assets/references/Bộ avatar 20 sao Việt.png',type:'image' as const}),
]);
export const SPECIAL_CUSTOMER_PORTRAIT_COUNT=20;
export const SPECIAL_CUSTOMER_FRAME_MANIFEST=Object.freeze([
 Object.freeze({key:'special-customer-frames',url:'assets/references/Ba khung avatar pizza cao cấp.png',type:'image' as const}),
]);
export type SpecialCustomerFrameKind='vip'|'kol'|'attention';
const FRAME_KINDS:readonly SpecialCustomerFrameKind[]=['vip','kol','attention'];
// Circle geometry measured on the original 2172×724 art; icons extend beyond these circles.
const FRAME_CIRCLES=Object.freeze([
 {x:392,y:398,diameter:646,innerDiameter:504},
 {x:1098,y:398,diameter:630,innerDiameter:486},
 {x:1791,y:398,diameter:630,innerDiameter:484},
]);

function separators(projection:Uint32Array,count:number):number[]{
 const boundaries=[0],length=projection.length;
 for(let index=1;index<count;index++){
  const nominal=Math.floor(index*length/count),radius=Math.ceil(length/count*.15);
  let best=nominal,score=Infinity;
  for(let point=Math.max(1,nominal-radius);point<=Math.min(length-2,nominal+radius);point++){
   const occupancy=projection[point-1]+projection[point]+projection[point+1];
   if(occupancy<score||(occupancy===score&&Math.abs(point-nominal)<Math.abs(best-nominal))){best=point;score=occupancy;}
  }
  boundaries.push(best);
 }
 boundaries.push(length);return boundaries;
}

/** Transparent valleys handle the source's uneven rows without clipping hair or faces. */
export function specialCustomerPortraitMeasuredBounds(rgba:ArrayLike<number>,width:number,height:number):PortraitBounds[]{
 const yProjection=new Uint32Array(height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(rgba[(y*width+x)*4+3]>=160)yProjection[y]++;
 const rows=separators(yProjection,4),result:PortraitBounds[]=[];
 for(let row=0;row<4;row++){
  const top=rows[row],bottom=rows[row+1],xProjection=new Uint32Array(width);
  for(let y=top;y<bottom;y++)for(let x=0;x<width;x++)if(rgba[(y*width+x)*4+3]>=160)xProjection[x]++;
  const columns=separators(xProjection,5);
  for(let col=0;col<5;col++)result.push(customerPortraitAlphaBounds(rgba,width,{x:columns[col],y:top,width:columns[col+1]-columns[col],height:bottom-top}));
 }
 return result;
}

/** Entire alpha rectangle fits the circle; do not crop with a face-only circular mask. */
export const specialCustomerPortraitFit=customerPortraitFit;

export function preloadSpecialCustomerPortraits(scene:Phaser.Scene):void{
 for(const asset of SPECIAL_CUSTOMER_PORTRAIT_MANIFEST)if(!scene.textures.exists(asset.key))scene.load.image(asset.key,`${import.meta.env.BASE_URL}${asset.url}`);
}

/** Unavailable/unreadable art is a presentation fallback, never a gameplay failure. */
export function registerSpecialCustomerPortraitFrames(scene:Phaser.Scene):void{
 const key=SPECIAL_CUSTOMER_PORTRAIT_MANIFEST[0].key;
 if(!scene.textures.exists(key))return;
 const texture=scene.textures.get(key);
 if(Array.from({length:SPECIAL_CUSTOMER_PORTRAIT_COUNT},(_,index)=>texture.has(`special-customer-${index}`)).every(Boolean))return;
 try{
  const source=texture.getSourceImage() as HTMLImageElement|HTMLCanvasElement;
  if(!source.width||!source.height)return;
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const context=canvas.getContext('2d',{willReadFrequently:true});
  if(!context)return;
  context.drawImage(source,0,0);
  const rgba=context.getImageData(0,0,canvas.width,canvas.height).data;
  const measured=specialCustomerPortraitMeasuredBounds(rgba,canvas.width,canvas.height);
  for(let index=0;index<SPECIAL_CUSTOMER_PORTRAIT_COUNT;index++){
   const frame=`special-customer-${index}`,bounds=measured[index];
   if(!texture.has(frame))texture.add(frame,0,bounds.x,bounds.y,bounds.width,bounds.height);
  }
 }catch{
  // A missing DOM, decode problem or security restriction leaves ordinary fallback art usable.
 }
}

export function specialCustomerPortraitFrame(index:number):{key:string;frame:string}{
 const finite=Number.isFinite(index)?Math.trunc(index):0;
 const id=((finite%SPECIAL_CUSTOMER_PORTRAIT_COUNT)+SPECIAL_CUSTOMER_PORTRAIT_COUNT)%SPECIAL_CUSTOMER_PORTRAIT_COUNT;
 return {key:SPECIAL_CUSTOMER_PORTRAIT_MANIFEST[0].key,frame:`special-customer-${id}`};
}

export function preloadSpecialCustomerFrames(scene:Phaser.Scene):void{
 for(const asset of SPECIAL_CUSTOMER_FRAME_MANIFEST)if(!scene.textures.exists(asset.key))scene.load.image(asset.key,`${import.meta.env.BASE_URL}${asset.url}`);
}

export function specialCustomerFrame(kind:SpecialCustomerFrameKind):{key:string;frame:string}{
 return {key:SPECIAL_CUSTOMER_FRAME_MANIFEST[0].key,frame:`special-frame-${kind}`};
}

export function registerSpecialCustomerFrames(scene:Phaser.Scene):void{
 const key=SPECIAL_CUSTOMER_FRAME_MANIFEST[0].key;
 if(!scene.textures.exists(key))return;
 const texture=scene.textures.get(key);
 if(FRAME_KINDS.every(kind=>texture.has(specialCustomerFrame(kind).frame)))return;
 try{
  const source=texture.getSourceImage() as HTMLImageElement|HTMLCanvasElement;
  if(!source.width||!source.height)return;
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const context=canvas.getContext('2d',{willReadFrequently:true});if(!context)return;
  context.drawImage(source,0,0);const rgba=context.getImageData(0,0,canvas.width,canvas.height).data;
  const projection=new Uint32Array(canvas.width);
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(rgba[(y*canvas.width+x)*4+3]>=160)projection[x]++;
  const columns=separators(projection,3);
  FRAME_KINDS.forEach((kind,index)=>{
   const name=specialCustomerFrame(kind).frame;
   const bounds=customerPortraitAlphaBounds(rgba,canvas.width,{x:columns[index],y:0,width:columns[index+1]-columns[index],height:canvas.height});
   if(!texture.has(name))texture.add(name,0,bounds.x,bounds.y,bounds.width,bounds.height);
  });
 }catch{ /* Presentation fallback retains ordinary art and never pauses gameplay. */ }
}

/** Position the full original frame so its circular opening stays at the existing queue center. */
export function specialCustomerFrameFit(scene:Phaser.Scene,kind:SpecialCustomerFrameKind,centerX:number,centerY:number,outerDiameter=44):{x:number;y:number;width:number;height:number;portraitDiameter:number}|null{
 const reference=specialCustomerFrame(kind);
 if(!scene.textures.exists(reference.key))return null;
 const texture=scene.textures.get(reference.key);if(!texture.has(reference.frame))return null;
 const frame=texture.get(reference.frame),source=texture.getSourceImage() as HTMLImageElement|HTMLCanvasElement;
 const geometry=FRAME_CIRCLES[FRAME_KINDS.indexOf(kind)],sourceScale=source.width/2172;
 const scale=outerDiameter/(geometry.diameter*sourceScale);
 return {
  x:centerX+(frame.cutX+frame.cutWidth/2-geometry.x*sourceScale)*scale,
  y:centerY+(frame.cutY+frame.cutHeight/2-geometry.y*sourceScale)*scale,
  width:frame.cutWidth*scale,height:frame.cutHeight*scale,
  portraitDiameter:geometry.innerDiameter/geometry.diameter*outerDiameter,
 };
}
