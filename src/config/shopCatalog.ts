import {SHOP_ITEM_EFFECTS,type ShopItemId} from '../domain/ShopEffects';
type Crop=readonly [number,number,number,number];
const definition=(id:ShopItemId,name:string,group:'decoration'|'amenities',price:number|null,crop:Crop)=>Object.freeze({id,name,group,price,slot:id,blockedReason:null,available:price!==null,effect:SHOP_ITEM_EFFECTS[id],artKey:`reference-shop-${group}`,crop});
export const SHOP_CATALOG=Object.freeze([
 definition('table-plant','Cây trang trí','decoration',500,[39,610,180,233]),
 definition('pizza-painting','Tranh pizza','decoration',800,[494,620,185,225]),
 definition('decorative-light','Đèn trang trí','decoration',1000,[46,879,173,241]),
 definition('shop-sign','Biển hiệu','decoration',2500,[493,900,188,212]),
 definition('large-plant','Chậu cây lớn','decoration',1500,[43,1170,169,239]),
 definition('curtains','Rèm cửa','decoration',1000,[490,1175,199,230]),
 definition('waiting-chair','Ghế chờ','amenities',1200,[43,533,220,139]),
 definition('wifi','Wi-Fi','amenities',2000,[497,538,227,136]),
 definition('fan','Quạt đứng','amenities',1500,[47,835,197,154]),
 definition('air-conditioner','Điều hòa','amenities',5000,[506,851,220,136]),
 definition('speaker','Nhạc trong quán','amenities',3000,[46,1177,190,150]),
 definition('customer-tables','Bàn ghế khách','amenities',4000,[496,1165,228,157]),
]);
export function shopItem(id:unknown){return SHOP_CATALOG.find(item=>item.id===id)??null;}
