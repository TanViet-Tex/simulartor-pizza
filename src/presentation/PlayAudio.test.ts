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

function mediaFixture(){
  const streams=new Map<string,{src:string;loop:boolean;volume:number;currentTime:number;preload:string;muted:boolean;paused:boolean;onended:(()=>void)|null;play:ReturnType<typeof vi.fn>;pause:ReturnType<typeof vi.fn>;removeAttribute:ReturnType<typeof vi.fn>;load:ReturnType<typeof vi.fn>}>();
  const events:string[]=[];
  const createMedia=vi.fn((url:string)=>{
    const name=decodeURIComponent(url.split('/').pop()!);
    const media={src:url,loop:false,volume:1,currentTime:0,preload:'',muted:false,paused:true,onended:null as (()=>void)|null,play:vi.fn(async()=>{media.paused=false;events.push(`play:${name}`);}),pause:vi.fn(()=>{media.paused=true;events.push(`pause:${name}`);}),removeAttribute:vi.fn(()=>{media.src='';}),load:vi.fn()};
    streams.set(name,media);return media as unknown as HTMLAudioElement;
  });
  const context=fixture().context;
  return {audio:new PlayAudio(()=>context as unknown as AudioContext,createMedia),streams,createMedia,events};
}
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
// Most behavior tests count audible playback; separate tests inspect silent priming.
async function unlock(f:ReturnType<typeof mediaFixture>){
  const first=f.streams.size===0;
  await f.audio.interact();await flush();
  if(first)for(const [name,media] of f.streams)if(name!=='nhạc nèn bán pizza 2.mp3'){media.play.mockClear();media.pause.mockClear();}
}
describe('file audio playback',()=>{
  it('unlocks all seven voices during the gesture with a silent source and restores idle asset URLs',async()=>{
    const f=mediaFixture(),plays:{src:string;volume:number;muted:boolean}[]=[];
    const create=f.createMedia.getMockImplementation()!;
    f.createMedia.mockImplementation(url=>{const media=create(url);const play=media.play.bind(media);media.play=()=>{plays.push({src:media.src,volume:media.volume,muted:media.muted});return play();};return media;});
    const interaction=f.audio.interact();expect(f.createMedia).toHaveBeenCalledTimes(7);expect(plays).toHaveLength(7);
    expect(plays.filter(play=>play.src.startsWith('data:audio/wav'))).toHaveLength(6);
    for(const play of plays.filter(play=>play.src.startsWith('data:')))expect(play).toMatchObject({muted:true,volume:0});
    await interaction;await flush();
    for(const [name,media] of f.streams){expect(media.src).toContain(encodeURIComponent(name));expect(media.preload).toBe('metadata');expect(media.muted).toBe(false);expect(media.volume).toBe(1);expect(media.paused).toBe(name!=='nhạc nèn bán pizza 2.mp3');}
  });
  it('recovers music and oven after native audio interruption on the next gesture',async()=>{
    const f=mediaFixture();await unlock(f);f.audio.syncOven(true,false);await flush();
    const oven=f.streams.get('lò nướng.mp3')!,music=f.streams.get('nhạc nèn bán pizza 2.mp3')!;
    (oven.pause as ()=>void)();(music.pause as ()=>void)();oven.currentTime=2.3;music.currentTime=14;
    await f.audio.interact();await flush();expect(oven.play).toHaveBeenCalledTimes(2);expect(music.play).toHaveBeenCalledTimes(2);
    expect(oven.currentTime).toBe(2.3);expect(music.currentTime).toBe(14);
  });
  it('keeps an event requested during priming and never restores disposed primer assets',async()=>{
    const f=mediaFixture(),complete=new Map<string,()=>void>();
    const create=f.createMedia.getMockImplementation()!;
    f.createMedia.mockImplementation(url=>{const media=create(url);const name=decodeURIComponent(url.split('/').pop()!);(media.play as ReturnType<typeof vi.fn>).mockImplementationOnce(()=>new Promise<void>(resolve=>{complete.set(name,resolve);}));return media;});
    const interaction=f.audio.interact();const arrival=f.streams.get('tiếng khách đến.wav')!;
    f.audio.effect('arrival');arrival.onended?.();expect(arrival.play).toHaveBeenCalledOnce();
    complete.get('tiếng khách đến.wav')!();await flush();expect(arrival.play).toHaveBeenCalledTimes(2);expect(arrival.paused).toBe(false);expect(arrival.src).toContain(encodeURIComponent('tiếng khách đến.wav'));
    f.audio.destroy();for(const finish of complete.values())finish();await interaction;await flush();
    for(const media of f.streams.values()){expect(media.src).toBe('');expect(media.paused).toBe(true);expect(media.load).toHaveBeenCalledOnce();}
  });
  it('queues the first settings effect until the click handler unlocks audio',async()=>{
    const f=mediaFixture();f.audio.effect('settings');expect(f.createMedia).not.toHaveBeenCalled();
    await f.audio.interact();expect(f.streams.get('cài đặt.mp3')!.play).toHaveBeenCalledOnce();
    await unlock(f);expect(f.streams.get('cài đặt.mp3')!.play).toHaveBeenCalledOnce();
  });
  it('does not replay an arrival that occurred before the first interaction',async()=>{
    const f=mediaFixture();f.audio.effect('arrival');await unlock(f);expect(f.streams.get('tiếng khách đến.wav')!.play).not.toHaveBeenCalled();
    f.audio.effect('arrival');await flush();expect(f.streams.get('tiếng khách đến.wav')!.play).toHaveBeenCalledOnce();
  });
  it('creates no media before a gesture and defaults to music 2 even while effects are muted',async()=>{
    const f=mediaFixture();f.audio.syncOven(true,false);f.audio.effect('sauce');expect(f.createMedia).not.toHaveBeenCalled();
    f.audio.toggleMute();await unlock(f);
    const music=f.streams.get('nhạc nèn bán pizza 2.mp3')!;
    expect(music.loop).toBe(true);expect(music.play).toHaveBeenCalledOnce();
    expect(f.streams.get('lò nướng.mp3')!.play).not.toHaveBeenCalled();
    expect(f.createMedia.mock.calls.some(([url])=>url.includes(encodeURIComponent('nhạc nèn bán pizza 2.mp3')))).toBe(true);
  });
  it('uses one oven loop through repeated frames, pauses, resumes, resets at real completion and follows effects volume',async()=>{
    const f=mediaFixture();await unlock(f);f.audio.syncOven(true,false);await flush();
    const oven=f.streams.get('lò nướng.mp3')!;oven.currentTime=1.7;
    for(let i=0;i<10;i++)f.audio.syncOven(true,false);
    expect(oven.play).toHaveBeenCalledOnce();expect(oven.loop).toBe(true);
    f.audio.syncOven(true,true);expect(oven.currentTime).toBe(1.7);expect(oven.pause).toHaveBeenCalledOnce();
    f.audio.syncOven(true,false);await flush();expect(oven.play).toHaveBeenCalledTimes(2);expect(oven.currentTime).toBe(1.7);
    f.audio.setEffectsVolume(.35);expect(oven.volume).toBe(.35);
    f.audio.toggleMute();expect(oven.volume).toBe(0);expect(oven.currentTime).toBe(1.7);
    f.audio.toggleMute();await flush();expect(oven.volume).toBe(.35);expect(oven.play).toHaveBeenCalledTimes(3);
    f.audio.syncOven(false,false);expect(oven.currentTime).toBe(0);
    f.audio.syncOven(false,false);expect(oven.play).toHaveBeenCalledTimes(3);
  });
  it('stops a late play completion after pause or disposal without overlapping retries',async()=>{
    const f=mediaFixture();await unlock(f);f.audio.syncOven(true,true);
    const oven=f.streams.get('lò nướng.mp3')!;
    let complete!:()=>void;oven.play.mockImplementation(()=>new Promise<void>(resolve=>{complete=resolve;}));
    f.audio.syncOven(true,false);f.audio.syncOven(true,false);expect(oven.play).toHaveBeenCalledOnce();
    f.audio.syncOven(true,true);complete();await flush();expect(oven.pause).toHaveBeenCalledTimes(2);expect(oven.play).toHaveBeenCalledOnce();
    f.audio.syncOven(true,false);f.audio.destroy();complete();await flush();
    expect(oven.play).toHaveBeenCalledTimes(2);expect(oven.currentTime).toBe(0);expect(oven.removeAttribute).toHaveBeenCalledWith('src');expect(oven.load).toHaveBeenCalledOnce();
  });
  it('plays four effects once per call, silence stops effects and pauses the oven without stopping music',async()=>{
    const f=mediaFixture();await unlock(f);f.audio.setEffectsVolume(.4);
    for(const effect of ['settings','sauce','box','arrival'] as const)f.audio.effect(effect);
    f.audio.syncOven(true,false);await flush();
    for(const name of ['cài đặt.mp3','sốt.mp3','đóng hộp pizza.wav','tiếng khách đến.wav']){const media=f.streams.get(name)!;expect(media.play).toHaveBeenCalledOnce();expect(media.loop).toBe(false);expect(media.volume).toBe(.4);}
    const oven=f.streams.get('lò nướng.mp3')!;oven.currentTime=2;f.audio.silence();expect(oven.currentTime).toBe(2);
    expect(f.streams.get('nhạc nèn bán pizza 2.mp3')!.pause).not.toHaveBeenCalled();
    f.audio.syncOven(true,false);await flush();expect(oven.play).toHaveBeenCalledTimes(2);
    f.audio.toggleMute();f.audio.effect('sauce');expect(f.streams.get('sốt.mp3')!.play).toHaveBeenCalledOnce();
  });
  it('switches tracks only after stopping the old one, keeps Music independent and retains position on toggle',async()=>{
    const f=mediaFixture();await unlock(f);f.events.length=0;f.audio.changeMusic();await flush();
    expect(f.events).toEqual(['pause:nhạc nèn bán pizza 2.mp3','play:nhac nền bán pizza.mp3']);
    const music=f.streams.get('nhac nền bán pizza.mp3')!;music.currentTime=10;
    f.audio.toggleMute();expect(music.pause).not.toHaveBeenCalled();f.audio.toggleMusic();expect(music.currentTime).toBe(10);
    f.audio.toggleMusic();await flush();expect(music.play).toHaveBeenCalledTimes(2);expect(music.currentTime).toBe(10);
    f.audio.changeMusic();await flush();expect(music.currentTime).toBe(0);expect(f.streams.get('nhạc nèn bán pizza 2.mp3')!.play).toHaveBeenCalledTimes(2);
  });
  it('contains blocked playback and retries only after a new gesture, not every oven sync',async()=>{
    const f=mediaFixture();await unlock(f);f.audio.syncOven(true,true);
    const oven=f.streams.get('lò nướng.mp3')!;oven.play.mockRejectedValue(Error('blocked'));
    f.audio.syncOven(true,false);await flush();for(let i=0;i<10;i++)f.audio.syncOven(true,false);
    expect(oven.play).toHaveBeenCalledOnce();oven.play.mockResolvedValue(undefined);await unlock(f);expect(oven.play).toHaveBeenCalledTimes(2);
  });
  it('reconciles a pending oven play after pause/resume even if the obsolete attempt rejects',async()=>{
    const f=mediaFixture();await unlock(f);f.audio.syncOven(true,true);
    const oven=f.streams.get('lò nướng.mp3')!;
    let reject!:()=>void;oven.play.mockImplementationOnce(()=>new Promise<void>((_,fail)=>{reject=()=>fail(Error('interrupted'));}));
    f.audio.syncOven(true,false);f.audio.syncOven(true,true);f.audio.syncOven(true,false);
    expect(oven.play).toHaveBeenCalledOnce();reject();await flush();expect(oven.play).toHaveBeenCalledTimes(2);
    f.audio.destroy();
  });
});
