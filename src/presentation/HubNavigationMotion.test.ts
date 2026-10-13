import {describe,expect,it} from 'vitest';
import {HubNavigationMotion,HUB_NAVIGATION_TABS} from './HubNavigationMotion';

describe('HubNavigationMotion',()=>{
  it('starts selected without animation and settles selection independently of the press',()=>{
    const motion=new HubNavigationMotion();
    expect(motion.sample(0,false)).toMatchObject({active:'summary',animating:false,tabs:{summary:{amount:1,scale:1},market:{amount:0,scale:1}}});
    motion.select('market',100,false);
    expect(motion.sample(100,false).tabs.market).toEqual({amount:0,scale:1});
    expect(motion.sample(160,false).tabs.market.scale).toBeCloseTo(.96);
    const middle=motion.sample(175,false);
    expect(middle.tabs.market.amount).toBeCloseTo(.5);expect(middle.tabs.summary.amount).toBeCloseTo(.5);
    expect(motion.sample(220,false).tabs.market.scale).toBe(1);
    expect(motion.sample(220,false).animating).toBe(true);
    expect(motion.sample(250,false)).toMatchObject({animating:false,tabs:{summary:{amount:0},market:{amount:1,scale:1}}});
    expect(motion.sample(5000,false).tabs.market.amount).toBe(1);
  });

  it('presses the active tab without restarting its persistent selection',()=>{
    const motion=new HubNavigationMotion();motion.select('summary',10,false);
    expect(motion.sample(70,false).tabs.summary).toEqual({amount:1,scale:.96});
    expect(motion.sample(130,false)).toMatchObject({animating:false,tabs:{summary:{amount:1,scale:1}}});
  });

  it('starts rapid selection from the currently displayed blend and returns the old press to rest',()=>{
    const motion=new HubNavigationMotion();motion.select('market',0,false);
    const before=motion.sample(75,false);motion.select('stock',75,false);
    const after=motion.sample(75,false);
    expect(after.tabs.market.amount).toBe(before.tabs.market.amount);
    expect(after.tabs.summary.amount).toBe(before.tabs.summary.amount);
    expect(after.tabs.market.scale).toBe(1);
    expect(motion.sample(135,false).tabs.stock.scale).toBeCloseTo(.96);
    const settled=motion.sample(225,false);expect(settled.animating).toBe(false);
    for(const id of HUB_NAVIGATION_TABS)expect(settled.tabs[id]).toEqual({amount:id==='stock'?1:0,scale:1});
  });

  it('reduced motion commits immediately and switching it on finishes both in-flight effects',()=>{
    const motion=new HubNavigationMotion();motion.select('missions',0,true);
    expect(motion.sample(0,true)).toMatchObject({active:'missions',animating:false,tabs:{missions:{amount:1,scale:1}}});
    motion.select('shop',100,false);expect(motion.sample(130,false).animating).toBe(true);
    const finished=motion.sample(130,true);expect(finished.animating).toBe(false);
    for(const id of HUB_NAVIGATION_TABS)expect(finished.tabs[id]).toEqual({amount:id==='shop'?1:0,scale:1});
    expect(motion.sample(160,false)).toEqual(finished);
  });

  it('keeps a continuing fade when its destination is pressed again',()=>{
    const motion=new HubNavigationMotion();motion.select('market',0,false);motion.select('market',75,false);
    expect(motion.sample(150,false)).toMatchObject({animating:true,tabs:{market:{amount:1}}});
    expect(motion.sample(195,false).animating).toBe(false);
  });
});
