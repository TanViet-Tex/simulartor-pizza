import {uiCanvas} from './UiRaster';

import Phaser from 'phaser';
import type {StockRecipe} from '../domain/CozyStock';
import {HubCanvasUI,type HubHit,type HubTab} from './HubCanvasUI';
import {HUB_THEME} from './HubTheme';
import {SHOP_CATALOG} from '../config/shopCatalog';
import type {ShopItemId,ShopEffects} from '../domain/ShopEffects';
import type {ShopAcquisition} from '../domain/ShopCheckpoint';
import {SHOP_INSTALL_LOCATIONS} from './ShopPlacement';
import type {StaffRole} from '../config/staffCatalog';
import type {StaffAcquisition} from '../domain/StaffCheckpoint';
import {hubListWindow,type HubDrag} from './HubListWindow';
import {drawShopScreen} from './ShopScreens';
import {drawManagementDetail,managementCard} from './ManagementTabArt';

export type ShopPage='home'|'menu'|'decoration'|'equipment'|'amenities'|'expansion'|'staff'|'app';
export const SHOP_ART=[
  {key:'reference-drink-tray',url:'assets/references/Khay cola, nước suối và trà sữa.png'},
  {key:'reference-shop',url:'assets/references/Quán.png'},
  {key:'reference-shop-menu',url:'assets/references/Menu và giá bán pizza-1.png'},
  {key:'reference-shop-decoration',url:'assets/references/Trang trí quán pizza уют уют-1.png'},
  {key:'reference-shop-equipment',url:'assets/references/Nâng cấp thiết bị quán pizza-2.png'},
  {key:'reference-shop-amenities',url:'assets/references/Tiện nghi quán pizza-2.png'},
  {key:'reference-shop-expansion',url:'assets/references/Mở rộng quán pizza ấm cúng-5.png'},
  {key:'reference-shop-staff',url:'assets/references/Tuyển nhân viên tiệm pizza-6.png'},
] as const;
type Crop=readonly [number,number,number,number];
export type ShopScreenInput={appCampaign?:{bought:boolean;price:number;canBuy:boolean;reason:string;forecast:{appOrders:number;shopVisits:number}};campaign?:()=>void;offset?:number;drag?:HubDrag;canScroll?:()=>boolean;scroll?:(offset:number)=>void;sync?:(render:()=>void)=>void;filter?:string;setFilter?:(filter:string)=>void;selectedRecipe?:StockRecipe;selectRecipe?:(recipe:StockRecipe)=>void;shell?:boolean;advertising?:{bought:boolean;price:number};advertise?:()=>void;fridge?:{owned:boolean;price:number};buyFridge?:()=>void;staff?:{acquired:StaffAcquisition[];dailyWages:number;arrears:number;absentRoles?:StaffRole[];expiredRoles?:StaffRole[];renewalPendingRoles?:StaffRole[]};staffPreviews?:{role:StaffRole;owned:boolean;expired:boolean;remainingDays:number}[];employee?:(role:StaffRole)=>void;shop?:{acquired:ShopAcquisition[];effects:ShopEffects};item?:(id:ShopItemId)=>void;deliveryApp?:{available:boolean;enabled:boolean;eventName:string};app?:()=>void;day:number;cash:number;page:ShopPage;canAct:boolean;ovenLevel:number;queueCapacity:number;queueLevel:number;queueVisitorBonus:number;nextQueueCapacity:number;ovenPrice:number|null;queuePrice:number|null;menuPage:number;pageMenu:(page:number)=>void;buy:(recipe:StockRecipe)=>void;configure:(recipe:StockRecipe,percent:number,enabled:boolean)=>void;recipes:{id:StockRecipe;name:string;price:number;percent:number;cost:number;enabled:boolean;owned:boolean;purchasePrice:number}[];open:(page:ShopPage)=>void;price:(recipe:StockRecipe)=>void;upgrade:(kind:'oven'|'queue')=>void;tab:(tab:HubTab)=>void;pause:()=>void;footer:{id:string;title:string;enabled:boolean;action:()=>void}};
const sections=[
  {id:'menu',title:'Menu & giá bán',subtitle:'Chọn món · Chỉnh giá',crop:[95,752,270,143]},
  {id:'decoration',title:'Trang trí',subtitle:'Mua đồ · Đặt / Cất',crop:[513,750,323,145]},
  {id:'equipment',title:'Thiết bị',subtitle:'Nâng cấp lò hiện có',crop:[60,1000,339,150]},
  {id:'amenities',title:'Tiện nghi',subtitle:'Mua đồ · Đặt / Cất',crop:[534,1007,326,143]},
  {id:'expansion',title:'Mở rộng quán',subtitle:'Nâng ô hàng chờ',crop:[58,1260,345,145]},
  {id:'staff',title:'Nhân viên',subtitle:'Thuê theo nghề · 10 ngày',crop:[571,1259,239,145]},
] as const;
let serial=0;

/** Only reference illustrations are sampled; all labels and actions use live state. */
export class ReferenceShop {
  constructor(private scene:Phaser.Scene,private layer:Phaser.GameObjects.Container,private hit:HubHit){}
  draw(input:ShopScreenInput):void {
    if(input.page!=='home'){drawShopScreen(this.scene,this.layer,this.hit,input);return;}
    const key=`shop-window-${serial++}`,texture=uiCanvas(this.scene,key,360,640),ctx=texture.context;
    const illustrations:(()=>void)[]=[];const ui=new HubCanvasUI(this.scene,ctx,this.hit),c=HUB_THEME.colors;
    const title='Quản lý quán';
    if(input.shell!==false)ui.header({title,subtitle:`Chuẩn bị ngày ${input.day}`,cash:input.cash,pause:input.pause});if(input.shell!==false)ui.navigation('shop',input.tab);
    const art=(artKey:string,source:Crop,x:number,y:number,w:number,h:number,target=ctx)=>{
      if(!this.scene.textures.exists(artKey))return;
      const [sx,sy,sw,sh]=source,scale=Math.min(w/sw,h/sh);
      target.drawImage(this.scene.textures.get(artKey).getSourceImage() as HTMLImageElement,sx,sy,sw,sh,x+(w-sw*scale)/2,y+(h-sh*scale)/2,sw*scale,sh*scale);
    };
    if(input.page==='home'){
      ui.frame({x:8,y:133,width:344,height:151});
      art('reference-shop',[40,354,865,308],15,140,330,117);
      const placed=input.shop?.acquired.filter(item=>item.placedSlot!==null)??[];
      placed.forEach(entry=>{const item=SHOP_CATALOG.find(item=>item.id===entry.id)!,slot=SHOP_INSTALL_LOCATIONS[item.id],x=15+330*slot.x,y=140+117*slot.y;ui.panel(x-15,y-slot.height/2-2,30,slot.height+4,c.inset);art(item.artKey,item.crop,x-13,y-slot.height/2,26,slot.height);});
      managementCard(ctx,83,254,194,27,'#fff2d5','#d8b48a',12);
      drawManagementDetail(this.scene,ctx,'leaf',90,259,15,18);drawManagementDetail(this.scene,ctx,'leaf',256,259,15,18);
      ui.text(180,258,`Lò cấp ${input.ovenLevel} · ${input.queueCapacity} ô chờ`,12,c.ink,true,144);
      ui.text(180,273,input.shop?`Minh họa · Đặt ${placed.length} · Khách +${Math.round(input.shop.effects.visitors*100)}% · Chờ +${Math.round(input.shop.effects.patience*100)}%`:'Quán hiện tại · Minh họa',8,c.muted,true,188);
      illustrations.push(()=>hubListWindow(this.scene,this.layer,{key:key+'-cards',viewport:{x:8,y:292,width:344,height:279},height:374,offset:input.offset??0,drag:input.drag!,allowed:input.canScroll??(()=>true),paint:(cardUI,cardCtx)=>{
        sections.forEach((section,i)=>{
          const x=8+i%2*176,y=Math.floor(i/2)*95;
          managementCard(cardCtx,x,y,168,89,'#fff3db','#87562d',12);
          cardCtx.save();cardCtx.beginPath();cardCtx.ellipse(x+79,y+49,53,6,0,0,Math.PI*2);cardCtx.fillStyle='#f0d2a5';cardCtx.fill();cardCtx.restore();
          art('reference-shop',section.crop,x+10,y+3,137,52,cardCtx);
          cardUI.text(x+153,y+28,'›',25,'#7b563a',true);
          cardUI.text(x+84,y+57,section.title,14,c.ink,true,155);cardUI.text(x+84,y+75,section.subtitle,9,c.muted,true,155);
        });
        managementCard(cardCtx,8,285,344,89,'#fff3db','#87562d',12);
        cardUI.panel(26,300,31,49,'#314139','#b38c54',7);cardUI.panel(31,306,21,32,'#f1e7cf','#d3ba8f',3);cardUI.text(41.5,339,'•',13,'#fff3db',true);
        cardUI.text(73,305,'Đơn app',17,c.ink,false,234);cardUI.text(73,331,input.deliveryApp?.available?(input.deliveryApp.enabled?'App đang bật · Chiến dịch +50%':'Bật app · Chạy chiến dịch'):'Mở từ ngày 5 · Giao pizza',12,c.muted,false,234);cardUI.text(331,313,'›',27,'#7b563a',true);
      },update:offset=>{
        input.scroll?.(offset);input.sync?.(()=>{
          sections.forEach((section,i)=>this.hit(`shop-section-${section.id}`,8+i%2*176,292+Math.floor(i/2)*95-offset,168,89,true,()=>input.open(section.id)));
          this.hit('shop-section-app',8,577-offset,344,89,true,()=>input.open('app'));
        });
        this.scene.game.canvas.dataset.shopScroll=JSON.stringify({offset,max:95,viewport:{x:8,y:292,width:344,height:279}});
      }}));
      managementCard(ctx,12,575,336,13,'#e8eed4','#bbc995',6);drawManagementDetail(this.scene,ctx,'leaf',28,575,12);ui.text(188,577,'Vuốt lên để xem Đơn app · 7 mục quản lý',9,'#355b2d',true,302);
    }
    ui.footer(input.footer);texture.refresh();const image=this.scene.add.image(0,0,key).setOrigin(0).setDisplaySize(360,640);this.layer.add(image);illustrations.forEach(draw=>draw());
    image.once('destroy',()=>this.scene.textures.remove(key));
    this.scene.game.canvas.dataset.shopPage=input.page;
    this.scene.game.canvas.dataset.hubTheme='pizza-cartoon-v1';
  }
}
