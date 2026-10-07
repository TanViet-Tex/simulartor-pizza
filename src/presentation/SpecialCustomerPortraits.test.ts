import {describe,expect,it} from 'vitest';
import type Phaser from 'phaser';
import {registerSpecialCustomerPortraitFrames,specialCustomerPortraitFit,specialCustomerPortraitFrame,specialCustomerPortraitMeasuredBounds} from './SpecialCustomerPortraits';

describe('special customer portrait frames',()=>{
 it('extracts all twenty full alpha rectangles across uneven row separators',()=>{
  const width=100,height=100,rgba=new Uint8ClampedArray(width*height*4);
  const tops=[2,28,53,77],bottoms=[24,49,74,98];
  for(let row=0;row<4;row++)for(let col=0;col<5;col++)for(let y=tops[row];y<bottoms[row];y++)for(let x=col*20+2;x<col*20+18;x++)rgba[(y*width+x)*4+3]=255;
  const bounds=specialCustomerPortraitMeasuredBounds(rgba,width,height);
  expect(bounds).toHaveLength(20);
  for(let row=0;row<4;row++)for(let col=0;col<5;col++)expect(bounds[row*5+col]).toEqual({x:col*20+2,y:tops[row],width:16,height:bottoms[row]-tops[row]});
 });
 it('fits the whole portrait rectangle inside a circular frame without cropping',()=>{
  const fit=specialCustomerPortraitFit(240,300,40);
  expect(Math.hypot(fit.width,fit.height)).toBeCloseTo(40);
  expect(fit.width/fit.height).toBeCloseTo(240/300);
 });
 it('normalizes indices and tolerates a missing or unreadable asset',()=>{
  expect(specialCustomerPortraitFrame(-1).frame).toBe('special-customer-19');
  expect(specialCustomerPortraitFrame(20).frame).toBe('special-customer-0');
  expect(specialCustomerPortraitFrame(NaN).frame).toBe('special-customer-0');
  expect(()=>registerSpecialCustomerPortraitFrames({textures:{exists:()=>false}} as unknown as Phaser.Scene)).not.toThrow();
  expect(()=>registerSpecialCustomerPortraitFrames({textures:{exists:()=>true,get:()=>({has:()=>false,getSourceImage:()=>{throw new Error('decode failed');}})}} as unknown as Phaser.Scene)).not.toThrow();
 });
});
