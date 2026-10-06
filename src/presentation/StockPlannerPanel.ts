import {uiCanvas} from './UiRaster';
import type Phaser from 'phaser';
import type {StockIngredient,StockRecipe} from '../domain/CozyStock';
import {HubCanvasUI,type HubHit} from './HubCanvasUI';
import {HUB_THEME} from './HubTheme';
import {stockForecast} from './StockPlanning';
import {recipeDefinition} from '../config/recipeCatalog';
let serial=0;
export function drawStockPlanner(scene:Phaser.Scene,layer:Phaser.GameObjects.Container,hit:HubHit,input:{menu:readonly StockRecipe[];menuPage:number;ingredientPage:number;page:(section:"menu"|"ingredients",page:number)=>void;edit:(id:StockRecipe)=>void;portions:Partial<Record<StockRecipe,number>>;available:(id:StockIngredient)=>number;change:(id:StockRecipe,delta:number)=>void;close:()=>void;market:()=>void;canEdit:boolean}):void{
  const key=`stock-plan-${serial++}`,texture=uiCanvas(scene,key,360,640),ui=new HubCanvasUI(scene,texture.context,hit),c=HUB_THEME.colors;
  ui.frame({x:12,y:35,width:336,height:570});ui.text(180,54,'Chuẩn bị theo thực đơn',21,c.ink,true);ui.text(180,87,'Chọn số phần mỗi món · Không tự mua',12,c.muted,true);
  const menuPage=Math.min(input.menuPage,Math.max(0,Math.ceil(input.menu.length/3)-1));
  input.menu.slice(menuPage*3,menuPage*3+3).forEach((id,i)=>{const y=115+i*49;ui.panel(23,y,314,44);ui.text(35,y+14,recipeDefinition(id).name,14,c.ink,false,142);ui.button(183,y+4,42,35,'−',input.canEdit&&(input.portions[id]??0)>0,18);ui.text(252,y+14,String(input.portions[id]??0),16,c.ink,true);ui.button(282,y+4,42,35,'+',input.canEdit&&(input.portions[id]??0)<100,18);hit(`stock-plan-quantity-${id}`,230,y+4,47,35,input.canEdit,()=>input.edit(id));hit(`stock-plan-minus-${id}`,183,y+4,42,35,input.canEdit&&(input.portions[id]??0)>0,()=>input.change(id,-1));hit(`stock-plan-plus-${id}`,282,y+4,42,35,input.canEdit&&(input.portions[id]??0)<100,()=>input.change(id,1));});
  const pager=(section:'menu'|'ingredients',page:number,total:number,y:number)=>{ui.button(24,y,48,34,'<',page>0,18);hit('stock-plan-'+section+'-prev',24,y,48,34,page>0,()=>input.page(section,page-1));ui.text(180,y+9,(page+1)+'/'+total,12,c.ink,true);ui.button(287,y,48,34,'>',page+1<total,18);hit('stock-plan-'+section+'-next',287,y,48,34,page+1<total,()=>input.page(section,page+1));};
  pager('menu',menuPage,Math.max(1,Math.ceil(input.menu.length/3)),264);
  const plan=stockForecast(input.menu,input.portions,input.available),ingredientPage=Math.min(input.ingredientPage,Math.max(0,Math.ceil(plan.length/5)-1));let y=318;
  ui.text(30,y,'Nguyên liệu       Cần / Có / Mua thêm',12,c.muted);y+=28;
  if(!plan.length)ui.text(180,y+25,'Chọn số phần để tính lượng cần mua.',13,c.muted,true);
  for(const row of plan.slice(ingredientPage*5,input.ingredientPage*5+5)){ui.text(30,y,row.name,13,c.ink,false,163);ui.text(266,y,`${row.need} / ${row.available} / ${row.missing}`,13,row.missing?c.danger:c.muted,true);y+=28;}
  pager('ingredients',ingredientPage,Math.max(1,Math.ceil(plan.length/5)),478);
  ui.text(180,530,'Tính theo công thức đang bán trong game.',11,c.muted,true);ui.text(180,515,'Loại hàng hết hạn và lượng đang giữ cho đơn.',11,c.muted,true);
  ui.button(26,544,145,48,'Quay lại',true,15);hit('stock-plan-close',26,544,145,48,true,input.close);ui.button(188,544,145,48,'Đi chợ',true,15);hit('stock-plan-market',188,544,145,48,true,input.market);
  texture.refresh();const image=scene.add.image(0,0,key).setOrigin(0).setDisplaySize(360,640);layer.add(image);image.once('destroy',()=>scene.textures.remove(key));scene.game.canvas.dataset.stockForecast=JSON.stringify(plan);
}
