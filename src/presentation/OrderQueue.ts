import type {StockRecipe} from '../domain/CozyStock';
import { timerText } from './PlayHud';

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
  recipe:OrderQueueInput['recipe'];recipeLabel:string;quantity:1;takeaway:boolean;deadline:string;
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
  const recipeLabel=slot.recipe==='mushroom'?'Pizza nấm':slot.recipe==='sausage'?'Pizza xúc xích':'Pizza phô mai';
  const takeaway=inspected?.takeaway??true;
  const service=takeaway?'Mang đi':'Tại quầy',packaging=takeaway?'Cần đóng hộp':'Không cần hộp';
  const detail:OrderQueueDetail={id:slot.id,number:slot.number,name:slot.name,source:slot.source,sourceLabel,
    recipe:slot.recipe,recipeLabel,quantity:1,takeaway,deadline:slot.deadline,
    lines:[`#${slot.number} · ${slot.name} · ${inspected?.kindLabel?inspected.kindLabel+' · ':''}${sourceLabel}`,`${recipeLabel} ×1 · ${service}${inspected?.help?' · Tặng miễn phí':inspected?.finalPrice!==undefined?' · '+inspected.finalPrice+' xu':''}`,
      slot.deadline==='Không giới hạn'?`Không giới hạn · ${packaging}`:`Còn ${slot.deadline} · ${inspected?.maxPricePercent?(takeaway?'Hộp':'Quầy')+' · Giá ≤'+inspected.maxPricePercent+'%':packaging}`],
  };
  return {slots,detail,inspectedId:slot.id};
}

function orderNumber(order:OrderQueueInput):string{
  const number=order.number??order.id.match(/\d+$/)?.[0]??order.id;
  return /^\d+$/.test(number)?number.padStart(2,'0'):number;
}
