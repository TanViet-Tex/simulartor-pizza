import type Phaser from 'phaser';
import {describe,it,expect,vi} from 'vitest';
import {ManagementBackground,preloadManagementBackground,MANAGEMENT_BACKGROUND_ASSET} from './ManagementBackground';

function fixture(sourceWidth=941,sourceHeight=1672){
  const image={frame:{realWidth:sourceWidth,realHeight:sourceHeight},
    setOrigin:vi.fn().mockReturnThis(),setScrollFactor:vi.fn().mockReturnThis(),
    setDepth:vi.fn().mockReturnThis(),setVisible:vi.fn().mockReturnThis(),
    setPosition:vi.fn().mockReturnThis(),setScale:vi.fn().mockReturnThis(),destroy:vi.fn()};
  const scene={add:{image:vi.fn(()=>image)},scale:{gameSize:{width:360,height:640},on:vi.fn(),off:vi.fn()},
    events:{once:vi.fn(),off:vi.fn()},textures:{exists:vi.fn(()=>false)},load:{image:vi.fn()}};
  return {image,scene,background:new ManagementBackground(scene as unknown as Phaser.Scene)};
}

describe('ManagementBackground',()=>{
  it.each([[941,1672],[1800,900],[600,1800]])('covers 360×640 without stretching source %i×%i',(width,height)=>{
    const {image}=fixture(width,height),scale=image.setScale.mock.lastCall![0] as number;
    expect(scale*width).toBeGreaterThanOrEqual(360);
    expect(scale*height).toBeGreaterThanOrEqual(640);
    expect(Math.min(scale*width-360,scale*height-640)).toBeCloseTo(0);
    expect(image.setScale.mock.lastCall).toHaveLength(1);
    expect(image.setPosition).toHaveBeenCalledWith(180,320);
  });
  it('reuses one noninteractive image through repeated show/hide and viewport resize',()=>{
    const {image,scene,background}=fixture();
    for(let i=0;i<20;i++){background.show();background.hide();}
    expect(scene.add.image).toHaveBeenCalledTimes(1);
    expect(image.setScrollFactor).toHaveBeenCalledWith(0);
    expect(image.setDepth).toHaveBeenCalledWith(-1);
    scene.scale.gameSize={width:390,height:844};
    const resize=scene.scale.on.mock.calls[0]![1] as ()=>void;resize();
    expect(image.setPosition).toHaveBeenLastCalledWith(195,422);
    expect(image.setScale).toHaveBeenLastCalledWith(Math.max(390/941,844/1672));
  });
  it('cleans listeners and image exactly once and ignores stale resize/show callbacks',()=>{
    const {image,scene,background}=fixture();
    const resize=scene.scale.on.mock.calls[0]![1] as ()=>void;
    const shutdown=scene.events.once.mock.calls[0]![1] as ()=>void;
    shutdown();background.destroy();image.setScale.mockClear();image.setVisible.mockClear();
    resize();background.show();background.hide();
    expect(image.destroy).toHaveBeenCalledTimes(1);
    expect(scene.scale.off).toHaveBeenCalledWith('resize',resize);
    expect(scene.events.off).toHaveBeenCalledWith('shutdown',shutdown);
    expect(scene.events.off).toHaveBeenCalledWith('destroy',shutdown);
    expect(image.setScale).not.toHaveBeenCalled();expect(image.setVisible).not.toHaveBeenCalled();
  });
  it('queues the local asset only when its texture is absent',()=>{
    const {scene}=fixture();preloadManagementBackground(scene as unknown as Phaser.Scene);
    expect(scene.load.image).toHaveBeenCalledWith(MANAGEMENT_BACKGROUND_ASSET.key,expect.stringContaining(MANAGEMENT_BACKGROUND_ASSET.url));
    scene.textures.exists.mockReturnValue(true);preloadManagementBackground(scene as unknown as Phaser.Scene);
    expect(scene.load.image).toHaveBeenCalledTimes(1);
  });
});
