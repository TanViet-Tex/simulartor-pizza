import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './config/viewport';
import { BootScene } from './scenes/BootScene';
import { CozyScene } from './scenes/CozyScene';
import { CozyRuntime } from './runtime/CozyRuntime';
import {campaignEventSeed} from './domain/CampaignEvents';
import { StartupScene } from './scenes/StartupScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { MenuPreferences } from './presentation/MenuPreferences';
import {CozyCampaignSession} from './runtime/CozyCampaignSession';
import {CozySaveRepository} from './infrastructure/CozySaveRepository';
import { PlayAudio } from './presentation/PlayAudio';
import {installRuntimeDiagnostics} from './presentation/RuntimeDiagnostics';
import {PlayLifecycle,type PauseLease} from './runtime/PlayLifecycle';
import './style.css';

const campaign = new URLSearchParams(window.location.search).get('mode') === 'campaign';
const mode = new URLSearchParams(window.location.search).get('mode');
const guided = mode !== 'freeplay' && mode !== 'shop';
const direct = mode === 'campaign' || mode === 'shop' || mode === 'freeplay' || mode === 'tutorial';
const playAudio=new PlayAudio();
/** Direct entry modes keep the same runtime in RAM when visiting the menu. */
function directPlay():Phaser.Scene {
  const preferences=new MenuPreferences();
  const freshRuntime=()=>new CozyRuntime(guided,mode!=='freeplay',{eventSeed:campaignEventSeed(crypto.randomUUID())});
  let runtime=freshRuntime(),lifecycle=new PlayLifecycle(runtime),menuLease:PauseLease|undefined;
  const enter=()=>{
    menuLease?.release();menuLease=undefined;
    game.scene.stop('MainMenuScene');
    if(game.scene.getScene('CozyScene'))game.scene.remove('CozyScene');
    game.scene.add('CozyScene',makePlay(),true);
  };
  const menu=new MainMenuScene(preferences,{
    hasSession:()=>true,
    continue:enter,
    start:()=>{menuLease?.release();menuLease=undefined;lifecycle.destroy();runtime=freshRuntime();lifecycle=new PlayLifecycle(runtime);enter();},
  },playAudio);
  const makePlay=()=>new CozyScene(runtime,preferences,()=>{
    menuLease??=runtime.acquirePause('menu');
    game.scene.stop('CozyScene');game.scene.stop('PlayScene');
    if(!game.scene.getScene('MainMenuScene'))game.scene.add('MainMenuScene',menu,false);
    game.scene.start('MainMenuScene');
  },playAudio,lifecycle,undefined,next=>{menuLease?.release();menuLease=undefined;lifecycle.destroy();runtime=next;lifecycle=new PlayLifecycle(runtime);enter();});
  game.events.once(Phaser.Core.Events.DESTROY,()=>{menuLease?.release();lifecycle.destroy();preferences.destroy();});
  return makePlay();
}
function mainMenu(): Phaser.Scene {
  const preferences = new MenuPreferences();
  const session = new CozyCampaignSession(new CozySaveRepository());
  let initialized=false;
  let menu:MainMenuScene,opening=false;
  const launch=async(operation:()=>CozyRuntime|null|Promise<CozyRuntime|null>)=>{
    if(opening)return;opening=true;menu.showEntryLoading(0);
    // Let the waiting UI paint before save validation and scene setup begin.
    await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
    try{enterPlay(await operation());}catch{menu.clearEntryLoading();opening=false;}
  };
  const enterPlay = (runtime:CozyRuntime | null) => {
    if (!runtime) {menu.clearEntryLoading();opening=false;return;}
    const waiting=menu.sys.isActive(),lease=waiting?runtime.acquirePause('menu'):undefined;
    if(waiting)menu.showEntryLoading(10);
    if (game.scene.getScene('CozyScene')) game.scene.remove('CozyScene');
    const play=new CozyScene(runtime,preferences,() => {
      session.returnToMenu();
      game.scene.stop('CozyScene');
      game.scene.start('MainMenuScene');
    },playAudio,session.lifecycle??undefined,session,enterPlay,waiting?{
      progress:progress=>menu.showEntryLoading(10+progress*85),
      ready:()=>{
        menu.showEntryLoading(100);
        requestAnimationFrame(()=>requestAnimationFrame(()=>{game.scene.stop('MainMenuScene');lease?.release();opening=false;}));
      },
      cancel:()=>lease?.release(),
    }:undefined);
    try{game.scene.add('CozyScene',play,true);}catch(error){lease?.release();throw error;}
    if(waiting)game.scene.bringToTop('MainMenuScene');else opening=false;
  };
  game.events.once(Phaser.Core.Events.DESTROY,() => preferences.destroy());
  game.events.once(Phaser.Core.Events.DESTROY,() => session.destroy());
  return menu=new MainMenuScene(preferences,{
    hasSession:() => session.hasSession,
    start:() => {void launch(()=>session.start(mode!=='shop'));},
    continue:() => {void launch(()=>session.continue());},
    testCode:{message:value=>session.testCodeMessage(value),claim:value=>session.claimTestCode(value),claimed:()=>!!session.runtime?.testCodeClaimed,save:()=>session.view,retry:()=>{void session.retry();}},
    save:()=>session.view,
    subscribe:listener=>session.subscribe(listener),
    initialize:()=>{if(initialized)return;initialized=true;void session.load().then(runtime=>{if(mode==='shop'){if(runtime)enterPlay(runtime);else if(session.view.state==='ready')void session.start(false).then(enterPlay);}});},
    retryRead:()=>{void session.load().then(runtime=>{if(runtime&&mode==='shop')enterPlay(runtime);});},
    retrySave:()=>{void launch(()=>session.retry());},
    recover:()=>{void launch(()=>session.confirmRecovery());},
    temporary:()=>{void launch(()=>session.temporary(mode!=='shop'));},
  },playAudio);
}
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game-container',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#382019',
  pixelArt: false,
  roundPixels: false,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [new StartupScene(campaign, () => campaign
    ? new BootScene(playAudio)
    : direct&&mode!=='shop' ? directPlay() : mainMenu(), !campaign)],
});
game.events.once(Phaser.Core.Events.DESTROY,()=>playAudio.destroy());
installRuntimeDiagnostics(game);

if (import.meta.hot) {
  import.meta.hot.dispose(() => game.destroy(true));
}
