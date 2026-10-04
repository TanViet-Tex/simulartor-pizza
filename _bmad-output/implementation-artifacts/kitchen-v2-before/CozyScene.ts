import Phaser from 'phaser';
import { CozyRuntime } from '../runtime/CozyRuntime';
import { COZY_BAKE } from '../domain/CozyOrder';
import {recipePrice,recipeIngredients,STOCK_INGREDIENTS,type StockRecipe,type StockIngredient} from '../domain/CozyStock';
import {menuPrice} from '../domain/CustomerProgression';
import { CozyArt, UI } from '../presentation/CozyArt';
import { preloadPizzaIcons } from '../presentation/PizzaIcons';
import { PIZZA_BOX_ART } from '../presentation/PizzaBoxArt';
import { REFERENCE_KITCHEN_MANIFEST,registerReferenceKitchenFrames } from '../presentation/ReferenceKitchenArt';
import { REFERENCE_KITCHEN_LAYOUT as KITCHEN } from '../presentation/ReferenceKitchenLayout';
import { UI_THEME } from '../presentation/theme';
import { ingredients as catalog } from '../domain/demo';
import { MenuPreferences } from '../presentation/MenuPreferences';
import { PlayLifecycle, type PauseLease } from '../runtime/PlayLifecycle';
import { BrowserPlayLifecycle } from '../infrastructure/BrowserPlayLifecycle';
import { PlayAudio } from '../presentation/PlayAudio';
import { PLAY_BANDS, timerText } from '../presentation/PlayHud';
import { modalText } from '../presentation/ModalText';
import { StaticGraphics } from '../presentation/StaticGraphics';
import { createOrderQueue, ORDER_DETAIL_PROMPT, type OrderQueueInput } from '../presentation/OrderQueue';
import type {CozyCampaignSession} from '../runtime/CozyCampaignSession';

type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
const {cream,ink,muted,accent,board,wood}=UI_THEME.text;
const recipeName=(recipe:StockRecipe)=>recipe==='sausage'?'Pizza xúc xích':recipe==='mushroom'?'Pizza nấm':'Pizza phô mai';

export class CozyScene extends Phaser.Scene {
  private layer!:Phaser.GameObjects.Container;
  private art!:CozyArt;
  private controls:Control[]=[];
  private dirty=true;
  private signature='';
  private motion?:MediaQueryList;
  private lastTap='';
  private heatMarker?:Phaser.GameObjects.Rectangle;
  private hitZones=new Map<string,Phaser.GameObjects.Zone>();
  private visibleActions:{id:string;x:number;y:number;w:number;h:number;action:()=>void}[]=[];
  private quantities={dough:1,sauce:1,cheese:1,mushroom:1};
  private restartConfirmation=false;
  private endDayConfirmation=false;
  private priceDraft:{recipe:StockRecipe;percent:number;enabled:boolean}|null=null;
  private priceLease?:PauseLease;
  private priceError='';
  private statementOpen=false;
  private statementLease?:PauseLease;
  private purchaseSerial=0;
  private readonly purchaseScope=crypto.randomUUID();
  private lastPurchase:{key:string;at:number;id:string}|null=null;
  private summaryTab:'summary'|'market'|'stock'|'shop'|'missions'='summary';
  private initialHubShown=false;
  private lifecycle!:PlayLifecycle;
  private browserLifecycle!:BrowserPlayLifecycle;
  private timers:{text:Phaser.GameObjects.Text;read:()=>string}[]=[];
  private timerElapsed=0;
  private preferenceUnsubscribe?:()=>void;
  private scenePauses=new Map<'user'|'order',PauseLease>();
  private staticGraphics!:StaticGraphics;
  private inspectedOrderId:string|null=null;
  private inspectedRecipe:StockRecipe|null=null;
  private inspectionMode='';
  private orderQueue=createOrderQueue([]);
  private unsubscribeSave?:()=>void;
  private saveDismissed=false;
  private finalOpen=false;
  private newCampaignConfirmation=false;
  private reloadConfirmation=false;
  constructor(private readonly runtime:CozyRuntime,private readonly preferences?:MenuPreferences,private readonly returnToMenu?:()=>void,private readonly audio=new PlayAudio(),private readonly sharedLifecycle?:PlayLifecycle,private readonly campaignSession?:CozyCampaignSession,private readonly replaceRuntime?:(runtime:CozyRuntime)=>void){super('CozyScene');}
  preload():void{
    preloadPizzaIcons(this);
    for(const asset of [...REFERENCE_KITCHEN_MANIFEST,PIZZA_BOX_ART])if(!this.textures.exists(asset.key))this.load.image(asset.key,`${import.meta.env.BASE_URL}${asset.url}`);
  }
  create():void{
    registerReferenceKitchenFrames(this);
    this.dirty=true;this.signature='';this.inspectedOrderId=null;this.inspectedRecipe=null;this.inspectionMode='';this.priceDraft=null;this.statementOpen=false;this.layer=this.add.container();this.staticGraphics=new StaticGraphics(this);this.motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    this.motion.addEventListener('change',this.motionChange);
    this.scale.on('resize',this.motionChange);
    this.lifecycle=this.sharedLifecycle??new PlayLifecycle(this.runtime);
    this.browserLifecycle=new BrowserPlayLifecycle(this.lifecycle,()=>{this.audio.silence();this.dirty=true;});
    this.preferenceUnsubscribe=this.preferences?.subscribe(this.motionChange);
    this.unsubscribeSave=this.campaignSession?.subscribe(()=>{this.saveDismissed=false;this.dirty=true;});
    this.events.once('shutdown',()=>{this.unsubscribeSave?.();this.unsubscribeSave=undefined;});
    const cleanup=()=>{this.events.off('shutdown',cleanup);this.events.off('destroy',cleanup);this.priceLease?.release();this.priceLease=undefined;this.statementLease?.release();this.statementLease=undefined;this.motion?.removeEventListener('change',this.motionChange);this.preferenceUnsubscribe?.();this.scale.off('resize',this.motionChange);this.browserLifecycle.destroy(!this.sharedLifecycle);for(const lease of this.scenePauses.values())lease.release();this.scenePauses.clear();this.audio.silence();this.tweens.killAll();for(const zone of this.hitZones.values())zone.destroy();this.hitZones.clear();this.staticGraphics.destroy();};
    this.events.once('shutdown',cleanup);this.events.once('destroy',cleanup);this.draw();
  }
  private motionChange=():void=>{this.dirty=true;};
  private get reducedMotion():boolean{return !!this.preferences?.reducedMotion||!!this.motion?.matches;}
  private get textScale():number{return Math.max(1,Math.min(2,parseFloat(getComputedStyle(document.documentElement).fontSize)/16));}
  private hold(reason:'user'|'order'):void{if(!this.scenePauses.has(reason))this.scenePauses.set(reason,this.runtime.acquirePause(reason));}
  private release(reason:'user'|'order'):void{this.scenePauses.get(reason)?.release();this.scenePauses.delete(reason);}
  update(_time:number,delta:number):void{
    this.lifecycle.frame(performance.now(),this.runtime.pauses.length===0&&this.runtime.simulationActive);
    this.runtime.advance(delta);const s=this.runtime.state;
    this.game.canvas.dataset.shiftClock=JSON.stringify(this.runtime.shiftClock);
    const sig=[s.stage,s.ingredients.join(','),Math.floor(this.runtime.ovenState?.ovenSeconds??s.ovenSeconds),this.runtime.tickets.map(t=>`${t.id}:${Math.ceil(t.remaining)}`).join(','),this.runtime.selectedTicketId,this.runtime.tutorialActive,this.runtime.pauseRevision,this.runtime.shopRevision,this.runtime.shiftClock.phase].join('|');
    if(this.dirty||sig!==this.signature){this.signature=sig;this.draw();}
    const oven=this.runtime.productionActive?this.runtime.ovenState:s;
    this.heatMarker?.setX(243+100*(oven?.ovenSeconds??0)/COZY_BAKE.gaugeEnd);
    this.game.canvas.dataset.oven=String(oven?.ovenSeconds??0);
    this.game.canvas.dataset.heat=oven?.stage==='burnt'?'burnt':(oven?.ovenSeconds??0)>=COZY_BAKE.perfectStart?'perfect':'warming';
    this.timerElapsed+=delta;
    if(this.timerElapsed>=100){this.timerElapsed=0;for(const timer of this.timers)timer.text.setText(timer.read());}
  }
  private graphics():void{const g=this.add.graphics();this.layer.add(g);this.art=new CozyArt(g);}
  private label(x:number,y:number,value:string,size=12,color:string=cream,width=0,align:'left'|'center'='center'):Phaser.GameObjects.Text{
    const text=this.add.text(x,y,value,{fontFamily:UI_THEME.typography.fontFamily,fontSize:`${Math.max(size,UI_THEME.typography.minSize)}px`,fontStyle:'bold',color,align,lineSpacing:UI_THEME.typography.lineSpacing,padding:{top:1,bottom:1},...(width?{wordWrap:{width,useAdvancedWrap:true}}:{})}).setLetterSpacing(UI_THEME.typography.letterSpacing);
    if(align==='center')text.setOrigin(.5,0);this.layer.add(text);return text;
  }
  private icon(name:string,x:number,y:number,size:number,alpha=1):Phaser.GameObjects.Image|undefined{
    const key=`pizza-icon-${name}`;
    if(!this.textures.exists(key)){this.label(x,y-size/3,name==='lock'?'—':'•',size/2);return;}
    const image=this.add.image(x,y,key).setDisplaySize(size,size).setAlpha(alpha);this.layer.add(image);return image;
  }
  private referenceSprite(frame:string,x:number,y:number,w:number,h=w):Phaser.GameObjects.Image|undefined{
    const key=frame.startsWith('oven-')?'reference-kitchen-ovens':frame.startsWith('pizza-')?'reference-kitchen-assembly':'reference-kitchen-sprites';
    if(!this.textures.exists(key)||!this.textures.get(key).has(frame))return;
    const image=this.add.image(x,y,key,frame);
    const scale=Math.min(w/image.frame.realWidth,h/image.frame.realHeight);
    image.setScale(scale);this.layer.add(image);return image;
  }
  private kitchenAction(id:string,index:number,title:string,enabled:boolean,action:()=>void):void{
    const {x,y,w,h}=KITCHEN.action(index);
    if(!enabled){this.graphics();this.art.g.fillStyle(0x15110d,.45).fillRoundedRect(x+2,y+2,w-4,h-4,7);}
    this.label(x+w/2,y+8,title,12,enabled?cream:muted,w-8);
    this.hit(id,x,y,w,h,enabled,action);
  }
  private timer(x:number,y:number,read:()=>string,size=10,color:string=cream,width=0):void{
    const text=this.label(x,y,read(),size,color,width);text.setFontFamily('monospace');this.timers.push({text,read});
  }
  private explanation(y:number,height:number,value:string,size=13,color:string=ink):void{
    modalText(this,this.layer,40,y,280,height,value,size,color,this.textScale);
    if(this.textScale>1)this.label(180,y+height+2,'Vuốt phần chữ để đọc tiếp',10,wood);
  }
  private hit(id:string,x:number,y:number,w:number,h:number,enabled:boolean,action:()=>void):void{
    if(this.campaignSession&&['loading','saving','error','recovery'].includes(this.campaignSession.view.state))enabled=enabled&&(['pause','mute'].includes(id)||id.startsWith('summary-tab-')||id.startsWith('summary-figure-')||id==='summary-statement-close'||id.startsWith('save-'));
    if(this.runtime.productionActive&&!this.runtime.tutorialActive&&this.runtime.shopPhase!=='making'&&this.runtime.shopPhase!=='delivered'&&!this.runtime.pauses.length){
      enabled=enabled&&(['pause','mute'].includes(id)||id.startsWith('market-')||id.startsWith('summary-'));
    }
    if(this.runtime.tutorialActive&&!this.runtime.pauses.some(p=>p!=='tutorial')){
      enabled=enabled&&(['pause','mute','order','customer-linh','recipe-0'].includes(id)||id===this.runtime.expectedControl||id==='dough-board'&&this.runtime.expectedControl==='dough');
    }
    if(enabled)this.visibleActions.push({id,x,y,w,h,action});
    const canvasBounds=this.game.canvas.getBoundingClientRect();
    const scale=Math.min((canvasBounds.width||360)/360,(canvasBounds.height||640)/640),min=Math.ceil(UI_THEME.minTouch/scale);
    const width=Math.max(w,min),height=Math.max(h,min);
    x=Math.max(0,Math.min(360-width,x-(width-w)/2));y=Math.max(0,Math.min(640-height,y-(height-h)/2));w=width;h=height;
    this.controls.push({id,x,y,width:w,height:h,enabled});
    // Keep input objects alive across clock redraws so a timed tap cannot fall
    // between Phaser removing the previous region and registering its replacement.
    let zone=this.hitZones.get(id);
    if(!zone){zone=this.add.zone(x,y,w,h).setOrigin(0).setDepth(10).setInteractive({useHandCursor:true});this.hitZones.set(id,zone);}
    zone.setPosition(x,y).setSize(w,h);zone.input?.hitArea.setTo(0,0,w,h);
    zone.removeAllListeners('pointerdown');
    if(!enabled){zone.disableInteractive();return;}
    zone.setInteractive({useHandCursor:true});
    zone.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{
      // On shorter portrait screens enlarged touch padding may overlap. The
      // visible button beneath the finger always wins over a neighbour's padding.
      const visible=this.visibleActions.find(c=>this.controls.some(active=>active.id===c.id&&active.enabled)&&pointer.x>=c.x&&pointer.x<=c.x+c.w&&pointer.y>=c.y&&pointer.y<=c.y+c.h);
      (visible?.action??action)();void this.audio.interact().then(()=>{this.audio.cue();this.dirty=true;});this.lastTap=visible?.id??id;this.dirty=true;
    });
  }
  private button(id:string,x:number,y:number,w:number,h:number,title:string,enabled:boolean,action:()=>void,fill:number=UI.green):void{
    this.graphics();this.art.panel(x,y,w,h,enabled?fill:fill===UI.green?0x527f42:0x615449,fill===UI.green?UI.greenEdge:UI.border,11);
    if(enabled)this.art.round(x+4,y+3,w-8,5,3,fill===UI.green?0x72d762:0xb77b61);
    this.label(x+w/2,y+(title.includes('\n')?5:(h-20)/2),title,title.includes('\n')?12:16,enabled&&fill===UI.green?ink:cream,title.includes('\n')?w-12:0);this.hit(id,x,y,w,h,enabled,action);
  }
  private draw():void{
    this.dirty=false;this.game.canvas.dataset.modalScroll='[]';this.timers=[];this.heatMarker=undefined;this.tweens.killAll();this.layer.removeAll(true);this.controls=[];this.visibleActions=[];this.graphics();
    const backdrop=this.textures.get('reference-kitchen-background').getSourceImage();
    const backdropScale=Math.min(KITCHEN.width/backdrop.width,KITCHEN.height/backdrop.height);
    this.layer.add(this.add.image(KITCHEN.width/2,KITCHEN.height/2,'reference-kitchen-background').setScale(backdropScale));
    const s=this.runtime.state,assembly=s.stage==='assembly',perfect=s.stage==='baking'&&s.ovenSeconds>=COZY_BAKE.perfectStart;
    const mode=this.runtime.productionActive?'live':this.runtime.tutorialActive?'practice':'freeplay';
    if(mode!==this.inspectionMode){this.inspectedOrderId=null;this.inspectionMode=mode;}
    this.orderQueue=createOrderQueue(this.queueInputs(),this.inspectedOrderId,this.runtime.productionActive?this.runtime.selectedTicketId:undefined);
    this.orderQueue.slots=this.orderQueue.slots.map((slot,index)=>{
      const {x,y,w,h,centerX,centerY}=KITCHEN.customer(index);
      return {...slot,x,y,width:w,height:h,centerX,centerY};
    });
    this.inspectedOrderId=this.orderQueue.inspectedId;
    this.hit('pause',18,5,32,29,true,()=>this.hold('user'));
    this.label(180,0,`Ngày ${this.runtime.day}`,18);
    this.timer(189,23,()=>this.runtime.productionActive&&(!this.runtime.ovenOwner||this.runtime.shiftClock.phase==='awaiting-close')?this.shiftTimeText():`Lò ${timerText(Math.floor(this.runtime.ovenState?.ovenSeconds??this.runtime.state.ovenSeconds))}`,10,'#ead1b3');
    this.label(306,10,`${s.cash} xu`,17,ink);
    this.customers();this.orderCard();this.recipes();this.graphics();
    if(s.stage==='boxed'){
      const source=this.textures.get(PIZZA_BOX_ART.key).getSourceImage();
      const box=this.add.image(120,344,PIZZA_BOX_ART.key).setDisplaySize(108,108*source.height/source.width);
      this.layer.add(box);
    }else if(s.stage!=='baking'&&s.stage!=='burnt'&&s.ingredients.includes('dough')){
      // Each image reflects ingredients already added; toggling cheese cannot add sauce visually.
      const sauce=s.ingredients.includes('sauce'),cheese=s.ingredients.includes('cheese');
      this.referenceSprite(sauce?(cheese?'pizza-cheese':'pizza-sauce'):'pizza-base',120,343,104);
      if(cheese&&!sauce)this.icon('cheese',120,343,81);
      if(s.ingredients.includes('mushroom'))this.icon('mushroom',120,343,65);
      if(s.ingredients.includes('sausage'))this.icon('sausage',120,343,65);
    }
    if(assembly&&!s.ingredients.includes('dough'))this.label(120,332,this.runtime.needsRemake?'Chạm thớt\nđể làm lại':this.runtime.productionActive&&!this.runtime.selectedTicket?'Chạm thớt\nđể xem kho':'Chạm “Đế bánh”\nđể bắt đầu',12,board,140);
    if(s.stage==='baking'||s.stage==='burnt')this.label(120,328,s.stage==='burnt'?'Bánh đã cháy!\nBỏ bánh để làm lại.':'Pizza đang trong lò →\nCanh vạch đỏ vào vùng xanh!',11,board,190);
    if(this.runtime.needsRemake)this.hit('remake',18,298,204,80,true,()=>this.runtime.remake());
    else if(this.runtime.productionActive&&!this.runtime.selectedTicket&&!this.runtime.selectedExpired)this.hit('market-prepare',18,298,204,80,true,()=>this.runtime.prepareAgain());
    else this.hit('dough-board',18,298,204,80,assembly,()=>this.runtime.dispatch({type:'ingredient',ingredient:'dough'}));
    this.ovens();this.sauceShelf();
    const ready=this.runtime.bakeReady;
    const counterReady=this.runtime.productionActive&&s.stage==='ready'&&this.runtime.selectedTicket?.takeaway===false;
    const hint=this.runtime.needsRemake?'Chạm thớt để giữ nguyên liệu và làm lại':assembly?(ready?'Đủ nguyên liệu · chạm Lò 1 để nướng':'Đặt đủ nguyên liệu theo đơn'):s.stage==='baking'?(perfect?(s.ovenSeconds>=4?'Sắp quá lửa! Chạm lò để lấy bánh.':'Chín vừa! Chạm lò để lấy bánh.'):'Dưới 3 giây: bánh vẫn còn sống'):s.stage==='raw'?'Bánh còn sống · chạm ô xóa để bỏ':s.stage==='burnt'?'Bánh cháy · chạm ô xóa để bỏ':s.stage==='ready'?(counterReady?'Bánh đã chín · giao tại quầy':'Bánh đã chín · cần đóng hộp'):'Pizza đã đóng hộp · giao cho khách';
    this.label(120,381,hint,9,board,208);
    const source=this.runtime.deliverySource,target=this.runtime.selectedTicket;
    const earlyDelivery=this.runtime.productionActive&&source?.id===target?.id&&!counterReady&&['raw','ready','burnt'].includes(s.stage);
    this.kitchenAction('box',0,'Đóng hộp',s.stage==='ready'&&!this.runtime.selectedExpired,()=>this.runtime.dispatch({type:'box'}));
    const canDeliver=!this.runtime.selectedExpired&&(this.runtime.productionActive?!!source&&!!target:s.stage==='boxed');
    this.kitchenAction(earlyDelivery?'deliver-unboxed':'deliver',1,'Giao bánh',canDeliver,()=>{
      if(this.runtime.productionActive)this.runtime.dispatch({type:'deliver',sourceId:source?.id,targetId:target?.id,commandId:`deliver:${source?.id}:${target?.id}`});
      else this.runtime.dispatch({type:'deliver'});
    });
    this.inventory();
    if(this.lastTap&&!this.reducedMotion&&!this.runtime.pauses.length){const c=this.controls.find(control=>control.id===this.lastTap);if(c){const glow=this.add.rectangle(c.x+c.width/2,c.y+c.height/2,c.width-4,c.height-4,0xffe1a0,.2);this.layer.add(glow);this.tweens.add({targets:glow,alpha:0,duration:170,onComplete:()=>glow.destroy()});}}this.lastTap='';
    if(this.runtime.shopPhase==='summary'||this.runtime.postTutorialPreparation){
      if(this.runtime.postTutorialPreparation&&!this.initialHubShown){this.summaryTab='market';this.initialHubShown=true;}
      this.dayHub();
      if(this.statementOpen&&!this.runtime.pauses.some(p=>p!=='order'))this.statementDialog();
      else if(this.priceDraft&&!this.runtime.pauses.some(p=>p!=='order'))this.priceDialog();
      else if(this.runtime.pauses.some(p=>p!=='save'))this.overlay();
    }
    else if(this.priceDraft&&!this.runtime.pauses.some(p=>p!=='order')){this.market();this.priceDialog();}
    else if(this.runtime.pauses.some(p=>p!=='tutorial'&&p!=='discard'&&p!=='delivery'&&p!=='bargain'&&p!=='help'))this.overlay();
    else if(this.runtime.tutorialActive)this.tutorial();
    else if(this.runtime.discardPending)this.discardDialog();
    else if(this.runtime.deliveryPending)this.deliveryDialog();
    else if(this.runtime.bargainPending)this.bargainDialog();
    else if(this.runtime.helpPending||this.runtime.thanksPending)this.helpDialog();
    else if(this.runtime.productionActive&&this.runtime.shopPhase==='preparation')this.market();
    else if(s.stage==='delivered'&&(!this.runtime.productionActive||this.runtime.shopPhase==='delivered'))this.success();
    if(this.campaignSession&&(['saving','error','loading','recovery'].includes(this.campaignSession.view.state)&&!this.saveDismissed||this.reloadConfirmation))this.saveDialog();
    else if(this.newCampaignConfirmation)this.newCampaignDialog();
    else if(this.finalOpen)this.finalDialog();
    if(this.campaignSession?.view.state==='temporary'&&!this.newCampaignConfirmation&&!this.finalOpen)this.label(180, this.runtime.shopPhase==='summary'||this.runtime.postTutorialPreparation?572:611,'Chơi tạm không lưu · tải lại sẽ mất phiên',9,cream,330);
    for(const [id,zone] of this.hitZones)if(!this.controls.some(control=>control.id===id)){zone.destroy();this.hitZones.delete(id);}
    this.staticGraphics.bake(this.layer);
    const canvas=this.game.canvas;canvas.dataset.screen=this.runtime.postTutorialPreparation?'preparation-hub':this.runtime.shopPhase==='summary'?'day-summary':'game';canvas.dataset.day=String(this.runtime.day);canvas.dataset.daySummary=JSON.stringify(this.runtime.daySummary);canvas.dataset.summaryTab=this.summaryTab;canvas.dataset.stage=s.stage;canvas.dataset.ingredients=s.ingredients.join(',');canvas.dataset.oven=String(s.ovenSeconds);canvas.dataset.cash=String(s.cash);canvas.dataset.paused=this.runtime.pauses.join(',');canvas.dataset.controls=JSON.stringify(this.controls);canvas.dataset.booted='true';
    canvas.setAttribute('aria-label',`Tiệm pizza. Ngày ${this.runtime.day}. ${s.cash} xu. ${this.runtime.productionActive?this.runtime.shopMessage:s.feedback}`);
    canvas.dataset.tutorial=this.runtime.tutorialStep??'off';
    canvas.dataset.commercialCash=String(this.runtime.commercialState.cash);
    canvas.dataset.reducedMotion=String(this.reducedMotion);
    canvas.dataset.audio=this.audio.status;canvas.dataset.muted=String(this.audio.muted);
    canvas.dataset.bands=JSON.stringify(PLAY_BANDS);canvas.dataset.textScale=String(this.textScale);
    canvas.dataset.shop=this.runtime.productionActive?this.runtime.shopPhase:'freeplay';
    canvas.dataset.recipe=this.runtime.selectedRecipe;
    canvas.dataset.tickets=JSON.stringify(this.runtime.tickets);
    canvas.dataset.selectedTicket=this.runtime.selectedTicketId;
    canvas.dataset.orderQueue=JSON.stringify(this.orderQueue.slots);
    canvas.dataset.kitchenLayout=JSON.stringify({width:KITCHEN.width,height:KITCHEN.height,order:KITCHEN.order,board:KITCHEN.board,customers:this.orderQueue.slots.map((_,i)=>KITCHEN.customer(i)),recipes:Array.from({length:8},(_,i)=>KITCHEN.recipe(i)),ingredients:Array.from({length:20},(_,i)=>KITCHEN.ingredient(i)),ovens:[KITCHEN.oven(0),KITCHEN.oven(1)],actions:[KITCHEN.action(0),KITCHEN.action(1)]});
    canvas.dataset.kitchenArt=JSON.stringify(this.layer.list.filter((o):o is Phaser.GameObjects.Image=>o instanceof Phaser.GameObjects.Image).map(image=>({key:image.texture.key,frame:image.frame.name,x:image.x,y:image.y,width:image.displayWidth,height:image.displayHeight})));
    canvas.dataset.orderDetail=JSON.stringify(this.orderQueue.detail);
    canvas.dataset.ovenOwner=this.runtime.ovenOwner??'';
    canvas.dataset.discardPending=String(this.runtime.discardPending);
    canvas.dataset.deliveryPending=JSON.stringify(this.runtime.deliveryPending);
    canvas.dataset.result=JSON.stringify(this.runtime.lastResult);
    canvas.dataset.bargain=JSON.stringify(this.runtime.bargainPending);
    canvas.dataset.help=JSON.stringify(this.runtime.helpState);canvas.dataset.helpOffer=JSON.stringify(this.runtime.helpPending);
    canvas.dataset.customerProgress=JSON.stringify(this.runtime.customerProgress);
    canvas.dataset.priceDialog=JSON.stringify(this.priceDraft);
    canvas.dataset.statementOpen=String(this.statementOpen);
    canvas.dataset.preparationBudget=JSON.stringify(this.runtime.preparationBudget);
    canvas.dataset.quality=this.runtime.bakeQuality;
    canvas.dataset.stock=JSON.stringify(STOCK_INGREDIENTS.map(id=>({id,owned:this.runtime.owned(id),available:this.runtime.available(id),reserved:this.runtime.reserved(id)})));
    canvas.dataset.progression=JSON.stringify(this.runtime.progression);canvas.dataset.menuRecipes=JSON.stringify(this.runtime.menuRecipes);
    if(this.campaignSession)canvas.dataset.saveState=JSON.stringify(this.campaignSession.view);
    // Read-only geometry makes canvas typography verifiable at every device scale.
    canvas.dataset.labels=JSON.stringify(this.layer.list.filter((o):o is Phaser.GameObjects.Text=>o instanceof Phaser.GameObjects.Text).map(t=>({text:t.text,x:t.getBounds().x,y:t.getBounds().y,width:t.width,height:t.height,font:t.style.fontFamily,size:t.style.fontSize,spacing:t.letterSpacing,color:t.style.color})));
  }
  private sauceShelf():void{
    const s=this.runtime.state,assembly=s.stage==='assembly';
    ['Cà chua','Kem trắng','BBQ','Pesto','Sốt cay'].forEach((name,i)=>{
      const {x,y,w,h}=KITCHEN.ingredient(i),available=i===0;
      this.label(x+w/2,y+31,name,9,available?cream:muted);
      this.ingredientState(x,y,w,h,available,available&&s.ingredients.includes('sauce'));
      if(available){this.hit('sauce',x,y,w,h,assembly,()=>this.runtime.dispatch({type:'ingredient',ingredient:'sauce'}));if(this.runtime.productionActive)this.stockBadge('sauce',x,y,w);}
    });
  }
  private ingredientState(x:number,y:number,w:number,h:number,available:boolean,selected:boolean):void{
    this.graphics();
    if(selected)this.art.g.lineStyle(2,UI.gold,1).strokeRoundedRect(x+1,y+1,w-2,h-2,8);
    if(!available){this.art.g.fillStyle(0x19120d,.38).fillRoundedRect(x+2,y+2,w-4,h-4,8);this.icon('lock',x+w-8,y+9,12,.9);}
  }
  private stockBadge(id:StockIngredient,x:number,y:number,w:number):void{
    this.graphics();this.art.circle(x+w-8,y+9,7,UI.dark);this.label(x+w-8,y+2,String(this.runtime.owned(id)),8,cream);
  }
  private ovens():void{
    const s=this.runtime.productionActive?this.runtime.ovenState??this.runtime.state:this.runtime.state,occupied=this.runtime.productionActive?!!this.runtime.ovenState:s.stage==='baking'||s.stage==='burnt';
    for(let i=0;i<2;i++){
      const {x,y,w,h}=KITCHEN.oven(i);
      const frame=!i&&occupied?(s.stage==='burnt'?'oven-burnt':'oven-occupied'):'oven-empty';
      this.referenceSprite(frame,x+w/2,y+h/2,w,h)?.setTint(i?0x99877b:0xffffff);
      this.label(x+w/2,y-12,i?'Lò 2':'Lò 1',12,cream);
      if(i){this.icon('lock',x+w/2,y+30,23,.85);this.label(x+w/2,y+48,'Chưa mở khóa',9,muted);}
      else{
        this.graphics();const gx=243,gy=y+h-4,width=100;
        this.art.round(gx,gy,width,6,3,0xc49b52);
        this.art.rect(gx+width*COZY_BAKE.perfectStart/COZY_BAKE.gaugeEnd,gy,width*(COZY_BAKE.perfectEnd-COZY_BAKE.perfectStart)/COZY_BAKE.gaugeEnd,6,0x5bd06a);
        this.art.rect(gx+width*COZY_BAKE.perfectEnd/COZY_BAKE.gaugeEnd,gy,width*(1-COZY_BAKE.perfectEnd/COZY_BAKE.gaugeEnd),6,0x703d33);
        this.heatMarker=this.add.rectangle(gx+width*s.ovenSeconds/COZY_BAKE.gaugeEnd,gy+3,3,11,0xff3939).setStrokeStyle(1,UI.ink);this.layer.add(this.heatMarker);
        const active=this.runtime.state;
        const baking=occupied&&s.stage==='baking';
        const canExtract=baking&&(this.runtime.productionActive||s.ovenSeconds>=COZY_BAKE.perfectStart);
        const canBake=!occupied&&active.stage==='assembly'&&this.runtime.bakeReady&&!this.runtime.selectedExpired;
        this.hit(baking?'extract':occupied?'oven-1':'bake',x,y,w,h,canExtract||canBake||occupied&&this.runtime.productionActive,()=>{
          const owner=this.runtime.ovenOwner;
          if(owner&&!this.runtime.selectPizza(owner))return;
          if(baking)this.runtime.dispatch({type:'extract'});
          else if(canBake)this.runtime.dispatch({type:'bake'});
        });
      }
    }
  }
  private queueInputs():readonly OrderQueueInput[]{
    if(this.runtime.productionActive)return this.runtime.tickets;
    if(this.runtime.state.stage==='delivered')return [];
    // The existing Linh order is the real practice/freeplay order, without a customer deadline.
    return [{id:'practice-linh',name:'Linh',number:this.runtime.tutorialActive?'Tập':'1',recipe:'cheese',remaining:null}];
  }
  private shiftTimeText():string{
    const clock=this.runtime.shiftClock;
    return clock.phase==='awaiting-close'?'Chốt ngày':`${clock.phase==='grace'?'Chờ':'Ca'} ${timerText(clock.remaining)}`;
  }
  private customers():void{
    this.orderQueue.slots.forEach((slot,i)=>{
      const bounds=KITCHEN.customer(i),{centerX,centerY}=bounds;
      if(slot.icon==='phone')this.icon('phone',centerX,centerY,37);
      else {
        let hash=0;for(const c of slot.name)hash=(hash+c.charCodeAt(0))%6;
        const known=['Linh','Mai','Nam','Vy','Minh','An'].indexOf(slot.name);
        this.referenceSprite('avatar-'+(known>=0?known:hash),centerX,centerY,43);
      }
      this.graphics();
      if(slot.selected)this.art.g.lineStyle(2,UI.gold,1).strokeCircle(centerX,centerY,24);
      if(slot.patienceRatio!==null)this.art.g.lineStyle(1.5,slot.patienceRatio<.25?0xffad85:0xa9774d,1).beginPath().arc(centerX,centerY,25,-Math.PI/2,-Math.PI/2+Math.PI*2*slot.patienceRatio).strokePath();
      this.label(centerX,122,slot.name,10,ink,51);
      if(this.runtime.productionActive)this.timer(centerX,134,()=>timerText(this.runtime.tickets.find(t=>t.id===slot.id)?.remaining??0),8,ink);
      this.hit(this.runtime.productionActive?'ticket-'+slot.id:'customer-linh',bounds.x,bounds.y,bounds.w,bounds.h,true,()=>{
        this.inspectedRecipe=null;
        if(this.runtime.productionActive){if(this.runtime.selectTicket(slot.id)&&this.runtime.selectedTicketId===slot.id)this.inspectedOrderId=slot.id;}
        else if(!this.runtime.pauses.some(reason=>reason!=='tutorial'))this.inspectedOrderId=slot.id;
      });
    });
  }
  private orderCard():void{
    const detail=this.orderQueue.detail,message=this.runtime.shopMessage;
    const notice=this.runtime.productionActive&&['Khách từ chối giá','Khách chưa thể đặt món.','Đã đủ 3 đơn'].some(prefix=>message.startsWith(prefix))?message:'';
    if(detail){
      this.referenceSprite('recipe-'+detail.recipe,33,164,28);
      this.label(53,146,detail.lines[0],10,ink,282,'left');
      this.label(53,158,detail.lines[1],9,accent,282,'left');
      this.label(53,170,notice||detail.lines[2],8,wood,282,'left');
    }else {this.label(180,151,ORDER_DETAIL_PROMPT,13,ink,310);if(notice)this.label(180,170,notice,8,wood,310);}
    const {x,y,w,h}=KITCHEN.order;
    this.hit('order',x,y,w,h,!!detail||this.runtime.tutorialActive||!!notice,()=>{this.inspectedRecipe=null;if(this.orderQueue.detail||this.runtime.tutorialActive||notice)this.hold('order');});
  }
  private recipes():void{
    const production=this.runtime.productionActive&&!this.runtime.tutorialActive;
    const recipes=[['cheese','Phô mai'],['mushroom','Nấm'],['sausage','Xúc xích'],['pepperoni','Pepperoni'],['vegetable','Rau củ'],['bbq','Gà BBQ'],['seafood','Hải sản'],['ham','Giăm bông']];
    recipes.forEach(([recipe,name],i)=>{
      const {x,y,w,h}=KITCHEN.recipe(i);
      const available=recipe==='cheese'||production&&this.runtime.availableRecipes.includes(recipe as StockRecipe);
      this.referenceSprite('recipe-'+recipe,x+w/2,y+15,38);
      this.label(x+w/2,y+31,name,10,available?cream:muted,w-6);
      this.ingredientState(x,y,w,h,available,recipe===this.runtime.selectedRecipe);
      if(!production||i>=Math.min(3,this.runtime.abandonedPizzas.length))this.hit('recipe-'+i,x,y,w,h,available,()=>{this.inspectedRecipe=recipe as StockRecipe;this.hold('order');});
    });
    if(production)this.runtime.abandonedPizzas.slice(0,3).forEach((pizza,i)=>{
      const {x,y,w,h}=KITCHEN.recipe(i);this.graphics();this.art.panel(x,y,w,h,UI.dark,UI.border,8);
      this.label(x+w/2,y+4,'Bánh bỏ\n'+pizza.name,11,cream,w-6);
      this.hit('expired-pizza-'+pizza.id,x,y,w,h,true,()=>{this.runtime.selectPizza(pizza.id);this.runtime.requestDiscard();});
    });
  }
  private inventory():void{
    const items=[['dough','Đế bánh'],['cheese','Phô mai'],['mushroom','Nấm'],['sausage','Xúc xích'],['pepperoni','Pepperoni'],['pepper','Ớt chuông'],['onion','Hành tây'],['corn','Bắp'],['olive','Ô liu'],['chicken','Gà'],['shrimp','Tôm'],['squid','Mực'],['ham','Giăm bông'],['pineapple','Dứa']];
    const s=this.runtime.state,production=this.runtime.productionActive&&!this.runtime.tutorialActive;
    items.forEach(([id,name],i)=>{
      const {x,y,w,h}=KITCHEN.ingredient(i+5);
      const available=id==='dough'||id==='cheese'||production&&(id==='mushroom'||id==='sausage'&&this.runtime.availableRecipes.includes('sausage'));
      this.label(x+w/2,y+31,name,9,available?cream:muted,w-3);
      this.ingredientState(x,y,w,h,available,available&&s.ingredients.includes(id as StockIngredient));
      if(available){this.hit(id,x,y,w,h,s.stage==='assembly',()=>this.runtime.dispatch({type:'ingredient',ingredient:id as StockIngredient}));if(production)this.stockBadge(id as StockIngredient,x,y,w);}
    });
    const {x,y,w,h}=KITCHEN.ingredient(19),discardable=this.runtime.selectedExpired||['raw','ready','burnt'].includes(s.stage);
    this.label(x+w/2,y+31,'Xóa tất cả',9,cream);
    this.hit(discardable?'discard':'clear',x,y,w,h,discardable||s.stage==='assembly'&&s.ingredients.length>0,()=>{if(discardable){if(production)this.runtime.requestDiscard();else this.runtime.dispatch({type:'discard'});}else for(const ingredient of [...this.runtime.state.ingredients])this.runtime.dispatch({type:'ingredient',ingredient});});
  }
  private veil():void{
    this.visibleActions=[];for(const zone of this.hitZones.values())zone.disableInteractive();
    this.graphics();this.art.rect(0,160,360,480,0x241810,.87);const blocker=this.add.zone(0,0,360,640).setOrigin(0).setInteractive();this.layer.add(blocker);this.controls=[];
    this.graphics();this.art.panel(22,208,316,225,UI.paper,0x754934,UI_THEME.radii.modal);
    const oven=this.runtime.ovenState??this.runtime.state;
    const quality=oven.stage==='burnt'?'Bánh cháy':oven.stage==='baking'?(oven.ovenSeconds<3?'Đang nướng':oven.ovenSeconds>=4?'Sắp cháy':'Sẵn sàng'):oven.stage==='ready'?'Đã lấy bánh':'Lò trống';
    this.label(180,175,`${this.runtime.pauses.length?'Đang dừng':'Đang chạy'} · ${quality} · ${timerText(Math.floor(oven.ovenSeconds))}`,12,cream,340);
  }
  private purchase(ingredient:StockIngredient,quantity:number):void{
    const key=`${this.runtime.preparationDay}:${ingredient}:${quantity}`,at=performance.now();
    const commandId=this.lastPurchase?.key===key&&at-this.lastPurchase.at<350?this.lastPurchase.id:`ui-purchase-${this.purchaseScope}-${++this.purchaseSerial}`;
    this.lastPurchase={key,at,id:commandId};
    this.runtime.dispatch({type:'market.buy',ingredient,quantity,commandId});
  }
  private choosePrice(recipe:StockRecipe):void{
    if(this.runtime.canSetPrices){
      if(!this.runtime.availableRecipes.includes(recipe))return;
      if(this.runtime.menuRecipes.includes(recipe))this.runtime.selectRecipe(recipe);
      this.priceDraft={recipe,percent:this.runtime.customerProgress.pricePercents[recipe],enabled:this.runtime.menuRecipes.includes(recipe)};
      this.priceError='';
      this.priceLease=this.runtime.acquirePause('order');
    }else if(!this.runtime.selectRecipe(recipe))return;
    this.dirty=true;
  }
  private closePrice(apply=false):void{
    if(this.runtime.pauses.some(p=>p!=='order'))return;
    const draft=this.priceDraft;this.priceDraft=null;this.priceLease?.release();this.priceLease=undefined;
    if(apply&&draft&&!this.runtime.dispatch({type:'menu.configure',...draft})){
      this.priceDraft=draft;this.priceError=this.runtime.shopMessage;this.priceLease=this.runtime.acquirePause('order');
    }
    this.dirty=true;
  }
  private priceDialog():void{
    const draft=this.priceDraft;if(!draft)return;
    for(const zone of this.hitZones.values())zone.disableInteractive();this.controls=[];this.visibleActions=[];
    this.veil();this.graphics();this.art.panel(22,188,316,342,UI.paper,UI.border,20);
    this.label(180,207,recipeName(draft.recipe),22,ink);
    this.button('market-price-recipe',42,246,276,48,'Đổi món · '+recipeName(draft.recipe),true,()=>{
      const recipes=this.runtime.availableRecipes,next=recipes[(recipes.indexOf(draft.recipe)+1)%recipes.length];
      draft.recipe=next;draft.percent=this.runtime.customerProgress.pricePercents[next];draft.enabled=this.runtime.menuRecipes.includes(next);this.priceError='';this.dirty=true;
    },UI.dark);
    this.label(180,302,`${draft.percent}% · ${menuPrice(recipePrice(draft.recipe),draft.percent)} xu`,23,ink);
    this.button('market-price-minus',52,353,112,48,'− 5%',draft.percent>80,()=>{draft.percent=Math.max(80,draft.percent-5);this.dirty=true;},UI.dark);
    this.button('market-price-plus',196,353,112,48,'+ 5%',draft.percent<140,()=>{draft.percent=Math.min(140,draft.percent+5);this.dirty=true;},UI.dark);
    this.label(180,330,this.priceError||'Giá 80–140% · Giá cao có thể bị từ chối',10,wood,290);
    this.button('market-price-enabled',188,408,132,48,draft.enabled?'Có trong\nthực đơn':'Bỏ khỏi\nthực đơn',true,()=>{draft.enabled=!draft.enabled;this.dirty=true;},draft.enabled?UI.green:UI.dark);
    if(draft.recipe==='sausage')this.button('market-buy-sausage',40,408,132,48,`Mua xúc xích\n${this.runtime.price('sausage')} xu · Có ${this.runtime.owned('sausage')}`,this.runtime.state.cash>=this.runtime.price('sausage'),()=>{
      this.priceLease?.release();this.priceLease=undefined;
      this.purchase('sausage',1);this.priceLease=this.runtime.acquirePause('order');this.dirty=true;
    });
    else this.label(106,413,'Chỉ đổi trước\nkhi mở cửa',11,wood,128);
    this.button('market-price-cancel',40,462,132,48,'Hủy',true,()=>this.closePrice(),UI.dark);
    this.button('market-price-save',188,462,132,48,'Lưu giá',true,()=>this.closePrice(true));
  }
  private openStatement():void{
    if(this.runtime.pauses.length||!this.runtime.daySummary)return;
    this.statementOpen=true;this.statementLease=this.runtime.acquirePause('order');this.dirty=true;
  }
  private closeStatement():void{
    if(this.runtime.pauses.some(p=>p!=='order'))return;
    this.statementOpen=false;this.statementLease?.release();this.statementLease=undefined;this.dirty=true;
  }
  private statementDialog():void{
    const summary=this.runtime.daySummary;if(!summary)return;
    const a=summary.accounts;
    for(const zone of this.hitZones.values())zone.disableInteractive();
    for(const item of this.layer.list)if(item instanceof Phaser.GameObjects.Zone)item.disableInteractive();
    this.controls=[];this.visibleActions=[];this.game.canvas.dataset.modalScroll='[]';
    this.veil();this.graphics();this.art.panel(22,142,316,432,UI.paper,UI.border,20);
    this.label(180,159,`Sổ thu chi · Ngày ${summary.day}`,22,ink,292);
    const lines=[
      `Tiền đầu ngày: ${a.startingCash} xu`,
      `Bán pizza: +${a.sales} xu · Thưởng: +${a.rewards} xu`,
      `Mua nguyên liệu: −${a.purchases} xu`,
      `Thuê: −${a.rent} xu · Lương: −${a.wages} xu`,
      `Sửa chữa: −${a.repairs} xu · Khác: −${a.other} xu`,
      `Tiền cuối ngày đã chốt: ${a.endingCash} xu`,
      `Tiền hiện có: ${this.runtime.state.cash} xu`,
      'Mua cho ngày sau chỉ đổi tiền hiện có.',
      '',`Lợi nhuận: ${a.profit} xu`,
      `Bán ${a.sales} − giá vốn ${a.consumed} − hết hạn ${a.expired} − thuê ${a.rent} − lương ${a.wages} − sửa ${a.repairs} − khác ${a.other}.`,
      `Lợi nhuận cộng dồn: ${a.cumulativeProfit} xu`,
      'Tiền mua hàng không trừ thêm vào lợi nhuận. Hết hạn không trừ tiền mặt lần nữa.',
      '',`Tồn đầu ngày: ${a.openingInventoryValue} xu`,
      `Tồn cuối ngày: ${a.inventory.units} phần · ${a.inventory.value} xu`,
      `Tồn đầu ${a.openingInventoryValue} + mua ${a.purchases} = dùng ${a.consumed} + hết hạn ${a.expired} + tồn cuối ${a.inventory.value}.`,
      `Trong giá vốn đã dùng: món tặng ${a.giftCost} xu (không trừ thêm lần nữa).`,
      ...a.inventory.lots.map(l=>`${catalog.find(row=>row.id===l.ingredient)!.name} ×${l.quantity} · ${l.unitCost} xu/phần\nLô ngày ${l.day}, hết ngày ${l.expiry}`),
      '',`Lương 0: ${a.zeroReasons.wages}`,`Sửa chữa 0: ${a.zeroReasons.repairs}`,`Thưởng ${a.rewards}: ${a.zeroReasons.rewards}`,`Khác 0: ${a.zeroReasons.other}`,
    ];
    modalText(this,this.layer,36,207,288,285,lines.join('\n'),14,ink,this.textScale);
    this.button('summary-statement-close',46,510,268,48,'Đóng sổ',true,()=>this.closeStatement(),UI.dark);
  }
  private market():void{
    this.veil();this.graphics();this.art.panel(10,62,340,548,UI.paper,UI.border,20);
    this.button('pause',6,0,48,48,'Ⅱ',true,()=>this.hold('user'),UI.dark);
    this.button('mute',62,0,70,48,this.audio.muted?'Âm: tắt':'Âm: bật',true,()=>this.audio.toggleMute(),UI.dark);
    if(this.restartConfirmation){
      this.label(180,180,'Làm lại Ngày 1?',23,ink);
      this.label(180,232,'Tiền và kho hiện tại sẽ được đặt lại\nvề 300 xu và kho trống.',14,ink,296);
      this.button('market-cancel-reset',42,330,276,48,'Tiếp tục chuẩn bị',true,()=>{this.restartConfirmation=false;this.dirty=true;});
      this.button('market-confirm-reset',42,392,276,48,'Xác nhận làm lại',true,()=>{this.restartConfirmation=false;this.quantities={dough:1,sauce:1,cheese:1,mushroom:1};this.runtime.dispatch({type:'reset'});},UI.dark);return;
    }
    this.label(180,76,'Chuẩn bị mở tiệm',23,ink);
    this.label(180,109,`${this.runtime.state.cash} xu · Thuê 20 xu · Ngày ${this.runtime.day}`,13,wood);
    (['dough','sauce','cheese','mushroom'] as const).forEach((id,i)=>{
      const row=catalog.find(item=>item.id===id)!,y=143+i*71,qty=this.quantities[id];
      this.graphics();this.art.panel(20,y,320,64,UI.dark,UI.border,10);
      this.icon(id,42,y+21,30);this.label(66,y+5,row.name,11,cream,80,'left');
      this.label(66,y+24,`${this.runtime.price(id)} xu / phần`,10,cream,80,'left');
      this.label(30,y+46,`Có ${this.runtime.owned(id)} · HSD mới ${this.runtime.purchaseExpiry(id)}`,9,muted,118,'left');
      this.button(`market-minus-${id}`,148,y+7,48,48,'−',!this.runtime.shopOpen&&qty>1,()=>{this.quantities[id]--;this.dirty=true;},UI.dark);
      this.button(`market-plus-${id}`,201,y+7,48,48,'+',!this.runtime.shopOpen&&qty<100,()=>{this.quantities[id]++;this.dirty=true;},UI.dark);
      const affordable=qty*this.runtime.price(id)<=this.runtime.state.cash;
      this.button(`market-buy-${id}`,254,y+7,76,48,this.runtime.shopOpen?'Đã mở ca':affordable?`Mua ${qty}`:'Thiếu xu',!this.runtime.shopOpen&&affordable,()=>this.purchase(id,qty));
    });
    for(const [i,id] of (['cheese','mushroom'] as const).entries()){
      this.button(`market-recipe-${id}`,20+i*163,431,157,48,`${id==='cheese'?'Phô mai':'Nấm'} · ${this.runtime.customerProgress.prices[id]} xu`,true,()=>this.choosePrice(id),this.runtime.selectedRecipe===id?UI.green:UI.dark);
    }
    this.label(180,487,this.runtime.shopOpen?'Đã mở ca: chỉ xem kho, không mua thêm.':this.runtime.preparationBudget.warning||this.runtime.shopMessage,11,ink,310);
    this.button('market-open',20,545,157,48,'Mở tiệm',this.runtime.canOpen,()=>this.runtime.openShop());
    if(this.runtime.shopOpen)this.button('market-orders',183,545,157,48,'Trở lại đơn',true,()=>this.runtime.returnToOrders(),UI.dark);
    else if(this.runtime.day===1)this.button('market-reset',183,545,157,48,this.campaignSession?'Chiến dịch mới':'Làm lại Ngày 1',true,()=>{if(this.campaignSession)this.newCampaignConfirmation=true;else this.restartConfirmation=true;this.dirty=true;},UI.dark);
  }
  private hubAction(id:string,x:number,y:number,w:number,h:number,title:string,action:()=>void,icon?:string):void{
    this.graphics();this.art.panel(x,y,w,h,0xfff1dc,0xd2a77c,12);
    if(icon)this.icon(icon,x+24,y+h/2,34);
    this.label(x+(icon?45:12),y+12,title,12,ink,w-(icon?52:24),'left');
    this.hit(id,x,y,w,h,true,action);
  }
  private dayHub():void{
    const summary=this.runtime.daySummary,initial=this.runtime.postTutorialPreparation;
    if(!summary&&!initial)return;
    const canBuy=initial||this.runtime.canPrepareNextDay;
    this.layer.removeAll(true);this.controls=[];this.visibleActions=[];this.timers=[];this.heatMarker=undefined;
    for(const zone of this.hitZones.values())zone.disableInteractive();
    this.graphics();this.art.rect(0,0,360,640,0x9c5c35);
    // Original code-drawn wood, brick and leaves keep the supplied reference's warm shop setting.
    for(let y=0;y<640;y+=32){this.art.rect(0,y,360,2,0x704027);for(let x=(y/32%2)*42-42;x<360;x+=84)this.art.rect(x,y+2,2,30,0x7a452a);}
    this.art.panel(12,12,48,82,0x3c3022,0x7b482c,8);this.label(36,23,'Tiệm\nPizza\nẤm Áp',12,cream,44);
    if(initial){this.label(36,77,'Ⅱ',12,cream);this.hit('pause',12,12,48,82,true,()=>this.hold('user'));}
    this.art.panel(70,15,194,92,UI.paper,0x633820,14);
    this.art.g.lineStyle(4,0x4b2d20).lineBetween(85,0,85,20).lineBetween(248,0,248,20);
    this.label(167,33,initial?'Chuẩn bị mở tiệm':`Kết thúc ngày ${summary!.day}`,21,ink,185);
    this.label(167,65,initial?'Chuẩn bị cho ngày 1':summary!.ending?'Chặng bán hàng đã kết thúc':`Chuẩn bị cho ngày ${summary!.day+1}`,12,wood,185);
    this.art.panel(270,17,80,27,UI.paper,0x633820,12);this.icon('coin',281,30,23);this.label(319,23,`${this.runtime.state.cash} xu`,11,ink);
    const xp=summary?.progression.xp??this.runtime.progression.xp;
    this.art.panel(270,49,80,25,UI.paper,0x633820,12);this.label(310,55,`Cấp ${xp>=150?3:xp>=60?2:1} · ${xp}XP`,9,wood);
    this.art.panel(270,80,80,25,UI.paper,0x633820,12);this.label(310,86,summary?.rating==null?'☆ Chưa có':`★ ${summary.rating.toFixed(1)}`,11,wood);
    for(const [x,y] of [[8,97],[345,99],[10,565],[345,555]]){this.graphics();this.art.ellipse(x,y,11,27,0x6f8b48);this.art.ellipse(x+8,y+9,23,10,0x89a459);}
    this.graphics();this.art.panel(9,118,342,56,UI.paper,0x704129,13);
    const tabs=[['summary','Tổng kết'],['market','Chợ'],['stock','Kho'],['shop','Quán'],['missions','Nhiệm vụ']] as const;
    tabs.forEach(([id,title],i)=>{
      const x=12+i*68;this.graphics();this.art.round(x,122,65,48,10,this.summaryTab===id?0xb85b37:0xf9e7ce,0xd6af84,1);
      this.icon(['ledger','basket','crate','storefront','checklist'][i]!,x+32,135,22);this.label(x+32,149,title,11,this.summaryTab===id?cream:ink,63);
      this.hit(`summary-tab-${id}`,x,122,65,48,true,()=>{this.summaryTab=id;this.dirty=true;});
    });
    if(this.summaryTab==='summary'&&summary){
      this.graphics();this.art.panel(9,183,342,151,UI.paper,0x75452c,14);
      this.label(24,193,'▥  Hôm nay bán thế nào?',18,ink,313,'left');
      const figures=[['Doanh thu',summary.revenue],['Chi phí',summary.cost+summary.expired+summary.rent],['Lợi nhuận',summary.profit]] as const;
      figures.forEach(([title,value],i)=>{
        const x=18+i*109;this.art.round(x,225,105,49,9,i===2?0xe5ecc6:0xf2e3cc);
        this.label(x+52,229,title,11,i===2?'#355424':wood);this.label(x+52,247,`${value>0&&i===2?'+':''}${value} xu`,17,i===2?'#2b5926':ink);
        this.hit(`summary-figure-${i}`,x,225,105,49,true,()=>this.openStatement());
      });
      this.label(25,280,`${summary.delivered} đơn hoàn thành`,12,'#355424',155,'left');this.label(188,280,`${summary.abandoned} khách bỏ đi`,12,'#9b4a34',155,'left');
      this.label(180,307,`Đã mua ${summary.purchases} · Dùng ${summary.cost} · Hết hạn ${summary.expired} · Thuê ${summary.rent}`,9,wood,320);
      this.graphics();this.art.panel(9,342,342,103,UI.paper,0x75452c,14);
      this.label(24,351,'Đánh giá của khách',17,ink,310,'left');
      modalText(this,this.layer,25,380,310,55,(summary.reviews.length?summary.reviews.map(r=>`${r.name} · ${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}\n${r.reasons.join(', ')||'Đúng món và chín vừa.'}\nUy tín ${r.reputationDelta>0?'+':''}${r.reputationDelta} · Quan hệ +${r.relationshipDelta}`).join('\n\n'):'Chưa có đánh giá')+`\n\nUy tín ${summary.reputation}/100 · Quan hệ ${summary.relationship}/3\n${summary.referral?.reason??'Giới thiệu ngày 3: xét cuối ngày 2, uy tín ≥55.'}`,12,ink,this.textScale);
      this.graphics();this.art.panel(9,453,342,127,UI.paper,0x75452c,14);this.label(24,458,'Chuẩn bị ngày mai',16,ink,300,'left');
      const tiles=[['market','Mua nguyên liệu','dough'],['stock','Kho nguyên liệu','cheese'],['shop','Trang trí · Chưa mở','lock'],['missions','Nhiệm vụ','checklist']] as const;
      tiles.forEach(([tab,title],i)=>this.hubAction(`summary-prepare-${tab}`,17+(i%2)*166,481+Math.floor(i/2)*48,160,48,title,()=>{this.summaryTab=tab;this.dirty=true;}));
    }else if(this.summaryTab==='market'){
      this.graphics();this.art.panel(9,183,342,385,UI.paper,0x75452c,14);
      this.label(180,195,`Chợ · Ngày ${this.runtime.preparationDay}`,22,ink);
      if(!canBuy)this.label(180,265,'Ca bán đã kết thúc. Không thể nhập thêm.',14,wood,300);
      else (['dough','sauce','cheese','mushroom'] as const).forEach((id,i)=>{
        const y=231+i*68;this.graphics();this.art.round(18,y,324,61,10,0xf2e3cc);this.icon(id,43,y+27,37);
        this.label(69,y+8,catalog.find(row=>row.id===id)!.name,13,ink,162,'left');
        this.label(69,y+31,`${this.runtime.price(id)} xu · Có ${this.runtime.owned(id)}`,11,wood,164,'left');
        this.button(`summary-buy-${id}`,239,y+7,93,48,'Mua 1',this.runtime.price(id)<=this.runtime.state.cash,()=>this.purchase(id,1));
      });
      if(canBuy){
        for(const [i,recipe] of (['cheese','mushroom'] as const).entries())this.button('summary-recipe-'+recipe,18+i*165,505,159,48,recipe==='cheese'?'Pizza phô mai':'Pizza nấm',true,()=>this.choosePrice(recipe),this.runtime.selectedRecipe===recipe?UI.green:UI.dark);
      }
      this.label(180,556,this.runtime.preparationBudget.warning||`Thuê 20 xu · Còn sau thuê ${this.runtime.preparationBudget.afterRent} xu`,9,wood,310);
    }else if(this.summaryTab==='stock'){
      this.graphics();this.art.panel(9,183,342,385,UI.paper,0x75452c,14);this.label(180,196,'Kho nguyên liệu',22,ink);
      const lots=this.runtime.stockLots;
      const text=lots.length?lots.map(l=>`${catalog.find(row=>row.id===l.ingredient)!.name} ×${l.quantity}\nLô ngày ${l.day} · Dùng đến hết ngày ${l.expiry} · ${l.unitCost} xu/phần`).join('\n\n'):'Kho đang trống. Mua thêm nguyên liệu ở Chợ.';
      modalText(this,this.layer,28,243,304,258,text,14,ink,this.textScale);
      this.hubAction('summary-stock-market',24,508,312,48,'Đến Chợ mua nguyên liệu',()=>{this.summaryTab='market';this.dirty=true;});
    }else if(this.summaryTab==='summary'){
      this.graphics();this.art.panel(9,183,342,151,UI.paper,0x75452c,14);
      this.label(24,193,'Ngày 1 chưa bắt đầu',18,ink,313,'left');
      this.label(180,252,'Chưa có doanh thu hoặc kết quả ca bán.',14,wood,310);
      this.graphics();this.art.panel(9,342,342,103,UI.paper,0x75452c,14);
      this.label(24,351,'Đánh giá của khách',17,ink,310,'left');this.label(180,391,'Chưa có đánh giá',14,wood,310);
      this.graphics();this.art.panel(9,453,342,127,UI.paper,0x75452c,14);this.label(24,458,'Chuẩn bị ngày 1',16,ink,300,'left');
      const tiles=[['market','Mua nguyên liệu'],['stock','Kho nguyên liệu'],['shop','Trang trí · Chưa mở'],['missions','Nhiệm vụ']] as const;
      tiles.forEach(([tab,title],i)=>this.hubAction(`summary-prepare-${tab}`,17+(i%2)*166,481+Math.floor(i/2)*48,160,48,title,()=>{this.summaryTab=tab;this.dirty=true;}));
    }else if(this.summaryTab==='missions'&&summary){
      this.graphics();this.art.panel(9,183,342,385,UI.paper,0x75452c,14);this.label(180,196,'Mục tiêu & nhiệm vụ',22,ink);
      const p=this.runtime.progression,g=summary.goal,next=summary.ending?null:p.goal;
      const status=(value:string)=>value==='completed'?'Hoàn thành':value==='expired'?'Đã hết hạn':'Đang thực hiện';
      const unlock=p.unlockDay===null?'Cấp 2 (60 XP): mở xúc xích từ ngày sau':p.unlockDay<=3?`Xúc xích: mở từ ngày ${p.unlockDay}`:'Xúc xích: mở sau chặng demo';
      const lines=[`Ngày ${g.day} · ${status(g.status)}`,g.description,g.progress,'Thưởng khi chốt: 20 xu + 10 XP',
        ...(next?[`\nNgày ${next.day} · ${next.description}`,next.progress]:[]),
        `\nBán 8 pizza phô mai · ${status(p.mission)}`,`${p.cheeseSales}/8 món đúng công thức`,'Thưởng một lần: 30 xu + 20 XP + 2 uy tín',
        `\nCấp ${p.level} · ${p.xp} XP (mốc 0 / 60 / 150)`,unlock,'Đơn thương mại: 10 XP; 4–5 sao thêm 5 XP.',
        `Thưởng ngày đã chốt: ${summary.rewards} xu`, 'Thưởng ghi riêng, không cộng doanh thu hay lợi nhuận.'];
      modalText(this,this.layer,28,243,304,301,lines.join('\n'),14,ink,this.textScale);
    }else{
      this.graphics();this.art.panel(9,183,342,385,UI.paper,0x75452c,14);this.icon('lock',180,265,58);
      this.label(180,326,this.summaryTab==='shop'?'Trang trí & nâng cấp':'Nhiệm vụ',22,ink,300);this.label(180,370,'Chưa mở',18,wood,300);
      this.label(180,407,'Tính năng này chưa có trong bản chơi hiện tại.',13,wood,280);
    }
    this.graphics();this.art.rect(0,580,360,60,0x77442b);
    if(this.campaignSession&&['error','recovery'].includes(this.campaignSession.view.state)){
      this.label(68,587,'Chờ xử lý\ntiến độ',10,cream,117);
      this.button('save-show-status',133,587,214,48,'Xử lý lưu tiến độ',true,()=>{this.saveDismissed=false;this.dirty=true;},0x608341);
      return;
    }
    if(initial){
      this.label(68,587,this.runtime.canOpen?'Kiểm tra kho\ntrước khi mở quán':'Bổ sung đủ\nnguyên liệu ở Chợ',10,cream,117);
      this.button('summary-open-first-day',133,587,214,48,'Mở quán — Ngày 1',this.runtime.canOpen,()=>{this.runtime.openShop();this.inspectedOrderId=null;},0x608341);
    }
    else if(summary!.ending){
      this.label(68,587,summary!.ending==='complete'?'Hoàn thành\n3 ngày':'Hết vốn\nđể tiếp tục',10,cream,117);
      this.button('summary-final-result',133,587,214,48,'Kết quả cuối',!this.campaignSession||['ready','temporary'].includes(this.campaignSession.view.state),()=>{this.finalOpen=true;this.dirty=true;},0x608341);
    }
    else{
      this.label(68,587,this.runtime.canOpenNextDay?'Kiểm tra kho\ntrước khi mở quán':'Bổ sung đủ\nnguyên liệu ở Chợ',10,cream,117);
      this.button('summary-open-next-day',133,587,214,48,`Mở quán — Ngày ${summary!.day+1}`,this.runtime.canOpenNextDay,()=>{this.runtime.openNextDay();this.inspectedOrderId=null;},0x608341);
    }
  }
  private resetModalControls(){this.controls=[];this.visibleActions=[];for(const zone of this.hitZones.values())zone.disableInteractive();}
  private saveDialog():void {
    const session=this.campaignSession!;const save=session.view;this.resetModalControls();this.veil();this.graphics();this.art.panel(22,188,316,370,UI.paper,UI.border,20);
    this.label(180,210,this.reloadConfirmation?'Tải mốc mới nhất?':save.state==='saving'?'Đang lưu ngày…':'Tiến độ chưa lưu',22,ink,284);
    this.explanation(250,115,this.reloadConfirmation?'Kết quả và thay đổi RAM sau lần chốt trước sẽ mất. Chỉ mở đầu ngày hiện tại trong bản lưu mới nhất; ngày cũ không mở lại.':save.message,13);
    if(this.reloadConfirmation){
      this.button('save-reload-confirm',48,388,264,48,'Tải bản mới nhất',true,()=>{this.reloadConfirmation=false;void session.load().then(runtime=>{if(runtime)this.replaceRuntime?.(runtime);else if(session.view.state==='ready')this.returnToMenu?.();});});
      this.button('save-reload-cancel',48,452,264,48,'Giữ kết quả ở đây',true,()=>{this.reloadConfirmation=false;this.dirty=true;},UI.dark);return;
    }
    if(save.state==='loading'||save.state==='saving')return;
    if(save.state==='recovery')this.button('save-recover-confirm',48,380,264,48,'Dùng bản cùng mốc',true,()=>{const runtime=session.confirmRecovery();if(runtime)this.replaceRuntime?.(runtime);});
    else if(save.canRetry)this.button('save-retry',48,380,264,48,'Thử lưu lại',true,()=>{void session.retry().then(runtime=>{if(runtime&&runtime!==this.runtime)this.replaceRuntime?.(runtime);});});
    else this.button('save-read-again',48,380,264,48,'Thử đọc lại',true,()=>{this.reloadConfirmation=true;this.dirty=true;});
    this.button('save-reload',48,440,128,48,'Tải mới nhất',true,()=>{this.reloadConfirmation=true;this.dirty=true;},UI.dark);
    this.button('save-view-summary',184,440,128,48,'Xem kết quả',this.runtime.shopPhase==='summary',()=>{this.saveDismissed=true;this.dirty=true;},UI.dark);
    this.label(180,514,'Chuẩn bị và mở ngày sau đang bị khóa.',11,wood,278);
  }
  private finalDialog():void {
    const s=this.runtime.daySummary!;this.resetModalControls();this.veil();this.graphics();this.art.panel(22,168,316,408,UI.paper,UI.border,20);
    this.label(180,191,s.ending==='complete'?'Hoàn thành demo 3 ngày':'Không đủ vốn',22,ink,280);
    const p=s.progression;
    this.explanation(236,170,[s.viability?.message??'',`Tiền cuối: ${s.cash} xu`,`Lợi nhuận cộng dồn: ${s.accounts.cumulativeProfit} xu`,`Cấp ${p.xp>=150?3:p.xp>=60?2:1} · ${p.xp} XP`,`Uy tín ${s.reputation}/100 · Quan hệ Linh ${s.relationship}/3`,`Nhiệm vụ phô mai: ${p.cheeseSales}/8 · ${p.mission==='completed'?'hoàn thành':p.mission==='expired'?'đã hết hạn':'chưa hoàn thành'}`,this.campaignSession?.view.state==='temporary'?'Phiên tạm không lưu.':this.campaignSession?'Kết quả đã lưu. Không có Ngày 4 trong demo.':'Kết quả chỉ giữ trong phiên này.'].filter(Boolean).join('\n'),14);
    if(this.campaignSession)this.button('summary-new-campaign',48,432,264,48,'Chiến dịch mới',true,()=>{this.finalOpen=false;this.newCampaignConfirmation=true;this.dirty=true;});
    this.button('summary-final-close',48,500,264,48,'Xem tổng kết',true,()=>{this.finalOpen=false;this.dirty=true;},UI.dark);
  }
  private newCampaignDialog():void {
    this.resetModalControls();this.veil();this.graphics();this.art.panel(22,208,316,310,UI.paper,UI.border,20);
    this.label(180,231,this.campaignSession?'Chiến dịch mới?':'Làm lại Ngày 1?',23,ink);
    this.explanation(278,72,this.campaignSession?'Tiến độ hiện tại sẽ được thay bằng Ngày 1, 300 xu và kho trống. Các ngày đã chốt không thể mở lại. Chỉ thay bản cũ sau khi lưu mới thành công.':'Tiền và kho hiện tại sẽ được đặt lại về 300 xu và kho trống.',14);
    this.button('market-new-cancel',48,377,264,48,'Giữ chiến dịch hiện tại',true,()=>{this.newCampaignConfirmation=false;this.dirty=true;},UI.dark);
    this.button('market-new-confirm',48,442,264,48,this.campaignSession?'Tạo chiến dịch mới':'Xác nhận làm lại',true,()=>{this.newCampaignConfirmation=false;if(this.campaignSession)void this.campaignSession.start(false).then(runtime=>{if(runtime)this.replaceRuntime?.(runtime);});else {this.release('user');this.runtime.dispatch({type:'reset'});this.dirty=true;}});
  }
  private discardDialog():void{
    this.veil();this.graphics();this.art.panel(22,208,316,286,UI.paper,UI.border,20);
    this.label(180,232,'Bỏ chiếc pizza này?',22,ink);
    this.explanation(276,56,'Nguyên liệu đã dùng không được hoàn lại.\nLàm lại sẽ giữ nguyên liệu mới từ kho.');
    this.button('confirm-discard',64,352,232,48,'Xác nhận bỏ bánh',true,()=>this.runtime.confirmDiscard(),UI.dark);
    this.button('cancel-discard',64,410,232,48,'Giữ lại bánh',true,()=>this.runtime.cancelDiscard());
  }
  private deliveryDialog():void{
    const pending=this.runtime.deliveryPending!;
    this.veil();this.graphics();this.art.panel(22,208,316,286,UI.paper,UI.border,20);
    this.label(180,226,`Giao cho ${pending.name}?`,21,ink,280);
    this.explanation(264,68,`${recipeName(pending.recipe)}\n${pending.reasons.join('\n')}\nVẫn giao sẽ bị trừ sao.`);
    this.button('confirm-delivery',64,352,232,48,'Vẫn giao món',true,()=>this.runtime.confirmDelivery(),UI.dark);
    this.button('cancel-delivery',64,410,232,48,'Giữ lại bánh',true,()=>this.runtime.cancelDelivery());
  }
  private bargainDialog():void{
    const pending=this.runtime.bargainPending!;
    this.veil();this.graphics();this.art.panel(22,208,316,286,UI.paper,UI.border,20);
    this.label(180,226,`${pending.name} · Mặc cả`,21,ink,280);
    const missing=this.runtime.missingRecipeReason(pending.recipe);
    this.explanation(264,68,`${missing?missing+'\n':''}Giá gốc ${pending.originalPrice} xu · Giảm ${pending.discountPercent}%\nGiá chốt ${pending.finalPrice} xu · Mức nhận ≤${pending.maxPricePercent}%\nKiên nhẫn ${pending.patience} giây, bắt đầu khi đồng ý.`,13);
    this.button('accept-bargain',64,352,232,48,'Đồng ý giá giảm',!missing,()=>this.runtime.dispatch({type:'customer.bargain',accept:true}));
    this.button('reject-bargain',64,410,232,48,'Từ chối giá',true,()=>this.runtime.dispatch({type:'customer.bargain',accept:false}),UI.dark);
  }
  private helpDialog():void{
    const pending=this.runtime.helpPending;
    this.veil();this.graphics();this.art.panel(22,208,316,286,UI.paper,UI.border,20);
    this.label(180,226,pending?'Linh · Nhờ giúp':'Linh · Lời cảm ơn',21,ink,280);
    if(pending){
      this.explanation(264,68,`${pending.reason?pending.reason+'\n':''}Linh cần một pizza phô mai miễn phí, tại quầy, trong 120 giây.\nĐúng món chín vừa trước hạn: quan hệ +1. Nhận rồi giao sai/trễ: −1.\nDùng nguyên liệu thật; không doanh thu, XP, uy tín hay đánh giá thương mại. Từ chối không mất gì.`,13);
      this.button('accept-help',64,352,232,48,'Giúp Linh',pending.canAccept,()=>this.runtime.dispatch({type:'customer.help',accept:true}));
      this.button('decline-help',64,410,232,48,'Từ chối giúp',true,()=>this.runtime.dispatch({type:'customer.help',accept:false}),UI.dark);
    }else{
      this.explanation(264,68,'“Cảm ơn bạn đã nhớ món mình thích!”\nQuan hệ đạt 2: +20 xu, đã nhận một lần.\nKhoản cảm ơn tách khỏi doanh thu và lợi nhuận; không thêm XP hay công thức.',13);
      this.button('continue-thanks',64,352,232,48,'Tiếp tục ca',true,()=>this.runtime.dispatch({type:'customer.thanks'}));
    }
  }
  private tutorial():void{
    const step=this.runtime.tutorialStep;
    const messages:Record<string,[string,string]>={
      dough:['1/7 · Đặt đế bánh','Chạm vào thớt để đặt đế bánh tập.'],
      sauce:['2/7 · Phết sốt','Chạm chai sốt cà chua ở hàng bên dưới.'],
      cheese:['3/7 · Thêm phô mai','Chạm ô phô mai ở hàng nguyên liệu.'],
      bake:['4/7 · Đưa bánh vào lò','Chạm Lò 1 để nướng bánh đã đủ nguyên liệu.'],
      warming:['Đang tập nướng','Vạch đỏ chạy tới vùng xanh. Tiền và ca thật vẫn đứng yên.'],
      extract:['5/7 · Bánh chín vừa!','Chạm Lò 1 để lấy bánh ra. Đồng hồ tập đã dừng.'],
      box:['6/7 · Đóng hộp','Bấm “Đóng hộp” để chuẩn bị giao bánh tập.'],
      deliver:['7/7 · Giao bánh tập','Bấm “Giao bánh”. Bánh tập không tạo tiền thưởng.'],
    };
    if(step==='complete'){
      this.veil();this.label(180,236,'Bạn đã biết làm pizza!',22,ink,280);
      this.explanation(278,57,'Bánh tập đã hoàn thành.\nTiền và nguyên liệu của ca thật\nvẫn được giữ nguyên.',14);
      this.button('start-shift',64,355,232,54,'Đến Chợ mua hàng',true,()=>this.runtime.startShift());return;
    }
    const [title,detail]=messages[step??'dough'];
    // Reuse the order area; guidance never hides the required kitchen controls.
    this.graphics();this.art.g.fillStyle(UI.paper,1).fillRoundedRect(15,147,330,33,7);
    this.label(26,148,title,12,ink,307,'left');this.label(26,165,detail,9,ink,307,'left');
    const target=this.controls.find(c=>c.id===this.runtime.expectedControl);
    if(target){this.graphics();this.art.g.lineStyle(3,UI.gold,1).strokeRoundedRect(target.x+2,target.y+2,target.width-4,target.height-4,9);}
  }
  private overlay():void{
    this.veil();const pauses=this.runtime.pauses;
    if(this.scenePauses.has('user'))this.button('mute',62,0,70,48,this.audio.muted?'Âm: tắt':'Âm: bật',true,()=>this.audio.toggleMute(),UI.dark);
    if(this.scenePauses.has('user')&&this.runtime.shopOpen){this.graphics();this.art.panel(22,208,316,334,UI.paper,UI.border,20);}
    const reasons=`Đang dừng: ${pauses.map(p=>({tutorial:'hướng dẫn',user:'nghỉ tay',visibility:'ẩn màn hình',orientation:'xoay ngang',order:'đọc đơn',gap:'gián đoạn',success:'hoàn thành',discard:'xác nhận bỏ bánh',delivery:'xác nhận giao món',menu:'menu chính',bargain:'mặc cả',help:'lựa chọn giúp đỡ/lời cảm ơn',save:'lưu tiến độ'}[p])).join(', ')}`;
    if(pauses.includes('orientation')){this.label(180,245,'Xoay điện thoại về chiều dọc',17,ink,290);this.explanation(280,125,'Bánh và lò đang được giữ nguyên.\n'+reasons,12);return;}
    if(this.endDayConfirmation&&this.scenePauses.has('user')){
      this.graphics();this.art.panel(22,208,316,310,UI.paper,UI.border,20);
      this.label(180,231,`Kết thúc ngày ${this.runtime.day}?`,21,ink);
      this.explanation(270,95,`${this.runtime.tickets.filter(ticket=>!ticket.help).length} đơn thương mại chưa giao sẽ tính là khách bỏ đi.${this.runtime.tickets.some(ticket=>ticket.help)?'\nMón giúp chưa giao: quan hệ −1, không phạt uy tín.':''}\nBánh đang làm sẽ bỏ; nguyên liệu đã dùng không hoàn lại.\nTiền thuê: 20 xu.`,13);
      this.button('cancel-end-day',48,382,264,48,'Tiếp tục ca này',true,()=>{this.endDayConfirmation=false;this.dirty=true;},UI.dark);
      this.button('confirm-end-day',48,444,264,48,'Xác nhận kết thúc ngày',this.runtime.canCloseDay,()=>{if(this.campaignSession?this.campaignSession.closeDay():this.runtime.closeDay()){this.endDayConfirmation=false;this.summaryTab='summary';this.release('user');}});return;
    }
    const blocking=pauses.some(p=>p==='user'||p==='visibility'||p==='gap');
    if(!blocking&&this.inspectedRecipe){
      this.graphics();this.art.panel(22,208,316,286,UI.paper,UI.border,20);
      const recipe=this.inspectedRecipe;
      this.label(180,232,recipeName(recipe),22,ink);
      this.explanation(272,126,recipeIngredients(recipe).map(id=>catalog.find(item=>item.id===id)!.name).join(' + ')+'\n'+(this.runtime.productionActive?`Giá bán: ${this.runtime.customerProgress.prices[recipe]} xu\n`:'')+'Xem công thức không đổi món đang làm.\n'+reasons,13);
      this.button('close-order',64,422,232,54,'Tiếp tục làm bánh',this.scenePauses.has('order'),()=>{this.inspectedRecipe=null;this.release('order');});return;
    }
    if(!blocking&&this.runtime.productionActive){
      this.graphics();this.art.panel(22,208,316,330,UI.paper,UI.border,20);
      if(!this.runtime.selectedTicket){
        this.label(180,232,'Thông báo của quán',22,ink);
        this.explanation(272,166,`${this.runtime.shopMessage}\nUy tín ${this.runtime.customerProgress.reputation}/100\n${reasons}`,12);
        this.button('close-order',64,460,232,54,'Tiếp tục ca',this.scenePauses.has('order'),()=>this.release('order'));return;
      }
      this.label(180,232,this.runtime.selectedTicket?`Đơn của ${this.runtime.selectedTicket.name}`:'Thông tin khách',22,ink);
      this.label(180,272,`1 ${recipeName(this.runtime.selectedRecipe).toLocaleLowerCase('vi')} · ${this.runtime.selectedTicket?.takeaway?'Mang đi':'Tại quầy'}`,14,ink);
      const rows=recipeIngredients(this.runtime.selectedRecipe);
      const ticket=this.runtime.selectedTicket,result=this.runtime.lastResult;
      this.explanation(306,132,this.runtime.shopMessage+'\n'+`${ticket?ticket.kindLabel+' · Giá chốt '+ticket.finalPrice+' xu · Mức nhận ≤'+ticket.maxPricePercent+'%\n':''}`+rows.map(id=>`${catalog.find(item=>item.id===id)!.name}: có ${this.runtime.owned(id)} · rảnh ${this.runtime.available(id)} · giữ ${this.runtime.reserved(id)}`).join('\n')+'\nNguyên liệu đã giữ chỉ dùng cho đơn này.\n'+this.shiftTimeText()+' · '+(ticket?.takeaway?'Cần đóng hộp':'Không cần hộp')+'\n'+reasons+`\nUy tín ${this.runtime.customerProgress.reputation}/100 · Quan hệ ${this.runtime.customerProgress.relationship}/3${result?'\nKết quả '+result.name+': '+result.stars+' sao · '+result.price+' xu\n'+(result.reasons.join(', ')||'Đúng món và chín vừa.')+'\nUy tín '+(result.reputationDelta>0?'+':'')+result.reputationDelta+' · Quan hệ +'+result.relationshipDelta:''}`,11);
      this.button('close-order',64,460,232,54,'Tiếp tục làm bánh',this.scenePauses.has('order'),()=>this.release('order'));return;
    }
    this.label(180,234,this.lifecycle.needsContinue?'Bạn đã quay lại':blocking?'Nghỉ tay một chút':'Đơn của Linh',22,ink);
    this.explanation(272,60,(blocking?'Tiệm vẫn ở đây, đợi bạn quay lại.':'1 pizza phô mai · Mang đi\nĐế bánh + sốt cà chua + phô mai')+'\n'+reasons,12);
    this.button(blocking?'resume':'close-order',64,350,232,54,blocking?'Tiếp tục làm bánh':'Làm bánh thôi',this.lifecycle.needsContinue||this.scenePauses.has(blocking?'user':'order')||pauses.includes('gap'),()=>{if(this.lifecycle.needsContinue)this.lifecycle.continue();else if(pauses.includes('gap'))this.runtime.resume('gap');else this.release(blocking?'user':'order');});
    if(pauses.includes('user')&&this.returnToMenu)this.button('main-menu',64,418,232,54,'Về menu chính',true,this.returnToMenu,UI.dark);
    if(this.runtime.postTutorialPreparation&&this.scenePauses.has('user'))this.button('market-reset',64,482,232,48,this.campaignSession?'Chiến dịch mới':'Làm lại Ngày 1',true,()=>{this.newCampaignConfirmation=true;this.dirty=true;},UI.dark);
    if(this.scenePauses.has('user')&&this.runtime.shopOpen)this.button('end-day',64,482,232,48,'Kết thúc ngày',this.runtime.canCloseDay,()=>{this.endDayConfirmation=true;this.dirty=true;},0xa65547);
  }
  private success():void{
    this.veil();
    if(this.runtime.productionActive){
      this.graphics();this.art.panel(22,208,316,300,UI.paper,UI.border,20);
      this.label(180,240,'Đã giao pizza!',21,ink);this.label(180,285,`${this.runtime.lastDelivery?.name??'Khách'} đã nhận món. Cảm ơn bạn!`,13,ink);
      this.explanation(309,36,this.runtime.lastResult?.help?this.runtime.shopMessage:`${this.runtime.lastResult?.stars??5} sao · +${this.runtime.lastDelivery?.price??0} xu · +${this.runtime.lastResult?.xpDelta??0} XP\n${this.runtime.lastResult?.reasons.join(', ')||'Đúng món và chín vừa.'}\nUy tín ${(this.runtime.lastResult?.reputationDelta??0)>0?'+':''}${this.runtime.lastResult?.reputationDelta??0} · Quan hệ +${this.runtime.lastResult?.relationshipDelta??0}\nThưởng nhiệm vụ: +${this.runtime.lastResult?.rewardCoins??0} xu · +${this.runtime.lastResult?.rewardReputation??0} uy tín`,12,wood);
      this.button('continue-shift',64,355,232,48,'Tiếp tục ca',true,()=>this.runtime.continueShift());
      if(this.runtime.day===1&&!this.campaignSession)this.button('replay',64,422,232,48,'Chơi lại Ngày 1',true,()=>this.runtime.dispatch({type:'reset'}),UI.dark);
    }else {
      this.label(180,240,'Chiếc pizza đầu tiên!',21,ink);this.label(180,285,'Linh: “Thơm quá! Cảm ơn bạn!”',13,ink);this.label(180,316,`+${this.runtime.selectedRecipe==='mushroom'?65:50} xu · +1 uy tín`,14,wood);
      this.button('replay',64,355,232,54,'Chơi lại Ngày 1',true,()=>this.runtime.dispatch({type:'reset'}));
    }
  }
}



