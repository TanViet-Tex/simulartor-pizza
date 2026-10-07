import {ingredientName,type StockRecipe} from '../domain/CozyStock';
import type {FinishingSauce} from '../config/ingredientCatalog';
import {recipeDefinition} from '../config/recipeCatalog';
import { timerText } from './PlayHud';
import {drinkDefinition,type DrinkId} from '../config/drinkCatalog';

/** Source describes the order channel, independently of takeaway packaging. */
export type OrderQueueInput = Readonly<{
  id:string;
  name:string;
  recipe:StockRecipe;
  remaining:number|null;
  patience?:number;
  kindLabel?:string;
  finalPrice?:number;
  maxPricePercent?:number;
  source?:'shop'|'app';
  takeaway?:boolean;
  help?:boolean;
  number?:string;
  quantity?:number;
  packed?:number;
  deliveryStatus?:string;
  items?:readonly {recipe:StockRecipe;finishingSauces:readonly FinishingSauce[];price:number}[];
  requestedSauces?:readonly FinishingSauce[];
  itemIndex?:number;
  totalPrice?:number;
  drink?:DrinkId;
  drinkAttached?:boolean;
}>;

export const ORDER_QUEUE_LIMIT=6;
export const ORDER_DETAIL_PROMPT='Chọn đơn để xem chi tiết';
export const ORDER_PANEL=Object.freeze({x:10,y:161,width:340,height:63});

export type OrderQueueSlot=Readonly<{
  id:string;name:string;recipe:OrderQueueInput['recipe'];source:'shop'|'app';
  icon:'avatar'|'phone';number:string;deadline:string;selected:boolean;patienceRatio:number|null;
  x:number;y:number;width:number;height:number;centerX:number;centerY:number;
}>;
export type OrderQueueDetail=Readonly<{
  id:string;number:string;name:string;source:'shop'|'app';sourceLabel:string;
  recipe:OrderQueueInput['recipe'];recipeLabel:string;quantity:number;takeaway:boolean;deadline:string;
  lines:readonly [string,string,string];
}>;

/** An automatic production target is never sufficient to inspect an order. */
export function createOrderQueue(orders:readonly OrderQueueInput[],inspectedId:string|null=null,selectedTargetId?:string):{
  slots:OrderQueueSlot[];detail:OrderQueueDetail|null;inspectedId:string|null;
}{
  const visible=orders.filter(order=>order.remaining===null||order.remaining>0).slice(0,ORDER_QUEUE_LIMIT);
  const inspected=visible.find(order=>order.id===inspectedId&&(selectedTargetId===undefined||order.id===selectedTargetId));
  const slots=visible.map((order,i):OrderQueueSlot=>({
    id:order.id,name:order.name,recipe:order.recipe,source:order.source??'shop',
    icon:order.source==='app'?'phone':'avatar',number:orderNumber(order),
    deadline:order.remaining===null?'Không giới hạn':timerText(order.remaining),selected:order.id===inspected?.id,
    patienceRatio:order.remaining!==null&&order.patience&&order.patience>0?Math.max(0,Math.min(1,order.remaining/order.patience)):null,
    x:12+56*i,y:79,width:56,height:79,centerX:40+56*i,centerY:103,
  }));
  const slot=slots.find(order=>order.selected);
  if(!slot)return {slots,detail:null,inspectedId:null};
  const sourceLabel=slot.source==='app'?'Qua app':'Tại quán';
  const recipeLabel='Pizza '+recipeDefinition(slot.recipe).name.toLocaleLowerCase('vi');
  const quantity=inspected?.quantity??1;
  const takeaway=inspected?.takeaway??true;
  const sauces=(inspected?.requestedSauces??[]).map(id=>ingredientName(id).replace('Sốt ','')).join(' + ');
  const itemIndex=Math.min(quantity,1+(inspected?.itemIndex??0));
  const itemLabel=quantity>1?`${itemIndex}/${quantity} · ${recipeLabel}`:`${recipeLabel} ×1`;
  const request=sauces?` + ${sauces}`:'';
  const total=inspected?.totalPrice??inspected?.finalPrice;
  const service=takeaway?'Mang đi':'Tại quầy',packaging=takeaway?'Cần đóng hộp':'Không cần hộp';
  const detail:OrderQueueDetail={id:slot.id,number:slot.number,name:slot.name,source:slot.source,sourceLabel,
    recipe:slot.recipe,recipeLabel,quantity,takeaway,deadline:slot.deadline,
    lines:[`#${slot.number} · ${slot.name} · ${inspected?.kindLabel?inspected.kindLabel+' · ':''}${sourceLabel}`,`${itemLabel}${request} · ${service}${inspected?.help?' · Tặng miễn phí':total!==undefined?' · '+total+' xu':''}`,
      inspected?.drink?`${drinkDefinition(inspected.drink).name} ×1 · ${inspected.drinkAttached?'Đã thêm':'Chưa thêm'} · ${slot.deadline}`:quantity>1||slot.source==='app'&&inspected?.quantity!==undefined?`Hộp ${inspected?.packed??0}/${quantity}${slot.source==='app'?' · '+(inspected?.deliveryStatus??'Chưa book shipper'):''} · ${slot.deadline}`:slot.deadline==='Không giới hạn'?`Không giới hạn · ${packaging}`:`Còn ${slot.deadline} · ${inspected?.maxPricePercent?(takeaway?'Hộp':'Quầy')+' · Giá ≤'+inspected.maxPricePercent+'%':packaging}`],
  };
  return {slots,detail,inspectedId:slot.id};
}

function orderNumber(order:OrderQueueInput):string{
  const number=order.number??order.id.match(/\d+$/)?.[0]??order.id;
  return /^\d+$/.test(number)?number.padStart(2,'0'):number;
}
