import Phaser from 'phaser';
import {STOCK_INGREDIENTS,ingredientName,type StockIngredient} from '../domain/CozyStock';
import {HUB_THEME} from './HubTheme';
import {HUB_HEADER_ART} from './HubHeader';
import {HUB_ART,HubCanvasUI} from './HubCanvasUI';
import {MARKET_INGREDIENT_ART,drawMarketIngredient} from './MarketIngredientArt';

export type MarketFilter='all'|'sauce'|'topping'|'base';
export type MarketDrag={active:boolean;startY:number;offset:number};
type Hit=(id:string,x:number,y:number,w:number,h:number,enabled:boolean,action:()=>void)=>void;
export const MARKET_ART=HUB_ART;
export function preloadMarketArt(scene:Phaser.Scene):void{for(const art of [MARKET_ART,MARKET_INGREDIENT_ART,HUB_HEADER_ART])if(!scene.textures.exists(art.key))scene.load.image(art.key,`${import.meta.env.BASE_URL}${art.url}`);}
let serial=0;
/** A bounded canvas window keeps native borders and row artwork clipped in WebGL. */
export class ReferenceMarket{
  constructor(private scene:Phaser.Scene,private layer:Phaser.GameObjects.Container,private hit:Hit){}
  draw(input:{unitPrice:(id:StockIngredient)=>number;supplier:{familiar:boolean;purchased:number;threshold:number};day:number;cash:number;canBuy:boolean;readOnlyReason:string;canScroll:()=>boolean;filter:MarketFilter;offset:number;drag:MarketDrag;quantities:Partial<Record<StockIngredient,number>>;available:(id:StockIngredient)=>number;quantity:(id:StockIngredient,delta:number)=>void;buy:(id:StockIngredient)=>void;editQuantity:(id:StockIngredient)=>void;scroll:(offset:number)=>void;setFilter:(filter:MarketFilter)=>void;tab:(id:'summary'|'market'|'stock'|'shop'|'missions')=>void;pause:()=>void;price:()=>void;footer:{id:string;title:string;enabled:boolean;action:()=>void}}):void{
    const key=`market-window-${serial++}`,texture=this.scene.textures.createCanvas(key,360,640)!,ctx=texture.context;
    const ui=new HubCanvasUI(this.scene,ctx,this.hit),colors=HUB_THEME.colors;
    const frame=ui.frame.bind(ui),text=ui.text.bind(ui),panel=ui.panel.bind(ui);
    ui.background();ui.header({title:'Chợ nguyên liệu',subtitle:`Chuẩn bị ngày ${input.day}`,cash:input.cash,pause:input.pause});
    ui.navigation('market',input.tab);
    frame({x:8,y:133,width:344,height:40});
    const filters=[['all','Tất cả'],['sauce','Sốt'],['topping','Topping'],['base','Đế & phô mai']] as const;
    filters.forEach(([id,title],i)=>{const x=15+i*84;panel(x,139,78,28,id===input.filter?colors.active:colors.inset);text(x+39,148,title,i===3?10:12,id===input.filter?colors.cream:colors.ink,true);this.hit(`market-filter-${id}`,x,136,78,34,true,()=>input.setFilter(id));});
    frame({x:8,y:180,width:344,height:399});text(24,190,`Mua cho ngày ${input.day}`,19);text(306,194,'Giá món ›',11,colors.muted,true);this.hit('market-price-open',269,184,67,29,input.canBuy,input.price);
    const viewport={x:17,y:219,width:321,height:318},rowHeight=53;
    const ids=[...STOCK_INGREDIENTS].sort((a,b)=>{const order:StockIngredient[]=['dough','cheese','sauce','mushroom','sausage','chicken'];return (order.includes(a)?order.indexOf(a):6+STOCK_INGREDIENTS.indexOf(a))-(order.includes(b)?order.indexOf(b):6+STOCK_INGREDIENTS.indexOf(b));}).filter(id=>input.filter==='all'||input.filter==='sauce'&&id.startsWith('sauce')||input.filter==='base'&&['dough','cheese'].includes(id)||input.filter==='topping'&&!id.startsWith('sauce')&&!['dough','cheese'].includes(id));
    const max=Math.max(0,ids.length*rowHeight-viewport.height),offset=Phaser.Math.Clamp(input.offset,0,max);
    const rows=ids.map((id,i)=>{const quantity=input.quantities[id]??1,unitPrice=input.unitPrice(id),total=quantity*unitPrice,y=viewport.y+i*rowHeight-offset;return {id,name:ingredientName(id),quantity,unitPrice,total,available:input.available(id),remainingCash:input.cash-total,y,visible:y>=viewport.y&&y+rowHeight<=viewport.y+viewport.height};});
    ctx.save();ctx.beginPath();ctx.rect(viewport.x,viewport.y,viewport.width,viewport.height);ctx.clip();
    for(const row of rows){const {id,y}=row;if(y+rowHeight<viewport.y||y>viewport.y+viewport.height)continue;
      panel(17,y,321,50,colors.paper);drawMarketIngredient(this.scene,ctx,id,23,y+6,42,38);
      text(73,y+6,row.name,HUB_THEME.typography.body,colors.ink,false,120);text(73,y+24,`${row.unitPrice} xu · Kho: ${row.available}`,HUB_THEME.typography.meta,colors.muted,false,120);text(73,y+37,`${row.total} xu · ${row.remainingCash>=0?'Còn '+row.remainingCash:'Thiếu '+(-row.remainingCash)}`,HUB_THEME.typography.meta,row.remainingCash<0?colors.danger:colors.muted,false,120);
      panel(196,y+10,80,30,colors.quantity,colors.quantity,6);text(209,y+16,'−',18,colors.stepperInk,true);panel(222,y+11,27,28,colors.field,colors.field,3);text(235,y+17,String(row.quantity),14,colors.ink,true);text(262,y+16,'+',18,colors.stepperInk,true);
      ui.button(282,y+8,49,34,'Mua',input.canBuy,HUB_THEME.typography.action);
      if(row.visible){this.hit(`market-quantity-${id}`,222,y+11,27,28,input.canBuy,()=>input.editQuantity(id));this.hit(`market-minus-${id}`,196,y+10,26,30,input.canBuy&&row.quantity>1,()=>input.quantity(id,-1));this.hit(`market-plus-${id}`,249,y+10,27,30,input.canBuy&&row.quantity<100,()=>input.quantity(id,1));this.hit(`market-buy-${id}`,282,y+8,49,34,input.canBuy,()=>input.buy(id));}
    }ctx.restore();
    if(max){panel(342,219,3,318,colors.track,colors.track,1);panel(342,219+offset/max*(318-65),3,65,colors.thumb,colors.thumb,1);}
    text(23,546,input.canBuy?'Mua nhập Kho ngay · Hỏa tốc chỉ dùng trong ca':input.readOnlyReason,10,colors.muted,false,316);text(23,561,input.supplier.familiar?'Nhà cung cấp quen · Giảm 10% mua thường':`Nhà cung cấp: ${input.supplier.purchased}/${input.supplier.threshold} xu · Áp dụng ngày sau`,10,colors.muted,false,316);
    ui.footer(input.footer);
    this.scene.game.canvas.dataset.hubTheme='pizza-cartoon-v1';
    texture.refresh();this.layer.add(this.scene.add.image(0,0,key).setOrigin(0));
    const zone=this.scene.add.zone(viewport.x,viewport.y,viewport.width,viewport.height).setOrigin(0).setInteractive();this.layer.add(zone);
    const wheel=(p:Phaser.Input.Pointer,_objects:unknown,_dx:number,dy:number)=>{if(input.canScroll()&&zone.input?.enabled&&p.x>=viewport.x&&p.x<=viewport.x+viewport.width&&p.y>=viewport.y&&p.y<=viewport.y+viewport.height)input.scroll(Phaser.Math.Clamp(offset+dy,0,max));};this.scene.input.on('wheel',wheel);
    zone.on('pointerdown',(p:Phaser.Input.Pointer)=>{if(!input.canScroll())return;input.drag.active=true;input.drag.startY=p.y;input.drag.offset=offset;});
    const move=(p:Phaser.Input.Pointer)=>{if(input.canScroll()&&zone.input?.enabled&&p.isDown&&input.drag.active)input.scroll(Phaser.Math.Clamp(input.drag.offset+input.drag.startY-p.y,0,max));};
    const up=()=>input.drag.active=false;this.scene.input.on('pointermove',move);this.scene.input.on('pointerup',up);this.scene.input.on('pointerupoutside',up);
    zone.once('destroy',()=>{this.scene.input.off('wheel',wheel);this.scene.input.off('pointermove',move);this.scene.input.off('pointerup',up);this.scene.input.off('pointerupoutside',up);this.scene.textures.remove(key);});
    this.scene.game.canvas.dataset.marketRows=JSON.stringify(rows);this.scene.game.canvas.dataset.marketScroll=JSON.stringify({...viewport,offset,max});this.scene.game.canvas.dataset.marketFilter=input.filter;
  }
}
