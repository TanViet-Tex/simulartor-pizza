import {isFinishingSauce,isNonExpiring} from '../config/ingredientCatalog';
import {TestCodePanel} from '../presentation/TestCodePanel';
import type {HubDrag} from '../presentation/HubListWindow';
import {drawModalBackdrop} from '../presentation/ModalBackdrop';
import {drawSettingsPanel} from '../presentation/SettingsPanel';
import {preloadSettingsArt} from '../presentation/ReferenceSettingsArt';
import {RECIPE_CATALOG,recipeDefinition} from '../config/recipeCatalog';
import {DELIVERY_RULES} from '../config/deliveryEvents';
import {shopItem} from '../config/shopCatalog';
import type {ShopItemId} from '../domain/ShopEffects';
import {STAFF_CATALOG,STAFF_RULES,type StaffRole} from '../config/staffCatalog';
import {SHOP_INSTALL_LOCATIONS} from '../presentation/ShopPlacement';
import {ReferenceStock,type StockFilter} from '../presentation/ReferenceStock';
import {ReferenceShop,SHOP_ART,type ShopPage} from '../presentation/ReferenceShop';
import {UI_RASTER_SCALE,strengthenIllustrations} from '../presentation/UiRaster';
import {ReferenceMissions} from '../presentation/ReferenceMissions';
import {stockRows} from '../presentation/StockPlanning';
import {drawStockPlanner} from '../presentation/StockPlannerPanel';
﻿import Phaser from 'phaser';
import { CozyRuntime } from '../runtime/CozyRuntime';
import {recipePrice,recipeIngredients,STOCK_INGREDIENTS,ingredientName,type StockRecipe,type StockIngredient} from '../domain/CozyStock';
import {menuPrice} from '../domain/CustomerProgression';
import {campaignEventSeed} from '../domain/CampaignEvents';
import { CozyArt, UI } from '../presentation/CozyArt';
import { preloadPizzaIcons } from '../presentation/PizzaIcons';
import { PIZZA_BOX_ART } from '../presentation/PizzaBoxArt';
import { REFERENCE_KITCHEN_MANIFEST,registerReferenceKitchenFrames } from '../presentation/ReferenceKitchenArt';
import { REFERENCE_KITCHEN_LAYOUT as KITCHEN } from '../presentation/ReferenceKitchenLayout';
import { UI_THEME } from '../presentation/theme';
import {INGREDIENT_CATALOG as catalog} from '../config/ingredientCatalog';
import { MenuPreferences } from '../presentation/MenuPreferences';
import { PlayLifecycle, type PauseLease } from '../runtime/PlayLifecycle';
import { BrowserPlayLifecycle } from '../infrastructure/BrowserPlayLifecycle';
import { PlayAudio } from '../presentation/PlayAudio';
import {CashFeedback} from '../presentation/CashFeedback';
import { PLAY_BANDS, timerText } from '../presentation/PlayHud';
import { modalText } from '../presentation/ModalText';
import { StaticGraphics } from '../presentation/StaticGraphics';
import { createOrderQueue, ORDER_DETAIL_PROMPT, type OrderQueueInput } from '../presentation/OrderQueue';
import type {CozyCampaignSession} from '../runtime/CozyCampaignSession';
import {registerCustomerPortraitFrames,customerPortraitFrame,preloadCustomerPortraits,customerPortraitFit} from '../presentation/CustomerPortraits';
import {drawNotificationFrame,drawCompactNotification,drawNotificationClose,drawNotificationButton,preloadNotificationFrames,type NotificationLayout} from '../presentation/NotificationFrame';
import {REFERENCE_PAUSE_ART,referencePauseLayout,preloadReferencePause} from '../presentation/ReferencePause';
import {ReferenceSummary,preloadSummaryArt} from '../presentation/ReferenceSummary';
import {MarketQuantityInput} from '../presentation/MarketQuantityInput';
import {ReferenceMarket,preloadMarketArt,type MarketFilter} from '../presentation/ReferenceMarket';

type Control={id:string;x:number;y:number;width:number;height:number;enabled:boolean};
const {cream,ink,muted,accent,wood}=UI_THEME.text;
const recipeName=(recipe:StockRecipe)=>'Pizza '+recipeDefinition(recipe).name;

export class CozyScene extends Phaser.Scene {
  private layer!:Phaser.GameObjects.Container;
  private cashFeedback?:CashFeedback;
  private art!:CozyArt;
  private controls:Control[]=[];
  private dirty=true;
  private signature='';
  private motion?:MediaQueryList;
  private heatBar?:Phaser.GameObjects.Graphics;
  private expressIngredient:StockIngredient|null=null;
  private expressQuantity=1;
  private expressLease?:PauseLease;
  private queueUpgradeNotice=false;
  private queueUpgradeLease?:PauseLease;
  private hitZones=new Map<string,Phaser.GameObjects.Zone>();
  private visibleActions:{id:string;x:number;y:number;w:number;h:number;action:()=>void}[]=[];
  private tapRects=new Map<string,{x:number;y:number;w:number;h:number}>();

  private endDayConfirmation=false;
  private endedDayNotice:number|null=null;
  private endedDayLease?:PauseLease;
  private campaignEventLease?:PauseLease;
  private testCodePanel?:TestCodePanel;
  private testCodeLease?:PauseLease;
  private pauseSettings=false;
  private veilDrawn=false;
  private settingsFocusId='';
  private priceDraft:{recipe:StockRecipe;percent:number;enabled:boolean}|null=null;
  private priceLease?:PauseLease;
  private priceError='';
  private statementOpen=false;
  private statementLease?:PauseLease;
  private reviewsOpen=false;
  private reviewsLease?:PauseLease;
  private reviewFilter:'all'|'5'|'4'|'low'='all';
  private purchaseSerial=0;
  private stockFilter:StockFilter='all';
  private stockOffset=0;
  private stockDrag:HubDrag={active:false,startY:0,offset:0};
  private stockLow:number|null=null;
  private stockExpiry:number|null=null;
  private shopMenuPage=0;
  private plannerMenuPage=0;
  private plannerIngredientPage=0;
  private plannerInput?:{recipe:StockRecipe;input:MarketQuantityInput};
  private recipePurchase?:{recipe:StockRecipe;commandId:string;lease:PauseLease};
  private shopItemDialog?:{id:ShopItemId;mode:'detail'|'place'|'store';commandId:string;lease:PauseLease};
  private staffHireDialog?:{role:StaffRole;commandId:string;lease:PauseLease};
  private warnedPayrollDays=new Set<number>();
  private appDialog?:{kind:'settings'|'book';ticketId?:string;lease:PauseLease;commandId:string};
  private shopPage:ShopPage='home';
  private stockCriteria?:{kind:'low'|'expiry';input:MarketQuantityInput;lease:PauseLease};
  private hubDetail?:{title:string;body:string;lease:PauseLease};
  private hubUpgrade?:{kind:'oven'|'queue';cost:number;commandId:string;lease:PauseLease};
  private stockPlannerLease?:PauseLease;
  private stockPortions:Partial<Record<StockRecipe,number>>={};
  private marketFilter:MarketFilter='all';
  private marketOffset=0;
  private marketDrag:HubDrag={active:false,startY:0,offset:0};
  private marketQuantities:Partial<Record<StockIngredient,number>>={};
  private marketLastPurchase=new Map<StockIngredient,number>();
  private marketQuantityEditor?:{id:StockIngredient;input:MarketQuantityInput;lease:PauseLease};
  private marketBasket:(NonNullable<ReturnType<CozyRuntime['quoteMarketBasket']>> & {commandId:string})|null=null;
  private marketLease?:PauseLease;
  private marketError='';
  private readonly purchaseScope=crypto.randomUUID();
  private summaryTab:'summary'|'market'|'stock'|'shop'|'missions'='summary';
  private get preparationHub():boolean{return this.runtime.productionActive&&this.runtime.shopPhase==='preparation'&&!this.runtime.shopOpen;}
  private lifecycle!:PlayLifecycle;
  private browserLifecycle!:BrowserPlayLifecycle;
  private timers:{text:Phaser.GameObjects.Text;read:()=>string}[]=[];
  private timerElapsed=0;
  private dynamicVisuals:{graphics:Phaser.GameObjects.Graphics;read:()=>number;paint:(g:Phaser.GameObjects.Graphics,value:number)=>void;last:number}[]=[];
  private frameTickets:ReturnType<CozyRuntime['tickets']['slice']>=[];
  private frameExpress:ReturnType<CozyRuntime['expressOrders']['slice']>=[];
  private heatSignature='';
  private feedback=new Set<{object:Phaser.GameObjects.Rectangle;tween?:Phaser.Tweens.Tween;timer?:Phaser.Time.TimerEvent}>();
  private feedbackState='';
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
  private finalLease?:PauseLease;
  private pendingFinalResults=false;
  private newCampaignConfirmation=false;
  private newCampaignLease?:PauseLease;
  private reloadConfirmation=false;
  private notification?:{layout:NotificationLayout;ids:string[];start:number;end:number;title:boolean};
  private notificationButtonLabel=false;
  constructor(private readonly runtime:CozyRuntime,private readonly preferences?:MenuPreferences,private readonly returnToMenu?:()=>void,private readonly audio=new PlayAudio(),private readonly sharedLifecycle?:PlayLifecycle,private readonly campaignSession?:CozyCampaignSession,private readonly replaceRuntime?:(runtime:CozyRuntime)=>void){super('CozyScene');}
  preload():void{
    preloadMarketArt(this);
    for(const asset of SHOP_ART)if(!this.textures.exists(asset.key))this.load.image(asset.key,`${import.meta.env.BASE_URL}${asset.url}`);
    preloadSummaryArt(this);
    preloadReferencePause(this);
    preloadNotificationFrames(this);preloadSettingsArt(this);
    preloadPizzaIcons(this);
    preloadCustomerPortraits(this);
    for(const asset of [...REFERENCE_KITCHEN_MANIFEST,PIZZA_BOX_ART])if(!this.textures.exists(asset.key))this.load.image(asset.key,`${import.meta.env.BASE_URL}${asset.url}`);
  }
  create():void{
    strengthenIllustrations(this);
    registerReferenceKitchenFrames(this);
    registerCustomerPortraitFrames(this);
    this.dirty=true;this.signature='';this.inspectedOrderId=null;this.inspectedRecipe=null;this.inspectionMode='';this.priceDraft=null;this.statementOpen=false;this.queueUpgradeNotice=false;this.layer=this.add.container();this.staticGraphics=new StaticGraphics(this);this.motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    this.motion.addEventListener('change',this.motionChange);
    // Canvas modal navigation must prevent native Tab before the browser moves
    // focus; Phaser's queued keyboard events run after the default action on iOS.
    this.game.canvas.setAttribute('tabindex','0');document.addEventListener('keydown',this.settingsKeyDown);
    this.scale.on('resize',this.motionChange);
    this.lifecycle=this.sharedLifecycle??new PlayLifecycle(this.runtime);
    const unsubscribeAudio=this.runtime.subscribeAudio(effect=>this.audio.effect(effect));
    this.cashFeedback=new CashFeedback(this,()=>this.preparationHub||this.runtime.shopPhase==='summary'?{x:350,y:44}:{x:340,y:36},()=>this.reducedMotion);
    const unsubscribeCash=this.runtime.subscribeCash(receipt=>{this.cashFeedback?.show(receipt);this.audio.effect('payment');this.dirty=true;});
    const clearCash=()=>{unsubscribeCash();this.cashFeedback?.destroy();this.cashFeedback=undefined;};
    this.events.once('shutdown',clearCash);this.events.once('destroy',clearCash);
    const unsubscribeAudioBoundary=this.runtime.subscribeTimeBoundary(phase=>{if(phase==='after')this.syncOvenAudio();});
    this.events.once('shutdown',()=>{unsubscribeAudio();unsubscribeAudioBoundary();this.audio.silence();});
    this.browserLifecycle=new BrowserPlayLifecycle(this.lifecycle,()=>{this.syncOvenAudio();this.dirty=true;});
    this.preferenceUnsubscribe=this.preferences?.subscribe(this.motionChange);
    this.unsubscribeSave=this.campaignSession?.subscribe(()=>{this.saveDismissed=false;this.dirty=true;});
    this.events.once('shutdown',()=>{this.expressLease?.release();this.expressLease=undefined;this.expressIngredient=null;});
    this.events.once('shutdown',()=>{this.unsubscribeSave?.();this.unsubscribeSave=undefined;});
    this.events.once('shutdown',()=>{this.reviewsLease?.release();this.reviewsLease=undefined;this.reviewsOpen=false;});
    this.events.once('shutdown',()=>this.closeMarketBasket());
    this.events.once('shutdown',()=>{this.closeDeliveryApp();this.closeHubPanels();});
    this.events.once('shutdown',()=>{this.endedDayLease?.release();this.endedDayLease=undefined;this.endedDayNotice=null;});
    this.events.once('shutdown',()=>{this.campaignEventLease?.release();this.campaignEventLease=undefined;});
    this.events.once('shutdown',()=>{this.closeFinalResults();this.closeNewCampaign();});
    this.events.once('destroy',()=>{this.closeDeliveryApp();this.closeHubPanels();});
    this.events.once('shutdown',()=>this.closeMarketQuantity(),{min:0,max:100});
    this.events.once('destroy',()=>this.closeMarketQuantity(),{min:0,max:100});
    const cleanup=()=>{this.closeTestCode();this.events.off('shutdown',cleanup);this.events.off('destroy',cleanup);this.queueUpgradeLease?.release();this.queueUpgradeLease=undefined;this.queueUpgradeNotice=false;this.priceLease?.release();this.priceLease=undefined;this.statementLease?.release();this.statementLease=undefined;this.motion?.removeEventListener('change',this.motionChange);this.preferenceUnsubscribe?.();this.scale.off('resize',this.motionChange);this.browserLifecycle.destroy(!this.sharedLifecycle);for(const lease of this.scenePauses.values())lease.release();this.scenePauses.clear();this.audio.silence();document.removeEventListener('keydown',this.settingsKeyDown);this.clearFeedback();this.tweens.killAll();for(const zone of this.hitZones.values())zone.destroy();this.hitZones.clear();this.staticGraphics.destroy();};
    this.events.once('shutdown',cleanup);this.events.once('destroy',cleanup);this.draw();
  }
  private motionChange=():void=>{this.dirty=true;};
  private get reducedMotion():boolean{return this.preferences?.reducedMotion??!!this.motion?.matches;}
  private get textScale():number{return Math.max(1,Math.min(2,parseFloat(getComputedStyle(document.documentElement).fontSize)/16));}
  private hold(reason:'user'|'order'):void{if(!this.scenePauses.has(reason))this.scenePauses.set(reason,this.runtime.acquirePause(reason));}
  private release(reason:'user'|'order'):void{this.scenePauses.get(reason)?.release();this.scenePauses.delete(reason);}
  private syncOvenAudio():void{
    const oven=this.runtime.productionActive?this.runtime.ovenState:this.runtime.state;
    const ready=!!oven&&oven.ovenSeconds>=this.runtime.bakeTiming.perfectStart;
    this.audio.syncOven(oven?.stage==='baking'&&!ready,this.runtime.pauses.length>0,ready);
  }
  update(_time:number,delta:number):void{
    // A completed delivery returns to the shift without an acknowledgement modal.
    if(this.runtime.productionActive&&this.runtime.shopPhase==='delivered')this.runtime.continueShift();
    const event=this.runtime.campaignEvent;
    if(event.id&&!event.acknowledged&&this.runtime.shopOpen&&!this.campaignEventLease&&!this.runtime.pauses.length&&!this.campaignSession?.view.pending){this.campaignEventLease=this.runtime.acquirePause('order');this.dirty=true;}
    this.lifecycle.frame(performance.now(),this.runtime.pauses.length===0&&this.runtime.simulationActive);
    this.syncOvenAudio();
    if(this.runtime.day===1&&this.runtime.shopOpen&&this.runtime.shiftClock.phase==='awaiting-close'&&!this.runtime.pauses.length&&this.runtime.canCloseDay)this.finishDay();
    if(this.runtime.shopPhase==='summary'&&!this.warnedPayrollDays.has(this.runtime.day)&&!this.runtime.pauses.length&&!this.campaignSession?.view.pending){
      this.warnedPayrollDays.add(this.runtime.day);this.summaryTab='summary';
      if(this.runtime.daySummary?.payroll?.endingArrears){this.hubDetail={title:'Chưa đủ tiền trả lương',body:this.runtime.staffState.warning+'\nKhoản chưa trả được giữ để trả cùng lương vào cuối ngày sau.',lease:this.runtime.acquirePause('order')};this.dirty=true;}
    }
    if(this.pendingFinalResults&&!this.runtime.pauses.length&&!this.campaignSession?.view.pending){this.pendingFinalResults=false;this.openFinalResults();}
    const s=this.runtime.state;
    this.frameTickets=this.runtime.tickets;this.frameExpress=this.runtime.expressOrders;
    const board=this.runtime.workbenchState;
    const sig=[this.runtime.productionOwnerId,board?.stage,board?.ingredients.join(','),board?.finishingSauces.join(','),s.stage,s.ingredients.join(','),s.finishingSauces.join(','),s.extracted,!this.runtime.productionActive&&s.ovenSeconds>=this.runtime.bakeTiming.perfectStart,this.runtime.ovenState?.stage,this.runtime.ovenOwner,this.frameExpress.map(o=>o.id).join(','),this.frameTickets.map(t=>`${t.id}:${t.packed}:${t.riderState}:${t.stage}`).join(','),this.runtime.selectedTicketId,this.runtime.tutorialActive,this.runtime.pauseRevision,this.runtime.shopRevision,this.runtime.shiftClock.phase,this.runtime.deliveryStatus.phase].join('|');
    if(this.dirty||sig!==this.signature){this.signature=sig;this.draw();}
    const oven=this.runtime.productionActive?this.runtime.ovenState:s;
    const heatSignature=`${oven?.stage}:${oven?.ovenSeconds??0}`;
    if(this.heatBar&&heatSignature!==this.heatSignature){this.heatSignature=heatSignature;const seconds=oven?.ovenSeconds??0,timing=this.runtime.bakeTiming;this.heatBar.clear().fillStyle(0x49372d,1).fillRoundedRect(243,357,100,6,3);if(seconds>0)this.heatBar.fillStyle(seconds>timing.perfectEnd?0xe54b3c:seconds>=timing.perfectStart?0x68bd58:0xfff1dc,1).fillRoundedRect(243,357,Math.max(6,100*Math.min(1,seconds/timing.gaugeEnd)),6,3);}
    for(const visual of this.dynamicVisuals){const value=visual.read();if(value!==visual.last){visual.last=value;visual.graphics.clear();visual.paint(visual.graphics,value);}}
    this.timerElapsed+=delta;
    this.game.canvas.dataset.cashFeedback=JSON.stringify(this.cashFeedback?.snapshot??[]);
    if(this.timerElapsed>=100){this.timerElapsed=0;for(const timer of this.timers){const value=timer.read();if(timer.text.active&&timer.text.text!==value)timer.text.setText(value);}this.game.canvas.dataset.shiftClock=JSON.stringify(this.runtime.shiftClock);this.game.canvas.dataset.oven=String(oven?.ovenSeconds??0);this.game.canvas.dataset.heat=oven?.stage==='burnt'?'burnt':(oven?.ovenSeconds??0)>=this.runtime.bakeTiming.perfectStart?'perfect':'warming';}
  }
  private dynamic(read:()=>number,paint:(g:Phaser.GameObjects.Graphics,value:number)=>void):void{
    const graphics=this.add.graphics().setData('dynamic',true);this.layer.add(graphics);const value=read();paint(graphics,value);this.dynamicVisuals.push({graphics,read,paint,last:value});
  }
  private clearFeedback():void{for(const effect of this.feedback){effect.tween?.remove();effect.timer?.remove(false);effect.object.destroy();}this.feedback.clear();}
  private graphics(dynamic=false):void{const g=this.add.graphics();if(dynamic)g.setData('dynamic',true);this.layer.add(g);this.art=new CozyArt(g);}
  private label(x:number,y:number,value:string,size=12,color:string=cream,width=0,align:'left'|'center'='center'):Phaser.GameObjects.Text{
    let notificationTitle=false;
    if(this.notification&&!this.notificationButtonLabel){
      const n=this.notification;
      if(n.title){notificationTitle=true;n.title=false;x=180;y=n.layout.titleY;size=Math.min(size,20);width=276;}
      else {y=this.notificationY(y);width=Math.min(width||284,284);}
    }
    const text=this.add.text(x,y,value,{fontFamily:UI_THEME.typography.fontFamily,fontSize:`${Math.max(size,UI_THEME.typography.minSize)}px`,fontStyle:'bold',color,align,lineSpacing:UI_THEME.typography.lineSpacing,padding:{top:1,bottom:1},...(width?{wordWrap:{width,useAdvancedWrap:true}}:{})}).setResolution(UI_RASTER_SCALE).setLetterSpacing(UI_THEME.typography.letterSpacing);
    if(align==='center')text.setOrigin(.5,0);
    if(this.notification&&!this.notificationButtonLabel&&!notificationTitle){const body=this.notification.layout.body;text.setY(Math.min(y,body.y+body.height-text.height));}
    this.layer.add(text);return text;
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
    const text=this.label(0,0,title,12,enabled?cream:muted,0,'left'),iconSize=18,gap=4;
    const textWidth=Math.min(text.width,w-12-iconSize-gap);
    if(text.width>textWidth)text.setScale(textWidth/text.width);
    const left=x+(w-iconSize-gap-textWidth)/2;
    this.icon(index===0?'box':'deliver',left+iconSize/2,y+h/2,iconSize,enabled?1:.65);
    text.setPosition(left+iconSize+gap,y+(h-text.displayHeight)/2);
    this.hit(id,x,y,w,h,enabled,action);
  }
  private timer(x:number,y:number,read:()=>string,size=10,color:string=cream,width=0):void{
    const text=this.label(x,y,read(),size,color,width);text.setFontFamily('monospace');this.timers.push({text,read});
  }
  private explanation(y:number,height:number,value:string,size=13,color:string=ink):void{
    if(this.notification){const bottom=this.notificationY(y+height);y=this.notificationY(y);height=Math.max(18,Math.min(bottom-y,this.notification.layout.body.y+this.notification.layout.body.height-y));}
    modalText(this,this.layer,40,y,280,height,value,size,color,this.textScale);
    if(this.textScale>1&&!this.notification)this.label(180,y+height+2,'Vuốt phần chữ để đọc tiếp',10,wood);
  }
  private hubTap?:{id:string;pointerId:number};
  private listHit(id:string):boolean{
    if(id.startsWith('stock-item-'))return true;
    const row=/^market-(quantity|minus|plus|buy)-(.+)$/.exec(id);
    return !!row&&STOCK_INGREDIENTS.includes(row[2] as StockIngredient);
  }
  private syncListHits(render:()=>void):void{
    this.controls=this.controls.filter(c=>!this.listHit(c.id));this.visibleActions=this.visibleActions.filter(c=>!this.listHit(c.id));
    for(const id of this.tapRects.keys())if(this.listHit(id))this.tapRects.delete(id);
    render();this.game.canvas.dataset.controls=JSON.stringify(this.controls);
  }
  private hit(id:string,x:number,y:number,w:number,h:number,enabled:boolean,action:()=>void):void{
    const list=this.listHit(id),top=id.startsWith('stock-item-')?223:219,bottom=id.startsWith('stock-item-')?535:537;
    const rawY=y,rawH=h;
    if(list){y=Math.max(top,y);h=Math.max(0,Math.min(bottom,rawY+rawH)-y);enabled=enabled&&h>0;}
    this.tapRects.set(id,{x,y,w,h});
    if(this.campaignSession&&['loading','saving','error','recovery'].includes(this.campaignSession.view.state))enabled=enabled&&(['pause','mute'].includes(id)||id.startsWith('test-code-')||id.startsWith('summary-tab-')||id.startsWith('summary-figure-')||id==='summary-statement-close'||id.startsWith('save-'));
    if(this.runtime.productionActive&&!this.runtime.tutorialActive&&this.runtime.shopPhase!=='making'&&this.runtime.shopPhase!=='delivered'&&!this.runtime.pauses.length){
      enabled=enabled&&(['pause','mute'].includes(id)||id.startsWith('market-')||id.startsWith('summary-')||id.startsWith('stock-')||id.startsWith('shop-'));
    }
    if(this.runtime.tutorialActive&&!this.runtime.pauses.some(p=>p!=='tutorial')){
      enabled=enabled&&(['pause','mute','order','customer-linh','recipe-0'].includes(id)||id===this.runtime.expectedControl||id==='dough-board'&&this.runtime.expectedControl==='dough');
    }
    if(enabled)this.visibleActions.push({id,x,y,w,h,action});
    const canvasBounds=this.game.canvas.getBoundingClientRect();
    const scale=Math.min((canvasBounds.width||360)/360,(canvasBounds.height||640)/640),min=Math.ceil(UI_THEME.minTouch/scale);
    const width=Math.max(w,min),height=Math.max(h,min);
    x=Math.max(0,Math.min(360-width,x-(width-w)/2));y=Math.max(0,Math.min(640-height,y-(height-h)/2));w=width;h=height;
    if(list){const expandedBottom=Math.min(bottom,y+h);y=Math.max(top,y);h=Math.max(0,expandedBottom-y);}
    this.controls.push({id,x,y,width:w,height:h,enabled});
    // Keep input objects alive across clock redraws so a timed tap cannot fall
    // between Phaser removing the previous region and registering its replacement.
    let zone=this.hitZones.get(id);
    if(!zone){zone=this.add.zone(x,y,w,h).setOrigin(0).setDepth(10).setInteractive(new Phaser.Geom.Rectangle(0,0,w,h),Phaser.Geom.Rectangle.Contains);this.hitZones.set(id,zone);}
    zone.setPosition(x,y).setSize(w,h);zone.input?.hitArea.setTo(0,0,w,h);
    if(zone.input)zone.input.enabled=true;
    if(list&&rawY+rawH<=top||list&&rawY>=bottom)zone.disableInteractive();
    if(zone.listenerCount('pointerdown')||zone.listenerCount('pointerup'))return;
    if(list)zone.on('pointerdown',(pointer:Phaser.Input.Pointer)=>{
      const target=[...this.tapRects].find(([key,c])=>this.listHit(key)&&pointer.x>=c.x&&pointer.x<=c.x+c.w&&pointer.y>=c.y&&pointer.y<=c.y+c.h)?.[0]??id;
      this.hubTap={id:target,pointerId:pointer.id};
    });
    zone.on(list?'pointerup':'pointerdown',(pointer:Phaser.Input.Pointer)=>{
      this.settingsFocusId='';
      if(list){const drag=id.startsWith('stock-item-')?this.stockDrag:this.marketDrag;
        if(!drag.controller?.canTap(pointer.id)||this.hubTap?.pointerId!==pointer.id)return;
        const target=[...this.tapRects].find(([key,c])=>this.listHit(key)&&pointer.x>=c.x&&pointer.x<=c.x+c.w&&pointer.y>=c.y&&pointer.y<=c.y+c.h)?.[0]??id;
        if(target!==this.hubTap.id)return;this.hubTap=undefined;
      }
      // On shorter portrait screens enlarged touch padding may overlap. The
      // visible button beneath the finger always wins over a neighbour's padding.
      const touched=[...this.tapRects].find(([key,c])=>this.controls.some(active=>active.id===key)&&pointer.x>=c.x&&pointer.x<=c.x+c.w&&pointer.y>=c.y&&pointer.y<=c.y+c.h);
      const targetId=touched?.[0]??id,rect=touched?.[1]??this.tapRects.get(id)!;
      const flash=this.add.rectangle(rect.x+rect.w/2,rect.y+rect.h/2,rect.w-4,rect.h-4,0xfff3dc,.23).setDepth(60);
      const effect:{object:Phaser.GameObjects.Rectangle;tween?:Phaser.Tweens.Tween;timer?:Phaser.Time.TimerEvent}={object:flash};this.feedback.add(effect);
      const dispose=()=>{this.feedback.delete(effect);flash.destroy();};
      if(this.reducedMotion)effect.timer=this.time.delayedCall(140,dispose);
      else effect.tween=this.tweens.add({targets:flash,alpha:0,scaleX:.96,scaleY:.96,duration:190,onComplete:dispose,onStop:dispose});
      const visible=this.visibleActions.find(c=>c.id===targetId);
      const settings=this.pauseSettings||targetId==='pause-settings';
      if(visible)visible.action();const audioStatus=this.audio.status;void this.audio.interact().then(()=>{if(!settings)this.audio.cue();if(this.audio.status!==audioStatus)this.dirty=true;});this.dirty=true;
    });
  }
  private button(id:string,x:number,y:number,w:number,h:number,title:string,enabled:boolean,action:()=>void,fill:number=UI.green):void{
    const secondary=/Quay lại|Về Quán/i.test(title);if(secondary)fill=UI.dark;
    const footerIndex=this.notification?.ids.indexOf(id)??-1;
    if(footerIndex>=0){
      const rect=this.notification!.layout.footer[footerIndex];({x,y,width:w,height:h}=rect);
      if(secondary)drawNotificationButton(this,this.layer,x,y,w,h);
      if(!enabled){this.graphics();this.art.g.fillStyle(0x000000,.45).fillRoundedRect(x,y,w,h,h/2);}
      this.notificationButtonLabel=true;
      const text=this.label(x+w/2,y,title,16,enabled?cream:muted,w-14);
      const fit=Math.min(1,(h-8)/text.height);text.setScale(fit).setPosition(x+w/2,y+(h-text.displayHeight)/2);
      this.notificationButtonLabel=false;this.hit(id,x,y,w,h,enabled,action);
      if(this.notification?.layout.variant==='two'&&/cancel|close|reject|decline/.test(id)){
        const close=drawNotificationClose(this,this.layer,this.notification.layout)!;
        this.hit(id.startsWith('save-')?'save-notification-close':'notification-close',close.x,close.y,close.width,close.height,enabled,action);
      }
      return;
    }
    if(this.notification){y=this.notificationY(y);w=Math.min(w,284);x=Math.max(38,Math.min(322-w,x));}
    if(this.notification||secondary){
      drawNotificationButton(this,this.layer,x,y,w,h);
      if(!enabled){this.graphics();this.art.g.fillStyle(0x000000,.4).fillRoundedRect(x,y,w,h,h/2);}
    }else{
      this.graphics();this.art.panel(x,y,w,h,enabled?fill:fill===UI.green?0x527f42:0x615449,fill===UI.green?UI.greenEdge:UI.border,11);
      if(enabled)this.art.round(x+4,y+3,w-8,5,3,fill===UI.green?0x72d762:0xb77b61);
    }
    this.notificationButtonLabel=true;
    const text=this.label(x+w/2,y+(title.includes('\n')?5:(h-20)/2),title,title.includes('\n')?12:16,this.notification?enabled?cream:muted:enabled&&fill===UI.green?ink:cream,w-12);
    if(text.height>h-8){text.setScale((h-8)/text.height);text.setY(y+(h-text.displayHeight)/2);}
    this.notificationButtonLabel=false;this.hit(id,x,y,w,h,enabled,action);
  }
  private notificationY(y:number):number{const n=this.notification!;return n.layout.body.y+Math.max(0,Math.min(1,(y-n.start)/(n.end-n.start)))*n.layout.body.height;}
  private notificationFrame(ids:string[],start:number,end:number,height=420):void{
    this.veil();this.notification={layout:drawNotificationFrame(this,this.layer,ids.length===2?'two':'one',(640-height)/2,height),ids,start,end,title:true};
  }
  private notice(title:string,message:string,id:string,buttonTitle:string,action:()=>void,enabled=true,size=14):void{
    this.notification=undefined;this.veil();this.game.canvas.dataset.modalScroll='[]';
    const layout=drawCompactNotification(this,this.layer,title,message,size,this.textScale);
    this.notification={layout,ids:[id],start:layout.body.y,end:layout.body.y+layout.body.height,title:false};
    this.button(id,0,0,0,0,buttonTitle,enabled,action);
  }
  private draw():void{
    const feedbackState=`${this.runtime.shopPhase}:${this.runtime.pauseRevision}`;
    if(this.feedbackState!==feedbackState){this.clearFeedback();this.feedbackState=feedbackState;}
    this.dirty=false;this.veilDrawn=false;this.game.canvas.dataset.settingsPanel='';this.game.canvas.dataset.modalBackdrop='';this.notification=undefined;this.game.canvas.dataset.notificationFrame='';this.game.canvas.dataset.pausePanel='';this.game.canvas.dataset.modalScroll='[]';this.timers=[];this.dynamicVisuals=[];this.heatSignature='';this.heatBar=undefined;this.layer.removeAll(true);this.controls=[];this.visibleActions=[];this.tapRects.clear();this.graphics();
    const backdrop=this.textures.get('reference-kitchen-background').getSourceImage();
    const backdropScale=Math.min(KITCHEN.width/backdrop.width,KITCHEN.height/backdrop.height);
    this.layer.add(this.add.image(KITCHEN.width/2,KITCHEN.height/2,'reference-kitchen-background').setScale(backdropScale));
    const s=this.runtime.state;
    const mode=this.runtime.productionActive?'live':this.runtime.tutorialActive?'practice':'freeplay';
    if(mode!==this.inspectionMode){this.inspectedOrderId=null;this.inspectionMode=mode;}
    this.inspectedOrderId=this.runtime.productionActive?this.runtime.selectedTicketId:'practice-linh';
    this.orderQueue=createOrderQueue(this.queueInputs(),this.inspectedOrderId,this.runtime.productionActive?this.runtime.selectedTicketId:undefined);
    this.orderQueue.slots=this.orderQueue.slots.map((slot,index)=>{
      const {x,y,w,h,centerX,centerY}=KITCHEN.customer(index);
      return {...slot,x,y,width:w,height:h,centerX,centerY};
    });
    this.inspectedOrderId=this.orderQueue.inspectedId;
    this.hit('pause',18,5,32,29,true,()=>this.hold('user'));
    if(this.runtime.productionActive)this.timer(86,8,()=>this.runtime.shiftClock.displayTime,16,cream);
    this.label(180,0,this.runtime.productionActive?`Ngày ${this.runtime.day}/${this.runtime.campaignEndDay}`:`Ngày ${this.runtime.day}`,18);
    if(this.runtime.productionActive&&['grace','awaiting-close'].includes(this.runtime.shiftClock.phase)){
      this.layer.add(this.add.rectangle(122,30,146,14,0x4b281b));
      this.label(122,23,'Đã đóng cửa · xử lý đơn còn lại',9,cream);
      this.timer(224,23,()=>this.runtime.shiftClock.phase==='awaiting-close'?'Chốt ngày':timerText(this.runtime.shiftClock.remaining),9,cream);
    }else this.timer(189,23,()=>this.runtime.productionActive&&!this.runtime.ovenOwner?this.shiftTimeText():`Lò ${timerText(Math.floor(this.runtime.ovenState?.ovenSeconds??this.runtime.state.ovenSeconds))}`,10,'#ead1b3');
    if(this.runtime.shopOpen)this.hit('end-day',133,22,114,20,this.runtime.canCloseDay,()=>{this.hold('user');this.endDayConfirmation=true;this.dirty=true;});
    this.label(306,10,`${s.cash}`,17,ink);
    this.customers();this.orderCard();this.recipes();this.graphics();
    const board=this.runtime.productionActive?this.runtime.workbenchState:s;
    if(board?.stage==='boxed'){
      const source=this.textures.get(PIZZA_BOX_ART.key).getSourceImage();
      const box=this.add.image(120,344,PIZZA_BOX_ART.key).setDisplaySize(108,108*source.height/source.width);
      this.layer.add(box);
    }else if(board&&board.stage!=='baking'&&!(board.stage==='burnt'&&!board.extracted)&&board.ingredients.includes('dough')){
      this.art.pizza(120,343,51,board.ingredients,false,{seconds:board.ovenSeconds,timing:this.runtime.bakeTiming,finishing:board.finishingSauces});

    }
    if(this.runtime.needsRemake)this.hit('remake',18,298,204,80,true,()=>this.runtime.remake());
    else this.hit('dough-board',18,298,204,80,this.runtime.canUseIngredient('dough'),()=>this.useIngredient('dough'));
    this.ovens();this.sauceShelf();
    const counterReady=this.runtime.productionActive&&s.stage==='ready'&&this.runtime.selectedTicket?.takeaway===false;
    const source=this.runtime.deliverySource,target=this.runtime.selectedTicket;
    const earlyDelivery=this.runtime.productionActive&&source?.id===target?.id&&!counterReady&&['raw','ready','burnt'].includes(s.stage);
    this.kitchenAction('box',0,'Đóng hộp',s.stage==='ready'&&!this.runtime.selectedExpired&&(!target||target.packed<target.quantity),()=>this.runtime.dispatch({type:'box'}));
    const appReady=target?.source==='app'&&target.packed===target.quantity;
    const canSendApp=appReady&&(target?.riderState==='arrived'||target?.riderState==='staff'&&!this.runtime.deliveryStatus.busy);
    const multiReady=!!target&&target.quantity>1&&target.packed===target.quantity;
    const canDeliver=!this.runtime.selectedExpired&&(this.runtime.productionActive?(target&&target.quantity>1?multiReady&&(target.source!=='app'||canSendApp):appReady?canSendApp:!!source&&!!target):s.stage==='boxed');
    this.kitchenAction(earlyDelivery?'deliver-unboxed':'deliver',1,'Giao bánh',canDeliver,()=>{
      if(this.runtime.productionActive)this.runtime.dispatch({type:'deliver',sourceId:appReady?target?.id:source?.id,targetId:target?.id,commandId:`deliver:${source?.id??target?.id}:${target?.id}:${target?.source==='app'?(appReady?'launch':target.packed):'single'}`});
      else this.runtime.dispatch({type:'deliver'});
    });
    this.inventory();
    if(this.campaignEventLease){
      this.resetModalControls();
      const event=this.runtime.campaignEvent;
      this.notice('Sự kiện A',`Cửa hàng mất ${event.loss} xu.\nSố dư hiện tại: ${this.runtime.state.cash} xu.${this.runtime.state.cash<0?'\nTiền đang âm; bạn vẫn có thể phục vụ trong ca để bù lại.':''}`,'campaign-event-understood','Đã hiểu',()=>{
        this.runtime.acknowledgeCampaignEvent();this.campaignEventLease?.release();this.campaignEventLease=undefined;this.dirty=true;
      });
    }
    else if(this.endedDayNotice!==null){
      this.resetModalControls();
      this.notice(`Đã hết ngày ${this.endedDayNotice}`,'Ca bán đã kết thúc. Bấm Đã hiểu để xem tổng kết ngày.','day-ended-understood','Đã hiểu',()=>{
        this.endedDayNotice=null;this.endedDayLease?.release();this.endedDayLease=undefined;this.summaryTab='summary';this.dirty=true;
      });
    }
    else if(this.runtime.shopPhase==='summary'||this.preparationHub){
      this.dayHub();
      if(this.statementOpen)this.statementDialog();
      else if(this.reviewsOpen)this.reviewsDialog();
      else if(this.marketBasket)this.marketBasketDialog();
      else if(this.marketQuantityEditor)this.marketQuantityDialog();
      else if(this.stockCriteria)this.stockCriteriaDialog();
      else if(this.appDialog)this.deliveryAppDialog();
      else if(this.shopItemDialog)this.shopInvestmentDialog();
      else if(this.staffHireDialog)this.staffDialog();
      else if(this.recipePurchase)this.recipePurchaseDialog();
      else if(this.hubUpgrade)this.hubUpgradeDialog();
      else if(this.hubDetail)this.hubDetailDialog();
      else if(this.plannerInput)this.plannerInputDialog();
      else if(this.stockPlannerLease)this.stockPlannerDialog();
      else if(this.priceDraft&&!this.runtime.pauses.some(p=>p!=='order'))this.priceDialog();
      else if(this.runtime.pauses.some(p=>p!=='save'))this.overlay();
    }
    else if(this.appDialog)this.deliveryAppDialog();
    else if(this.priceDraft&&!this.runtime.pauses.some(p=>p!=='order'))this.priceDialog();
    else if(this.queueUpgradeNotice)this.queueUpgradeDialog();
    else if(this.runtime.pauses.some(p=>p!=='tutorial'&&p!=='discard'&&p!=='delivery'&&p!=='bargain'&&p!=='help'))this.overlay();
    else if(this.runtime.tutorialActive)this.tutorial();
    else if(this.runtime.discardPending)this.discardDialog();
    else if(this.runtime.deliveryPending)this.deliveryDialog();
    else if(this.runtime.bargainPending)this.bargainDialog();
    else if(this.runtime.helpPending||this.runtime.thanksPending)this.helpDialog();
    else if(s.stage==='delivered'&&!this.runtime.productionActive)this.success();
    if(this.expressIngredient)this.expressDialog();
    if(!this.testCodePanel&&this.campaignSession&&(['saving','error','loading','recovery'].includes(this.campaignSession.view.state)&&!this.saveDismissed||this.reloadConfirmation))this.saveDialog();
    else if(this.newCampaignConfirmation)this.newCampaignDialog();
    else if(this.finalOpen)this.finalDialog();
    if(this.campaignSession?.view.state==='temporary'&&!this.notification&&!this.newCampaignConfirmation&&!this.finalOpen)this.label(180, this.runtime.shopPhase==='summary'||this.runtime.postTutorialPreparation?572:611,'Chơi tạm không lưu · tải lại sẽ mất phiên',9,cream,330);
    for(const [id,zone] of this.hitZones)if(!this.controls.some(control=>control.id===id)){zone.destroy();this.hitZones.delete(id);}
    this.staticGraphics.bake(this.layer);
    const canvas=this.game.canvas;canvas.dataset.screen=this.endedDayNotice!==null?'day-ended-notice':this.preparationHub?'preparation-hub':this.runtime.shopPhase==='summary'?'day-summary':'game';canvas.dataset.day=String(this.runtime.day);canvas.dataset.daySummary=JSON.stringify(this.runtime.daySummary);canvas.dataset.summaryTab=this.summaryTab;canvas.dataset.stage=s.stage;canvas.dataset.ingredients=s.ingredients.join(',');canvas.dataset.finishingSauces=s.finishingSauces.join(',');canvas.dataset.extracted=String(s.extracted);canvas.dataset.oven=String(s.ovenSeconds);canvas.dataset.cash=String(s.cash);canvas.dataset.paused=this.runtime.pauses.join(',');canvas.dataset.controls=JSON.stringify(this.controls);canvas.dataset.booted='true';
    canvas.setAttribute('aria-label',`Tiệm pizza. Ngày ${this.runtime.day}. ${s.cash} xu. ${this.runtime.productionActive?this.runtime.shopMessage:s.feedback}`);
    canvas.dataset.campaignProgress=JSON.stringify({day:this.runtime.day,endDay:this.runtime.campaignEndDay});
    canvas.dataset.campaignResults=JSON.stringify(this.runtime.campaignResults);
    canvas.dataset.campaignEvent=JSON.stringify(this.runtime.campaignEvent);
    canvas.dataset.tutorial=this.runtime.tutorialStep??'off';
    canvas.dataset.commercialCash=String(this.runtime.commercialState.cash);
    canvas.dataset.reducedMotion=String(this.reducedMotion);
    canvas.dataset.audio=this.audio.status;canvas.dataset.muted=String(this.audio.muted);
    canvas.dataset.audioSettings=JSON.stringify({effectsVolume:this.audio.effectsVolume,musicAvailable:true,musicEnabled:this.audio.musicEnabled,musicTrack:this.audio.musicTrack});
    canvas.dataset.bands=JSON.stringify(PLAY_BANDS);canvas.dataset.textScale=String(this.textScale);
    canvas.dataset.shop=this.runtime.productionActive?this.runtime.shopPhase:'freeplay';
    canvas.dataset.recipe=this.runtime.selectedRecipe;
    canvas.dataset.tickets=JSON.stringify(this.runtime.tickets);
    canvas.dataset.selectedTicket=this.runtime.selectedTicketId;
    canvas.dataset.orderQueue=JSON.stringify(this.orderQueue.slots);
    canvas.dataset.kitchenLayout=JSON.stringify({width:KITCHEN.width,height:KITCHEN.height,order:KITCHEN.order,board:KITCHEN.board,customerFrames:Array.from({length:6},(_,i)=>KITCHEN.customer(i)),customers:this.orderQueue.slots.map((_,i)=>KITCHEN.customer(i)),recipes:Array.from({length:8},(_,i)=>KITCHEN.recipe(i)),ingredients:Array.from({length:20},(_,i)=>KITCHEN.ingredient(i)),ovens:[KITCHEN.oven(0),KITCHEN.oven(1)],actions:[KITCHEN.action(0),KITCHEN.action(1)]});
    canvas.dataset.kitchenArt=JSON.stringify(this.layer.list.filter((o):o is Phaser.GameObjects.Image=>o instanceof Phaser.GameObjects.Image).map(image=>({key:image.texture.key,frame:image.frame.name,x:image.x,y:image.y,width:image.displayWidth,height:image.displayHeight})));
    canvas.dataset.orderDetail=JSON.stringify(this.orderQueue.detail);
    canvas.dataset.ovenOwner=this.runtime.ovenOwner??'';
    canvas.dataset.discardPending=String(this.runtime.discardPending);
    canvas.dataset.deliveryPending=JSON.stringify(this.runtime.deliveryPending);
    canvas.dataset.deliveryApp=JSON.stringify(this.runtime.deliveryApp);
    canvas.dataset.shopItems=JSON.stringify(this.runtime.shopState);
    canvas.dataset.staffState=JSON.stringify(this.runtime.staffState);
    canvas.dataset.deliveryStatus=JSON.stringify(this.runtime.deliveryStatus);
    canvas.dataset.result=JSON.stringify(this.runtime.lastResult);
    canvas.dataset.cashFeedback=JSON.stringify(this.cashFeedback?.snapshot??[]);
    canvas.dataset.bargain=JSON.stringify(this.runtime.bargainPending);
    canvas.dataset.help=JSON.stringify(this.runtime.helpState);canvas.dataset.helpOffer=JSON.stringify(this.runtime.helpPending);
    canvas.dataset.customerProgress=JSON.stringify(this.runtime.customerProgress);
    canvas.dataset.hubDetail=JSON.stringify(this.hubDetail?{title:this.hubDetail.title,body:this.hubDetail.body}:null);canvas.dataset.hubUpgrade=JSON.stringify(this.hubUpgrade?{kind:this.hubUpgrade.kind,cost:this.hubUpgrade.cost}:null);
    canvas.dataset.priceDialog=JSON.stringify(this.priceDraft);
    canvas.dataset.statementOpen=String(this.statementOpen);canvas.dataset.summaryModal=this.statementOpen?'finance':this.reviewsOpen?'reviews':'';canvas.dataset.marketPurchase=JSON.stringify(null);canvas.dataset.marketBasket=JSON.stringify(this.marketBasket);
    canvas.dataset.queueUpgradeNotice=String(this.queueUpgradeNotice);
    canvas.dataset.preparationBudget=JSON.stringify(this.runtime.preparationBudget);
    canvas.dataset.quality=this.runtime.bakeQuality;
    canvas.dataset.stock=JSON.stringify(STOCK_INGREDIENTS.map(id=>({id,owned:this.runtime.owned(id),available:this.runtime.available(id),reserved:this.runtime.reserved(id)})));
    canvas.dataset.expressOrders=JSON.stringify(this.runtime.expressOrders);
    canvas.dataset.bakeTiming=JSON.stringify(this.runtime.bakeTiming);canvas.dataset.queueCapacity=String(this.runtime.queueCapacity);
    canvas.dataset.neededIngredients=JSON.stringify(this.neededIngredients);
    canvas.dataset.progression=JSON.stringify(this.runtime.progression);canvas.dataset.menuRecipes=JSON.stringify(this.runtime.menuRecipes);
    if(this.campaignSession)canvas.dataset.saveState=JSON.stringify(this.campaignSession.view);
    // Read-only geometry makes canvas typography verifiable at every device scale.
    canvas.dataset.labels=JSON.stringify(this.layer.list.filter((o):o is Phaser.GameObjects.Text=>o instanceof Phaser.GameObjects.Text).map(t=>({text:t.text,x:t.getBounds().x,y:t.getBounds().y,width:t.width,height:t.height,font:t.style.fontFamily,size:t.style.fontSize,spacing:t.letterSpacing,color:t.style.color})));
  }
  private sauceShelf():void{
    const s=this.runtime.state,needed=this.neededIngredients;
    ['Cà chua','Kem trắng','BBQ','Pesto','Sốt cay'].forEach((name,i)=>{
      const id=['sauce','sauce-white','sauce-bbq','sauce-pesto','sauce-hot'][i] as StockIngredient;
      const {x,y,w,h}=KITCHEN.ingredient(i),available=!this.runtime.tutorialActive||i===0;
      this.ingredientState(x,y,w,h,available,available&&s.ingredients.includes(id),needed.includes(id));
      // Paper labels sit on the bottle body; full names remain readable beneath it.
      this.graphics();this.art.g.fillStyle(0xfff1d4,1).fillRoundedRect(x+w/2-7,y+15,14,9,2);
      const bottleLabel=this.label(x+w/2,y+16,['CÀ','KEM','BBQ','PESTO','CAY'][i],9,ink);
      bottleLabel.setScale(Math.min(12/bottleLabel.width,6/bottleLabel.height));
      const sauceName=this.label(x+w/2,y+27,name,9,available?cream:muted);
      sauceName.setScale(Math.min(1,(w-8)/sauceName.width,12/sauceName.height));
      this.hit(id,x,y,w,h,available&&this.runtime.canUseIngredient(id),()=>this.useIngredient(id));if(this.runtime.productionActive)this.stockBadge(id,x,y,w);
    });
  }
  private get neededIngredients():readonly StockIngredient[]{
    const s=this.runtime.state;
    if(s.stage!=='assembly'||this.runtime.selectedExpired||this.runtime.productionActive&&!this.runtime.tutorialActive&&!this.runtime.selectedTicket)return [];
    return recipeIngredients(this.runtime.selectedRecipe).filter(id=>!isFinishingSauce(id)&&!s.ingredients.includes(id));
  }
  private ingredientState(x:number,y:number,w:number,h:number,available:boolean,selected:boolean,needed=false):void{
    this.graphics();
    if(selected)this.art.g.fillStyle(0xf6ead4,.08).fillRoundedRect(x+2,y+2,w-4,h-4,8);
    if(available&&needed)this.art.g.fillStyle(0xfff1c2,.22).fillRoundedRect(x+2,y+2,w-4,h-4,8).lineStyle(2,0xffd45e,1).strokeRoundedRect(x+2,y+2,w-4,h-4,8);
    if(!available){this.art.g.fillStyle(0x19120d,.38).fillRoundedRect(x+2,y+2,w-4,h-4,8);this.icon('lock',x+w-8,y+9,12,.9);}
  }
  private stockBadge(id:StockIngredient,x:number,y:number,w:number):void{
    this.graphics();this.art.circle(x+w-8,y+9,7,UI.dark);this.label(x+w-8,y+2,String(this.runtime.owned(id)),8,cream);
    const order=this.runtime.expressOrders.find(order=>order.ingredient===id);
    if(order){this.dynamic(()=>this.frameExpress.find(p=>p.id===order.id)?.remaining??0,(g,value)=>g.lineStyle(2,0x76cf6e,1).beginPath().arc(x+w/2,y+17,15,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-value/order.duration)).strokePath());const text=this.label(x+w/2,y+5,`${Math.ceil(order.remaining)}s`,10,cream);this.timers.push({text,read:()=>`${Math.ceil(this.frameExpress.find(p=>p.id===order.id)?.remaining??0)}s`});}
  }
  private ovens():void{
    const s=this.runtime.productionActive?this.runtime.ovenState??this.runtime.state:this.runtime.state,occupied=this.runtime.productionActive?!!this.runtime.ovenState:!s.extracted&&(s.stage==='baking'||s.stage==='burnt');
    for(let i=0;i<2;i++){
      const {x,y,w,h}=KITCHEN.oven(i);
      const frame='oven-empty';
      this.referenceSprite(frame,x+w/2,y+h/2,w,h)?.setTint(i?0x99877b:0xffffff);
      if(!i&&occupied&&this.runtime.productionActive&&this.runtime.shiftClock.phase==='grace')this.timer(x+w/2,y-15,()=>`Lò 1 · ${timerText(Math.floor(this.runtime.ovenState?.ovenSeconds??0))}`,12,cream);
      else this.label(x+w/2,y-15,i?'Lò 2':'Lò 1',12,cream);
      if(i){this.icon('lock',x+w/2,y+30,23,.85);this.label(x+w/2,y+48,'Chưa mở khóa',9,muted);}
      else{
        if(occupied){
          this.dynamic(()=>this.runtime.ovenState?.ovenSeconds??this.runtime.state.ovenSeconds,(g,seconds)=>new CozyArt(g).pizza(x+w/2,y+28,20,s.ingredients,false,{seconds,timing:this.runtime.bakeTiming}));
          const pizza=this.dynamicVisuals[this.dynamicVisuals.length-1].graphics,clip=this.make.graphics({x:0,y:0});clip.fillStyle(0xffffff).fillRect(x+13,y+13,w-27,30);
          const mask=clip.createGeometryMask();pizza.setMask(mask);pizza.once('destroy',()=>{mask.destroy();clip.destroy();});
        }
        this.heatBar=this.add.graphics().setData('dynamic',true);this.layer.add(this.heatBar);
        const active=this.runtime.state;
        const baking=occupied&&!s.extracted&&['baking','burnt'].includes(s.stage);
        const canExtract=baking&&(this.runtime.productionActive||s.ovenSeconds>=this.runtime.bakeTiming.perfectStart);
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
    if(this.runtime.productionActive)return this.runtime.tickets.map(t=>({...t,finalPrice:t.totalPrice,deliveryStatus:t.riderState==='waiting'?`Tới sau ${Math.ceil(t.riderRemaining)}s`:t.riderState==='arrived'?'Shipper đã tới':t.riderState==='staff'?'Nhân viên giao':'Chưa book shipper'}));
    if(this.runtime.state.stage==='delivered')return [];
    // The existing Linh order is the real practice/freeplay order, without a customer deadline.
    return [{id:'practice-linh',name:'Linh',number:this.runtime.tutorialActive?'Tập':'1',recipe:'cheese',remaining:null}];
  }
  private shiftTimeText():string{
    const clock=this.runtime.shiftClock;
    return clock.phase==='awaiting-close'?'Chốt ngày':clock.phase==='preparing'?`Chuẩn bị ${Math.ceil(clock.remaining)}s`:clock.phase==='grace'?`Còn ${timerText(clock.remaining)}`:'Mở bán';
  }
  private customers():void{
    if(this.runtime.productionActive&&this.runtime.queueCapacity===4)for(let i=4;i<6;i++){
      const {x,y,w,h,centerX,centerY}=KITCHEN.customer(i);
      this.icon('queue-lock',centerX,centerY,26);
      this.label(centerX,120,'Chưa mở',8,wood);
      this.hit(`queue-locked-${i}`,x,y,w,h,true,()=>this.openQueueUpgradeNotice());
    }
    this.orderQueue.slots.forEach((slot,i)=>{
      const bounds=KITCHEN.customer(i),{centerX,centerY}=bounds;
      if(slot.icon==='phone')this.icon('phone',centerX,centerY,37);
      else {
        const ticket=this.runtime.tickets.find(t=>t.id===slot.id),portrait=customerPortraitFrame(ticket?.avatarIndex??0);
        if(this.textures.exists(portrait.key)){
          const image=this.add.image(centerX,centerY,portrait.key,portrait.frame);
          const fit=customerPortraitFit(image.width,image.height);image.setDisplaySize(fit.width,fit.height);this.layer.add(image);
          const clip=this.make.graphics({x:0,y:0});clip.fillStyle(0xffffff).fillCircle(centerX,centerY,21);const mask=clip.createGeometryMask();image.setMask(mask);image.once('destroy',()=>{mask.destroy();clip.destroy();});
        }
      }
      if(slot.selected){this.graphics();this.art.g.lineStyle(1.5,0x548b38,1).strokeCircle(centerX,centerY,23);}
      if(slot.patienceRatio!==null)this.dynamic(()=>{const ticket=this.frameTickets.find(t=>t.id===slot.id);return ticket?Math.max(0,Math.min(1,ticket.remaining/ticket.patience)):slot.patienceRatio!;},(g,value)=>g.lineStyle(2,0x65b74d,1).beginPath().arc(centerX,centerY,24,-Math.PI/2,-Math.PI/2+Math.PI*2*value).strokePath());
      const name=this.label(centerX,119,slot.name,9,ink);
      if(name.width>51){name.setText(slot.name);while(name.width>51&&name.text.length>2)name.setText(name.text.replace(/…$/,'').slice(0,-1)+'…');}
      this.hit(this.runtime.productionActive?'ticket-'+slot.id:'customer-linh',bounds.x,bounds.y,bounds.w,bounds.h,true,()=>{
        this.inspectedRecipe=null;
        if(this.runtime.productionActive){if(this.runtime.selectTicket(slot.id)&&this.runtime.selectedTicketId===slot.id)this.inspectedOrderId=slot.id;}
        else if(!this.runtime.pauses.some(reason=>reason!=='tutorial'))this.inspectedOrderId=slot.id;
      });
    });
  }
  private orderCard():void{
    const detail=this.orderQueue.detail,message=this.runtime.shopMessage;
    const delivery=this.runtime.deliveryStatus,status=delivery.phase==='travel'?'Đang giao':delivery.phase==='return'?'Nhân viên về':delivery.phase==='waiting'?'Shipper tới':delivery.phase==='arrived'?'Shipper đã tới':'';
    const courierText=status?`${status} · ${Math.ceil(delivery.remaining)}s`:'';
    const appTicket=this.runtime.selectedTicket,book=detail?.source==='app'&&appTicket?.riderState==='none';
    const notice=this.runtime.productionActive&&['Khách từ chối giá','Khách chưa thể đặt món.','Đã đủ 3 đơn'].some(prefix=>message.startsWith(prefix))?message:'';
    if(detail){
      this.graphics();this.art.pizza(33,164,13,recipeIngredients(detail.recipe));
      const row=(y:number,value:string,size:number,color:string)=>{const text=this.label(53,y,value,size,color,0,'left');const width=book?180:y===144&&courierText?146:282;if(text.width>width)text.setScale(width/text.width,1);return text;};
      row(144,`#${detail.number} · ${appTicket?.vip?'VIP · ':''}${detail.name}`,9,ink);
      if(courierText&&!book){const text=this.label(268,144,courierText,9,wood,132);this.timers.push({text,read:()=>`${status} · ${Math.ceil(this.runtime.deliveryStatus.remaining)}s`});}
      row(157,detail.lines[1],9,accent);
      const clock=row(170,notice||(appTicket?.vip?`Còn ${Math.ceil(appTicket.remaining)}s · Đúng/chín: +500 · +2 uy tín`:detail.lines[2]),9,wood);
      if(!notice)this.timers.push({text:clock,read:()=>{const ticket=this.frameTickets.find(t=>t.id===detail.id);return !ticket?clock.text:ticket.vip?`Còn ${Math.ceil(ticket.remaining)}s · Đúng/chín: +500 · +2 uy tín`:createOrderQueue([{...ticket,deliveryStatus:ticket.riderState==='waiting'?`Tới sau ${Math.ceil(ticket.riderRemaining)}s`:ticket.riderState==='arrived'?'Shipper đã tới':ticket.riderState==='staff'?'Nhân viên giao':'Chưa book shipper'}],ticket.id,ticket.id).detail?.lines[2]??clock.text;}});
    }else {const text=this.label(180,151,courierText||ORDER_DETAIL_PROMPT,13,ink,310);if(courierText)this.timers.push({text,read:()=>`${status} · ${Math.ceil(this.runtime.deliveryStatus.remaining)}s`});if(notice)this.label(180,170,notice,8,wood,310);}
    const {x,y,w,h}=KITCHEN.order;
    this.hit('order',x,y,book?224:w,h,!!detail||this.runtime.tutorialActive||!!notice,()=>{this.inspectedRecipe=null;if(this.orderQueue.detail||this.runtime.tutorialActive||notice)this.hold('order');});
    if(book&&detail)this.button('app-book-shipper',240,138,100,48,courierText||'Book shipper',!delivery.busy,()=>this.openDeliveryApp('book',detail.id),UI.dark);
  }
  private recipes():void{
    const production=this.runtime.productionActive&&!this.runtime.tutorialActive;
    const recipes=RECIPE_CATALOG.map(recipe=>[recipe.id,recipe.name] as const);
    recipes.forEach(([recipe,name],i)=>{
      const {x,y,w,h}=KITCHEN.recipe(i);
      const available=recipe==='cheese'||production&&this.runtime.availableRecipes.includes(recipe as StockRecipe);
      // Scale the entire illustration (including crust, toppings and shadow) into the space above the name.
      this.graphics();this.art.g.save().translateCanvas(x+w/2,y+14).scaleCanvas(.7,.7);
      this.art.pizza(0,0,18,recipeIngredients(recipe));this.art.g.restore();
      this.label(x+w/2,y+27,name,10,available?cream:muted,w-6);
      this.ingredientState(x,y,w,h,available,recipe===this.runtime.selectedRecipe);
      this.hit('recipe-'+i,x,y,w,h,available,()=>{this.inspectedRecipe=recipe as StockRecipe;this.hold('order');});
    });
  }
  private inventory():void{
    const items=[['dough','Đế bánh'],['cheese','Phô mai'],['mushroom','Nấm'],['sausage','Xúc xích'],['pepperoni','Pepperoni'],['pepper','Ớt chuông'],['onion','Hành tây'],['corn','Bắp'],['olive','Ô liu'],['chicken','Gà'],['shrimp','Tôm'],['squid','Mực'],['ham','Giăm bông'],['pineapple','Dứa']];
    const s=this.runtime.state,production=this.runtime.productionActive&&!this.runtime.tutorialActive,needed=this.neededIngredients;
    items.forEach(([id,name],i)=>{
      const {x,y,w,h}=KITCHEN.ingredient(i+5);
      const available=!this.runtime.tutorialActive||id==='dough'||id==='cheese';
      this.label(x+w/2,y+27,name,9,available?cream:muted,w-3);
      this.ingredientState(x,y,w,h,available,available&&s.ingredients.includes(id as StockIngredient),needed.includes(id as StockIngredient));
      this.hit(id,x,y,w,h,available&&this.runtime.canUseIngredient(id as StockIngredient),()=>this.useIngredient(id as StockIngredient));if(production)this.stockBadge(id as StockIngredient,x,y,w);
    });
    const {x,y,w,h}=KITCHEN.ingredient(19),discardable=production?this.runtime.workbenchDiscardId!==null:['raw','ready','boxed','burnt'].includes(s.stage);
    this.label(x+w/2,y+27,discardable?'Bỏ bánh':'Xóa tất cả',9,cream);
    this.hit(discardable?'discard':'clear',x,y,w,h,discardable||s.stage==='assembly'&&s.ingredients.length>0,()=>{if(discardable){if(production)this.runtime.requestWorkbenchDiscard();else this.runtime.dispatch({type:'discard'});}else for(const ingredient of [...this.runtime.state.ingredients])this.runtime.dispatch({type:'ingredient',ingredient});});
  }
  private useIngredient(ingredient:StockIngredient):void{
    if(!this.runtime.canUseIngredient(ingredient))return;
    if(isFinishingSauce(ingredient)&&this.runtime.state.finishingSauces.includes(ingredient))return;
    if(this.runtime.productionActive&&this.runtime.available(ingredient)<=0&&(this.runtime.state.stage!=='assembly'||!this.runtime.state.ingredients.includes(ingredient))){
      this.expressIngredient=ingredient;this.expressQuantity=1;this.expressLease=this.runtime.acquirePause('order');this.dirty=true;return;
    }
    this.runtime.dispatch({type:'ingredient',ingredient});
  }
  private closeExpress():void{this.expressIngredient=null;this.expressLease?.release();this.expressLease=undefined;this.dirty=true;}
  private openQueueUpgradeNotice():void{
    if(this.queueUpgradeNotice||!this.runtime.productionActive||this.runtime.queueCapacity!==4)return;
    this.queueUpgradeNotice=true;this.queueUpgradeLease=this.runtime.acquirePause('order');this.dirty=true;
  }
  private closeQueueUpgradeNotice():void{
    this.queueUpgradeNotice=false;this.queueUpgradeLease?.release();this.queueUpgradeLease=undefined;this.dirty=true;
  }
  private queueUpgradeDialog():void{
    this.resetModalControls();this.notice('Ô hàng chờ đang khóa','Hãy nâng cấp cửa hàng để được mở ô hàng chờ.','queue-upgrade-close','Đã hiểu',()=>this.closeQueueUpgradeNotice(),true,16);
  }
  private expressDialog():void{
    const ingredient=this.expressIngredient!;this.resetModalControls();this.notificationFrame(["express-confirm","express-close"],252,433,470);
    this.label(180,210,'Chợ · Đặt hỏa tốc',21,ink,280);
    const name=catalog.find(item=>item.id===ingredient)?.name??ingredient,price=this.runtime.expressPrice(ingredient),total=price*this.expressQuantity;
    this.label(180,252,name,18,ink,280);this.label(180,283,`${price} xu / phần · +60% giá chợ`,13,wood,280);
    this.label(180,311,'Nhận sau 5 giây chạy ca',12,wood,280);
    this.button('express-less',48,349,64,48,'−',this.expressQuantity>1,()=>{this.expressQuantity--;this.dirty=true;},UI.dark);
    this.label(180,358,String(this.expressQuantity),22,ink);
    this.button('express-more',248,349,64,48,'+',this.expressQuantity<20,()=>{this.expressQuantity++;this.dirty=true;},UI.dark);
    const enough=this.runtime.state.cash>=total;
    this.label(180,405,enough?`Tổng ${total} xu`:`Thiếu ${total-this.runtime.state.cash} xu`,13,enough?ink:accent,280);
    this.button('express-confirm',48,436,264,48,'Xác nhận đặt hàng',enough,()=>{if(this.runtime.dispatch({type:'express.order',ingredient,quantity:this.expressQuantity,commandId:`express:${this.purchaseScope}:${++this.purchaseSerial}`}))this.closeExpress();else this.dirty=true;});
    this.button('express-close',290,193,40,40,'Hủy',true,()=>this.closeExpress(),UI.dark);
  }
  private veil():void{
    this.visibleActions=[];for(const zone of this.hitZones.values())zone.disableInteractive();
    if(!this.veilDrawn){drawModalBackdrop(this,this.layer);this.veilDrawn=true;}this.controls=[];
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
    if(apply&&draft&&!this.applyMenu(draft.recipe,draft.percent,draft.enabled)){
      this.priceDraft=draft;this.priceError=this.runtime.shopMessage;this.priceLease=this.runtime.acquirePause('order');
    }
    this.dirty=true;
  }
  private applyMenu(recipe:StockRecipe,percent:number,enabled:boolean):boolean {
    const accepted=this.campaignSession?this.campaignSession.configureMenu(recipe,percent,enabled):this.runtime.configureMenu(recipe,percent,enabled);
    this.dirty=true;return accepted;
  }
  private priceDialog():void{
    const draft=this.priceDraft;if(!draft)return;
    for(const zone of this.hitZones.values())zone.disableInteractive();this.controls=[];this.visibleActions=[];
    this.notificationFrame(["market-price-cancel","market-price-save"],246,458,500);
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
    this.label(106,413,'Chỉ đổi trước\nkhi mở cửa',11,wood,128);
    this.button('market-price-cancel',40,462,132,48,'Hủy',true,()=>this.closePrice(),UI.dark);
    this.button('market-price-save',188,462,132,48,'Lưu giá',true,()=>this.closePrice(true));
  }
  private openStatement():void{
    if(this.runtime.pauses.length||!this.runtime.daySummary)return;
    this.statementOpen=true;this.statementLease=this.runtime.acquirePause('order');this.dirty=true;
  }
  private closeStatement():void{
    this.statementOpen=false;this.statementLease?.release();this.statementLease=undefined;this.dirty=true;
  }
  private statementDialog():void{
    const summary=this.runtime.daySummary;if(!summary)return;
    this.summaryModalVeil();this.referenceSummary().financeModal(summary);
    this.hit('summary-statement-close',295,46,40,40,true,()=>this.closeStatement());
  }
  private referenceSummary():ReferenceSummary{return new ReferenceSummary(this,this.layer,(...args)=>this.hit(...args),this.textScale);}
  private summaryModalVeil():void{
    for(const item of this.layer.list)if(item instanceof Phaser.GameObjects.Zone)item.disableInteractive();
    this.resetModalControls();this.notification=undefined;this.game.canvas.dataset.modalScroll='[]';this.veil();
  }
  private openReviews():void{if(this.runtime.pauses.length)return;this.reviewsOpen=true;this.reviewFilter='all';this.reviewsLease=this.runtime.acquirePause('order');this.dirty=true;}
  private closeReviews():void{this.reviewsOpen=false;this.reviewsLease?.release();this.reviewsLease=undefined;this.dirty=true;}
  private reviewsDialog():void{
    this.summaryModalVeil();const summary=this.runtime.daySummary;
    this.referenceSummary().reviewModal(summary?.reviews??[],summary?.day??this.runtime.day,this.reviewFilter,filter=>{this.reviewFilter=filter;this.dirty=true;});
    this.hit('summary-reviews-close',295,82,40,40,true,()=>this.closeReviews());
  }
  private dayHub():void{
    const summary=this.runtime.daySummary,initial=this.preparationHub;
    if(!summary&&!initial)return;
    const canBuy=initial?this.runtime.canOpen:this.runtime.canPrepareNextDay;
    this.layer.removeAll(true);this.controls=[];this.visibleActions=[];this.timers=[];this.dynamicVisuals=[];this.heatSignature='';this.heatBar=undefined;
    for(const zone of this.hitZones.values())zone.disableInteractive();
    {
      const saveBlocked=this.campaignSession&&['error','recovery'].includes(this.campaignSession.view.state);
      const footer=saveBlocked?{id:'save-show-status',title:'Xử lý lưu tiến độ',enabled:true,action:()=>{this.saveDismissed=false;this.dirty=true;}}:
        initial?{id:'summary-open-first-day',title:`Mở quán — Ngày ${this.runtime.day}`,enabled:this.runtime.canOpen,action:()=>{this.runtime.openShop();this.inspectedOrderId=null;}}:
        summary!.ending?{id:'summary-final-result',title:'Kết quả chiến dịch',enabled:!this.campaignSession||['ready','temporary'].includes(this.campaignSession.view.state),action:()=>this.openFinalResults()}:
        {id:'summary-open-next-day',title:`Mở quán — Ngày ${summary!.day+1}`,enabled:this.runtime.canOpenNextDay,action:()=>{this.runtime.openNextDay();this.inspectedOrderId=null;}};
      const reports=this.runtime.completedReports,previous=summary?reports.find(r=>r.day===summary.day-1):undefined;
      const tab=(id:'summary'|'market'|'stock'|'shop'|'missions')=>{this.summaryTab=id;this.stockDrag.active=false;this.marketDrag.active=false;this.dirty=true;};
      if(this.summaryTab==='stock'){
        new ReferenceStock(this,this.layer,(...args)=>this.hit(...args),render=>this.syncListHits(render)).draw({day:this.runtime.preparationDay,cash:this.runtime.state.cash,rows:stockRows(this.runtime.stockLots,this.runtime.preparationDay,id=>this.runtime.reserved(id)),filter:this.stockFilter,low:this.stockLow,expiryDays:this.stockExpiry,offset:this.stockOffset,drag:this.stockDrag,canScroll:()=>this.runtime.pauses.length===0,scroll:n=>{this.stockOffset=n;},setFilter:f=>this.setStockFilter(f),detail:id=>this.openStockLot(id),suggestions:()=>this.openStockPlanner(),market:()=>tab('market'),tab,pause:()=>this.hold('user')});return;
      }
      if(this.summaryTab==='shop'){
        new ReferenceShop(this,this.layer,(...args)=>this.hit(...args)).draw({staff:this.runtime.staffState,employee:role=>this.openStaffHire(role),shop:this.runtime.shopState,item:id=>this.openShopItem(id),app:()=>this.openDeliveryApp('settings'),deliveryApp:{...this.runtime.deliveryApp,eventName:this.runtime.deliveryApp.nextEvent.name},day:this.runtime.preparationDay,cash:this.runtime.state.cash,page:this.shopPage,canAct:this.runtime.canSetPrices,ovenLevel:this.runtime.ovenLevel,queueCapacity:this.runtime.queueCapacity,ovenPrice:this.runtime.upgradePrice('oven'),queuePrice:this.runtime.upgradePrice('queue'),menuPage:this.shopMenuPage,pageMenu:page=>{this.shopMenuPage=page;this.dirty=true;},buy:id=>this.openRecipePurchase(id),configure:(id,percent,enabled)=>{this.applyMenu(id,percent,enabled);},recipes:RECIPE_CATALOG.map(r=>r.id).map(id=>({id,name:recipeName(id),price:this.runtime.customerProgress.prices[id],percent:this.runtime.customerProgress.pricePercents[id],cost:recipeIngredients(id).reduce((n,item)=>n+this.runtime.price(item),0),enabled:this.runtime.menuRecipes.includes(id),owned:this.runtime.ownedRecipes.includes(id),purchasePrice:recipeDefinition(id).purchasePrice})),open:page=>{this.shopPage=page;this.dirty=true;},price:id=>this.choosePrice(id),upgrade:kind=>this.openHubUpgrade(kind),tab,pause:()=>this.hold('user'),footer});return;
      }
      if(this.summaryTab==='missions'){
        new ReferenceMissions(this,this.layer,(...args)=>this.hit(...args)).draw({day:this.runtime.preparationDay,cash:this.runtime.state.cash,progress:this.runtime.progression,ending:!!summary?.ending,tab,pause:()=>this.hold('user'),footer});return;
      }
      if(this.summaryTab==='market'){
        new ReferenceMarket(this,this.layer,(...args)=>this.hit(...args),render=>this.syncListHits(render)).draw({access:id=>this.runtime.ingredientAccess(id),basketTotal:this.marketBasketTotal,reservePercent:this.runtime.marketForecast.reservePercent,suggest:()=>this.suggestMarket(),buyAll:()=>this.openMarketBasket(),unitPrice:id=>this.runtime.price(id),supplier:this.runtime.supplier,day:this.runtime.preparationDay,cash:this.runtime.state.cash,canBuy,readOnlyReason:summary?.ending?'Chặng bán hàng đã kết thúc · Chợ chỉ để xem':'Mua đang bị khóa · Hãy xử lý lưu tiến độ',canScroll:()=>this.runtime.pauses.length===0,filter:this.marketFilter,offset:this.marketOffset,drag:this.marketDrag,quantities:this.marketQuantities,available:id=>this.runtime.available(id),quantity:(id,delta)=>{if(this.runtime.ingredientAccess(id).unlocked)this.marketQuantities[id]=Phaser.Math.Clamp((this.marketQuantities[id]??1)+delta,0,100);this.dirty=true;},buy:id=>this.buyMarketItem(id),editQuantity:id=>this.openMarketQuantity(id),scroll:offset=>{this.marketOffset=offset;},setFilter:filter=>{this.marketFilter=filter;this.marketOffset=0;this.dirty=true;},tab:id=>{this.summaryTab=id;this.dirty=true;},pause:()=>this.hold('user'),price:()=>this.choosePrice(this.runtime.selectedRecipe),footer});
        return;
      }
      this.referenceSummary().summary({report:summary,day:this.runtime.day,cash:this.runtime.state.cash,xp:summary?.progression.xp??this.runtime.progression.xp,previousXp:summary?(previous?.progression.xp??0):this.runtime.progression.xp,stockUnits:this.runtime.stockLots.reduce((n,lot)=>n+lot.quantity,0),ending:!!summary?.ending,paused:this.runtime.pauses.length>0,footer,tab:id=>{this.summaryTab=id;this.dirty=true;},pause:()=>this.hold('user'),finance:()=>this.openStatement(),reviews:()=>this.openReviews()});
      return;
    }
  }
  private resetModalControls(){this.controls=[];this.visibleActions=[];for(const zone of this.hitZones.values())zone.disableInteractive();}
  private closeHubPanels():void{
    this.staffHireDialog?.lease.release();this.staffHireDialog=undefined;
    this.shopItemDialog?.lease.release();this.shopItemDialog=undefined;
    this.recipePurchase?.lease.release();this.recipePurchase=undefined;this.plannerInput?.input.destroy();this.plannerInput=undefined;
    this.stockCriteria?.input.destroy();this.stockCriteria?.lease.release();this.stockCriteria=undefined;
    this.hubDetail?.lease.release();this.hubDetail=undefined;this.hubUpgrade?.lease.release();this.hubUpgrade=undefined;this.stockPlannerLease?.release();this.stockPlannerLease=undefined;this.dirty=true;
  }
  private openStockLot(id:StockIngredient):void{
    if(this.runtime.pauses.length)return;
    const day=this.runtime.preparationDay,lots=this.runtime.stockLots.filter(l=>l.ingredient===id).sort((a,b)=>a.expiry-b.expiry||a.id-b.id);
    this.hubDetail={title:ingredientName(id),body:`Có thể dùng: ${this.runtime.available(id)} phần · Giữ cho đơn: ${this.runtime.reserved(id)} phần.\n\n`+(lots.length?lots.map(l=>`Lô ngày ${l.day}: ${l.quantity} phần\n${isNonExpiring(id)?'Không hết hạn':'Dùng đến hết ngày '+l.expiry} · ${l.unitCost} xu/phần\n${l.expiry<day?'Đã hết hạn':l.day>day?'Chưa đến ngày sử dụng':'Còn dùng được'}`).join('\n\n'):'Chưa có lô nguyên liệu này.'),lease:this.runtime.acquirePause('order')};this.stockDrag.active=false;this.dirty=true;
  }
  private hubDetailDialog():void{
    const detail=this.hubDetail!;this.summaryModalVeil();this.notice(detail.title,detail.body,'hub-detail-close','Đã hiểu',()=>this.closeHubPanels(),true,14);
  }
  private setStockFilter(filter:StockFilter):void{
    if(this.runtime.pauses.length)return;
    if(filter!=='all'&&(filter==='low'?this.stockLow:this.stockExpiry)===null){
      const lease=this.runtime.acquirePause('order'),input=new MarketQuantityInput(this.game.canvas,0,()=>{this.dirty=true;},()=>this.closeStockCriteria(true),()=>this.closeStockCriteria(),{min:0,max:100,label:filter==='low'?'Ngưỡng sắp hết':'Số ngày sắp hết hạn'});
      this.stockCriteria={kind:filter,input,lease};this.stockDrag.active=false;this.dirty=true;return;
    }
    this.stockFilter=filter;this.stockOffset=0;this.dirty=true;
  }
  private closeStockCriteria(apply=false):void{
    const criteria=this.stockCriteria;if(!criteria)return;
    if(apply){const value=criteria.input.quantity;if(value===null||this.runtime.pauses.some(p=>p!=='order'))return;if(criteria.kind==='low')this.stockLow=value;else this.stockExpiry=value;this.stockFilter=criteria.kind;this.stockOffset=0;}
    criteria.input.destroy();criteria.lease.release();this.stockCriteria=undefined;this.dirty=true;
  }
  private stockCriteriaDialog():void{
    const criteria=this.stockCriteria!,low=criteria.kind==='low';this.summaryModalVeil();this.notificationFrame(['stock-criteria-cancel','stock-criteria-apply'],250,420,340);
    this.label(180,207,low?'Ngưỡng sắp hết':'Ngưỡng sắp hết hạn',21,ink);this.label(180,270,low?'Lượng khả dụng ≤ số phần bạn nhập':'Hết hạn trong số ngày bạn nhập, kể từ ngày chuẩn bị',14,wood,282);this.label(180,414,'Nhập số nguyên từ 0 đến 100.',12,wood,282);criteria.input.position();
    this.button('stock-criteria-cancel',40,430,132,48,'Hủy',true,()=>this.closeStockCriteria(),UI.dark);this.button('stock-criteria-apply',188,430,132,48,'Áp dụng',criteria.input.quantity!==null&&!this.runtime.pauses.some(p=>p!=='order'),()=>this.closeStockCriteria(true));
  }
  private openPlannerInput(recipe:StockRecipe):void {if(this.plannerInput)return;const input=new MarketQuantityInput(this.game.canvas,this.stockPortions[recipe]??0,()=>{this.dirty=true;},()=>this.closePlannerInput(true),()=>this.closePlannerInput(),{min:0,max:100,label:'S\u1ed1 ph\u1ea7n pizza'});this.plannerInput={recipe,input};this.dirty=true;}
  private closePlannerInput(apply=false):void {const editor=this.plannerInput;if(!editor)return;if(apply){if(editor.input.quantity===null)return;this.stockPortions[editor.recipe]=editor.input.quantity;}editor.input.destroy();this.plannerInput=undefined;this.dirty=true;}
  private plannerInputDialog():void {const editor=this.plannerInput!;editor.input.position();this.summaryModalVeil();this.notificationFrame(['stock-plan-input-cancel','stock-plan-input-apply'],250,420,390);const layout={titleY:207,bodyY:278,bodyWidth:286};this.label(180,layout.titleY,recipeName(editor.recipe),22,ink);this.label(180,layout.bodyY,'Nh\u1eadp s\u1ed1 nguy\u00ean 0\u2013100 ph\u1ea7n.',16,ink,layout.bodyWidth);this.button('stock-plan-input-cancel',40,430,132,48,'H\u1ee7y',true,()=>this.closePlannerInput(),UI.dark);this.button('stock-plan-input-apply',188,430,132,48,'\u0110\u00e3 ch\u1ecdn',editor.input.quantity!==null,()=>this.closePlannerInput(true));}
  private openStockPlanner():void{if(this.runtime.pauses.length)return;this.stockPlannerLease=this.runtime.acquirePause('order');this.stockDrag.active=false;this.dirty=true;}
  private stockPlannerDialog():void{
    this.summaryModalVeil();drawStockPlanner(this,this.layer,(...args)=>this.hit(...args),{menu:this.runtime.menuRecipes,menuPage:this.plannerMenuPage,ingredientPage:this.plannerIngredientPage,page:(section,page)=>{if(section==='menu')this.plannerMenuPage=page;else this.plannerIngredientPage=page;this.dirty=true;},edit:id=>this.openPlannerInput(id),portions:this.stockPortions,available:id=>this.runtime.available(id),canEdit:!this.runtime.pauses.some(p=>p!=='order'),change:(id,delta)=>{this.stockPortions[id]=Phaser.Math.Clamp((this.stockPortions[id]??0)+delta,0,100);this.dirty=true;},close:()=>this.closeHubPanels(),market:()=>{this.closeHubPanels();this.summaryTab='market';},});
  }
  private openHubUpgrade(kind:'oven'|'queue'):void{
    if(!this.runtime.canSetPrices)return;const cost=this.runtime.upgradePrice(kind);if(cost===null)return;
    this.hubUpgrade={kind,cost,commandId:`upgrade:${this.purchaseScope}:${kind}:${kind==='oven'?this.runtime.ovenLevel:this.runtime.queueCapacity}`,lease:this.runtime.acquirePause('order')};this.dirty=true;
  }
  private openStaffHire(role:StaffRole):void{
    if(!this.runtime.canSetPrices||this.staffHireDialog||!STAFF_CATALOG.some(entry=>entry.role===role))return;
    this.closeHubPanels();this.staffHireDialog={role,commandId:`staff:${this.purchaseScope}:${role}`,lease:this.runtime.acquirePause('order')};this.dirty=true;
  }
  private staffDialog():void{
    const dialog=this.staffHireDialog!,employee=STAFF_CATALOG.find(entry=>entry.role===dialog.role)!,preview=this.runtime.staffPreview(dialog.role);
    const duties={prep:'Thêm nguyên liệu đúng món; không tự mua hàng.',oven:'Nướng và lấy bánh đúng lúc, theo cấp lò hiện có.',box:'Đóng hộp và tích đủ bánh cho đơn app.',delivery:'Giao đủ hộp; 1 đơn/chuyến, trở về mới nhận tiếp.'};
    this.summaryModalVeil();this.notificationFrame(['staff-hire-cancel','staff-hire-confirm'],250,420,430);
    this.label(180,207,employee.name,23,ink);
    const body=`${preview.owned?'Đã thuê · Vai trò cố định':`Thuê: ${employee.price.toLocaleString('vi-VN')} xu`}\nLương: ${employee.dailyWage} xu/người/ngày\n${duties[dialog.role]}\n${preview.owned?'Tự làm đúng nghề khi mở ca.':!preview.available?`Mở thuê từ ngày ${STAFF_RULES.unlockDay}.`:preview.missing?`Còn thiếu ${preview.missing.toLocaleString('vi-VN')} xu.`:'Đủ tiền thuê. Mỗi loại tối đa 1 người.'}\nThu lương cuối ngày; thiếu giữ khoản chưa trả.`;
    this.label(180,265,body,15,ink,286);this.game.canvas.dataset.staffHire=JSON.stringify(preview);
    this.button('staff-hire-cancel',40,430,132,48,'Quay lại',true,()=>this.closeHubPanels(),UI.dark);
    this.button('staff-hire-confirm',188,430,132,48,preview.owned?'Đã thuê':'Thuê',!preview.owned&&preview.available&&preview.missing===0&&!this.runtime.pauses.some(reason=>reason!=='order'),()=>{
      this.closeHubPanels();if(this.campaignSession)this.campaignSession.hireStaff(dialog.role,dialog.commandId);else this.runtime.hireStaff(dialog.role,dialog.commandId);this.dirty=true;
    });
  }
  private openShopItem(id:ShopItemId):void {
    if(this.runtime.pauses.length||!shopItem(id))return;
    this.shopItemDialog={id,mode:'detail',commandId:`shop-item:${this.purchaseScope}:${++this.purchaseSerial}`,lease:this.runtime.acquirePause('order')};this.dirty=true;
  }
  private shopInvestmentDialog():void {
    const dialog=this.shopItemDialog!,item=shopItem(dialog.id)!;
    const preview=this.runtime.shopItemPreview(dialog.id,dialog.mode!=='store');
    const slot=SHOP_INSTALL_LOCATIONS[item.id],changing=dialog.mode!=='detail';
    this.summaryModalVeil();this.notificationFrame(['shop-item-cancel','shop-item-confirm'],250,420,390);
    this.label(180,207,item.name,21,ink);
    const illustration=(key:string,frame:string,crop:readonly[number,number,number,number],x:number,y:number,w:number,h:number)=>{if(!this.textures.exists(key))return;const texture=this.textures.get(key);if(!texture.has(frame))texture.add(frame,0,...crop);const art=this.add.image(x,y,key,frame);art.setScale(Math.min(w/art.frame.realWidth,h/art.frame.realHeight));this.layer.add(art);return art;};
    if(changing){
      illustration('reference-shop','shop-placement-room',[40,354,865,308],180,286,260,93);
      const placed=this.runtime.shopState.acquired.filter(entry=>entry.placedSlot!==null&&entry.id!==item.id).map(entry=>entry.id);
      if(dialog.mode==='place')placed.push(item.id);
      for(const id of placed){const entry=shopItem(id)!,position=SHOP_INSTALL_LOCATIONS[id],x=50+260*position.x,y=240+93*position.y;this.graphics();this.art.g.fillStyle(0xfff0d2,.95).fillRoundedRect(x-11,y-position.height*.39-2,22,position.height*.78+4,4);illustration(entry.artKey,'shop-item-'+id,entry.crop,x,y,20,position.height*.78);}
      this.game.canvas.dataset.shopPlacement=JSON.stringify({id:item.id,mode:dialog.mode,slot});
    }else illustration(item.artKey,'shop-item-'+item.id,item.crop,180,264,68,68);
    const effect='visitors' in item.effect?`+${Math.round(item.effect.visitors*100)}% khách ghé`:`+${Math.round(('patience' in item.effect?item.effect.patience:item.effect.cooling)*100)}% thời gian chờ`;
    const percent=(n:number)=>Math.round(n*100)+'%';
    const body=changing?`${dialog.mode==='place'?'Đặt tại:':'Cất khỏi:'} ${slot.name}\nKhách: +${percent(preview.current.visitors)} → +${percent(preview.after.visitors)}\nThời gian chờ: +${percent(preview.current.patience)} → +${percent(preview.after.patience)}\n${dialog.mode==='place'?'Áp dụng từ ca sắp mở.':'Giữ sở hữu, không hoàn tiền.'}`:`Giá: ${item.price?.toLocaleString('vi-VN')??'—'} xu · ${effect}\n${preview.owned?(preview.placed?'Đang đặt · '+slot.name:'Đã sở hữu · Đang cất'):(preview.missing?'Còn thiếu '+preview.missing.toLocaleString('vi-VN')+' xu.':'Đủ tiền mua.')}\n${item.available?(preview.owned?'Xem trước rồi xác nhận đặt/cất.':'Mua chưa đặt không cộng hiệu ứng.'):item.blockedReason}\nKhách: +${percent(preview.current.visitors)} → +${percent(preview.after.visitors)} · Chờ: +${percent(preview.current.patience)} → +${percent(preview.after.patience)}`;
    this.label(180,changing?339:312,body,13,ink,286);
    this.button('shop-item-cancel',40,430,132,48,'Quay lại',true,()=>this.closeHubPanels(),UI.dark);
    const enabled=item.available&&!this.runtime.pauses.some(p=>p!=='order')&&(preview.owned||preview.missing===0);
    const title=changing?'Xác nhận':preview.owned?(preview.placed?'Cất đi':'Đặt vào quán'):'Mua';
    this.button('shop-item-confirm',188,430,132,48,title,enabled,()=>{
      if(!changing&&preview.owned){dialog.mode=preview.placed?'store':'place';this.dirty=true;return;}
      this.closeHubPanels();
      if(changing){if(this.campaignSession)this.campaignSession.placeShopItem(item.id,dialog.mode==='place',dialog.commandId);else this.runtime.placeShopItem(item.id,dialog.mode==='place',dialog.commandId);}
      else {if(this.campaignSession)this.campaignSession.buyShopItem(item.id,dialog.commandId);else this.runtime.buyShopItem(item.id,dialog.commandId);}
      this.dirty=true;
    });
  }
  private openDeliveryApp(kind:'settings'|'book',ticketId?:string):void {
    if(this.runtime.pauses.length)return;
    this.appDialog={kind,ticketId,lease:this.runtime.acquirePause('order'),commandId:`delivery-app:${this.purchaseScope}:${++this.purchaseSerial}`};this.dirty=true;
  }
  private closeDeliveryApp():void {this.appDialog?.lease.release();this.appDialog=undefined;this.dirty=true;}
  private deliveryAppDialog():void {
    const dialog=this.appDialog!,app=this.runtime.deliveryApp;
    this.summaryModalVeil();
    if(dialog.kind==='settings'&&!app.available){this.notice('App giao hàng',`Mở từ ngày ${DELIVERY_RULES.unlockDay}.\nDự báo ngày ${app.nextEvent.day}: ${app.nextEvent.name}.\nBật app trước khi mở ca để nhận đơn giao.`, 'delivery-app-close','Đã hiểu',()=>this.closeDeliveryApp());return;}
    this.notificationFrame(['delivery-app-cancel','delivery-app-confirm'],250,420,390);
    this.label(180,207,dialog.kind==='book'?'Book shipper':'App giao hàng',22,ink);
    const weather=app.nextEvent.id==='rain'?'Mưa: ít khách tại quán, tăng đơn app; shipper chậm hơn.':app.nextEvent.id==='rush'?'Cao điểm: thêm khách tại quán.':app.nextEvent.id==='festival'?'Lễ hội: thêm khách và đơn app nhiều bánh.':'Nhịp khách bình thường.';
    const body=dialog.kind==='book'?`Book trước khi nướng.\nShipper tới sau ${app.waitSeconds} giây; chờ nếu bánh chưa xong.\nĐóng hộp đủ bánh rồi giao.\nBấm Giao bánh là hoàn tất và nhận tiền, phí ${app.fee} xu/đơn.`:`App đang ${app.enabled?'bật':'tắt'} · Không mất phí mở app.\nNgày ${app.nextEvent.day}: ${app.nextEvent.name}. ${weather}\nHạn đơn ${DELIVERY_RULES.deadline} giây · Phí ${app.staffAvailable?0:app.fee} xu/đơn đã giao.\n${app.staffAvailable?'Nhân viên nhận đủ hộp; bấm Giao hoàn tất ngay. Trở về mới nhận đơn tiếp.':'Book trước khi làm bánh. Bấm Giao là hoàn tất ngay.'}`;
    this.label(180,278,body,14,ink,286);
    this.button('delivery-app-cancel',40,430,132,48,'Quay lại',true,()=>this.closeDeliveryApp(),UI.dark);
    const enabled=!this.runtime.pauses.some(p=>p!=='order')&&(dialog.kind!=='book'||!this.runtime.deliveryStatus.busy);
    this.button('delivery-app-confirm',188,430,132,48,dialog.kind==='book'?'Book':app.enabled?'Tắt app':'Bật app',enabled,()=>{
      this.closeDeliveryApp();
      if(dialog.kind==='book')this.runtime.bookShipper(dialog.ticketId!,dialog.commandId);
      else if(this.campaignSession)this.campaignSession.configureDeliveryApp(!app.enabled,dialog.commandId);
      else this.runtime.configureDeliveryApp(!app.enabled,dialog.commandId);
      this.dirty=true;
    });
  }
  private hubUpgradeDialog():void{
    const upgrade=this.hubUpgrade!,canPay=this.runtime.state.cash>=upgrade.cost;
    this.summaryModalVeil();this.notificationFrame(['hub-upgrade-cancel','hub-upgrade-confirm'],250,420,390);this.label(180,207,upgrade.kind==='oven'?'Nâng cấp lò':'Mở ô hàng chờ',21,ink);
    this.label(180,278,`Giá: ${upgrade.cost} xu\n${canPay?'Còn lại: '+(this.runtime.state.cash-upgrade.cost):'Còn thiếu: '+(upgrade.cost-this.runtime.state.cash)} xu\nChỉ áp dụng từ ca bán sắp mở.`,15,ink,286);
    this.button('hub-upgrade-cancel',40,430,132,48,'Hủy',true,()=>this.closeHubPanels(),UI.dark);
    this.button('hub-upgrade-confirm',188,430,132,48,'Nâng cấp',canPay&&!this.runtime.pauses.some(p=>p!=='order'),()=>{
      this.closeHubPanels();if(this.campaignSession)void this.campaignSession.upgradeShop(upgrade.kind,upgrade.commandId);else this.runtime.dispatch({type:'shop.upgrade',kind:upgrade.kind,commandId:upgrade.commandId});this.dirty=true;
    });
  }
  private openRecipePurchase(recipe:StockRecipe):void {if(!this.runtime.canSetPrices||this.runtime.ownedRecipes.includes(recipe))return;this.recipePurchase={recipe,commandId:'recipe:'+this.purchaseScope+':'+recipe,lease:this.runtime.acquirePause('order')};this.dirty=true;}
  private recipePurchaseDialog():void {const purchase=this.recipePurchase!,definition=recipeDefinition(purchase.recipe),cost=definition.purchasePrice;this.summaryModalVeil();this.notificationFrame(['recipe-buy-cancel','recipe-buy-confirm'],250,420,390);const layout={titleY:207,bodyY:278,bodyWidth:286};this.label(180,layout.titleY,'Mua c\u00f4ng th\u1ee9c',23,ink);this.label(180,layout.bodyY,definition.name+'\n'+cost+' xu \u00b7 C\u00f2n '+(this.runtime.state.cash-cost)+' xu\nM\u1edf ngay trong th\u1ef1c \u0111\u01a1n; l\u01b0u c\u00f9ng ti\u1ec1n.',17,ink,layout.bodyWidth);this.button('recipe-buy-cancel',40,430,132,48,'H\u1ee7y',true,()=>this.closeHubPanels(),UI.dark);this.button('recipe-buy-confirm',188,430,132,48,'Mua',this.runtime.state.cash>=cost&&!this.runtime.pauses.some(p=>p!=='order'),()=>{this.closeHubPanels();if(this.campaignSession)this.campaignSession.buyRecipe(purchase.recipe,purchase.commandId);else this.runtime.buyRecipe(purchase.recipe,purchase.commandId);this.dirty=true;});}
  private openMarketQuantity(id:StockIngredient):void{
    if(!this.runtime.ingredientAccess(id).unlocked||this.marketQuantityEditor||this.runtime.pauses.length||!(this.preparationHub?this.runtime.canOpen:this.runtime.canPrepareNextDay))return;
    this.marketDrag.active=false;
    const lease=this.runtime.acquirePause('order');
    const input=new MarketQuantityInput(this.game.canvas,this.marketQuantities[id]??1,()=>{this.dirty=true;},()=>this.closeMarketQuantity(true),()=>this.closeMarketQuantity(),{min:0,max:100});
    this.marketQuantityEditor={id,input,lease};this.dirty=true;
  }
  private closeMarketQuantity(apply=false):void{
    const editor=this.marketQuantityEditor;if(!editor)return;
    if(apply){if(editor.input.quantity===null||!this.runtime.ingredientAccess(editor.id).unlocked||this.runtime.pauses.some(reason=>reason!=='order'))return;this.marketQuantities[editor.id]=editor.input.quantity;}
    this.marketQuantityEditor=undefined;editor.input.destroy();editor.lease.release();this.dirty=true;
  }
  private marketQuantityDialog():void{
    const editor=this.marketQuantityEditor!;
    this.summaryModalVeil();this.notificationFrame(['market-quantity-cancel','market-quantity-apply'],250,420,340);
    this.label(180,210,'Nhập số lượng',22,ink,280);
    this.label(180,260,ingredientName(editor.id),16,ink,280);
    this.label(180,290,'Số nguyên từ 0 đến 100 phần',12,wood,280);
    const valid=editor.input.quantity!==null;
    this.label(180,414,valid?'Chỉ chọn số lượng, chưa mua hàng.':'Nhập số nguyên từ 0 đến 100.',12,valid?wood:accent,280);
    editor.input.position();
    this.button('market-quantity-cancel',40,430,132,48,'Hủy',true,()=>this.closeMarketQuantity(),UI.dark);
    this.button('market-quantity-apply',188,430,132,48,'Đã chọn',valid&&!this.runtime.pauses.some(reason=>reason!=='order'),()=>this.closeMarketQuantity(true));
  }
  private get marketBasketEntries(){
    return STOCK_INGREDIENTS.filter(id=>this.runtime.ingredientAccess(id).unlocked)
      .map(ingredient=>({ingredient,quantity:this.marketQuantities[ingredient]??1})).filter(row=>row.quantity>0);
  }
  private get marketBasketTotal(){return this.marketBasketEntries.reduce((sum,row)=>sum+row.quantity*this.runtime.price(row.ingredient),0);}
  private suggestMarket():void{
    if(this.runtime.pauses.length||!(this.preparationHub?this.runtime.canOpen:this.runtime.canPrepareNextDay))return;
    const forecast=this.runtime.marketForecast;
    this.marketQuantities=Object.fromEntries(STOCK_INGREDIENTS.map(id=>[id,0]));
    for(const row of forecast.rows)if(this.runtime.ingredientAccess(row.ingredient).unlocked)this.marketQuantities[row.ingredient]=Math.min(100,row.missing);
    this.game.canvas.dataset.marketForecast=JSON.stringify(forecast);this.dirty=true;
  }
  private openMarketBasket():void{
    if(this.marketBasket||this.runtime.pauses.length||!(this.preparationHub?this.runtime.canOpen:this.runtime.canPrepareNextDay))return;
    const quote=this.runtime.quoteMarketBasket(this.marketBasketEntries);if(!quote)return;
    this.marketDrag.active=false;this.marketBasket={...quote,commandId:`market-all:${this.purchaseScope}:${++this.purchaseSerial}`};
    this.marketError='';this.marketLease=this.runtime.acquirePause('order');this.dirty=true;
  }
  private marketBasketDialog():void{
    const purchase=this.marketBasket!;this.summaryModalVeil();this.notificationFrame(['market-purchase-cancel','market-purchase-confirm'],250,480,520);
    this.label(180,210,'Mua tất cả nguyên liệu',21,ink,280);
    const enough=this.runtime.state.cash>=purchase.total;
    const lines=purchase.entries.map(row=>`${ingredientName(row.ingredient)} ×${row.quantity} · ${row.unitPrice} xu/phần = ${row.quantity*row.unitPrice} xu`);
    this.explanation(250,225,[...lines,`Tổng: ${purchase.total} xu`,enough?`Tiền còn lại: ${this.runtime.state.cash-purchase.total} xu`:`Thiếu ${purchase.total-this.runtime.state.cash} xu`,`Nhập toàn bộ vào Kho cho ngày ${purchase.day}.`,this.marketError].filter(Boolean).join('\n'),13);
    this.button('market-purchase-cancel',40,490,132,48,'Hủy',true,()=>this.closeMarketBasket(),UI.dark);
    this.button('market-purchase-confirm',188,490,132,48,'Mua tất cả',enough&&!this.runtime.pauses.some(p=>p!=='order'),()=>{
      if(this.marketBasket!==purchase)return;
      this.marketLease?.release();this.marketLease=undefined;
      if(this.runtime.buyAll(purchase.entries,purchase.commandId,purchase.day)){
        for(const row of purchase.entries)this.marketQuantities[row.ingredient]=0;
        this.closeMarketBasket();
      }else{this.marketError='Giá, quyền mua hoặc tiền đã thay đổi. Hãy đóng và kiểm tra lại giỏ.';this.marketLease=this.runtime.acquirePause('order');this.dirty=true;}
    });
    this.game.canvas.dataset.marketBasket=JSON.stringify(purchase);
  }
  private buyMarketItem(id:StockIngredient):void{
    if(!this.runtime.ingredientAccess(id).unlocked||this.marketBasket||this.runtime.pauses.length||!(this.preparationHub||this.runtime.canPrepareNextDay))return;
    this.marketDrag.active=false;
    const quantity=this.marketQuantities[id]??1;
    if(quantity<1)return;
    const now=performance.now();if(now-(this.marketLastPurchase.get(id)??-Infinity)<300)return;
    if(this.runtime.dispatch({type:'market.buy',ingredient:id,quantity,commandId:`market:${this.purchaseScope}:${++this.purchaseSerial}`}))this.marketLastPurchase.set(id,now);
    this.dirty=true;
  }
  private closeMarketBasket():void{this.marketBasket=null;this.marketLease?.release();this.marketLease=undefined;this.marketError='';this.dirty=true;}
  private saveDialog():void {
    const session=this.campaignSession!;const save=session.view;this.resetModalControls();this.notificationFrame(this.reloadConfirmation?['save-reload-confirm','save-reload-cancel']:[save.state==='recovery'?'save-recover-confirm':save.canRetry?'save-retry':'save-read-again'],250,510,490);
    this.label(180,210,this.reloadConfirmation?'Tải mốc mới nhất?':save.state==='saving'?'Đang lưu ngày…':'Tiến độ chưa lưu',22,ink,284);
    this.explanation(250,115,this.reloadConfirmation?'Kết quả và thay đổi RAM sau lần chốt trước sẽ mất. Chỉ mở đầu ngày hiện tại trong bản lưu mới nhất; ngày cũ không mở lại.':save.message,13);
    if(this.reloadConfirmation){
      this.button('save-reload-confirm',48,388,264,48,'Tải bản mới nhất',true,()=>{this.reloadConfirmation=false;void session.load().then(runtime=>{if(runtime)this.replaceRuntime?.(runtime);else if(session.view.state==='ready')this.returnToMenu?.();});});
      this.button('save-reload-cancel',48,452,264,48,'Giữ kết quả ở đây',true,()=>{this.reloadConfirmation=false;this.dirty=true;},UI.dark);return;
    }
    if(save.state==='loading'||save.state==='saving'){
      this.button(this.notification!.ids[0],0,0,0,0,save.state==='saving'?'Đang lưu…':'Đang đọc…',false,()=>{});return;
    }
    if(save.state==='recovery')this.button('save-recover-confirm',48,380,264,48,'Dùng bản cùng mốc',true,()=>{const runtime=session.confirmRecovery();if(runtime)this.replaceRuntime?.(runtime);});
    else if(save.canRetry)this.button('save-retry',48,380,264,48,'Thử lưu lại',true,()=>{void session.retry().then(runtime=>{if(runtime&&runtime!==this.runtime)this.replaceRuntime?.(runtime);});});
    else this.button('save-read-again',48,380,264,48,'Thử đọc lại',true,()=>{this.reloadConfirmation=true;this.dirty=true;});
    this.button('save-reload',48,440,128,48,'Tải mới nhất',true,()=>{this.reloadConfirmation=true;this.dirty=true;},UI.dark);
    this.button('save-view-summary',184,440,128,48,'Xem kết quả',this.runtime.shopPhase==='summary',()=>{this.saveDismissed=true;this.dirty=true;},UI.dark);
    this.label(180,514,'Chuẩn bị và mở ngày sau đang bị khóa.',11,wood,278);
  }
  private openFinalResults():void {if(!this.runtime.daySummary?.ending||this.finalOpen)return;this.finalOpen=true;this.finalLease=this.runtime.acquirePause('order');this.dirty=true;}
  private closeFinalResults():void {this.finalOpen=false;this.finalLease?.release();this.finalLease=undefined;this.dirty=true;}
  private openNewCampaign():void {this.closeFinalResults();this.newCampaignConfirmation=true;this.newCampaignLease??=this.runtime.acquirePause('order');this.dirty=true;}
  private closeNewCampaign():void {this.newCampaignConfirmation=false;this.newCampaignLease?.release();this.newCampaignLease=undefined;this.dirty=true;}
  private finalDialog():void {
    const s=this.runtime.daySummary!,result=this.runtime.campaignResults;this.resetModalControls();this.notificationFrame(['summary-new-campaign','summary-final-close'],236,440,470);
    this.label(180,191,s.ending==='complete'?'Hoàn thành chiến dịch':'Không đủ vốn',22,ink,280);
    this.explanation(236,185,[`Đã chốt ${result.daysCompleted}/${result.endDay} ngày`,s.ending==='insolvent'?s.viability?.message:'',`Cấp ${result.level} · ${result.xp} XP · Uy tín ${result.reputation}/100`,`Tiền cuối: ${result.cash} xu`,`Bán ${result.pizzas} pizza · Giao ${result.orders} đơn`,`Doanh thu: ${result.revenue} xu`,`Lợi nhuận cộng dồn: ${result.cumulativeProfit} xu`,`Mục tiêu ngày: ${result.goalsCompleted} · Nhiệm vụ: ${result.missionsCompleted}`,this.runtime.staffState.arrears?`Lương chưa trả: ${this.runtime.staffState.arrears} xu`:'',this.campaignSession?.view.state==='temporary'?'Phiên tạm không lưu.':this.campaignSession?'Kết quả đã lưu.':'Kết quả chỉ giữ trong phiên này.'].filter(Boolean).join('\n'),14);
    this.button('summary-new-campaign',40,430,132,48,'Chiến dịch mới',!!this.campaignSession||!!this.replaceRuntime,()=>this.openNewCampaign());
    this.button('summary-final-close',188,430,132,48,'Xem tổng kết',true,()=>this.closeFinalResults(),UI.dark);
  }
  private newCampaignDialog():void {
    this.resetModalControls();this.notificationFrame(["market-new-cancel","market-new-confirm"],278,350,420);
    this.label(180,231,'Chiến dịch mới?',23,ink);
    this.explanation(278,72,this.campaignSession?'Tiến độ hiện tại sẽ được thay bằng Ngày 1, 300 xu và kho trống. Các ngày đã chốt không thể mở lại. Chỉ thay bản cũ sau khi lưu mới thành công.':'Tiền và kho hiện tại sẽ được đặt lại về 300 xu và kho trống.',14);
    this.button('market-new-cancel',48,377,264,48,'Giữ phiên',true,()=>this.closeNewCampaign(),UI.dark);
    this.button('market-new-confirm',48,442,264,48,'Bắt đầu mới',true,()=>{this.closeNewCampaign();if(this.campaignSession)void this.campaignSession.start(false).then(runtime=>{if(runtime)this.replaceRuntime?.(runtime);});else if(this.replaceRuntime)this.replaceRuntime(new CozyRuntime(false,true,{eventSeed:campaignEventSeed(crypto.randomUUID())}));else {this.release('user');this.runtime.dispatch({type:'reset'});this.dirty=true;}});
  }
  private discardDialog():void{
    this.notificationFrame(["confirm-discard","cancel-discard"],276,332,420);
    this.label(180,232,'Bỏ chiếc pizza này?',22,ink);
    this.explanation(276,56,'Nguyên liệu đã dùng không được hoàn lại.\nLàm lại sẽ giữ nguyên liệu mới từ kho.');
    this.button('confirm-discard',64,352,232,48,'Xác nhận bỏ bánh',true,()=>this.runtime.confirmDiscard(),UI.dark);
    this.button('cancel-discard',64,410,232,48,'Giữ lại bánh',true,()=>this.runtime.cancelDiscard());
  }
  private deliveryDialog():void{
    const pending=this.runtime.deliveryPending!;
    this.notificationFrame(["confirm-delivery","cancel-delivery"],264,332,420);
    this.label(180,226,`Giao cho ${pending.name}?`,21,ink,280);
    this.explanation(264,68,`${recipeName(pending.recipe)}\n${pending.reasons.join('\n')}\nVẫn giao sẽ bị trừ sao.`);
    this.button('confirm-delivery',64,352,232,48,'Vẫn giao món',true,()=>this.runtime.confirmDelivery(),UI.dark);
    this.button('cancel-delivery',64,410,232,48,'Giữ lại bánh',true,()=>this.runtime.cancelDelivery());
  }
  private bargainDialog():void{
    const pending=this.runtime.bargainPending!;
    this.notificationFrame(["accept-bargain","reject-bargain"],260,346,420);
    this.label(180,226,`${pending.name} · Mặc cả`,21,ink,280);
    this.explanation(260,86,`Bánh đã làm xong! Khách xin giảm ${pending.discountPercent}%.\nGiá gốc ${pending.originalPrice} xu → ${pending.finalPrice} xu.\nChấp nhận: thành khách quen, quay lại ủng hộ.\nTừ chối: đánh giá thấp, không quay lại lần hai.`,13);
    this.button('accept-bargain',64,352,232,48,'Đồng ý · khách quen',true,()=>this.runtime.dispatch({type:'customer.bargain',accept:true}));
    this.button('reject-bargain',64,410,232,48,'Từ chối giá',true,()=>this.runtime.dispatch({type:'customer.bargain',accept:false}),UI.dark);
  }
  private helpDialog():void{
    const pending=this.runtime.helpPending;
    if(!pending){this.notice('Linh · Lời cảm ơn','“Cảm ơn bạn đã nhớ món mình thích!”\nQuan hệ đạt 2: +20 xu, đã nhận một lần.\nKhoản cảm ơn tách khỏi doanh thu và lợi nhuận; không thêm XP hay công thức.','continue-thanks','Tiếp tục ca',()=>this.runtime.dispatch({type:'customer.thanks'}),true,13);return;}
    this.notificationFrame(pending?['accept-help','decline-help']:['continue-thanks'],264,332,420);
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
      warming:['Đang tập nướng','Thanh trắng chuyển xanh khi bánh chín. Ca thật đang dừng.'],
      extract:['5/7 · Bánh chín vừa!','Chạm Lò 1 để lấy bánh ra. Đồng hồ tập đã dừng.'],
      box:['6/7 · Đóng hộp','Bấm “Đóng hộp” để chuẩn bị giao bánh tập.'],
      deliver:['7/7 · Giao bánh tập','Bấm “Giao bánh”. Bánh tập không tạo tiền thưởng.'],
    };
    if(step==='complete'){
      this.notice('Bạn đã biết làm pizza!','Bánh tập đã hoàn thành.\nTiền và nguyên liệu của ca thật\nvẫn được giữ nguyên.','start-shift','Bắt đầu ca bán',()=>this.runtime.startShift());return;
    }
    const [title,detail]=messages[step??'dough'];
    // Reuse the order area; guidance never hides the required kitchen controls.
    this.graphics();this.art.g.fillStyle(UI.paper,1).fillRoundedRect(15,147,330,33,7);
    this.label(26,148,title,12,ink,307,'left');this.label(26,165,detail,9,ink,307,'left');
  }
  private overlay():void{
    if(this.testCodePanel){this.resetModalControls();this.testCodePanel.draw(this,this.layer,(id,rect,enabled,action)=>this.hit(id,rect.x,rect.y,rect.width,rect.height,enabled,action));return;}
    const pauses=this.runtime.pauses;
    const reasons=`Đang dừng: ${pauses.map(p=>({tutorial:'hướng dẫn',user:'nghỉ tay',visibility:'ẩn màn hình',orientation:'xoay ngang',order:'đọc đơn',gap:'gián đoạn',success:'hoàn thành',discard:'xác nhận bỏ bánh',delivery:'xác nhận giao món',menu:'menu chính',bargain:'mặc cả',help:'lựa chọn giúp đỡ/lời cảm ơn',save:'lưu tiến độ'}[p])).join(', ')}`;
    if(this.endDayConfirmation&&this.scenePauses.has('user')){
      this.notificationFrame(['cancel-end-day','confirm-end-day'],270,480,450);
      this.label(180,231,`Kết thúc ngày ${this.runtime.day}?`,21,ink);
      this.explanation(270,95,`${this.runtime.tickets.filter(ticket=>!ticket.help).length} đơn thương mại chưa giao sẽ tính là khách bỏ đi.${this.runtime.tickets.some(ticket=>ticket.help)?'\nMón giúp chưa giao: quan hệ −1, không phạt uy tín.':''}\nBánh đang làm sẽ bỏ; nguyên liệu đã dùng không hoàn lại.\nTiền thuê: 20 xu.`,13);
      this.button('mute',62,390,120,48,this.audio.muted?'Âm: tắt':'Âm: bật',true,()=>this.audio.toggleMute(),UI.dark);
      this.button('cancel-end-day',48,382,264,48,'Tiếp tục ca này',true,()=>{this.endDayConfirmation=false;this.release('user');this.dirty=true;},UI.dark);
      this.button('confirm-end-day',48,444,264,48,'Xác nhận kết thúc ngày',this.runtime.canCloseDay,()=>this.finishDay());return;
    }
    const blocking=pauses.some(p=>p==='user'||p==='visibility'||p==='gap');
    if(blocking){if(this.pauseSettings)this.pauseSettingsPanel();else this.pausePanel();return;}
    if(!blocking&&this.inspectedRecipe){
      const recipe=this.inspectedRecipe;
      this.notice(recipeName(recipe),recipeIngredients(recipe).map(id=>catalog.find(item=>item.id===id)!.name).join(' + ')+'\n'+(this.runtime.productionActive?`Giá bán: ${this.runtime.customerProgress.prices[recipe]} xu\n`:'')+'Xem công thức không đổi món đang làm.\n'+reasons,'close-order','Tiếp tục làm bánh',()=>{this.inspectedRecipe=null;this.release('order');},this.scenePauses.has('order'),13);return;
    }
    if(!blocking&&this.runtime.productionActive){
      if(!this.runtime.selectedTicket){
        this.notice('Thông báo của quán',`${this.runtime.shopMessage}\nUy tín ${this.runtime.customerProgress.reputation}/100\n${reasons}`,'close-order','Tiếp tục ca',()=>this.release('order'),this.scenePauses.has('order'),12);return;
      }
      const rows=recipeIngredients(this.runtime.selectedRecipe);
      const ticket=this.runtime.selectedTicket,result=this.runtime.lastResult;
      const detail=this.runtime.shopMessage+'\n'+(ticket?.vip?'VIP: 1 bánh, hạn 100 giây. Đúng món, chín và trước hạn: thưởng thêm 500 và +2 uy tín.\n':'')+`${ticket?ticket.kindLabel+' · Giá chốt '+ticket.finalPrice+' xu · Mức nhận ≤'+ticket.maxPricePercent+'%\n':''}`+rows.map(id=>`${catalog.find(item=>item.id===id)!.name}: có ${this.runtime.owned(id)} · rảnh ${this.runtime.available(id)} · giữ ${this.runtime.reserved(id)}`).join('\n')+'\nNguyên liệu đã giữ chỉ dùng cho đơn này.\n'+this.shiftTimeText()+' · '+(ticket?.takeaway?'Cần đóng hộp':'Không cần hộp')+'\n'+reasons+`\nUy tín ${this.runtime.customerProgress.reputation}/100 · Quan hệ ${this.runtime.customerProgress.relationship}/3${result?'\nKết quả '+result.name+': '+result.stars+' sao · '+result.price+' xu\n'+(result.reasons.join(', ')||'Đúng món và chín vừa.')+'\nUy tín '+(result.reputationDelta>0?'+':'')+result.reputationDelta+' · Quan hệ +'+result.relationshipDelta:''}`;
      const itemList=ticket.items.map((item,index)=>`${index+1}. Pizza ${recipeName(item.recipe)}${item.finishingSauces.length?' + '+item.finishingSauces.map(id=>ingredientName(id)).join(' + '):''} · ${item.price} xu${index<ticket.packed?' · Đã đóng hộp':''}`).join('\n');
      this.notice(`Đơn của ${ticket.name}`,`${ticket.source==='app'?'App':ticket.takeaway?'Mang đi':'Tại quầy'} · ${ticket.totalPrice} xu cả đơn · ${ticket.packed}/${ticket.quantity} hộp\n${itemList}\n`+detail,'close-order','Tiếp tục làm bánh',()=>this.release('order'),this.scenePauses.has('order'),11);return;
    }
    this.notice('Đơn của Linh','1 pizza phô mai · Mang đi\nĐế bánh + sốt cà chua + phô mai\n'+reasons,'close-order','Làm bánh thôi',()=>this.release('order'),this.scenePauses.has('order'),12);
    if(pauses.includes('user')&&this.returnToMenu)this.button('main-menu',64,418,232,54,'Về menu chính',true,this.returnToMenu,UI.dark);
    if(this.runtime.postTutorialPreparation&&this.scenePauses.has('user'))this.button('market-reset',64,482,232,48,this.campaignSession?'Chiến dịch mới':'Làm lại Ngày 1',true,()=>this.openNewCampaign(),UI.dark);
    if(this.scenePauses.has('user')&&this.runtime.shopOpen)this.button('end-day',64,482,232,48,'Kết thúc ngày',this.runtime.canCloseDay,()=>{this.endDayConfirmation=true;this.dirty=true;},0xa65547);
  }
  private finishDay():void{
    const day=this.runtime.day;
    if(!(this.campaignSession?this.campaignSession.closeDay():this.runtime.closeDay()))return;
    this.endDayConfirmation=false;this.release('user');
    if(day===1){this.endedDayNotice=day;this.endedDayLease=this.runtime.acquirePause('order');}
    else this.summaryTab='summary';
    if(this.runtime.daySummary?.ending==='complete')this.pendingFinalResults=true;
    this.dirty=true;
  }
  private resumePause():void{
    this.pauseSettings=false;
    this.release('user');
    // Only lifecycle-owned recovery leases may be cleared by this gesture.
    if(this.lifecycle.needsContinue)this.lifecycle.continue();
    // Runtime's long-delta guard owns a separate legacy gap token.
    this.runtime.resume('gap');
    this.dirty=true;
  }
  private pausePanel():void{
    this.veil();const layout=referencePauseLayout();
    this.layer.add(this.add.image(layout.x,layout.y,REFERENCE_PAUSE_ART.key).setOrigin(0).setDisplaySize(layout.width,layout.height));
    const hit=(id:string,rect:{x:number;y:number;width:number;height:number},enabled:boolean,action:()=>void)=>this.hit(id,rect.x,rect.y,rect.width,rect.height,enabled,action);
    hit('resume',layout.buttons.resume,this.scenePauses.has('user')||this.lifecycle.needsContinue||this.runtime.pauses.includes('gap'),()=>this.resumePause());
    hit('pause-settings',layout.buttons.settings,true,()=>{this.hold('user');void this.audio.interact();this.audio.effect('settings');this.pauseSettings=true;this.dirty=true;});
    hit('main-menu',layout.buttons.menu,!!this.returnToMenu,()=>{this.pauseSettings=false;this.returnToMenu?.();});
    this.game.canvas.dataset.pausePanel=JSON.stringify(layout);
  }
  private closeTestCode():void {this.testCodePanel?.destroy();this.testCodePanel=undefined;this.testCodeLease?.release();this.testCodeLease=undefined;this.dirty=true;}
  private openTestCode():void {
    if(this.testCodePanel)return;
    this.testCodeLease=this.runtime.acquirePause('order');
    const session=this.campaignSession;
    this.testCodePanel=new TestCodePanel(this.game.canvas,session?{message:value=>session.testCodeMessage(value),claim:value=>session.claimTestCode(value),claimed:()=>!!session.runtime?.testCodeClaimed,save:()=>session.view,retry:()=>{void session.retry();}}:undefined,()=>{this.dirty=true;},()=>this.closeTestCode());this.dirty=true;
  }
  private pauseSettingsPanel():void{
    this.veil();this.notification=undefined;
    const ids={music:'settings-music','music-choice':'settings-music-choice',mute:'mute',motion:'settings-motion',code:'settings-code',back:'pause-settings-back'};
    drawSettingsPanel(this,this.layer,{audio:this.audio,preferences:this.preferences,reducedMotion:this.reducedMotion,changed:()=>{this.dirty=true;},code:()=>this.openTestCode(),back:()=>{this.pauseSettings=false;this.settingsFocusId='';},register:(action,rect,enabled,callback)=>this.hit(ids[action],rect.x,rect.y,rect.width,rect.height,enabled,callback)});
    const focus=this.controls.find(control=>control.id===this.settingsFocusId&&control.enabled);
    if(focus){const ring=this.add.graphics();ring.lineStyle(3,0x985025).strokeRoundedRect(focus.x-3,focus.y-3,focus.width+6,focus.height+6,27);this.layer.add(ring);}
  }
  private settingsKeyDown=(event:KeyboardEvent):void=>{
    if(this.testCodePanel||!this.pauseSettings||document.activeElement!==this.game.canvas)return;
    if(event.key==='Escape'){event.preventDefault();this.pauseSettings=false;this.settingsFocusId='';this.dirty=true;return;}
    const enabled=this.visibleActions.filter(action=>this.controls.some(control=>control.id===action.id&&control.enabled));
    if(!enabled.length)return;
    if(['Tab','ArrowDown','ArrowUp'].includes(event.key)){
      const current=enabled.findIndex(action=>action.id===this.settingsFocusId),direction=event.key==='ArrowUp'||event.shiftKey?-1:1;
      if(event.key==='Tab'&&current>=0&&(current+direction<0||current+direction>=enabled.length)){this.settingsFocusId='';this.dirty=true;return;}
      event.preventDefault();this.settingsFocusId=enabled[current===-1?direction===1?0:enabled.length-1:(current+direction+enabled.length)%enabled.length].id;this.dirty=true;
    }else if(event.key==='Enter'||event.key===' '){
      const action=enabled.find(action=>action.id===this.settingsFocusId);if(action){event.preventDefault();action.action();this.dirty=true;}
    }
  };
  private success():void{
    const s=this.runtime.state,wrong=s.feedback.includes('không đúng');
    this.notice(wrong?'Đã giao sai món':'Chiếc pizza đầu tiên!',s.feedback+'\n'+(wrong?'Không nhận tiền · −1 uy tín':`+${recipePrice(this.runtime.selectedRecipe)} xu · +1 uy tín`),'replay','Chơi lại Ngày 1',()=>this.runtime.dispatch({type:'reset'}),true,13);
  }
}
