import type Phaser from 'phaser';

/** Opt-in developer probe: never enabled for normal production play. */
export function installRuntimeDiagnostics(game:Phaser.Game):void {
  if(new URLSearchParams(location.search).get('perf')!=='1')return;
  const seen=new WeakSet<object>(),attached=new Set<Phaser.Scene>();
  const created:Record<string,number>={},frames:number[]=[];
  const added=(object:Phaser.GameObjects.GameObject)=>{if(seen.has(object))return;seen.add(object);created[object.type]=(created[object.type]??0)+1;};
  const sample=(_time:number,delta:number)=>{
    frames.push(delta);if(frames.length>3600)frames.shift();
    for(const scene of game.scene.getScenes(false))if(!attached.has(scene)){attached.add(scene);scene.events.on('addedtoscene',added);scene.events.once('destroy',()=>{scene.events.off('addedtoscene',added);attached.delete(scene);});}
  };
  game.events.on('poststep',sample);
  const snapshot=()=>{
    const objects=new Set<Phaser.GameObjects.GameObject>(),types:Record<string,number>={};let tweens=0,timers=0,listeners=0;
    const visit=(o:Phaser.GameObjects.GameObject)=>{if(objects.has(o))return;objects.add(o);types[o.type]=(types[o.type]??0)+1;if('list' in o)for(const child of (o as Phaser.GameObjects.Container).list)visit(child);};
    for(const scene of game.scene.getScenes(true)){
      for(const object of scene.children.list)visit(object);
      tweens+=scene.tweens.getTweens().length;
      const clock=scene.time as unknown as {_active:unknown[];_pendingInsertion:unknown[]};timers+=(clock._active?.length??0)+(clock._pendingInsertion?.length??0);
      for(const emitter of [scene.events,scene.input,scene.scale,scene.input.keyboard])if(emitter)for(const event of emitter.eventNames())listeners+=emitter.listenerCount(event);
    }
    const ordered=[...frames].sort((a,b)=>a-b),textures=Object.values(game.textures.list).map(t=>t.getSourceImage()).filter((s):s is HTMLImageElement|HTMLCanvasElement=>!!s&&'width' in s);
    return {objects:objects.size,types,tweens,timers,listeners,created:{...created},frames:frames.length,meanFrameMs:frames.length?frames.reduce((n,d)=>n+d,0)/frames.length:0,p95FrameMs:ordered[Math.floor(ordered.length*.95)]??0,longFrames:frames.filter(d=>d>50).length,textureCount:textures.length,texturePixels:textures.reduce((n,s)=>n+s.width*s.height,0),canvas:{width:game.canvas.width,height:game.canvas.height},dpr:devicePixelRatio};
  };
  (window as unknown as {pizzaPerformance:unknown}).pizzaPerformance={game,snapshot,reset:()=>{frames.length=0;for(const key of Object.keys(created))delete created[key];}};
  game.events.once('destroy',()=>{game.events.off('poststep',sample);for(const scene of attached)scene.events.off('addedtoscene',added);attached.clear();delete (window as unknown as {pizzaPerformance?:unknown}).pizzaPerformance;});
}
