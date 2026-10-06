import {TestCodePanel,type TestCodeActions} from '../presentation/TestCodePanel';
import {PlayAudio} from '../presentation/PlayAudio';
import {drawModalBackdrop} from '../presentation/ModalBackdrop';
import {drawSettingsPanel} from '../presentation/SettingsPanel';
import Phaser from 'phaser';
import { MenuPreferences } from '../presentation/MenuPreferences';
import { UI_THEME } from '../presentation/theme';
import { MenuAmbience } from '../presentation/MenuAmbience';
import { MenuWind } from '../presentation/MenuWind';
import { MenuSteam } from '../presentation/MenuSteam';
import type {CozySaveView} from '../runtime/CozyCampaignSession';
import {drawCompactNotification,drawNotificationFrame,drawNotificationClose,drawNotificationButton,preloadNotificationFrames,type NotificationLayout} from '../presentation/NotificationFrame';
import {modalText} from '../presentation/ModalText';

export const MAIN_MENU_BACKGROUND = { key: 'main-menu-background', url: 'assets/main-menu-background.png', type: 'image' as const };
type MenuActions = {testCode?:TestCodeActions;hasSession:()=>boolean;start:()=>void;continue:()=>void;initialize?:()=>void;save?:()=>CozySaveView;subscribe?:(listener:()=>void)=>()=>void;retryRead?:()=>void;retrySave?:()=>void;recover?:()=>void;temporary?:()=>void};
type MenuTarget = { id: string; x: number; y: number; width: number; height: number; disabled: boolean; visible:Phaser.Geom.Rectangle; action: () => void };
type Dialog = 'none' | 'settings' | 'new-session'|'loading'|'save-error'|'recovery';
const PAPER = 0xfff0d5, BROWN = 0x985025, SAGE = 0x738d50;


export class MainMenuScene extends Phaser.Scene {
  private interfaceLayer!: Phaser.GameObjects.Container;
  private focusRing!: Phaser.GameObjects.Graphics;
  private glow!: Phaser.GameObjects.Ellipse;
  private steam!: MenuSteam;
  private wind!: MenuWind;
  private targets: MenuTarget[] = [];
  private dialog: Dialog = 'none';
  private testCodePanel?:TestCodePanel;
  private focusId = '';
  private elapsed = 0;
  private unsubscribe?: () => void;
  private unsubscribeSave?:()=>void;
  private animationsRunning = false;
  private ambience!:MenuAmbience;
  private notification?:{layout:NotificationLayout;ids:string[];start:number;end:number;title:boolean};
  private notificationButtonLabel=false;
  private audioCleanupRegistered=false;

  constructor(private readonly preferences: MenuPreferences, private readonly actions: MenuActions,private readonly audio=new PlayAudio()) { super('MainMenuScene'); }
  preload():void{preloadNotificationFrames(this);}

  create(): void {
    if(!this.audioCleanupRegistered){this.audioCleanupRegistered=true;this.game.events.once(Phaser.Core.Events.DESTROY,()=>this.audio.destroy());}
    this.dialog = 'none'; this.focusId = ''; this.elapsed = 0;
    this.wind = new MenuWind(this, MAIN_MENU_BACKGROUND.key);
    this.glow = this.add.ellipse(278, 270, 70, 70, 0xffad42, .11).setBlendMode(Phaser.BlendModes.ADD);
    this.ambience=new MenuAmbience(this);
    this.steam = new MenuSteam(this);
    this.interfaceLayer = this.add.container().setDepth(5);
    this.focusRing = this.add.graphics().setDepth(20);
    this.unsubscribe = this.preferences.subscribe(this.preferenceChanged);
    document.addEventListener('visibilitychange', this.visibilityChanged);
    this.scale.on('resize', this.resized);
    this.input.keyboard?.on('keydown', this.keyDown);
    const canvas = this.game.canvas;
    canvas.setAttribute('tabindex', '0');
    canvas.dataset.screen = 'menu';
    canvas.dataset.booted = 'true';
    this.draw(true); this.refreshMotion();
    this.unsubscribeSave=this.actions.subscribe?.(()=>this.draw());
    this.actions.initialize?.();
    this.events.once('shutdown', this.cleanup);
    this.events.once('destroy', this.cleanup);
  }

  update(_time: number, delta: number): void {
    if (!this.animationsRunning) return;
    this.elapsed += Math.min(delta, 50);
    this.ambience.update(delta);
    this.glow.setAlpha(.10 + Math.sin(this.elapsed / 470) * .025 + Math.sin(this.elapsed / 177) * .014);
    this.steam.update(delta);
    this.wind.update(delta);
  }

  private cleanup = (): void => {
    this.testCodePanel?.destroy();this.testCodePanel=undefined;
    this.events.off('shutdown', this.cleanup);
    this.events.off('destroy', this.cleanup);
    this.unsubscribe?.(); this.unsubscribe = undefined;
    this.unsubscribeSave?.();this.unsubscribeSave=undefined;
    document.removeEventListener('visibilitychange', this.visibilityChanged);
    this.scale.off('resize', this.resized);
    this.input.keyboard?.off('keydown', this.keyDown);
    this.tweens.killAll(); this.animationsRunning = false; this.targets = [];
    this.steam.destroy(); this.wind.destroy();
    this.ambience.destroy();
    if (this.game.canvas.dataset.screen === 'menu') this.game.canvas.dataset.menuTargets = '[]';
  };
  private resized = (): void => { this.draw(); };
  private visibilityChanged = (): void => { this.refreshMotion(); };
  private preferenceChanged = (): void => { this.tweens.killAll(); this.draw(); this.refreshMotion(); };
  private refreshMotion(): void {
    this.animationsRunning = !document.hidden && !this.preferences.reducedMotion;
    this.ambience.setMotion(this.animationsRunning);
    this.glow.setAlpha(.10);
    this.steam.setMotion(this.animationsRunning);
    this.wind.setMotion(this.animationsRunning,this.preferences.reducedMotion);
    if (document.hidden) this.tweens.pauseAll(); else this.tweens.resumeAll();
    this.game.canvas.dataset.menuAnimations = document.hidden ? 'hidden' : this.preferences.reducedMotion ? 'reduced' : 'running';
    this.game.canvas.dataset.menuReducedMotion = String(this.preferences.reducedMotion);
    this.game.canvas.dataset.reducedMotion = String(this.preferences.reducedMotion);
  }

  private text(layer: Phaser.GameObjects.Container, x: number, y: number, value: string, size: number, color = '#985025', width?: number): Phaser.GameObjects.Text {
    if(this.notification&&!this.notificationButtonLabel){
      const n=this.notification;
      if(n.title){n.title=false;x=180;y=n.layout.titleY+10;size=Math.min(size,20);width=276;}
      else {y=this.notificationY(y);width=Math.min(width??284,284);}
    }
    const text = this.add.text(x, y, value, {
      fontFamily: UI_THEME.typography.fontFamily, fontSize: `${size}px`, fontStyle: 'bold', color,
      align: 'center', ...(width ? { wordWrap: { width, useAdvancedWrap: true } } : {}), padding: { top: 2, bottom: 2 },
    }).setOrigin(.5);
    layer.add(text); return text;
  }

  private draw(entrance = false): void {
    const save=this.actions.save?.();
    if(this.dialog!=='settings'&&this.dialog!=='new-session')this.dialog=save?.state==='loading'||save?.state==='saving'?'loading':save?.state==='error'?'save-error':save?.state==='recovery'?'recovery':'none';
    this.notification=undefined;this.game.canvas.dataset.settingsPanel='';this.game.canvas.dataset.modalBackdrop='';this.game.canvas.dataset.notificationFrame='';this.game.canvas.dataset.modalScroll='[]';
    this.tweens.killAll(); this.interfaceLayer.removeAll(true); this.targets = [];
    const titleTexts=[
      this.text(this.interfaceLayer,128,104,'Tiệm',34,'#4e6335'),
      this.text(this.interfaceLayer,220,104,'Pizza',34,'#c45b32'),
      this.text(this.interfaceLayer,180,148,'Ấm Áp',38,'#b66325'),
    ];
    // Rasterize the existing text once: Phaser 4's rotated Text batching can
    // clip glyphs. A single image rotates the complete lettering consistently.
    const titleKey='menu-sign-lettering';
    if(!this.textures.exists(titleKey)){
      const texture=this.textures.createCanvas(titleKey,300,150)!;
      for(const text of titleTexts)texture.context.drawImage(text.canvas,
        text.x-30-text.displayOriginX,text.y-55-text.displayOriginY);
      texture.refresh();
    }
    for(const text of titleTexts)text.setVisible(false);
    const titleImage=this.add.image(180,55,titleKey).setOrigin(.5,0);
    this.interfaceLayer.add(titleImage);
    this.wind.attachTitle(titleTexts,titleImage);
    const hasSession = this.actions.hasSession(), mainEnabled = this.dialog === 'none';
    const scale=(this.game.canvas.getBoundingClientRect().width||360)/360;
    // Six pixels of visible breathing room; enlarge the artwork only when a
    // short viewport needs extra logical space for separate 48 CSS px targets.
    const gap=6,height=Math.max(44,48.3/scale-gap),step=height+gap,top=625-3*height-2*gap;
    this.button('menu-start', 76, top, 208, height, 'Bắt đầu', 'play', SAGE, '#fff6df', mainEnabled,
      () => { if (this.actions.hasSession()) { this.dialog = 'new-session'; this.focusId = ''; this.draw(); } else this.actions.start(); }, entrance);
    this.button('menu-continue', 76, top+step, 208, height, 'Tiếp tục', 'continue', PAPER, '#985025', mainEnabled && hasSession,
      () => this.actions.continue(), entrance, hasSession ? save?.day?`Ngày ${save.day}`:undefined : 'Chưa có phiên đang chơi');
    this.button('menu-settings', 76, top+2*step, 208, height, 'Cài đặt', 'settings', 0xf5c6a5, '#985025', mainEnabled,
      () => { this.dialog = 'settings'; this.focusId = ''; this.draw(); }, entrance);
    if (this.dialog !== 'none') this.drawDialog();
    this.drawFocus(); this.publish();
  }

  private button(id: string, x: number, y: number, width: number, height: number, title: string, icon: 'play' | 'continue' | 'settings' | 'none', fill: number, color: string, enabled: boolean, action: () => void, entrance = false, subtitle?: string, textSize = 23): void {
    const footerIndex=this.notification?.ids.indexOf(id)??-1;
    if(footerIndex>=0)({x,y,width,height}=this.notification!.layout.footer[footerIndex]);
    else if(this.notification){y=this.notificationY(y);width=Math.min(width,284);x=Math.max(38,Math.min(322-width,x));}
    const container = this.add.container(x + width / 2, y + height / 2);
    this.interfaceLayer.add(container);
    const g = this.add.graphics(); container.add(g);
    if(footerIndex<0&&this.notification){
      drawNotificationButton(this,container,-width/2,-height/2,width,height);
      if(!enabled){const shade=this.add.graphics();shade.fillStyle(0x000000,.4).fillRoundedRect(-width/2,-height/2,width,height,height/2);container.add(shade);}
    }else if(footerIndex<0){
    g.fillStyle(0x623c22, .18).fillRoundedRect(-width / 2 + 1, -height / 2 + 4, width, height, height / 2);
    g.fillStyle(enabled ? fill : 0xd5c7ac).fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);
    g.lineStyle(2, enabled ? (fill === SAGE ? 0x536b36 : 0xc27c50) : 0xa99a80).strokeRoundedRect(-width / 2, -height / 2, width, height, height / 2);
    g.lineStyle(1, 0xfff8dc, .45).strokeRoundedRect(-width / 2 + 3, -height / 2 + 3, width - 6, height - 7, height / 2 - 3);
    }else if(!enabled)g.fillStyle(0x000000,.45).fillRoundedRect(-width/2,-height/2,width,height,height/2);
    this.icon(g, icon, -width / 2 + (id.startsWith('menu-') && ['menu-start','menu-continue','menu-settings'].includes(id) ? 38 : 51), icon === 'continue' ? 0 : subtitle ? -4 : 0, enabled ? color : '#786b54');
    this.notificationButtonLabel=true;
    const label=this.text(container, icon === 'none' ? 0 : 15, subtitle ? -7 : 0, title, footerIndex>=0?16:subtitle?21:textSize, this.notification?enabled?'#fff0d5':'#a9a29a':enabled ? color : '#786b54',width-16);
    if(label.height>height-8)label.setScale((height-8)/label.height);
    if (subtitle) this.text(container, 14, 13, subtitle, 10, '#655c4e');
    this.notificationButtonLabel=false;
    const scale = (this.game.canvas.getBoundingClientRect().width || 360) / 360;
    const hitWidth = Math.max(width, 48.1 / scale), hitHeight = Math.max(height, 48.1 / scale);
    const target: MenuTarget = { id, x: Math.max(0,Math.min(360-hitWidth,x-(hitWidth-width)/2)), y: Math.max(0,Math.min(640-hitHeight,y-(hitHeight-height)/2)), width: hitWidth, height: hitHeight, disabled: !enabled, visible:new Phaser.Geom.Rectangle(x,y,width,height), action };
    this.targets.push(target);
    if(id==='menu-new-cancel'){
      const close=drawNotificationClose(this,this.interfaceLayer,this.notification!.layout)!;
      const size=Math.max(close.width,48.1/scale),cx=close.x+close.width/2,cy=close.y+close.height/2;
      const closeTarget:MenuTarget={id:'notification-close',x:cx-size/2,y:cy-size/2,width:size,height:size,disabled:!enabled,visible:new Phaser.Geom.Rectangle(close.x,close.y,close.width,close.height),action};
      this.targets.push(closeTarget);
      const closeZone=this.add.zone(closeTarget.x,closeTarget.y,size,size).setOrigin(0).setInteractive({useHandCursor:true});this.interfaceLayer.add(closeZone);
      closeZone.on('pointerdown',()=>{if(enabled)action();});
    }
    if (enabled) {
      const zone = this.add.zone(target.x, target.y, target.width, target.height).setOrigin(0).setInteractive({ useHandCursor: true });
      // Zones are siblings so entrance/press motion never moves the touch target.
      this.interfaceLayer.add(zone);
      zone.on('pointerdown', (pointer:Phaser.Input.Pointer) => {
        const chosen=this.targets.find(item=>!item.disabled&&item.visible.contains(pointer.x,pointer.y))??target;
        this.focusId = chosen.id; this.drawFocus(); if (!this.preferences.reducedMotion) container.setAlpha(.85); chosen.action();
      });
      zone.on('pointerup', () => { if (container.active) container.setAlpha(1); });
      zone.on('pointerout', () => { if (container.active) container.setAlpha(1); });
    }
    if (entrance && !this.preferences.reducedMotion && !document.hidden) {
      container.setAlpha(0).setY(y + height / 2 + 7);
      this.tweens.add({ targets: container, alpha: 1, y: y + height / 2, duration: 360, delay: Math.max(0,(y - 455) * 1.3), ease: 'Sine.easeOut' });
    }
  }

  private icon(g: Phaser.GameObjects.Graphics, icon: 'play' | 'continue' | 'settings' | 'none', x: number, y: number, color: string): void {
    const tint = Phaser.Display.Color.HexStringToColor(color).color;
    g.fillStyle(tint, 1); g.lineStyle(3, tint, 1);
    if (icon === 'play') g.fillTriangle(x - 6, y - 10, x - 6, y + 10, x + 10, y);
    else if (icon === 'continue') {
      // Balanced resume chevrons, centered independently of the status caption.
      g.beginPath().moveTo(x - 8, y - 9).lineTo(x - 1, y).lineTo(x - 8, y + 9)
        .moveTo(x + 1, y - 9).lineTo(x + 8, y).lineTo(x + 1, y + 9).strokePath();
    } else if (icon === 'settings') {
      for (let i = 0; i < 8; i++) { const angle = i * Math.PI / 4; g.lineBetween(x + Math.cos(angle) * 8, y + Math.sin(angle) * 8, x + Math.cos(angle) * 13, y + Math.sin(angle) * 13); }
      g.strokeCircle(x, y, 9); g.fillCircle(x, y, 3);
    }
  }

  private drawDialog(): void {
    for(const object of this.interfaceLayer.list)if(object instanceof Phaser.GameObjects.Zone)object.disableInteractive();
    // Remove all old targets before registering dialog controls, including disabled menu targets.
    this.targets=[];
    if(this.testCodePanel){this.testCodePanel.draw(this,this.interfaceLayer,(id,rect,enabled,action)=>this.settingsTarget(id,rect,enabled,action));return;}
    drawModalBackdrop(this,this.interfaceLayer);
    if(this.dialog==='settings'){
      const ids={music:'menu-music','effects-less':'menu-effects-less',mute:'menu-mute','effects-more':'menu-effects-more',motion:'menu-motion',code:'menu-code',back:'menu-settings-close'};
      drawSettingsPanel(this,this.interfaceLayer,{audio:this.audio,preferences:this.preferences,reducedMotion:this.preferences.reducedMotion,changed:()=>this.draw(),code:()=>{this.testCodePanel=new TestCodePanel(this.game.canvas,this.actions.testCode,()=>this.draw(),()=>{this.testCodePanel?.destroy();this.testCodePanel=undefined;this.focusId='menu-code';this.draw();});},back:()=>{this.dialog='none';this.focusId='menu-settings';},register:(action,rect,enabled,callback)=>this.settingsTarget(ids[action],rect,enabled,callback)});return;
    }
    const save=this.actions.save?.();
    const ids=this.dialog==='new-session'?['menu-new-confirm','menu-new-cancel']:this.dialog==='recovery'?['menu-recover-confirm','menu-retry-read']:[save?.canRetry?'menu-save-retry':'menu-retry-read'];
    if(this.dialog==='loading'){
      const scale=Math.max(1,Math.min(2,parseFloat(getComputedStyle(document.documentElement).fontSize)/16));
      const layout=drawCompactNotification(this,this.interfaceLayer,'Tiến độ chiến dịch',save?.message??'Đang tải tiến độ…',14,scale);
      this.notification={layout,ids,start:layout.body.y,end:layout.body.y+layout.body.height,title:false};
      this.button(ids[0],0,0,0,0,'Đang tải…','none',SAGE,'#fff6df',false,()=>{},false,undefined,16);return;
    }
    this.notification={layout:drawNotificationFrame(this,this.interfaceLayer,ids.length===2?'two':'one',100,440),ids,start:281,end:535,title:true};
    if(['save-error','recovery'].includes(this.dialog)){
      const save=this.actions.save!();
      this.text(this.interfaceLayer,180,213,this.dialog==='recovery'?'Khôi phục cùng mốc':'Chưa mở được tiến độ',23);
      this.dialogText(save.message,95);
      if(this.dialog==='recovery'){
        this.button('menu-recover-confirm',48,372,264,48,'Dùng bản cùng mốc', 'none',SAGE,'#fff6df',true,()=>this.actions.recover?.(),false,undefined,18);
        this.button('menu-retry-read',48,435,264,48,'Đọc lại','none',0xf5c6a5,'#985025',true,()=>this.actions.retryRead?.(),false,undefined,18);return;
      }
      this.button(save.canRetry?'menu-save-retry':'menu-retry-read',48,358,264,48,save.canRetry?'Thử lưu lại':'Thử đọc lại','none',SAGE,'#fff6df',true,()=>save.canRetry?this.actions.retrySave?.():this.actions.retryRead?.(),false,undefined,18);
      if(save.canTemporary)this.button('menu-play-temporary',48,418,264,48,'Chơi tạm không lưu','none',0xf5c6a5,'#985025',true,()=>this.actions.temporary?.(),false,undefined,18);
      if(!save.pending)this.button('menu-error-new',48,478,264,48,'Chiến dịch mới','none',0xf5c6a5,'#985025',true,()=>{this.dialog='new-session';this.draw();},false,undefined,18);
      else if(save.canReload)this.button('menu-load-latest',48,418,264,48,'Tải bản mới nhất','none',0xf5c6a5,'#985025',true,()=>this.actions.retryRead?.(),false,undefined,18);
      return;
    }
    this.text(this.interfaceLayer,180,251,'Chiến dịch mới?',24);
    this.dialogText('Thay tiến độ hiện tại bằng Ngày 1.\nCác ngày cũ không thể mở lại.',160);
    this.button('menu-new-confirm',48,321,264,48,'Bắt đầu mới','none',SAGE,'#fff6df',true,()=>{this.dialog='none';this.actions.start();});
    this.button('menu-new-cancel',84,383,192,48,'Hủy','none',0xf5c6a5,'#985025',true,()=>{this.dialog='none';this.focusId='menu-start';this.draw();});
  }
  private settingsTarget(id:string,rect:{x:number;y:number;width:number;height:number},enabled:boolean,action:()=>void):void{
    const bounds=this.game.canvas.getBoundingClientRect(),scale=Math.min((bounds.width||360)/360,(bounds.height||640)/640);
    const width=Math.max(rect.width,Math.ceil(48/scale)),height=Math.max(rect.height,Math.ceil(48/scale));
    const target:MenuTarget={id,x:Math.max(0,Math.min(360-width,rect.x-(width-rect.width)/2)),y:Math.max(0,Math.min(640-height,rect.y-(height-rect.height)/2)),width,height,disabled:!enabled,visible:new Phaser.Geom.Rectangle(rect.x,rect.y,rect.width,rect.height),action};
    this.targets.push(target);
    if(!enabled)return;
    const zone=this.add.zone(target.x,target.y,width,height).setOrigin(0).setInteractive({useHandCursor:true});this.interfaceLayer.add(zone);
    zone.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{
      const chosen=this.targets.find(item=>!item.disabled&&item.visible.contains(pointer.x,pointer.y))??target;
      this.focusId=chosen.id;chosen.action();void this.audio.interact().then(()=>this.audio.cue());
    });
  }
  private notificationY(y:number):number{const n=this.notification!;return n.layout.body.y+Math.max(0,Math.min(1,(y-n.start)/(n.end-n.start)))*n.layout.body.height;}
  private dialogText(value:string,height:number):void{
    const body=this.notification!.layout.body,scale=Math.max(1,Math.min(2,parseFloat(getComputedStyle(document.documentElement).fontSize)/16));
    modalText(this,this.interfaceLayer,body.x,body.y,body.width,Math.min(height,body.height),value,14,'#70583b',scale);
  }

  private keyDown = (event: KeyboardEvent): void => {
    if(document.activeElement!==this.game.canvas)return;
    if(this.testCodePanel)return;
    if (event.key === 'Escape' && this.dialog !== 'none') { event.preventDefault(); this.dialog = 'none'; this.focusId = ''; this.draw(); return; }
    const enabled = this.targets.filter(target => !target.disabled);
    if (!enabled.length) return;
    if (event.key === 'Tab' || event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      const current = enabled.findIndex(target => target.id === this.focusId);
      const direction = event.key === 'ArrowUp' || event.shiftKey ? -1 : 1;
      if(event.key==='Tab'&&current>=0&&(current+direction<0||current+direction>=enabled.length)){
        this.focusId='';this.drawFocus();return;
      }
      event.preventDefault();
      this.focusId = enabled[current === -1 ? direction === 1 ? 0 : enabled.length - 1 : (current + direction + enabled.length) % enabled.length].id;
      this.drawFocus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      const target = enabled.find(item => item.id === this.focusId);
      if (target) { event.preventDefault(); target.action(); void this.audio.interact().then(()=>this.audio.cue()); }
    }
  };
  private drawFocus(): void {
    this.focusRing.clear();
    const target = this.targets.find(item => item.id === this.focusId && !item.disabled);
    if (target) this.focusRing.lineStyle(3, BROWN).strokeRoundedRect(target.x - 3, target.y - 3, target.width + 6, target.height + 6, 27);
  }
  private publish(): void {
    const canvas = this.game.canvas;
    canvas.dataset.menuDialog = this.dialog;
    if(this.actions.save)canvas.dataset.saveState=JSON.stringify(this.actions.save());
    canvas.dataset.menuHasSession = String(this.actions.hasSession());
    canvas.dataset.menuReducedMotion = String(this.preferences.reducedMotion);
    canvas.dataset.menuTargets = JSON.stringify(this.targets.map(({ action: _action, visible:_visible, ...geometry }) => geometry));
    canvas.dataset.controls = JSON.stringify(this.targets.map(({ action: _action, visible:_visible, disabled, ...geometry }) => ({ ...geometry, enabled: !disabled })));
    const labels: Phaser.GameObjects.Text[] = [];
    const collect = (container: Phaser.GameObjects.Container): void => {
      for (const item of container.list) {
        if (item instanceof Phaser.GameObjects.Text) labels.push(item);
        else if (item instanceof Phaser.GameObjects.Container) collect(item);
      }
    };
    collect(this.interfaceLayer);
    canvas.dataset.labels = JSON.stringify(labels.map(text => {
      const bounds = text.getBounds();
      return { text: text.text, x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height,
        font: text.style.fontFamily, size: text.style.fontSize, spacing: text.letterSpacing, color: text.style.color };
    }));
    canvas.setAttribute('aria-label', `Tiệm Pizza Ấm Áp. ${this.dialog === 'settings' ? `Cài đặt. Giảm chuyển động ${this.preferences.reducedMotion ? 'bật' : 'tắt'}.` : this.dialog === 'new-session' ? 'Xác nhận bắt đầu phiên mới. Phiên đang chơi sẽ được thay thế.' : `Bắt đầu. ${this.actions.hasSession() ? 'Tiếp tục phiên đang chơi.' : 'Tiếp tục chưa khả dụng vì chưa có phiên đang chơi.'} Cài đặt.`}`);
  }
}
