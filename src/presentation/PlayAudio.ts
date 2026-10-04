/** Audio is presentation-only. Context creation and resume happen inside input gestures. */
export class PlayAudio {
  private context?:AudioContext;
  private gains=new Set<GainNode>();
  private disposed=false;
  private failed=false;
  muted=false;
  private volume=1;
  get effectsVolume():number{return this.volume;}
  setEffectsVolume(value:number):void{if(!Number.isFinite(value))return;this.volume=Math.max(0,Math.min(1,value));for(const gain of this.gains)gain.gain.value=this.muted?0:.025*this.volume;}
  constructor(private readonly create:()=>AudioContext=()=>new AudioContext()){}
  get status():'running'|'locked'|'unavailable'|'closed'{
    return this.disposed?'closed':this.failed?'unavailable':this.context?.state==='running'?'running':'locked';
  }
  async interact():Promise<void>{
    if(this.disposed||this.muted)return;
    try {this.context??=this.create();await this.context.resume();}catch{if(!this.context)this.failed=true;}
  }
  toggleMute():void {this.muted=!this.muted;if(this.muted)this.silence();}
  silence():void {for(const gain of this.gains)gain.gain.value=0;}
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
  destroy():void {if(this.disposed)return;this.disposed=true;this.silence();this.gains.clear();void this.context?.close().catch(()=>{});}
}
