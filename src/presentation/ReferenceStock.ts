import Phaser from 'phaser';
import type {CozyLot,StockIngredient} from '../domain/CozyStock';
import {HubCanvasUI,type HubHit,type HubTab} from './HubCanvasUI';
import {HUB_THEME} from './HubTheme';
import {drawMarketIngredient} from './MarketIngredientArt';
import type {MarketDrag} from './ReferenceMarket';

export type StockFilter='all'|'low'|'expiry';
export type StockRow={id:StockIngredient;name:string;usable:number;reserved:number;lots:readonly Readonly<CozyLot>[]};
let serial=0;

/** Read-only stock projection. The scene owns filters, criteria and all actions. */
export class ReferenceStock{
  constructor(private scene:Phaser.Scene,private layer:Phaser.GameObjects.Container,private hit:HubHit){}
  draw(input:{day:number;cash:number;rows:readonly StockRow[];filter:StockFilter;low:number|null;expiryDays:number|null;offset:number;drag:MarketDrag;canScroll:()=>boolean;scroll:(n:number)=>void;setFilter:(f:StockFilter)=>void;detail:(id:StockIngredient)=>void;suggestions:()=>void;market:()=>void;tab:(tab:HubTab)=>void;pause:()=>void}):void{
    const key=`stock-window-${serial++}`,texture=this.scene.textures.createCanvas(key,360,640)!,ctx=texture.context;
    const ui=new HubCanvasUI(this.scene,ctx,this.hit),colors=HUB_THEME.colors;
    const text=ui.text.bind(ui),panel=ui.panel.bind(ui);
    const projected=input.rows.map(row=>{
      const validLots=row.lots.filter(lot=>lot.quantity>0&&lot.day<=input.day&&lot.expiry>=input.day);
      const nearestExpiry=validLots.length?Math.min(...validLots.map(lot=>lot.expiry)):null;
      return {...row,validLots,nearestExpiry,low:input.low!==null&&row.usable<=input.low,expiring:input.expiryDays!==null&&nearestExpiry!==null&&nearestExpiry-input.day<=input.expiryDays};
    });
    const filtered=projected.filter(row=>input.filter==='all'||input.filter==='low'&&(input.low===null||row.low)||input.filter==='expiry'&&(input.expiryDays===null||row.expiring));
    ui.background();ui.header({title:'Kho nguyên liệu',subtitle:`Chuẩn bị ngày ${input.day}`,cash:input.cash,pause:input.pause});ui.navigation('stock',input.tab);
    ui.frame({x:8,y:133,width:344,height:46});
    const stats=[{label:'Tổng nguyên liệu',value:`${projected.length} loại`,icon:'stock'},{label:'Sắp hết',value:input.low===null?'Chọn ngưỡng':`${projected.filter(row=>row.low).length} loại`,icon:'warning'},{label:'Sắp hết hạn',value:input.expiryDays===null?'Chọn ngưỡng':`${projected.filter(row=>row.expiring).length} loại`,icon:'clock'}];
    stats.forEach((stat,i)=>{const x=16+i*110;panel(x,140,106,32,colors.highlight);text(x+53,144,stat.value,stat.value==='Chọn ngưỡng'?11:14,i?colors.danger:colors.ink,true);text(x+53,161,stat.label,10,colors.muted,true);});
    ui.frame({x:8,y:185,width:344,height:394});
    const filters=[['all','Tất cả'],['low','Sắp hết'],['expiry','Sắp hết hạn']] as const;
    filters.forEach(([filter,label],i)=>{const x=17+i*108;panel(x,192,104,25,filter===input.filter?colors.active:colors.inset);text(x+52,198,label,12,filter===input.filter?colors.cream:colors.ink,true);this.hit(`stock-filter-${filter}`,x,188,104,31,true,()=>input.setFilter(filter));});
    const viewport={x:17,y:223,width:321,height:312},rowHeight=53;
    const max=Math.max(0,filtered.length*rowHeight-viewport.height),offset=Phaser.Math.Clamp(input.offset,0,max);
    const rows=filtered.map((row,i)=>{const y=viewport.y+i*rowHeight-offset;return {...row,y,visible:y>=viewport.y&&y+rowHeight<=viewport.y+viewport.height};});
    ctx.save();ctx.beginPath();ctx.rect(viewport.x,viewport.y,viewport.width,viewport.height);ctx.clip();
    for(const row of rows){
      const y=row.y;if(y+rowHeight<viewport.y||y>viewport.y+viewport.height)continue;
      panel(17,y,321,50,colors.paper);drawMarketIngredient(this.scene,ctx,row.id,23,y+6,42,38);
      text(73,y+6,row.name,HUB_THEME.typography.body,colors.ink,false,132);
      text(73,y+25,row.usable===0?'Hết hàng':`Còn ${row.usable} phần`,11,row.usable===0?colors.danger:colors.muted,false,132);
      if(row.reserved)text(73,y+38,`Giữ cho đơn: ${row.reserved} phần`,9,colors.muted,false,132);
      panel(209,y+8,106,34,row.usable===0||row.expiring?colors.inset:colors.highlight);
      text(262,y+14,row.nearestExpiry===null?'Chưa có lô dùng được':`Gần nhất: ngày ${row.nearestExpiry}`,9,row.expiring?colors.danger:colors.ink,true,100);
      text(262,y+28,`${row.validLots.length} lô · Xem chi tiết`,9,colors.muted,true,100);text(326,y+17,'›',23,colors.muted,true);
      if(row.visible)this.hit(`stock-item-${row.id}`,17,y,321,50,true,()=>{if(Math.abs(input.drag.startY-this.scene.input.activePointer.y)<8)input.detail(row.id);});
    }
    if(!rows.length){text(177,328,'Không có nguyên liệu phù hợp',14,colors.ink,true);text(177,352,'Chọn bộ lọc khác để xem Kho.',11,colors.muted,true);}
    ctx.restore();
    if(max){panel(342,223,3,312,colors.track,colors.track,1);panel(342,223+offset/max*(312-65),3,65,colors.thumb,colors.thumb,1);}
    panel(17,541,321,24,colors.inset);ui.icon('market',24,546,18);text(49,548,'Gợi ý mua theo menu & số phần',12,colors.ink,false,269);text(324,545,'›',20,colors.muted,true);this.hit('stock-suggestions',17,539,321,31,true,input.suggestions);
    text(180,567,'Ưu tiên lô gần hết hạn · Không dùng lô hết hạn',9,colors.muted,true,322);
    ui.footer({id:'summary-stock-market',title:'Đi chợ mua thêm →',enabled:true,action:input.market});
    texture.refresh();this.layer.add(this.scene.add.image(0,0,key).setOrigin(0));
    const zone=this.scene.add.zone(viewport.x,viewport.y,viewport.width,viewport.height).setOrigin(0).setInteractive();this.layer.add(zone);
    const wheel=(pointer:Phaser.Input.Pointer,_objects:unknown,_dx:number,dy:number)=>{if(input.canScroll()&&zone.input?.enabled&&pointer.x>=viewport.x&&pointer.x<=viewport.x+viewport.width&&pointer.y>=viewport.y&&pointer.y<=viewport.y+viewport.height)input.scroll(Phaser.Math.Clamp(offset+dy,0,max));};
    const move=(pointer:Phaser.Input.Pointer)=>{if(input.canScroll()&&zone.input?.enabled&&pointer.isDown&&input.drag.active)input.scroll(Phaser.Math.Clamp(input.drag.offset+input.drag.startY-pointer.y,0,max));};
    const up=()=>{input.drag.active=false;};
    const down=(pointer:Phaser.Input.Pointer)=>{if(!input.canScroll()||!zone.input?.enabled||pointer.x<viewport.x||pointer.x>viewport.x+viewport.width||pointer.y<viewport.y||pointer.y>viewport.y+viewport.height)return;input.drag.active=true;input.drag.startY=pointer.y;input.drag.offset=offset;};
    this.scene.input.on('pointerdown',down);this.scene.input.on('wheel',wheel);this.scene.input.on('pointermove',move);this.scene.input.on('pointerup',up);this.scene.input.on('pointerupoutside',up);
    zone.once('destroy',()=>{this.scene.input.off('pointerdown',down);this.scene.input.off('wheel',wheel);this.scene.input.off('pointermove',move);this.scene.input.off('pointerup',up);this.scene.input.off('pointerupoutside',up);this.scene.textures.remove(key);});
    this.scene.game.canvas.dataset.hubTheme='pizza-cartoon-v1';this.scene.game.canvas.dataset.stockRows=JSON.stringify(rows);this.scene.game.canvas.dataset.stockScroll=JSON.stringify({...viewport,offset,max});this.scene.game.canvas.dataset.stockFilter=input.filter;
  }
}
