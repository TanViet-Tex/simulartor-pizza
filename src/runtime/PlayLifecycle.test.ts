import {ORDER_TEST_SCHEDULE} from './cozyScheduleFixture';
import { describe, expect, it } from 'vitest';
import { CozyRuntime } from './CozyRuntime';
import { PlayLifecycle } from './PlayLifecycle';

describe('owned mobile interruptions',()=>{
  it('detects a real render interruption even when an engine clamps its delta',()=>{
    const runtime=new CozyRuntime(),lifecycle=new PlayLifecycle(runtime);
    lifecycle.frame(100,true);lifecycle.frame(351,true);
    expect(runtime.pauses).toEqual(['gap']);expect(lifecycle.needsContinue).toBe(true);
    lifecycle.continue();lifecycle.frame(10000,true);expect(runtime.pauses).toEqual([]);
    lifecycle.frame(20000,false);expect(runtime.pauses).toEqual([]);
  });
  it('releases only its own token even for the same pause reason',()=>{
    const runtime=new CozyRuntime();
    runtime.pause('visibility');
    const lease=runtime.acquirePause('visibility');
    runtime.resume('visibility');
    expect(runtime.pauses).toEqual(['visibility']);
    lease.release();lease.release();
    expect(runtime.pauses).toEqual([]);
  });
  it('requires explicit foreground Continue without blocking on viewport changes',()=>{
    const runtime=new CozyRuntime(),lifecycle=new PlayLifecycle(runtime);
    runtime.pause('user');
    lifecycle.setHidden(true);lifecycle.setHidden(true);
    lifecycle.viewportChanged();
    expect(lifecycle.continue()).toBe(false);
    lifecycle.setHidden(false);lifecycle.viewportChanged();
    expect(runtime.pauses).toEqual(['user','visibility']);
    expect(lifecycle.continue()).toBe(true);
    expect(runtime.pauses).toEqual(['user']);
  });
  it('cleanup is idempotent and leaves external leases intact',()=>{
    const runtime=new CozyRuntime(),external=runtime.acquirePause('orientation'),lifecycle=new PlayLifecycle(runtime);
    lifecycle.viewportChanged();lifecycle.setHidden(true);
    lifecycle.destroy();lifecycle.destroy();
    expect(runtime.pauses).toEqual(['orientation']);
    external.release();expect(runtime.pauses).toEqual([]);
  });
  it('keeps the shift running and resets frame timing when the viewport changes',()=>{
    const runtime=new CozyRuntime(),lifecycle=new PlayLifecycle(runtime);
    lifecycle.frame(100,true);lifecycle.viewportChanged();lifecycle.frame(10000,true);
    expect(runtime.pauses).toEqual([]);expect(lifecycle.needsContinue).toBe(false);
    lifecycle.frame(10050,true);expect(runtime.pauses).toEqual([]);
  });
  it('repeated hidden episodes retain one Continue lease and no elapsed catch-up',()=>{
    const runtime=new CozyRuntime();
    for(const ingredient of ['dough','sauce','cheese'] as const)runtime.dispatch({type:'ingredient',ingredient});
    runtime.dispatch({type:'bake'});
    const lifecycle=new PlayLifecycle(runtime);
    for(let i=0;i<3;i++){lifecycle.setHidden(true);runtime.advance(10000);lifecycle.setHidden(false);}
    expect(runtime.state.ovenSeconds).toBe(0);
    lifecycle.continue();runtime.advance(50);expect(runtime.state.ovenSeconds).toBe(.05);
  });
  it('pauses a long frame gap while tickets wait even with an empty oven',()=>{
    const runtime=new CozyRuntime(false,true,ORDER_TEST_SCHEDULE);
    for(const id of ['dough','sauce','cheese'] as const)runtime.buy(id,3);
    runtime.openShop();const remaining=runtime.tickets[0].remaining;
    runtime.advance(1000);runtime.advance(200);
    expect(runtime.pauses).toEqual(['gap']);expect(runtime.tickets[0].remaining).toBe(remaining);
    runtime.resume('gap');runtime.advance(50);
    expect(runtime.tickets[0].remaining).toBeCloseTo(remaining-.05);
  });
});
