export type PauseLease = { release(): void };
export interface LifecyclePausePort { acquirePause(reason:'visibility'|'gap'):PauseLease }

/** Browser events request leases; only a player gesture clears foreground recovery. */
export class PlayLifecycle {
  private hidden=false;
  private foreground?:PauseLease;
  private gap?:PauseLease;
  private lastFrame?:number;
  private disposed=false;
  constructor(private readonly pauses:LifecyclePausePort){}
  get needsContinue():boolean{return !!this.foreground||!!this.gap;}
  frame(now:number,running:boolean):void{
    if(this.disposed||!Number.isFinite(now))return;
    if(running&&this.lastFrame!==undefined&&now-this.lastFrame>250&&!this.gap)this.gap=this.pauses.acquirePause('gap');
    this.lastFrame=now;
  }
  setHidden(hidden:boolean):void{
    if(this.disposed)return;
    this.hidden=hidden;
    this.lastFrame=undefined;
    if(hidden&&!this.foreground)this.foreground=this.pauses.acquirePause('visibility');
  }
  viewportChanged():void{
    if(this.disposed)return;
    this.lastFrame=undefined;
  }
  continue():boolean{
    if(this.disposed||this.hidden||!this.needsContinue)return false;
    if(this.foreground){this.foreground.release();this.foreground=undefined;}
    else {this.gap?.release();this.gap=undefined;}
    this.lastFrame=undefined;return true;
  }
  destroy():void{
    this.disposed=true;this.foreground?.release();this.gap?.release();
    this.foreground=undefined;this.gap=undefined;
  }
}
