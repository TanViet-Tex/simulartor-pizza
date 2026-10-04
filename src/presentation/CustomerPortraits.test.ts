import {describe,expect,it,vi} from 'vitest';
import type Phaser from 'phaser';
import {CUSTOMER_PORTRAIT_MANIFEST,customerPortraitAlphaBounds,customerPortraitMeasuredBounds,customerPortraitFit,customerPortraitFrame,customerPortraitGridBounds,registerCustomerPortraitFrames} from './CustomerPortraits';

describe('customer portrait framing',()=>{
 it.each([[1024,1536],[1536,1024],[1027,1539]])('tiles all 30 cells of %i × %i without gaps or overruns',(width,height)=>{
  const cells=Array.from({length:30},(_,i)=>customerPortraitGridBounds(width,height,i));
  expect(cells.reduce((area,cell)=>area+cell.width*cell.height,0)).toBe(width*height);
  cells.forEach((cell,index)=>{
   expect(cell.x+cell.width).toBeLessThanOrEqual(width);expect(cell.y+cell.height).toBeLessThanOrEqual(height);
   if(index%5<4)expect(cell.x+cell.width).toBe(cells[index+1].x);
   if(index<25)expect(cell.y+cell.height).toBe(cells[index+5].y);
  });
  expect(cells[29].x+cells[29].width).toBe(width);expect(cells[29].y+cells[29].height).toBe(height);
 });
 it('centers offset opaque content while ignoring fringe and adjacent customers',()=>{
  const rgba=new Uint8ClampedArray(20*24*4);
  const paint=(x:number,y:number,alpha:number)=>{rgba[(y*20+x)*4+3]=alpha;};
  paint(3,0,255);paint(7,2,32);paint(6,1,255);paint(5,0,31);paint(19,23,255);
  expect(customerPortraitAlphaBounds(rgba,20,customerPortraitGridBounds(20,24,1))).toEqual({x:6,y:1,width:2,height:2});
  const empty=customerPortraitGridBounds(20,24,2);
  expect(customerPortraitAlphaBounds(rgba,20,empty)).toEqual(empty);
 });
 it.each([[300,500],[500,300],[240,240]])('preserves %i × %i aspect ratio and fits all corners within the circular opening',(width,height)=>{
  const fit=customerPortraitFit(width,height);
  expect(fit.width/fit.height).toBeCloseTo(width/height);
  expect(Math.hypot(fit.width/2,fit.height/2)).toBeCloseTo(20);
 });
 it('finds a row valley beyond crossing feet despite translucent effects linking adjacent bodies',()=>{
  const rgba=new Uint8ClampedArray(100*120*4);
  const rect=(x:number,y:number,width:number,height:number,alpha=255)=>{for(let row=y;row<y+height;row++)for(let col=x;col<x+width;col++)rgba[(row*100+col)*4+3]=alpha;};
  rect(3,4,13,18); // body extends two pixels below the nominal first row
  rect(3,29,13,11); // next customer remains separate
  rect(18,8,2,2); // detached accessory belonging to the upper customer
  rect(3,22,13,7,120); // effect links both bodies but is not a row landmark
  rect(0,0,2,2,31); // faint extraction fringe must not extend bounds
  const bounds=customerPortraitMeasuredBounds(rgba,100,120);
  expect(bounds[0]).toEqual({x:3,y:4,width:17,height:19});
  expect(bounds[5]).toEqual({x:3,y:23,width:13,height:17});
  expect(bounds[5].y).toBe(bounds[0].y+bounds[0].height);
  expect(bounds).toHaveLength(30);
 });
 it('retains all 150 stable identities and their row-major sheet mapping',()=>{
  const frames=Array.from({length:150},(_,i)=>customerPortraitFrame(i));
  expect(new Set(frames.map(f=>f.frame)).size).toBe(150);
  frames.forEach((frame,i)=>expect(frame).toEqual({key:`customer-sheet-${Math.floor(i/30)+1}`,frame:`customer-${i}`}));
  expect(customerPortraitFrame(-1)).toEqual(frames[149]);expect(customerPortraitFrame(150)).toEqual(frames[0]);
  expect(CUSTOMER_PORTRAIT_MANIFEST.map(asset=>asset.url)).toEqual(Array.from({length:5},(_,i)=>`assets/customer-portraits/sheet-${i+1}.png`));
 });
 it('moves the column separator past a wing crossing the nominal edge without borrowing its neighbor',()=>{
  const rgba=new Uint8ClampedArray(100*120*4);
  const rect=(x:number,y:number,width:number,height:number)=>{for(let row=y;row<y+height;row++)for(let col=x;col<x+width;col++)rgba[(row*100+col)*4+3]=255;};
  rect(3,3,19,13);rect(29,3,11,13);
  const bounds=customerPortraitMeasuredBounds(rgba,100,120);
  expect(bounds[0]).toEqual({x:3,y:3,width:19,height:13});
  expect(bounds[1]).toEqual({x:29,y:3,width:11,height:13});
 });
 it('reads alpha once per texture registration and reuses existing frames',()=>{
  const rgba=new Uint8ClampedArray(100*120*4);
  for(let y=2;y<16;y++)for(let x=1;x<16;x++)rgba[(y*100+x)*4+3]=255;
  const getImageData=vi.fn(()=>({data:rgba})),drawImage=vi.fn();
  const frames=new Map<string,{x:number;y:number;width:number;height:number}>();
  const texture={has:(name:string)=>frames.has(name),getSourceImage:()=>({width:100,height:120}),add:(name:string,_source:number,x:number,y:number,width:number,height:number)=>frames.set(name,{x,y,width,height})};
  vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>({getImageData,drawImage})})});
  try{
   const scene={textures:{exists:(key:string)=>key==='customer-sheet-1',get:()=>texture}} as unknown as Phaser.Scene;
   registerCustomerPortraitFrames(scene);registerCustomerPortraitFrames(scene);
   expect(getImageData).toHaveBeenCalledTimes(1);expect(drawImage).toHaveBeenCalledTimes(1);
   expect(frames.size).toBe(30);expect(frames.get('customer-0')).toEqual({x:1,y:2,width:15,height:14});
  }finally{vi.unstubAllGlobals();}
 });
});
