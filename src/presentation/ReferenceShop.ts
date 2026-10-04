import {recipeDefinition} from '../config/recipeCatalog';
import {CozyArt} from './CozyArt';
import Phaser from 'phaser';
import type {StockRecipe} from '../domain/CozyStock';
import {HubCanvasUI,type HubHit,type HubTab} from './HubCanvasUI';
import {HUB_THEME} from './HubTheme';

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
type Input={day:number;cash:number;page:ShopPage;canAct:boolean;ovenLevel:number;queueCapacity:number;ovenPrice:number|null;queuePrice:number|null;menuPage:number;pageMenu:(page:number)=>void;buy:(recipe:StockRecipe)=>void;recipes:{id:StockRecipe;name:string;price:number;cost:number;enabled:boolean;owned:boolean;purchasePrice:number}[];open:(page:ShopPage)=>void;price:(recipe:StockRecipe)=>void;upgrade:(kind:'oven'|'queue')=>void;tab:(tab:HubTab)=>void;pause:()=>void;footer:{id:string;title:string;enabled:boolean;action:()=>void}};
const sections=[
  {id:'menu',title:'Menu & giá bán',subtitle:'Chọn món · Chỉnh giá',crop:[95,752,270,143]},
  {id:'decoration',title:'Trang trí',subtitle:'Đồ & vị trí chưa mở',crop:[513,750,323,145]},
  {id:'equipment',title:'Thiết bị',subtitle:'Nâng cấp lò hiện có',crop:[60,1000,339,150]},
  {id:'amenities',title:'Tiện nghi',subtitle:'Mua & đặt chưa mở',crop:[534,1007,326,143]},
  {id:'expansion',title:'Mở rộng quán',subtitle:'Nâng ô hàng chờ',crop:[58,1260,345,145]},
  {id:'staff',title:'Nhân viên',subtitle:'Thuê & phân công chưa mở',crop:[571,1259,239,145]},
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
      ui.text(180,263,`Minh họa · Lò cấp ${input.ovenLevel} · ${input.queueCapacity} ô chờ`,11,c.muted,true,323);
      sections.forEach((section,i)=>{
        const x=8+i%2*176,y=292+Math.floor(i/2)*95;
        ui.panel(x,y,168,89);art('reference-shop',section.crop,x+15,y+4,137,48);
        ui.text(x+84,y+54,section.title,14,c.ink,true,155);ui.text(x+84,y+72,section.subtitle,10,c.muted,true,155);
        this.hit(`shop-section-${section.id}`,x,y,168,89,true,()=>input.open(section.id));
      });
    }else{
      ui.button(8,133,120,36,'‹ Về Quán',true,14);this.hit('shop-back',8,130,120,43,true,()=>input.open('home'));
      if(input.page!=='menu')ui.text(140,145,'Ảnh minh họa',11,c.muted,false,205);
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
          if(i===0){ui.text(x+84,y+122,`Cấp ${input.ovenLevel} · ${['6–8','4–6','2–4'][Math.min(2,input.ovenLevel)]}s`,11,c.muted,true);
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
        ui.panel(8,439,344,88);ui.text(23,452,'Tu sửa / mở rộng mặt bằng',16);ui.text(23,480,'Chưa triển khai · Chưa có giá và lưu.',12,c.muted,false,318);
        note(['Nâng hàng chờ theo cấu hình hiện tại.','Ảnh không xác định diện tích hoặc đồ sở hữu.']);
      }else{
        const catalog=input.page==='decoration'?
          [['Cây để bàn',[39,610,180,233]],['Tranh pizza',[494,620,185,225]],['Đèn trang trí',[46,879,173,241]],['Bảng hiệu',[493,900,188,212]],['Chậu cây lớn',[43,1170,169,239]],['Rèm cửa',[490,1175,199,230]]] as const:
          input.page==='amenities'?
          [['Ghế chờ',[43,533,220,139]],['Wi-Fi',[497,538,227,136]],['Quạt đứng',[47,835,197,154]],['Máy lạnh',[506,851,220,136]],['Loa nghe nhạc',[46,1177,190,150]],['Bàn ghế khách',[496,1165,228,157]]] as const:
          [['Chuẩn bị nguyên liệu',[54,322,384,300]],['Phụ trách lò',[502,322,387,300]],['Đóng hộp pizza',[54,918,384,300]],['Giao tại quầy',[502,918,387,300]]] as const;
        const six=catalog.length===6,height=six?109:163,step=six?116:175;
        catalog.forEach(([name,source],i)=>{const x=8+i%2*176,y=180+Math.floor(i/2)*step;
          ui.panel(x,y,168,height);art(`reference-shop-${input.page}`,source,x+10,y+5,148,six?65:110);
          ui.text(x+84,y+(six?73:118),name,12,c.ink,true,153);ui.text(x+84,y+(six?91:140),'Chưa triển khai',10,c.muted,true);
        });
        note([input.page==='staff'?'Chưa mở thuê / phân công.':'Chưa mở mua / đặt / cất đồ.','Thiếu bảng giá, cấu hình và lưu sở hữu.']);
      }
    }
    ui.footer(input.footer);texture.refresh();const image=this.scene.add.image(0,0,key).setOrigin(0);this.layer.add(image);illustrations.forEach(draw=>draw());
    image.once('destroy',()=>this.scene.textures.remove(key));
    this.scene.game.canvas.dataset.shopPage=input.page;
    this.scene.game.canvas.dataset.hubTheme='pizza-cartoon-v1';
  }
}
