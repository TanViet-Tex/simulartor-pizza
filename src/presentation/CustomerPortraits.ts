import type Phaser from 'phaser';
export const CUSTOMER_PORTRAIT_MANIFEST=Object.freeze(Array.from({length:5},(_,i)=>({key:`customer-sheet-${i+1}`,url:`assets/customer-portraits/sheet-${i+1}.png`,type:'image' as const})));

export interface PortraitBounds { x:number; y:number; width:number; height:number }

/** Adjacent integer boundaries tile the full sheet, including uneven edge cells. */
export function customerPortraitGridBounds(width:number,height:number,index:number):PortraitBounds {
 const col=index%5,row=Math.floor(index/5);
 const x=Math.floor(col*width/5),y=Math.floor(row*height/6);
 return {x,y,width:Math.floor((col+1)*width/5)-x,height:Math.floor((row+1)*height/6)-y};
}

/** Read only one cell: transparent padding and faint extraction fringe do not shift its center. */
export function customerPortraitAlphaBounds(rgba:ArrayLike<number>,sheetWidth:number,cell:PortraitBounds,threshold=32):PortraitBounds {
 let left=cell.x+cell.width,top=cell.y+cell.height,right=-1,bottom=-1;
 for(let y=cell.y;y<cell.y+cell.height;y++)for(let x=cell.x;x<cell.x+cell.width;x++){
  if(rgba[(y*sheetWidth+x)*4+3]<threshold)continue;
  left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
 }
 // An empty cell remains a valid, transparent frame.
 return right<0?{...cell}:{x:left,y:top,width:right-left+1,height:bottom-top+1};
}

/** Locate low-occupancy separators near the nominal grid, ignoring translucent effects. */
function portraitValleyBoundaries(projection:Uint32Array,count:number):number[] {
 const length=projection.length,boundaries=[0];
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

/** Shared row valleys, then each row's column valleys preserve complete identities. */
export function customerPortraitMeasuredBounds(rgba:ArrayLike<number>,width:number,height:number):PortraitBounds[] {
 const yProjection=new Uint32Array(height);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(rgba[(y*width+x)*4+3]>=160)yProjection[y]++;
 const rows=portraitValleyBoundaries(yProjection,6),result:PortraitBounds[]=[];
 for(let row=0;row<6;row++){
  const top=rows[row],bottom=rows[row+1],xProjection=new Uint32Array(width);
  for(let y=top;y<bottom;y++)for(let x=0;x<width;x++)if(rgba[(y*width+x)*4+3]>=160)xProjection[x]++;
  const columns=portraitValleyBoundaries(xProjection,5);
  for(let col=0;col<5;col++)result.push(customerPortraitAlphaBounds(rgba,width,{x:columns[col],y:top,width:columns[col+1]-columns[col],height:bottom-top}));
 }
 return result;
}

/** Uniform scale; the entire image rectangle fits inside the circular avatar opening. */
export function customerPortraitFit(width:number,height:number,diameter=40):{width:number;height:number} {
 const scale=diameter/Math.hypot(width,height);
 return {width:width*scale,height:height*scale};
}
export function preloadCustomerPortraits(scene:Phaser.Scene):void{for(const a of CUSTOMER_PORTRAIT_MANIFEST)if(!scene.textures.exists(a.key))scene.load.image(a.key,`${import.meta.env.BASE_URL}${a.url}`);}
export function registerCustomerPortraitFrames(scene:Phaser.Scene):void{
 for(let sheet=0;sheet<5;sheet++){
  const key=CUSTOMER_PORTRAIT_MANIFEST[sheet].key;if(!scene.textures.exists(key))continue;
  const texture=scene.textures.get(key);
  if(texture.has(`customer-${sheet*30}`))continue;
  const source=texture.getSourceImage() as HTMLImageElement|HTMLCanvasElement;
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const context=canvas.getContext('2d',{willReadFrequently:true});
  if(!context)throw new Error('Cannot register customer portrait frames without a 2D canvas');
  context.drawImage(source,0,0);
  const rgba=context.getImageData(0,0,canvas.width,canvas.height).data;
  const measured=customerPortraitMeasuredBounds(rgba,canvas.width,canvas.height);
  for(let index=0;index<30;index++){
   const frame=`customer-${sheet*30+index}`;
   const bounds=measured[index];
   if(!texture.has(frame))texture.add(frame,0,bounds.x,bounds.y,bounds.width,bounds.height);
  }
 }
}
export function customerPortraitFrame(index:number):{key:string;frame:string}{const id=((Math.trunc(index)%150)+150)%150;return {key:`customer-sheet-${Math.floor(id/30)+1}`,frame:`customer-${id}`};}
