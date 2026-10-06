import {describe,it,expect,vi} from 'vitest';
import {HubListScroll} from './HubListScroll';

describe('HubListScroll',()=>{
  it('accumulates wheel deltas before one frame paint and clamps both ends',()=>{
    const paint=vi.fn(),scroll=new HubListScroll(10,100,paint,()=>true);
    scroll.wheel(20);scroll.wheel(30);expect(scroll.offset).toBe(60);expect(paint).not.toHaveBeenCalled();
    scroll.flush();expect(paint).toHaveBeenCalledExactlyOnceWith(60);
    scroll.wheel(1000);scroll.flush();expect(scroll.offset).toBe(100);
    scroll.wheel(-1000);scroll.flush();expect(scroll.offset).toBe(0);
  });
  it('keeps taps below threshold and permanently rejects a drag even if it returns',()=>{
    const scroll=new HubListScroll(30,100,()=>{},()=>true);
    scroll.down(5,50,1);scroll.move(5,45,1);expect(scroll.canTap(1)).toBe(true);expect(scroll.offset).toBe(30);
    scroll.move(5,30,2);expect(scroll.offset).toBe(30);
    scroll.move(5,30,1);expect(scroll.offset).toBe(50);expect(scroll.canTap(1)).toBe(false);
    scroll.move(5,50,1);expect(scroll.canTap(1)).toBe(false);
    scroll.cancel();expect(scroll.canTap(1)).toBe(false);
  });
  it('blocks paused input, discards pending work and requires a fresh gesture',()=>{
    let allowed=true;const paint=vi.fn(),scroll=new HubListScroll(0,100,paint,()=>allowed);
    scroll.down(0,50,1);scroll.move(0,30,1);allowed=false;scroll.flush();expect(paint).not.toHaveBeenCalled();
    scroll.wheel(40);allowed=true;scroll.move(0,10,1);expect(scroll.offset).toBe(20);expect(scroll.canTap(1)).toBe(false);
    scroll.down(0,30,1);expect(scroll.canTap(1)).toBe(true);scroll.destroy();scroll.flush();expect(paint).not.toHaveBeenCalled();
  });
  it('short content never scrolls or schedules uploads',()=>{
    const paint=vi.fn(),scroll=new HubListScroll(90,0,paint,()=>true);
    scroll.wheel(30);scroll.down(0,90,1);scroll.move(0,0,1);scroll.flush();expect(scroll.offset).toBe(0);expect(paint).not.toHaveBeenCalled();expect(scroll.canTap(1)).toBe(false);
  });
});
