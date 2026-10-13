import {DRINK_CATALOG,DRINK_UNLOCK_DAY,drinkDefinition,type DrinkId} from '../config/drinkCatalog';
import {drawDrinkBottle} from './DrinkArt';
import {uiCanvas} from './UiRaster';
import {isNonExpiring} from '../config/ingredientCatalog';
import Phaser from 'phaser';
import {hubListWindow,type HubDrag} from './HubListWindow';
import {STOCK_INGREDIENTS,ingredientName,type StockIngredient} from '../domain/CozyStock';
import {HUB_THEME} from './HubTheme';
import {HUB_HEADER_ART} from './HubHeader';
import {HUB_ART,HubCanvasUI} from './HubCanvasUI';
import {MARKET_INGREDIENT_ART,MARKET_SAUCE_ART,drawMarketIngredient} from './MarketIngredientArt';
import {recipeDefinition} from '../config/recipeCatalog';
import type {StockRecipe} from '../domain/CozyStock';
import {STOCK_REFERENCE_ART,drawManagementDetail,managementCard} from './ManagementTabArt';

export type MarketFilter='all'|'sauce'|'topping'|'base'|'drink';
export type MarketItem=StockIngredient|DrinkId;
const isDrink=(id:MarketItem):id is DrinkId=>DRINK_CATALOG.some(drink=>drink.id===id);
export type MarketDrag=HubDrag;
type Hit=(id:string,x:number,y:number,w:number,h:number,enabled:boolean,action:()=>void)=>void;
export const MARKET_ART=HUB_ART;
export function preloadMarketArt(scene:Phaser.Scene):void{for(const art of [MARKET_ART,MARKET_INGREDIENT_ART,MARKET_SAUCE_ART,HUB_HEADER_ART,STOCK_REFERENCE_ART])if(!scene.textures.exists(art.key))scene.load.image(art.key,`${import.meta.env.BASE_URL}${art.url}`);}
let serial=0;
/** A bounded canvas window keeps native borders and row artwork clipped in WebGL. */
export class ReferenceMarket{
  constructor(private scene:Phaser.Scene,private layer:Phaser.GameObjects.Container,private hit:Hit,private sync:(render:()=>void)=>void){}
  draw(input:{shell?:boolean;access:(id:StockIngredient)=>{unlocked:boolean;recipes:StockRecipe[]};basketTotal:number;reservePercent:number;suggest:()=>void;buyAll:()=>void;unitPrice:(id:MarketItem)=>number;supplier:{familiar:boolean;purchased:number;threshold:number};day:number;cash:number;canBuy:boolean;readOnlyReason:string;canScroll:()=>boolean;filter:MarketFilter;offset:number;drag:MarketDrag;quantities:Partial<Record<MarketItem,number>>;available:(id:MarketItem)=>number;quantity:(id:MarketItem,delta:number)=>void;buy:(id:MarketItem)=>void;editQuantity:(id:MarketItem)=>void;scroll:(offset:number)=>void;setFilter:(filter:MarketFilter)=>void;tab:(id:'summary'|'market'|'stock'|'shop'|'missions')=>void;pause:()=>void;price:()=>void;footer:{id:string;title:string;enabled:boolean;action:()=>void}}):void{
    const key=`market-window-${serial++}`,texture=uiCanvas(this.scene,key,360,640),ctx=texture.context;
    const ui=new HubCanvasUI(this.scene,ctx,this.hit),colors=HUB_THEME.colors;
    const frame=ui.frame.bind(ui),text=ui.text.bind(ui),panel=ui.panel.bind(ui);
    if(input.shell!==false)ui.header({title:'Chợ nguyên liệu',subtitle:`Chuẩn bị ngày ${input.day}`,cash:input.cash,pause:input.pause});
    if(input.shell!==false)ui.navigation('market',input.tab);
    frame({x:8,y:133,width:344,height:40});
    const filters=[['all','Tất cả'],['sauce','Sốt'],['topping','Topping'],['base','Đế & phô mai'],['drink','Đồ uống']] as const;
    filters.forEach(([id,title],i)=>{const x=15+i*66,active=id===input.filter;managementCard(ctx,x,139,64,28,active?'#b74d27':'#f7e5c9',active?'#9c3d1c':'#d8b891',9);text(x+32,148,title,i===3?9:11,active?colors.cream:colors.ink,true,60);this.hit(`market-filter-${id}`,x,136,64,34,true,()=>input.setFilter(id));});
    frame({x:8,y:180,width:344,height:399});drawManagementDetail(this.scene,ctx,'leaf',21,187,18,24);text(43,188,`Mua cho ngày ${input.day}`,16);text(306,194,'Giá món ›',11,colors.muted,true);this.hit('market-price-open',269,184,67,29,input.canBuy,input.price);
    text(24,208,input.filter==='drink'?'Nhập từng loại nước · Kho chai riêng':`${input.basketTotal} xu nguyên liệu · Dự phòng ${input.reservePercent}% · ${input.supplier.familiar?'Ưu đãi 10%':'Giá ngày '+input.day}`,10,colors.muted,false,308);
    const viewport={x:17,y:219,width:321,height:318},rowHeight=53;
    const foodIds=[...STOCK_INGREDIENTS].sort((a,b)=>{const order:StockIngredient[]=['dough','cheese','sauce','mushroom','sausage','chicken'];return (order.includes(a)?order.indexOf(a):6+STOCK_INGREDIENTS.indexOf(a))-(order.includes(b)?order.indexOf(b):6+STOCK_INGREDIENTS.indexOf(b));}).filter(id=>input.filter==='all'||input.filter==='sauce'&&id.startsWith('sauce')||input.filter==='base'&&['dough','cheese'].includes(id)||input.filter==='topping'&&!id.startsWith('sauce')&&!['dough','cheese'].includes(id));
    const ids:MarketItem[]=[...foodIds,...(input.filter==='all'||input.filter==='drink'?DRINK_CATALOG.map(drink=>drink.id as DrinkId):[])];
    const max=Math.max(0,ids.length*rowHeight-viewport.height),offset=Phaser.Math.Clamp(input.offset,0,max);
    const rows=ids.map((id,i)=>{const access=isDrink(id)?{unlocked:input.day>=DRINK_UNLOCK_DAY,recipes:[]}:input.access(id),quantity=access.unlocked?input.quantities[id]??1:0,unitPrice=input.unitPrice(id),total=quantity*unitPrice,y=viewport.y+i*rowHeight-offset;return {id,name:isDrink(id)?drinkDefinition(id).name:ingredientName(id),...access,quantity,unitPrice,total,available:input.available(id),remainingCash:input.cash-total,y,visible:y>=viewport.y&&y+rowHeight<=viewport.y+viewport.height};});
    const listKey=key+'-list';
    if(max)panel(342,viewport.y,3,viewport.height,colors.track,colors.track,1);
    if(input.filter!=='drink'){ui.button(20,543,176,34,'Gợi ý mua hôm nay',input.canBuy,13);this.hit('market-suggest',20,543,176,34,input.canBuy,input.suggest);
    ui.button(204,543,132,34,'Mua tất cả',input.canBuy&&input.basketTotal>0,14);this.hit('market-buy-all',204,543,132,34,input.canBuy&&input.basketTotal>0,input.buyAll);}else text(180,553,'Chọn số chai rồi Mua từng loại',12,colors.muted,true,308);
    ui.footer(input.footer);
    this.scene.game.canvas.dataset.hubTheme='pizza-cartoon-v1';
    texture.refresh();this.layer.add(this.scene.add.image(0,0,key).setOrigin(0).setDisplaySize(360,640));
    this.layer.getAt<Phaser.GameObjects.Image>(this.layer.length-1).once('destroy',()=>this.scene.textures.remove(key));
    hubListWindow(this.scene,this.layer,{key:listKey,viewport,height:rows.length*rowHeight,offset,drag:input.drag,allowed:input.canScroll,
      paint:(listUI,ctx)=>{const panel=listUI.panel.bind(listUI),text=listUI.text.bind(listUI),ui=listUI;
    rows.forEach((row,i)=>{const {id}=row,y=i*rowHeight;
      managementCard(ctx,17,y,321,50);if(isDrink(id))drawDrinkBottle(ctx,id,27,y+2,37,46);else drawMarketIngredient(this.scene,ctx,id,20,y+3,50,44);
      if(!row.unlocked){
        text(73,y+6,row.name,HUB_THEME.typography.body,colors.muted,false,120);
        const required=row.recipes.map(recipe=>recipeDefinition(recipe).name).join(' / ');
        text(73,y+25,isDrink(id)?`Mở từ ngày ${DRINK_UNLOCK_DAY}`:required?'Mua: '+required:'Chưa có công thức phù hợp',10,colors.muted,false,242);
        if((!isDrink(id)&&isNonExpiring(id)))text(73,y+37,'Không hết hạn',9,colors.muted,false,120);
        ctx.save();ctx.strokeStyle=colors.muted;ctx.lineWidth=2;ctx.beginPath();ctx.arc(307,y+17,6,Math.PI,0);ctx.stroke();ctx.fillStyle=colors.muted;ctx.fillRect(298,y+17,18,15);ctx.restore();
        return;
      }
      const permanent=isNonExpiring(id);
      text(73,y+(permanent?4:6),row.name,HUB_THEME.typography.body,colors.ink,false,120);
      drawManagementDetail(this.scene,ctx,'coin',73,y+(permanent?18:23),12);
      text(87,y+(permanent?20:24),String(row.unitPrice),10,colors.ink,false,32);
      drawManagementDetail(this.scene,ctx,'crate',117,y+(permanent?18:23),12);
      text(132,y+(permanent?20:24),`Kho: ${row.available}`,10,colors.muted,false,60);
      if(permanent)text(73,y+30,'Không hết hạn',9,colors.muted,false,120);
      text(73,y+(permanent?40:37),`${row.total} xu · ${row.remainingCash>=0?'Còn '+row.remainingCash:'Thiếu '+(-row.remainingCash)}`,permanent?9:HUB_THEME.typography.meta,row.remainingCash<0?colors.danger:colors.muted,false,120);
      panel(196,y+10,80,30,colors.quantity,colors.quantity,6);text(209,y+16,'−',18,colors.stepperInk,true);panel(222,y+11,27,28,colors.field,colors.field,3);text(235,y+17,String(row.quantity),14,colors.ink,true);text(262,y+16,'+',18,colors.stepperInk,true);
      ui.button(282,y+8,49,34,'Mua',input.canBuy&&row.quantity>0&&(!isDrink(id)||row.remainingCash>=0),HUB_THEME.typography.action);
    });

      },update:offset=>{
        rows.forEach((row,i)=>{row.y=viewport.y+i*rowHeight-offset;row.visible=row.y>=viewport.y&&row.y+rowHeight<=viewport.y+viewport.height;});
        input.scroll(offset);this.sync(()=>{for(const row of rows){const {id,y}=row,enabled=input.canBuy&&row.unlocked;if(!isDrink(id))this.hit(`market-quantity-${id}`,222,y+11,27,28,enabled,()=>input.editQuantity(id));this.hit(`market-minus-${id}`,196,y+10,26,30,enabled&&row.quantity>0,()=>input.quantity(id,-1));this.hit(`market-plus-${id}`,249,y+10,27,30,enabled&&row.quantity<100,()=>input.quantity(id,1));this.hit(`market-buy-${id}`,282,y+8,49,34,enabled&&row.quantity>0&&(!isDrink(id)||row.remainingCash>=0),()=>input.buy(id));}});
        this.scene.game.canvas.dataset.marketRows=JSON.stringify(rows);this.scene.game.canvas.dataset.marketScroll=JSON.stringify({...viewport,offset,max});
      }});
    this.scene.game.canvas.dataset.hubTheme='pizza-cartoon-v1';this.scene.game.canvas.dataset.marketFilter=input.filter;
  }
}
