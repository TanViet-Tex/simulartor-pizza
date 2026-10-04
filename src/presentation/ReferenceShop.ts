import {recipeDefinition} from '../config/recipeCatalog';
import {CozyArt} from './CozyArt';
import Phaser from 'phaser';
import type {StockRecipe} from '../domain/CozyStock';
import {HubCanvasUI,type HubHit,type HubTab} from './HubCanvasUI';
import {HUB_THEME} from './HubTheme';
import {SHOP_CATALOG} from '../config/shopCatalog';
import type {ShopItemId,ShopEffects} from '../domain/ShopEffects';
import type {ShopAcquisition} from '../domain/ShopCheckpoint';
import {SHOP_INSTALL_LOCATIONS} from './ShopPlacement';
import {STAFF_CATALOG,STAFF_RULES,type StaffRole} from '../config/staffCatalog';
import type {StaffAcquisition} from '../domain/StaffCheckpoint';

export type ShopPage='home'|'menu'|'decoration'|'equipment'|'amenities'|'expansion'|'staff';
export const SHOP_ART=[
  {key:'reference-shop',url:'assets/references/Quán.png'},
  {key:'reference-shop-menu',url:'assets/references/Menu và giá bán pizza-1.png'},
  {key:'reference-shop-decoration',url:'assets/references/Trang trí quán pizza уют уют-1.png'},
  {key:'reference-shop-equipment',url:'assets/references/Nâng cấp thiết bị quán pizza-2.png'},
  {key:'reference-shop-amenities',url:'assets/references/Tiện nghi quán pizza-2.png'},
  {key:'reference-shop-expansion',url:'assets/references/Mở rộng quán pizza ấm cúng-5.png'},
  {key:'reference-shop-staff',url:'assets/references/Tuyển nhân viên tiệm pizza-6.png'},
] as const;
type Crop=readonly [number,number,number,number];
type Input={staff?:{acquired:StaffAcquisition[];dailyWages:number;arrears:number};employee?:(role:StaffRole)=>void;shop?:{acquired:ShopAcquisition[];effects:ShopEffects};item?:(id:ShopItemId)=>void;deliveryApp?:{available:boolean;enabled:boolean;eventName:string};app?:()=>void;day:number;cash:number;page:ShopPage;canAct:boolean;ovenLevel:number;queueCapacity:number;ovenPrice:number|null;queuePrice:number|null;menuPage:number;pageMenu:(page:number)=>void;buy:(recipe:StockRecipe)=>void;recipes:{id:StockRecipe;name:string;price:number;cost:number;enabled:boolean;owned:boolean;purchasePrice:number}[];open:(page:ShopPage)=>void;price:(recipe:StockRecipe)=>void;upgrade:(kind:'oven'|'queue')=>void;tab:(tab:HubTab)=>void;pause:()=>void;footer:{id:string;title:string;enabled:boolean;action:()=>void}};
const sections=[
  {id:'menu',title:'Menu & giá bán',subtitle:'Chọn món · Chỉnh giá',crop:[95,752,270,143]},
  {id:'decoration',title:'Trang trí',subtitle:'Mua đồ · Đặt / Cất',crop:[513,750,323,145]},
  {id:'equipment',title:'Thiết bị',subtitle:'Nâng cấp lò hiện có',crop:[60,1000,339,150]},
  {id:'amenities',title:'Tiện nghi',subtitle:'Mua & đặt chưa mở',crop:[534,1007,326,143]},
  {id:'expansion',title:'Mở rộng quán',subtitle:'Nâng ô hàng chờ',crop:[58,1260,345,145]},
  {id:'staff',title:'Nhân viên',subtitle:'Thuê theo nghề · Xem lương',crop:[571,1259,239,145]},
] as const;
let serial=0;

/** Only reference illustrations are sampled; all labels and actions use live state. */
export class ReferenceShop {
  constructor(private scene:Phaser.Scene,private layer:Phaser.GameObjects.Container,private hit:HubHit){}
  draw(input:Input):void {
    const key=`shop-window-${serial++}`,texture=this.scene.textures.createCanvas(key,360,640)!,ctx=texture.context;
    const illustrations:(()=>void)[]=[];const ui=new HubCanvasUI(this.scene,ctx,this.hit),c=HUB_THEME.colors;
    const title=input.page==='home'?'Quản lý quán':sections.find(section=>section.id===input.page)!.title;
    ui.background();ui.header({title,subtitle:`Chuẩn bị ngày ${input.day}`,cash:input.cash,pause:input.pause});ui.navigation('shop',input.tab);
    const art=(artKey:string,source:Crop,x:number,y:number,w:number,h:number)=>{
      if(!this.scene.textures.exists(artKey))return;
      const [sx,sy,sw,sh]=source,scale=Math.min(w/sw,h/sh);
      ctx.drawImage(this.scene.textures.get(artKey).getSourceImage() as HTMLImageElement,sx,sy,sw,sh,x+(w-sw*scale)/2,y+(h-sh*scale)/2,sw*scale,sh*scale);
    };
    const note=(lines:string[],y=541)=>{ui.panel(8,y,344,37,c.inset);lines.forEach((line,i)=>ui.text(18,y+6+i*14,line,11,c.muted,false,324));};
    if(input.page==='home'){
      ui.frame({x:8,y:133,width:344,height:151});
      art('reference-shop',[40,354,865,308],15,140,330,117);
      const placed=input.shop?.acquired.filter(item=>item.placedSlot!==null)??[];
      placed.forEach(entry=>{const item=SHOP_CATALOG.find(item=>item.id===entry.id)!,slot=SHOP_INSTALL_LOCATIONS[item.id],x=15+330*slot.x,y=140+117*slot.y;ui.panel(x-15,y-slot.height/2-2,30,slot.height+4,c.inset);art(item.artKey,item.crop,x-13,y-slot.height/2,26,slot.height);});
      ui.text(180,263,input.shop?`Minh họa · Đang đặt ${placed.length} · Khách +${Math.round(input.shop.effects.visitors*100)}% · Chờ +${Math.round(input.shop.effects.patience*100)}%`:`Minh họa · Lò cấp ${input.ovenLevel} · ${input.queueCapacity} ô chờ`,10,c.muted,true,323);
      sections.forEach((section,i)=>{
        const x=8+i%2*176,y=292+Math.floor(i/2)*95;
        ui.panel(x,y,168,89);art('reference-shop',section.crop,x+15,y+4,137,48);
        ui.text(x+84,y+54,section.title,14,c.ink,true,155);ui.text(x+84,y+72,section.id==='amenities'&&input.deliveryApp?'App giao hàng · '+(input.deliveryApp.available?(input.deliveryApp.enabled?'Bật':'Tắt'):'Từ ngày 5'):section.subtitle,10,c.muted,true,155);
        this.hit(`shop-section-${section.id}`,x,y,168,89,true,()=>input.open(section.id));
      });
    }else{
      ui.button(8,133,120,36,'‹ Về Quán',true,14);this.hit('shop-back',8,130,120,43,true,()=>input.open('home'));
      if(input.page==='amenities'&&input.deliveryApp&&input.app){ui.button(140,133,212,36,'App giao hàng · '+(input.deliveryApp.available?(input.deliveryApp.enabled?'Bật':'Tắt'):'Ngày 5'),true,13);this.hit('shop-delivery-app',140,128,212,48,true,input.app);}
      else if(input.page!=='menu')ui.text(140,145,input.page==='staff'?'Vai trò cố định':'Ảnh minh họa',11,c.muted,false,205);
      if(input.page==='menu'){
        const sources:Partial<Record<StockRecipe,Crop>>={cheese:[43,190,205,168],mushroom:[40,404,161,123],sausage:[40,551,162,123]};
        input.recipes.slice(input.menuPage*3,input.menuPage*3+3).forEach((recipe,i)=>{
          const y=180+i*115;ui.frame({x:8,y,width:344,height:107});if(sources[recipe.id])art('reference-shop-menu',sources[recipe.id]!,17,y+12,76,70);else illustrations.push(()=>{const graphics=this.scene.add.graphics();this.layer.add(graphics);new CozyArt(graphics).pizza(55,y+45,30,[...recipeDefinition(recipe.id).ingredients]);});
          ui.text(103,y+12,recipe.name,18,c.ink,false,225);ui.text(103,y+38,`Giá bán: ${recipe.price} xu`,14,c.ink);
          ui.text(103,y+57,recipe.owned?(recipe.enabled?'Đang bán':'Đã tắt bán'):`Chưa mở${input.cash<recipe.purchasePrice?' · Thiếu '+(recipe.purchasePrice-input.cash)+' xu':''}`,11,recipe.enabled?'#345f28':c.muted);ui.text(103,y+80,`Vốn ~${recipe.cost} · Lãi ~${recipe.price-recipe.cost}`,10,c.muted,false,125);
          ui.button(231,y+64,108,33,recipe.owned?'Chỉnh món ›':`Mua ${recipe.purchasePrice} xu`,input.canAct&&(recipe.owned||input.cash>=recipe.purchasePrice),12);
          this.hit(recipe.owned?`shop-price-${recipe.id}`:`shop-recipe-buy-${recipe.id}`,224,y+58,120,44,input.canAct&&(recipe.owned||input.cash>=recipe.purchasePrice),()=>recipe.owned?input.price(recipe.id):input.buy(recipe.id));
        });
        ui.button(136,132,48,38,'‹',input.menuPage>0,18);this.hit('shop-menu-prev',136,130,48,43,input.menuPage>0,()=>input.pageMenu(input.menuPage-1));ui.text(222,145,`${input.menuPage+1}/3`,13,c.ink,true);ui.button(264,132,48,38,'›',input.menuPage<2,18);this.hit('shop-menu-next',264,130,48,43,input.menuPage<2,()=>input.pageMenu(input.menuPage+1));
        note(['Vốn tham chiếu giá mua ngày; chưa trừ phí chung.',input.canAct?`Áp dụng ca ngày ${input.day}; đơn đã nhận giữ giá.`:'Hiện chỉ xem · Không thể đổi giá hoặc món.']);
      }else if(input.page==='equipment'){
        const items:[string,Crop][]=[['Lò hiện có',[48,254,426,240]],['Lò thứ hai',[533,254,360,326]],['Tủ lạnh',[47,966,430,275]],['Bàn làm pizza',[533,966,360,275]]];
        items.forEach(([name,source],i)=>{
          const x=8+i%2*176,y=180+Math.floor(i/2)*174;ui.panel(x,y,168,166);art('reference-shop-equipment',source,x+8,y+8,152,91);
          ui.text(x+84,y+104,name,14,c.ink,true,154);
          if(i===0){ui.text(x+84,y+122,`Cấp ${input.ovenLevel+1} · ${['6–8','4–6','2–4'][Math.min(2,input.ovenLevel)]}s`,11,c.muted,true);
            const enabled=input.canAct&&input.ovenPrice!==null;ui.button(x+7,y+140,154,23,input.ovenPrice===null?'Đã nâng tối đa':`Nâng cấp · ${input.ovenPrice} xu`,enabled,11);
            this.hit('summary-upgrade-oven',x+4,y+125,160,41,enabled,()=>input.upgrade('oven'));
          }else ui.text(x+84,y+135,'Chưa triển khai',12,c.muted,true);
        });note(['Lò nâng tốc độ; vẫn chỉ một vị trí nướng.','Đồ mới chưa có bảng giá, cấu hình và lưu.']);
      }else if(input.page==='expansion'){
        ui.frame({x:8,y:180,width:344,height:249});art('reference-shop-expansion',[40,255,865,295],16,190,328,112);
        ui.text(24,311,'Ô hàng chờ',20);ui.text(24,339,`Hiện có ${input.queueCapacity} ô`,15,c.ink);
        const enabled=input.canAct&&input.queuePrice!==null;
        ui.button(22,370,316,43,input.queuePrice===null?'Đã mở tối đa 6 ô':`Mở 6 ô · ${input.queuePrice} xu`,enabled,16);
        this.hit('summary-upgrade-queue',20,368,320,48,enabled,()=>input.upgrade('queue'));
        ui.panel(8,439,344,88);ui.text(23,452,'Tu sửa / mở rộng mặt bằng',16);ui.text(23,480,'Lần 2 chưa chốt tác dụng.',12,c.muted,false,318);
        ui.text(23,498,'Lần 2: 10.000 xu · Chưa mở mua',11,c.muted,false,318);
        note(['Nâng hàng chờ theo cấu hình hiện tại.','Giữ 6 ô hiện có; chưa mua mở rộng lần 2.']);
      }else if(input.page==='decoration'||input.page==='amenities'){
        const items=SHOP_CATALOG.filter(item=>item.group===input.page);
        items.forEach((item,i)=>{
          const x=8+i%2*176,y=180+Math.floor(i/2)*116,owned=input.shop?.acquired.find(entry=>entry.id===item.id);
          ui.panel(x,y,168,109);art(item.artKey,item.crop,x+10,y+5,148,65);
          const effect='visitors' in item.effect?`+${Math.round(item.effect.visitors*100)}% khách ghé`:`+${Math.round(('patience' in item.effect?item.effect.patience:item.effect.cooling)*100)}% thời gian chờ`;
          if(owned||!item.available){ui.panel(x+76,y+6,85,18,c.inset);ui.text(x+118,y+10,owned?(owned.placedSlot?'Đang đặt':'Đã sở hữu'):'Chờ chốt',9,c.ink,true,79);}
          ui.text(x+84,y+73,item.name,12,c.ink,true,153);ui.text(x+84,y+91,`${item.price?.toLocaleString('vi-VN')??'—'} xu · ${effect}`,10,c.muted,true,154);
          this.hit('shop-item-'+item.id,x,y,168,109,!!input.item,()=>input.item?.(item.id));
        });
        const effects=input.shop?.effects;
        note([`Đang đặt: khách +${Math.round((effects?.visitors??0)*100)}% · Thời gian chờ +${Math.round((effects?.patience??0)*100)}%`,'Mua chưa đặt không cộng hiệu ứng; đổi trước ca.']);
      }else{
        const crops=[[54,322,384,300],[502,322,387,300],[54,918,384,300],[502,918,387,300]] as const;
        STAFF_CATALOG.forEach((employee,i)=>{const x=8+i%2*176,y=180+Math.floor(i/2)*175,owned=input.staff?.acquired.some(entry=>entry.role===employee.role);
          ui.panel(x,y,168,163);art('reference-shop-staff',crops[i],x+10,y+5,148,110);
          if(owned||input.day<STAFF_RULES.unlockDay){ui.panel(x+77,y+6,84,18,c.inset);ui.text(x+119,y+10,owned?'Đã thuê':`Mở ngày ${employee.unlockDay}`,9,c.ink,true,79);}
          ui.text(x+84,y+118,employee.name,12,c.ink,true,153);ui.text(x+84,y+140,`${employee.price.toLocaleString('vi-VN')} xu · ${employee.dailyWage} xu/ngày`,10,c.muted,true,154);
          this.hit('shop-staff-'+employee.role,x,y,168,163,!!input.employee,()=>input.employee?.(employee.role));
        });
        note([`${input.staff?.acquired.length??0} người · Lương ${input.staff?.dailyWages??0} xu/ngày`,input.staff?.arrears?`Lương chưa trả: ${input.staff.arrears.toLocaleString('vi-VN')} xu`:'Nghề cố định · Thu lương cuối ngày.']);
      }
    }
    ui.footer(input.footer);texture.refresh();const image=this.scene.add.image(0,0,key).setOrigin(0);this.layer.add(image);illustrations.forEach(draw=>draw());
    image.once('destroy',()=>this.scene.textures.remove(key));
    this.scene.game.canvas.dataset.shopPage=input.page;
    this.scene.game.canvas.dataset.hubTheme='pizza-cartoon-v1';
  }
}
