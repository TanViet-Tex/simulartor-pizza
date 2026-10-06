export type AudioEffect='settings'|'sauce'|'box'|'arrival'|'payment';
const files={oven:'oven-baking.wav',settings:'cài đặt.mp3',sauce:'sốt.mp3',box:'đóng hộp pizza.wav',arrival:'tiếng khách đến.wav',payment:'thanh toán.mp3',music1:'nhac nền bán pizza.mp3',music2:'nhạc nèn bán pizza 2.mp3'} as const;
const silentVoice='data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQIAAAAAAA==';
const MUSIC_VOLUME=.15;
// The oven's useful 0–6s range is unusually quiet in the supplied recording.
const OVEN_GAIN=6;
// Decoded asset onset: the first audible transient follows 390ms of near silence.
const SETTINGS_ONSET=.39;
type Sound=keyof typeof files;
interface Stream {media:HTMLAudioElement;url:string;wanted:boolean;playing:boolean;pending:boolean;blocked:boolean;revision:number;reset:boolean;primed:boolean;priming:boolean;startOffset:number;source?:MediaElementAudioSourceNode;gain?:GainNode;}

/** Audio is presentation-only. Media creation and playback unlock follow an input gesture. */
export class PlayAudio {
  private context?:AudioContext;
  private gains=new Set<GainNode>();
  private disposed=false;
  private failed=false;
  muted=false;
  private volume=1;
  private unlocked=false;
  private streams=new Map<Sound,Stream>();
  private queuedEffects=new Set<AudioEffect>();
  private baking=false;
  private ovenPaused=false;
  private ovenDing=false;
  musicEnabled=true;
  musicTrack:1|2=2;
  get snapshot(){return {unlocked:this.unlocked,baking:this.baking,ovenPaused:this.ovenPaused,muted:this.muted,effectsVolume:this.volume,musicEnabled:this.musicEnabled,musicTrack:this.musicTrack,streams:[...this.streams].map(([name,stream])=>({name,src:stream.media.src,currentTime:stream.media.currentTime,paused:stream.media.paused,wanted:stream.wanted,pending:stream.pending,volume:stream.media.volume,effectiveGain:(stream.gain?.gain.value??1)*stream.media.volume,muted:stream.media.muted,error:stream.media.error?.code??(stream.blocked?'playback-blocked':null)}))};}
  get effectsVolume():number{return this.volume;}
  setEffectsVolume(value:number):void{if(!Number.isFinite(value))return;this.volume=Math.max(0,Math.min(1,value));for(const gain of this.gains)gain.gain.value=this.muted?0:.025*this.volume;for(const [name,stream] of this.streams)this.mix(name,stream);}
  constructor(private readonly create:()=>AudioContext=()=>new AudioContext(),private readonly createMedia:(url:string)=>HTMLAudioElement=url=>new Audio(url)){}
  get status():'running'|'locked'|'unavailable'|'closed'{
    return this.disposed?'closed':this.failed?'unavailable':this.context?.state==='running'?'running':'locked';
  }
  async interact():Promise<void>{
    if(this.disposed)return;
    this.unlocked=true;
    // Begin resuming synchronously in the gesture, even if effects are muted.
    let resumed:Promise<void>|undefined;
    try{this.context??=this.create();resumed=this.context.resume().catch(()=>{});}catch{if(!this.context)this.failed=true;}
    for(const name of Object.keys(files) as Sound[])this.stream(name);
    for(const [name,stream] of this.streams){this.route(stream);this.mix(name,stream);}
    for(const stream of this.streams.values())stream.blocked=false;
    this.syncMusic();this.updateOven();
    const queued=[...this.queuedEffects];this.queuedEffects.clear();for(const name of queued)this.effect(name);
    // Safari unlocks individual elements. Prime the idle voices inside this gesture,
    // so customer/staff events can use them later without another tap.
    // Settings always plays in its own UI gesture; avoid deferring that click
    // behind a primer while its real file can start immediately.
    for(const [name,stream] of this.streams)if(name!=='settings'&&!stream.wanted&&!stream.primed&&!stream.pending)this.prime(name,stream);
    await resumed;
    // Failed resume leaves native media as the audible fallback. Connecting it
    // to a suspended context would otherwise silently consume its output.
    if(!this.disposed)for(const [name,stream] of this.streams){this.route(stream);this.mix(name,stream);}
  }
  toggleMute():void {this.muted=!this.muted;if(this.muted)this.ovenDing=false;this.setEffectsVolume(this.volume);if(this.muted)this.stopEffects();this.updateOven();}
  silence():void {for(const gain of this.gains)gain.gain.value=0;this.stopEffects();this.ovenDing=false;this.ovenPaused=true;this.updateOven();}
  effect(name:AudioEffect):void{
    if(this.disposed||this.muted)return;
    if(!this.unlocked){if(name!=='arrival')this.queuedEffects.add(name);return;}
    const stream=this.stream(name);if(!stream)return;
    stream.startOffset=name==='settings'?SETTINGS_ONSET:0;
    // Reuse one voice per effect, including repeated taps while play() is pending.
    if(!stream.priming){stream.media.pause();this.reset(stream,stream.startOffset);}stream.playing=false;stream.revision++;stream.blocked=false;
    this.request(stream,true,false);
  }
  syncOven(baking:boolean,paused:boolean,ready=false):void{
    const started=baking&&!this.baking,finished=this.baking&&!baking&&ready;
    this.baking=baking;this.ovenPaused=paused;
    if(started)this.ovenDing=false;
    if(finished&&!this.muted&&this.unlocked)this.ovenDing=true;
    const stream=this.streams.get('oven');
    if(stream&&(started||finished)){
      const file=this.ovenDing?'oven-ready.wav':files.oven;
      const url=`${import.meta.env.BASE_URL}assets/audio/${encodeURIComponent(file)}`;
      if(stream.url!==url){stream.url=url;if(!stream.priming){stream.media.pause();stream.media.src=stream.url;this.reset(stream);}}
      stream.media.loop=!this.ovenDing;stream.playing=false;stream.revision++;stream.blocked=false;
      this.mix('oven',stream);
    }
    this.updateOven();
  }
  toggleMusic():void{this.musicEnabled=!this.musicEnabled;this.syncMusic();}
  changeMusic():void{this.musicTrack=this.musicTrack===2?1:2;this.syncMusic();}
  private updateOven():void{
    const stream=this.streams.get('oven')??(this.baking?this.stream('oven'):undefined);
    if(stream)this.request(stream,(this.baking||this.ovenDing)&&!this.ovenPaused&&!this.muted,!this.baking&&!this.ovenDing);
  }
  private syncMusic():void{
    const selected=this.musicTrack===2?'music2':'music1';
    for(const [name,stream] of this.streams)if(name.startsWith('music')&&name!==selected)this.request(stream,false,true);
    const stream=this.streams.get(selected)??(this.musicEnabled?this.stream(selected):undefined);
    if(stream)this.request(stream,this.musicEnabled,false);
  }
  private stream(name:Sound):Stream|undefined{
    if(this.disposed||!this.unlocked)return;
    const existing=this.streams.get(name);if(existing)return existing;
    try{
      const url=`${import.meta.env.BASE_URL}assets/audio/${encodeURIComponent(files[name])}`,media=this.createMedia(url);
      media.loop=name==='oven'||name.startsWith('music');media.preload=name==='settings'||name==='payment'?'auto':'metadata';
      const stream:Stream={media,url,wanted:false,playing:false,pending:false,blocked:false,revision:0,reset:false,primed:false,priming:false,startOffset:0};
      media.onended=()=>{if(!media.loop&&!stream.priming){stream.wanted=false;stream.playing=false;stream.revision++;if(name==='oven')this.ovenDing=false;}};
      media.onloadedmetadata=()=>{if(!stream.priming&&stream.wanted&&!stream.playing&&stream.startOffset)this.reset(stream,stream.startOffset);};
      this.route(stream);this.mix(name,stream);this.streams.set(name,stream);return stream;
    }catch{return;}
  }
  private route(stream:Stream):void{
    if(stream.source||this.context?.state!=='running'||!this.context.createMediaElementSource)return;
    let gain:GainNode|undefined;
    try{
      gain=this.context.createGain();
      stream.source=this.context.createMediaElementSource(stream.media);
      stream.source.connect(gain);gain.connect(this.context.destination);stream.gain=gain;
    }catch{
      // Native media remains available if the browser cannot route it through Web Audio.
      gain?.disconnect();
      if(stream.source){stream.source.disconnect();try{stream.source.connect(this.context.destination);}catch{/* No audio device must never interrupt gameplay. */}}
    }
  }
  private mix(name:Sound,stream:Stream):void{
    const music=name.startsWith('music');
    const level=stream.priming?0:music?MUSIC_VOLUME:this.muted?0:this.volume*(name==='payment'?.75:1);
    if(stream.gain){stream.media.volume=1;stream.gain.gain.value=level*(name==='oven'&&!this.ovenDing?OVEN_GAIN:1);}
    else stream.media.volume=level;
  }
  private request(stream:Stream,wanted:boolean,reset:boolean):void{
    if(stream.wanted!==wanted){stream.revision++;stream.blocked=false;}
    stream.wanted=wanted;stream.reset=reset;
    if(!wanted){if(stream.priming&&!this.disposed)return;if(stream.playing||stream.pending)stream.media.pause();stream.playing=false;if(reset)this.reset(stream);return;}
    this.play(stream);
  }
  private play(stream:Stream):void{
    if(stream.media.paused)stream.playing=false;
    if(this.disposed||!stream.wanted||stream.playing||stream.pending||stream.blocked)return;
    if(stream.startOffset)this.reset(stream,stream.startOffset);
    stream.pending=true;const revision=stream.revision;
    try{
      void Promise.resolve(stream.media.play()).then(()=>{
        stream.pending=false;
        if(this.disposed||revision!==stream.revision||!stream.wanted){stream.media.pause();stream.playing=false;if(stream.reset)this.reset(stream);if(!this.disposed)this.play(stream);}
        else {stream.playing=!stream.media.paused;stream.primed=true;}
      },()=>{stream.pending=false;stream.playing=false;stream.blocked=revision===stream.revision;if(!this.disposed&&revision!==stream.revision)this.play(stream);});
    }catch{stream.pending=false;stream.blocked=true;}
  }
  private prime(name:Sound,stream:Stream):void{
    stream.pending=true;stream.priming=true;stream.media.muted=true;stream.media.volume=0;
    // A silent source also works on iOS, where element volume can be ignored.
    stream.media.loop=false;stream.media.src=silentVoice;
    const finish=(primed:boolean)=>{
      stream.pending=false;stream.priming=false;stream.primed=primed;
      stream.media.pause();if(!stream.wanted)this.reset(stream);
      stream.media.loop=name==='oven'&&!this.ovenDing||name.startsWith('music');
      stream.media.muted=false;this.mix(name,stream);
      if(this.disposed){stream.media.pause();return;}
      stream.media.src=stream.url;
      this.play(stream);
    };
    try{
      const result=stream.media.play();
      // Await actual start before pausing; immediately pausing can cancel Safari's unlock.
      void Promise.resolve(result).then(()=>finish(true),()=>finish(false));
    }catch{stream.media.pause();finish(false);}
  }
  private reset(stream:Stream,offset=0):void{try{stream.media.currentTime=offset;}catch{ /* Metadata may not be loaded yet; the loadedmetadata handler retries. */ }}
  private stopEffects():void{this.queuedEffects.clear();for(const [name,stream] of this.streams)if(name!=='oven'&&!name.startsWith('music'))this.request(stream,false,true);}
  cue():void{
    if(this.disposed||this.muted||this.context?.state!=='running')return;
    try{
      const oscillator=this.context.createOscillator(),gain=this.context.createGain();
      oscillator.type='sine';oscillator.frequency.value=480;gain.gain.value=.025*this.volume;
      oscillator.connect(gain);gain.connect(this.context.destination);this.gains.add(gain);
      oscillator.onended=()=>{this.gains.delete(gain);oscillator.disconnect();gain.disconnect();};
      oscillator.start();oscillator.stop(this.context.currentTime+.045);
    }catch{ /* A missing audio device must never interrupt gameplay. */ }
  }
  destroy():void {if(this.disposed)return;this.disposed=true;this.silence();this.gains.clear();for(const stream of this.streams.values()){this.request(stream,false,true);stream.media.onended=null;stream.media.onloadedmetadata=null;stream.media.removeAttribute('src');stream.media.load();stream.source?.disconnect();stream.gain?.disconnect();}this.streams.clear();void this.context?.close().catch(()=>{});}
}
