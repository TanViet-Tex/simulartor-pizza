import Phaser from 'phaser';
import { assertRuntimeCompatibility, validateGameConfig } from '../config/gameContent';
import { PIZZA_ICON_MANIFEST } from '../presentation/PizzaIcons';
import { COZY_ASSETS } from './BootScene';
import { UI_THEME } from '../presentation/theme';
import { MAIN_MENU_BACKGROUND } from './MainMenuScene';
import { MENU_CURTAIN } from '../presentation/MenuAmbience';
import { OVEN_ART_MANIFEST } from '../presentation/OvenArt';
import { PIZZA_BOX_ART } from '../presentation/PizzaBoxArt';

// Retained as a catalog for optional legacy views, not a mandatory campaign download.
export const LEGACY_ASSET_MANIFEST = Object.freeze(Object.entries(COZY_ASSETS).map(([name,url]) => Object.freeze({key:`cozy-${name}`,url,type:'image' as const})));

/** The only entry scene. No gameplay or checkpoint access occurs until this gate passes. */
export class StartupScene extends Phaser.Scene {
  private overlay: HTMLDivElement | null = null;
  private controller: AbortController | null = null;
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private failed = false;
  private live = false;
  private attempt = 0;
  private pendingFiles = new Set<Phaser.Loader.File>();
  private readonly onCleanup = () => this.cleanup();
  constructor(private readonly campaign: boolean, private readonly destination: () => Phaser.Scene, private readonly menu = false) { super('StartupScene'); }

  create(): void {
    this.live = true;
    this.failed = false;
    const attempt = ++this.attempt;
    document.documentElement.dataset.startup = 'loading';
    delete document.documentElement.dataset.startupError;
    delete document.documentElement.dataset.booted;
    this.game.canvas.dataset.booted = 'false';
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onCleanup);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.onCleanup);
    this.show('Đang mở tiệm pizza…');
    void this.prepare(attempt);
  }

  private async prepare(attempt: number): Promise<void> {
    const controller = new AbortController();
    this.controller = controller;
    this.timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}game-content.json`, {signal:controller.signal, cache:'no-store'});
      if (!response.ok) throw new Error('config');
      const config = validateGameConfig(await response.json());
      assertRuntimeCompatibility(config);
      if (!this.live || attempt !== this.attempt) return;
      this.clearTimer();
      this.registry.set('gameConfig',config);
    } catch {
      if (this.live && attempt === this.attempt) this.fail('config');
      return;
    }
    this.show('Đang chuẩn bị nguyên liệu…');
    const manifest: readonly {key:string;url:string;type:'svg'|'image'}[] = this.campaign ? [] : [...PIZZA_ICON_MANIFEST,...OVEN_ART_MANIFEST,PIZZA_BOX_ART,...(this.menu?[MAIN_MENU_BACKGROUND,MENU_CURTAIN]:[])];
    this.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, () => { if (attempt === this.attempt) this.fail('assets'); });
    const enterGame = () => {
      if (!this.live || this.failed || attempt !== this.attempt) return;
      if (manifest.some(asset => !this.textures.exists(asset.key))) { this.fail('assets'); return; }
      this.clearTimer();
      document.documentElement.dataset.startup = 'ready';
      const scene = this.destination();
      // Construct the campaign model only here, after config and all mandatory textures succeed.
      this.scene.add('PlayScene', scene, true);
      this.scene.stop();
    };
    if (!manifest.length) { enterGame(); return; }
    this.load.once(Phaser.Loader.Events.COMPLETE, enterGame);
    for (const asset of manifest) {
      if (this.textures.exists(asset.key)) continue;
      const url = asset.url.startsWith('data:') ? asset.url : `${import.meta.env.BASE_URL}${asset.url}`;
      if (asset.type === 'svg') this.load.svg(asset.key,url,{width:256,height:256});
      else this.load.image(asset.key,url);
    }
    this.pendingFiles = new Set(this.load.list);
    this.timeout = setTimeout(() => this.fail('assets'), 10000);
    this.load.start();
  }

  private fail(kind: 'config' | 'assets'): void {
    if (!this.live || this.failed) return;
    this.failed = true;
    this.clearTimer();
    this.cancelAssetLoads();
    this.registry.remove('gameConfig');
    document.documentElement.dataset.startup = 'error';
    document.documentElement.dataset.startupError = kind;
    this.show(kind === 'config' ? 'Không thể tải cấu hình trò chơi. Kiểm tra kết nối rồi thử lại.' : 'Không thể tải đủ hình ảnh. Kiểm tra kết nối rồi thử lại.', true);
  }

  private show(message: string, retry = false): void {
    this.overlay?.remove();
    const overlay = document.createElement('div');
    overlay.id = 'startup-screen';
    overlay.style.cssText = `position:fixed;inset:0;z-index:20;display:grid;place-items:center;background:#${UI_THEME.colors.dark.toString(16)};color:${UI_THEME.text.cream};font:600 16px/1.5 ${UI_THEME.typography.fontFamily};padding:20px;box-sizing:border-box`;
    const panel = document.createElement('div');
    panel.style.cssText = 'max-width:300px;text-align:center';
    const heading = document.createElement('h1');
    heading.textContent = 'Tiệm pizza';
    heading.style.cssText = 'font-size:26px;margin:0 0 16px';
    const status = document.createElement('p');
    status.setAttribute('role',retry ? 'alert' : 'status');
    status.textContent = message;
    panel.append(heading,status);
    if (retry) {
      const button = document.createElement('button');
      button.id = 'startup-retry';
      button.textContent = 'Thử lại';
      button.style.cssText = `min-height:${UI_THEME.minTouch}px;min-width:160px;margin-top:12px;border:2px solid #${UI_THEME.colors.greenEdge.toString(16)};border-radius:${UI_THEME.radii.panel}px;background:#${UI_THEME.colors.green.toString(16)};color:${UI_THEME.text.ink};font:700 18px ${UI_THEME.typography.fontFamily};cursor:pointer`;
      button.addEventListener('click',() => { button.disabled = true; this.scene.restart(); },{once:true});
      panel.append(button);
    }
    overlay.append(panel);
    document.body.append(overlay);
    this.overlay = overlay;
  }
  private clearTimer(): void { if (this.timeout !== null) clearTimeout(this.timeout); this.timeout = null; }
  private cancelAssetLoads(): void {
    // Phaser 4.2 reset clears its sets but does not abort XHR or image decode callbacks.
    // Detach both before resetting so a timed-out attempt cannot complete into a retry.
    for (const file of this.pendingFiles) {
      if (this.textures.exists(file.key)) continue;
      const xhr = file.xhrLoader;
      if (xhr) {
        xhr.onload = null;
        xhr.onerror = null;
        xhr.onprogress = null;
        xhr.onabort = null;
        if (typeof xhr.abort === 'function') xhr.abort();
      }
      if (file.data instanceof HTMLImageElement) {
        file.data.onload = null;
        file.data.onerror = null;
        if (file.data.src.startsWith('blob:')) URL.revokeObjectURL(file.data.src);
        file.data.removeAttribute('src');
      }
      file.onLoad = () => {};
      file.onError = () => {};
      file.onBase64Load = () => {};
      file.onProcess = () => {};
      file.onProcessComplete = () => {};
      file.onProcessError = () => {};
    }
    this.pendingFiles.clear();
    if (this.load.scene) this.load.reset();
  }
  private cleanup(): void {
    this.live = false;
    ++this.attempt;
    this.events.off(Phaser.Scenes.Events.SHUTDOWN,this.onCleanup);
    this.events.off(Phaser.Scenes.Events.DESTROY,this.onCleanup);
    this.controller?.abort();
    this.clearTimer();
    this.overlay?.remove();
    this.overlay = null;
    this.load.removeAllListeners(Phaser.Loader.Events.FILE_LOAD_ERROR);
    this.load.removeAllListeners(Phaser.Loader.Events.COMPLETE);
    this.cancelAssetLoads();
  }
}
