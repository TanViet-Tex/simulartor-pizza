import {describe,it,expect} from 'vitest';
import {CozyRuntime} from './CozyRuntime';
import {validateCozyCheckpoint} from '../domain/CozyCheckpoint';
function fresh(){const r=new CozyRuntime(false,true);expect(r.beginInteractiveTutorial()).toBe(true);return r;}
function practice(r:CozyRuntime){for(let i=0;i<3;i++)expect(r.nextTutorial()).toBe(true);for(const ingredient of ['dough','sauce','cheese'] as const)expect(r.dispatch({type:'ingredient',ingredient})).toBe(true);expect(r.dispatch({type:'bake'})).toBe(true);r.advanceElapsed(8000);for(const type of ['extract','box','deliver'] as const)expect(r.dispatch({type})).toBe(true);}
describe('interactive tutorial uses existing isolated practice',()=>{
  it('requires recognition first, accepts only successful practice commands and stops the oven before burning',()=>{
    const r=fresh();expect(r.dispatch({type:'ingredient',ingredient:'dough'})).toBe(false);expect(r.tutorialProgress?.index).toBe(0);
    for(let i=0;i<3;i++)r.nextTutorial();expect(r.dispatch({type:'ingredient',ingredient:'cheese'})).toBe(false);expect(r.tutorialProgress?.index).toBe(3);
    for(const ingredient of ['dough','sauce','cheese'] as const)r.dispatch({type:'ingredient',ingredient});expect(r.dispatch({type:'extract'})).toBe(false);r.dispatch({type:'bake'});r.advanceElapsed(60000);
    expect(r.tutorialProgress?.index).toBe(8);expect(r.state.ovenSeconds).toBe(6);expect(r.state.stage).toBe('baking');expect(r.completedReports).toEqual([]);expect(r.stockLots).toEqual([]);
  });
  it('round trips every practice step without touching commercial economics',()=>{
    const r=fresh();for(let i=0;i<3;i++)r.nextTutorial();
    const check=()=>{const cp=r.exportCheckpoint(), restored=CozyRuntime.restoreCheckpoint(cp)!;expect(restored.tutorialProgress).toEqual(r.tutorialProgress);expect(restored.state).toEqual(r.state);expect(cp.stock.cash).toBe(300);expect(cp.stock.lots).toEqual([]);expect(cp.reports).toEqual([]);};
    check();for(const ingredient of ['dough','sauce','cheese'] as const){r.dispatch({type:'ingredient',ingredient});check();}r.dispatch({type:'bake'});check();r.advanceElapsed(6000);check();for(const type of ['extract','box','deliver'] as const){r.dispatch({type});check();}
  });
  it('guides management with its own lease then leaves real day one untouched',()=>{
    const r=fresh();practice(r);expect(r.tutorialProgress?.index).toBe(11);r.nextTutorial();expect(r.tutorialPhase).toBe('management');expect(r.productionActive).toBe(true);expect(r.pauses).toContain('tutorial-management');expect(r.buy('dough',1)).toBe(false);
    while(r.tutorialPhase==='management')expect(r.nextTutorial()).toBe(true);
    expect(r.tutorialProgress?.status).toBe('completed');expect(r.pauses).toEqual([]);expect(r.stockLots).toEqual([]);expect(r.state.cash).toBe(300);expect(r.progression.xp).toBe(0);expect(r.daySummary).toBeNull();expect(r.shopOpen).toBe(false);
    const restored=CozyRuntime.restoreCheckpoint(r.exportCheckpoint())!;expect(restored.tutorialPhase).toBeNull();expect(restored.postTutorialPreparation).toBe(true);
  });
  it.each([0,7,12])('skip at index %i clears only owned tutorial pauses',index=>{
    const r=fresh(),cp=r.exportCheckpoint();cp.tutorialProgress={version:1,index,status:'active'};const resumed=CozyRuntime.restoreCheckpoint(cp)!;
    const a=resumed.acquirePause('user'),b=resumed.acquirePause('orientation'),c=resumed.acquirePause('tutorial');expect(resumed.skipTutorial()).toBe(true);
    expect(resumed.tutorialActive).toBe(false);expect(resumed.pauses).toEqual(expect.arrayContaining(['user','orientation','tutorial']));expect(resumed.pauses).not.toContain('tutorial-management');expect(resumed.state.ingredients).toEqual([]);expect(resumed.state.cash).toBe(300);a.release();b.release();c.release();expect(resumed.pauses).toEqual([]);expect(CozyRuntime.restoreCheckpoint(resumed.exportCheckpoint())!.postTutorialPreparation).toBe(true);
  });
  it('rejects forged progress and never starts the tutorial for legacy checkpoints',()=>{
    const cp=new CozyRuntime(false,true).exportCheckpoint();expect(CozyRuntime.restoreCheckpoint(cp)!.tutorialProgress).toBeNull();cp.tutorialProgress={version:1,index:34,status:'active'};expect(validateCozyCheckpoint(cp)).toBeNull();cp.tutorialProgress={version:1,index:0,status:'completed'};expect(validateCozyCheckpoint(cp)).toBeNull();
  });
  it('standalone new campaign clears old tutorial completion before restarting recognition',()=>{
    const r=fresh();r.skipTutorial();expect(r.dispatch({type:'reset'})).toBe(true);expect(r.tutorialProgress).toBeNull();expect(r.beginInteractiveTutorial()).toBe(true);expect(r.tutorialProgress).toEqual({version:1,index:0,status:'active'});
  });
  it('rejects damaged active tutorial reports without throwing',()=>{
    const cp=fresh().exportCheckpoint();expect(validateCozyCheckpoint({...cp,reports:null})).toBeNull();expect(validateCozyCheckpoint({...cp,reports:undefined})).toBeNull();
  });
});
