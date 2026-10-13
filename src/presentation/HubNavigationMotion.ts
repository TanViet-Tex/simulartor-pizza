import type {HubTab} from './HubCanvasUI';

export const HUB_NAVIGATION_TABS:readonly HubTab[]=['summary','market','stock','shop','missions'];
export type HubNavigationSample={active:HubTab;tabs:Record<HubTab,{amount:number;scale:number}>;animating:boolean};
const ease=(progress:number):number=>progress*progress*(3-2*progress);

/** Presentation clock only; selection never changes the fixed input rectangles. */
export class HubNavigationMotion {
  private active:HubTab='summary';
  private amounts:Record<HubTab,number>={summary:1,market:0,stock:0,shop:0,missions:0};
  private transition:{started:number;from:Record<HubTab,number>}|undefined;
  private press:{id:HubTab;started:number}|undefined;

  select(id:HubTab,now:number,reduced:boolean):void {
    const current=this.sample(now,reduced);
    if(id!==this.active){
      this.amounts=Object.fromEntries(HUB_NAVIGATION_TABS.map(tab=>[tab,current.tabs[tab].amount])) as Record<HubTab,number>;
      this.active=id;
      this.transition=reduced?undefined:{started:now,from:{...this.amounts}};
    }
    this.press=reduced?undefined:{id,started:now};
    if(reduced)this.finish();
  }

  sample(now:number,reduced:boolean):HubNavigationSample {
    if(reduced)this.finish();
    if(this.transition){
      const progress=Math.min(1,Math.max(0,(now-this.transition.started)/150));
      const blend=ease(progress);
      for(const id of HUB_NAVIGATION_TABS)this.amounts[id]=this.transition.from[id]+((id===this.active?1:0)-this.transition.from[id])*blend;
      if(progress===1)this.transition=undefined;
    }
    let scale=1;
    if(this.press){
      const elapsed=Math.max(0,now-this.press.started);
      if(elapsed>=120)this.press=undefined;
      else scale=1-.04*ease(elapsed<=60?elapsed/60:(120-elapsed)/60);
    }
    return {active:this.active,tabs:Object.fromEntries(HUB_NAVIGATION_TABS.map(id=>[id,{amount:this.amounts[id],scale:this.press?.id===id?scale:1}])) as HubNavigationSample['tabs'],animating:!!(this.transition||this.press)};
  }

  private finish():void {
    for(const id of HUB_NAVIGATION_TABS)this.amounts[id]=id===this.active?1:0;
    this.transition=undefined;this.press=undefined;
  }
}
