import {uiCanvas} from './UiRaster';
import {isNonExpiring} from '../config/ingredientCatalog';
import Phaser from 'phaser';
import {hubListWindow} from './HubListWindow';
import type {CozyLot,StockIngredient} from '../domain/CozyStock';
import {HubCanvasUI,type HubHit,type HubTab} from './HubCanvasUI';
import {HUB_THEME} from './HubTheme';
import {drawMarketIngredient} from './MarketIngredientArt';
import type {MarketDrag} from './ReferenceMarket';
import {drawManagementDetail,managementCard} from './ManagementTabArt';

export type StockFilter='all'|'low'|'expiry';
export type StockRow={id:StockIngredient;name:string;usable:number;reserved:number;lots:readonly Readonly<CozyLot>[]};
let serial=0;

/** Read-only stock projection. The scene owns filters, criteria and all actions. */
export class ReferenceStock{
  constructor(private scene:Phaser.Scene,private layer:Phaser.GameObjects.Container,private hit:HubHit,private sync:(render:()=>void)=>void){}
  draw(input:{shell?:boolean;day:number;cash:number;rows:readonly StockRow[];filter:StockFilter;low:number|null;expiryDays:number|null;offset:number;drag:MarketDrag;canScroll:()=>boolean;scroll:(n:number)=>void;setFilter:(f:StockFilter)=>void;detail:(id:StockIngredient)=>void;suggestions:()=>void;market:()=>void;tab:(tab:HubTab)=>void;pause:()=>void}):void{
    const key=`stock-window-${serial++}`,texture=uiCanvas(this.scene,key,360,640),ctx=texture.context;
    const ui=new HubCanvasUI(this.scene,ctx,this.hit),colors=HUB_THEME.colors;
    const text=ui.text.bind(ui),panel=ui.panel.bind(ui);
    const projected=input.rows.map(row=>{
      const validLots=row.lots.filter(lot=>lot.quantity>0&&lot.day<=input.day&&lot.expiry>=input.day);
      const nearestExpiry=!isNonExpiring(row.id)&&validLots.length?Math.min(...validLots.map(lot=>lot.expiry)):null;
      return {...row,validLots,nearestExpiry,low:input.low!==null&&row.usable<=input.low,expiring:input.expiryDays!==null&&nearestExpiry!==null&&nearestExpiry-input.day<=input.expiryDays};
    });
    const filtered=projected.filter(row=>input.filter==='all'||input.filter==='low'&&(input.low===null||row.low)||input.filter==='expiry'&&!isNonExpiring(row.id)&&(input.expiryDays===null||row.expiring));
    if(input.shell!==false)ui.header({title:'Kho nguyên liệu',subtitle:`Chuẩn bị ngày ${input.day}`,cash:input.cash,pause:input.pause});if(input.shell!==false)ui.navigation('stock',input.tab);
    ui.frame({x:8,y:133,width:344,height:46});
    const stats=[{label:'Tổng nguyên liệu',value:`${projected.length} loại`,icon:'crate'},{label:'Sắp hết',value:input.low===null?'Chọn ngưỡng':`${projected.filter(row=>row.low).length} loại`,icon:'warning'},{label:'Sắp hết hạn',value:input.expiryDays===null?'Chọn ngưỡng':`${projected.filter(row=>row.expiring).length} loại`,icon:'clock'}] as const;
    stats.forEach((stat,i)=>{const x=16+i*110;managementCard(ctx,x,140,106,32);drawManagementDetail(this.scene,ctx,stat.icon,x+4,144,23,24);text(x+65,144,stat.value,stat.value==='Chọn ngưỡng'?10:13,i?colors.danger:colors.ink,true,74);text(x+65,160,stat.label,9,colors.muted,true,76);});
    ui.frame({x:8,y:185,width:344,height:394});
    const filters=[['all','Tất cả'],['low','Sắp hết'],['expiry','Sắp hết hạn']] as const;
    filters.forEach(([filter,label],i)=>{const x=17+i*108,active=filter===input.filter;managementCard(ctx,x,192,104,25,active?'#b74d27':'#f7e5c9',active?'#9c3d1c':'#d8b891',8);if(i)drawManagementDetail(this.scene,ctx,i===1?'warning':'clock',x+6,196,17);text(x+(i?62:52),198,label,11,active?colors.cream:colors.ink,true,i?78:96);this.hit(`stock-filter-${filter}`,x,188,104,31,true,()=>input.setFilter(filter));});
    const viewport={x:17,y:223,width:321,height:312},rowHeight=53;
    const max=Math.max(0,filtered.length*rowHeight-viewport.height),offset=Phaser.Math.Clamp(input.offset,0,max);
    const rows=filtered.map((row,i)=>{const y=viewport.y+i*rowHeight-offset;return {...row,y,visible:y>=viewport.y&&y+rowHeight<=viewport.y+viewport.height};});
    const listKey=key+'-list';
    if(max)panel(342,viewport.y,3,viewport.height,colors.track,colors.track,1);
    managementCard(ctx,17,567,321,11,'#e8eed4','#c2ce9e',4);drawManagementDetail(this.scene,ctx,'leaf',26,566,12);text(186,568,'Ưu tiên lô gần hết hạn · Không dùng lô hết hạn',9,'#355b2d',true,293);
    ui.footer({id:'summary-stock-market',title:'Đi chợ mua thêm →',enabled:true,action:input.market});
    texture.refresh();this.layer.add(this.scene.add.image(0,0,key).setOrigin(0).setDisplaySize(360,640));
    this.layer.getAt<Phaser.GameObjects.Image>(this.layer.length-1).once('destroy',()=>this.scene.textures.remove(key));
    hubListWindow(this.scene,this.layer,{key:listKey,viewport,height:rows.length*rowHeight,offset,drag:input.drag,allowed:input.canScroll,
      paint:(listUI,ctx)=>{const text=listUI.text.bind(listUI);
    rows.forEach((row,i)=>{
      const y=i*rowHeight;
      managementCard(ctx,17,y,321,50);drawMarketIngredient(this.scene,ctx,row.id,20,y+3,50,44);
      text(73,y+6,row.name,HUB_THEME.typography.body,colors.ink,false,132);
      drawManagementDetail(this.scene,ctx,'crate',73,y+24,13);
      text(90,y+25,row.usable===0?'Hết hàng':`Còn ${row.usable} phần`,11,row.usable===0?colors.danger:colors.muted,false,115);
      if(row.reserved)text(73,y+38,`Giữ cho đơn: ${row.reserved} phần`,9,colors.muted,false,132);
      const empty=row.usable===0,days=row.nearestExpiry===null?null:row.nearestExpiry-input.day;
      const urgent=row.expiring||days!==null&&days<=1;
      const fill=empty?'#ffddd0':urgent?'#ffe6bc':'#e8edce',edge=empty?'#efb1a0':urgent?'#efc894':'#c4d2a0',ink=empty?'#ab3826':urgent?'#914517':'#355b2d';
      managementCard(ctx,209,y+8,106,34,fill,edge,10);
      drawManagementDetail(this.scene,ctx,empty?'warning':urgent?'clock':'leaf',214,y+12,15,17);
      const status=empty?'Cần mua thêm':isNonExpiring(row.id)?'Không hết hạn':days===null?'Chưa có lô':days===0?'Hết sau hôm nay':urgent?`Hết sau ${days} ngày`:`Còn ${days} ngày`;
      text(272,y+13,status,9,ink,true,81);
      text(262,y+28,`${row.validLots.length} lô · Xem chi tiết`,9,colors.muted,true,100);text(326,y+17,'›',23,colors.muted,true);
    });
    if(!rows.length){text(177,105,'Không có nguyên liệu phù hợp',14,colors.ink,true);text(177,129,'Chọn bộ lọc khác để xem Kho.',11,colors.muted,true);}

      },update:offset=>{
        rows.forEach((row,i)=>{row.y=viewport.y+i*rowHeight-offset;row.visible=row.y>=viewport.y&&row.y+rowHeight<=viewport.y+viewport.height;});
        input.scroll(offset);this.sync(()=>{for(const row of rows)this.hit(`stock-item-${row.id}`,17,row.y,321,50,true,()=>input.detail(row.id));});
        this.scene.game.canvas.dataset.stockRows=JSON.stringify(rows);this.scene.game.canvas.dataset.stockScroll=JSON.stringify({...viewport,offset,max});
      }});
    this.scene.game.canvas.dataset.hubTheme='pizza-cartoon-v1';this.scene.game.canvas.dataset.stockFilter=input.filter;
  }
}
