import { PlayLifecycle } from '../runtime/PlayLifecycle';

/** All listeners and interruption leases belong to this instance. */
export class BrowserPlayLifecycle {
  private disposed=false;
  private pageHidden=false;
  constructor(private readonly lifecycle:PlayLifecycle,private readonly changed:()=>void){
    document.addEventListener('visibilitychange',this.visibility);
    window.addEventListener('pagehide',this.pageHide);
    window.addEventListener('pageshow',this.pageShow);
    window.addEventListener('resize',this.viewportChanged);
    this.visibility();this.viewportChanged();
  }
  private visibility=():void=>{this.lifecycle.setHidden(document.hidden||this.pageHidden);this.changed();};
  private pageHide=():void=>{this.pageHidden=true;this.visibility();};
  private pageShow=():void=>{this.pageHidden=false;this.visibility();this.viewportChanged();};
  private viewportChanged=():void=>{this.lifecycle.viewportChanged();this.changed();};
  destroy(releaseLeases=true):void{
    if(this.disposed)return;this.disposed=true;
    document.removeEventListener('visibilitychange',this.visibility);
    window.removeEventListener('pagehide',this.pageHide);window.removeEventListener('pageshow',this.pageShow);
    window.removeEventListener('resize',this.viewportChanged);if(releaseLeases)this.lifecycle.destroy();
  }
}
