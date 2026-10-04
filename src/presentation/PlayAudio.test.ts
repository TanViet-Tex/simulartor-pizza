import { describe, expect, it, vi } from 'vitest';
import { PlayAudio } from './PlayAudio';

function fixture(reject=false){
  const gain={gain:{value:0},connect:vi.fn(),disconnect:vi.fn()};
  const oscillator={type:'sine',frequency:{value:0},connect:vi.fn(),start:vi.fn(),stop:vi.fn(),disconnect:vi.fn(),onended:null as (()=>void)|null};
  const context={state:'suspended',currentTime:1,destination:{},resume:vi.fn(async()=>{if(reject)throw Error('locked');context.state='running';}),close:vi.fn(async()=>{}),createGain:()=>gain,createOscillator:()=>oscillator};
  const create=vi.fn(()=>context);
  return {audio:new PlayAudio(create as never),create,context,oscillator,gain};
}
describe('mobile audio policy',()=>{
  it('effects volume changes real gain, clamps input and respects mute',async()=>{
    const f=fixture();await f.audio.interact();f.audio.setEffectsVolume(.4);f.audio.cue();
    expect(f.gain.gain.value).toBeCloseTo(.01);f.audio.setEffectsVolume(-1);expect(f.audio.effectsVolume).toBe(0);expect(f.gain.gain.value).toBe(0);
    f.audio.setEffectsVolume(2);expect(f.audio.effectsVolume).toBe(1);f.audio.toggleMute();f.audio.setEffectsVolume(.5);expect(f.gain.gain.value).toBe(0);
    f.audio.setEffectsVolume(NaN);expect(f.audio.effectsVolume).toBe(.5);f.audio.toggleMute();f.audio.cue();expect(f.gain.gain.value).toBeCloseTo(.0125);
  });
  it('never creates audio on boot or from a non-gesture cue',async()=>{
    const f=fixture();f.audio.cue();expect(f.create).not.toHaveBeenCalled();
    await f.audio.interact();expect(f.create).toHaveBeenCalledOnce();expect(f.audio.status).toBe('running');
    f.audio.cue();expect(f.oscillator.start).toHaveBeenCalledOnce();
  });
  it('mute stops pending sound and a gesture unmutes without losing visual state',async()=>{
    const f=fixture();await f.audio.interact();f.audio.cue();
    f.audio.toggleMute();expect(f.audio.muted).toBe(true);expect(f.gain.gain.value).toBe(0);
    f.audio.cue();expect(f.oscillator.start).toHaveBeenCalledOnce();
    f.audio.toggleMute();await f.audio.interact();expect(f.audio.muted).toBe(false);
  });
  it('handles blocked/unavailable audio and ignores stale resume after disposal',async()=>{
    const f=fixture(true);await f.audio.interact();expect(f.audio.status).toBe('locked');
    f.audio.destroy();f.audio.destroy();await f.audio.interact();expect(f.context.close).toHaveBeenCalledOnce();
    const absent=new PlayAudio(()=>{throw Error('unavailable');});await absent.interact();expect(absent.status).toBe('unavailable');
  });
});
