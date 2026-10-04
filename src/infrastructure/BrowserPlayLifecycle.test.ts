import {afterEach,expect,it,vi} from 'vitest';
import {BrowserPlayLifecycle} from './BrowserPlayLifecycle';
import {PlayLifecycle} from '../runtime/PlayLifecycle';
import {CozyRuntime} from '../runtime/CozyRuntime';
afterEach(()=>vi.unstubAllGlobals());
function setup(){const document=Object.assign(new EventTarget(),{hidden:false}),window=new EventTarget();vi.stubGlobal('document',document);vi.stubGlobal('window',window);const runtime=new CozyRuntime(false,true);runtime.openShop();let now=0;const lifecycle=new PlayLifecycle(runtime,()=>now),changed=vi.fn(),adapter=new BrowserPlayLifecycle(lifecycle,changed);return {document,window,runtime,lifecycle,changed,adapter,time:(value:number)=>{now=value;}};}
it('hide/show, blur/focus, pagehide/pageshow and resize reconcile once without automatic pause',()=>{
 const {document,window,runtime,lifecycle,adapter,time}=setup();time(1000);document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('blur'));
 expect(runtime.shiftClock.elapsed).toBe(1);time(2000);window.dispatchEvent(new Event('pagehide'));time(3000);window.dispatchEvent(new Event('pageshow'));window.dispatchEvent(new Event('focus'));document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('resize'));lifecycle.frame(3000,true);
 expect(runtime.shiftClock.elapsed).toBe(3);expect(runtime.pauses).toEqual([]);expect(lifecycle.needsContinue).toBe(false);adapter.destroy();
});
it('preserves manual/modal owners and excludes background time while paused',()=>{
 const {document,window,runtime,adapter,time}=setup();time(1000);const manual=runtime.acquirePause('user'),modal=runtime.acquirePause('order');time(10000);window.dispatchEvent(new Event('blur'));document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));manual.release();expect(runtime.pauses).toEqual(['order']);
 time(20000);modal.release();time(21000);window.dispatchEvent(new Event('focus'));expect(runtime.shiftClock.elapsed).toBe(2);adapter.destroy();
});
it('detaches listeners without destroying a shared session clock and supports a replacement scene',()=>{
 const {document,window,runtime,lifecycle,adapter,time,changed}=setup();time(1000);window.dispatchEvent(new Event('blur'));adapter.destroy(false);const calls=changed.mock.calls.length;
 time(2000);window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));expect(changed).toHaveBeenCalledTimes(calls);
 const replacement=new BrowserPlayLifecycle(lifecycle,()=>{});expect(runtime.shiftClock.elapsed).toBe(2);time(3000);window.dispatchEvent(new Event('resize'));expect(runtime.shiftClock.elapsed).toBe(3);replacement.destroy();replacement.destroy();
 time(4000);window.dispatchEvent(new Event('blur'));lifecycle.frame(4000,true);expect(runtime.shiftClock.elapsed).toBe(3);
});
