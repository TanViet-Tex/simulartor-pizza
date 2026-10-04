export type PauseLease = { release(): void };
export interface LifecyclePausePort {
  readonly simulationActive:boolean;
  readonly pauses:readonly string[];
  advanceElapsed(milliseconds:number):void;
  subscribeTimeBoundary(listener:(phase:'before'|'after')=>void):()=>void;
}

/** Owns wall-clock reconciliation; hidden/blurred pages never acquire pause leases. */
export class PlayLifecycle {
  private lastFrame?:number;
  private disposed=false;
  private synchronizing=false;
  private readonly unsubscribe:()=>void;
  constructor(private readonly runtime:LifecyclePausePort,private readonly clock:()=>number=()=>performance.now()){
    this.unsubscribe=runtime.subscribeTimeBoundary(phase=>{
      if(this.disposed||this.synchronizing)return;
      if(phase==='before')this.reconcile();else this.lastFrame=this.clock();
    });
  }
  get needsContinue():boolean{return false;}
  frame(now:number,_running:boolean):void{this.synchronize(now);}
  reconcile():void{this.synchronize(this.clock());}
  private synchronize(now:number):void{
    if(this.disposed||this.synchronizing||!Number.isFinite(now))return;
    const previous=this.lastFrame;if(previous!==undefined&&now<previous)return;this.lastFrame=now;
    if(previous===undefined||now<=previous||this.runtime.pauses.length||!this.runtime.simulationActive)return;
    this.synchronizing=true;
    try{this.runtime.advanceElapsed(now-previous);}finally{this.synchronizing=false;}
  }
  setHidden(_hidden:boolean):void{this.reconcile();}
  viewportChanged():void{this.reconcile();}
  continue():boolean{return false;}
  destroy():void{if(this.disposed)return;this.disposed=true;this.unsubscribe();this.lastFrame=undefined;}
}
