import {describe,it,expect} from 'vitest';
import {testCodeViewportOffset as offset} from './TestCodeViewport';
const base={canvasTop:0,canvasHeight:640,visibleTop:0,visibleHeight:640,focused:true};
describe('test-code viewport translation',()=>{
  it('centers unchanged when keyboard is closed or input blurred',()=>{expect(offset(base)).toBe(0);expect(offset({...base,visibleHeight:360,focused:false})).toBe(0);});
  it('moves the whole frame up to fit and follows viewport scroll without accumulation',()=>{expect(offset({...base,visibleHeight:360})).toBe(-152);expect(offset({...base,visibleHeight:360,visibleTop:40})).toBe(-112);expect(offset(base)).toBe(0);});
  it('converts CSS to game coordinates and includes auto-pan canvas bounds',()=>{expect(offset({...base,canvasTop:20,canvasHeight:320,visibleHeight:250})).toBe(-64);expect(offset({...base,canvasTop:-40,visibleHeight:360})).toBe(-112);});
  it('fits an exact-height viewport, anchors a smaller one and handles invalid sizes',()=>{expect(offset({...base,visibleHeight:330})).toBe(-170);expect(offset({...base,visibleHeight:240})).toBe(-170);expect(offset({...base,canvasHeight:0})).toBe(0);});
});
