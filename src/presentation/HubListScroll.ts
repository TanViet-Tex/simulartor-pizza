/** Latest offset is independent of painting, so wheel bursts never lose deltas. */
export class HubListScroll {
  offset:number;
  private pending=false;
  private start?:{x:number;y:number;offset:number;pointerId:number};
  moved=false;
  constructor(initial:number,readonly max:number,private paint:(offset:number)=>void,private allowed:()=>boolean){this.offset=this.clamp(initial);}
  private clamp(n:number):number{return Math.max(0,Math.min(this.max,n));}
  wheel(delta:number):void{if(!this.allowed()){this.cancel();return;}this.set(this.offset+delta);}
  down(x:number,y:number,pointerId:number):void{this.cancel();if(this.allowed())this.start={x,y,offset:this.offset,pointerId};}
  move(x:number,y:number,pointerId:number):void{
    if(!this.allowed()){this.cancel();return;}const start=this.start;if(!start||start.pointerId!==pointerId)return;
    if(Math.hypot(x-start.x,y-start.y)>=8)this.moved=true;
    if(this.moved)this.set(start.offset+start.y-y);
  }
  canTap(pointerId:number):boolean{return this.allowed()&&!!this.start&&this.start.pointerId===pointerId&&!this.moved;}
  cancel():void{this.start=undefined;this.moved=false;}
  private set(value:number):void{const n=this.clamp(value);if(n!==this.offset){this.offset=n;this.pending=true;}}
  flush():void{if(!this.allowed()){this.pending=false;this.cancel();return;}if(this.pending){this.pending=false;this.paint(this.offset);}}
  destroy():void{this.pending=false;this.cancel();}
}
