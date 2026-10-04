import { CozyRuntime } from './CozyRuntime';
import { PlayLifecycle, type PauseLease } from './PlayLifecycle';

/** Owns only the current RAM session and the menu's simulation pause. */
export class MainMenuSession {
  private current: CozyRuntime | null = null;
  private interruption:PlayLifecycle | null=null;
  private menuLease?:PauseLease;
  constructor(private readonly createRuntime = () => new CozyRuntime(true, true)) {}
  get hasSession(): boolean { return this.current !== null; }
  get lifecycle():PlayLifecycle | null{return this.interruption;}
  start(): CozyRuntime { this.menuLease?.release();this.menuLease=undefined;this.interruption?.destroy();this.current = this.createRuntime();this.interruption=new PlayLifecycle(this.current);return this.current; }
  destroy():void{this.menuLease?.release();this.menuLease=undefined;this.interruption?.destroy();this.interruption=null;this.current=null;}
  returnToMenu(): void {
    if (!this.current) return;
    this.menuLease??=this.current.acquirePause('menu');
  }
  continue(): CozyRuntime | null {
    this.menuLease?.release();this.menuLease=undefined;
    return this.current;
  }
}
