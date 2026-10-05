import type Phaser from 'phaser';
import type {PlayAudio} from './PlayAudio';
import type {MenuPreferences} from './MenuPreferences';
import {drawNotificationFrame,drawNotificationButton,type NotificationRect} from './NotificationFrame';
import {UI_THEME} from './theme';

export type SettingsAction='music'|'effects-less'|'mute'|'effects-more'|'motion'|'back';
type SettingsInput={audio:PlayAudio;preferences?:MenuPreferences;reducedMotion:boolean;changed:()=>void;back:()=>void;register:(action:SettingsAction,rect:NotificationRect,enabled:boolean,callback:()=>void)=>void};

/** Both scenes draw the same absolute geometry; adapters only register input and semantic IDs. */
export function drawSettingsPanel(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,input:SettingsInput):void {
  const layout=drawNotificationFrame(scene,layer,'one',75,490),y=layout.body.y;
  const text=(at:number,value:string,size=14,color=UI_THEME.text.ink)=>{
    layer.add(scene.add.text(180,at,value,{fontFamily:UI_THEME.typography.fontFamily,fontSize:`${size}px`,fontStyle:'bold',color,align:'center',wordWrap:{width:280},padding:{top:2,bottom:2}}).setOrigin(.5,0));
  };
  const controls:Record<SettingsAction,NotificationRect>={
    music:{x:50,y:y+32,width:260,height:48},
    'effects-less':{x:50,y:y+125,width:76,height:48},mute:{x:137,y:y+125,width:86,height:48},'effects-more':{x:234,y:y+125,width:76,height:48},
    motion:{x:50,y:y+190,width:260,height:48},back:layout.footer[0],
  };
  const button=(action:SettingsAction,title:string,enabled:boolean,callback:()=>void)=>{
    const rect=controls[action];if(action!=='back')drawNotificationButton(scene,layer,rect.x,rect.y,rect.width,rect.height);
    if(!enabled){const shade=scene.add.graphics();shade.fillStyle(0x000000,.4).fillRoundedRect(rect.x,rect.y,rect.width,rect.height,rect.height/2);layer.add(shade);}
    layer.add(scene.add.text(rect.x+rect.width/2,rect.y+rect.height/2,title,{fontFamily:UI_THEME.typography.fontFamily,fontSize:'16px',fontStyle:'bold',color:enabled?'#fff0d5':'#a9a29a',align:'center',wordWrap:{width:rect.width-12},padding:{top:2,bottom:2}}).setOrigin(.5));
    input.register(action,rect,enabled,()=>{callback();input.changed();});
  };
  text(layout.titleY+10,'Cài đặt',22);text(y+4,'Nhạc: chưa có trong phiên bản này',13);
  button('music','Âm lượng nhạc — chưa có',false,()=>{});
  text(y+96,`Hiệu ứng: ${Math.round(input.audio.effectsVolume*100)}%${input.audio.muted?' · đang tắt':''}`);
  button('effects-less','−',true,()=>input.audio.setEffectsVolume(input.audio.effectsVolume-.1));
  button('mute',input.audio.muted?'Bật âm':'Tắt âm',true,()=>input.audio.toggleMute());
  button('effects-more','+',true,()=>input.audio.setEffectsVolume(input.audio.effectsVolume+.1));
  button('motion',`Giảm chuyển động: ${input.reducedMotion?'Bật':'Tắt'}`,!!input.preferences,()=>input.preferences?.setReducedMotion(!input.reducedMotion));
  button('back','Quay lại',true,input.back);
  scene.game.canvas.dataset.settingsPanel=JSON.stringify({layout,controls,effectsVolume:input.audio.effectsVolume,muted:input.audio.muted,reducedMotion:input.reducedMotion,musicAvailable:false});
}
