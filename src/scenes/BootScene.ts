import Phaser from 'phaser';
import { DemoGame, ingredients, recipes, validateCampaign, type Campaign, type Command } from '../domain/demo';
import { loadCheckpoint, resetCheckpoint, saveCheckpoint } from '../infrastructure/checkpoints';
import { PlayAudio } from '../presentation/PlayAudio';
import { PlayLifecycle } from '../runtime/PlayLifecycle';
import { BrowserPlayLifecycle } from '../infrastructure/BrowserPlayLifecycle';
import { timerText } from '../presentation/PlayHud';
import { modalText } from '../presentation/ModalText';
import {drawCompactNotification,drawNotificationFrame,drawNotificationClose,preloadNotificationFrames,type NotificationLayout} from '../presentation/NotificationFrame';

const C = { bg: 0xf2f4f2, ink: '#202829', muted: '#536560', red: 0xb9362b, green: 0x27664e, line: 0xd3dcd6 };
const kinds: Record<string, string> = { regular: 'Khách quen', picky: 'Khó tính', bargain: 'Mặc cả', hurry: 'Đi làm sớm' };

export const COZY_ASSETS = {
  background: 'assets/background-kitchen.png',
  topBar: 'assets/top-bar.png',
  customerCard: 'assets/customer-card.png',
  pizza: 'assets/pizza-cheese.png',
  dough: 'assets/dough.png',
  sauce: 'assets/tomato-sauce.png',
  cheese: 'assets/cheese.png',
  bakeButton: 'assets/btn-bake.png',
  boxButton: 'assets/btn-box.png',
  deliverButton: 'assets/btn-deliver.png',
} as const;

export function preloadCozyAssets(scene: Phaser.Scene): void {
  for (const [name, path] of Object.entries(COZY_ASSETS)) {
    const key = `cozy-${name}`;
    if (!scene.textures.exists(key)) scene.load.image(key, path);
  }
}

export class BootScene extends Phaser.Scene {
  private model = new DemoGame();
  private layer!: Phaser.GameObjects.Container;
  private reasons = new Set<string>();
  private screen = 'loading';
  private revision = 0;
  private hasSave = false;
  private busy = false;
  private error = '';
  private confirmText = '';
  private confirmAction: (() => void) | null = null;
  private pending: Campaign | null = null;
  private accumulator = 0;
  private drawn = 0;
  private lifecycle!:PlayLifecycle;
  private readonly clockListeners=new Set<(phase:"before"|"after")=>void>();
  private clockBoundary(phase:"before"|"after"){for(const listener of this.clockListeners)listener(phase);}
  private setPause(reason:string,paused:boolean){this.clockBoundary("before");if(paused)this.reasons.add(reason);else this.reasons.delete(reason);this.accumulator=0;this.clockBoundary("after");}
  private setBusy(value:boolean){this.clockBoundary("before");this.busy=value;this.accumulator=0;this.clockBoundary("after");}
  private get clockRunning(){return this.screen==="game"&&this.model.state.phase==="shop"&&!this.busy&&!this.reasons.size&&!this.model.state.offer&&!this.confirmAction;}
  private advanceElapsed(delta:number){if(!Number.isFinite(delta)||delta<=0)return;this.accumulator+=delta;while(this.accumulator>=50&&this.clockRunning){this.accumulator-=50;this.model.tick(.05);}if(!this.clockRunning)this.accumulator=0;}
  private browserLifecycle!:BrowserPlayLifecycle;
  private targets: { x: number; y: number; w: number; h: number; action: () => void }[] = [];
  constructor(private readonly audio=new PlayAudio()) { super('BootScene'); }
  preload():void{preloadNotificationFrames(this);}
  // Campaign renders with Graphics/Text; legacy raster art is optional and is not downloaded.
  create() {
    this.layer = this.add.container(0, 0);
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const hit = [...this.targets].reverse().find(t => pointer.x >= t.x && pointer.x <= t.x + t.w && pointer.y >= t.y && pointer.y <= t.y + t.h);
      if (hit && !this.busy) { hit.action();void this.audio.interact().then(()=>{this.audio.cue();this.render();}); }
    });
    this.cameras.main.setBackgroundColor(C.bg);
    const scene=this;
    this.lifecycle=new PlayLifecycle({get simulationActive(){return scene.clockRunning;},get pauses(){return [...scene.reasons];},advanceElapsed:delta=>this.advanceElapsed(delta),subscribeTimeBoundary:listener=>{this.clockListeners.add(listener);return ()=>this.clockListeners.delete(listener);}});
    this.browserLifecycle=new BrowserPlayLifecycle(this.lifecycle,()=>{this.audio.silence();this.render();});
    const unload = (e: BeforeUnloadEvent) => {
      if (this.screen === 'game' && this.model.state.phase !== 'end') { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', unload);
    this.events.once('shutdown', () => {
      this.browserLifecycle.destroy();
      window.removeEventListener('beforeunload', unload);
      this.audio.silence();
    });
    document.documentElement.dataset.booted = 'true';
    this.game.canvas.dataset.booted = 'true';
    void this.loadSaved();
  }
  private async loadSaved() {
    this.screen = 'loading'; this.render();
    try {
      const checkpoint = await loadCheckpoint();
      if (checkpoint) {
        try { this.model = new DemoGame(validateCampaign(checkpoint.data)); }
        catch { throw new Error('Dữ liệu chiến dịch bị hỏng. Bản lưu được giữ nguyên; hãy thử đọc lại hoặc xác nhận mở quán mới.'); }
        this.revision = checkpoint.revision;
      }
      this.hasSave = !!checkpoint; this.screen = 'start'; this.error = '';
    } catch (e) { this.screen = 'error'; this.error = this.describe(e); }
    this.render();
  }
  private describe(e: unknown) { return e instanceof Error ? e.message : 'Không thể lưu dữ liệu. Hãy thử lại.'; }
  private async startNew() {
    if (this.busy) return;
    this.setBusy(true); this.error = ''; this.render();
    try {
      const fresh = new DemoGame(); this.revision = await resetCheckpoint(fresh.snapshot());
      this.model = fresh; this.pending = null; this.hasSave = true; this.screen = 'game'; this.setPause('tutorial',true);
    } catch (e) { this.error = this.describe(e); }
    this.setBusy(false); this.render();
  }
  private async nextDay() {
    if (this.busy) return;
    this.setBusy(true); this.error = ''; this.pending ??= this.model.nextDayCheckpoint(); this.render();
    try {
      this.revision = await saveCheckpoint(this.pending, this.revision);
      this.model = new DemoGame(this.pending); this.pending = null;
    } catch (e) { this.error = this.describe(e); }
    this.setBusy(false); this.render();
  }
  private command(c: Command) {this.clockBoundary('before');try{const result = this.model.dispatch(c); this.error = result.ok ? '' : result.message ?? ''; this.render();}finally{this.clockBoundary('after');} }
  private ask(text: string, action: () => void) { this.confirmText = text; this.confirmAction = action; this.setPause('confirm',true); this.render(); }
  private text(x: number, y: number, value: string, size = 16, color = C.ink, width = 340) {
    const t = this.add.text(x, y, value, { fontFamily: 'Arial, sans-serif', fontSize: `${size}px`, color, wordWrap: { width }, lineSpacing: 3 });
    this.layer.add(t); return t;
  }
  private rect(x: number, y: number, w: number, h: number, color: number, alpha = 1) {
    const r = this.add.rectangle(x, y, w, h, color, alpha).setOrigin(0); this.layer.add(r); return r;
  }
  private roundRect(x: number, y: number, w: number, h: number, radius: number, color: number, alpha = 1) {
    const g = this.add.graphics(); g.fillStyle(color, alpha); g.fillRoundedRect(x, y, w, h, radius); this.layer.add(g); return g;
  }
  private circle(x: number, y: number, radius: number, color: number, alpha = 1) {
    const g = this.add.graphics(); g.fillStyle(color, alpha); g.fillCircle(x, y, radius); this.layer.add(g); return g;
  }
  private avatar(x: number, y: number, radius: number, variant: number) {
    const g = this.add.graphics();
    const skins = [0xf2bf9d, 0xf0c6a8, 0xdca47e];
    const hairs = [0x35231d, 0x70412c, 0x44302a];
    const shirts = [0x477554, 0xd78883, 0x54738a];
    g.fillStyle(0x000000, .14).fillEllipse(x, y + radius * .85, radius * 1.8, radius * .65);
    g.fillStyle(shirts[variant % shirts.length]).fillEllipse(x, y + radius * .74, radius * 1.7, radius * 1.1);
    g.fillStyle(hairs[variant % hairs.length]).fillCircle(x, y, radius * .78);
    g.fillStyle(skins[variant % skins.length]).fillEllipse(x, y + radius * .08, radius * 1.1, radius * 1.25);
    g.fillStyle(hairs[variant % hairs.length]).fillEllipse(x, y - radius * .44, radius * 1.48, radius * .7);
    g.fillStyle(0x29201c).fillCircle(x - radius * .24, y + radius * .1, Math.max(1, radius * .07));
    g.fillStyle(0x29201c).fillCircle(x + radius * .24, y + radius * .1, Math.max(1, radius * .07));
    g.fillStyle(0xb8544c).fillEllipse(x, y + radius * .38, radius * .25, radius * .13);
    this.layer.add(g);
  }
  private ingredientIcon(id: string, x: number, y: number, size: number) {
    const g = this.add.graphics();
    const item = ingredients.find(i => i.id === id);
    const color = item?.color ?? 0xcbbda8;
    if (id === 'dough') {
      g.fillStyle(0xc98b43).fillCircle(x, y + 1, size);
      g.fillStyle(0xf6d99d).fillCircle(x, y - 1, size * .78);
      g.fillStyle(0xffedc7).fillCircle(x, y - 2, size * .58);
    } else if (id === 'sauce') {
      g.fillStyle(0xb9362b).fillRoundedRect(x - size * .52, y - size * .65, size * 1.04, size * 1.48, 4);
      g.fillStyle(0xe8cbaa).fillRoundedRect(x - size * .22, y - size * .94, size * .44, size * .35, 2);
      g.fillStyle(0xf1d497).fillRoundedRect(x - size * .31, y - size * .02, size * .62, size * .38, 2);
    } else if (id === 'cheese') {
      g.fillStyle(0xd5a33a).fillTriangle(x - size, y + size * .55, x + size, y + size * .55, x - size * .48, y - size * .85);
      g.fillStyle(0xffe189).fillTriangle(x - size * .72, y + size * .36, x + size * .62, y + size * .36, x - size * .35, y - size * .6);
      g.fillStyle(0xe4b747).fillCircle(x + size * .12, y + size * .05, size * .12);
    } else if (id === 'mushroom') {
      g.fillStyle(0xf2e5d5).fillRoundedRect(x - size * .23, y - size * .02, size * .46, size * .82, 3);
      g.fillStyle(0xb99476).fillEllipse(x, y - size * .12, size * 1.65, size * .92);
      g.fillStyle(0xe8d4bd).fillEllipse(x, y - size * .15, size * 1.28, size * .55);
    } else if (id === 'sausage') {
      for (const [dx, dy] of [[-.42, -.28], [.4, -.35], [-.12, .38]] as const) {
        g.fillStyle(0x994344).fillCircle(x + dx * size, y + dy * size, size * .55);
        g.fillStyle(0xe17b69).fillCircle(x + dx * size - 1, y + dy * size - 1, size * .37);
      }
    } else {
      g.fillStyle(color).fillCircle(x, y, size);
    }
    this.layer.add(g);
  }
  private lockedIcon(x: number, y: number) {
    const g = this.add.graphics();
    g.lineStyle(2, 0xa69b8f).strokeCircle(x, y - 3, 5);
    g.fillStyle(0xa69b8f).fillRoundedRect(x - 7, y - 3, 14, 11, 2);
    this.layer.add(g);
  }
  private trashIcon(x: number, y: number) {
    const g = this.add.graphics();
    g.fillStyle(0xe8ddd0).fillRoundedRect(x - 6, y - 5, 12, 14, 2);
    g.fillStyle(0xe8ddd0).fillRoundedRect(x - 8, y - 8, 16, 2, 1);
    g.fillStyle(0xe8ddd0).fillRoundedRect(x - 3, y - 11, 6, 2, 1);
    g.lineStyle(1, 0x72574b).lineBetween(x - 2, y - 2, x - 2, y + 6);
    g.lineStyle(1, 0x72574b).lineBetween(x + 2, y - 2, x + 2, y + 6);
    this.layer.add(g);
  }
  private shopBackdrop() {
    this.rect(0, 0, 360, 640, 0x70402c);
    const g = this.add.graphics();
    for (let y = 0; y < 640; y += 44) {
      g.fillStyle(y % 88 === 0 ? 0x794831 : 0x70402c, .72).fillRect(0, y, 360, 43);
      g.lineStyle(1, 0x4d2d22, .55).lineBetween(0, y + 43, 360, y + 43);
      for (const x of [42, 158, 287]) g.lineStyle(1, 0x4d2d22, .3).lineBetween(x + (y % 88 ? 54 : 0), y + 8, x + (y % 88 ? 54 : 0), y + 37);
    }
    this.layer.add(g);
    this.rect(0, 48, 360, 2, 0x3e211b);
    const awning = this.add.graphics();
    for (let i = 0; i < 12; i++) {
      awning.fillStyle(i % 2 ? 0xffebd4 : 0xe74c40).fillRoundedRect(i * 30, 49, 30, 13, 7);
    }
    this.layer.add(awning);
  }
  private button(x: number, y: number, w: number, label: string, action: () => void, enabled = true, color = C.red) {
    this.rect(x, y, w, 48, enabled ? color : 0x77847e);
    const t = this.text(x + 4, y + 8, label, 14, '#ffffff', w - 8).setAlign('center');
    t.setFixedSize(w - 8, 40);
    if (enabled && !this.busy) this.targets.push({ x, y, w, h: 48, action });
  }
  private pizza(x: number, y: number, radius: number, items: string[], burnt = false) {
    const g = this.add.graphics(); this.layer.add(g);
    g.fillStyle(0x3b2119, .25).fillEllipse(x + 2, y + radius * .12, radius * 2.08, radius * 1.95);
    g.fillStyle(burnt ? 0x633931 : 0xb97a38).fillCircle(x, y, radius);
    g.fillStyle(burnt ? 0x79483a : 0xeebd6c).fillCircle(x, y - 1, radius * .91);
    g.fillStyle(burnt ? 0x97603b : 0xf5dda7).fillCircle(x, y - 2, radius * .78);
    if (items.includes('sauce')) { g.fillStyle(0xb9362b).fillCircle(x, y - 2, radius * .7); }
    if (items.includes('cheese')) { g.fillStyle(burnt ? 0x97603b : 0xf4cf59).fillCircle(x, y - 3, radius * .59); }
    for (let i = 0; i < 7; i++) {
      const angle = i * 2.4, d = radius * .43;
      if (items.includes('sausage')) {
        g.fillStyle(0x8f403c).fillCircle(x + Math.cos(angle) * d, y + Math.sin(angle) * d, radius * .105);
        g.fillStyle(0xd96e61).fillCircle(x + Math.cos(angle) * d, y + Math.sin(angle) * d, radius * .073);
      }
      if (items.includes('mushroom')) {
        g.fillStyle(0xe7d4be).fillEllipse(x + Math.cos(angle + 1) * d, y + Math.sin(angle + 1) * d, radius * .22, radius * .13);
        g.fillStyle(0x9a7257).fillEllipse(x + Math.cos(angle + 1) * d, y + Math.sin(angle + 1) * d - radius * .03, radius * .18, radius * .09);
      }
    }
    if (items.includes('cheese')) for (let i = 0; i < 9; i++) {
      const angle = i * 2.4, d = radius * .28;
      g.fillStyle(0xffe88d, .9).fillCircle(x + Math.cos(angle) * d, y + Math.sin(angle) * d, radius * .025);
    }
  }
  private header() {
    const s = this.model.state;
    this.rect(0, 0, 360, 57, 0xffffff);
    this.text(10, 6, `Ngày ${s.day}/3  ·  ${s.cash} xu`, 18);
    this.text(10, 31, `XP ${s.xp}   Uy tín ${s.reputation}`, 13, C.muted);
    this.button(248, 4, 48, this.audio.muted ? 'Âm tắt' : 'Âm bật', () => { this.audio.toggleMute(); this.render(); }, true, C.green);
    this.button(304, 4, 48, 'Ⅱ', () => { this.setPause('user',true); this.render(); }, true, C.green);
  }
  private shopHeader() {
    const s = this.model.state;
    this.rect(0, 0, 360, 49, 0x55251f);
    this.rect(0, 43, 360, 6, 0x3e211b);
    for (let y = 7; y < 43; y += 18) this.rect(0, y, 360, 1, 0x71382f, .6);
    this.button(4, 0, 48, 'Ⅱ', () => { this.setPause('user',true); this.render(); }, true, 0x9e433b);
    this.button(54, 0, 48, this.audio.muted ? 'Âm tắt' : 'Âm bật', () => { this.audio.toggleMute(); this.render(); }, true, 0x72362e);
    const day = this.text(111, 1, `Ngày ${s.day}`, 19, '#fff1df', 132).setAlign('center').setFixedSize(132, 24);
    day.setFontStyle('bold');
    const remaining = Math.max(0, Math.ceil(s.duration - s.time));
    this.text(128, 25, `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`, 13, '#f8d5ab', 98).setAlign('center').setFixedSize(98, 18);
    this.roundRect(239, 6, 115, 37, 18, 0x3d1d19);
    this.circle(257, 24, 12, 0xf3b83c);
    this.circle(257, 24, 8, 0xffdd65);
    this.text(252, 15, '$', 14, '#a75a1f', 11).setAlign('center').setFixedSize(11, 17).setFontStyle('bold');
    this.text(272, 12, `${s.cash} xu`, 14, '#ffe171', 76).setAlign('center').setFixedSize(76, 20).setFontStyle('bold');
  }
  private titleScreen() {
    this.shopBackdrop();
    this.roundRect(3, 183, 81, 125, 12, 0x352722);
    this.roundRect(7, 187, 73, 117, 9, 0x514039);
    this.text(13, 197, 'PIZZA', 12, '#f4d3a5', 60).setAlign('center').setFixedSize(60, 17).setFontStyle('bold');
    this.pizza(44, 255, 17, ['dough', 'sauce', 'cheese']);
    this.roundRect(271, 198, 87, 165, 39, 0x8b3925);
    this.roundRect(280, 206, 70, 151, 32, 0xd35625);
    this.roundRect(289, 219, 52, 126, 24, 0xf0822e);
    this.circle(315, 281, 23, 0xffb247, .65);
    this.roundRect(91, 69, 178, 102, 23, 0x47251d);
    this.roundRect(96, 73, 168, 92, 21, 0x70402b);
    this.roundRect(102, 79, 156, 80, 17, 0x834b31);
    this.text(107, 81, 'TIỆM', 29, '#fff0d9', 146).setAlign('center').setFixedSize(146, 34).setFontStyle('bold');
    this.text(101, 112, 'PIZZA', 32, '#ff7043', 158).setAlign('center').setFixedSize(158, 38).setFontStyle('bold');
    this.circle(250, 101, 22, 0xf3c05a);
    this.circle(250, 101, 17, 0xffe19a);
    this.circle(244, 95, 3, 0xc94b37);
    this.circle(256, 106, 3, 0xc94b37);
    this.circle(249, 109, 2, 0x58834d);
    this.rect(0, 375, 360, 79, 0x75432d);
    for (let plank = 0; plank < 4; plank++) {
      this.rect(0, 378 + plank * 18, 360, 2, 0x4d2c22, .7);
      this.rect(0, 380 + plank * 18, 360, 1, 0xb07043, .55);
    }
    this.rect(0, 448, 360, 192, 0x4f2d24);
    this.roundRect(8, 451, 344, 8, 4, 0x9b5c38);
    this.avatar(179, 285, 44, 0);
    this.roundRect(148, 225, 62, 20, 10, 0xfff0dd);
    this.circle(160, 223, 11, 0xfff0dd);
    this.circle(176, 218, 13, 0xfff0dd);
    this.circle(193, 223, 11, 0xfff0dd);
    this.roundRect(157, 232, 46, 11, 4, 0xfff0dd);
    this.roundRect(143, 320, 73, 56, 15, 0xf4e4cd);
    this.roundRect(169, 323, 18, 48, 8, 0xb83d31);
    this.pizza(180, 386, 54, ['dough', 'sauce', 'cheese', 'sausage', 'mushroom']);
    this.roundRect(4, 398, 42, 55, 10, 0xe45a4c);
    this.rect(5, 425, 40, 8, 0xffd1b4);
    this.rect(5, 441, 40, 8, 0xffd1b4);
    const titleButton = (y: number, label: string, action: () => void, fill: number, ink = '#ffffff') => {
      this.roundRect(48, y + 4, 264, 49, 22, 0x3b211a, .8);
      this.roundRect(48, y, 264, 48, 22, fill);
      this.roundRect(52, y + 3, 256, 39, 18, fill === 0x36b956 ? 0x47cf63 : fill === 0xf4b82f ? 0xffd44e : 0x8b5137);
      this.text(61, y + 10, label, 19, ink, 238).setAlign('center').setFixedSize(238, 25).setFontStyle('bold');
      if (!this.busy) this.targets.push({ x: 48, y, w: 264, h: 48, action });
    };
    if (this.screen === 'error') titleButton(466, 'Thử đọc bản lưu lại', () => { void this.loadSaved(); }, 0x36b956);
    else titleButton(466, this.hasSave ? 'Mở quán mới' : 'Bắt đầu', () => this.hasSave ? this.ask('Xóa chiến dịch đang lưu và mở quán mới?', () => { void this.startNew(); }) : void this.startNew(), 0x36b956);
    if (this.hasSave && this.screen !== 'error') titleButton(519, `Tiếp tục · Ngày ${this.model.state.day}`, () => { this.screen = 'game'; this.render(); }, 0xf4b82f, '#633719');
    this.text(28, 582, this.error || 'BA NGÀY MỞ QUÁN · MỘT TIỆM PIZZA', 10, this.error ? '#ffd0c2' : '#f3d6b9', 304).setAlign('center').setFixedSize(304, 16);
  }
  private render() {
    if (!this.layer) return;
    this.game.canvas.setAttribute('aria-label', `Tiệm pizza: ${this.screen}, ${this.model.state.phase}, ngày ${this.model.state.day}. ${this.model.state.message} ${this.error}`);
    this.game.canvas.dataset.paused = [...this.reasons].join(',');
    this.game.canvas.dataset.oven = this.model.state.pizza?.stage === 'baking' ? String(Math.floor(this.model.state.pizza.elapsed)) : '';
    this.game.canvas.dataset.offer = this.model.state.offer?.id ?? '';
    this.game.canvas.dataset.tickets = JSON.stringify(this.model.state.tickets);
    this.game.canvas.dataset.cash=String(this.model.state.cash);
    this.game.canvas.dataset.confirmation=this.confirmAction?this.confirmText:'';
    this.game.canvas.dataset.audio=this.audio.status;this.game.canvas.dataset.muted=String(this.audio.muted);
    const recovery=this.screen==='error'||!!this.error&&!!this.pending;
    this.game.canvas.dataset.recovery=String(recovery);
    this.targets = [];
    this.game.canvas.dataset.modalScroll='[]';
    this.game.canvas.dataset.notificationFrame='';
    this.layer.removeAll(true);
    if(this.screen==='loading'||this.busy){this.saveNotification(true);return;}
    if(recovery||(this.screen==='start'&&this.error)){this.saveNotification(false);return;}
    if (this.screen === 'start' || this.screen === 'error') {
      this.titleScreen();
    } else {
      if (this.model.state.phase === 'shop') { this.shopBackdrop(); this.shopHeader(); }
      else this.header();
      if (this.model.state.phase === 'market') this.market();
      else if (this.model.state.phase === 'shop') this.shop();
      else this.summary();
    }
    if(recovery)return;
    if(this.lifecycle?.needsContinue||this.reasons.has('user'))this.pause();
    else if (this.confirmAction) this.confirm();
    else if (this.screen === 'game' && this.reasons.size) this.pause();
    else if (this.screen === 'game' && this.model.state.offer) this.offer();
  }
  private market() {
    const s = this.model.state;
    this.text(12, 69, 'CHỢ SÁNG', 23);
    this.text(12, 100, `Giá hôm nay ${[100, 110, 90][s.day - 1]}% · Tiền thuê cuối ngày: 20 xu`, 14, C.muted);
    ingredients.forEach((i, n) => {
      const y = 137 + n * 59, locked = i.id === 'sausage' && !s.unlocked.includes('sausage');
      this.rect(12, y + 51, 336, 1, C.line);
      this.rect(12, y + 7, 14, 14, i.color);
      this.text(33, y, i.name, 16);
      this.text(33, y + 23, locked ? 'Cấp 2 · ngày kế tiếp' : `${this.model.price(i.id)} xu · Kho ${this.model.stock(i.id)}`, 13, C.muted);
      this.button(210, y, 58, '+1', () => this.command({ type: 'buy', ingredient: i.id, quantity: 1 }), !locked);
      this.button(278, y, 70, '+5', () => this.command({ type: 'buy', ingredient: i.id, quantity: 5 }), !locked);
    });
    this.text(12, 442, 'GIÁ BÁN', 16);
    recipes.forEach((r, n) => this.button(12 + n * 115, 468, 106, `${r.name}\n${s.prices[r.id]} xu`, () => {
      const steps = [.8, .9, 1, 1.1, 1.2, 1.3, 1.4].map(f => Math.round(r.price * f));
      this.command({ type: 'price', recipe: r.id, value: steps[(steps.indexOf(s.prices[r.id]) + 1) % steps.length] });
    }, s.unlocked.includes(r.id), C.green));
    this.text(12, 530, this.error || (s.cash < 20 ? 'Tiền đang thấp hơn tiền thuê. Cẩn thận khi nhập hàng.' : s.message || 'Đế + sốt + phô mai = pizza phô mai. Nấm hư cuối ngày.'), 15, this.error ? '#a42620' : C.muted, 336);
    this.button(12, 583, 336, 'Mở cửa đón khách', () => this.command({ type: 'open' }));
  }
  private shop() {
    const s = this.model.state, ticket = s.tickets.find(t => t.id === s.selected), pizza = s.pizza;
    const left = Math.max(0, Math.ceil(s.duration - s.time));
    s.tickets.forEach((t, n) => {
      const x = 9 + n * 114, selected = t.id === s.selected;
      this.roundRect(x, 61, 108, 82, 13, selected ? 0xc56b58 : 0x814638);
      this.roundRect(x + 3, 64, 102, 76, 11, selected ? 0xe0a174 : 0x9d5846);
      this.circle(x + 27, 94, 23, 0x633a30);
      this.avatar(x + 27, 91, 18, n);
      const name = ['Anh Minh', 'Chị Lan', 'Cô Hạnh'][n] ?? 'Khách';
      this.text(x + 51, 70, name, 11, '#fff1df', 54).setFixedSize(54, 16);
      this.text(x + 51, 89, timerText(t.remaining), 13, '#ffe381', 51).setFontFamily('monospace').setFontStyle('bold');
      this.text(x + 51, 108, t.takeaway ? 'Mang đi' : 'Tại quán', 9, '#f3d6bd', 54);
      this.circle(x + 91, 130, 3, selected ? 0xffd25b : 0xb78970);
      this.targets.push({ x, y: 61, w: 108, h: 82, action: () => this.command({ type: 'select', id: t.id }) });
    });
    for (let n = s.tickets.length; n < 3; n++) {
      const x = 9 + n * 114;
      this.roundRect(x, 61, 108, 82, 13, 0x724238);
      this.roundRect(x + 3, 64, 102, 76, 11, 0x82493e);
      this.circle(x + 54, 92, 20, 0x714239);
      this.circle(x + 54, 87, 8, 0x432820);
      this.roundRect(x + 40, 94, 28, 17, 8, 0x432820);
      this.text(x + 17, 116, 'Đang chờ khách', 10, '#e8c1a9', 76).setAlign('center').setFixedSize(76, 16);
    }
    this.roundRect(10, 149, 340, 68, 15, 0x482820);
    this.roundRect(13, 152, 334, 62, 13, 0xffead2);
    this.avatar(43, 183, 22, Math.max(0, s.tickets.indexOf(ticket!)));
    const r = ticket && recipes.find(r => r.id === ticket.recipe);
    if (r && ticket) {
      const speaker = ['Anh Minh', 'Chị Lan', 'Cô Hạnh'][Math.max(0, s.tickets.indexOf(ticket))] ?? 'Khách';
      this.text(72, 159, speaker, 9, '#9a6251', 190).setFontStyle('bold');
      this.text(72, 174, ticket.help ? 'Nhờ làm giúp một chiếc pizza' : `Gọi pizza ${r.name}${ticket.takeaway ? ' mang đi' : ''}`, 12, '#49271f', 211).setFontStyle('bold');
      this.text(72, 193, r.ingredients.map(id => ingredients.find(i => i.id === id)!.name).join(' + '), 9, '#8b6657', 196);
      this.roundRect(284, 158, 56, 51, 13, 0xf3dcc4);
      this.pizza(312, 183, 20, r.ingredients);
    } else {
      this.text(72, 168, 'QUẦY ĐANG MỞ', 11, '#8b6657', 225).setFontStyle('bold');
      this.text(72, 184, 'Chờ khách tiếp theo…', 14, '#49271f', 225);
    }
    const selectedRecipe = r?.id;
    for (let n = 0; n < 4; n++) {
      const recipeItem = recipes[n], x = 10 + n * 86, unlocked = !!recipeItem && s.unlocked.includes(recipeItem.id);
      this.roundRect(x, 221, 80, 54, 12, recipeItem?.id === selectedRecipe ? 0xf1bb4f : 0x563329);
      this.roundRect(x + 2, 223, 76, 50, 10, recipeItem?.id === selectedRecipe ? 0x9c5b37 : 0x704333);
      if (recipeItem && unlocked) this.pizza(x + 40, 241, 12, recipeItem.ingredients);
      else this.lockedIcon(x + 40, 240);
      const label = recipeItem ? (recipeItem.id === 'cheese' ? 'Pizza cơ bản' : `Pizza ${recipeItem.name}`) : '';
      if (label) this.text(x + 2, 255, label, 8, unlocked ? '#fff0dc' : '#c7a996', 76).setAlign('center').setFixedSize(76, 11);
    }
    this.roundRect(11, 282, 338, 181, 19, 0x3d251d);
    this.roundRect(16, 287, 328, 169, 16, 0xb87945);
    for (let y = 298; y < 451; y += 17) {
      this.rect(22, y, 316, 2, 0x9b5e36, .5);
      this.rect(22, y + 3, 316, 1, 0xe0a568, .4);
    }
    this.roundRect(24, 291, 312, 20, 10, 0x633b2b, .9);
    const ovenLabel = pizza?.stage === 'baking' ? `${Math.floor(pizza.elapsed)}s · ${pizza.elapsed < 3 ? 'ĐANG NƯỚNG' : pizza.elapsed <= 5 ? 'ĐÃ CHÍN · LẤY BÁNH' : 'BÁNH CHÁY'}` : 'BÀN CHẾ BIẾN';
    this.text(32, 294, ovenLabel, 9, '#ffebd0', 296).setAlign('center').setFixedSize(296, 13).setFontStyle('bold');
    this.roundRect(54, 321, 252, 119, 60, 0xa56637);
    this.roundRect(59, 325, 242, 109, 55, 0xd49858);
    if (pizza) this.pizza(180, 374, 47, pizza.ingredients, pizza.quality === 'burnt');
    else this.pizza(180, 374, 47, ['dough']);
    this.roundRect(18, 330, 42, 54, 19, 0xc6d1cb);
    this.circle(39, 333, 21, 0xe7eee8);
    this.circle(39, 332, 16, 0xb9362b);
    this.circle(40, 328, 12, 0xd95342);
    this.roundRect(19, 389, 40, 34, 17, 0xe2cf9c);
    this.circle(39, 392, 19, 0xffe47a);
    this.circle(39, 390, 15, 0xffedaa);
    this.roundRect(311, 322, 37, 71, 10, 0x4a2c24);
    this.roundRect(315, 326, 29, 63, 8, 0xb9362b);
    this.roundRect(323, 316, 13, 14, 4, 0xf0e2cc);
    this.roundRect(321, 313, 17, 7, 3, 0xf7f1e7);
    this.circle(330, 357, 9, 0xeff2dc);
    this.circle(330, 357, 5, 0xb9362b);
    if (pizza?.boxed) {
      this.roundRect(248, 395, 53, 22, 6, 0xf2d4a4);
      this.text(250, 400, 'ĐÃ ĐÓNG HỘP', 7, '#603a2a', 49).setAlign('center').setFixedSize(49, 11).setFontStyle('bold');
    }
    if (pizza?.stage === 'baking') {
      const progressHeight = Math.max(2, 70 * Math.min(1, pizza.elapsed / 7));
      this.roundRect(78, 339, 10, 74, 5, 0x593526);
      this.roundRect(80, 411 - progressHeight, 6, progressHeight, 3, pizza.elapsed > 5 ? 0xd84a3b : 0xf6ca50);
    }
    this.roundRect(10, 469, 340, 161, 16, 0x40271f);
    this.text(18, 473, 'NGUYÊN LIỆU', 9, '#ddb89b', 110).setFontStyle('bold');
    this.text(233, 473, `${left ? `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')} CÒN` : 'CA ĐÃ ĐÓNG'}`, 9, '#f4cc83', 109).setAlign('right').setFixedSize(109, 14);
    const action = !pizza || pizza.stage === 'assembly' ? 'bake' : pizza.stage === 'baking' ? 'remove' : ticket?.takeaway && !pizza.boxed ? 'box' : 'deliver';
    this.roundRect(68, 413, 224, 48, 13, 0x186936);
    this.roundRect(71, 415, 218, 42, 11, action === 'deliver' ? 0x39c65e : 0x2fa650);
    const targetId=ticket?.id,sourceId=pizza?.ticketId;
    const targetName=['Anh Minh','Chị Lan','Cô Hạnh'][Math.max(0,s.tickets.indexOf(ticket!))]??'Khách';
    const deliveryCommand={type:'deliver',targetId,sourceId,commandId:`deliver:${sourceId}:${targetId}`};
    const labels: Record<string, string> = { bake: 'Cho bánh vào lò', remove: 'Lấy bánh ra', box: 'Đóng hộp bánh', deliver: ticket&&r?`Giao ${targetName} · ${r.name}`:'Chọn khách nhận' };
    const actionLabel = this.text(75, 427, labels[action], action==='deliver'?12:15, '#ffffff', 210).setAlign('center').setFixedSize(210, 28).setFontStyle('bold');
    if (!pizza || this.busy) actionLabel.setAlpha(.55);
    if (pizza) this.targets.push({ x: 68, y: 413, w: 224, h: 48, action: () => {
      const wrong = action === 'deliver' && pizza && r && (r.ingredients.length !== pizza.ingredients.length || !r.ingredients.every(i => pizza.ingredients.includes(i)) || (ticket.takeaway && !pizza.boxed));
      if (wrong) this.ask(`Giao ${targetName} · pizza ${r!.name}: ${r!.ingredients.length!==pizza!.ingredients.length||!r!.ingredients.every(i=>pizza!.ingredients.includes(i))?'Sai công thức. ':''}${ticket.takeaway&&!pizza!.boxed?'Chưa đóng hộp. ':''}Vẫn giao sẽ bị trừ sao.`, () => this.command({...deliveryCommand,confirmed:true}));
      else this.command(action==='deliver'?deliveryCommand:{ type: action });
    } });
    if(action==='box')this.button(68,350,224,'Giao chưa đóng hộp',()=>this.ask(`Giao ${targetName} · pizza ${r!.name} chưa đóng hộp? Vẫn giao sẽ bị trừ sao.`,()=>this.command({...deliveryCommand,confirmed:true})),true,C.green);
    this.roundRect(297, 413, 51, 48, 12, pizza ? 0x3e5a64 : 0x4a4038);
    this.trashIcon(322, 429);
    this.text(299, 443, 'Bỏ bánh', 8, pizza ? '#fff0df' : '#bca18e', 47).setAlign('center').setFixedSize(47, 11);
    if (pizza) this.targets.push({ x: 297, y: 413, w: 51, h: 48, action: () => this.ask('Bỏ bánh hiện tại? Nguyên liệu đã nướng không được hoàn lại.', () => this.command({ type: 'discard' })) });
    ingredients.forEach((i, n) => {
      const x = 13 + n * 67, available = this.model.available(i.id), enabled = !!ticket && (!pizza || pizza.stage === 'assembly') && available + (ticket.reserved.includes(i.id) ? 1 : 0) > 0;
      this.roundRect(x, 490, 63, 58, 10, enabled ? i.id === 'sausage' ? 0x914536 : 0x81503a : 0x604033);
      this.roundRect(x + 2, 492, 59, 54, 8, enabled ? 0x9e6444 : 0x704a39);
      this.ingredientIcon(i.id, x + 31, 510, 11);
      this.text(x + 3, 529, i.id === 'sauce' ? 'Sốt' : i.id === 'dough' ? 'Đế bánh' : i.name, 8, enabled ? '#fff0da' : '#c4ac98', 57).setAlign('center').setFixedSize(57, 12);
      this.circle(x + 51, 500, 7, enabled ? 0x452820 : 0x49352c);
      this.text(x + 46, 495, String(available), 7, '#ffe58a', 10).setAlign('center').setFixedSize(10, 11).setFontStyle('bold');
      if (enabled) this.targets.push({ x, y: 490, w: 63, h: 58, action: () => this.command({ type: 'ingredient', ingredient: i.id }) });
    });
    for (let n = 0; n < 5; n++) {
      const x = 13 + n * 67;
      this.roundRect(x, 555, 63, 59, 10, 0x51392f);
      this.roundRect(x + 2, 557, 59, 55, 8, 0x63473b);
      this.circle(x + 31, 577, 12, 0x78655c);
      this.lockedIcon(x + 31, 578);
      this.text(x + 3, 596, 'Khóa', 8, '#bea99a', 57).setAlign('center').setFixedSize(57, 11);
    }
    const status = pizza?.stage === 'baking' ? `${pizza.elapsed < 3 ? 'Đang nướng' : pizza.elapsed <= 5 ? 'Đã chín · lấy bánh' : 'Bánh cháy'} · ${Math.floor(pizza.elapsed)} / 7s` : pizza?.stage === 'ready' ? `Đã lấy bánh · ${pizza.quality === 'good' ? 'Vừa chín' : 'Chất lượng kém'}` : s.message || (ticket ? 'Chọn nguyên liệu để làm bánh' : 'Chọn phiếu khách để bắt đầu');
    this.text(75, 311, this.error || status, 8, this.error ? '#7c231e' : '#633b2b', 210).setAlign('center').setFixedSize(210, 12);
  }
  private summary() {
    const s = this.model.state, t = s.summary;
    if (!t) return;
    this.text(12, 74, s.phase === 'end' ? 'BA NGÀY MỞ QUÁN' : `KHÉP LẠI NGÀY ${s.day}`, 24);
    this.text(12, 113, t.ending === 'insolvent' ? 'Quán không đủ vốn cho ngày tiếp theo.' : t.goal ? 'Đạt mục tiêu · +20 xu, +10 XP' : 'Chưa đạt mục tiêu hôm nay', 16, C.muted, 336);
    const rows = [['Tiền bán hàng', t.revenue], ['Tiền nhập hàng', -t.purchases], ['Nguyên liệu đã dùng', -t.cost], ['Nguyên liệu hết hạn', -t.expired], ['Thuê quán (lương / sửa: 0)', -t.rent], ['Thưởng', t.rewards], ['Lợi nhuận (không gồm thưởng)', t.profit], ['Đơn giao / đánh giá', `${t.delivered} / ${t.rating?.toFixed(1) ?? '—'} sao`]];
    rows.forEach(([label, value], n) => { const y = 169 + n * 32; this.text(12, y, String(label), 14); this.text(245, y, String(value), 15, C.ink, 104); this.rect(12, y + 25, 336, 1, C.line); });
    this.text(12, 444, `Tiền còn: ${s.cash} xu · XP ${s.xp}`, 19);
    this.text(12, 477, `Uy tín ${s.reputation} · Quan hệ ${s.relationship}/3\nPhô mai ${Math.min(8, s.cheeseSales)}/8 · Lãi tích lũy ${s.totalProfit}`, 15, C.muted);
    this.text(12, 532, this.error || (this.busy ? 'Đang lưu checkpoint…' : s.phase === 'end' ? 'Chiến dịch đã được lưu.' : 'Qua ngày mới sau khi lưu thành công.'), 14, this.error ? '#a42620' : C.muted, 336);
    if (s.phase === 'end') this.button(12, 583, 336, 'Mở chiến dịch mới', () => this.ask('Bắt đầu chiến dịch mới và thay bản lưu?', () => { void this.startNew(); }));
    else this.button(12, 583, 336, this.busy ? 'Đang lưu…' : t.ending ? 'Lưu và kết thúc' : `Lưu và sang ngày ${s.day + 1}`, () => { void this.nextDay(); }, !this.busy);
  }
  private shade() {
    this.targets = [];
    this.rect(0, 0, 360, 640, 0x000000);
  }
  private notificationButton(layout:NotificationLayout,index:number,label:string,action:()=>void,enabled=true):void{
    const r=layout.footer[index],height=Math.max(48,r.height),y=r.y+(r.height-height)/2;
    const text=this.text(r.x+6,r.y+Math.max(2,(r.height-32)/2),label,14,enabled?'#fff6df':'#a9a29a',r.width-12).setAlign('center');
    text.setFixedSize(r.width-12,32);
    if(enabled&&!this.busy)this.targets.push({x:r.x,y,w:r.width,h:height,action});
    if(index===1&&layout.variant==='two'){
      const close=drawNotificationClose(this,this.layer,layout)!;
      const size=48.1/((this.game.canvas.getBoundingClientRect().width||360)/360);
      if(enabled&&!this.busy)this.targets.push({x:close.x+(close.width-size)/2,y:close.y+(close.height-size)/2,w:size,h:size,action});
    }
  }
  private notificationTitle(layout:NotificationLayout,value:string):void{
    this.text(38,layout.titleY,value,21,C.ink,284).setAlign('center').setFixedSize(284,48);
  }
  private saveNotification(waiting:boolean):void{
    this.shade();const layout=drawCompactNotification(this,this.layer,waiting?'Đang mở/lưu tiệm…':'Tiến độ chưa lưu/mở',waiting?'Vui lòng đợi thao tác hoàn tất.':this.error,17,Math.max(1,Math.min(2,parseFloat(getComputedStyle(document.documentElement).fontSize)/16)));
    this.notificationButton(layout,0,waiting?'Vui lòng đợi…':'Thử lại',()=>{if(this.screen==='error')void this.loadSaved();else if(this.pending)void this.nextDay();else void this.startNew();},!waiting);
  }
  private offer() {
    const t = this.model.state.offer!;
    this.shade();const layout=drawNotificationFrame(this,this.layer,'two',90,470);
    this.notificationTitle(layout,t.help?'LỜI NHỜ KHÁCH QUEN':kinds[t.kind].toUpperCase());
    this.pizza(180,layout.body.y+45,36,recipes.find(r=>r.id===t.recipe)!.ingredients);
    const stocked = recipes.find(r => r.id === t.recipe)!.ingredients.every(id => this.model.available(id) >= 1);
    const detail=`Pizza ${recipes.find(r=>r.id===t.recipe)!.name}\n`+(t.help?'Tặng một pizza · không thu tiền\nGiúp người thân của khách quen.':`${t.price} xu · ${t.patience}s kiên nhẫn\n${t.takeaway?'Mang đi · cần đóng hộp':'Dùng tại quán'}`)+`\n${stocked?this.error:'Không đủ nguyên liệu cho món này.'}`;
    modalText(this,this.layer,layout.body.x,layout.body.y+95,layout.body.width,layout.body.height-95,detail,16,C.ink,Math.max(1,Math.min(2,parseFloat(getComputedStyle(document.documentElement).fontSize)/16)));
    this.notificationButton(layout,0,t.help?'Giúp khách':'Đồng ý giá giảm',()=>this.command({type:'accept'}),stocked);
    this.notificationButton(layout,1,t.help?'Từ chối':'Từ chối giá',()=>this.command({type:'decline'}));
  }
  private confirm() {
    this.shade();const layout=drawNotificationFrame(this,this.layer,'two');this.notificationTitle(layout,'XÁC NHẬN');
    modalText(this,this.layer,layout.body.x,layout.body.y,layout.body.width,layout.body.height,this.confirmText,19,C.ink,Math.max(1,Math.min(2,parseFloat(getComputedStyle(document.documentElement).fontSize)/16)));
    this.notificationButton(layout,0,'Đồng ý',()=>{const action=this.confirmAction;this.confirmAction=null;this.setPause('confirm',false);action?.();this.render();});
    this.notificationButton(layout,1,'Hủy',()=>{this.confirmAction=null;this.setPause('confirm',false);this.render();});
  }
  private pause() {
    this.shade();
    const tutorial = this.reasons.has('tutorial')&&!this.lifecycle.needsContinue&&!this.reasons.has('user');
    const names:Record<string,string>={tutorial:'hướng dẫn',user:'nghỉ tay',visibility:'ẩn màn hình',gap:'gián đoạn',confirm:'xác nhận'};
    const reasons=[...this.reasons].map(reason=>names[reason]??reason).join(', ');
    const layout=drawCompactNotification(this,this.layer,tutorial?'NGÀY ĐẦU MỞ QUÁN':'TẠM DỪNG',(tutorial ? 'Nhập đế, sốt và phô mai trước khi mở cửa.\n\nKhách tự đặt đơn → chọn nguyên liệu → nướng 3–5 giây → lấy bánh → giao khách.\n\nĐơn mang đi cần đóng hộp.' : 'Đồng hồ và lò nướng đang dừng.\n\nCheckpoint ở cuối ngày. Thoát giữa ca sẽ trở lại đầu ngày đang lưu.')+'\n\nĐang dừng: '+reasons,17,Math.max(1,Math.min(2,parseFloat(getComputedStyle(document.documentElement).fontSize)/16)));
    this.notificationButton(layout,0,tutorial ? 'Đến chợ sáng' : 'Tiếp tục', () => {
      if (this.lifecycle.needsContinue)this.lifecycle.continue();
      else if (tutorial) this.setPause('tutorial',false);
      else if (this.reasons.has('user')) this.setPause('user',false);
      else if (this.reasons.has('visibility')) this.setPause('visibility',false);
      else this.setPause('gap',false);
      this.accumulator = 0; this.render();
    });
  }
  update(time: number, _delta: number) {
    const phase = this.model.state.phase;
    this.lifecycle.frame(performance.now(),this.screen==='game'&&this.model.state.phase==='shop'&&this.reasons.size===0&&!this.busy&&!this.model.state.offer);
    if (this.screen !== 'game' || this.busy || this.reasons.size || this.confirmAction) return;
    if (time - this.drawn >= 100 && this.model.state.phase === 'shop') { this.drawn = time; this.render(); }
    if (phase !== this.model.state.phase) this.render();
  }
}
