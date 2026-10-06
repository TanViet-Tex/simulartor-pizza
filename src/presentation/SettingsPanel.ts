import type Phaser from 'phaser';
import type {PlayAudio} from './PlayAudio';
import type {MenuPreferences} from './MenuPreferences';
import type {NotificationRect} from './NotificationFrame';
import {drawSettingsArt,drawSettingsIcon} from './ReferenceSettingsArt';
import {UI_THEME} from './theme';

export type SettingsAction='music'|'music-choice'|'mute'|'motion'|'code'|'back';
type SettingsInput={audio:PlayAudio;preferences?:MenuPreferences;reducedMotion:boolean;changed:()=>void;back:()=>void;code:()=>void;register:(action:SettingsAction,rect:NotificationRect,enabled:boolean,callback:()=>void)=>void};

/** Both scenes share artwork, absolute geometry and real preference state. */
export function drawSettingsPanel(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,input:SettingsInput):void {
  drawSettingsArt(scene,layer);
  const controls:Record<SettingsAction,NotificationRect>={
    music:{x:187,y:174,width:130,height:48},'music-choice':{x:92,y:246,width:225,height:48},
    mute:{x:187,y:326,width:130,height:48},
    code:{x:92,y:404,width:225,height:48},motion:{x:187,y:467,width:130,height:48},back:{x:76,y:542,width:208,height:48},
  };
  const text=(x:number,y:number,value:string,size=17,color='#472310',originX=0,width?:number)=>layer.add(scene.add.text(x,y,value,{fontFamily:UI_THEME.typography.fontFamily,fontSize:`${size}px`,fontStyle:'bold',color,align:originX===.5?'center':'left',wordWrap:width?{width}:undefined,padding:{top:2,bottom:2}}).setOrigin(originX,0));
  const button=(action:SettingsAction,title:string,enabled:boolean,callback:()=>void,size=16)=>{
    const r=controls[action],g=scene.add.graphics();
    g.fillStyle(0x6a351a).fillRoundedRect(r.x-2,r.y+2,r.width+4,r.height+2,r.height/2);
    g.fillStyle(0xf5bf65).fillRoundedRect(r.x,r.y,r.width,r.height,r.height/2);
    g.fillStyle(0xffe6a8).fillRoundedRect(r.x+2,r.y+2,r.width-4,r.height-4,(r.height-4)/2);
    g.fillStyle(0x302c29).fillRoundedRect(r.x+5,r.y+5,r.width-10,r.height-10,(r.height-10)/2);
    g.lineStyle(1,0x74695a).strokeRoundedRect(r.x+7,r.y+7,r.width-14,r.height-14,(r.height-14)/2);
    layer.add(g);text(r.x+r.width/2,r.y+(r.height-size-5)/2,title,size,enabled?'#fff0d5':'#c7c0b2',.5);
    input.register(action,r,enabled,()=>{callback();input.changed();});
  };
  text(180,114,'Cài đặt',29,'#472310',.5);
  drawSettingsIcon(scene,layer,'music',38,173);text(92,187,'Music:',19);
  button('music','Chưa có nhạc',false,()=>{},13);
  drawSettingsIcon(scene,layer,'record',38,241);text(92,220,'Chọn nhạc nền',17);
  button('music-choice','Chưa có nhạc',false,()=>{},16);
  drawSettingsIcon(scene,layer,'music',38,327);text(92,340,'Hiệu ứng:',17);
  button('mute','',true,()=>input.audio.toggleMute());
  const effects=controls.mute,enabled=!input.audio.muted,eg=scene.add.graphics(),selected=effects.x+(enabled?effects.width/2:0)+5;
  eg.fillStyle(0xffcc4e).fillRoundedRect(selected,effects.y+5,effects.width/2-10,effects.height-10,18);
  eg.lineStyle(2,0xffeaa6).strokeRoundedRect(selected+2,effects.y+7,effects.width/2-14,effects.height-14,16);layer.add(eg);
  text(effects.x+effects.width/4,effects.y+12,'Tắt',16,enabled?'#bdb7ad':'#472310',.5);text(effects.x+effects.width*3/4,effects.y+12,'Bật',16,enabled?'#472310':'#bdb7ad',.5);
  drawSettingsIcon(scene,layer,'code',38,400);text(92,378,'Code',19);
  button('code','Nhập mã code',true,input.code,16);
  // A canvas gift keeps the icon consistent across iPhone/Android emoji fonts.
  const gift=scene.add.graphics();gift.fillStyle(0xfff0d5).fillRoundedRect(284,425,21,17,2).fillRoundedRect(282,420,25,6,2);
  gift.lineStyle(2,0x724323).strokeRoundedRect(284,425,21,17,2).strokeRoundedRect(282,420,25,6,2);
  gift.fillStyle(0xc84429).fillRect(292,421,5,21);gift.lineStyle(3,0xffcc4e).strokeEllipse(290,417,9,6).strokeEllipse(299,417,9,6);layer.add(gift);
  drawSettingsIcon(scene,layer,'motion',38,467);text(92,482,'Chuyển động:',13);
  button('motion','',!!input.preferences,()=>input.preferences?.setReducedMotion(!input.reducedMotion));
  const r=controls.motion,on=!input.reducedMotion,g=scene.add.graphics();
  const activeX=r.x+(on?r.width/2:0)+5;
  g.fillStyle(input.preferences?0xffcc4e:0x777166).fillRoundedRect(activeX,r.y+5,r.width/2-10,r.height-10,18);
  g.lineStyle(2,input.preferences?0xffeaa6:0xa59e90).strokeRoundedRect(activeX+2,r.y+7,r.width/2-14,r.height-14,16);layer.add(g);
  text(r.x+r.width/4,r.y+12,'Tắt',16,on?'#bdb7ad':'#472310',.5);text(r.x+r.width*3/4,r.y+12,'Bật',16,on?'#472310':'#bdb7ad',.5);
  const ornament=scene.add.graphics();ornament.lineStyle(1,0xb78347).lineBetween(84,527,159,527).lineBetween(201,527,276,527);ornament.fillStyle(0xb78347).fillCircle(180,527,3);layer.add(ornament);
  button('back','Quay lại',true,input.back,21);
  const layout={bounds:{x:12,y:34,width:336,height:578},titleY:114};
  scene.game.canvas.dataset.settingsPanel=JSON.stringify({layout,controls,effectsVolume:input.audio.effectsVolume,muted:input.audio.muted,reducedMotion:input.reducedMotion,motionEnabled:!input.reducedMotion,musicAvailable:false});
}
